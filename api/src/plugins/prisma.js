import fp from "fastify-plugin";
import { PrismaClient } from "@prisma/client";

async function prismaPlugin(fastify, options) {
  const prisma = new PrismaClient({
    log: fastify.log.level === "debug" ? ["query", "info", "warn", "error"] : ["error", "warn"]
  });

  // Connect to database on start
  await prisma.$connect();

  // Decorate Fastify instance with prisma client
  fastify.decorate("prisma", prisma);

  // Close connection on server shutdown
  fastify.addHook("onClose", async (server) => {
    fastify.log.info("Disconnecting Prisma Client...");
    await prisma.$disconnect();
  });
}

export default fp(prismaPlugin);
