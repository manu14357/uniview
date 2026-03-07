import { UvGeArea2d, UvGePolyline2d } from '@uniview/geometry'
import { UvGiRenderer } from '@uniview/graphics'

import { UvDbRasterImage } from './uniview-db-raster-image'

/**
 * Entity that creates a blank area in the drawing.
 *
 * The UvDbWipeout entity creates a blank area that covers other entities
 * in the drawing. It's commonly used to hide parts of the drawing or
 * create clean areas for annotations. The wipeout area is defined by
 * a boundary path and is rendered as a solid black fill.
 *
 * @example
 * ```typescript
 * const wipeout = new UvDbWipeout();
 * // Set up boundary path and other properties
 * wipeout.draw(renderer);
 * ```
 */
export class UvDbWipeout extends UvDbRasterImage {
  /** The entity type name */
  static override typeName: string = 'Wipeout'
  /**
   * Draws the wipeout entity.
   *
   * This method creates a solid black area based on the boundary path
   * of the wipeout entity. The area covers all entities behind it,
   * effectively "wiping out" that portion of the drawing.
   *
   * @param renderer - The renderer to use for drawing
   * @returns The rendered entity or undefined if rendering failsenderedEntity = wipeout.draw(renderer);
   * ```
   */
  subWorldDraw(renderer: UvGiRenderer) {
    const points = this.boundaryPath()
    const area = new UvGeArea2d()
    area.add(new UvGePolyline2d(points))
    return renderer.area(area)
  }
}
