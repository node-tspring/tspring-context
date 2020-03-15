import { AnnotationMetadata, Interface } from '@tspring/core'

export interface ImportSelector {
	selectImports(importingClassMetadata: AnnotationMetadata): string[]
}

export const ImportSelector = new Interface('ImportSelector')
