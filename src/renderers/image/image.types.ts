import type { DocumentInfo } from '../../core/types';

/** Image metadata */
export interface ImageData {
  width: number;
  height: number;
  naturalWidth: number;
  naturalHeight: number;
  type: string;
}

/** Convert image metadata to DocumentInfo */
export function toDocumentInfo(
  _data: ImageData,
  fileName: string,
  fileSize: number,
  format: 'png' | 'jpg' | 'jpeg' | 'svg' | 'tiff' | 'bmp' | 'webp',
): DocumentInfo {
  return {
    format,
    fileName,
    fileSize,
    pageCount: 1,
  };
}
