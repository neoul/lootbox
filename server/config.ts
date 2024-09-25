import * as yaml from "js-yaml";
import * as fs from "fs";
import * as dotenv from "dotenv";

/**
 * This class represents the basic configuration required
 */
export class Config {
  constructor(
    public node_env: string,
    public host: string,
    public port: number,
    public database_host: string,
    public database_port: number,
    public database_username: string,
    public database_password: string,
    public database_dbname: string,
    public database_synchronize: boolean
  ) {}

  public static from_yaml_file(path: string): Config {
    const contents = fs.readFileSync(path, "utf8");
    return yaml.load(contents) as Config;
  }

  public static from_env(): Config {
    if (
      !process.env.DATABASE_HOST ||
      !process.env.DATABASE_USERNAME ||
      !process.env.DATABASE_PASSWORD ||
      !process.env.DATABASE_DBNAME
    ) {
      throw new Error("Missing required environment variables");
    }
    const environment = process.env.NODE_ENV || "development";
    dotenv.config({ path: [`.env.${environment}`] });
    return new Config(
      environment,
      process.env.HOST || "0.0.0.0",
      parseInt(process.env.PORT || "8282"),
      process.env.DATABASE_HOST,
      parseInt(process.env.DATABASE_PORT || "5432"),
      process.env.DATABASE_USERNAME,
      process.env.DATABASE_PASSWORD,
      process.env.DATABASE_DBNAME,
      process.env.DATABASE_SYNCHRONIZE === "true"
    );
  }
}
