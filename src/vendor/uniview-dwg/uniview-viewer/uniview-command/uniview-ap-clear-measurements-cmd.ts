import { UvApContext } from '../uniview-app'
import { UvEdCommand, UvEdOpenMode } from '../uniview-editor'
import { eventBus } from '../uniview-editor/uniview-global/uniview-event-bus'

/** CAD transient entity cleanup callbacks registered by measurement commands. */
const cleanups: (() => void)[] = []

/**
 * Registers a cleanup function to be called when the Clear Measurements command
 * runs. Use this only for CAD transient entities — DOM overlays are managed by
 * the `useMeasurements` composable in `cad-viewer` via the `measurements-cleared` event.
 */
export function registerMeasurementCleanup(fn: () => void): void {
  cleanups.push(fn)
}

export class UvApClearMeasurementsCmd extends UvEdCommand {
  constructor() {
    super()
    this.mode = UvEdOpenMode.Read
  }

  async execute(_context: UvApContext) {
    cleanups.forEach(fn => fn())
    cleanups.length = 0
    // Notify the useMeasurements composable to remove all DOM overlays
    eventBus.emit('measurements-cleared', undefined)
  }
}