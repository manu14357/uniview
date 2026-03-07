import { describe, it, expect, vi } from 'vitest';

// Mock Three.js
vi.mock('three', () => ({
  Scene: vi.fn(),
  OrthographicCamera: vi.fn(),
  WebGLRenderer: vi.fn(() => ({
    setSize: vi.fn(),
    setPixelRatio: vi.fn(),
    domElement: document.createElement('canvas'),
    render: vi.fn(),
    dispose: vi.fn(),
  })),
  Color: vi.fn(),
  LineBasicMaterial: vi.fn(),
  BufferGeometry: vi.fn(() => ({ setFromPoints: vi.fn().mockReturnThis() })),
  Line: vi.fn(),
  Group: vi.fn(() => ({ add: vi.fn(), visible: true })),
  Vector3: vi.fn(),
  EllipseCurve: vi.fn(() => ({ getPoints: vi.fn().mockReturnValue([]) })),
  MOUSE: { PAN: 0, DOLLY: 1, RIGHT: 2 },
  Mesh: class {},
}));

vi.mock('three/examples/jsm/controls/OrbitControls.js', () => ({
  OrbitControls: vi.fn(() => ({
    enableRotate: false,
    enableDamping: false,
    dampingFactor: 0,
    screenSpacePanning: false,
    mouseButtons: {},
    update: vi.fn(),
    dispose: vi.fn(),
  })),
}));

describe('DXFRenderer', () => {
  it('should export a default component', async () => {
    const mod = await import('../../src/renderers/dxf/DXFRenderer');
    expect(mod.default).toBeDefined();
    expect(typeof mod.default).toBe('function');
  });

  it('dxf.types toDocumentInfo produces correct structure', async () => {
    const { toDocumentInfo } = await import('../../src/renderers/dxf/dxf.types');
    const info = toDocumentInfo(
      {
        entities: [],
        layers: [
          { id: '0', name: 'Layer 0', color: '#FFFFFF', visible: true, locked: false },
        ],
        bounds: { minX: 0, minY: 0, maxX: 100, maxY: 100 },
        blocks: {},
        units: 0,
      },
      'test.dxf',
      2048,
    );

    expect(info.format).toBe('dxf');
    expect(info.fileName).toBe('test.dxf');
    expect(info.fileSize).toBe(2048);
    expect(info.pageCount).toBe(1);
    expect(info.layers).toHaveLength(1);
    expect(info.layers![0].name).toBe('Layer 0');
  });
});
