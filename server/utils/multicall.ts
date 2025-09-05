import type { ethers } from 'ethers';
import { ContractFactory } from '~/composables/rotki-sponsorship/contract';

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

// More convenient interface for contract calls
export interface ContractCall {
  contract: ethers.Contract;
  method: string;
  args: any[];
  allowFailure?: boolean;
}

export interface DecodedResult<T = any> {
  success: boolean;
  value?: T;
  error?: string;
}

export class Multicall {
  private contract: ethers.Contract;

  constructor(provider: ethers.Provider) {
    this.contract = ContractFactory.createContract(MULTICALL3_ADDRESS, MULTICALL3_ABI, provider);
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

  /**
   * Convenience method to call multiple contract methods and automatically decode results
   * @param calls Array of contract calls to execute
   * @returns Array of decoded results
   */
  async callContracts<T extends any[] = any[]>(calls: ContractCall[]): Promise<DecodedResult<T[number]>[]> {
    // Encode all calls
    const encodedCalls: Call[] = calls.map(call => ({
      allowFailure: call.allowFailure ?? false,
      callData: call.contract.interface.encodeFunctionData(call.method, call.args),
      target: call.contract.target as string,
    }));

    // Execute multicall
    const results = await this.aggregate(encodedCalls);

    // Decode results
    return results.map((result, index) => {
      const call = calls[index];
      if (!result.success && !call.allowFailure) {
        return {
          error: 'Call failed',
          success: false,
        };
      }

      try {
        const decoded = call.contract.interface.decodeFunctionResult(
          call.method,
          result.returnData,
        );
        // Return the first element if it's a single return value
        const value = decoded.length === 1 ? decoded[0] : decoded;
        return {
          success: result.success,
          value,
        };
      }
      catch (error) {
        return {
          error: error instanceof Error ? error.message : 'Failed to decode result',
          success: false,
        };
      }
    });
  }

  /**
   * Execute multiple calls on the same contract
   * @param contract The contract instance
   * @param calls Array of method names and arguments
   * @returns Array of decoded results
   */
  async callSameContract<T extends any[] = any[]>(
    contract: ethers.Contract,
    calls: Array<{ method: string; args: any[]; allowFailure?: boolean }>,
  ): Promise<DecodedResult<T[number]>[]> {
    const contractCalls: ContractCall[] = calls.map(call => ({
      allowFailure: call.allowFailure,
      args: call.args,
      contract,
      method: call.method,
    }));
    return this.callContracts(contractCalls);
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
