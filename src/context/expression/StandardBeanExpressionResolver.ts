import { Implements, StringUtils } from '@tspring/core'
import { BeanExpressionResolver, BeanExpressionContext } from '@tspring/beans'
import template from 'lodash/template'

const templateSettings = {
  interpolate: /#{([\s\S]+?)}/g
}

@Implements(BeanExpressionResolver)
export class StandardBeanExpressionResolver implements BeanExpressionResolver {

  evaluate(value: string | undefined, evalContext: BeanExpressionContext): Object | undefined {
    if (!StringUtils.hasLength(value)) {
			return value
    }

    try {
      return template(value, templateSettings)()
    } catch {}

    return value
  }

}
