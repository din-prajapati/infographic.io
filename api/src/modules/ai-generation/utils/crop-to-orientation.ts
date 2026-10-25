import sharp from 'sharp';

/**
 * BL-43 — crop a listing photo to the requested canvas orientation before it is
 * sent to the Ideogram remix endpoint.
 *
 * Since BL-42 the remix call sends `image_weight` without `resolution` (the API
 * rejects the pair), so the output takes the SOURCE photo's aspect ratio. A
 * landscape photo on a 9:16 story canvas therefore came back 2560x1440 and was
 * letterboxed into ~32% of the canvas height. Cropping the photo to the target
 * aspect first restores orientation control without giving up `image_weight`.
 */

/** Width / height for each orientation the generator accepts. Mirrors V4_RESOLUTION. */
export const ORIENTATION_ASPECT: Record<string, number> = {
  landscape: 16 / 9,
  portrait: 9 / 16,
  square: 1,
};

/** A photo already this close to the target aspect is sent unchanged. */
const ASPECT_TOLERANCE = 0.01;

export interface CropBox {
  left: number;
  top: number;
  width: number;
  height: number;
}

/**
 * The largest box of `targetAspect` (width / height) that fits inside the
 * source, centred. Integer pixels, always within bounds, never larger than the
 * source — so the photo is never upscaled.
 */
export function computeCenterCrop(srcWidth: number, srcHeight: number, targetAspect: number): CropBox {
  if (srcWidth <= 0 || srcHeight <= 0 || !(targetAspect > 0)) {
    throw new Error(`Invalid crop input: ${srcWidth}x${srcHeight} @ ${targetAspect}`);
  }
  const srcAspect = srcWidth / srcHeight;

  let width: number;
  let height: number;
  if (srcAspect > targetAspect) {
    // Source is wider than the target: keep full height, trim the sides.
    height = srcHeight;
    width = Math.max(1, Math.min(srcWidth, Math.round(srcHeight * targetAspect)));
  } else {
    // Source is taller (or equal): keep full width, trim top and bottom.
    width = srcWidth;
    height = Math.max(1, Math.min(srcHeight, Math.round(srcWidth / targetAspect)));
  }

  return {
    left: Math.floor((srcWidth - width) / 2),
    top: Math.floor((srcHeight - height) / 2),
    width,
    height,
  };
}

export interface CropResult {
  buffer: Buffer;
  /** False when the photo was already within tolerance of the target aspect. */
  cropped: boolean;
  width: number;
  height: number;
}

/**
 * Crop `photo` to `orientation`'s aspect, centred. EXIF rotation is applied
 * first, so a phone photo stored sideways is cropped the way it is displayed.
 * Output keeps the input format (PNG stays PNG, everything else becomes JPEG).
 *
 * Throws if the buffer is not a decodable image or the orientation is unknown;
 * the caller decides whether that is fatal.
 */
export async function cropToOrientation(photo: Buffer, orientation: string): Promise<CropResult> {
  const targetAspect = ORIENTATION_ASPECT[orientation];
  if (!targetAspect) {
    throw new Error(`Unknown orientation: ${orientation}`);
  }

  // rotate() with no argument applies the EXIF orientation and strips the tag.
  const oriented = await sharp(photo).rotate().toBuffer({ resolveWithObject: true });
  const { width, height, format } = oriented.info;

  if (Math.abs(width / height - targetAspect) / targetAspect <= ASPECT_TOLERANCE) {
    return { buffer: oriented.data, cropped: false, width, height };
  }

  const box = computeCenterCrop(width, height, targetAspect);
  const pipeline = sharp(oriented.data).extract(box);
  const buffer = format === 'png'
    ? await pipeline.png().toBuffer()
    : await pipeline.jpeg({ quality: 92 }).toBuffer();

  return { buffer, cropped: true, width: box.width, height: box.height };
}
