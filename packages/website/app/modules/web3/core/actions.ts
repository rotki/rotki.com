import { type Config, type Connector, estimateGas, getAccount, getBalance, getClient, getGasPrice, readContract, sendTransaction, connect as wagmiConnect, disconnect as wagmiDisconnect, signMessage as wagmiSignMessage, switchChain as wagmiSwitchChain, waitForTransactionReceipt, writeContract } from '@wagmi/core';
import { ok, type Result } from 'plainfp/result';
import { fromPromise, timeout as withTimeout } from 'plainfp/result-async';
import { type Address, encodeFunctionData, formatUnits, getAddress, type Hash, type Hex, maxUint256, parseUnits } from 'viem';
import { isOpStackChain } from './chains';
import { ERC20_ABI } from './erc20';
import { fromCause, timeout as timeoutError, type Web3Error } from './errors';

/** Default bound for awaiting a transaction receipt (matches the old sponsorship flow). */
const RECEIPT_TIMEOUT_MS = 5 * 60 * 1000;

/**
 * Explicit bound for read-only chain calls (balances, gas estimates). These feed
 * non-blocking UI hints, so a slow/hung RPC should resolve to a typed timeout
 * rather than leave the call pending behind the viem transport default.
 */
const READ_TIMEOUT_MS = 15_000;

/**
 * Gas-limit fallbacks used only when on-chain `estimateGas` reverts — which it
 * does precisely when the wallet already cannot cover the call (the case the
 * funds warning exists to catch). A simple native/ERC-20 transfer is otherwise a
 * fixed cost, so these are safe approximations for the fee buffer.
 */
const GAS_LIMIT_FALLBACK = { erc20: 65_000n, native: 21_000n } as const;

/** Native coins on every supported chain (ETH, xDAI) use 18 decimals. */
const NATIVE_DECIMALS = 18;

function isReceiptTimeout(cause: unknown): boolean {
  return cause instanceof Error && cause.name === 'WaitForTransactionReceiptTimeoutError';
}

/**
 * Shared, framework-agnostic web3 operations. Every function takes the wagmi
 * `Config` as its first argument (dependency injection — no hidden singleton)
 * and returns a `Result<T, Web3Error>` so callers branch on a typed outcome
 * instead of `try/catch`. This is the single implementation reused by checkout
 * crypto-payment now and sponsorship minting in pass 2.
 *
 * Heavy imports (`@wagmi/core`, `viem`) are static here on purpose: this module
 * is only ever reached through the dynamic-import boundary in `use-wallet`, so
 * it code-splits into the async web3 chunk and never enters the initial bundle.
 */
// Addresses arrive as plain strings from the API/store and are normalized with
// viem's `getAddress` here (which also validates), so callers stay cast-free.
export interface NativeTransferParams {
  to: string;
  amount: string;
  decimals: number;
  chainId: number;
}

export interface Erc20TransferParams {
  token: string;
  to: string;
  amount: string;
  decimals: number;
  chainId: number;
}

export interface AllowanceParams {
  token: string;
  owner: string;
  spender: string;
  decimals: number;
  chainId: number;
}

export interface ApproveParams {
  token: string;
  spender: string;
  /** Human-readable amount; ignored when `unlimited` is true. */
  amount: string;
  decimals: number;
  /** Approve the max uint256 allowance instead of an exact amount. */
  unlimited?: boolean;
  chainId: number;
}

export async function connectWallet(config: Config, connector: Connector, chainId?: number): Promise<Result<{ accounts: readonly Address[]; chainId: number }, Web3Error>> {
  // `reconnect()` may have already restored this connector (e.g. while the picker
  // was open); re-connecting it throws ConnectorAlreadyConnectedError, so treat
  // an already-connected match as success and return the live account.
  const account = getAccount(config);
  if (account.status === 'connected' && account.connector?.uid === connector.uid)
    return ok({ accounts: account.addresses, chainId: account.chainId });

  return fromPromise(
    wagmiConnect(config, { chainId, connector }),
    cause => fromCause(cause, 'ConnectFailed'),
  );
}

export async function disconnectWallet(config: Config, connector?: Connector): Promise<Result<void, Web3Error>> {
  return fromPromise(
    wagmiDisconnect(config, { connector }),
    cause => fromCause(cause, 'ConnectFailed'),
  );
}

export async function switchChain(config: Config, chainId: number): Promise<Result<void, Web3Error>> {
  return fromPromise(
    wagmiSwitchChain(config, { chainId }).then(() => undefined),
    cause => fromCause(cause, 'SwitchChainFailed'),
  );
}

export async function signMessage(config: Config, message: string): Promise<Result<string, Web3Error>> {
  return fromPromise(
    wagmiSignMessage(config, { message }),
    cause => fromCause(cause, 'SignFailed'),
  );
}

export async function sendNativeTransfer(config: Config, params: NativeTransferParams): Promise<Result<Hash, Web3Error>> {
  return fromPromise(
    sendTransaction(config, {
      chainId: params.chainId,
      to: getAddress(params.to),
      value: parseUnits(params.amount, params.decimals),
    }),
    cause => fromCause(cause, 'TxFailed'),
  );
}

export async function sendErc20Transfer(config: Config, params: Erc20TransferParams): Promise<Result<Hash, Web3Error>> {
  return fromPromise(
    writeContract(config, {
      abi: ERC20_ABI,
      address: getAddress(params.token),
      args: [getAddress(params.to), parseUnits(params.amount, params.decimals)],
      chainId: params.chainId,
      functionName: 'transfer',
    }),
    cause => fromCause(cause, 'TxFailed'),
  );
}

/** Returns the current allowance as a human-readable decimal string. */
export async function readErc20Allowance(config: Config, params: AllowanceParams): Promise<Result<string, Web3Error>> {
  return fromPromise(
    readContract(config, {
      abi: ERC20_ABI,
      address: getAddress(params.token),
      args: [getAddress(params.owner), getAddress(params.spender)],
      chainId: params.chainId,
      functionName: 'allowance',
    }).then(allowance => formatUnits(allowance, params.decimals)),
    cause => fromCause(cause, 'TxFailed'),
  );
}

export interface NativeBalanceParams {
  address: string;
  chainId: number;
}

export interface Erc20BalanceParams {
  token: string;
  address: string;
  decimals: number;
  chainId: number;
}

/** The connected wallet's native-coin balance as a human-readable decimal string. */
export async function readNativeBalance(config: Config, params: NativeBalanceParams): Promise<Result<string, Web3Error>> {
  return withTimeout(
    fromPromise(
      getBalance(config, { address: getAddress(params.address), chainId: params.chainId }).then(balance => formatUnits(balance.value, balance.decimals)),
      cause => fromCause(cause, 'TxFailed'),
    ),
    READ_TIMEOUT_MS,
    timeoutError,
  );
}

/** An ERC-20 token balance for the connected wallet as a human-readable decimal string. */
export async function readErc20Balance(config: Config, params: Erc20BalanceParams): Promise<Result<string, Web3Error>> {
  return withTimeout(
    fromPromise(
      readContract(config, {
        abi: ERC20_ABI,
        address: getAddress(params.token),
        args: [getAddress(params.address)],
        chainId: params.chainId,
        functionName: 'balanceOf',
      }).then(balance => formatUnits(balance, params.decimals)),
      cause => fromCause(cause, 'TxFailed'),
    ),
    READ_TIMEOUT_MS,
    timeoutError,
  );
}

export interface FeeEstimateParams {
  chainId: number;
  /** The connected wallet — the estimate is from its balance/allowance perspective. */
  account: string;
  to: string;
  value?: bigint;
  data?: Hex;
  /** Gas limit to assume when on-chain estimation reverts (e.g. funds already short). */
  fallbackGas: bigint;
}

/**
 * Estimated network fee (gas) for a transaction, as a human-readable native-coin
 * string. The gas *price* is read live (`getGasPrice`) so the figure tracks
 * current network conditions; the gas *limit* comes from a real `estimateGas` on
 * the actual call, falling back to `fallbackGas` only when estimation reverts.
 * Used for the soft "may not have enough for gas" warning, never as a hard block.
 *
 * Exported so contract flows (e.g. sponsorship minting) reuse one fee path:
 * they encode their own call `data`/`value` and supply a `fallbackGas`.
 */
export async function estimateFee(config: Config, params: FeeEstimateParams): Promise<Result<string, Web3Error>> {
  return withTimeout(
    fromPromise(
      (async (): Promise<string> => {
        const account = getAddress(params.account);
        const to = getAddress(params.to);
        const call = {
          ...(params.value !== undefined ? { value: params.value } : {}),
          ...(params.data !== undefined ? { data: params.data } : {}),
        };

        const gasPrice = await getGasPrice(config, { chainId: params.chainId });
        let gas: bigint;
        try {
          gas = await estimateGas(config, { account, chainId: params.chainId, to, ...call });
        }
        catch {
          // estimateGas reverts when the wallet can't cover the call — exactly the
          // low-funds case we want to warn about, so assume a typical limit instead.
          gas = params.fallbackGas;
        }

        let fee = gas * gasPrice; // L2 execution fee
        // OP-stack rollups add an L1 data fee that is frequently the dominant cost;
        // omitting it badly underestimates the real fee. Best-effort: keep the
        // L2-only figure if the oracle call fails rather than blanking the estimate.
        if (isOpStackChain(params.chainId)) {
          try {
            const { publicActionsL2 } = await import('viem/op-stack');
            const client = getClient(config, { chainId: params.chainId })?.extend(publicActionsL2());
            if (client)
              fee += await client.estimateL1Fee({ account, to, ...call });
          }
          catch {
            // L1 oracle unavailable — fall back to the L2-only estimate.
          }
        }
        return formatUnits(fee, NATIVE_DECIMALS);
      })(),
      cause => fromCause(cause, 'TxFailed'),
    ),
    READ_TIMEOUT_MS,
    timeoutError,
  );
}

export interface NativeFeeParams {
  chainId: number;
  account: string;
  to: string;
  amount: string;
  decimals: number;
}

export interface Erc20FeeParams {
  chainId: number;
  account: string;
  to: string;
  token: string;
  amount: string;
  decimals: number;
}

/** Estimated fee for sending the chain's native coin. */
export async function estimateNativeTransferFee(config: Config, params: NativeFeeParams): Promise<Result<string, Web3Error>> {
  return estimateFee(config, {
    account: params.account,
    chainId: params.chainId,
    fallbackGas: GAS_LIMIT_FALLBACK.native,
    to: params.to,
    value: parseUnits(params.amount, params.decimals),
  });
}

/** Estimated fee for an ERC-20 `transfer`. */
export async function estimateErc20TransferFee(config: Config, params: Erc20FeeParams): Promise<Result<string, Web3Error>> {
  return estimateFee(config, {
    account: params.account,
    chainId: params.chainId,
    data: encodeFunctionData({ abi: ERC20_ABI, args: [getAddress(params.to), parseUnits(params.amount, params.decimals)], functionName: 'transfer' }),
    fallbackGas: GAS_LIMIT_FALLBACK.erc20,
    to: params.token,
  });
}

export async function approveErc20(config: Config, params: ApproveParams): Promise<Result<Hash, Web3Error>> {
  const amount = params.unlimited ? maxUint256 : parseUnits(params.amount, params.decimals);
  return fromPromise(
    writeContract(config, {
      abi: ERC20_ABI,
      address: getAddress(params.token),
      args: [getAddress(params.spender), amount],
      chainId: params.chainId,
      functionName: 'approve',
    }),
    cause => fromCause(cause, 'TxFailed'),
  );
}

export async function waitForReceipt(config: Config, hash: Hash, chainId: number, timeoutMs: number = RECEIPT_TIMEOUT_MS): Promise<Result<Awaited<ReturnType<typeof waitForTransactionReceipt>>, Web3Error>> {
  // viem follows replacement (sped-up/cancelled) txs automatically and rejects
  // with a timeout error once `timeout` elapses.
  return fromPromise(
    waitForTransactionReceipt(config, { chainId, hash, timeout: timeoutMs }),
    cause => isReceiptTimeout(cause) ? timeoutError() : fromCause(cause, 'TxFailed'),
  );
}
