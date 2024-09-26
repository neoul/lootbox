import plugin from "typeorm-fastify-plugin";
import { FastifyInstance } from "fastify";
import { datasource } from "./datasource";

export async function setupDatabase(instance: FastifyInstance) {
  instance.register(plugin, { connection: datasource });
}
