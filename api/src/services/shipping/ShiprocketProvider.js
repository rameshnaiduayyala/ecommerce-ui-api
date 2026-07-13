import { ShippingProvider } from "./ShippingProvider.js";
import { config } from "../../config/index.js";

export class ShiprocketProvider extends ShippingProvider {
  constructor() {
    super();
    this.email = config.shipping.shiprocket.email;
    this.password = config.shipping.shiprocket.password;
  }

  async calculateRate(originAddress, destinationAddress, weight) {
    console.log(`[MOCK SHIPROCKET] Calculating rates from ${originAddress.city} to ${destinationAddress.city} for weight ${weight}kg`);
    return {
      rates: [
        { courier: "Delhivery Air", charge: 12.50, etd: "3 Days" },
        { courier: "BlueDart Express", charge: 18.00, etd: "2 Days" },
        { courier: "FedEx Ground", charge: 9.00, etd: "5 Days" }
      ]
    };
  }

  async requestPickup(orderId, originAddress, destinationAddress, weight) {
    console.log(`[MOCK SHIPROCKET] Requesting parcel pickup for Order ${orderId}`);
    return {
      trackingId: `SRK-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`,
      labelUrl: "https://shiprocket.co/mock-shipping-label.pdf",
      courierName: "Delhivery Air"
    };
  }

  async trackShipment(trackingId) {
    return {
      trackingId,
      status: "IN_TRANSIT",
      checkpoints: [
        { time: new Date(), location: "Origin Facility", activity: "Package picked up by courier." }
      ]
    };
  }
}
export default ShiprocketProvider;
