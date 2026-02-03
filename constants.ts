import { AspectRatio, QualityPreset } from './types';

export const ASPECT_RATIOS: { [key in AspectRatio]: { width: number; height: number; label: string } } = {
  '1:1': { width: 1, height: 1, label: 'Square (1:1)' },
  '9:16': { width: 9, height: 16, label: 'Portrait (9:16)' },
  '16:9': { width: 16, height: 9, label: 'Landscape (16:9)' },
  '3:4': { width: 3, height: 4, label: 'Portrait (3:4)' },
  '4:3': { width: 4, height: 3, label: 'Landscape (4:3)' },
  '1200:628': { width: 1200, height: 628, label: 'Social Post (1200x628)' },
  '900:1600': { width: 900, height: 1600, label: 'Story (900x1600)' },
};

export const RESOLUTIONS: { [key in QualityPreset]: number } = {
  '2K': 2048,
  '4K': 3840,
};

export const MAX_ZONE_2_IMAGES = 20;
export const MIN_ZONE_2_IMAGES = 2;
export const TOTAL_COLLAGES_TO_GENERATE = 20;
