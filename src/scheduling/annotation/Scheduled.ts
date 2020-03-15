import { Annotation, ElementType } from '@tspring/core'
import { ScheduledTaskRegistrar } from '../config/ScheduledTaskRegistrar'

type AnnotationParams = {
  cron?: string
  zone?: string
  fixedDelay?: number
  fixedDelayString?: string
  fixedRate?: number
  fixedRateString?: string
  initialDelay?: number
  initialDelayString?: string
} & Annotation.Params<undefined>

export const CRON_DISABLED = ScheduledTaskRegistrar.CRON_DISABLED

export const Scheduled = Annotation.define<ElementType.METHOD, undefined, AnnotationParams>({
  name: 'Scheduled',
  attributes: {
    cron: {
      default: ''
    },
    zone: {
      default: ''
    },
    fixedDelay: {
      default: -1
    },
    fixedDelayString: {
      default: ''
    },
    fixedRate: {
      default: -1
    },
    fixedRateString: {
      default: ''
    },
    initialDelay: {
      default: -1
    },
    initialDelayString: {
      default: ''
    }
  }
})

export module Scheduled {
  export type Params = AnnotationParams
}
