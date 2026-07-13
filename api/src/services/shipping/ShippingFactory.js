import { ShiprocketProvider } from "./ShiprocketProvider.js";

class ShippingFactory {
  constructor() {
    this.providers = {
      SHIPROCKET: new ShiprocketProvider()
    };
  }

  /**
   * Resolves appropriate logistics provider driver.
   *
   * @param {string} name - Provider name.
   * @returns {import("./ShippingProvider").ShippingProvider}
   */
  getProvider(name = "SHIPROCKET") {
    const provider = this.providers[name.toUpperCase()];
    if (!provider) {
      throw new Error(`Unsupported logistics provider: ${name}`);
    }
    return provider;
  }
}

export const shippingFactory = new ShippingFactory();
export default shippingFactory;
