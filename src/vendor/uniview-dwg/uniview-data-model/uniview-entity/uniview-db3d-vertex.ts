import {
  UvGeBox3d,
  UvGeMatrix3d,
  UvGePoint3d,
  UvGePoint3dLike
} from '@uniview/geometry'
import { UvGiRenderer } from '@uniview/graphics'

import { UvDbOsnapMode } from '../uniview-misc'
import { UvDbEntity } from './uniview-db-entity'

export enum UvDb3dVertexType {
  /**
   * A standard vertex within the polyface mesh.
   */
  SimpleVertex,
  /**
   * A control point for a spline or curve-fit mesh.
   */
  ControlVertex,
  /**
   * A vertex that was automatically generated as the result of a spline or curve-fit operation.
   * This type of vertex can go away or change automatically during subsequent editing operations
   * on the mesh.
   */
  FitVertex
}

/**
 * Represents the vertices within 3D polylines in AutoCAD.
 */
export class UvDb3dVertex extends UvDbEntity {
  /** The entity type name */
  static override typeName: string = '3dVertex'

  /** The WCS point value of this vertex */
  private _position: UvGePoint3d
  /** The vertex type */
  private _vertexType: UvDb3dVertexType

  /**
   * Creates a new 3d vertex entity.
   */
  constructor() {
    super()
    this._position = new UvGePoint3d()
    this._vertexType = UvDb3dVertexType.SimpleVertex
  }

  /**
   * Gets the WCS point value of this vertex.
   *
   * @returns The WCS point value of this vertex.
   */
  get position(): UvGePoint3d {
    return this._position
  }

  /**
   * Sets WCS point value of this vertex.
   *
   * @param value - The WCS point value of this vertex.
   */
  set position(value: UvGePoint3dLike) {
    this._position.copy(value)
  }

  /**
   * Gets the type of this vertex.
   * @returns The type of this vertex
   */
  get vertexType(): UvDb3dVertexType {
    return this._vertexType
  }

  /**
   * Sets the type of this vertex.
   * @param value - The type of this vertex
   */
  set vertexType(value: UvDb3dVertexType) {
    this._vertexType = value
  }

  /**
   * Gets the geometric extents (bounding box) of this vertex.
   *
   * @returns The bounding box that encompasses the entire vertex
   */
  get geometricExtents() {
    return new UvGeBox3d().expandByPoint(this._position)
  }

  /**
   * Gets the grip points for this vertex.
   *
   * @returns Array of grip points (center, start point, end point)
   */
  subGetGripPoints() {
    const gripPoints = new Array<UvGePoint3d>()
    gripPoints.push(this._position)
    return gripPoints
  }

  /**
   * Gets the object snap points for this vertex.
   *
   * Object snap points are precise points that can be used for positioning
   * when drawing or editing. This method provides snap points based on the
   * specified snap mode.
   *
   * @param _osnapMode - The object snap mode
   * @param _pickPoint - The point where the user picked
   * @param _lastPoint - The last point
   * @param snapPoints - Array to populate with snap points
   */
  subGetOsnapPoints(
    _osnapMode: UvDbOsnapMode,
    _pickPoint: UvGePoint3dLike,
    _lastPoint: UvGePoint3dLike,
    snapPoints: UvGePoint3dLike[]
  ) {
    snapPoints.push(this._position)
  }

  /**
   * Transforms this vertex by the specified matrix.
   *
   * @param matrix - The transformation matrix to apply
   * @returns This vertex after transformation
   */
  transformBy(matrix: UvGeMatrix3d) {
    this._position.applyMatrix4(matrix)
    return this
  }

  /**
   * Draws nothing because it will be drawn by its parent 3d polyline.
   *
   * @param renderer - The renderer to use for drawing
   * @returns undefined
   */
  subWorldDraw(_renderer: UvGiRenderer): undefined {
    return undefined
  }
}
