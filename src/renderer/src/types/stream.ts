export interface Stream {
  id: string;
  name: string;
  logoUrl: string;
  streamUrl: string;
  position?: {
    x: number;
    y: number;
  };
}

export interface StreamFormData {
  name: string;
  logoUrl: string;
  streamUrl: string;
}

export interface GridItem {
  i: string;
  x: number;
  y: number;
  w: number;
  h: number;
  static?: boolean;
}
