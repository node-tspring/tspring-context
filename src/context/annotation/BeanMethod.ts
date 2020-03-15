import { ConfigurationMethod } from './ConfigurationMethod'
import { ConfigurationClass } from './ConfigurationClass'
import { Method } from '@tspring/core'

export class BeanMethod extends ConfigurationMethod {
  constructor(metadata: Method, configurationClass: ConfigurationClass) {
		super(metadata, configurationClass)
	}

	validate(problemReporter: any /* ProblemReporter */) {
		// if (getMetadata().isStatic()) {
		// 	// static @Bean methods have no constraints to validate -> return immediately
		// 	return
		// }

		// if (this.configurationClass.getMetadata().isAnnotated(Configuration.class.getName())) {
		// 	if (!getMetadata().isOverridable()) {
		// 		// instance @Bean methods within @Configuration classes must be overridable to accommodate CGLIB
		// 		problemReporter.error(new NonOverridableMethodError())
		// 	}
		// }
	}


	// private class NonOverridableMethodError extends Problem {
	// 	NonOverridableMethodError() {
	// 		super(string.format("@Bean method '%s' must not be private or final; change the method's modifiers to continue",
	// 				getMetadata().getMethodName()), getResourceLocation())
	// 	}
	// }
}
