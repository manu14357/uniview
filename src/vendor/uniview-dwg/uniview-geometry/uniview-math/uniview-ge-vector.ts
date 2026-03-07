import { UvGeVector2d } from './uniview-ge-vector2d'
import { UvGeVector3d } from './uniview-ge-vector3d'

export type UvGeVector = UvGeVector2d | UvGeVector3d
export type UvGeVectorLike = {
  x: number
  y: number
  z?: number
}
