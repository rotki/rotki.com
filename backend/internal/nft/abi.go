// Package nft provides NFT tier, token, and metadata operations.
package nft

import (
	"encoding/hex"
	"fmt"
	"math"
	"math/big"
	"strings"

	"golang.org/x/crypto/sha3"
)

// Multicall3Address is the Multicall3 contract address, same on all EVM chains.
const Multicall3Address = "0xcA11bde05977b3631167028862bE2a173976CA11"

// functionSelector returns the first 4 bytes of keccak256(signature).
// Returns a slice with len=cap=4 so append() never writes into the backing array.
func functionSelector(signature string) []byte {
	h := sha3.NewLegacyKeccak256()
	h.Write([]byte(signature))
	sum := h.Sum(nil)
	sel := make([]byte, 4)
	copy(sel, sum[:4])
	return sel
}

// ABI encoding helpers for Solidity types.
// We only need a minimal subset for the sponsorship contract.

// encodeUint256 encodes a uint256 as a 32-byte ABI word.
func encodeUint256(n int) []byte {
	b := big.NewInt(int64(n))
	padded := make([]byte, 32)
	bBytes := b.Bytes()
	copy(padded[32-len(bBytes):], bBytes)
	return padded
}

// decodeUint256 decodes a 32-byte ABI word as int.
// Returns 0 if the value exceeds the int64 range (guards against overflow).
func decodeUint256(data []byte) int {
	if len(data) < 32 {
		return 0
	}
	b := new(big.Int).SetBytes(data[:32])
	if !b.IsInt64() || b.Int64() > math.MaxInt {
		return 0
	}
	return int(b.Int64())
}

// decodeAddress decodes a 32-byte ABI word as a hex address.
func decodeAddress(data []byte) string {
	if len(data) < 32 {
		return ""
	}
	return "0x" + hex.EncodeToString(data[12:32])
}

// decodeString decodes an ABI-encoded dynamic string from the start of data.
// The first 32 bytes must be the offset pointer, relative to data[0].
func decodeString(data []byte) string {
	return decodeStringAt(data, 0)
}

// decodeStringAt decodes an ABI-encoded dynamic string where the offset pointer
// is at data[pos]. The offset value is interpreted relative to data[0].
func decodeStringAt(data []byte, pos int) string {
	if pos+32 > len(data) {
		return ""
	}
	offset := decodeUint256(data[pos : pos+32])
	if offset+32 > len(data) {
		return ""
	}
	length := decodeUint256(data[offset : offset+32])
	start := offset + 32
	end := start + length
	if end > len(data) {
		end = len(data)
	}
	return string(data[start:end])
}

// Calldata builders for the sponsorship contract methods.

// Function signatures (used for selectors)
var (
	selCurrentReleaseID = functionSelector("currentReleaseId()")
	selOwnerOf          = functionSelector("ownerOf(uint256)")
	selTokenReleaseID   = functionSelector("tokenReleaseId(uint256)")
	selTokenTierID      = functionSelector("tokenTierId(uint256)")
	selTokenURI         = functionSelector("tokenURI(uint256)")
	selGetTierInfo      = functionSelector("getTierInfo(uint256,uint256)")
	selAggregate3       = functionSelector("aggregate3((address,bool,bytes)[])")
)

// EncodeCurrentReleaseID encodes the calldata for currentReleaseId().
func EncodeCurrentReleaseID() []byte {
	return selCurrentReleaseID
}

// encodeWithSelector builds calldata: 4-byte selector + one uint256 argument.
// Uses explicit allocation to avoid mutating shared selector slices.
func encodeWithSelector(sel []byte, arg int) []byte {
	data := make([]byte, 0, 4+32)
	data = append(data, sel...)
	data = append(data, encodeUint256(arg)...)
	return data
}

// EncodeOwnerOf encodes the calldata for ownerOf(tokenId).
func EncodeOwnerOf(tokenID int) []byte {
	return encodeWithSelector(selOwnerOf, tokenID)
}

// EncodeTokenReleaseID encodes the calldata for tokenReleaseId(tokenId).
func EncodeTokenReleaseID(tokenID int) []byte {
	return encodeWithSelector(selTokenReleaseID, tokenID)
}

// EncodeTokenTierID encodes the calldata for tokenTierId(tokenId).
func EncodeTokenTierID(tokenID int) []byte {
	return encodeWithSelector(selTokenTierID, tokenID)
}

// EncodeTokenURI encodes the calldata for tokenURI(tokenId).
func EncodeTokenURI(tokenID int) []byte {
	return encodeWithSelector(selTokenURI, tokenID)
}

// EncodeGetTierInfo encodes the calldata for getTierInfo(releaseId, tierId).
func EncodeGetTierInfo(releaseID, tierID int) []byte {
	data := make([]byte, 0, 4+64)
	data = append(data, selGetTierInfo...)
	data = append(data, encodeUint256(releaseID)...)
	data = append(data, encodeUint256(tierID)...)
	return data
}

// Multicall3 encoding/decoding.

// MulticallCall represents a single call in a multicall batch.
type MulticallCall struct {
	Target       string // contract address
	AllowFailure bool
	CallData     []byte
}

// MulticallResult holds the result of a single call in the batch.
type MulticallResult struct {
	Success    bool
	ReturnData []byte
}

// EncodeMulticall3 encodes an aggregate3 call for Multicall3.
// aggregate3((address target, bool allowFailure, bytes callData)[])
func EncodeMulticall3(calls []MulticallCall) ([]byte, error) {
	// ABI encoding for dynamic array of tuples
	// offset to array data (32 bytes)
	// array length (32 bytes)
	// for each element: offset to tuple data
	// for each tuple: address (32) + allowFailure (32) + offset to bytes + bytes length + bytes data

	var buf []byte
	buf = append(buf, selAggregate3...)

	// Offset to the array (always 32 for a single parameter)
	buf = append(buf, encodeUint256(32)...)

	// Array length
	buf = append(buf, encodeUint256(len(calls))...)

	// Each tuple is encoded inline for static-sized tuples, but bytes is dynamic,
	// so we need offsets. For aggregate3, each element has:
	// - address (32 bytes, left-padded)
	// - bool (32 bytes)
	// - offset to callData within this element
	// - callData length + padded data

	// We need to calculate offsets for the dynamic callData in each tuple.
	// Each tuple's offset points to the start of that tuple's data.

	// Calculate per-element offsets
	// First: array of offsets to each element
	elementOffsets := make([]int, len(calls))
	currentOffset := len(calls) * 32 // skip the offset array itself
	for i, call := range calls {
		elementOffsets[i] = currentOffset
		// Each tuple: address(32) + bool(32) + bytes_offset(32) + bytes_length(32) + padded_data
		paddedLen := ((len(call.CallData) + 31) / 32) * 32
		currentOffset += 32 + 32 + 32 + 32 + paddedLen
	}

	// Write element offsets
	for _, off := range elementOffsets {
		buf = append(buf, encodeUint256(off)...)
	}

	// Write each element's data
	for _, call := range calls {
		// Address (left-padded to 32 bytes)
		addr, err := hexToBytes(call.Target)
		if err != nil {
			return nil, fmt.Errorf("invalid address %s: %w", call.Target, err)
		}
		padded := make([]byte, 32)
		copy(padded[32-len(addr):], addr)
		buf = append(buf, padded...)

		// AllowFailure
		if call.AllowFailure {
			buf = append(buf, encodeUint256(1)...)
		} else {
			buf = append(buf, encodeUint256(0)...)
		}

		// Offset to callData (always 96 = 3*32 from start of this tuple)
		buf = append(buf, encodeUint256(96)...)

		// CallData: length + padded data
		buf = append(buf, encodeUint256(len(call.CallData))...)
		paddedLen := ((len(call.CallData) + 31) / 32) * 32
		paddedData := make([]byte, paddedLen)
		copy(paddedData, call.CallData)
		buf = append(buf, paddedData...)
	}

	return buf, nil
}

// DecodeMulticall3Result decodes the return data from aggregate3.
// Returns: (bool success, bytes returnData)[]
func DecodeMulticall3Result(data []byte) ([]MulticallResult, error) {
	if len(data) < 64 {
		return nil, fmt.Errorf("response too short: %d bytes", len(data))
	}

	// First 32 bytes: offset to array
	offset := decodeUint256(data[:32])
	if offset+32 > len(data) {
		return nil, fmt.Errorf("invalid offset %d", offset)
	}

	// Array length
	count := decodeUint256(data[offset : offset+32])
	if count == 0 {
		return nil, nil
	}

	results := make([]MulticallResult, count)

	// Read element offsets
	elementOffsets := make([]int, count)
	for i := range count {
		elemOffsetPos := offset + 32 + i*32
		if elemOffsetPos+32 > len(data) {
			return nil, fmt.Errorf("truncated offset at index %d", i)
		}
		elementOffsets[i] = offset + 32 + decodeUint256(data[elemOffsetPos:elemOffsetPos+32])
	}

	// Parse each element
	for i := range count {
		elemStart := elementOffsets[i]
		if elemStart+64 > len(data) {
			results[i] = MulticallResult{Success: false}
			continue
		}

		// success (bool)
		success := decodeUint256(data[elemStart:elemStart+32]) != 0

		// offset to returnData
		retOffset := elemStart + decodeUint256(data[elemStart+32:elemStart+64])
		if retOffset+32 > len(data) {
			results[i] = MulticallResult{Success: success}
			continue
		}

		// returnData length
		retLen := decodeUint256(data[retOffset : retOffset+32])
		retStart := retOffset + 32
		retEnd := retStart + retLen
		if retEnd > len(data) {
			retEnd = len(data)
		}

		results[i] = MulticallResult{
			Success:    success,
			ReturnData: data[retStart:retEnd],
		}
	}

	return results, nil
}

func hexToBytes(s string) ([]byte, error) {
	s = strings.TrimPrefix(s, "0x")
	return hex.DecodeString(s)
}
