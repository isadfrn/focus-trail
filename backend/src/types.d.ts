import "@fastify/jwt";
import type { FastifyReply, FastifyRequest } from "fastify";

interface SessionToken {
  sub: string;
  email: string;
}

declare module "@fastify/jwt" {
  interface FastifyJWT {
    payload: SessionToken;
    user: SessionToken;
  }
}

declare module "fastify" {
  interface FastifyInstance {
    authenticate: (
      request: FastifyRequest,
      reply: FastifyReply,
    ) => Promise<void>;
  }
}
