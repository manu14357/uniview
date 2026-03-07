import { UvEdKeywordHandler } from '../uniview-handler/uniview-ed-keyword-handler'
import { UvEdPromptKeywordOptions } from '../uniview-prompt/uniview-ed-prompt-keyword-options'
import { UvEdCommandLine } from '../uniview-ui/uniview-ed-command-line'
import { UvEdInputSession } from './uniview-ed-input-session'

export class UvEdKeywordSession extends UvEdInputSession<string> {
  private handler: UvEdKeywordHandler

  constructor(
    private cli: UvEdCommandLine,
    private options: UvEdPromptKeywordOptions
  ) {
    super()
    this.handler = new UvEdKeywordHandler(options)
  }

  protected onStart(): void {
    this.cli.clearInput()
    this.cli.renderKeywordPrompt(this.options, kw => this.finish(kw))
    this.cli.focusInput()
  }

  handleEnter(value: string): boolean {
    const parsed = this.handler.parse(value)
    if (parsed !== null) {
      this.finish(parsed)
      return true
    }
    return false
  }

  handleEscape(): void {
    this.finish('')
  }

  protected cleanup(): void {
    this.cli.clear()
  }
}
