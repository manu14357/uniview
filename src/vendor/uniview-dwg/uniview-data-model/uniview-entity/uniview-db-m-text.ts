import {
  UvGeBox3d,
  UvGePoint3d,
  UvGePoint3dLike,
  UvGeVector3d,
  UvGeVector3dLike
} from '@uniview/geometry'
import { UvGiRenderer, UvGiTextStyle } from '@uniview/graphics'
import {
  UvGiMTextAttachmentPoint,
  UvGiMTextData,
  UvGiMTextFlowDirection
} from '@uniview/graphics'

import { UvDbOsnapMode } from '../uniview-misc'
import { UvDbEntity } from './uniview-db-entity'
import { UvDbEntityProperties } from './uniview-db-entity-properties'

/**
 * Represents a multiline text (mtext) entity in AutoCAD.
 *
 * A multiline text entity is a 2D geometric object that displays formatted text
 * with support for multiple lines, word wrapping, and rich text formatting.
 * MText entities are more advanced than regular text entities and support
 * features like background fills, line spacing, and attachment points.
 *
 * @example
 * ```typescript
 * // Create a multiline text entity
 * const mtext = new UvDbMText();
 * mtext.contents = "This is a\nmultiline text\nwith formatting";
 * mtext.height = 2.5;
 * mtext.width = 20;
 * mtext.location = new UvGePoint3d(0, 0, 0);
 * mtext.attachmentPoint = UvGiMTextAttachmentPoint.TopLeft;
 *
 * // Access mtext properties
 * console.log(`Contents: ${mtext.contents}`);
 * console.log(`Height: ${mtext.height}`);
 * console.log(`Width: ${mtext.width}`);
 * ```
 */
export class UvDbMText extends UvDbEntity {
  /** The entity type name */
  static override typeName: string = 'MText'

  /** The height of the text */
  private _height: number
  /** The maximum width for word wrap formatting */
  private _width: number
  /** The text contents */
  private _contents: string
  /** The line spacing style */
  private _lineSpacingStyle: number
  /** The line spacing factor */
  private _lineSpacingFactor: number
  /** Whether background fill is enabled */
  private _backgroundFill: boolean
  /** The background fill color */
  private _backgroundFillColor: number
  /** The background scale factor */
  private _backgroundScaleFactor: number
  /** The background fill transparency */
  private _backgroundFillTransparency: number
  /** The rotation angle in radians */
  private _rotation: number
  /** The text style name */
  private _styleName: string
  /** The location point of the text */
  private _location: UvGePoint3d
  /** The attachment point for the text */
  private _attachmentPoint: UvGiMTextAttachmentPoint
  /** The direction vector of the text */
  private _direction: UvGeVector3d
  /** The drawing direction of the text */
  private _drawingDirection: UvGiMTextFlowDirection

  /**
   * Creates a new multiline text entity.
   *
   * This constructor initializes an mtext entity with default values.
   * The contents are empty, height and width are 0, and the location is at the origin.
   *
   * @example
   * ```typescript
   * const mtext = new UvDbMText();
   * mtext.contents = "Sample multiline text";
   * mtext.height = 3.0;
   * mtext.width = 15;
   * ```
   */
  constructor() {
    super()
    this._contents = ''
    this._height = 0
    this._width = 0
    this._lineSpacingFactor = 0.25
    this._lineSpacingStyle = 0
    this._backgroundFill = false
    this._backgroundFillColor = 0xc8c8c8
    this._backgroundFillTransparency = 1
    this._backgroundScaleFactor = 1
    this._rotation = 0
    this._styleName = ''
    this._location = new UvGePoint3d()
    this._attachmentPoint = UvGiMTextAttachmentPoint.TopLeft
    this._direction = new UvGeVector3d(1, 0, 0)
    this._drawingDirection = UvGiMTextFlowDirection.LEFT_TO_RIGHT
  }

  /**
   * Gets the contents of the mtext object.
   *
   * This returns a string that contains the contents of the mtext object.
   * Formatting data used for word wrap calculations is removed.
   *
   * @returns The text contents
   *
   * @example
   * ```typescript
   * const contents = mtext.contents;
   * console.log(`Text contents: ${contents}`);
   * ```
   */
  get contents() {
    return this._contents
  }

  /**
   * Sets the contents of the mtext object.
   *
   * @param value - The new text contents
   *
   * @example
   * ```typescript
   * mtext.contents = "New multiline\ntext content";
   * ```
   */
  set contents(value: string) {
    this._contents = value
  }

  /**
   * Gets the height of the text.
   *
   * @returns The text height
   *
   * @example
   * ```typescript
   * const height = mtext.height;
   * console.log(`Text height: ${height}`);
   * ```
   */
  get height() {
    return this._height
  }

  /**
   * Sets the height of the text.
   *
   * @param value - The new text height
   *
   * @example
   * ```typescript
   * mtext.height = 5.0;
   * ```
   */
  set height(value: number) {
    this._height = value
  }

  /**
   * Gets the maximum width setting used by the MText object for word wrap formatting.
   *
   * It is possible that none of the lines resulting from word wrap formatting will
   * reach this width value. Words which exceed this width value will not be broken,
   * but will extend beyond the given width.
   *
   * @returns The maximum width for word wrap
   *
   * @example
   * ```typescript
   * const width = mtext.width;
   * console.log(`Text width: ${width}`);
   * ```
   */
  get width() {
    return this._width
  }

  /**
   * Sets the maximum width setting used by the MText object for word wrap formatting.
   *
   * @param value - The new maximum width for word wrap
   *
   * @example
   * ```typescript
   * mtext.width = 25;
   * ```
   */
  set width(value: number) {
    this._width = value
  }

  /**
   * Gets the rotation angle of the text.
   *
   * The rotation angle is relative to the X axis of the text's OCS, with positive
   * angles going counterclockwise when looking down the Z axis toward the origin.
   *
   * @returns The rotation angle in radians
   *
   * @example
   * ```typescript
   * const rotation = mtext.rotation;
   * console.log(`Rotation: ${rotation} radians (${rotation * 180 / Math.PI} degrees)`);
   * ```
   */
  get rotation() {
    return this._rotation
  }
  set rotation(value: number) {
    this._rotation = value
  }

  /**
   * The line spacing factor (a value between 0.25 and 4.00).
   */
  get lineSpacingFactor() {
    return this._lineSpacingFactor
  }
  set lineSpacingFactor(value: number) {
    this._lineSpacingFactor = value
  }

  /**
   * The line spacing style.
   */
  get lineSpacingStyle() {
    return this._lineSpacingStyle
  }
  set lineSpacingStyle(value: number) {
    this._lineSpacingStyle = value
  }

  /**
   * Toggle the background fill on or off. If it is true, background color is turned off, and no
   * background fill color has been specified, this function sets the background fill color to
   * an RGB value of 200,200,200.
   */
  get backgroundFill() {
    return this._backgroundFill
  }
  set backgroundFill(value: boolean) {
    this._backgroundFill = value
    this._backgroundFillColor = 0xc8c8c8
  }

  /**
   * The background fill color. This property is valid only if background fill is enable.
   */
  get backgroundFillColor() {
    return this._backgroundFillColor
  }
  set backgroundFillColor(value: number) {
    this._backgroundFillColor = value
  }

  /**
   * The background fill transparency. This property is valid only if background fill is enable.
   */
  get backgroundFillTransparency() {
    return this._backgroundFillTransparency
  }
  set backgroundFillTransparency(value: number) {
    this._backgroundFillTransparency = value
  }

  /**
   * The background scale factor.
   */
  get backgroundScaleFactor() {
    return this._backgroundScaleFactor
  }
  set backgroundScaleFactor(value: number) {
    this._backgroundScaleFactor = value
  }

  /**
   * The style name stored in text ttyle table record and used by this text entity
   */
  get styleName() {
    return this._styleName
  }
  set styleName(value: string) {
    this._styleName = value
  }

  /**
   * The insertion point of this mtext entity.
   */
  get location() {
    return this._location
  }
  set location(value: UvGePoint3dLike) {
    this._location.copy(value)
  }

  /**
   * The attachment point value which determines how the text will be oriented around the insertion point
   * of the mtext object. For example, if the attachment point is UvGiAttachmentPoint.MiddleCenter, then
   * the text body will be displayed such that the insertion point appears at the geometric center of the
   * text body.
   */
  get attachmentPoint() {
    return this._attachmentPoint
  }
  set attachmentPoint(value: UvGiMTextAttachmentPoint) {
    this._attachmentPoint = value
  }

  /**
   * Represent the X axis ("horizontal") for the text. This direction vector is used to determine the text
   * flow direction.
   */
  get direction(): UvGeVector3d {
    return this._direction
  }
  set direction(value: UvGeVector3dLike) {
    this._direction.copy(value)
  }

  get drawingDirection() {
    return this._drawingDirection
  }
  set drawingDirection(value: UvGiMTextFlowDirection) {
    this._drawingDirection = value
  }

  /**
   * @inheritdoc
   */
  get geometricExtents(): UvGeBox3d {
    // TODO: Implement it correctly
    return new UvGeBox3d()
  }

  /**
   * Gets the object snap points for this mtext.
   *
   * Object snap points are precise points that can be used for positioning
   * when drawing or editing. This method provides snap points based on the
   * specified snap mode.
   *
   * @param osnapMode - The object snap mode
   * @param _pickPoint - The point where the user picked
   * @param _lastPoint - The last point
   * @param snapPoints - Array to populate with snap points
   */
  subGetOsnapPoints(
    osnapMode: UvDbOsnapMode,
    _pickPoint: UvGePoint3dLike,
    _lastPoint: UvGePoint3dLike,
    snapPoints: UvGePoint3dLike[]
  ) {
    if (UvDbOsnapMode.Insertion === osnapMode) {
      snapPoints.push(this._location)
    }
  }

  /**
   * Returns the full property definition for this mtext entity, including
   * general group and geometry group.
   *
   * The geometry group exposes editable start/end coordinates via
   * {@link UvDbPropertyAccessor} so the property palette can update
   * the mtext in real-time.
   *
   * Each property is an {@link UvDbEntityRuntimeProperty}.
   */
  get properties(): UvDbEntityProperties {
    return {
      type: this.type,
      groups: [
        this.getGeneralProperties(),
        {
          groupName: 'text',
          properties: [
            {
              name: 'contents',
              type: 'string',
              editable: true,
              accessor: {
                get: () => this.contents,
                set: (v: string) => {
                  this.contents = v
                }
              }
            },
            {
              name: 'styleName',
              type: 'string',
              editable: true,
              accessor: {
                get: () => this.styleName,
                set: (v: string) => {
                  this.styleName = v
                }
              }
            },
            {
              name: 'attachmentPoint',
              type: 'enum',
              editable: true,
              options: [
                { label: UvGiMTextAttachmentPoint[1], value: 1 },
                { label: UvGiMTextAttachmentPoint[2], value: 2 },
                { label: UvGiMTextAttachmentPoint[3], value: 3 },
                { label: UvGiMTextAttachmentPoint[4], value: 4 },
                { label: UvGiMTextAttachmentPoint[5], value: 5 },
                { label: UvGiMTextAttachmentPoint[6], value: 6 },
                { label: UvGiMTextAttachmentPoint[7], value: 7 },
                { label: UvGiMTextAttachmentPoint[8], value: 8 },
                { label: UvGiMTextAttachmentPoint[9], value: 9 }
              ],
              accessor: {
                get: () => this.attachmentPoint,
                set: (v: UvGiMTextAttachmentPoint) => {
                  this.attachmentPoint = v
                }
              }
            },
            {
              name: 'drawingDirection',
              type: 'enum',
              editable: true,
              options: [
                { label: UvGiMTextFlowDirection[1], value: 1 },
                { label: UvGiMTextFlowDirection[2], value: 2 },
                { label: UvGiMTextFlowDirection[3], value: 3 },
                { label: UvGiMTextFlowDirection[4], value: 4 },
                { label: UvGiMTextFlowDirection[5], value: 5 }
              ],
              accessor: {
                get: () => this.drawingDirection,
                set: (v: number) => {
                  this.drawingDirection = v
                }
              }
            },
            {
              name: 'textHeight',
              type: 'float',
              editable: true,
              accessor: {
                get: () => this.height,
                set: (v: number) => {
                  this.height = v
                }
              }
            },
            {
              name: 'rotation',
              type: 'float',
              editable: true,
              accessor: {
                get: () => this.rotation,
                set: (v: number) => {
                  this.rotation = v
                }
              }
            },
            {
              name: 'lineSpacingFactor',
              type: 'float',
              editable: true,
              accessor: {
                get: () => this.lineSpacingFactor,
                set: (v: number) => {
                  this.lineSpacingFactor = v
                }
              }
            },
            {
              name: 'definedWidth',
              type: 'float',
              editable: true,
              accessor: {
                get: () => this.width,
                set: (v: number) => {
                  this.width = v
                }
              }
            },
            {
              name: 'directionX',
              type: 'float',
              editable: true,
              accessor: {
                get: () => this.direction.x,
                set: (v: number) => {
                  this.direction.x = v
                }
              }
            },
            {
              name: 'directionY',
              type: 'float',
              editable: true,
              accessor: {
                get: () => this.direction.y,
                set: (v: number) => {
                  this.direction.y = v
                }
              }
            },
            {
              name: 'directionZ',
              type: 'float',
              editable: true,
              accessor: {
                get: () => this.direction.z,
                set: (v: number) => {
                  this.direction.z = v
                }
              }
            }
          ]
        },
        {
          groupName: 'geometry',
          properties: [
            {
              name: 'locationX',
              type: 'float',
              editable: true,
              accessor: {
                get: () => this.location.x,
                set: (v: number) => {
                  this.location.x = v
                }
              }
            },
            {
              name: 'locationY',
              type: 'float',
              editable: true,
              accessor: {
                get: () => this.location.y,
                set: (v: number) => {
                  this.location.y = v
                }
              }
            },
            {
              name: 'locationZ',
              type: 'float',
              editable: true,
              accessor: {
                get: () => this.location.z,
                set: (v: number) => {
                  this.location.z = v
                }
              }
            }
          ]
        }
      ]
    }
  }

  private getTextStyle(): UvGiTextStyle {
    const textStyleTable = this.database.tables.textStyleTable
    let style = textStyleTable.getAt(this.styleName)
    if (!style) {
      style = (textStyleTable.getAt('STANDARD') ||
        textStyleTable.getAt('Standard'))!
    }
    return style.textStyle
  }

  /**
   * Draws this entity using the specified renderer.
   *
   * @param renderer - The renderer to use for drawing
   * @param delay - The flag to delay creating one rendered entity and just create one dummy
   * entity. Renderer can delay heavy calculation operation to avoid blocking UI when this flag
   * is true.
   * @returns The rendered entity, or undefined if drawing failed
   */
  subWorldDraw(renderer: UvGiRenderer, delay?: boolean) {
    const mtextData: UvGiMTextData = {
      text: this.contents,
      height: this.height,
      width: this.width,
      position: this.location,
      rotation: this.rotation,
      directionVector: this.direction,
      attachmentPoint: this.attachmentPoint,
      drawingDirection: this.drawingDirection,
      lineSpaceFactor: this.lineSpacingFactor
    }
    return renderer.mtext(mtextData, this.getTextStyle(), delay)
  }
}
