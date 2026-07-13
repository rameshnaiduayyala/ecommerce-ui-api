import fp from "fastify-plugin";
import rateLimit from "@fastify/rate-limit";
import { config } from "../config/index.js";

async function rateLimitPlugin(fastify, options) {
  await fastify.register(rateLimit, {
    max: config.security.rateLimitMax,
    timeWindow: config.security.rateLimitWindowMs,
    keyGenerator: (request) => {
      // Use client IP address or user ID (if authenticated)
      return request.user?.id || request.ip;
    },
    errorResponseBuilder: (request, context) => {
      return {
        success: false,
        message: "Too many requests. Please try again later.",
        errors: {
          limit: context.max,
          window: `${context.after} ms`
        }
      };
    }
  });
}

export default fp(rateLimitPlugin);
