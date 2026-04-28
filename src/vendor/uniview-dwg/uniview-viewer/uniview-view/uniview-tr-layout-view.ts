import {
  UvTrBaseView,
  UvTrRenderer,
  UvTrViewportView
} from '@uniview/three-renderer'
import { AxesGizmo, ObjectPosition } from '@uniview/viewcube'
import * as THREE from 'three'

import { UvEdViewMode } from '../uniview-editor/uniview-view/uniview-ed-base-view'
import { UvApSettingManager } from '../uniview-app/uniview-ap-setting-manager'
import { UvTrScene } from './uniview-tr-scene'

/**
 * Interface for database entity event arguments.
 * Provides context information for entity-related events.
 */
export interface UvDbEntityEventArgs {
  /** The layout view associated with the event */
  view: UvTrLayoutView
}

/**
 * Each layout has its own camera and camera control. This class represents view associated with one layout.
 *
 * A layout view manages the visual representation and interaction for a specific AutoCAD layout.
 * It provides:
 * - Camera and view controls specific to the layout
 * - Viewport management for paper space layouts
 * - View mode switching (selection, pan, etc.)
 * - Axes gizmo for orientation feedback
 * - Rendering coordination with viewports
 *
 * The layout view coordinates between the layout's data (entities, layers) and the visual
 * presentation, handling camera positioning, user interaction modes, and multi-viewport
 * rendering for paper space layouts.
 *
 * @example
 * ```typescript
 * const layoutView = new UvTrLayoutView(renderer, layoutId, 800, 600);
 * layoutView.mode = UvEdViewMode.PAN;
 * layoutView.render(scene);
 * ```
 */
export class UvTrLayoutView extends UvTrBaseView {
  /** The block table record ID associated with this layout */
  private _layoutBtrId: string
  /** The axes gizmo for showing coordinate system orientation (null when disabled) */
  private _axesGizmo: AxesGizmo | null
  /** The current view mode (selection, pan, etc.) */
  private _mode: UvEdViewMode
  /** Map of viewport views indexed by viewport ID */
  private _viewportViews: Map<string, UvTrViewportView>

  /**
   * Construct one instance of this class.
   *
   * @param renderer - Input renderer for this view
   * @param layoutBtrId - Input the id of the block table record associated the layout
   * @param width - Input width of this view in pixels
   * @param height - Input height of this view in pixels
   */
  constructor(
    renderer: UvTrRenderer,
    layoutBtrId: string,
    width: number,
    height: number
  ) {
    super(renderer, width, height)
    this._layoutBtrId = layoutBtrId
    this._mode = UvEdViewMode.SELECTION
    this._axesGizmo = UvApSettingManager.instance.isShowAxesGizmo
      ? this.createAxesGizmo()
      : null
    this._viewportViews = new Map()
  }

  /**
   * Gets the block table record ID associated with this layout.
   *
   * @returns The layout's block table record ID
   */
  get layoutBtrId() {
    return this._layoutBtrId
  }

  /**
   * The view mode of the current layout view.
   * Controls how mouse interactions are interpreted (selection vs pan mode).
   */
  get mode() {
    return this._mode
  }
  set mode(value: UvEdViewMode) {
    if (value == UvEdViewMode.SELECTION) {
      this._cameraControls.mouseButtons = {
        LEFT: this._cameraControls.mouseButtons.LEFT,
        MIDDLE: THREE.MOUSE.PAN,
        RIGHT: this._cameraControls.mouseButtons.RIGHT,
      }
    } else if (value == UvEdViewMode.PAN) {
      this._cameraControls.mouseButtons = {
        LEFT: THREE.MOUSE.PAN,
        MIDDLE: this._cameraControls.mouseButtons.MIDDLE,
        RIGHT: this._cameraControls.mouseButtons.RIGHT,
      }
    }
    this._cameraControls.update()
    this._mode = value

    // Update cursor to match the current mode
    const canvas = this._renderer?.domElement
    if (canvas) {
      canvas.style.cursor = value === UvEdViewMode.PAN ? 'grab' : 'default'
    }
  }

  /**
   * The number of viewports in this layout view.
   * Paper space layouts can contain multiple viewports showing different views of model space.
   */
  get viewportCount() {
    return this._viewportViews.size
  }

  /**
   * Add one viewport view instance to this layout view.
   * Viewports are used in paper space layouts to show different views of the model.
   *
   * @param viewportView - Input one viewport instance to add
   */
  addViewport(viewportView: UvTrViewportView) {
    this._viewportViews.set(viewportView.viewport.id, viewportView)
  }

  /**
   * Remove the specified viewport view by its id from this layout view.
   *
   * @param id - Input the id of one viewport instance to remove
   */
  removeViewport(id: string) {
    this._viewportViews.delete(id)
  }

  /**
   * Resize this layout view.
   * Updates the view dimensions and notifies all viewports of the size change.
   *
   * @param width - Input new width of the layout view in pixels
   * @param height - Input new height of the layout view in pixels
   */
  resize(width: number, height: number) {
    this._height = height
    this._width = width
    this.updateCameraFrustum()
    this._viewportViews.forEach(viewportView => {
      viewportView.update()
    })
  }

  /**
   * Renders the scene in this layout view.
   * Performs the main rendering pass and then renders any viewports if present.
   * Updates the axes gizmo to reflect the current camera orientation.
   *
   * @param scene - The scene containing the layout data to render
   */
  render(scene: UvTrScene) {
    this._renderer.clear()
    this._renderer.render(scene.internalScene, this._camera)
    const modelSpaceLayout = scene.modelSpaceLayout
    // Only draw viewports when model space actually has geometry.
    // If model space is empty (e.g. proxy entities libredwg can't decode),
    // skip the viewport pass so the paper space background shows through
    // the viewport rectangles instead of black.
    if (modelSpaceLayout && !modelSpaceLayout.box.isEmpty()) {
      this.drawViewports(modelSpaceLayout.internalObject)
    }
    this._axesGizmo?.update()
  }

  /**
   * Creates and configures the axes gizmo for this view.
   * The gizmo shows the current coordinate system orientation and is positioned
   * at the bottom-left of the view without a Z-axis (2D view).
   *
   * @returns The configured axes gizmo instance
   */
  private createAxesGizmo() {
    const axesGizmo = new AxesGizmo(
      this._camera.internalCamera,
      this._renderer.internalRenderer,
      {
        hasZAxis: false,
        pos: ObjectPosition.LEFT_BOTTOM
      }
    )
    return axesGizmo
  }

  /**
   * Draw viewports into the current rendering context.
   * Handles the complex rendering process for paper space layouts that contain
   * multiple viewports, each with their own view of model space.
   *
   * @param scene - Input the scene object to draw in each viewport
   */
  private drawViewports(scene: THREE.Object3D) {
    if (this._viewportViews.size > 0) {
      // Store autoClear flag value
      const autoClear = this._renderer.autoClear
      this._renderer.autoClear = false

      const oldViewport = new THREE.Vector4()
      this._renderer.getViewport(oldViewport)
      this._renderer.clearDepth()

      const visibility = scene.visible
      scene.visible = true
      this._viewportViews.forEach(viewportView => {
        viewportView.render(scene)
      })
      scene.visible = visibility

      this._renderer.setViewport(
        oldViewport.x,
        oldViewport.y,
        oldViewport.z,
        oldViewport.w
      )

      // Restore autoClear flag value
      this._renderer.autoClear = autoClear
    }
  }
}
