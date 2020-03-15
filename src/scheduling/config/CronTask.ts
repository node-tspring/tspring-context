import { CronJob } from 'cron'
import { ScheduledTask } from './ScheduledTask'
import { Implements } from '@tspring/core'

@Implements(ScheduledTask)
export class CronTask implements ScheduledTask {
  private job: CronJob

  constructor (private onTick: () => void, cronExpression: string, timeZone: string) {
    this.job = new CronJob(cronExpression, async () => {
      await this.onTick()
    }, undefined, false, timeZone)
  }

  start () {
    this.job.start()
  }

  stop () {
    this.job.stop()
  }

  isRunning() {
    return this.job.running || false
  }
}
