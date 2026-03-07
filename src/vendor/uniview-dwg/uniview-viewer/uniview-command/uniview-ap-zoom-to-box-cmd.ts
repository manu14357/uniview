import { UvApContext, UvApDocManager } from '../uniview-app'
import { UvEdCommand } from '../uniview-command'

/**
 * Command for zooming to a user-selected rectangular area.
 *
 * This command initiates an interactive zoom-to-box operation where:
 * - User selects a rectangular area by dragging
 * - The view zooms to fit the selected area
 * - The zoom level is adjusted to show the entire selected region
 *
 * This provides precise navigation control, allowing users to quickly
 * focus on specific areas of large drawings.
 *
 * @example
 * ```typescript
 * const zoomToBoxCmd = new UvApZoomToBoxCmd();
 * await zoomToBoxCmd.execute(context); // User selects area to zoom to
 * ```
 */
export class UvApZoomToBoxCmd extends UvEdCommand {
  /**
   * Executes the zoom-to-box command.
   *
   * @param context - The application context containing the view
   * @returns Promise that resolves when the zoom operation completes
   */
  async execute(context: UvApContext) {
    const box = await UvApDocManager.instance.editor.getBox()
    return context.view.zoomTo(box, 1)
  }
}
