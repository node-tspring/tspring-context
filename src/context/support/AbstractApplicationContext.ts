import { Class, Implements, Environment, Resource, ResourcePatternResolver, PathMatchingResourcePatternResolver, DefaultResourceLoader, ConfigurableEnvironment, StandardEnvironment } from '@tspring/core'
import {
  ConfigurableListableBeanFactory,
  AutowireCapableBeanFactory,
  BeanFactory,
  ObjectProvider,
  BeanFactoryPostProcessor,
} from '@tspring/beans'
import { ConfigurableApplicationContext } from '../ConfigurableApplicationContext'
import { ApplicationContext } from '../ApplicationContext'
import { PostProcessorRegistrationDelegate } from './PostProcessorRegistrationDelegate'
import { StandardBeanExpressionResolver } from '../expression/StandardBeanExpressionResolver'
import { ApplicationContextAwareProcessor } from './ApplicationContextAwareProcessor'

@Implements(ConfigurableApplicationContext)
export abstract class AbstractApplicationContext extends DefaultResourceLoader implements ConfigurableApplicationContext {

  private active = false
  private closed = true
  private environment?: Environment
	private parent?: ApplicationContext
	private id?: string
	private beanFactoryPostProcessors: BeanFactoryPostProcessor[] = []
	private resourcePatternResolver: ResourcePatternResolver

  abstract getBeanFactory(): ConfigurableListableBeanFactory
  protected abstract refreshBeanFactory(): void

  constructor() {
    super()
		this.resourcePatternResolver = this.getResourcePatternResolver()
  }

  protected getResourcePatternResolver(): ResourcePatternResolver {
		return new PathMatchingResourcePatternResolver(this)
	}

  getResources(locationPattern: string): Resource[] {
		return this.resourcePatternResolver.getResources(locationPattern)
  }

	protected prepareBeanFactory(beanFactory: ConfigurableListableBeanFactory) {
		beanFactory.setBeanExpressionResolver(new StandardBeanExpressionResolver())

		beanFactory.addBeanPostProcessor(new ApplicationContextAwareProcessor(this))

  }

  containsBean(name: string): boolean {
		return this.getBeanFactory().containsBean(name)
  }

  getBeansWithAnnotation(annotationType: symbol) {
    return this.getBeanFactory().getBeansWithAnnotation(annotationType)
  }

  getBeansOfType<T>(type: Class<T>): Map<string, T>
  getBeansOfType<T>(type: Class<T>, includeNonSingletons: boolean, allowEagerInit: boolean): Map<string, T>

  getBeansOfType<T>(type: Class<T>, includeNonSingletons?: boolean, allowEagerInit?: boolean) {
    return this.getBeanFactory().getBeansOfType(type, includeNonSingletons!, allowEagerInit!)
  }

  getBeanNamesForType(type: Class<Object>, includeNonSingletons: boolean, allowEagerInit: boolean): string[] {
		return this.getBeanFactory().getBeanNamesForType(type, includeNonSingletons, allowEagerInit)
  }

  protected prepareRefresh() {
		// Switch to active.
		this.closed = false
		this.active = true

		// if (logger.isDebugEnabled()) {
		// 	if (logger.isTraceEnabled()) {
		// 		logger.trace("Refreshing " + this)
		// 	}
		// 	else {
		// 		logger.debug("Refreshing " + getDisplayName())
		// 	}
		// }

		// // Initialize any placeholder property sources in the context environment.
		// initPropertySources()

		// // Validate that all properties marked as required are resolvable:
		// // see ConfigurablePropertyResolver#setRequiredProperties
		// getEnvironment().validateRequiredProperties()

		// // Store pre-refresh ApplicationListeners...
		// if (this.earlyApplicationListeners == undefined) {
		// 	this.earlyApplicationListeners = new LinkedHashSet<>(this.applicationListeners)
		// }
		// else {
		// 	// Reset local application listeners to pre-refresh state.
		// 	this.applicationListeners.clear()
		// 	this.applicationListeners.addAll(this.earlyApplicationListeners)
		// }

		// // Allow for the collection of early ApplicationEvents,
		// // to be published once the multicaster is available...
		// this.earlyApplicationEvents = new LinkedHashSet<>()
	}

  refresh(): void {
    // 准备刷新上下文
    this.prepareRefresh()

    // 获取 beanFactory
		const beanFactory = this.obtainFreshBeanFactory()

    // 准备 beanFactory
    this.prepareBeanFactory(beanFactory)

    this.postProcessBeanFactory(beanFactory)

    this.invokeBeanFactoryPostProcessors(beanFactory)

    this.registerBeanPostProcessors(beanFactory)

    this.initMessageSource()

    this.initApplicationEventMulticaster()

    this.onRefresh()

    this.registerListeners()

    this.finishBeanFactoryInitialization(beanFactory)

    this.finishRefresh()

  }

  protected finishRefresh() {

  }

  protected registerListeners() {
  }

  protected onRefresh() {
  }

  protected initApplicationEventMulticaster() {
  }

  protected initMessageSource() {
  }

  protected postProcessBeanFactory(beanFactory: ConfigurableListableBeanFactory) {
    // Nothing todo
  }

  obtainFreshBeanFactory () {
    this.refreshBeanFactory()
		return this.getBeanFactory()
  }

  protected registerBeanPostProcessors(beanFactory: ConfigurableListableBeanFactory) {
		PostProcessorRegistrationDelegate.registerBeanPostProcessors(beanFactory, this)
  }

  getBeanFactoryPostProcessors() {
		return this.beanFactoryPostProcessors
	}

  protected invokeBeanFactoryPostProcessors (beanFactory: ConfigurableListableBeanFactory) {
		PostProcessorRegistrationDelegate.invokeBeanFactoryPostProcessors(beanFactory, this.getBeanFactoryPostProcessors())
  }

  finishBeanFactoryInitialization(beanFactory: ConfigurableListableBeanFactory) {
		beanFactory.freezeConfiguration()
    beanFactory.preInstantiateSingletons()
  }

  setEnvironment(environment: Environment) {
		this.environment = environment
	}

  getEnvironment(): Environment {
		if (this.environment == undefined) {
			this.environment = this.createEnvironment()
		}
		return this.environment!
  }

  protected createEnvironment(): ConfigurableEnvironment {
		return new StandardEnvironment()
  }

  setParent(parent: ApplicationContext): void {
    this.parent = parent
		if (parent != undefined) {
			const parentEnvironment = parent.getEnvironment()
			// if (parentEnvironment instanceof ConfigurableEnvironment) {
			// 	this.getEnvironment().merge(parentEnvironment)
			// }
		}
  }

  setId(id: string): void {
    this.id = id
  }

  getId(): string {
		return this.id!
  }

  close(): void {
    console.debug('close Method not implemented.')
  }

  getAutowireCapableBeanFactory(): AutowireCapableBeanFactory {
    return this.getBeanFactory()
  }

  isActive(): boolean {
    return this.active
  }

  getParent() {
		return this.parent
	}

  getParentBeanFactory(): BeanFactory | undefined {
		return this.getParent()
  }

  containsLocalBean(name: string): boolean {
		return this.getBeanFactory().containsLocalBean(name)
  }

  isSingleton(name: string): boolean {
    return this.getBeanFactory().isSingleton(name)
  }
  isTypeMatch(name: string, typeToMatch: Class<Object>): boolean {
    return this.getBeanFactory().isTypeMatch(name, typeToMatch)
  }
  getType(name: string): Class<Object> | undefined {
    return this.getBeanFactory().getType(name)
  }

  getBeanProvider<T>(requiredType: Class<T>): ObjectProvider<T> {
    return this.getBeanFactory().getBeanProvider(requiredType)
  }

  getBean<T>(name: string): T
  getBean<T>(name: string, type: Class<T>): T
  getBean<T>(name: string, ...args: any[]): T
  getBean<T>(type: Class<T>): T
  getBean<T>(type: Class<T>, ...args: any[]): T
  getBean<T>(arg1: string | Class<T>, ...arg2: any[]): T {
		return this.getBeanFactory().getBean<T>(arg1 as any, ...arg2)
  }

  getBeanDefinitionNames(): string[] {
		return this.getBeanFactory().getBeanDefinitionNames()
  }

  containsBeanDefinition(baenName: string): boolean {
    return this.getBeanFactory().containsBeanDefinition(baenName)
  }

}
