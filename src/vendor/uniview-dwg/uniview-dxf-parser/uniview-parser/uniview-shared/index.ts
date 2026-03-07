export * from './uniview-is-matched'
export * from './uniview-xdata'
export * from './uniview-extensions/uniview-parser'

let lastHandle = 0;

export function ensureHandle(entity: any) {
    if (!entity) {
        throw new TypeError('entity cannot be undefined or null');
    }

    if (!entity.handle) {
        entity.handle = lastHandle++;
    }
}