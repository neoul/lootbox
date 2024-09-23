import plugin from "typeorm-fastify-plugin";
import { Movie } from "./database/entities/movie.entity";
import { FastifyInstance } from "fastify";

export function configureDatabase(server: FastifyInstance) {
  console.log("Connecting to database...", process.env.DATABASE_SYNCHRONIZE === "true");
  // Connect to the PostgreSQL database using TypeORM Fastify plugin.
  server.register(plugin, {
    namespace: "typeorm",
    type: "postgres",
    host: process.env.DATABASE_HOST,
    port: parseInt(process.env.DATABASE_PORT || "5432"),
    username: process.env.DATABASE_USERNAME,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE_DBNAME,
    synchronize: process.env.DATABASE_SYNCHRONIZE === "true",
    logging: process.env.NODE_ENV === "development" ? true : false,
    migrations: [__dirname + "/database/migration/*.ts"],
    subscribers: [],
    migrationsRun: process.env.DATABASE_SYNCHRONIZE !== "true",
    entities: [Movie],
  });
}
