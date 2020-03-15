import { GenericApplicationListener } from './GenericApplicationListener'
import { SmartApplicationListener } from './SmartApplicationListener'
import { Implements, isImplements, Ordered, Class } from '@tspring/core'
import { ApplicationEvent } from '../ApplicationEvent'
import { ApplicationListener } from '../ApplicationListener'

@Implements(GenericApplicationListener, SmartApplicationListener)
export class GenericApplicationListenerAdapter implements GenericApplicationListener, SmartApplicationListener {

  private delegate: ApplicationListener<ApplicationEvent>
	private static readonly eventTypeCache = new Map<Class<Object>, Class<Object>>()
  private declaredEventType: Class<Object> | undefined

	constructor(delegate: ApplicationListener<ApplicationEvent>) {
    this.delegate = delegate
		this.declaredEventType = GenericApplicationListenerAdapter.$resolveDeclaredEventType(this.delegate)
  }

	static resolveDeclaredEventType(listenerType: Class<Object>) {
    let eventType = this.eventTypeCache.get(listenerType)
		if (eventType == undefined) {
			// eventType = ResolvableType.forClass(listenerType).as(ApplicationListener.class).getGeneric()
			eventType = listenerType
			this.eventTypeCache.set(listenerType, eventType)
		}
		return (eventType != undefined ? eventType : undefined)
  }

  static $resolveDeclaredEventType(listener: ApplicationListener<ApplicationEvent>) {
		let declaredEventType = GenericApplicationListenerAdapter.resolveDeclaredEventType(listener.constructor as Class<Object>)
		if (declaredEventType == undefined || Class.isAssignableFrom(declaredEventType, ApplicationEvent)) {
			// const targetClass = AopUtils.getTargetClass(listener)
			const targetClass = listener.constructor
			if (targetClass != listener.constructor) {
				// declaredEventType = this.resolveDeclaredEventType(targetClass)
			}
		}
		return declaredEventType
	}

  onApplicationEvent(event: ApplicationEvent): void {
    throw new Error('Method not implemented.')
  }

  supportsEventType(eventType: Class<Object>): boolean
  supportsEventType<T extends ApplicationEvent>(eventType: Class<T>): boolean

  supportsEventType(eventType: Class<Object>): boolean {
		if (isImplements<SmartApplicationListener>(this.delegate, SmartApplicationListener)) {
			const eventClass = eventType as Class<ApplicationEvent>
			return (eventClass != undefined && this.delegate.supportsEventType(eventClass))
		}
		else {
			return (this.declaredEventType == undefined || Class.isAssignableFrom(this.declaredEventType, eventType))
		}
  }

  supportsSourceType(sourceType: Class<Object> | undefined): boolean {
    return !isImplements<SmartApplicationListener>(this.delegate, SmartApplicationListener) ||
      this.delegate.supportsSourceType(sourceType)
  }

  getOrder(): number {
    return isImplements<Ordered>(this.delegate, Ordered)
      ? this.delegate.getOrder()
      : Ordered.LOWEST_PRECEDENCE
  }

}
