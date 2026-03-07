import { UvCmColor, UvCmColorMethod } from '@uniview/data-model'

/** Cor azul padrão dos overlays de medição. */
export function blueColor(): UvCmColor {
  return new UvCmColor(UvCmColorMethod.ByColor).setRGB(96, 165, 250)
}

