import { Stream, GridItem } from './stream'
import { ChatItem } from '../store/useStreamStore'

export interface SavedGrid {
  id: string
  name: string
  createdAt: string
  lastModified: string
  thumbnail?: string // Base64 encoded screenshot
  streams: Stream[]
  layout: GridItem[]
  chats: ChatItem[]
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
