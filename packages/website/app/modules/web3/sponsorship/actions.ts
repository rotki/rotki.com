import type { Result } from 'plainfp/result';
import { type Config, readContract, writeContract } from '@wagmi/core';
import { fromPromise } from 'plainfp/result-async';
import { type Address, decodeEventLog, encodeFunctionData, getAddress, type Hash, type Log, parseUnits } from 'viem';
import { estimateFee } from '~/modules/web3/core/actions';
import { fromCause, type Web3Error } from '~/modules/web3/core/errors';
import { SPONSORSHIP_TIERS, type TierKey, type TierSupply } from '~/modules/web3/sponsorship/types';
import { ROTKI_SPONSORSHIP_ABI } from './abi';

/** Gas-limit fallback for a `mint` call when on-chain estimation reverts (low funds / not approved). */
const MINT_GAS_FALLBACK = 250_000n;

/**
 * Rotki Sponsorship NFT contract operations, viem-based and `Config`-injected,
 * mirroring the shared `core/actions` pattern. Replaces the ethers
 * `ContractFactory` / `contract-helpers` / `rpc-checker` stack (RPC fallback now
 * comes from the viem `fallback` transport configured in `core/config`).
 *
 * Reached only through the `use-wallet` dynamic-import boundary, so `@wagmi/core`
 * and `viem` stay out of the initial bundle.
 */
export interface ContractRef {
  contractAddress: string;
  chainId: number;
}

export interface MintNftParams extends ContractRef {
  tierId: number;
  paymentToken: string;
  /** Human-readable price; only used to compute the native (ETH) payment value. */
  price: string;
  decimals: number;
  isNative: boolean;
}

export async function readCurrentReleaseId(config: Config, ref: ContractRef): Promise<Result<bigint, Web3Error>> {
  return fromPromise(
    readContract(config, {
      abi: ROTKI_SPONSORSHIP_ABI,
      address: getAddress(ref.contractAddress),
      chainId: ref.chainId,
      functionName: 'currentReleaseId',
    }),
    cause => fromCause(cause),
  );
}

export async function readTierSupplies(config: Config, ref: ContractRef, releaseId: bigint): Promise<Result<Partial<Record<TierKey, TierSupply>>, Web3Error>> {
  return fromPromise(
    (async (): Promise<Partial<Record<TierKey, TierSupply>>> => {
      const supplies: Partial<Record<TierKey, TierSupply>> = {};
      await Promise.all(SPONSORSHIP_TIERS.map(async (tier) => {
        const [maxSupply, currentSupply, metadataURI] = await readContract(config, {
          abi: ROTKI_SPONSORSHIP_ABI,
          address: getAddress(ref.contractAddress),
          args: [releaseId, BigInt(tier.tierId)],
          chainId: ref.chainId,
          functionName: 'getTierInfo',
        });
        supplies[tier.key] = { currentSupply: Number(currentSupply), maxSupply: Number(maxSupply), metadataURI };
      }));
      return supplies;
    })(),
    cause => fromCause(cause),
  );
}

export async function mintNft(config: Config, params: MintNftParams): Promise<Result<Hash, Web3Error>> {
  const value = params.isNative ? parseUnits(params.price, params.decimals) : 0n;
  return fromPromise(
    writeContract(config, {
      abi: ROTKI_SPONSORSHIP_ABI,
      address: getAddress(params.contractAddress),
      args: [BigInt(params.tierId), getAddress(params.paymentToken)],
      chainId: params.chainId,
      functionName: 'mint',
      value,
    }),
    cause => fromCause(cause),
  );
}

export interface MintFeeParams extends ContractRef {
  /** The connected wallet — the estimate is from its balance/allowance perspective. */
  account: string;
  tierId: number;
  paymentToken: string;
  price: string;
  decimals: number;
  isNative: boolean;
}

/**
 * Estimated network fee for a `mint`, as a human-readable native-coin string.
 * Reuses the shared `estimateFee` path (live gas price × real `estimateGas`,
 * with a constant fallback when estimation reverts on low funds / missing
 * allowance). For the soft gas warning only — never a hard block.
 */
export async function estimateMintFee(config: Config, params: MintFeeParams): Promise<Result<string, Web3Error>> {
  return estimateFee(config, {
    account: params.account,
    chainId: params.chainId,
    data: encodeFunctionData({ abi: ROTKI_SPONSORSHIP_ABI, args: [BigInt(params.tierId), getAddress(params.paymentToken)], functionName: 'mint' }),
    fallbackGas: MINT_GAS_FALLBACK,
    to: params.contractAddress,
    value: params.isNative ? parseUnits(params.price, params.decimals) : 0n,
  });
}

/**
 * Pure: extract the minted `tokenId` from a receipt's logs by decoding the
 * `NFTMinted` event emitted for `minter`. Returns `undefined` if not found.
 */
export function decodeMintedTokenId(logs: readonly Log[], minter: Address): string | undefined {
  for (const log of logs) {
    try {
      const decoded = decodeEventLog({ abi: ROTKI_SPONSORSHIP_ABI, data: log.data, topics: log.topics });
      if (decoded.eventName === 'NFTMinted' && decoded.args.minter.toLowerCase() === minter.toLowerCase())
        return decoded.args.tokenId.toString();
    }
    catch {
      // Not our event — skip.
    }
  }
  return undefined;
}
