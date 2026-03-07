import { useCallback, useEffect, useRef, useState } from 'react';

interface PanState {
  x: number;
  y: number;
  isDragging: boolean;
}

interface UsePanOptions {
  /** Enable inertia after releasing drag */
  inertia?: boolean;
  /** Inertia friction coefficient (0–1, lower = more friction) */
  friction?: number;
}

/**
 * Hook for pan/drag state management with optional inertia.
 * Returns handlers to attach to a container element.
 */
export function usePan(options: UsePanOptions = {}) {
  const { inertia = true, friction = 0.95 } = options;

  const [pan, setPan] = useState<PanState>({ x: 0, y: 0, isDragging: false });
  const startPos = useRef({ x: 0, y: 0 });
  const startPan = useRef({ x: 0, y: 0 });
  const velocity = useRef({ x: 0, y: 0 });
  const lastPos = useRef({ x: 0, y: 0 });
  const animFrame = useRef<number>(0);

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    if (e.button !== 0) return; // Left click only
    e.currentTarget.setPointerCapture(e.pointerId);
    startPos.current = { x: e.clientX, y: e.clientY };
    startPan.current = { x: pan.x, y: pan.y };
    lastPos.current = { x: e.clientX, y: e.clientY };
    velocity.current = { x: 0, y: 0 };
    cancelAnimationFrame(animFrame.current);
    setPan((prev) => ({ ...prev, isDragging: true }));
  }, [pan.x, pan.y]);

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!pan.isDragging) return;
      const dx = e.clientX - startPos.current.x;
      const dy = e.clientY - startPos.current.y;
      velocity.current = {
        x: e.clientX - lastPos.current.x,
        y: e.clientY - lastPos.current.y,
      };
      lastPos.current = { x: e.clientX, y: e.clientY };
      setPan({
        x: startPan.current.x + dx,
        y: startPan.current.y + dy,
        isDragging: true,
      });
    },
    [pan.isDragging],
  );

  const onPointerUp = useCallback(() => {
    setPan((prev) => ({ ...prev, isDragging: false }));

    if (inertia && (Math.abs(velocity.current.x) > 1 || Math.abs(velocity.current.y) > 1)) {
      const animate = () => {
        velocity.current.x *= friction;
        velocity.current.y *= friction;

        if (Math.abs(velocity.current.x) < 0.5 && Math.abs(velocity.current.y) < 0.5) {
          return;
        }

        setPan((prev) => ({
          x: prev.x + velocity.current.x,
          y: prev.y + velocity.current.y,
          isDragging: false,
        }));

        animFrame.current = requestAnimationFrame(animate);
      };
      animFrame.current = requestAnimationFrame(animate);
    }
  }, [inertia, friction]);

  const resetPan = useCallback(() => {
    cancelAnimationFrame(animFrame.current);
    setPan({ x: 0, y: 0, isDragging: false });
  }, []);

  useEffect(() => {
    return () => {
      cancelAnimationFrame(animFrame.current);
    };
  }, []);

  return {
    pan,
    panHandlers: {
      onPointerDown,
      onPointerMove,
      onPointerUp,
    },
    resetPan,
  };
}
