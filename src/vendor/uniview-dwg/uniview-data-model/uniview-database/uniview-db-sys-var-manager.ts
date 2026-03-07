import { UvCmColor, UvCmColorMethod, UvCmEventManager } from '@uniview/common'
import { UvGePointLike } from '@uniview/geometry'
import { UvGiLineWeight } from '@uniview/graphics'

import type { UvDbDatabase } from './uniview-db-database'

/**
 * Supported AutoCAD system variable data type name.
 */
export type UvDbSysVarTypeName =
  | 'string'
  | 'color'
  | 'number'
  | 'boolean'
  | 'point'
  | 'unknown'

/**
 * Supported AutoCAD system variable data type name.
 */
export type UvDbSysVarType =
  | string
  | number
  | boolean
  | UvGePointLike
  | UvCmColor

/**
 * Definition for a system variable in our registry.
 */
export interface UvDbSysVarDescriptor {
  /** System variable name, e.g., "CLAYER" */
  name: string

  /** Expected variable type */
  type: UvDbSysVarTypeName

  /** The flag to indicate whether it is one database-resident variable. */
  isDbVar: boolean

  /** Optional description (documentation) */
  description?: string

  /** Optional default value */
  defaultValue?: UvDbSysVarType
}

/**
 * Event arguments for system variable related events.
 */
export interface UvDbSysVarEventArgs {
  /** The database that triggered the event */
  database: UvDbDatabase
  /** The system variable name */
  name: string
  /** The new value of system variable */
  newVal: UvDbSysVarType
  /** The old value of system variable */
  oldVal?: UvDbSysVarType
}

/**
 * Main manager responsible for:
 * - registry of known system variables
 * - caching values
 * - invoking backend getVar/setVar
 * - dispatching sysvar change events
 */
export class UvDbSysVarManager {
  private static _instance: UvDbSysVarManager | null = null

  /** Singleton accessor */
  public static instance(): UvDbSysVarManager {
    if (!this._instance) this._instance = new UvDbSysVarManager()
    return this._instance
  }

  /** Registered system variable metadata */
  private registry = new Map<string, UvDbSysVarDescriptor>()

  /** Cached current values for non-database-resident variables. */
  private cache = new Map<string, unknown>()

  /** System variable related events */
  public readonly events = {
    /**
     * Fired after a system variable is changed directly through the SETVAR command or
     * by entering the variable name at the command line.
     */
    sysVarChanged: new UvCmEventManager<UvDbSysVarEventArgs>()
  }

  private constructor() {
    this.registerVar({
      name: 'CECOLOR',
      type: 'color',
      isDbVar: true,
      defaultValue: new UvCmColor(UvCmColorMethod.ByLayer)
    })
    this.registerVar({
      name: 'CELTSCALE',
      type: 'number',
      isDbVar: true,
      defaultValue: -1
    })
    this.registerVar({
      name: 'CELWEIGHT',
      type: 'number',
      isDbVar: true,
      defaultValue: UvGiLineWeight.ByLayer
    })
    this.registerVar({
      name: 'CLAYER',
      type: 'string',
      isDbVar: true,
      defaultValue: '0'
    })
    this.registerVar({
      name: 'LWDISPLAY',
      type: 'boolean',
      isDbVar: true,
      defaultValue: false
    })
    this.registerVar({
      name: 'PICKBOX',
      type: 'number',
      isDbVar: false,
      defaultValue: 10
    })
    this.registerVar({
      /**
       * The flag whether the background color is white
       * - false: black
       * - true: white
       */
      name: 'WHITEBKCOLOR',
      type: 'boolean',
      isDbVar: false,
      defaultValue: false
    })
  }

  /**
   * Register one system variable metadata entry.
   */
  public registerVar(desc: UvDbSysVarDescriptor) {
    const name = this.normalizeName(desc.name)
    this.registry.set(name, {
      ...desc,
      name
    })
    if (!desc.isDbVar) {
      this.cache.set(name, desc.defaultValue)
    }
  }

  /**
   * Register many system variables.
   */
  public registerMany(vars: UvDbSysVarDescriptor[]) {
    vars.forEach(v => this.registerVar(v))
  }

  /**
   * Get system variable value.
   */
  public getVar(name: string, db: UvDbDatabase): UvDbSysVarType | undefined {
    name = this.normalizeName(name)
    const descriptor = this.getDescriptor(name)
    if (descriptor) {
      if (descriptor.isDbVar) {
        return db[name.toLowerCase() as keyof UvDbDatabase] as UvDbSysVarType
      } else if (this.cache.has(name)) {
        return this.cache.get(name) as UvDbSysVarType
      }
    }

    return undefined
  }

  /**
   * Set system variable value.
   */
  public setVar(name: string, value: UvDbSysVarType, db: UvDbDatabase) {
    name = this.normalizeName(name)
    const descriptor = this.getDescriptor(name)
    if (descriptor) {
      const oldVal = this.getVar(name, db)
      if (
        descriptor.type !== 'string' &&
        (typeof value === 'string' || value instanceof String)
      ) {
        if (descriptor.type === 'number') {
          const num = Number(value)
          if (Number.isNaN(num)) {
            throw new Error('Invalid number input!')
          }
          value = num
        } else if (descriptor.type === 'boolean') {
          value = this.parseBoolean(value as string)
        } else if (descriptor.type === 'color') {
          const tmp = UvCmColor.fromString(value as string)
          if (tmp == null) {
            throw new Error('Invalid color value!')
          }
          value = tmp
        }
      }
      if (descriptor.isDbVar) {
        ;(db as unknown as Record<string, unknown>)[name.toLowerCase()] = value
      } else {
        this.cache.set(name, value)
        if (this.hasValueChanged(oldVal, value)) {
          this.events.sysVarChanged.dispatch({
            database: db,
            name,
            newVal: value,
            oldVal
          })
        }
      }
    } else {
      throw new Error(`System variable ${name} not found!`)
    }
  }

  /**
   * Get system variable metadata descriptor (if registered).
   */
  public getDescriptor(name: string): UvDbSysVarDescriptor | undefined {
    return this.registry.get(this.normalizeName(name))
  }

  /**
   * Get all registered system variable descriptors.
   */
  public getAllDescriptors(): UvDbSysVarDescriptor[] {
    return [...this.registry.values()]
  }

  /**
   * Parse one string as one boolean value with case-insensitive by ignoring extra spaces
   * - "true" / "false"
   * - "t" / "f"
   * - "1" / "0"
   * - "yes" / "no"
   * - "y" / "n"
   * @param value - One string
   * @returns - The parsed boolean value
   */
  private parseBoolean(value: string | null | undefined) {
    if (value == null) return false

    const v = String(value).trim().toLowerCase()

    const trueValues = new Set(['true', 't', '1', 'yes', 'y'])
    const falseValues = new Set(['false', 'f', '0', 'no', 'n'])

    if (trueValues.has(v)) return true
    if (falseValues.has(v)) return false

    return false
  }

  /**
   * Check if sysvar value changed.
   */
  private hasValueChanged(
    oldValue: UvDbSysVarType | undefined,
    newValue: UvDbSysVarType | undefined
  ) {
    if (oldValue instanceof UvCmColor && newValue instanceof UvCmColor) {
      return !oldValue.equals(newValue)
    }

    return !Object.is(oldValue, newValue)
  }

  /**
   * Normalize system variable name for internal storage and lookup.
   */
  private normalizeName(name: string): string {
    return name.toLowerCase()
  }
}
