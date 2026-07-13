import { CMSRepository } from "../repositories/CMSRepository.js";
import { CMSService } from "../services/CMSService.js";
import { CMSController } from "../controllers/CMSController.js";
import { authenticate, authorizeRoles } from "../middlewares/auth.js";

/**
 * Fastify routes for CMS Pages, Blogs, and FAQs.
 *
 * @param {import("fastify").FastifyInstance} fastify
 */
export default async function cmsRoutes(fastify, options) {
  const repository = new CMSRepository(fastify.prisma);
  const service = new CMSService(repository);
  const controller = new CMSController(service);

  // Public reads
  fastify.get("/pages", {
    schema: {
      description: "Lists all CMS pages.",
      tags: ["CMS"]
    },
    handler: (req, rep) => controller.getPages(req, rep)
  });

  fastify.get("/pages/:slug", {
    schema: {
      description: "Gets detailed CMS page content by slug.",
      tags: ["CMS"],
      params: {
        type: "object",
        required: ["slug"],
        properties: {
          slug: { type: "string" }
        }
      }
    },
    handler: (req, rep) => controller.getPage(req, rep)
  });

  fastify.get("/blogs", {
    schema: {
      description: "Lists all published blogs.",
      tags: ["CMS"]
    },
    handler: (req, rep) => controller.getBlogs(req, rep)
  });

  fastify.get("/blogs/:slug", {
    schema: {
      description: "Gets detailed blog content by slug.",
      tags: ["CMS"],
      params: {
        type: "object",
        required: ["slug"],
        properties: {
          slug: { type: "string" }
        }
      }
    },
    handler: (req, rep) => controller.getBlog(req, rep)
  });

  fastify.get("/faqs", {
    schema: {
      description: "Lists FAQ questions and answers sorted.",
      tags: ["CMS"]
    },
    handler: (req, rep) => controller.getFaqs(req, rep)
  });

  // Secure writes (Requires Admin roles)
  fastify.post("/pages", {
    schema: {
      description: "Creates a new static page (Requires Admin/Marketing privileges).",
      tags: ["CMS"],
      security: [{ bearerAuth: [] }]
    },
    preHandler: [authenticate, authorizeRoles(["Super Admin", "Admin"])],
    handler: (req, rep) => controller.createPage(req, rep)
  });

  fastify.post("/blogs", {
    schema: {
      description: "Creates a new blog post.",
      tags: ["CMS"],
      security: [{ bearerAuth: [] }]
    },
    preHandler: [authenticate, authorizeRoles(["Super Admin", "Admin", "Marketing Manager"])],
    handler: (req, rep) => controller.createBlog(req, rep)
  });

  fastify.post("/faqs", {
    schema: {
      description: "Creates a new FAQ question entry.",
      tags: ["CMS"],
      security: [{ bearerAuth: [] }]
    },
    preHandler: [authenticate, authorizeRoles(["Super Admin", "Admin"])],
    handler: (req, rep) => controller.createFaq(req, rep)
  });

  // Settings Endpoints
  fastify.get("/settings", {
    schema: {
      description: "Get all store settings.",
      tags: ["CMS"]
    },
    handler: (req, rep) => controller.getSettings(req, rep)
  });

  fastify.put("/settings", {
    schema: {
      description: "Update store settings (Requires Admin privileges).",
      tags: ["CMS"],
      security: [{ bearerAuth: [] }]
    },
    preHandler: [authenticate, authorizeRoles(["Super Admin", "Admin"])],
    handler: (req, rep) => controller.updateSettings(req, rep)
  });
}
