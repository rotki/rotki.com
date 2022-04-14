import { ethers } from 'ethers'
import { ref, Ref } from '@nuxtjs/composition-api'
import { get, set, useTimeoutFn } from '@vueuse/core'
import { logger } from '~/utils/logger'
import { CryptoPayment, IdleStep, Provider, StepType } from '~/types'
import { assert } from '~/utils/assert'
import { useMainStore } from '~/store'

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

export const useWeb3Payment = (
  data: Ref<CryptoPayment | null>,
  getProvider: () => Provider,
  testing: boolean
) => {
  const { markTransactionStarted } = useMainStore()
  const state = ref<StepType | IdleStep>('idle')
  const error = ref('')
  const { start, stop } = useTimeoutFn(
    () => {
      logger.info('change to done')
      set(state, 'success')
    },
    5000,
    { immediate: false }
  )

  async function payWithEth(signer: ethers.Signer) {
    stop()
    const payment = get(data)
    assert(payment)
    const value = ethers.utils.parseEther(payment.finalPriceInCrypto)
    const to = payment.cryptoAddress
    logger.info(
      `preparing to send ${payment.finalPriceInCrypto}(${value}) ETH to ${to}`
    )
    set(state, 'pending')
    const tx = await signer.sendTransaction({
      to,
      value,
    })
    logger.info(`transaction is pending: ${tx.hash}`)
    await markTransactionStarted()
    start()
  }

  async function payWithDai(signer: ethers.Signer) {
    stop()
    const payment = get(data)
    assert(payment)
    const {
      cryptoAddress,
      finalPriceInCrypto,
      tokenAddress: contractAddress,
    } = payment
    assert(contractAddress)
    const contract = new ethers.Contract(contractAddress, abi, signer.provider)
    const contractWithSigner = contract.connect(signer)
    const price = ethers.utils.parseEther(finalPriceInCrypto)
    logger.info(`preparing to send ${price} DAI to ${cryptoAddress}`)
    set(state, 'pending')
    const tx = await (contractWithSigner.transfer(
      cryptoAddress,
      price
    ) as Promise<ethers.providers.TransactionResponse>)
    logger.info(`transaction is pending: ${tx.hash}`)
    await markTransactionStarted()
    start()
  }

  const payWithMetamask = async () => {
    try {
      const payment = get(data)
      assert(payment)
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
      const network = await web3Provider.getNetwork()

      const expected = testing ? 5 : 1
      const name = testing ? 'Görli' : 'Mainnet'
      if (network.chainId !== expected) {
        set(
          error,
          `We are expecting payments on ${name} but found ${network.name}`
        )
        return
      }

      const signer = web3Provider.getSigner()

      if (payment.cryptocurrency === 'ETH') {
        await payWithEth(signer)
      } else if (payment.cryptocurrency === 'DAI') {
        await payWithDai(signer)
      }
    } catch (e: any) {
      logger.error(e)

      if ('reason' in e) {
        set(error, e.reason)
      } else {
        set(error, e.message)
      }
    }
  }

  return {
    payWithMetamask,
    state,
    error,
  }
}
