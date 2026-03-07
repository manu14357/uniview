import { UvGeVector2d, UvGeVector2dLike } from './uniview-ge-vector2d'

/**
 * The interface representing a point in 2-dimensional space.
 */
export type UvGePoint2dLike = UvGeVector2dLike

/**
 * The class representing a point in 2-dimensional space.
 */
export class UvGePoint2d extends UvGeVector2d {
  /**
   * Convert one point array to one number array
   * @param array Input one point array
   * @returns Return converted number array
   */
  static pointArrayToNumberArray(array: UvGePoint2d[]) {
    const numberArray = new Array<number>(array.length * 2)
    array.forEach((item, index) => {
      item.toArray(numberArray, index * 2)
    })
    return numberArray
  }
}
