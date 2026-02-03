export interface UploadedImage {
  id: string;
  url: string;
  file: File;
}

export type AspectRatio = '1:1' | '9:16' | '16:9' | '3:4' | '4:3' | '1200:628' | '900:1600';

export type QualityPreset = '2K' | '4K';

export interface GenerationConfig {
  aspectRatio: AspectRatio;
  quality: QualityPreset;
}

export interface CollageResult {
  id: string;
  url: string; // Blob URL
  blob: Blob;
  name: string;
  usedImages: UploadedImage[]; // Track which images were used
}

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}
