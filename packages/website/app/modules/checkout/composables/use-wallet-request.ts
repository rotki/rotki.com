import { get, set } from '@vueuse/shared';
import { err, type Result } from 'plainfp/result';
import { timeout as withTimeout } from 'plainfp/result-async';
import { walletNoAnswer, type Web3Error } from '~/modules/web3/core/errors';
import { useLogger } from '~/utils/use-logger';

/**
 * How long the page waits for the wallet to answer before it stops blocking the page. Generous,
 * as a hardware wallet or a phone takes a while, and the request stays valid after it.
 */
export const WALLET_ANSWER_TIMEOUT_MS = 2 * 60 * 1000;

interface UseWalletRequestReturn {
  /**
   * Runs a wallet request, giving up the wait with `WalletNoAnswer` after the timeout. A request
   * still open in the wallet can be approved at any time, so `onLateAnswer` then gets its result,
   * and no new request starts until it ends: a second one could pay twice.
   */
  request: <T>(start: () => Promise<Result<T, Web3Error>>, onLateAnswer: (value: T) => void) => Promise<Result<T, Web3Error>>;
}

export function useWalletRequest(): UseWalletRequestReturn {
  const logger = useLogger('wallet-request');
  const open = shallowRef<boolean>(false);

  async function request<T>(start: () => Promise<Result<T, Web3Error>>, onLateAnswer: (value: T) => void): Promise<Result<T, Web3Error>> {
    if (get(open))
      return err(walletNoAnswer());

    set(open, true);
    const answer = start().finally(() => set(open, false));
    const result = await withTimeout(answer, WALLET_ANSWER_TIMEOUT_MS, walletNoAnswer);

    if (!result.ok && result.error._tag === 'WalletNoAnswer') {
      logger.info('The wallet has not answered yet, still waiting for it');
      answer.then((late) => {
        if (late.ok)
          onLateAnswer(late.value);
        else
          logger.info('The wallet request ended after the wait:', late.error);
      }).catch(error => logger.error(error));
    }
    return result;
  }

  return { request };
}
