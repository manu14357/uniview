import { UvDbResultBuffer } from '../uniview-base/uniview-db-result-buffer'

import { UvDbObject } from '../uniview-base'

/**
 * Defines how duplicate records are handled when objects
 * are cloned into a destination database.
 *
 * @remarks
 * This enum mirrors AcDb::DuplicateRecordCloning in ObjectARX.
 */
export enum UvDbDuplicateRecordCloning {
  /** No special cloning behavior */
  NotApplicable = 0,

  /** Ignore the duplicate record */
  Ignore = 1,

  /** Replace the existing record */
  Replace = 2,

  /** Mangle the name when coming from an external reference */
  XrefMangleName = 3,

  /** Always mangle the name to avoid conflicts */
  MangleName = 4
}

/**
 * Represents an Xrecord object used to store arbitrary
 * application-defined data.
 *
 * @remarks
 * An Xrecord is typically stored in an extension dictionary
 * and contains an {@link UvDbResultBuffer}.
 */
export class UvDbXrecord extends UvDbObject {
  private _data: UvDbResultBuffer | null = null

  /**
   * Gets or sets the data stored in this Xrecord.
   *
   * @remarks
   * Equivalent to the Xrecord.Data property in AutoCAD .NET.
   */
  get data(): UvDbResultBuffer | null {
    return this._data
  }

  set data(value: UvDbResultBuffer | null) {
    this._data = value
  }

  /**
   * Removes all data from this Xrecord.
   */
  clear(): void {
    this._data?.clear()
  }

  /**
   * Creates a deep copy of this Xrecord.
   *
   * @remarks
   * The cloned Xrecord contains a cloned ResultBuffer.
   */
  clone(): UvDbXrecord {
    const xrec = new UvDbXrecord()
    xrec._data = this._data?.clone() ?? null
    return xrec
  }

  /**
   * Returns the duplicate record cloning behavior for this Xrecord.
   *
   * @remarks
   * This method exists for API parity with ObjectARX.
   */
  getDuplicateRecordCloning(): UvDbDuplicateRecordCloning {
    return UvDbDuplicateRecordCloning.NotApplicable
  }
}
