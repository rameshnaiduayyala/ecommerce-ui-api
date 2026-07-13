import { paymentFactory } from "./payments/PaymentFactory.js";
import { OrderRepository } from "../repositories/OrderRepository.js";
import { BadRequestError, NotFoundError } from "../utils/errors.js";

export class PaymentService {
  /**
   * @param {import("../repositories/OrderRepository").OrderRepository} orderRepository
   */
  constructor(orderRepository) {
    this.orderRepository = orderRepository;
  }

  async initiatePaymentSession(orderId, provider) {
    const order = await this.orderRepository.findById(orderId);
    if (!order) {
      throw new NotFoundError("Order not found.");
    }

    if (order.paymentStatus === "PAID") {
      throw new BadRequestError("Order has already been paid.");
    }

    const gateway = paymentFactory.getGateway(provider);
    const session = await gateway.createCharge(
      parseFloat(order.totalAmount),
      order.currency,
      order.id
    );

    // Save transaction log as PENDING
    await this.orderRepository.prisma.transaction.create({
      data: {
        orderId: order.id,
        amount: order.totalAmount,
        paymentGateway: provider.toUpperCase(),
        gatewayTransactionId: session.id,
        status: "PENDING"
      }
    });

    return session;
  }

  async verifyCallback(provider, payload, headers) {
    const gateway = paymentFactory.getGateway(provider);
    const result = await gateway.verifyPayment(payload, headers);

    if (!result.verified) {
      throw new BadRequestError("Payment verification failed.");
    }

    // Update order status in transaction block
    await this.orderRepository.prisma.$transaction(async (tx) => {
      // Find matching pending transaction log
      const transaction = await tx.transaction.findFirst({
        where: { orderId: result.orderId, paymentGateway: provider.toUpperCase(), status: "PENDING" }
      });

      const txnId = transaction ? transaction.id : null;

      if (txnId) {
        await tx.transaction.update({
          where: { id: txnId },
          data: {
            status: "PAID",
            gatewayTransactionId: result.gatewayTxnId,
            rawResponse: payload
          }
        });
      }

      await tx.order.update({
        where: { id: result.orderId },
        data: {
          paymentStatus: "PAID",
          status: "CONFIRMED"
        }
      });

      await tx.orderStatusHistory.create({
        data: {
          orderId: result.orderId,
          status: "CONFIRMED",
          notes: `Payment confirmed via ${provider}. Transaction ID: ${result.gatewayTxnId}`
        }
      });
    });

    return { orderId: result.orderId, status: "PAID" };
  }

  async processRefund(orderId, amount) {
    const order = await this.orderRepository.findById(orderId);
    if (!order || order.paymentStatus !== "PAID") {
      throw new BadRequestError("Only paid orders can be refunded.");
    }

    const transaction = await this.orderRepository.prisma.transaction.findFirst({
      where: { orderId, status: "PAID" }
    });
    if (!transaction) {
      throw new NotFoundError("Successful transaction record not found for refund.");
    }

    const gateway = paymentFactory.getGateway(transaction.paymentGateway);
    const refundDetails = await gateway.refundCharge(transaction.gatewayTransactionId, amount);

    await this.orderRepository.prisma.$transaction(async (tx) => {
      await tx.transaction.create({
        data: {
          orderId,
          amount: -amount,
          paymentGateway: transaction.paymentGateway,
          gatewayTransactionId: refundDetails.refundId,
          status: "REFUNDED",
          rawResponse: refundDetails
        }
      });

      const orderRefundStatus = amount >= parseFloat(order.totalAmount) ? "REFUNDED" : "PENDING"; // could map partial
      await tx.order.update({
        where: { id: orderId },
        data: {
          paymentStatus: orderRefundStatus,
          status: "CANCELLED"
        }
      });

      await tx.orderStatusHistory.create({
        data: {
          orderId,
          status: "CANCELLED",
          notes: `Order cancelled & refunded ($${amount}). Ref: ${refundDetails.refundId}`
        }
      });
    });
  }
}
