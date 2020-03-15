import { ImportSelector } from './ImportSelector'
import { Class, AnnotationMetadata, ObjectUtils, Interface } from '@tspring/core'

class Entry {

  constructor(private metadata: AnnotationMetadata, private importClassName: string ) {}

  getMetadata() {
    return this.metadata
  }

  getImportClassName() {
    return this.importClassName
  }

  equals(other: Entry | undefined) {
    if (this == other) {
      return true
    }
    if (other == undefined || this.constructor != other.constructor) {
      return false
    }
    const entry = other
    return (ObjectUtils.nullSafeEquals(this.metadata, entry.metadata) && ObjectUtils.nullSafeEquals(this.importClassName, entry.importClassName))
  }
}

export interface Group {
  process(metadata: AnnotationMetadata, selector: DeferredImportSelector): void
  selectImports(): Iterable<Entry>
}

export const Group = new (class extends Interface{
  readonly Entry = Entry
})('Group')

export interface DeferredImportSelector extends ImportSelector {
  getImportGroup(): Class<Group> | undefined
}

type TypeEntry = Entry
type TypeGroup = Group
export module DeferredImportSelector {
  export type Group = TypeGroup
  export module Group {
    export type Entry = TypeEntry
  }
}

export const DeferredImportSelector = new (class extends Interface{
  readonly Group = Group
})('DeferredImportSelector', [ImportSelector])
