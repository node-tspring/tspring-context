import { Annotation, ElementType, Ordered } from '@tspring/core'

type AnnotationParams = {
  order: number
} & Annotation.Params<undefined>

export const EnableCaching = Annotation.define<ElementType.TYPE, undefined, AnnotationParams>({
  name: 'EnableCaching',
  attributes: {
    order: {
      default: Ordered.LOWEST_PRECEDENCE
    }
  }
})

export module EnableCaching {
  export type Params = AnnotationParams
}
