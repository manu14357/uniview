import {
  UvCmColor,
  UvCmTransparency,
  UvGiLineWeight,
  UvGiSubEntityTraits
} from '@uniview/data-model'
import { StyleTraits } from '@uniview/mtext-renderer'

export class UvTrSubEntityTraitsUtil {
  static createDefaultTraits(): UvGiSubEntityTraits {
    return {
      color: new UvCmColor(),
      rgbColor: 0xffffff,
      lineType: {
        type: 'ByLayer',
        name: 'Continuous',
        standardFlag: 0,
        description: 'Solid line',
        totalPatternLength: 0
      },
      lineTypeScale: 1,
      lineWeight: UvGiLineWeight.ByLayer,
      fillType: {
        solidFill: true,
        patternAngle: 0,
        definitionLines: []
      },
      transparency: new UvCmTransparency(),
      thickness: 0,
      layer: '0'
    }
  }

  static createTraitsForMText(traits: StyleTraits): UvGiSubEntityTraits {
    const color = new UvCmColor()
    if (!traits.isByLayer) {
      color.setRGBValue(traits.color)
    }
    return {
      color,
      rgbColor: traits.color,
      lineType: {
        type: 'ByLayer',
        name: 'Continuous',
        standardFlag: 0,
        description: 'Solid line',
        totalPatternLength: 0
      },
      lineTypeScale: 1,
      lineWeight: UvGiLineWeight.ByLayer,
      fillType: {
        solidFill: true,
        patternAngle: 0,
        definitionLines: []
      },
      transparency: new UvCmTransparency(),
      thickness: 0,
      layer: traits.layer ?? '0'
    }
  }
}
