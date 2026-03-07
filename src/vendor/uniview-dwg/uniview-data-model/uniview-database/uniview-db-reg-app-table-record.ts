import { UvDbSymbolTableRecord } from './uniview-db-symbol-table-record'

/**
 * Represents records in the UvDbRegAppTable (known as the APPID symbol table in AutoCAD and DXF).
 * Each of these records represents an application ID used to identify a group of Extended Entity
 * Data attached to objects in the drawing database.
 */
export class UvDbRegAppTableRecord extends UvDbSymbolTableRecord {
  constructor(name: string) {
    super()
    this.name = name
  }
}
