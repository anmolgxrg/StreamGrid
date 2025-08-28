export interface SavedGrid {
  id: string
  name: string
  createdAt: string
  lastModified: string
  thumbnail?: string // Base64 encoded screenshot
  streams: any[]
  layout: any[]
  chats: any[]
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
