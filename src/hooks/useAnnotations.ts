import { useCallback } from 'react';
import { useAnnotationStore } from '../store/annotationStore';
import { EventBus } from '../core/EventBus';
import type { Annotation, AnnotationTool } from '../core/types';

/**
 * Hook for annotation CRUD operations.
 */
export function useAnnotations() {
  const store = useAnnotationStore();

  const addAnnotation = useCallback(
    (annotation: Annotation) => {
      store.addAnnotation(annotation);
      EventBus.emit('annotation:add', annotation);
    },
    [store],
  );

  const removeAnnotation = useCallback(
    (pageNumber: number, annotationId: string) => {
      store.removeAnnotation(pageNumber, annotationId);
      EventBus.emit('annotation:remove', annotationId);
    },
    [store],
  );

  const clearAnnotations = useCallback(
    (pageNumber?: number) => {
      store.clearAnnotations(pageNumber);
      EventBus.emit('annotation:clear', undefined as never);
    },
    [store],
  );

  const setTool = useCallback(
    (tool: AnnotationTool) => {
      store.setActiveTool(tool);
    },
    [store],
  );

  const setColor = useCallback(
    (color: string) => {
      store.setActiveColor(color);
    },
    [store],
  );

  const setLineWidth = useCallback(
    (width: number) => {
      store.setActiveLineWidth(width);
    },
    [store],
  );

  const exportAsJSON = useCallback(() => {
    return JSON.stringify(store.exportAnnotations(), null, 2);
  }, [store]);

  return {
    annotations: store.annotations,
    activeTool: store.activeTool,
    activeColor: store.activeColor,
    activeLineWidth: store.activeLineWidth,
    isAnnotating: store.isAnnotating,
    getAnnotationsForPage: store.getAnnotationsForPage,

    addAnnotation,
    removeAnnotation,
    clearAnnotations,
    setTool,
    setColor,
    setLineWidth,
    setAnnotating: store.setAnnotating,
    exportAsJSON,
  };
}
