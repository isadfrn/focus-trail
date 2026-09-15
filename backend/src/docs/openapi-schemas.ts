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
  required: [
    "id",
    "email",
    "character",
    "focusMinutes",
    "breakMinutes",
    "autoCycle",
    "longBreakMinutes",
    "pomodorosUntilLongBreak",
    "dailyFocusGoalMinutes",
    "createdAt",
  ],
  additionalProperties: false,
  properties: {
    id: { type: "string", format: "uuid" },
    email: { type: "string", format: "email" },
    character: { type: "string" },
    focusMinutes: { type: "integer", minimum: 1, maximum: 180 },
    breakMinutes: { type: "integer", minimum: 1, maximum: 60 },
    autoCycle: { type: "boolean" },
    longBreakMinutes: { type: "integer", minimum: 1, maximum: 60 },
    pomodorosUntilLongBreak: { type: "integer", minimum: 1, maximum: 12 },
    dailyFocusGoalMinutes: { type: "integer", minimum: 0, maximum: 1440 },
    createdAt: { type: "string", format: "date-time" },
  },
} as const;

export const updatePreferencesBodySchema = {
  type: "object",
  additionalProperties: false,
  minProperties: 1,
  properties: {
    character: { type: "string", minLength: 1, maxLength: 50 },
    focusMinutes: { type: "integer", minimum: 1, maximum: 180 },
    breakMinutes: { type: "integer", minimum: 1, maximum: 60 },
    autoCycle: { type: "boolean" },
    longBreakMinutes: { type: "integer", minimum: 1, maximum: 60 },
    pomodorosUntilLongBreak: { type: "integer", minimum: 1, maximum: 12 },
    dailyFocusGoalMinutes: { type: "integer", minimum: 0, maximum: 1440 },
  },
} as const;

export const changePasswordBodySchema = {
  type: "object",
  required: ["currentPassword", "newPassword"],
  additionalProperties: false,
  properties: {
    currentPassword: { type: "string", minLength: 1, maxLength: 200 },
    newPassword: {
      type: "string",
      minLength: 10,
      maxLength: 200,
      description: "At least 10 characters with one letter and one digit",
    },
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
    taskLabel: { type: ["string", "null"], maxLength: 120 },
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
    taskLabel: { type: "string", maxLength: 120 },
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

export const updatePreferencesSchemaDoc = {
  tags: ["User"],
  summary: "Update current user preferences",
  description:
    "Updates the default scene and/or the focus and break timer durations.",
  security: cookieAuthSecurity,
  body: updatePreferencesBodySchema,
  response: {
    200: {
      type: "object",
      required: ["user"],
      additionalProperties: false,
      properties: {
        user: meUserSchema,
      },
    },
    400: errorResponseSchema,
    401: errorResponseSchema,
  },
} satisfies FastifySchema;

export const changePasswordSchemaDoc = {
  tags: ["User"],
  summary: "Change password",
  description: "Verifies the current password before setting a new one.",
  security: cookieAuthSecurity,
  body: changePasswordBodySchema,
  response: {
    200: {
      type: "object",
      required: ["ok"],
      additionalProperties: false,
      properties: {
        ok: { type: "boolean", enum: [true] },
      },
    },
    400: errorResponseSchema,
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
  summary: "List pomodoro sessions (paginated, filterable)",
  description:
    "Keyset pagination via `cursor` (pass `nextCursor` from the previous page). Filters combine with AND.",
  security: cookieAuthSecurity,
  querystring: {
    type: "object",
    additionalProperties: false,
    properties: {
      limit: { type: "integer", minimum: 1, maximum: 100 },
      cursor: { type: "string", format: "uuid" },
      from: { type: "string", format: "date-time" },
      to: { type: "string", format: "date-time" },
      type: { type: "string", enum: ["focus", "break"] },
      task: { type: "string", minLength: 1, maxLength: 120 },
      completed: { type: "string", enum: ["true", "false"] },
      durationOp: { type: "string", enum: ["eq", "gt", "lt"] },
      durationSeconds: { type: "integer", minimum: 0, maximum: 60 * 60 * 24 },
    },
  },
  response: {
    200: {
      type: "object",
      required: ["sessions", "nextCursor"],
      additionalProperties: false,
      properties: {
        sessions: {
          type: "array",
          items: pomodoroSessionSchema,
        },
        nextCursor: { type: ["string", "null"] },
      },
    },
    400: errorResponseSchema,
    401: errorResponseSchema,
  },
} satisfies FastifySchema;

export const dailyStatSchema = {
  type: "object",
  required: [
    "date",
    "focusSeconds",
    "breakSeconds",
    "completedFocus",
    "interruptedFocus",
    "sessions",
  ],
  additionalProperties: false,
  properties: {
    date: { type: "string" },
    focusSeconds: { type: "integer", minimum: 0 },
    breakSeconds: { type: "integer", minimum: 0 },
    completedFocus: { type: "integer", minimum: 0 },
    interruptedFocus: { type: "integer", minimum: 0 },
    sessions: { type: "integer", minimum: 0 },
  },
} as const;

export const statsTotalsSchema = {
  type: "object",
  required: [
    "focusSeconds",
    "breakSeconds",
    "completedFocus",
    "interruptedFocus",
    "sessions",
  ],
  additionalProperties: false,
  properties: {
    focusSeconds: { type: "integer", minimum: 0 },
    breakSeconds: { type: "integer", minimum: 0 },
    completedFocus: { type: "integer", minimum: 0 },
    interruptedFocus: { type: "integer", minimum: 0 },
    sessions: { type: "integer", minimum: 0 },
  },
} as const;

export const statsSchemaDoc = {
  tags: ["Sessions"],
  summary: "Daily focus/break statistics aggregated in the database",
  description:
    "Groups the authenticated user's sessions by day. Optionally filtered by `from`/`to`. Days are truncated in UTC.",
  security: cookieAuthSecurity,
  querystring: {
    type: "object",
    additionalProperties: false,
    properties: {
      from: { type: "string", format: "date-time" },
      to: { type: "string", format: "date-time" },
    },
  },
  response: {
    200: {
      type: "object",
      required: ["days", "totals"],
      additionalProperties: false,
      properties: {
        days: { type: "array", items: dailyStatSchema },
        totals: statsTotalsSchema,
      },
    },
    400: errorResponseSchema,
    401: errorResponseSchema,
  },
} satisfies FastifySchema;

export const deleteResultSchema = {
  type: "object",
  required: ["deleted"],
  additionalProperties: false,
  properties: {
    deleted: { type: "integer", minimum: 0 },
  },
} as const;

export const deleteSessionsBodySchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    ids: {
      type: "array",
      items: { type: "string", format: "uuid" },
      minItems: 1,
      maxItems: 500,
    },
    all: { type: "boolean", enum: [true] },
  },
} as const;

export const deleteSessionSchemaDoc = {
  tags: ["Sessions"],
  summary: "Delete a pomodoro session",
  security: cookieAuthSecurity,
  params: {
    type: "object",
    required: ["id"],
    additionalProperties: false,
    properties: {
      id: { type: "string", format: "uuid" },
    },
  },
  response: {
    200: deleteResultSchema,
    400: errorResponseSchema,
    401: errorResponseSchema,
    404: errorResponseSchema,
  },
} satisfies FastifySchema;

export const deleteSessionsSchemaDoc = {
  tags: ["Sessions"],
  summary: "Delete pomodoro sessions (some or all)",
  description:
    "Provide `ids` to delete specific sessions, or `all: true` to delete every session of the authenticated user.",
  security: cookieAuthSecurity,
  body: deleteSessionsBodySchema,
  response: {
    200: deleteResultSchema,
    400: errorResponseSchema,
    401: errorResponseSchema,
  },
} satisfies FastifySchema;

export const okResponseSchema = {
  type: "object",
  required: ["ok"],
  additionalProperties: false,
  properties: {
    ok: { type: "boolean", enum: [true] },
  },
} as const;

export const emailRequestBodySchema = {
  type: "object",
  required: ["email"],
  additionalProperties: false,
  properties: {
    email: { type: "string", format: "email", maxLength: 254 },
  },
} as const;

export const verifyEmailBodySchema = {
  type: "object",
  required: ["email", "code"],
  additionalProperties: false,
  properties: {
    email: { type: "string", format: "email", maxLength: 254 },
    code: { type: "string", pattern: "^\\d{6}$" },
  },
} as const;

export const resetPasswordBodySchema = {
  type: "object",
  required: ["email", "code", "newPassword"],
  additionalProperties: false,
  properties: {
    email: { type: "string", format: "email", maxLength: 254 },
    code: { type: "string", pattern: "^\\d{6}$" },
    newPassword: {
      type: "string",
      minLength: 10,
      maxLength: 200,
      description: "At least 10 characters with one letter and one digit",
    },
  },
} as const;

export const verifyEmailSchemaDoc = {
  tags: ["Auth"],
  summary: "Verify email with a 6-digit code",
  description:
    "Confirms the account email and sets the `ft_token` session cookie.",
  body: verifyEmailBodySchema,
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

export const resendVerificationSchemaDoc = {
  tags: ["Auth"],
  summary: "Resend the email verification code",
  description: "Always returns `ok` to avoid account enumeration.",
  body: emailRequestBodySchema,
  response: {
    200: okResponseSchema,
    400: errorResponseSchema,
  },
} satisfies FastifySchema;

export const forgotPasswordSchemaDoc = {
  tags: ["Auth"],
  summary: "Request a password reset code",
  description: "Always returns `ok` to avoid account enumeration.",
  body: emailRequestBodySchema,
  response: {
    200: okResponseSchema,
    400: errorResponseSchema,
  },
} satisfies FastifySchema;

export const resetPasswordSchemaDoc = {
  tags: ["Auth"],
  summary: "Reset the password with a code",
  body: resetPasswordBodySchema,
  response: {
    200: okResponseSchema,
    400: errorResponseSchema,
  },
} satisfies FastifySchema;

export const exportDataSchemaDoc = {
  tags: ["User"],
  summary: "Export all account data (LGPD)",
  description:
    "Returns the authenticated user and all their pomodoro sessions as JSON.",
  security: cookieAuthSecurity,
  response: {
    200: {
      type: "object",
      required: ["exportedAt", "user", "sessions"],
      additionalProperties: false,
      properties: {
        exportedAt: { type: "string", format: "date-time" },
        user: meUserSchema,
        sessions: {
          type: "array",
          items: pomodoroSessionSchema,
        },
      },
    },
    401: errorResponseSchema,
  },
} satisfies FastifySchema;

export const deleteAccountBodySchema = {
  type: "object",
  required: ["password"],
  additionalProperties: false,
  properties: {
    password: { type: "string", minLength: 1, maxLength: 200 },
  },
} as const;

export const deleteAccountSchemaDoc = {
  tags: ["User"],
  summary: "Delete the account and all data (LGPD)",
  description:
    "Requires the current password. Cascades to the user's sessions and clears the session cookie.",
  security: cookieAuthSecurity,
  body: deleteAccountBodySchema,
  response: {
    200: okResponseSchema,
    400: errorResponseSchema,
    401: errorResponseSchema,
  },
} satisfies FastifySchema;
