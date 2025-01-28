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
