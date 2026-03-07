import { UvGeEllipseArc2d, UvGeSpline3d } from '../uniview-geometry'
import { UvGeBox2d, UvGeMatrix2d, UvGePoint2d, UvGePoint3d } from '../uniview-math'
import { UvGeCircArc2d } from './uniview-ge-circ-arc2d'
import { UvGeCurve2d } from './uniview-ge-curve2d'
import { UvGeLine2d } from './uniview-ge-line2d'

export type UvGeBoundaryEdgeType =
  | UvGeLine2d
  | UvGeCircArc2d
  | UvGeSpline3d
  | UvGeEllipseArc2d

/**
 * The class representing one closed loop created by connected edges, which can be line, circular arc,
 * ellipse arc, or spline.
 */
export class UvGeLoop2d extends UvGeCurve2d {
  private _curves: Array<UvGeBoundaryEdgeType>

  /**
   * Create one loop by connected curves
   * @param curves Input one array of connected curves
   */
  constructor(curves: Array<UvGeBoundaryEdgeType> = []) {
    super()
    this._curves = curves
  }

  get curves() {
    return this._curves as ReadonlyArray<UvGeBoundaryEdgeType>
  }

  /**
   * Append an edge to this loop
   * @param curve
   */
  add(curve: UvGeBoundaryEdgeType) {
    this._curves.push(curve)
    this._boundingBoxNeedsUpdate = true
  }

  /**
   * The number of edges in this loop
   */
  get numberOfEdges() {
    return this._curves.length
  }

  /**
   * Start point of this polyline
   */
  get startPoint(): UvGePoint2d {
    if (this._curves.length > 0) {
      const temp = this._curves[0].startPoint
      return new UvGePoint2d(temp.x, temp.y)
    }
    throw new Error('Start point does not exist in an empty loop.')
  }

  /**
   * End point of this polyline
   */
  get endPoint(): UvGePoint2d {
    return this.startPoint
  }

  /**
   * @inheritdoc
   */
  get length() {
    let length = 0
    this._curves.forEach(curve => {
      length += curve.length
    })
    return length
  }

  /**
   * @inheritdoc
   */
  calculateBoundingBox(): UvGeBox2d {
    const points = this.getPoints(100)
    const box2d = new UvGeBox2d()
    box2d.setFromPoints(points)
    return box2d
  }

  /**
   * @inheritdoc
   */
  transform(_matrix: UvGeMatrix2d) {
    // TODO: implement it
    this._boundingBoxNeedsUpdate = true
    return this
  }

  /**
   * @inheritdoc
   */
  get closed(): boolean {
    return true
  }

  /**
   * Return boundary points of this area
   * @param numPoints Input the nubmer of points returned for arc segmentation
   * @returns Return points
   */
  getPoints(numPoints: number): UvGePoint2d[] {
    const points: UvGePoint2d[] = []
    this.curves.forEach(curve => {
      curve.getPoints(numPoints).forEach((point: UvGePoint2d | UvGePoint3d) => {
        points.push(new UvGePoint2d(point.x, point.y))
      })
    })
    return points
  }
}
