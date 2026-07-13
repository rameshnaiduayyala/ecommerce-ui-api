import { PaymentService } from "../services/PaymentService.js";
import { OrderRepository } from "../repositories/OrderRepository.js";
import { PaymentController } from "../controllers/PaymentController.js";
import { authenticate, authorizeRoles } from "../middlewares/auth.js";

/**
 * Fastify routes for the Payment Gateway Module.
 *
 * @param {import("fastify").FastifyInstance} fastify
 */
export default async function paymentRoutes(fastify, options) {
  const orderRepository = new OrderRepository(fastify.prisma);
  const service = new PaymentService(orderRepository);
  const controller = new PaymentController(service);

  fastify.post("/initiate", {
    schema: {
      description: "Initiates a secure payment gateway checkout session.",
      tags: ["Payments"],
      security: [{ bearerAuth: [] }]
    },
    preHandler: authenticate,
    handler: (req, rep) => controller.initiatePayment(req, rep)
  });

  // Gateway webhook endpoint (must be public)
  fastify.post("/webhook/:provider", {
    schema: {
      description: "Asynchronous webhook receiver for payment provider callbacks.",
      tags: ["Payments"]
    },
    handler: (req, rep) => controller.handleWebhook(req, rep)
  });

  fastify.post("/refund/:orderId", {
    schema: {
      description: "Processes full or partial orders refunds.",
      tags: ["Payments"],
      security: [{ bearerAuth: [] }],
      params: {
        type: "object",
        required: ["orderId"],
        properties: {
          orderId: { type: "string", format: "uuid" }
        }
      }
    },
    preHandler: [authenticate, authorizeRoles(["Super Admin", "Admin", "Finance Manager"])],
    handler: (req, rep) => controller.triggerRefund(req, rep)
  });
}
