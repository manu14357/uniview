/**
 * DXF Web Worker — parses DXF text off the main thread.
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
        const arrayBuffer = data as ArrayBuffer;
        const decoder = new TextDecoder();
        const text = decoder.decode(arrayBuffer);

        const result = parseDXF(text);

        self.postMessage({ id, type: 'result', data: result });
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
      data: { message: error instanceof Error ? error.message : 'DXF worker error' },
    });
  }
});

interface DXFLayerInfo {
  id: string;
  name: string;
  color: string;
  visible: boolean;
  locked: boolean;
}

interface DXFEntityInfo {
  type: string;
  layer: string;
  color?: number;
  vertices?: Array<{ x: number; y: number; z?: number }>;
  center?: { x: number; y: number; z?: number };
  radius?: number;
  startAngle?: number;
  endAngle?: number;
  text?: string;
}

function parseDXF(text: string) {
  const lines = text.split('\n').map((l) => l.trim());
  const entities: DXFEntityInfo[] = [];
  const layerMap = new Map<string, DXFLayerInfo>();
  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity;

  let i = 0;
  let inEntities = false;

  while (i < lines.length) {
    const code = parseInt(lines[i], 10);
    const value = lines[i + 1] ?? '';

    if (value === 'ENTITIES') {
      inEntities = true;
      i += 2;
      continue;
    }

    if (value === 'ENDSEC' && inEntities) {
      inEntities = false;
      i += 2;
      continue;
    }

    if (inEntities && code === 0) {
      const entityType = value;

      if (['LINE', 'CIRCLE', 'ARC', 'LWPOLYLINE', 'POLYLINE', 'SPLINE', 'ELLIPSE', 'POINT'].includes(entityType)) {
        const entity: DXFEntityInfo = {
          type: entityType,
          layer: '0',
          vertices: [],
        };

        i += 2;

        while (i < lines.length) {
          const nextCode = parseInt(lines[i], 10);
          const nextValue = lines[i + 1] ?? '';

          if (nextCode === 0) break;

          switch (nextCode) {
            case 8:
              entity.layer = nextValue;
              break;
            case 62:
              entity.color = parseInt(nextValue, 10);
              break;
            case 10:
              entity.vertices = entity.vertices ?? [];
              entity.vertices.push({ x: parseFloat(nextValue), y: 0 });
              break;
            case 20:
              if (entity.vertices && entity.vertices.length > 0) {
                entity.vertices[entity.vertices.length - 1].y = parseFloat(nextValue);
              }
              break;
            case 30:
              if (entity.vertices && entity.vertices.length > 0) {
                entity.vertices[entity.vertices.length - 1].z = parseFloat(nextValue);
              }
              break;
            case 11:
              entity.vertices = entity.vertices ?? [];
              entity.vertices.push({ x: parseFloat(nextValue), y: 0 });
              break;
            case 21:
              if (entity.vertices && entity.vertices.length > 0) {
                entity.vertices[entity.vertices.length - 1].y = parseFloat(nextValue);
              }
              break;
            case 40:
              entity.radius = parseFloat(nextValue);
              break;
            case 50:
              entity.startAngle = (parseFloat(nextValue) * Math.PI) / 180;
              break;
            case 51:
              entity.endAngle = (parseFloat(nextValue) * Math.PI) / 180;
              break;
            case 1:
              entity.text = nextValue;
              break;
          }
          i += 2;
        }

        if ((entityType === 'CIRCLE' || entityType === 'ARC') && entity.vertices && entity.vertices.length > 0) {
          entity.center = entity.vertices[0];
          entity.vertices = undefined;
        }

        if (entity.vertices) {
          for (const v of entity.vertices) {
            minX = Math.min(minX, v.x);
            minY = Math.min(minY, v.y);
            maxX = Math.max(maxX, v.x);
            maxY = Math.max(maxY, v.y);
          }
        }
        if (entity.center) {
          const r = entity.radius ?? 0;
          minX = Math.min(minX, entity.center.x - r);
          minY = Math.min(minY, entity.center.y - r);
          maxX = Math.max(maxX, entity.center.x + r);
          maxY = Math.max(maxY, entity.center.y + r);
        }

        entities.push(entity);

        if (!layerMap.has(entity.layer)) {
          layerMap.set(entity.layer, {
            id: entity.layer,
            name: entity.layer,
            color: '#FFFFFF',
            visible: true,
            locked: false,
          });
        }

        continue;
      }
    }

    i += 2;
  }

  if (minX === Infinity) {
    minX = minY = 0;
    maxX = maxY = 100;
  }

  return {
    entities,
    layers: [...layerMap.values()],
    bounds: { minX, minY, maxX, maxY },
    blocks: {},
    units: 0,
  };
}
