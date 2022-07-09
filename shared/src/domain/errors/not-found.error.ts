/**
 * Throw this if there's a missing part in the system
 */
export abstract class NotFoundError extends Error {
  constructor(message: string) {
    super(message)
  }
}
