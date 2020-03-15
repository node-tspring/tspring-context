import { BeanDefinitionRegistry, BeanNameGenerator, BeanDefinition, RootBeanDefinition, AnnotatedBeanDefinition, AnnotatedGenericBeanDefinition, BeanDefinitionHolder } from '@tspring/beans'
import { ResourceLoader, Environment, AnnotationMetadata, Method, Implements } from '@tspring/core'
import { ConfigurationClass } from './ConfigurationClass'
import { BeanMethod } from './BeanMethod'
import { Bean } from './Bean'
import { AnnotationConfigUtils } from './AnnotationConfigUtils'
import { ImportRegistry } from './ImportRegistry'

@Implements(AnnotatedBeanDefinition)
class ConfigurationClassBeanDefinition extends RootBeanDefinition implements AnnotatedBeanDefinition {
	private annotationMetadata: AnnotationMetadata

	private factoryMethodMetadata: Method

	constructor(original: ConfigurationClassBeanDefinition)
	constructor(configClass: ConfigurationClass, beanMethodMetadata: Method)

	constructor(arg1: ConfigurationClassBeanDefinition | ConfigurationClass, beanMethodMetadata?: Method) {
		super(arg1 instanceof ConfigurationClassBeanDefinition ? arg1 : undefined as any)

		if (arg1 instanceof ConfigurationClassBeanDefinition) {
			this.annotationMetadata = arg1.annotationMetadata
			this.factoryMethodMetadata = arg1.factoryMethodMetadata
		} else {
			this.annotationMetadata = arg1.getMetadata()
			this.factoryMethodMetadata = beanMethodMetadata!
		}

		// this.setLenientConstructorResolution(false)
	}

	getMetadata() {
		return this.annotationMetadata
	}

	getFactoryMethod() {
		return this.factoryMethodMetadata
	}

	// isFactoryMethod(candidate: Method) {
	// 	return (super.isFactoryMethod(candidate) && BeanAnnotationHelper.isBeanAnnotated(candidate))
	// }

	cloneBeanDefinition() {
		return new ConfigurationClassBeanDefinition(this)
	}
}

export class ConfigurationClassBeanDefinitionReader {
	// private conditionEvaluator?: ConditionEvaluator

  constructor(private registry: BeanDefinitionRegistry ,
    private sourceExtractor: any, // SourceExtractor ,
    private resourceLoader: ResourceLoader ,
    private environment: Environment ,
    private importBeanNameGenerator: BeanNameGenerator ,
    private importRegistry: ImportRegistry
  ) {

  }

  loadBeanDefinitions(configurationModel: Set<ConfigurationClass>) {
    const trackedConditionEvaluator = undefined
    for (const configClass of configurationModel) {
			this.loadBeanDefinitionsForConfigurationClass(configClass, trackedConditionEvaluator)
		}
  }

  private loadBeanDefinitionsForConfigurationClass(configClass: ConfigurationClass, trackedConditionEvaluator: undefined) {

    // if (trackedConditionEvaluator.shouldSkip(configClass)) {
    //   const beanName = configClass.getBeanName()
    //   if (StringUtils.hasLength(beanName) && this.registry.containsBeanDefinition(beanName)) {
    //     this.registry.removeBeanDefinition(beanName)
    //   }
    //   this.importRegistry.removeImportingClass(configClass.getMetadata().getClassName())
    //   return
    // }

    if (configClass.isImported()) {
      this.registerBeanDefinitionForImportedConfigurationClass(configClass)
    }

    for (const beanMethod of configClass.getBeanMethods()) {
      this.loadBeanDefinitionsForBeanMethod(beanMethod)
    }

    // this.loadBeanDefinitionsFromImportedResources(configClass.getImportedResources())
    // this.loadBeanDefinitionsFromRegistrars(configClass.getImportBeanDefinitionRegistrars())
  }

	private registerBeanDefinitionForImportedConfigurationClass(configClass: ConfigurationClass) {
		const metadata = configClass.getMetadata()
		const configBeanDef = new AnnotatedGenericBeanDefinition(metadata)

		// const scopeMetadata = scopeMetadataResolver.resolveScopeMetadata(configBeanDef)
		// configBeanDef.setScope(scopeMetadata.getScopeName())
		const configBeanName = this.importBeanNameGenerator.generateBeanName(configBeanDef, this.registry)
		AnnotationConfigUtils.processCommonDefinitionAnnotations(configBeanDef, metadata)

		let definitionHolder = new BeanDefinitionHolder(configBeanDef, configBeanName)
		// definitionHolder = AnnotationConfigUtils.applyScopedProxyMode(scopeMetadata, definitionHolder, this.registry)
		this.registry.registerBeanDefinition(definitionHolder.getBeanName(), definitionHolder.getBeanDefinition())
		configClass.setBeanName(configBeanName)

		console.debug(`Registered bean definition for imported class '${configBeanName}'`)
	}

  private loadBeanDefinitionsForBeanMethod(beanMethod: BeanMethod) {
		const configClass = beanMethod.getConfigurationClass()
		const metadata = beanMethod.getMetadata()
		const methodName = metadata.getName()

		// Do we need to mark the bean as skipped by its condition?
		// if (this.conditionEvaluator.shouldSkip(metadata, ConfigurationPhase.REGISTER_BEAN)) {
		// 	configClass.skippedBeanMethods.add(methodName)
		// 	return
		// }
		// if (configClass.skippedBeanMethods.contains(methodName)) {
		// 	return
		// }

		const bean = metadata.getAnnotationParams<Bean.Params>(Bean)

		// Consider name and any aliases
		const names = typeof bean!.name == 'string' ? [bean!.name] : bean!.name
		const beanName = (names.length > 0 ? names.shift()! : methodName)

		// Register aliases even when overridden
		for (const alias of names) {
			// this.registry.registerAlias(beanName, alias)
		}

		// Has this effectively been overridden before (e.g. via XML)?
		// if (isOverriddenByExistingDefinition(beanMethod, beanName)) {
		// 	if (beanName.equals(beanMethod.getConfigurationClass().getBeanName())) {
		// 		throw new BeanDefinitionStoreException(beanMethod.getConfigurationClass().getResource().getDescription(),
		// 				beanName, "Bean name derived from @Bean method '" + beanMethod.getMetadata().getMethodName() +
		// 				"' clashes with bean name for containing configuration class; please make those names unique!")
		// 	}
		// 	return
		// }

		const beanDef = new ConfigurationClassBeanDefinition(configClass, metadata)
		// beanDef.setResource(configClass.getResource())
		// beanDef.setSource(this.sourceExtractor.extractSource(metadata, configClass.getResource()))

		if (metadata.isStatic()) {
      // static @Bean method
			const md = configClass.getMetadata()
			beanDef.setBeanClass(md.getClass())
		}
		else {
			// instance @Bean method
			beanDef.setFactoryBeanName(configClass.getBeanName())
		}
		beanDef.setUniqueFactoryMethodName(methodName)

		beanDef.factoryMethodReturnType = beanMethod.getMetadata().getReturnType()

		if (metadata instanceof Method) {
			beanDef.setResolvedFactoryMethod(metadata)
		}

		// beanDef.setAutowireMode(AbstractBeanDefinition.AUTOWIRE_CONSTRUCTOR)
		// beanDef.setAttribute(org.springframework.beans.factory.annotation.RequiredAnnotationBeanPostProcessor.SKIP_REQUIRED_CHECK_ATTRIBUTE, Boolean.TRUE)

		AnnotationConfigUtils.processCommonDefinitionAnnotations(beanDef, metadata)

		// const autowire = bean!.autowire
		// if (autowire.isAutowire()) {
		// 	beanDef.setAutowireMode(autowire.value())
		// }

		// const autowireCandidate = bean!.autowireCandidate
		// if (!autowireCandidate) {
		// 	beanDef.setAutowireCandidate(false)
		// }

		// const initMethodName = bean!.initMethod
		// if (initMethodName) {
		// 	beanDef.setInitMethodName(initMethodName)
		// }

		// const destroyMethodName = bean!.destroyMethod
		// beanDef.setDestroyMethodName(destroyMethodName)

		// Consider scoping
		// ScopedProxyMode proxyMode = ScopedProxyMode.NO
		// AnnotationAttributes attributes = AnnotationConfigUtils.attributesFor(metadata, Scope.class)
		// if (attributes != undefined) {
		// 	beanDef.setScope(attributes.getString("value"))
		// 	proxyMode = attributes.getEnum("proxyMode")
		// 	if (proxyMode == ScopedProxyMode.DEFAULT) {
		// 		proxyMode = ScopedProxyMode.NO
		// 	}
		// }

		// Replace the original bean definition with the target one, if necessary
		const beanDefToRegister: BeanDefinition = beanDef
		// if (proxyMode != ScopedProxyMode.NO) {
		// 	BeanDefinitionHolder proxyDef = ScopedProxyCreator.createScopedProxy(
		// 			new BeanDefinitionHolder(beanDef, beanName), this.registry,
		// 			proxyMode == ScopedProxyMode.TARGET_CLASS)
		// 	beanDefToRegister = new ConfigurationClassBeanDefinition(
		// 			(RootBeanDefinition) proxyDef.getBeanDefinition(), configClass, metadata)
		// }

    console.debug(`Registering bean definition for @Bean method ${configClass.getMetadata().getClassName()}.${beanName.toString()}()`)
		this.registry.registerBeanDefinition(beanName, beanDefToRegister)
  }

  private TrackedConditionEvaluator = ((outerThis) => class TrackedConditionEvaluator {

		private skipped = new Map<ConfigurationClass, boolean>()

		// shouldSkip(configClass: ConfigurationClass) {
		// 	let skip = this.skipped.get(configClass)
		// 	if (skip == undefined) {
		// 		if (configClass.isImported()) {
		// 			let allSkipped = true
		// 			for (const importedBy of configClass.getImportedBy()) {
		// 				if (!this.shouldSkip(importedBy)) {
		// 					allSkipped = false
		// 					break
		// 				}
		// 			}
		// 			if (allSkipped) {
		// 				// The config classes that imported this one were all skipped, therefore we are skipped...
		// 				skip = true
		// 			}
		// 		}
		// 		if (skip == undefined) {
		// 			skip = outerThis.conditionEvaluator.shouldSkip(configClass.getMetadata(), ConfigurationPhase.REGISTER_BEAN)
		// 		}
		// 		this.skipped.set(configClass, skip)
		// 	}
		// 	return skip
		// }
	})(this)

}
