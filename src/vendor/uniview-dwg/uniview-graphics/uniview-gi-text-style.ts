import { UvGePoint3dLike, UvGeVector3dLike } from '@uniview/geometry'

export enum UvGiMTextFlowDirection {
  LEFT_TO_RIGHT = 1,
  RIGHT_TO_LEFT = 2,
  TOP_TO_BOTTOM = 3,
  BOTTOM_TO_TOP = 4,
  BY_STYLE = 5
}

export enum UvGiMTextAttachmentPoint {
  TopLeft = 1,
  TopCenter = 2,
  TopRight = 3,
  MiddleLeft = 4,
  MiddleCenter = 5,
  MiddleRight = 6,
  BottomLeft = 7,
  BottomCenter = 8,
  BottomRight = 9
}

export interface UvGiMTextData {
  text: string
  height: number
  width: number
  position: UvGePoint3dLike
  rotation?: number
  directionVector?: UvGeVector3dLike
  attachmentPoint?: UvGiMTextAttachmentPoint
  drawingDirection?: UvGiMTextFlowDirection
  lineSpaceFactor?: number
  widthFactor?: number
}

export interface UvGiTextStyle {
  name: string
  standardFlag: number
  fixedTextHeight: number
  widthFactor: number
  obliqueAngle: number
  textGenerationFlag: number
  lastHeight: number
  font: string
  bigFont: string
  extendedFont?: string
}
