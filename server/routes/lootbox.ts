import {
  FastifyInstance,
  FastifyPluginOptions,
  FastifyReply,
  FastifyRequest,
} from "fastify";
import { Movie } from "../database/entities/Movie.entity";
import { IReplyLootbox } from "../interfaces";
import {
  LootboxInput,
  LootboxOutput,
  LootboxInputType,
  LootboxOutputType,
} from "../types";

interface UserRequest extends FastifyRequest {
  // Define any custom properties for the request here
}

const handler_v1 = async (request: UserRequest, reply: FastifyReply) => {
  // Your handler logic here
  reply.code(200).send({ success: true, data: {} });
};

export const setupLootRoutes = async (
  instance: FastifyInstance,
  opts: FastifyPluginOptions
) => {
  instance.get("/", handler_v1);
  instance.post<{
    Body: LootboxInputType;
    Reply: {
      200: LootboxOutputType;
      302: { url: string };
      "4xx": { error: string };
      "5xx": { error: string };
    };
  }>("/", {
    handler: async (request, reply) => {
      const { user_id, roll_id, roll_count } = request.body;
      const response: LootboxOutputType = {
        user_id,
        roll_id,
        roll_count,
        server_nonce: BigInt(
          Math.floor(Math.random() * Number.MAX_SAFE_INTEGER)
        ),
        server_timestamp: new Date(),
        id: BigInt(Date.now()),
        nonce: "database nonce",
        random_number: Array(roll_count)
          .fill(0)
          .map(() =>
            BigInt(Math.floor(Math.random() * Number.MAX_SAFE_INTEGER))
          ),
      };
      reply.code(200).send(response);
    },
  });
};
