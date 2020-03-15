import { ApplicationEvent } from './ApplicationEvent'
import { Interface } from '@tspring/core'

export interface ApplicationListener<E extends ApplicationEvent> {
	onApplicationEvent(event: E): void
}

export const ApplicationListener = new Interface('ApplicationListener')
