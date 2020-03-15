import { GenericApplicationContext } from '../support/GenericApplicationContext'
import { AnnotationConfigRegistry } from './AnnotationConfigRegistry'
import { Class, isImplements, Implements } from '@tspring/core'
import { DefaultListableBeanFactory, BeanDefinitionRegistry } from '@tspring/beans'
import { ApplicationContext } from '../ApplicationContext'
import { AnnotationConfigUtils } from './AnnotationConfigUtils'

@Implements(AnnotationConfigRegistry)
export class AnnotationConfigApplicationContext extends GenericApplicationContext implements AnnotationConfigRegistry {

  constructor ()
  constructor(beanFactory: DefaultListableBeanFactory)
	constructor(...componentClasses: Class<Object>[])
	constructor(...basePackages: string[])

  constructor (arg1?: DefaultListableBeanFactory | Class<Object> | string, ...arg2: any[]) {
    super(
      (arg1 instanceof DefaultListableBeanFactory || isImplements<ApplicationContext>(arg1, ApplicationContext))
        ? arg1
        : undefined as any,
      (arg2.length == 1 && isImplements<ApplicationContext>(arg2[0], ApplicationContext))
        ? arg2[0]
        : undefined as any
    )

    if (arg1 instanceof DefaultListableBeanFactory) {

    }

    else if (typeof arg1 == 'string') {

    }

    else {

    }

    const registry: BeanDefinitionRegistry = this
		AnnotationConfigUtils.registerAnnotationConfigProcessors(registry)
  }

  register(...componentClasses: Class<Object>[]): void {
    throw new Error('Method not implemented.')
  }

  scan(...basePackages: string[]): void {
    throw new Error('Method not implemented.')
  }

}
