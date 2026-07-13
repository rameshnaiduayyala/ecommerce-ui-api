import fp from "fastify-plugin";
import swagger from "@fastify/swagger";
import swaggerUi from "@fastify/swagger-ui";

async function swaggerPlugin(fastify, options) {
  // Register swagger core
  await fastify.register(swagger, {
    openapi: {
      info: {
        title: "Enterprise E-Commerce API Documentation",
        description: "Production-ready scalable modular REST API for enterprise e-commerce backend",
        version: "1.0.0"
      },
      servers: [
        {
          url: "http://localhost:3000",
          description: "Local development server"
        }
      ],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: "http",
            scheme: "bearer",
            bearerFormat: "JWT"
          }
        }
      }
    }
  });

  // Register swagger ui
  await fastify.register(swaggerUi, {
    routePrefix: "/documentation",
    uiConfig: {
      docExpansion: "none",
      deepLinking: false
    },
    staticCSP: true,
    transformStaticCSP: (header) => header
  });
}

export default fp(swaggerPlugin);
