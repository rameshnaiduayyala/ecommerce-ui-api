import { CartRepository } from "../repositories/CartRepository.js";
import { ProductRepository } from "../repositories/ProductRepository.js";
import { InventoryRepository } from "../repositories/InventoryRepository.js";
import { CartService } from "../services/CartService.js";
import { CartController } from "../controllers/CartController.js";
import { authenticate, optionalAuthenticate } from "../middlewares/auth.js";

/**
 * Fastify routes for the Shopping Cart & Wishlist Module.
 *
 * @param {import("fastify").FastifyInstance} fastify
 */
export default async function cartRoutes(fastify, options) {
  const cartRepository = new CartRepository(fastify.prisma);
  const productRepository = new ProductRepository(fastify.prisma);
  const inventoryRepository = new InventoryRepository(fastify.prisma);
  
  const service = new CartService(cartRepository, productRepository, inventoryRepository);
  const controller = new CartController(service);

  // Cart operations
  fastify.get("/", {
    schema: {
      description: "Gets the active cart details. Supports optional guest cartId query.",
      tags: ["Cart"],
      query: {
        type: "object",
        properties: {
          cartId: { type: "string", format: "uuid" }
        }
      }
    },
    preHandler: optionalAuthenticate,
    handler: (req, rep) => controller.getCart(req, rep)
  });

  fastify.post("/add", {
    schema: {
      description: "Adds an item to the shopping cart, checking inventory thresholds.",
      tags: ["Cart"]
    },
    preHandler: optionalAuthenticate,
    handler: (req, rep) => controller.addItem(req, rep)
  });

  fastify.put("/items/:itemId", {
    schema: {
      description: "Updates a cart item quantity.",
      tags: ["Cart"],
      params: {
        type: "object",
        required: ["itemId"],
        properties: {
          itemId: { type: "string", format: "uuid" }
        }
      }
    },
    handler: (req, rep) => controller.updateItem(req, rep)
  });

  fastify.delete("/items/:itemId", {
    schema: {
      description: "Removes an item from the cart.",
      tags: ["Cart"],
      params: {
        type: "object",
        required: ["itemId"],
        properties: {
          itemId: { type: "string", format: "uuid" }
        }
      }
    },
    handler: (req, rep) => controller.removeItem(req, rep)
  });

  fastify.post("/merge", {
    schema: {
      description: "Merges a guest session cart into user's account cart upon login.",
      tags: ["Cart"],
      security: [{ bearerAuth: [] }]
    },
    preHandler: authenticate,
    handler: (req, rep) => controller.mergeCart(req, rep)
  });

  // Wishlist operations
  fastify.get("/wishlist", {
    schema: {
      description: "Gets user's wishlist.",
      tags: ["Wishlist"],
      security: [{ bearerAuth: [] }]
    },
    preHandler: authenticate,
    handler: (req, rep) => controller.getWishlist(req, rep)
  });

  fastify.post("/wishlist", {
    schema: {
      description: "Adds item to wishlist.",
      tags: ["Wishlist"],
      security: [{ bearerAuth: [] }]
    },
    preHandler: authenticate,
    handler: (req, rep) => controller.addToWishlist(req, rep)
  });

  fastify.delete("/wishlist/:variantId", {
    schema: {
      description: "Removes item from wishlist.",
      tags: ["Wishlist"],
      security: [{ bearerAuth: [] }],
      params: {
        type: "object",
        required: ["variantId"],
        properties: {
          variantId: { type: "string", format: "uuid" }
        }
      }
    },
    preHandler: authenticate,
    handler: (req, rep) => controller.removeFromWishlist(req, rep)
  });
}
