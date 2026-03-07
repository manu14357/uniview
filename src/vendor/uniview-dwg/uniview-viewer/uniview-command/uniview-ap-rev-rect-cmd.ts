import { UvApContext } from '../uniview-app'
import { UvEdOpenMode } from '../uniview-editor'
import { UvApBaseRevCmd } from './uniview-ap-base-rev-cmd'
import { UvApRectCmd } from './uniview-ap-rect-cmd'

/**
 * Command to create one revision rectangle.
 */
export class UvApRevRectCmd extends UvApBaseRevCmd {
  constructor() {
    super()
    this.mode = UvEdOpenMode.Review
  }

  async execute(context: UvApContext) {
    const cmd = new UvApRectCmd()
    await cmd.execute(context)
  }
}
