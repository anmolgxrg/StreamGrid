import { Stream, GridItem } from '../types/stream'

export const selectStreams = (state: { streams: Stream[] }): Stream[] => state.streams
export const selectLayout = (state: { layout: GridItem[] }): GridItem[] => state.layout

export const selectStreamById = (state: { streams: Stream[] }, id: string): Stream | undefined =>
  state.streams.find((stream) => stream.id === id)

export const selectLayoutForStream = (state: { layout: GridItem[] }, id: string): GridItem | undefined =>
  state.layout.find((item) => item.i === id)

export const selectStreamCount = (state: { streams: Stream[] }): number => state.streams.length

// Helper to validate imported data
export const validateImportData = (data: unknown): { isValid: boolean; error?: string } => {
  if (!data || typeof data !== 'object') {
    return { isValid: false, error: 'Invalid data format' }
  }

  const { streams, layout } = data as { streams?: unknown; layout?: unknown }

  if (!Array.isArray(streams) || !Array.isArray(layout)) {
    return { isValid: false, error: 'Streams and layout must be arrays' }
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

  return { isValid: true }
}
