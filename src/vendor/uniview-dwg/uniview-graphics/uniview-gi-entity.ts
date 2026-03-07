import { UvGeMatrix3d, UvGePoint3d } from '@uniview/geometry'

/**
 * Interface that all of display objects need to implement.
 */
export interface UvGiEntity {
  /**
   * JavaScript (and WebGL) use 64-bit floating point numbers for CPU-side calculations,
   * but GPU shaders typically use 32-bit floats. A 32-bit float has ~7.2 decimal digits
   * of precision. If passing 64-bit floating vertices data to GPU directly, it will
   * destroy number precision.
   *
   * We adopt a simpler but effective version of the "origin-shift" idea. Recompute
   * geometry using re-centered coordinates and apply offset to its position. The base
   * point is exactly the offset value.
   *
   * Get the rendering base point.
   * @returns Return the rendering base point.
   */
  get basePoint(): UvGePoint3d | undefined
  set basePoint(value: UvGePoint3d | undefined)
  /**
   * Object id of the associated entity in drawing database. When adding this entity into scene,
   * do remember setting the value of this property.
   */
  get objectId(): string
  set objectId(value: string)

  /**
   * The object Id of the owner of the object. When adding this entity into scene, do remember
   * setting the value of this property.
   */
  get ownerId(): string
  set ownerId(value: string)

  /**
   * The name of the layer referenced by this entity
   */
  get layerName(): string
  set layerName(value: string)

  /**
   * Object's visibility
   */
  get visible(): boolean
  set visible(value: boolean)

  /**
   * An object that can be used to store custom data about the entity.
   */
  get userData(): object
  set userData(value: object)

  /**
   * Adds one child entity for the current entity
   * @param child - The child entity to add
   */
  addChild(child: UvGiEntity): void

  /**
   * Apply the matrix transform to the object and updates the object's position, rotation and scale.
   * @param matrix Input the matrix to apply
   */
  applyMatrix(matrix: UvGeMatrix3d): void

  /**
   * Bakes the current object's transformation into all of its children and
   * resets the object itself to an identity transform.
   *
   * After calling this function:
   * - All children preserve their world-space appearance.
   * - The object's local matrix and world matrix become identity.
   * - The scene hierarchy remains unchanged.
   *
   * This is useful for freezing transforms, flattening transform hierarchies,
   * or ensuring newly added children are not affected by previous transforms.
   */
  bakeTransformToChildren(): void

  /**
   * Highlight this entity.
   */
  highlight(): void

  /**
   * Unhighlight this entity
   */
  unhighlight(): void

  /**
   * Return a clone of this object and its direct children (not all descendants).
   * So it means that you need to guarantee the object is flatten by call method
   * 'flatten' before calling this function.
   * This function will deeply clone geometry in this object. But materials are
   * reused directly and not deeply cloned.
   * @returns Return a clone of this object and optionally all descendants.
   */
  fastDeepClone(): UvGiEntity
}
