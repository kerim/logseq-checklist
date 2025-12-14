import { BlockEntity, CheckboxCount } from './types'
import { updateProgressIndicator } from './content'
import { getSettings } from './settings'

/**
 * Checks if a block is tagged with the configured checkbox tag
 */
async function hasCheckboxTag(block: BlockEntity): Promise<boolean> {
  const tags = block.properties?.tags
  if (!tags) return false

  const settings = await getSettings()
  const checkboxTag = settings.checkboxTag

  if (Array.isArray(tags)) {
    return tags.includes(checkboxTag)
  }
  return tags === checkboxTag
}

/**
 * Gets the checkbox property value from a block
 * Looks for any boolean/checkbox-type property
 */
function getCheckboxValue(block: BlockEntity): boolean | null {
  if (!block.properties) return null

  const props = block.properties as Record<string, any>

  // Debug logging to see what properties are available
  console.log('[DEBUG] Checkbox block properties:', {
    uuid: block.uuid,
    properties: Object.keys(props),
    values: props
  })

  // Look for any boolean property (excluding tags)
  for (const [key, value] of Object.entries(props)) {
    // Skip the tags property
    if (key === 'tags') continue

    // Look for boolean values (checkbox properties are boolean)
    if (typeof value === 'boolean') {
      console.log(`[DEBUG] Found boolean property: ${key} = ${value}`)
      return value
    }

    // Also check for properties with 'checkbox' or 'cb' in the name
    if (key.toLowerCase().includes('checkbox') || key.toLowerCase().includes('cb')) {
      console.log(`[DEBUG] Found checkbox-named property: ${key} = ${value}`)
      if (typeof value === 'boolean') {
        return value
      }
    }
  }

  console.log('[DEBUG] No checkbox value found')
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

  // Check if current block is tagged with the configured checkbox tag
  if (await hasCheckboxTag(block)) {
    total++

    // Try to get the checkbox value
    const checkboxValue = getCheckboxValue(block)
    if (checkboxValue === true) {
      checked++
    }
  }

  // Recursively process children
  if (block.children && Array.isArray(block.children)) {
    for (const child of block.children) {
      if (typeof child === 'object' && 'uuid' in child) {
        const childCounts = await countCheckboxes(child as BlockEntity)
        total += childCounts.total
        checked += childCounts.checked
      }
    }
  }

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
    // Get block with all children
    const block = await logseq.Editor.getBlock(checklistBlockUuid, {
      includeChildren: true
    })

    if (!block) {
      console.warn(`Block not found: ${checklistBlockUuid}`)
      return
    }

    // Count checkboxes using async function
    const { total, checked } = await countCheckboxes(block)

    // Get current content (use 'content' or 'title' depending on availability)
    const currentContent = block.content || block.title || ''

    // Update content with new progress indicator
    const newContent = updateProgressIndicator(currentContent, checked, total)

    // Only update if content changed
    if (newContent !== currentContent) {
      await logseq.Editor.updateBlock(block.uuid, newContent)
    }
  } catch (error) {
    console.error('Error updating checklist progress:', error)
  }
}

/**
 * Updates all checklist blocks in the graph
 * Used by manual slash command
 */
export async function updateAllChecklists(): Promise<number> {
  try {
    // Query all blocks with #checklist tag
    const query = `
    [:find (pull ?b [*])
     :where
     [?b :block/properties ?props]
     [(get ?props :tags) ?tags]
     [(clojure.string/includes? (str ?tags) "checklist")]]
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
