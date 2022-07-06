import { cloneDeep } from 'lodash'
import { UnixTimeMilli } from '../time/clock'

export interface DomainEvent {
  readonly namespace: string
  readonly name: string
  readonly id: string
  readonly occurredOn: UnixTimeMilli
  readonly props: unknown
}

export abstract class DomainEventBase<TProps extends { [key: string]: unknown }> implements DomainEvent {
  abstract readonly namespace: string
  abstract readonly name: string
  readonly id: string
  readonly occurredOn: UnixTimeMilli
  readonly props: Readonly<TProps>

  constructor({ id, occurredOn, props }: { id: string; occurredOn: UnixTimeMilli; props: TProps }) {
    this.id = id
    this.occurredOn = occurredOn
    this.props = Object.freeze(cloneDeep(props))
  }
}
