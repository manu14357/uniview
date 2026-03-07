import { UvGeCircArc3d } from '@uniview/data-model'

import { UvSvgEntity } from './uniview-svg-entity'

export class UvSvgCircArc extends UvSvgEntity {
  constructor(arc: UvGeCircArc3d) {
    super()
    if (arc.closed) {
      this.svg = `\n<circle cx="${arc.center.x}" cy="${arc.center.y}" r="${arc.radius}"/>`
    } else {
      const start = arc.startPoint
      const end = arc.endPoint
      const sweepFlag = arc.clockwise ? 0 : 1
      this.svg = `\n<path d="M${start.x},${start.y} A${arc.radius},${arc.radius} 0 ${arc.isLargeArc},${sweepFlag} ${end.x},${end.y}"/>`
    }
    const box = arc.box
    this._box.min.copy(box.min)
    this._box.max.copy(box.max)
  }
}
