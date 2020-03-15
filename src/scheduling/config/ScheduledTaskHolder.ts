import { ScheduledTask } from './ScheduledTask'
import { Interface } from '@tspring/core'

export interface ScheduledTaskHolder {

	getScheduledTasks(): Set<ScheduledTask>

}

export const ScheduledTaskHolder = new Interface('ScheduledTaskHolder')
