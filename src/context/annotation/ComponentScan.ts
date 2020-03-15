import { Annotation, ElementType, Class } from '@tspring/core'
import { BeanNameGenerator } from '@tspring/beans'
import { ClassPathScanningCandidateComponentProvider } from './ClassPathScanningCandidateComponentProvider'

export type AnnotationParams = {
  basePackages?: string[]
  basePackageClasses?: Class<Object>[]
  nameGenerator?: Class<BeanNameGenerator>
  useDefaultFilters?: boolean
  includeFilters?: any[]
  excludeFilters?: any[]
  resourcePattern?: string
  lazyInit?: boolean
} & Annotation.Params<string[]>

export const ComponentScan = Annotation.define<ElementType.TYPE, string[], AnnotationParams>({
  name: 'ComponentScan',
  attributes: {
    value: {
      aliasFor: 'basePackages',
      default: []
    },
    basePackages: {
      aliasFor: 'value',
      default: []
    },
    basePackageClasses: {
      default: []
    },
    useDefaultFilters: {
      default: true
    },
    nameGenerator: {
      default: BeanNameGenerator
    },
    includeFilters: {
      default: []
    },
    excludeFilters: {
      default: []
    },
    resourcePattern: {
      default: ClassPathScanningCandidateComponentProvider.DEFAULT_RESOURCE_PATTERN
    },
    lazyInit: {
      default: false
    }
  }
})

export module ComponentScan {
  export type Params = AnnotationParams
}
