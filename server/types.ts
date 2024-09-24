import { Static, Type } from "@sinclair/typebox";

export const Movie = Type.Object({
  title: Type.String(),
  description: Type.String(),
  year: Type.String(),
  duration: Type.String(),
});

export type MovieType = Static<typeof Movie>;

export const LootboxRollBodySchema = Type.Object({
  user_id: Type.String({ format: "uuid" }), // user's data
  roll_id: Type.String(), // user's data
  roll_count: Type.Number(), // user's data
});

export const LootboxRollReplySchema = Type.Intersect([
  LootboxRollBodySchema,
  Type.Object({
    sequence: Type.String(),
    nonce: Type.String(),
    server_nonce: Type.String(),
    server_timestamp: Type.String({ format: "date-time" }),
    random_numbers: Type.Array(Type.String()),
    // random_numbers: Type.Array(LootboxRandomNumber), // user's data
  }),
]);

export const LootboxRollQuerySchema = Type.Object({
  user_id: Type.Optional(Type.String({ format: "uuid" })),
  roll_id: Type.Optional(
    Type.Union([
      Type.Number(),
      Type.String(),
      Type.Array(Type.Union([Type.Number(), Type.String()])),
    ])
  ),
  limit: Type.Optional(Type.Number({ minimum: 1, maximum: 100, default: 10 })),
  offset: Type.Optional(Type.Number({ minimum: 0, default: 0 })),
});

export const LootboxRollArrayReplySchema = Type.Array(LootboxRollReplySchema);
export type LootboxRollArrayReplyType = Static<
  typeof LootboxRollArrayReplySchema
>;

export type LootboxQueryStringType = Static<typeof LootboxRollQuerySchema>;
export type LootboxRollBodyType = Static<typeof LootboxRollBodySchema>;
export type LootboxRollReplyType = Static<typeof LootboxRollReplySchema>;

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
