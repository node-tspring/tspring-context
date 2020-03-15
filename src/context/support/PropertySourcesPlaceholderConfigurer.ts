import { EnvironmentAware } from '../EnvironmentAware'
import { PlaceholderConfigurerSupport, ConfigurableListableBeanFactory, BeanInitializationException } from '@tspring/beans'
import { Environment, PropertySources, PropertySource, MutablePropertySources, PropertiesPropertySource, PropertySourcesPropertyResolver, ConfigurablePropertyResolver, Implements } from '@tspring/core'
import traverse from 'traverse'

const LOCAL_PROPERTIES_PROPERTY_SOURCE_NAME = 'localProperties'
const ENVIRONMENT_PROPERTIES_PROPERTY_SOURCE_NAME = 'environmentProperties'

@Implements(EnvironmentAware)
export class PropertySourcesPlaceholderConfigurer extends PlaceholderConfigurerSupport implements EnvironmentAware {
	static readonly LOCAL_PROPERTIES_PROPERTY_SOURCE_NAME = LOCAL_PROPERTIES_PROPERTY_SOURCE_NAME
	static readonly ENVIRONMENT_PROPERTIES_PROPERTY_SOURCE_NAME = ENVIRONMENT_PROPERTIES_PROPERTY_SOURCE_NAME

  private environment?: Environment
	private propertySources?: MutablePropertySources
	private appliedPropertySources?: PropertySources

  setEnvironment(environment: Environment): void {
    this.environment = environment
  }

  postProcessBeanFactory(beanFactory: ConfigurableListableBeanFactory) {
		if (this.propertySources == undefined) {
			this.propertySources = new MutablePropertySources()
			if (this.environment != undefined) {
				this.propertySources.addLast(
					new (class extends PropertySource<Environment>{
						getProperty(key: string ) {
							return this.source.getProperty(key)
						}
					})(ENVIRONMENT_PROPERTIES_PROPERTY_SOURCE_NAME, this.environment)
				)
			}
			try {
				const localPropertySource =	new PropertiesPropertySource(LOCAL_PROPERTIES_PROPERTY_SOURCE_NAME, this.mergeProperties())
				if (this.localOverride) {
					this.propertySources.addFirst(localPropertySource)
				}
				else {
					this.propertySources.addLast(localPropertySource)
				}
			}
			catch (ex) {
				throw new BeanInitializationException('Could not load properties', ex)
			}
		}

		this.$processProperties(beanFactory, new PropertySourcesPropertyResolver(this.propertySources))
		this.appliedPropertySources = this.propertySources
	}

	private resolverProperty(strVal: string, propertyResolver: ConfigurablePropertyResolver) {
		let resolved = (this.ignoreUnresolvablePlaceholders
			? propertyResolver.resolvePlaceholders(strVal)
			: propertyResolver.resolveRequiredPlaceholders(strVal))
		if (this.trimValues) {
			resolved = resolved.trim()
		}
		return resolved
	}

  protected $processProperties(beanFactoryToProcess: ConfigurableListableBeanFactory, propertyResolver: ConfigurablePropertyResolver) {
    // propertyResolver.setPlaceholderPrefix(this.placeholderPrefix)
		// propertyResolver.setPlaceholderSuffix(this.placeholderSuffix)
		// propertyResolver.setValueSeparator(this.valueSeparator)

		const valueResolver = {
      resolveStringValue: (strVal: string) => {
        let resolved = this.resolverProperty(strVal, propertyResolver)
        return (resolved == this.nullValue ? undefined : resolved)
      },
      resolveObjectValue: (key: string) => {
				const value = this.environment!.getProperty(key)
				return traverse(value).map((val) => {
					if (typeof val == 'string') {
						try {
							let resolved = this.resolverProperty(val, propertyResolver)
							return resolved
						} catch (e) {}
					}
				})
      }
    }

		this.doProcessProperties(beanFactoryToProcess, valueResolver)
  }

  getAppliedPropertySources() {
		return this.appliedPropertySources
	}
}
