import type { SupportedFormat, UniViewPlugin, PluginOptions, PluginInstance } from './types';

/**
 * Plugin registry — decouples core from renderers.
 * Renderers register here; UniView resolves the right plugin at runtime.
 */
class PluginRegistry {
  private plugins: Map<string, UniViewPlugin> = new Map();
  private formatIndex: Map<SupportedFormat, string[]> = new Map();

  /** Register a renderer plugin */
  register(plugin: UniViewPlugin): void {
    if (this.plugins.has(plugin.name)) {
      throw new Error(`[PluginSystem] Plugin "${plugin.name}" is already registered.`);
    }

    this.plugins.set(plugin.name, plugin);

    // Index by supported formats for fast lookup
    for (const format of plugin.supportedFormats) {
      const existing = this.formatIndex.get(format) ?? [];
      existing.push(plugin.name);
      this.formatIndex.set(format, existing);
    }
  }

  /** Unregister a plugin by name */
  unregister(name: string): void {
    const plugin = this.plugins.get(name);
    if (!plugin) return;

    // Remove from format index
    for (const format of plugin.supportedFormats) {
      const names = this.formatIndex.get(format);
      if (names) {
        const filtered = names.filter((n) => n !== name);
        if (filtered.length > 0) {
          this.formatIndex.set(format, filtered);
        } else {
          this.formatIndex.delete(format);
        }
      }
    }

    this.plugins.delete(name);
  }

  /** Get the first registered plugin that supports a given format */
  getPluginForFormat(format: SupportedFormat): UniViewPlugin | null {
    const names = this.formatIndex.get(format);
    if (!names || names.length === 0) return null;
    return this.plugins.get(names[0]) ?? null;
  }

  /** Check if a format has a registered renderer */
  hasRendererFor(format: SupportedFormat): boolean {
    return this.formatIndex.has(format) && (this.formatIndex.get(format)?.length ?? 0) > 0;
  }

  /** Render a file using the registered plugin for its format */
  async render(
    format: SupportedFormat,
    container: HTMLElement,
    file: ArrayBuffer,
    options: PluginOptions,
  ): Promise<PluginInstance> {
    const plugin = this.getPluginForFormat(format);
    if (!plugin) {
      throw new Error(
        `[PluginSystem] No renderer registered for format "${format}". ` +
          `Available formats: ${[...this.formatIndex.keys()].join(', ')}`,
      );
    }
    return plugin.render(container, file, options);
  }

  /** Get all registered plugins */
  getAll(): UniViewPlugin[] {
    return [...this.plugins.values()];
  }

  /** Get all supported formats across all registered plugins */
  getSupportedFormats(): SupportedFormat[] {
    return [...this.formatIndex.keys()];
  }

  /** Clear all registered plugins */
  clear(): void {
    this.plugins.clear();
    this.formatIndex.clear();
  }
}

/** Singleton plugin system instance */
export const PluginSystem = new PluginRegistry();
