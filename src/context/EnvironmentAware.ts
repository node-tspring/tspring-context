import { Aware } from '@tspring/beans'
import { Environment, Interface } from '@tspring/core'

export interface EnvironmentAware extends Aware {
	setEnvironment(environment: Environment): void
}

export const EnvironmentAware = new Interface('EnvironmentAware', [Aware])
