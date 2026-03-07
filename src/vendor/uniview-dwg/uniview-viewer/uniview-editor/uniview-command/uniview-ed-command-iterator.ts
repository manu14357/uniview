import { UvEdCommand } from './uniview-ed-command'
import { UvEdCommandGroup } from './uniview-ed-command-stack'

/**
 * Represents the type of item returned by command iterator.
 */
export interface UvEdCommandIteratorItem {
  commandGroup: string
  command: UvEdCommand
}
/**
 * This class allows you to traverse the chain of command groups that are registered with AutoCAD and
 * obtain information about the groups and the UvEdCommand objects within them.
 */
export class UvEdCommandIterator
  implements IterableIterator<UvEdCommandIteratorItem>
{
  private _index: number
  private _commands: UvEdCommandIteratorItem[]

  constructor(commandGroups: UvEdCommandGroup[]) {
    this._index = 0
    this._commands = []
    commandGroups.forEach(group => {
      const commandGroup = group.groupName
      group.commandsByGlobalName.forEach(command => {
        this._commands.push({
          command,
          commandGroup
        })
      })
    })
  }

  [Symbol.iterator](): IterableIterator<UvEdCommandIteratorItem> {
    return this
  }

  /**
   * Return command object the iterator currently points to. If the iterator is at the beginning, then the
   * first object is returned. If the iterator has already gone past the last entry, then null is returned.
   */
  get command() {
    return this._index < this._commands.length
      ? this._commands[this._index].command
      : null
  }

  /**
   * Return the name of the command object the iterator currently points to. If the iterator is at the
   * beginning, then the first object is returned. If the iterator has already gone past the last entry,
   * then null is returned.
   */
  get commandGroup() {
    return this._index < this._commands.length
      ? this._commands[this._index].commandGroup
      : null
  }

  /**
   * Increment the iterator to the next entry.
   * @returns Return the next entry
   */
  next(): IteratorResult<UvEdCommandIteratorItem, null> {
    while (this._index < this._commands.length) {
      const value = this._commands[this._index]
      this._index += 1
      return { value: value, done: false }
    }
    return { value: null, done: true }
  }
}
