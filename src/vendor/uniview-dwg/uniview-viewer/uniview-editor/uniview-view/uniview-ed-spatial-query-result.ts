import { UvDbObjectId } from '@uniview/data-model'

/**
 * Item returned by spatial query
 */
export interface UvEdSpatialQueryResultItem {
  minX: number
  minY: number
  maxX: number
  maxY: number
  id: UvDbObjectId
}

export interface UvEdSpatialQueryResultItemEx
  extends UvEdSpatialQueryResultItem {
  children?: UvEdSpatialQueryResultItem[]
}
