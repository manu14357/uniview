import { UvGePoint3d } from '@uniview/geometry'

/**
 * Image style defining the boundary polygon and rotation angle.
 */
export interface UvGiImageStyle {
  /** The boundary polygon of the image in 3D space. */
  boundary: UvGePoint3d[]
  /** The rotation angle of the image in radians. */
  rotation: number
}
