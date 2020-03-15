import { Environment, ResourceLoader, Class, CollectionUtils } from '@tspring/core'
import { BeanNameGenerator, BeanDefinitionRegistry, BeanDefinitionHolder } from '@tspring/beans'
import { ComponentScan } from './ComponentScan'
import { ClassPathBeanDefinitionScanner } from './ClassPathBeanDefinitionScanner'

export class ComponentScanAnnotationParser {
  parse(componentScan: ComponentScan.Params, declaringClass: Class<Object>): Set<BeanDefinitionHolder> {
    const scanner = new ClassPathBeanDefinitionScanner(
      this.registry,
      componentScan.useDefaultFilters,
      this.environment,
      this.resourceLoader
    )

    // const GeneratorClass = componentScan.nameGenerator
    // scanner.setBeanNameGenerator(new GeneratorClass())
    // scanner.setResourcePattern(componentScan.resourcePattern)

    // for (const filter of componentScan.includeFilters) {
    //   scanner.addIncludeFilter(filter)
    // }
    // for (const filter of componentScan.excludeFilters) {
    //   scanner.addExcludeFilter(filter)
    // }

    const lazyInit = componentScan.lazyInit
    if (lazyInit) {
      scanner.getBeanDefinitionDefaults().setLazyInit(true)
    }

    const basePackages = new Set<string>()
    const basePackagesArray = componentScan.basePackages || []
    for (const pkg of basePackagesArray) {
      const tokenized = pkg.split(/\s*(?:,|;|\t|\n|\s+)\s*/)
      CollectionUtils.addAll(basePackages, tokenized)
    }
    for (const clazz of componentScan.basePackageClasses || []) {
      const packageName = Class.getPackageName(clazz)
      if (packageName) basePackages.add(packageName)
    }
    if (CollectionUtils.isEmpty(basePackages)) {
      const packageName = Class.getPackageName(declaringClass)
      if (packageName) basePackages.add(packageName)
    }

    // scanner.addExcludeFilter(new AbstractTypeHierarchyTraversingFilter(false, false) {
    //   protected matchClassName(string className) {
    //     return declaringClass.equals(className)
    //   }
    // })

    return scanner.doScan(Array.from(basePackages))
  }

  constructor (
    private environment: Environment,
    private resourceLoader: ResourceLoader,
    private beanNameGenerator: BeanNameGenerator,
    private registry: BeanDefinitionRegistry
  ) {

  }
}
