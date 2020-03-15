import { Condition } from './Condition'
import { Interface } from '@tspring/core'

export enum ConfigurationPhase {
  PARSE_CONFIGURATION,
  REGISTER_BEAN
}

type TypeConfigurationPhase = ConfigurationPhase

export interface ConfigurationCondition extends Condition {
	getConfigurationPhase(): ConfigurationPhase
}

export const ConfigurationCondition = new (class extends Interface{
  readonly ConfigurationPhase = ConfigurationPhase
})('ConfigurationCondition', [Condition])

export module ConfigurationCondition {
  export type ConfigurationPhase = TypeConfigurationPhase
}
