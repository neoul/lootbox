import { FastifyInstance } from "fastify";
import { MovieType } from "../types";
import { Movie } from "../database/entities/movie.entity";
import { IQuerystring, IReply, IdeleteReply } from "../interfaces";

export async function configureRoutes(server: FastifyInstance) {
  server.get<{ Reply: IReply }>("/", async (request, reply) => {
    const movieRepository = server.orm["typeorm"].getRepository(Movie);
    const movies = await movieRepository.find();
    reply.code(200).send({ success: true, data: { movies } });
  });
  server.post<{ Body: MovieType; Reply: IReply }>(
    "/api/movies",
    {
      preValidation: (request, reply, done) => {
        const { title, description, year, duration } = request.body;
        done(
          title.length < 2
            ? new Error("title must be more than 2 characters")
            : undefined
        );
      },
    },

    async (request, reply) => {
      // The `name` and `mail` types are automatically inferred
      const { title, description, year, duration } = request.body;
      try {
        const movie = new Movie();
        movie.title = title;
        movie.description = description;
        movie.year = year;
        movie.duration = duration;
        const movieRepository = server.orm["typeorm"].getRepository(Movie);
        const result = await movieRepository.save(movie);
        reply.status(201).send({
          success: true,
          data: {
            movies: [result],
          },
        });
      } catch (error) {
        reply.code(400).send({ error: error as string });
      }
    }
  );
  server.get<{ Querystring: IQuerystring; Reply: IReply }>(
    "/api/movies",
    {
      preValidation: (request, reply, done) => {
        const { id } = request.query;
        done(
          id === "" || undefined
            ? new Error("please provide The id")
            : undefined
        );
      },
    },
    async (request, reply) => {
      try {
        const { id } = request.query;
        const movieRepository = server.orm["typeorm"].getRepository(Movie);
        const movie = await movieRepository.findOne({ where: { id } });
        if (!movie) {
          reply.code(404).send({ error: "Movie not found" });
        } else {
          reply.code(200).send({
            success: true,
            data: {
              movies: [movie],
            },
          });
        }
      } catch (error) {
        reply.code(400).send({ error: error as string });
      }
    }
  );
  server.delete<{ Querystring: IQuerystring; Reply: IdeleteReply }>(
    "/api/movies",
    async (request, reply) => {
      const { id } = request.query;
      const movieRepository = server.orm["typeorm"].getRepository(Movie);
      const movie = await movieRepository.findOne({ where: { id } });
      if (!movie) {
        reply.code(404).send({ error: "Movie not found" });
      } else {
        await movieRepository.remove(movie);
        reply.code(200).send({ success: true });
      }
    }
  );
  server.put<{ Querystring: IQuerystring; Body: MovieType; Reply: IReply }>(
    "/api/movies",
    async (request, reply) => {
      const { id } = request.query;
      const { title, description, year, duration } = request.body;
      const movieRepository = server.orm["typeorm"].getRepository(Movie);
      const movie = await movieRepository.findOne({ where: { id } });
      if (!movie) {
        reply.code(404).send({ error: "Movie not found" });
      } else {
        movie.title = title;
        movie.description = description;
        movie.year = year;
        movie.duration = duration;
        await movieRepository.save(movie);
        reply.code(200).send({
          success: true,
          data: {
            movies: [movie],
          },
        });
      }
    }
  );
}
