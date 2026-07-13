import { OrderRepository } from "../repositories/OrderRepository.js";
import { CartRepository } from "../repositories/CartRepository.js";
import { CheckoutService } from "../services/CheckoutService.js";
import { OrderController } from "../controllers/OrderController.js";
import { authenticate, authorizeRoles } from "../middlewares/auth.js";
import { formatResponse } from "../utils/response.js";

/**
 * Fastify routes for checkout calculation and order status management.
 *
 * @param {import("fastify").FastifyInstance} fastify
 */
export default async function orderRoutes(fastify, options) {
  const orderRepository = new OrderRepository(fastify.prisma);
  const cartRepository = new CartRepository(fastify.prisma);
  const checkoutService = new CheckoutService(orderRepository, cartRepository);
  const controller = new OrderController(checkoutService, orderRepository);

  // Secure all order routes by default
  fastify.addHook("preHandler", authenticate);

  fastify.post("/checkout/calculate", {
    schema: {
      description: "Calculates subtotal, shipping, discounts and taxes for checkout.",
      tags: ["Checkout"],
      security: [{ bearerAuth: [] }]
    },
    handler: (req, rep) => controller.calculateTotals(req, rep)
  });

  fastify.post("/checkout/place", {
    schema: {
      description: "Places a secure customer order and decrements inventory atomically.",
      tags: ["Checkout"],
      security: [{ bearerAuth: [] }]
    },
    handler: (req, rep) => controller.placeOrder(req, rep)
  });

  fastify.get("/my-orders", {
    schema: {
      description: "Gets standard customer orders list history.",
      tags: ["Orders"],
      security: [{ bearerAuth: [] }],
      query: {
        type: "object",
        properties: {
          page: { type: "integer", default: 1 },
          limit: { type: "integer", default: 20 }
        }
      }
    },
    handler: (req, rep) => controller.getUserOrders(req, rep)
  });

  fastify.get("/admin/list", {
    schema: {
      description: "Gets lists of all orders (Requires Admin/Sales roles).",
      tags: ["Orders"],
      security: [{ bearerAuth: [] }],
      query: {
        type: "object",
        properties: {
          page: { type: "integer", default: 1 },
          limit: { type: "integer", default: 20 },
          status: { type: "string" }
        }
      }
    },
    preHandler: [authorizeRoles(["Super Admin", "Admin", "Sales Manager"])],
    handler: (req, rep) => controller.getAllOrders(req, rep)
  });

  fastify.get("/:id", {
    schema: {
      description: "Retrieves detailed order invoice information.",
      tags: ["Orders"],
      security: [{ bearerAuth: [] }],
      params: {
        type: "object",
        required: ["id"],
        properties: {
          id: { type: "string", format: "uuid" }
        }
      }
    },
    handler: (req, rep) => controller.getOrder(req, rep)
  });

  fastify.patch("/:id/status", {
    schema: {
      description: "Updates order status and triggers delivery timeline logs.",
      tags: ["Orders"],
      security: [{ bearerAuth: [] }],
      params: {
        type: "object",
        required: ["id"],
        properties: {
          id: { type: "string", format: "uuid" }
        }
      }
    },
    preHandler: [authorizeRoles(["Super Admin", "Admin", "Warehouse Manager", "Sales Manager"])],
    handler: (req, rep) => controller.updateStatus(req, rep)
  });

  fastify.delete("/:id", {
    schema: {
      description: "Deletes an order and its items.",
      tags: ["Orders"],
      security: [{ bearerAuth: [] }],
      params: {
        type: "object",
        required: ["id"],
        properties: {
          id: { type: "string", format: "uuid" }
        }
      }
    },
    preHandler: [authorizeRoles(["Super Admin", "Admin"])],
    handler: async (req, rep) => {
      const { id } = req.params;
      await fastify.prisma.$transaction(async (tx) => {
        await tx.orderItem.deleteMany({ where: { orderId: id } });
        await tx.orderStatusHistory.deleteMany({ where: { orderId: id } });
        await tx.transaction.deleteMany({ where: { orderId: id } });
        await tx.shipment.deleteMany({ where: { orderId: id } });
        await tx.order.delete({ where: { id } });
      });
      return formatResponse(true, "Order deleted successfully.");
    }
  });
}
