import {
  UvDbAlignedDimension,
  UvDbDatabase,
  UvDbDataGenerator,
  UvGePoint2dLike,
  UvGePoint3dLike
} from '@uniview/data-model'

import { UvApContext, UvApDocManager } from '../uniview-app'
import {
  UvEdBaseView,
  UvEdCommand,
  UvEdOpenMode,
  UvEdPreviewJig,
  UvEdPromptPointOptions
} from '../uniview-editor'
import { UvApI18n } from '../uniview-i18n'

export class UvApDimJig extends UvEdPreviewJig<UvGePoint3dLike> {
  private _db: UvDbDatabase
  private _dim: UvDbAlignedDimension
  private _dimBlockName = '*UDIM'

  /**
   * Creates a dimension jig.
   *
   * @param view - The associated view
   */
  constructor(
    view: UvEdBaseView,
    db: UvDbDatabase,
    xline1Point: UvGePoint3dLike,
    xline2Point: UvGePoint3dLike
  ) {
    super(view)
    this._db = db
    // Gurantee arrow block created because it is used by dimension
    const generator = new UvDbDataGenerator(db)
    generator.createArrowBlock()
    this._dim = new UvDbAlignedDimension(xline1Point, xline2Point, xline1Point)
    this._dim.rotation = 0
  }

  get entity(): UvDbAlignedDimension {
    return this._dim
  }

  update(point: UvGePoint3dLike) {
    this._dim.dimLinePoint = point
    this._dim.rotation = this.calculateAngle(
      this._dim.xLine1Point,
      this._dim.xLine2Point
    )
    this._dim.dimensionText = this._dim.xLine1Point
      .distanceTo(this._dim.xLine2Point)
      .toFixed(3)

    const blockName = this._dimBlockName
    this._db.tables.blockTable.remove(blockName)
    this._db.tables.blockTable.add(this._dim.createDimBlock(blockName))
    this._dim.dimBlockId = blockName
  }

  end() {
    super.end()
    this._db.tables.blockTable.remove(this._dimBlockName)
  }

  private calculateAngle(p1: UvGePoint2dLike, p2: UvGePoint2dLike) {
    const dx = p2.x - p1.x
    const dy = p2.y - p1.y
    return Math.atan2(dy, dx)
  }
}

/**
 * Command to create one aligned dimension.
 */
export class UvApDimLinearCmd extends UvEdCommand {
  constructor() {
    super()
    this.mode = UvEdOpenMode.Review
  }

  async execute(context: UvApContext) {
    const xLine1PointPrompt = new UvEdPromptPointOptions(
      UvApI18n.t('jig.dimlinear.xLine1Point')
    )
    const xLine1Point =
      await UvApDocManager.instance.editor.getPoint(xLine1PointPrompt)

    const xLine2PointPrompt = new UvEdPromptPointOptions(
      UvApI18n.t('jig.dimlinear.xLine2Point')
    )
    xLine2PointPrompt.useBasePoint = true
    const xLine2Point =
      await UvApDocManager.instance.editor.getPoint(xLine2PointPrompt)

    const dimLinePointPrompt = new UvEdPromptPointOptions(
      UvApI18n.t('jig.dimlinear.dimLinePoint')
    )
    dimLinePointPrompt.jig = new UvApDimJig(
      context.view,
      context.doc.database,
      xLine1Point,
      xLine2Point
    )
    const dimLinePoint =
      await UvApDocManager.instance.editor.getPoint(dimLinePointPrompt)

    const db = context.doc.database
    const dimension = new UvDbAlignedDimension(
      xLine1Point,
      xLine2Point,
      dimLinePoint
    )

    const blockName = this.getAvailableDimBlockName(db)
    db.tables.blockTable.add(dimension.createDimBlock(blockName))
    dimension.dimBlockId = blockName
    db.tables.blockTable.modelSpace.appendEntity(dimension)
  }

  private getAvailableDimBlockName(db: UvDbDatabase) {
    const blocks = db.tables.blockTable.newIterator()

    let maxNum = 0

    for (const block of blocks) {
      const name = block.name
      if (!name.startsWith('*D')) continue

      const num = Number(name.slice(2)) // part after "*D"
      if (Number.isInteger(num) && num > maxNum) {
        maxNum = num
      }
    }

    return `*D${maxNum + 1}`
  }
}
