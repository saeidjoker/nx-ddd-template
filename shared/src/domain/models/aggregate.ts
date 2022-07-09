import { DomainEvent } from '../events/domain-event'
import { DomainEvents } from '../events/domain-events'
import { Entity } from './entity'
import { DomainEventContainer } from '../events/domain-event-container'

export abstract class Aggregate<TId, TProps> extends Entity<TId, TProps> {
  private readonly _domainEventContainer: DomainEventContainer

  constructor(args: { id: TId; props: TProps }) {
    super(args)
    this._domainEventContainer = new DomainEventCollection(this)
  }

  /**
   * ID of the domain event container belonging to this aggregate
   */
  abstract get domainEventContainerId(): string

  protected addDomainEvent(domainEvent: DomainEvent): void {
    this._domainEventContainer.addEvent(domainEvent)
    DomainEvents.registerEventContainer(this._domainEventContainer)
  }
}

class DomainEventCollection implements DomainEventContainer {
  private readonly _domainEvents: DomainEvent[] = []

  constructor(private readonly aggregate: { get domainEventContainerId(): string }) {}

  get id(): string {
    return this.aggregate.domainEventContainerId
  }

  addEvent(domainEvent: DomainEvent): void {
    this._domainEvents.push(domainEvent)
  }

  get events(): readonly DomainEvent[] {
    return this._domainEvents
  }

  clear(): void {
    this._domainEvents.splice(0, this._domainEvents.length)
  }
}
