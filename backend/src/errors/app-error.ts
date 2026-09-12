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
    super(message, 400, "VALIDATION_ERROR");
    this.name = "ValidationError";
  }
}

export class ConflictError extends AppError {
  constructor(message = "Unable to complete registration") {
    super(message, 409, "CONFLICT");
    this.name = "ConflictError";
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Unauthorized") {
    super(message, 401, "UNAUTHORIZED");
    this.name = "UnauthorizedError";
  }
}

export class InvalidCredentialsError extends AppError {
  constructor(message = "Invalid Credentials") {
    super(message, 401, "INVALID_CREDENTIALS");
    this.name = "InvalidCredentialsError";
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Not Found") {
    super(message, 404, "NOT_FOUND");
    this.name = "NotFoundError";
  }
}

export class EmailNotVerifiedError extends AppError {
  constructor(message = "Email Not Verified") {
    super(message, 403, "EMAIL_NOT_VERIFIED");
    this.name = "EmailNotVerifiedError";
  }
}

export class InvalidCodeError extends AppError {
  constructor(message = "Invalid or expired code") {
    super(message, 400, "INVALID_CODE");
    this.name = "InvalidCodeError";
  }
}
