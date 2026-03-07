import * as THREE from 'three'

import { UvTrStyleManager } from '../uniview-style/uniview-tr-style-manager'

/**
 * Base class for all drawable object
 */
export class UvTrObject extends THREE.Object3D {
  private _styleManager: UvTrStyleManager

  constructor(styleManager: UvTrStyleManager) {
    super()
    this._styleManager = styleManager
  }

  get styleManager() {
    return this._styleManager
  }

  /**
   * @inheritdoc
   */
  copy(object: UvTrObject, recursive?: boolean) {
    this._styleManager = object._styleManager
    return super.copy(object, recursive)
  }
}
