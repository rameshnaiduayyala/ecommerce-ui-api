import Fastify from "fastify";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import compress from "@fastify/compress";
import multipart from "@fastify/multipart";
import { ZodError } from "zod";
import fs from "fs/promises";
import path from "path";

import { config } from "./src/config/index.js";
import prismaPlugin from "./src/plugins/prisma.js";
import rateLimitPlugin from "./src/plugins/rateLimit.js";
import swaggerPlugin from "./src/plugins/swagger.js";
import storagePlugin from "./src/plugins/storage.js";

import { formatResponse } from "./src/utils/response.js";
import { AppException } from "./src/utils/errors.js";

// Routes Imports (to be created)
import authRoutes from "./src/routes/auth.js";
import catalogRoutes from "./src/routes/catalog.js";
import inventoryRoutes from "./src/routes/inventory.js";
import cartRoutes from "./src/routes/cart.js";
import orderRoutes from "./src/routes/orders.js";
import paymentRoutes from "./src/routes/payments.js";
import shippingRoutes from "./src/routes/shipping.js";
import reviewsRoutes from "./src/routes/reviews.js";
import couponRoutes from "./src/routes/coupons.js";
import cmsRoutes from "./src/routes/cms.js";
import mediaRoutes from "./src/routes/media.js";

export async function buildServer() {
  const fastify = Fastify({
    logger: {
      level: config.server.isProduction ? "info" : "debug",
      transport: config.server.isDevelopment
        ? {
            target: "pino-pretty",
            options: {
              translateTime: "HH:MM:ss Z",
              ignore: "pid,hostname"
            }
          }
        : undefined
    }
  });

  // 1. Register Core Security Middlewares
  await fastify.register(helmet, { contentSecurityPolicy: false });
  await fastify.register(cors, {
    origin: "*", // Adjust for specific production domains
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
  });
  await fastify.register(compress, {
    global: true,
    threshold: 1024,
    encodings: ["br", "gzip"]
  });

  // 2. Register Multipart/File Upload Support
  await fastify.register(multipart, {
    limits: {
      fieldNameSize: 100, // Max field name size in bytes
      fieldSize: 1000000, // Max field value size in bytes (1MB)
      fileSize: 10000000, // Max file size in bytes (10MB)
      files: 10           // Max number of file fields
    }
  });

  // 3. Register Infrastructure Plugins
  await fastify.register(prismaPlugin);
  await fastify.register(rateLimitPlugin);
  await fastify.register(swaggerPlugin);
  await fastify.register(storagePlugin);

  // 4. Centralized Error Handler (Global Exception Filter)
  fastify.setErrorHandler((error, request, reply) => {
    fastify.log.error(error);

    // Zod validation errors
    if (error instanceof ZodError) {
      const formattedErrors = error.errors.map((err) => ({
        field: err.path.join("."),
        message: err.message
      }));
      return reply.status(400).send(
        formatResponse(false, "Validation error occurred.", null, null, formattedErrors)
      );
    }

    // Custom App Exceptions (Business logic failures, unauthorized, not found)
    if (error instanceof AppException) {
      return reply.status(error.statusCode).send(
        formatResponse(false, error.message, null, null, error.errors)
      );
    }

    // Default fastify validation error
    if (error.validation) {
      return reply.status(400).send(
        formatResponse(false, "Validation error occurred.", null, null, error.validation)
      );
    }

    // Internal Server Error
    const responseMessage = config.server.isProduction
      ? "An unexpected internal server error occurred."
      : error.message;

    return reply.status(error.statusCode || 500).send(
      formatResponse(false, responseMessage, null, null, null)
    );
  });

  // 5. Register API routes under versioning namespace
  await fastify.register(async (apiContext) => {
    await apiContext.register(authRoutes, { prefix: "/auth" });
    await apiContext.register(catalogRoutes, { prefix: "/catalog" });
    await apiContext.register(inventoryRoutes, { prefix: "/inventory" });
    await apiContext.register(cartRoutes, { prefix: "/cart" });
    await apiContext.register(orderRoutes, { prefix: "/orders" });
    await apiContext.register(paymentRoutes, { prefix: "/payments" });
    await apiContext.register(shippingRoutes, { prefix: "/shipping" });
    await apiContext.register(reviewsRoutes, { prefix: "/reviews" });
    await apiContext.register(couponRoutes, { prefix: "/coupons" });
    await apiContext.register(cmsRoutes, { prefix: "/cms" });
    await apiContext.register(mediaRoutes, { prefix: "/media" });
  }, { prefix: "/api/v1" });

  // 6. Basic Health Check Endpoint
  fastify.get("/health", async (request, reply) => {
    return formatResponse(true, "Service is healthy.", {
      uptime: process.uptime(),
      timestamp: new Date().toISOString()
    });
  });

  // 7. Developer Portal Root Index Route
  fastify.get("/", async (request, reply) => {
    reply.header("Content-Type", "text/html; charset=utf-8");
    const htmlPath = path.join(process.cwd(), "public", "index.html");
    const html = await fs.readFile(htmlPath, "utf-8");
    return html;
  });

  // Serve static uploads files locally
  fastify.get("/uploads/*", async (request, reply) => {
    const filePath = path.join(process.cwd(), "uploads", request.params["*"]);
    try {
      const data = await fs.readFile(filePath);
      const ext = path.extname(filePath).toLowerCase();
      let contentType = "application/octet-stream";
      if (ext === ".webp") contentType = "image/webp";
      else if (ext === ".jpg" || ext === ".jpeg") contentType = "image/jpeg";
      else if (ext === ".png") contentType = "image/png";
      else if (ext === ".svg") contentType = "image/svg+xml";
      
      reply.header("Content-Type", contentType);
      return data;
    } catch (err) {
      reply.status(404).send("File not found");
    }
  });

  return fastify;
}
export default buildServer;
