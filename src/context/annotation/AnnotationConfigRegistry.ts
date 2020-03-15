import { Class, Interface } from '@tspring/core'

export interface AnnotationConfigRegistry {

	register(...componentClasses: Class<Object>[]): void

	scan(...basePackages: string[]): void

}

export const AnnotationConfigRegistry = new Interface('AnnotationConfigRegistry')
