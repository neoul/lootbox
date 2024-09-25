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
import VRF from "../../vrf";

function sliceAndConvertToBigInt(array: Uint8Array): string[] {
  const result: string[] = [];

  for (let i = 0; i < array.length; i += 8) {
    const slice = array.slice(i, i + 8);
    let bigIntValue = BigInt(
      "0x" +
        Array.from(slice)
          .map((byte) => byte.toString(16).padStart(2, "0"))
          .join("")
    );
    bigIntValue = bigIntValue - BigInt("9223372036854775808");
    result.push(bigIntValue.toString());
  }
  return result;
}

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
  console.log(`options`, opts);
  const vrf = opts.vrf as VRF;
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
      preValidation: async (request, reply) => {
        const { roll_count } = request.body;
        if (roll_count <= 0 || roll_count > 4) {
          throw new Error("Invalid roll_count");
        }
      },
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
        return reply.code(500).send({
          error: "Internal Server Error",
          message: `error message test`,
        });
      }
      const raw = result.raw[0];
      const server_timestamp = raw.server_timestamp.toISOString();
      const alpha = `${raw.sequence},${raw.nonce},${raw.user_id},${raw.roll_id},${raw.roll_count},${raw.server_nonce},${server_timestamp}`;
      const { beta, pi } = vrf.hash(
        Uint8Array.from(new TextEncoder().encode(alpha))
      );
      console.log("pi", pi.length);
      const random_numbers = sliceAndConvertToBigInt(beta);
      const rand_values = random_numbers.map((randnum, index) => ({
        lootbox_roll_sequence: raw.sequence,
        sequence_number: index + 0,
        random_number: randnum,
      }));
      await lootboxRollRepository
        .createQueryBuilder()
        .update(LootboxRoll)
        .set({ pi: Buffer.from(pi).toString("hex") })
        .where({ sequence: raw.sequence })
        .execute();

      await lootboxRollRepository
        .createQueryBuilder()
        .insert()
        .into(LootboxRandomNumber)
        .values(rand_values)
        .execute();

      // const ok = vrf.verify(pi, Uint8Array.from(new TextEncoder().encode(alpha)), beta);
      // instance.log.warn(`ok ${ok}`);

      const resp: TLootboxRollReply = {
        sequence: raw.sequence,
        nonce: raw.nonce,
        user_id,
        roll_id,
        roll_count,
        server_nonce: raw.server_nonce,
        server_timestamp: server_timestamp,
        random_numbers: random_numbers,
      };
      return reply.code(200).send(resp);
    }
  );
};
