import { ApplicationEvent } from '../ApplicationEvent'
import { ApplicationListener } from '../ApplicationListener'
import { Class, Interface } from '@tspring/core'

export interface ApplicationEventMulticaster {
  addApplicationListener(listener: ApplicationListener<ApplicationEvent>): void
  addApplicationListenerBean(listenerBeanName: string): void
  removeApplicationListener(listener: ApplicationListener<ApplicationEvent>): void
  removeApplicationListenerBean(listenerBeanName: string): void
  removeAllListeners(): void
  multicastEvent(event: ApplicationEvent): void
  multicastEvent(event: ApplicationEvent, eventType: Class<Object> | undefined): void
}


export const ApplicationEventMulticaster = new Interface('ApplicationEventMulticaster')
