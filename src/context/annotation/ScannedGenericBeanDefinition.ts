import { GenericBeanDefinition, AnnotatedBeanDefinition } from '@tspring/beans'
import { Implements, AnnotationMetadata, Method } from '@tspring/core'

@Implements(AnnotatedBeanDefinition)
export class ScannedGenericBeanDefinition extends GenericBeanDefinition implements AnnotatedBeanDefinition {
  private metadata: AnnotationMetadata

  constructor (metadata: AnnotationMetadata) {
    super()
    this.metadata = metadata
		this.setBeanClass(this.metadata.getClass())
		this.setBeanClassName(this.metadata.getClassName())
  }

  getMetadata(): AnnotationMetadata {
    return this.metadata
  }

  getFactoryMethod(): Method | undefined {
    return undefined
  }
}
