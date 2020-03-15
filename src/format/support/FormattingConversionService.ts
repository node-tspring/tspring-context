import { GenericConversionService, Implements, StringValueResolver } from '@tspring/core'
import { EmbeddedValueResolverAware } from '../../context/EmbeddedValueResolverAware'
import { FormatterRegistry } from '../FormatterRegistry'
import { Formatter } from '../Formatter'

@Implements(FormatterRegistry, EmbeddedValueResolverAware)
export class FormattingConversionService extends GenericConversionService implements FormatterRegistry, EmbeddedValueResolverAware {

  addFormatter(formatter: Formatter<any>): void {

  }

  setEmbeddedValueResolver(resolver: StringValueResolver): void {

  }

}
