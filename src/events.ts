import { IDatom, BlockEntity } from './types'
import { updateChecklistProgress } from './progress'
import { getSettings } from './settings'

/**
 * Debounce updates to avoid excessive processing
 */
const pendingUpdates = new Set<string>() // Set of checklist block UUIDs
let updateTimer: NodeJS.Timeout | null = null

/**
 * Gets the actual checkbox property from the checkbox class definition
 * Queries Logseq to find what property the checkbox class uses
 *
 * @returns The actual checkbox property name (e.g., "user.property/cbproperty-O9FVGbdJ")
 */
async function getCheckboxPropertyFromClass(): Promise<string> {
  try {
    const settings = getSettings()
    const checkboxTag = settings.checkboxTag
    
    console.log('[DEBUG] Looking for checkbox class:', checkboxTag)
    
    // Query to find the checkbox class and its properties
    const query = `
    [:find ?property 
     :where
     [?class :block/title "${checkboxTag}"]
     [?class :build/class-properties ?property]]
    `
    
    const results = await logseq.DB.datascriptQuery(query)
    
    if (results && results.length > 0) {
      // results is array of [property] arrays
      const property = results[0][0]  // Get the first property
      console.log('[DEBUG] Found checkbox property from class:', property)
      return property
    }
    
    // Fallback: try to find any property that looks like a checkbox
    console.log('[DEBUG] No checkbox class found, using fallback detection')
    return 'property'  // Fallback to pattern matching
    
  } catch (error) {
    console.error('Error getting checkbox property from class:', error)
    return 'property'  // Fallback to pattern matching
  }
}

/**
 * Checks if a datom represents an actual checkbox property change
 * Uses the exact property name from the checkbox class
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
    console.log('[DEBUG] Looking for parent with tag:', checklistTag)
    
    let currentBlock = await logseq.Editor.getBlock(blockUuid)
    let iterations = 0
    const maxIterations = 10 // Safety limit

    while (currentBlock && iterations < maxIterations) {
      iterations++
      console.log('[DEBUG] Checking block:', currentBlock.uuid, 'Content:', currentBlock.content || currentBlock.title)
      console.log('[DEBUG] Block tags:', currentBlock.properties?.tags)
      
      // Check if current block has the configured checklist tag
      // Try multiple ways to detect tags since block.properties.tags might be undefined
      const hasChecklistTag = await checkBlockHasTag(currentBlock, checklistTag)
      if (hasChecklistTag) {
        console.log('[DEBUG] Found checklist block:', currentBlock.uuid)
        return currentBlock.uuid
      }

      // Move up to parent
      if (currentBlock.parent?.id) {
        currentBlock = await logseq.Editor.getBlock(currentBlock.parent.id)
      } else {
        console.log('[DEBUG] Reached root block, no parent found')
        break
      }
    }

    if (iterations >= maxIterations) {
      console.warn('[DEBUG] Max iterations reached, possible infinite loop')
    }

    console.log('[DEBUG] No checklist parent found')
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
    // Method 1: Check properties.tags (standard approach)
    const tagsFromProps = block.properties?.tags
    if (tagsFromProps) {
      const hasTag = Array.isArray(tagsFromProps) 
        ? tagsFromProps.includes(tag)
        : tagsFromProps === tag
      if (hasTag) {
        console.log('[DEBUG] Tag found in properties.tags:', tag)
        return true
      }
    }

    // Method 2: Check if block content contains the tag
    const content = block.content || block.title || ''
    if (content.includes(`#${tag}`)) {
      console.log('[DEBUG] Tag found in block content:', `#${tag}`)
      return true
    }

    // Method 3: Query the block to get its tags explicitly
    try {
      const blockWithTags = await logseq.Editor.getBlock(block.uuid, {
        includeChildren: false
      })
      
      if (blockWithTags?.properties?.tags) {
        const tags = blockWithTags.properties.tags
        const hasTag = Array.isArray(tags) 
          ? tags.includes(tag)
          : tags === tag
        if (hasTag) {
          console.log('[DEBUG] Tag found via explicit query:', tag)
          return true
        }
      }
    } catch (queryError) {
      console.log('[DEBUG] Error querying block for tags:', queryError)
    }

    // Method 4: Use datascript query to check for tags
    try {
      const query = `
      [:find ?tag-title 
       :in $ ?block-uuid 
       :where
       [?b :block/uuid "${block.uuid}"]
       [?b :block/tags ?tag]
       [?tag :block/title ?tag-title]]
      `
      const results = await logseq.DB.datascriptQuery(query)
      if (results && results.length > 0) {
        const tagTitles = results.flat()
        if (tagTitles.includes(tag)) {
          console.log('[DEBUG] Tag found via datascript query:', tag)
          return true
        }
      }
    } catch (queryError) {
      console.log('[DEBUG] Error with datascript query:', queryError)
    }

    console.log('[DEBUG] Tag not found:', tag)
    return false
  } catch (error) {
    console.error('Error checking block for tag:', error)
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
    // DB.onChanged receives an object like:
    // { blocks: [], deletedAssets: [], deletedBlockUuids: [], txData: [], txMeta: {} }
    console.log('[DEBUG] DB.onChanged received:', changeData)

    // Extract the actual txData array
    let txData = changeData?.txData

    if (!txData) {
      console.warn('[DEBUG] No txData in change object')
      return
    }

    if (!Array.isArray(txData)) {
      console.warn('[DEBUG] txData is not an array:', typeof txData)
      return
    }

    console.log('[DEBUG] txData array length:', txData.length)
    
    // Debug: Show full txData contents to understand structure
    console.log('[DEBUG] txData contents:', JSON.stringify(txData, null, 2))

    // Get the actual checkbox property from the checkbox class definition
    const checkboxProperty = await getCheckboxPropertyFromClass()
    console.log('[DEBUG] Using checkbox property from class:', checkboxProperty)

    // Filter for checkbox changes using the actual property name
    const checkboxChanges = []
    for (const datom of txData) {
      if (await isActualCheckboxChange(datom, checkboxProperty)) {
        checkboxChanges.push(datom)
      }
    }

    if (checkboxChanges.length === 0) {
      console.log('[DEBUG] No checkbox changes detected with pattern:', propertyPattern)
      return
    }

    console.log('[DEBUG] Found checkbox changes:', checkboxChanges.length)

    // For each checkbox change, find and update parent checklist
    for (const datom of checkboxChanges) {
      const [entityId] = datom

      console.log('[DEBUG] Processing checkbox change for entity:', entityId)

      // Convert entity ID to UUID
      const block = await logseq.Editor.getBlock(entityId)

      if (block) {
        console.log('[DEBUG] Found block:', block.uuid, 'Content:', block.content || block.title)
        console.log('[DEBUG] Block tags:', block.properties?.tags)
        
        const checklistUuid = await findParentChecklistBlock(block.uuid)
        if (checklistUuid) {
          console.log('[DEBUG] Found parent checklist:', checklistUuid)
          scheduleUpdate(checklistUuid)
        } else {
          console.log('[DEBUG] No parent checklist found for block:', block.uuid)
        }
      } else {
        console.log('[DEBUG] No block found for entity ID:', entityId)
      }
    }
  } catch (error) {
    console.error('Error handling database changes:', error)
  }
}
