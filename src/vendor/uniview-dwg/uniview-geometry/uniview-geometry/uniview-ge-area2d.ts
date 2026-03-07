import { UvGeBox2d, UvGeMatrix2d, UvGePoint2d, UvGePoint2dLike } from '../uniview-math'
import { UvGeGeometryUtil, UvGeMathUtil } from '../uniview-util'
import { UvGeLoop2d } from './uniview-ge-loop2d'
import { UvGePolyline2d } from './uniview-ge-polyline2d'
import { UvGeShape2d } from './uniview-ge-shape2d'

export interface UvGeIndexNode {
  index: number
  children: UvGeIndexNode[]
}

export type UvGeLoop2dType = UvGeLoop2d | UvGePolyline2d

/**
 * 2d area defined by one outter loop and multiple inner loops
 */
export class UvGeArea2d extends UvGeShape2d {
  private _loops: Array<UvGeLoop2dType>

  /**
   * Create one 2d area defined by one outter loop and multiple inner loops
   */
  constructor() {
    super()
    this._loops = []
  }

  /**
   * Append one loop to loops of this area. If it is the first loop added, it is the outter loop.
   * Otherwise, it is an inner loop.
   * @param loop Input the loop to append
   */
  add(loop: UvGeLoop2dType) {
    this._loops.push(loop)
    this._boundingBoxNeedsUpdate = true
  }

  /**
   * The loops of this area
   */
  get loops() {
    return this._loops as ReadonlyArray<UvGeLoop2dType>
  }

  /**
   * Outter loop of this area
   */
  get outter() {
    if (this._loops.length > 0) {
      return this._loops[0]
    }
    return undefined
  }

  /**
   * @inheritdoc
   */
  calculateBoundingBox(): UvGeBox2d {
    const outterLoop = this.outter
    if (outterLoop) {
      return outterLoop.box
    } else {
      return new UvGeBox2d()
    }
  }

  /**
   * @inheritdoc
   */
  transform(_matrix: UvGeMatrix2d) {
    // TODO: implement it
    this._boundingBoxNeedsUpdate = true
    return this
  }

  /**
   * Return boundary points of this area
   * @param numPoints Input the nubmer of points returned for arc segmentation
   * @returns Return points
   */
  getPoints(numPoints: number): UvGePoint2d[][] {
    const pointBoundaries: UvGePoint2d[][] = []
    for (let index = 0; index < this.loops.length; ++index) {
      const loop = this.loops[index]
      const points: UvGePoint2d[] = loop.getPoints(numPoints) as UvGePoint2d[]
      pointBoundaries.push(points)
    }
    return pointBoundaries
  }

  buildHierarchy() {
    const pointBoundaries = this.getPoints(100)
    const boundaryBoxes = this.calculateBoundaryBoxes(pointBoundaries)
    const areaSortIndex: number[] = this.sortBoundaryBoxesByAreas(boundaryBoxes)

    const indexNodeMap = new Map<number, UvGeIndexNode>() // index => IndexNode
    const count = areaSortIndex.length
    for (let i = 0; i < count; i++) {
      indexNodeMap.set(areaSortIndex[i], {
        index: areaSortIndex[i],
        children: []
      })
    }

    const rootNode: UvGeIndexNode = { index: -1, children: [] }
    for (let i = 0; i < count; i++) {
      const index = areaSortIndex[i]
      const boundary = pointBoundaries[index]
      const box = boundaryBoxes[index]
      let j = i + 1
      for (; j < count; j++) {
        const index2 = areaSortIndex[j]
        const boundary2 = pointBoundaries[index2]
        const box2 = boundaryBoxes[index2]
        // Determine whether the boundary is within the boundary2
        if (
          box2.containsBox(box) &&
          UvGeGeometryUtil.isPointInPolygon(
            boundary[UvGeMathUtil.randInt(0, boundary.length - 1)],
            boundary2
          )
        ) {
          indexNodeMap
            .get(index2)
            ?.children.push(indexNodeMap.get(index) as UvGeIndexNode)
          break
        }
      }
      if (j === count) {
        rootNode.children.push(indexNodeMap.get(index) as UvGeIndexNode)
      }
    }

    return rootNode
  }

  /**
   * Calculate area of this 2d area.
   * Outter loop area minus inner loop areas (holes).
   */
  get area(): number {
    if (this._loops.length === 0) return 0

    let totalArea = 0

    for (let i = 0; i < this._loops.length; i++) {
      const loop = this._loops[i]
      // Sets the number of points used for curve segmentation to 128
      const points = loop.getPoints(128) as UvGePoint2d[]

      const loopArea = this.polygonArea(points)

      if (i === 0) {
        // outter loop
        totalArea += Math.abs(loopArea)
      } else {
        // inner loop (hole)
        totalArea -= Math.abs(loopArea)
      }
    }

    return totalArea
  }

  /**
   * Calculate signed area of a polygon using Shoelace formula
   */
  private polygonArea(points: UvGePoint2d[]): number {
    const count = points.length
    if (count < 3) return 0

    let area = 0
    for (let i = 0, j = count - 1; i < count; j = i++) {
      const p1 = points[j]
      const p2 = points[i]
      area += p1.x * p2.y - p2.x * p1.y
    }

    return area * 0.5
  }

  /**
   * Calcuate bounding box of each loop in this area and return an array of their bounding box
   * @param pointBoundaries An array of loop consisted by points
   * @returns Return an array of bounding box
   */
  private calculateBoundaryBoxes(pointBoundaries: UvGePoint2dLike[][]) {
    const boundaryBoxes: UvGeBox2d[] = []
    pointBoundaries.forEach(points => {
      boundaryBoxes.push(new UvGeBox2d().setFromPoints(points))
    })
    return boundaryBoxes
  }

  /**
   * Sort boundary boxes by its area and return the index of boundary boxes array
   * @param boundaryBoxes An array of boundary bounding box
   * @returns Return an index array of boundary bounding box sorted by its area
   */
  private sortBoundaryBoxesByAreas(boundaryBoxes: UvGeBox2d[]) {
    const boundaryAreas: { area: number; index: number }[] = []
    boundaryBoxes.forEach((box, index) => {
      const size = box.size
      const area = size.width * size.height
      boundaryAreas.push({
        area,
        index
      })
    })
    boundaryAreas.sort((a, b) => {
      return a.area - b.area
    })
    const indices: number[] = []
    boundaryAreas.forEach(a => {
      indices.push(a.index)
    })
    return indices
  }
}
