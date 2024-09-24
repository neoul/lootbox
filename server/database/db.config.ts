import plugin from "typeorm-fastify-plugin";
import { FastifyInstance } from "fastify";
import { datasource } from "./datasource";

export async function configureDatabase(server: FastifyInstance) {
  console.log(
    "Connecting to database...",
    process.env.DATABASE_SYNCHRONIZE === "true"
  );
  // Connect to the PostgreSQL database using TypeORM Fastify plugin.
  server.register(plugin, { connection: datasource });
}
