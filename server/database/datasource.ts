import "dotenv/config";
import { DataSource, DataSourceOptions } from "typeorm";

const databaseConfig = {
  namespace: "typeorm",
  type: "postgres",
  host: process.env.DATABASE_HOST,
  port: parseInt(process.env.DATABASE_PORT || "5432"),
  username: process.env.DATABASE_USERNAME,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_DBNAME,
  synchronize: process.env.DATABASE_SYNCHRONIZE === "true",
  logging: process.env.NODE_ENV === "development" ? true : false,
  migrations: ["server/database/migrations/*.ts"],
  subscribers: [],
  migrationsRun: process.env.DATABASE_SYNCHRONIZE !== "true",
  entities: ["server/**/entities/*{.ts,.js}"],
};

export const datasource = new DataSource(databaseConfig as DataSourceOptions);
