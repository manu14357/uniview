/**
 * CAD Export Utilities
 *
 * Converts DWG/DXF drawings to SVG, PNG, JPEG, and PDF formats.
 * Uses the vendor's built-in SVG renderer for vector output and
 * Three.js WebGLRenderTarget for high-quality raster capture.
 */

import type { ExportOptions, ExportResult } from '../core/types';
import type {
  WebGLRenderer,
  Scene,
} from 'three';

// ── SVG helpers ──────────────────────────────────────────────────────────────

/**
 * Add a white (or custom) background rectangle as the first child of the SVG.
 */
function addSvgBackground(svgString: string, background: string): string {
  // Extract viewBox to size the background rect
  const vbMatch = svgString.match(/viewBox="([^"]+)"/);
  if (!vbMatch) return svgString;
  const [x, y, w, h] = vbMatch[1].split(/\s+/).map(Number);
  const bgRect = `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${background}" />`;
  // Insert after <svg ...> opening tag — before the first child element
  return svgString.replace(/>(\s*<)/, `>${bgRect}$1`);
}

/**
 * Generate SVG from a DWG document using the vendor UvSvgRenderer.
 * The caller must ensure UvApDocManager has an open document.
 */
export async function exportDwgToSvg(background = '#FFFFFF'): Promise<string> {
  const { UvApDocManager } = await import('@uniview/viewer');
  const { UvSvgRenderer } = await import('@uniview/svg-renderer');
  const db = UvApDocManager.instance.curDocument.database;
  const entities = db.tables.blockTable.modelSpace.newIterator();
  const renderer = new UvSvgRenderer();
  for (const entity of entities) {
    entity.worldDraw(renderer);
  }
  const raw = renderer.export();
  return addSvgBackground(raw, background);
}

// ── Raster capture via Three.js ──────────────────────────────────────────────

interface RasterContext {
  renderer: WebGLRenderer;
  scene: Scene;
  /** Drawing extents */
  bounds: { minX: number; maxX: number; minY: number; maxY: number };
}

/**
 * Decide whether a background colour is "light" (≥ 0.5 luminance).
 * When the background is light we need to darken light-coloured CAD entities
 * that would otherwise be invisible (yellow, cyan, white, etc.).
 */
function isLightBackground(hex: string): boolean {
  // Cheap hex → RGB → relative luminance
  const c = parseInt(hex.replace('#', ''), 16);
  const r = ((c >> 16) & 0xff) / 255;
  const g = ((c >> 8) & 0xff) / 255;
  const b = (c & 0xff) / 255;
  return 0.299 * r + 0.587 * g + 0.114 * b >= 0.5;
}

interface SavedColor {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  material: any;
  r: number; g: number; b: number;
}

/**
 * Walk every material in the scene and boost contrast so that all drawing
 * entities are clearly visible on the export background.
 *
 * Strategy (light background):
 *   - Very light colours (luminance ≥ 0.45) → replaced with pure black.
 *   - Mid-tone colours (luminance 0.15 – 0.45) → darkened by 60 % so faint
 *     blues, grays, etc. become solid and readable.
 *   - Already-dark colours (luminance < 0.15) → left untouched.
 *
 * Returns a list of originals so the caller can restore them after rendering.
 */
function darkenLightColorsSync(
  scene: Scene,
  lightBg: boolean,
): SavedColor[] {
  if (!lightBg) return [];

  const saved: SavedColor[] = [];
  const HIGH_THRESHOLD = 0.45;   // very light → black
  const MID_THRESHOLD  = 0.15;   // mid-tone → darken significantly
  const DARKEN_FACTOR  = 0.35;   // keep 35 % of original brightness

  scene.traverse((obj) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mat = (obj as any).material;
    if (!mat) return;

    const mats = Array.isArray(mat) ? mat : [mat];
    for (const m of mats) {
      if (!m.color) continue;
      const { r, g, b } = m.color;
      const lum = 0.299 * r + 0.587 * g + 0.114 * b;

      if (lum >= HIGH_THRESHOLD) {
        // Very light — replace with black
        saved.push({ material: m, r, g, b });
        m.color.setRGB(0, 0, 0);
        m.needsUpdate = true;
      } else if (lum >= MID_THRESHOLD) {
        // Mid-tone — darken to improve contrast
        saved.push({ material: m, r, g, b });
        m.color.setRGB(r * DARKEN_FACTOR, g * DARKEN_FACTOR, b * DARKEN_FACTOR);
        m.needsUpdate = true;
      }
    }
  });

  return saved;
}

/** Restore material colours that were darkened for export. */
function restoreColorsSync(saved: SavedColor[]): void {
  for (const s of saved) {
    s.material.color.setRGB(s.r, s.g, s.b);
    s.material.needsUpdate = true;
  }
}

/**
 * Render the current Three.js scene to raster pixels.
 * Uses a WebGLRenderTarget (offscreen framebuffer) so the live canvas is
 * never resized — this eliminates viewport / scissor desync that caused
 * white-space and partial-capture bugs.
 *
 * A fresh orthographic camera frames the exact drawing bounds so the
 * exported image always contains the full drawing regardless of the user's
 * current zoom / pan state.
 *
 * `scale` is a multiplier (1× / 2× / 4×) applied on top of a base
 * resolution that guarantees readable output.
 */
async function captureRaster(
  ctx: RasterContext,
  scale: number,
  background: string,
): Promise<HTMLCanvasElement> {
  const { renderer, scene, bounds } = ctx;
  const THREE = await import('three');

  // 5 % margin so entities at the edge aren't clipped
  const MARGIN = 0.05;
  const rawW = bounds.maxX - bounds.minX;
  const rawH = bounds.maxY - bounds.minY;
  if (rawW <= 0 || rawH <= 0) {
    throw new Error('Drawing bounds are empty — nothing to export.');
  }
  const marginX = rawW * MARGIN;
  const marginY = rawH * MARGIN;
  const drawingW = rawW + marginX * 2;
  const drawingH = rawH + marginY * 2;
  const centerX = (bounds.minX + bounds.maxX) / 2;
  const centerY = (bounds.minY + bounds.maxY) / 2;

  // ── Compute pixel dimensions ──
  const BASE_LONG_EDGE = 3000;      // minimum at 1×
  const MAX_DIM = 8192;
  const longEdge = Math.max(drawingW, drawingH);
  const ppu = (BASE_LONG_EDGE / longEdge) * scale;   // pixels-per-CAD-unit

  let pixelW = Math.round(drawingW * ppu);
  let pixelH = Math.round(drawingH * ppu);

  if (pixelW > MAX_DIM || pixelH > MAX_DIM) {
    const f = MAX_DIM / Math.max(pixelW, pixelH);
    pixelW = Math.round(pixelW * f);
    pixelH = Math.round(pixelH * f);
  }
  pixelW = Math.max(pixelW, 1);
  pixelH = Math.max(pixelH, 1);

  // ── Orthographic camera that frames the drawing ──
  const halfW = drawingW / 2;
  const halfH = drawingH / 2;
  const ortho = new THREE.OrthographicCamera(
    -halfW, halfW, halfH, -halfH, -100000, 100000,
  );
  ortho.position.set(centerX, centerY, 500);
  ortho.up.set(0, 1, 0);
  ortho.lookAt(centerX, centerY, 0);
  ortho.zoom = 1;
  ortho.updateProjectionMatrix();

  // ── Offscreen render target (avoids touching the live canvas) ──
  const renderTarget = new THREE.WebGLRenderTarget(pixelW, pixelH, {
    format: THREE.RGBAFormat,
    type: THREE.UnsignedByteType,
    depthBuffer: true,
    stencilBuffer: false,
  });

  // Save state
  const savedClearColor = new THREE.Color();
  renderer.getClearColor(savedClearColor);
  const savedClearAlpha = renderer.getClearAlpha();
  const savedRenderTarget = renderer.getRenderTarget();
  const savedBackground = scene.background;
  const bgColor = new THREE.Color(background);

  // Darken light-coloured materials when exporting on a light background
  const lightBg = isLightBackground(background);
  const savedColors = darkenLightColorsSync(scene, lightBg);

  try {
    // Temporarily clear scene background so our clear color is used
    scene.background = null;

    renderer.setRenderTarget(renderTarget);
    renderer.setClearColor(bgColor, 1);
    renderer.clear(true, true, true);
    renderer.render(scene, ortho);

    // Read pixels from the render target
    const buffer = new Uint8Array(pixelW * pixelH * 4);
    renderer.readRenderTargetPixels(
      renderTarget, 0, 0, pixelW, pixelH, buffer,
    );

    // WebGL is bottom-up, Canvas is top-down — flip rows
    const rowBytes = pixelW * 4;
    const temp = new Uint8Array(rowBytes);
    for (let y = 0, yMax = Math.floor(pixelH / 2); y < yMax; y++) {
      const top = y * rowBytes;
      const bot = (pixelH - 1 - y) * rowBytes;
      temp.set(buffer.subarray(top, top + rowBytes));
      buffer.copyWithin(top, bot, bot + rowBytes);
      buffer.set(temp, bot);
    }

    // Write to a 2D canvas
    const canvas = document.createElement('canvas');
    canvas.width = pixelW;
    canvas.height = pixelH;
    const ctx2d = canvas.getContext('2d');
    if (!ctx2d) throw new Error('Failed to create 2D context');
    ctx2d.putImageData(
      new ImageData(new Uint8ClampedArray(buffer.buffer), pixelW, pixelH),
      0,
      0,
    );
    return canvas;
  } finally {
    restoreColorsSync(savedColors);
    scene.background = savedBackground;
    renderer.setRenderTarget(savedRenderTarget);
    renderer.setClearColor(savedClearColor, savedClearAlpha);
    renderTarget.dispose();
  }
}

/**
 * Render the DXF scene to raster using the dxf-viewer's own API.
 *
 * Key insight: dxf-viewer calls `renderer.setPixelRatio(devicePixelRatio)` at
 * init. On Retina/HiDPI displays (DPR = 2) this means `renderer.setSize(W, H)`
 * creates a physical canvas of `W*2 × H*2` while CSS size stays `W × H`.
 * If we naively `drawImage(domCanvas, …)` onto a `W × H` output canvas the
 * browser draws from the CSS dimensions, capturing only a quarter of the actual
 * pixel buffer — producing the "only half the drawing exported" symptom.
 *
 * Fix: temporarily set pixel ratio to 1 before resizing for export, so that
 * `SetSize(W, H)` produces exactly `W × H` physical pixels. Then we capture
 * the full canvas. On cleanup we restore the original pixel ratio.
 */
async function captureDxfRaster(
  dxfViewer: DxfExportContext['viewer'],
  scale: number,
  background: string,
): Promise<HTMLCanvasElement> {
  const bounds = dxfViewer.GetBounds();
  if (!bounds) throw new Error('Drawing bounds not available.');

  const renderer = dxfViewer.GetRenderer();
  if (!renderer) throw new Error('DXF renderer not available.');
  const scene = dxfViewer.GetScene();
  const cam = dxfViewer.GetCamera();

  // ── Save current state ──
  const domCanvas = renderer.domElement;
  const savedPixelRatio = renderer.getPixelRatio();
  // dxf-viewer tracks canvas dimensions via public instance properties
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const savedCanvasW: number = (dxfViewer as any).canvasWidth ?? (domCanvas.clientWidth || domCanvas.width / savedPixelRatio);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const savedCanvasH: number = (dxfViewer as any).canvasHeight ?? (domCanvas.clientHeight || domCanvas.height / savedPixelRatio);
  const savedCam = {
    left: cam.left, right: cam.right,
    top: cam.top, bottom: cam.bottom,
    posX: cam.position.x, posY: cam.position.y, posZ: cam.position.z,
    zoom: cam.zoom,
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const savedBackground = (scene as any).background;

  // Save renderer clear colour as individual floats (avoids Three.js Color import)
  const gl = renderer.getContext();
  const ccArr = gl.getParameter(gl.COLOR_CLEAR_VALUE) as Float32Array;
  const savedClearR = ccArr[0];
  const savedClearG = ccArr[1];
  const savedClearB = ccArr[2];
  const savedClearA = ccArr[3];

  // ── Compute export pixel dimensions ──
  const MARGIN = 0.05;
  const rawW = bounds.maxX - bounds.minX;
  const rawH = bounds.maxY - bounds.minY;
  if (rawW <= 0 || rawH <= 0) {
    throw new Error('Drawing bounds are empty — nothing to export.');
  }
  const drawingW = rawW * (1 + MARGIN * 2);
  const drawingH = rawH * (1 + MARGIN * 2);

  const BASE_LONG_EDGE = 3000;
  const MAX_DIM = 8192;
  const longEdge = Math.max(drawingW, drawingH);
  const ppu = (BASE_LONG_EDGE / longEdge) * scale;

  let pixelW = Math.round(drawingW * ppu);
  let pixelH = Math.round(drawingH * ppu);
  if (pixelW > MAX_DIM || pixelH > MAX_DIM) {
    const f = MAX_DIM / Math.max(pixelW, pixelH);
    pixelW = Math.round(pixelW * f);
    pixelH = Math.round(pixelH * f);
  }
  pixelW = Math.max(pixelW, 1);
  pixelH = Math.max(pixelH, 1);

  // ── Darken light-coloured entities for visibility ──
  const lightBg = isLightBackground(background);
  const savedColors = darkenLightColorsSync(scene, lightBg);

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (scene as any).background = null;

    // Set clear colour using hex integer (no Three.js Color constructor needed)
    const bgInt = parseInt(background.replace('#', ''), 16);
    renderer.setClearColor(bgInt, 1);

    // ── Critical: set pixel ratio to 1 before resizing ──
    // dxf-viewer initializes with `renderer.setPixelRatio(devicePixelRatio)`.
    // On Retina (DPR=2), `renderer.setSize(3000, 2000)` would create a 6000×4000
    // physical canvas. By forcing DPR=1, setSize produces exactly pixelW × pixelH
    // physical pixels, so our canvas capture gets the full drawing.
    renderer.setPixelRatio(1);

    // Resize the dxf-viewer canvas to export resolution and fit the drawing.
    dxfViewer.SetSize(pixelW, pixelH);
    dxfViewer.FitView(bounds.minX, bounds.maxX, bounds.minY, bounds.maxY, MARGIN);
    dxfViewer.Render();

    // ── Capture via gl.readPixels — reliable across all platforms ──
    // drawImage(webGLCanvas) is unreliable on macOS Metal/Retina due to
    // compositor DPR mismatches. Raw GPU readback avoids all those issues.
    renderer.setRenderTarget(null);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);

    const actualW = gl.drawingBufferWidth;
    const actualH = gl.drawingBufferHeight;
    const buffer = new Uint8Array(actualW * actualH * 4);
    gl.readPixels(0, 0, actualW, actualH, gl.RGBA, gl.UNSIGNED_BYTE, buffer);

    // WebGL is bottom-up, Canvas is top-down — flip rows
    const rowBytes = actualW * 4;
    const temp = new Uint8Array(rowBytes);
    for (let y = 0, yMax = Math.floor(actualH / 2); y < yMax; y++) {
      const top = y * rowBytes;
      const bot = (actualH - 1 - y) * rowBytes;
      temp.set(buffer.subarray(top, top + rowBytes));
      buffer.copyWithin(top, bot, bot + rowBytes);
      buffer.set(temp, bot);
    }

    // Write to a 2D canvas
    const outputCanvas = document.createElement('canvas');
    outputCanvas.width = actualW;
    outputCanvas.height = actualH;
    const ctx2d = outputCanvas.getContext('2d');
    if (!ctx2d) throw new Error('Failed to create 2D context');
    ctx2d.putImageData(
      new ImageData(new Uint8ClampedArray(buffer.buffer), actualW, actualH),
      0, 0,
    );

    return outputCanvas;
  } finally {
    // ── Restore everything ──
    restoreColorsSync(savedColors);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (scene as any).background = savedBackground;

    // Restore clear colour from saved floats via raw WebGL
    gl.clearColor(savedClearR, savedClearG, savedClearB, savedClearA);

    // Restore original pixel ratio before restoring size
    renderer.setPixelRatio(savedPixelRatio);

    // Restore canvas size — use the original logical dimensions.
    dxfViewer.SetSize(savedCanvasW, savedCanvasH);

    // Manually restore the camera to its pre-export state
    cam.left = savedCam.left;
    cam.right = savedCam.right;
    cam.top = savedCam.top;
    cam.bottom = savedCam.bottom;
    cam.position.x = savedCam.posX;
    cam.position.y = savedCam.posY;
    cam.position.z = savedCam.posZ;
    cam.zoom = savedCam.zoom;
    cam.updateProjectionMatrix();
    dxfViewer.Render();
  }
}

// ── Canvas → Blob helpers ────────────────────────────────────────────────────

function canvasToBlob(
  canvas: HTMLCanvasElement,
  format: 'png' | 'jpeg',
  quality = 0.92,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('toBlob returned null'))),
      `image/${format}`,
      quality,
    );
  });
}

// ── PDF generation ───────────────────────────────────────────────────────────

async function rasterToPdf(canvas: HTMLCanvasElement): Promise<Blob> {
  const { jsPDF } = await import('jspdf');
  const imgData = canvas.toDataURL('image/png');
  const pxW = canvas.width;
  const pxH = canvas.height;

  // Fit the drawing into an A3-sized page (most common CAD paper size).
  // A3 in points: 841.89 × 1190.55 (297 × 420 mm)
  const A3_SHORT = 841.89;
  const A3_LONG = 1190.55;

  const imgAspect = pxW / pxH;
  let pageW: number;
  let pageH: number;

  if (pxW >= pxH) {
    // Landscape — long edge = width
    pageW = A3_LONG;
    pageH = pageW / imgAspect;
    if (pageH > A3_SHORT) {
      pageH = A3_SHORT;
      pageW = pageH * imgAspect;
    }
  } else {
    // Portrait — long edge = height
    pageH = A3_LONG;
    pageW = pageH * imgAspect;
    if (pageW > A3_SHORT) {
      pageW = A3_SHORT;
      pageH = pageW / imgAspect;
    }
  }

  const orientation = pageW >= pageH ? 'landscape' : 'portrait';
  const pdf = new jsPDF({ orientation, unit: 'pt', format: [pageW, pageH] });

  // Use jsPDF's actual page dimensions (it may reorder for orientation)
  const w = pdf.internal.pageSize.getWidth();
  const h = pdf.internal.pageSize.getHeight();
  pdf.addImage(imgData, 'PNG', 0, 0, w, h);
  return pdf.output('blob');
}

// ── Public API ───────────────────────────────────────────────────────────────

export interface DwgExportContext {
  type: 'dwg';
  /** UvTrView2d ref — the vendor view object */
  view: {
    renderer: {
      internalRenderer: WebGLRenderer;
      domElement: HTMLElement;
    };
    /** The UvTrScene wrapper — _scene on UvTrView2d (protected, accessible at runtime) */
    _scene: {
      internalScene: Scene;
      box?: { min: { x: number; y: number; z: number }; max: { x: number; y: number; z: number } };
    };
  };
}

export interface DxfExportContext {
  type: 'dxf';
  viewer: {
    GetBounds: () => { minX: number; maxX: number; minY: number; maxY: number } | null;
    GetRenderer: () => WebGLRenderer | null;
    GetScene: () => Scene;
    GetCamera: () => {
      left: number; right: number; top: number; bottom: number;
      position: { x: number; y: number; z: number };
      zoom: number;
      updateProjectionMatrix: () => void;
    };
    SetSize: (width: number, height: number) => void;
    FitView: (minX: number, maxX: number, minY: number, maxY: number, padding?: number) => void;
    SetView: (center: { x: number; y: number }, width: number) => void;
    Render: () => void;
  };
}

export type CADExportContext = DwgExportContext | DxfExportContext;

/**
 * Export a CAD drawing to the requested format.
 *
 * For SVG: uses the vendor's UvSvgRenderer (DWG) or converts
 *          the drawing via WASM SvgConverter (DXF).
 * For PNG/JPEG: captures the Three.js scene at the requested scale.
 * For PDF: renders a high-res raster and embeds it in a single-page PDF.
 */
export async function exportCAD(
  context: CADExportContext,
  options: ExportOptions,
): Promise<ExportResult> {
  const {
    format,
    scale = 2,
    background = '#FFFFFF',
    fileName: userFileName,
  } = options;

  const baseName = userFileName
    ?? `export_${Date.now()}`;

  // Strip extension from baseName if present — we add it ourselves
  const stem = baseName.replace(/\.\w+$/, '');

  let blob: Blob;

  switch (format) {
    case 'svg': {
      const svg = context.type === 'dwg'
        ? await exportDwgToSvg(background)
        : await exportDxfToSvg(context.viewer, background);
      blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
      break;
    }
    case 'png':
    case 'jpeg': {
      const canvas = context.type === 'dwg'
        ? await captureDwgRaster(context, scale, background)
        : await captureDxfRaster(context.viewer, scale, background);
      blob = await canvasToBlob(canvas, format);
      break;
    }
    case 'pdf': {
      // Always use 4x scale for PDF — it's a print format and should be crisp
      const pdfScale = 4;
      const canvas = context.type === 'dwg'
        ? await captureDwgRaster(context, pdfScale, background)
        : await captureDxfRaster(context.viewer, pdfScale, background);
      blob = await rasterToPdf(canvas);
      break;
    }
    default:
      throw new Error(`Unsupported export format: ${format as string}`);
  }

  const ext = format === 'jpeg' ? 'jpg' : format;
  return {
    blob,
    fileName: `${stem}.${ext}`,
    format,
  };
}

// ── DXF SVG export (raster-based — DXF has no native vector SVG path) ────────

/**
 * Export a DXF drawing to SVG by capturing a high-res raster from the
 * Three.js scene and embedding it in an SVG wrapper. DXF files are parsed by
 * dxf-viewer (not libredwg WASM) which produces Three.js geometry, so there's
 * no direct vector SVG pipeline available.
 */
async function exportDxfToSvg(
  viewer: DxfExportContext['viewer'],
  background: string,
): Promise<string> {
  // Use 4x scale for high-quality SVG-wrapped raster
  const canvas = await captureDxfRaster(viewer, 4, background);
  const dataUrl = canvas.toDataURL('image/png');
  const w = canvas.width;
  const h = canvas.height;
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">`,
    `<image href="${dataUrl}" width="${w}" height="${h}" />`,
    `</svg>`,
  ].join('\n');
}

// ── DWG raster capture helper ────────────────────────────────────────────────

async function captureDwgRaster(
  ctx: DwgExportContext,
  scale: number,
  background: string,
): Promise<HTMLCanvasElement> {
  const glRenderer = ctx.view.renderer.internalRenderer;
  const scene = ctx.view._scene.internalScene;

  // ── 1. Prefer database extents (EXTMIN / EXTMAX from DWG header) ──
  //    These are the official drawing extents as saved by AutoCAD, and
  //    exclude scattered helper geometry that inflates the scene box.
  let bounds: RasterContext['bounds'] | undefined;
  try {
    const { UvApDocManager } = await import('@uniview/viewer');
    const db = UvApDocManager.instance.curDocument.database;
    if (!db.extents.isEmpty()) {
      const emin = db.extmin;
      const emax = db.extmax;
      if (
        Number.isFinite(emin.x) && Number.isFinite(emax.x) &&
        Number.isFinite(emin.y) && Number.isFinite(emax.y) &&
        emax.x > emin.x && emax.y > emin.y
      ) {
        bounds = { minX: emin.x, maxX: emax.x, minY: emin.y, maxY: emax.y };
      }
    }
  } catch {
    // UvApDocManager may not be available — fall through to scene-based bounds
  }

  // ── 2. Fallback: compute tight bounds from visible scene objects only ──
  if (!bounds) {
    const { Box3 } = await import('three');
    const tight = new Box3();
    scene.traverse((obj: { visible?: boolean; geometry?: unknown }) => {
      if (!obj.visible) return;
      if (!('geometry' in obj) || !obj.geometry) return;
      const child = obj as import('three').Mesh;
      if (!child.geometry.boundingBox) child.geometry.computeBoundingBox();
      if (child.geometry.boundingBox) {
        const worldBox = child.geometry.boundingBox.clone().applyMatrix4(child.matrixWorld);
        tight.union(worldBox);
      }
    });

    if (!tight.isEmpty() && Number.isFinite(tight.min.x)) {
      bounds = {
        minX: tight.min.x,
        maxX: tight.max.x,
        minY: tight.min.y,
        maxY: tight.max.y,
      };
    }
  }

  // ── 3. Last resort: precomputed scene box ──
  if (!bounds) {
    const sceneBox = ctx.view._scene.box;
    if (sceneBox && Number.isFinite(sceneBox.min.x)) {
      bounds = {
        minX: sceneBox.min.x,
        maxX: sceneBox.max.x,
        minY: sceneBox.min.y,
        maxY: sceneBox.max.y,
      };
    } else {
      bounds = { minX: 0, maxX: 100, minY: 0, maxY: 100 };
    }
  }

  return captureRaster(
    { renderer: glRenderer, scene, bounds },
    scale,
    background,
  );
}

/** Trigger browser download for an ExportResult */
export function downloadExportResult(result: ExportResult): void {
  const url = URL.createObjectURL(result.blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = result.fileName;
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
