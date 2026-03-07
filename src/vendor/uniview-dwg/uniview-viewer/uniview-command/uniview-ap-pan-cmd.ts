import { UvApContext } from '../uniview-app'
import { UvEdCommand } from '../uniview-command'
import { UvEdCorsorType, UvEdViewMode } from '../uniview-editor'

/**
 * Command for enabling pan mode in the CAD viewer.
 *
 * This command switches the view to pan mode, allowing users to drag
 * and move the drawing around the canvas. When executed, it:
 * - Sets the view mode to PAN
 * - Changes the cursor to a grab cursor for visual feedback
 *
 * Pan mode allows users to click and drag to move the viewport,
 * providing an intuitive way to navigate large drawings.
 *
 * @example
 * ```typescript
 * const panCmd = new UvApPanCmd();
 * panCmd.execute(context); // Enables pan mode
 * ```
 */
export class UvApPanCmd extends UvEdCommand {
  /**
   * Executes the pan command.
   *
   * Sets the view to pan mode and updates the cursor appearance
   * to indicate that panning is active.
   *
   * @param context - The application context containing the view
   */
  async execute(context: UvApContext) {
    context.view.mode = UvEdViewMode.PAN
    context.view.setCursor(UvEdCorsorType.Grab)
  }
}
