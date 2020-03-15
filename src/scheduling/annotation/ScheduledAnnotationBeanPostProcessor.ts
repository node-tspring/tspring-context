import { Implements, Class, StandardAnnotationMetadata, Method, IllegalArgumentException, IllegalStateException, CollectionUtils, StringUtils } from '@tspring/core'
import { SmartInitializingSingleton, MergedBeanDefinitionPostProcessor, RootBeanDefinition, BeanFactory, BeanFactoryAware, BeanNameAware } from '@tspring/beans'
import { Scheduled, CRON_DISABLED } from './Scheduled'
import moment from 'moment'
import { ApplicationContext } from '../../context/ApplicationContext'
import { ApplicationContextAware } from '../../context/ApplicationContextAware'
import { ScheduledTask } from '../config/ScheduledTask'
import { CronTask } from '../config/CronTask'
import { FixedDelayTask } from '../config/FixedDelayTask'
import { FixedRateTask } from '../config/FixedRateTask'
import { ScheduledTaskRegistrar } from '../config/ScheduledTaskRegistrar'

class TimeZone {
  static getDefault(): any {

  }
}

@Implements(
  MergedBeanDefinitionPostProcessor,
  SmartInitializingSingleton,
  BeanFactoryAware,
  BeanNameAware,
  ApplicationContextAware
)
export class ScheduledAnnotationBeanPostProcessor implements
  MergedBeanDefinitionPostProcessor,
  SmartInitializingSingleton,
  BeanFactoryAware,
  BeanNameAware,
  ApplicationContextAware
{
  private nonAnnotatedClasses = new Set<Class<Object>>()
  private scheduledTasks = new Map<Object, Set<ScheduledTask>>()
  private embeddedValueResolver?: any // StringValueResolver
  private registrar: ScheduledTaskRegistrar
  private applicationContext?: ApplicationContext
  private beanFactory?: BeanFactory
  private beanName?: string

  constructor () {
		this.registrar = new ScheduledTaskRegistrar()
  }

  setBeanName(beanName: string): void {
		this.beanName = beanName
  }

  setBeanFactory(beanFactory: BeanFactory) {
		this.beanFactory = beanFactory
	}

  setApplicationContext(applicationContext: ApplicationContext) {
		this.applicationContext = applicationContext
		if (this.beanFactory == undefined) {
			this.beanFactory = applicationContext
		}
	}

  afterSingletonsInstantiated(): void {
    console.log('ScheduledAnnotationBeanPostProcessor#afterSingletonsInstantiated()')
		this.nonAnnotatedClasses.clear()
    if (this.applicationContext == undefined) {
			// Not running in an ApplicationContext -> register tasks early...
			this.finishRegistration()
		}
  }

  finishRegistration() {
    // if (this.scheduler != undefined) {
		// 	this.registrar.setScheduler(this.scheduler)
		// }

		// if (isImplements<ListableBeanFactory>(this.beanFactory, ListableBeanFactory)) {
		// 	const beans =	this.beanFactory.getBeansOfType(SchedulingConfigurer)
		// 	const configurers = Array.from(beans.values())
		// 	AnnotationAwareOrderComparator.sort(configurers)
		// 	for (const configurer of configurers) {
		// 		configurer.configureTasks(this.registrar)
		// 	}
		// }

		this.registrar.afterPropertiesSet()
  }

  postProcessMergedBeanDefinition(beanDefinition: RootBeanDefinition, beanType: Class<Object>, beanName: string): void {
    // console.log('### postProcessMergedBeanDefinition:', beanName)
  }

  resetBeanDefinition(beanName: string): void {

  }

  postProcessBeforeInitialization(bean: Object, beanName: string) {
    return bean
  }

  postProcessAfterInitialization(bean: Object, beanName: string) {
    // if (bean instanceof AopInfrastructureBean || bean instanceof TaskScheduler ||
    //     bean instanceof ScheduledExecutorService) {
    //   // Ignore AOP infrastructure such as scoped proxies.
    //   return bean
    // }

    const beanClass = bean.constructor as Class<Object>
    if (!this.nonAnnotatedClasses.has(beanClass)) {
      const md = new StandardAnnotationMetadata(bean.constructor as Class<Object>)
      const annotatedMethods = md.getAnnotatedMethods(Scheduled)
      if (annotatedMethods.size == 0) {
        this.nonAnnotatedClasses.add(beanClass)
        console.debug(`No @Scheduled annotations found on bean class: ${beanClass.name}`)
      }
      else {
        for (const annotatedMethod of annotatedMethods) {
          this.processScheduled(annotatedMethod, bean)
        }
      }
    }
    return bean
  }

	protected processScheduled(annotatedMethod: Method, bean: Object) {

    try {
      const scheduled = annotatedMethod.getAnnotationParams<Scheduled.Params>(Scheduled)!

			const runnable = this.createRunnable(bean, annotatedMethod)
			let processedSchedule = false
			const errorMessage = `Exactly one of the 'cron', 'fixedDelay(string)', or 'fixedRate(string)' attributes is required`

			const tasks = new Set<ScheduledTask>()

			// Determine initial delay
			let initialDelay = scheduled.initialDelay || -1
			let initialDelayString = scheduled.initialDelayString || ''
			if (StringUtils.hasText(initialDelayString)) {
				if (this.embeddedValueResolver != undefined) {
					initialDelayString = this.embeddedValueResolver.resolveStringValue(initialDelayString)
				}
				if (StringUtils.hasLength(initialDelayString)) {
					try {
						initialDelay = this.parseDelayAsLong(initialDelayString)
					} catch (ex) {
						throw new IllegalArgumentException(`Invalid initialDelayString value '${initialDelayString}' - cannot parse into long`)
					}
				}
			}

			// Check cron expression
			let cron = scheduled.cron || ''
			if (StringUtils.hasText(cron)) {
				let zone = scheduled.zone
				if (this.embeddedValueResolver != undefined) {
					cron = this.embeddedValueResolver.resolveStringValue(cron)
					zone = this.embeddedValueResolver.resolveStringValue(zone)
				}
				if (StringUtils.hasLength(cron)) {
					processedSchedule = true
					if (CRON_DISABLED != cron) {
						let timeZone
						if (StringUtils.hasText(zone)) {
							timeZone = StringUtils.parseTimeZoneString(zone)
						}
						else {
							timeZone = TimeZone.getDefault()
						}
						tasks.add(this.registrar.scheduleCronTask(new CronTask(runnable, cron, timeZone))!)
					}
				}
			}

			// At this point we don't need to differentiate between initial delay set or not anymore
			if (initialDelay < 0) {
				initialDelay = 0
			}

			// Check fixed delay
			let fixedDelay = scheduled.fixedDelay || -1
			if (fixedDelay >= 0) {
				processedSchedule = true
				tasks.add(this.registrar.scheduleFixedDelayTask(new FixedDelayTask(runnable, fixedDelay, initialDelay)))
			}
			let fixedDelayString = scheduled.fixedDelayString || ''
			if (StringUtils.hasText(fixedDelayString)) {
				if (this.embeddedValueResolver != undefined) {
					fixedDelayString = this.embeddedValueResolver.resolveStringValue(fixedDelayString)
				}
				if (StringUtils.hasLength(fixedDelayString)) {
					processedSchedule = true
					try {
						fixedDelay = this.parseDelayAsLong(fixedDelayString)
					}
					catch (ex) {
						throw new IllegalArgumentException(`Invalid fixedDelayString value '${fixedDelayString}' - cannot parse into long`)
					}
					tasks.add(this.registrar.scheduleFixedDelayTask(new FixedDelayTask(runnable, fixedDelay, initialDelay)))
				}
			}

			// Check fixed rate
			let fixedRate = scheduled.fixedRate || -1
			if (fixedRate >= 0) {
				processedSchedule = true
				tasks.add(this.registrar.scheduleFixedRateTask(new FixedRateTask(runnable, fixedRate, initialDelay)))
			}
			let fixedRateString = scheduled.fixedRateString || ''
			if (StringUtils.hasText(fixedRateString)) {
				if (this.embeddedValueResolver != undefined) {
					fixedRateString = this.embeddedValueResolver.resolveStringValue(fixedRateString)
				}
				if (StringUtils.hasLength(fixedRateString)) {
					processedSchedule = true
					try {
						fixedRate = this.parseDelayAsLong(fixedRateString)
					}
					catch (ex) {
						throw new IllegalArgumentException(`Invalid fixedRateString value '${fixedRateString}' - cannot parse into long`)
					}
					tasks.add(this.registrar.scheduleFixedRateTask(new FixedRateTask(runnable, fixedRate, initialDelay)))
				}
			}

			// Check whether we had any attribute set
			// Assert.isTrue(processedSchedule, errorMessage)

			// Finally register the scheduled tasks
      const regTasks = CollectionUtils.computeIfAbsent<Object, Set<ScheduledTask>>(this.scheduledTasks, bean, key => new Set<ScheduledTask>())
      CollectionUtils.addAll(regTasks, tasks)
		} catch (ex) {
			throw new IllegalStateException(`Encountered invalid @Scheduled method '${annotatedMethod.getName().toString()}`, ex)
		}
  }

  createRunnable(bean: Object, annotatedMethod: Method) {
    return () => {
      (bean as any)[annotatedMethod.getName()]()
    }
  }

  parseDelayAsLong(value: string): any {
    if (value.length > 1 && (value.charAt(0)=='P' || value.charAt(1)=='P')) {
			return moment.duration(value).asMilliseconds()
		}
		return parseInt(value)
  }
}
