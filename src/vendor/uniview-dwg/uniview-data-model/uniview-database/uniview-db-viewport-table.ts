import { UvDbDatabase } from './uniview-db-database'
import { UvDbSymbolTable } from './uniview-db-symbol-table'
import { UvDbViewportTableRecord } from './uniview-db-viewport-table-record'

/**
 * Symbol table for viewport table records.
 *
 * This class manages viewport table records which represent viewport configurations
 * within AutoCAD. Viewports define how the drawing is displayed in different
 * areas of the screen or paper space, including zoom levels, pan positions,
 * and other display properties.
 *
 * @example
 * ```typescript
 * const viewportTable = new UvDbViewportTable(database);
 * const viewport = viewportTable.getAt('*Active');
 * ```
 */
export class UvDbViewportTable extends UvDbSymbolTable<UvDbViewportTableRecord> {
  /**
   * Creates a new UvDbViewportTable instance.
   *
   * @param db - The database this viewport table belongs to
   *
   * @example
   * ```typescript
   * const viewportTable = new UvDbViewportTable(database);
   * ```
   */
  constructor(db: UvDbDatabase) {
    super(db)
  }
}
