import { UvDbObjectId } from '../uniview-base'
import { UvDbBlockTableRecord } from './uniview-db-block-table-record'
import { UvDbDatabase } from './uniview-db-database'
import { UvDbSymbolTable } from './uniview-db-symbol-table'

/**
 * Symbol table for block table records.
 *
 * This class manages block table records which represent block definitions
 * within a drawing database. Blocks are reusable collections of entities
 * that can be inserted multiple times into a drawing.
 *
 * @example
 * ```typescript
 * const blockTable = new UvDbBlockTable(database);
 * const modelSpace = blockTable.modelSpace;
 * const block = blockTable.getAt('MyBlock');
 * ```
 */
export class UvDbBlockTable extends UvDbSymbolTable<UvDbBlockTableRecord> {
  /**
   * Creates a new UvDbBlockTable instance.
   *
   * @param db - The database this block table belongs to
   *
   * @example
   * ```typescript
   * const blockTable = new UvDbBlockTable(database);
   * ```
   */
  constructor(db: UvDbDatabase) {
    super(db)
  }

  /**
   * Gets the MODEL_SPACE block table record.
   *
   * This method returns the model space block table record, creating it
   * if it doesn't exist. Model space is the primary drawing area where
   * most entities are created and stored.
   *
   * @returns The MODEL_SPACE block table record
   *
   * @example
   * ```typescript
   * const modelSpace = blockTable.modelSpace;
   * const entities = modelSpace.entities;
   * ```
   */
  get modelSpace(): UvDbBlockTableRecord {
    let modelSpace = this.getAt(UvDbBlockTableRecord.MODEL_SPACE_NAME)
    if (!modelSpace) {
      modelSpace = new UvDbBlockTableRecord()
      modelSpace.name = UvDbBlockTableRecord.MODEL_SPACE_NAME
      this.add(modelSpace)
    }
    return modelSpace
  }

  /**
   * Searches for an entity in all of block table records with the specified ID.
   *
   * @param id - The entity ID to search for
   * @returns The entity with the specified ID, or undefined if not found
   */
  getEntityById(id: UvDbObjectId) {
    for (const btr of this.database.tables.blockTable.newIterator()) {
      const entity = btr.getIdAt(id)
      if (entity) return entity
    }
    return undefined
  }

  /**
   * Removes the specified entity or entities from the block table.
   *
   * Notes:
   * Please call method UvDbEntity.erase to remove one entity instead of calling
   * this function.
   *
   * AutoCAD ObjectARX API doesn't provide such one method to remove entities
   * from the block table. I guess it is done by friend class or function
   * feature in C++. However, there are no similar feature in TypeScript. So
   * we have to expose such one public method in UvDbBlockTable.
   *
   * @param objectId - The object id or ids of entities to remove from this block table
   * @returns — true if an entity in the block table existed and has been removed,
   * or false if the entity does not exist.
   */
  removeEntity(objectId: UvDbObjectId | UvDbObjectId[]) {
    let result = false
    for (const btr of this.database.tables.blockTable.newIterator()) {
      if (btr.removeEntity(objectId)) {
        result = true
        break
      }
    }
    return result
  }

  /**
   * Normalizes the specified block table record name if it is one paper spacce or model space
   * block table record.
   *
   * @override
   * @param name - The name of the block table record.
   * @returns The normalized block table record name.
   */
  protected normalizeName(name: string) {
    let regularizedName = name
    if (UvDbBlockTableRecord.isModelSpaceName(name)) {
      regularizedName = UvDbBlockTableRecord.MODEL_SPACE_NAME
    } else if (UvDbBlockTableRecord.isPaperSpaceName(name)) {
      const prefix = UvDbBlockTableRecord.PAPER_SPACE_NAME_PREFIX
      const suffix = name.substring(prefix.length)
      regularizedName = prefix + suffix
    }
    return regularizedName
  }
}
