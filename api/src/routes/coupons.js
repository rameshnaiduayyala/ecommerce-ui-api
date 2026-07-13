import { CouponRepository } from "../repositories/CouponRepository.js";
import { CouponService } from "../services/CouponService.js";
import { CouponController } from "../controllers/CouponController.js";
import { authenticate, authorizeRoles, optionalAuthenticate } from "../middlewares/auth.js";
import { formatResponse } from "../utils/response.js";

/**
 * Fastify routes for Coupon codes operations.
 *
 * @param {import("fastify").FastifyInstance} fastify
 */
export default async function couponRoutes(fastify, options) {
  const repository = new CouponRepository(fastify.prisma);
  repository.prisma = fastify.prisma;

  const service = new CouponService(repository);
  const controller = new CouponController(service);

  // Marketing operations
  fastify.get("/", {
    schema: {
      description: "Lists all coupons created (Requires Admin/Marketing privileges).",
      tags: ["Coupons"],
      security: [{ bearerAuth: [] }]
    },
    preHandler: [authenticate, authorizeRoles(["Super Admin", "Admin", "Marketing Manager"])],
    handler: (req, rep) => controller.getCoupons(req, rep)
  });

  fastify.post("/", {
    schema: {
      description: "Creates a new coupon discount scheme.",
      tags: ["Coupons"],
      security: [{ bearerAuth: [] }]
    },
    preHandler: [authenticate, authorizeRoles(["Super Admin", "Admin", "Marketing Manager"])],
    handler: (req, rep) => controller.createCoupon(req, rep)
  });

  fastify.put("/:id/toggle", {
    schema: {
      description: "Activates or deactivates a coupon.",
      tags: ["Coupons"],
      security: [{ bearerAuth: [] }],
      params: {
        type: "object",
        required: ["id"],
        properties: {
          id: { type: "string", format: "uuid" }
        }
      }
    },
    preHandler: [authenticate, authorizeRoles(["Super Admin", "Admin", "Marketing Manager"])],
    handler: (req, rep) => controller.toggleCoupon(req, rep)
  });

  // Client validation endpoint
  fastify.post("/validate", {
    schema: {
      description: "Validates a coupon code during checkout (Supports guest).",
      tags: ["Coupons"]
    },
    preHandler: optionalAuthenticate,
    handler: (req, rep) => controller.validateCoupon(req, rep)
  });

  fastify.delete("/:code", {
    schema: {
      description: "Deletes a coupon by code.",
      tags: ["Coupons"],
      security: [{ bearerAuth: [] }],
      params: {
        type: "object",
        required: ["code"],
        properties: {
          code: { type: "string" }
        }
      }
    },
    preHandler: [authenticate, authorizeRoles(["Super Admin", "Admin", "Marketing Manager"])],
    handler: async (req, rep) => {
      const { code } = req.params;
      try {
        await fastify.prisma.coupon.delete({ where: { code } });
        return formatResponse(true, "Coupon deleted successfully.");
      } catch (err) {
        return rep.status(404).send(formatResponse(false, "Coupon not found."));
      }
    }
  });
}
