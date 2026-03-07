import { UvEdPromptAngleOptions } from '../uniview-prompt/uniview-ed-prompt-angle-options'
import { UvEdInputHandler } from './uniview-ed-input-handler'

/**
 * Validates angular numeric input.
 * Uses degrees. Fully compatible with PromptAngleOptions behavior in AutoCAD.
 */
export class UvEdAngleHandler implements UvEdInputHandler<number> {
  private options: UvEdPromptAngleOptions // same structure as double options

  constructor(options: UvEdPromptAngleOptions) {
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
