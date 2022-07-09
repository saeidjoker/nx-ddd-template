export type UnixTimeMilli = number

export abstract class Clock {
  abstract now(): UnixTimeMilli
}

export class SystemClock extends Clock {
  now(): UnixTimeMilli {
    return Date.now()
  }
}
