import { UvEdPromptStringOptions } from '../uniview-prompt/uniview-ed-prompt-string-options'
import { UvEdInputHandler } from './uniview-ed-input-handler'

/**
 * Validates string input according to {@link UvEdPromptStringOptions}.
 * Supports empty string rules and maximum length.
 */
export class UvEdStringHandler implements UvEdInputHandler<string> {
  private options: UvEdPromptStringOptions

  constructor(options: UvEdPromptStringOptions) {
    this.options = options
  }

  parse(value: string) {
    if (!this.options.allowSpaces && value.includes(' ')) {
      return null
    }

    if (!this.options.allowEmpty && value.length === 0) {
      return null
    }

    if (this.options.maxLength && value.length > this.options.maxLength) {
      return null
    }

    return value
  }
}
