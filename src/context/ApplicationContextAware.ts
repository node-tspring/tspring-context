import { Aware } from '@tspring/beans'
import { ApplicationContext } from './ApplicationContext'
import { Interface } from '@tspring/core'

export interface ApplicationContextAware extends Aware {
	setApplicationContext(applicationContext: ApplicationContext): void
}

export const ApplicationContextAware = new Interface('ApplicationContextAware', [Aware])
