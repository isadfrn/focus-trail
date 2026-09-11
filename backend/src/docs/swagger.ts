import swagger from "@fastify/swagger";
import swaggerUi from "@fastify/swagger-ui";
import type { FastifyInstance } from "fastify";

import { COOKIE_NAME } from "../lib/session.js";

export async function registerSwagger(app: FastifyInstance) {
  await app.register(swagger, {
    openapi: {
      openapi: "3.0.3",
      info: {
        title: "Focus Trail API",
        description:
          "HTTP API for Focus Trail. Authenticated routes use the `ft_token` httpOnly cookie set by register/login.",
        version: "0.1.0",
      },
      tags: [
        { name: "Health", description: "Service health" },
        { name: "Auth", description: "Registration, login, and logout" },
        { name: "User", description: "Current user profile" },
        { name: "Sessions", description: "Pomodoro sessions" },
      ],
      components: {
        securitySchemes: {
          cookieAuth: {
            type: "apiKey",
            in: "cookie",
            name: COOKIE_NAME,
            description: "Session JWT stored in the `ft_token` cookie",
          },
        },
      },
    },
  });

  await app.register(swaggerUi, {
    routePrefix: "/docs",
    uiConfig: {
      docExpansion: "list",
      deepLinking: true,
      persistAuthorization: true,
    },
  });
}
