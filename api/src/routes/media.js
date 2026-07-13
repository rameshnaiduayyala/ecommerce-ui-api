import mediaService from "../services/MediaService.js";
import { authenticate } from "../middlewares/auth.js";

/**
 * Media routes for file uploads.
 *
 * @param {import("fastify").FastifyInstance} fastify
 */
export default async function mediaRoutes(fastify, options) {
  fastify.post("/upload", {
    preHandler: authenticate,
    handler: async (request, reply) => {
      const data = await request.file();
      if (!data) {
        return reply.status(400).send({
          success: false,
          message: "No file uploaded."
        });
      }
      const buffer = await data.toBuffer();
      const result = await mediaService.processAndUploadImage(buffer, data.filename, "products");
      return {
        success: true,
        message: "Image uploaded successfully.",
        data: result
      };
    }
  });
}
