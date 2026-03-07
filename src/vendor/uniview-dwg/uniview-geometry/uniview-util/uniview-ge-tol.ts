import {
  UvGePoint2dLike,
  UvGePoint3dLike,
  UvGeVector2d,
  UvGeVector3d
} from '../uniview-math'
import { FLOAT_TOL } from './uniview-ge-constants'

/**
 * Interface for tolerance containers used in geometric comparisons.
 */
export interface IUvGeTol {
  /** Tolerance for point equality comparisons. */
  readonly equalPointTol: number
  /** Tolerance for vector equality/parallelism/perpendicularity comparisons. */
  readonly equalVectorTol: number
  /** Check if two 2D points are equal within tolerance. */
  equalPoint2d(p1: UvGePoint2dLike, p2: UvGePoint2dLike): boolean
  /** Check if two 3D points are equal within tolerance. */
  equalPoint3d(p1: UvGePoint3dLike, p2: UvGePoint3dLike): boolean
}

/**
 * The class used to store some tolerance values.
 */
export class UvGeTol implements IUvGeTol {
  /**
   * Tolerance value to check whether two points are equal. Two points, p1 and p2, are equal if
   * <pre>
   * (p1 - p2).length() <= equalPointTol
   * </pre
   */
  readonly equalPointTol: number
  /**
   * Tolerance value to compare two vectors.
   *
   * 1. Two vectors, v1 and v2, are equal if
   * <pre>
   * (p1 - p2).length() <= equalPoint
   * </pre>
   *
   * 2. Two vectors, v1 and v2, are parallel if
   * <pre>
   * (v1/v1.length() - v2/v2.length() ).length() < equalVectorTol
   * </pre>
   * Or
   * <pre>
   * (v1/v1.length() + v2/v2.length() ).length() < equalVectorTol
   * </pre>
   *
   * 3. Two vectors, v1 and v2, are perpendicular if
   * <pre>
   * abs((v1.dotProduct(v2))/(v1.length()*v2.length())) <= equalVectorTol
   * </pre>
   */
  readonly equalVectorTol: number

  /**
   * Create tolerance class with specified or default tolerance values.
   * @param equalPointTol Tolerance for point equality. Default is FLOAT_TOL.
   * @param equalVectorTol Tolerance for vector comparisons. Default is FLOAT_TOL.
   */
  constructor(
    equalPointTol: number = FLOAT_TOL,
    equalVectorTol: number = FLOAT_TOL
  ) {
    this.equalPointTol = equalPointTol
    this.equalVectorTol = equalVectorTol
  }

  /**
   * Return true if two points are equal with the specified tolerance.
   * @param p1 Input the first 2d point
   * @param p2 Input the second 2d point
   * @returns Return true if two poitns are equal with the specified tolerance.
   */
  equalPoint2d(p1: UvGePoint2dLike, p2: UvGePoint2dLike) {
    return new UvGeVector2d(p1).sub(p2).length() < this.equalPointTol
  }

  /**
   * Return true if two points are equal with the specified tolerance.
   * @param p1 Input the first 2d point
   * @param p2 Input the second 2d point
   * @returns Return true if two poitns are equal with the specified tolerance.
   */
  equalPoint3d(p1: UvGePoint3dLike, p2: UvGePoint3dLike) {
    return new UvGeVector3d(p1).sub(p2).length() < this.equalPointTol
  }

  /**
   * Return true if the value is equal to zero with the specified tolerance.
   */
  static equalToZero(x: number, tol: number = FLOAT_TOL) {
    return x < tol && x > -tol
  }

  /**
   * Return true if two values are equal with the sepcified tolerance.
   *
   * @param value1 Input the first value
   * @param value2 Input the second value
   * @param tol Input the tolerance value
   * @returns Return true if two values are equal with the sepcified tolerance
   */
  static equal(
    value1: number,
    value2: number,
    tol: number = FLOAT_TOL
  ): boolean {
    return Math.abs(value1 - value2) < tol
  }

  /**
   * Return true if the first argument are greater than the second argument with the sepcified
   * tolerance.
   *
   * @param value1 Input the first value
   * @param value2 Input the second value
   * @param tol Input the tolerance value
   * @returns Return true if the first argument are greater than the second argument with the
   * sepcified tolerance.
   */
  static great(
    value1: number,
    value2: number,
    tol: number = FLOAT_TOL
  ): boolean {
    return value1 - value2 > tol
  }

  /**
   * Return true if the first argument less than the second argument with the specified tolerance
   * value
   *
   * @param value1 Input the first value
   * @param value2 Input the second value
   * @param tol Input the tolerance value
   * @returns Return *true* if the first argument less than the second argument with the specified
   * tolerance value
   */
  static less(value1: number, value2: number, tol: number = FLOAT_TOL) {
    return value1 - value2 < tol
  }
}

export const DEFAULT_TOL = new UvGeTol()
