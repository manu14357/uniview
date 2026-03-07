import {
  UvGeBox2d,
  UvGePoint2dLike,
  UvGePoint3dLike
} from '@uniview/data-model'

import { UvApSettingManager } from '../../../uniview-app'
import { UvApI18n } from '../../../uniview-i18n'
import { UvEdBaseView } from '../../uniview-view'
import { UvEdPreviewJig } from '../uniview-ed-preview-jig'
import {
  UvEdAngleHandler,
  UvEdDistanceHandler,
  UvEdDoubleHandler,
  UvEdInputHandler,
  UvEdIntegerHandler,
  UvEdNumericalHandler,
  UvEdPointHandler,
  UvEdStringHandler
} from '../uniview-handler'
import { UvEdKeywordHandler } from '../uniview-handler/uniview-ed-keyword-handler'
import {
  UvEdPromptAngleOptions,
  UvEdPromptDistanceOptions,
  UvEdPromptEntityOptions,
  UvEdPromptIntegerOptions,
  UvEdPromptKeywordOptions,
  UvEdPromptNumericalOptions,
  UvEdPromptPointOptions,
  UvEdPromptSelectionOptions,
  UvEdPromptStringOptions
} from '../uniview-prompt'
import { UvEdCommandLine } from './uniview-ed-command-line'
import { UvEdFloatingInput } from './uniview-ed-floating-input'
import {
  UvEdFloatingInputBoxCount,
  UvEdFloatingInputCommitCallback,
  UvEdFloatingInputDrawPreviewCallback,
  UvEdFloatingInputDynamicValueCallback,
  UvEdFloatingInputRawData
} from './uniview-ed-floating-input-types'
import { UvEdFloatingMessage } from './uniview-ed-floating-message'

/**
 * A fully type-safe TypeScript class providing CAD-style interactive user input
 * using floating HTML input boxes and mouse events. Supports collecting points,
 * distances, angles, numbers, strings, and selecting a 2-point rectangular box
 * using an HTML overlay rectangle (suitable when the main canvas is a THREE.js
 * WebGL canvas).
 */
export class UvEdInputManager {
  /** Inject styles only once */
  private static stylesInjected = false

  /** The view associated with this input operation */
  protected view: UvEdBaseView

  /** Stores last confirmed point from getPoint() or getBox() */
  private lastPoint: UvGePoint2dLike | null = null

  /** Command line UI component */
  private _commandLine: UvEdCommandLine
  /** Buffered command-line style inputs (each item is one Enter-confirmed value). */
  private _scriptInputs: string[] = []

  /**
   * The flag to indicate whether it is currently in an “input acquisition” mode (e.g., point
   * selection, distance/angle prompt, string prompt, etc.),
   */
  private active: boolean = false

  /**
   * Construct the manager and attach mousemove listener used for floating input
   * positioning and live preview updates.
   *
   * @param view - The view associated with the input manager
   */
  constructor(view: UvEdBaseView) {
    this.view = view
    this.injectCSS()
    // Newly added UI overlays (command line, previews) are container-local.
    // Ensure absolute-positioned children are anchored to this view only.
    const containerPosition = getComputedStyle(this.view.container).position
    if (containerPosition === 'static') {
      this.view.container.style.position = 'relative'
    }
    const commandLine = new UvEdCommandLine(this.view.container)
    this._commandLine = commandLine
    commandLine.visible = UvApSettingManager.instance.isShowCommandLine
    UvApSettingManager.instance.events.modified.addEventListener(() => {
      commandLine.visible = UvApSettingManager.instance.isShowCommandLine
    })
  }

  /**
   * The flag to indicate whether it is currently in an “input acquisition” mode (e.g., point
   * selection, distance/angle prompt, string prompt, etc.),
   */
  get isActive() {
    return this.active
  }

  /**
   * Queue scripted inputs for subsequent getXXX calls.
   * One array item equals one Enter-confirmed value.
   */
  enqueueScriptInputs(inputs: string[]) {
    if (!inputs.length) return
    this._scriptInputs.push(...inputs)
  }

  /** Clears any pending scripted inputs. */
  clearScriptInputs() {
    this._scriptInputs.length = 0
  }

  /**
   * Injects minimal CSS required for the floating input and preview rectangle.
   * Useful when you do not have a separate CSS file.
   */
  private injectCSS() {
    if (UvEdInputManager.stylesInjected) return
    UvEdInputManager.stylesInjected = true

    const style = document.createElement('style')
    style.textContent = `
      .ml-jig-preview-rect {
        position: absolute;
        border: 1px dashed var(--line-color, #0f0);
        background: rgba(0, 255, 0, 0.04);
        pointer-events: none;
        z-index: 9999;
      }
      .ml-jig-preview-line {
        position: absolute;
        height: 1px;
        background: var(--line-color, #0f0);
        transform-origin: 0 0;
        pointer-events: none;
        z-index: 9999;
      }
    `
    document.head.appendChild(style)
  }

  /**
   * Format a number for display in input box.
   * Default: 3 decimal places for points/distance, 2 decimal places for angles.
   * @param value The numeric value
   * @param type Optional type: 'point' | 'distance' | 'angle'
   */
  private formatNumber(
    value: number,
    type: 'point' | 'distance' | 'angle'
  ): string {
    switch (type) {
      case 'angle':
        return value.toFixed(2)
      case 'distance':
      case 'point':
      default:
        return value.toFixed(3)
    }
  }

  /**
   * Public point input API.
   */
  getPoint(options: UvEdPromptPointOptions): Promise<UvGePoint3dLike> {
    const scriptedValue = this.tryGetScriptedPoint(options)
    if (scriptedValue != null) {
      return Promise.resolve(scriptedValue)
    }
    return this.getPointInternal(options)
  }

  /**
   * Prompt the user to type a numeric value. If integerOnly is true, integers
   * are enforced. The input is validated and the box will be marked invalid if
   * the typed value does not conform, allowing the user to retype.
   */
  private getNumberTyped(
    options: UvEdPromptNumericalOptions,
    handler: UvEdNumericalHandler | UvEdAngleHandler
  ): Promise<number> {
    const getDynamicValue = () => {
      return {
        value: 0,
        raw: { x: '' }
      }
    }

    return this.makeFloatingInputPromise<number>({
      message: options.message,
      inputCount: 1,
      jig: options.jig,
      showBaseLineOnly: false,
      useBasePoint: false,
      handler,
      getDynamicValue
    })
  }

  /** Request a distance (number) from the user. */
  getDistance(options: UvEdPromptDistanceOptions): Promise<number> {
    const scriptedValue = this.tryGetScriptedNumber(
      new UvEdDistanceHandler(options)
    )
    if (scriptedValue != null) {
      return Promise.resolve(scriptedValue)
    }

    // If no base point defined → fall back to typed numeric input
    if (!this.lastPoint) {
      // fallback to normal numeric input
      return this.getNumberTyped(options, new UvEdDistanceHandler(options))
    }

    const getDynamicValue = (pos: UvGePoint2dLike) => {
      const dx = pos.x - this.lastPoint!.x
      const dy = pos.y - this.lastPoint!.y
      const dist = Math.sqrt(dx * dx + dy * dy)
      return {
        value: dist,
        raw: { x: this.formatNumber(dist, 'distance') }
      }
    }

    const handler = new UvEdDistanceHandler(options)
    return this.makeFloatingInputPromise<number>({
      message: options.message,
      inputCount: 1,
      jig: options.jig,
      showBaseLineOnly: !options.useDashedLine,
      useBasePoint: true,
      basePoint: options.basePoint,
      handler,
      getDynamicValue
    })
  }

  /** Request an angle in degrees from the user. */
  getAngle(options: UvEdPromptAngleOptions): Promise<number> {
    const scriptedValue = this.tryGetScriptedNumber(
      new UvEdAngleHandler(options)
    )
    if (scriptedValue != null) {
      return Promise.resolve(scriptedValue)
    }

    const getDynamicValue = (pos: UvGePoint2dLike) => {
      const dx = pos.x - this.lastPoint!.x
      const dy = pos.y - this.lastPoint!.y
      const angleRad = Math.atan2(dy, dx)
      const angleDeg = (angleRad * 180) / Math.PI
      return {
        value: angleDeg,
        raw: { x: this.formatNumber(angleDeg, 'angle') }
      }
    }

    const handler = new UvEdAngleHandler(options)
    return this.makeFloatingInputPromise<number>({
      message: options.message,
      inputCount: 1,
      jig: options.jig,
      showBaseLineOnly: !options.useDashedLine,
      useBasePoint: true,
      basePoint: options.basePoint,
      handler,
      getDynamicValue
    })
  }

  /** Request a double/float from the user. */
  getDouble(options: UvEdPromptDistanceOptions): Promise<number> {
    const scriptedValue = this.tryGetScriptedNumber(
      new UvEdDoubleHandler(options)
    )
    if (scriptedValue != null) {
      return Promise.resolve(scriptedValue)
    }
    return this.getNumberTyped(options, new UvEdDoubleHandler(options))
  }

  /** Request an integer from the user. */
  getInteger(options: UvEdPromptIntegerOptions): Promise<number> {
    const scriptedValue = this.tryGetScriptedNumber(
      new UvEdIntegerHandler(options)
    )
    if (scriptedValue != null) {
      return Promise.resolve(scriptedValue)
    }
    return this.getNumberTyped(options, new UvEdIntegerHandler(options))
  }

  /**
   * Prompt the user to type an arbitrary string. Resolved when Enter is pressed.
   */
  getString(options: UvEdPromptStringOptions): Promise<string> {
    const scriptedValue = this.tryGetScriptedValue(
      new UvEdStringHandler(options)
    )
    if (scriptedValue != null) {
      return Promise.resolve(scriptedValue)
    }

    const getDynamicValue = () => {
      return {
        value: '',
        raw: { x: '' }
      }
    }

    const handler = new UvEdStringHandler(options)
    return this.makeFloatingInputPromise<string>({
      message: options.message,
      inputCount: 1,
      jig: options.jig,
      showBaseLineOnly: false,
      useBasePoint: false,
      handler,
      getDynamicValue
    })
  }

  /**
   * Prompt the user to type a keyword. Resolved when Enter is pressed.
   */
  getKeywords(options: UvEdPromptKeywordOptions): Promise<string> {
    const scriptedValue = this.tryGetScriptedValue(
      new UvEdKeywordHandler(options)
    )
    if (scriptedValue != null) {
      return Promise.resolve(scriptedValue)
    }

    const getDynamicValue = () => {
      return {
        value: '',
        raw: { x: '' }
      }
    }

    const handler = new UvEdKeywordHandler(options)
    return this.makeFloatingInputPromise<string>({
      message: options.message,
      inputCount: 1,
      jig: options.jig,
      showBaseLineOnly: false,
      useBasePoint: false,
      handler,
      getDynamicValue
    })
  }

  /**
   * Prompts the user to select one or more entities by mouse interaction.
   *
   * This method supports two selection modes:
   *
   * - **Click selection**: Clicking on an entity selects the entity under the cursor.
   * - **Box selection**: Dragging the mouse to let the user specify a rectangular window,
   *   and all entities intersecting that box are selected.
   *
   * The selection operation behaves similarly to AutoCAD's
   * `Editor.GetSelection()` API:
   *
   * - Press **Enter** to accept the current selection set.
   * - Press **Escape** to cancel the operation.
   * - If {@link UvEdPromptSelectionOptions.singleOnly} is `true`, the selection
   *   completes immediately after the first entity is selected.
   *
   * This method does not use floating input boxes. Instead, it relies entirely on
   * mouse gestures and keyboard input. A floating prompt message and command line
   * prompt are displayed during the operation.
   *
   * @param options - Selection prompt options that control user messaging and
   *                  whether only a single entity may be selected.
   * @returns A promise that resolves to an array of selected entity IDs.
   *          The array is empty if no entities are selected and the user presses Enter.
   *          The promise is rejected if the operation is cancelled.
   */
  async getSelection(options: UvEdPromptSelectionOptions): Promise<string[]> {
    return new Promise((resolve, reject) => {
      this.active = true
      this._commandLine.setPrompt(options.message)

      const floatingMessage = new UvEdFloatingMessage(this.view, {
        parent: this.view.canvas,
        message: options.message
      })

      const selected = new Set<string>()
      let startWcs: UvGePoint2dLike | null = null
      let previewEl: HTMLDivElement | null = null

      const cleanup = () => {
        this.active = false
        floatingMessage.dispose()
        previewEl?.remove()
        this._commandLine.clear()

        document.removeEventListener('keydown', keyHandler)
        this.view.canvas.removeEventListener('mousedown', mouseDown)
        this.view.canvas.removeEventListener('mousemove', mouseMove)
        this.view.canvas.removeEventListener('mouseup', mouseUp)
      }

      /** ---------- Keyboard ---------- */

      const keyHandler = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          cleanup()
          reject(new Error('cancelled'))
          return
        }

        if (e.key === 'Enter') {
          cleanup()
          resolve([...selected])
        }
      }

      /** ---------- Mouse ---------- */

      const mouseDown = (e: MouseEvent) => {
        startWcs = this.view.screenToWorld(
          this.view.viewportToCanvas({ x: e.clientX, y: e.clientY })
        )

        previewEl = document.createElement('div')
        previewEl.className = 'ml-jig-preview-rect'
        this.view.container.appendChild(previewEl)
      }

      const mouseMove = (e: MouseEvent) => {
        if (!startWcs || !previewEl) return

        const curWcs = this.view.screenToWorld(
          this.view.viewportToCanvas({ x: e.clientX, y: e.clientY })
        )
        const p1 = this.view.worldToScreen(startWcs)
        const p2 = this.view.worldToScreen(curWcs)

        const left = Math.min(p1.x, p2.x)
        const top = Math.min(p1.y, p2.y)
        const width = Math.abs(p1.x - p2.x)
        const height = Math.abs(p1.y - p2.y)

        Object.assign(previewEl.style, {
          left: `${left}px`,
          top: `${top}px`,
          width: `${width}px`,
          height: `${height}px`
        })
      }

      const mouseUp = (e: MouseEvent) => {
        if (!startWcs) return

        const endWcs = this.view.screenToWorld(
          this.view.viewportToCanvas({ x: e.clientX, y: e.clientY })
        )
        previewEl?.remove()
        previewEl = null

        // Click selection
        const dist = Math.hypot(endWcs.x - startWcs.x, endWcs.y - startWcs.y)

        if (dist < 2) {
          const picked = this.view.pick(endWcs)
          if (picked.length > 0) {
            selected.add(picked[0].id)
            if (options.singleOnly) {
              cleanup()
              resolve([...selected])
            }
          }
        } else {
          // Box selection
          const box = new UvGeBox2d()
            .expandByPoint(startWcs)
            .expandByPoint(endWcs)

          this.view.selectByBox(box)

          for (const id of this.view.selectionSet.ids) {
            selected.add(id)
            if (options.singleOnly) break
          }
        }

        startWcs = null
      }

      /** ---------- Attach ---------- */

      document.addEventListener('keydown', keyHandler)
      this.view.canvas.addEventListener('mousedown', mouseDown)
      this.view.canvas.addEventListener('mousemove', mouseMove)
      this.view.canvas.addEventListener('mouseup', mouseUp)
    })
  }

  /**
   * Prompts the user to select a single entity.
   * Similar to Editor.GetEntity() in AutoCAD.
   */
  getEntity(options: UvEdPromptEntityOptions): Promise<string | null> {
    return new Promise((resolve, reject) => {
      this.active = true
      const floatingMessage = new UvEdFloatingMessage(this.view, {
        parent: this.view.canvas,
        message: options.message
      })
      this._commandLine.setPrompt(options.message)
      const cleanup = () => {
        this.active = false
        options.jig?.end()
        document.removeEventListener('keydown', keyHandler)
        this.view.canvas.removeEventListener('mousedown', clickHandler)
        floatingMessage.dispose()
        this._commandLine.clear()
      }

      /** Mouse click → try select entity */
      const clickHandler = (e: MouseEvent) => {
        const pos = this.view.screenToWorld(
          this.view.viewportToCanvas({ x: e.clientX, y: e.clientY })
        )
        const picked = this.view.pick(pos)

        // Clicked empty space
        if (picked.length == 0) {
          // this.view.showMessage(options.rejectMessage)
          return
        }

        // Locked layer
        // if (picked.locked && !options.allowObjectOnLockedLayer) {
        //   this.view.showMessage(options.rejectMessage)
        //   return
        // }

        // Class filter
        // if (!options.isClassAllowed(picked.className)) {
        //   this.view.showMessage(options.rejectMessage)
        //   return
        // }

        cleanup()
        resolve(picked[0].id)
      }

      /** Keyboard handling */
      const keyHandler = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          cleanup()
          reject(new Error('cancelled'))
          return
        }

        if (e.key === 'Enter' && options.allowNone) {
          cleanup()
          resolve(null)
        }
      }

      document.addEventListener('keydown', keyHandler)
      this.view.canvas.addEventListener('mousedown', clickHandler)
    })
  }

  /**
   * Prompt the user to specify a rectangular box by selecting two corners.
   * Each corner may be specified by clicking on the canvas or typing "x,y".
   * A live HTML overlay rectangle previews the box as the user moves the mouse.
   */
  async getBox(): Promise<UvGeBox2d> {
    // Get first point
    const message1 = UvApI18n.t('main.inputManager.firstCorner')
    const options1 = new UvEdPromptPointOptions(message1)
    options1.useDashedLine = false
    options1.useBasePoint = false
    const p1 = await this.getPoint(options1)
    const cwcsP1 = this.view.worldToScreen(p1)

    // Create preview rectangle
    const previewEl = document.createElement('div')
    previewEl.className = 'ml-jig-preview-rect'
    this.view.container.appendChild(previewEl)

    const cleanup = () => {
      previewEl.remove()
    }

    const drawPreview = (pos: UvGePoint2dLike) => {
      const cwcsP2 = this.view.worldToScreen(pos)
      const left = Math.min(cwcsP2.x, cwcsP1.x)
      const top = Math.min(cwcsP2.y, cwcsP1.y)
      const width = Math.abs(cwcsP2.x - cwcsP1.x)
      const height = Math.abs(cwcsP2.y - cwcsP1.y)

      Object.assign(previewEl.style, {
        left: `${left}px`,
        top: `${top}px`,
        width: `${width}px`,
        height: `${height}px`
      })
    }

    // Second point
    const message2 = UvApI18n.t('main.inputManager.secondCorner')
    const options2 = new UvEdPromptPointOptions(message2)
    options2.useDashedLine = false
    options2.useBasePoint = false
    const p2 = await this.getPointInternal(options2, cleanup, drawPreview)

    return new UvGeBox2d().expandByPoint(p1).expandByPoint(p2)
  }

  /**
   * Shared point input logic used by getPoint() and getBox(). Accepts "x,y"
   * typed input OR mouse click.
   */
  private getPointInternal(
    options: UvEdPromptPointOptions,
    cleanup?: () => void,
    drawPreview?: UvEdFloatingInputDrawPreviewCallback
  ) {
    const scriptedValue = this.tryGetScriptedPoint(options)
    if (scriptedValue != null) {
      cleanup?.()
      return Promise.resolve(scriptedValue)
    }

    const getDynamicValue = (pos: UvGePoint2dLike) => {
      return {
        value: { x: pos.x, y: pos.y, z: 0 },
        raw: {
          x: this.formatNumber(pos.x, 'point'),
          y: this.formatNumber(pos.y, 'point')
        }
      }
    }

    const handler = new UvEdPointHandler(options)
    return this.makeFloatingInputPromise<UvGePoint3dLike>({
      message: options.message,
      inputCount: 2,
      jig: options.jig,
      showBaseLineOnly: !options.useDashedLine,
      useBasePoint: options.useBasePoint,
      basePoint: options.basePoint,
      cleanup,
      handler,
      getDynamicValue,
      drawPreview
    })
  }

  /**
   * Attempts to consume one scripted input and parse it as a point.
   * Supported forms: "x,y", "x,y,z", or "x y".
   */
  private tryGetScriptedPoint(
    options: UvEdPromptPointOptions
  ): UvGePoint3dLike | undefined {
    const token = this.dequeueScriptInput()
    if (token === undefined) return undefined

    const parsed = this.splitScriptedPoint(token)
    if (!parsed) {
      throw new Error(`Invalid point input '${token}'`)
    }

    const value = new UvEdPointHandler(options).parse(parsed.x, parsed.y)
    if (value == null) {
      throw new Error(`Invalid point input '${token}'`)
    }

    this.lastPoint = { x: value.x, y: value.y }
    return value
  }

  /**
   * Attempts to consume one scripted input and parse it with the supplied handler.
   */
  private tryGetScriptedValue<T>(handler: UvEdInputHandler<T>): T | undefined {
    const token = this.dequeueScriptInput()
    if (token === undefined) return undefined

    const value = handler.parse(token)
    if (value == null) {
      throw new Error(`Invalid scripted input '${token}'`)
    }
    return value
  }

  private tryGetScriptedNumber(
    handler: UvEdNumericalHandler | UvEdAngleHandler
  ): number | undefined {
    return this.tryGetScriptedValue(handler)
  }

  private dequeueScriptInput() {
    if (!this._scriptInputs.length) return undefined
    return this._scriptInputs.shift()
  }

  private splitScriptedPoint(
    token: string
  ): { x: string; y: string } | undefined {
    const trimmed = token.trim()
    if (!trimmed) return undefined

    if (trimmed.includes(',')) {
      const parts = trimmed.split(',').map(v => v.trim())
      if (parts.length !== 2 && parts.length !== 3) return undefined
      if (parts.length === 3 && Number.isNaN(Number(parts[2]))) return undefined
      return { x: parts[0], y: parts[1] }
    }

    const parts = trimmed.split(/\s+/)
    if (parts.length < 2) return undefined
    return { x: parts[0], y: parts[1] }
  }

  /**
   * Creates a promise for floating input that will be resolved or rejected by user input.
   *
   * This method centralizes the lifecycle of an interactive input operation,
   * including handling the Escape key to cancel, resolving with user-provided
   * values, and guaranteeing cleanup of UI elements and event handlers.
   */
  private makeFloatingInputPromise<T>(options: {
    message?: string
    inputCount?: UvEdFloatingInputBoxCount
    jig?: UvEdPreviewJig<T>
    showBaseLineOnly?: boolean
    useBasePoint?: boolean
    basePoint?: UvGePoint2dLike
    disableOSnap?: boolean
    handler: UvEdInputHandler<T>
    cleanup?: () => void
    getDynamicValue: UvEdFloatingInputDynamicValueCallback<T>
    drawPreview?: UvEdFloatingInputDrawPreviewCallback
    onCommit?: UvEdFloatingInputCommitCallback<T>
  }): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      this.active = true
      const validate = (raw: UvEdFloatingInputRawData) => {
        const value = options.handler.parse(raw.x, raw.y)
        return {
          isValid: value != null,
          value: value ?? undefined
        }
      }

      let basePoint: UvGePoint2dLike | undefined = undefined
      if (options.useBasePoint) {
        if (options.basePoint) {
          basePoint = options.basePoint
        } else if (this.lastPoint) {
          basePoint = { x: this.lastPoint.x, y: this.lastPoint.y }
        }
      }

      this._commandLine.setPrompt(options.message)
      const floatingInput = new UvEdFloatingInput(this.view, {
        parent: this.view.canvas,
        inputCount: options.inputCount,
        message: options.message,
        disableOSnap: options.disableOSnap,
        showBaseLineOnly: options.showBaseLineOnly,
        basePoint,
        validate: validate,
        getDynamicValue: options.getDynamicValue,
        drawPreview: (pos: UvGePoint2dLike) => {
          if (options.jig) {
            const defaults = options.getDynamicValue(pos)
            options.jig.update(defaults.value)
            options.jig.render()
          }
          options.drawPreview?.(pos)
        },
        onCommit: (val: T) => {
          let result = false
          if (!options.onCommit || options.onCommit(val)) {
            resolver(val)
            result = true
          }
          if (floatingInput.lastPoint) {
            this.lastPoint = {
              x: floatingInput.lastPoint.x,
              y: floatingInput.lastPoint.y
            }
          }
          return result
        },
        onCancel: () => rejector()
      })
      const cleanup = () => {
        this.active = false
        options.cleanup?.()
        options.jig?.end()
        document.removeEventListener('keydown', escHandler)
        floatingInput.dispose()
        this._commandLine.clear()
      }

      const resolver = (value: T) => {
        cleanup()
        resolve(value)
      }

      const rejector = () => {
        cleanup()
        reject(new Error('cancelled'))
      }

      const escHandler = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          rejector()
        }
      }
      document.addEventListener('keydown', escHandler)
      // showAt() expects viewport coordinates; curMousePos is canvas-local.
      floatingInput.showAt(this.view.canvasToViewport(this.view.curMousePos))
    })
  }
}
