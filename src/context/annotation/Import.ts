import { Annotation, ElementType, Class } from '@tspring/core'

export type AnnotationParams = {} & Annotation.Params<Class<Object> | Class<Object>[]>

export const Import = Annotation.define<ElementType.TYPE, Class<Object> | Class<Object>[], AnnotationParams>({
  name: 'Import',
  attributes: {
    value: {
      default: []
    }
  }
})

export module Import {
  export type Params = AnnotationParams
}
