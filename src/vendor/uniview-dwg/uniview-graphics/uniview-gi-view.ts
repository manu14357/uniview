import { UvGePoint2d, UvGePoint3d } from '@uniview/geometry'

export enum UvGiRenderMode {
  OPTIMIZED_2D = 0, // classic 2D
  WIREFRAME = 1,
  HIDDEN_LINE = 2,
  FLAT_SHADED = 3,
  GOURAUD_SHADED = 4,
  FLAT_SHADED_WITH_WIREFRAME = 5,
  GOURAUD_SHADED_WITH_WIREFRAME = 6
}

export enum UvGiOrthographicType {
  NON_ORTHOGRAPHIC = 0,
  TOP = 1,
  BOTTOM = 2,
  FRONT = 3,
  BACK = 4,
  LEFT = 5,
  RIGHT = 6
}

export enum UvGiDefaultLightingType {
  ONE_DISTANT_LIGHT = 0,
  TWO_DISTANT_LIGHTS = 1
}

export interface UvGiView {
  center: UvGePoint2d
  viewDirectionFromTarget: UvGePoint3d
  viewTarget: UvGePoint3d
  lensLength: number
  frontClippingPlane: number
  backClippingPlane: number
  viewHeight: number
  viewTwistAngle: number
  frozenLayers: string[]
  styleSheet: string
  renderMode: UvGiRenderMode
  viewMode: number
  ucsIconSetting: number
  ucsOrigin: UvGePoint3d
  ucsXAxis: UvGePoint3d
  ucsYAxis: UvGePoint3d
  orthographicType: UvGiOrthographicType
  shadePlotSetting: number
  shadePlotObjectId?: string
  visualStyleObjectId?: string
  isDefaultLightingOn: boolean
  defaultLightingType: UvGiDefaultLightingType
  brightness: number
  contrast: number
  ambientColor?: number
}
