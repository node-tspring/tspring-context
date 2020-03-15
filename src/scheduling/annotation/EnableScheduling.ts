import { Annotation, ElementType } from '@tspring/core'
import { Import } from '../../context/annotation/Import'
import { SchedulingConfiguration } from './SchedulingConfiguration'

type AnnotationParams = {} & Annotation.Params<undefined>

export const EnableScheduling = Annotation.define<ElementType.TYPE, undefined, AnnotationParams>({
  name: 'EnableScheduling',
  extends: [
    Import(SchedulingConfiguration)
  ]
})

export module EnableScheduling {
  export type Params = AnnotationParams
}
