import {
  UvDbEntity,
  uvdbHostApplicationServices,
  uvdbMaskToOsnapModes,
  UvDbObjectId,
  UvDbOsnapMode,
  UvGePoint2d,
  UvGePoint2dLike,
  UvGePoint3dLike
} from '@uniview/data-model'

import { UvApSettingManager } from '../../../uniview-app'
import { UvEdBaseView } from '../../uniview-view'
import { UvEdMarkerManager } from '../uniview-marker'
import { UvEdFloatingInputBoxes } from './uniview-ed-floating-input-boxes'
import {
  UvEdFloatingInputCancelCallback,
  UvEdFloatingInputChangeCallback,
  UvEdFloatingInputCommitCallback,
  UvEdFloatingInputDrawPreviewCallback,
  UvEdFloatingInputDynamicValueCallback,
  UvEdFloatingInputOptions,
  UvEdFloatingInputValidationCallback
} from './uniview-ed-floating-input-types'
import { UvEdFloatingMessage } from './uniview-ed-floating-message'
import { UvEdRubberBand } from './uniview-ed-rubber-band'

type UvEdOsnapPoint = UvGePoint3dLike & {
  type: UvDbOsnapMode
}

/**
 * A UI component providing a small floating input box used inside CAD editing
 * workflows. It supports both single-input (distance, angle, etc.) and
 * double-input (coordinate entry) modes.
 *
 * The component is responsible for:
 *
 * - Creating, styling, and destroying its HTML structure
 * - Handling keyboard events (Enter, Escape)
 * - Managing live validation (via built-in or custom callback)
 * - Emitting commit/change/cancel events
 * - Ensuring no memory leaks via `dispose()`
 *
 * This abstraction allows higher-level objects such as UvEdInputManager to
 * remain clean and free from DOM-handling logic.
 */
export class UvEdFloatingInput<T> extends UvEdFloatingMessage {
  /** Stores last confirmed WCS point */
  lastPoint: UvGePoint2d | null = null

  /** Inject styles only once */
  private static inputStylesInjected = false

  /** Input box container (single or double input) */
  private inputs?: UvEdFloatingInputBoxes<T>

  /** Provides a temporary CAD-style rubber-band preview. */
  private rubberBand?: UvEdRubberBand

  /** OSNAP marker manager to display and hide OSNAP marker */
  private osnapMarkerManager?: UvEdMarkerManager

  /** Stores last confirmed osnap point */
  private lastOsnapPoint?: UvEdOsnapPoint

  /** Callbacks */
  private onCommit?: UvEdFloatingInputCommitCallback<T>
  private onChange?: UvEdFloatingInputChangeCallback<T>
  private onCancel?: UvEdFloatingInputCancelCallback

  /** Validation and dynamic value providers */
  private validateFn: UvEdFloatingInputValidationCallback<T>
  private getDynamicValue: UvEdFloatingInputDynamicValueCallback<T>
  private drawPreview?: UvEdFloatingInputDrawPreviewCallback

  /** Cached click handler */
  private boundOnClick: (e: MouseEvent) => void

  // ---------------------------------------------------------------------------
  // CONSTRUCTOR
  // ---------------------------------------------------------------------------

  /**
   * Constructs a new floating input widget with the given options.
   *
   * @param view - The view associated with the floating input
   * @param options Configuration object controlling behavior, callbacks,
   *                validation, and display mode.
   */
  constructor(view: UvEdBaseView, options: UvEdFloatingInputOptions<T>) {
    super(view, options)

    // -----------------------------
    // OSNAP
    // -----------------------------
    if (!options.disableOSnap) {
      this.osnapMarkerManager = new UvEdMarkerManager(view)
    }

    // -----------------------------
    // Rubber band
    // -----------------------------
    if (options.basePoint) {
      this.rubberBand = new UvEdRubberBand(view)
      this.rubberBand.start(options.basePoint, {
        color: '#0f0',
        showBaseLineOnly: options.showBaseLineOnly
      })
    }

    // -----------------------------
    // Callbacks
    // -----------------------------
    this.validateFn = options.validate
    this.getDynamicValue = options.getDynamicValue
    this.drawPreview = options.drawPreview

    this.onCommit = options.onCommit
    this.onChange = options.onChange
    this.onCancel = options.onCancel

    // -----------------------------
    // Input boxes
    // -----------------------------
    if (options.inputCount !== 0) {
      this.inputs = new UvEdFloatingInputBoxes<T>({
        parent: this.container,
        twoInputs: options.inputCount === 2,
        validate: this.validateFn,
        onCancel: this.onCancel,
        onCommit: this.onCommit,
        onChange: this.onChange
      })
    }

    // -----------------------------
    // Click commit
    // -----------------------------
    this.boundOnClick = e => this.handleClick(e)
    this.parent.addEventListener('click', this.boundOnClick)
    this.injectInputCSS()
  }

  private injectInputCSS() {
    if (UvEdFloatingInput.inputStylesInjected) return
    UvEdFloatingInput.inputStylesInjected = true

    const style = document.createElement('style')
    style.textContent = `
      .ml-floating-input input {
        font-size: 12px;
        padding: 2px 4px;
        margin-left: 6px;
        height: 22px;
        width: 90px;
        background: #888;
        border: 1px solid #666;
        border-radius: 2px;
      }
  
      .ml-floating-input input.invalid {
        border-color: red;
        color: red;
      }
    `
    document.head.appendChild(style)
  }

  // ---------------------------------------------------------------------------
  // Overrides
  // ---------------------------------------------------------------------------

  override dispose() {
    if (this.disposed) return
    super.dispose()

    this.parent.removeEventListener('click', this.boundOnClick)
    this.inputs?.dispose()
    this.rubberBand?.dispose()
    this.osnapMarkerManager?.clear()
  }

  /**
   * Mouse move handler.
   * Updates dynamic input values, rubber-band preview, OSNAP marker,
   * and optional preview drawing.
   */
  protected override handleMouseMove(e: MouseEvent) {
    if (!this.visible) return

    const wcsPos = this.getPosition(e)
    const defaults = this.getDynamicValue(wcsPos)

    this.inputs?.setValue(defaults.raw)

    // Ensure focus stays in input boxes
    if (this.inputs && !this.inputs.focused) {
      this.inputs.focus()
    }

    this.rubberBand?.update(wcsPos)
    this.drawPreview?.(wcsPos)
  }

  // ---------------------------------------------------------------------------
  // Click / Commit
  // ---------------------------------------------------------------------------

  private handleClick(e: MouseEvent) {
    if (!this.visible) return

    const wcsPos = this.getPosition(e)
    const defaults = this.getDynamicValue(wcsPos)

    this.lastPoint = wcsPos
    this.onCommit?.(defaults.value, wcsPos)
  }

  // ---------------------------------------------------------------------------
  // Position & OSNAP
  // ---------------------------------------------------------------------------

  /**
   * Gets the current cursor position in WCS, considering OSNAP.
   */
  private getPosition(e: MouseEvent) {
    // Update floating UI position (screen space)
    const mousePos = super.setPosition(e)

    // Convert cursor to WCS
    const wcsPos = this.view.screenToWorld(mousePos)

    // Apply OSNAP
    if (this.osnapMarkerManager) {
      this.osnapMarkerManager.hideMarker()
      this.lastOsnapPoint = this.getOsnapPoint()

      if (this.lastOsnapPoint) {
        wcsPos.x = this.lastOsnapPoint.x
        wcsPos.y = this.lastOsnapPoint.y

        this.osnapMarkerManager.showMarker(
          this.lastOsnapPoint,
          this.osnapMode2MarkerType(this.lastOsnapPoint.type)
        )
      }
    }
    return wcsPos
  }

  private osnapMode2MarkerType(osnapMode: UvDbOsnapMode) {
    switch (osnapMode) {
      case UvDbOsnapMode.EndPoint:
        return 'rect'
      case UvDbOsnapMode.MidPoint:
        return 'triangle'
      case UvDbOsnapMode.Center:
        return 'circle'
      case UvDbOsnapMode.Quadrant:
        return 'diamond'
      default:
        return 'rect'
    }
  }

  // ---------------------------------------------------------------------------
  // OSNAP calculation
  // ---------------------------------------------------------------------------

  private getOsnapPoint(point?: UvGePoint2dLike, hitRadius = 20) {
    const snapPoints = this.getOsnapPoints(point, hitRadius)

    let minDist = Number.MAX_VALUE
    let index = -1

    for (let i = 0; i < snapPoints.length; i++) {
      const d = this.view.curPos.distanceTo(snapPoints[i])
      if (d < minDist) {
        minDist = d
        index = i
      }
    }

    if (index !== -1) {
      const p1 = this.view.screenToWorld({ x: 0, y: 0 })
      const p2 = this.view.screenToWorld({ x: hitRadius, y: 0 })
      if (minDist < p2.x - p1.x) {
        return snapPoints[index]
      }
    }
    return undefined
  }

  private getOsnapPoints(point?: UvGePoint2dLike, hitRadius = 20) {
    const results = this.view.pick(point, hitRadius)

    const db = uvdbHostApplicationServices().workingDatabase
    const modelSpace = db.tables.blockTable.modelSpace
    const osnapPoints: UvEdOsnapPoint[] = []

    results.forEach(item => {
      const entity = modelSpace.getIdAt(item.id)
      if (!entity) return

      if (item.children) {
        item.children.forEach(child =>
          this.getOsnapPointsInAvailableModes(entity, osnapPoints, child.id)
        )
      } else {
        this.getOsnapPointsInAvailableModes(entity, osnapPoints)
      }
    })

    return osnapPoints
  }

  private getOsnapPointsInAvailableModes(
    entity: UvDbEntity,
    osnapPoints: UvEdOsnapPoint[],
    gsMark?: UvDbObjectId
  ) {
    const modes = uvdbMaskToOsnapModes(UvApSettingManager.instance.osnapModes)
    modes.forEach(mode =>
      this.getOsnapPointsByMode(entity, mode, osnapPoints, gsMark)
    )
  }

  private getOsnapPointsByMode(
    entity: UvDbEntity,
    osnapMode: UvDbOsnapMode,
    osnapPoints: UvEdOsnapPoint[],
    gsMark?: UvDbObjectId
  ) {
    const start = osnapPoints.length
    entity.subGetOsnapPoints(
      osnapMode,
      { ...this.view.curPos, z: 0 },
      this.lastPoint,
      osnapPoints,
      gsMark
    )

    for (let i = start; i < osnapPoints.length; i++) {
      osnapPoints[i].type = osnapMode
    }
  }
}
