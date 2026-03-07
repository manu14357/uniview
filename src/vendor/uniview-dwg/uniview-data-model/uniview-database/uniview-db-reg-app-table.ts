import { UvDbDatabase } from './uniview-db-database'
import { UvDbRegAppTableRecord } from './uniview-db-reg-app-table-record'
import { UvDbSymbolTable } from './uniview-db-symbol-table'

/**
 * Symbol table the symbol table for UvDbRegAppTableRecords, which represent registered application
 * names for Extended Entity Data within objects that reside in the drawing database.
 */
export class UvDbRegAppTable extends UvDbSymbolTable<UvDbRegAppTableRecord> {
  /**
   * Creates a new UvDbRegAppTable instance.
   *
   * @param db - The database this table belongs to
   */
  constructor(db: UvDbDatabase) {
    super(db)
  }
}
