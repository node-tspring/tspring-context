import { ScheduledTask } from './ScheduledTask'
import { Implements } from '@tspring/core'

@Implements(ScheduledTask)
export class FixedRateTask implements ScheduledTask {
  start(): void {
    throw new Error('Method not implemented.')
  }
  stop(): void {
    throw new Error('Method not implemented.')
  }
  isRunning(): boolean {
    throw new Error('Method not implemented.')
  }
  constructor(...args: any[]) {}
}
