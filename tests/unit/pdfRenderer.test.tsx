import { describe, it, expect, vi } from 'vitest';

// Mock PDF.js since it won't be available in test environment
vi.mock('pdfjs-dist', () => ({
  getDocument: vi.fn(),
  GlobalWorkerOptions: { workerSrc: '' },
}));

describe('PDFRenderer', () => {
  it('should export a default component', async () => {
    const mod = await import('../../src/renderers/pdf/PDFRenderer');
    expect(mod.default).toBeDefined();
    expect(typeof mod.default).toBe('function');
  });

  it('pdf.types toDocumentInfo produces correct structure', async () => {
    const { toDocumentInfo } = await import('../../src/renderers/pdf/pdf.types');
    const info = toDocumentInfo(
      {
        pageCount: 5,
        pages: [
          { width: 612, height: 792, pageNumber: 1, rotation: 0 },
        ],
      },
      'test.pdf',
      1024,
    );

    expect(info.format).toBe('pdf');
    expect(info.fileName).toBe('test.pdf');
    expect(info.fileSize).toBe(1024);
    expect(info.pageCount).toBe(5);
  });
});
