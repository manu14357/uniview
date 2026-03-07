/**
 * Interface for all geometry shapes.
 */
export interface IUvGeShape {
  /** Whether the bounding box needs recalculation. */
  readonly boundingBoxNeedsUpdate: boolean
}

/**
 * Abstract base class for all kinds of geometries.
 */
export abstract class UvGeShape implements IUvGeShape {
  protected _boundingBoxNeedsUpdate: boolean = false

  /**
   * Whether the bounding box needs recalculation.
   * When true, the next access to the bounding box will trigger a recalculation
   * and reset this flag to false.
   */
  get boundingBoxNeedsUpdate() {
    return this._boundingBoxNeedsUpdate
  }

  /**
   * @deprecated Use `boundingBoxNeedsUpdate` instead.
   */
  get boundingBoxNeedUpdate() {
    return this._boundingBoxNeedsUpdate
  }
}
