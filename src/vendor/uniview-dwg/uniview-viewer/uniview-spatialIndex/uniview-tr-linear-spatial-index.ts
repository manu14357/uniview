import { UvDbObjectId } from '@uniview/data-model'

import { UvEdSpatialQueryResultItem } from '../uniview-editor/uniview-view'
import { UvTrSpatialIndex, UvTrSpatialIndexBBox } from './uniview-tr-spatial-index'

/**
 * A simple spatial index implementation that performs linear scanning
 * over all stored bounding boxes.
 *
 * This index does not build any spatial acceleration structure. All
 * spatial queries are executed by iterating through the full item list
 * and testing bounding-box intersection one by one.
 *
 * Typical use cases:
 * - Small datasets where index construction overhead is unnecessary
 * - Highly dynamic data with frequent insert/remove operations
 * - Debugging or validation of spatial query correctness
 * - Fallback implementation when spatial indexing is not available
 *
 * Time complexity:
 * - Insert / Remove: O(1)
 * - Search / Collides: O(n)
 *
 * This implementation is memory-efficient and predictable, but does
 * not scale well for large numbers of items.
 */
export class UvTrLinearSpatialIndex implements UvTrSpatialIndex {
  /** Items indexed by object id */
  private items = new Map<UvDbObjectId, UvEdSpatialQueryResultItem>()

  insert(item: UvEdSpatialQueryResultItem): void {
    this.items.set(item.id, item)
  }

  load(items: readonly UvEdSpatialQueryResultItem[]): void {
    for (const item of items) {
      this.items.set(item.id, item)
    }
  }

  remove(item: UvEdSpatialQueryResultItem): void {
    this.items.delete(item.id)
  }

  removeById(id: UvDbObjectId): void {
    this.items.delete(id)
  }

  clear(): void {
    this.items.clear()
  }

  search(bbox: UvTrSpatialIndexBBox): UvEdSpatialQueryResultItem[] {
    const result: UvEdSpatialQueryResultItem[] = []

    for (const item of this.items.values()) {
      if (intersects(item, bbox)) {
        result.push(item)
      }
    }

    return result
  }

  collides(bbox: UvTrSpatialIndexBBox): boolean {
    for (const item of this.items.values()) {
      if (intersects(item, bbox)) {
        return true
      }
    }
    return false
  }

  all(): UvEdSpatialQueryResultItem[] {
    return Array.from(this.items.values())
  }
}

function intersects(a: UvTrSpatialIndexBBox, b: UvTrSpatialIndexBBox): boolean {
  return !(
    a.maxX < b.minX ||
    a.minX > b.maxX ||
    a.maxY < b.minY ||
    a.minY > b.maxY
  )
}
