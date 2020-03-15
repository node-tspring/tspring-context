import { BeanDefinitionRegistry, BeanDefinitionHolder, BeanDefinitionReaderUtils, AnnotatedGenericBeanDefinition } from '@tspring/beans'
import { Environment, Class, Supplier } from '@tspring/core'
import { AnnotationConfigUtils } from './AnnotationConfigUtils'
import { AnnotationBeanNameGenerator } from './AnnotationBeanNameGenerator'

export class AnnotatedBeanDefinitionReader {
  private registry: BeanDefinitionRegistry
  private beanNameGenerator = AnnotationBeanNameGenerator.INSTANCE

  constructor(registry: BeanDefinitionRegistry, environment?: Environment) {
    this.registry = registry
		// this.conditionEvaluator = new ConditionEvaluator(registry, environment, undefined)
		AnnotationConfigUtils.registerAnnotationConfigProcessors(this.registry)
  }

  register(...componentClasses: Class<Object>[]) {
		for (const componentClass of componentClasses) {
			this.registerBean(componentClass)
		}
  }

  registerBean(beanClass: Class<Object>) {
		this.doRegisterBean(beanClass, undefined, undefined, undefined, undefined)
  }

  private doRegisterBean<T>(
    beanClass: Class<T>,
    name: string | undefined,
    qualifiers: symbol[] | undefined,
    supplier: Supplier<T> | undefined,
    customizers: undefined // BeanDefinitionCustomizer[] | undefined
  ) {

    const abd = new AnnotatedGenericBeanDefinition(beanClass)
    // if (this.conditionEvaluator.shouldSkip(abd.getMetadata())) {
    //   return
    // }

    abd.setInstanceSupplier(supplier)
    // const scopeMetadata = this.scopeMetadataResolver.resolveScopeMetadata(abd)
    // abd.setScope(scopeMetadata.getScopeName())
    const beanName = (name != undefined ? name : this.beanNameGenerator.generateBeanName(abd, this.registry))

    AnnotationConfigUtils.processCommonDefinitionAnnotations(abd)

    if (qualifiers != undefined) {
      // for (Class<? extends Annotation> qualifier : qualifiers) {
      //   if (Primary.class == qualifier) {
      //     abd.setPrimary(true)
      //   }
      //   else if (Lazy.class == qualifier) {
      //     abd.setLazyInit(true)
      //   }
      //   else {
      //     abd.addQualifier(new AutowireCandidateQualifier(qualifier))
      //   }
      // }
    }
    if (customizers != undefined) {
      // for (const customizer of customizers) {
      //   customizer.customize(abd)
      // }
    }

    let definitionHolder = new BeanDefinitionHolder(abd, beanName)
    // definitionHolder = AnnotationConfigUtils.applyScopedProxyMode(scopeMetadata, definitionHolder, this.registry)
    BeanDefinitionReaderUtils.registerBeanDefinition(definitionHolder, this.registry)
  }
}
