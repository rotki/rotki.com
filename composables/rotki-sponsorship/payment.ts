import { Contract, ethers, type Signer, type TransactionResponse } from 'ethers';
import { CONTRACT_ADDRESS, ERC20_ABI, ETH_ADDRESS, ROTKI_SPONSORSHIP_ABI, USDC_ADDRESS } from './constants';

export async function approveUSDC(amount: string, signer: Signer): Promise<TransactionResponse> {
  const usdcContract = new Contract(USDC_ADDRESS, ERC20_ABI, signer);
  const amountBN = ethers.parseUnits(amount, 6); // USDC has 6 decimals
  return usdcContract.approve(CONTRACT_ADDRESS, amountBN);
}

export async function checkUSDCAllowance(signer: Signer): Promise<string> {
  const userAddress = await signer.getAddress();
  const usdcContract = new Contract(USDC_ADDRESS, ERC20_ABI, signer);

  const allowance = await usdcContract.allowance(userAddress, CONTRACT_ADDRESS);
  return ethers.formatUnits(allowance, 6);
}

export async function mintSponsorshipNFT(
  tierId: number,
  currency: string,
  price: string,
  signer: Signer,
): Promise<TransactionResponse> {
  const contract = new Contract(CONTRACT_ADDRESS, ROTKI_SPONSORSHIP_ABI, signer);

  let tx: TransactionResponse;

  if (currency === 'ETH') {
    // ETH payment
    tx = await contract.mint(tierId, ETH_ADDRESS, {
      value: ethers.parseEther(price),
    });
  }
  else if (currency === 'USDC') {
    // USDC payment - check approval first
    const allowance = await checkUSDCAllowance(signer);
    if (parseFloat(allowance) < parseFloat(price)) {
      throw new Error(`Insufficient USDC allowance. Please approve ${price} USDC first.`);
    }

    tx = await contract.mint(tierId, USDC_ADDRESS, {
      value: 0, // No ETH for token payments
    });
  }
  else {
    throw new Error(`Unsupported currency: ${currency}`);
  }

  return tx;
}
