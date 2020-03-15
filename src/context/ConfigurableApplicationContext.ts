import { ConfigurableListableBeanFactory } from '@tspring/beans'
import { ApplicationContext } from './ApplicationContext'
import { Environment, Interface } from '@tspring/core'

export interface ConfigurableApplicationContext extends ApplicationContext {
  getBeanFactory(): ConfigurableListableBeanFactory
  refresh(): void
  setParent(parent: ApplicationContext): void
  setId(id: string): void
	setEnvironment(environment: Environment): void
	getEnvironment(): Environment

	// addBeanFactoryPostProcessor(postProcessor: BeanFactoryPostProcessor): void
	// addApplicationListener(listener: ApplicationListener<any>): void
	close(): void
	isActive(): boolean
}

export const ConfigurableApplicationContext = new Interface('ConfigurableApplicationContext', [ApplicationContext])
