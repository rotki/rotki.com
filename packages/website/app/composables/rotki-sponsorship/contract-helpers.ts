import type { Signer, TransactionResponse } from 'ethers';
import { get } from '@vueuse/shared';
import { ERC20_ABI, ETH_ADDRESS, ROTKI_SPONSORSHIP_ABI } from './constants';
import { useNftConfig } from './use-nft-config';

// Lazy load ethers utilities
export async function getEthersUtils() {
  const [{ Contract }, { MaxUint256 }, { formatUnits, parseEther, parseUnits }] = await Promise.all([
    import('ethers/contract'),
    import('ethers/constants'),
    import('ethers/utils'),
  ]);
  return { Contract, MaxUint256, formatUnits, parseEther, parseUnits };
}

// Lazy load contract factory
export async function getContractFactory() {
  const { ContractFactory, refreshSupplyData } = await import('~/composables/rotki-sponsorship/contract');
  return { ContractFactory, refreshSupplyData };
}

export async function approveTokenContract(
  tokenAddress: string,
  amount: string,
  decimals: number,
  signer: Signer,
  unlimited = true,
): Promise<TransactionResponse> {
  const { CONTRACT_ADDRESS } = useNftConfig();
  const { Contract, MaxUint256, parseUnits } = await getEthersUtils();
  const tokenContract = new Contract(tokenAddress, ERC20_ABI, signer);

  // Use max uint256 for unlimited allowance or parse the specific amount
  const approvalAmount = unlimited
    ? MaxUint256
    : parseUnits(amount, decimals);

  const approve = tokenContract.approve;
  if (!approve)
    throw new Error('Token contract does not support approve');

  return approve(get(CONTRACT_ADDRESS), approvalAmount);
}

export async function checkTokenAllowanceContract(
  tokenAddress: string,
  decimals: number,
  signer: Signer,
): Promise<string> {
  const { CONTRACT_ADDRESS } = useNftConfig();
  const { Contract, formatUnits } = await getEthersUtils();
  const userAddress = await signer.getAddress();
  const tokenContract = new Contract(tokenAddress, ERC20_ABI, signer);

  const getAllowance = tokenContract.allowance;
  if (!getAllowance)
    throw new Error('Token contract does not support allowance');

  const allowance = await getAllowance(userAddress, get(CONTRACT_ADDRESS));
  return formatUnits(allowance, decimals);
}

export async function mintNFT(
  tierId: number,
  tokenAddress: string,
  price: string,
  decimals: number,
  signer: Signer,
): Promise<TransactionResponse> {
  const { CONTRACT_ADDRESS } = useNftConfig();
  const { Contract, parseEther } = await getEthersUtils();
  const contract = new Contract(get(CONTRACT_ADDRESS), ROTKI_SPONSORSHIP_ABI, signer);

  const mint = contract.mint;
  if (!mint)
    throw new Error('Contract does not support mint');

  let tx: TransactionResponse;

  if (tokenAddress === ETH_ADDRESS) {
    // ETH payment
    tx = await mint(tierId, ETH_ADDRESS, {
      value: parseEther(price),
    });
  }
  else {
    // Token payment - check approval first
    const allowance = await checkTokenAllowanceContract(tokenAddress, decimals, signer);
    if (Number.parseFloat(allowance) < Number.parseFloat(price)) {
      throw new Error(`Insufficient token allowance. Please approve ${price} tokens first.`);
    }

    tx = await mint(tierId, tokenAddress, {
      value: 0, // No ETH for token payments
    });
  }

  return tx;
}
