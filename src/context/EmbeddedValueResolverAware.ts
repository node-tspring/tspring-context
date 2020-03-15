import { Aware } from '@tspring/beans'
import { StringValueResolver, Interface } from '@tspring/core'

export interface EmbeddedValueResolverAware extends Aware {

  setEmbeddedValueResolver(resolver: StringValueResolver): void

}

export const EmbeddedValueResolverAware = new Interface('EmbeddedValueResolverAware', [Aware])
