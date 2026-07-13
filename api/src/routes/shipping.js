import { ShippingService } from "../services/ShippingService.js";
import { OrderRepository } from "../repositories/OrderRepository.js";
import { ShippingController } from "../controllers/ShippingController.js";
import { authenticate, authorizeRoles } from "../middlewares/auth.js";

/**
 * Fastify routes for Logistics & Shipping actions.
 *
 * @param {import("fastify").FastifyInstance} fastify
 */
export default async function shippingRoutes(fastify, options) {
  const orderRepository = new OrderRepository(fastify.prisma);
  const service = new ShippingService(orderRepository);
  const controller = new ShippingController(service);

  // Apply authentication to all shipping routes
  fastify.addHook("preHandler", authenticate);

  fastify.post("/rates", {
    schema: {
      description: "Calculates delivery charges based on parcel weight and destination coordinates.",
      tags: ["Shipping"],
      security: [{ bearerAuth: [] }]
    },
    handler: (req, rep) => controller.calculateRates(req, rep)
  });

  fastify.post("/book", {
    schema: {
      description: "Books courier pickup slot with provider (Requires Admin/Warehouse roles).",
      tags: ["Shipping"],
      security: [{ bearerAuth: [] }]
    },
    preHandler: [authorizeRoles(["Super Admin", "Admin", "Warehouse Manager"])],
    handler: (req, rep) => controller.bookShipment(req, rep)
  });

  fastify.get("/track/:trackingId", {
    schema: {
      description: "Gets real-time logistics tracking checkpoints.",
      tags: ["Shipping"],
      security: [{ bearerAuth: [] }],
      params: {
        type: "object",
        required: ["trackingId"],
        properties: {
          trackingId: { type: "string" }
        }
      },
      query: {
        type: "object",
        properties: {
          provider: { type: "string", default: "SHIPROCKET" }
        }
      }
    },
    handler: (req, rep) => controller.trackShipment(req, rep)
  });
}
