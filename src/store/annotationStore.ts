import { create } from 'zustand';
import type { Annotation, AnnotationTool } from '../core/types';

export interface AnnotationStoreState {
  annotations: Map<number, Annotation[]>;
  activeTool: AnnotationTool;
  activeColor: string;
  activeLineWidth: number;
  isAnnotating: boolean;

  setActiveTool: (tool: AnnotationTool) => void;
  setActiveColor: (color: string) => void;
  setActiveLineWidth: (width: number) => void;
  setAnnotating: (active: boolean) => void;
  addAnnotation: (annotation: Annotation) => void;
  removeAnnotation: (pageNumber: number, annotationId: string) => void;
  getAnnotationsForPage: (pageNumber: number) => Annotation[];
  clearAnnotations: (pageNumber?: number) => void;
  exportAnnotations: () => Annotation[];
}

export const useAnnotationStore = create<AnnotationStoreState>((set, get) => ({
  annotations: new Map(),
  activeTool: 'select',
  activeColor: '#FF0000',
  activeLineWidth: 2,
  isAnnotating: false,

  setActiveTool: (activeTool) => set({ activeTool }),
  setActiveColor: (activeColor) => set({ activeColor }),
  setActiveLineWidth: (activeLineWidth) => set({ activeLineWidth }),
  setAnnotating: (isAnnotating) => set({ isAnnotating }),

  addAnnotation: (annotation) =>
    set((state) => {
      const newMap = new Map(state.annotations);
      const page = annotation.pageNumber;
      const existing = newMap.get(page) ?? [];
      newMap.set(page, [...existing, annotation]);
      return { annotations: newMap };
    }),

  removeAnnotation: (pageNumber, annotationId) =>
    set((state) => {
      const newMap = new Map(state.annotations);
      const existing = newMap.get(pageNumber) ?? [];
      newMap.set(
        pageNumber,
        existing.filter((a) => a.id !== annotationId),
      );
      return { annotations: newMap };
    }),

  getAnnotationsForPage: (pageNumber) => {
    return get().annotations.get(pageNumber) ?? [];
  },

  clearAnnotations: (pageNumber) =>
    set((state) => {
      if (pageNumber !== undefined) {
        const newMap = new Map(state.annotations);
        newMap.delete(pageNumber);
        return { annotations: newMap };
      }
      return { annotations: new Map() };
    }),

  exportAnnotations: () => {
    const all: Annotation[] = [];
    get().annotations.forEach((annotations) => {
      all.push(...annotations);
    });
    return all.sort((a, b) => a.pageNumber - b.pageNumber);
  },
}));
