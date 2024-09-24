import {
  FastifyInstance,
  FastifyPluginOptions,
  FastifyReply,
  FastifyRequest,
} from "fastify";
import { Repository } from "typeorm";
import {
  LootboxRoll,
  RandomNumber,
} from "../database/entities/LootboxRoll.entity";
import {
  LootboxRollQueryString,
  LootboxInput,
  LootboxOutput,
  LootboxInputType,
  LootboxOutputType,
  LootboxQueryStringType,
  LootboxOutputArrayType,
  LootboxOutputArraySchema,
  ErrorType,
  ErrorSchema,
} from "../types";
import { Static, Type } from "@sinclair/typebox";

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
  const lootboxRollRepository: Repository<LootboxRoll> =
    instance.orm.getRepository(LootboxRoll);
  // instance.get("/", handler_v1);
  instance.get<{
    Querystring: LootboxQueryStringType;
    Reply: {
      200: LootboxOutputArrayType;
      "4xx": ErrorType;
      "5xx": ErrorType;
    };
  }>(
    "/",
    {
      schema: {
        querystring: LootboxRollQueryString,
        // response: {
        //   200: LootboxOutputArraySchema,
        //   "4xx": ErrorSchema,
        //   "5xx": ErrorSchema,
        // },
      },
      // preValidation: (request, reply, done) => {
      //   const { user_id, roll_id } = request.query;
      //   if (user_id && roll_id) {
      //     done(new Error("Only one of 'user_id' and 'roll_id' can be provided"));
      //   } else {
      //     done();
      //   }
      // },
    },
    async (request, reply) => {
      try {
        const { user_id, roll_id, limit = 10, offset = 0 } = request.query;

        const query = lootboxRollRepository
          .createQueryBuilder("lootboxRoll")
          .leftJoinAndSelect("lootboxRoll.random_numbers", "randomNumber")
          .take(limit)
          .skip(offset);

        if (user_id) {
          query.andWhere("lootboxRoll.user_id = :user_id", { user_id });
        }

        if (roll_id) {
          if (Array.isArray(roll_id)) {
            query.andWhere("lootboxRoll.roll_id IN (:...roll_ids)", { roll_ids: roll_id });
          } else {
            query.andWhere("lootboxRoll.roll_id = :roll_id", { roll_id });
          }
        }

        const lootboxRolls = await query.getMany();
        const response = lootboxRolls.map((lootboxRoll) => ({
          sequence: lootboxRoll.sequence,
          nonce: lootboxRoll.nonce,
          user_id: lootboxRoll.user_id,
          roll_id: lootboxRoll.roll_id,
          roll_count: lootboxRoll.roll_count,
          server_nonce: lootboxRoll.server_nonce,
          server_timestamp: lootboxRoll.server_timestamp,
          random_numbers: lootboxRoll.random_numbers.map((randomNumber) => randomNumber.random_number),
        }));


        reply.code(200).send(response);
      } catch (error) {
        instance.log.error(error);
        if (error instanceof Error) {
        }
        reply
          .code(500)
          .send({ error: "Internal Server Error", message: `${error}` });
      }
    }
  );
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
      const sequence = BigInt(Date.now());
      const response: LootboxOutputType = {
        user_id,
        roll_id,
        roll_count,
        server_nonce: BigInt(
          Math.floor(Math.random() * Number.MAX_SAFE_INTEGER)
        ),
        server_timestamp: new Date(),
        sequence,
        nonce: "database nonce",
        random_numbers: Array(roll_count).fill({
          lootbox_roll_sequence: sequence,
          sequence_number: 0,
          random_number: BigInt(
            Math.floor(Math.random() * Number.MAX_SAFE_INTEGER)
          ),
        }),
      };
      reply.code(200).send(response);
    },
  });
};
