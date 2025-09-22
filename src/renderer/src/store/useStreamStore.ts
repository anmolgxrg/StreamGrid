import { create } from 'zustand'
import { persist, devtools } from 'zustand/middleware'
import { Stream, GridItem } from '../types/stream'
import { validateImportData } from './streamSelectors'
import { SavedGrid } from '../types/grid'

// Define ChatItem type for compatibility
export interface ChatItem {
  id: string
  streamId: string
  streamType: string
  streamName: string
  streamIdentifier: string
}

interface StreamStore {
  streams: Stream[];
  layout: GridItem[];
  lastDraggedId: string | null; // Grid management
  currentGridId: string | null;
  currentGridName: string;
  hasUnsavedChanges: boolean;
  recentGridIds: string[];
  isSaving: boolean; // Core stream methods

  setLastDraggedId: (id: string | null) => void;
  updateStream: (id: string, updates: Partial<Stream>) => void;
  updateLayout: (newLayout: GridItem[]) => void;
  importStreams: (data: unknown) => {
    success: boolean;
    error?: string;
  };

  exportData: () => {
    streams: Stream[];
    layout: GridItem[];
  };

  batchUpdate: (updates: Partial<{
    streams: Stream[];
    layout: GridItem[];
  }>) => void;
  loadExampleData: () => void; // Grid management methods
  saveCurrentGrid: (name?: string) => Promise<SavedGrid>;
  loadGrid: (gridId: string) => Promise<void>;
  deleteGrid: (gridId: string) => Promise<void>;
  renameGrid: (gridId: string, newName: string) => Promise<void>;
  createNewGrid: (name: string) => void;
  setCurrentGridName: (name: string) => void;
  markAsUnsaved: () => void;
  markAsSaved: () => void;
  updateRecentGrids: (gridId: string) => void;
}

const getExampleStreams = (): Stream[] => [
  {
    id: 'example-1',
    name: 'Transitive Robot Cameras',
    logoUrl: 'https://via.placeholder.com/64x64/FF6B6B/FFFFFF?text=🤖',
    streamUrl: '',
    isLivestream: false,
    fitMode: 'contain',
    jwt: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImZseXdoZWVsIiwiZGV2aWNlIjoiZF84ZGQzMTQzN2E2IiwiY2FwYWJpbGl0eSI6IkB0cmFuc2l0aXZlLXJvYm90aWNzL3JlbW90ZS10ZWxlb3AiLCJ2YWxpZGl0eSI6ODY0MDAsImlhdCI6MTc1ODQyNTgxM30.SAuMm6YGIe6yx-nvA2M_ETZpPQe5LpPDyTghzXS3gHM',
    videoCount: 6,
    videoSources: ['/cam1', '/cam2', '/cam3', '/cam4', '/cam5', '/cam6']
  },
  {
    id: 'example-2',
    name: 'Example Video 1',
    logoUrl: 'https://via.placeholder.com/64x64/4ECDC4/FFFFFF?text=1',
    streamUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    isLivestream: false,
    fitMode: 'contain'
  },
  {
    id: 'example-3',
    name: 'Example Video 2',
    logoUrl: 'https://via.placeholder.com/64x64/45B7D1/FFFFFF?text=2',
    streamUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    isLivestream: false,
    fitMode: 'contain'
  },
  {
    id: 'example-4',
    name: 'Example Video 3',
    logoUrl: 'https://via.placeholder.com/64x64/96CEB4/FFFFFF?text=3',
    streamUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    isLivestream: false,
    fitMode: 'contain'
  },
  {
    id: 'example-5',
    name: 'Example Video 4',
    logoUrl: 'https://via.placeholder.com/64x64/FFEAA7/FFFFFF?text=4',
    streamUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
    isLivestream: false,
    fitMode: 'contain'
  },
  {
    id: 'example-6',
    name: 'Example Video 5',
    logoUrl: 'https://via.placeholder.com/64x64/DDA0DD/FFFFFF?text=5',
    streamUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
    isLivestream: false,
    fitMode: 'contain'
  }
];

const getExampleLayout = (): GridItem[] => [
  {
    i: 'example-1', x: 0, y: 0, w: 6, h: 4
  },
  // TransitiveVideo gets more space
  {
    i: 'example-2', x: 6, y: 0, w: 3, h: 2
  },
  {
    i: 'example-3', x: 9, y: 0, w: 3, h: 2
  },
  {
    i: 'example-4', x: 6, y: 2, w: 3, h: 2
  },
  {
    i: 'example-5', x: 9, y: 2, w: 3, h: 2
  },
  {
    i: 'example-6', x: 0, y: 4, w: 6, h: 2
  }
];

const createInitialState = (): {
  streams: Stream[];
  layout: GridItem[];
  lastDraggedId: string | null;
  currentGridId: string | null;
  currentGridName: string;
  hasUnsavedChanges: boolean;
  recentGridIds: string[];
  isSaving: boolean;
} => {
  // Check if there's saved data in localStorage
  const savedData = localStorage.getItem('stream-grid-storage');
  if (savedData) {
    try {
      const parsed = JSON.parse(savedData);
      // If there are no streams, use example data
      if (!parsed.state?.streams || parsed.state.streams.length === 0) {
        return {
          streams: getExampleStreams(),
          layout: getExampleLayout(),
          lastDraggedId: null,
          currentGridId: null,
          currentGridName: 'Example Grid',
          hasUnsavedChanges: false,
          recentGridIds: [],
          isSaving: false
        };
      }

      // Return saved data
      return {
        streams: parsed.state.streams || [],
        layout: parsed.state.layout || [],
        lastDraggedId: null,
        currentGridId: parsed.state.currentGridId || null,
        currentGridName: parsed.state.currentGridName || 'Example Grid',
        hasUnsavedChanges: false,
        recentGridIds: parsed.state.recentGridIds || [],
        isSaving: false
      };
    } catch (error) {
      console.error('Error parsing saved data:', error);
    }
  }

  // No saved data, use example data
  return {
    streams: getExampleStreams(),
    layout: getExampleLayout(),
    lastDraggedId: null,
    currentGridId: null,
    currentGridName: 'Example Grid',
    hasUnsavedChanges: false,
    recentGridIds: [],
    isSaving: false
  };
};

export const useStreamStore = create<StreamStore>()(
  devtools(
    persist(
      (set, get) => ({
        ...createInitialState(),

        batchUpdate: (updates): void => {
          set((state) => ({
            ...state,
            ...updates
          }),
          false,
          'BATCH_UPDATE'
          );
        },

        updateStream: (id, updates): void => set((state) => ({
          streams: state.streams.map((stream) => stream.id === id ? {
            ...stream, ...updates
          } : stream),
          hasUnsavedChanges: true
        }),
        false,
        'UPDATE_STREAM'
        ),

        setLastDraggedId: (id): void => set({
          lastDraggedId: id
        },
        false, 'SET_LAST_DRAGGED_ID'),

        updateLayout: (newLayout): void => {
          set({
            layout: newLayout, 
            hasUnsavedChanges: true
          },
          false, 'UPDATE_LAYOUT');
        },

        importStreams: (data): { success: boolean; error?: string } => {
          try {
            const validation = validateImportData(data);
            if (!validation.isValid) {
              return { success: false, error: validation.error };
            }

            const { streams, layout } = data as { streams: Stream[]; layout: GridItem[] };
            set({
              streams,
              layout,
              hasUnsavedChanges: true
            }, false, 'IMPORT_STREAMS');

            return { success: true };
          } catch (error) {
            return { 
              success: false, 
              error: error instanceof Error ? error.message : 'Unknown error' 
            };
          }
        },

        exportData: () => {
          const state = get();
          return {
            streams: state.streams,
            layout: state.layout
          };
        },

        loadExampleData: (): void => {
          set({
            streams: getExampleStreams(),
            layout: getExampleLayout(),
            hasUnsavedChanges: true
          }, false, 'LOAD_EXAMPLE_DATA');
        },

        saveCurrentGrid: async (name?: string): Promise<SavedGrid> => {
          const state = get();
          const gridName = name || state.currentGridName || 'Untitled Grid';
          const gridId = state.currentGridId || `grid-${Date.now()}`;
          
          const savedGrid: SavedGrid = {
            id: gridId,
            name: gridName,
            streams: state.streams,
            layout: state.layout,
            createdAt: new Date().toISOString(),
            lastModified: new Date().toISOString(),
            chats: []
          };

          // Save to localStorage
          const savedGrids = JSON.parse(localStorage.getItem('saved-grids') || '[]');
          const existingIndex = savedGrids.findIndex((grid: SavedGrid) => grid.id === gridId);
          
          if (existingIndex >= 0) {
            savedGrids[existingIndex] = savedGrid;
          } else {
            savedGrids.push(savedGrid);
          }
          
          localStorage.setItem('saved-grids', JSON.stringify(savedGrids));

          set({
            currentGridId: gridId,
            currentGridName: gridName,
            hasUnsavedChanges: false
          }, false, 'SAVE_CURRENT_GRID');

          return savedGrid;
        },

        loadGrid: async (gridId: string): Promise<void> => {
          const savedGrids = JSON.parse(localStorage.getItem('saved-grids') || '[]');
          const grid = savedGrids.find((g: SavedGrid) => g.id === gridId);
          
          if (!grid) {
            throw new Error('Grid not found');
          }

          set({
            streams: grid.streams,
            layout: grid.layout,
            currentGridId: gridId,
            currentGridName: grid.name,
            hasUnsavedChanges: false
          }, false, 'LOAD_GRID');

          // Update recent grids
          get().updateRecentGrids(gridId);
        },

        deleteGrid: async (gridId: string): Promise<void> => {
          const savedGrids = JSON.parse(localStorage.getItem('saved-grids') || '[]');
          const filteredGrids = savedGrids.filter((g: SavedGrid) => g.id !== gridId);
          localStorage.setItem('saved-grids', JSON.stringify(filteredGrids));

          // If we're deleting the current grid, reset to example data
          const state = get();
          if (state.currentGridId === gridId) {
            set({
              streams: getExampleStreams(),
              layout: getExampleLayout(),
              currentGridId: null,
              currentGridName: 'Example Grid',
              hasUnsavedChanges: false
            }, false, 'DELETE_CURRENT_GRID');
          }

          // Remove from recent grids
          set((state) => ({
            recentGridIds: state.recentGridIds.filter(id => id !== gridId)
          }), false, 'REMOVE_FROM_RECENT_GRIDS');
        },

        renameGrid: async (gridId: string, newName: string): Promise<void> => {
          const savedGrids = JSON.parse(localStorage.getItem('saved-grids') || '[]');
          const gridIndex = savedGrids.findIndex((g: SavedGrid) => g.id === gridId);
          
          if (gridIndex >= 0) {
            savedGrids[gridIndex].name = newName;
            savedGrids[gridIndex].lastModified = new Date().toISOString();
            localStorage.setItem('saved-grids', JSON.stringify(savedGrids));

            // Update current grid name if it's the active one
            const state = get();
            if (state.currentGridId === gridId) {
              set({ currentGridName: newName }, false, 'RENAME_CURRENT_GRID');
            }
          }
        },

        createNewGrid: (name: string): void => {
          const gridId = `grid-${Date.now()}`;
          set({
            streams: [],
            layout: [],
            currentGridId: gridId,
            currentGridName: name,
            hasUnsavedChanges: false
          }, false, 'CREATE_NEW_GRID');
        },

        setCurrentGridName: (name: string): void => {
          set({ currentGridName: name }, false, 'SET_CURRENT_GRID_NAME');
        },

        markAsUnsaved: (): void => {
          set({ hasUnsavedChanges: true }, false, 'MARK_AS_UNSAVED');
        },

        markAsSaved: (): void => {
          set({ hasUnsavedChanges: false }, false, 'MARK_AS_SAVED');
        },

        updateRecentGrids: (gridId: string): void => {
          set((state) => ({
            recentGridIds: [gridId, ...state.recentGridIds.filter(id => id !== gridId)].slice(0, 10)
          }), false, 'UPDATE_RECENT_GRIDS');
        }
      }),
      {
        name: 'stream-grid-storage',
        version: 1,
        partialize: (state) => ({
          streams: state.streams,
          layout: state.layout,
          currentGridId: state.currentGridId,
          currentGridName: state.currentGridName,
          recentGridIds: state.recentGridIds
        })
      }
    ),
    {
      name: 'stream-grid-devtools'
    }
  )
);