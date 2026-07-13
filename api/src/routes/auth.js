import { UserRepository } from "../repositories/UserRepository.js";
import { AuthService } from "../services/AuthService.js";
import { AuthController } from "../controllers/AuthController.js";
import { authenticate } from "../middlewares/auth.js";

/**
 * Fastify routes for the Authentication Module.
 *
 * @param {import("fastify").FastifyInstance} fastify
 */
export default async function authRoutes(fastify, options) {
  // Instantiating Repository, Service & Controller
  const userRepository = new UserRepository(fastify.prisma);
  const authService = new AuthService(userRepository);
  const controller = new AuthController(authService);

  // Route definitions with Swagger schema specifications
  fastify.post("/register", {
    schema: {
      description: "Registers a new customer or administrator in the store.",
      tags: ["Auth"],
      body: {
        type: "object",
        required: ["email", "password", "firstName", "lastName"],
        properties: {
          email: { type: "string", format: "email" },
          password: { type: "string", minLength: 8 },
          firstName: { type: "string" },
          lastName: { type: "string" },
          phone: { type: "string" },
          roleId: { type: "string", format: "uuid" }
        }
      }
    },
    handler: (req, rep) => controller.register(req, rep)
  });

  fastify.post("/login", {
    schema: {
      description: "Authenticates users and starts a secure session.",
      tags: ["Auth"],
      body: {
        type: "object",
        required: ["email", "password"],
        properties: {
          email: { type: "string", format: "email" },
          password: { type: "string" },
          deviceId: { type: "string" },
          deviceName: { type: "string" }
        }
      }
    },
    handler: (req, rep) => controller.login(req, rep)
  });

  fastify.post("/refresh", {
    schema: {
      description: "Refreshes an expired access token using JWT rotation.",
      tags: ["Auth"],
      body: {
        type: "object",
        required: ["refreshToken"],
        properties: {
          refreshToken: { type: "string" }
        }
      }
    },
    handler: (req, rep) => controller.refresh(req, rep)
  });

  fastify.post("/logout", {
    schema: {
      description: "Ends session and invalidates refresh token.",
      tags: ["Auth"],
      body: {
        type: "object",
        required: ["refreshToken"],
        properties: {
          refreshToken: { type: "string" }
        }
      }
    },
    handler: (req, rep) => controller.logout(req, rep)
  });

  fastify.post("/otp/request", {
    schema: {
      description: "Sends email verification code to user.",
      tags: ["Auth"],
      body: {
        type: "object",
        required: ["email"],
        properties: {
          email: { type: "string", format: "email" }
        }
      }
    },
    handler: (req, rep) => controller.requestOtp(req, rep)
  });

  fastify.post("/otp/verify", {
    schema: {
      description: "Verifies user email verification code.",
      tags: ["Auth"],
      body: {
        type: "object",
        required: ["email", "otp"],
        properties: {
          email: { type: "string", format: "email" },
          otp: { type: "string", minLength: 6, maxLength: 6 }
        }
      }
    },
    handler: (req, rep) => controller.verifyOtp(req, rep)
  });

  // Addresses sub-module routes
  fastify.get("/addresses", {
    schema: {
      description: "Get all customer shipping addresses.",
      tags: ["Addresses"],
      security: [{ bearerAuth: [] }]
    },
    preHandler: authenticate,
    handler: (req, rep) => controller.getAddresses(req, rep)
  });

  fastify.post("/addresses", {
    schema: {
      description: "Create a new shipping address.",
      tags: ["Addresses"],
      security: [{ bearerAuth: [] }]
    },
    preHandler: authenticate,
    handler: (req, rep) => controller.createAddress(req, rep)
  });

  fastify.put("/addresses/:id", {
    schema: {
      description: "Update an existing shipping address.",
      tags: ["Addresses"],
      security: [{ bearerAuth: [] }],
      params: {
        type: "object",
        required: ["id"],
        properties: {
          id: { type: "string", format: "uuid" }
        }
      }
    },
    preHandler: authenticate,
    handler: (req, rep) => controller.updateAddress(req, rep)
  });

  fastify.delete("/addresses/:id", {
    schema: {
      description: "Delete a shipping address.",
      tags: ["Addresses"],
      security: [{ bearerAuth: [] }],
      params: {
        type: "object",
        required: ["id"],
        properties: {
          id: { type: "string", format: "uuid" }
        }
      }
    },
    preHandler: authenticate,
    handler: (req, rep) => controller.deleteAddress(req, rep)
  });

  fastify.put("/password", {
    schema: {
      description: "Change user password.",
      tags: ["Auth"],
      security: [{ bearerAuth: [] }],
      body: {
        type: "object",
        required: ["password"],
        properties: {
          password: { type: "string", minLength: 6 }
        }
      }
    },
    preHandler: authenticate,
    handler: (req, rep) => controller.changePassword(req, rep)
  });
}
