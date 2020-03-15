import { Annotation, ElementType } from '@tspring/core'

export type AnnotationParams = {
  scopeName: string
} & Annotation.Params<string>

export const Scope = Annotation.define<ElementType.TYPE & ElementType.METHOD, string, AnnotationParams>({
  name: 'Scope',
  attributes: {
    value: {
      aliasFor: 'scopeName',
      default: ''
    },
    scopeName: {
      aliasFor: 'value',
      default: ''
    }
  }
})

export module Scope {
  export type Params = AnnotationParams
}
