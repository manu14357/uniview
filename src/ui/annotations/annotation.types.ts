import type { Annotation } from '../../core/types';

export type AnnotationTool = 'select' | 'pen' | 'highlight' | 'arrow' | 'rectangle' | 'text';

export interface AnnotationLayerProps {
  pageNumber: number;
  width: number;
  height: number;
  annotations: Annotation[];
  activeTool: AnnotationTool;
  activeColor: string;
  activeLineWidth: number;
  onAddAnnotation: (annotation: Annotation) => void;
}

export const PRESET_COLORS = [
  '#FF0000',
  '#FF6600',
  '#FFCC00',
  '#00CC00',
  '#0066FF',
  '#9933FF',
  '#FF3399',
  '#000000',
];
