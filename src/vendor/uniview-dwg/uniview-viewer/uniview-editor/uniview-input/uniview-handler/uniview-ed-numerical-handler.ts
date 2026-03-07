import { UvEdPromptNumericalOptions } from '../uniview-prompt/uniview-ed-prompt-numerical-options'
import { UvEdInputHandler } from './uniview-ed-input-handler'

/**
 * Handles validation and parsing of numerical user input.
 */
export class UvEdNumericalHandler implements UvEdInputHandler<number> {
  protected options: UvEdPromptNumericalOptions

  constructor(options: UvEdPromptNumericalOptions) {
    this.options = options
  }

  parse(value: string) {
    const n = Number(value)

    if (isNaN(n)) {
      return null
    }

    if (!this.options.allowNegative && n < 0) {
      return null
    }

    if (!this.options.allowZero && n === 0) {
      return null
    }

    return n
  }
}
