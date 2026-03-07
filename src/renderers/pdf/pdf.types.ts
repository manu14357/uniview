import type { DocumentInfo } from '../../core/types';

/** PDF-specific page data */
export interface PDFPageData {
  pageNumber: number;
  width: number;
  height: number;
  rotation: number;
}

/** PDF document metadata */
export interface PDFDocumentData {
  pageCount: number;
  title?: string;
  author?: string;
  subject?: string;
  creator?: string;
  producer?: string;
  creationDate?: string;
  modDate?: string;
  pages: PDFPageData[];
}

/** PDF outline/bookmark item */
export interface PDFOutlineItem {
  title: string;
  pageNumber: number;
  children: PDFOutlineItem[];
}

/** PDF search match */
export interface PDFSearchMatch {
  pageNumber: number;
  matchIndex: number;
  text: string;
}

/** PDF text content for a page */
export interface PDFTextContent {
  pageNumber: number;
  text: string;
  items: PDFTextItem[];
}

export interface PDFTextItem {
  str: string;
  dir: string;
  width: number;
  height: number;
  transform: number[];
}

/** Convert PDF metadata to DocumentInfo */
export function toDocumentInfo(
  data: PDFDocumentData,
  fileName: string,
  fileSize: number,
): DocumentInfo {
  return {
    format: 'pdf',
    fileName,
    fileSize,
    pageCount: data.pageCount,
    title: data.title,
    author: data.author,
    createdAt: data.creationDate ? new Date(data.creationDate) : undefined,
    modifiedAt: data.modDate ? new Date(data.modDate) : undefined,
  };
}
