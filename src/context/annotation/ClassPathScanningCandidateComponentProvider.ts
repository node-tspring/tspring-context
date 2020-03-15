import { Environment, ResourceLoader, ResourcePatternResolver, StandardAnnotationMetadata, Class } from '@tspring/core'
import { BeanDefinitionRegistry, BeanDefinition, BeanDefinitionStoreException } from '@tspring/beans'
import { ScannedGenericBeanDefinition } from './ScannedGenericBeanDefinition'
import { Component } from '../../stereotype/Component'
import path = require('path')
import glob from 'glob'

export class ClassPathScanningCandidateComponentProvider {
	static readonly DEFAULT_RESOURCE_PATTERN = '**/[A-Z]*.{t,j}s'

  private environment?: Environment
  private resourcePatternResolver?: ResourcePatternResolver
	private resourcePattern = ClassPathScanningCandidateComponentProvider.DEFAULT_RESOURCE_PATTERN

  constructor()
	constructor(useDefaultFilters: boolean)
  constructor(useDefaultFilters: boolean, environment: Environment)

  constructor(useDefaultFilters?: boolean, environment?: Environment) {
    if (useDefaultFilters) {
			this.registerDefaultFilters()
    }
    if (environment == undefined) {
			// this.environment = new StandardEnvironment()
    }
		this.setEnvironment(environment)
		this.setResourceLoader(undefined)
  }

  registerDefaultFilters() {

  }

  setResourceLoader(resourceLoader: ResourceLoader | undefined) {
		// this.resourcePatternResolver = ResourcePatternUtils.getResourcePatternResolver(resourceLoader)
    // this.metadataReaderFactory = new CachingMetadataReaderFactory(resourceLoader)
		// this.componentsIndex = CandidateComponentsIndexLoader.loadIndex(this.resourcePatternResolver.getClassLoader())
  }

  getResourceLoader(): ResourceLoader {
		return this.getResourcePatternResolver()
  }

  getResourcePatternResolver(): ResourcePatternResolver {
		if (this.resourcePatternResolver == undefined) {
			// this.resourcePatternResolver = new PathMatchingResourcePatternResolver()
		}
		return this.resourcePatternResolver!
	}

  setEnvironment(environment: Environment | undefined) {
    this.environment = environment
  }

  getEnvironment() {
		if (this.environment == undefined) {
			// this.environment = new StandardEnvironment()
		}
		return this.environment
	}

  setResourcePattern(resourcePattern: string) {
		this.resourcePattern = resourcePattern
  }

  protected getRegistry(): BeanDefinitionRegistry | undefined {
		return undefined
  }

  findCandidateComponents(basePackage: string) {
		// if (this.componentsIndex != undefined && this.indexSupportsIncludeFilters()) {
		// 	return this.addCandidateComponentsFromIndex(this.componentsIndex, basePackage)
		// }
		// else {
    return this.scanCandidateComponents(basePackage)
		// }
  }

  private scanCandidateComponents(basePackage: string) {
    class NodeModuleResource {
      private name?: string
      constructor (private nodeModule: NodeModule, name?: string) {

      }

      equals (other: NodeModuleResource) {
        return this.nodeModule == other.nodeModule && this.name == other.name
      }
    }

    const candidates = new Set<BeanDefinition>()
		try {
      const basePath = path.resolve('.')
      const packageSearchPath = `${basePath}/${basePackage}/${this.resourcePattern}`
      const matches = glob.sync(packageSearchPath)
      const clazzes: Class<Object>[] = []
      const NodeModuleResourceMap = new Map<Class<Object>, NodeModuleResource>()
      matches.forEach((fileName) => {
        const m = require(fileName)
        if (Class.isClass(m)) {
          clazzes.push(m)
          NodeModuleResourceMap.set(m, new NodeModuleResource(require.cache[fileName]))
        } else {
          for (const k in m) {
            const cls = m[k]
            if (Class.isClass(cls)) {
              clazzes.push(cls)
              NodeModuleResourceMap.set(cls, new NodeModuleResource(require.cache[fileName], k))
            }
          }
        }
      })
      clazzes.forEach((Clazz) => {
        console.debug(`Scanning ${Clazz.name}`)

        const metadata = new StandardAnnotationMetadata(Clazz)

        if (metadata.isAnnotated(Component)) {
          const sbd = new ScannedGenericBeanDefinition(metadata)
          // sbd.setResource(resource)
          sbd.setSource(NodeModuleResourceMap.get(Clazz))
          candidates.add(sbd)
        }
      })
		} catch (ex) {
			throw new BeanDefinitionStoreException(undefined, 'I/O failure during classpath scanning', ex)
		}
		return candidates
  }

  addExcludeFilter(filter: any) {
    throw new Error('Method not implemented.')
  }

  addIncludeFilter(filter: any) {
    throw new Error('Method not implemented.')
  }
}
