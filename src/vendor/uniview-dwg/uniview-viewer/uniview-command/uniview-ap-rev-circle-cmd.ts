import { UvApContext } from '../uniview-app'
import { UvEdOpenMode } from '../uniview-editor'
import { UvApBaseRevCmd } from './uniview-ap-base-rev-cmd'
import { UvApCircleCmd } from './uniview-ap-circle-cmd'

/**
 * Command to create one revision circle.
 */
export class UvApRevCircleCmd extends UvApBaseRevCmd {
  constructor() {
    super()
    this.mode = UvEdOpenMode.Review
  }

  async execute(context: UvApContext) {
    const cmd = new UvApCircleCmd()
    await cmd.execute(context)
  }
}
