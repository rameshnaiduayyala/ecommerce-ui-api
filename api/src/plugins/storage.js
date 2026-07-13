import fp from "fastify-plugin";
import { storageDriver } from "../services/storage/StorageFactory.js";

async function storagePlugin(fastify, options) {
  fastify.decorate("storage", storageDriver);
}

export default fp(storagePlugin);
