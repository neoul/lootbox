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
  roll_id: Type.BigInt(), // user's data
  roll_count: Type.Number(), // user's data
});

export const LootboxOutput = Type.Intersect([
  LootboxInput,
  Type.Object({
    server_nonce: Type.BigInt(),
    server_timestamp: Type.Date(),
    database_sequence: Type.BigInt(),
    database_nonce: Type.String(), // { format: "uuid" }
    random_number: Type.Array(Type.BigInt()),
  }),
]);

export type LootboxInputType = Static<typeof LootboxInput>;
export type LootboxOutputType = Static<typeof LootboxOutput>;
