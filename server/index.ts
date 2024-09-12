import fastify from "fastify";

import { loggingConfig } from "./logging";
const environment = process.env.NODE_ENV || "development";
const server = fastify({ logger: loggingConfig[environment] ?? true });

interface IQuerystring {
  username: string;
  password: string;
}

interface IHeaders {
  "h-Custom": string;
}

interface IReply {
  200: { success: boolean };
  302: { url: string };
  "4xx": { error: string };
}

server.get<{
  Querystring: IQuerystring;
  Headers: IHeaders;
  Reply: IReply;
}>(
  "/auth",
  {
    preValidation: (request, reply, done) => {
      const { username, password } = request.query;
      done(username !== "admin" ? new Error("Must be admin") : undefined); // only validate `admin` account
    },
  },
  async (request, reply) => {
    const customerHeader = request.headers["h-Custom"];
    reply.code(200).send({ success: true });
  }
);

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
