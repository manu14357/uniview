import { Buffer } from 'buffer';

if (typeof globalThis !== 'undefined' && !(globalThis as Record<string, unknown>)['Buffer']) {
  (globalThis as Record<string, unknown>)['Buffer'] = Buffer;
}
