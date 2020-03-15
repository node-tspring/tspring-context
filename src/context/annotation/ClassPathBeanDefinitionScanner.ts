import { AnnotationBeanNameGenerator } from './AnnotationBeanNameGenerator'
import { AnnotationConfigUtils } from './AnnotationConfigUtils'
import { ScannedGenericBeanDefinition } from './ScannedGenericBeanDefinition'
import { BeanDefinitionRegistry, BeanDefinitionDefaults, BeanDefinitionHolder, BeanDefinition, AbstractBeanDefinition, AnnotatedBeanDefinition, BeanDefinitionReaderUtils, BeanNameGenerator } from '@tspring/beans'
import { ResourceLoader, Environment, isImplements, ObjectUtils } from '@tspring/core'
import { ClassPathScanningCandidateComponentProvider } from './ClassPathScanningCandidateComponentProvider'
import { ConflictingBeanDefinitionException } from './ConflictingBeanDefinitionException'

export class ClassPathBeanDefinitionScanner extends ClassPathScanningCandidateComponentProvider {

  private registry: BeanDefinitionRegistry
  private beanNameGenerator: BeanNameGenerator = AnnotationBeanNameGenerator.INSTANCE
	private beanDefinitionDefaults = new BeanDefinitionDefaults()
  private autowireCandidatePatterns?: string[]

  constructor(registry: BeanDefinitionRegistry, useDefaultFilters?: boolean, environment?: Environment, resourceLoader?: ResourceLoader ) {
    super()

    if (useDefaultFilters == undefined) useDefaultFilters = true
    if (isImplements<ResourceLoader>(registry, ResourceLoader)) resourceLoader = registry
    this.registry = registry

		if (useDefaultFilters) {
			this.registerDefaultFilters()
		}
		this.setEnvironment(environment)
		this.setResourceLoader(resourceLoader)
  }

  setAutowireCandidatePatterns(...autowireCandidatePatterns: string[]) {
		this.autowireCandidatePatterns = autowireCandidatePatterns
  }

  doScan(basePackages: string[]): Set<BeanDefinitionHolder> {

    console.log('basePackages: ', basePackages)

		const beanDefinitions = new Set<BeanDefinitionHolder>()
		for (const basePackage of basePackages) {
			const candidates: Set<BeanDefinition> = this.findCandidateComponents(basePackage)
			for (const candidate of candidates) {
				// const scopeMetadata = this.scopeMetadataResolver.resolveScopeMetadata(candidate)
				// candidate.setScope(scopeMetadata.getScopeName())
				const beanName = this.beanNameGenerator.generateBeanName(candidate, this.registry)
				if (candidate instanceof AbstractBeanDefinition) {
					this.postProcessBeanDefinition(candidate, beanName)
				}
				if (isImplements<AnnotatedBeanDefinition>(candidate, AnnotatedBeanDefinition)) {
					AnnotationConfigUtils.processCommonDefinitionAnnotations(candidate)
				}
				if (this.checkCandidate(beanName, candidate)) {
					let definitionHolder = new BeanDefinitionHolder(candidate, beanName)
					// definitionHolder = AnnotationConfigUtils.applyScopedProxyMode(scopeMetadata, definitionHolder, this.registry)
					beanDefinitions.add(definitionHolder)
					this.registerBeanDefinition(definitionHolder, this.registry)
				}
			}
		}
		return beanDefinitions
  }

  protected checkCandidate(beanName: string, beanDefinition: BeanDefinition) {
		if (!this.registry.containsBeanDefinition(beanName)) {
			return true
		}
		let existingDef = this.registry.getBeanDefinition(beanName)
		const originatingDef = existingDef.getOriginatingBeanDefinition()
		if (originatingDef != undefined) {
			existingDef = originatingDef
		}
		if (this.isCompatible(beanDefinition, existingDef)) {
			return false
		}
		throw new ConflictingBeanDefinitionException(`Annotation-specified bean name '${beanName}' for bean class [${beanDefinition.getBeanClassName()}] conflicts with existing, non-compatible bean definition of same name and class [${existingDef.getBeanClassName()}]`)
  }

  protected isCompatible(newDefinition: BeanDefinition, existingDefinition: BeanDefinition ) {
		return (!(existingDefinition instanceof ScannedGenericBeanDefinition) ||  // explicitly registered overriding bean
				(newDefinition.getSource() != undefined && ObjectUtils.nullSafeEquals(newDefinition.getSource(), existingDefinition.getSource())) ||  // scanned same file twice
				ObjectUtils.nullSafeEquals(newDefinition, existingDefinition))  // scanned equivalent class twice
	}

  protected registerBeanDefinition(definitionHolder: BeanDefinitionHolder, registry: BeanDefinitionRegistry ) {
		BeanDefinitionReaderUtils.registerBeanDefinition(definitionHolder, registry)
	}

  postProcessBeanDefinition(beanDefinition: AbstractBeanDefinition, beanName: string) {
    beanDefinition.applyDefaults(this.beanDefinitionDefaults)
		if (this.autowireCandidatePatterns != undefined) {
			// beanDefinition.setAutowireCandidate(PatternMatchUtils.simpleMatch(this.autowireCandidatePatterns, beanName))
		}
  }

  getBeanDefinitionDefaults(): BeanDefinitionDefaults {
		return this.beanDefinitionDefaults
  }

  setBeanNameGenerator(beanNameGenerator: BeanNameGenerator) {
    this.beanNameGenerator = beanNameGenerator
  }
}
