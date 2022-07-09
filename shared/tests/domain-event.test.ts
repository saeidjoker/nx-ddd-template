import { Aggregate, DomainEvents, SystemClock, uuid } from '../src'
import { DomainEventHandler } from '../src/domain/events/domain-event.handler'
import { DomainEvent, DomainEventOptions } from '../src/domain/events/domain-event'

class UserNameChanged extends DomainEvent {
  constructor(options: DomainEventOptions) {
    super(options)
  }
}

describe('DomainEvents', () => {
  test('Ensure event is published', async () => {
    const bag: string[] = []
    class UserNameChangedHandler extends DomainEventHandler {
      constructor() {
        super(UserNameChanged)
      }
      async handle(event: UserNameChanged): Promise<void> {
        bag.push(`event handled: ${event.correlationId}`)
      }
    }
    interface UserProps {
      name: string
    }
    class User extends Aggregate<string, UserProps> {
      constructor(id: string, props: UserProps) {
        super({ id, props })
      }
      get domainEventContainerId(): string {
        return this.id
      }
      protected validateInitialState(): void {}

      setName(name: string): void {
        this.props.name = name
        this.addDomainEvent(
          new UserNameChanged({
            id: uuid(),
            occurredOn: new SystemClock().now(),
            correlationId: this.id,
            payload: {
              newName: name,
            },
          }),
        )
      }
    }

    const h = new UserNameChangedHandler()
    h.listen()
    const user = new User(uuid(), { name: 'saeed' })
    user.setName('akbar')
    await DomainEvents.publish()
    // second call must not work since first call to publish will clear containers
    await DomainEvents.publish()

    expect(bag.length).toBe(1)
    expect(bag[0]).toBe(`event handled: ${user.id}`)
  })
})
