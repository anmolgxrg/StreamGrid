import { create } from 'zustand'
import { persist, devtools } from 'zustand/middleware'
import { Stream, GridItem } from '../types/stream'
import { validateImportData } from './streamSelectors'

export interface ChatItem {
  id: string
  streamId: string
  streamType: string
  streamName: string
  streamIdentifier: string
}

interface StreamStore {
  streams: Stream[]
  layout: GridItem[]
  chats: ChatItem[]
  lastDraggedId: string | null
  setLastDraggedId: (id: string | null) => void
  addStream: (stream: Stream) => void
  removeStream: (id: string) => void
  updateStream: (id: string, updates: Partial<Stream>) => void
  updateLayout: (newLayout: GridItem[]) => void
  importStreams: (data: unknown) => { success: boolean; error?: string }
  exportData: () => {
    streams: Stream[]
    layout: GridItem[]
    chats: ChatItem[]
  }
  batchUpdate: (updates: Partial<{ streams: Stream[]; layout: GridItem[] }>) => void
  addChat: (streamIdentifier: string, streamId: string, streamName: string) => string
  removeChat: (id: string) => void
  removeChatsForStream: (streamId: string) => void
}

const createInitialState = (): {
  streams: Stream[]
  layout: GridItem[]
  chats: ChatItem[]
  lastDraggedId: string | null
} => ({
  streams: [],
  layout: [],
  chats: [],
  lastDraggedId: null
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
            (state) => {
              // Remove stream and its layout
              return {
                streams: state.streams.filter((stream) => stream.id !== id),
                layout: state.layout.filter((item) => item.i !== id),
                // Also remove any associated chats
                chats: state.chats.filter((chat) => chat.streamId !== id)
              }
            },
            false,
            'REMOVE_STREAM'
          ),

        updateStream: (id, updates): void =>
          set(
            (state) => ({
              streams: state.streams.map((stream) =>
                stream.id === id ? { ...stream, ...updates } : stream
              ),
              // Update stream name in chats if it changed
              chats: updates.name
                ? state.chats.map((chat) =>
                    chat.streamId === id ? { ...chat, streamName: updates.name! } : chat
                  )
                : state.chats
            }),
            false,
            'UPDATE_STREAM'
          ),

        setLastDraggedId: (id): void => set({ lastDraggedId: id }, false, 'SET_LAST_DRAGGED_ID'),

        updateLayout: (newLayout): void => {
          set({ layout: newLayout }, false, 'UPDATE_LAYOUT')
        },

        importStreams: (data): { success: boolean; error?: string } => {
          const validation = validateImportData(data)
          if (!validation.isValid) {
            return { success: false, error: validation.error }
          }

          const { streams, layout, chats } = data as {
            streams: Stream[]
            layout: GridItem[]
            chats?: ChatItem[]
          }
          set({ streams, layout, chats: chats || [] }, false, 'IMPORT_STREAMS')
          return { success: true }
        },

        addChat: (streamIdentifier, streamId, streamName): string => {
          const id = `chat-${Date.now()}`
          const stream = get().streams.find((s) => s.id === streamId)
          if (!stream) return id

          const streamType =
            stream.streamUrl.includes('youtube.com') || stream.streamUrl.includes('youtu.be')
              ? 'YouTube'
              : stream.streamUrl.includes('twitch.tv')
                ? 'Twitch'
                : ''

          if (!streamType) return id

          set(
            (state) => {
              const newLayout: GridItem = {
                i: id,
                x: (state.layout.length * 3) % 9,
                y: Math.floor(state.layout.length / 3) * 3,
                w: 2,
                h: 3
              }
              return {
                chats: [...state.chats, { id, streamId, streamType, streamName, streamIdentifier }],
                layout: [...state.layout, newLayout]
              }
            },
            false,
            'ADD_CHAT'
          )
          return id
        },

        removeChat: (id): void =>
          set(
            (state) => ({
              chats: state.chats.filter((chat) => chat.id !== id),
              layout: state.layout.filter((item) => item.i !== id)
            }),
            false,
            'REMOVE_CHAT'
          ),

        removeChatsForStream: (streamId): void =>
          set(
            (state) => ({
              chats: state.chats.filter((chat) => chat.streamId !== streamId),
              layout: state.layout.filter(
                (item) =>
                  !state.chats.find((chat) => chat.streamId === streamId && chat.id === item.i)
              )
            }),
            false,
            'REMOVE_CHATS_FOR_STREAM'
          ),

        exportData: (): {
          streams: Stream[]
          layout: GridItem[]
          chats: ChatItem[]
        } => {
          const { streams, layout, chats } = get()
          return { streams, layout, chats }
        }
      }),
      {
        name: 'stream-grid-storage',
        version: 1
      }
    )
  )
)
