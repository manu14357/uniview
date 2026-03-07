import { UvDbObjectId } from '@uniview/data-model'
import RBush from 'rbush'

import { UvEdSpatialQueryResultItem } from '../uniview-editor/uniview-view'
import { UvTrSpatialIndex, UvTrSpatialIndexBBox } from './uniview-tr-spatial-index'

export class UvTrRBushSpatialIndex implements UvTrSpatialIndex {
  private readonly tree: RBush<UvEdSpatialQueryResultItem>
  private readonly idMap: Map<UvDbObjectId, UvEdSpatialQueryResultItem>

  constructor(maxEntries?: number) {
    this.tree = new RBush<UvEdSpatialQueryResultItem>(maxEntries)
    this.idMap = new Map<UvDbObjectId, UvEdSpatialQueryResultItem>()
  }

  insert(item: UvEdSpatialQueryResultItem) {
    if (!this.idMap.has(item.id)) {
      this.tree.insert(item)
      this.idMap.set(item.id, item)
    }
  }

  load(items: readonly UvEdSpatialQueryResultItem[]) {
    this.tree.load([...items])
  }

  remove(
    item: UvEdSpatialQueryResultItem,
    equals?: (
      a: UvEdSpatialQueryResultItem,
      b: UvEdSpatialQueryResultItem
    ) => boolean
  ): void {
    this.tree.remove(item, equals)
    this.idMap.delete(item.id)
  }

  removeById(id: UvDbObjectId): void {
    // Set minX, minY, maxX, and maxY to 0 in order to pass build
    this.tree.remove(
      {
        minX: 0,
        minY: 0,
        maxX: 0,
        maxY: 0,
        id: id
      },
      (a: UvEdSpatialQueryResultItem, b: UvEdSpatialQueryResultItem) => a.id === b.id
    )
    this.idMap.delete(id)
  }

  clear() {
    this.tree.clear()
    this.idMap.clear()
  }

  search(bbox: UvTrSpatialIndexBBox): UvEdSpatialQueryResultItem[] {
    return this.tree.search(bbox)
  }

  collides(bbox: UvTrSpatialIndexBBox): boolean {
    return this.tree.collides(bbox)
  }

  all(): UvEdSpatialQueryResultItem[] {
    return this.tree.all()
  }
}
