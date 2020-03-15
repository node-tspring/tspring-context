import { AnnotatedTypeMetadata, Interface } from '@tspring/core'
import { ConditionContext } from './ConditionContext'

export interface Condition {
  matches(context: ConditionContext, metadata: AnnotatedTypeMetadata): boolean
}

export const Condition = new Interface('Condition')
