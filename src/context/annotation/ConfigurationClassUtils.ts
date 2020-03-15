import { BeanDefinition, AnnotatedBeanDefinition } from '@tspring/beans'
import { Configuration } from './Configuration'
import { isImplements, Order, AnnotationMetadata, Ordered, Conventions } from '@tspring/core'
import { ConfigurationClassPostProcessor } from './ConfigurationClassPostProcessor'

const ORDER_ATTRIBUTE = Conventions.getQualifiedAttributeName(ConfigurationClassPostProcessor, 'order')

export abstract class ConfigurationClassUtils {

	static getOrder(metadata: AnnotationMetadata): number | undefined
	static getOrder(beanDef: BeanDefinition): number

  static getOrder(arg1: AnnotationMetadata | BeanDefinition) {
    if (isImplements<AnnotationMetadata>(arg1, AnnotationMetadata)) {
      const orderParams = arg1.getAnnotationParams<Order.Params>(Order)
      return orderParams != undefined ? orderParams.value : undefined
    }

    else {
      const order = arg1.getAttribute(ORDER_ATTRIBUTE)
      return (order != undefined ? order : Ordered.LOWEST_PRECEDENCE)
    }
  }

  static checkConfigurationClassCandidate(beanDef: BeanDefinition, metadataReaderFactory: any) {
    if (isImplements<AnnotatedBeanDefinition>(beanDef, AnnotatedBeanDefinition)) {
      return beanDef.getMetadata().isAnnotated(Configuration)
    }
    return false
  }
}
