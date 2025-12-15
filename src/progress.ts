import { BlockEntity, CheckboxCount } from './types'
import { updateProgressIndicator } from './content'
import { getSettings } from './settings'

/**
 * Checks if a block is tagged with the configured checkbox tag
 * Uses datascript query for reliable tag detection in Logseq DB
 */
async function hasCheckboxTag(block: BlockEntity): Promise<boolean> {
  try {
    const settings = getSettings()
    const checkboxTag = settings.checkboxTag
    const tagWithHash = `#${checkboxTag}`

    // Primary: Check if tag appears in content (fast)
    const content = block.content || block.title || ''
    if (content.includes(tagWithHash)) {
      console.log('[DEBUG] Checkbox tag found in content:', tagWithHash, 'for block:', block.uuid)
      return true
    }

    // Secondary: Use datascript query (reliable)
    // Note: datascriptQuery expects raw datalog format (no {:query ...} wrapper)
    const query = `
    [:find (pull ?b [*])
     :where
     [?b :block/tags ?t]
     [?t :block/title "${checkboxTag}"]]
    `
    const results = await logseq.DB.datascriptQuery(query)

    if (results && results.length > 0) {
      const foundBlock = results.find(r => r[0]?.uuid === block.uuid)
      if (foundBlock) {
        console.log('[DEBUG] Checkbox tag found via query:', checkboxTag, 'for block:', block.uuid)
        return true
      }
    }

    // Fallback: Check properties.tags if available
    const tags = block.properties?.tags
    if (tags) {
      const hasTag = Array.isArray(tags) ? tags.includes(checkboxTag) : tags === checkboxTag
      if (hasTag) {
        console.log('[DEBUG] Checkbox tag found in properties.tags:', checkboxTag, 'for block:', block.uuid)
        return true
      }
    }

    return false
  } catch (error) {
    console.error('[DEBUG] Error checking checkbox tag:', error)
    return false
  }
}

/**
 * Gets the checkbox property value from a block
 * Looks for any boolean/checkbox-type property
 */
function getCheckboxValue(block: BlockEntity): boolean | null {
  console.log('[DEBUG] getCheckboxValue called for block:', block.uuid)

  // In Logseq DB, properties are stored directly on the block object with namespaced keys
  // Format: ':user.property/propertyname' or ':logseq.property/propertyname'
  // NOT in block.properties!

  const blockObj = block as Record<string, any>

  // Look for properties directly on the block object
  // Properties have keys starting with ':' and containing 'property'
  for (const [key, value] of Object.entries(blockObj)) {
    // Skip non-property keys
    if (!key.startsWith(':')) continue
    if (!key.includes('property')) continue
    if (key === ':logseq.property/created-by-ref') continue // Skip metadata

    // Check if it's a boolean value (checkbox properties are boolean)
    if (typeof value === 'boolean') {
      console.log(`[DEBUG] Found checkbox property: ${key} = ${value}`)
      return value
    }
  }

  console.log('[DEBUG] No checkbox value found on block')
  return null
}

/**
 * Recursively counts checkboxes in a block tree
 * Only counts blocks tagged with the configured checkbox tag
 *
 * @param block - Block entity with children
 * @returns Object with total and checked counts
 */
export async function countCheckboxes(block: BlockEntity): Promise<CheckboxCount> {
  let total = 0
  let checked = 0

  console.log('[DEBUG] countCheckboxes checking block:', block.uuid, block.content || block.title)

  // Check if current block is tagged with the configured checkbox tag
  const hasCheckbox = await hasCheckboxTag(block)
  console.log('[DEBUG] Block has checkbox tag:', hasCheckbox)

  if (hasCheckbox) {
    total++

    // Try to get the checkbox value
    const checkboxValue = getCheckboxValue(block)
    console.log('[DEBUG] Checkbox value:', checkboxValue)
    if (checkboxValue === true) {
      checked++
    }
  }

  // Recursively process children
  if (block.children && Array.isArray(block.children)) {
    console.log('[DEBUG] Block has', block.children.length, 'children')
    for (const child of block.children) {
      if (typeof child === 'object' && 'uuid' in child) {
        const childCounts = await countCheckboxes(child as BlockEntity)
        total += childCounts.total
        checked += childCounts.checked
      }
    }
  } else {
    console.log('[DEBUG] Block has no children')
  }

  console.log('[DEBUG] countCheckboxes result for block:', block.uuid, '- total:', total, 'checked:', checked)
  return { total, checked }
}

/**
 * Updates progress indicator for a checklist block
 *
 * @param checklistBlockUuid - UUID of the checklist block
 */
export async function updateChecklistProgress(
  checklistBlockUuid: string
): Promise<void> {
  try {
    console.log('[DEBUG] updateChecklistProgress starting for:', checklistBlockUuid)

    // Get block with all children
    const block = await logseq.Editor.getBlock(checklistBlockUuid, {
      includeChildren: true
    })

    if (!block) {
      console.warn(`[DEBUG] Block not found: ${checklistBlockUuid}`)
      return
    }

    console.log('[DEBUG] Block retrieved, counting checkboxes...')

    // Count checkboxes using async function
    const { total, checked } = await countCheckboxes(block)

    console.log('[DEBUG] Checkbox count:', checked, '/', total)

    // Get current content (use 'content' or 'title' depending on availability)
    const currentContent = block.content || block.title || ''
    console.log('[DEBUG] Current content:', currentContent)

    // Update content with new progress indicator
    const newContent = updateProgressIndicator(currentContent, checked, total)
    console.log('[DEBUG] New content:', newContent)

    // Only update if content changed
    if (newContent !== currentContent) {
      console.log('[DEBUG] Content changed, updating block...')
      await logseq.Editor.updateBlock(block.uuid, newContent)
      console.log('[DEBUG] Block updated successfully!')
    } else {
      console.log('[DEBUG] Content unchanged, skipping update')
    }
  } catch (error) {
    console.error('[DEBUG] Error updating checklist progress:', error)
  }
}

/**
 * Updates all checklist blocks in the graph
 * Used by manual slash command
 */
export async function updateAllChecklists(): Promise<number> {
  try {
    // Query all blocks with #checklist tag using proper Logseq DB tag matching
    // Note: datascriptQuery expects raw datalog format (no {:query ...} wrapper)
    const query = `
    [:find (pull ?b [*])
     :where
     [?b :block/tags ?t]
     [?t :block/title "checklist"]]
    `

    const results = await logseq.DB.datascriptQuery(query)

    if (!results || results.length === 0) {
      return 0
    }

    // Update each checklist block
    for (const [block] of results) {
      if (block?.uuid) {
        await updateChecklistProgress(block.uuid)
      }
    }

    return results.length
  } catch (error) {
    console.error('Error updating all checklists:', error)
    return 0
  }
}
