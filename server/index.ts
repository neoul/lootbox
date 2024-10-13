import "reflect-metadata";
import Fastify from "fastify";
import { TypeBoxTypeProvider } from "@fastify/type-provider-typebox";
import { Command } from "commander";
import * as fs from "fs";
import * as path from "path";
import { Config } from "./config";

import { registerDatabase, setupDatabase } from "./database/setup";

import { loggingConfig } from "./logging";
import { registerLootboxRoll } from "./routes/lootboxRoll";
import VRF from "../vrf";

// (BigInt.prototype as any).toJSON = function () {
//   return this.toString();
// };

type Args = {
  config: string;
  new_key: boolean;
  secret_key_file: string;
};

export const program = new Command();
program.name("lootbox");
program.description("Supervlabs Lootbox");
program.option("-c, --config <config>", "path to a yaml config file");
program.option(
  "-n, --new_key",
  "start the lootbox with the new key if the secret_key_file does not exist"
);
program.option(
  "-s, --secret_key_file <secret_key_file>",
  "Secret key file path",
  ".key/p256"
);

program.action(async (args: Args) => {
  run(args)
    .then((address) => {
      console.log(`Server listening at ${address}`);
    })
    .catch((err) => {
      console.error("Error starting server:", err);
      process.exit(1);
    });
});

program.parse();

async function run({ config, new_key, secret_key_file }: Args) {
  let configObj: Config = config
    ? Config.from_yaml_file(config)
    : Config.from_env();
  const exists = fs.existsSync(secret_key_file);
  if (!exists && !new_key) {
    throw new Error(
      "secret_key_file does not exist and --new_key option is not provided"
    );
  }
  const vrf = exists
    ? new VRF(fs.readFileSync(secret_key_file, "utf8"))
    : new VRF();
  if (!secret_key_file && new_key) {
    const new_key_file = path.resolve(path.dirname(secret_key_file));
    fs.mkdirSync(path.dirname(new_key_file), { recursive: true });
    fs.writeFileSync(new_key_file, vrf.getPrivateKey());
    console.log("Saved new secret key to:", new_key_file);
  }
  
  const instance = Fastify({
    logger: loggingConfig[configObj.node_env] ?? true,
    // bodyLimit: 1000000, // 1MB
  }).withTypeProvider<TypeBoxTypeProvider>();
  registerDatabase(instance);
  registerLootboxRoll(instance, vrf);
  instance.addHook('onReady', async function () {
    await setupDatabase(vrf.getPublicKey());
  });
  return await instance.listen({ host: configObj.host, port: configObj.port });
}
