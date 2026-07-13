/**
 * Abstract Storage Driver defining required storage operations.
 */
export class StorageDriver {
  /**
   * Upload a file buffer to storage.
   *
   * @param {Buffer} fileBuffer - File raw binary buffer.
   * @param {string} destinationPath - Path inside storage bucket or upload folder.
   * @param {string} mimeType - File mime type.
   * @returns {Promise<string>} Fully qualified public or relative URL of the resource.
   */
  async upload(fileBuffer, destinationPath, mimeType) {
    throw new Error("Method 'upload' must be implemented.");
  }

  /**
   * Delete a file from storage.
   *
   * @param {string} filePath - Path of resource inside storage.
   * @returns {Promise<void>}
   */
  async delete(filePath) {
    throw new Error("Method 'delete' must be implemented.");
  }

  /**
   * Retrieve direct read URL.
   *
   * @param {string} filePath - Path of resource inside storage.
   * @returns {string} URL string.
   */
  getUrl(filePath) {
    throw new Error("Method 'getUrl' must be implemented.");
  }
}
