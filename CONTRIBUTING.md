# Contributing to UniView

Thank you for your interest in contributing to UniView! This guide will help you get started.

## Getting Started

1. **Fork** the repository on GitHub
2. **Clone** your fork locally:
   ```bash
   git clone https://github.com/<your-username>/uniview.git
   cd uniview
   ```
3. **Install** dependencies:
   ```bash
   npm install
   ```
4. **Create a branch** for your work:
   ```bash
   git checkout -b feat/your-feature-name
   ```

## Development

Start the demo dev server:

```bash
npm run dev
```

This runs the demo app at `http://localhost:3000` with hot reload.

### Project Structure

- `src/core/` — Main component, plugin system, types, event bus
- `src/renderers/` — Format-specific renderers (PDF, DOCX, DXF, DWG, XLSX, Image)
- `src/hooks/` — React hooks (useViewer, useZoom, usePan, useFileLoader, useAnnotations)
- `src/store/` — Zustand state stores
- `src/ui/` — Toolbar, sidebar, annotations, common UI components
- `src/utils/` — Utilities (file detection, export, colors, units)
- `src/workers/` — Web Worker files for off-thread parsing
- `src/vendor/` — Vendored DWG/DXF engine
- `demo/` — Demo application
- `tests/` — Unit and e2e tests

## Code Style

- **TypeScript strict mode** — no `any` types, all values fully typed
- **Prettier** for formatting — run `npm run format`
- **ESLint** for linting — run `npm run lint`
- Renderers are lazy-loaded via `React.lazy()` + `Suspense`
- File parsing runs in Web Workers, never on the main thread
- Each renderer registers as a plugin through `PluginSystem`

## Branch Naming

| Prefix | Use Case |
|--------|----------|
| `feat/` | New feature |
| `fix/` | Bug fix |
| `docs/` | Documentation only |
| `refactor/` | Code refactoring |
| `test/` | Adding or updating tests |

## Commit Messages

Use clear, descriptive commit messages:

```
feat: add STEP file renderer plugin
fix: resolve DWG layer toggle crash on empty layers
docs: update props table with new annotations options
```

## Pull Requests

1. Ensure your code passes linting and type checking:
   ```bash
   npm run lint
   npx tsc --noEmit
   ```
2. Add or update tests for your changes
3. Update documentation if you changed the public API
4. Keep PRs focused — one feature or fix per PR
5. Fill out the PR description explaining what changed and why

## Adding a New Renderer

To add support for a new file format:

1. Create a new directory under `src/renderers/<format>/`
2. Implement the renderer component (see existing renderers for patterns)
3. Register it in `src/core/PluginSystem.ts`
4. Add the format to `SupportedFormat` in `src/core/types.ts`
5. Update file detection in `src/utils/fileDetector.ts`
6. Add lazy import in `src/core/UniView.tsx`
7. Update the README and docs

## Reporting Issues

- Check existing issues before opening a new one
- Include browser, OS, and UniView version
- For rendering bugs, include the file format and a minimal reproduction
- For CAD issues, note whether the file is DWG or DXF and the AutoCAD version

## License

By contributing, you agree that your contributions will be licensed under the [MIT License](LICENSE).
