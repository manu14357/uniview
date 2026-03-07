import { UvCmEventManager } from '@uniview/common'

import { UvDbDxfConverter } from '../uniview-converter'
import { UvDbDatabaseConverter } from './uniview-db-database-converter'

/**
 * Represents the supported drawing file types.
 */
export enum UvDbFileType {
  /**
   * DXF (Drawing Exchange Format) file
   */
  DXF = 'dxf',
  /**
   * DWG (Drawing) file
   */
  DWG = 'dwg'
}

/**
 * Type representing either a known file type or a custom string identifier.
 */
export type UvDbConverterType = UvDbFileType | string

/**
 * Event arguments for database converter manager events.
 */
export interface UvDbDatabaseConverterManagerEventArgs {
  /** The file type associated with the event */
  fileType: UvDbConverterType
  /** The converter associated with the event */
  converter: UvDbDatabaseConverter
}

/**
 * Manager for registering and managing database converters by file type.
 *
 * This class provides a centralized way to register database converters for
 * different file types (DXF, DWG, etc.) and retrieve the appropriate converter
 * for a given file type. It implements the singleton pattern and provides
 * event notifications when converters are registered or unregistered.
 *
 * @example
 * ```typescript
 * const manager = UvDbDatabaseConverterManager.instance;
 * const converter = manager.get(UvDbFileType.DXF);
 * if (converter) {
 *   await converter.read(dxfData, database, 100);
 * }
 * ```
 */
export class UvDbDatabaseConverterManager {
  /** Singleton instance of the manager */
  private static _instance?: UvDbDatabaseConverterManager
  /** Map of file types to their associated converters */
  private _converters: Map<UvDbConverterType, UvDbDatabaseConverter>

  /**
   * Events that can be triggered by the converter manager.
   *
   * These events allow applications to respond to converter registration
   * and unregistration.
   */
  public readonly events = {
    /** Fired when a converter is registered */
    registered: new UvCmEventManager<UvDbDatabaseConverterManagerEventArgs>(),
    /** Fired when a converter is unregistered */
    unregistered: new UvCmEventManager<UvDbDatabaseConverterManagerEventArgs>()
  }

  /**
   * Creates a new instance of UvDbDatabaseConverterManager.
   *
   * @returns The singleton instance of UvDbDatabaseConverterManager
   *
   * @example
   * ```typescript
   * const manager = UvDbDatabaseConverterManager.createInstance();
   * ```
   */
  static createInstance() {
    if (UvDbDatabaseConverterManager._instance == null) {
      UvDbDatabaseConverterManager._instance =
        new UvDbDatabaseConverterManager()
    }
    return this._instance
  }

  /**
   * Gets the singleton instance of this class.
   *
   * @returns The singleton instance of UvDbDatabaseConverterManager
   *
   * @example
   * ```typescript
   * const manager = UvDbDatabaseConverterManager.instance;
   * ```
   */
  static get instance() {
    if (!UvDbDatabaseConverterManager._instance) {
      UvDbDatabaseConverterManager._instance =
        new UvDbDatabaseConverterManager()
    }
    return UvDbDatabaseConverterManager._instance
  }

  /**
   * Private constructor to enforce singleton pattern.
   *
   * Initializes the manager with a default DXF converter.
   */
  private constructor() {
    this._converters = new Map()
    this.register(UvDbFileType.DXF, new UvDbDxfConverter())
  }

  /**
   * Gets all registered file types.
   *
   * @returns An iterator of all registered file types
   *
   * @example
   * ```typescript
   * const fileTypes = manager.fileTypes;
   * for (const fileType of fileTypes) {
   *   console.log('Supported file type:', fileType);
   * }
   * ```
   */
  get fileTypes() {
    return this._converters.keys()
  }

  /**
   * Registers a database converter for the specified file type.
   *
   * @param fileType - The file type to register the converter for
   * @param converter - The database converter to register
   *
   * @example
   * ```typescript
   * const converter = new MyCustomConverter();
   * manager.register(UvDbFileType.DWG, converter);
   * ```
   */
  public register(
    fileType: UvDbConverterType,
    converter: UvDbDatabaseConverter
  ) {
    this._converters.set(fileType, converter)
    this.events.registered.dispatch({
      fileType,
      converter
    })
  }

  /**
   * Gets the database converter associated with the specified file type.
   *
   * @param fileType - The file type to get the converter for
   * @returns The database converter associated with the specified file type, or undefined if not found
   *
   * @example
   * ```typescript
   * const converter = manager.get(UvDbFileType.DXF);
   * if (converter) {
   *   await converter.read(dxfData, database, 100);
   * }
   * ```
   */
  public get(fileType: UvDbConverterType) {
    return this._converters.get(fileType)
  }

  /**
   * Unregisters the database converter for the specified file type.
   *
   * @param fileType - The file type to unregister the converter for
   *
   * @example
   * ```typescript
   * manager.unregister(UvDbFileType.DWG);
   * ```
   */
  public unregister(fileType: UvDbConverterType) {
    const converter = this._converters.get(fileType)
    if (converter) {
      this._converters.delete(fileType)
      this.events.unregistered.dispatch({
        fileType,
        converter
      })
    }
  }
}
