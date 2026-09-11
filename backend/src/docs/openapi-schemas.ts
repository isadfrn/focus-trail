import type { FastifySchema } from "fastify";

export const errorResponseSchema = {
  type: "object",
  required: ["error"],
  additionalProperties: false,
  properties: {
    error: { type: "string" },
  },
} as const;

export const publicUserSchema = {
  type: "object",
  required: ["id", "email", "character"],
  additionalProperties: false,
  properties: {
    id: { type: "string", format: "uuid" },
    email: { type: "string", format: "email" },
    character: { type: "string" },
  },
} as const;

export const meUserSchema = {
  type: "object",
  required: ["id", "email", "character", "createdAt"],
  additionalProperties: false,
  properties: {
    id: { type: "string", format: "uuid" },
    email: { type: "string", format: "email" },
    character: { type: "string" },
    createdAt: { type: "string", format: "date-time" },
  },
} as const;

export const credentialsBodySchema = {
  type: "object",
  required: ["email", "password"],
  additionalProperties: false,
  properties: {
    email: {
      type: "string",
      format: "email",
      maxLength: 254,
    },
    password: {
      type: "string",
      minLength: 10,
      maxLength: 200,
      description: "At least 10 characters with one letter and one digit",
    },
  },
} as const;

export const pomodoroSessionSchema = {
  type: "object",
  required: [
    "id",
    "userId",
    "startedAt",
    "endedAt",
    "durationSeconds",
    "type",
    "completed",
    "character",
    "createdAt",
  ],
  additionalProperties: false,
  properties: {
    id: { type: "string", format: "uuid" },
    userId: { type: "string", format: "uuid" },
    startedAt: { type: "string", format: "date-time" },
    endedAt: { type: "string", format: "date-time" },
    durationSeconds: { type: "integer", minimum: 0 },
    type: { type: "string", enum: ["focus", "break"] },
    completed: { type: "boolean" },
    character: { type: "string" },
    createdAt: { type: "string", format: "date-time" },
  },
} as const;

export const createSessionBodySchema = {
  type: "object",
  required: ["startedAt", "endedAt", "durationSeconds", "type", "completed"],
  additionalProperties: false,
  properties: {
    startedAt: { type: "string", format: "date-time" },
    endedAt: { type: "string", format: "date-time" },
    durationSeconds: {
      type: "integer",
      minimum: 0,
      maximum: 60 * 60 * 24,
    },
    type: { type: "string", enum: ["focus", "break"] },
    completed: { type: "boolean" },
  },
} as const;

export const cookieAuthSecurity = [{ cookieAuth: [] }] as const;

export const healthSchema = {
  tags: ["Health"],
  summary: "Health check",
  response: {
    200: {
      type: "object",
      required: ["status"],
      additionalProperties: false,
      properties: {
        status: { type: "string", enum: ["ok"] },
      },
    },
  },
} satisfies FastifySchema;

export const registerSchema = {
  tags: ["Auth"],
  summary: "Register a new user",
  description:
    "Creates a user and sets the `ft_token` httpOnly session cookie.",
  body: credentialsBodySchema,
  response: {
    201: {
      type: "object",
      required: ["user"],
      additionalProperties: false,
      properties: {
        user: publicUserSchema,
      },
    },
    400: errorResponseSchema,
    409: errorResponseSchema,
  },
} satisfies FastifySchema;

export const loginSchema = {
  tags: ["Auth"],
  summary: "Login",
  description:
    "Authenticates with email/password and sets the `ft_token` httpOnly session cookie.",
  body: credentialsBodySchema,
  response: {
    200: {
      type: "object",
      required: ["user"],
      additionalProperties: false,
      properties: {
        user: publicUserSchema,
      },
    },
    400: errorResponseSchema,
    401: errorResponseSchema,
  },
} satisfies FastifySchema;

export const logoutSchema = {
  tags: ["Auth"],
  summary: "Logout",
  description: "Clears the `ft_token` session cookie.",
  response: {
    200: {
      type: "object",
      required: ["ok"],
      additionalProperties: false,
      properties: {
        ok: { type: "boolean", enum: [true] },
      },
    },
  },
} satisfies FastifySchema;

export const meSchema = {
  tags: ["User"],
  summary: "Get current user",
  security: cookieAuthSecurity,
  response: {
    200: {
      type: "object",
      required: ["user"],
      additionalProperties: false,
      properties: {
        user: meUserSchema,
      },
    },
    401: errorResponseSchema,
  },
} satisfies FastifySchema;

export const createSessionSchemaDoc = {
  tags: ["Sessions"],
  summary: "Create a pomodoro session",
  security: cookieAuthSecurity,
  body: createSessionBodySchema,
  response: {
    201: {
      type: "object",
      required: ["session"],
      additionalProperties: false,
      properties: {
        session: pomodoroSessionSchema,
      },
    },
    400: errorResponseSchema,
    401: errorResponseSchema,
  },
} satisfies FastifySchema;

export const listSessionsSchema = {
  tags: ["Sessions"],
  summary: "List pomodoro sessions",
  description: "Returns up to 100 sessions for the authenticated user.",
  security: cookieAuthSecurity,
  response: {
    200: {
      type: "object",
      required: ["sessions"],
      additionalProperties: false,
      properties: {
        sessions: {
          type: "array",
          items: pomodoroSessionSchema,
        },
      },
    },
    401: errorResponseSchema,
  },
} satisfies FastifySchema;
