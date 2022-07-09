import { DomainEvent, DomainEventClass } from './domain-event'
import { DomainEventContainer } from './domain-event-container'
import { DomainEventHandler } from './domain-event.handler'

export class DomainEvents {
  private static subscribers: Map<string, DomainEventHandler[]> = new Map()
  private static containers: Map<string, DomainEventContainer> = new Map()

  public static subscribe<T extends DomainEventHandler>(eventClass: DomainEventClass, eventHandler: T): void {
    let eventHandlers: DomainEventHandler[] = []
    const eventName = eventClass.name
    if (this.subscribers.has(eventName)) {
      eventHandlers = this.subscribers.get(eventName)!
    } else {
      this.subscribers.set(eventName, eventHandlers)
    }
    eventHandlers.push(eventHandler)
  }

  public static registerEventContainer(container: DomainEventContainer): void {
    if (this.containers.has(container.id)) return
    this.containers.set(container.id, container)
  }

  public static async publish(domainEventContainerId?: string, correlationId?: string): Promise<void> {
    const containers = this.getDomainEventContainersForPublish(domainEventContainerId)
    await Promise.all(
      containers.flatMap((container) => container.events.map((event) => this.publishEvent(event, correlationId))),
    )

    for (const container of containers) {
      container.clear()
      this.containers.delete(container.id)
    }
  }

  private static async publishEvent(event: DomainEvent, correlationId?: string): Promise<void> {
    if (correlationId && !event.correlationId) {
      event.correlationId = correlationId
    }
    const eventName = event.constructor.name
    if (!this.subscribers.has(eventName)) return
    await Promise.all(this.subscribers.get(eventName)!.map((handler) => handler.handle(event)))
  }

  private static getDomainEventContainersForPublish(domainEventContainerId?: string): DomainEventContainer[] {
    if (domainEventContainerId) {
      const container = this.containers.get(domainEventContainerId)
      return container ? [container] : []
    }
    return [...this.containers.entries()].map(([_, container]) => container)
  }
}
