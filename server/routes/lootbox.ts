import {
  FastifyInstance,
  FastifyPluginOptions,
  FastifyReply,
  FastifyRequest,
} from "fastify";
import { Repository } from "typeorm";
import {
  LootboxRoll,
  LootboxRandomNumber,
} from "../database/entities/LootboxRoll.entity";
import {
  SLootboxRollQuery,
  SLootboxRollBody,
  SLootboxRollReply,
  TLootboxRollBody,
  TLootboxRollReply,
  TLootboxRollQuery,
  TLootboxRollArrayReply,
  SLootboxRollArrayReply,
  TError,
  SError,
} from "../types";
import { Static, Type } from "@sinclair/typebox";

interface UserRequest extends FastifyRequest {
  // Define any custom properties for the request here
}

const handler_v1 = async (request: UserRequest, reply: FastifyReply) => {
  // Your handler logic here
  reply.code(200).send({ success: true, data: {} });
};

const SPostLootboxRoll = {
  body: SLootboxRollBody,
  response: {
    200: SLootboxRollReply,
    "4xx": SError,
    "5xx": SError,
  },
};

interface IPostLootboxRoll {
  Body: TLootboxRollBody;
  Reply: {
    200: TLootboxRollReply;
    302: { url: string };
    "4xx": TError;
    "5xx": TError;
  };
}

const SGetLootbox = {
  querystring: SLootboxRollQuery,
  response: {
    200: SLootboxRollArrayReply,
    "4xx": SError,
    "5xx": SError,
  },
};

type IGetLootbox = {
  Querystring: TLootboxRollQuery;
  Reply: {
    200: TLootboxRollArrayReply;
    "4xx": TError;
    "5xx": TError;
  };
};

export const setupLootbox = async (
  instance: FastifyInstance,
  opts: FastifyPluginOptions
) => {
  const lootboxRollRepository: Repository<LootboxRoll> =
    instance.orm.getRepository(LootboxRoll);
  // instance.get("/", handler_v1);
  instance.get<IGetLootbox>(
    "/",
    {
      schema: SGetLootbox,
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
            query.andWhere("lootboxRoll.roll_id IN (:...roll_ids)", {
              roll_ids: roll_id,
            });
          } else {
            query.andWhere("lootboxRoll.roll_id = :roll_id", { roll_id });
          }
        }

        const lootboxRolls = await query.getMany();
        const response = lootboxRolls.map((lootboxRoll) => ({
          sequence: String(lootboxRoll.sequence),
          nonce: lootboxRoll.nonce,
          user_id: lootboxRoll.user_id,
          roll_id: String(lootboxRoll.roll_id),
          roll_count: lootboxRoll.roll_count,
          server_nonce: String(lootboxRoll.server_nonce),
          server_timestamp: lootboxRoll.server_timestamp.toISOString(),
          random_numbers: lootboxRoll.random_numbers.map((randomNumber) =>
            String(randomNumber.random_number)
          ),
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

  instance.post<IPostLootboxRoll>(
    "/roll",
    {
      schema: SPostLootboxRoll,
    },
    async (request, reply) => {
      const { user_id, roll_id, roll_count } = request.body;
      const roll = new LootboxRoll();
      roll.user_id = user_id;
      roll.roll_id = String(roll_id);
      roll.roll_count = roll_count;
      roll.server_nonce = Math.floor(Math.random() * 0x100000000) - 0x80000000;
      roll.server_timestamp = new Date();
      const result = await lootboxRollRepository
        .createQueryBuilder()
        .insert()
        .into(LootboxRoll)
        .values(roll)
        .returning("*")
        .execute();
      instance.log.info(
        `Lootbox roll created: ${JSON.stringify(result.raw[0])}`
      );
      if (result.raw.length === 0) {
        return reply.code(500).send({ error: "Internal Server Error", message: `error message test` });
      }
      const raw = result.raw[0];
      const response: TLootboxRollReply = {
        sequence: raw.sequence,
        nonce: raw.nonce,
        user_id,
        roll_id,
        roll_count,
        server_nonce: raw.server_nonce,
        server_timestamp: raw.server_timestamp.toISOString(),
        random_numbers: Array(roll_count).fill(
          String(BigInt(Math.floor(Math.random() * Number.MAX_SAFE_INTEGER)))
        ),
      };
      reply.code(200).send(response);
    }
  );
};
