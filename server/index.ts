import "reflect-metadata";
import Fastify from "fastify";
import { TypeBoxTypeProvider } from "@fastify/type-provider-typebox";
import { Command } from "commander";
import { Config } from "./config";

import { configureRoutes } from "./routes/movie.route";
import { configureDatabase } from "./database/db.config";

import { loggingConfig } from "./logging";
import { setupLootbox } from "./routes/lootbox";
import { loadSecretKey } from "../vrf/utilities";

// (BigInt.prototype as any).toJSON = function () {
//   return this.toString();
// };

type Args = {
  config: string;
  secret_key_file: string;
};

export const program = new Command();
program.name("lootbox");
program.description("Supervlabs Lootbox");
program.option("-c, --config <config>", "Path to a yaml config file");
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

async function run({ config, secret_key_file }: Args) {
  console.log("Starting server...", config, secret_key_file);
  let configObj: Config = config
    ? Config.from_yaml_file(config)
    : Config.from_env();
  const secretKey = loadSecretKey(secret_key_file);
  console.log(secretKey);
  const instance = Fastify({
    logger: loggingConfig[configObj.node_env] ?? true,
    // bodyLimit: 1000000, // 1MB
  }).withTypeProvider<TypeBoxTypeProvider>();

  configureDatabase(instance);
  configureRoutes(instance);
  instance.register(setupLootbox, { prefix: "/lootbox" });
  return await instance.listen({ host: configObj.host, port: configObj.port });
}
