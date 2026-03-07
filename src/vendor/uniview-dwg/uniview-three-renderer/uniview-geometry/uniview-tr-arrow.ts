import {
  UvGePoint2dLike,
  UvGePoint3dLike,
  UvGiArrowStyle,
  UvGiArrowType,
  UvGiLineArrowStyle
} from '@uniview/data-model'
import * as THREE from 'three'
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils.js'

import { UvTrBufferGeometryUtil } from '../uniview-util'

const arrawTypeData = [
  // Closed filled
  {
    type: UvGiArrowType.ClosedFilled,
    position: new Float32Array([1, 0, 0, 0, -0.16665, 0, 0, 0.16665, 0]),
    indices: new Uint16Array([0, 1, 1, 2, 2, 0])
  },
  // Architectural tick
  {
    type: UvGiArrowType.ArchTick,
    position: new Float32Array([
      0.575, -0.575, 0, 0.425, -0.425, 0, 1.425, 0.575, 0, 1.575, 0.425, 0
    ]),
    indices: new Uint16Array([0, 1, 1, 2, 2, 3, 3, 0])
  },
  // Closed blank
  {
    type: UvGiArrowType.ClosedBlank,
    position: new Float32Array([1, 0, 0, 0, -0.16665, 0, 0, 0.16665, 0]),
    indices: new Uint16Array([0, 1, 1, 2, 2, 0])
  },
  // Closed
  {
    type: UvGiArrowType.Closed,
    position: new Float32Array([1, 0, 0, 0, -0.16665, 0, 0, 0.16665, 0]),
    indices: new Uint16Array([0, 1, 1, 2, 2, 0])
  },
  // Oblique
  {
    type: UvGiArrowType.Oblique,
    position: new Float32Array([0.5, -0.5, 0, 1.5, 0.5, 0]),
    indices: new Uint16Array([0, 1])
  },
  // Open
  {
    type: UvGiArrowType.Open,
    position: new Float32Array([
      0, 0.1667, 0, 1, 0, 0, 0, -0.16667, 0, 0, 0, 0
    ]),
    indices: new Uint16Array([0, 1, 1, 2, 1, 3])
  },
  // Right angle
  {
    type: UvGiArrowType.Open90,
    position: new Float32Array([0.5, 0.5, 0, 1, 0, 0, 0.5, -0.5, 0, 0, 0, 0]),
    indices: new Uint16Array([0, 1, 2, 1, 3, 1])
  },
  // Open 30
  {
    type: UvGiArrowType.Open30,
    position: new Float32Array([0, 0.2679, 0, 1, 0, 0, 0, -0.2679, 0]),
    indices: new Uint16Array([0, 1, 1, 2])
  },
  // Box
  {
    type: UvGiArrowType.Box,
    position: new Float32Array([
      0.5, -0.5, 0, 0.5, 0.5, 0, 1.5, 0.5, 0, 1.5, -0.5, 0
    ]),
    indices: new Uint16Array([0, 1, 1, 2, 2, 3, 3, 0])
  },
  // Box filled
  {
    type: UvGiArrowType.BoxFilled,
    position: new Float32Array([
      0.5, -0.5, 0, 0.5, 0.5, 0, 1.5, 0.5, 0, 1.5, -0.5, 0
    ]),
    indices: new Uint16Array([0, 1, 1, 2, 2, 3, 3, 0])
  },
  // Datum triangle
  {
    type: UvGiArrowType.DatumBlank,
    position: new Float32Array([0, 0, 0, 1, 0.5774, 0, 1, -0.5774, 0]),
    indices: new Uint16Array([0, 1, 1, 2, 2, 0])
  },
  // Datum triangle filled
  {
    type: UvGiArrowType.DatumFilled,
    position: new Float32Array([0, 0, 0, 1, 0.5774, 0, 1, -0.5774, 0]),
    indices: new Uint16Array([0, 1, 1, 2, 2, 0])
  }
]

/**
 * Internal class used to create arrow geometry at the end of line
 * @internal
 */
export class UvTrArrow {
  static readonly arrowSymbolGeometries =
    UvTrArrow.createArrowSymbolGeometries()
  static createArrowSymbolGeometries() {
    const results: Record<
      string,
      { g1: THREE.BufferGeometry; g2: THREE.BufferGeometry }
    > = {}
    const createOffsetPosition = (position: Float32Array) => {
      const length = position.length
      const result = new Float32Array(position.length)
      for (let index = 0; index < length; ++index) {
        if (index % 3 == 0) {
          result[index] = position[index] - 1
        } else {
          result[index] = position[index]
        }
      }
      return result
    }
    const createBufferGeometry = (
      position: Float32Array,
      indices: Uint16Array
    ) => {
      const geometry = new THREE.BufferGeometry()
      geometry.setAttribute('position', new THREE.BufferAttribute(position, 3))
      geometry.setIndex(new THREE.BufferAttribute(indices, 1))
      return geometry
    }
    arrawTypeData.forEach(arrow => {
      results[arrow.type] = {
        g1: createBufferGeometry(arrow.position, arrow.indices),
        g2: createBufferGeometry(
          createOffsetPosition(arrow.position),
          arrow.indices
        )
      }
    })
    return results
  }

  getArrowGeometryByType(arrowType: UvGiArrowType, appended?: boolean) {
    let geometry = UvTrArrow.arrowSymbolGeometries[arrowType]
    if (geometry == null) {
      geometry = UvTrArrow.arrowSymbolGeometries[UvGiArrowType.ClosedFilled]
    }
    return appended ? geometry.g1 : geometry.g2
  }

  /**
   * Create two arrows at the start point and end point of the dimension line and return their buffer
   * geometry representation.
   * @param points Input one array which contains start point and end point of dimension line
   * @param lineArrowStyle Input line arrow style
   * @returns Return buffer geometry of arrows created.
   */
  createArrows(
    points: UvGePoint2dLike[] | UvGePoint3dLike[],
    lineArrowStyle: UvGiLineArrowStyle
  ) {
    const arrows: THREE.BufferGeometry[] = []
    if (lineArrowStyle.firstArrow) {
      arrows.push(
        this.createArrow(
          points[0],
          lineArrowStyle.firstArrow,
          this.getRotation(
            points[0],
            points[1],
            lineArrowStyle.firstArrow.inversed ? 0 : Math.PI
          )
        )
      )
    }
    if (lineArrowStyle.secondArrow) {
      arrows.push(
        this.createArrow(
          points[points.length - 1],
          lineArrowStyle.secondArrow,
          this.getRotation(
            points[points.length - 2],
            points[points.length - 1],
            lineArrowStyle.secondArrow.inversed ? Math.PI : 0
          )
        )
      )
    }
    if (arrows.length == 2) {
      return BufferGeometryUtils.mergeGeometries(arrows)
    } else {
      return arrows[0]
    }
  }

  /**
   *
   * @param points Input one array which contains start point and end point of dimension line
   * @param arrowType Input arrowhead type
   * @param rotationZ Input angle (in radians) between vector from start point to end point with arrow direction
   * @param scale Input scale factor
   * @returns Return buffer geometry of the arrow created.
   */
  createArrow(
    attachmentPoint: UvGePoint2dLike | UvGePoint3dLike,
    arrowStyle: UvGiArrowStyle,
    rotationZ: number
  ) {
    const bufferGeometry = this.getArrowGeometryByType(
      arrowStyle.type,
      arrowStyle.appended
    )
    const scale = arrowStyle.scale || 1
    const translation = _vector2.set(attachmentPoint.x, attachmentPoint.y)
    return UvTrBufferGeometryUtil.apply2dTransform(
      bufferGeometry.clone(),
      translation,
      rotationZ,
      scale
    )
  }

  private getRotation(
    p1: UvGePoint2dLike,
    p2: UvGePoint2dLike,
    baseAngle: number = 0
  ) {
    const direction = new THREE.Vector2().subVectors(p2, p1)
    return direction.angle() + baseAngle
  }
}

const _vector2 = /*@__PURE__*/ new THREE.Vector2(0, 0)
