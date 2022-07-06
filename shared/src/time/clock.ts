import { Injectable } from '@nestjs/common'

export type UnixTimeMilli = number

export abstract class Clock {
  abstract now(): UnixTimeMilli
}

@Injectable()
export class SystemClock extends Clock {
  now(): UnixTimeMilli {
    return Date.now()
  }
}
