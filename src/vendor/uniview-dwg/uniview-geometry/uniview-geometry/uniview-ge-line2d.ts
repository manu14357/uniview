import { UvGeBox2d, UvGeMatrix2d, UvGePoint2d, UvGePoint2dLike } from '../uniview-math'
import { UvGeCurve2d } from './uniview-ge-curve2d'

/**
 * The class represents one 2d line geometry specified by its start point and end point.
 */
export class UvGeLine2d extends UvGeCurve2d {
  private _start: UvGePoint2d
  private _end: UvGePoint2d
  /**
   * This constructor initializes the line object to use start as the start point, and end
   * as the endpoint. Both points must be in WCS coordinates.
   */
  constructor(start: UvGePoint2dLike, end: UvGePoint2dLike) {
    super()
    this._start = new UvGePoint2d(start)
    this._end = new UvGePoint2d(end)
  }

  /**
   * The line's startpoint in WCS coordinates
   * @returns Return the line's startpoint in WCS coordinates.
   */
  get startPoint(): UvGePoint2d {
    return this._start
  }
  set startPoint(value: UvGePoint2dLike) {
    this._start.copy(value)
    this._boundingBoxNeedsUpdate = true
  }

  /**
   * The line's endpoint in WCS coordinates
   * @returns Return the line's endpoint in WCS coordinates.
   */
  get endPoint(): UvGePoint2d {
    return this._end
  }
  set endPoint(value: UvGePoint2dLike) {
    this._end.copy(value)
    this._boundingBoxNeedsUpdate = true
  }

  /**
   * Convert line to a point array with start point and end point.
   * @returns Return an array of point
   */
  getPoints(): UvGePoint2d[] {
    return [this.startPoint, this.endPoint]
  }

  /**
   * @inheritdoc
   */
  get length() {
    return this.startPoint.distanceTo(this.endPoint)
  }

  /**
   * @inheritdoc
   */
  calculateBoundingBox(): UvGeBox2d {
    const min = new UvGePoint2d(
      Math.min(this._start.x, this._end.x),
      Math.min(this._start.y, this._end.y)
    )
    const max = new UvGePoint2d(
      Math.max(this._start.x, this._end.x),
      Math.max(this._start.y, this._end.y)
    )
    return new UvGeBox2d(min, max)
  }

  /**
   * @inheritdoc
   */
  transform(matrix: UvGeMatrix2d) {
    this._start.applyMatrix2d(matrix)
    this._end.applyMatrix2d(matrix)
    this._boundingBoxNeedsUpdate = true
    return this
  }

  /**
   * @inheritdoc
   */
  get closed(): boolean {
    return false
  }

  /**
   * @inheritdoc
   */
  copy(value: UvGeLine2d) {
    this.startPoint = value.startPoint
    this.endPoint = value.endPoint
    this._boundingBoxNeedsUpdate = true
    return this
  }

  /**
   * @inheritdoc
   */
  clone() {
    return new UvGeLine2d(this._start.clone(), this._end.clone())
  }
}
