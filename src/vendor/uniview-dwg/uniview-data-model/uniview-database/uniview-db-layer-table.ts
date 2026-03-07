import { UvCmColor } from '@uniview/common'
import { UvGiLineWeight } from '@uniview/graphics'

import { DEFAULT_LINE_TYPE } from '../uniview-misc'
import { UvDbDatabase } from './uniview-db-database'
import { UvDbLayerTableRecord } from './uniview-db-layer-table-record'
import { UvDbSymbolTable } from './uniview-db-symbol-table'

/**
 * Symbol table for layer table records.
 *
 * This class manages layer table records which represent layers within a
 * drawing database. Layers are used to organize and control the display
 * of entities in the drawing. Each layer can have its own color, linetype,
 * visibility settings, and other properties.
 *
 * @example
 * ```typescript
 * const layerTable = new UvDbLayerTable(database);
 * const layer = layerTable.getAt('0');
 * const newLayer = new UvDbLayerTableRecord({ name: 'MyLayer' });
 * layerTable.add(newLayer);
 * ```
 */
export class UvDbLayerTable extends UvDbSymbolTable<UvDbLayerTableRecord> {
  /**
   * Creates a new UvDbLayerTable instance.
   *
   * This constructor automatically creates a default layer named '0' with
   * white color and continuous linetype.
   *
   * @param db - The database this layer table belongs to
   *
   * @example
   * ```typescript
   * const layerTable = new UvDbLayerTable(database);
   * ```
   */
  constructor(db: UvDbDatabase) {
    super(db)
    // The empty database should have one layer named '0'
    const defaultColor = new UvCmColor()
    const layer0 = new UvDbLayerTableRecord({
      name: '0',
      standardFlags: 0,
      linetype: DEFAULT_LINE_TYPE,
      lineWeight: UvGiLineWeight.ByLineWeightDefault,
      isOff: false,
      color: defaultColor,
      isPlottable: true
    })
    this.add(layer0)
  }

  /**
   * Adds a layer table record to this layer table.
   *
   * This method overrides the base class method to dispatch a layerAppended
   * event when a new layer is added to the table.
   *
   * @param record - The layer table record to add
   *
   * @example
   * ```typescript
   * const newLayer = new UvDbLayerTableRecord({ name: 'MyLayer' });
   * layerTable.add(newLayer);
   * ```
   */
  add(record: UvDbLayerTableRecord) {
    super.add(record)
    this.database.events.layerAppended.dispatch({
      database: this.database,
      layer: record
    })
  }
}
