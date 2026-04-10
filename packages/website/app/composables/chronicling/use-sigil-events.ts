import { buildTrackedEventData, type SigilEventPayloadMap, sigilTrack, toSnakeCaseKeys } from '@rotki/sigil';
import { useUtmTracking } from './use-utm-tracking';

type SigilEvent = keyof SigilEventPayloadMap;

export function useSigilEvents() {
  const { getTrackingData } = useUtmTracking();

  function chronicle<T extends SigilEvent>(event: T, data: SigilEventPayloadMap[T] & object): void {
    if (import.meta.server)
      return;

    sigilTrack(event, buildTrackedEventData(toSnakeCaseKeys(data), getTrackingData()));
  }

  return { chronicle };
}
