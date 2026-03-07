/**
 * DWG Web Worker — stub file.
 * @uniview/viewer manages its own web workers internally
 * (libredwg-parser-worker, dxf-parser-worker, mtext-renderer-worker).
 * This file is kept for project structure compatibility.
 */

self.addEventListener('message', (e: MessageEvent) => {
  const { id } = e.data;
  self.postMessage({
    id,
    type: 'error',
    data: { message: 'DWG parsing is handled by @uniview/viewer internally' },
  });
});
