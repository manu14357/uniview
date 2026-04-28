/**
 * Minimal browser-compatible shim for Node's 'util' module.
 *
 * Replaces 'util': 'util' alias (which Vite externalises as a browser-incompatible
 * built-in) with an explicit local path alias that Vite will inline instead.
 *
 * Covers the subset used by stream-browserify / readable-stream / iconv-lite:
 *   util.debuglog, util.inspect, util.inherits, util.deprecate, util.isXxx helpers
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

export function debuglog(_section: string): (...args: any[]) => void {
  // Return a no-op — debug logging is meaningless in the browser
  return () => {};
}

export function inspect(obj: unknown, _opts?: unknown): string {
  try {
    return JSON.stringify(obj);
  } catch {
    return String(obj);
  }
}

export function inherits(ctor: any, superCtor: any): void {
  ctor.super_ = superCtor;
  ctor.prototype = Object.create(superCtor.prototype, {
    constructor: { value: ctor, enumerable: false, writable: true, configurable: true },
  });
}

export const deprecate = (fn: (...args: any[]) => any, _msg: string) => fn;

export const isArray    = Array.isArray;
export const isBoolean  = (v: unknown): v is boolean  => typeof v === 'boolean';
export const isNull     = (v: unknown): v is null      => v === null;
export const isNumber   = (v: unknown): v is number    => typeof v === 'number';
export const isString   = (v: unknown): v is string    => typeof v === 'string';
export const isUndefined= (v: unknown): v is undefined => v === undefined;
export const isObject   = (v: unknown)                 => typeof v === 'object' && v !== null;
export const isFunction = (v: unknown): v is Function  => typeof v === 'function';
export const isRegExp   = (v: unknown): v is RegExp    => v instanceof RegExp;
export const isError    = (v: unknown): v is Error     => v instanceof Error;
export const isDate     = (v: unknown): v is Date      => v instanceof Date;
export const isPrimitive= (v: unknown)                 => v === null || typeof v !== 'object' && typeof v !== 'function';

export function format(fmt: unknown, ...args: unknown[]): string {
  if (typeof fmt !== 'string') return String(fmt);
  let i = 0;
  return fmt.replace(/%[sdjifoO%]/g, (token) => {
    if (token === '%%') return '%';
    if (i >= args.length) return token;
    const arg = args[i++];
    switch (token) {
      case '%s': return String(arg);
      case '%d': return String(Number(arg));
      case '%i': return String(parseInt(String(arg), 10));
      case '%f': return String(parseFloat(String(arg)));
      case '%j': try { return JSON.stringify(arg); } catch { return '[Circular]'; }
      case '%o':
      case '%O': return inspect(arg);
      default: return token;
    }
  });
}

export function promisify(fn: (...args: any[]) => any) {
  return (...args: unknown[]) =>
    new Promise((resolve, reject) => {
      fn(...args, (err: Error | null, result: unknown) => {
        if (err) reject(err);
        else resolve(result);
      });
    });
}

const _util = {
  debuglog, inspect, inherits, deprecate, format, promisify,
  isArray, isBoolean, isNull, isNumber, isString, isUndefined,
  isObject, isFunction, isRegExp, isError, isDate, isPrimitive,
};

export default _util;
