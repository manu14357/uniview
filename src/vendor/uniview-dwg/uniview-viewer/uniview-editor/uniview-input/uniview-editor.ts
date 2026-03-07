import { UvCmEventManager } from '@uniview/data-model'

import { UvEdCommand } from '../uniview-command'
import { UvEdBaseView } from '../uniview-view/uniview-ed-base-view'
import { UvEdCorsorType, UvEdCursorManager } from './uniview-ed-cursor-manager'
import {
  UvEdPromptAngleOptions,
  UvEdPromptDistanceOptions,
  UvEdPromptEntityOptions,
  UvEdPromptKeywordOptions,
  UvEdPromptPointOptions,
  UvEdPromptSelectionOptions,
  UvEdPromptStringOptions
} from './uniview-prompt'
import { UvEdInputManager } from './uniview-ui'

/**
 * Event arguments for system variable related events.
 */
export interface UvDbSysVarEventArgs {
  /** The system variable name */
  name: string
}

/**
 * Event arguments for command lifecycle events.
 *
 * Contains the command instance that triggered the event.
 */
export interface UvEdCommandEventArgs {
  /** The command instance involved in the event */
  command: UvEdCommand
}

/**
 * Advanced input handler for CAD operations providing high-level user interaction methods.
 *
 * This class serves as a wrapper for all types of user input including:
 * - Point input (mouse clicks, coordinates)
 * - Entity selection (single or multiple entities)
 * - String, number, angle, and distance input
 * - Cursor management and visual feedback
 *
 * The editor abstracts away low-level mouse and keyboard events, providing a clean API
 * for command implementations. Instead of listening to raw DOM events, commands should
 * use the methods provided by this class.
 *
 * @example
 * ```typescript
 * // Get user input for a point
 * const point = await editor.getPoint();
 * console.log('User clicked at:', point);
 *
 * // Get entity selection
 * const selection = await editor.getSelection();
 * console.log('Selected entities:', selection.ids);
 *
 * // Change cursor appearance
 * editor.setCursor(UvEdCorsorType.Crosshair);
 * ```
 */
export class UvEditor {
  /** Previously set cursor type for restoration */
  private _previousCursor?: UvEdCorsorType
  /** Currently active cursor type */
  private _currentCursor?: UvEdCorsorType
  /** Manager for cursor appearance and behavior */
  private _cursorManager: UvEdCursorManager
  /** Manager for mouse and keyboard input */
  private _inputManager: UvEdInputManager
  /** The view this editor is associated with */
  protected _view: UvEdBaseView

  /**
   * Editor events
   */
  public readonly events = {
    /**
     * Fired after a system variable is changed directly through the SETVAR command or
     * by entering the variable name at the command line.
     */
    sysVarChanged: new UvCmEventManager<UvDbSysVarEventArgs>(),
    /** Fired just before the command starts executing */
    commandWillStart: new UvCmEventManager<UvEdCommandEventArgs>(),
    /** Fired after the command finishes executing */
    commandEnded: new UvCmEventManager<UvEdCommandEventArgs>()
  }

  /**
   * Creates a new editor instance for the specified view.
   *
   * @param view - The view that this editor will handle input for
   */
  constructor(view: UvEdBaseView) {
    this._view = view
    this._cursorManager = new UvEdCursorManager(view)
    this._inputManager = new UvEdInputManager(view)
  }

  /**
   * The flag to indicate whether it is currently in an “input acquisition” mode (e.g., point
   * selection, distance/angle prompt, string prompt, etc.),
   */
  get isActive() {
    return this._inputManager.isActive
  }

  /**
   * Queues scripted command-line inputs for subsequent getXXX prompts.
   * One entry equals one Enter-confirmed input.
   */
  enqueueScriptInputs(inputs: string[]) {
    this._inputManager.enqueueScriptInputs(inputs)
  }

  /** Clears any queued scripted inputs. */
  clearScriptInputs() {
    this._inputManager.clearScriptInputs()
  }

  /**
   * Gets the currently active cursor type.
   *
   * @returns The current cursor type, or undefined if none is set
   */
  get currentCursor() {
    return this._currentCursor
  }

  /**
   * Restores the previously set cursor.
   *
   * This is useful for temporarily changing the cursor and then reverting
   * to the previous state.
   */
  restoreCursor() {
    if (this._previousCursor != null) {
      this.setCursor(this._previousCursor)
    }
  }

  /**
   * Sets the cursor appearance for the view.
   *
   * The previous cursor type is stored for potential restoration.
   *
   * @param cursorType - The cursor type to set
   *
   * @example
   * ```typescript
   * editor.setCursor(UvEdCorsorType.Crosshair);  // For precise point input
   * editor.setCursor(UvEdCorsorType.Grab);       // For pan operations
   * ```
   */
  setCursor(cursorType: UvEdCorsorType) {
    this._cursorManager.setCursor(cursorType)
    this._previousCursor = this._currentCursor
    this._currentCursor = cursorType
  }

  /**
   * Prompts the user to input a point by clicking on the view or inputting
   * one coordinate value.
   *
   * This method returns a promise that resolves after the user clicks
   * on the view or inputs one valid coordinate value, providing the
   * world coordinates of the click point.
   *
   * @returns Promise that resolves to the input point coordinates
   */
  async getPoint(options: UvEdPromptPointOptions) {
    return await this._inputManager.getPoint(options)
  }

  /**
   * Prompts the user to input an angle by clicking on the view or input
   * one number.
   *
   * This method returns a promise that resolves after the user clicks
   * on the view or inputs one valid angle value.
   *
   * @returns Promise that resolves to the input angle value.
   */
  async getAngle(options: UvEdPromptAngleOptions) {
    return await this._inputManager.getAngle(options)
  }

  /**
   * Prompts the user to input a distance by clicking on the view or input
   * one number.
   *
   * This method returns a promise that resolves after the user clicks
   * on the view or inputs one valid distance value.
   *
   * @returns Promise that resolves to the input distance value.
   */
  async getDistance(options: UvEdPromptDistanceOptions) {
    return await this._inputManager.getDistance(options)
  }

  /**
   * Prompts the user to input a string.
   *
   * @returns Promise that resolves to the input one string.
   */
  async getString(options: UvEdPromptStringOptions) {
    return await this._inputManager.getString(options)
  }

  /**
   * Prompts the user to input a keyword.
   *
   * @returns Promise that resolves to the input one keyword.
   */
  async getKeywords(options: UvEdPromptKeywordOptions) {
    return await this._inputManager.getKeywords(options)
  }

  /**
   * Prompts the user to input a keyword.
   *
   * @returns Promise that resolves to the input one keyword.
   */
  async getEntity(options: UvEdPromptEntityOptions) {
    return await this._inputManager.getEntity(options)
  }

  /**
   * Prompts the user to select entities using box selection.
   *
   * This method allows the user to drag a selection box to select
   * multiple entities at once. The selection behavior follows CAD
   * conventions (left-to-right for crossing, right-to-left for window).
   *
   * @returns Promise that resolves to the selection set containing selected entity IDs
   */
  async getSelection(options: UvEdPromptSelectionOptions) {
    return await this._inputManager.getSelection(options)
  }

  /**
   * Prompts the user to specify a rectangular bounding box (two corners).
   *
   * @returns Promise that resolves to rectangular bounding box.
   */
  async getBox() {
    return await this._inputManager.getBox()
  }
}
