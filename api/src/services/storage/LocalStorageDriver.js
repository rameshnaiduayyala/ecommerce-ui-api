import fs from "fs/promises";
import path from "path";
import { StorageDriver } from "./StorageDriver.js";
import { config } from "../../config/index.js";

export class LocalStorageDriver extends StorageDriver {
  constructor() {
    super();
    this.uploadDir = path.resolve(config.storage.uploadDir);
  }

  async upload(fileBuffer, destinationPath, mimeType) {
    const fullPath = path.join(this.uploadDir, destinationPath);
    const directory = path.dirname(fullPath);

    // Ensure directory exists
    await fs.mkdir(directory, { recursive: true });

    // Write file
    await fs.writeFile(fullPath, fileBuffer);

    // Return the relative URL from root
    return `/uploads/${destinationPath.replace(/\\/g, "/")}`;
  }

  async delete(filePath) {
    // If the path starts with /uploads/, extract relative component
    const normalizedPath = filePath.startsWith("/uploads/") 
      ? filePath.substring(9) 
      : filePath;

    const fullPath = path.join(this.uploadDir, normalizedPath);
    try {
      await fs.unlink(fullPath);
    } catch (err) {
      if (err.code !== "ENOENT") {
        throw err;
      }
    }
  }

  getUrl(filePath) {
    if (filePath.startsWith("http://") || filePath.startsWith("https://")) {
      return filePath;
    }
    return `/uploads/${filePath.replace(/\\/g, "/")}`;
  }
}
