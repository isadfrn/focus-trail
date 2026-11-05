export const ErrorCodes = {
  validation: "VALIDATION_ERROR",
  conflict: "CONFLICT",
  unauthorized: "UNAUTHORIZED",
  invalidCredentials: "INVALID_CREDENTIALS",
  notFound: "NOT_FOUND",
  emailNotVerified: "EMAIL_NOT_VERIFIED",
  invalidCode: "INVALID_CODE",
  forbiddenOrigin: "FORBIDDEN_ORIGIN",
  tooManyRequests: "TOO_MANY_REQUESTS",
  internal: "INTERNAL_ERROR",
} as const;

export class AppError extends Error {
  readonly statusCode: number;
  readonly code: string;

  constructor(message: string, statusCode: number, code: string) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.code = code;
  }
}

export class ValidationError extends AppError {
  constructor(message = "Invalid Body") {
    super(message, 400, ErrorCodes.validation);
    this.name = "ValidationError";
  }
}

export class ConflictError extends AppError {
  constructor(message = "Unable to complete registration") {
    super(message, 409, ErrorCodes.conflict);
    this.name = "ConflictError";
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Unauthorized") {
    super(message, 401, ErrorCodes.unauthorized);
    this.name = "UnauthorizedError";
  }
}

export class InvalidCredentialsError extends AppError {
  constructor(message = "Invalid Credentials") {
    super(message, 401, ErrorCodes.invalidCredentials);
    this.name = "InvalidCredentialsError";
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Not Found") {
    super(message, 404, ErrorCodes.notFound);
    this.name = "NotFoundError";
  }
}

export class EmailNotVerifiedError extends AppError {
  constructor(message = "Email Not Verified") {
    super(message, 403, ErrorCodes.emailNotVerified);
    this.name = "EmailNotVerifiedError";
  }
}

export class InvalidCodeError extends AppError {
  constructor(message = "Invalid or expired code") {
    super(message, 400, ErrorCodes.invalidCode);
    this.name = "InvalidCodeError";
  }
}
