import { UvDbLayout, UvDbSysVarManager } from '@uniview/data-model'

import { UvEdBaseView } from '../uniview-editor/uniview-view/uniview-ed-base-view'
import { UvTrView2d } from '../uniview-view'
import { UvApDocument } from './uniview-ap-document'

/**
 * Application context that binds a CAD document with its associated view.
 *
 * This class establishes the connection between a CAD document (containing the drawing database)
 * and its visual representation (the view). It handles event forwarding between the document
 * and view to keep them synchronized.
 *
 * The context manages:
 * - Entity lifecycle events (add, modify, remove)
 * - Layer visibility changes
 * - System variable changes (like point display mode)
 * - Entity selection and highlighting
 *
 * @example
 * ```typescript
 * const document = new UvApDocument();
 * const view = new UvTrView2d();
 * const context = new UvApContext(view, document);
 *
 * // The context will automatically sync changes between document and view
 * // For example, when entities are added to the document, they appear in the view
 * ```
 */
export class UvApContext {
  /** The view component that renders the CAD drawing */
  private _view: UvEdBaseView
  /** The document containing the CAD database */
  private _doc: UvApDocument

  /**
   * Creates a new application context that binds a document with its view.
   *
   * The constructor sets up event listeners to synchronize the document and view:
   * - Entity additions/modifications are reflected in the view
   * - Layer visibility changes update the view
   * - System variable changes (like point display mode) update rendering
   * - Entity selections show/hide grip points
   *
   * @param view - The view used to display the drawing
   * @param doc - The document containing the drawing database
   */
  constructor(view: UvEdBaseView, doc: UvApDocument) {
    this._view = view
    this._doc = doc

    // Add entity to scene
    doc.database.events.entityAppended.addEventListener(args => {
      this.view.addEntity(args.entity)
    })

    // Update entity
    doc.database.events.entityModified.addEventListener(args => {
      this.view.updateEntity(args.entity)
    })

    // Erase entity
    doc.database.events.entityErased.addEventListener(args => {
      this.view.removeEntity(args.entity)
    })

    // Set layer visibility
    doc.database.events.layerAppended.addEventListener(args => {
      this._view.addLayer(args.layer)
    })

    // Update layer information such as visibility
    doc.database.events.layerModified.addEventListener(args => {
      this._view.updateLayer(args.layer, args.changes)
    })

    // Set point display mode
    UvDbSysVarManager.instance().events.sysVarChanged.addEventListener(args => {
      if (args.name == 'pdmode') {
        ;(this._view as UvTrView2d).rerenderPoints(args.database.pdmode)
      } else if (args.name == 'lwdisplay') {
        const view = this._view as UvTrView2d
        const showLineWeight = !!args.database.lwdisplay
        if (view.renderer.showLineWeight !== showLineWeight) {
          view.renderer.showLineWeight = showLineWeight
          // Existing line objects may need different geometry/material classes.
          // Regenerate to rebuild scene content using the new display mode.
          view.clear()
          args.database.regen()
        }
      }
    })

    doc.database.events.dictObjectSet.addEventListener(args => {
      if (args.object instanceof UvDbLayout) {
        this._view.addLayout(args.object as UvDbLayout)
      }
    })

    // Show their grip points when entities are selected
    view.selectionSet.events.selectionAdded.addEventListener(args => {
      view.highlight(args.ids)
    })

    // Hide their grip points when entities are deselected
    view.selectionSet.events.selectionRemoved.addEventListener(args => {
      view.unhighlight(args.ids)
    })
  }

  /**
   * Gets the view component that renders the CAD drawing.
   *
   * @returns The associated view instance
   */
  get view() {
    return this._view
  }

  /**
   * Gets the document containing the CAD database.
   *
   * @returns The associated document instance
   */
  get doc(): UvApDocument {
    return this._doc
  }
}
