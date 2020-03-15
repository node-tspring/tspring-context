import { BeanDefinitionRegistryPostProcessor, ConfigurableListableBeanFactory, BeanDefinitionRegistry, BeanDefinitionHolder, SingletonBeanRegistry, BeanDefinition, BeanNameGenerator } from '@tspring/beans'
import { Implements, PriorityOrdered, Environment, ResourceLoader, Ordered, IllegalStateException, isImplements, Class } from '@tspring/core'
import { ResourceLoaderAware } from '../ResourceLoaderAware'
import { EnvironmentAware } from '../EnvironmentAware'
import { AnnotationBeanNameGenerator } from './AnnotationBeanNameGenerator'
import { AnnotationConfigUtils } from './AnnotationConfigUtils'
import { ConfigurationClassParser } from '../ConfigurationClassParser'
import { ConfigurationClassBeanDefinitionReader } from './ConfigurationClassBeanDefinitionReader'
import { ConfigurationClass } from './ConfigurationClass'
import { ConfigurationClassUtils } from './ConfigurationClassUtils'

class ImportBeanNameGenerator extends AnnotationBeanNameGenerator {
  protected buildDefaultBeanName(definition: BeanDefinition) {
    return definition.getBeanClassName() || definition.getBeanClass() && definition.getBeanClass().name
  }
}

@Implements(BeanDefinitionRegistryPostProcessor, PriorityOrdered, ResourceLoaderAware, EnvironmentAware)
export class ConfigurationClassPostProcessor implements BeanDefinitionRegistryPostProcessor, PriorityOrdered, ResourceLoaderAware, EnvironmentAware {
  private environment?: Environment
  private resourceLoader?: ResourceLoader
	private setMetadataReaderFactoryCalled = false
	private localBeanNameGeneratorSet = false
	private metadataReaderFactory:any //  MetadataReaderFactory = new CachingMetadataReaderFactory()
	private factoriesPostProcessed = new Set<any>()
	private registriesPostProcessed = new Set<any>()

	private static IMPORT_REGISTRY_BEAN_NAME = 'ConfigurationClassPostProcessor.importRegistry'

	private componentScanBeanNameGenerator: BeanNameGenerator = AnnotationBeanNameGenerator.INSTANCE
	private importBeanNameGenerator: BeanNameGenerator = new ImportBeanNameGenerator()
  private problemReporter: any
  private reader?: ConfigurationClassBeanDefinitionReader
  sourceExtractor: any

  setEnvironment(environment: Environment): void {
    this.environment = environment
  }

  setResourceLoader(resourceLoader: ResourceLoader): void {
    this.resourceLoader = resourceLoader
		if (!this.setMetadataReaderFactoryCalled) {
			// this.metadataReaderFactory = new CachingMetadataReaderFactory(resourceLoader)
		}
  }

  getOrder(): number {
		return Ordered.LOWEST_PRECEDENCE  // within PriorityOrdered
  }

  postProcessBeanDefinitionRegistry(registry: BeanDefinitionRegistry) {
		if (this.registriesPostProcessed.has(registry)) {
			throw new IllegalStateException(`postProcessBeanDefinitionRegistry already called on this post-processor against ${registry}`)
		}
		if (this.factoriesPostProcessed.has(registry)) {
			throw new IllegalStateException(`postProcessBeanFactory already called on this post-processor against ${registry}`)
		}
		this.registriesPostProcessed.add(registry)

		this.processConfigBeanDefinitions(registry)
  }

  postProcessBeanFactory(beanFactory: ConfigurableListableBeanFactory): void {
		if (this.factoriesPostProcessed.has(beanFactory)) {
			throw new IllegalStateException(`postProcessBeanFactory already called on this post-processor against ${beanFactory}`)
		}
		this.factoriesPostProcessed.add(beanFactory)

		if (!this.registriesPostProcessed.has(beanFactory) && isImplements<BeanDefinitionRegistry>(beanFactory, BeanDefinitionRegistry)) {
			// BeanDefinitionRegistryPostProcessor hook apparently not supported...
			// Simply call processConfigurationClasses lazily at this point then.
			this.processConfigBeanDefinitions(beanFactory as BeanDefinitionRegistry)
		}

		// this.enhanceConfigurationClasses(beanFactory)
		// beanFactory.addBeanPostProcessor(new ImportAwareBeanPostProcessor(beanFactory))
  }

  setBeanNameGenerator(beanNameGenerator: BeanNameGenerator) {
		this.localBeanNameGeneratorSet = true
		this.componentScanBeanNameGenerator = beanNameGenerator
		this.importBeanNameGenerator = beanNameGenerator
	}

  processConfigBeanDefinitions(registry: BeanDefinitionRegistry) {
    const configCandidates: BeanDefinitionHolder[] = []
		const candidateNames = registry.getBeanDefinitionNames()
		const ConfigurationClassUtils$ = Class.require<typeof ConfigurationClassUtils>('@tspring/context:ConfigurationClassUtils')

		for (const beanName of candidateNames) {
			const beanDef = registry.getBeanDefinition(beanName)
			// if (beanDef.getAttribute(ConfigurationClassUtils.CONFIGURATION_CLASS_ATTRIBUTE) != undefined) {
			// 	console.debug("Bean definition has already been processed as a configuration class: " + beanDef)
			// }
      // else
      if (ConfigurationClassUtils$.checkConfigurationClassCandidate(beanDef, this.metadataReaderFactory)) {
				configCandidates.push(new BeanDefinitionHolder(beanDef, beanName))
			}
		}

		// Return immediately if no @Configuration classes were found
		if (configCandidates.length == 0) {
			return
		}

		// Sort by previously determined @Order value, if applicable
		configCandidates.sort((bd1, bd2) => {
			const i1 = ConfigurationClassUtils$.getOrder(bd1.getBeanDefinition())
			const i2 = ConfigurationClassUtils$.getOrder(bd2.getBeanDefinition())
			return i1 - i2
		})

		// Detect any custom bean name generation strategy supplied through the enclosing application context
		let sbr = undefined
		if (isImplements<SingletonBeanRegistry>(registry, SingletonBeanRegistry)) {
			sbr = registry
			if (!this.localBeanNameGeneratorSet) {
				const generator = sbr.getSingleton<BeanNameGenerator>(AnnotationConfigUtils.CONFIGURATION_BEAN_NAME_GENERATOR)
				if (generator != undefined) {
					this.componentScanBeanNameGenerator = generator
					this.importBeanNameGenerator = generator
				}
			}
		}

		if (this.environment == undefined) {
			// this.environment = new StandardEnvironment()
		}

		// Parse each @Configuration class
		const parser = new ConfigurationClassParser(
      this.metadataReaderFactory,
      this.problemReporter,
      this.environment!,
      this.resourceLoader!,
      this.componentScanBeanNameGenerator,
      registry)

		const candidates = new Set(configCandidates)
		const alreadyParsed = new Set<ConfigurationClass>()

    parser.parse(candidates)
    parser.validate()

    const configClasses = new Set<ConfigurationClass>(parser.getConfigurationClasses())
    alreadyParsed.forEach((item) => {
      configClasses.delete(item)
    })

    // Read the model and create bean definitions based on its content
    if (this.reader == undefined) {
      this.reader = new ConfigurationClassBeanDefinitionReader(
        registry,
        this.sourceExtractor,
        this.resourceLoader!,
        this.environment!,
        this.importBeanNameGenerator,
        parser.getImportRegistry()
      )
    }
    this.reader.loadBeanDefinitions(configClasses)

    configClasses.forEach((item) => {
      alreadyParsed.add(item)
    })

		// Register the ImportRegistry as a bean in order to support ImportAware @Configuration classes
		if (sbr != undefined && !sbr.containsSingleton(ConfigurationClassPostProcessor.IMPORT_REGISTRY_BEAN_NAME)) {
			sbr.registerSingleton(ConfigurationClassPostProcessor.IMPORT_REGISTRY_BEAN_NAME, parser.getImportRegistry())
		}

		// if (isImplements<CachingMetadataReaderFactory>(this.metadataReaderFactory, CachingMetadataReaderFactory)) {
		// 	// Clear cache in externally provided MetadataReaderFactory this is a no-op
		// 	// for a shared cache since it'll be cleared by the ApplicationContext.
		// 	this.metadataReaderFactory.clearCache()
		// }
  }
}
