import { ApplicationListener } from '../ApplicationListener'
import { ApplicationEvent } from '../ApplicationEvent'
import { Ordered, Class, Interface } from '@tspring/core'

export interface GenericApplicationListener extends ApplicationListener<ApplicationEvent>, Ordered {
  supportsEventType(eventType: Class<Object>): boolean
	supportsSourceType(sourceType: Class<Object> | undefined): boolean
}

export const GenericApplicationListener = new Interface(
  'GenericApplicationListener',
  [ApplicationListener, Ordered]
)
