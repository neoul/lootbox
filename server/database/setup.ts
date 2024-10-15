import plugin from "typeorm-fastify-plugin";
import { FastifyInstance } from "fastify";
import { datasource } from "./datasource";
import { Key } from "./entities/Key";

export async function registerDatabase(instance: FastifyInstance) {
  instance.register(plugin, { connection: datasource });
}

export async function setupDatabase(public_key: string) {
  const keyRepo = datasource.getRepository(Key);
  const key = await keyRepo.findOne({ where: { public_key: public_key }});
  if (!key) {
    const r = await keyRepo.insert({ public_key });
    console.log(r);
  }
}

