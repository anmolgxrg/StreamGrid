export interface Stream {
  id: string
  name: string
  logoUrl: string
  streamUrl: string
  position?: {
    x: number
    y: number
  }
  chatId?: string // ID for associated chat window
  isLivestream?: boolean // Flag to indicate if it's a livestream
  fitMode?: 'contain' | 'cover' // Video scaling mode: 'contain' (default) or 'cover'
  // TransitiveVideo specific properties
  isTransitiveVideo?: boolean // Flag to indicate if this stream uses TransitiveVideo
  jwt?: string // JWT token for TransitiveVideo
  videoCount?: number // Number of video sources
  videoSources?: string[] // Array of video source paths
}

export interface StreamFormData {
  name: string
  logoUrl: string
  streamUrl: string
}

export interface GridItem {
  i: string
  x: number
  y: number
  w: number
  h: number
  static?: boolean
}
