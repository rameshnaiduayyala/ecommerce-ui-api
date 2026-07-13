import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { StorageDriver } from "./StorageDriver.js";
import { config } from "../../config/index.js";

export class S3StorageDriver extends StorageDriver {
  constructor() {
    super();
    const s3Config = {
      region: config.storage.s3.region,
      credentials: {
        accessKeyId: config.storage.s3.accessKeyId,
        secretAccessKey: config.storage.s3.secretAccessKey
      }
    };

    // If an endpoint is supplied, use it (e.g. for MinIO local dev)
    if (config.storage.s3.endpoint) {
      s3Config.endpoint = config.storage.s3.endpoint;
      s3Config.forcePathStyle = config.storage.s3.forcePathStyle;
    }

    this.client = new S3Client(s3Config);
    this.bucket = config.storage.s3.bucket;
  }

  async upload(fileBuffer, destinationPath, mimeType) {
    const cleanPath = destinationPath.replace(/\\/g, "/");
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: cleanPath,
      Body: fileBuffer,
      ContentType: mimeType
    });

    await this.client.send(command);

    return this.getUrl(cleanPath);
  }

  async delete(filePath) {
    let cleanPath = filePath;
    // Extract key from URL if absolute URL is provided
    if (filePath.startsWith("http://") || filePath.startsWith("https://")) {
      try {
        const url = new URL(filePath);
        // Pathname contains '/bucket/key' or just '/key' depending on path style
        if (config.storage.s3.endpoint) {
          // e.g. http://localhost:9000/ecommerce-bucket/subpath/file.jpg
          const parts = url.pathname.split("/").filter(Boolean);
          parts.shift(); // remove bucket
          cleanPath = parts.join("/");
        } else {
          // e.g. https://ecommerce-bucket.s3.amazonaws.com/subpath/file.jpg
          cleanPath = url.pathname.substring(1);
        }
      } catch (err) {
        // Path was not a valid URL, treat as direct key
      }
    }

    const command = new DeleteObjectCommand({
      Bucket: this.bucket,
      Key: cleanPath
    });

    await this.client.send(command);
  }

  getUrl(filePath) {
    const cleanPath = filePath.replace(/\\/g, "/");
    if (config.storage.s3.endpoint) {
      return `${config.storage.s3.endpoint}/${this.bucket}/${cleanPath}`;
    }
    return `https://${this.bucket}.s3.${config.storage.s3.region}.amazonaws.com/${cleanPath}`;
  }
}
