import { AnnotationMetadata, Class, Interface } from '@tspring/core'

export interface ImportRegistry {

	getImportingClassFor(importedClass: Class<Object>): AnnotationMetadata | undefined

	removeImportingClass(importingClass: Class<Object>): void

}

export const ImportRegistry = new Interface('ImportRegistry')
