import type { Config } from '@wagmi/core';

/**
 * Strips the leading `config: Config` parameter from a `core/actions` function,
 * yielding the call signature the bound client exposes. Param and return types
 * (including the receipt type) flow straight from the source — the client never
 * re-declares them.
 */
export type Bound<F> = F extends (config: Config, ...rest: infer A) => infer R
  ? (...rest: A) => R
  : never;

type CoreActions = typeof import('~/modules/web3/core/actions');

type CoreOp =
  | 'approveErc20'
  | 'estimateErc20TransferFee'
  | 'estimateNativeTransferFee'
  | 'readErc20Allowance'
  | 'readErc20Balance'
  | 'readNativeBalance'
  | 'sendErc20Transfer'
  | 'sendNativeTransfer'
  | 'waitForReceipt';

/** Transaction & read ops from `core/actions`, pre-bound to the wagmi `Config`. */
export type Web3Client = {
  [K in CoreOp]: Bound<CoreActions[K]>;
};

/**
 * Lazily load `core/actions` and bind every op to the singleton `Config`.
 *
 * The single boundary over the web3 core for domain composables: they call
 * `getWeb3Client(wallet.ensureInitialized)` and use the returned methods
 * without ever importing `core/actions` or threading `Config` themselves.
 * `use-wallet` keeps owning the `Config` singleton — `ensureInitialized` is
 * passed in, not duplicated here.
 */
export async function getWeb3Client(ensureInitialized: () => Promise<Config>): Promise<Web3Client> {
  const [config, actions] = await Promise.all([
    ensureInitialized(),
    import('~/modules/web3/core/actions'),
  ]);
  return {
    approveErc20: async (...args) => actions.approveErc20(config, ...args),
    estimateErc20TransferFee: async (...args) => actions.estimateErc20TransferFee(config, ...args),
    estimateNativeTransferFee: async (...args) => actions.estimateNativeTransferFee(config, ...args),
    readErc20Allowance: async (...args) => actions.readErc20Allowance(config, ...args),
    readErc20Balance: async (...args) => actions.readErc20Balance(config, ...args),
    readNativeBalance: async (...args) => actions.readNativeBalance(config, ...args),
    sendErc20Transfer: async (...args) => actions.sendErc20Transfer(config, ...args),
    sendNativeTransfer: async (...args) => actions.sendNativeTransfer(config, ...args),
    waitForReceipt: async (...args) => actions.waitForReceipt(config, ...args),
  };
}
