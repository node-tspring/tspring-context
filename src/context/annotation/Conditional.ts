import { Annotation, ElementType, Class } from '@tspring/core'
import { Condition } from './Condition'

type AnnotationParams = {} & Annotation.Params<Class<Condition>>

export const Conditional = Annotation.define<ElementType.TYPE & ElementType.METHOD, Class<Condition>, AnnotationParams>({
  name: 'Conditional',
})

export module Conditional {
  export type Params = AnnotationParams
}
