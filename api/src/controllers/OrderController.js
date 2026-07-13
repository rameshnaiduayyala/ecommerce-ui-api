import { z } from "zod";
import { formatResponse } from "../utils/response.js";

// Zod schemas
const calculateCheckoutSchema = z.object({
  cartId: z.string().uuid(),
  couponCode: z.string().optional(),
  shippingAddressId: z.string().uuid()
});

const placeOrderSchema = z.object({
  cartId: z.string().uuid(),
  couponCode: z.string().optional(),
  shippingAddressId: z.string().uuid(),
  billingAddressId: z.string().uuid().optional(),
  paymentMethod: z.string(),
  currency: z.string().optional()
});

const updateStatusSchema = z.object({
  status: z.enum(["PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED", "RETURNED"]),
  notes: z.string().optional()
});

export class OrderController {
  /**
   * @param {import("../services/CheckoutService").CheckoutService} checkoutService
   * @param {import("../repositories/OrderRepository").OrderRepository} orderRepository
   */
  constructor(checkoutService, orderRepository) {
    this.checkoutService = checkoutService;
    this.orderRepository = orderRepository;
  }

  async calculateTotals(request, reply) {
    const validated = calculateCheckoutSchema.parse(request.body);
    const userId = request.user.id;

    const totals = await this.checkoutService.calculateTotal({
      cartId: validated.cartId,
      couponCode: validated.couponCode,
      shippingAddressId: validated.shippingAddressId,
      userId
    });

    return formatResponse(true, "Checkout calculations completed.", totals);
  }

  async placeOrder(request, reply) {
    const validated = placeOrderSchema.parse(request.body);
    const userId = request.user.id;
    const idempotencyKey = request.headers['idempotency-key'] || null;

    const order = await this.checkoutService.placeOrder({
      cartId: validated.cartId,
      couponCode: validated.couponCode,
      shippingAddressId: validated.shippingAddressId,
      billingAddressId: validated.billingAddressId,
      paymentMethod: validated.paymentMethod,
      userId,
      currency: validated.currency,
      idempotencyKey
    });

    return reply.status(211).send(formatResponse(true, "Order placed successfully.", order));
  }

  async getOrder(request, reply) {
    const { id } = request.params;
    const order = await this.orderRepository.findById(id);

    // Verify ownership (Admin or owning customer can read order details)
    if (request.user.role !== "Super Admin" && request.user.role !== "Admin" && order.userId !== request.user.id) {
      return reply.status(403).send(formatResponse(false, "You are not authorized to view this order."));
    }

    return formatResponse(true, "Order details retrieved.", order);
  }

  async getUserOrders(request, reply) {
    const userId = request.user.id;
    const { page, limit } = request.query;
    const p = page ? parseInt(page, 10) : 1;
    const l = limit ? parseInt(limit, 10) : 20;
    const skip = (p - 1) * l;

    const { items, total } = await this.orderRepository.findUserOrders(userId, skip, l);
    return formatResponse(true, "Customer orders list retrieved.", items, {
      total,
      page: p,
      limit: l
    });
  }

  async getAllOrders(request, reply) {
    const { page, limit, status } = request.query;
    const p = page ? parseInt(page, 10) : 1;
    const l = limit ? parseInt(limit, 10) : 20;
    const skip = (p - 1) * l;

    const { items, total } = await this.orderRepository.findAllOrders({ status, skip, take: l });
    return formatResponse(true, "Admin orders list retrieved.", items, {
      total,
      page: p,
      limit: l
    });
  }

  async updateStatus(request, reply) {
    const { id } = request.params;
    const validated = updateStatusSchema.parse(request.body);
    const userId = request.user.id;

    const order = await this.orderRepository.updateOrderStatus(
      id,
      validated.status,
      validated.notes || `Status updated to ${validated.status}`,
      userId
    );

    return formatResponse(true, `Order status updated to ${validated.status}.`, order);
  }
}
