import {
  UvGeArea2d,
  UvGeCircArc3d,
  UvGeEllipseArc3d,
  UvGePoint3d,
  UvGePoint3dLike
} from '@uniview/geometry'
import { UvGiSubEntityTraits } from './uniview-gi-sub-entity-traits'

import { UvGiEntity } from './uniview-gi-entity'
import { UvGiImageStyle } from './uniview-gi-image-style'
import { UvGiPointStyle } from './uniview-gi-point-style'
import { UvGiMTextData, UvGiTextStyle } from './uniview-gi-text-style'

/**
 * Font mappings.
 * - The key is the original font name
 * - The value is the mapped font name
 */
export type UvGiFontMapping = Record<string, string>

export interface UvGiRenderer<T extends UvGiEntity = UvGiEntity> {
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
   * The entity traits object gives the user control of, and access to, the attribute
   * (color, layer, linetype, etc.) settings of the current geometry.
   */
  get subEntityTraits(): UvGiSubEntityTraits

  /**
   * Create one group
   * @param entities Input entities to group together
   * @returns Return created group
   */
  group(entities: T[]): T

  /**
   * Draw a point.
   * @param point Input point to draw
   * @param style Input point style applied to point
   * @returns Return an object which can be added to scene
   */
  point(point: UvGePoint3d, style: UvGiPointStyle): T

  /**
   * Draw a circular arc or full circle.
   * @param arc Input circular arc to draw
   * @returns Return an object which can be added to scene
   */
  circularArc(arc: UvGeCircArc3d): T

  /**
   * Draw an elliptical arc or full ellipse.
   * @param ellipseArc Input elliptical arc to draw
   * @returns Return an object which can be added to scene
   */
  ellipticalArc(ellipseArc: UvGeEllipseArc3d): T

  /**
   * Draw lines using gl.LINE_STRIP.
   * @param points Input a point array which contains all line vertices
   * @returns Return an object which can be added to scene
   */
  lines(points: UvGePoint3dLike[]): T

  /**
   * Draw lines using gl.LINES.
   * @param array Must be a `TypedArray`. Used to instantiate the buffer. This array should have
   * `itemSize * numVertices` elements, where numVertices is the number of vertices.
   * @param itemSize The number of values of the {@link array} that should be associated with a
   * particular vertex. If the vertex is one 2d point, then itemSize should be `2`. If the vertex
   * is one 3d point, then itemSize should be `3`.
   * @param indices Index buffer.
   * @returns Return an object which can be added to scene
   */
  lineSegments(array: Float32Array, itemSize: number, indices: Uint16Array): T

  /**
   * Draw one area
   * @param area Input area to draw
   * @returns Return an object which can be added to scene
   */
  area(area: UvGeArea2d): T

  /**
   * Draw multiple line texts
   * @param mtext Input multiple line text data to draw
   * @param style Input text style applied to the text string
   * @param delay The flag to delay creating one rendered entity and just create one dummy
   * entity. Renderer can delay heavy calculation operation to avoid blocking UI when this
   * flag is true.
   * @returns Return an object which can be added to scene
   */
  mtext(mtext: UvGiMTextData, style: UvGiTextStyle, delay?: boolean): T

  /**
   * Draw image
   * @param blob Input Blob instance of one image file
   * @param style Input image style
   * @returns Return an object which can be added to scene
   */
  image(blob: Blob, style: UvGiImageStyle): T

  /**
   * Set font mapping
   * @param Input font mapping to set
   */
  setFontMapping(mapping: UvGiFontMapping): void
}
