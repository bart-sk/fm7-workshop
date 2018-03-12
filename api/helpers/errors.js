export const HTTP_CODES = {
  ERROR: 500,
  BAD_REQUEST: 400,
  NOT_FOUND: 404,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  METHOD_NOT_ALLOWED: 405,
  CONFLICT: 409,
};

export class RESTError extends Error {
  constructor(statusCode = HTTP_CODES.ERROR, name = 'UNKNOWN_ERROR', description = null, payload = undefined, userinfo = undefined) {
    super(description || name);
    this.name = name;
    this.statusCode = statusCode;
    this.description = description;
    this.payload = payload;
    this.userinfo = userinfo;
  }
}

export class RESTErrorNotFound extends RESTError {
  constructor(name = 'NOT_FOUND', description = null, payload = undefined, userinfo = undefined) {
    super(HTTP_CODES.NOT_FOUND, name, description, payload, userinfo);
  }
}

export class RESTErrorForbidden extends RESTError {
  constructor(name = 'FORBIDDEN', description = null, payload = undefined, userinfo = undefined) {
    super(HTTP_CODES.FORBIDDEN, name, description, payload, userinfo);
  }
}

export class RESTErrorUnauthorized extends RESTError {
  constructor(name = 'UNAUTHORIZED', description = null, payload = undefined, userinfo = undefined) {
    super(HTTP_CODES.UNAUTHORIZED, name, description, payload, userinfo);
  }
}

export class RESTErrorConflict extends RESTError {
  constructor(name = 'CONFLICT', description = null, payload = undefined, userinfo = undefined) {
    super(HTTP_CODES.CONFLICT, name, description, payload, userinfo);
  }
}

export class RESTErrorBadRequest extends RESTError {
  constructor(name = 'BAD_REQUEST', description = null, payload = undefined, userinfo = undefined) {
    super(HTTP_CODES.BAD_REQUEST, name, description, payload, userinfo);
  }
}

export const finalErrorHandler = (req, res) => {
  if (!res.headersSent) {
    res.status(404);
    res.json({
      statusCode: 404,
      name: 'NOT_FOUND',
      description: `Route is not defined in Swagger specification (${req.method} ${req.originalUrl})`
    })
  }
};
