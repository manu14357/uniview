import { UvDbSysVarManager } from '@uniview/data-model'

import { UvApContext } from '../uniview-app'
import { UvEdCommand } from '../uniview-editor'

/**
 * Command for switching the drawing background between white and black.
 */
export class UvApSwitchBgCmd extends UvEdCommand {
  /**
   * Executes the command to switch the drawing background between white and black.
   *
   * @param context - The application context containing the view
   */
  async execute(context: UvApContext) {
    const variableName = 'WHITEBKCOLOR'
    const sysVarManager = UvDbSysVarManager.instance()
    const sysVar = sysVarManager.getDescriptor(variableName)
    if (sysVar) {
      const db = context.doc.database
      const useWhiteBackgroundColor = sysVarManager.getVar(
        variableName,
        db
      ) as boolean
      sysVarManager.setVar(variableName, !useWhiteBackgroundColor, db)
    }
  }
}
