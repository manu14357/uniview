import { UvGePoint2dLike } from '@uniview/data-model'

import { UvEdPromptResult } from './uniview-ed-prompt-result'
import { UvEdPromptStatus } from './uniview-ed-prompt-status'

/**
 * Result of a prompt that requests a **point**.
 *
 * This mirrors `Autodesk.AutoCAD.EditorInput.PromptPointResult`.
 */
export class UvEdPromptPointResult extends UvEdPromptResult {
  /**
   * The 3D point returned by the prompt.
   * Corresponds to .NET's `PromptPointResult.Value`.
   *
   * Valid only when `status === UvEdPromptStatus.OK`.
   */
  readonly value?: UvGePoint2dLike

  /**
   * Constructs a new result for a point prompt.
   *
   * @param status The status of the prompt (OK, Cancel, Error, etc.)
   * @param value The point returned (valid only on OK)
   */
  constructor(status: UvEdPromptStatus, value?: UvGePoint2dLike) {
    super(status, undefined)
    this.value = value
  }
}
