import { UvCmErrors } from '@uniview/common'

import {
  UvGeBox3d,
  UvGeMatrix3d,
  UvGePlane,
  UvGePoint3d,
  UvGePoint3dLike,
  UvGePointLike,
  UvGeVector3d,
  UvGeVector3dLike
} from '../uniview-math'
import { UvGeMathUtil, ORIGIN_POINT_3D, TAU } from '../uniview-util'
import { UvGeCurve3d } from './uniview-ge-curve3d'
import { UvGeLine3d } from './uniview-ge-line3d'

/**
 * The class represeting both full circles and circular arcs in 3d space. The ellipse arc is
 * defined by a center point, radius, start angle, end angle, a normal vector, and a reference
 * vector. If start angle is equal to 0 and end angle is equal to 2 * Math.PI, it represents
 * a full circle.
 */
export class UvGeCircArc3d extends UvGeCurve3d {
  private _center!: UvGePoint3d
  private _radius!: number
  private _startAngle!: number
  private _endAngle!: number
  private _normal!: UvGeVector3d
  private _refVec!: UvGeVector3d

  /**
   * Compute center point of the arc given three points
   * @param startPoint Input start point of the arc
   * @param endPoint Input end point of the arc
   * @param pointOnArc Input one point on the arc (P3)
   * @returns Return center point of the arc
   */
  static computeCenterPoint(
    startPoint: UvGePoint3dLike,
    endPoint: UvGePoint3dLike,
    pointOnArc: UvGePoint3dLike
  ): UvGePoint3d | null {
    // Midpoints of the edges
    const mid1 = new UvGeVector3d()
      .addVectors(startPoint, endPoint)
      .multiplyScalar(0.5)
    const mid2 = new UvGeVector3d()
      .addVectors(startPoint, pointOnArc)
      .multiplyScalar(0.5)

    // Vectors perpendicular to the edges
    const vec1 = new UvGeVector3d().subVectors(endPoint, startPoint)
    const vec2 = new UvGeVector3d().subVectors(pointOnArc, startPoint)

    // Normal vector to the plane formed by the triangle
    const normal = new UvGeVector3d().crossVectors(vec1, vec2).normalize()

    if (normal.lengthSq() === 0) {
      // If the points are collinear, the normal vector will have zero length.
      console.error('Points are collinear and cannot form a valid arc.')
      return null
    }

    // Compute perpendicular vectors on the plane of the triangle
    const perpendicular1 = new UvGeVector3d()
      .crossVectors(vec1, normal)
      .normalize()
    const perpendicular2 = new UvGeVector3d()
      .crossVectors(vec2, normal)
      .normalize()

    // Solve the system of equations to find the intersection point (center of the circle)
    const direction1 = perpendicular1
      .clone()
      .multiplyScalar(Number.MAX_SAFE_INTEGER)
    const direction2 = perpendicular2
      .clone()
      .multiplyScalar(Number.MAX_SAFE_INTEGER)

    const line1 = new UvGeLine3d(mid1, mid1.clone().add(direction1))
    const line2 = new UvGeLine3d(mid2, mid2.clone().add(direction2))

    const center = new UvGeVector3d()
    const result = line1.closestPointToPoint(line2.startPoint, true, center)
    if (!result) {
      console.error('Cannot find a valid center for the arc.')
      return null
    }

    return center
  }

  /**
   * Create arc by three points
   * @param startPoint Input the start point
   * @param endPoint Input the end point
   * @param pointOnArc Input one point between the start point and the end point
   */
  static createByThreePoints(
    startPoint: UvGePoint3dLike,
    endPoint: UvGePoint3dLike,
    pointOnArc: UvGePoint3dLike
  ) {
    const center = UvGeCircArc3d.computeCenterPoint(
      startPoint,
      endPoint,
      pointOnArc
    )
    if (center) {
      const radius = center.distanceTo(startPoint)

      // Compute the vectors from the center to the start and end points
      const centerToStart = new UvGeVector3d().subVectors(startPoint, center)
      const centerToEnd = new UvGeVector3d().subVectors(endPoint, center)

      // Compute the start angle and end angle relative to the x-axis
      const startAngle = Math.atan2(centerToStart.y, centerToStart.x)
      const endAngle = Math.atan2(centerToEnd.y, centerToEnd.x)

      return new UvGeCircArc3d(
        center,
        radius,
        startAngle,
        endAngle,
        UvGeVector3d.Z_AXIS
      )
    }
  }

  /**
   * Create a 3d circular arc.
   * @param center The center point of the arc.
   * @param radius The radius of the arc.
   * @param startAngle The start angle of the arc.
   * @param endAngle The end angle of the arc.
   * @param normal The normal vector of the plane in which the arc lies.
   * @param refVec The reference vector from which angles are measured. Default value is x axis.
   */
  constructor(
    center: UvGePointLike,
    radius: number,
    startAngle: number,
    endAngle: number,
    normal: UvGeVector3dLike,
    refVec: UvGeVector3dLike = UvGeVector3d.X_AXIS
  ) {
    super()
    this.center = center
    this.radius = radius
    this.startAngle = startAngle
    this.endAngle = endAngle
    this.normal = normal
    this.refVec = refVec
    // Check whether it is a full ellipse
    if ((endAngle - startAngle) % TAU == 0) {
      this.startAngle = 0
      this.endAngle = TAU
    } else {
      this.startAngle = startAngle
      this.endAngle = endAngle
    }
  }

  /**
   * Center of circular arc
   */
  get center(): UvGePoint3d {
    return this._center
  }
  set center(value: UvGePointLike) {
    this._center = new UvGePoint3d(value.x, value.y, value.z || 0)
    this._boundingBoxNeedsUpdate = true
  }

  /**
   * Radius of circular arc
   */
  get radius(): number {
    return this._radius
  }
  set radius(value: number) {
    if (value < 0) throw UvCmErrors.ILLEGAL_PARAMETERS
    this._radius = value
    this._boundingBoxNeedsUpdate = true
  }

  /**
   * Start angle in radians of circular arc in the range 0 to 2 * PI.
   */
  get startAngle(): number {
    return this._startAngle
  }
  set startAngle(value: number) {
    this._startAngle = UvGeMathUtil.normalizeAngle(value)
    this._boundingBoxNeedsUpdate = true
  }

  /**
   * End angle in radians of circular arc in the range 0 to 2 * PI.
   */
  get endAngle(): number {
    return this._endAngle
  }
  set endAngle(value: number) {
    this._endAngle =
      this.startAngle == 0 && value == TAU
        ? value
        : UvGeMathUtil.normalizeAngle(value)
    this._boundingBoxNeedsUpdate = true
  }

  /**
   * Return angle between endAngle and startAngle in range 0 to 2*PI
   */
  get deltaAngle() {
    return UvGeMathUtil.normalizeAngle(this.endAngle - this.startAngle)
  }

  /**
   * Return true if the arc is a large arc whose delta angle value is greater than PI.
   */
  get isLargeArc() {
    return Math.abs(this.deltaAngle) > Math.PI ? 1 : 0
  }

  /**
   * Return true if the arc is clockwise from startAngle to endAngle
   */
  get clockwise() {
    return this.deltaAngle <= 0
  }

  /**
   * Normal vector defining the plane of the circular arc
   */
  get normal(): UvGeVector3d {
    return this._normal
  }
  set normal(value: UvGeVector3dLike) {
    this._normal = new UvGeVector3d(value.x, value.y, value.z)
    // Normalize the normal vector to ensure it's a unit vector
    this._normal.normalize()
    this._boundingBoxNeedsUpdate = true
  }

  /**
   * The unit reference vector of circular arc
   */
  get refVec(): UvGeVector3d {
    return this._refVec
  }
  set refVec(value: UvGeVector3dLike) {
    this._refVec = new UvGeVector3d(value.x, value.y, value.z)
    // Normalize the normal vector to ensure it's a unit vector
    this._refVec.normalize()
    this._boundingBoxNeedsUpdate = true
  }

  /**
   * The start point of circular arc
   */
  get startPoint(): UvGePoint3d {
    return this.getPointAtAngle(this._startAngle)
  }

  /**
   * The end point of circular arc
   */
  get endPoint(): UvGePoint3d {
    return this.getPointAtAngle(this._endAngle)
  }

  /**
   * The middle point of the circular arc
   */
  get midPoint(): UvGePoint3d {
    let startAngle = this.startAngle
    let deltaAngle = this.deltaAngle

    // For a full circle, define midpoint at PI from start
    if (this.closed) {
      startAngle = 0
      deltaAngle = TAU
    }

    const midAngle = startAngle + deltaAngle * 0.5
    return this.getPointAtAngle(midAngle)
  }

  /**
   * @inheritdoc
   */
  get length() {
    return this.closed
      ? 2 * Math.PI * this.radius
      : Math.abs(this.deltaAngle * this.radius)
  }

  /**
   * The area of this arc
   */
  get area() {
    return this.closed
      ? Math.PI * this.radius * this.radius
      : Math.abs(this.deltaAngle * this.radius * this.radius)
  }

  /**
   * Returns the nerest point on this arc to the given point.
   * @param point Input point
   */
  nearestPoint(point: UvGePoint3dLike): UvGePoint3d {
    const p = new UvGeVector3d(point.x, point.y, point.z || 0)
    const c = this.center
    const n = this.normal

    // 1. Project point onto arc plane
    const v = p.clone().sub(c)
    const distToPlane = v.dot(n)
    const projected = p.clone().sub(n.clone().multiplyScalar(distToPlane))

    // 2. Direction from center to projected point
    const dir = projected.clone().sub(c)
    if (dir.lengthSq() === 0) {
      // Degenerate: point is at center
      return this.startPoint.clone()
    }

    dir.normalize().multiplyScalar(this.radius)

    // 3. Candidate point on full circle
    const circlePoint = c.clone().add(dir)

    // 4. Angle of candidate
    const angle = this.getAngle(circlePoint.clone())

    // Normalize angle relative to startAngle
    const start = this.startAngle
    const delta = this.deltaAngle

    let t = UvGeMathUtil.normalizeAngle(angle - start)

    // 5. Clamp to arc range
    if (t < 0) t = 0
    if (t > delta) t = delta

    const arcPoint = this.getPointAtAngle(start + t)

    // 6. Compare with endpoints (important!)
    const dArc = arcPoint.distanceTo(p)
    const dStart = this.startPoint.distanceTo(p)
    const dEnd = this.endPoint.distanceTo(p)

    if (dStart < dArc && dStart <= dEnd) return this.startPoint.clone()
    if (dEnd < dArc && dEnd < dStart) return this.endPoint.clone()

    return arcPoint
  }

  /**
   * Returns tangent snap point(s) from a given point to this arc.
   * @param point Input point
   * @returns Array of tangent points on the arc
   */
  tangentPoints(point: UvGePoint3dLike): UvGePoint3d[] {
    const result: UvGePoint3d[] = []

    const P = new UvGeVector3d(point.x, point.y, point.z || 0)
    const C = this.center
    const n = this.normal
    const r = this.radius

    // Vector CP
    const v = P.clone().sub(C)

    // Distance from point to arc plane
    const distToPlane = v.dot(n)

    // Project point onto arc plane
    const Pp = P.clone().sub(n.clone().multiplyScalar(distToPlane))
    const Cp = C.clone()

    const dVec = Pp.clone().sub(Cp)
    const d = dVec.length()

    // No tangent if point is inside the circle
    if (d < r) return result

    // Angle between CP and tangent line
    const alpha = Math.acos(r / d)

    // Base angle from refVec
    const baseAngle = this.getAngle(Pp.clone())

    // Two tangent angles on the full circle
    const angles = [baseAngle + alpha, baseAngle - alpha]

    for (const angle of angles) {
      // Normalize angle into arc parameter space
      const t = UvGeMathUtil.normalizeAngle(angle - this.startAngle)

      // Check if tangent lies on the arc
      if (t >= 0 && t <= this.deltaAngle) {
        result.push(this.getPointAtAngle(this.startAngle + t))
      }
    }

    return result
  }

  /**
   * Returns the nearest tangent snap point, or null if none exists.
   */
  nearestTangentPoint(point: UvGePoint3dLike): UvGePoint3d | null {
    const tangents = this.tangentPoints(point)
    if (tangents.length === 0) return null

    const P = new UvGePoint3d(point.x, point.y, point.z || 0)

    if (tangents.length === 1) return tangents[0]

    return tangents[0].distanceTo(P) < tangents[1].distanceTo(P)
      ? tangents[0]
      : tangents[1]
  }

  /**
   * @inheritdoc
   */
  calculateBoundingBox() {
    const angles = [this.startAngle, this.endAngle]
    for (let i = 0; i < 2 * Math.PI; i += Math.PI / 2) {
      if (UvGeMathUtil.isBetweenAngle(i, this.startAngle, this.endAngle)) {
        angles.push(i)
      }
    }

    let minX = Infinity,
      minY = Infinity,
      minZ = Infinity
    let maxX = -Infinity,
      maxY = -Infinity,
      maxZ = -Infinity

    for (const angle of angles) {
      const point = this.getPointAtAngle(angle)
      if (point.x < minX) minX = point.x
      if (point.y < minY) minY = point.y
      if (point.z < minZ) minZ = point.z
      if (point.x > maxX) maxX = point.x
      if (point.y > maxY) maxY = point.y
      if (point.z > maxZ) maxZ = point.z
    }

    return new UvGeBox3d(
      { x: minX, y: minY, z: minZ },
      { x: maxX, y: maxY, z: maxZ }
    )
  }

  /**
   * Return true if its start point is identical to its end point. Otherwise, return false.
   */
  get closed() {
    return (Math.abs(this.endAngle - this.startAngle) / Math.PI) % 2 == 0
  }

  /**
   * Divide this arc into the specified nubmer of points
   * those points as an array of points.
   * @param numPoints Input the nubmer of points returned
   * @returns Return an array of point
   */
  getPoints(numPoints: number): UvGePoint3d[] {
    const points: UvGePoint3d[] = []
    let deltaAngle = this.deltaAngle
    let startAngle = this.startAngle
    if (this.closed) {
      deltaAngle = TAU
      startAngle = 0
    }
    for (let i = 0; i <= numPoints; i++) {
      const angle = startAngle + deltaAngle * (i / numPoints)
      const point = this.getPointAtAngle(angle)
      points.push(point)
    }
    return points
  }

  /**
   * @inheritdoc
   */
  transform(matrix: UvGeMatrix3d) {
    const startVec = _vector3
      .copy(this.refVec)
      .applyAxisAngle(this.normal, this.startAngle)
      .multiplyScalar(this.radius)
    const endVec = _vector3
      .copy(this.refVec)
      .applyAxisAngle(this.normal, this.endAngle)
      .multiplyScalar(this.radius)

    this.center.applyMatrix4(matrix)
    startVec.applyMatrix4(matrix)
    endVec.applyMatrix4(matrix)
    this.normal.applyMatrix4(matrix).normalize()
    this.refVec.applyMatrix4(matrix).normalize()

    this.startAngle = this.getAngle(startVec)
    this.endAngle = this.getAngle(endVec)
    this._boundingBoxNeedsUpdate = true
    return this
  }

  /**
   * @inheritdoc
   */
  copy(value: UvGeCircArc3d) {
    this.center = value.center
    this.radius = value.radius
    this.startAngle = value.startAngle
    this.endAngle = value.endAngle
    this.normal = value.normal
    this.refVec = value.refVec
    this._boundingBoxNeedsUpdate = true
    return this
  }

  /**
   * @inheritdoc
   */
  clone() {
    return new UvGeCircArc3d(
      this.center.clone(),
      this.radius,
      this.startAngle,
      this.endAngle,
      this.normal,
      this.refVec
    )
  }

  /**
   * Calculate angle between the specified vec and the reference vector of this arc.
   * @param vec Input one vector
   * @returns Return angle between the specified vec and the reference vector of this arc.
   */
  getAngle(vec: UvGeVector3d) {
    vec.sub(this.center) // 转换到以圆心为中心的坐标系
    return Math.atan2(
      vec.dot(_vector3.crossVectors(this.refVec, this.normal)),
      vec.dot(this.refVec)
    )
  }

  /**
   * Returns the point on the arc at a specific angle.
   * @param angle The angle at which to get the point.
   */
  getPointAtAngle(angle: number): UvGePoint3d {
    // Calculate orthogonal vector to refVec in the plane of the arc
    const n = this.normal
    const r = this.refVec
    const orthogonalVec: UvGeVector3dLike = {
      x: n.y * r.z - n.z * r.y,
      y: n.z * r.x - n.x * r.z,
      z: n.x * r.y - n.y * r.x
    }

    // Point on the arc at the given angle
    const center = this.center
    const radius = this.radius
    return new UvGePoint3d(
      center.x +
        radius * (r.x * Math.cos(angle) + orthogonalVec.x * Math.sin(angle)),
      center.y +
        radius * (r.y * Math.cos(angle) + orthogonalVec.y * Math.sin(angle)),
      center.z +
        radius * (r.z * Math.cos(angle) + orthogonalVec.z * Math.sin(angle))
    )
  }

  /**
   * Return the plane in which the circular arc lies.
   */
  get plane(): UvGePlane {
    const distance = new UvGeVector3d(this.center).distanceTo(ORIGIN_POINT_3D)
    return new UvGePlane(this.normal, distance)
  }
}

const _vector3 = /*@__PURE__*/ new UvGeVector3d()
