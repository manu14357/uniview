import { FontInfo, FontLoader, FontLoadStatus } from './uniview-font-loader'
import { FontManager } from './uniview-font-manager'

/**
 * Default implementation of the FontLoader interface.
 * This class provides font loading functionality using [this font repository](https://cdn.jsdelivr.net/gh/manu14357/uniview@main/demo/public/fonts/).
 * It loads font metadata from a JSON file and provides access to available fonts.
 */
export class DefaultFontLoader implements FontLoader {
  /** List of available fonts in the system */
  private _availableFonts: FontInfo[]
  private _baseUrl: string
  private _availableFontMap: Map<string, FontInfo>

  /**
   * Creates a new instance of DefaultFontLoader
   */
  constructor() {
    this._availableFonts = []
    this._availableFontMap = new Map()
    this._baseUrl = '/fonts/'
  }

  /**
   * Base URL to load fonts
   */
  get baseUrl() {
    return this._baseUrl
  }
  set baseUrl(value: string) {
    this._baseUrl = value
    this.onFontUrlChanged(value)
  }

  /**
   * Gets the list of available fonts
   * @returns Array of FontInfo objects describing available fonts
   */
  get availableFonts() {
    return this._availableFonts
  }

  /**
   * @deprecated Use {@link availableFonts} instead.
   */
  get avaiableFonts() {
    return this._availableFonts
  }

  /**
   * Triggered when font url changed
   * @param url - New font url value
   */
  onFontUrlChanged(_url: string) {
    // Do nothing for now
  }

  /**
   * Retrieves information about all available fonts in the system.
   * Loads font metadata from a CDN if not already loaded.
   * @returns Promise that resolves to an array of FontInfo objects
   * @throws {Error} If font metadata cannot be loaded from the CDN
   */
  async getAvailableFonts() {
    if (this._availableFonts.length == 0) {
      const fontMetaDataUrl = this._baseUrl + 'fonts.json'
      try {
        const response = await fetch(fontMetaDataUrl)
        this._availableFonts = (await response.json()) as FontInfo[]
      } catch (error) {
        throw new Error(
          `Failed to get available fonts from '${fontMetaDataUrl}' due to ${error}!`
        )
      }

      this._availableFonts.forEach(font => {
        font.url = this._baseUrl + font.file
      })
    }
    this.buildFontMap()
    return this._availableFonts
  }

  /**
   * Loads the specified fonts into the system. If one font is already loaded,
   * the font will not be loaded again. If no font names are provided, just loads
   * all available fonts information (not fonts).
   * @param fontNames - Array of font names to load
   * @returns Promise that resolves to an array of FontLoadStatus objects
   */
  async load(fontNames: string[]) {
    if (fontNames == null || fontNames.length === 0) {
      return []
    }
    await this.getAvailableFonts()

    const alreadyLoadedStatuses: FontLoadStatus[] = []
    const fontsToLoad: FontInfo[] = []
    fontNames.forEach(font => {
      const lowerCaseFontName = font.toLowerCase()
      const fontInfo = this._availableFontMap.get(lowerCaseFontName)
      if (fontInfo) {
        if (FontManager.instance.isFontLoaded(lowerCaseFontName)) {
          alreadyLoadedStatuses.push({
            fontName: lowerCaseFontName,
            url: fontInfo.url,
            status: 'Success'
          })
        }
        fontsToLoad.push(fontInfo)
      }
    })
    const newlyLoadedStatuses =
      await FontManager.instance.loadFonts(fontsToLoad)

    // Merge and return statuses for all requested fonts, preserving order
    const statusMap: Record<string, FontLoadStatus> = {}
    ;[...alreadyLoadedStatuses, ...newlyLoadedStatuses].forEach(s => {
      statusMap[s.fontName] = s
    })
    return fontNames.map(font => {
      const lowerCaseFontName = font.toLowerCase()
      return (
        statusMap[lowerCaseFontName] || {
          fontName: lowerCaseFontName,
          url: '',
          status: 'NotFound'
        }
      )
    })
  }

  /**
   * Build one font map. The key is font name. The value is font info.
   */
  private buildFontMap() {
    const fontMap = this._availableFontMap
    this._availableFonts.forEach(font => {
      font.name.forEach(name => {
        fontMap.set(name.toLocaleLowerCase(), font)
      })
    })
  }
}
