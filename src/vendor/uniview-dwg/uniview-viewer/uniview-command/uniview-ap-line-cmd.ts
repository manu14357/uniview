import { UvDbLine, UvGePoint3dLike } from '@uniview/data-model'

import { UvApContext, UvApDocManager } from '../uniview-app'
import {
  UvEdBaseView,
  UvEdCommand,
  UvEdOpenMode,
  UvEdPreviewJig,
  UvEdPromptPointOptions
} from '../uniview-editor'
import { UvApI18n } from '../uniview-i18n'

export class UvApLineJig extends UvEdPreviewJig<UvGePoint3dLike> {
  private _line: UvDbLine

  /**
   * Creates a line jig.
   *
   * @param view - The associated view
   */
  constructor(view: UvEdBaseView, start: UvGePoint3dLike) {
    super(view)
    this._line = new UvDbLine(start, start)
  }

  get entity(): UvDbLine {
    return this._line
  }

  update(point: UvGePoint3dLike) {
    this._line.endPoint = point
  }
}

/**
 * Command to create one line.
 */
export class UvApLineCmd extends UvEdCommand {
  constructor() {
    super()
    this.mode = UvEdOpenMode.Write
  }

  async execute(context: UvApContext) {
    const startPointPrompt = new UvEdPromptPointOptions(
      UvApI18n.t('jig.line.firstPoint')
    )
    const startPoint =
      await UvApDocManager.instance.editor.getPoint(startPointPrompt)

    const endPointPrompt = new UvEdPromptPointOptions(
      UvApI18n.t('jig.line.nextPoint')
    )
    endPointPrompt.useDashedLine = true
    endPointPrompt.jig = new UvApLineJig(context.view, startPoint)
    endPointPrompt.useDashedLine = true
    endPointPrompt.useBasePoint = true
    const endPoint =
      await UvApDocManager.instance.editor.getPoint(endPointPrompt)

    const db = context.doc.database
    const line = new UvDbLine(startPoint, endPoint)
    db.tables.blockTable.modelSpace.appendEntity(line)
  }
}
