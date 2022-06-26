export abstract class Entity<TId, TProps extends { [key: string]: unknown }> {
  readonly id: TId
  protected props: TProps

  constructor({ id, props }: { id: TId; props: TProps }) {
    this.id = id
    this.props = props
  }
}
