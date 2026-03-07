import { UvDbObjectId } from '@uniview/data-model'
import { UvTrGroup } from '@uniview/three-renderer'

import {
  UvEdSpatialQueryResultItem,
  UvEdSpatialQueryResultItemEx
} from '../uniview-editor/uniview-view'
import { UvTrLinearSpatialIndex } from './uniview-tr-linear-spatial-index'
import { UvTrRBushSpatialIndex } from './uniview-tr-r-bush-spatial-index'
import { UvTrSpatialIndex, UvTrSpatialIndexBBox } from './uniview-tr-spatial-index'

/**
 * A two-level (hierarchical) spatial index designed for complex CAD
 * scene structures such as blocks, groups, layers, or nested entities.
 *
 * The index consists of:
 *
 * 1. A first-level spatial index that stores coarse bounding boxes
 *    (UvEdSpatialQueryResultItem) and maps each result to an `id`.
 *
 * 2. A second-level map from `id` to another spatial index, which
 *    contains more detailed spatial data for that specific entity,
 *    block, or group.
 *
 * Spatial queries are executed in two phases:
 * - First, the query is performed against the root spatial index to
 *   find candidate items.
 * - Then, for each candidate, the corresponding second-level spatial
 *   index (if present) is queried for more precise results.
 * - Results from both levels are merged into a single query result.
 *
 * This design allows:
 * - Mixing different spatial index implementations (e.g. R-tree and
 *   linear scan) at different hierarchy levels
 * - Efficient querying of large, nested CAD datasets
 * - Lazy or selective construction of fine-grained spatial indexes
 *
 * This class is particularly suitable for CAD viewers and editors
 * where entities are grouped hierarchically but still require fast
 * spatial queries such as selection, picking, and hit-testing.
 */
export class UvTrHierarchicalSpatialIndex implements UvTrSpatialIndex {
  static THRESHOLD = 100
  private readonly rootIndex: UvTrSpatialIndex<UvEdSpatialQueryResultItem>
  private readonly childIndexes = new Map<string, UvTrSpatialIndex>()

  constructor(rootIndex?: UvTrSpatialIndex<UvEdSpatialQueryResultItem>) {
    this.rootIndex = rootIndex ?? new UvTrRBushSpatialIndex()
  }

  /** Register second-level index for an id */
  setChildIndex(id: string, index: UvTrSpatialIndex): void {
    this.childIndexes.set(id, index)
  }

  /** Remove second-level index */
  removeChildIndex(id: string): void {
    this.childIndexes.delete(id)
  }

  insert(item: UvEdSpatialQueryResultItem): void {
    this.rootIndex.insert(item)
    this.childIndexes.get(item.id)?.insert(item)
  }

  load(items: readonly UvEdSpatialQueryResultItem[]): void {
    this.rootIndex.load(items)
  }

  remove(
    item: UvEdSpatialQueryResultItem,
    equals?: (
      a: UvEdSpatialQueryResultItem,
      b: UvEdSpatialQueryResultItem
    ) => boolean
  ): void {
    this.rootIndex.remove(item, equals)
    this.childIndexes.delete(item.id)
  }

  removeById(id: UvDbObjectId): void {
    this.rootIndex.removeById(id)
    this.childIndexes.delete(id)
  }

  clear(): void {
    this.rootIndex.clear()
    this.childIndexes.forEach(i => i.clear())
    this.childIndexes.clear()
  }

  search(bbox: UvTrSpatialIndexBBox): UvEdSpatialQueryResultItemEx[] {
    const level1 = this.rootIndex.search(bbox)
    const result: UvEdSpatialQueryResultItemEx[] = []

    for (const hit of level1) {
      const child = this.childIndexes.get(hit.id)
      if (!child) {
        result.push(hit as UvEdSpatialQueryResultItem)
        continue
      }

      const level2 = child.search(bbox)
      result.push({
        ...hit,
        children: level2
      })
    }

    return result
  }

  collides(bbox: UvTrSpatialIndexBBox): boolean {
    if (!this.rootIndex.collides(bbox)) return false

    const level1 = this.rootIndex.search(bbox)
    return level1.some(hit => {
      const child = this.childIndexes.get(hit.id)
      return child ? child.collides(bbox) : true
    })
  }

  all(): UvEdSpatialQueryResultItem[] {
    const result: UvEdSpatialQueryResultItem[] = []

    for (const hit of this.rootIndex.all()) {
      const child = this.childIndexes.get(hit.id)
      if (child) result.push(...child.all())
      else result.push(hit as UvEdSpatialQueryResultItem)
    }

    return result
  }

  createChildIndex(group: UvTrGroup) {
    const size = group.boxes.length
    let spatialIndex: UvTrSpatialIndex | undefined = undefined
    if (size > UvTrHierarchicalSpatialIndex.THRESHOLD) {
      spatialIndex = new UvTrRBushSpatialIndex()
    } else if (size > 0) {
      spatialIndex = new UvTrLinearSpatialIndex()
    }

    if (spatialIndex) {
      group.boxes.forEach(box => {
        spatialIndex.insert(box)
      })
      this.setChildIndex(group.objectId, spatialIndex)
    }
    return spatialIndex
  }
}
