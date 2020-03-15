import { ListableBeanFactory, AutowireCapableBeanFactory, HierarchicalBeanFactory } from '@tspring/beans'
import { Environment, ResourcePatternResolver, Interface } from '@tspring/core'

export interface ApplicationContext extends ListableBeanFactory, HierarchicalBeanFactory, ResourcePatternResolver {
  getAutowireCapableBeanFactory(): AutowireCapableBeanFactory
  setEnvironment(environment: Environment): void
  getEnvironment(): Environment
	getId(): string
}

export const ApplicationContext = new Interface(
  'ApplicationContext',
  [ListableBeanFactory, HierarchicalBeanFactory, ResourcePatternResolver]
)
