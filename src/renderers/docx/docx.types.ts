import type { DocumentInfo } from '../../core/types';

/** DOCX conversion result */
export interface DOCXConversionResult {
  html: string;
  messages: DOCXMessage[];
}

/** Warning/message from mammoth.js conversion */
export interface DOCXMessage {
  type: 'warning' | 'error';
  message: string;
}

/** Convert DOCX metadata to DocumentInfo */
export function toDocumentInfo(
  fileName: string,
  fileSize: number,
  pageCount: number,
): DocumentInfo {
  return {
    format: 'docx',
    fileName,
    fileSize,
    pageCount,
  };
}
