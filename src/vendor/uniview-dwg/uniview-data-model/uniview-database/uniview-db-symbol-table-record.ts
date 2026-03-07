import { defaults } from '@uniview/common'

import { UvDbObject, UvDbObjectAttrs } from '../uniview-base/uniview-db-object'

/**
 * Interface defining the attributes for symbol table records.
 *
 * Extends the base UvDbObjectAttrs interface and adds a name property
 * that is required for all symbol table records.
 */
export interface UvDbSymbolTableRecordAttrs extends UvDbObjectAttrs {
  /** The name of the symbol table record */
  name: string
}

/**
 * Base class for all symbol table records.
 *
 * This class provides the fundamental functionality for all symbol table records,
 * including name management and common attributes. Symbol table records represent
 * entries in various symbol tables such as layer tables, linetype tables, text
 * style tables, etc.
 *
 * @template ATTRS - The type of attributes this symbol table record can have
 *
 * @example
 * ```typescript
 * class MySymbolTableRecord extends UvDbSymbolTableRecord<MySymbolTableRecordAttrs> {
 *   constructor(attrs?: Partial<MySymbolTableRecordAttrs>) {
 *     super(attrs);
 *   }
 * }
 * ```
 */
export class UvDbSymbolTableRecord<
  ATTRS extends UvDbSymbolTableRecordAttrs = UvDbSymbolTableRecordAttrs
> extends UvDbObject<ATTRS> {
  /**
   * Creates a new UvDbSymbolTableRecord instance.
   *
   * @param attrs - Input attribute values for this symbol table record
   * @param defaultAttrs - Default values for attributes of this symbol table record
   *
   * @example
   * ```typescript
   * const record = new UvDbSymbolTableRecord({ name: 'MyRecord' });
   * ```
   */
  constructor(attrs?: Partial<ATTRS>, defaultAttrs?: Partial<ATTRS>) {
    attrs = attrs || {}
    defaults(attrs, { name: '' })
    super(attrs, defaultAttrs)
  }

  /**
   * Gets or sets the name of the symbol table record.
   *
   * This property corresponds to DXF group code 2 and is used for
   * identifying and referencing the symbol table record.
   *
   * @returns The name of the symbol table record
   *
   * @example
   * ```typescript
   * const recordName = record.name;
   * record.name = 'NewRecordName';
   * ```
   */
  get name(): string {
    return this.getAttr('name')
  }
  set name(value: string) {
    this.setAttr('name', value)
  }
}
