import { UvCmColor, UvCmColorMethod } from '@uniview/common'
import {
  UvGeBox3d,
  UvGeLine3d,
  UvGePoint3d,
  UvGePoint3dLike,
  UvGePointLike,
  UvGeVector3d
} from '@uniview/geometry'
import { UvGiMTextAttachmentPoint } from '@uniview/graphics'

import { UvDbBlockTableRecord } from '../../uniview-database'
import { UvDbBlockReference } from '../uniview-db-block-reference'
import { UvDbLine } from '../uniview-db-line'
import { UvDbMText } from '../uniview-db-m-text'
import { UvDbDimension } from './uniview-db-dimension'

/**
 * Represents an aligned dimension entity in AutoCAD.
 *
 * An aligned dimension measures the distance between two points located anywhere in space.
 * The dimension's normal vector must be perpendicular to the line between the two points.
 * The two selected points are also used as the definition points for the start of the
 * two dimension extension lines.
 *
 * Aligned dimensions are commonly used to measure distances that are not parallel to
 * the X or Y axes, providing accurate measurements regardless of the orientation.
 *
 * @example
 * ```typescript
 * // Create an aligned dimension
 * const alignedDim = new UvDbAlignedDimension(
 *   new UvGePoint3d(0, 0, 0),    // First extension line point
 *   new UvGePoint3d(10, 5, 0),   // Second extension line point
 *   new UvGePoint3d(5, 2.5, 0),  // Dimension line point
 *   "10.0",                      // Dimension text
 *   "Standard"                   // Dimension style
 * );
 *
 * // Access dimension properties
 * console.log(`Dimension line point: ${alignedDim.dimLinePoint}`);
 * console.log(`Extension line 1 point: ${alignedDim.xLine1Point}`);
 * console.log(`Extension line 2 point: ${alignedDim.xLine2Point}`);
 * ```
 */
export class UvDbAlignedDimension extends UvDbDimension {
  /** The entity type name */
  static override typeName: string = 'AlignedDimension'

  /** The definition point that specifies where the dimension line will be */
  private _dimLinePoint: UvGePoint3d
  /** The start point for the first extension line */
  private _xLine1Point: UvGePoint3d
  /** The start point for the second extension line */
  private _xLine2Point: UvGePoint3d
  /** The extension line obliquing angle in radians */
  private _oblique: number
  /** The dimension's rotation angle in radians */
  private _rotation: number

  /**
   * Creates a new aligned dimension entity.
   *
   * This constructor initializes an aligned dimension using the specified points.
   * The extension line obliquing angle is set to 0.0 by default.
   *
   * @param xLine1Point - Start point (in WCS coordinates) of first extension line
   * @param xLine2Point - Start point (in WCS coordinates) of second extension line
   * @param dimLinePoint - Point (in WCS coordinates) on dimension line itself
   * @param dimText - Text string to use as the dimension annotation (optional)
   * @param dimStyle - String name of dimension style table record to use (optional)
   *
   * @example
   * ```typescript
   * // Create an aligned dimension with default text and style
   * const alignedDim = new UvDbAlignedDimension(
   *   new UvGePoint3d(0, 0, 0),
   *   new UvGePoint3d(10, 5, 0),
   *   new UvGePoint3d(5, 2.5, 0)
   * );
   *
   * // Create an aligned dimension with custom text and style
   * const alignedDim2 = new UvDbAlignedDimension(
   *   new UvGePoint3d(0, 0, 0),
   *   new UvGePoint3d(15, 10, 0),
   *   new UvGePoint3d(7.5, 5, 0),
   *   "15.0",
   *   "Architectural"
   * );
   * ```
   */
  constructor(
    xLine1Point: UvGePointLike,
    xLine2Point: UvGePointLike,
    dimLinePoint: UvGePointLike,
    dimText: string | null = null,
    dimStyle: string | null = null
  ) {
    super()
    this._dimLinePoint = new UvGePoint3d().copy(dimLinePoint)
    this._xLine1Point = new UvGePoint3d().copy(xLine1Point)
    this._xLine2Point = new UvGePoint3d().copy(xLine2Point)
    this._oblique = 0
    this._rotation = 0
    this.calculateRotation()

    if (dimText) {
      this.dimensionText = dimText
    } else {
      // TODO: Decide the umber of digits after the decimal point
      this.dimensionText = this._xLine1Point
        .distanceTo(this._xLine2Point)
        .toFixed(3)
    }

    // TODO: Set it to the current default dimStyle within the AutoCAD editor if dimStyle is null
    this.dimensionStyleName = dimStyle
  }

  /**
   * Gets the definition point that specifies where the dimension line will be.
   *
   * This point will be somewhere on the dimension line and determines the position
   * of the dimension text and arrows.
   *
   * @returns The dimension line point in WCS coordinates
   *
   * @example
   * ```typescript
   * const dimLinePoint = alignedDim.dimLinePoint;
   * console.log(`Dimension line point: ${dimLinePoint.x}, ${dimLinePoint.y}, ${dimLinePoint.z}`);
   * ```
   */
  get dimLinePoint(): UvGePoint3d {
    return this._dimLinePoint
  }

  /**
   * Sets the definition point that specifies where the dimension line will be.
   *
   * @param value - The new dimension line point
   *
   * @example
   * ```typescript
   * alignedDim.dimLinePoint = new UvGePoint3d(5, 2.5, 0);
   * ```
   */
  set dimLinePoint(value: UvGePoint3dLike) {
    this._dimLinePoint.copy(value)
  }

  /**
   * Gets the start point for the first extension line of the dimension.
   *
   * @returns The first extension line point in WCS coordinates
   *
   * @example
   * ```typescript
   * const xLine1Point = alignedDim.xLine1Point;
   * console.log(`Extension line 1 point: ${xLine1Point.x}, ${xLine1Point.y}, ${xLine1Point.z}`);
   * ```
   */
  get xLine1Point(): UvGePoint3d {
    return this._xLine1Point
  }

  /**
   * Sets the start point for the first extension line of the dimension.
   *
   * @param value - The new first extension line point
   *
   * @example
   * ```typescript
   * alignedDim.xLine1Point = new UvGePoint3d(0, 0, 0);
   * ```
   */
  set xLine1Point(value: UvGePoint3dLike) {
    this._xLine1Point.copy(value)
  }

  /**
   * Gets the start point for the second extension line of the dimension.
   *
   * @returns The second extension line point in WCS coordinates
   *
   * @example
   * ```typescript
   * const xLine2Point = alignedDim.xLine2Point;
   * console.log(`Extension line 2 point: ${xLine2Point.x}, ${xLine2Point.y}, ${xLine2Point.z}`);
   * ```
   */
  get xLine2Point(): UvGePoint3d {
    return this._xLine2Point
  }

  /**
   * Sets the start point for the second extension line of the dimension.
   *
   * @param value - The new second extension line point
   *
   * @example
   * ```typescript
   * alignedDim.xLine2Point = new UvGePoint3d(10, 5, 0);
   * ```
   */
  set xLine2Point(value: UvGePoint3dLike) {
    this._xLine2Point.copy(value)
  }

  /**
   * Gets the dimension's rotation angle.
   *
   * @returns The rotation angle in radians
   *
   * @example
   * ```typescript
   * const rotation = alignedDim.rotation;
   * console.log(`Rotation: ${rotation} radians (${rotation * 180 / Math.PI} degrees)`);
   * ```
   */
  get rotation() {
    return this._rotation
  }

  /**
   * Sets the dimension's rotation angle.
   *
   * @param value - The new rotation angle in radians
   *
   * @example
   * ```typescript
   * alignedDim.rotation = Math.PI / 4; // 45 degrees
   * ```
   */
  set rotation(value: number) {
    this._rotation = value
  }

  /**
   * Gets the extension line obliquing angle.
   *
   * @returns The obliquing angle in radians
   *
   * @example
   * ```typescript
   * const oblique = alignedDim.oblique;
   * console.log(`Oblique angle: ${oblique} radians`);
   * ```
   */
  get oblique() {
    return this._oblique
  }

  /**
   * Sets the extension line obliquing angle.
   *
   * @param value - The new obliquing angle in radians
   *
   * @example
   * ```typescript
   * alignedDim.oblique = Math.PI / 6; // 30 degrees
   * ```
   */
  set oblique(value: number) {
    this._oblique = value
  }

  /**
   * @inheritdoc
   */
  get geometricExtents() {
    // TODO: Finish it
    return new UvGeBox3d()
  }

  /**
   * @inheritdoc
   */
  protected get isAppendArrow() {
    return false
  }

  createDimBlock(blockName: string) {
    // Create block and add the hatch entity in this block
    const block = new UvDbBlockTableRecord()
    block.name = blockName
    const lines = this.createLines()
    lines.forEach(line =>
      block.appendEntity(new UvDbLine(line.startPoint, line.endPoint))
    )

    // Create arrows at the end of dimension line
    const arrows = this.createArrows(lines[0])
    arrows.forEach(arrow => block.appendEntity(arrow))

    // Create dimension texts above dimension line
    const textPos = lines[0].midPoint
    const texts = this.createMText(textPos, this._rotation)
    if (texts) block.appendEntity(texts)

    return block
  }

  private createMText(pos: UvGePoint3dLike, rotation: number) {
    const angleDegToUnitVector = (angleRad: number) => {
      return {
        x: Math.cos(angleRad),
        y: Math.sin(angleRad),
        z: 0
      }
    }

    if (this.dimensionText) {
      const mtext = new UvDbMText()
      mtext.attachmentPoint = UvGiMTextAttachmentPoint.MiddleLeft
      mtext.layer = '0'
      mtext.color = new UvCmColor(UvCmColorMethod.ByBlock)
      mtext.location = pos
      mtext.contents = this.dimensionText ?? ''
      mtext.height = 10
      mtext.direction = angleDegToUnitVector(rotation)
      mtext.styleName = this.dimensionStyle.dimtxsty
      return mtext
    }
    return undefined
  }

  private createArrows(dimensionLine: UvGeLine3d) {
    const arrows: UvDbBlockReference[] = []
    arrows.push(
      this.createArrow(dimensionLine.startPoint, this.rotation + Math.PI, 10)
    )
    arrows.push(this.createArrow(dimensionLine.endPoint, this.rotation, 10))
    return arrows
  }

  private createArrow(
    pos: UvGePoint3dLike,
    rotation: number,
    scaleFactor: number
  ) {
    const blockName = '_CAXARROW'
    const insert = new UvDbBlockReference(blockName)
    insert.position = pos
    insert.rotation = rotation
    insert.scaleFactors = { x: scaleFactor, y: scaleFactor, z: scaleFactor }
    return insert
  }

  /**
   * Return one array which contains three lines of the alinged dimension.
   * - The first line in the array is dimension line.
   * - The second line and the third line in the array are extension lines.
   * @returns Return three lines of the alinged dimension
   */
  protected createLines() {
    const lines: UvGeLine3d[] = []

    const extensionLine1 = this.createExtensionLine(this._xLine1Point)
    const extensionLine2 = this.createExtensionLine(this._xLine2Point)

    const intersectionPoint1 = this.findIntersectionPoint(
      extensionLine1,
      this._dimLinePoint
    )
    const intersectionPoint2 = this.findIntersectionPoint(
      extensionLine2,
      this._dimLinePoint
    )
    const dimensionLine = new UvGeLine3d(intersectionPoint1, intersectionPoint2)
    lines.push(dimensionLine)

    // Create the first extension line with extension
    extensionLine1.endPoint = intersectionPoint1
    this.adjustExtensionLine(extensionLine1)
    lines.push(extensionLine1)

    // Create the second extension line with extension
    extensionLine2.endPoint = intersectionPoint2
    this.adjustExtensionLine(extensionLine2)
    lines.push(extensionLine2)

    return lines
  }

  private createExtensionLine(point: UvGePoint3d) {
    const angle = this.rotation + Math.PI / 2
    const anotherPoint = this.findPointOnLine2(point, angle, 100)
    return new UvGeLine3d(point, { ...anotherPoint, z: point.z })
  }

  /**
   * Compute the intersection point between a line 'line1' and a line 'line2' that passes through
   * a given point 'p' and is perpendicular to line 'line1'.
   *
   * @param line The 'line1'.
   * @param p The point through which the perpendicular 'line2' passes.
   * @returns Returns the intersection point of 'line1' and 'line2'.
   */
  private findIntersectionPoint(line1: UvGeLine3d, p: UvGeVector3d) {
    const p1 = line1.startPoint
    const p2 = line1.endPoint

    // Direction of line1 (p1 - p2)
    const directionOfLine1 = new UvGeVector3d().subVectors(p2, p1).normalize()

    // Vector from point 'p1' to point 'p3'
    const vectorFromP1ToP3 = new UvGeVector3d().subVectors(p, p1)

    // Project vectorAP onto directionL to get the projection vector
    const projectionLength = vectorFromP1ToP3.dot(directionOfLine1)
    const projectionVector = new UvGeVector3d()
      .copy(directionOfLine1)
      .multiplyScalar(projectionLength)

    // Intersection point is the point on line L at the projection
    const intersection = new UvGeVector3d().addVectors(p1, projectionVector)

    return intersection
  }

  private calculateRotation() {
    const p1 = this._xLine1Point
    const p2 = this._xLine2Point
    const dx = p2.x - p1.x
    const dy = p2.y - p1.y
    this._rotation = Math.atan2(dy, dx)
  }
}
