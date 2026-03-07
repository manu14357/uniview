import { UvDbOpenDatabaseOptions } from '@uniview/data-model'

import { UvEdOpenMode } from '../uniview-editor/uniview-view'

/**
 * Options for opening a CAD database.
 *
 * This interface extends the base options from the data model but replaces
 * the `readOnly` property with a `mode` property that provides more granular
 * access control.
 *
 * @example
 * ```typescript
 * const options: UvApOpenDatabaseOptions = {
 *   mode: UvEdOpenMode.Write,
 *   fontLoader: myFontLoader
 * };
 * ```
 */
export interface UvApOpenDatabaseOptions
  extends Omit<UvDbOpenDatabaseOptions, 'readOnly'> {
  /**
   * The access mode for opening the database.
   * Higher value modes are compatible with lower value modes.
   * - Read (0): Read-only access
   * - Review (4): Review access, compatible with Read
   * - Write (8): Full read/write access, compatible with Review and Read
   */
  mode?: UvEdOpenMode
}
