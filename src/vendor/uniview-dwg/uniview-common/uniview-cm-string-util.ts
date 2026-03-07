/**
 * @fileoverview String manipulation utilities for the AutoCAD Common library.
 *
 * This module provides utility functions for common string operations,
 * including formatting and conversion utilities.
 *
 * @module UvCmStringUtil
 * @version 1.0.0
 */

/**
 * Utility class providing static methods for string operations and formatting.
 *
 * Contains helper functions for data formatting, size conversions, and other
 * string manipulation tasks commonly needed in AutoCAD file processing.
 *
 * @class UvCmStringUtil
 * @version 1.0.0
 */
export class UvCmStringUtil {
  /**
   * Converts a byte count to a human-readable string using appropriate size units.
   *
   * Automatically selects the most appropriate unit (B, KB, MB, GB, TB) based on the size
   * and formats the result with the specified number of decimal places.
   *
   * @param {number} bytes - The number of bytes to format.
   * @param {number} [decimals=2] - Number of decimal places to include in the result.
   * @returns {string} A formatted string with the appropriate unit.
   *
   * @example
   * ```typescript
   * import { UvCmStringUtil } from './uniview-cm-string-util'
   *
   * // Format different byte sizes
   * UvCmStringUtil.formatBytes(0)          // "0 B"
   * UvCmStringUtil.formatBytes(1024)       // "1 KB"
   * UvCmStringUtil.formatBytes(1024 * 1024) // "1 MB"
   * UvCmStringUtil.formatBytes(1536, 1)    // "1.5 KB"
   * UvCmStringUtil.formatBytes(2048000, 0) // "2 MB"
   * ```
   */
  static formatBytes(bytes: number, decimals = 2): string {
    if (bytes === 0) return '0 B'

    const k = 1024
    const dm = Math.max(0, decimals)
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB']

    const i = Math.floor(Math.log(bytes) / Math.log(k))
    const value = bytes / Math.pow(k, i)

    return `${parseFloat(value.toFixed(dm))} ${sizes[i]}`
  }
}

/** @deprecated Use UvCmStringUtil instead. Will be removed in a future version. */
export const UvTrStringUtil = UvCmStringUtil
