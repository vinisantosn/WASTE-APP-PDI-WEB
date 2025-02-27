export interface Boundbox {
  x1: number;
  x2: number;
  y1: number;
  y2: number;
  classe: string;
  confianca: number;
}

export interface ImageInput {
  getBase64(): string;
  getImageData(): ImageData;
}

export interface Detector {
  detectar: (imageInput: ImageInput, confianca: number) => Promise<Boundbox[]>;
}
