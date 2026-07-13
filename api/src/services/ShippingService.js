import { shippingFactory } from "./shipping/ShippingFactory.js";
import { OrderRepository } from "../repositories/OrderRepository.js";
import { BadRequestError, NotFoundError } from "../utils/errors.js";

export class ShippingService {
  /**
   * @param {import("../repositories/OrderRepository").OrderRepository} orderRepository
   */
  constructor(orderRepository) {
    this.orderRepository = orderRepository;
  }

  async calculateRates(orderId, providerName = "SHIPROCKET") {
    const order = await this.orderRepository.findById(orderId);
    if (!order) {
      throw new NotFoundError("Order not found.");
    }

    const provider = shippingFactory.getProvider(providerName);
    
    // We mock warehouse origin address for rate calculations
    const originAddress = {
      city: "Chicago",
      state: "IL",
      country: "US",
      postalCode: "60601"
    };

    const weight = order.items.reduce((acc, curr) => {
      const variantWeight = curr.variant ? parseFloat(curr.variant.weight || 1.0) : 1.0;
      return acc + (variantWeight * curr.quantity);
    }, 0);

    return provider.calculateRate(originAddress, order.shippingAddress, weight);
  }

  async bookShipment(orderId, providerName = "SHIPROCKET") {
    const order = await this.orderRepository.findById(orderId);
    if (!order) {
      throw new NotFoundError("Order not found.");
    }

    if (order.shipments && order.shipments.length > 0) {
      throw new BadRequestError("Shipment booking is already active for this order.");
    }

    const provider = shippingFactory.getProvider(providerName);
    
    const originAddress = {
      city: "Chicago",
      state: "IL",
      country: "US",
      postalCode: "60601"
    };

    const weight = order.items.reduce((acc, curr) => {
      const variantWeight = curr.variant ? parseFloat(curr.variant.weight || 1.0) : 1.0;
      return acc + (variantWeight * curr.quantity);
    }, 0);

    const booking = await provider.requestPickup(
      order.id,
      originAddress,
      order.shippingAddress,
      weight
    );

    // Save shipment details in database
    await this.orderRepository.prisma.$transaction(async (tx) => {
      await tx.shipment.create({
        data: {
          orderId: order.id,
          providerName: providerName.toUpperCase(),
          trackingId: booking.trackingId,
          labelUrl: booking.labelUrl,
          status: "SHIPPED",
          rates: 15.0 // Match order flat rate
        }
      });

      await tx.order.update({
        where: { id: order.id },
        data: {
          status: "SHIPPED",
          trackingNumber: booking.trackingId
        }
      });

      await tx.orderStatusHistory.create({
        data: {
          orderId: order.id,
          status: "SHIPPED",
          notes: `Courier booked via ${booking.courierName}. Tracking: ${booking.trackingId}`
        }
      });
    });

    return booking;
  }

  async trackShipment(trackingId, providerName = "SHIPROCKET") {
    const provider = shippingFactory.getProvider(providerName);
    return provider.trackShipment(trackingId);
  }
}
export default ShippingService;
