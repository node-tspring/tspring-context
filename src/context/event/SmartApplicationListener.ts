import { Ordered, Class, Interface } from '@tspring/core'
import { ApplicationListener } from '../ApplicationListener'
import { ApplicationEvent } from '../ApplicationEvent'

export interface SmartApplicationListener extends ApplicationListener<ApplicationEvent>, Ordered {
  supportsEventType<T extends ApplicationEvent>(eventType: Class<T>): boolean
	supportsSourceType(sourceType: Class<Object> | undefined): boolean
}

export const SmartApplicationListener = new Interface(
  'SmartApplicationListener',
  [ApplicationListener, Ordered]
)
