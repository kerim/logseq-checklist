import { IDatom } from './types'
import { updateChecklistProgress } from './progress'

/**
 * Debounce updates to avoid excessive processing
 */
const pendingUpdates = new Set<string>() // Set of checklist block UUIDs
let updateTimer: NodeJS.Timeout | null = null

/**
 * Checks if a datom represents a checkbox property change
 *
 * @param datom - Transaction datom
 * @returns True if this is a checkbox change
 */
export function isCheckboxChange(datom: IDatom): boolean {
  const [, attribute] = datom

  // Check if this is a checkbox property change
  // Attribute format is typically ":logseq.property/checkbox" or similar
  return attribute.includes('checkbox')
}

/**
 * Finds the parent checklist block for a given block
 * Traverses up the block tree until finding a block with #checklist tag
 *
 * @param blockUuid - UUID of the block to start from
 * @returns Checklist block UUID or null if not found
 */
export async function findParentChecklistBlock(
  blockUuid: string
): Promise<string | null> {
  try {
    let currentBlock = await logseq.Editor.getBlock(blockUuid)

    while (currentBlock) {
      // Check if current block has #checklist tag
      const tags = currentBlock.properties?.tags
      if (tags && (Array.isArray(tags) ? tags.includes('checklist') : tags === 'checklist')) {
        return currentBlock.uuid
      }

      // Move up to parent
      if (currentBlock.parent?.id) {
        currentBlock = await logseq.Editor.getBlock(currentBlock.parent.id)
      } else {
        break
      }
    }

    return null
  } catch (error) {
    console.error('Error finding parent checklist block:', error)
    return null
  }
}

/**
 * Schedules an update for a checklist block (with debouncing)
 *
 * @param checklistBlockUuid - UUID of the checklist block to update
 */
export function scheduleUpdate(checklistBlockUuid: string): void {
  pendingUpdates.add(checklistBlockUuid)

  if (updateTimer) {
    clearTimeout(updateTimer)
  }

  updateTimer = setTimeout(async () => {
    for (const uuid of pendingUpdates) {
      await updateChecklistProgress(uuid)
    }
    pendingUpdates.clear()
  }, 300) // 300ms debounce
}

/**
 * Handles database changes from DB.onChanged
 * Filters for checkbox changes and updates affected checklists
 *
 * @param txData - Transaction data (format TBD)
 */
export async function handleDatabaseChanges(txData: any): Promise<void> {
  try {
    // Debug: Log what we actually receive
    console.log('[DEBUG] DB.onChanged received:', typeof txData, txData)

    // Check if txData is an array
    if (!Array.isArray(txData)) {
      console.log('[DEBUG] txData is not an array, type:', typeof txData)

      // Try to convert to array if it's array-like
      if (txData && typeof txData === 'object' && 'length' in txData) {
        txData = Array.from(txData)
        console.log('[DEBUG] Converted to array:', txData)
      } else {
        console.warn('[DEBUG] Cannot process txData - not array-like')
        return
      }
    }

    // Filter for checkbox changes
    const checkboxChanges = txData.filter(isCheckboxChange)

    if (checkboxChanges.length === 0) {
      return
    }

    console.log('[DEBUG] Found checkbox changes:', checkboxChanges.length)

    // For each checkbox change, find and update parent checklist
    for (const datom of checkboxChanges) {
      const [entityId] = datom

      // Convert entity ID to UUID
      // We need to query the block by entity ID
      const block = await logseq.Editor.getBlock(entityId)

      if (block) {
        const checklistUuid = await findParentChecklistBlock(block.uuid)
        if (checklistUuid) {
          scheduleUpdate(checklistUuid)
        }
      }
    }
  } catch (error) {
    console.error('Error handling database changes:', error)
  }
}
