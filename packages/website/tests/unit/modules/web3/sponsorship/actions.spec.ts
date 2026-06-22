import { type Address, encodeAbiParameters, type Hex, type Log, numberToHex, toEventSelector } from 'viem';
import { describe, expect, it } from 'vitest';
import { decodeMintedTokenId } from '~/modules/web3/sponsorship/actions';

const MINTER: Address = '0xabcdef0000000000000000000000000000000001';
const MINTER_UPPER: Address = '0xABCDEF0000000000000000000000000000000001';

const NFT_MINTED_SIGNATURE = 'NFTMinted(uint256,uint256,uint256,address)';

function mintedLog(tokenId: bigint, minter: Address): Log {
  // Topics carry the event signature + indexed args (tokenId, releaseId, tierId);
  // the non-indexed `minter` lives in the data field — how the contract emits it.
  const topics: [Hex, Hex, Hex, Hex] = [
    toEventSelector(NFT_MINTED_SIGNATURE),
    numberToHex(tokenId, { size: 32 }),
    numberToHex(0n, { size: 32 }),
    numberToHex(0n, { size: 32 }),
  ];
  const data = encodeAbiParameters([{ name: 'minter', type: 'address' }], [minter]);
  return {
    address: '0x2222222222222222222222222222222222222222',
    blockHash: '0x00',
    blockNumber: 1n,
    data,
    logIndex: 0,
    removed: false,
    topics,
    transactionHash: '0x00',
    transactionIndex: 0,
  };
}

describe('sponsorship/actions decodeMintedTokenId', () => {
  it('decodes the tokenId for the matching minter', () => {
    expect(decodeMintedTokenId([mintedLog(42n, MINTER)], MINTER)).toBe('42');
  });

  it('matches the minter case-insensitively', () => {
    const log = mintedLog(7n, MINTER);
    expect(decodeMintedTokenId([log], MINTER_UPPER)).toBe('7');
  });

  it('returns undefined when no log was minted by the address', () => {
    const other: Address = '0x3333333333333333333333333333333333333333';
    expect(decodeMintedTokenId([mintedLog(42n, other)], MINTER)).toBeUndefined();
  });

  it('returns undefined for empty logs', () => {
    expect(decodeMintedTokenId([], MINTER)).toBeUndefined();
  });

  it('skips logs that are not NFTMinted events', () => {
    const garbage: Log = {
      address: '0x2222222222222222222222222222222222222222',
      blockHash: '0x00',
      blockNumber: 1n,
      data: '0x',
      logIndex: 0,
      removed: false,
      topics: [],
      transactionHash: '0x00',
      transactionIndex: 0,
    };
    expect(decodeMintedTokenId([garbage], MINTER)).toBeUndefined();
  });
});
