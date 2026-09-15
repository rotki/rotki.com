import type { Page, Route } from '@playwright/test';
import type { PaymentAsset } from './backend-data';
import { decodeFunctionData, encodeFunctionResult, erc20Abi, type Hex, isHex, multicall3Abi, numberToHex, parseAbi, parseEther, parseGwei, parseUnits } from 'viem';
import { ALL_CHAINS } from '../../../app/modules/web3/core/chains';

/** Token balance of the wallet, in whole units (e.g. `'100'` USDC). */
export interface TokenBalance {
  balance: string;
  decimals: number;
}

/** What the fake chain nodes report. Change it at any time with `update`. */
export interface ChainScenario {
  /** Native balance of the wallet per chain id, in ether units. */
  nativeBalances: Record<number, string>;
  /** Token balances of the wallet keyed by lower-case token contract address. */
  tokenBalances: Record<string, TokenBalance>;
  gasPriceGwei: string;
  /** `revert` makes `eth_estimateGas` fail, so the app falls back to its default gas limits. */
  estimateGas: 'ok' | 'revert';
  /** OP-stack L1 data fee reported by the gas price oracle, in wei. */
  l1FeeWei: string;
}

/** A JSON-RPC request the page sent to a chain node. */
export interface RpcRequest {
  chainId: number;
  method: string;
  params: unknown[];
}

/** Test-side handle on the fake chain nodes. */
export interface FakeChain {
  readonly requests: readonly RpcRequest[];
  update: (patch: Partial<ChainScenario>) => void;
}

interface JsonRpcRequest {
  id: number;
  jsonrpc: '2.0';
  method: string;
  params?: unknown[];
}

interface CallResult {
  success: boolean;
  returnData: Hex;
}

class RpcError extends Error {
  readonly code: number;

  constructor(message: string, options: ErrorOptions & { code: number }) {
    super(message, options);
    this.name = 'RpcError';
    this.code = options.code;
  }
}

const MULTICALL3_ADDRESS = '0xca11bde05977b3631167028862be2a173976ca11';

const GAS_PRICE_ORACLE_ADDRESS = '0x420000000000000000000000000000000000000f';

const multicallBalanceAbi = parseAbi(['function getEthBalance(address addr) view returns (uint256 balance)']);

const gasPriceOracleAbi = parseAbi(['function getL1Fee(bytes data) view returns (uint256 fee)']);

const REVERTED: CallResult = { returnData: '0x', success: false };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isJsonRpcRequest(value: unknown): value is JsonRpcRequest {
  return isRecord(value) && typeof value.method === 'string' && typeof value.id === 'number';
}

/** Reads the `{ to, data }` object of an `eth_call` or `eth_estimateGas` request. */
function readCallParams(params: unknown[]): { to: string; data?: Hex } {
  const [call] = params;
  if (!isRecord(call) || typeof call.to !== 'string')
    throw new RpcError('Invalid call parameters', { code: -32602 });
  return { data: typeof call.data === 'string' && isHex(call.data) ? call.data : undefined, to: call.to };
}

/** A funded wallet: 1 ETH on every chain and cheap gas. */
export function defaultChainScenario(): ChainScenario {
  return {
    estimateGas: 'ok',
    gasPriceGwei: '1',
    l1FeeWei: '1000000000000',
    nativeBalances: Object.fromEntries(ALL_CHAINS.map(chain => [chain.id, '1'])),
    tokenBalances: {},
  };
}

/**
 * Builds the `tokenBalances` entry for a token asset, keyed the way the fake nodes look it up.
 *
 * @remarks
 * Native assets have no contract to hold a balance, so they yield an empty record; their funds
 * come from `nativeBalances` instead.
 */
export function tokenBalanceFor(asset: PaymentAsset, balance: string): Record<string, TokenBalance> {
  if (!asset.address)
    return {};
  return { [asset.address.toLowerCase()]: { balance, decimals: asset.decimals } };
}

function chainIdsByHost(): Map<string, number> {
  const hosts = new Map<string, number>();
  for (const chain of ALL_CHAINS) {
    for (const url of chain.rpcUrls ?? [])
      hosts.set(new URL(url).host, chain.id);
  }
  return hosts;
}

function readNativeBalance(scenario: ChainScenario, chainId: number): bigint {
  return parseEther(scenario.nativeBalances[chainId] ?? '0');
}

function readToken(token: TokenBalance, data: Hex): CallResult {
  const { functionName } = decodeFunctionData({ abi: erc20Abi, data });
  if (functionName === 'balanceOf')
    return { returnData: encodeFunctionResult({ abi: erc20Abi, functionName, result: parseUnits(token.balance, token.decimals) }), success: true };
  if (functionName === 'decimals')
    return { returnData: encodeFunctionResult({ abi: erc20Abi, functionName, result: token.decimals }), success: true };
  if (functionName === 'allowance')
    return { returnData: encodeFunctionResult({ abi: erc20Abi, functionName, result: 0n }), success: true };
  return REVERTED;
}

/** Answers one contract read; unknown contracts (ENS resolver included) revert, which the app tolerates. */
function readContract(scenario: ChainScenario, chainId: number, to: string, data: Hex): CallResult {
  const target = to.toLowerCase();
  if (target === MULTICALL3_ADDRESS && data.startsWith('0x4d2301cc'))
    return { returnData: encodeFunctionResult({ abi: multicallBalanceAbi, functionName: 'getEthBalance', result: readNativeBalance(scenario, chainId) }), success: true };
  if (target === GAS_PRICE_ORACLE_ADDRESS)
    return { returnData: encodeFunctionResult({ abi: gasPriceOracleAbi, functionName: 'getL1Fee', result: BigInt(scenario.l1FeeWei) }), success: true };
  const token = scenario.tokenBalances[target];
  return token ? readToken(token, data) : REVERTED;
}

function ethCall(scenario: ChainScenario, chainId: number, params: unknown[]): Hex {
  const { data = '0x', to } = readCallParams(params);
  if (to.toLowerCase() === MULTICALL3_ADDRESS && data.startsWith('0x82ad56cb')) {
    const decoded = decodeFunctionData({ abi: multicall3Abi, data });
    if (decoded.functionName !== 'aggregate3')
      throw new RpcError('execution reverted', { code: 3 });
    const results = decoded.args[0].map(call => readContract(scenario, chainId, call.target, call.callData));
    return encodeFunctionResult({ abi: multicall3Abi, functionName: 'aggregate3', result: results });
  }
  const result = readContract(scenario, chainId, to, data);
  if (!result.success)
    throw new RpcError('execution reverted', { code: 3 });
  return result.returnData;
}

function estimateGas(scenario: ChainScenario, params: unknown[]): Hex {
  if (scenario.estimateGas === 'revert')
    throw new RpcError('execution reverted', { code: 3 });
  const { data } = readCallParams(params);
  return numberToHex(data ? 65_000 : 21_000);
}

function answer(scenario: ChainScenario, chainId: number, request: JsonRpcRequest): unknown {
  const params = request.params ?? [];
  const methods: Record<string, () => unknown> = {
    eth_blockNumber: () => '0x1',
    eth_call: () => ethCall(scenario, chainId, params),
    eth_chainId: () => numberToHex(chainId),
    eth_estimateGas: () => estimateGas(scenario, params),
    eth_gasPrice: () => numberToHex(parseGwei(scenario.gasPriceGwei)),
    eth_getBalance: () => numberToHex(readNativeBalance(scenario, chainId)),
    eth_maxPriorityFeePerGas: () => '0x0',
  };
  const handler = methods[request.method];
  if (!handler)
    throw new RpcError(`Method not found: ${request.method}`, { code: -32601 });
  return handler();
}

function respond(scenario: ChainScenario, chainId: number, request: JsonRpcRequest): unknown {
  try {
    return { id: request.id, jsonrpc: '2.0', result: answer(scenario, chainId, request) };
  }
  catch (error) {
    const { code, message } = error instanceof RpcError ? error : new RpcError(String(error), { code: -32603 });
    return { error: { code, message }, id: request.id, jsonrpc: '2.0' };
  }
}

/**
 * Fakes the public JSON-RPC nodes of every chain the app knows, so wallet balances, gas estimates and
 * OP-stack L1 fees come from the test instead of mainnet.
 *
 * @remarks
 * Reads arrive batched through Multicall3 `aggregate3`; each inner call is answered on its own, so
 * native balance, token balance and the L1 fee can be mixed in one batch.
 */
export async function installFakeChain(page: Page, overrides: Partial<ChainScenario> = {}): Promise<FakeChain> {
  const scenario: ChainScenario = { ...defaultChainScenario(), ...overrides };
  const requests: RpcRequest[] = [];
  const hosts = chainIdsByHost();

  async function handle(route: Route): Promise<void> {
    const chainId = hosts.get(new URL(route.request().url()).host) ?? 0;
    const body: unknown = route.request().postDataJSON();
    const batch = (Array.isArray(body) ? body : [body]).filter(isJsonRpcRequest);
    for (const request of batch)
      requests.push({ chainId, method: request.method, params: request.params ?? [] });
    const responses = batch.map(request => respond(scenario, chainId, request));
    await route.fulfill({ json: Array.isArray(body) ? responses : responses[0], status: 200 });
  }

  await page.route(url => hosts.has(url.host), handle);

  return {
    requests,
    update: (patch) => {
      Object.assign(scenario, patch);
    },
  };
}
