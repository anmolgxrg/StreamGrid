import { Stream, GridItem } from '../types/stream'
import { ChatItem } from './useStreamStore'

export const selectStreams = (state: { streams: Stream[] }): Stream[] => state.streams
export const selectLayout = (state: { layout: GridItem[] }): GridItem[] => state.layout

export const selectStreamById = (state: { streams: Stream[] }, id: string): Stream | undefined =>
  state.streams.find((stream) => stream.id === id)

export const selectLayoutForStream = (
  state: { layout: GridItem[] },
  id: string
): GridItem | undefined => state.layout.find((item) => item.i === id)

export const selectStreamCount = (state: { streams: Stream[] }): number => state.streams.length

// Helper to validate imported data
export const validateImportData = (data: unknown): { isValid: boolean; error?: string } => {
  if (!data || typeof data !== 'object') {
    return { isValid: false, error: 'Invalid data format' }
  }

  const { streams, layout, chats } = data as {
    streams?: unknown
    layout?: unknown
    chats?: unknown
  }

  if (
    !Array.isArray(streams) ||
    !Array.isArray(layout) ||
    (chats !== undefined && !Array.isArray(chats))
  ) {
    return {
      isValid: false,
      error: 'Streams and layout must be arrays, and chats if present must be an array'
    }
  }

  const isValidStream = (stream: unknown): stream is Stream =>
    typeof stream === 'object' &&
    stream !== null &&
    typeof (stream as Stream).id === 'string' &&
    typeof (stream as Stream).name === 'string' &&
    typeof (stream as Stream).streamUrl === 'string' &&
    typeof (stream as Stream).logoUrl === 'string'

  const isValidLayout = (item: unknown): item is GridItem =>
    typeof item === 'object' &&
    item !== null &&
    typeof (item as GridItem).i === 'string' &&
    typeof (item as GridItem).x === 'number' &&
    typeof (item as GridItem).y === 'number' &&
    typeof (item as GridItem).w === 'number' &&
    typeof (item as GridItem).h === 'number'

  if (!streams.every(isValidStream)) {
    return { isValid: false, error: 'Invalid stream data format' }
  }

  if (!layout.every(isValidLayout)) {
    return { isValid: false, error: 'Invalid layout data format' }
  }

  if (chats) {
    const isValidChat = (chat: unknown): chat is ChatItem =>
      typeof chat === 'object' &&
      chat !== null &&
      'id' in chat &&
      'streamId' in chat &&
      'streamType' in chat &&
      'streamName' in chat &&
      'streamIdentifier' in chat &&
      typeof (chat as { id: unknown }).id === 'string' &&
      typeof (chat as { streamId: unknown }).streamId === 'string' &&
      typeof (chat as { streamType: unknown }).streamType === 'string' &&
      typeof (chat as { streamName: unknown }).streamName === 'string' &&
      typeof (chat as { streamIdentifier: unknown }).streamIdentifier === 'string'

    if (!chats.every(isValidChat)) {
      return { isValid: false, error: 'Invalid chat data format' }
    }
  }

  return { isValid: true }
}
