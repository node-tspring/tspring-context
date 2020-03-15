import { BeanNameGenerator, BeanDefinition, BeanDefinitionRegistry, AnnotatedBeanDefinition } from '@tspring/beans'
import { Implements, isImplements } from '@tspring/core'
import { Component } from '../../stereotype/Component'
import camelCase = require('lodash/camelCase')

@Implements(BeanNameGenerator)
export class AnnotationBeanNameGenerator implements BeanNameGenerator {
  static readonly INSTANCE = new AnnotationBeanNameGenerator()

  generateBeanName(definition: BeanDefinition, registry: BeanDefinitionRegistry): string {
    if (isImplements<AnnotatedBeanDefinition>(definition, AnnotatedBeanDefinition)) {
			const beanName = this.determineBeanNameFromAnnotation(definition)
			if (beanName) {
				// Explicit bean name found.
				return beanName
			}
		}
		// Fallback: generate a unique default bean name.
		return this.buildDefaultBeanName(definition, registry)
  }

  protected determineBeanNameFromAnnotation(annotatedDef: AnnotatedBeanDefinition) {
    const prototype = annotatedDef.getBeanClass().prototype
    const componentParams: Component.Params =  Reflect.getOwnMetadata(Component.SYMBOL, prototype)
    if (componentParams) {
      return componentParams.value
    }
  }

  protected buildDefaultBeanName(definition: BeanDefinition, registry: BeanDefinitionRegistry) {
		// const beanClassName = definition.getBeanClassName()
		const shortClassName = definition.getBeanClass().name
		return camelCase(shortClassName)
	}
}
