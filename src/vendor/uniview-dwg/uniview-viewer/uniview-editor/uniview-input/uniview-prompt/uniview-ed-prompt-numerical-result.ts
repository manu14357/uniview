import { UvEdPromptResult } from './uniview-ed-prompt-result'
import { UvEdPromptStatus } from './uniview-ed-prompt-status'

/**
 * Result of a prompt that requests a double or integer numeric value.
 */
export class UvEdPromptNumericalResult extends UvEdPromptResult {
  /**
   * The numeric value returned by the prompt.
   */
  readonly value?: number

  /**
   * Constructs a new result for a double-value or integer-value prompt.
   *
   * @param status The status of the prompt (OK, Cancel, Error, etc.)
   * @param value The numeric value returned (only meaningful when OK)
   */
  constructor(status: UvEdPromptStatus, value?: number) {
    super(status, undefined)
    this.value = value
  }
}
