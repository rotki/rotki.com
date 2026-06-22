import type { NftSubmission } from '~/types/sponsor';
import { get, set } from '@vueuse/shared';
import { useWallet } from '~/modules/web3/composables/use-wallet';
import { useNftSubmissions } from '~/modules/web3/sponsorship/use-nft-submissions';

/**
 * Page-level orchestration for the submit-name flow: toggles between the holder
 * submission form and the submissions list, tracks the submission being edited,
 * and resets that view state whenever the wallet/address changes.
 */
export function useSubmissionFlow() {
  const showSubmissionsList = shallowRef<boolean>(false);
  const editingSubmission = shallowRef<NftSubmission>();

  const { address, connected: isConnected } = useWallet();
  const { fetchSubmissions } = useNftSubmissions();

  function loadSubmissions(): void {
    set(showSubmissionsList, true);
  }

  function handleEditSubmission(submission: NftSubmission): void {
    set(editingSubmission, submission);
    set(showSubmissionsList, false);
  }

  function handleCancelEdit(): void {
    set(editingSubmission, undefined);
  }

  async function handleSubmissionSuccess(): Promise<void> {
    set(editingSubmission, undefined);
    const addressValue = get(address);
    if (get(showSubmissionsList) && addressValue)
      await fetchSubmissions(addressValue);
  }

  function handleCloseList(): void {
    set(showSubmissionsList, false);
  }

  // Reset the view whenever the wallet disconnects or the active address changes.
  watch(isConnected, (connected) => {
    if (!connected) {
      set(showSubmissionsList, false);
      set(editingSubmission, undefined);
    }
  });

  watch(address, () => {
    set(showSubmissionsList, false);
    set(editingSubmission, undefined);
  });

  return {
    address,
    editingSubmission: shallowReadonly(editingSubmission),
    handleCancelEdit,
    handleCloseList,
    handleEditSubmission,
    handleSubmissionSuccess,
    isConnected,
    loadSubmissions,
    showSubmissionsList: shallowReadonly(showSubmissionsList),
  };
}
