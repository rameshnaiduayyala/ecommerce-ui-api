import { z } from "zod";
import { formatResponse } from "../utils/response.js";

const ratesSchema = z.object({
  orderId: z.string().uuid(),
  provider: z.string().default("SHIPROCKET")
});

const bookSchema = z.object({
  orderId: z.string().uuid(),
  provider: z.string().default("SHIPROCKET")
});

export class ShippingController {
  /**
   * @param {import("../services/ShippingService").ShippingService} shippingService
   */
  constructor(shippingService) {
    this.shippingService = shippingService;
  }

  async calculateRates(request, reply) {
    const validated = ratesSchema.parse(request.body);
    const result = await this.shippingService.calculateRates(
      validated.orderId,
      validated.provider
    );
    return formatResponse(true, "Shipping rates fetched successfully.", result);
  }

  async bookShipment(request, reply) {
    const validated = bookSchema.parse(request.body);
    const result = await this.shippingService.bookShipment(
      validated.orderId,
      validated.provider
    );
    return formatResponse(true, "Shipment booked and tracking assigned.", result);
  }

  async trackShipment(request, reply) {
    const { trackingId } = request.params;
    const { provider } = request.query;

    const result = await this.shippingService.trackShipment(
      trackingId,
      provider || "SHIPROCKET"
    );
    return formatResponse(true, "Shipment checkpoints fetched.", result);
  }
}
