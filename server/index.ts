import fastify from "fastify";

import { loggingConfig } from "./logging";
const environment = process.env.NODE_ENV || "development";
const server = fastify({ logger: loggingConfig[environment] ?? true });

server.get("/ping", async (request, reply) => {
  request.log.info("Ping request received");
  return "pong\n";
});

server.listen({ port: 8080 }, (err, address) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  console.log(`Server listening at ${address}`);
});
