import { create } from 'zustand'
import { persist, devtools } from 'zustand/middleware'
import { Stream, GridItem } from '../types/stream'
import { validateImportData } from './streamSelectors'

interface StreamStore {
  streams: Stream[]
  layout: GridItem[]
  addStream: (stream: Stream) => void
  removeStream: (id: string) => void
  updateStream: (id: string, updates: Partial<Stream>) => void
  updateLayout: (newLayout: GridItem[]) => void
  importStreams: (data: unknown) => { success: boolean; error?: string }
  exportData: () => { streams: Stream[]; layout: GridItem[] }
  batchUpdate: (updates: Partial<{ streams: Stream[]; layout: GridItem[] }>) => void
}

const createInitialState = (): { streams: Stream[]; layout: GridItem[] } => ({
  streams: [],
  layout: []
})

export const useStreamStore = create<StreamStore>()(
  devtools(
    persist(
      (set, get) => ({
        ...createInitialState(),

        batchUpdate: (updates): void => {
          set(
            (state) => ({
              ...state,
              ...updates
            }),
            false,
            'BATCH_UPDATE'
          )
        },

        addStream: (stream): void =>
          set(
            (state) => {
              const newLayout: GridItem = {
                i: stream.id,
                x: (state.streams.length * 3) % 9,
                y: Math.floor(state.streams.length / 3) * 3,
                w: 3,
                h: 3
              }
              return {
                streams: [...state.streams, stream],
                layout: [...state.layout, newLayout]
              }
            },
            false,
            'ADD_STREAM'
          ),

        removeStream: (id): void =>
          set(
            (state) => ({
              streams: state.streams.filter((stream) => stream.id !== id),
              layout: state.layout.filter((item) => item.i !== id)
            }),
            false,
            'REMOVE_STREAM'
          ),

        updateStream: (id, updates): void =>
          set(
            (state) => ({
              streams: state.streams.map((stream) =>
                stream.id === id ? { ...stream, ...updates } : stream
              )
            }),
            false,
            'UPDATE_STREAM'
          ),
        //return get();
        updateLayout: (newLayout): void => set({ layout: newLayout }, false, 'UPDATE_LAYOUT'),

        importStreams: (data): { success: boolean; error?: string } => {
          const validation = validateImportData(data)
          if (!validation.isValid) {
            return { success: false, error: validation.error }
          }

          const { streams, layout } = data as { streams: Stream[]; layout: GridItem[] }
          set({ streams, layout }, false, 'IMPORT_STREAMS')
          return { success: true }
        },

        exportData: (): { streams: Stream[]; layout: GridItem[] } => {
          const { streams, layout } = get()
          return { streams, layout }
        }
      }),
      {
        name: 'stream-grid-storage',
        version: 1
      }
    )
  )
)
