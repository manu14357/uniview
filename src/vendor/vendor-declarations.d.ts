// Type declarations for untyped modules used by vendor code

declare module 'rbush' {
  interface BBox {
    minX: number
    minY: number
    maxX: number
    maxY: number
  }

  class RBush<T extends BBox = BBox> {
    constructor(maxEntries?: number)
    insert(item: T): RBush<T>
    load(items: T[]): RBush<T>
    remove(item: T, equals?: (a: T, b: T) => boolean): RBush<T>
    clear(): RBush<T>
    search(bbox: BBox): T[]
    collides(bbox: BBox): boolean
    all(): T[]
    toJSON(): unknown
    fromJSON(data: unknown): RBush<T>
  }

  export default RBush
}

declare module 'opentype.js' {
  export interface Font {
    unitsPerEm: number
    ascender: number
    descender: number
    glyphs: GlyphSet
    tables: {
      post: { underlinePosition: number; underlineThickness: number; [key: string]: unknown }
      head: { xMin: number; xMax: number; yMin: number; yMax: number; [key: string]: unknown }
      name: Record<string, string>
      [key: string]: Record<string, unknown>
    }
    names: Record<string, Record<string, string>>
    getPath(text: string, x: number, y: number, fontSize: number, options?: object): Path
    getPaths(text: string, x: number, y: number, fontSize: number, options?: object): Path[]
    charToGlyph(char: string): Glyph
    charToGlyphIndex(char: string): number
    stringToGlyphs(s: string): Glyph[]
    getAdvanceWidth(text: string, fontSize: number, options?: object): number
    getEnglishName(name: string): string
    hasChar(char: string): boolean
  }

  export interface Glyph {
    name: string
    unicode: number
    index: number
    advanceWidth: number
    xMin: number
    xMax: number
    yMin: number
    yMax: number
    path: Path
    getPath(x: number, y: number, fontSize: number): Path
  }

  export interface GlyphSet {
    length: number
    get(index: number): Glyph
  }

  export interface Path {
    commands: PathCommand[]
    toPathData(decimalPlaces?: number): string
    toSVG(decimalPlaces?: number): string
  }

  export interface PathCommand {
    type: string
    x?: number
    y?: number
    x1?: number
    y1?: number
    x2?: number
    y2?: number
  }

  export function load(url: string, callback: (err: Error | null, font?: Font) => void): void
  export function loadSync(url: string): Font
  export function parse(buffer: ArrayBuffer): Font
}

declare module 'readable-stream' {
  export class Transform {
    constructor(options?: object)
    push(chunk: unknown, encoding?: string): boolean
    _transform(chunk: unknown, encoding: string, callback: (error?: Error | null, data?: unknown) => void): void
    _flush(callback: (error?: Error | null, data?: unknown) => void): void
    pipe<T extends NodeJS.WritableStream>(destination: T, options?: { end?: boolean }): T
    on(event: string, listener: (...args: unknown[]) => void): this
  }
  export class Readable {
    constructor(options?: object)
    push(chunk: unknown, encoding?: string): boolean
    pipe<T extends NodeJS.WritableStream>(destination: T, options?: { end?: boolean }): T
    on(event: string, listener: (...args: unknown[]) => void): this
  }
}

declare module 'three/examples/jsm/controls/OrbitControls' {
  import { Camera, EventDispatcher, MOUSE, TOUCH, Vector3 } from 'three'

  export class OrbitControls extends EventDispatcher<Record<string, object>> {
    constructor(object: Camera, domElement?: HTMLElement)
    object: Camera
    domElement: HTMLElement | Document
    enabled: boolean
    target: Vector3
    minDistance: number
    maxDistance: number
    minZoom: number
    maxZoom: number
    minPolarAngle: number
    maxPolarAngle: number
    minAzimuthAngle: number
    maxAzimuthAngle: number
    enableDamping: boolean
    dampingFactor: number
    enableZoom: boolean
    zoomSpeed: number
    zoomToCursor: boolean
    enableRotate: boolean
    rotateSpeed: number
    enablePan: boolean
    panSpeed: number
    screenSpacePanning: boolean
    keyPanSpeed: number
    autoRotate: boolean
    autoRotateSpeed: number
    keys: { LEFT: string; UP: string; RIGHT: string; BOTTOM: string }
    mouseButtons: { LEFT: MOUSE; MIDDLE: MOUSE; RIGHT: MOUSE }
    touches: { ONE: TOUCH; TWO: TOUCH }
    update(): boolean
    listenToKeyEvents(domElement: HTMLElement): void
    saveState(): void
    reset(): void
    dispose(): void
    getDistance(): number
    getPolarAngle(): number
    getAzimuthalAngle(): number
  }
}

declare module 'three/examples/jsm/libs/stats.module' {
  class Stats {
    REVISION: number
    dom: HTMLDivElement
    addPanel(panel: Stats.Panel): Stats.Panel
    showPanel(id: number): void
    begin(): void
    end(): void
    update(): void
    domElement: HTMLDivElement
    setMode(id: number): void
  }

  namespace Stats {
    class Panel {
      constructor(name?: string, fg?: string, bg?: string)
      dom: HTMLCanvasElement
      update(value: number, maxValue: number): void
    }
  }

  export default Stats
}

declare module 'three/examples/jsm/utils/BufferGeometryUtils.js' {
  import { BufferGeometry } from 'three'
  export function mergeVertices(geometry: BufferGeometry, tolerance?: number): BufferGeometry
  export function mergeGeometries(geometries: BufferGeometry[], useGroups?: boolean): BufferGeometry
}

declare namespace NodeJS {
  interface Timeout {
    ref(): this
    unref(): this
    hasRef(): boolean
    refresh(): this
    [Symbol.toPrimitive](): number
  }
}
