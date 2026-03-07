import { useEffect, useCallback } from 'react';
import { useViewerContext } from '../core/ViewerContext';
import { EventBus } from '../core/EventBus';

/**
 * Global keyboard shortcut handler for the UniView viewer.
 * Registers standard keyboard shortcuts for navigation, zoom, and search.
 */
export function useKeyboardShortcuts() {
  const ctx = useViewerContext();

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      // Skip if user is typing in an input
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }

      switch (e.key) {
        case 'ArrowRight':
        case 'PageDown':
          e.preventDefault();
          ctx.goToPage(ctx.currentPage + 1);
          break;

        case 'ArrowLeft':
        case 'PageUp':
          e.preventDefault();
          ctx.goToPage(ctx.currentPage - 1);
          break;

        case 'Home':
          e.preventDefault();
          ctx.goToPage(1);
          break;

        case 'End':
          e.preventDefault();
          ctx.goToPage(ctx.totalPages);
          break;

        case '+':
        case '=':
          if (!e.ctrlKey && !e.metaKey) {
            e.preventDefault();
            ctx.setZoom(ctx.zoom * 1.25);
          }
          break;

        case '-':
          if (!e.ctrlKey && !e.metaKey) {
            e.preventDefault();
            ctx.setZoom(ctx.zoom / 1.25);
          }
          break;

        case '0':
          if (!e.ctrlKey && !e.metaKey) {
            e.preventDefault();
            ctx.setZoom(1);
          }
          break;

        case 'f':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            EventBus.emit('search:query', '');
          }
          break;

        case 'Escape':
          EventBus.emit('sidebar:toggle', false);
          break;
      }
    },
    [ctx],
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);
}
