import { ethers } from 'ethers';

// Multicall3 contract address (same on most chains including Sepolia)
const MULTICALL3_ADDRESS = '0xcA11bde05977b3631167028862bE2a173976CA11';

// Multicall3 ABI (minimal)
const MULTICALL3_ABI = [
  'function aggregate3(tuple(address target, bool allowFailure, bytes callData)[] calls) payable returns (tuple(bool success, bytes returnData)[])',
];

export interface Call {
  target: string;
  allowFailure?: boolean;
  callData: string;
}

export interface Result {
  success: boolean;
  returnData: string;
}

export class Multicall {
  private contract: ethers.Contract;

  constructor(provider: ethers.Provider) {
    this.contract = new ethers.Contract(MULTICALL3_ADDRESS, MULTICALL3_ABI, provider);
  }

  async aggregate(calls: Call[]): Promise<Result[]> {
    const formattedCalls = calls.map(call => ({
      allowFailure: call.allowFailure ?? false,
      callData: call.callData,
      target: call.target,
    }));

    // Use staticCall to ensure this is a read-only call
    const results = await this.contract.aggregate3.staticCall(formattedCalls);
    return results;
  }

  // Helper to encode function calls
  static encodeCall(iface: ethers.Interface, functionName: string, params: any[]): string {
    return iface.encodeFunctionData(functionName, params);
  }

  // Helper to decode results
  static decodeResult(iface: ethers.Interface, functionName: string, data: string): any {
    return iface.decodeFunctionResult(functionName, data);
  }
}
