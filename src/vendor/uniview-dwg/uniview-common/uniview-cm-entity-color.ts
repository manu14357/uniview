import { UvCmColorMethod } from './uniview-cm-color-method'

/**
 * Represents an AutoCAD-like entity color object.
 *
 * This class mimics ObjectARX `UvCmEntityColor`. It stores:
 * - A color method (`UvCmColorMethod`)
 * - A single numeric `value` that represents:
 *    - RGB (packed R/G/B)
 *    - ACI index
 *    - Layer index
 *
 * It uses lazy decoding/encoding to expose convenient getters/setters.
 */
export class UvCmEntityColor {
  /**
   * The method used to determine the final color.
   * Defaults to `UvCmColorMethod.ByColor` (RGB).
   */
  private _colorMethod: UvCmColorMethod

  /**
   * Internal value storing either:
   * - Packed RGB: (R << 16) | (G << 8) | B
   * - ACI color index
   * - Layer index
   */
  private _value: number

  /**
   * Constructs a new `UvCmEntityColor`.
   *
   * @param method Initial color method (defaults to `ByColor`)
   * @param value Internal packed value (defaults to `0`)
   */
  constructor(
    method: UvCmColorMethod = UvCmColorMethod.ByColor,
    value: number = 0
  ) {
    this._colorMethod = method
    this._value = value
  }

  /**
   * Gets the method used to determine the final color.
   */
  get colorMethod(): UvCmColorMethod {
    return this._colorMethod
  }

  /**
   * Sets the method used to determine the final color.
   */
  set colorMethod(method: UvCmColorMethod) {
    this._colorMethod = method
  }

  // ---------------------------------------------------------------------
  // RGB accessors
  // ---------------------------------------------------------------------

  /**
   * Gets the red component (0–255). Only valid when colorMethod = ByColor.
   */
  get red(): number {
    return (this._value >> 16) & 0xff
  }

  /**
   * Sets the red component and updates the packed RGB value.
   */
  set red(v: number) {
    this._colorMethod = UvCmColorMethod.ByColor
    this._value = (this._value & 0x00ffff) | ((v & 0xff) << 16)
  }

  /**
   * Gets the green component (0–255). Only valid when colorMethod = ByColor.
   */
  get green(): number {
    return (this._value >> 8) & 0xff
  }

  /**
   * Sets the green component and updates the packed RGB value.
   */
  set green(v: number) {
    this._colorMethod = UvCmColorMethod.ByColor
    this._value = (this._value & 0xff00ff) | ((v & 0xff) << 8)
  }

  /**
   * Gets the blue component (0–255). Only valid when colorMethod = ByColor.
   */
  get blue(): number {
    return this._value & 0xff
  }

  /**
   * Sets the blue component and updates the packed RGB value.
   */
  set blue(v: number) {
    this._colorMethod = UvCmColorMethod.ByColor
    this._value = (this._value & 0xffff00) | (v & 0xff)
  }

  /**
   * Sets all RGB components.
   *
   * @param r Red (0–255)
   * @param g Green (0–255)
   * @param b Blue (0–255)
   */
  setRGB(r: number, g: number, b: number): void {
    this._colorMethod = UvCmColorMethod.ByColor
    this._value = ((r & 0xff) << 16) | ((g & 0xff) << 8) | (b & 0xff)
  }

  // ---------------------------------------------------------------------
  // ACI accessors
  // ---------------------------------------------------------------------

  /**
   * Gets the AutoCAD Color Index (ACI). Only valid when colorMethod = ByACI.
   */
  get colorIndex(): number {
    return this._value
  }

  /**
   * Sets the AutoCAD Color Index (ACI).
   */
  set colorIndex(index: number) {
    this._colorMethod = UvCmColorMethod.ByACI
    this._value = index
  }

  // ---------------------------------------------------------------------
  // Layer index accessors
  // ---------------------------------------------------------------------

  /**
   * Gets the referenced layer index. Only valid when colorMethod = ByLayer.
   */
  get layerIndex(): number {
    return this._value
  }

  /**
   * Sets the layer index for ByLayer color mode.
   */
  set layerIndex(index: number) {
    this._colorMethod = UvCmColorMethod.ByLayer
    this._value = index
  }

  // ---------------------------------------------------------------------
  // Utility methods
  // ---------------------------------------------------------------------

  /**
   * Returns true if the color method is ByColor (explicit RGB).
   */
  isByColor(): boolean {
    return this._colorMethod === UvCmColorMethod.ByColor
  }

  /**
   * Returns true if the color method is ByLayer.
   */
  isByLayer(): boolean {
    return this._colorMethod === UvCmColorMethod.ByLayer
  }

  /**
   * Returns true if the color method is ByBlock.
   */
  isByBlock(): boolean {
    return this._colorMethod === UvCmColorMethod.ByBlock
  }

  /**
   * Returns true if the color method is ByACI.
   */
  isByACI(): boolean {
    return this._colorMethod === UvCmColorMethod.ByACI
  }

  /**
   * Returns true if color is uninitialized or invalid.
   */
  isNone(): boolean {
    return this._colorMethod === UvCmColorMethod.None
  }

  /**
   * Gets the packed internal value.
   *
   * - RGB → packed 24-bit integer
   * - ACI → index
   * - Layer → index
   */
  get rawValue(): number {
    return this._value
  }

  /**
   * Sets a raw internal value. The meaning depends on `colorMethod`.
   */
  set rawValue(v: number) {
    this._value = v
  }
}
