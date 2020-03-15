import { ConfigurableListableBeanFactory, BeanPostProcessor, MergedBeanDefinitionPostProcessor, DefaultListableBeanFactory, BeanDefinitionRegistry, BeanFactoryPostProcessor, BeanDefinitionRegistryPostProcessor } from '@tspring/beans'
import { AbstractApplicationContext } from './AbstractApplicationContext'
import { PriorityOrdered, Ordered, isImplements, OrderComparator } from '@tspring/core'

export class PostProcessorRegistrationDelegate {
  private static $registerBeanPostProcessors<T extends BeanPostProcessor>(beanFactory: ConfigurableListableBeanFactory, postProcessors: T[]) {
    for (const postProcessor of postProcessors) {
      beanFactory.addBeanPostProcessor(postProcessor)
    }
  }

  private static $invokeBeanFactoryPostProcessors<T extends BeanFactoryPostProcessor>(postProcessors: T[], beanFactory: ConfigurableListableBeanFactory) {
    for (const postProcessor of postProcessors) {
      postProcessor.postProcessBeanFactory(beanFactory)
    }
  }

  private static invokeBeanDefinitionRegistryPostProcessors<T extends BeanDefinitionRegistryPostProcessor>(postProcessors: T[], registry: BeanDefinitionRegistry) {
    for (const postProcessor of postProcessors) {
      postProcessor.postProcessBeanDefinitionRegistry(registry)
    }
  }

  private static sortPostProcessors(postProcessors: Object[], beanFactory: ConfigurableListableBeanFactory) {
		let comparatorToUse: ((a: Object, b: Object) => number) | undefined
		if (beanFactory instanceof DefaultListableBeanFactory) {
			// comparatorToUse = beanFactory.getDependencyComparator()
		}
		if (comparatorToUse == undefined) {
			comparatorToUse = (o1, o2) => OrderComparator.INSTANCE.compare(o1, o2)
		}
		postProcessors.sort(comparatorToUse)
  }

  static registerBeanPostProcessors(beanFactory: ConfigurableListableBeanFactory, applicationContext: AbstractApplicationContext) {

    const postProcessorNames = beanFactory.getBeanNamesForType(BeanPostProcessor, true, false)

    // Register BeanPostProcessorChecker that logs an info message when
    // a bean is created during BeanPostProcessor instantiation, i.e. when
    // a bean is not eligible for getting processed by all BeanPostProcessors.
    const beanProcessorTargetCount = beanFactory.getBeanPostProcessorCount() + 1 + postProcessorNames.length
    // beanFactory.addBeanPostProcessor(new BeanPostProcessorChecker(beanFactory, beanProcessorTargetCount))

    // Separate between BeanPostProcessors that implement PriorityOrdered,
    // Ordered, and the rest.
    const priorityOrderedPostProcessors: BeanPostProcessor[] = []
    const internalPostProcessors: BeanPostProcessor[] = []
    const orderedPostProcessorNames: string[] = []
    const nonOrderedPostProcessorNames: string[] = []
    for (const ppName of postProcessorNames) {
      if (beanFactory.isTypeMatch(ppName, PriorityOrdered)) {
        const pp = beanFactory.getBean<BeanPostProcessor>(ppName, BeanPostProcessor)
        priorityOrderedPostProcessors.push(pp)
        if (isImplements<MergedBeanDefinitionPostProcessor>(pp, MergedBeanDefinitionPostProcessor)) {
          internalPostProcessors.push(pp)
        }
      }
      else if (beanFactory.isTypeMatch(ppName, Ordered)) {
        orderedPostProcessorNames.push(ppName)
      }
      else {
        nonOrderedPostProcessorNames.push(ppName)
      }
    }

    // First, register the BeanPostProcessors that implement PriorityOrdered.
    PostProcessorRegistrationDelegate.sortPostProcessors(priorityOrderedPostProcessors, beanFactory)
    PostProcessorRegistrationDelegate.$registerBeanPostProcessors(beanFactory, priorityOrderedPostProcessors)

    // // Next, register the BeanPostProcessors that implement Ordered.
    const orderedPostProcessors: BeanPostProcessor[] = []
    for (const ppName of orderedPostProcessorNames) {
      const pp = beanFactory.getBean<BeanPostProcessor>(ppName, BeanPostProcessor)
      orderedPostProcessors.push(pp)
      if (isImplements(pp, MergedBeanDefinitionPostProcessor)) {
        internalPostProcessors.push(pp)
      }
    }
    PostProcessorRegistrationDelegate.sortPostProcessors(orderedPostProcessors, beanFactory)
    PostProcessorRegistrationDelegate.$registerBeanPostProcessors(beanFactory, orderedPostProcessors)

    // // Now, register all regular BeanPostProcessors.
    const nonOrderedPostProcessors: BeanPostProcessor[] = []
    for (const ppName of nonOrderedPostProcessorNames) {
      const pp = beanFactory.getBean<BeanPostProcessor>(ppName, BeanPostProcessor)
      nonOrderedPostProcessors.push(pp)
      if (isImplements(pp, MergedBeanDefinitionPostProcessor)) {
        internalPostProcessors.push(pp)
      }
    }
    PostProcessorRegistrationDelegate.$registerBeanPostProcessors(beanFactory, nonOrderedPostProcessors)

    // Finally, re-register all internal BeanPostProcessors.
    PostProcessorRegistrationDelegate.sortPostProcessors(internalPostProcessors, beanFactory)
    PostProcessorRegistrationDelegate.$registerBeanPostProcessors(beanFactory, internalPostProcessors)

    // Re-register post-processor for detecting inner beans as ApplicationListeners,
    // moving it to the end of the processor chain (for picking up proxies etc).
    // beanFactory.addBeanPostProcessor(new ApplicationListenerDetector(applicationContext))
  }

  static invokeBeanFactoryPostProcessors(beanFactory: ConfigurableListableBeanFactory, beanFactoryPostProcessors: BeanFactoryPostProcessor[]) {

    // Invoke BeanDefinitionRegistryPostProcessors first, if any.
    const processedBeans = new Set<string>()

    if (isImplements<BeanDefinitionRegistry>(beanFactory, BeanDefinitionRegistry)) {
      const registry = beanFactory
      const regularPostProcessors: BeanFactoryPostProcessor[] = []
      const registryProcessors: BeanDefinitionRegistryPostProcessor[] = []

      for (const postProcessor of beanFactoryPostProcessors) {
        if (isImplements<BeanDefinitionRegistryPostProcessor>(postProcessor, BeanDefinitionRegistryPostProcessor)) {
          const registryProcessor = postProcessor
          registryProcessor.postProcessBeanDefinitionRegistry(registry)
          registryProcessors.push(registryProcessor)
        }
        else {
          regularPostProcessors.push(postProcessor)
        }
      }

      // Do not initialize FactoryBeans here: We need to leave all regular beans
      // uninitialized to let the bean factory post-processors apply to them!
      // Separate between BeanDefinitionRegistryPostProcessors that implement
      // PriorityOrdered, Ordered, and the rest.
      let currentRegistryProcessors: BeanDefinitionRegistryPostProcessor[] = []

      // First, invoke the BeanDefinitionRegistryPostProcessors that implement PriorityOrdered.
      let postProcessorNames = beanFactory.getBeanNamesForType(BeanDefinitionRegistryPostProcessor, true, false)
      for (const ppName of postProcessorNames) {
        if (beanFactory.isTypeMatch(ppName, PriorityOrdered)) {
          currentRegistryProcessors.push(beanFactory.getBean(ppName, BeanDefinitionRegistryPostProcessor))
          processedBeans.add(ppName)
        }
      }
      PostProcessorRegistrationDelegate.sortPostProcessors(currentRegistryProcessors, beanFactory)
      registryProcessors.push(...currentRegistryProcessors)
      PostProcessorRegistrationDelegate.invokeBeanDefinitionRegistryPostProcessors(currentRegistryProcessors, registry)
      currentRegistryProcessors = []

      // Next, invoke the BeanDefinitionRegistryPostProcessors that implement Ordered.
      postProcessorNames = beanFactory.getBeanNamesForType(BeanDefinitionRegistryPostProcessor, true, false)
      for (const ppName of postProcessorNames) {
        if (!processedBeans.has(ppName) && beanFactory.isTypeMatch(ppName, Ordered)) {
          currentRegistryProcessors.push(beanFactory.getBean(ppName, BeanDefinitionRegistryPostProcessor))
          processedBeans.add(ppName)
        }
      }
      PostProcessorRegistrationDelegate.sortPostProcessors(currentRegistryProcessors, beanFactory)
      registryProcessors.push(...currentRegistryProcessors)
      PostProcessorRegistrationDelegate.invokeBeanDefinitionRegistryPostProcessors(currentRegistryProcessors, registry)
      currentRegistryProcessors = []

      // Finally, invoke all other BeanDefinitionRegistryPostProcessors until no further ones appear.
      let reiterate = true
      while (reiterate) {
        reiterate = false
        postProcessorNames = beanFactory.getBeanNamesForType(BeanDefinitionRegistryPostProcessor, true, false)
        for (const ppName of postProcessorNames) {
          if (!processedBeans.has(ppName)) {
            currentRegistryProcessors.push(beanFactory.getBean(ppName, BeanDefinitionRegistryPostProcessor))
            processedBeans.add(ppName)
            reiterate = true
          }
        }
        PostProcessorRegistrationDelegate.sortPostProcessors(currentRegistryProcessors, beanFactory)
        registryProcessors.push(...currentRegistryProcessors)
        PostProcessorRegistrationDelegate.invokeBeanDefinitionRegistryPostProcessors(currentRegistryProcessors, registry)
        currentRegistryProcessors = []
      }

      // Now, invoke the postProcessBeanFactory callback of all processors handled so far.
      PostProcessorRegistrationDelegate.$invokeBeanFactoryPostProcessors(registryProcessors, beanFactory)
      PostProcessorRegistrationDelegate.$invokeBeanFactoryPostProcessors(regularPostProcessors, beanFactory)
    }

    else {
      // Invoke factory processors registered with the context instance.
      PostProcessorRegistrationDelegate.$invokeBeanFactoryPostProcessors(beanFactoryPostProcessors, beanFactory)
    }

    // Do not initialize FactoryBeans here: We need to leave all regular beans
    // uninitialized to let the bean factory post-processors apply to them!
    const postProcessorNames = beanFactory.getBeanNamesForType(BeanFactoryPostProcessor, true, false)

    // Separate between BeanFactoryPostProcessors that implement PriorityOrdered,
    // Ordered, and the rest.
    const priorityOrderedPostProcessors: BeanFactoryPostProcessor[] = []
    const orderedPostProcessorNames: string[] = []
    const nonOrderedPostProcessorNames: string[] = []
    for (const ppName of postProcessorNames) {
      if (processedBeans.has(ppName)) {
        // skip - already processed in first phase above
      }
      else if (beanFactory.isTypeMatch(ppName, PriorityOrdered)) {
        priorityOrderedPostProcessors.push(beanFactory.getBean(ppName, BeanFactoryPostProcessor))
      }
      else if (beanFactory.isTypeMatch(ppName, Ordered)) {
        orderedPostProcessorNames.push(ppName)
      }
      else {
        nonOrderedPostProcessorNames.push(ppName)
      }
    }

    // First, invoke the BeanFactoryPostProcessors that implement PriorityOrdered.
    PostProcessorRegistrationDelegate.sortPostProcessors(priorityOrderedPostProcessors, beanFactory)
    PostProcessorRegistrationDelegate.$invokeBeanFactoryPostProcessors(priorityOrderedPostProcessors, beanFactory)

    // Next, invoke the BeanFactoryPostProcessors that implement Ordered.
    const orderedPostProcessors: BeanFactoryPostProcessor[] = []
    for (const postProcessorName of orderedPostProcessorNames) {
      orderedPostProcessors.push(beanFactory.getBean(postProcessorName, BeanFactoryPostProcessor))
    }
    PostProcessorRegistrationDelegate.sortPostProcessors(orderedPostProcessors, beanFactory)
    PostProcessorRegistrationDelegate.$invokeBeanFactoryPostProcessors(orderedPostProcessors, beanFactory)

    // Finally, invoke all other BeanFactoryPostProcessors.
    const nonOrderedPostProcessors: BeanFactoryPostProcessor[] = []
    for (const postProcessorName of nonOrderedPostProcessorNames) {
      nonOrderedPostProcessors.push(beanFactory.getBean(postProcessorName, BeanFactoryPostProcessor))
    }
    PostProcessorRegistrationDelegate.$invokeBeanFactoryPostProcessors(nonOrderedPostProcessors, beanFactory)

    // Clear cached merged bean definitions since the post-processors might have
    // modified the original metadata, e.g. replacing placeholders in values...
    beanFactory.clearMetadataCache()
  }
}
