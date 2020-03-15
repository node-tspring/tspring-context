import { Aware } from '@tspring/beans'
import { ResourceLoader, Interface } from '@tspring/core'

export interface ResourceLoaderAware extends Aware {
	setResourceLoader(resourceLoader: ResourceLoader): void
}

export const ResourceLoaderAware = new Interface('ResourceLoaderAware', [Aware])
