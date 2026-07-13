/**
 * Abstract Shipping Provider defining logistics actions.
 */
export class ShippingProvider {
  /**
   * Calculate shipping rates based on parameters.
   *
   * @param {object} originAddress - Warehouse address.
   * @param {object} destinationAddress - Customer delivery address.
   * @param {number} weight - Package weight in KG.
   * @returns {Promise<object>} Calculation rates list.
   */
  async calculateRate(originAddress, destinationAddress, weight) {
    throw new Error("Method 'calculateRate' must be implemented.");
  }

  /**
   * Book a shipment courier pickup slot.
   *
   * @param {string} orderId - Order identifier.
   * @param {object} originAddress - Pickup location address.
   * @param {object} destinationAddress - Delivery address.
   * @param {number} weight - Parcel weight.
   * @returns {Promise<{ trackingId: string, labelUrl: string, courierName: string }>} Shipment dispatch details.
   */
  async requestPickup(orderId, originAddress, destinationAddress, weight) {
    throw new Error("Method 'requestPickup' must be implemented.");
  }

  /**
   * Track shipment delivery status.
   *
   * @param {string} trackingId - Shipping tracking code.
   * @returns {Promise<object>} Status checkpoints.
   */
  async trackShipment(trackingId) {
    throw new Error("Method 'trackShipment' must be implemented.");
  }
}
export default ShippingProvider;
