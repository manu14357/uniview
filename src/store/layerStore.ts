import { create } from 'zustand';
import type { CADLayer } from '../core/types';

export interface LayerStoreState {
  layers: CADLayer[];
  setLayers: (layers: CADLayer[]) => void;
  toggleVisibility: (layerId: string) => void;
  toggleLock: (layerId: string) => void;
  setLayerColor: (layerId: string, color: string) => void;
  showAll: () => void;
  hideAll: () => void;
  getVisibleLayerIds: () => string[];
}

export const useLayerStore = create<LayerStoreState>((set, get) => ({
  layers: [],

  setLayers: (layers) => set({ layers }),

  toggleVisibility: (layerId) =>
    set((state) => ({
      layers: state.layers.map((layer) =>
        layer.id === layerId ? { ...layer, visible: !layer.visible } : layer,
      ),
    })),

  toggleLock: (layerId) =>
    set((state) => ({
      layers: state.layers.map((layer) =>
        layer.id === layerId ? { ...layer, locked: !layer.locked } : layer,
      ),
    })),

  setLayerColor: (layerId, color) =>
    set((state) => ({
      layers: state.layers.map((layer) =>
        layer.id === layerId ? { ...layer, color } : layer,
      ),
    })),

  showAll: () =>
    set((state) => ({
      layers: state.layers.map((layer) => ({ ...layer, visible: true })),
    })),

  hideAll: () =>
    set((state) => ({
      layers: state.layers.map((layer) => ({ ...layer, visible: false })),
    })),

  getVisibleLayerIds: () => {
    return get()
      .layers.filter((l) => l.visible)
      .map((l) => l.id);
  },
}));
