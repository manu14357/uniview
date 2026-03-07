import {
  UvCmColor,
  UvCmTransparency,
  UvGeArea2d,
  UvGeBox2d,
  UvGeCircArc3d,
  UvGeEllipseArc3d,
  UvGePoint3d,
  UvGePoint3dLike,
  UvGiFontMapping,
  UvGiImageStyle,
  UvGiLineWeight,
  UvGiMTextData,
  UvGiRenderer,
  UvGiSubEntityTraits,
  UvGiTextStyle
} from '@uniview/data-model'

import { UvSvgCircArc } from './uniview-svg-circ-arc'
import { UvSvgEllipticalArc } from './uniview-svg-elliptical-arc'
import { UvSvgEntity } from './uniview-svg-entity'
import { UvSvgLine } from './uniview-svg-line'

export class UvSvgRenderer implements UvGiRenderer<UvSvgEntity> {
  private _container: Array<string>
  private _bbox: UvGeBox2d
  private _basePoint?: UvGePoint3d
  private _subEntityTraits: UvGiSubEntityTraits

  constructor() {
    this._container = new Array<string>()
    this._bbox = new UvGeBox2d()
    this._subEntityTraits = {
      color: new UvCmColor(),
      rgbColor: 0x000000,
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

  /**
   * @inheritdoc
   */
  get subEntityTraits() {
    return this._subEntityTraits
  }

  /**
   * @inheritdoc
   */
  get basePoint() {
    return this._basePoint
  }

  set basePoint(value: UvGePoint3d | undefined) {
    if (value == null) {
      this._basePoint = value
    } else {
      this._basePoint = this._basePoint
        ? this._basePoint.copy(value)
        : new UvGePoint3d(value)
    }
  }

  /**
   * @inheritdoc
   */
  setFontMapping(_mapping: UvGiFontMapping) {
    // TODO: Implement it
  }

  /**
   * Sets global ltscale
   */
  set ltscale(_scale: number) {
    // TODO: Implement it
  }

  /**
   * Sets global celtscale
   */
  set celtscale(_scale: number) {
    // TODO: Implement it
  }

  /**
   * @inheritdoc
   */
  group(_entities: UvSvgEntity[]) {
    // TODO: Implement it
    return _tempEntity
  }

  /**
   * @inheritdoc
   */
  point(_point: UvGePoint3d) {
    // TODO: Implement it
    return _tempEntity
  }

  /**
   * @inheritdoc
   */
  circularArc(arc: UvGeCircArc3d) {
    const entity = new UvSvgCircArc(arc)
    this._container.push(entity.svg)
    this._bbox.union(entity.box)
    return entity
  }

  /**
   * @inheritdoc
   */
  ellipticalArc(ellipseArc: UvGeEllipseArc3d) {
    const entity = new UvSvgEllipticalArc(ellipseArc)
    this._container.push(entity.svg)
    this._bbox.union(entity.box)
    return entity
  }

  /**
   * @inheritdoc
   */
  lines(points: UvGePoint3dLike[]) {
    const entity = new UvSvgLine(points)
    this._container.push(entity.svg)
    this._bbox.union(entity.box)
    return entity
  }

  /**
   * @inheritdoc
   */
  lineSegments(_array: Float32Array, _itemSize: number, _indices: Uint16Array) {
    // TODO: Implement it
    return _tempEntity
  }

  /**
   * @inheritdoc
   */
  area(_area: UvGeArea2d) {
    // TODO: Implement it
    return _tempEntity
  }

  /**
   * @inheritdoc
   */
  mtext(_mtext: UvGiMTextData, _style: UvGiTextStyle, _delay: boolean) {
    // TODO: Implement it
    return _tempEntity
  }

  /**
   * @inheritdoc
   */
  image(_blob: Blob, _style: UvGiImageStyle) {
    return _tempEntity
  }

  export() {
    const elements = this._container.join('\n')
    const viewBox = this._bbox.isEmpty()
      ? {
          x: 0,
          y: 0,
          width: 0,
          height: 0
        }
      : {
          x: this._bbox.min.x,
          y: -this._bbox.max.y,
          width: this._bbox.max.x - this._bbox.min.x,
          height: this._bbox.max.y - this._bbox.min.y
        }
    return `<?xml version="1.0"?>
    <svg
      xmlns="http://www.w3.org/2000/svg"
      xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1"
      preserveAspectRatio="xMinYMin meet"
      viewBox="${viewBox.x} ${viewBox.y} ${viewBox.width} ${viewBox.height}"
      width="100%" height="100%"
    >
      <g stroke="#000000" stroke-width="0.1%" fill="none" transform="matrix(1,0,0,-1,0,0)">
        ${elements}
      </g>
    </svg>`
  }
}

const _tempEntity = /*@__PURE__*/ new UvSvgEntity()
