import { UvGePoint2dLike } from '@uniview/data-model'

/**
 * Describes the raw text values from the X and Y fields in {@link UvEdFloatingInput}.
 */
export interface UvEdFloatingInputRawData {
  /** Raw text value in the X input box */
  x: string
  /** Raw text value in the Y input box */
  y?: string
}

export interface UvEdFloatingInputDynamicValue<T> {
  /** Parsed data value */
  value: T
  /** Raw text values set to the X and Y fields in {@link UvEdFloatingInput}. */
  raw: UvEdFloatingInputRawData
}

/**
 * Describes the output of a validation operation performed on the user-typed
 * raw text values from the X and Y fields in {@link UvEdFloatingInput}.
 */
export interface UvEdFloatingInputValidationResult<T> {
  /** Parsed data value */
  value?: T
  /** Whether the validation succeeded. */
  isValid: boolean
}

/**
 * A callback capable of validating the raw textual contents of the X and Y
 * input fields.
 *
 * The caller receives two raw strings:
 * - `x`: raw string in the X textbox
 * - `y`: raw string in the Y textbox, or `null` if Y input is disabled
 *
 * The callback should parse these strings and determine whether the input set
 * is valid. It then returns an {@link UvEdFloatingInputValidationResult}.
 */
export type UvEdFloatingInputValidationCallback<T> = (
  raw: UvEdFloatingInputRawData
) => UvEdFloatingInputValidationResult<T>

/**
 * Callback invoked when the user confirms input via the Enter key.
 * Receives the parsed (and validated) X and Y values.
 *
 * When `twoInputs` is `false`, Y will always be `null`.
 */
export type UvEdFloatingInputCommitCallback<T> = (
  value: T,
  pos?: UvGePoint2dLike
) => boolean

/**
 * Callback invoked whenever the user edits either input field.
 *
 * Called only after validation (custom or built-in). Useful for dynamic
 * real-time preview, updating temporary graphics, or displaying error states.
 */
export type UvEdFloatingInputChangeCallback<T> = (
  state: UvEdFloatingInputValidationResult<T>
) => void

/**
 * Callback invoked when input box closes due to user cancelling,
 * typically by pressing Escape or programmatically via `hide()`.
 */
export type UvEdFloatingInputCancelCallback = () => void

/**
 * Callback invoked on mousemove to update the preview geometry.
 */
export type UvEdFloatingInputDrawPreviewCallback = (
  pos: UvGePoint2dLike
) => void

/**
 * Callback used to dynamically compute input values for the floating input fields.
 */
export type UvEdFloatingInputDynamicValueCallback<T> = (
  pos: UvGePoint2dLike
) => UvEdFloatingInputDynamicValue<T>

/**
 * The number of input boxes shown in floating input UI
 */
export type UvEdFloatingInputBoxCount = 0 | 1 | 2

/**
 * Construction options for {@link UvEdFloatingInput}.
 */
export interface UvEdFloatingInputOptions<T> {
  /**
   * Optional parent element to constrain the floating input within.
   * If not provided, mouse tracking is bound to the view canvas.
   * Floating UI is always mounted inside the view container.
   */
  parent?: HTMLElement

  /**
   * If 2, display both X and Y inputs.
   * If 1, display only X input (useful for distance, angle, etc.).
   * if 0, display message only and no input box
   *
   * Default: 2
   */
  inputCount?: UvEdFloatingInputBoxCount

  /**
   * A message or hint displayed above the input fields.
   * Useful for describing expected input (e.g., "Specify next point").
   */
  message?: string

  /**
   * The flag to indicate whether to disable osnap.
   */
  disableOSnap?: boolean

  /**
   * The base point used to draw rubber band or base line
   */
  basePoint?: UvGePoint2dLike | undefined

  /**
   * The flag to indicate whether to show base line only instead of showing the whole
   * rubber band. The flog takes effect only if 'basePoint' is specified in options.
   */
  showBaseLineOnly?: boolean

  /**
   * Custom validation function.
   */
  validate: UvEdFloatingInputValidationCallback<T>

  /**
   * Optional callback to dynamically compute values for X/Y inputs.
   * Called whenever the input is empty and the mouse moves, providing
   * context-dependent defaults for the user.
   */
  getDynamicValue: UvEdFloatingInputDynamicValueCallback<T>

  /**
   * Callback invoked on mousemove to update the preview geometry.
   */
  drawPreview?: UvEdFloatingInputDrawPreviewCallback

  /**
   * Callback invoked when user confirms valid input by pressing Enter.
   */
  onCommit?: UvEdFloatingInputCommitCallback<T>

  /**
   * Callback invoked on each input event after validation completes.
   */
  onChange?: UvEdFloatingInputChangeCallback<T>

  /**
   * Callback invoked on cancellation (Escape or hide()).
   */
  onCancel?: UvEdFloatingInputCancelCallback
}
