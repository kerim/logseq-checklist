import { IDatom, BlockEntity } from './types'
import { updateChecklistProgress } from './progress'
import { getSettings } from './settings'

/**
 * Gets the checkbox property pattern to use for detection
 * Uses simple pattern matching instead of complex class queries
 *
 * @returns The property pattern to match (e.g., "property")
 */
async function getCheckboxPropertyFromClass(): Promise<string> {
  try {
    // Try to get the checkbox class to find the exact property name
    const checkboxClass = await logseq.App.getClassByName('checkbox')
    if (checkboxClass) {
      return 'property' // Use simple pattern matching
    } else {
      return 'property' // Fallback to pattern matching
    }
  } catch (error) {
    return 'property' // Fallback to pattern matching
  }
}

/**
 * Debounce updates to avoid excessive processing
 */
const pendingUpdates = new Set<string>() // Set of checklist block UUIDs
let updateTimer: NodeJS.Timeout | null = null

/**
 * Checks if a datom represents an actual checkbox property change
 *
 * @param datom - Transaction datom
 * @param checkboxProperty - Exact property name to match
 * @returns True if this is a checkbox change
 */
async function isActualCheckboxChange(datom: IDatom, checkboxProperty: string): Promise<boolean> {
  const [, attribute] = datom

  // Check if this attribute exactly matches the checkbox property
  if (attribute === checkboxProperty) {
    return true
  }

  // Also check if it contains the property (for backward compatibility)
  return attribute.includes(checkboxProperty)
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
    const settings = getSettings()
    const checklistTag = settings.checklistTag

    let currentBlock = await logseq.Editor.getBlock(blockUuid)
    let iterations = 0
    const maxIterations = 10 // Safety limit

    while (currentBlock && iterations < maxIterations) {
      iterations++

      // Check if current block has the configured checklist tag
      const hasChecklistTag = await checkBlockHasTag(currentBlock, checklistTag)
      if (hasChecklistTag) {
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
 * Checks if a block has a specific tag using multiple detection methods
 * @param block - Block to check
 * @param tag - Tag to look for (without # prefix)
 * @returns True if block has the tag
 */
async function checkBlockHasTag(block: BlockEntity, tag: string): Promise<boolean> {
  try {
    // Primary method: Check if block content contains the tag
    const content = block.content || block.title || ''
    const tagWithHash = `#${tag}`

    if (content.includes(tagWithHash)) {
      return true
    }

    // Main method: Use datascript query to check for tags in the DB graph
    // Note: datascriptQuery expects raw datalog format (no {:query ...} wrapper)
    try {
      const query = `
      [:find (pull ?b [*])
       :where
       [?b :block/tags ?t]
       [?t :block/title "${tag}"]]
      `
      const results = await logseq.DB.datascriptQuery(query)

      if (results && results.length > 0) {
        const foundBlock = results.find(r => r[0]?.uuid === block.uuid)
        if (foundBlock) {
          return true
        }
      }
    } catch (error) {
      // Query failed, continue to fallback
    }

    // Fallback: Check properties.tags if available
    const tagsFromProps = block.properties?.tags
    if (tagsFromProps) {
      const hasTag = Array.isArray(tagsFromProps)
        ? tagsFromProps.includes(tag)
        : tagsFromProps === tag
      if (hasTag) {
        return true
      }
    }

    return false
  } catch (error) {
    return false
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
 * @param changeData - Transaction change object with txData array
 */
export async function handleDatabaseChanges(changeData: any): Promise<void> {
  try {
    // Extract the txData array
    let txData = changeData?.txData

    if (!txData || !Array.isArray(txData)) {
      return
    }

    // Get the checkbox property pattern from the checkbox class
    const checkboxProperty = await getCheckboxPropertyFromClass()

    // Filter for checkbox changes
    const checkboxChanges = []
    for (const datom of txData) {
      if (await isActualCheckboxChange(datom, checkboxProperty)) {
        checkboxChanges.push(datom)
      }
    }

    if (checkboxChanges.length === 0) {
      return
    }

    // For each checkbox change, find and update parent checklist
    for (const datom of checkboxChanges) {
      const [entityId] = datom

      // Convert entity ID to UUID
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
