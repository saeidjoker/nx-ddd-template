/**
 * Throw this if given argument in a method/function is not valid
 */
export abstract class InvalidArgumentError extends Error {
  constructor(message: string) {
    super(message)
  }
}
