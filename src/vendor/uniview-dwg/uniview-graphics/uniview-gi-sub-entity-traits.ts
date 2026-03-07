import { UvCmColor, UvCmTransparency } from '@uniview/common'

import { UvGiHatchStyle } from './uniview-gi-hatch-style'
import { UvGiLineStyle } from './uniview-gi-line-style'
import { UvGiLineWeight } from './uniview-gi-line-weight'

/**
 * Trait settings for a sub‑entity in AutoCAD graphics (corresponding to UvGiSubEntityTraits).
 * These properties define visual attributes like color, line style, layer, thickness, etc.
 */
export interface UvGiSubEntityTraits {
  /**
   * The RGB color.
   * It resolves layer colors and block colors as needed and converts color index
   * to actual RGB color.
   */
  rgbColor: number

  /**
   * Color of the entity.
   */
  color: UvCmColor

  /**
   * Line type (pattern) used for drawing edges / curves of the entity.
   * Corresponds to AutoCAD's `UvGiLineStyle` (or linetypeTableRecord).
   */
  lineType: UvGiLineStyle

  /**
   * Scale factor applied to the lineType.
   * Changes how dense or stretched the pattern appears. (Equivalent to
   * AutoCAD's "Linetype Scale" / ltScale).
   */
  lineTypeScale: number

  /**
   * Lineweight for the entity's drawing (i.e. the visual thickness of lines).
   * Typically corresponds to one of AutoCAD's predefined lineweights.
   */
  lineWeight: UvGiLineWeight

  /**
   * Fill type / hatch style for the entity (if applicable).
   * Corresponds to AutoCAD's `UvGiHatchStyle`. For example, controlling whether
   * the sub‑entity is filled or only outlined.
   */
  fillType: UvGiHatchStyle

  /**
   * Transparency of the entity.
   * A numeric value controlling how transparent (or opaque) the entity is when rendered.
   */
  transparency: UvCmTransparency

  /**
   * Thickness (extrusion) of the entity along the positive Z axis in WCS units.
   * Only affects certain primitive types (e.g. polylines, arcs, circles, SHX‑text),
   * similarly to AutoCAD's "thickness" property.
   */
  thickness: number

  /**
   * The name of the layer on which the entity resides.
   * Corresponds to AutoCAD layer name (i.e. current layer in drawing).
   */
  layer: string
}
