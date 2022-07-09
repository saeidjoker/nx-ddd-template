/**
 * Throw this if there's a conflict in the system
 */
export abstract class ConflictError extends Error {
  constructor(message: string) {
    super(message)
  }
}
