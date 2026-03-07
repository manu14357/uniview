import { useRef, useState, useCallback, type PointerEvent } from 'react';
import type { Annotation } from '../../core/types';
import { useAnnotationStore } from '../../store/annotationStore';

interface AnnotationLayerProps {
  pageNumber: number;
  width: number;
  height: number;
}

/**
 * SVG overlay for annotation markup — renders and captures annotations.
 */
export default function AnnotationLayer({ pageNumber, width, height }: AnnotationLayerProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPath, setCurrentPath] = useState<Array<{ x: number; y: number }>>([]);
  const [startPoint, setStartPoint] = useState<{ x: number; y: number } | null>(null);

  const { activeTool, activeColor, activeLineWidth, addAnnotation } = useAnnotationStore();
  const annotations = useAnnotationStore((s) => s.annotations.get(pageNumber) ?? []);

  const getPoint = useCallback(
    (e: PointerEvent<SVGSVGElement>): { x: number; y: number } => {
      const svg = svgRef.current;
      if (!svg) return { x: 0, y: 0 };
      const rect = svg.getBoundingClientRect();
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    },
    [],
  );

  const handlePointerDown = useCallback(
    (e: PointerEvent<SVGSVGElement>) => {
      if (activeTool === 'select') return;
      const pt = getPoint(e);
      setIsDrawing(true);
      setStartPoint(pt);

      if (activeTool === 'pen' || activeTool === 'highlight') {
        setCurrentPath([pt]);
      }
    },
    [activeTool, getPoint],
  );

  const handlePointerMove = useCallback(
    (e: PointerEvent<SVGSVGElement>) => {
      if (!isDrawing) return;
      const pt = getPoint(e);

      if (activeTool === 'pen' || activeTool === 'highlight') {
        setCurrentPath((prev) => [...prev, pt]);
      }
    },
    [isDrawing, activeTool, getPoint],
  );

  const handlePointerUp = useCallback(() => {
    if (!isDrawing || !startPoint) {
      setIsDrawing(false);
      return;
    }

    const annotation: Annotation = {
      id: `ann-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      tool: activeTool,
      pageNumber,
      color: activeColor,
      lineWidth: activeLineWidth,
      createdAt: new Date(),
      data:
        activeTool === 'pen' || activeTool === 'highlight'
          ? { type: 'path' as const, points: currentPath }
          : activeTool === 'arrow'
            ? {
                type: 'path' as const,
                points: [startPoint, currentPath[currentPath.length - 1] ?? startPoint],
              }
            : activeTool === 'rectangle'
              ? {
                  type: 'shape' as const,
                  x: Math.min(startPoint.x, currentPath[currentPath.length - 1]?.x ?? startPoint.x),
                  y: Math.min(startPoint.y, currentPath[currentPath.length - 1]?.y ?? startPoint.y),
                  width: Math.abs((currentPath[currentPath.length - 1]?.x ?? startPoint.x) - startPoint.x),
                  height: Math.abs((currentPath[currentPath.length - 1]?.y ?? startPoint.y) - startPoint.y),
                }
              : { type: 'text' as const, x: startPoint.x, y: startPoint.y, content: '', fontSize: 14 },
    };

    addAnnotation(annotation);

    setIsDrawing(false);
    setCurrentPath([]);
    setStartPoint(null);
  }, [isDrawing, startPoint, currentPath, activeTool, activeColor, activeLineWidth, pageNumber, addAnnotation]);

  const renderAnnotation = (ann: Annotation) => {
    switch (ann.tool) {
      case 'pen': {
        const pathData = ann.data as { type: string; points: Array<{ x: number; y: number }> };
        if (!pathData.points || pathData.points.length < 2) return null;
        const d = pathData.points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');
        return (
          <path
            key={ann.id}
            d={d}
            stroke={ann.color}
            strokeWidth={ann.lineWidth}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        );
      }
      case 'highlight': {
        const pathData = ann.data as { type: string; points: Array<{ x: number; y: number }> };
        if (!pathData.points || pathData.points.length < 2) return null;
        const d = pathData.points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');
        return (
          <path
            key={ann.id}
            d={d}
            stroke={ann.color}
            strokeWidth={ann.lineWidth * 4}
            fill="none"
            opacity={0.3}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        );
      }
      case 'arrow': {
        const pathData = ann.data as { type: string; points: Array<{ x: number; y: number }> };
        if (!pathData.points || pathData.points.length < 2) return null;
        const [start, end] = pathData.points;
        return (
          <g key={ann.id}>
            <line
              x1={start.x}
              y1={start.y}
              x2={end.x}
              y2={end.y}
              stroke={ann.color}
              strokeWidth={ann.lineWidth}
              markerEnd="url(#arrowhead)"
            />
          </g>
        );
      }
      case 'rectangle': {
        const shapeData = ann.data as {
          type: string;
          x: number;
          y: number;
          width: number;
          height: number;
        };
        return (
          <rect
            key={ann.id}
            x={shapeData.x}
            y={shapeData.y}
            width={shapeData.width}
            height={shapeData.height}
            stroke={ann.color}
            strokeWidth={ann.lineWidth}
            fill="none"
          />
        );
      }
      case 'text': {
        const textData = ann.data as { type: string; content: string; x: number; y: number };
        return (
          <text
            key={ann.id}
            x={textData.x}
            y={textData.y}
            fill={ann.color}
            fontSize={14}
            className="select-none"
          >
            {textData.content}
          </text>
        );
      }
      default:
        return null;
    }
  };

  const renderCurrentDrawing = () => {
    if (!isDrawing || currentPath.length < 2) return null;

    if (activeTool === 'pen' || activeTool === 'highlight') {
      const d = currentPath.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');
      return (
        <path
          d={d}
          stroke={activeColor}
          strokeWidth={activeTool === 'highlight' ? activeLineWidth * 4 : activeLineWidth}
          fill="none"
          opacity={activeTool === 'highlight' ? 0.3 : 1}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      );
    }

    if (activeTool === 'arrow' && startPoint) {
      const end = currentPath[currentPath.length - 1];
      return (
        <line
          x1={startPoint.x}
          y1={startPoint.y}
          x2={end.x}
          y2={end.y}
          stroke={activeColor}
          strokeWidth={activeLineWidth}
          strokeDasharray="4 4"
        />
      );
    }

    if (activeTool === 'rectangle' && startPoint) {
      const end = currentPath[currentPath.length - 1];
      return (
        <rect
          x={Math.min(startPoint.x, end.x)}
          y={Math.min(startPoint.y, end.y)}
          width={Math.abs(end.x - startPoint.x)}
          height={Math.abs(end.y - startPoint.y)}
          stroke={activeColor}
          strokeWidth={activeLineWidth}
          fill="none"
          strokeDasharray="4 4"
        />
      );
    }

    return null;
  };

  return (
    <svg
      ref={svgRef}
      width={width}
      height={height}
      className={`absolute inset-0 ${activeTool !== 'select' ? 'cursor-crosshair' : 'pointer-events-none'}`}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      aria-label="Annotation layer"
    >
      <defs>
        <marker
          id="arrowhead"
          markerWidth="10"
          markerHeight="7"
          refX="10"
          refY="3.5"
          orient="auto"
        >
          <polygon points="0 0, 10 3.5, 0 7" fill={activeColor} />
        </marker>
      </defs>
      {annotations.map(renderAnnotation)}
      {renderCurrentDrawing()}
    </svg>
  );
}
