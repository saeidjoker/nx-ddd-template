import { cloneDeep, isEqual } from 'lodash'

export abstract class ValueObject<TProps extends { [key: string]: unknown }> {
  readonly props: Readonly<TProps>

  constructor(props: TProps) {
    this.validate(props)
    this.props = Object.freeze(cloneDeep(props))
  }

  equals(vo?: ValueObject<TProps>): boolean {
    return vo && vo.props && isEqual(this.props, vo.props)
  }

  protected abstract validate(props: TProps): void
}
