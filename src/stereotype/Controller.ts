import { Annotation, ElementType } from '@tspring/core'
import { Component } from './Component'

type AnnotationParams = {} & Annotation.Params<string>

export const Controller = Annotation.define<ElementType.TYPE, string, AnnotationParams>({
  name: 'Controller',
  attributes: {
    value: {
      aliasFor: { annotation: Component },
      default: ''
    }
  },
  extends: [Component]
})

export module Controller {
  export type Params = AnnotationParams
}
