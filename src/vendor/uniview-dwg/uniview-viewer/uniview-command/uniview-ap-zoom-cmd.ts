import { UvApContext } from '../uniview-app'
import { UvEdCommand } from '../uniview-command'

/**
 * Command to zoom the view to fit all visible entities.
 *
 * This command adjusts the view's zoom level and position to show all
 * visible entities in the current drawing within the viewport. It's
 * equivalent to the "Zoom Extents" or "Fit to Window" functionality
 * found in most CAD applications.
 *
 * The command calculates the bounding box of all visible entities and
 * adjusts the camera to show them all with appropriate padding.
 *
 * @example
 * ```typescript
 * const zoomCommand = new UvApZoomCmd();
 * zoomCommand.globalName = 'ZOOM';
 * zoomCommand.localName = 'Zoom to Fit';
 *
 * // Execute the command to fit all entities in view
 * zoomCommand.trigger(docManager.context);
 * ```
 */
export class UvApZoomCmd extends UvEdCommand {
  /**
   * Executes the zoom to fit command.
   *
   * Calls the view's `zoomToFit()` method to adjust the camera position
   * and zoom level to display all visible entities within the viewport.
   *
   * @param context - The current application context containing the view to zoom
   */
  async execute(context: UvApContext) {
    context.view.zoomToFitDrawing()
  }
}
