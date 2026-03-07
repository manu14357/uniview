import { UvDbFontInfo, UvDbFontLoader } from '@uniview/data-model'
import { UvTrFontLoader } from '@uniview/three-renderer'

import { UvEdFontNotLoadedInfo, eventBus } from '../uniview-editor'

/**
 * Font loader implementation for CAD text rendering.
 *
 * This class implements the {@link UvDbFontLoader} interface and provides functionality to:
 * - Fetch available font metadata from a CDN
 * - Load required fonts for CAD text rendering
 * - Handle font loading errors and emit appropriate events
 * - Manage font availability checking
 *
 * The font loader works with a Three.js renderer to load fonts that are used
 * for rendering CAD text entities like MText and Text.
 *
 * @example
 * ```typescript
 * const renderer = new UvTrRenderer();
 * const fontLoader = new UvApFontLoader(renderer);
 *
 * // Load specific fonts
 * await fontLoader.load(['Arial', 'SimSun']);
 *
 * // Get all available fonts
 * const fonts = await fontLoader.getAvailableFonts();
 * console.log('Available fonts:', fonts);
 * ```
 */
export class UvApFontLoader implements UvDbFontLoader {
  /** Font loader in mtext-render */
  private _loader: UvTrFontLoader

  /**
   * Creates a new font loader instance.
   *
   * @param renderer - The Three.js renderer that will use the loaded fonts
   */
  constructor() {
    this._loader = new UvTrFontLoader()
  }

  /**
   * Base URL to load fonts
   */
  get baseUrl() {
    return this._loader.baseUrl
  }
  set baseUrl(value: string) {
    this._loader.baseUrl = value
  }

  /**
   * Available fonts to load.
   */
  get availableFonts(): UvDbFontInfo[] {
    return this._loader.availableFonts
  }

  /**
   * @deprecated Use {@link availableFonts} instead.
   */
  get avaiableFonts(): UvDbFontInfo[] {
    return this.availableFonts
  }

  /**
   * @inheritdoc
   */
  async getAvailableFonts(): Promise<UvDbFontInfo[]> {
    return await this._loader.getAvailableFonts()
  }

  /**
   * @deprecated Use {@link getAvailableFonts} instead.
   */
  async getAvaiableFonts(): Promise<UvDbFontInfo[]> {
    return this.getAvailableFonts()
  }

  /**
   * @inheritdoc
   */
  async load(fontNames: string[]) {
    const loadStatus = await this._loader.load(fontNames)
    const fontsNotFound: string[] = []
    const fontsNotLoaded: UvEdFontNotLoadedInfo[] = []
    loadStatus.forEach(item => {
      if (item.status === 'NotFound') {
        fontsNotFound.push(item.fontName)
      } else if (item.status === 'FailedToLoad') {
        fontsNotLoaded.push({
          fontName: item.fontName,
          url: item.url
        })
      }
    })
    if (fontsNotFound.length > 0) {
      eventBus.emit('fonts-not-found', {
        fonts: fontsNotFound
      })
    }
    if (fontsNotLoaded.length > 0) {
      eventBus.emit('fonts-not-loaded', {
        fonts: fontsNotLoaded
      })
    }
  }
}
