/**
 * @fileoverview Performance monitoring and collection system for the AutoCAD Common library.
 *
 * This module provides a singleton-based performance collector that can store,
 * retrieve, and format performance metrics for debugging and optimization purposes.
 *
 * @module UvCmPerformanceCollector
 * @version 1.0.0
 */

/**
 * A performance entry containing a unique name, associated data,
 * and a method to format the data into a human-readable string.
 *
 * @template T - The type of the performance data.
 *
 * @example
 * ```typescript
 * // Create a custom performance entry
 * const loadTimeEntry: UvCmPerformanceEntry<number> = {
 *   name: 'file-load-time',
 *   data: 1250, // milliseconds
 *   format() {
 *     return `File loaded in ${this.data}ms`
 *   }
 * }
 * ```
 */
export interface UvCmPerformanceEntry<T> {
  /** Unique name of this performance entry. */
  readonly name: string

  /** Performance data to be recorded. */
  data: T

  /**
   * Converts the performance data into a formatted string.
   * @returns A string representing the performance data.
   */
  format(): string
}

/**
 * Interface for collecting and managing performance data.
 *
 * Consumers should depend on this interface rather than the concrete
 * UvCmPerformanceCollector class (Dependency Inversion Principle).
 */
export interface IUvCmPerformanceCollector {
  collect<T>(entry: UvCmPerformanceEntry<T>): void
  printAll(): void
  clear(): void
  getAll(): UvCmPerformanceEntry<unknown>[]
  getEntry(name: string): UvCmPerformanceEntry<unknown> | undefined
  remove(name: string): boolean
}

/**
 * A singleton class for collecting and managing performance data.
 * All entries must have a unique name. Entries are stored in a Map.
 */
export class UvCmPerformanceCollector implements IUvCmPerformanceCollector {
  /** The singleton instance. */
  private static instance: UvCmPerformanceCollector

  /** Map of performance entries keyed by their unique name. */
  private readonly entries: Map<string, UvCmPerformanceEntry<unknown>> = new Map()

  /**
   * Private constructor to enforce singleton pattern.
   */
  private constructor() {}

  /**
   * Retrieves the singleton instance of the UvCmPerformanceCollector.
   * @returns The shared UvCmPerformanceCollector instance.
   */
  public static getInstance(): UvCmPerformanceCollector {
    if (!UvCmPerformanceCollector.instance) {
      UvCmPerformanceCollector.instance = new UvCmPerformanceCollector()
    }
    return UvCmPerformanceCollector.instance
  }

  /**
   * Adds or replaces a performance entry by name.
   * @template T The type of the performance data.
   * @param entry A performance entry object with name, data, and format method.
   */
  public collect<T>(entry: UvCmPerformanceEntry<T>): void {
    this.entries.set(entry.name, entry)
  }

  /**
   * Logs all performance entries to the console using their format method.
   */
  public printAll(): void {
    for (const [name, entry] of this.entries) {
      console.log(`${name}:`)
      console.log(entry.format())
    }
  }

  /**
   * Clears all collected performance entries.
   */
  public clear(): void {
    this.entries.clear()
  }

  /**
   * Retrieves all entries as an array.
   * @returns A copy of all performance entries.
   */
  public getAll(): UvCmPerformanceEntry<unknown>[] {
    return Array.from(this.entries.values())
  }

  /**
   * Gets a single entry by name.
   * @param name The unique name of the entry.
   * @returns The matching entry or undefined.
   */
  public getEntry(name: string): UvCmPerformanceEntry<unknown> | undefined {
    return this.entries.get(name)
  }

  /**
   * Removes an entry by name.
   * @param name The name of the entry to remove.
   * @returns True if the entry was removed; false if not found.
   */
  public remove(name: string): boolean {
    return this.entries.delete(name)
  }
}
