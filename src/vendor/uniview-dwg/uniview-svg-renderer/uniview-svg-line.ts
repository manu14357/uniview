import { UvGePoint3dLike } from '@uniview/data-model'

import { UvSvgEntity } from './uniview-svg-entity'

export class UvSvgLine extends UvSvgEntity {
  constructor(points: UvGePoint3dLike[]) {
    super()
    const d = points.reduce(
      (acc: string, point: UvGePoint3dLike, i: number) => {
        acc += i === 0 ? 'M' : 'L'
        acc += point.x + ',' + point.y
        this.box.expandByPoint(point)
        return acc
      },
      ''
    )

    if (d) {
      this.svg = `<path d="${d}" />`
    }
  }
}
