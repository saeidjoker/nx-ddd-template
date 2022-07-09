import { DomainEvent, DomainEventClass } from './domain-event'
import { DomainEvents } from './domain-events'

export abstract class DomainEventHandler {
  constructor(private readonly eventClass: DomainEventClass) {}

  abstract handle(event: DomainEvent): Promise<void>

  public listen(): void {
    DomainEvents.subscribe(this.eventClass, this)
  }
}