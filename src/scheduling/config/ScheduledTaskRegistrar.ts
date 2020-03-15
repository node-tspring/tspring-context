import { Implements, CollectionUtils } from '@tspring/core'
import { ScheduledTaskHolder } from './ScheduledTaskHolder'
import { InitializingBean, DisposableBean } from '@tspring/beans'
import { ScheduledTask } from './ScheduledTask'
import { FixedRateTask } from './FixedRateTask'
import { FixedDelayTask } from './FixedDelayTask'
import { CronTask } from './CronTask'

@Implements(ScheduledTaskHolder, InitializingBean, DisposableBean)
export class ScheduledTaskRegistrar implements ScheduledTaskHolder, InitializingBean, DisposableBean {
  static readonly CRON_DISABLED = '-'

  // private triggerTasks?: TriggerTask[]
  private cronTasks?: CronTask[]
  private fixedRateTasks?: FixedRateTask[]
  private fixedDelayTasks?: FixedDelayTask[]
  private scheduledTasks = new Set<ScheduledTask>()

  destroy(): void {

  }

  getScheduledTasks(): Set<ScheduledTask> {
    return this.scheduledTasks
  }

  afterPropertiesSet() {
    this.scheduleTasks()
  }

  scheduleTasks() {
		// if (this.triggerTasks != undefined) {
		// 	for (const task of this.triggerTasks) {
		// 		this.addScheduledTask(this.scheduleTriggerTask(task))
		// 	}
		// }
		if (this.cronTasks != undefined) {
			for (const task of this.cronTasks) {
        if (!task.isRunning()) task.start()
			}
		}
		if (this.fixedRateTasks != undefined) {
			for (const task of this.fixedRateTasks) {
        if (!task.isRunning()) task.start()
			}
		}
		if (this.fixedDelayTasks != undefined) {
			for (const task of this.fixedDelayTasks) {
        if (!task.isRunning()) task.start()
			}
		}
  }

  addScheduledTask(task: ScheduledTask) {
    if (task != undefined) {
			this.scheduledTasks.add(task)
      if (!task.isRunning()) task.start()
		}
  }

  hasTasks(): boolean {
    return (
      // !CollectionUtils.isEmpty(this.triggerTasks) ||
      !CollectionUtils.isEmpty(this.cronTasks) ||
      !CollectionUtils.isEmpty(this.fixedRateTasks) ||
      !CollectionUtils.isEmpty(this.fixedDelayTasks)
    )
  }

  scheduleFixedRateTask(task: FixedRateTask): ScheduledTask {
    this.addScheduledTask(task)
    this.addFixedRateTask(task)
		return task
  }

  scheduleFixedDelayTask(task: FixedDelayTask): ScheduledTask {
    this.addScheduledTask(task)
    this.addFixedDelayTask(task)
		return task
  }

  scheduleCronTask(task: CronTask): ScheduledTask {
    this.addScheduledTask(task)
    this.addCronTask(task)
		return task
  }

  addFixedRateTask(task: FixedRateTask) {
    if (this.fixedRateTasks == undefined) {
			this.fixedRateTasks = []
		}
		this.fixedRateTasks.push(task)
  }

  addFixedDelayTask(task: FixedDelayTask) {
    if (this.fixedDelayTasks == undefined) {
			this.fixedDelayTasks = []
		}
		this.fixedDelayTasks.push(task)
  }

  addCronTask(task: CronTask) {
    if (this.cronTasks == undefined) {
			this.cronTasks = []
		}
		this.cronTasks.push(task)
  }
}
