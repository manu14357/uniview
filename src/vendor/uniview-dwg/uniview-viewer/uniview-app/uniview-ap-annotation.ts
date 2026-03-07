import {
  UvCmColor,
  UvCmColorMethod,
  UvDbDatabase,
  UvDbDxfCode,
  UvDbLayerTableRecord,
  UvDbObject,
  UvDbObjectId,
  UvDbResultBuffer,
  UvGiLineWeight
} from '@uniview/data-model'

export class UvApAnnotation {
  /**
   * Default annotation color is red
   */
  static DEFAULT_ANNOTATION_COLOR = new UvCmColor(UvCmColorMethod.ByACI, 1)
  static DEFAULT_ANNOTATION_LINE_WEIGHT = UvGiLineWeight.LineWeight100
  private _database: UvDbDatabase

  constructor(db: UvDbDatabase) {
    this._database = db
  }

  /**
   * Finds or creates a annotation layer identified by MLightCAD-specific XData.
   *
   * This method enforces the concept of a *singleton annotation layer* in a drawing.
   * It first scans all existing layers and looks for one whose XData contains
   * a description value of `"uniview-dwg"` under the registered application name
   * `"uniview-dwg"`.
   *
   * Behavior:
   * - If such a layer already exists, its name is returned and **no new layer
   *   is created**.
   * - If no matching layer is found, a new layer is created with:
   *   - A unique name using the prefix `"$revision_"` followed by a numeric index
   *     (e.g. `$revision_1`, `$revision_2`, …)
   *   - Yellow color (ACI = 2)
   *   - Layer turned on and plottable
   *   - XData attached to mark it as an MLightCAD annotation layer
   *
   * XData layout:
   * - RegApp name: `"uniview-dwg"`
   * - Description (ASCII string): `"uniview-dwg"`
   *
   * The attached XData allows the annotation layer to be reliably identified even
   * if the layer is renamed by the user.
   *
   * @returns The name of the existing or newly created annotation layer.
   */
  public getAnnotationLayer(): string {
    const prefix = '$revision_'
    const appId = UvDbDatabase.UNIVIEW_DWG_APPID

    const layerTable = this._database.tables.layerTable

    // 1. Try to find an existing annotation layer by XData
    for (const layer of layerTable.newIterator()) {
      if (this.hasAnnotationXData(layer)) return layer.name
    }

    // 2. Generate a unique layer name
    let index = 1
    let layerName = `${prefix}${index}`
    while (layerTable.has(layerName)) {
      index++
      layerName = `${prefix}${index}`
    }

    // 3. Create the layer
    const record = new UvDbLayerTableRecord({
      name: layerName,
      isOff: false,
      // Use red color as default color
      color: new UvCmColor(UvCmColorMethod.ByACI, 1),
      isPlottable: true
    })

    // 4. Attach XData
    const xdata = new UvDbResultBuffer([
      { code: UvDbDxfCode.ExtendedDataRegAppName, value: appId },
      { code: UvDbDxfCode.ExtendedDataAsciiString, value: appId }
    ])

    record.setXData(xdata)

    layerTable.add(record)

    return layerName
  }

  filterAnnotationEntities(ids: UvDbObjectId[]) {
    const layerName = this.getAnnotationLayer()
    return ids.filter(id => {
      const entity = this._database.tables.blockTable.getEntityById(id)
      return entity && entity.layer == layerName
    })
  }

  /**
   * Returns true if the specified object contains annotation xdata, which means
   * it is only object created by annotation related commands.
   * @param object - Object to check whether it contains annotation xdata.
   * @returns Returns true if the specified object contains annotation xdata.
   */
  public hasAnnotationXData(object: UvDbObject) {
    const appId = UvDbDatabase.UNIVIEW_DWG_APPID
    const xdata = object.getXData(appId)
    if (!xdata) return false

    // Look for Description string == 'uniview-dwg'
    for (const tv of xdata) {
      if (
        tv.code === UvDbDxfCode.ExtendedDataAsciiString &&
        tv.value === appId
      ) {
        return true
      }
    }
    return false
  }
}
