import type { ViewerEventMap } from './types';

type EventHandler<T> = (payload: T) => void;

/**
 * Type-safe pub/sub event bus for communication between
 * decoupled viewer components and plugins.
 */
class EventBusImpl {
  private listeners = new Map<string, Set<EventHandler<never>>>();

  /** Subscribe to an event */
  on<K extends keyof ViewerEventMap>(
    event: K,
    handler: EventHandler<ViewerEventMap[K]>,
  ): () => void {
    const key = event as string;
    if (!this.listeners.has(key)) {
      this.listeners.set(key, new Set());
    }
    const handlers = this.listeners.get(key)!;
    handlers.add(handler as EventHandler<never>);

    // Return unsubscribe function
    return () => {
      handlers.delete(handler as EventHandler<never>);
      if (handlers.size === 0) {
        this.listeners.delete(key);
      }
    };
  }

  /** Emit an event to all subscribers */
  emit<K extends keyof ViewerEventMap>(event: K, payload: ViewerEventMap[K]): void {
    const key = event as string;
    const handlers = this.listeners.get(key);
    if (handlers) {
      handlers.forEach((handler) => {
        try {
          (handler as EventHandler<ViewerEventMap[K]>)(payload);
        } catch (err) {
          // Prevent one handler from breaking others
          if (typeof globalThis !== 'undefined' && globalThis.console) {
            globalThis.console.error(`[EventBus] Error in handler for "${key}":`, err);
          }
        }
      });
    }
  }

  /** Remove all listeners for an event, or all events if no event specified */
  off<K extends keyof ViewerEventMap>(event?: K): void {
    if (event) {
      this.listeners.delete(event as string);
    } else {
      this.listeners.clear();
    }
  }

  /** Subscribe to an event, auto-unsubscribe after first call */
  once<K extends keyof ViewerEventMap>(
    event: K,
    handler: EventHandler<ViewerEventMap[K]>,
  ): () => void {
    const unsubscribe = this.on(event, (payload) => {
      unsubscribe();
      handler(payload);
    });
    return unsubscribe;
  }
}

/** Singleton event bus instance */
export const EventBus = new EventBusImpl();
