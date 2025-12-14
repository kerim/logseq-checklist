/**
 * Content manipulation utilities for progress indicators
 */

/**
 * Updates progress indicator in block content
 * Removes existing indicator and prepends new one
 *
 * @param content - Original block content
 * @param checked - Number of checked checkboxes
 * @param total - Total number of checkboxes
 * @returns Updated content with progress indicator
 */
export function updateProgressIndicator(
  content: string,
  checked: number,
  total: number
): string {
  // Remove existing progress indicator (matches "(X/Y) " at start)
  const cleanContent = content.replace(/^\(\d+\/\d+\)\s*/, '')

  // Only add indicator if there are checkboxes
  if (total === 0) {
    return cleanContent
  }

  // Prepend new progress
  return `(${checked}/${total}) ${cleanContent}`
}

/**
 * Removes progress indicator from block content
 *
 * @param content - Block content
 * @returns Content without progress indicator
 */
export function removeProgressIndicator(content: string): string {
  return content.replace(/^\(\d+\/\d+\)\s*/, '')
}

/**
 * Checks if content has a progress indicator
 *
 * @param content - Block content
 * @returns True if content starts with progress indicator
 */
export function hasProgressIndicator(content: string): boolean {
  return /^\(\d+\/\d+\)\s/.test(content)
}
