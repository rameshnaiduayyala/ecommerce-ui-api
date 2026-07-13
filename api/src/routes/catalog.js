import { ProductRepository } from "../repositories/ProductRepository.js";
import { CategoryRepository } from "../repositories/CategoryRepository.js";
import { BrandRepository } from "../repositories/BrandRepository.js";
import { ProductService } from "../services/ProductService.js";
import { CatalogController } from "../controllers/CatalogController.js";
import { authenticate, authorizeRoles } from "../middlewares/auth.js";

/**
 * Fastify routes for the Catalog (Category, Brand, Product) Module.
 *
 * @param {import("fastify").FastifyInstance} fastify
 */
export default async function catalogRoutes(fastify, options) {
  const productRepository = new ProductRepository(fastify.prisma);
  const categoryRepository = new CategoryRepository(fastify.prisma);
  const brandRepository = new BrandRepository(fastify.prisma);
  const productService = new ProductService(
    productRepository,
    categoryRepository,
    brandRepository
  );
  const controller = new CatalogController(productService);

  // Categories
  fastify.get("/categories", {
    schema: {
      description: "Gets the full nested tree structure of product categories.",
      tags: ["Catalog"]
    },
    handler: (req, rep) => controller.getCategoriesTree(req, rep)
  });

  fastify.post("/categories", {
    schema: {
      description: "Creates a new category (Requires Admin privileges).",
      tags: ["Catalog"],
      security: [{ bearerAuth: [] }]
    },
    preHandler: [authenticate, authorizeRoles(["Super Admin", "Admin"])],
    handler: (req, rep) => controller.createCategory(req, rep)
  });

  fastify.delete("/categories/:id", {
    schema: {
      description: "Deletes a category (Requires Admin privileges).",
      tags: ["Catalog"],
      security: [{ bearerAuth: [] }],
      params: {
        type: "object",
        required: ["id"],
        properties: {
          id: { type: "string", format: "uuid" }
        }
      }
    },
    preHandler: [authenticate, authorizeRoles(["Super Admin", "Admin"])],
    handler: (req, rep) => controller.deleteCategory(req, rep)
  });

  // Brands
  fastify.get("/brands", {
    schema: {
      description: "Gets a list of all active product brands.",
      tags: ["Catalog"]
    },
    handler: (req, rep) => controller.getBrands(req, rep)
  });

  fastify.post("/brands", {
    schema: {
      description: "Creates a new brand (Requires Admin privileges).",
      tags: ["Catalog"],
      security: [{ bearerAuth: [] }]
    },
    preHandler: [authenticate, authorizeRoles(["Super Admin", "Admin"])],
    handler: (req, rep) => controller.createBrand(req, rep)
  });

  // Products
  fastify.get("/products", {
    schema: {
      description: "Lists products with filters, sorting, and pagination parameters.",
      tags: ["Catalog"],
      query: {
        type: "object",
        properties: {
          search: { type: "string" },
          categoryId: { type: "string", format: "uuid" },
          brandId: { type: "string", format: "uuid" },
          minPrice: { type: "number" },
          maxPrice: { type: "number" },
          status: { type: "string" },
          skip: { type: "integer", default: 0 },
          take: { type: "integer", default: 20 },
          sortBy: { type: "string", default: "createdAt" },
          sortOrder: { type: "string", default: "desc" }
        }
      }
    },
    handler: (req, rep) => controller.getProducts(req, rep)
  });

  fastify.get("/products/:slug", {
    schema: {
      description: "Gets a single product's details using its unique SEO URL slug.",
      tags: ["Catalog"],
      params: {
        type: "object",
        required: ["slug"],
        properties: {
          slug: { type: "string" }
        }
      }
    },
    handler: (req, rep) => controller.getProductBySlug(req, rep)
  });

  fastify.post("/products", {
    schema: {
      description: "Creates a new product catalog listing with images and variants.",
      tags: ["Catalog"],
      security: [{ bearerAuth: [] }]
    },
    preHandler: [authenticate, authorizeRoles(["Super Admin", "Admin"])],
    handler: (req, rep) => controller.createProduct(req, rep)
  });

  fastify.put("/products/:id", {
    schema: {
      description: "Updates a product listing, category bounds, or attributes.",
      tags: ["Catalog"],
      security: [{ bearerAuth: [] }],
      params: {
        type: "object",
        required: ["id"],
        properties: {
          id: { type: "string", format: "uuid" }
        }
      }
    },
    preHandler: [authenticate, authorizeRoles(["Super Admin", "Admin"])],
    handler: (req, rep) => controller.updateProduct(req, rep)
  });

  fastify.delete("/products/:id", {
    schema: {
      description: "Soft-deletes a product listing.",
      tags: ["Catalog"],
      security: [{ bearerAuth: [] }],
      params: {
        type: "object",
        required: ["id"],
        properties: {
          id: { type: "string", format: "uuid" }
        }
      }
    },
    preHandler: [authenticate, authorizeRoles(["Super Admin", "Admin"])],
    handler: (req, rep) => controller.deleteProduct(req, rep)
  });
}
