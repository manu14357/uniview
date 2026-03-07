/// <reference types="vite/client" />

declare const __UNIVIEW_CACHE_BUST__: string;

declare module '*.module.css' {
  const classes: Record<string, string>;
  export default classes;
}

declare module '*?worker' {
  const workerConstructor: new () => Worker;
  export default workerConstructor;
}

declare module 'libredwg-web' {
  interface LibreDWG {
    parse(data: ArrayBuffer): {
      entities: Array<{
        type: string;
        handle: string;
        layer: string;
        color: number;
        [key: string]: unknown;
      }>;
      layers: Array<{
        name: string;
        color: number;
        flags: number;
      }>;
      header: {
        version: string;
        [key: string]: unknown;
      };
    };
  }
  const libredwg: LibreDWG;
  export default libredwg;
}
