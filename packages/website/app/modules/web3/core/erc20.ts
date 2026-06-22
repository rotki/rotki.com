/**
 * The single ERC20 ABI for the app, in viem's JSON-ABI format. Replaces the
 * inline `transfer`-only abi previously embedded in the checkout
 * `use-crypto-payment` composable and the ethers human-readable `ERC20_ABI` in
 * the sponsorship constants.
 *
 * Pure data (`as const` for viem type inference) — no runtime import, safe to
 * reference from anywhere without pulling viem into the bundle.
 */
export const ERC20_ABI = [
  { type: 'function', name: 'decimals', stateMutability: 'view', inputs: [], outputs: [{ type: 'uint8' }] },
  { type: 'function', name: 'balanceOf', stateMutability: 'view', inputs: [{ name: 'account', type: 'address' }], outputs: [{ type: 'uint256' }] },
  { type: 'function', name: 'allowance', stateMutability: 'view', inputs: [{ name: 'owner', type: 'address' }, { name: 'spender', type: 'address' }], outputs: [{ type: 'uint256' }] },
  { type: 'function', name: 'approve', stateMutability: 'nonpayable', inputs: [{ name: 'spender', type: 'address' }, { name: 'amount', type: 'uint256' }], outputs: [{ type: 'bool' }] },
  { type: 'function', name: 'transfer', stateMutability: 'nonpayable', inputs: [{ name: 'to', type: 'address' }, { name: 'amount', type: 'uint256' }], outputs: [{ type: 'bool' }] },
] as const;

/** Zero-address sentinel used by some backends to denote the chain's native token. */
export const NATIVE_TOKEN_ADDRESS = '0x0000000000000000000000000000000000000000';

/** True when an address is missing or the native-token sentinel. */
export function isNativeToken(tokenAddress: string | null | undefined): boolean {
  return !tokenAddress || tokenAddress.toLowerCase() === NATIVE_TOKEN_ADDRESS;
}
