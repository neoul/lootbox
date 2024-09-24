import plugin from "typeorm-fastify-plugin";
import { FastifyInstance } from "fastify";
import { datasource } from "./datasource";

export async function configureDatabase(server: FastifyInstance) {
  server.register(plugin, { connection: datasource });
}
