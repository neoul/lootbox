import "reflect-metadata";
import Fastify from "fastify";
import { TypeBoxTypeProvider } from "@fastify/type-provider-typebox";
import { Command } from "commander";
import * as fs from "fs";
import { Config } from "./config";

import { setupDatabase } from "./database/db.config";

import { loggingConfig } from "./logging";
import { setupLootboxRoll } from "./routes/lootbox";
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
program.option("-c, --config <config>", "Path to a yaml config file");
program.option("-n, --new_key", "Create a new lootbox with the new key");
program.requiredOption(
  "-s, --secret_key_file <secret_key_file>",
  "Secret key file path"
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
  console.log("Starting server...", config, new_key, secret_key_file);
  let configObj: Config = config
    ? Config.from_yaml_file(config)
    : Config.from_env();
  const secretkey = fs.readFileSync(secret_key_file, "utf8");
  const vrf = new_key ? new VRF() : new VRF(secretkey);
  const instance = Fastify({
    logger: loggingConfig[configObj.node_env] ?? true,
    // bodyLimit: 1000000, // 1MB
  }).withTypeProvider<TypeBoxTypeProvider>();
  setupDatabase(instance);
  setupLootboxRoll(instance, vrf);
  return await instance.listen({ host: configObj.host, port: configObj.port });
}
