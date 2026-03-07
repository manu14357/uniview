import { UvDbDatabase } from './uniview-db-database'
import { UvDbDimStyleTableRecord } from './uniview-db-dim-style-table-record'
import { UvDbSymbolTable } from './uniview-db-symbol-table'

/**
 * Symbol table for dimension style table records.
 *
 * This class manages dimension style table records which represent dimension styles
 * within the drawing database. Dimension styles define the appearance and behavior
 * of dimension entities, including text formatting, arrow styles, extension lines,
 * and other dimension-specific properties.
 *
 * @example
 * ```typescript
 * const dimStyleTable = new UvDbDimStyleTable(database);
 * const dimStyle = dimStyleTable.getAt('Standard');
 * ```
 */
export class UvDbDimStyleTable extends UvDbSymbolTable<UvDbDimStyleTableRecord> {
  /**
   * Creates a new UvDbDimStyleTable instance.
   *
   * @param db - The database this dimension style table belongs to
   *
   * @example
   * ```typescript
   * const dimStyleTable = new UvDbDimStyleTable(database);
   * ```
   */
  constructor(db: UvDbDatabase) {
    super(db)
  }
}
