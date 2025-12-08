import { useDebounceFn } from '@vueuse/core';

import { useLogger } from '~/utils/use-logger';

type EventCallback = () => void | Promise<void>;

type UnsubscribeFn = () => void;

/**
 * Lightweight event bus for application-wide events
 * Uses a singleton pattern with debouncing support
 */
class AppEventBus {
  private static instance: AppEventBus | null = null;
  private listeners: Map<string, Set<EventCallback>> = new Map();
  private logger = useLogger('app-events');

  private constructor() {}

  static getInstance(): AppEventBus {
    if (!AppEventBus.instance) {
      AppEventBus.instance = new AppEventBus();
    }
    return AppEventBus.instance;
  }

  /**
   * Subscribe to an event
   * @returns Unsubscribe function
   */
  on(event: string, callback: EventCallback): UnsubscribeFn {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }

    this.listeners.get(event)!.add(callback);

    // Return unsubscribe function
    return () => {
      const callbacks = this.listeners.get(event);
      if (callbacks) {
        callbacks.delete(callback);
        if (callbacks.size === 0) {
          this.listeners.delete(event);
        }
      }
    };
  }

  /**
   * Emit an event to all listeners
   */
  async emit(event: string): Promise<void> {
    const callbacks = this.listeners.get(event);
    if (!callbacks || callbacks.size === 0) {
      return;
    }

    this.logger.debug(`Emitting event: ${event} to ${callbacks.size} listeners`);

    // Execute all callbacks
    const promises = Array.from(callbacks).map(async (callback) => {
      try {
        await callback();
      }
      catch (error) {
        this.logger.error(`Error in event callback for ${event}:`, error);
      }
    });

    await Promise.all(promises);
  }

  /**
   * Clear all listeners for an event or all events
   */
  clear(event?: string): void {
    if (event) {
      this.listeners.delete(event);
    }
    else {
      this.listeners.clear();
    }
  }
}

// Get singleton instance
const eventBus = AppEventBus.getInstance();

/**
 * Composable for general app events
 */
function useAppEvents() {
  return {
    clear: eventBus.clear.bind(eventBus),
    emit: eventBus.emit.bind(eventBus),
    on: eventBus.on.bind(eventBus),
  };
}

/**
 * Specialized composable for account refresh events with debouncing
 */
export function useAccountRefresh() {
  const { emit, on } = useAppEvents();
  const logger = useLogger('account-refresh');

  // Debounced refresh request - waits 500ms, max 2 seconds (fire and forget)
  const requestRefresh = useDebounceFn(
    () => {
      logger.debug('Triggering account refresh');
      emit('account:refresh').catch(error => logger.error('Failed to emit account refresh:', error));
    },
    500,
    { maxWait: 2000 },
  );

  // Subscribe to refresh events
  const onRefresh = (callback: EventCallback): UnsubscribeFn => on('account:refresh', callback);

  return {
    onRefresh,
    requestRefresh: () => {
      requestRefresh().catch(error => logger.error('Failed to request account refresh:', error));
    },
  };
}
