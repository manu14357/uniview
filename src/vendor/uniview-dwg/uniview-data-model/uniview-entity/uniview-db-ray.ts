import {
  UvGeBox3d,
  UvGePoint3d,
  UvGePoint3dLike,
  UvGeVector3d
} from '@uniview/geometry'
import { UvGiRenderer } from '@uniview/graphics'

import { UvDbOsnapMode } from '../uniview-misc'
import { UvDbCurve } from './uniview-db-curve'
import { UvDbEntityProperties } from './uniview-db-entity-properties'

/**
 * Represents a ray entity in AutoCAD.
 *
 * A ray is a 3D geometric object that extends infinitely in one direction from a base point.
 * Rays are commonly used for construction lines, reference lines, and temporary geometry.
 * Unlike lines, rays have no end point and extend to infinity.
 *
 * @example
 * ```typescript
 * // Create a ray from origin in the positive X direction
 * const ray = new UvDbRay();
 * ray.basePoint = new UvGePoint3d(0, 0, 0);
 * ray.unitDir = new UvGeVector3d(1, 0, 0);
 *
 * // Access ray properties
 * console.log(`Base point: ${ray.basePoint}`);
 * console.log(`Unit direction: ${ray.unitDir}`);
 * ```
 */
export class UvDbRay extends UvDbCurve {
  /** The entity type name */
  static override typeName: string = 'Ray'

  /** The base point of the ray */
  private _basePoint: UvGePoint3d
  /** The unit direction vector of the ray */
  private _unitDir: UvGeVector3d

  /**
   * Creates a new ray entity.
   *
   * This constructor initializes a ray with default values.
   * The base point is at the origin and the unit direction is undefined.
   *
   * @example
   * ```typescript
   * const ray = new UvDbRay();
   * ray.basePoint = new UvGePoint3d(5, 10, 0);
   * ray.unitDir = new UvGeVector3d(0, 1, 0); // Positive Y direction
   * ```
   */
  constructor() {
    super()
    this._basePoint = new UvGePoint3d()
    this._unitDir = new UvGeVector3d()
  }

  /**
   * Gets the base point of this ray.
   *
   * The base point is the starting point from which the ray extends infinitely.
   *
   * @returns The base point as a 3D point
   *
   * @example
   * ```typescript
   * const basePoint = ray.basePoint;
   * console.log(`Ray base point: ${basePoint.x}, ${basePoint.y}, ${basePoint.z}`);
   * ```
   */
  get basePoint() {
    return this._basePoint
  }

  /**
   * Sets the base point of this ray.
   *
   * @param value - The new base point
   *
   * @example
   * ```typescript
   * ray.basePoint = new UvGePoint3d(10, 20, 0);
   * ```
   */
  set basePoint(value: UvGePoint3d) {
    this._basePoint.copy(value)
  }

  /**
   * Gets the unit direction vector of this ray.
   *
   * The unit direction vector defines the direction in which the ray extends
   * infinitely from the base point.
   *
   * @returns The unit direction vector
   *
   * @example
   * ```typescript
   * const unitDir = ray.unitDir;
   * console.log(`Ray direction: ${unitDir.x}, ${unitDir.y}, ${unitDir.z}`);
   * ```
   */
  get unitDir() {
    return this._unitDir
  }

  /**
   * Sets the unit direction vector of this ray.
   *
   * @param value - The new unit direction vector
   *
   * @example
   * ```typescript
   * ray.unitDir = new UvGeVector3d(0, 0, 1); // Positive Z direction
   * ```
   */
  set unitDir(value: UvGePoint3d) {
    this._unitDir.copy(value)
  }

  /**
   * Gets whether this ray is closed.
   *
   * Rays are always open entities, so this always returns false.
   *
   * @returns Always false for rays
   */
  get closed(): boolean {
    return false
  }

  /**
   * Gets the geometric extents (bounding box) of this ray.
   *
   * Since rays extend infinitely, this method returns a bounding box that
   * encompasses a finite portion of the ray for practical purposes.
   *
   * @returns The bounding box that encompasses a portion of the ray
   *
   * @example
   * ```typescript
   * const extents = ray.geometricExtents;
   * console.log(`Ray bounds: ${extents.minPoint} to ${extents.maxPoint}`);
   * ```
   */
  get geometricExtents(): UvGeBox3d {
    const extents = new UvGeBox3d()
    extents.expandByPoint(
      this._unitDir.clone().multiplyScalar(10).add(this._basePoint)
    )
    extents.expandByPoint(
      this._unitDir.clone().multiplyScalar(-10).add(this._basePoint)
    )
    return extents
  }

  /**
   * Returns the full property definition for this ray entity, including
   * general group and geometry group.
   *
   * The geometry group exposes editable start/end coordinates via
   * {@link UvDbPropertyAccessor} so the property palette can update
   * the ray in real-time.
   *
   * Each property is an {@link UvDbEntityRuntimeProperty}.
   */
  get properties(): UvDbEntityProperties {
    return {
      type: this.type,
      groups: [
        this.getGeneralProperties(),
        {
          groupName: 'geometry',
          properties: [
            {
              name: 'basePointX',
              type: 'float',
              editable: true,
              accessor: {
                get: () => this.basePoint.x,
                set: (v: number) => {
                  this.basePoint.x = v
                }
              }
            },
            {
              name: 'basePointY',
              type: 'float',
              editable: true,
              accessor: {
                get: () => this.basePoint.y,
                set: (v: number) => {
                  this.basePoint.y = v
                }
              }
            },
            {
              name: 'basePointZ',
              type: 'float',
              editable: true,
              accessor: {
                get: () => this.basePoint.z,
                set: (v: number) => {
                  this.basePoint.z = v
                }
              }
            },
            {
              name: 'unitDirX',
              type: 'float',
              editable: true,
              accessor: {
                get: () => this.unitDir.x,
                set: (v: number) => {
                  this.unitDir.x = v
                }
              }
            },
            {
              name: 'unitDirY',
              type: 'float',
              editable: true,
              accessor: {
                get: () => this.unitDir.y,
                set: (v: number) => {
                  this.unitDir.y = v
                }
              }
            },
            {
              name: 'unitDirZ',
              type: 'float',
              editable: true,
              accessor: {
                get: () => this.unitDir.z,
                set: (v: number) => {
                  this.unitDir.z = v
                }
              }
            }
          ]
        }
      ]
    }
  }

  /**
   * Gets the grip points for this ray.
   *
   * Grip points are control points that can be used to modify the ray.
   * For a ray, the grip point is the base point.
   *
   * @returns Array of grip points (base point)
   *
   * @example
   * ```typescript
   * const gripPoints = ray.subGetGripPoints();
   * // gripPoints contains: [basePoint]
   * ```
   */
  subGetGripPoints() {
    const gripPoints = new Array<UvGePoint3d>()
    gripPoints.push(this.basePoint)
    return gripPoints
  }

  /**
   * Gets the object snap points for this trace.
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
    switch (osnapMode) {
      case UvDbOsnapMode.EndPoint:
        snapPoints.push(this.basePoint)
        break
      default:
        break
    }
  }

  /**
   * Draws this ray using the specified renderer.
   *
   * This method renders the ray as a line segment extending from the base point
   * in the direction of the unit vector. For practical purposes, the ray is
   * drawn with a finite length.
   *
   * @param renderer - The renderer to use for drawing
   * @returns The rendered ray entity, or undefined if drawing failed
   */
  subWorldDraw(renderer: UvGiRenderer) {
    const points: UvGePoint3d[] = []
    points.push(this.basePoint)
    points.push(
      this._unitDir.clone().multiplyScalar(1000000).add(this._basePoint)
    )
    return renderer.lines(points)
  }
}
