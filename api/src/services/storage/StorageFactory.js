import { LocalStorageDriver } from "./LocalStorageDriver.js";
import { S3StorageDriver } from "./S3StorageDriver.js";
import { config } from "../../config/index.js";

class StorageFactory {
  constructor() {
    this.driverInstance = null;
  }

  /**
   * Resolves and returns the configured Storage Driver singleton.
   *
   * @returns {import("./StorageDriver").StorageDriver}
   */
  getDriver() {
    if (this.driverInstance) {
      return this.driverInstance;
    }

    const driverType = config.storage.driver;

    if (driverType === "S3") {
      this.driverInstance = new S3StorageDriver();
    } else {
      this.driverInstance = new LocalStorageDriver();
    }

    return this.driverInstance;
  }
}

export const storageFactory = new StorageFactory();
export const storageDriver = storageFactory.getDriver();
export default storageFactory;
