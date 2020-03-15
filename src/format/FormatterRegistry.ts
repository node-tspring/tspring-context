import { ConverterRegistry, Interface } from '@tspring/core'
import { Formatter } from './Formatter'

export interface FormatterRegistry extends ConverterRegistry {
  addFormatter(formatter: Formatter<any>): void
}

export const FormatterRegistry = new Interface('FormatterRegistry', [ConverterRegistry])
