import { ConfigurableApplicationContext } from './ConfigurableApplicationContext'
import { Interface } from '@tspring/core'

export interface ApplicationContextInitializer<C extends ConfigurableApplicationContext>  {

}

export const ApplicationContextInitializer = new Interface('ApplicationContextInitializer')
