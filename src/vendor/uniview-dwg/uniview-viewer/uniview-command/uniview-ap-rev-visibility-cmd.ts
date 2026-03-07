import { UvApAnnotation, UvApContext } from '../uniview-app'
import { UvEdOpenMode } from '../uniview-editor'
import { UvApBaseRevCmd } from './uniview-ap-base-rev-cmd'

/**
 * Command for switching the visibility of the current layer.
 */
export class UvApRevVisibilityCmd extends UvApBaseRevCmd {
  constructor() {
    super()
    this.mode = UvEdOpenMode.Review
    this.isShowEntityDrawStyleToolbar = false
  }

  /**
   * Executes the command to switch the visibility of the current layer.
   *
   * @param context - The application context containing the view
   */
  async execute(context: UvApContext) {
    const db = context.doc.database
    const annotation = new UvApAnnotation(db)
    const annotationLayer = annotation.getAnnotationLayer()
    if (annotationLayer) {
      const layer = db.tables.layerTable.getAt(annotationLayer)
      if (layer) layer.isOff = !layer.isOff
    }
  }
}
