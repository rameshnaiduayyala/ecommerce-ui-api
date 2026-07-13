import { InventoryRepository } from "../repositories/InventoryRepository.js";
import { InventoryService } from "../services/InventoryService.js";
import { InventoryController } from "../controllers/InventoryController.js";
import { authenticate, authorizeRoles } from "../middlewares/auth.js";

/**
 * Fastify routes for the Inventory & Warehousing Module.
 *
 * @param {import("fastify").FastifyInstance} fastify
 */
export default async function inventoryRoutes(fastify, options) {
  const repository = new InventoryRepository(fastify.prisma);
  const service = new InventoryService(repository);
  const controller = new InventoryController(service);

  // Apply general authentication guard to all inventory routes
  fastify.addHook("preHandler", authenticate);

  fastify.get("/warehouses", {
    schema: {
      description: "Lists active warehouse facilities.",
      tags: ["Inventory"],
      security: [{ bearerAuth: [] }]
    },
    preHandler: [authorizeRoles(["Super Admin", "Admin", "Warehouse Manager"])],
    handler: (req, rep) => controller.getWarehouses(req, rep)
  });

  fastify.post("/warehouses", {
    schema: {
      description: "Registers a new warehouse storage facility.",
      tags: ["Inventory"],
      security: [{ bearerAuth: [] }]
    },
    preHandler: [authorizeRoles(["Super Admin", "Admin"])],
    handler: (req, rep) => controller.createWarehouse(req, rep)
  });

  fastify.post("/adjust", {
    schema: {
      description: "Adjusts stock balances at a specific warehouse location.",
      tags: ["Inventory"],
      security: [{ bearerAuth: [] }]
    },
    preHandler: [authorizeRoles(["Super Admin", "Admin", "Warehouse Manager"])],
    handler: (req, rep) => controller.adjustStock(req, rep)
  });

  fastify.post("/transfer", {
    schema: {
      description: "Initiates stock allocation transfer from one warehouse to another.",
      tags: ["Inventory"],
      security: [{ bearerAuth: [] }]
    },
    preHandler: [authorizeRoles(["Super Admin", "Admin", "Warehouse Manager"])],
    handler: (req, rep) => controller.initiateTransfer(req, rep)
  });

  fastify.put("/transfer/:id/receive", {
    schema: {
      description: "Processes arrival and updates stock quantities at target warehouse.",
      tags: ["Inventory"],
      security: [{ bearerAuth: [] }],
      params: {
        type: "object",
        required: ["id"],
        properties: {
          id: { type: "string", format: "uuid" }
        }
      }
    },
    preHandler: [authorizeRoles(["Super Admin", "Admin", "Warehouse Manager"])],
    handler: (req, rep) => controller.receiveTransfer(req, rep)
  });

  fastify.get("/variants/:variantId", {
    schema: {
      description: "Retrieves stock balance listings across all warehouses for a product variant.",
      tags: ["Inventory"],
      security: [{ bearerAuth: [] }],
      params: {
        type: "object",
        required: ["variantId"],
        properties: {
          variantId: { type: "string", format: "uuid" }
        }
      }
    },
    preHandler: [authorizeRoles(["Super Admin", "Admin", "Warehouse Manager"])],
    handler: (req, rep) => controller.getVariantStock(req, rep)
  });

  fastify.get("/history/:warehouseId/:variantId", {
    schema: {
      description: "Gets the stock movement log for audit purposes.",
      tags: ["Inventory"],
      security: [{ bearerAuth: [] }],
      params: {
        type: "object",
        required: ["warehouseId", "variantId"],
        properties: {
          warehouseId: { type: "string", format: "uuid" },
          variantId: { type: "string", format: "uuid" }
        }
      },
      query: {
        type: "object",
        properties: {
          page: { type: "integer", default: 1 },
          limit: { type: "integer", default: 20 }
        }
      }
    },
    preHandler: [authorizeRoles(["Super Admin", "Admin", "Warehouse Manager"])],
    handler: (req, rep) => controller.getStockHistory(req, rep)
  });
}
