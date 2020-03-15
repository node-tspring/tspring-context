import { Annotation, ElementType } from '@tspring/core'

export type AnnotationParams = {
  value: boolean
} & Annotation.Params<boolean>

export const Lazy = Annotation.define<ElementType.TYPE & ElementType.METHOD, boolean, AnnotationParams>({
  name: 'Lazy',
  attributes: {
    value: {
      default: true
    }
  }
})

export module Lazy {
  export type Params = AnnotationParams
}
