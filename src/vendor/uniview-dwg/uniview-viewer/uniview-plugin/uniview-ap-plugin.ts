import { UvApContext } from '../uniview-app/uniview-ap-context'
import { UvEdCommandStack } from '../uniview-editor/uniview-command/uniview-ed-command-stack'

/**
 * Plugin interface that all plugins must implement.
 *
 * Plugins can extend the functionality of the CAD viewer by:
 * - Registering custom commands
 * - Accessing the application context (view, document)
 * - Performing initialization and cleanup
 *
 * @example
 * ```typescript
 * class MyPlugin implements UvApPlugin {
 *   name = 'MyPlugin'
 *   version = '1.0.0'
 *
 *   private registeredCommands: Array<{group: string, name: string}> = []
 *
 *   onLoad(context: UvApContext, commandManager: UvEdCommandStack): void {
 *     // Register custom commands
 *     commandManager.addCommand('USER', 'MYCMD', 'My Command', new MyCommand())
 *     this.registeredCommands.push({group: 'USER', name: 'MYCMD'})
 *   }
 *
 *   onUnload(context: UvApContext, commandManager: UvEdCommandStack): void {
 *     // Clean up registered commands
 *     for (const cmd of this.registeredCommands) {
 *       commandManager.removeCmd(cmd.group, cmd.name)
 *     }
 *     this.registeredCommands = []
 *   }
 * }
 * ```
 */
export interface UvApPlugin {
  /** Unique identifier for the plugin */
  name: string
  /** Version of the plugin */
  version?: string
  /** Optional description of the plugin */
  description?: string

  /**
   * Called when the plugin is loaded.
   *
   * This method is invoked when the plugin is registered with the plugin manager.
   * Use this method to:
   * - Register custom commands using the provided command manager
   * - Initialize plugin-specific resources
   * - Set up event listeners
   *
   * @param context - The current application context (view, document)
   * @param commandManager - The command manager for registering commands
   *
   * @example
   * ```typescript
   * onLoad(context: UvApContext, commandManager: UvEdCommandStack) {
   *   commandManager.addCommand('USER', 'MYCMD', 'My Command', new MyCommand());
   * }
   * ```
   */
  onLoad(
    context: UvApContext,
    commandManager: UvEdCommandStack
  ): void | Promise<void>

  /**
   * Called when the plugin is unloaded.
   *
   * This method is invoked when the plugin is removed from the plugin manager.
   * Use this method to:
   * - Clean up registered commands using commandManager.removeCmd()
   * - Release resources
   * - Remove event listeners
   *
   * @param context - The current application context (view, document)
   * @param commandManager - The command manager for unregistering commands
   *
   * @example
   * ```typescript
   * onUnload(context: UvApContext, commandManager: UvEdCommandStack) {
   *   commandManager.removeCmd('USER', 'MYCMD');
   * }
   * ```
   */
  onUnload(
    context: UvApContext,
    commandManager: UvEdCommandStack
  ): void | Promise<void>
}
