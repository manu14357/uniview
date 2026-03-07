import { useEffect, useState, useRef } from 'react';
import type { RendererProps, DocumentInfo, ViewerError } from '../../core/types';
import { toDocumentInfo } from './docx.types';
import { EventBus } from '../../core/EventBus';
import { useViewerStore } from '../../store/viewerStore';
import styles from './DocStyles.module.css';

/**
 * DOCX Renderer — uses mammoth.js to convert DOCX to clean HTML.
 * Renders inside a scoped container with document-like styling.
 */
export default function DOCXRenderer({
  fileData,
  fileName,
  theme,
  onLoad,
  onError,
}: RendererProps) {
  const [html, setHtml] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let cancelled = false;

    const convert = async () => {
      try {
        const mammoth = await import('mammoth');
        const result = await mammoth.convertToHtml(
          { arrayBuffer: fileData.slice(0) },
          {
            styleMap: [
              "p[style-name='Title'] => h1:fresh",
              "p[style-name='Heading 1'] => h1:fresh",
              "p[style-name='Heading 2'] => h2:fresh",
              "p[style-name='Heading 3'] => h3:fresh",
            ],
          },
        );

        if (cancelled) return;

        // Sanitize HTML — strip any script tags for security
        const sanitized = result.value
          .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
          .replace(/on\w+="[^"]*"/gi, '')
          .replace(/on\w+='[^']*'/gi, '');

        setHtml(sanitized);
        setIsLoading(false);

        const docInfo: DocumentInfo = toDocumentInfo(fileName, fileData.byteLength, 1);
        useViewerStore.getState().setTotalPages(1);
        useViewerStore.getState().setDocumentInfo(docInfo);
        onLoad?.(docInfo);
        EventBus.emit('document:loaded', docInfo);

        if (result.messages.length > 0) {
          result.messages.forEach((msg) => {
            if (msg.type === 'warning') {
              // Log warnings but don't fail
            }
          });
        }
      } catch (err) {
        if (cancelled) return;
        setIsLoading(false);
        const viewerError: ViewerError = {
          code: 'DOCX_PARSE_ERROR',
          message: err instanceof Error ? err.message : 'Failed to parse DOCX',
          format: 'docx',
          originalError: err instanceof Error ? err : undefined,
        };
        onError?.(viewerError);
        EventBus.emit('document:error', viewerError);
      }
    };

    convert();
    return () => {
      cancelled = true;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fileData, fileName, onLoad, onError]);

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center" role="status">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-blue-500" />
        <span className="sr-only">Loading document...</span>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`uv-docx-renderer h-full overflow-auto ${theme === 'dark' ? 'uv-dark bg-gray-900' : 'bg-gray-200'}`}
      style={{ padding: '24px' }}
      role="document"
      aria-label={`DOCX document: ${fileName}`}
    >
      <div
        className={styles['uv-docx-content']}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  );
}
