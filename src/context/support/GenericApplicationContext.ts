import { AbstractApplicationContext } from './AbstractApplicationContext'
import { BeanDefinitionRegistry, DefaultListableBeanFactory, ConfigurableListableBeanFactory, BeanDefinition } from '@tspring/beans'
import { ApplicationContext } from '../ApplicationContext'
import { IllegalStateException, isImplements, Implements, Resource, ResourceLoader } from '@tspring/core'

@Implements(BeanDefinitionRegistry)
export class GenericApplicationContext extends AbstractApplicationContext implements BeanDefinitionRegistry {
  private beanFactory: DefaultListableBeanFactory
	private refreshed = false
	private resourceLoader?: ResourceLoader

  constructor ()
  constructor (beanFactory: DefaultListableBeanFactory)
  constructor (parent: ApplicationContext)
  constructor (beanFactory: DefaultListableBeanFactory, parent: ApplicationContext)

  constructor (arg1?: DefaultListableBeanFactory | ApplicationContext, arg2?: ApplicationContext) {
    super()
    let beanFactory: DefaultListableBeanFactory | undefined
    let parent: ApplicationContext | undefined
    if (arg1 instanceof DefaultListableBeanFactory) {
      beanFactory = arg1
      if (isImplements<ApplicationContext>(arg2, ApplicationContext)) {
        parent = arg2
      }
    } else if (arg1) {
      parent = arg1
    }
    if (!beanFactory) {
      beanFactory = new DefaultListableBeanFactory()
    }
    this.beanFactory = beanFactory
    if (parent) {
  		this.setParent(parent)
    }
  }

  setResourceLoader(resourceLoader: ResourceLoader) {
		this.resourceLoader = resourceLoader
	}

  getResource(location: string): Resource {
    if (this.resourceLoader != undefined) {
			return this.resourceLoader.getResource(location)
		}
		return super.getResource(location)
  }

  registerBeanDefinition(beanName: string, beanDefinition: BeanDefinition): void {
    this.beanFactory.registerBeanDefinition(beanName, beanDefinition)
  }

  getBeanDefinition(beanName: string): BeanDefinition {
    return this.beanFactory.getBeanDefinition(beanName)
  }

  getBeanFactory(): ConfigurableListableBeanFactory {
    return this.beanFactory
  }

  protected refreshBeanFactory(): void {
    if (this.refreshed) {
			throw new IllegalStateException(`GenericApplicationContext does not support multiple refresh attempts: just call 'refresh' once`)
    }
    this.refreshed = true
  }

  getDefaultListableBeanFactory(): DefaultListableBeanFactory {
		return this.beanFactory
	}
}
