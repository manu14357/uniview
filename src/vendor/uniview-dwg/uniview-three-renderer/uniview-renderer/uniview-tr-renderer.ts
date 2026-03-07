import {
  UvCmEventManager,
  UvGeArea2d,
  UvGeCircArc3d,
  UvGeEllipseArc3d,
  UvGePoint3d,
  UvGePoint3dLike,
  UvGiFontMapping,
  UvGiImageStyle,
  UvGiMTextData,
  UvGiPointStyle,
  UvGiRenderer,
  UvGiSubEntityTraits,
  UvGiTextStyle
} from '@uniview/data-model'
import { FontManager, FontManagerEventArgs } from '@uniview/mtext-renderer'
import * as THREE from 'three'

import {
  UvTrEntity,
  UvTrGroup,
  UvTrImage,
  UvTrLine,
  UvTrLineSegments,
  UvTrMText,
  UvTrObject,
  UvTrPoint,
  UvTrPolygon
} from '../uniview-object'
import { UvTrMaterialManager } from '../uniview-style/uniview-tr-material-manager'
import { UvTrStyleManager } from '../uniview-style/uniview-tr-style-manager'
import { UvTrSubEntityTraitsUtil } from '../uniview-util'
import { UvTrCamera } from '../uniview-viewport'
import { UvTrMTextRenderer } from './uniview-tr-m-text-renderer'

export class UvTrRenderer implements UvGiRenderer<UvTrEntity> {
  private _styleManager: UvTrStyleManager
  private _renderer: THREE.WebGLRenderer
  private _basePoint?: UvGePoint3d
  private _subEntityTraits: UvGiSubEntityTraits

  public readonly events = {
    fontNotFound: new UvCmEventManager<FontManagerEventArgs>()
  }

  constructor(renderer: THREE.WebGLRenderer) {
    this._renderer = renderer
    this._styleManager = new UvTrStyleManager()
    const size = renderer.getSize(new THREE.Vector2())
    this._styleManager.updateLineResolution(size.x, size.y)
    UvTrMTextRenderer.getInstance().overrideStyleManager(this._styleManager)
    FontManager.instance.events.fontNotFound.addEventListener(args => {
      this.events.fontNotFound.dispatch(args)
    })
    this._subEntityTraits = UvTrSubEntityTraitsUtil.createDefaultTraits()
  }

  /**
   * @inheritdoc
   */
  get subEntityTraits() {
    return this._subEntityTraits
  }

  get autoClear() {
    return this._renderer.autoClear
  }
  set autoClear(value: boolean) {
    this._renderer.autoClear = value
  }

  get domElement() {
    return this._renderer.domElement
  }

  /**
   * JavaScript (and WebGL) use 64‑bit floating point numbers for CPU-side calculations,
   * but GPU shaders typically use 32‑bit floats. A 32-bit float has ~7.2 decimal digits
   * of precision. If passing 64-bit floating vertices data to GPU directly, it will
   * destroy number precision.
   *
   * So we adopt a simpler but effective version of the "origin-shift" idea. Recompute
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

  setSize(width: number, height: number) {
    this._renderer.setSize(width, height)
    this._styleManager.updateLineResolution(width, height)
  }

  getViewport(target: THREE.Vector4) {
    return this._renderer.getViewport(target)
  }
  setViewport(x: number, y: number, width: number, height: number) {
    this._renderer.setViewport(x, y, width, height)
  }

  clear() {
    this._renderer.clear()
  }

  clearDepth() {
    this._renderer.clearDepth()
  }

  render(scene: THREE.Object3D, camera: UvTrCamera) {
    this.updateCameraZoomUniform(camera.zoom)
    this._renderer.render(scene, camera.internalCamera)
  }

  /**
   * Sets the clear color used when clearing the canvas.
   *
   * @param color - Background color as 24-bit hexadecimal RGB number
   * @param alpha - Optional alpha value (0.0 - 1.0)
   */
  setClearColor(color: number, alpha?: number) {
    this._renderer.setClearColor(color, alpha)
  }

  /**
   * Gets the current clear color as a 24-bit hexadecimal RGB number.
   */
  getClearColor() {
    const color = new THREE.Color()
    this._renderer.getClearColor(color)
    return color.getHex()
  }

  /**
   * Sets the clear alpha used when clearing the canvas.
   *
   * @param alpha - Alpha value (0.0 - 1.0)
   */
  setClearAlpha(alpha: number) {
    this._renderer.setClearAlpha(alpha)
  }

  /**
   * Gets the current clear alpha value.
   */
  getClearAlpha() {
    return this._renderer.getClearAlpha()
  }

  /**
   * The internal THREE.js webgl renderer
   */
  get internalRenderer() {
    return this._renderer
  }

  /**
   * @inheritdoc
   */
  setFontMapping(mapping: UvGiFontMapping) {
    FontManager.instance.setFontMapping(mapping)
  }

  /**
   * Sets global ltscale
   */
  set ltscale(scale: number) {
    UvTrStyleManager.options.ltscale = scale
  }

  /**
   * Sets global celtscale
   */
  set celtscale(scale: number) {
    UvTrStyleManager.options.celtscale = scale
  }

  /**
   * Fonts list which can't be found
   */
  get missedFonts() {
    return FontManager.instance.missedFonts
  }

  /**
   * Gets whether entity lineweights are displayed.
   */
  get showLineWeight() {
    return this._styleManager.showLineWeight
  }

  /**
   * Sets whether entity lineweights are displayed.
   *
   * When disabled, line entities are rendered with basic 1px materials.
   */
  set showLineWeight(value: boolean) {
    this._styleManager.showLineWeight = value
  }

  updateLayerMaterial(
    layerName: string,
    newTraits: Partial<UvGiSubEntityTraits>
  ): Record<number, THREE.Material> {
    return this._styleManager.updateLayerMaterial(layerName, newTraits)
  }

  /**
   * Create one empty drawable object
   */
  createObject() {
    return new UvTrObject(this._styleManager)
  }

  /**
   * Create one empty entity
   */
  createEntity() {
    return new UvTrEntity(this._styleManager)
  }

  /**
   * @inheritdoc
   */
  group(entities: UvTrEntity[]) {
    return new UvTrGroup(entities, this._styleManager)
  }

  /**
   * @inheritdoc
   */
  point(point: UvGePoint3d, style: UvGiPointStyle) {
    const geometry = new UvTrPoint(
      point,
      this._subEntityTraits,
      style,
      this._styleManager
    )
    return geometry
  }

  /**
   * @inheritdoc
   */
  circularArc(arc: UvGeCircArc3d) {
    // TODO: Compute division based on current viewport size
    return this.linePoints(arc.getPoints(100))
  }

  /**
   * @inheritdoc
   */
  ellipticalArc(ellipseArc: UvGeEllipseArc3d) {
    // TODO: Compute division based on current viewport size
    return this.linePoints(ellipseArc.getPoints(100))
  }

  /**
   * @inheritdoc
   */
  lines(points: UvGePoint3dLike[]) {
    return this.linePoints(points)
  }

  /**
   * @inheritdoc
   */
  lineSegments(array: Float32Array, itemSize: number, indices: Uint16Array) {
    return new UvTrLineSegments(
      array,
      itemSize,
      indices,
      this._subEntityTraits,
      this._styleManager
    )
  }

  /**
   * @inheritdoc
   */
  area(area: UvGeArea2d) {
    return new UvTrPolygon(area, this._subEntityTraits, this._styleManager)
  }

  /**
   * @inheritdoc
   */
  mtext(mtext: UvGiMTextData, style: UvGiTextStyle, delay?: boolean) {
    return new UvTrMText(
      mtext,
      this._subEntityTraits,
      style,
      this._styleManager,
      delay
    )
  }

  /**
   * @inheritdoc
   */
  image(blob: Blob, style: UvGiImageStyle) {
    return new UvTrImage(blob, style, this._styleManager)
  }

  /**
   * Clears all cached materials and releases its memory
   */
  dispose() {
    this._styleManager.dispose()
    FontManager.instance.missedFonts = {}
  }

  private linePoints(points: UvGePoint3dLike[]) {
    return new UvTrLine(points, this._subEntityTraits, this._styleManager)
  }

  /**
   * Updates camera zoom value for shader materials
   */
  private updateCameraZoomUniform(zoom: number) {
    // DxfLoader.CameraZoomUniform.value = (zoom * this.container.height) / 50;
    UvTrMaterialManager.CameraZoomUniform.value = zoom
  }
}
