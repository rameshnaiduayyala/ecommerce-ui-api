import { buildServer } from "./server.js";
import { config } from "./src/config/index.js";

async function start() {
  const server = await buildServer();

  try {
    const address = await server.listen({
      port: config.server.port,
      host: config.server.host
    });
    server.log.info(`Server listening on ${address}`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }

  // Graceful shutdown
  const shutdown = async (signal) => {
    server.log.info(`Received ${signal}. Shutting down gracefully...`);
    try {
      await server.close();
      server.log.info("Server closed successfully.");
      process.exit(0);
    } catch (err) {
      server.log.error("Error during server shutdown:", err);
      process.exit(1);
    }
  };

  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));
}

start();
