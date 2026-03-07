import { UvApAnnotation, UvApContext, UvApDocManager } from '../uniview-app'
import { UvEdCommand } from '../uniview-command'
import { UvEdPromptSelectionOptions } from '../uniview-editor/uniview-input/uniview-prompt'
import { UvEdOpenMode } from '../uniview-editor/uniview-view'
import { UvApI18n } from '../uniview-i18n'

/**
 * Command to delete selected objects from the drawing.
 */
export class UvApEraseCmd extends UvEdCommand {
  constructor() {
    super()
    this.mode = UvEdOpenMode.Review
  }

  /**
   * Executes the command to delete selected objects from the drawing
   *
   * @param context - The current application context
   */
  async execute(context: UvApContext) {
    const selectionSet = context.view.selectionSet
    const annotation = new UvApAnnotation(context.doc.database)
    if (selectionSet.count > 0) {
      // If it is in review mode, annotation entities can be deleted only
      const ids =
        context.doc.openMode == UvEdOpenMode.Review
          ? annotation.filterAnnotationEntities(selectionSet.ids)
          : selectionSet.ids
      context.doc.database.tables.blockTable.removeEntity(ids)
      selectionSet.clear()
    } else {
      const message = UvApI18n.sysCmdPrompt('erase')
      const options = new UvEdPromptSelectionOptions(message)
      let ids = await UvApDocManager.instance.editor.getSelection(options)
      if (ids && ids.length > 0) {
        // If it is in review mode, annotation entities can be deleted only
        if (context.doc.openMode == UvEdOpenMode.Review)
          ids = annotation.filterAnnotationEntities(selectionSet.ids)
        context.doc.database.tables.blockTable.removeEntity(ids)
        selectionSet.clear()
      }
    }
  }
}
