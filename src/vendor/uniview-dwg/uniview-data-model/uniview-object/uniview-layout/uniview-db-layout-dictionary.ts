import { UvDbObjectId } from '../../uniview-base'
import { UvDbDictionary } from '../uniview-db-dictionary'
import { UvDbLayout } from './uniview-db-layout'

/**
 * Dictionary for storing and managing UvDbLayout objects.
 *
 * This class extends UvDbDictionary to provide specialized functionality
 * for managing layout objects, including searching by block table record ID
 * and tracking the maximum tab order.
 *
 * @example
 * ```typescript
 * const layoutDict = new UvDbLayoutDictionary(database);
 * const layout = layoutDict.getBtrIdAt('some-block-id');
 * const maxOrder = layoutDict.maxTabOrder;
 * ```
 */
export class UvDbLayoutDictionary extends UvDbDictionary<UvDbLayout> {
  /**
   * Searches the dictionary for a layout associated with the specified block table record ID.
   *
   * @param id - The block table record ID to search for
   * @returns The layout associated with the block table record ID, or undefined if not found
   *
   * @example
   * ```typescript
   * const layout = layoutDict.getBtrIdAt('some-block-id');
   * if (layout) {
   *   console.log('Found layout:', layout.layoutName);
   * }
   * ```
   */
  getBtrIdAt(id: UvDbObjectId) {
    for (const [_, layout] of this._recordsByName) {
      if (layout.blockTableRecordId == id) return layout
    }
    return undefined
  }

  /**
   * Gets the maximum tab order value of layouts in the layout dictionary.
   *
   * @returns The maximum tab order value, or -1 if no layouts exist
   *
   * @example
   * ```typescript
   * const maxOrder = layoutDict.maxTabOrder;
   * console.log('Maximum tab order:', maxOrder);
   * ```
   */
  get maxTabOrder() {
    let maxValue = -1
    this._recordsByName.forEach(layout => {
      if (layout.tabOrder > maxValue) {
        maxValue = layout.tabOrder
      }
    })
    return maxValue
  }
}
