import { BeanDefinitionRegistry, BeanNameGenerator, BeanDefinitionHolder, AnnotatedBeanDefinition, AbstractBeanDefinition, BeanDefinitionStoreException } from '@tspring/beans'
import { ResourceLoader, Environment, isImplements, Class, AnnotationMetadata, StandardAnnotationMetadata, CollectionUtils, ArrayMultiValueMap, Implements, Ordered, Interface } from '@tspring/core'
import { ConfigurationClass } from './annotation/ConfigurationClass'
import { Component } from '../stereotype/Component'
import { ComponentScan } from './annotation/ComponentScan'
import { ComponentScanAnnotationParser } from './annotation/ComponentScanAnnotationParser'
import { BeanMethod } from './annotation/BeanMethod'
import { Bean } from './annotation/Bean'
import { Import } from './annotation/Import'
import { ImportRegistry } from './annotation/ImportRegistry'
import { ImportSelector } from './annotation/ImportSelector'
import { ConfigurationClassUtils } from './annotation/ConfigurationClassUtils'

@Implements(Ordered)
class SourceClass implements Ordered {
  private source: Class<Object> | AnnotationMetadata
  private metadata: StandardAnnotationMetadata

  constructor(Clazz: Class<Object>) {
    this.source = Clazz
    this.metadata = new StandardAnnotationMetadata(Clazz)
  }

  getOrder(): number {
    const order = Class.require<typeof ConfigurationClassUtils>('@tspring/context:ConfigurationClassUtils').getOrder(this.metadata)
		return (order != undefined ? order : Ordered.LOWEST_PRECEDENCE)
  }

  getSourceClass(): Class<Object> {
    return Class.isClass(this.source) ? this.source : this.source.getClass()
  }

  getMetadata(): AnnotationMetadata {
    return this.metadata
  }

  isAssignable(clazz: Class<Object> | Interface) {
    if (Class.isClass(this.source)) {
      return Class.isAssignableFrom(clazz, this.source)
    }
    return Class.isAssignableFrom(clazz, this.source.getClass())
  }

  asConfigClass(importedBy: ConfigurationClass): ConfigurationClass {
    if (Class.isClass(this.source)) {
      return new ConfigurationClass(this.source, importedBy)
    }
    return new ConfigurationClass(this.source.getClass(), importedBy)
  }
}

@Implements(ImportRegistry)
class ImportStack implements ImportRegistry {
  private stack: ConfigurationClass[] = []
  private imports = new ArrayMultiValueMap<Class<Object>, AnnotationMetadata>()

  registerImport(importingClass: AnnotationMetadata, importedClass: Class<Object>) {
    this.imports.set(importedClass, importingClass)
  }

  getImportingClassFor(importedClass: Class<Object>) {
    return CollectionUtils.lastElement(this.imports.get(importedClass))
  }

  removeImportingClass(importingClass: Class<Object>) {
    for (const list of this.imports.values()) {
      list.forEach((item, index) => {
        if (item.getClass() == importingClass) {
          list.slice(index, 1)
        }
      })
    }
  }

  push(val: ConfigurationClass) {
    this.stack.push(val)
  }

  pop() {
    this.stack.pop()
  }

  contains(val: ConfigurationClass) {
    return this.stack.indexOf(val) > -1
  }

  element() {
    return this.stack[this.stack.length - 1]
  }
}

export class ConfigurationClassParser {
  private configurationClasses = new Map<ConfigurationClass, ConfigurationClass>()
	private knownSuperclasses = new Map<string, ConfigurationClass>()
  private componentScanParser: ComponentScanAnnotationParser
	private importStack = new ImportStack()

  getConfigurationClasses(): Iterable<ConfigurationClass> {
    return this.configurationClasses.keys()
  }

  getImportRegistry(): ImportRegistry {
		return this.importStack
  }

  validate() {

  }

	protected processConfigurationClass(configClass: ConfigurationClass): void {
    // if (this.conditionEvaluator.shouldSkip(configClass.getMetadata(), ConfigurationPhase.PARSE_CONFIGURATION)) {
		// 	return
		// }

		const existingClass = this.configurationClasses.get(configClass)
		if (existingClass != undefined) {
			if (configClass.isImported()) {
				if (existingClass.isImported()) {
					existingClass.mergeImportedBy(configClass)
				}
				// Otherwise ignore new imported config class existing non-imported class overrides it.
				return
			}
			else {
				// Explicit bean definition found, probably replacing an import.
				// Let's remove the old one and go with the new one.
				this.configurationClasses.delete(configClass)
				this.knownSuperclasses.forEach((item, key) => {
          if (item == configClass) {
            this.knownSuperclasses.delete(key)
          }
        })
			}
		}

		// Recursively process the configuration class and its superclass hierarchy.
		let sourceClass: SourceClass | undefined = this.asSourceClass(configClass)
		do {
			sourceClass = this.doProcessConfigurationClass(configClass, sourceClass)
		}
		while (sourceClass != undefined)

		this.configurationClasses.set(configClass, configClass)
  }

  protected doProcessConfigurationClass(configClass: ConfigurationClass, sourceClass: SourceClass): SourceClass | undefined {

		if (configClass.getMetadata().isAnnotated(Component)) {
			// Recursively process any member (nested) classes first
			this.processMemberClasses(configClass, sourceClass)
		}

		// Process any @PropertySource annotations
		// for (const propertySource of AnnotationConfigUtils.attributesForRepeatable(sourceClass.getMetadata(), PropertySources,org.springframework.context.annotation.PropertySource)) {
		// 	if (this.environment instanceof ConfigurableEnvironment) {
		// 		processPropertySource(propertySource)
		// 	}
		// 	else {
		// 		console.info("Ignoring @PropertySource annotation on [" + sourceClass.getMetadata().getClassName() +
		// 				"]. Reason: Environment must implement ConfigurableEnvironment")
		// 	}
		// }

		// Process any @ComponentScan annotations
    const componentScansParams = configClass.getMetadata().getAnnotationParams<ComponentScan.Params>(ComponentScan)
    //  AnnotationConfigUtils.attributesForRepeatable(sourceClass.getMetadata(), ComponentScans, ComponentScan)
		if (componentScansParams) {
		// if (!componentScans.isEmpty() &&
		// 		!this.conditionEvaluator.shouldSkip(sourceClass.getMetadata(), ConfigurationPhase.REGISTER_BEAN)) {
      // The config class is annotated with @ComponentScan -> perform the scan immediately
      const scannedBeanDefinitions = this.componentScanParser.parse(componentScansParams, sourceClass.getSourceClass())
      // Check the set of scanned definitions for any further config classes and parse recursively if needed

      for (const holder of scannedBeanDefinitions) {
        let bdCand = holder.getBeanDefinition().getOriginatingBeanDefinition()
        if (bdCand == undefined) {
          bdCand = holder.getBeanDefinition()
        }
        if (Class.require<typeof ConfigurationClassUtils>('@tspring/context:ConfigurationClassUtils')
          .checkConfigurationClassCandidate(bdCand, this.metadataReaderFactory)) {
          this.$parse(bdCand.getBeanClassName(), holder.getBeanName())
        }
      }
		}

		// Process any @Import annotations
		this.processImports(configClass, sourceClass, this.getImports(sourceClass), true)

		// // Process any @ImportResource annotations
		// AnnotationAttributes importResource =
		// 		AnnotationConfigUtils.attributesFor(sourceClass.getMetadata(), ImportResource.class)
		// if (importResource != undefined) {
		// 	string[] resources = importResource.getStringArray("locations")
		// 	Class<? extends BeanDefinitionReader> readerClass = importResource.getClass("reader")
		// 	for (string resource : resources) {
		// 		string resolvedResource = this.environment.resolveRequiredPlaceholders(resource)
		// 		configClass.addImportedResource(resolvedResource, readerClass)
		// 	}
		// }

		// Process individual @Bean methods
		const beanMethods = this.retrieveBeanMethodMetadata(sourceClass)
		for (const methodMetadata of beanMethods) {
			configClass.addBeanMethod(new BeanMethod(methodMetadata, configClass))
		}

		// Process default methods on interfaces
		// processInterfaces(configClass, sourceClass)

		// Process superclass, if any
		if (sourceClass.getMetadata().hasSuperClass()) {
			const superclass = sourceClass.getMetadata().getSuperClass()
			if (superclass != undefined && !this.knownSuperclasses.has(superclass.name)) {
		    this.knownSuperclasses.set(superclass.name, configClass)
				// Superclass found, return its annotation metadata and recurse
				return sourceClass
			}
		}

		// No superclass -> processing is complete
    return undefined
  }

  private getImports(sourceClass: SourceClass) {
		const imports = new Set<SourceClass>()
		const visited = new Set<SourceClass>()
		this.collectImports(sourceClass, imports, visited)
		return imports
  }

  private collectImports(sourceClass: SourceClass, imports: Set<SourceClass>, visited: Set<SourceClass>) {
    if (!visited.has(sourceClass)) {
      visited.add(sourceClass)
      const importParams = sourceClass.getMetadata().getAnnotationParams<Import.Params>(Import)
      if (importParams) {
        const values = CollectionUtils.toArray(importParams.value, [])
        for (const item of values) {
          const sc = new SourceClass(item)
          imports.add(sc)
          this.collectImports(sc, imports, visited)
        }
      }
    }
  }

  private processImports(configClass: ConfigurationClass, currentSourceClass: SourceClass, importCandidates: Set<SourceClass>, checkForCircularImports: boolean) {

    if (importCandidates.size == 0) {
      return
    }

    // if (checkForCircularImports && this.isChainedImportOnStack(configClass)) {
    //   // this.problemReporter.error(new CircularImportProblem(configClass, this.importStack))
    //   throw new Error('new CircularImportProblem(configClass, this.importStack)')
    // }
    // else {
      this.importStack.push(configClass)
      try {
        for (const candidate of importCandidates) {
          if (candidate.isAssignable(ImportSelector)) {
            // Candidate class is an ImportSelector -> delegate to it to determine imports
            // const candidateClass = candidate.loadClass()
            // const selector = ParserStrategyUtils.instantiateClass(candidateClass, ImportSelector, this.environment, this.resourceLoader, this.registry)
            // if (selector instanceof DeferredImportSelector) {
            //   this.deferredImportSelectorHandler.handle(configClass, (DeferredImportSelector) selector)
            // }
            // else {
            //   string[] importClassNames = selector.selectImports(currentSourceClass.getMetadata())
            //   Collection<SourceClass> importSourceClasses = asSourceClasses(importClassNames)
            //   processImports(configClass, currentSourceClass, importSourceClasses, false)
            // }
          }
          // else if (candidate.isAssignable(ImportBeanDefinitionRegistrar.class)) {
          //   // Candidate class is an ImportBeanDefinitionRegistrar ->
          //   // delegate to it to register additional bean definitions
          //   Class<?> candidateClass = candidate.loadClass()
          //   ImportBeanDefinitionRegistrar registrar =
          //       ParserStrategyUtils.instantiateClass(candidateClass, ImportBeanDefinitionRegistrar.class,
          //           this.environment, this.resourceLoader, this.registry)
          //   configClass.addImportBeanDefinitionRegistrar(registrar, currentSourceClass.getMetadata())
          // }
          else {
            // Candidate class not an ImportSelector or ImportBeanDefinitionRegistrar ->
            // process it as an @Configuration class
            this.importStack.registerImport(currentSourceClass.getMetadata(), candidate.getMetadata().getClass())
            this.processConfigurationClass(candidate.asConfigClass(configClass))
          }
        }
      } catch (ex) {
        // throw new BeanDefinitionStoreException(undefined, `Failed to process import candidates for configuration class [${configClass.getMetadata().getClassName()}]`, ex)
      } finally {
        this.importStack.pop()
      }
    // }
  }

  private retrieveBeanMethodMetadata(sourceClass: SourceClass) {
		const original = sourceClass.getMetadata()
		const beanMethods = original.getAnnotatedMethods(Bean)
		return beanMethods
	}

  processMemberClasses(configClass: ConfigurationClass, sourceClass: SourceClass) {

  }

  // private asSourceClasses(...classNames: string[]) {
	// 	const annotatedClasses: SourceClass[] = []
	// 	for (const className of classNames) {
	// 		annotatedClasses.push(this.asSourceClass(className))
	// 	}
	// 	return annotatedClasses
  // }

  protected asSourceClass(Clazz: Class<Object>): SourceClass
  protected asSourceClass(configurationClass: ConfigurationClass): SourceClass

  protected asSourceClass(arg1: Class<Object> | ConfigurationClass) {
    if (arg1 instanceof ConfigurationClass) {
      const metadata = arg1.getMetadata()
      return this.asSourceClass(metadata.getClass())
    }
    else {
      return new SourceClass(arg1)
    }
  }

	protected $parse(className: string | undefined, beanName: string ): void
  protected $parse(clazz: Class<Object>, beanName: string ): void
  protected $parse(metadata: AnnotationMetadata, beanName: string ): void

  protected $parse(arg1: string | Class<Object> | AnnotationMetadata | undefined, beanName: string) {
    if (typeof arg1 == 'string') {
      const bd = this.registry.getBeanDefinition(beanName)
      this.processConfigurationClass(new ConfigurationClass(bd.getBeanClass(), beanName))
    }
    else if (Class.isClass(arg1)) {
      this.processConfigurationClass(new ConfigurationClass(arg1, beanName))
    }
    else {
      this.processConfigurationClass(new ConfigurationClass(arg1!, beanName))
    }
	}

  parse(configCandidates: Set<BeanDefinitionHolder>) {
    for (const holder of configCandidates) {
			const bd = holder.getBeanDefinition()
			try {
				if (isImplements<AnnotatedBeanDefinition>(bd, AnnotatedBeanDefinition)) {
					this.$parse(bd.getMetadata(), holder.getBeanName())
				}
				else if (bd instanceof AbstractBeanDefinition && bd.hasBeanClass()) {
					this.$parse(bd.getBeanClass(), holder.getBeanName())
				}
				else {
					this.$parse(bd.getBeanClassName(), holder.getBeanName())
				}
			} catch (ex) {
				throw new BeanDefinitionStoreException(undefined, `Failed to parse configuration class [${bd.getBeanClassName()}]`, ex)
			}
		}

		// this.deferredImportSelectorHandler.process()
  }

  private metadataReaderFactory: any
  private problemReporter: any
  private environment: Environment
  private resourceLoader: ResourceLoader
  private registry: BeanDefinitionRegistry

  constructor(
    metadataReaderFactory: any, // MetadataReaderFactory,
    problemReporter: any, // ProblemReporter,
    environment: Environment,
    resourceLoader: ResourceLoader,
    componentScanBeanNameGenerator: BeanNameGenerator,
    registry: BeanDefinitionRegistry)
  {
    this.metadataReaderFactory = metadataReaderFactory
    this.problemReporter = problemReporter
    this.environment = environment
    this.resourceLoader = resourceLoader
    this.registry = registry
    this.componentScanParser = new ComponentScanAnnotationParser(environment, resourceLoader, componentScanBeanNameGenerator, registry)
    // this.conditionEvaluator = new ConditionEvaluator(registry, environment, resourceLoader)
  }
}
