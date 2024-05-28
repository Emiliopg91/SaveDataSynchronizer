export class RCloneException extends Error {
  constructor(message, asserter = undefined) {
    super(message);
    Error.captureStackTrace?.(this, asserter || this.constructor);
  }
}
