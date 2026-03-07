import { UvGePoint2dLike } from '@uniview/geometry'

export interface UvGiHatchPatternLine {
  angle: number
  base: UvGePoint2dLike
  offset: UvGePoint2dLike
  dashLengths: number[]
}

/**
 * Hatch style
 */
export interface UvGiHatchStyle {
  solidFill: boolean
  patternAngle: number
  definitionLines: UvGiHatchPatternLine[]
}
