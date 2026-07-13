import sharp from "sharp";
import { storageDriver } from "./storage/StorageFactory.js";
import { config } from "../config/index.js";
import path from "path";

export class MediaService {
  /**
   * Process and upload an image in multiple dimensions and formats (WebP/AVIF).
   *
   * @param {Buffer} buffer - Raw image file buffer.
   * @param {string} fileName - Original filename.
   * @param {string} folder - Upload subdirectory (e.g., 'products', 'categories', 'users').
   * @returns {Promise<{ original: string, thumbnail: string, medium: string, large: string }>} Object containing URLs of the generated images.
   */
  async processAndUploadImage(buffer, fileName, folder) {
    const ext = path.extname(fileName).toLowerCase();
    const basename = path.basename(fileName, ext).replace(/[^a-zA-Z0-9]/g, "-");
    const timestamp = Date.now();
    const uploadPrefix = `${folder}/${basename}-${timestamp}`;

    // Dimensions:
    // Thumbnail: 150x150
    // Medium: 600x600
    // Large: 1200x1200
    const sizes = [
      { name: "thumbnail", width: 150, height: 150 },
      { name: "medium", width: 600, height: 600 },
      { name: "large", width: 1200, height: 1200 }
    ];

    const results = {};

    // 1. Process original image (convert to WebP to optimize)
    const originalWebp = await sharp(buffer)
      .webp({ quality: 85 })
      .toBuffer();
    
    const originalPath = `${uploadPrefix}-original.webp`;
    results.original = await storageDriver.upload(originalWebp, originalPath, "image/webp");

    // 2. Generate sizes in WebP format
    for (const size of sizes) {
      const resizedBuffer = await sharp(buffer)
        .resize({
          width: size.width,
          height: size.height,
          fit: "inside",
          withoutEnlargement: true
        })
        .webp({ quality: 80 })
        .toBuffer();

      const sizePath = `${uploadPrefix}-${size.name}.webp`;
      results[size.name] = await storageDriver.upload(resizedBuffer, sizePath, "image/webp");
    }

    return results;
  }

  /**
   * Delete media file from storage driver.
   *
   * @param {string} fileUrl - Full URL or path of media file.
   * @returns {Promise<void>}
   */
  async deleteMedia(fileUrl) {
    await storageDriver.delete(fileUrl);
  }
}

export const mediaService = new MediaService();
export default mediaService;
