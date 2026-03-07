import { ParsedDxf } from '@uniview/dxf-parser'
import {
  CommonDXFObject,
  ImageDefDXFObject,
  LayoutDXFObject
} from '@uniview/dxf-parser'

import { UvDbObject } from '../uniview-base'
import { UvDbBlockTableRecord } from '../uniview-database/uniview-db-block-table-record'
import { UvDbLayout, UvDbRasterImageDef } from '../uniview-object'

/**
 * Converts DXF objects to UvDbObject instances.
 *
 * This class provides functionality to convert various DXF object types
 * (such as layouts and image definitions) into their corresponding
 * UvDbObject instances.
 *
 * @example
 * ```typescript
 * const converter = new UvDbObjectConverter();
 * const layout = converter.convertLayout(dxfLayout);
 * const imageDef = converter.convertImageDef(dxfImageDef);
 * ```
 */
export class UvDbObjectConverter {
  /**
   * Converts a DXF layout object to an UvDbLayout.
   *
   * @param layout - The DXF layout object to convert
   * @returns The converted UvDbLayout instance
   *
   * @example
   * ```typescript
   * const dxfLayout = { layoutName: 'Model', tabOrder: 1, ... };
   * const acDbLayout = converter.convertLayout(dxfLayout);
   * ```
   */
  convertLayout(layout: LayoutDXFObject, model: ParsedDxf) {
    const dbObject = new UvDbLayout()
    dbObject.layoutName = layout.layoutName
    dbObject.tabOrder = layout.tabOrder

    if (layout.layoutName === 'Model') {
      // Upper case model space name
      const modelSpaceName = UvDbBlockTableRecord.MODEL_SPACE_NAME
      model.tables.BLOCK_RECORD?.entries.some(btr => {
        if (btr.name.toUpperCase() === modelSpaceName) {
          dbObject.blockTableRecordId = btr.handle
          return true
        }
        return false
      })
    } else {
      // layout.paperSpaceTableId doesn't point to the block table record asscicated with
      // this layout. So let's get the assocated block table record id from block table.
      model.tables.BLOCK_RECORD?.entries.some(btr => {
        if (btr.layoutObjects === layout.handle) {
          dbObject.blockTableRecordId = btr.handle
          return true
        }
        return false
      })

      // If blockTableRecordId value is still invalid, let's try to use
      // layout.paperSpaceTableId finally
      if (!dbObject.blockTableRecordId) {
        dbObject.blockTableRecordId = layout.paperSpaceTableId
      }
    }

    dbObject.limits.min.copy(layout.minLimit)
    dbObject.limits.max.copy(layout.maxLimit)
    dbObject.extents.min.copy(layout.minExtent)
    dbObject.extents.max.copy(layout.maxExtent)
    this.processCommonAttrs(layout, dbObject)
    return dbObject
  }

  /**
   * Converts a DXF image definition object to an UvDbRasterImageDef.
   *
   * @param image - The DXF image definition object to convert
   * @returns The converted UvDbRasterImageDef instance
   *
   * @example
   * ```typescript
   * const dxfImageDef = { fileName: 'image.jpg', ... };
   * const acDbImageDef = converter.convertImageDef(dxfImageDef);
   * ```
   */
  convertImageDef(image: ImageDefDXFObject) {
    const dbObject = new UvDbRasterImageDef()
    dbObject.sourceFileName = image.fileName
    this.processCommonAttrs(image, dbObject)
    return dbObject
  }

  /**
   * Processes common attributes from a DXF object to an UvDbObject.
   *
   * This method copies common properties like object ID and owner ID
   * from the DXF object to the corresponding UvDbObject.
   *
   * @param object - The source DXF object
   * @param dbObject - The target UvDbObject to populate
   *
   * @example
   * ```typescript
   * converter.processCommonAttrs(dxfObject, acDbObject);
   * ```
   */
  private processCommonAttrs(object: CommonDXFObject, dbObject: UvDbObject) {
    dbObject.objectId = object.handle
    dbObject.ownerId = object.ownerObjectId
  }
}
