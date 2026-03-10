export class DomainError extends Error {
  constructor(message, options = {}) {
    super(message);
    this.name = this.constructor.name;
    this.code = options.code;
    this.cause = options.cause;
    this.details = options.details;
  }
}

export class ValidationError extends DomainError {}

export class ApiError extends DomainError {
  constructor(message, options = {}) {
    super(message, options);
    this.status = options.status;
  }
}

export const toApiError = (error, fallbackMessage = "API request failed") => {
  if (error instanceof DomainError) {
    return error;
  }

  const message = error?.message || fallbackMessage;
  return new ApiError(message, {
    code: error?.code,
    status: error?.status,
    cause: error,
    details: error?.details
  });
};

export const withApiErrorHandling = async (operation, fallbackMessage) => {
  try {
    return await operation();
  } catch (error) {
    throw toApiError(error, fallbackMessage);
  }
};
