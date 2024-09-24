import "reflect-metadata";
import * as dotenv from "dotenv";
import Fastify from "fastify";
import { TypeBoxTypeProvider } from "@fastify/type-provider-typebox";
import { configureRoutes } from "./routes/movie.route";
import { configureDatabase } from "./db.config";

import { loggingConfig } from "./logging";
import { setupLootRoutes } from "./routes/lootbox";
// JSON.stringify for BigInt
(BigInt.prototype as any).toJSON = function () {
  return this.toString();
};

async function run() {
  const environment = process.env.NODE_ENV || "development";
  dotenv.config({ path: [`.env.${environment}`] });
  const instance = Fastify({
    logger: loggingConfig[environment] ?? true,
    // bodyLimit: 1000000, // 1MB
  }).withTypeProvider<TypeBoxTypeProvider>();

  configureDatabase(instance);

  configureRoutes(instance);
  // routes(instance);
  instance.register(setupLootRoutes, { prefix: "/lootbox" });

  const HOST = process.env.HOST || "0.0.0.0";
  const PORT = process.env.PORT || "8282";
  return await instance.listen({ host: HOST, port: parseInt(PORT) });
}
run()
  .then((address) => {
    console.log(`Server listening at ${address}`);
  })
  .catch((err) => {
    console.error("Error starting server:", err);
    process.exit(1);
  });

// import fastify from "fastify";

// import { loggingConfig } from "./logging";
// const environment = process.env.NODE_ENV || "development";
// const server = fastify({ logger: loggingConfig[environment] ?? true });

// interface IQuerystring {
//   username: string;
//   password: string;
// }

// interface IHeaders {
//   "h-Custom": string;
// }

// interface IReply {
//   200: { success: boolean };
//   302: { url: string };
//   "4xx": { error: string };
// }

// server.get<{
//   Querystring: IQuerystring;
//   Headers: IHeaders;
//   Reply: IReply;
// }>(
//   "/auth",
//   {
//     preValidation: (request, reply, done) => {
//       const { username, password } = request.query;
//       done(username !== "admin" ? new Error("Must be admin") : undefined); // only validate `admin` account
//     },
//   },
//   async (request, reply) => {
//     const customerHeader = request.headers["h-Custom"];
//     reply.code(200).send({ success: true });
//   }
// );

// server.get("/ping", async (request, reply) => {
//   request.log.info("Ping request received");
//   return "pong\n";
// });

// server.listen({ port: 8080 }, (err, address) => {
//   if (err) {
//     console.error(err);
//     process.exit(1);
//   }
//   console.log(`Server listening at ${address}`);
// });
