/**
 * Enumeration of object snap modes used in AutoCAD.
 *
 * Object snap modes define the types of geometric points that can be
 * snapped to when drawing or editing entities. These modes help ensure
 * precise positioning and alignment of objects.
 */
export enum UvDbOsnapMode {
  /**
   * End point - snaps to the endpoint of a line, arc, or other entity
   */
  EndPoint = 1,
  /**
   * Middle point - snaps to the midpoint of a line or arc
   */
  MidPoint = 2,
  /**
   * Center - snaps to the center point of a circle, arc, or ellipse
   */
  Center = 3,
  /**
   * Node - snaps to a point entity
   */
  Node = 4,
  /**
   * Quadrant - snaps to the quadrant points of a circle or ellipse
   * (0°, 90°, 180°, 270°)
   */
  Quadrant = 5,
  /**
   * Insertion - snaps to the insertion point of text, blocks, or other objects
   */
  Insertion = 7,
  /**
   * Perpendicular - snaps to a point perpendicular to a line or arc
   */
  Perpendicular = 8,
  /**
   * Tangent - snaps to a point tangent to a circle or arc
   */
  Tangent = 9,
  /**
   * Nearest - snaps to the nearest point on an entity
   */
  Nearest = 10,
  /**
   * Center of the object - snaps to the centroid or center of mass of an object
   */
  Centroid = 11
}

/**
 * Converts an array of {@link UvDbOsnapMode} values into a single integer bitmask.
 *
 * ⚠️ Important:
 * {@link UvDbOsnapMode} values are **ordinal identifiers**, not bit flags.
 * Each mode is mapped to a bit position using the rule:
 *
 * `bit = (mode - 1)`
 *
 * This allows multiple object snap modes to be stored efficiently
 * in a single integer using bitwise operations.
 *
 * @param modes - Array of object snap modes to enable
 * @returns Integer bitmask representing the enabled object snap modes
 *
 * @example
 * ```ts
 * const mask = acDbOsnapModesToMask([
 *   UvDbOsnapMode.EndPoint,
 *   UvDbOsnapMode.MidPoint,
 *   UvDbOsnapMode.Perpendicular
 * ])
 * // mask === 131
 * ```
 */
export function uvdbOsnapModesToMask(modes: UvDbOsnapMode[]): number {
  let mask = 0

  for (const mode of modes) {
    mask |= 1 << (mode - 1)
  }

  return mask
}

/**
 * Converts an integer bitmask into an array of {@link UvDbOsnapMode} values.
 *
 * The function iterates over all {@link UvDbOsnapMode} enum values and
 * checks whether the corresponding bit (computed as `1 << (mode - 1)`)
 * is set in the provided mask.
 *
 * @param mask - Integer bitmask containing object snap mode flags
 * @returns Array of enabled {@link UvDbOsnapMode} values
 *
 * @example
 * ```ts
 * const modes = acDbMaskToOsnapModes(131)
 * // [
 * //   UvDbOsnapMode.EndPoint,
 * //   UvDbOsnapMode.MidPoint,
 * //   UvDbOsnapMode.Perpendicular
 * // ]
 * ```
 */
export function uvdbMaskToOsnapModes(mask: number): UvDbOsnapMode[] {
  const modes: UvDbOsnapMode[] = []

  for (const value of Object.values(UvDbOsnapMode)) {
    if (typeof value !== 'number') continue

    const bit = 1 << (value - 1)
    if ((mask & bit) !== 0) {
      modes.push(value)
    }
  }

  return modes
}

/**
 * Toggles a specific {@link UvDbOsnapMode} in an object snap bitmask.
 *
 * If the mode is currently enabled, it will be disabled.
 * If the mode is disabled, it will be enabled.
 *
 * @param mask - Current object snap mode bitmask
 * @param mode - Object snap mode to toggle
 * @returns Updated bitmask with the specified mode toggled
 *
 * @example
 * ```ts
 * mask = uvdbToggleOsnapMode(mask, UvDbOsnapMode.MidPoint)
 * ```
 */
export function uvdbToggleOsnapMode(mask: number, mode: UvDbOsnapMode): number {
  return mask ^ (1 << (mode - 1))
}

/**
 * Checks whether a specific {@link UvDbOsnapMode} is enabled in the bitmask.
 *
 * @param mask - Object snap mode bitmask
 * @param mode - Object snap mode to test
 * @returns `true` if the mode is enabled; otherwise `false`
 *
 * @example
 * ```ts
 * if (uvdbHasOsnapMode(mask, UvDbOsnapMode.EndPoint)) {
 *   // EndPoint snapping is enabled
 * }
 * ```
 */
export function uvdbHasOsnapMode(mask: number, mode: UvDbOsnapMode): boolean {
  return (mask & (1 << (mode - 1))) !== 0
}

/**
 * Enables a specific {@link UvDbOsnapMode} in the object snap bitmask.
 *
 * @param mask - Current object snap mode bitmask
 * @param mode - Object snap mode to enable
 * @returns Updated bitmask with the mode enabled
 *
 * @example
 * ```ts
 * mask = uvdbEnableOsnapMode(mask, UvDbOsnapMode.Tangent)
 * ```
 */
export function uvdbEnableOsnapMode(mask: number, mode: UvDbOsnapMode): number {
  return mask | (1 << (mode - 1))
}

/**
 * Disables a specific {@link UvDbOsnapMode} in the object snap bitmask.
 *
 * @param mask - Current object snap mode bitmask
 * @param mode - Object snap mode to disable
 * @returns Updated bitmask with the mode disabled
 *
 * @example
 * ```ts
 * mask = uvdbDisableOsnapMode(mask, UvDbOsnapMode.Nearest)
 * ```
 */
export function uvdbDisableOsnapMode(
  mask: number,
  mode: UvDbOsnapMode
): number {
  return mask & ~(1 << (mode - 1))
}
