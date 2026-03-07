import { UvCmColor, UvGiLineWeight } from '@uniview/data-model'

import { UvApAnnotation, UvApContext } from '../uniview-app'
import { UvEdCommand, UvEdOpenMode } from '../uniview-editor'

/**
 * Base command for revision commands.
 */
export class UvApBaseRevCmd extends UvEdCommand {
  /**
   * The layer name for revision
   */
  private _revisionLayer?: string
  /**
   * The previous current layer
   */
  private _previousLayer?: string
  /**
   * The previous current entity color
   */
  private _previousCecolor?: string
  /**
   * The previous current entity line weight
   */
  private _previousCelweight?: UvGiLineWeight
  /**
   * The flag whether to show entity draw style toolbar
   */
  private _isShowEntityDrawStyleToolbar: boolean

  constructor() {
    super()
    this.mode = UvEdOpenMode.Review
    this._isShowEntityDrawStyleToolbar = true
  }

  /**
   * Returns true if it is to show entity draw style toolbar
   */
  get isShowEntityDrawStyleToolbar() {
    return this._isShowEntityDrawStyleToolbar
  }
  set isShowEntityDrawStyleToolbar(value: boolean) {
    this._isShowEntityDrawStyleToolbar = value
  }

  protected onCommandWillStart(context: UvApContext) {
    const db = context.doc.database
    const annotation = new UvApAnnotation(db)
    this._previousLayer = db.clayer
    this._previousCecolor = db.cecolor.toString()
    this._previousCelweight = db.celweight
    this._revisionLayer = annotation.getAnnotationLayer()
    db.clayer = this._revisionLayer
  }

  protected onCommandEnded(context: UvApContext) {
    const db = context.doc.database
    if (this._previousLayer) db.clayer = this._previousLayer
    if (this._previousCecolor)
      db.cecolor =
        UvCmColor.fromString(this._previousCecolor) ?? new UvCmColor()
    if (this._previousCelweight) db.celweight = this._previousCelweight
    this._previousLayer = undefined
    this._revisionLayer = undefined
  }
}
