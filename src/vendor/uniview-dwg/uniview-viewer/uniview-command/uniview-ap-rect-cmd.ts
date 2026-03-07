import {
  UvDbPolyline,
  UvGePoint2d,
  UvGePoint2dLike
} from '@uniview/data-model'

import { UvApContext, UvApDocManager } from '../uniview-app'
import {
  UvEdBaseView,
  UvEdCommand,
  UvEdOpenMode,
  UvEdPreviewJig,
  UvEdPromptPointOptions
} from '../uniview-editor'
import { UvApI18n } from '../uniview-i18n'

function updateRect(
  rect: UvDbPolyline,
  firstPoint: UvGePoint2dLike,
  secondPoint: UvGePoint2dLike
) {
  rect.reset(false)
  // Add four vertices to form a rectangle
  // First vertex: the first point (one corner)
  rect.addVertexAt(0, new UvGePoint2d(firstPoint))
  // Second vertex: same Y as first point, X from current point
  rect.addVertexAt(1, new UvGePoint2d(secondPoint.x, firstPoint.y))
  // Third vertex: the current point (opposite corner)
  rect.addVertexAt(2, new UvGePoint2d(secondPoint))
  // Fourth vertex: same X as first point, Y from current point
  rect.addVertexAt(3, new UvGePoint2d(firstPoint.x, secondPoint.y))
  rect.closed = true
}

export class UvApRectJig extends UvEdPreviewJig<UvGePoint2dLike> {
  private _rect: UvDbPolyline
  private _firstPoint: UvGePoint2d

  /**
   * Creates a line jig.
   *
   * @param view - The associated view
   */
  constructor(view: UvEdBaseView, start: UvGePoint2dLike) {
    super(view)
    this._rect = new UvDbPolyline()
    this._firstPoint = new UvGePoint2d(start)
  }

  get entity(): UvDbPolyline {
    return this._rect
  }

  update(secondPoint: UvGePoint2dLike) {
    updateRect(this._rect, this._firstPoint, secondPoint)
  }
}

/**
 * Command to create one rectangle.
 */
export class UvApRectCmd extends UvEdCommand {
  constructor() {
    super()
    this.mode = UvEdOpenMode.Write
  }

  async execute(context: UvApContext) {
    const firstPointPrompt = new UvEdPromptPointOptions(
      UvApI18n.t('jig.rect.firstPoint')
    )
    const firstPoint =
      await UvApDocManager.instance.editor.getPoint(firstPointPrompt)

    const secondPointPrompt = new UvEdPromptPointOptions(
      UvApI18n.t('jig.rect.nextPoint')
    )
    secondPointPrompt.jig = new UvApRectJig(context.view, firstPoint)
    secondPointPrompt.useDashedLine = false
    secondPointPrompt.useBasePoint = true
    const secondPoint =
      await UvApDocManager.instance.editor.getPoint(secondPointPrompt)

    const db = context.doc.database
    const rect = new UvDbPolyline()
    updateRect(rect, firstPoint, secondPoint)
    db.tables.blockTable.modelSpace.appendEntity(rect)
  }
}
