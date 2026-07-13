import { ReviewRepository } from "../repositories/ReviewRepository.js";
import { ReviewService } from "../services/ReviewService.js";
import { ReviewController } from "../controllers/ReviewController.js";
import { authenticate, authorizeRoles } from "../middlewares/auth.js";

/**
 * Fastify routes for Product Reviews and ratings.
 *
 * @param {import("fastify").FastifyInstance} fastify
 */
export default async function reviewsRoutes(fastify, options) {
  const repository = new ReviewRepository(fastify.prisma);
  // Inject prisma into the repository class instance for the verified checks
  repository.prisma = fastify.prisma;

  const service = new ReviewService(repository);
  const controller = new ReviewController(service);

  fastify.get("/product/:productId", {
    schema: {
      description: "Gets all approved public reviews for a product.",
      tags: ["Reviews"],
      params: {
        type: "object",
        required: ["productId"],
        properties: {
          productId: { type: "string", format: "uuid" }
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
    handler: (req, rep) => controller.getProductReviews(req, rep)
  });

  fastify.post("/", {
    schema: {
      description: "Submits a review for a product (Requires customer login).",
      tags: ["Reviews"],
      security: [{ bearerAuth: [] }]
    },
    preHandler: authenticate,
    handler: (req, rep) => controller.createReview(req, rep)
  });

  fastify.patch("/:id/moderate", {
    schema: {
      description: "Approves or rejects a customer review (Requires Admin/Support executive privileges).",
      tags: ["Reviews"],
      security: [{ bearerAuth: [] }],
      params: {
        type: "object",
        required: ["id"],
        properties: {
          id: { type: "string", format: "uuid" }
        }
      }
    },
    preHandler: [authenticate, authorizeRoles(["Super Admin", "Admin", "Support Executive"])],
    handler: (req, rep) => controller.moderate(req, rep)
  });
}
