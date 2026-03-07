import { UvEdPromptIntegerOptions } from '../uniview-prompt/uniview-ed-prompt-integer-options'
import { UvEdNumericalHandler } from './uniview-ed-numerical-handler'

/**
 * Handles validation and parsing of integer user input.
 */
export class UvEdIntegerHandler extends UvEdNumericalHandler {
  declare protected options: UvEdPromptIntegerOptions

  constructor(options: UvEdPromptIntegerOptions) {
    super(options)
  }

  parse(value: string) {
    const n = super.parse(value)
    if (n == null) {
      return n
    }

    if (!Number.isInteger(n)) {
      return null
    }

    if (this.options.lowerLimit !== undefined && n < this.options.lowerLimit) {
      return null
    }

    if (this.options.upperLimit !== undefined && n > this.options.upperLimit) {
      return null
    }

    return n
  }
}
