import type { SavedCard } from '@rotki/card-payment-common/schemas/payment';
import { get, set } from '@vueuse/core';
import { type MaybeRefOrGetter, ref, type Ref, toValue, watch } from 'vue';

export interface UseSavedCardSelectionReturn {
  /** Selects the card with this token as soon as it shows up in the saved card list. */
  selectWhenAdded: (token: string) => void;
}

/** A card added in the dialog is selected once the refreshed card list contains it. */
export function useSavedCardSelection(
  selected: Ref<SavedCard | undefined>,
  cards: MaybeRefOrGetter<SavedCard[]>,
): UseSavedCardSelectionReturn {
  const pendingToken = ref<string>();

  function selectPending(list: SavedCard[]): void {
    const token = get(pendingToken);
    if (!token)
      return;

    const added = list.find(card => card.token === token);
    if (added) {
      set(selected, added);
      set(pendingToken, undefined);
    }
  }

  watch(() => toValue(cards), selectPending);

  function selectWhenAdded(token: string): void {
    set(pendingToken, token);
    selectPending(toValue(cards));
  }

  return { selectWhenAdded };
}
