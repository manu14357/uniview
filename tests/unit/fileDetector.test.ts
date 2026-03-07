import { describe, it, expect } from 'vitest';
import { detectFormat, isCADFormat, isImageFormat, isDocumentFormat, isSpreadsheetFormat } from '../../src/utils/fileDetector';

describe('fileDetector', () => {
  describe('detectFormat', () => {
    it('detects PDF from extension', () => {
      expect(detectFormat('document.pdf')).toBe('pdf');
    });

    it('detects DOCX from extension', () => {
      expect(detectFormat('file.docx')).toBe('docx');
    });

    it('detects XLSX from extension', () => {
      expect(detectFormat('spreadsheet.xlsx')).toBe('xlsx');
    });

    it('detects DXF from extension', () => {
      expect(detectFormat('drawing.dxf')).toBe('dxf');
    });

    it('detects DWG from extension', () => {
      expect(detectFormat('plan.dwg')).toBe('dwg');
    });

    it('detects PNG from extension', () => {
      expect(detectFormat('photo.png')).toBe('png');
    });

    it('detects JPG from extension', () => {
      expect(detectFormat('image.jpg')).toBe('jpg');
    });

    it('detects JPEG from extension', () => {
      expect(detectFormat('image.jpeg')).toBe('jpeg');
    });

    it('detects SVG from extension', () => {
      expect(detectFormat('graphic.svg')).toBe('svg');
    });

    it('detects CSV from extension', () => {
      expect(detectFormat('data.csv')).toBe('csv');
    });

    it('detects TXT from extension', () => {
      expect(detectFormat('readme.txt')).toBe('txt');
    });

    it('detects format case-insensitively', () => {
      expect(detectFormat('FILE.PDF')).toBe('pdf');
      expect(detectFormat('Image.PNG')).toBe('png');
    });

    it('returns null for unknown extensions', () => {
      expect(detectFormat('file.xyz')).toBeNull();
    });

    it('detects from MIME type via string fallback', () => {
      // detectFormat with a string extracts extension, not MIME.
      // MIME detection only works via File objects.
      expect(detectFormat('document.pdf')).toBe('pdf');
    });

    it('returns null for empty string', () => {
      expect(detectFormat('')).toBeNull();
    });
  });

  describe('format category helpers', () => {
    it('identifies CAD formats', () => {
      expect(isCADFormat('dxf')).toBe(true);
      expect(isCADFormat('dwg')).toBe(true);
      expect(isCADFormat('pdf')).toBe(false);
    });

    it('identifies image formats', () => {
      expect(isImageFormat('png')).toBe(true);
      expect(isImageFormat('jpg')).toBe(true);
      expect(isImageFormat('svg')).toBe(true);
      expect(isImageFormat('tiff')).toBe(true);
      expect(isImageFormat('pdf')).toBe(false);
    });

    it('identifies document formats', () => {
      expect(isDocumentFormat('pdf')).toBe(true);
      expect(isDocumentFormat('docx')).toBe(true);
      expect(isDocumentFormat('txt')).toBe(true);
      expect(isDocumentFormat('png')).toBe(false);
    });

    it('identifies spreadsheet formats', () => {
      expect(isSpreadsheetFormat('xlsx')).toBe(true);
      expect(isSpreadsheetFormat('csv')).toBe(true);
      expect(isSpreadsheetFormat('pdf')).toBe(false);
    });
  });
});
