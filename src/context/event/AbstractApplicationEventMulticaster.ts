import { BeanFactoryAware, BeanFactory, ConfigurableBeanFactory, NoSuchBeanDefinitionException } from '@tspring/beans'
import { ApplicationEventMulticaster } from './ApplicationEventMulticaster'
import { Implements, Class, isImplements, IllegalStateException, ObjectUtils, StringUtils, CollectionUtils, AnnotationAwareOrderComparator } from '@tspring/core'
import { ApplicationListener } from '../ApplicationListener'
import { ApplicationEvent } from '../ApplicationEvent'
import { SmartApplicationListener } from './SmartApplicationListener'
import { GenericApplicationListener } from './GenericApplicationListener'
import { GenericApplicationListenerAdapter } from './GenericApplicationListenerAdapter'

class ListenerCacheKey {

  private eventType: Class<Object>

  private sourceType?: Class<Object>

  constructor(eventType: Class<Object>, sourceType?: Class<Object> ) {
    this.eventType = eventType
    this.sourceType = sourceType
  }

  equals(other: Object | undefined) {
    if (this == other) {
      return true
    }
    if (!(other instanceof ListenerCacheKey)) {
      return false
    }
    const otherKey = other
    return (ObjectUtils.nullSafeEquals(this.eventType, otherKey.eventType) &&
        ObjectUtils.nullSafeEquals(this.sourceType, otherKey.sourceType))
  }

  toString() {
    return `ListenerCacheKey [eventType = ${this.eventType}, sourceType = ${this.sourceType}]`
  }

  compareTo(other: ListenerCacheKey) {
    let result = StringUtils.compareTo(this.eventType.toString(), other.eventType.toString())
    if (result == 0) {
      if (this.sourceType == undefined) {
        return (other.sourceType == undefined ? 0 : -1)
      }
      if (other.sourceType == undefined) {
        return 1
      }
      result = StringUtils.compareTo(this.sourceType.name, (other.sourceType.name))
    }
    return result
  }
}

interface ListenerRetriever {
  applicationListeners: Set<ApplicationListener<ApplicationEvent>>
  applicationListenerBeans: Set<string>
  getApplicationListeners(): ApplicationListener<ApplicationEvent>[]
}

@Implements(ApplicationEventMulticaster, BeanFactoryAware)
export abstract class AbstractApplicationEventMulticaster	implements ApplicationEventMulticaster, BeanFactoryAware {
  private beanFactory?: ConfigurableBeanFactory
	private defaultRetriever: ListenerRetriever
	private retrieverCache = new Map<ListenerCacheKey, ListenerRetriever>()

  abstract multicastEvent(event: ApplicationEvent): void
  abstract multicastEvent(event: ApplicationEvent, eventType: Class<Object> | undefined): void

  constructor () {
    this.defaultRetriever = new this.ListenerRetriever(false)
  }

  getBeanFactory() {
    if (this.beanFactory == undefined) {
			throw new IllegalStateException('ApplicationEventMulticaster cannot retrieve listener beans because it is not associated with a BeanFactory')
		}
    return this.beanFactory
  }

  setBeanFactory(beanFactory: BeanFactory): void {
    if (!(isImplements<ConfigurableBeanFactory>(beanFactory, ConfigurableBeanFactory))) {
			throw new IllegalStateException(`Not running in a ConfigurableBeanFactory: ${beanFactory}`)
		}
		this.beanFactory = beanFactory
  }

  addApplicationListener(listener: ApplicationListener<ApplicationEvent>): void {
    // Explicitly remove target for a proxy, if registered already,
    // in order to avoid double invocations of the same listener.
    const singletonTarget = listener // AopProxyUtils.getSingletonTarget(listener)
    if (isImplements<ApplicationListener<ApplicationEvent>>(singletonTarget, ApplicationListener)) {
      this.defaultRetriever.applicationListeners.delete(singletonTarget)
    }
    this.defaultRetriever.applicationListeners.add(listener)
  }

  addApplicationListenerBean(listenerBeanName: string): void {
    this.defaultRetriever.applicationListenerBeans.add(listenerBeanName)
		this.retrieverCache.clear()
  }

  removeApplicationListener(listener: ApplicationListener<ApplicationEvent>): void {
    this.defaultRetriever.applicationListeners.delete(listener)
    this.retrieverCache.clear()
  }

  removeApplicationListenerBean(listenerBeanName: string): void {
    this.defaultRetriever.applicationListenerBeans.delete(listenerBeanName)
		this.retrieverCache.clear()
  }

  removeAllListeners(): void {
    this.defaultRetriever.applicationListeners.clear()
    this.defaultRetriever.applicationListenerBeans.clear()
    this.retrieverCache.clear()
  }

  protected getApplicationListeners(): ApplicationListener<ApplicationEvent>[]
  protected getApplicationListeners(event: ApplicationEvent, eventType: Class<Object>): ApplicationListener<ApplicationEvent>[]

  protected getApplicationListeners(event?: ApplicationEvent, eventType?: Class<Object>) {
    if (event != undefined && eventType != undefined) {
      const source = event.getSource()
      const sourceType = (source != undefined ? source.constructor as Class<Object> : undefined)
      const cacheKey = new ListenerCacheKey(eventType, sourceType)

      // Quick check for existing entry on ConcurrentHashMap...
      let retriever = this.retrieverCache.get(cacheKey)
      if (retriever != undefined) {
        return retriever.getApplicationListeners()
      }
      retriever = this.retrieverCache.get(cacheKey)
      if (retriever != undefined) {
        return retriever.getApplicationListeners()
      }
      retriever = new this.ListenerRetriever(true)
      const listeners = this.retrieveApplicationListeners(eventType, sourceType, retriever)
      this.retrieverCache.set(cacheKey, retriever)
      return listeners
    }

    return this.defaultRetriever.getApplicationListeners()
  }

  private retrieveApplicationListeners(eventType: Class<Object>, sourceType?: Class<Object>, retriever?: ListenerRetriever) {

    const allListeners: ApplicationListener<ApplicationEvent>[] = []
    let listeners = new Set<ApplicationListener<ApplicationEvent>>(this.defaultRetriever.applicationListeners)
    let listenerBeans = new Set<string>(this.defaultRetriever.applicationListenerBeans)

    // Add programmatically registered listeners, including ones coming
    // from ApplicationListenerDetector (singleton beans and inner beans).
    for (const listener of listeners) {
      if (this.supportsEvent(listener, eventType, sourceType)) {
        if (retriever != undefined) {
          retriever.applicationListeners.add(listener)
        }
        allListeners.push(listener)
      }
    }

    // Add listeners by bean name, potentially overlapping with programmatically
    // registered listeners above - but here potentially with additional metadata.
    if (listenerBeans.size > 0) {
      const beanFactory = this.getBeanFactory()
      for (const listenerBeanName of listenerBeans) {
        try {
          if (this.$supportsEvent(beanFactory, listenerBeanName, eventType)) {
            const listener = beanFactory.getBean<ApplicationListener<ApplicationEvent>>(listenerBeanName, ApplicationListener)
            if (allListeners.indexOf(listener) == -1 && this.supportsEvent(listener, eventType, sourceType)) {
              if (retriever != undefined) {
                if (beanFactory.isSingleton(listenerBeanName)) {
                  retriever.applicationListeners.add(listener)
                }
                else {
                  retriever.applicationListenerBeans.add(listenerBeanName)
                }
              }
              allListeners.push(listener)
            }
          }
          else {
            // Remove non-matching listeners that originally came from
            // ApplicationListenerDetector, possibly ruled out by additional
            // BeanDefinition metadata (e.g. factory method generics) above.
            const listener = beanFactory.getSingleton<ApplicationListener<ApplicationEvent>>(listenerBeanName)
            if (listener != undefined) {
              if (retriever != undefined) {
                retriever.applicationListeners.delete(listener)
              }
              allListeners.splice(allListeners.indexOf(listener), 1)
            }
          }
        }
        catch (ex) {
          if (!(ex instanceof NoSuchBeanDefinitionException)) {
            throw ex
          }
          // Singleton listener instance (without backing bean definition) disappeared -
          // probably in the middle of the destruction phase
        }
      }
    }

    AnnotationAwareOrderComparator.sort(allListeners)
    if (retriever != undefined && retriever.applicationListenerBeans.size == 0) {
      retriever.applicationListeners.clear()
      CollectionUtils.addAll(retriever.applicationListeners, allListeners)
    }
    return allListeners
  }

  private $supportsEvent(beanFactory: ConfigurableBeanFactory, listenerBeanName: string, eventType: Class<Object>): boolean {

    const listenerType = beanFactory.getType(listenerBeanName)
    if (listenerType == undefined || Class.isAssignableFrom(GenericApplicationListener, listenerType) ||
      Class.isAssignableFrom(SmartApplicationListener, listenerType)) {
      return true
    }
    if (!this.supportsEvent(listenerType, eventType)) {
      return false
    }
    try {
      const bd = beanFactory.getMergedBeanDefinition(listenerBeanName)
      // const genericEventType = bd.getResolvableType().as(ApplicationListener).getGeneric()
      const genericEventType = bd.getResolvableType()
      // return (genericEventType == ResolvableType.NONE || genericEventType.isAssignableFrom(eventType))
      return (genericEventType == undefined || Class.isAssignableFrom(genericEventType, eventType))
    }
    catch (ex) {
      if (ex instanceof NoSuchBeanDefinitionException) {
        return true
      }
      // Ignore - no need to check resolvable type for manually registered singleton
      throw ex
    }
  }

  protected supportsEvent(listenerType: Class<Object>, eventType: Class<Object>): boolean
  protected supportsEvent(listener: ApplicationListener<ApplicationEvent>, eventType: Class<Object>, sourceType?: Class<Object>): boolean

  protected supportsEvent(arg1: Class<Object> | ApplicationListener<ApplicationEvent>, eventType: Class<Object>, sourceType?: Class<Object>): boolean {
    if (Class.isClass(arg1)) {
      const declaredEventType = GenericApplicationListenerAdapter.resolveDeclaredEventType(arg1)
      return (declaredEventType == undefined || Class.isAssignableFrom(declaredEventType, eventType))
    }

    else {
      const smartListener = isImplements<GenericApplicationListener>(arg1, GenericApplicationListener)
        ? arg1
        : new GenericApplicationListenerAdapter(arg1)
		  return (smartListener.supportsEventType(eventType) && smartListener.supportsSourceType(sourceType))
    }
  }

  private ListenerRetriever = ((outerThis) => class ListenerRetriever {

    applicationListeners = new Set<ApplicationListener<ApplicationEvent>>()

    applicationListenerBeans = new Set<string>()

    preFiltered: boolean

    constructor(preFiltered: boolean) {
      this.preFiltered = preFiltered
    }

    getApplicationListeners() {
      const allListeners: ApplicationListener<ApplicationEvent>[] = []
      CollectionUtils.addAll(allListeners, this.applicationListeners)
      if (!CollectionUtils.isEmpty(this.applicationListenerBeans)) {
        const beanFactory = outerThis.getBeanFactory()
        for (const listenerBeanName of this.applicationListenerBeans) {
          try {
            const listener = beanFactory.getBean<ApplicationListener<ApplicationEvent>>(listenerBeanName, ApplicationListener)
            if (this.preFiltered || allListeners.indexOf(listener) == -1) {
              allListeners.push(listener)
            }
          }
          catch (ex) {
            // Singleton listener instance (without backing bean definition) disappeared -
            // probably in the middle of the destruction phase
          }
        }
      }
      if (!this.preFiltered || this.applicationListenerBeans.size > 0) {
        AnnotationAwareOrderComparator.sort(allListeners)
      }
      return allListeners
    }
  })(this)
}
