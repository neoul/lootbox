import { Static, Type } from "@sinclair/typebox";

export const Movie = Type.Object({
  title: Type.String(),
  description: Type.String(),
  year: Type.String(),
  duration: Type.String(),
});

export type MovieType = Static<typeof Movie>;

export const LootboxInput = Type.Object({
  user_id: Type.String({ format: "uuid" }), // user's data
  roll_id: Type.Number(), // user's data
  roll_count: Type.Number(), // user's data
});

export const LootboxOutput = Type.Object({
  user_id: Type.String({ format: "uuid" }), // user's data
  roll_id: Type.Number(), // user's data
  roll_index: Type.Number(), // user's data
  server_nonce: Type.String(), // server's data
  server_timestamp: Type.Date(), // server's data
  database_sequence: Type.Number(), // database's data incremented for each request
  database_nonce: Type.String(), // database's data uuidv4
  random_number: Type.BigInt(), // random number (vrf result)
});

export type LootboxInputType = Static<typeof LootboxInput>;
export type LootboxOutputType = Static<typeof LootboxOutput>;
