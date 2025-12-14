import { SettingSchemaDesc } from '@logseq/libs/dist/LSPlugin.user'
import { PluginSettings, DEFAULT_SETTINGS } from './types'

/**
 * Register settings using Logseq's built-in settings schema
 */
export function registerSettings(): void {
  try {
    const settings: SettingSchemaDesc[] = [
      {
        key: 'checklistTag',
        type: 'string',
        title: 'Checklist Tag',
        description: 'Tag used to identify checklist blocks (without # prefix)',
        default: DEFAULT_SETTINGS.checklistTag,
      },
      {
        key: 'checkboxTag',
        type: 'string',
        title: 'Checkbox Tag',
        description: 'Tag used to identify checkbox blocks (without # prefix)',
        default: DEFAULT_SETTINGS.checkboxTag,
      }
    ]

    logseq.useSettingsSchema(settings)
    console.log('Settings schema registered successfully')
    
  } catch (error) {
    console.error('Error registering settings schema:', error)
  }
}

/**
 * Get current plugin settings with defaults
 * Uses Logseq's built-in settings system
 */
export function getSettings(): PluginSettings {
  try {
    // Logseq automatically provides settings via logseq.settings
    if (logseq.settings) {
      return {
        checklistTag: logseq.settings?.checklistTag || DEFAULT_SETTINGS.checklistTag,
        checkboxTag: logseq.settings?.checkboxTag || DEFAULT_SETTINGS.checkboxTag,
      }
    }
    
    // Fallback to defaults if settings not available
    return DEFAULT_SETTINGS
  } catch (error) {
    console.error('Error loading settings:', error)
    return DEFAULT_SETTINGS
  }
}