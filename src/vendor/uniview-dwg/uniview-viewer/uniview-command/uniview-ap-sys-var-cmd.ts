import { UvDbSysVarManager } from '@uniview/data-model'

import { UvApContext, UvApDocManager } from '../uniview-app'
import { UvEdCommand, UvEdOpenMode, UvEdPromptStringOptions } from '../uniview-editor'
import { UvApI18n } from '../uniview-i18n'

/**
 * Command for modifying value of one system variable. All of system variables share
 * this command.
 */
export class UvApSysVarCmd extends UvEdCommand {
  constructor() {
    super()
    this.mode = UvEdOpenMode.Review
  }

  /**
   * Executes the command to modify the value of one system variable.
   *
   * @param context - The application context containing the view
   */
  async execute(context: UvApContext) {
    const prompt = new UvEdPromptStringOptions(UvApI18n.t('jig.sysvar.prompt'))
    const value = await UvApDocManager.instance.editor.getString(prompt)
    const sysVarManager = UvDbSysVarManager.instance()
    const sysVar = sysVarManager.getDescriptor(this.globalName)
    if (sysVar) {
      sysVarManager.setVar(this.globalName, value, context.doc.database)
    }
  }
}
