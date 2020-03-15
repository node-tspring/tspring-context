import { BeanPostProcessor, EmbeddedValueResolver } from '@tspring/beans'
import { ConfigurableApplicationContext } from '../ConfigurableApplicationContext'
import { StringValueResolver, isImplements, Implements } from '@tspring/core'
import { EnvironmentAware } from '../EnvironmentAware'
import { ResourceLoaderAware } from '../ResourceLoaderAware'
import { ApplicationContextAware } from '../ApplicationContextAware'
import { EmbeddedValueResolverAware } from '../EmbeddedValueResolverAware'

@Implements(BeanPostProcessor)
export class ApplicationContextAwareProcessor implements BeanPostProcessor {
  private applicationContext: ConfigurableApplicationContext
	private embeddedValueResolver: StringValueResolver

  constructor(applicationContext: ConfigurableApplicationContext) {
		this.applicationContext = applicationContext
		this.embeddedValueResolver = new EmbeddedValueResolver(applicationContext.getBeanFactory())
  }

  postProcessBeforeInitialization(bean: Object, beanName: string): Object | undefined {
    if (!(
      isImplements(bean, EnvironmentAware) ||
      isImplements(bean, EmbeddedValueResolverAware) ||
      isImplements(bean, ResourceLoaderAware) ||
      // isImplements(bean, ApplicationEventPublisherAware) ||
      // isImplements(bean, MessageSourceAware) ||
      isImplements(bean, ApplicationContextAware))) {
      return bean
    }

    this.invokeAwareInterfaces(bean)
    return bean
  }

  postProcessAfterInitialization(bean: Object, beanName: string): Object | undefined {
    return bean
  }

  private invokeAwareInterfaces(bean: Object) {
		if (isImplements<EnvironmentAware>(bean, EnvironmentAware)) {
			bean.setEnvironment(this.applicationContext.getEnvironment())
		}
		if (isImplements<EmbeddedValueResolverAware>(bean, EmbeddedValueResolverAware)) {
			bean.setEmbeddedValueResolver(this.embeddedValueResolver)
		}
		if (isImplements<ResourceLoaderAware>(bean, ResourceLoaderAware)) {
		   bean.setResourceLoader(this.applicationContext)
		}
		// if (bean instanceof ApplicationEventPublisherAware) {
		// 	((ApplicationEventPublisherAware) bean).setApplicationEventPublisher(this.applicationContext)
		// }
		// if (bean instanceof MessageSourceAware) {
		// 	((MessageSourceAware) bean).setMessageSource(this.applicationContext)
		// }
		if (isImplements<ApplicationContextAware>(bean, ApplicationContextAware)) {
			bean.setApplicationContext(this.applicationContext)
		}
	}

}
