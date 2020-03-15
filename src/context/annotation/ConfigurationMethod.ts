import { ConfigurationClass } from './ConfigurationClass'
import { Method } from '@tspring/core'

export abstract class ConfigurationMethod {
	constructor(protected metadata: Method, protected configurationClass: ConfigurationClass) {

	}

	getMetadata() {
		return this.metadata
	}

	getConfigurationClass() {
		return this.configurationClass
	}

	// getResourceLocation() {
	// 	return new Location(this.configurationClass.getResource(), this.metadata)
	// }

	getFullyQualifiedMethodName() {
		return this.metadata.getDeclaringClass().name + '#' + this.metadata.getName().toString()
	}

	static getShortMethodName(fullyQualifiedMethodName: string) {
		return fullyQualifiedMethodName.substring(fullyQualifiedMethodName.indexOf('#') + 1)
	}

	validate(problemReporter: any /* ProblemReporter */) {

  }

	toString() {
		return `[${this.constructor.name}:name=${this.getMetadata().getName().toString()},declaringClass=${this.getMetadata().getDeclaringClass().name}]`
	}
}
