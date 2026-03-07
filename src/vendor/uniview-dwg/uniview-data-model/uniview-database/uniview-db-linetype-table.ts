import { UvDbDatabase } from './uniview-db-database'
import { UvDbLinetypeTableRecord } from './uniview-db-linetype-table-record'
import { UvDbSymbolTable } from './uniview-db-symbol-table'

/**
 * Symbol table for linetype table records.
 *
 * This class manages linetype table records which represent line types within a
 * drawing database. Line types define the pattern of dashes, dots, and spaces
 * used to display lines and curves in the drawing.
 *
 * @example
 * ```typescript
 * const linetypeTable = new UvDbLinetypeTable(database);
 * const linetype = linetypeTable.getAt('Continuous');
 * ```
 */
export class UvDbLinetypeTable extends UvDbSymbolTable<UvDbLinetypeTableRecord> {
  /**
   * Creates a new UvDbLinetypeTable instance.
   *
   * @param db - The database this linetype table belongs to
   *
   * @example
   * ```typescript
   * const linetypeTable = new UvDbLinetypeTable(database);
   * ```
   */
  constructor(db: UvDbDatabase) {
    super(db)
  }
}
