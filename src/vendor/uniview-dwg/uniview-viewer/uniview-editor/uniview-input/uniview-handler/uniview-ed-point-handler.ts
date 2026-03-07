import { UvGePoint3dLike } from '@uniview/data-model'

import { UvEdPromptPointOptions } from '../uniview-prompt/uniview-ed-prompt-point-options'
import { UvEdInputHandler } from './uniview-ed-input-handler'

/**
 * Handles validation and parsing of point user input.
 */
export class UvEdPointHandler implements UvEdInputHandler<UvGePoint3dLike> {
  protected options: UvEdPromptPointOptions

  constructor(options: UvEdPromptPointOptions) {
    this.options = options
  }

  parse(x: string, y?: string) {
    const nx = Number(x)
    const ny = Number(y)

    if (isNaN(nx) || isNaN(ny)) {
      return null
    }

    return { x: nx, y: ny, z: 0 }
  }
}
