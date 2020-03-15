import { Annotation, ElementType } from '@tspring/core'

export type AnnotationParams = {} & Annotation.Params<undefined>

export const Primary = Annotation.define<ElementType.TYPE & ElementType.METHOD, undefined, AnnotationParams>({
  name: 'Primary'
})

export module Primary {
  export type Params = AnnotationParams
}
