import { UvCmErrors } from '@uniview/common'

import {
  UvGeBox2d,
  UvGeMatrix2d,
  UvGePoint2d,
  UvGePoint3d,
  UvGePointLike
} from '../uniview-math'
import { UvGeMathUtil, TAU } from '../uniview-util'
import { UvGeCurve2d } from './uniview-ge-curve2d'

/**
 * Class representing a 2d ellipse arc defined by center, majorAxisRadius, minorAxisRadius,
 * startAngle, endAngle, and rotation.
 * - The major axis vector represents half the major axis of the ellipse (that is, from the center
 * point to the start point of the ellipse) and is the zero angle for startAngle and endAngle.
 * - Positive angles are counter-clockwise. A startAngle of 0 and endAngle of 2pi will produce a
 * closed Ellipse.
 * - If startAngle is equal to 0 and endAngle is equal to 2 * Math.PI, it represents a full 2d ellipse.
 */
export class UvGeEllipseArc2d extends UvGeCurve2d {
  // Center of the ellipse in 3d space
  private _center!: UvGePoint3d
  // Major axis radius of the ellipse
  private _majorAxisRadius!: number
  // Minor axis radius of the ellipse
  private _minorAxisRadius!: number
  // Start angle of the ellipse arc in radians
  private _startAngle!: number
  // End angle of the ellipse arc in radians
  private _endAngle!: number
  // The flag Whether the ellipse arc is drawn clockwise. Default is false.
  private _clockwise!: boolean
  // The rotation angle of the ellipse in radians, counterclockwise from the positive X axis (optional).
  // Default is 0.
  private _rotation!: number

  /**
   * Construct an instance of the ellipse arc.
   * @param center Center point of the ellipse.
   * @param majorAxisRadius Major axis radius of the ellipse.
   * @param minorAxisRadius Minor axis radius of the ellipse.
   * @param startAngle Start angle of the ellipse arc in radians.
   * @param endAngle End angle of the ellipse arc in radians.
   * @param clockwise The flag Whether the ellipse arc is drawn clockwise. Default is false.
   * @param rotation The rotation angle of the ellipse in radians, counterclockwise from the positive X
   * axis (optional). Default is 0.
   */
  constructor(
    center: UvGePointLike,
    majorAxisRadius: number,
    minorAxisRadius: number,
    startAngle: number = 0,
    endAngle: number = TAU,
    clockwise: boolean = false,
    rotation: number = 0
  ) {
    super()
    this.center = center
    this.majorAxisRadius = majorAxisRadius
    this.minorAxisRadius = minorAxisRadius
    // Check whether it is a full ellipse
    if ((endAngle - startAngle) % TAU == 0) {
      this.startAngle = 0
      this.endAngle = TAU
    } else {
      this.startAngle = startAngle
      this.endAngle = endAngle
    }
    this.clockwise = clockwise
    this.rotation = rotation
  }

  /**
   * Center of the ellipse in 3d space
   */
  get center(): UvGePoint3d {
    return this._center
  }
  set center(value: UvGePointLike) {
    this._center = new UvGePoint3d(value.x, value.y, value.z || 0)
    this._boundingBoxNeedsUpdate = true
  }

  /**
   * Major axis radius of the ellipse
   */
  get majorAxisRadius(): number {
    return this._majorAxisRadius
  }
  set majorAxisRadius(value: number) {
    if (value < 0) throw UvCmErrors.ILLEGAL_PARAMETERS
    this._majorAxisRadius = value
    this._boundingBoxNeedsUpdate = true
  }

  /**
   * Minor axis radius of the ellipse
   */
  get minorAxisRadius(): number {
    return this._minorAxisRadius
  }
  set minorAxisRadius(value: number) {
    if (value < 0) throw UvCmErrors.ILLEGAL_PARAMETERS
    this._minorAxisRadius = value
    this._boundingBoxNeedsUpdate = true
  }

  /**
   * Start angle of the ellipse arc in radians in the range -pi to pi.
   */
  get startAngle(): number {
    return this._startAngle
  }
  set startAngle(value: number) {
    this._startAngle = UvGeMathUtil.normalizeAngle(value)
    this._boundingBoxNeedsUpdate = true
  }

  /**
   * End angle of the ellipse arc in radians in the range -pi to pi.
   */
  get endAngle(): number {
    return this._endAngle
  }
  set endAngle(value: number) {
    this._endAngle =
      this.startAngle == 0 && value == TAU
        ? value
        : UvGeMathUtil.normalizeAngle(value)
    this._boundingBoxNeedsUpdate = true
  }

  /**
   * The flag Whether the ellipse arc is drawn clockwise. Default is false.
   */
  get clockwise(): boolean {
    return this._clockwise
  }
  set clockwise(value: boolean) {
    this._clockwise = value
    this._boundingBoxNeedsUpdate = true
  }

  /**
   * The rotation angle of the ellipse in radians, counterclockwise from the positive X axis (optional).
   * Default is 0.
   */
  get rotation(): number {
    return this._rotation
  }
  set rotation(value: number) {
    this._rotation = value
    this._boundingBoxNeedsUpdate = true
  }

  /**
   * Return angle between endAngle and startAngle in range 0 to 2*PI
   */
  get deltaAngle() {
    return UvGeMathUtil.normalizeAngle(this.endAngle - this.startAngle)
  }

  /**
   * Return true if the arc is a large arc whose delta angle value is greater than PI.
   */
  get isLargeArc() {
    return Math.abs(this.deltaAngle) > Math.PI ? 1 : 0
  }

  /**
   * Compute the bounding box of the 3D ellipse arc.
   * The bounding box is defined by its minimum and maximum x, y, and z coordinates.
   * @returns Return bounding box containing the min and max coordinates
   */
  calculateBoundingBox() {
    const numPoints = 100
    let minX = Infinity,
      minY = Infinity
    let maxX = -Infinity,
      maxY = -Infinity

    for (let i = 0; i <= numPoints; i++) {
      const point = this.getPoint(i / numPoints)
      minX = Math.min(minX, point.x)
      minY = Math.min(minY, point.y)
      maxX = Math.max(maxX, point.x)
      maxY = Math.max(maxY, point.y)
    }

    // Return the bounding box defined by min and max coordinates
    return new UvGeBox2d({ x: minX, y: minY }, { x: maxX, y: maxY })
  }

  /**
   * Return true if its start point is identical to its end point. Otherwise, return false.
   */
  get closed() {
    return this.deltaAngle == 0
  }

  /**
   * Return the point for a given position on the curve according to the arc length.
   * @param t Input a position on the curve according to the arc length. Must be in the range [ 0, 1 ].
   * @returns Return the point for a given position on the curve according to the arc length.
   */
  getPoint(t: number): UvGePoint2d {
    const twoPi = Math.PI * 2
    let deltaAngle = this.endAngle - this.startAngle
    const samePoints = Math.abs(deltaAngle) < Number.EPSILON

    // ensures that deltaAngle is 0 .. 2 PI
    while (deltaAngle < 0) deltaAngle += twoPi
    while (deltaAngle > twoPi) deltaAngle -= twoPi

    if (deltaAngle < Number.EPSILON) {
      if (samePoints) {
        deltaAngle = 0
      } else {
        deltaAngle = twoPi
      }
    }

    if (this.clockwise === true && !samePoints) {
      if (deltaAngle === twoPi) {
        deltaAngle = -twoPi
      } else {
        deltaAngle = deltaAngle - twoPi
      }
    }

    const angle = this.startAngle + t * deltaAngle
    let x = this.center.x + this.majorAxisRadius * Math.cos(angle)
    let y = this.center.y + this.minorAxisRadius * Math.sin(angle)

    if (this.rotation !== 0) {
      const cos = Math.cos(this.rotation)
      const sin = Math.sin(this.rotation)

      const tx = x - this.center.x
      const ty = y - this.center.y

      // Rotate the point about the center of the ellipse.
      x = tx * cos - ty * sin + this.center.x
      y = tx * sin + ty * cos + this.center.y
    }

    return new UvGePoint2d(x, y)
  }

  /**
   * @inheritdoc
   */
  transform(_matrix: UvGeMatrix2d) {
    this._boundingBoxNeedsUpdate = true
    return this
  }

  /**
   * @inheritdoc
   */
  copy(value: UvGeEllipseArc2d) {
    this.center = value.center
    this.majorAxisRadius = value.majorAxisRadius
    this.minorAxisRadius = value.minorAxisRadius
    this.startAngle = value.startAngle
    this.endAngle = value.endAngle
    this.clockwise = value.clockwise
    this.rotation = value.rotation
    return this
  }

  /**
   * @inheritdoc
   */
  clone() {
    return new UvGeEllipseArc2d(
      this.center,
      this.majorAxisRadius,
      this.minorAxisRadius,
      this.startAngle,
      this.endAngle,
      this.clockwise,
      this.rotation
    )
  }
}
