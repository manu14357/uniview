import { UvGiSubEntityTraits } from '@uniview/data-model'
import * as THREE from 'three'

import { UvTrMaterialManager } from './uniview-tr-material-manager'

export interface UvTrPointMaterialOptions {
  size?: number
}

/**
 * Material manager dedicated to point entities.
 *
 * Produces and caches THREE.PointsMaterial instances keyed by color and size.
 * This ensures that repeated point drawings reuse the same optimized material.
 */
export class UvTrPointMaterialManager extends UvTrMaterialManager<UvTrPointMaterialOptions> {
  /**
   * Builds a stable material key from traits.
   */
  protected buildKey(
    traits: UvGiSubEntityTraits,
    options: UvTrPointMaterialOptions
  ): string {
    const size = options.size ?? 1
    return this.isByLayer(traits)
      ? `layer_${traits.layer}_${traits.rgbColor}_${size}`
      : `entity_${traits.rgbColor}_${size}`
  }

  /** Returns true if color is ByLayer. */
  protected isByLayer(traits: UvGiSubEntityTraits): boolean {
    return traits.color.isByLayer
  }

  protected createMaterialImpl(
    traits: UvGiSubEntityTraits,
    options: UvTrPointMaterialOptions = {}
  ): THREE.Material {
    return new THREE.PointsMaterial({
      color: traits.rgbColor,
      size: options.size
    })
  }
}
