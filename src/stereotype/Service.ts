import { Annotation, ElementType } from '@tspring/core'
import { Component } from './Component'

type AnnotationParams = {} & Annotation.Params<string>

export const Service = Annotation.define<ElementType.TYPE, string, AnnotationParams>({
  name: 'Service',
  attributes: {
    value: {
      aliasFor: { annotation: Component },
      default: ''
    }
  },
  extends: [Component]
})

export module Service {
  export type Params = AnnotationParams
}
