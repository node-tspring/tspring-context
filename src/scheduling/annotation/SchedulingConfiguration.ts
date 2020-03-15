import { Bean } from '../../context/annotation/Bean'
import { ScheduledAnnotationBeanPostProcessor } from './ScheduledAnnotationBeanPostProcessor'
import { TaskManagementConfigUtils } from '../config/TaskManagementConfigUtils'
import { Configuration } from '../../context/annotation/Configuration'

@Configuration
export class SchedulingConfiguration {

	@Bean({ name: TaskManagementConfigUtils.SCHEDULED_ANNOTATION_PROCESSOR_BEAN_NAME })
	// @Role(BeanDefinition.ROLE_INFRASTRUCTURE)
	static scheduledAnnotationProcessor(): ScheduledAnnotationBeanPostProcessor {
		return new ScheduledAnnotationBeanPostProcessor()
	}

}
