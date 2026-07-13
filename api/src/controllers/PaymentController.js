import { z } from "zod";
import { formatResponse } from "../utils/response.js";

const initiateSchema = z.object({
  orderId: z.string().uuid(),
  provider: z.enum(["STRIPE", "RAZORPAY", "PAYPAL", "COD"])
});

const refundSchema = z.object({
  amount: z.number().positive()
});

export class PaymentController {
  /**
   * @param {import("../services/PaymentService").PaymentService} paymentService
   */
  constructor(paymentService) {
    this.paymentService = paymentService;
  }

  async initiatePayment(request, reply) {
    const validated = initiateSchema.parse(request.body);
    const session = await this.paymentService.initiatePaymentSession(
      validated.orderId,
      validated.provider
    );
    return formatResponse(true, "Payment session initiated.", session);
  }

  async handleWebhook(request, reply) {
    const { provider } = request.params;
    const payload = request.body;
    const headers = request.headers;

    const result = await this.paymentService.verifyCallback(provider, payload, headers);
    return formatResponse(true, "Payment hook handled successfully.", result);
  }

  async triggerRefund(request, reply) {
    const { orderId } = request.params;
    const validated = refundSchema.parse(request.body);

    await this.paymentService.processRefund(orderId, validated.amount);
    return formatResponse(true, "Refund processed successfully.");
  }
}
