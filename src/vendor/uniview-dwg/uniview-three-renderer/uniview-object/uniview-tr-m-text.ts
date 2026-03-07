import {
  UvGiMTextData,
  UvGiSubEntityTraits,
  UvGiTextStyle
} from '@uniview/data-model'
import { MTextObject } from '@uniview/mtext-renderer'
import * as THREE from 'three'

import { UvTrMTextRenderer } from '../uniview-renderer'
import { UvTrStyleManager } from '../uniview-style/uniview-tr-style-manager'
import { UvTrEntity } from './uniview-tr-entity'

export class UvTrMText extends UvTrEntity {
  private _mtext?: MTextObject
  private _text: UvGiMTextData
  private _style: UvGiTextStyle & {
    color: number
    isByLayer: boolean
    layer: string
    byLayerColor?: number
    byBlockColor?: number
  }

  constructor(
    text: UvGiMTextData,
    traits: UvGiSubEntityTraits,
    style: UvGiTextStyle,
    styleManager: UvTrStyleManager,
    delay: boolean = false
  ) {
    super(styleManager)
    this._text = text
    this._style = {
      ...style,
      color: traits.rgbColor,
      isByLayer: traits.color.isByLayer,
      layer: traits.layer
    }
    if (!delay) {
      this.syncDraw()
    }
  }

  async syncDraw() {
    const mtextRenderer = UvTrMTextRenderer.getInstance()
    if (!mtextRenderer) return

    try {
      const style = this._style

      // @ts-expect-error UvGiTextData and MTextData are compatible
      this._mtext = mtextRenderer.syncRenderMText(this._text, style, {
        byLayerColor: style.byLayerColor,
        byBlockColor: style.byBlockColor
      })
      this.add(this._mtext)
      this.flatten()
      this.traverse(object => {
        // Add the flag to check intersection using bounding box of the mesh
        object.userData.bboxIntersectionCheck = true
      })
      this.box = this._mtext.box
    } catch (error) {
      console.log(
        `Failed to render mtext '${this._text.text}' with the following error:\n`,
        error
      )
    }
  }

  async draw() {
    const mtextRenderer = UvTrMTextRenderer.getInstance()
    if (!mtextRenderer) return

    try {
      const style = this._style

      // @ts-expect-error UvGiTextData and MTextData are compatible
      this._mtext = await mtextRenderer.asyncRenderMText(this._text, style, {
          byLayerColor: style.byLayerColor,
          byBlockColor: style.byBlockColor
        })
        .then(mtext => {
          this._mtext = mtext
          this.add(this._mtext)
          this.flatten()
          this.traverse(object => {
            // Add the flag to check intersection using bounding box of the mesh
            object.userData.bboxIntersectionCheck = true
          })
          this.box = this._mtext.box
        })
    } catch (error) {
      console.log(
        `Failed to render mtext '${this._text.text}' with the following error:\n`,
        error
      )
    }
  }

  /**
   * Get intersections between a casted ray and this object. Override this method
   * to calculate intersection using the bounding box of texts.
   */
  raycast(raycaster: THREE.Raycaster, intersects: THREE.Intersection[]) {
    this._mtext?.raycast(raycaster, intersects)
  }
}
