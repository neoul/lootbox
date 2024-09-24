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

// export const LootboxRandomNumber = Type.Object({
//   lootbox_roll_sequence: Type.BigInt(),
//   sequence_number: Type.Number(),
//   random_number: Type.BigInt(),
// });

export const LootboxOutput = Type.Intersect([
  LootboxInput,
  Type.Object({
    sequence: Type.BigInt(),
    nonce: Type.String(),
    server_nonce: Type.BigInt(),
    server_timestamp: Type.Date(),
    random_numbers: Type.Array(Type.BigInt()),
    // random_numbers: Type.Array(LootboxRandomNumber), // user's data
  }),
]);

export const LootboxRollQueryString = Type.Object({
  user_id: Type.Optional(Type.String({ format: "uuid" })),
  roll_id: Type.Optional(Type.Union([
    Type.Number(),
    Type.String(),
    Type.Array(Type.Union([
      Type.Number(),
      Type.String(),
    ]))
  ])),
  limit: Type.Optional(Type.Number({ minimum: 1, maximum: 100, default: 10 })),
  offset: Type.Optional(Type.Number({ minimum: 0, default: 0 })),
});

export const LootboxOutputArraySchema = Type.Array(LootboxOutput);
export type LootboxOutputArrayType = Static<typeof LootboxOutputArraySchema>;

export type LootboxQueryStringType = Static<typeof LootboxRollQueryString>;
export type LootboxInputType = Static<typeof LootboxInput>;
export type LootboxOutputType = Static<typeof LootboxOutput>;


export const ErrorSchema = Type.Object({
  error: Type.String({
    description: "Error name",
    example: "Bad Request",
  }),
  message: Type.String({
    description: "Error message",
    example: "Body parameters are invalid",
  }),
  code: Type.Optional(
    Type.String({
      description: "Error code (optional)",
      example: "FST_ERR_VALIDATION",
    })
  ),
});

export type ErrorType = Static<typeof ErrorSchema>;
