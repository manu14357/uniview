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

// Cloud line diameter in pixels
const CLOUD_DIAMETER_PIXELS = 8

/**
 * Converts pixel distance to world distance using view transformation
 */
function pixelToWorldDistance(
  view: UvEdBaseView,
  pixelDistance: number,
  referencePoint: UvGePoint2dLike
): number {
  const screenPoint1 = view.worldToScreen(referencePoint)
  const screenPoint2 = new UvGePoint2d(
    screenPoint1.x + pixelDistance,
    screenPoint1.y
  )
  const worldPoint2 = view.screenToWorld(screenPoint2)
  return Math.abs(worldPoint2.x - referencePoint.x)
}

/**
 * Creates a cloud line (revision cloud) along a rectangular path
 */
function updateCloud(
  cloud: UvDbPolyline,
  firstPoint: UvGePoint2dLike,
  secondPoint: UvGePoint2dLike,
  view: UvEdBaseView
) {
  // Reset the polyline (using type assertion as reset may not be in type definitions)
  cloud.reset(false)

  // Calculate rectangle dimensions
  const minX = Math.min(firstPoint.x, secondPoint.x)
  const maxX = Math.max(firstPoint.x, secondPoint.x)
  const minY = Math.min(firstPoint.y, secondPoint.y)
  const maxY = Math.max(firstPoint.y, secondPoint.y)

  const width = maxX - minX
  const height = maxY - minY

  // Convert cloud diameter from pixels to world coordinates
  const centerPoint = new UvGePoint2d((minX + maxX) / 2, (minY + maxY) / 2)
  const cloudDiameter = pixelToWorldDistance(
    view,
    CLOUD_DIAMETER_PIXELS,
    centerPoint
  )

  // Calculate chord length for each arc segment
  // Each arc segment should span approximately the cloud diameter
  const chordLength = cloudDiameter

  // Calculate the number of segments needed along each edge
  const numSegmentsX = Math.max(4, Math.ceil(width / chordLength) * 2)
  const numSegmentsY = Math.max(4, Math.ceil(height / chordLength) * 2)

  // Generate points along the rectangle path with arcs
  const points: UvGePoint2d[] = []
  const bulges: (number | undefined)[] = []
  let segmentIndex = 0

  // Helper function to calculate bulge for a small arc
  // For cloud effect, use a small bulge value to create gentle arcs
  // A bulge of 0.3-0.5 creates nice cloud-like arcs
  const calculateBulge = (outward: boolean): number => {
    return outward ? 0.4 : -0.4
  }

  // Bottom edge (left to right)
  for (let i = 0; i <= numSegmentsX; i++) {
    const t = i / numSegmentsX
    const x = minX + width * t
    const y = minY
    points.push(new UvGePoint2d(x, y))

    if (i < numSegmentsX) {
      const outward = segmentIndex % 2 === 0
      bulges.push(calculateBulge(outward))
      segmentIndex++
    } else {
      bulges.push(undefined)
    }
  }

  // Right edge (bottom to top)
  for (let i = 1; i <= numSegmentsY; i++) {
    const t = i / numSegmentsY
    const x = maxX
    const y = minY + height * t
    points.push(new UvGePoint2d(x, y))

    if (i < numSegmentsY) {
      const outward = segmentIndex % 2 === 0
      bulges.push(calculateBulge(outward))
      segmentIndex++
    } else {
      bulges.push(undefined)
    }
  }

  // Top edge (right to left)
  for (let i = 1; i <= numSegmentsX; i++) {
    const t = 1 - i / numSegmentsX
    const x = minX + width * t
    const y = maxY
    points.push(new UvGePoint2d(x, y))

    if (i < numSegmentsX) {
      const outward = segmentIndex % 2 === 0
      bulges.push(calculateBulge(outward))
      segmentIndex++
    } else {
      bulges.push(undefined)
    }
  }

  // Left edge (top to bottom)
  for (let i = 1; i < numSegmentsY; i++) {
    const t = 1 - i / numSegmentsY
    const x = minX
    const y = minY + height * t
    points.push(new UvGePoint2d(x, y))

    if (i < numSegmentsY - 1) {
      const outward = segmentIndex % 2 === 0
      bulges.push(calculateBulge(outward))
      segmentIndex++
    } else {
      bulges.push(undefined)
    }
  }

  // Add vertices to polyline with bulge values
  for (let i = 0; i < points.length; i++) {
    const bulge = bulges[i]
    cloud.addVertexAt(i, points[i], bulge)
  }

  cloud.closed = true
}

export class UvApRevCloudJig extends UvEdPreviewJig<UvGePoint2dLike> {
  private _cloud: UvDbPolyline
  private _firstPoint: UvGePoint2d
  private _view: UvEdBaseView

  /**
   * Creates a cloud line jig.
   *
   * @param view - The associated view
   * @param start - The first corner point
   */
  constructor(view: UvEdBaseView, start: UvGePoint2dLike) {
    super(view)
    this._cloud = new UvDbPolyline()
    this._firstPoint = new UvGePoint2d(start)
    this._view = view
  }

  get entity(): UvDbPolyline {
    return this._cloud
  }

  update(secondPoint: UvGePoint2dLike) {
    updateCloud(this._cloud, this._firstPoint, secondPoint, this._view)
  }
}

/**
 * Command to create a revision cloud (cloud line) in rectangular shape.
 */
export class UvApRevCloudCmd extends UvApBaseRevCmd {
  constructor() {
    super()
    this.mode = UvEdOpenMode.Review
  }

  async execute(context: UvApContext) {
    const firstPointPrompt = new UvEdPromptPointOptions(
      UvApI18n.t('jig.line.firstPoint')
    )
    const firstPoint =
      await UvApDocManager.instance.editor.getPoint(firstPointPrompt)

    const secondPointPrompt = new UvEdPromptPointOptions(
      UvApI18n.t('jig.line.nextPoint')
    )
    secondPointPrompt.jig = new UvApRevCloudJig(context.view, firstPoint)
    secondPointPrompt.useDashedLine = false
    secondPointPrompt.useBasePoint = true
    const secondPoint =
      await UvApDocManager.instance.editor.getPoint(secondPointPrompt)

    const db = context.doc.database
    const cloud = new UvDbPolyline()
    updateCloud(cloud, firstPoint, secondPoint, context.view)
    db.tables.blockTable.modelSpace.appendEntity(cloud)
  }
}
