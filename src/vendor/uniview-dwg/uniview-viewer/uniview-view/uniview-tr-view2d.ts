import {
  UvDbEntity,
  uvdbHostApplicationServices,
  UvDbLayerTableRecord,
  UvDbLayerTableRecordAttrs,
  UvDbLayout,
  UvDbObjectId,
  UvDbRasterImage,
  UvDbRay,
  UvDbSysVarManager,
  UvDbViewport,
  UvDbXline,
  UvGeBox2d,
  UvGeBox3d,
  UvGePoint2d,
  UvGePoint2dLike
} from '@uniview/data-model'
import {
  UvTrEntity,
  UvTrGroup,
  UvTrRenderer,
  UvTrViewportView
} from '@uniview/three-renderer'
import * as THREE from 'three'
import Stats from 'three/examples/jsm/libs/stats.module'

import { UvApDocManager, UvApSettingManager } from '../uniview-app'
import {
  UvEdBaseView,
  UvEdCalculateSizeCallback,
  UvEdConditionWaiter,
  UvEdCorsorType,
  UvEdSpatialQueryResultItemEx,
  UvEdViewMode,
  eventBus
} from '../uniview-editor'
import { UvTrGeometryUtil } from '../uniview-util'
import { UvTrLayoutView } from './uniview-tr-layout-view'
import { UvTrLayoutViewManager } from './uniview-tr-layout-view-manager'
import { UvTrScene } from './uniview-tr-scene'

/**
 * Options to customize view
 */
export interface UvTrView2dOptions {
  /**
   * Container HTML element used by renderer
   */
  container?: HTMLElement
  /**
   * Callback function used to calculate size of canvas when window resized
   */
  calculateSizeCallback?: UvEdCalculateSizeCallback
  /**
   * Background color
   */
  background?: number
}

/**
 * Default view option values
 */
export const DEFAULT_VIEW_2D_OPTIONS: UvTrView2dOptions = {
  background: 0x000000
}

/**
 * A 2D CAD viewer component that renders CAD drawings using Three.js.
 *
 * This class extends {@link UvEdBaseView} and provides functionality for:
 * - Rendering 2D CAD drawings with Three.js WebGL renderer
 * - Handling user interactions (pan, zoom, select)
 * - Managing layouts, layers, and entities
 * - Supporting various CAD file formats (DWG, DXF)
 *
 * @example
 * ```typescript
 * const viewer = new UvTrView2d({
 *   canvas: document.getElementById('canvas') as HTMLCanvasElement,
 *   background: 0x000000,
 *   calculateSizeCallback: () => ({
 *     width: window.innerWidth,
 *     height: window.innerHeight
 *   })
 * });
 * ```
 */
export class UvTrView2d extends UvEdBaseView {
  /** The Three.js renderer wrapper for CAD rendering */
  private _renderer: UvTrRenderer
  /**
   * ID of the currently scheduled requestAnimationFrame callback.
   *
   * This value is used to:
   * - Track whether the animation loop is currently running
   * - Prevent scheduling multiple animation loops
   * - Cancel the animation loop when the view is paused, hidden, or disposed
   *
   * A value of `null` indicates that no animation frame is currently scheduled.
   */
  private _rafId: number | null = null
  /** Manager for layout views and viewport handling */
  private _layoutViewManager: UvTrLayoutViewManager
  /** The 3D scene containing all CAD entities organized by layouts and layers */
  private _scene: UvTrScene
  /** Flag indicating if the view needs to be re-rendered */
  private _isDirty: boolean
  /** Performance monitoring statistics display */
  private _stats: Stats
  /** Map of missing raster images during rendering */
  private _missedImages: Map<UvDbObjectId, string>
  /** The number of entities waiting for processing */
  private _numOfEntitiesToProcess: number

  /**
   * Creates a new 2D CAD viewer instance.
   *
   * @param options - Configuration options for the viewer
   * @param options.container - Optional HTML container element. If not provided, a new container will be created
   * @param options.calculateSizeCallback - Optional callback function to calculate canvas size on window resize
   * @param options.background - Optional background color as hex number (default: 0x000000)
   */
  constructor(options: UvTrView2dOptions = DEFAULT_VIEW_2D_OPTIONS) {
    const mergedOptions: UvTrView2dOptions = {
      ...DEFAULT_VIEW_2D_OPTIONS,
      ...options
    }

    const container = mergedOptions.container ?? document.createElement('div')
    mergedOptions.container = container

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true
    })
    container.appendChild(renderer.domElement)

    super(renderer.domElement, container)
    if (options.calculateSizeCallback) {
      this.setCalculateSizeCallback(options.calculateSizeCallback)
    }

    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(this.width, this.height)

    this._renderer = new UvTrRenderer(renderer)
    const fontMapping = UvApSettingManager.instance.fontMapping
    this._renderer.setFontMapping(fontMapping)
    this._renderer.events.fontNotFound.addEventListener(args => {
      eventBus.emit('font-not-found', {
        fontName: args.fontName,
        count: args.count ?? 0
      })
    })

    this._scene = this.createScene()
    // Initialize background color via renderer clear color
    this._renderer.setClearColor(mergedOptions.background || 0x000000)
    this._stats = this.createStats(UvApSettingManager.instance.isShowStats)

    UvDbSysVarManager.instance().events.sysVarChanged.addEventListener(args => {
      if (args.name === 'whitebkcolor') {
        const useWhiteBackgroundColor = args.newVal as boolean
        this.backgroundColor = useWhiteBackgroundColor ? 0xffffff : 0
      }
    })

    UvApSettingManager.instance.events.modified.addEventListener(args => {
      if (args.key == 'isShowStats') {
        this.toggleStatsVisibility(this._stats, args.value as boolean)
      }
    })

    this.canvas.addEventListener('click', () => {
      if (this.mode == UvEdViewMode.SELECTION) {
        this.select()
      }
    })
    // When using OrbitControls in THREE.js, it attaches its own event listeners to the DOM elements,
    // such as the canvas or the entire document. This can interfere with other event listeners you
    // add, including the keydown event.
    document.addEventListener('keydown', (e: KeyboardEvent) => {
      switch (e.code) {
        case 'Escape':
          this.selectionSet.clear()
          break

        case 'Delete':
        case 'Backspace':
          UvApDocManager.instance.sendStringToExecute('erase')
          break
      }
    })
    uvdbHostApplicationServices().layoutManager.events.layoutSwitched.addEventListener(
      args => {
        this.activeLayoutBtrId = args.layout.blockTableRecordId
        this.createLayoutViewIfNeeded(args.layout.blockTableRecordId)
        this.loadLayoutEntitiesIfNeeded(args.layout.blockTableRecordId)
        this._isDirty = true
      }
    )

    this._missedImages = new Map()
    this._layoutViewManager = new UvTrLayoutViewManager()
    this.initialize()
    this.onWindowResize()
    this._isDirty = true
    this.startAnimationLoop()
    this._numOfEntitiesToProcess = 0
  }

  /**
   * Initializes the viewer after renderer and camera are created.
   *
   * This method sets up the initial cursor and can be overridden by child classes
   * to add custom initialization logic.
   *
   * @protected
   */
  initialize() {
    // This method is called after camera and render are created.
    // Children class can override this method to add its own logic
    this.setCursor(UvEdCorsorType.Crosshair)
  }

  /**
   * Gets the current view mode (selection or pan).
   *
   * @returns The current view mode
   * @inheritdoc
   */
  get mode() {
    const activeLayoutView = this.activeLayoutView
    return activeLayoutView ? activeLayoutView.mode : UvEdViewMode.SELECTION
  }

  /**
   * Sets the view mode (selection or pan).
   *
   * @param value - The view mode to set
   */
  set mode(value: UvEdViewMode) {
    this.activeLayoutView.mode = value
  }

  /**
   * Gets the Three.js renderer wrapper used for CAD rendering.
   *
   * @returns The renderer instance
   */
  get renderer() {
    return this._renderer
  }

  /**
   * Gets whether the view needs to be re-rendered.
   *
   * @returns True if the view is dirty and needs re-rendering
   */
  get isDirty() {
    return this._isDirty
  }

  /**
   * Sets whether the view needs to be re-rendered.
   *
   * @param value - True to mark the view as needing re-rendering
   */
  set isDirty(value: boolean) {
    this._isDirty = value
  }

  /**
   * Gets information about missing data during rendering (fonts and images).
   *
   * @returns Object containing maps of missing fonts and images
   */
  get missedData() {
    return {
      fonts: this._renderer.missedFonts,
      images: this._missedImages
    }
  }

  get center() {
    return this.activeLayoutView.center
  }
  set center(value: UvGePoint2d) {
    this.activeLayoutView.center = value
  }

  /**
   * Gets the background color of the view.
   *
   * The color is represented as a 24-bit hexadecimal RGB number, e.g.,
   * `0x000000` for black.
   */
  get backgroundColor() {
    return this._renderer.getClearColor()
  }

  /**
   * Sets the background color of the view.
   *
   * @param value - The background color as a 24-bit hexadecimal RGB number
   */
  set backgroundColor(value: number) {
    this._renderer.setClearColor(value)
    this._isDirty = true
  }

  /**
   * The block table record id of the model space
   */
  get modelSpaceBtrId() {
    return this._scene.modelSpaceBtrId
  }
  set modelSpaceBtrId(value: UvDbObjectId) {
    this._scene.modelSpaceBtrId = value
  }

  /**
   * The block table record id associated with the active layout
   */
  get activeLayoutBtrId() {
    return this._scene.activeLayoutBtrId
  }
  set activeLayoutBtrId(value: string) {
    this._layoutViewManager.activeLayoutBtrId = value
    this._scene.activeLayoutBtrId = value
    this._isDirty = true
  }

  /**
   * The active layout view
   */
  get activeLayoutView() {
    return this._layoutViewManager.activeLayoutView!
  }

  /**
   * The statistics of the current scene
   */
  get stats() {
    return this._scene.stats
  }

  /**
   * Sets global ltscale
   */
  set ltscale(scale: number) {
    this._renderer.ltscale = scale
  }

  /**
   * Sets global celtscale
   */
  set celtscale(scale: number) {
    this._renderer.celtscale = scale
  }

  /**
   * @inheritdoc
   */
  screenToWorld(point: UvGePoint2dLike): UvGePoint2d {
    const activeLayoutView = this.activeLayoutView
    return activeLayoutView
      ? activeLayoutView.screenToWorld(point)
      : new UvGePoint2d(point)
  }

  /**
   * @inheritdoc
   */
  worldToScreen(point: UvGePoint2dLike): UvGePoint2d {
    const activeLayoutView = this.activeLayoutView
    return activeLayoutView
      ? activeLayoutView.worldToScreen(point)
      : new UvGePoint2d(point)
  }

  /**
   * @inheritdoc
   */
  zoomTo(box: UvGeBox2d, margin: number = 1.1) {
    this.activeLayoutView.zoomTo(box, margin)
    this._isDirty = true
  }

  /**
   * Re-render points with latest point style settings
   * @param displayMode Input display mode of points
   */
  rerenderPoints(displayMode: number) {
    const activeLayout = this._scene.activeLayout
    if (activeLayout) {
      activeLayout.rerenderPoints(displayMode)
      this._isDirty = true
    }
  }

  /**
   * @inheritdoc
   */
  zoomToFitDrawing(timeout: number = 0) {
    const waiter = new UvEdConditionWaiter(
      () => this._numOfEntitiesToProcess <= 0,
      () => {
        // Guard: only zoom if the scene box is non-empty (has actual geometry).
        // An empty Three.js Box3 has min=+Inf/max=-Inf; passing it to zoomTo()
        // would produce zoom=0 (invisible canvas).
        if (this._scene.box && !this._scene.box.isEmpty()) {
          const box = UvTrGeometryUtil.threeBox3dToGeBox2d(this._scene.box)
          this.zoomTo(box)
          this._isDirty = true
        }
      },
      300, // check every 300 ms
      timeout
    )
    waiter.start()
  }

  /**
   * @inheritdoc
   */
  zoomToFitLayer(layerName: string) {
    const activeLayout = this._scene.activeLayout
    if (activeLayout) {
      const layer = activeLayout.getLayer(layerName)
      if (layer && !layer.box.isEmpty()) {
        const box = UvTrGeometryUtil.threeBox3dToGeBox2d(layer.box)
        this.zoomTo(box)
        this._isDirty = true
        return true
      }
    }
    return false
  }

  /**
   * @inheritdoc
   */
  flyTo(point: UvGePoint2dLike, scale: number) {
    this.activeLayoutView.flyTo(point, scale)
    this._isDirty = true
  }

  /**
   * @inheritdoc
   */
  pick(point?: UvGePoint2dLike, hitRadius?: number, pickOneOnly?: boolean) {
    if (point == null) point = this.curPos
    const results: UvEdSpatialQueryResultItemEx[] = []
    const activeLayout = this._scene.activeLayout
    if (activeLayout) {
      const activeLayoutView = this.activeLayoutView
      const box = activeLayoutView.pointToBox(
        point,
        hitRadius ?? this.selectionBoxSize
      )
      const firstQueryResults = this._scene.search(box)

      const threshold = Math.max(box.size.width / 2, box.size.height / 2)
      const raycaster = activeLayoutView.resetRaycaster(point, threshold)
      if (pickOneOnly) {
        firstQueryResults.some(item => {
          const objectId = item.id
          if (activeLayout.isIntersectWith(objectId, raycaster)) {
            results.push(item)
            return true
          }
          return false
        })
      } else {
        firstQueryResults.forEach(item => {
          const objectId = item.id
          if (activeLayout.isIntersectWith(objectId, raycaster)) {
            results.push(item)
          }
        })
      }
    }
    return results
  }

  /**
   * @inheritdoc
   */
  search(box: UvGeBox2d | UvGeBox3d) {
    return this._scene.search(box)
  }

  /**
   * @inheritdoc
   */
  select(point?: UvGePoint2dLike) {
    const idsAdded: Array<UvDbObjectId> = []
    const results = this.pick(point)
    results.forEach(item => idsAdded.push(item.id))
    if (idsAdded.length > 0) this.selectionSet.add(idsAdded)
  }

  /**
   * @inheritdoc
   */
  selectByBox(box: UvGeBox2d) {
    const idsAdded: Array<UvDbObjectId> = []
    const results = this._scene.search(box)
    results.forEach(item => idsAdded.push(item.id))
    this.selectionSet.add(idsAdded)
  }

  /**
   * @inheritdoc
   */
  addLayer(layer: UvDbLayerTableRecord) {
    this._scene.addLayer({
      name: layer.name,
      isFrozen: layer.isFrozen,
      isOff: layer.isOff,
      color: layer.color
    })
    this._isDirty = true
  }

  /**
   * @inheritdoc
   */
  updateLayer(
    layer: UvDbLayerTableRecord,
    changes: Partial<UvDbLayerTableRecordAttrs>
  ) {
    const updatedLayers = this._scene.updateLayer({
      name: layer.name,
      isFrozen: layer.isFrozen,
      isOff: layer.isOff,
      color: layer.color
    })
    const traits: Record<string, unknown> = {}
    if (changes.color) {
      traits.color = changes.color.clone()
      traits.rgbColor = changes.color.RGB
    }
    if (changes.lineStyle) {
      traits.lineType = layer.lineStyle
    }
    if (changes.lineWeight !== undefined) {
      traits.lineWeight = changes.lineWeight
    }
    if (changes.transparency !== undefined) {
      traits.transparency = changes.transparency
    }
    traits.layer = layer.name // always present

    const materials = this._renderer.updateLayerMaterial(layer.name, traits)
    updatedLayers.forEach(layer => {
      for (const id in materials) {
        const material = materials[id]
        layer.updateMaterial(Number(id), material)
      }
    })
    this._isDirty = true
  }

  /**
   * Add the specified transient entity or entities into this view
   * @param entity Input one or multiple transient entities
   */
  addTransientEntity(entity: UvDbEntity | UvDbEntity[]) {
    const entities = Array.isArray(entity) ? entity : [entity]
    for (let i = 0; i < entities.length; ++i) {
      const entity = entities[i]
      const threeEntity: UvTrEntity | null = this.drawEntity(entity, true)
      if (threeEntity) {
        threeEntity.objectId = entity.objectId
        this._scene.addTransientEntity(threeEntity)
        this._isDirty = true
      }
    }
  }

  /**
   * Remove the specified transient entity from this view
   * @param objectId Input the object id of the transient entity to remove
   */
  removeTransientEntity(objectId: UvDbObjectId) {
    this._scene.removeTransientEntity(objectId)
    this._isDirty = true
  }

  /**
   * @inheritdoc
   */
  addEntity(entity: UvDbEntity | UvDbEntity[]) {
    const entities = Array.isArray(entity) ? entity : [entity]
    this._numOfEntitiesToProcess += entities.length
    setTimeout(async () => {
      await this.batchConvert(entities)
    })
    this._isDirty = true
  }

  /**
   * @inheritdoc
   */
  removeEntity(entity: UvDbEntity | UvDbEntity[]) {
    const entities = Array.isArray(entity) ? entity : [entity]
    entities.forEach(entity => this._scene.removeEntity(entity.objectId))
    this._isDirty = true
  }

  /**
   * @inheritdoc
   */
  updateEntity(entity: UvDbEntity | UvDbEntity[]) {
    let entities: UvDbEntity[] = []
    if (Array.isArray(entity)) {
      entities = entity
    } else {
      entities.push(entity)
    }

    for (let i = 0; i < entities.length; ++i) {
      const entity = entities[i]
      const threeEntity = entity.worldDraw(this._renderer) as UvTrEntity
      if (threeEntity) {
        threeEntity.objectId = entity.objectId
        threeEntity.ownerId = entity.ownerId
        threeEntity.layerName = entity.layer
        threeEntity.visible = entity.visibility
        this._scene.updateEntity(threeEntity)
      }
    }
    this._isDirty = true
    // Not sure why texture for image entity isn't updated even if 'isDirty' flag is already set to true.
    // So add one timeout event to set 'isDirty' flag to true again to make it work
    setTimeout(() => {
      this._isDirty = true
    }, 100)
  }

  /**
   * @inheritdoc
   */
  addLayout(layout: UvDbLayout) {
    this._scene.addEmptyLayout(layout.blockTableRecordId)
    this.createLayoutViewIfNeeded(layout.blockTableRecordId)
    this._isDirty = true
  }

  /**
   * @inheritdoc
   */
  clear() {
    this._scene.clear()
    this._isDirty = true
    this._missedImages.clear()
    this._renderer.dispose()
  }

  /**
   * @inheritdoc
   */
  highlight(ids: UvDbObjectId[]) {
    this._isDirty = this._scene.select(ids)
  }

  /**
   * @inheritdoc
   */
  unhighlight(ids: UvDbObjectId[]) {
    this._isDirty = this._scene.unselect(ids)
  }

  stopAnimationLoop() {
    if (this._rafId != null) {
      cancelAnimationFrame(this._rafId)
      this._rafId = null
    }
  }

  /**
   * @inheritdoc
   */
  onHover(id: UvDbObjectId) {
    this._isDirty = this._scene.hover([id])
  }

  /**
   * @inheritdoc
   */
  onUnhover(id: UvDbObjectId) {
    this._isDirty = this._scene.unhover([id])
  }

  protected createScene() {
    return new UvTrScene()
  }

  private createStats(show?: boolean) {
    const stats = new Stats()
    document.body.appendChild(stats.dom)

    // Show Stats component at the right-bottom corner of the window
    const statsDom = stats.dom
    statsDom.style.position = 'fixed'
    statsDom.style.inset = 'unset'
    statsDom.style.bottom = '30px'
    statsDom.style.right = '0px'
    this.toggleStatsVisibility(stats, show)
    return stats
  }

  protected onWindowResize() {
    super.onWindowResize()
    this._renderer.setSize(this.width, this.height)
    this._layoutViewManager.resize(this.width, this.height)
    this._isDirty = true
  }

  private animate = () => {
    this._rafId = requestAnimationFrame(this.animate)

    if (!this._isDirty) return

    this._layoutViewManager.render(this._scene)
    this._stats?.update()
    this._isDirty = false
  }

  private startAnimationLoop() {
    if (this._rafId == null) {
      this._rafId = requestAnimationFrame(this.animate)
    }
  }

  /**
   * Create the layout view with the specified block table record id.
   * @param layoutBtrId Input the block table record id associated with the layout view.
   */
  private createLayoutViewIfNeeded(layoutBtrId: UvDbObjectId) {
    let layoutView = this._layoutViewManager.getAt(layoutBtrId)
    if (layoutView == null) {
      layoutView = new UvTrLayoutView(
        this._renderer,
        layoutBtrId,
        this.width,
        this.height
      )
      layoutView.events.viewChanged.addEventListener(() => {
        this._isDirty = true
        this.events.viewChanged.dispatch()
        this.clearHover()
      })
      this._layoutViewManager.add(layoutView)
    }
    return layoutView
  }

  /**
   * Load entities from the specified layout if they haven't been loaded yet.
   * This ensures that when switching to a layout, all its entities are available for rendering.
   * @param layoutBtrId Input the block table record id of the layout
   */
  private loadLayoutEntitiesIfNeeded(layoutBtrId: UvDbObjectId) {
    try {
      const db = UvApDocManager.instance.curDocument.database
      const blockTableRecord = db.tables.blockTable.getIdAt(layoutBtrId)
      if (!blockTableRecord) {
        return
      }

      const layout = this._scene.activeLayout
      if (layout) {
        // Check if layout has any entities by checking if bounding box is not empty
        const box = layout.box
        if (box && !box.isEmpty()) {
          // Layout exists and has entities (bounding box is not empty), no need to reload
          return
        }
      }

      // Collect all entities from this layout
      const entities: UvDbEntity[] = []
      const iterator = blockTableRecord.newIterator()
      for (const entity of iterator) {
        entities.push(entity)
      }

      // Ensure layout exists in scene
      this._scene.addEmptyLayout(layoutBtrId)
      if (entities.length > 0) {
        // Load entities asynchronously
        this._numOfEntitiesToProcess += entities.length
        setTimeout(async () => {
          await this.batchConvert(entities)
        })
      }
    } catch (error) {
      console.error('[UvTrView2d] Error loading layout entities:', error)
    }
  }

  /**
   * Show or hide stats component
   * @param show If it is true, show stats component. Otherwise, hide stats component.
   * Default value is false.
   */
  private toggleStatsVisibility(stats: Stats, show?: boolean) {
    if (show) {
      stats.dom.style.display = 'block' // Show the stats
    } else {
      stats.dom.style.display = 'none' // Hide the stats
    }
  }

  private drawEntity(entity: UvDbEntity, delay?: boolean) {
    return entity.worldDraw(this._renderer, delay) as UvTrEntity | null
  }

  // Define this in order to workaround libredwg bug.
  // Should be removed after libredwg is fixed.
  static viewportIdCounter = 1000
  /**
   * Converts the specified database entities to three entities
   * @param entities - The database entities
   * @returns The converted three entities
   */
  private async batchConvert(entities: UvDbEntity[]) {
    // Pre-process viewports to:
    // 1) Work around libredwg bug where viewportId is always 0
    // 2) Ignore viewport with id/number === 1. If there is no such viewport, ignore the first viewport in the layout
    const viewportsByLayout = new Map<UvDbObjectId, UvDbViewport[]>()
    for (let i = 0; i < entities.length; ++i) {
      const entity = entities[i]
      if (entity instanceof UvDbViewport) {
        if (entity.number === 0) {
          entity.number = UvTrView2d.viewportIdCounter++
          console.warn(
            `Viewport id for handle ${entity.objectId} is 0! Set it to ${entity.number}`
          )
        }

        const ownerId = entity.ownerId
        let list = viewportsByLayout.get(ownerId)
        if (!list) {
          list = []
          viewportsByLayout.set(ownerId, list)
        }
        list.push(entity)
      }
    }

    // Decide which viewports should actually be created for each layout
    const validViewportIds = new Set<UvDbObjectId>()
    viewportsByLayout.forEach(viewports => {
      if (viewports.length === 0) {
        return
      }

      // First, try to ignore viewport with number === 1
      let filtered = viewports.filter(vp => vp.number !== 1)

      // If nothing was filtered (i.e., no viewport with number === 1),
      // then ignore the first viewport in this layout
      if (filtered.length === viewports.length && viewports.length > 0) {
        filtered = viewports.slice(1)
      }

      filtered.forEach(vp => {
        validViewportIds.add(vp.objectId)
      })
    })

    for (let i = 0; i < entities.length; ++i) {
      const entity = entities[i]
      const threeEntity: UvTrEntity | null = this.drawEntity(entity, true)
      if (threeEntity) {
        threeEntity.objectId = entity.objectId
        threeEntity.ownerId = entity.ownerId
        threeEntity.layerName = entity.layer
        threeEntity.visible = entity.visibility
        if (
          threeEntity instanceof UvTrGroup &&
          !(threeEntity as UvTrGroup).isOnTheSameLayer
        ) {
          this.handleGroup(threeEntity as UvTrGroup)
          this.decreaseNumOfEntitiesToProcess()
        } else {
          const isExtendBbox = !(
            entity instanceof UvDbRay || entity instanceof UvDbXline
          )

          await threeEntity
            .draw()
            .then(() => {
              this._scene.addEntity(threeEntity, isExtendBbox)
              // Release memory occupied by this entity
              threeEntity.dispose()
              this._isDirty = true
            })
            .finally(() => {
              this.decreaseNumOfEntitiesToProcess()
            })
        }

        if (entity instanceof UvDbViewport) {
          // In paper space layouts, there is always a system-defined "default" viewport that exists as
          // the bottom-most item. This viewport doesn't show any entities and is mainly for internal
          // AutoCAD purposes. The viewport id number of this system-defined "default" viewport is 1.
          if (validViewportIds.has(entity.objectId)) {
            const layoutView = this._layoutViewManager.getAt(entity.ownerId)
            if (layoutView) {
              const viewportView = new UvTrViewportView(
                layoutView,
                entity.toGiViewport(),
                this._renderer
              )
              layoutView.addViewport(viewportView)
            }
          }
        } else if (entity instanceof UvDbRasterImage) {
          const fileName = entity.imageFileName
          if (fileName) this._missedImages.set(entity.objectId, fileName)
        }
      } else {
        this.decreaseNumOfEntitiesToProcess()
      }
    }
  }

  private handleGroup(group: UvTrGroup) {
    const children = group.children
    const objectsGroupByLayer: Map<string, THREE.Object3D[]> = new Map()
    children.forEach(child => {
      const layerName = child.userData.layerName
      if (!objectsGroupByLayer.has(layerName)) {
        objectsGroupByLayer.set(layerName, [])
      }
      objectsGroupByLayer.get(layerName)?.push(child)
    })
    // Important:
    // Sometimes one group may contain huge amount of objects (> 100,000). So it is important
    // to re-parent object with the fast approach. Calling add/remove method in THREE.Object3D
    // is very slow because it do lots of things
    // - Remove children from old group
    // - Insert them into new group
    // - Reset parent pointer
    // - Do one updateMatrixWorld() at the end (optional)
    // So we operate its children directly.
    group.children = []
    for (const child of children) {
      child.parent = null
    }

    const styleManager = group.styleManager
    const groupObjectId = group.objectId
    const groupLayerName = group.layerName
    const groupBox = group.box
    objectsGroupByLayer.forEach((objects, layerName) => {
      // In AutoCAD, an INSERT entity may reference multiple child entities that
      // reside on different layers. During rendering, this engine groups entities
      // by layer and assigns each group the INSERT entity's object ID.
      // As a result, a single object ID (typically from an INSERT entity) may
      // correspond to multiple layers. However, in this layer its object id is still
      // uniqiue.
      const entity = new UvTrEntity(styleManager)
      entity.applyMatrix4(group.matrix)
      entity.objectId = groupObjectId
      entity.ownerId = group.ownerId
      // Here one group represents one block reference. If the layer name of entities in block
      // definition is '0', it should be put on layer where the group exist.
      entity.layerName = layerName === '0' ? groupLayerName : layerName
      entity.box = groupBox

      // Important:
      // DO NOT USE spread operator when adding objects because it may be one very large array
      // and can result in maximum call stack size exceeded
      for (let i = 0; i < objects.length; i++) {
        entity.add(objects[i])
      }
      this._scene.addEntity(entity, true)
      entity.dispose()
    })
    group.dispose()

    this._isDirty = true
  }

  private decreaseNumOfEntitiesToProcess() {
    this._numOfEntitiesToProcess--
    if (this._numOfEntitiesToProcess < 0) {
      this._numOfEntitiesToProcess = 0
      console.warn(
        'Something wrong! The number of entities to process should not be less than 0.'
      )
    }
  }
}
