import { Class, AnnotationMetadata } from '@tspring/core'
import { BeanMethod } from './BeanMethod'

export class ConfigurationClass {
	private importedBy = new Set<ConfigurationClass>()
  private metadata: AnnotationMetadata
  private beanName?: string
  private beanMethods = new Set<BeanMethod>()

  constructor(clazz: Class<Object>, beanName: string)
	constructor(clazz: Class<Object>, importedBy: ConfigurationClass)
  constructor(metadata: AnnotationMetadata, beanName: string)
  constructor (arg1: Class<Object> | AnnotationMetadata, arg2: string | ConfigurationClass) {
    if (Class.isClass(arg1)) {
      this.metadata = AnnotationMetadata.introspect(arg1)
    } else {
      this.metadata = arg1
    }

    if (typeof arg2 == 'string') {
      this.beanName = arg2
    } else {
      this.importedBy.add(arg2)
    }
  }

  getSimpleName() {
		return this.getMetadata().getClassName()
	}

  setBeanName(beanName: string) {
		this.beanName = beanName
  }

  getBeanName() {
		return this.beanName
	}

  getMetadata() {
		return this.metadata
  }

  getImportedBy() {
		return this.importedBy
  }

  isImported() {
    return this.importedBy.size > 0
  }

  mergeImportedBy(otherConfigClass: ConfigurationClass) {
    otherConfigClass.importedBy.forEach((item) => {
      this.importedBy.add(item)
    })
  }

  addBeanMethod(method: BeanMethod) {
		this.beanMethods.add(method)
  }

  getBeanMethods(): Set<BeanMethod> {
		return this.beanMethods
	}
}
