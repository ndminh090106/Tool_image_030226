import { AspectRatio, QualityPreset, Rect, UploadedImage } from '../types';
import { ASPECT_RATIOS, RESOLUTIONS } from '../constants';

// Helper to load image
const loadImage = (url: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
};

// Helper to draw image ensuring 'object-fit: cover'
const drawImageCover = (
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number,
  y: number,
  w: number,
  h: number
) => {
  const imgRatio = img.width / img.height;
  const rectRatio = w / h;

  let renderW, renderH, renderX, renderY;

  if (imgRatio > rectRatio) {
    // Image is wider than rect
    renderH = h;
    renderW = h * imgRatio;
    renderY = y;
    renderX = x - (renderW - w) / 2;
  } else {
    // Image is taller than rect
    renderW = w;
    renderH = w / imgRatio;
    renderX = x;
    renderY = y - (renderH - h) / 2;
  }

  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  ctx.drawImage(img, renderX, renderY, renderW, renderH);
  ctx.restore();
};

// Recursive layout generator
const generateBSPLayout = (width: number, height: number, count: number): Rect[] => {
  let rects: Rect[] = [{ x: 0, y: 0, w: width, h: height }];

  while (rects.length < count) {
    // Pick the largest rect to split
    rects.sort((a, b) => b.w * b.h - a.w * a.h);
    const largest = rects.shift()!;

    const splitHorizontal = largest.w > largest.h; 
    
    // Add some randomness to split direction if aspect ratio is close to square
    const ratio = largest.w / largest.h;
    const isSquareish = ratio > 0.8 && ratio < 1.2;
    const splitDir = isSquareish ? (Math.random() > 0.5) : splitHorizontal;

    // Random split point between 30% and 70%
    const splitPercent = 0.3 + Math.random() * 0.4;

    if (splitDir) {
        // Split vertically (width gets divided)
        const w1 = Math.floor(largest.w * splitPercent);
        const w2 = largest.w - w1;
        rects.push(
            { x: largest.x, y: largest.y, w: w1, h: largest.h },
            { x: largest.x + w1, y: largest.y, w: w2, h: largest.h }
        );
    } else {
        // Split horizontally (height gets divided)
        const h1 = Math.floor(largest.h * splitPercent);
        const h2 = largest.h - h1;
        rects.push(
            { x: largest.x, y: largest.y, w: largest.w, h: h1 },
            { x: largest.x, y: largest.y + h1, w: largest.w, h: h2 }
        );
    }
  }
  return rects;
};

export const generateSingleCollage = async (
  baseImage: UploadedImage,
  randomImages: UploadedImage[],
  aspectRatio: AspectRatio,
  quality: QualityPreset,
  index: number
): Promise<{ blob: Blob; url: string; usedImages: UploadedImage[] }> => {
  // 1. Determine Dimensions
  const longSide = RESOLUTIONS[quality];
  const ar = ASPECT_RATIOS[aspectRatio];
  let width, height;

  if (ar.width >= ar.height) {
    width = longSide;
    height = Math.round(longSide * (ar.height / ar.width));
  } else {
    height = longSide;
    width = Math.round(longSide * (ar.width / ar.height));
  }

  // 2. Select Images
  // Ensure we have between 2 and 5 random images + 1 base image
  const minImages = 2;
  const maxImages = Math.min(6, randomImages.length + 1);
  const totalCount = Math.floor(Math.random() * (maxImages - minImages + 1)) + minImages;
  
  // Pick (totalCount - 1) unique images from randomImages
  const shuffled = [...randomImages].sort(() => 0.5 - Math.random());
  const selectedRandoms = shuffled.slice(0, totalCount - 1);
  // Base image + selected randoms
  const allSelected = [baseImage, ...selectedRandoms];

  // 3. Generate Layout
  const layout = generateBSPLayout(width, height, totalCount);

  // 4. Assign Images to Layout
  // Sort layout by area to find "prominent" slots (largest area first)
  const sortedLayoutIndices = layout.map((_, i) => i).sort((a, b) => {
    return (layout[b].w * layout[b].h) - (layout[a].w * layout[a].h);
  });

  // REQUIREMENT FIX: Always put the base image in the largest slot (index 0 of sorted)
  const baseImageSlotIndex = sortedLayoutIndices[0];

  // 5. Draw
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  if (!ctx) throw new Error('Could not get canvas context');

  // Fill background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);

  // Construct assignments array where index matches layout index
  const assignments: UploadedImage[] = new Array(totalCount);
  assignments[baseImageSlotIndex] = baseImage;
  
  let randomIdx = 0;
  for (let i = 0; i < totalCount; i++) {
    if (i !== baseImageSlotIndex) {
        assignments[i] = selectedRandoms[randomIdx];
        randomIdx++;
    }
  }

  // Helper to load and draw
  const processImage = async (imgData: UploadedImage, rect: Rect) => {
    const img = await loadImage(imgData.url);
    drawImageCover(ctx, img, rect.x, rect.y, rect.w, rect.h);
    
    // Optional: Add a subtle border
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = Math.max(2, width * 0.005); // dynamic border width
    ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);
  };

  await Promise.all(layout.map((rect, i) => processImage(assignments[i], rect)));

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        const url = URL.createObjectURL(blob);
        resolve({ blob, url, usedImages: allSelected });
      } else {
        reject(new Error('Canvas to Blob failed'));
      }
    }, quality === '4K' ? 'image/jpeg' : 'image/jpeg', 0.92);
  });
};
