import { UvGePoint3d } from '../uniview-math/uniview-ge-point3d'
import { IUvGeShape3d, UvGeShape3d } from './uniview-ge-shape3d'

/**
 * Interface for all 3D curves.
 */
export interface IUvGeCurve3d extends IUvGeShape3d {
  /** Whether the curve is closed (start point equals end point). */
  readonly closed: boolean
  /** Start point of the curve. */
  readonly startPoint: UvGePoint3d
  /** End point of the curve. */
  readonly endPoint: UvGePoint3d
  /** Length of the curve. */
  readonly length: number
}

/**
 * Abstract base class for all 3d curves. Any class that is derived from this class represents
 * a 3d curve.
 */
export abstract class UvGeCurve3d extends UvGeShape3d implements IUvGeCurve3d {
  /**
   * Return true if its start point is identical to its end point. Otherwise, return false.
   */
  abstract get closed(): boolean

  /**
   * Start point of this curve. If the curve is closed, coordinates of start point will be equal to coordinates
   * of end point.
   */
  abstract get startPoint(): UvGePoint3d

  /**
   * End point of this curve. If the curve is closed, coordinates of start point will be equal to coordinates
   * of end point.
   */
  abstract get endPoint(): UvGePoint3d

  /**
   * Length of this curve.
   */
  abstract get length(): number
}
