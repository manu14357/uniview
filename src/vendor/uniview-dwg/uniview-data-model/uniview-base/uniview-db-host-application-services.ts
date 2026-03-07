import { UvDbDatabase } from '../uniview-database/uniview-db-database'
import { UvDbLayoutManager } from '../uniview-object/uniview-layout/uniview-db-layout-manager'

/**
 * Returns the singleton instance of the host application services.
 *
 * This function provides access to the global UvDbHostApplicationServices instance
 * that manages various services for host applications at runtime.
 *
 * @returns The singleton instance of UvDbHostApplicationServices
 * @example
 * ```typescript
 * const services = uvdbHostApplicationServices();
 * const database = services.workingDatabase;
 * ```
 */
export function uvdbHostApplicationServices() {
  return UvDbHostApplicationServices.instance
}

/**
 * The UvDbHostApplicationServices class provides various services to host applications at runtime.
 *
 * This class implements the singleton pattern and manages:
 * - Working database reference
 * - Layout manager instance
 * - Other application-wide services
 *
 * @example
 * ```typescript
 * const services = uvdbHostApplicationServices();
 * services.workingDatabase = new UvDbDatabase();
 * const layoutManager = services.layoutManager;
 * ```
 */
export class UvDbHostApplicationServices {
  /** The current working database instance */
  private _workingDatabase: UvDbDatabase | null = null

  /** The layout manager instance */
  private _layoutManager: UvDbLayoutManager

  /** The singleton instance of UvDbHostApplicationServices */
  public static instance: UvDbHostApplicationServices =
    new UvDbHostApplicationServices()

  /**
   * Private constructor to enforce singleton pattern.
   * Initializes the layout manager.
   */
  private constructor() {
    this._layoutManager = new UvDbLayoutManager()
  }

  /**
   * Gets the current working database.
   *
   * The working database is the primary database that the application
   * is currently operating on. This must be set before it can be accessed.
   *
   * @returns The current working database
   * @throws {Error} When the working database has not been set
   * @example
   * ```typescript
   * const services = uvdbHostApplicationServices();
   * try {
   *   const db = services.workingDatabase;
   *   // Use the database
   * } catch (error) {
   *   console.error('Working database not set');
   * }
   * ```
   */
  get workingDatabase(): UvDbDatabase {
    if (this._workingDatabase == null) {
      throw new Error(
        'The current working database must be set before using it!'
      )
    } else {
      return this._workingDatabase
    }
  }

  /**
   * Sets the working database.
   *
   * This method sets the database that will be used as the current working database
   * for the application. This database will be returned by the workingDatabase getter.
   *
   * @param database - The database to make the new working database
   * @example
   * ```typescript
   * const services = uvdbHostApplicationServices();
   * const db = new UvDbDatabase();
   * services.workingDatabase = db;
   * ```
   */
  set workingDatabase(database: UvDbDatabase) {
    this._workingDatabase = database
  }

  /**
   * Gets the layout manager instance.
   *
   * The layout manager is responsible for managing layout objects in the application.
   * This is a singleton instance that is created when the UvDbHostApplicationServices
   * is instantiated.
   *
   * @returns The layout manager instance
   * @example
   * ```typescript
   * const services = uvdbHostApplicationServices();
   * const layoutManager = services.layoutManager;
   * // Use the layout manager
   * ```
   */
  get layoutManager() {
    return this._layoutManager
  }
}
