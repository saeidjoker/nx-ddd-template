import { DomainEvent } from './domain-event'

export interface DomainEventContainer {
  get id(): string
  /**
   * Add a domain event to this container
   * @param domainEvent
   */
  addEvent(domainEvent: DomainEvent): void
  /**
   * Get all events
   */
  get events(): readonly DomainEvent[]
  /**
   * Clear all events
   */
  clear(): void
}
