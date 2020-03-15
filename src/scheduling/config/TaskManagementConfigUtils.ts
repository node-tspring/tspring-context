export abstract class TaskManagementConfigUtils {

	static readonly SCHEDULED_ANNOTATION_PROCESSOR_BEAN_NAME =
			'org.springframework.context.annotation.internalScheduledAnnotationProcessor'

	static readonly ASYNC_ANNOTATION_PROCESSOR_BEAN_NAME =
			'org.springframework.context.annotation.internalAsyncAnnotationProcessor'

	static readonly ASYNC_EXECUTION_ASPECT_BEAN_NAME =
			'org.springframework.scheduling.config.internalAsyncExecutionAspect'

}
