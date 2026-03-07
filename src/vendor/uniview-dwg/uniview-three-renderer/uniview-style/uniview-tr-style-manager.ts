import { UvGiSubEntityTraits } from '@uniview/data-model'
import * as THREE from 'three'

import { UvTrFillMaterialManager } from './uniview-tr-fill-material-manager'
import { UvTrLineMaterialManager } from './uniview-tr-line-material-manager'
import { UvTrPointMaterialManager } from './uniview-tr-point-material-manager'
import { UvTrStyleManagerOptions } from './uniview-tr-style-manager-options'

/**
 * Central style/material access point for the CAD viewer.
 *
 * This class delegates all material creation to the four specialized
 * UvTrMaterialManager implementations:
 *
 * - Point materials
 * - Line materials
 * - Mesh materials
 * - Hatch materials
 *
 * This ensures consistent material reuse, improved rendering performance,
 * and clean separation of material logic.
 */
export class UvTrStyleManager {
  static options: UvTrStyleManagerOptions = {
    // cameraZoomUniform: 1.0,
    ltscale: 1.0,
    celtscale: 1.0,
    viewportScaleUniform: 1.0,
    maxFragmentUniforms: 1024,
    resolution: new THREE.Vector2(1, 1),
    showLineWeight: true
  }
  private pointMgr: UvTrPointMaterialManager
  private lineMgr: UvTrLineMaterialManager
  private fillMgr: UvTrFillMaterialManager

  constructor() {
    this.pointMgr = new UvTrPointMaterialManager(UvTrStyleManager.options)
    this.lineMgr = new UvTrLineMaterialManager(UvTrStyleManager.options)
    this.fillMgr = new UvTrFillMaterialManager(UvTrStyleManager.options)
  }

  /** Stores unsupported text styles mapped by name → usage count. */
  public unsupportedTextStyles: Record<string, number> = {}

  /**
   * Returns a material for point entities.
   *
   * @param size - Point size (default = 2).
   */
  getPointsMaterial(
    traits: UvGiSubEntityTraits,
    size: number = 2
  ): THREE.Material {
    return this.pointMgr.getMaterial(traits, { size })!
  }

  /**
   * Returns a basic or shader line material depending on the lineType.
   *
   * @param traits - Current entity traits.
   * @param basicMaterialOnly - The flag whether to search and return the basic material only
   */
  getLineMaterial(
    traits: UvGiSubEntityTraits,
    basicMaterialOnly?: boolean
  ): THREE.Material {
    const hasLinePattern = !!(
      traits.lineType.pattern && traits.lineType.pattern.length > 0
    )
    const forceBasicMaterial =
      !UvTrStyleManager.options.showLineWeight && !hasLinePattern
    return this.lineMgr.getMaterial(traits, {
      basicMaterialOnly: basicMaterialOnly || forceBasicMaterial
    })!
  }

  /**
   * Gets whether lineweights are currently displayed.
   */
  get showLineWeight(): boolean {
    return UvTrStyleManager.options.showLineWeight
  }

  /**
   * Sets whether lineweights are displayed.
   */
  set showLineWeight(value: boolean) {
    UvTrStyleManager.options.showLineWeight = value
  }

  /**
   * Returns the shader hatch material or a mesh fallback.
   *
   * @param traits - Current entity traits.
   * @param rebaseOffset - Offset used to transform pattern origins.
   */
  getFillMaterial(
    traits: UvGiSubEntityTraits,
    rebaseOffset: THREE.Vector2 = _rebaseOffset
  ): THREE.Material {
    return this.fillMgr.getMaterial(traits, {
      rebaseOffset
    })
  }

  /**
   * Forces all materials that belong to the given layer to update,
   * for traits that use ByLayer color or ByLayer lineType.
   *
   * @param layerName - The name of the layer whose materials need to be updated.
   * @param newTraits - Layer-level traits (color, lineType, etc.) resolved from your layer table.
   * @returns Mapping: oldMaterialId → newMaterial
   */
  updateLayerMaterial(
    layerName: string,
    newTraits: Partial<UvGiSubEntityTraits>
  ): Record<number, THREE.Material> {
    return {
      ...this.lineMgr.updateLayerMaterial(layerName, newTraits),
      ...this.pointMgr.updateLayerMaterial(layerName, newTraits),
      ...this.fillMgr.updateLayerMaterial(layerName, newTraits)
    }
  }

  /**
   * Clears all cached materials and releases its memory
   */
  dispose(): void {
    this.lineMgr.dispose()
    this.pointMgr.dispose()
    this.fillMgr.dispose()
  }

  updateLineResolution(width: number, height: number): void {
    UvTrStyleManager.options.resolution.set(width, height)
    this.lineMgr.updateResolution()
  }
}

const _rebaseOffset = /*@__PURE__*/ new THREE.Vector2(0, 0)
