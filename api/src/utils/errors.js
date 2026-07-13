export class AppException extends Error {
  constructor(message, statusCode = 500, errors = null) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.errors = errors;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class NotFoundError extends AppException {
  constructor(message = "Resource not found", errors = null) {
    super(message, 404, errors);
  }
}

export class BadRequestError extends AppException {
  constructor(message = "Bad request", errors = null) {
    super(message, 400, errors);
  }
}

export class UnauthorizedError extends AppException {
  constructor(message = "Unauthorized access", errors = null) {
    super(message, 401, errors);
  }
}

export class ForbiddenError extends AppException {
  constructor(message = "Access forbidden", errors = null) {
    super(message, 403, errors);
  }
}

export class ConflictError extends AppException {
  constructor(message = "Conflict occurred", errors = null) {
    super(message, 409, errors);
  }
}

export class UnprocessableEntityError extends AppException {
  constructor(message = "Validation or processing failed", errors = null) {
    super(message, 422, errors);
  }
}
