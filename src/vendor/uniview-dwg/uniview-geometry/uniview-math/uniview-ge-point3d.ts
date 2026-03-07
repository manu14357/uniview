import { UvGeVector3d, UvGeVector3dLike } from '../uniview-math/uniview-ge-vector3d'

/**
 * The interface representing a point in 3-dimensional space.
 */
export type UvGePoint3dLike = UvGeVector3dLike

/**
 * The class representing a point in 3-dimensional space.
 */
export class UvGePoint3d extends UvGeVector3d {
  /**
   * Convert one point array to one number array
   * @param array Input one point array
   * @param includeZ Include z cooridinate in returned number array if it is true.
   * @returns Return converted number array
   */
  static pointArrayToNumberArray(
    array: UvGePoint3d[],
    includeZ: boolean = true
  ) {
    const dimension = includeZ ? 3 : 2
    const numberArray = new Array<number>(array.length * dimension)
    array.forEach((item, index) => {
      item.toArray(numberArray, index * dimension)
    })
    return numberArray
  }
}
