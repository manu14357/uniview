import { UvGeBox3d, UvGeMatrix3d, UvGeVector3dLike } from '../uniview-math'
import { IUvGeShape, UvGeShape } from './uniview-ge-shape'

/**
 * Interface for all 3D shapes.
 */
export interface IUvGeShape3d extends IUvGeShape {
  /** The axis-aligned bounding box of this 3D shape. */
  readonly box: UvGeBox3d
  /** Return a new shape translated by the given vector. */
  translate(v: UvGeVector3dLike): UvGeShape3d
  /** Transform the shape by applying the input matrix. */
  transform(matrix: UvGeMatrix3d): this
}

/**
 * Abstract base class for all kinds of 3d shapes.
 */
export abstract class UvGeShape3d extends UvGeShape implements IUvGeShape3d {
  /**
   * The bounding box of this shape
   */
  private _box?: UvGeBox3d
  /**
   * Return new shape translated by given vector.
   * Translation vector may be also defined by a pair of numbers.
   */
  translate(v: UvGeVector3dLike): UvGeShape3d {
    return this.transform(new UvGeMatrix3d().makeTranslation(v.x, v.y, v.z))
  }

  /**
   * Transforms the entity by applying the input matrix.
   * @param matrix Input transformation matrix
   * @return Return this shape
   */
  abstract transform(matrix: UvGeMatrix3d): this

  /**
   * The bounding box of this shape. Because it is a time-consuming operation to calculate the bounding
   * box of one shape, the bounding box value is cached. It will be calculated again lazily once there
   * are any changes to properties of this shape.
   */
  get box() {
    if (this._box == null || this._boundingBoxNeedsUpdate) {
      this._box = this.calculateBoundingBox()
      this._boundingBoxNeedsUpdate = false
    }
    return this._box
  }

  /**
   * Return true if this shape contains the specified shape
   */
  protected abstract calculateBoundingBox(): UvGeBox3d
}
