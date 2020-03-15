import { BeanDefinitionRegistry, BeanDefinitionHolder, DefaultListableBeanFactory, RootBeanDefinition, AutowiredAnnotationBeanPostProcessor, AnnotatedBeanDefinition } from '@tspring/beans'
import { GenericApplicationContext } from '../support/GenericApplicationContext'
import { AnnotatedTypeMetadata, Method, Class } from '@tspring/core'
import { Lazy } from './Lazy'
import { Primary } from './Primary'
import { ContextAnnotationAutowireCandidateResolver } from './ContextAnnotationAutowireCandidateResolver'

export abstract class AnnotationConfigUtils {
  static readonly CONFIGURATION_ANNOTATION_PROCESSOR_BEAN_NAME = 'org.springframework.context.annotation.internalConfigurationAnnotationProcessor'
  static readonly CONFIGURATION_BEAN_NAME_GENERATOR = 'org.springframework.context.annotation.internalConfigurationBeanNameGenerator'
  static readonly AUTOWIRED_ANNOTATION_PROCESSOR_BEAN_NAME = 'org.springframework.context.annotation.internalAutowiredAnnotationProcessor'
  static readonly COMMON_ANNOTATION_PROCESSOR_BEAN_NAME = 'org.springframework.context.annotation.internalCommonAnnotationProcessor'
  static readonly PERSISTENCE_ANNOTATION_PROCESSOR_BEAN_NAME = 'org.springframework.context.annotation.internalPersistenceAnnotationProcessor'
  static readonly PERSISTENCE_ANNOTATION_PROCESSOR_CLASS_NAME = 'org.springframework.orm.jpa.support.PersistenceAnnotationBeanPostProcessor'
  static readonly EVENT_LISTENER_PROCESSOR_BEAN_NAME = 'org.springframework.context.event.internalEventListenerProcessor'
  static readonly EVENT_LISTENER_FACTORY_BEAN_NAME = 'org.springframework.context.event.internalEventListenerFactory'

  private static unwrapDefaultListableBeanFactory(registry: BeanDefinitionRegistry): DefaultListableBeanFactory | undefined {
		if (registry instanceof DefaultListableBeanFactory) {
			return registry
		}
		else if (registry instanceof GenericApplicationContext) {
			return registry.getDefaultListableBeanFactory()
		}
  }

  private static registerPostProcessor(registry: BeanDefinitionRegistry, definition: RootBeanDefinition, beanName: string): BeanDefinitionHolder {
    // definition.setRole(BeanDefinition.ROLE_INFRASTRUCTURE)
    registry.registerBeanDefinition(beanName, definition)
    return new BeanDefinitionHolder(definition, beanName)
  }

  static registerAnnotationConfigProcessors(registry: BeanDefinitionRegistry): void
	static registerAnnotationConfigProcessors(registry: BeanDefinitionRegistry, source: Object): Set<BeanDefinitionHolder>

	static registerAnnotationConfigProcessors(registry: BeanDefinitionRegistry, source?: Object): Set<BeanDefinitionHolder> | void {
    const beanFactory = AnnotationConfigUtils.unwrapDefaultListableBeanFactory(registry)
    if (beanFactory != undefined) {
      // if (!(beanFactory.getDependencyComparator() instanceof AnnotationAwareOrderComparator)) {
      //   beanFactory.setDependencyComparator(AnnotationAwareOrderComparator.INSTANCE)
      // }
      if (!(beanFactory.getAutowireCandidateResolver() instanceof ContextAnnotationAutowireCandidateResolver)) {
        beanFactory.setAutowireCandidateResolver(new ContextAnnotationAutowireCandidateResolver())
      }
    }

    const beanDefs = new Set<BeanDefinitionHolder>()

    if (!registry.containsBeanDefinition(AnnotationConfigUtils.CONFIGURATION_ANNOTATION_PROCESSOR_BEAN_NAME)) {
      const def = new RootBeanDefinition(Class.forName('@tspring/context:ConfigurationClassPostProcessor'))
      def.setSource(source)
      beanDefs.add(AnnotationConfigUtils.registerPostProcessor(registry, def, AnnotationConfigUtils.CONFIGURATION_ANNOTATION_PROCESSOR_BEAN_NAME))
    }

    if (!registry.containsBeanDefinition(AnnotationConfigUtils.AUTOWIRED_ANNOTATION_PROCESSOR_BEAN_NAME)) {
      const def = new RootBeanDefinition(AutowiredAnnotationBeanPostProcessor)
      def.setSource(source)
      beanDefs.add(AnnotationConfigUtils.registerPostProcessor(registry, def, AnnotationConfigUtils.AUTOWIRED_ANNOTATION_PROCESSOR_BEAN_NAME))
    }

    // // Check for JSR-250 support, and if present add the CommonAnnotationBeanPostProcessor.
    // if (jsr250Present && !registry.containsBeanDefinition(COMMON_ANNOTATION_PROCESSOR_BEAN_NAME)) {
    //   RootBeanDefinition def = new RootBeanDefinition(CommonAnnotationBeanPostProcessor.class)
    //   def.setSource(source)
    //   beanDefs.add(registerPostProcessor(registry, def, COMMON_ANNOTATION_PROCESSOR_BEAN_NAME))
    // }

    // // Check for JPA support, and if present add the PersistenceAnnotationBeanPostProcessor.
    // if (jpaPresent && !registry.containsBeanDefinition(PERSISTENCE_ANNOTATION_PROCESSOR_BEAN_NAME)) {
    //   RootBeanDefinition def = new RootBeanDefinition()
    //   try {
    //     def.setBeanClass(ClassUtils.forName(PERSISTENCE_ANNOTATION_PROCESSOR_CLASS_NAME,
    //         AnnotationConfigUtils.class.getClassLoader()))
    //   }
    //   catch (ClassNotFoundException ex) {
    //     throw new IllegalStateException(
    //         "Cannot load optional framework class: " + PERSISTENCE_ANNOTATION_PROCESSOR_CLASS_NAME, ex)
    //   }
    //   def.setSource(source)
    //   beanDefs.add(registerPostProcessor(registry, def, PERSISTENCE_ANNOTATION_PROCESSOR_BEAN_NAME))
    // }

    // if (!registry.containsBeanDefinition(AnnotationConfigUtils.EVENT_LISTENER_PROCESSOR_BEAN_NAME)) {
    //   const def = new RootBeanDefinition(EventListenerMethodProcessor)
    //   def.setSource(source)
    //   beanDefs.add(AnnotationConfigUtils.registerPostProcessor(registry, def, AnnotationConfigUtils.EVENT_LISTENER_PROCESSOR_BEAN_NAME))
    // }

    // if (!registry.containsBeanDefinition(AnnotationConfigUtils.EVENT_LISTENER_FACTORY_BEAN_NAME)) {
    //   const def = new RootBeanDefinition(DefaultEventListenerFactory)
    //   def.setSource(source)
    //   beanDefs.add(AnnotationConfigUtils.registerPostProcessor(registry, def, AnnotationConfigUtils.EVENT_LISTENER_FACTORY_BEAN_NAME))
    // }

    if (source) {
      return beanDefs
    }
  }

  static processCommonDefinitionAnnotations(abd: AnnotatedBeanDefinition, metadata?: AnnotatedTypeMetadata | Method) {
    if (metadata == undefined) {
      metadata = abd.getMetadata()
    }

  	let lazy = metadata.getAnnotationParams<Lazy.Params>(Lazy)
		if (lazy != undefined) {
			abd.setLazyInit(lazy.value)
		}
		else if (abd.getMetadata() != metadata) {
			lazy = abd.getMetadata().getAnnotationParams<Lazy.Params>(Lazy)
			if (lazy != undefined) {
				abd.setLazyInit(lazy.value)
			}
		}

		if (metadata.isAnnotated(Primary)) {
			abd.setPrimary(true)
    }

		// AnnotationAttributes dependsOn = attributesFor(metadata, DependsOn.class)
		// if (dependsOn != undefined) {
		// 	abd.setDependsOn(dependsOn.getStringArray("value"))
		// }

		// AnnotationAttributes role = attributesFor(metadata, Role.class)
		// if (role != undefined) {
		// 	abd.setRole(role.getNumber("value").intValue())
    // }

		// AnnotationAttributes description = attributesFor(metadata, Description.class)
		// if (description != undefined) {
		// 	abd.setDescription(description.getString("value"))
		// }
	}

}
