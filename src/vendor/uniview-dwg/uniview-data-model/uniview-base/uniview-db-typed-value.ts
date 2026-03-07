import { UvDbDxfCode } from './uniview-db-dxf-code'

/**
 * Represents a single typed value stored in an
 * {@link UvDbResultBuffer}.
 *
 * @typeParam T - The JavaScript type of the value.
 *
 * @remarks
 * This is the TypeScript equivalent of AutoCAD's TypedValue
 * structure. The {@link UvDbDxfCode} determines how the value
 * should be interpreted.
 */
export interface UvDbTypedValue<T = unknown> {
  /** DXF group code describing the value */
  code: UvDbDxfCode

  /** The actual stored value */
  value: T
}
