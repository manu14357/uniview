import { UvGeBox2d, UvGeMatrix2d, UvGeVector2dLike } from '../uniview-math'
import { IUvGeShape, UvGeShape } from './uniview-ge-shape'

/**
 * Interface for all 2D shapes.
 */
export interface IUvGeShape2d extends IUvGeShape {
  /** The axis-aligned bounding box of this 2D shape. */
  readonly box: UvGeBox2d
  /** Return a new shape translated by the given vector. */
  translate(v: UvGeVector2dLike): this
  /** Transform the shape by applying the input matrix. */
  transform(matrix: UvGeMatrix2d): this
}

/**
 * Abstract base class for all kinds of 2d shapes.
 */
export abstract class UvGeShape2d extends UvGeShape implements IUvGeShape2d {
  /**
   * The bounding box of this shape
   */
  private _box?: UvGeBox2d

  /**
   * Return new shape translated by given vector.
   */
  translate(v: UvGeVector2dLike): this {
    return this.transform(new UvGeMatrix2d().makeTranslation(v.x, v.y))
  }

  /**
   * Transforms the entity by applying the input matrix.
   * @param matrix Input transformation matrix
   */
  abstract transform(matrix: UvGeMatrix2d): this

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
  protected abstract calculateBoundingBox(): UvGeBox2d
}
