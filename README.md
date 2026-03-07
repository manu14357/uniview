<p align="center">
  <img src="https://img.shields.io/npm/v/uniview?style=flat-square&color=blue" alt="npm version" />
  <img src="https://img.shields.io/npm/l/uniview?style=flat-square" alt="license" />
  <img src="https://img.shields.io/npm/dt/uniview?style=flat-square" alt="downloads" />
  <img src="https://img.shields.io/github/stars/manu14357/uniview?style=flat-square" alt="stars" />
  <img src="https://img.shields.io/badge/TypeScript-strict-blue?style=flat-square" alt="typescript" />
</p>

<h1 align="center">UniView</h1>
<p align="center">
  <strong>Document & CAD Viewer for React</strong><br/>
  View PDFs, DOCX, XLSX, DWG, DXF, images and more in the browser. No backend needed.
</p>

<p align="center">
  <a href="https://manu14357.github.io/uniview/">Documentation</a> ·
  <a href="https://manu14357.github.io/uniview/demo/">Live Demo</a> ·
  <a href="https://github.com/manu14357/uniview/issues">Report Bug</a>
</p>

---

## Features

- **17 file formats** — PDF, DOCX, XLSX, DWG, DXF, PNG, SVG, TIFF, CSV, and more
- **GPU-accelerated CAD** — Three.js WebGL rendering with geometry batching
- **WebAssembly** — DWG parsing via bundled libredwg WASM engine (no server needed)
- **Web Workers** — All file parsing runs off the main thread
- **Virtual rendering** — PDF pages and XLSX rows load on demand
- **Annotations** — SVG markup layer with pen, highlight, arrow, rectangle, text tools
- **Plugin system** — Extend with custom renderers for any format
- **Dark mode** — Light, dark, and auto themes out of the box
- **Lazy loading** — Each renderer loads only when its format is used
- **Full TypeScript** — Strict mode, complete type definitions shipped
- **Tree-shakeable** — ESM + CJS dual output, zero side effects

## Quick Start

### Install

```bash
npm install uniview
```

> Peer dependencies: `react >= 18.0.0` and `react-dom >= 18.0.0`

### Basic Usage

```tsx
import { UniView } from 'uniview';

function App() {
  return <UniView file="./drawing.dxf" />;
}
```

### File Object

```tsx
function Viewer({ file }: { file: File }) {
  return (
    <UniView
      file={file}
      theme="dark"
      annotations={true}
      initialZoom="fit"
      onLoad={(info) => console.log('Loaded:', info.pageCount, 'pages')}
      onError={(err) => console.error(err.message)}
    />
  );
}
```

### URL

```tsx
<UniView file="https://example.com/report.pdf" theme="light" />
```

### ArrayBuffer

```tsx
const buffer = await fetch('/data/plan.dwg').then(r => r.arrayBuffer());
<UniView file={buffer} format="dwg" />
```

## Supported Formats

| Category | Formats | Engine |
|---|---|---|
| **CAD Drawings** | DWG, DXF | Three.js WebGL + libredwg WASM |
| **Documents** | PDF | Mozilla PDF.js (canvas) |
| **Documents** | DOCX, DOC | mammoth.js (HTML conversion) |
| **Spreadsheets** | XLSX, XLS, CSV | SheetJS (virtual table) |
| **Images** | PNG, JPG, JPEG, WebP, BMP, TIFF | HTML5 Canvas |
| **Images** | SVG | Inline SVG with zoom/pan |
| **Text** | TXT, RTF | Monospace with line numbers |

## Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `file` | `File \| string \| ArrayBuffer` | — | **Required.** File object, URL, or raw bytes |
| `format` | `SupportedFormat` | Auto-detected | File format override |
| `theme` | `'light' \| 'dark' \| 'auto'` | `'light'` | Visual theme |
| `layout` | `'single' \| 'continuous' \| 'facing'` | `'continuous'` | Page layout mode |
| `toolbar` | `boolean` | `true` | Show/hide toolbar |
| `sidebar` | `boolean` | `true` | Show/hide sidebar |
| `annotations` | `boolean` | `false` | Enable annotation tools |
| `initialPage` | `number` | `1` | Starting page (1-indexed) |
| `initialZoom` | `number \| 'fit' \| 'width'` | `1` | Starting zoom level |
| `onLoad` | `(info: DocumentInfo) => void` | — | Document loaded callback |
| `onError` | `(error: ViewerError) => void` | — | Error callback |
| `onPageChange` | `(page: number) => void` | — | Page change callback |
| `onZoomChange` | `(zoom: number) => void` | — | Zoom change callback |
| `className` | `string` | — | CSS class on root element |
| `style` | `CSSProperties` | — | Inline styles on root element |

## Hooks

### useViewer()

Main control hook for programmatic viewer interaction.

```tsx
import { useViewer } from 'uniview';

const {
  format, fileName, currentPage, totalPages, zoom,
  goToPage, nextPage, prevPage,
  setZoom, zoomIn, zoomOut, fitWidth, fitPage,
  toggleLayer, toggleSidebar,
} = useViewer();
```

### useZoom()

Dedicated zoom controls. Range: 0.1× to 10×, step: 1.25×.

```tsx
const { zoom, setZoom, zoomIn, zoomOut, resetZoom, fitWidth, fitPage } = useZoom();
```

### usePan()

Pan/drag with inertia.

```tsx
const { pan, panHandlers, resetPan } = usePan();
// pan = { x, y, isDragging }
```

### useFileLoader()

File loading with progress tracking.

```tsx
const { state, loadFile } = useFileLoader();
// state.isLoading, state.progress, state.fileData, state.format
```

### useAnnotations()

Annotation CRUD and export.

```tsx
const {
  annotations, activeTool, activeColor,
  setTool, addAnnotation, removeAnnotation,
  exportAsJSON,
} = useAnnotations();
```

## Plugin System

Register custom renderers for any file format:

```tsx
import { PluginSystem } from 'uniview';

PluginSystem.register({
  name: 'ifc-viewer',
  version: '1.0.0',
  supportedFormats: ['ifc'],
  render: async (container, file, options) => {
    const viewer = createIFCViewer(container, file);
    return {
      destroy: () => viewer.dispose(),
      goToPage: (page) => viewer.navigateTo(page),
      setZoom: (zoom) => viewer.setZoom(zoom),
    };
  },
});
```

## Stores

UniView uses [Zustand](https://github.com/pmndrs/zustand) stores that you can access directly:

```tsx
import { useViewerStore, useAnnotationStore, useLayerStore } from 'uniview';

// Viewer state
const zoom = useViewerStore(s => s.zoom);
const theme = useViewerStore(s => s.theme);

// Annotations
const annotations = useAnnotationStore(s => s.annotations);

// CAD layers
const layers = useLayerStore(s => s.layers);
const toggleLayer = useLayerStore(s => s.toggleLayer);
```

## CAD-Specific Features

DWG and DXF files provide extra capabilities:

- **WebGL rendering** via Three.js with geometry batching and instanced rendering
- **Layer management** — toggle visibility, view names and colors
- **Coordinate display** — live world coordinates under cursor
- **Pan modes** — Space+drag, middle-click drag
- **Zoom** — Scroll-wheel (1.3× steps), fit-to-drawing
- **Keyboard** — `+`/`-` zoom, `F` fit, `V` select mode, `H` pan mode

## Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| `← ↑` / `Page Up` | Previous page |
| `→ ↓` / `Page Down` | Next page |
| `Home` | First page |
| `End` | Last page |
| `+` / `=` | Zoom in |
| `-` | Zoom out |
| `Ctrl+F` / `⌘F` | Open search |
| `Escape` | Close panels |

## Types

All types are exported for full TypeScript support:

```typescript
import type {
  SupportedFormat,
  UniViewProps,
  DocumentInfo,
  CADLayer,
  UniViewPlugin,
  PluginInstance,
  PluginOptions,
  ViewerError,
  Annotation,
  ViewerEventMap,
  RendererProps,
  LoadingState,
} from 'uniview';
```

<details>
<summary><strong>DocumentInfo</strong></summary>

```typescript
interface DocumentInfo {
  format: SupportedFormat;
  fileName: string;
  fileSize: number;
  pageCount: number;
  title?: string;
  author?: string;
  createdAt?: Date;
  modifiedAt?: Date;
  layers?: CADLayer[];   // DWG/DXF only
  sheets?: string[];     // XLSX only
}
```
</details>

<details>
<summary><strong>CADLayer</strong></summary>

```typescript
interface CADLayer {
  id: string;
  name: string;
  color: string;       // Hex e.g. '#FF0000'
  visible: boolean;
  locked: boolean;
  lineType?: string;
  lineWeight?: number;
}
```
</details>

<details>
<summary><strong>ViewerError</strong></summary>

```typescript
interface ViewerError {
  code: string;
  message: string;
  format?: SupportedFormat;
  originalError?: Error;
}
```
</details>

<details>
<summary><strong>Annotation</strong></summary>

```typescript
interface Annotation {
  id: string;
  tool: 'select' | 'pen' | 'highlight' | 'arrow' | 'rectangle' | 'text';
  color: string;
  lineWidth: number;
  pageNumber: number;
  data: AnnotationPathData | AnnotationShapeData | AnnotationTextData;
  createdAt: Date;
}
```
</details>

## Development

```bash
# Install dependencies
npm install

# Start demo dev server (port 3000)
npm run dev

# Build library (ESM + CJS)
npm run build

# Build vendor workers (DXF parser, DWG parser, MTEXT renderer)
npm run build:workers

# Build demo for GitHub Pages
npm run build:demo

# Type check
npx tsc --noEmit

# Run unit tests
npm test

# Run e2e tests
npm run test:e2e

# Lint & format
npm run lint
npm run format
```

## Project Structure

```
uniview/
├── src/
│   ├── index.ts              # Library entry — all exports
│   ├── core/                 # UniView component, plugin system, types
│   ├── renderers/            # Format-specific renderers
│   │   ├── pdf/              # PDF.js integration
│   │   ├── docx/             # mammoth.js renderer
│   │   ├── xlsx/             # SheetJS table renderer
│   │   ├── dxf/              # dxf-viewer + Three.js
│   │   ├── dwg/              # @uniview/viewer + Three.js (libredwg WASM)
│   │   └── image/            # Canvas/SVG renderer
│   ├── hooks/                # React hooks for viewer control
│   ├── store/                # Zustand state stores
│   ├── ui/                   # Toolbar, annotations, common UI
│   ├── utils/                # Format detection, export, colors, units
│   ├── workers/              # Web Worker documentation stubs
│   └── vendor/               # Vendored @uniview DWG/DXF engine (libredwg WASM)
├── demo/                     # Demo application
├── docs/                     # GitHub Pages documentation site
└── tests/                    # Unit + e2e tests
```

## Build Output

| File | Format | Description |
|---|---|---|
| `dist/uniview.esm.js` | ES Module | Tree-shakeable, for bundlers |
| `dist/uniview.cjs.js` | CommonJS | For Node.js / require() |
| `dist/index.d.ts` | TypeScript | Complete type declarations |

## Tech Stack

| Technology | Purpose |
|---|---|
| React 18 | UI framework |
| TypeScript 5 | Type safety (strict mode) |
| Vite 5 | Build tool (library mode) |
| Three.js | WebGL CAD rendering |
| PDF.js | PDF rendering |
| mammoth.js | DOCX → HTML |
| SheetJS | Spreadsheet parsing |
| Zustand | State management |
| Tailwind CSS | Styling |
| Web Workers | Off-thread parsing |
| WebAssembly | DWG parsing (bundled libredwg) |

## Browser Support

| Browser | Version |
|---|---|
| Chrome | 90+ |
| Firefox | 90+ |
| Safari | 15+ |
| Edge | 90+ |

Requires WebGL 2.0 for CAD rendering and WebAssembly for DWG parsing.

## Contributing

Contributions are welcome! Please read the [Contributing Guide](CONTRIBUTING.md) and [Code of Conduct](CODE_OF_CONDUCT.md) before submitting a PR.

## License

[MIT](LICENSE) © [Manu](https://github.com/manu14357)
