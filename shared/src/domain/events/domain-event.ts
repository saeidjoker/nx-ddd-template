import { cloneDeep } from 'lodash'
import { UnixTimeMilli } from '../../time/clock'

export interface DomainEventOptions {
  id: string
  occurredOn: UnixTimeMilli
  aggregateId?: string
  correlationId?: string
  payload?: unknown
}

export abstract class DomainEvent {
  /**
   * A unique id for the event object
   */
  readonly id: string
  /**
   * When this event occurred
   */
  readonly occurredOn: UnixTimeMilli
  /**
   * Optional aggregate ID. Usually this has a value
   */
  readonly aggregateId?: string
  /**
   * ID for correlation purposes (for UnitOfWork, Integration Events,logs correlation etc).
   * This ID is set in a publisher, if it's not set here in the constructor
   */
  correlationId?: string
  /**
   * custom payload
   */
  readonly payload?: Readonly<unknown>

  constructor({ id, occurredOn, aggregateId, correlationId, payload }: DomainEventOptions) {
    this.id = id
    this.aggregateId = aggregateId
    this.correlationId = correlationId
    this.occurredOn = occurredOn
    this.payload = Object.freeze(cloneDeep(payload))
  }
}

export type DomainEventClass = new (...args: never[]) => DomainEvent