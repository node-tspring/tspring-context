import { AbstractApplicationEventMulticaster } from './AbstractApplicationEventMulticaster'
import { ApplicationEvent } from '../ApplicationEvent'
import { Class, ErrorHandler } from '@tspring/core'
import { BeanFactory } from '@tspring/beans'
import { ApplicationListener } from '../ApplicationListener'

export class SimpleApplicationEventMulticaster extends AbstractApplicationEventMulticaster {
  private errorHandler?: ErrorHandler

  constructor ()
  constructor (beanFactory: BeanFactory)
  constructor (beanFactory?: BeanFactory) {
    super()
    if (beanFactory != undefined) this.setBeanFactory(beanFactory)
  }

  multicastEvent(event: ApplicationEvent): void
  multicastEvent(event: ApplicationEvent, eventType: Class<Object> | undefined): void
  multicastEvent(event: ApplicationEvent, eventType?: Class<Object>) {
    const type = (eventType != undefined ? eventType : this.resolveDefaultEventType(event))
		for (const listener of this.getApplicationListeners(event, type)) {
      this.invokeListener(listener, event)
    }
  }

  protected invokeListener(listener: ApplicationListener<ApplicationEvent>, event: ApplicationEvent) {
		const errorHandler = this.getErrorHandler()
		if (errorHandler != undefined) {
			try {
				this.doInvokeListener(listener, event)
			}
			catch (err) {
				errorHandler.handleError(err)
			}
		}
		else {
			this.doInvokeListener(listener, event)
		}
  }

  private doInvokeListener(listener: ApplicationListener<ApplicationEvent>, event: ApplicationEvent) {
    listener.onApplicationEvent(event)
	}

  getErrorHandler() {
		return this.errorHandler
  }

  private resolveDefaultEventType(event: ApplicationEvent) {
		return event.constructor as Class<Object>
	}
}
