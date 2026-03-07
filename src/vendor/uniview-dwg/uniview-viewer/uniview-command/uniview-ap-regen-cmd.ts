import { UvApDocManager } from '../uniview-app'
import { UvEdCommand } from '.'

/**
 * Command to redraw the current drawing in the CAD viewer.
 *
 * This command redraws the current drawing. It can be used after users set font
 * mapping for missed fonts so that the current drawing can display texts with
 * correct fonts.
 *
 * @example
 * ```typescript
 * const regenCmd = new UvApRegenCmd();
 * regenCmd.execute(context); // Redraw the current drawing
 * ```
 */
export class UvApRegenCmd extends UvEdCommand {
  /**
   * Executes the regen command to redraw the current drawing
   */
  async execute() {
    UvApDocManager.instance.regen()
  }
}
