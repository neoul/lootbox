import { FastifyInstance, FastifyPluginOptions, FastifyReply, FastifyRequest } from 'fastify';

interface UserRequest extends FastifyRequest {
  // Define any custom properties for the request here
}

const handler_v1 = async (request: UserRequest, reply: FastifyReply) => {
  // Your handler logic here
  reply.code(200).send({ success: true, data: {  } });
};

export const userRoutes = (fastify: FastifyInstance, opts: FastifyPluginOptions, done: () => void) => {
  fastify.get('/user', handler_v1);
  done();
};