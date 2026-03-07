import {
  UvDbPolyline,
  UvGePoint2d,
  UvGePoint2dLike
} from '@uniview/data-model'

import { UvApContext, UvApDocManager } from '../uniview-app'
import {
  UvEdBaseView,
  UvEdOpenMode,
  UvEdPreviewJig,
  UvEdPromptPointOptions
} from '../uniview-editor'
import { UvApI18n } from '../uniview-i18n'
import { UvApBaseRevCmd } from './uniview-ap-base-rev-cmd'

// Minimum distance between points to add a new vertex (in world units)
const MIN_DISTANCE = 0.1

/**
 * Calculates the distance between two points
 */
function distance(p1: UvGePoint2dLike, p2: UvGePoint2dLike): number {
  const dx = p2.x - p1.x
  const dy = p2.y - p1.y
  return Math.sqrt(dx * dx + dy * dy)
}

export class UvApSketchJig extends UvEdPreviewJig<UvGePoint2dLike> {
  private _polyline: UvDbPolyline
  private _points: UvGePoint2d[]
  private _lastPoint: UvGePoint2d | null = null

  /**
   * Creates a sketch jig.
   *
   * @param view - The associated view
   * @param start - The first point
   */
  constructor(view: UvEdBaseView, start: UvGePoint2dLike) {
    super(view)
    this._polyline = new UvDbPolyline()
    this._points = [new UvGePoint2d(start)]
    this._lastPoint = new UvGePoint2d(start)

    // Add the first point to the polyline
    this._polyline.addVertexAt(0, this._points[0])
  }

  get entity(): UvDbPolyline {
    return this._polyline
  }

  /**
   * Gets all accumulated points
   */
  get points(): UvGePoint2d[] {
    return this._points
  }

  update(currentPoint: UvGePoint2dLike) {
    if (this._lastPoint === null) {
      return
    }

    const current = new UvGePoint2d(currentPoint)
    const dist = distance(this._lastPoint, current)

    // Only add a new point if the distance is significant enough
    if (dist >= MIN_DISTANCE) {
      this._points.push(current)
      this._lastPoint = current
      this._polyline.addVertexAt(this._points.length, current)
    }
  }
}

/**
 * Command to create a sketch line using polyline.
 * After specifying the first point, continuously tracks mouse movement
 * and adds points to the polyline until the user specifies the second point.
 */
export class UvApSketchCmd extends UvApBaseRevCmd {
  constructor() {
    super()
    this.mode = UvEdOpenMode.Review
  }

  async execute(context: UvApContext) {
    const firstPointPrompt = new UvEdPromptPointOptions(
      UvApI18n.t('jig.sketch.firstPoint')
    )
    const firstPoint =
      await UvApDocManager.instance.editor.getPoint(firstPointPrompt)

    const jig = new UvApSketchJig(context.view, firstPoint)

    const secondPointPrompt = new UvEdPromptPointOptions(
      UvApI18n.t('jig.sketch.nextPoint')
    )
    secondPointPrompt.jig = jig
    secondPointPrompt.useDashedLine = false
    secondPointPrompt.useBasePoint = true
    const secondPoint =
      await UvApDocManager.instance.editor.getPoint(secondPointPrompt)

    // Always add the final point
    const points = jig.points
    const lastPoint = points[points.length - 1]
    const finalPoint = new UvGePoint2d(secondPoint)

    // Only add if it's different from the last point
    if (distance(lastPoint, finalPoint) > 0.01) {
      points.push(finalPoint)
    }

    // Create the final polyline
    const db = context.doc.database
    const polyline = new UvDbPolyline()
    for (let i = 0; i < points.length; i++) {
      polyline.addVertexAt(i, points[i])
    }
    db.tables.blockTable.modelSpace.appendEntity(polyline)
  }
}
