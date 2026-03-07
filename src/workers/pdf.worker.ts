/**
 * PDF Web Worker — parses PDF documents off the main thread using PDF.js.
 */

interface WorkerMessage {
  id: string;
  type: string;
  data: unknown;
}

self.addEventListener('message', async (e: MessageEvent<WorkerMessage>) => {
  const { id, type, data } = e.data;

  try {
    switch (type) {
      case 'parse': {
        const pdfjs = await import('pdfjs-dist');
        const arrayBuffer = data as ArrayBuffer;

        const loadingTask = pdfjs.getDocument({ data: arrayBuffer });
        const pdf = await loadingTask.promise;

        const metadata = await pdf.getMetadata().catch(() => null);

        // Extract outline/bookmarks
        const outline = await pdf.getOutline().catch(() => null);

        const pages: Array<{ width: number; height: number; pageNumber: number }> = [];

        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const viewport = page.getViewport({ scale: 1 });
          pages.push({
            width: viewport.width,
            height: viewport.height,
            pageNumber: i,
          });
        }

        self.postMessage({
          id,
          type: 'result',
          data: {
            numPages: pdf.numPages,
            pages,
            metadata: metadata?.info ?? null,
            outline,
          },
        });
        break;
      }

      case 'getTextContent': {
        const pdfjs = await import('pdfjs-dist');
        const { arrayBuffer: buffer, pageNumber } = data as {
          arrayBuffer: ArrayBuffer;
          pageNumber: number;
        };

        const loadingTask = pdfjs.getDocument({ data: buffer });
        const pdf = await loadingTask.promise;
        const page = await pdf.getPage(pageNumber);
        const textContent = await page.getTextContent();

        self.postMessage({
          id,
          type: 'result',
          data: {
            items: textContent.items.map((item) => {
              if ('str' in item) {
                return {
                  text: item.str,
                  transform: item.transform,
                  width: item.width,
                  height: item.height,
                };
              }
              return null;
            }).filter(Boolean),
          },
        });
        break;
      }

      case 'search': {
        const pdfjs = await import('pdfjs-dist');
        const { arrayBuffer: searchBuffer, query } = data as {
          arrayBuffer: ArrayBuffer;
          query: string;
        };

        const loadingTask = pdfjs.getDocument({ data: searchBuffer });
        const pdf = await loadingTask.promise;
        const matches: Array<{ pageNumber: number; index: number; text: string }> = [];
        const lowerQuery = query.toLowerCase();

        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          const pageText = textContent.items
            .map((item) => ('str' in item ? item.str : ''))
            .join(' ');

          let searchIndex = 0;
          const lowerText = pageText.toLowerCase();
          while (searchIndex < lowerText.length) {
            const found = lowerText.indexOf(lowerQuery, searchIndex);
            if (found === -1) break;
            matches.push({
              pageNumber: i,
              index: found,
              text: pageText.substring(found, found + query.length),
            });
            searchIndex = found + 1;
          }
        }

        self.postMessage({ id, type: 'result', data: { matches } });
        break;
      }

      default:
        self.postMessage({
          id,
          type: 'error',
          data: { message: `Unknown message type: ${type}` },
        });
    }
  } catch (error) {
    self.postMessage({
      id,
      type: 'error',
      data: { message: error instanceof Error ? error.message : 'Worker error' },
    });
  }
});
