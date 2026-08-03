import type { MemoryImage } from "../types/memory";
import { MEMORY_IMAGE_MAX_EDGE } from "../types/memory";

/**
 * Images, kept small.
 *
 * Same Sky has no object storage of its own — introducing one is a paid,
 * credentialed service decision outside this pass. Instead, a photo is
 * downscaled in the browser and stored as a compact data URL alongside the
 * memory it belongs to, the same way every other record in the product is
 * stored. That keeps a memory self-contained and means it can never go missing
 * because a separate bucket changed configuration.
 *
 * The trade-off is real and deliberate: this suits the meaningful handful of
 * photographs a memory holds, not a full photo library.
 */

const JPEG_QUALITY = 0.82;

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();

    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };

    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("That image could not be read."));
    };

    image.src = url;
  });
}

/**
 * Downscale a photo to at most `MEMORY_IMAGE_MAX_EDGE` on its longest edge and
 * encode it as a JPEG data URL.
 */
export async function prepareMemoryImage(file: File): Promise<MemoryImage> {
  const image = await loadImage(file);

  const scale = Math.min(1, MEMORY_IMAGE_MAX_EDGE / Math.max(image.width, image.height));
  const width = Math.round(image.width * scale);
  const height = Math.round(image.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("Your browser could not process this image.");
  }

  context.drawImage(image, 0, 0, width, height);

  const data = canvas.toDataURL("image/jpeg", JPEG_QUALITY);

  // Roughly three bytes of base64 for every four characters, minus the
  // `data:image/jpeg;base64,` prefix — accurate enough to show a person a size.
  const bytes = Math.round(((data.length - 23) * 3) / 4);

  return { data, width, height, bytes };
}
