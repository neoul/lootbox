import { Static, Type } from "@sinclair/typebox";

export const Movie = Type.Object({
  title: Type.String(),
  description: Type.String(),
  year: Type.String(),
  duration: Type.String(),
});

export type MovieType = Static<typeof Movie>;

export const SLootboxRollBody = Type.Object({
  user_id: Type.String({ format: "uuid" }), // user's data
  roll_id: Type.Union([Type.String({ pattern: "^[0-9]+$" }), Type.Number()]), // user's data
  roll_count: Type.Number(), // user's data
});

export const SLootboxRollReply = Type.Intersect([
  SLootboxRollBody,
  Type.Object({
    sequence: Type.String(),
    nonce: Type.Number(),
    server_nonce: Type.String(),
    server_timestamp: Type.String({ format: "date-time" }),
    pi: Type.Union([Type.String(), Type.Null()]),
    beta: Type.Union([Type.String(), Type.Null()]),
    random_numbers: Type.Array(Type.String()),
  }),
]);

export const SLootboxRollQuery = Type.Object({
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

export const SLootboxRollArrayReply = Type.Array(SLootboxRollReply);
export const SError = Type.Object({
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

export type TLootboxRollQuery = Static<typeof SLootboxRollQuery>;
export type TLootboxRollBody = Static<typeof SLootboxRollBody>;
export type TLootboxRollReply = Static<typeof SLootboxRollReply>;
export type TLootboxRollArrayReply = Static<typeof SLootboxRollArrayReply>;
export type TError = Static<typeof SError>;
