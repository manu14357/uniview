import {
  UvGeEllipseArc3d,
  UvGeMathUtil,
  UvGeVector3d
} from '@uniview/data-model'

import { UvSvgEntity } from './uniview-svg-entity'

/**
 * @deprecated Use {@link UvSvgEllipticalArc} instead.
 */
export const UvTrEllipticalArc = undefined as unknown as typeof UvSvgEllipticalArc

export class UvSvgEllipticalArc extends UvSvgEntity {
  constructor(ellipseArc: UvGeEllipseArc3d) {
    super()
    if (ellipseArc.closed) {
      // TODO: Considering rotation
      this.svg = `\n<ellipse cx="${ellipseArc.center.x}" cy="${ellipseArc.center.y}" rx="${ellipseArc.majorAxisRadius}" ry="${ellipseArc.minorAxisRadius}"/>`
    } else {
      const start = ellipseArc.startPoint
      const end = ellipseArc.endPoint

      // Calculate sweepFlag
      const xAxisRotation = UvGeMathUtil.radToDeg(
        ellipseArc.majorAxis.angleTo(UvGeVector3d.X_AXIS)
      )
      const sweepFlag = ellipseArc.clockwise ? 0 : 1
      this.svg = `\n<path d="M${start.x},${start.y} A${ellipseArc.majorAxisRadius},${ellipseArc.minorAxisRadius} ${xAxisRotation} ${ellipseArc.isLargeArc},${sweepFlag} ${end.x},${end.y}"/>`
    }
    const box = ellipseArc.box
    this._box.min.copy(box.min)
    this._box.max.copy(box.max)
  }
}
