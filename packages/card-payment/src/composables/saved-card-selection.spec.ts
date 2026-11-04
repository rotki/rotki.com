import type { SavedCard } from '@rotki/card-payment-common/schemas/payment';
import { describe, expect, it } from 'vitest';
import { nextTick, ref } from 'vue';
import { useSavedCardSelection } from './saved-card-selection';

function card(token: string, last4: string): SavedCard {
  return { expiresAt: '12/30', imageUrl: '', last4, linked: false, token };
}

describe('composables/saved-card-selection', () => {
  it('selects an added card once the refreshed list contains it', async () => {
    const first = card('tok-1', '1111');
    const added = card('tok-2', '2222');
    const selected = ref<SavedCard | undefined>(first);
    const cards = ref<SavedCard[]>([first]);
    const { selectWhenAdded } = useSavedCardSelection(selected, cards);

    selectWhenAdded('tok-2');
    expect(selected.value?.token).toBe('tok-1');

    cards.value = [first, added];
    await nextTick();
    expect(selected.value?.token).toBe('tok-2');

    // Later refreshes leave the buyer's choice alone.
    selected.value = first;
    cards.value = [first, added];
    await nextTick();
    expect(selected.value?.token).toBe('tok-1');
  });

  it('selects at once when the list already has the card', () => {
    const added = card('tok-2', '2222');
    const selected = ref<SavedCard | undefined>();
    const { selectWhenAdded } = useSavedCardSelection(selected, () => [added]);

    selectWhenAdded('tok-2');

    expect(selected.value?.token).toBe('tok-2');
  });
});
