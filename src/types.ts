import { BlockEntity } from '@logseq/libs/dist/LSPlugin'

/**
 * Transaction data format from DB.onChanged
 */
export type IDatom = [
  e: number,        // Entity ID
  a: string,        // Attribute name
  v: any,           // Value
  t: number,        // Transaction ID
  added: boolean    // true if added, false if retracted
]

/**
 * Result of counting checkboxes in a block tree
 */
export interface CheckboxCount {
  total: number
  checked: number
}

/**
 * Re-export BlockEntity for convenience
 */
export type { BlockEntity }
