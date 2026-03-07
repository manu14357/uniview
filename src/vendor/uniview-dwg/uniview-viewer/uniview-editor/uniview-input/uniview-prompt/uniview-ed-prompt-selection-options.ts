import { UvEdPromptOptions } from './uniview-ed-prompt-options'

/**
 * Represents prompt options for one selection set
 * Mirrors `Autodesk.AutoCAD.EditorInput.PromptSelectionOptions`.
 */
export class UvEdPromptSelectionOptions extends UvEdPromptOptions<string> {
  /** Whether to force single object selection only */
  private _singleOnly = false

  constructor(message: string) {
    super(message)
  }

  /**
   * Gets or sets whether to force single object selection only
   */
  get singleOnly(): boolean {
    return this._singleOnly
  }

  set singleOnly(value: boolean) {
    this._singleOnly = value
  }
}
