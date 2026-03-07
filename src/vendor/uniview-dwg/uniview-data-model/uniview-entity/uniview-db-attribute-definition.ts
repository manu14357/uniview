import { UvGiRenderer } from '@uniview/graphics'

import { UvDbMText } from './uniview-db-m-text'
import { UvDbText } from './uniview-db-text'

/**
 * Attribute definition flags.
 *
 * These flags control visibility, editability, prompting behavior,
 * and verification requirements of an attribute.
 */
export enum UvDbAttributeFlags {
  /** Attribute is invisible (not displayed). */
  Invisible = 0x1,

  /** Attribute is constant and cannot be modified per block reference. */
  Const = 0x2,

  /** Attribute requires verification on user input. */
  Verifiable = 0x4,

  /** Attribute has a preset value and does not prompt during insertion. */
  Preset = 0x8
}

/**
 * Flags related to multi-line (MText-based) attributes.
 */
export enum UvDbAttributeMTextFlag {
  /** Attribute is represented as multi-line text (MText). */
  MultiLine = 0x2,

  /** Multi-line attribute is constant. */
  ConstMultiLine = 0x4
}

/**
 * Represents an attribute definition attached to a block definition.
 *
 * This class closely follows the behavior and semantics of
 * `UvDbAttributeDefinition` in AutoCAD ObjectARX.
 */
export class UvDbAttributeDefinition extends UvDbText {
  /** The DXF entity type name. */
  static override typeName: string = 'AttDef'

  /**
   * Attribute behavior flags.
   * @see UvDbAttributeFlags
   */
  private _flags: number

  /**
   * Multi-line attribute flags.
   * @see UvDbAttributeMTextFlag
   */
  private _mtextFlag: number

  /** Attribute tag string (identifier). */
  private _tag: string

  /**
   * Prompt string displayed during block insertion.
   *
   * This value is inherited from the corresponding
   * `UvDbAttributeDefinition` and is used to prompt the user
   * for input when the block is inserted.
   */
  private _prompt: string

  /**
   * Field length value.
   *
   * This value is preserved for compatibility but is not actively
   * used by AutoCAD.
   */
  private _fieldLength: number

  /**
   * Indicates whether the attribute position is locked relative
   * to the block geometry.
   */
  private _lockPositionInBlock: boolean

  /**
   * Indicates whether the attribute is currently locked.
   */
  private _isReallyLocked: boolean

  /**
   * Internal MText representation for multi-line attributes.
   * Undefined for single-line attributes.
   */
  private _mtext?: UvDbMText

  constructor() {
    super()
    this._flags = 0
    this._prompt = ''
    this._mtextFlag = 0
    this._tag = ''
    this._fieldLength = 0
    this._lockPositionInBlock = false
    this._isReallyLocked = false
  }

  /**
   * Gets whether the attribute is invisible.
   */
  get isInvisible(): boolean {
    return (this._flags & UvDbAttributeFlags.Invisible) !== 0
  }

  /**
   * Sets whether the attribute is invisible.
   */
  set isInvisible(value: boolean) {
    if (value) {
      this._flags |= UvDbAttributeFlags.Invisible
    } else {
      this._flags &= ~UvDbAttributeFlags.Invisible
    }
  }

  /**
   * Gets the prompt string displayed during block insertion.
   *
   * This prompt is shown to the user when the attribute is created
   * from an attribute definition, unless the attribute is preset.
   */
  get prompt(): string {
    return this._prompt
  }

  /**
   * Sets the prompt string displayed during block insertion.
   *
   * DXF group code: 3
   */
  set prompt(value: string) {
    this._prompt = value
  }

  /**
   * Gets whether the attribute is constant.
   */
  get isConst(): boolean {
    return (this._flags & UvDbAttributeFlags.Const) !== 0
  }

  /**
   * Sets whether the attribute is constant.
   */
  set isConst(value: boolean) {
    if (value) {
      this._flags |= UvDbAttributeFlags.Const
    } else {
      this._flags &= ~UvDbAttributeFlags.Const
    }
  }

  /**
   * Gets whether the attribute requires verification on input.
   */
  get isVerifiable(): boolean {
    return (this._flags & UvDbAttributeFlags.Verifiable) !== 0
  }

  /**
   * Sets whether the attribute requires verification on input.
   */
  set isVerifiable(value: boolean) {
    if (value) {
      this._flags |= UvDbAttributeFlags.Verifiable
    } else {
      this._flags &= ~UvDbAttributeFlags.Verifiable
    }
  }

  /**
   * Gets whether the attribute has a preset value and does not prompt
   * the user during block insertion.
   */
  get isPreset(): boolean {
    return (this._flags & UvDbAttributeFlags.Preset) !== 0
  }

  /**
   * Sets whether the attribute has a preset value.
   */
  set isPreset(value: boolean) {
    if (value) {
      this._flags |= UvDbAttributeFlags.Preset
    } else {
      this._flags &= ~UvDbAttributeFlags.Preset
    }
  }

  /**
   * Gets whether this attribute is a multi-line (MText-based) attribute.
   */
  get isMTextAttribute(): boolean {
    return (this._mtextFlag & UvDbAttributeMTextFlag.MultiLine) !== 0
  }

  /**
   * Sets whether this attribute is a multi-line (MText-based) attribute.
   */
  set isMTextAttribute(value: boolean) {
    if (value) {
      this._mtextFlag |= UvDbAttributeMTextFlag.MultiLine
    } else {
      this._mtextFlag &= ~UvDbAttributeMTextFlag.MultiLine
    }
  }

  /**
   * Gets whether this attribute is a constant multi-line attribute.
   */
  get isConstMTextAttribute(): boolean {
    return (this._mtextFlag & UvDbAttributeMTextFlag.ConstMultiLine) !== 0
  }

  /**
   * Sets whether this attribute is a constant multi-line attribute.
   */
  set isConstMTextAttribute(value: boolean) {
    if (value) {
      this._mtextFlag |= UvDbAttributeMTextFlag.ConstMultiLine
    } else {
      this._mtextFlag &= ~UvDbAttributeMTextFlag.ConstMultiLine
    }
  }

  /**
   * Gets the attribute tag.
   *
   * The tag uniquely identifies the attribute within a block.
   */
  get tag(): string {
    return this._tag
  }

  /**
   * Sets the attribute tag.
   */
  set tag(value: string) {
    this._tag = value
  }

  /**
   * Gets the attribute field length.
   *
   * This value is not currently used by AutoCAD.
   */
  get fieldLength(): number {
    return this._fieldLength
  }

  /**
   * Sets the attribute field length.
   */
  set fieldLength(value: number) {
    this._fieldLength = value
  }

  /**
   * Gets whether the attribute position is locked relative to
   * the block geometry.
   */
  get lockPositionInBlock(): boolean {
    return this._lockPositionInBlock
  }

  /**
   * Sets whether the attribute position is locked relative to
   * the block geometry.
   */
  set lockPositionInBlock(value: boolean) {
    this._lockPositionInBlock = value
  }

  /**
   * Gets whether the attribute is currently locked.
   */
  get isReallyLocked(): boolean {
    return this._isReallyLocked
  }

  /**
   * Sets whether the attribute is currently locked.
   */
  set isReallyLocked(value: boolean) {
    this._isReallyLocked = value
  }

  /**
   * Gets the internal `UvDbMText` used to represent this attribute
   * when it is a multi-line attribute.
   *
   * Returns `undefined` for single-line attributes.
   */
  get mtext(): UvDbMText | undefined {
    return this._mtext
  }

  /**
   * Sets the internal `UvDbMText` used to represent this attribute
   * as a multi-line attribute.
   *
   * Setting this value automatically marks the attribute as
   * a multi-line attribute.
   */
  set mtext(value: UvDbMText | undefined) {
    this._mtext = value
    this.isMTextAttribute = value != null
  }

  /**
   * Draws nothing for attribute definition.
   *
   * @param renderer - The renderer to use for drawing
   * @returns Always return undefined because of drawing nothing for attribute definition.
   */
  subWorldDraw(_renderer: UvGiRenderer): undefined {
    return undefined
  }
}
