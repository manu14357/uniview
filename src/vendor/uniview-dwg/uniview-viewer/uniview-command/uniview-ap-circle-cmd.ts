import { UvDbCircle, UvGePoint3dLike } from '@uniview/data-model'

import { UvApContext, UvApDocManager } from '../uniview-app'
import {
  UvEdBaseView,
  UvEdCommand,
  UvEdOpenMode,
  UvEdPreviewJig,
  UvEdPromptDistanceOptions,
  UvEdPromptPointOptions
} from '../uniview-editor'
import { UvApI18n } from '../uniview-i18n'

export class UvApCircleJig extends UvEdPreviewJig<number> {
  private _circle: UvDbCircle

  /**
   * Creates a circle jig.
   *
   * @param view - The associated view
   */
  constructor(view: UvEdBaseView, center: UvGePoint3dLike) {
    super(view)
    this._circle = new UvDbCircle(center, 0)
  }

  get entity(): UvDbCircle {
    return this._circle
  }

  update(radius: number) {
    this._circle.radius = radius
  }
}

/**
 * Command to create one circle.
 */
export class UvApCircleCmd extends UvEdCommand {
  constructor() {
    super()
    this.mode = UvEdOpenMode.Write
  }

  async execute(context: UvApContext) {
    const centerPrompt = new UvEdPromptPointOptions(
      UvApI18n.t('jig.circle.center')
    )
    const center = await UvApDocManager.instance.editor.getPoint(centerPrompt)

    const radiusPrompt = new UvEdPromptDistanceOptions(
      UvApI18n.t('jig.circle.radius')
    )
    radiusPrompt.jig = new UvApCircleJig(context.view, center)
    const radius =
      await UvApDocManager.instance.editor.getDistance(radiusPrompt)

    const db = context.doc.database
    const circle = new UvDbCircle(center, radius)
    db.tables.blockTable.modelSpace.appendEntity(circle)
  }
}
