import { Annotation, ElementType } from '@tspring/core'
import { Component } from '../../stereotype/Component'

type AnnotationParams = {} & Annotation.Params<string>

export const Configuration = Annotation.define<ElementType.TYPE, string, AnnotationParams>({
  name: 'Configuration',
  attributes: {
    value: {
      aliasFor: { annotation: Component }
    }
  },
  extends: [Component]
})

export module Configuration {
  export type Params = AnnotationParams
}
