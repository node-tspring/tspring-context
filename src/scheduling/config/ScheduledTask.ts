import { Interface } from '@tspring/core'

export interface ScheduledTask {
  start(): void
  stop(): void
  isRunning(): boolean
}

export const ScheduledTask = new Interface('ScheduledTask')
