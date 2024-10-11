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
} from "../database/entities/LootboxRoll";
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
  SLootboxRollParams,
  TLootboxRollParams,
} from "../types";
import VRF from "../../vrf";
import { Key } from "../database/entities/Key";

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

const SPostLootboxRoll = {
  body: SLootboxRollBody,
  response: {
    200: SLootboxRollReply,
    "4xx": SError,
    "5xx": SError,
  },
};

const SGetLootboxRoll = {
  params: SLootboxRollParams,
  response: {
    200: SLootboxRollReply,
    "4xx": SError,
    "5xx": SError,
  },
};

const SGetLootboxRolls = {
  querystring: SLootboxRollQuery,
  response: {
    200: SLootboxRollArrayReply,
    "4xx": SError,
    "5xx": SError,
  },
};

interface IPostLootboxRoll {
  Body: TLootboxRollBody;
  Reply: {
    200: TLootboxRollReply;
    "4xx": TError;
    "5xx": TError;
  };
}

type IGetLootboxRoll = {
  Params: TLootboxRollParams;
  Reply: {
    200: TLootboxRollReply;
    "4xx": TError;
    "5xx": TError;
  };
};

type IGetLootboxRolls = {
  Querystring: TLootboxRollQuery;
  Reply: {
    200: TLootboxRollArrayReply;
    "4xx": TError;
    "5xx": TError;
  };
};

export async function setupLootboxRoll(instance: FastifyInstance, vrf: VRF) {
  // find existing key and update it if necessary
  instance.register(setupLootbox, { prefix: "/lootbox", vrf });
}

const setupLootbox = async (
  instance: FastifyInstance,
  opts: FastifyPluginOptions
) => {
  const vrf = opts.vrf as VRF;
  const rollRepo: Repository<LootboxRoll> =
    instance.orm.getRepository(LootboxRoll);
  const keyRepo: Repository<Key> = instance.orm.getRepository(Key);
  // const key = await keyRepo.find({ public_key: vrf.getPublicKey() });

  // if (!key) {
  //   throw new Error("Key not found");
  // }

  instance.get<IGetLootboxRolls>(
    "/rolls",
    {
      schema: SGetLootboxRolls,
    },
    async (request, reply) => {
      try {
        const { user_id, roll_id, limit = 10, offset = 0 } = request.query;

        const query = rollRepo
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

        const founds = await query.getMany();
        if (founds.length == 0) {
          return reply.code(200).send([]);
        }
        const resp = founds.map((roll) => ({
          sequence: String(roll.sequence),
          nonce: roll.nonce,
          user_id: roll.user_id,
          roll_id: String(roll.roll_id),
          roll_count: roll.roll_count,
          server_nonce: String(roll.server_nonce),
          server_timestamp: roll.server_timestamp.toISOString(),
          pi: roll.pi,
          beta: roll.beta,
          random_numbers: roll.random_numbers.map((randomNumber) =>
            String(randomNumber.random_number)
          ),
        }));
        reply.code(200).send(resp);
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

  instance.get<IGetLootboxRoll>(
    "/rolls/:sequence",
    {
      schema: SGetLootboxRoll,
    },
    async (request, reply) => {
      try {
        const { sequence } = request.params;
        const query = rollRepo
          .createQueryBuilder("lootboxRoll")
          .leftJoinAndSelect("lootboxRoll.random_numbers", "randomNumber")
          .where("lootboxRoll.sequence = :sequence", { sequence });
        const found = await query.getOne();
        if (!found) {
          return reply
            .code(404)
            .send({ error: "Not Found", message: "Lootbox roll not found" });
        }
        const resp = {
          sequence: String(found.sequence),
          nonce: found.nonce,
          user_id: found.user_id,
          roll_id: String(found.roll_id),
          roll_count: found.roll_count,
          server_nonce: String(found.server_nonce),
          server_timestamp: found.server_timestamp.toISOString(),
          pi: found.pi,
          beta: found.beta,
          random_numbers: found.random_numbers.map((randomNumber) =>
            String(randomNumber.random_number)
          ),
        };
        return reply.code(200).send(resp);
      } catch (error) {
        instance.log.error(error);
        if (error instanceof Error) {
        }
        return reply
          .code(500)
          .send({ error: "Internal Server Error", message: `${error}` });
      }
    }
  );

  instance.post<IPostLootboxRoll>(
    "/rolls",
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
      const result = await rollRepo
        .createQueryBuilder()
        .insert()
        .into(LootboxRoll)
        .values(roll)
        .returning("*")
        .execute();
      // instance.log.info(
      //   `Lootbox roll created: ${JSON.stringify(result.raw[0])}`
      // );
      if (result.raw.length === 0) {
        return reply.code(500).send({
          error: "Internal Server Error",
          message: `lootbox roll insert failed`,
        });
      }

      const curRoll = result.raw[0];
      // instance.log.warn(`Current roll found: ${JSON.stringify(curRoll)}`);
      const server_timestamp = curRoll.server_timestamp.toISOString();
      let alpha = `${curRoll.sequence},${curRoll.nonce},${curRoll.user_id},${curRoll.roll_id},${curRoll.roll_count},${curRoll.server_nonce},${server_timestamp}`;
      const prevRoll = await rollRepo
        .createQueryBuilder()
        .select()
        .where("sequence < :sequence", {
          sequence: curRoll.sequence,
        })
        .orderBy("sequence", "DESC")
        .limit(1)
        .getOne();
      if (prevRoll) {
        // instance.log.warn(`Previous roll found: ${JSON.stringify(prevRoll)}`);
        alpha += `${prevRoll.user_id},${prevRoll.roll_id},${prevRoll.nonce},${prevRoll.server_nonce}`;
      }
      const { beta, pi } = vrf.hash(
        Uint8Array.from(new TextEncoder().encode(alpha))
      );
      const piStr = Buffer.from(pi).toString("hex");
      const betaStr = Buffer.from(beta).toString("hex");

      const random_numbers = sliceAndConvertToBigInt(beta);
      const rand_values = random_numbers.map((randnum, index) => ({
        lootbox_roll_sequence: curRoll.sequence,
        sequence_number: index + 0,
        random_number: randnum,
      }));
      await rollRepo
        .createQueryBuilder()
        .update(LootboxRoll)
        .set({
          pi: piStr,
          beta: betaStr,
        })
        .where({ sequence: curRoll.sequence })
        .execute();

      await rollRepo
        .createQueryBuilder()
        .insert()
        .into(LootboxRandomNumber)
        .values(rand_values)
        .execute();

      const resp: TLootboxRollReply = {
        sequence: curRoll.sequence,
        nonce: curRoll.nonce,
        user_id,
        roll_id,
        roll_count,
        server_nonce: curRoll.server_nonce,
        server_timestamp: server_timestamp,
        pi: piStr,
        beta: betaStr,
        random_numbers: random_numbers,
      };
      return reply.code(200).send(resp);
    }
  );
};
