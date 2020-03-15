import { Printer } from './Printer'
import { Parser } from './Parser'
import { Interface } from '@tspring/core'

export interface Formatter<T> extends Printer<T>, Parser<T> {

}

export const Formatter = new Interface('Formatter', [Printer, Parser])
