import {
  UvGePoint3dLike,
  UvGiPointStyle,
  UvGiSubEntityTraits
} from '@uniview/data-model'
import * as THREE from 'three'

import { UvTrPointSymbolCreator } from '../uniview-geometry/uniview-tr-point-symbol-creator'
import { UvTrStyleManager } from '../uniview-style/uniview-tr-style-manager'
import { UvTrEntity } from './uniview-tr-entity'

const _vector3 = /*@__PURE__*/ new THREE.Vector3()

export class UvTrPoint extends UvTrEntity {
  /**
   * The flag whether to use one point using THREE.Points
   */
  isShowPoint: boolean

  constructor(
    point: UvGePoint3dLike,
    traits: UvGiSubEntityTraits,
    style: UvGiPointStyle,
    styleManager: UvTrStyleManager
  ) {
    super(styleManager)
    const pointSymbol = UvTrPointSymbolCreator.instance.create(
      style.displayMode,
      point
    )

    this.isShowPoint = pointSymbol.point != null

    // Always create one THREE.Points object. If 'isShowPoint' is true, show it. Otherwise, hide it.
    const geometry =
      pointSymbol.point ??
      new THREE.BufferGeometry().setFromPoints([_vector3.copy(point)])
    geometry.computeBoundingBox()
    if (geometry.boundingBox) this.box.union(geometry.boundingBox)
    const material = this.styleManager.getPointsMaterial(traits)
    const pointObj = new THREE.Points(geometry, material)
    // Add the flag to check intersection using bounding box of the mesh
    pointObj.userData.bboxIntersectionCheck = true
    pointObj.visible = this.isShowPoint
    this.add(pointObj)

    if (pointSymbol.line) {
      const geometry = pointSymbol.line
      geometry.computeBoundingBox()
      if (geometry.boundingBox) this.box.union(geometry.boundingBox)
      const material = this.styleManager.getLineMaterial(traits, true)
      const lineSegmentsObj = new THREE.LineSegments(geometry, material)
      // Add the flag to check intersection using bounding box of the mesh
      lineSegmentsObj.userData.bboxIntersectionCheck = true
      // Add this flag so that batched group can handle it with different logic
      lineSegmentsObj.userData.isPoint = true
      lineSegmentsObj.userData.position = { x: point.x, y: point.y, z: point.z }
      this.add(lineSegmentsObj)
    }
  }
}
