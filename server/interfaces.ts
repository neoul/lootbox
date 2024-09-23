import { MovieType, LootboxOutputType, LootboxInputType } from "./types";
import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";

interface IReply {
  201: {
    success: boolean;
    data: {
      movies: MovieType[];
    };
  };
  302: { url: string };
  "4xx": { error: string };
  "5xx": { error: string };
  200: {
    success: boolean;
    data: {
      movies: MovieType[];
    };
  };
}
interface IQuerystring {
  id: string;
}
interface IdeleteReply {
  200: {
    success: boolean;
  };
  404: {
    error: string;
  };
}
interface IRollReply {
  200: {
    success: boolean;
    data: LootboxOutputType[];
  };
  201: {
    success: boolean;
    data: LootboxOutputType[];
  };
  302: { url: string };
  "4xx": { error: string };
  "5xx": { error: string };
}

export type LootboxPost = {
  Body: LootboxInputType;
  // Querystring: LootboxInputQuery;
  // Params: LootboxInputParams;
  Reply: IRollReply;
};

export { IReply, IQuerystring, IdeleteReply };
