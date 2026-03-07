import { UvCmColor } from '@uniview/common'
import { UvGeLine2d, UvGeLoop2d } from '@uniview/geometry'

import {
  UvDbBlockTableRecord,
  UvDbDatabase,
  UvDbDimStyleTableRecord,
  UvDbLayerTableRecord,
  UvDbLinetypeTableRecord,
  UvDbTextStyleTableRecord
} from '../uniview-database'
import { UvDbHatch } from '../uniview-entity'
import { UvDbLayout } from '../uniview-object'

export class UvDbDataGenerator {
  readonly db: UvDbDatabase
  constructor(db: UvDbDatabase) {
    this.db = db
  }
  createDefaultLayer() {
    const defaultColor = new UvCmColor()
    defaultColor.colorIndex = 7 // white
    return this.db.tables.layerTable.add(
      new UvDbLayerTableRecord({
        name: '0',
        standardFlags: 0,
        linetype: 'Continuous',
        lineWeight: 0,
        isOff: false,
        color: defaultColor,
        isPlottable: true
      })
    )
  }

  createDefaultLineType() {
    this.db.tables.linetypeTable.add(
      new UvDbLinetypeTableRecord({
        name: 'ByBlock',
        standardFlag: 0,
        description: '',
        totalPatternLength: 0
      })
    )
    this.db.tables.linetypeTable.add(
      new UvDbLinetypeTableRecord({
        name: 'ByLayer',
        standardFlag: 0,
        description: '',
        totalPatternLength: 0
      })
    )
    this.db.tables.linetypeTable.add(
      new UvDbLinetypeTableRecord({
        name: 'Continuous',
        standardFlag: 0,
        description: 'Solid line',
        totalPatternLength: 0
      })
    )
  }

  createDefaultTextStyle() {
    this.db.tables.textStyleTable.add(
      new UvDbTextStyleTableRecord({
        name: 'Standard',
        standardFlag: 0,
        fixedTextHeight: 0,
        widthFactor: 1,
        obliqueAngle: 0,
        textGenerationFlag: 0,
        lastHeight: 0.2,
        font: 'SimKai',
        bigFont: '',
        extendedFont: 'SimKai'
      })
    )
  }

  createDefaultDimStyle() {
    this.db.tables.dimStyleTable.add(
      new UvDbDimStyleTableRecord({
        name: 'Standard',
        dimtxsty: 'Standard'
      })
    )
  }

  createDefaultLayout() {
    const layout = new UvDbLayout()
    layout.layoutName = 'Model'
    layout.tabOrder = 0
    layout.blockTableRecordId = this.db.tables.blockTable.modelSpace.objectId
    layout.limits.min.copy({ x: 0, y: 0 })
    layout.limits.max.copy({ x: 1000000, y: 1000000 })
    layout.extents.min.copy({ x: 0, y: 0, z: 0 })
    layout.extents.max.copy({ x: 1000000, y: 1000000, z: 0 })
    this.db.objects.layout.setAt(layout.layoutName, layout)
    this.db.tables.blockTable.modelSpace.layoutId = layout.objectId
  }

  createArrowBlock() {
    const blockName = '_CAXARROW'
    if (!this.db.tables.blockTable.getAt(blockName)) {
      // Create arrow
      const hatch = new UvDbHatch()
      hatch.patternName = 'SOLID'
      const loop = new UvGeLoop2d()
      loop.add(new UvGeLine2d({ x: 0, y: 0 }, { x: -1, y: 0.125 }))
      loop.add(new UvGeLine2d({ x: -1, y: 0.125 }, { x: -1, y: -0.125 }))
      loop.add(new UvGeLine2d({ x: -1, y: -0.125 }, { x: 0, y: 0 }))
      hatch.add(loop)

      // Create block and add the hatch entity in this block
      const block = new UvDbBlockTableRecord()
      block.name = '_CAXARROW'
      block.appendEntity(hatch)
      this.db.tables.blockTable.add(block)
    }
  }
}
