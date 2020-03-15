import { Annotation, ElementType } from '@tspring/core'

type AnnotationParams = {} & Annotation.Params<string>

export const Component = Annotation.define<ElementType.TYPE, string, AnnotationParams>({
  name: 'Component',
  attributes: {
    value: {
      default: ''
    }
  }
})

export module Component {
  export type Params = AnnotationParams
}
