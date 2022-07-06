import { DomainEvent } from './domain-event'
import { Entity } from './entity'

export abstract class Aggregate<TId, TProps extends { [key: string]: unknown }> extends Entity<TId, TProps> {
  protected readonly domainEvents: DomainEventCollection = new DomainEventCollection()

  constructor(args: { id: TId; props: TProps }) {
    super(args)
  }

  getDomainEvents(): readonly DomainEvent[] {
    return this.domainEvents.list
  }
}

class DomainEventCollection {
  private readonly _events: DomainEvent[] = []

  protected add(domainEvent: DomainEvent): void {
    this._events.push(domainEvent)
  }

  protected remove(eventId: string): boolean {
    const idx = this._events.findIndex((e) => e.id === eventId)
    if (idx > -1) this._events.splice(idx, 1)
    return idx > -1
  }

  get list(): readonly DomainEvent[] {
    return this._events
  }

  clear(): void {
    this._events.splice(0, this._events.length)
  }
}
