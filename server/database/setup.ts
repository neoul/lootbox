import plugin from "typeorm-fastify-plugin";
import { FastifyInstance } from "fastify";
import { datasource } from "./datasource";
import { VRFKey } from "./entities/VRFKey";

export async function registerDatabase(instance: FastifyInstance) {
  instance.register(plugin, { connection: datasource });
}

export async function setupDatabase(public_key: string) {
  const keyRepo = datasource.getRepository(VRFKey);
  const key = await keyRepo.findOne({ where: { public_key: public_key }});
  if (!key) {
    const r = await keyRepo.insert({ public_key });
    console.log(r);
  }
}

