import {
  UvGeBox2d,
  UvGeMatrix3d,
  UvGePoint3d,
  UvGiEntity
} from '@uniview/data-model'

/**
 * Represent the display object of one drawing entity.
 */
export class UvSvgEntity implements UvGiEntity {
  private _objectId: string
  private _ownerId: string
  private _layerName: string
  private _visible: boolean
  private _userData: object
  protected _box: UvGeBox2d
  private _svg: string
  protected _basePoint?: UvGePoint3d

  constructor() {
    this._objectId = ''
    this._ownerId = ''
    this._layerName = ''
    this._visible = true
    this._userData = {}
    this._box = new UvGeBox2d()
    this._svg = ''
  }

  /**
   * The bounding box of this object
   */
  get box() {
    return this._box
  }
  set box(value: UvGeBox2d) {
    this._box.copy(value)
  }

  /**
   * JavaScript (and WebGL) use 64‑bit floating point numbers for CPU-side calculations,
   * but GPU shaders typically use 32‑bit floats. A 32-bit float has ~7.2 decimal digits
   * of precision. If passing 64-bit floating vertices data to GPU directly, it will
   * destroy number precision.
   *
   * So we adopt a simpler but effective version of the “origin-shift” idea. Recompute
   * geometry using re-centered coordinates and apply offset to its position. The base
   * point is exactly offset value.
   */
  get basePoint() {
    return this._basePoint
  }
  set basePoint(value: UvGePoint3d | undefined) {
    if (value == null) {
      this._basePoint = value
    } else {
      this._basePoint = this._basePoint
        ? this._basePoint.copy(value)
        : new UvGePoint3d(value)
    }
  }

  /**
   * SVG string of this entity
   */
  get svg() {
    return this._svg
  }
  set svg(value: string) {
    this._svg = value
  }

  /**
   * @inheritdoc
   */
  get objectId() {
    return this._objectId
  }
  set objectId(value: string) {
    this._objectId = value
  }

  /**
   * @inheritdoc
   */
  get ownerId() {
    return this._ownerId
  }
  set ownerId(value: string) {
    this._ownerId = value
  }

  /**
   * @inheritdoc
   */
  get layerName() {
    return this._layerName
  }
  set layerName(value: string) {
    this._layerName = value
  }

  /**
   * @inheritdoc
   */
  get visible() {
    return this._visible
  }
  set visible(value: boolean) {
    this._visible = value
  }

  /**
   * @inheritdoc
   */
  get userData(): object {
    return this._userData
  }
  set userData(value: object) {
    this._userData = value
  }

  /**
   * @inheritdoc
   */
  applyMatrix(_matrix: UvGeMatrix3d) {
    // Do nothing
  }

  /**
   * @inheritdoc
   */
  recomputeBoundingBox() {
    // Do nothing
  }

  /**
   * @inheritdoc
   */
  highlight() {
    // Do nothing
  }

  /**
   * @inheritdoc
   */
  unhighlight() {
    // Do nothing
  }

  /**
   * @inheritdoc
   */
  fastDeepClone() {
    const clone = new UvSvgEntity()
    clone.objectId = this.objectId
    clone.ownerId = this.ownerId
    clone.layerName = this.layerName
    clone.visible = this.visible
    clone.svg = this.svg
    clone.box = this._box
    if (this._basePoint) {
      clone.basePoint = this._basePoint
    }
    return clone
  }

  /**
   * @inheritdoc
   */
  addChild(_entity: UvGiEntity) {
    // Do nothing for now
  }

  /**
   * @inheritdoc
   */
  bakeTransformToChildren() {
    // Do nothing for now
  }
}
