import { Annotation, ElementType } from '@tspring/core'

export type AnnotationParams = {
  name: string | string[]
} & Annotation.Params<string | string[]>

export const Bean = Annotation.define<ElementType.METHOD, string | string[], AnnotationParams>({
  name: 'Bean',
  attributes: {
    value: {
      aliasFor: 'name',
      default: []
    },
    name: {
      aliasFor: 'value',
      default: []
    }
  }
})

export module Bean {
  export type Params = AnnotationParams
}
