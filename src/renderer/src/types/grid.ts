import { Stream, GridItem } from './stream'

export interface SavedGrid {
  id: string
  name: string
  createdAt: string
  lastModified: string
  thumbnail?: string // Base64 encoded screenshot
  streams: Stream[]
  layout: GridItem[]
  chats: any[] // Keep for compatibility but unused
}

export interface GridManifest {
  version: string
  currentGridId: string | null
  grids: Array<{
    id: string
    name: string
    createdAt: string
    lastModified: string
    streamCount: number
    fileName: string
  }>
}
