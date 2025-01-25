import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Stream, GridItem } from '../types/stream';

interface StreamStore {
  streams: Stream[];
  layout: GridItem[];
  addStream: (stream: Stream) => void;
  removeStream: (id: string) => void;
  updateLayout: (newLayout: GridItem[]) => void;
  importStreams: (streams: Stream[], layout: GridItem[]) => void;
  exportData: () => { streams: Stream[]; layout: GridItem[] };
}

export const useStreamStore = create<StreamStore>()(
  persist(
    (set, get) => ({
      streams: [],
      layout: [],
      addStream: (stream): void =>
        set((state): { streams: Stream[]; layout: GridItem[] } => {
          const newLayout: GridItem = {
            i: stream.id,
            x: (state.streams.length * 3) % 9, // Arrange in 3x3 grid
            y: Math.floor(state.streams.length / 3) * 3,
            w: 3,
            h: 3
          };
          return {
            streams: [...state.streams, stream],
            layout: [...state.layout, newLayout]
          };
        }),
      removeStream: (id): void =>
        set((state) => ({
          streams: state.streams.filter((stream) => stream.id !== id),
          layout: state.layout.filter((item) => item.i !== id)
        })),
      updateLayout: (newLayout): void => set({ layout: newLayout }),
      importStreams: (streams, layout): void => set({ streams, layout }),
      exportData: (): { streams: Stream[]; layout: GridItem[] } => {
        const { streams, layout } = get();
        return { streams, layout };
      }
    }),
    {
      name: 'stream-grid-storage'
    }
  )
);
