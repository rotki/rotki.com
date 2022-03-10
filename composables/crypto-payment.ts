import { ethers } from 'ethers'
import { ref, Ref } from '@nuxtjs/composition-api'
import { logger } from '~/utils/logger'
import { CryptoPayment, Provider } from '~/types'
import { assert } from '~/utils/assert'

const abi = [
  // Some details about the token
  'function name() view returns (string)',
  'function symbol() view returns (string)',

  // Get the account balance
  'function balanceOf(address) view returns (uint)',

  // Send some of your tokens to someone else
  'function transfer(address to, uint amount)',

  // An event triggered whenever anyone transfers to someone else
  'event Transfer(address indexed from, address indexed to, uint amount)',
]

const WAIT_CONFIRMATIONS = 1

export enum PaymentState {
  NONE,
  WAIT,
  DONE,
}

export const setupWeb3Payments = (
  data: Ref<CryptoPayment>,
  getProvider: () => Provider
) => {
  const state = ref<PaymentState>(PaymentState.NONE)
  const error = ref('')

  async function payWithEth(signer: ethers.Signer) {
    const value = ethers.utils.parseEther(data.value.finalPriceInCrypto)
    const to = data.value.cryptoAddress
    logger.info(
      `preparing to send ${data.value.finalPriceInCrypto}(${value}) ETH to ${to}`
    )
    const tx = await signer.sendTransaction({
      to,
      value,
    })
    state.value = PaymentState.WAIT
    logger.info(`waiting for transaction confirmation: ${tx.hash}`)
    await tx.wait(WAIT_CONFIRMATIONS)
    state.value = PaymentState.DONE
    logger.info(`confirmed transaction: ${tx.hash}`)
  }

  async function payWithDai(signer: ethers.Signer) {
    const {
      cryptoAddress,
      finalPriceInCrypto,
      tokenAddress: contractAddress,
    } = data.value
    assert(contractAddress)
    const contract = new ethers.Contract(contractAddress, abi, signer.provider)
    const contractWithSigner = contract.connect(signer)
    const price = ethers.utils.parseEther(finalPriceInCrypto)
    logger.info(`preparing to send ${price} DAI to ${cryptoAddress}`)
    const tx = await (contractWithSigner.transfer(
      cryptoAddress,
      price
    ) as Promise<ethers.providers.TransactionResponse>)
    state.value = PaymentState.WAIT
    logger.info(`waiting for transaction confirmation: ${tx.hash}`)
    await tx.wait(WAIT_CONFIRMATIONS)
    state.value = PaymentState.DONE
    logger.info(`confirmed transaction: ${tx.hash}`)
  }

  const payWithMetamask = async () => {
    try {
      const provider = getProvider()
      const accounts = await provider.request({
        method: 'eth_requestAccounts',
        params: [],
      })

      if (!accounts || accounts.length === 0) {
        logger.info('missing permission')
        return
      }
      const web3Provider = new ethers.providers.Web3Provider(provider as any)
      const signer = web3Provider.getSigner()
      if (data.value.cryptocurrency === 'ETH') {
        await payWithEth(signer)
      } else if (data.value.cryptocurrency === 'DAI') {
        await payWithDai(signer)
      }
    } catch (e: any) {
      logger.error(e)
      error.value = e.message
    }
  }

  return {
    payWithMetamask,
    state,
    error,
  }
}
