import { PluginSettings, DEFAULT_SETTINGS } from './types'

const SETTINGS_KEY = 'logseq-checklist-settings'

/**
 * Get current plugin settings with defaults
 */
export async function getSettings(): Promise<PluginSettings> {
  try {
    // Try to get saved settings
    const savedSettings = await logseq.App.getUserConfigs(SETTINGS_KEY)
    
    if (savedSettings && Object.keys(savedSettings).length > 0) {
      // Merge with defaults to ensure all settings are present
      return { ...DEFAULT_SETTINGS, ...savedSettings }
    }
    
    // Return defaults if no settings saved
    return DEFAULT_SETTINGS
  } catch (error) {
    console.error('Error loading settings:', error)
    return DEFAULT_SETTINGS
  }
}

/**
 * Save plugin settings
 */
export async function saveSettings(settings: PluginSettings): Promise<void> {
  try {
    await logseq.App.setUserConfigs(SETTINGS_KEY, settings)
    console.log('Settings saved:', settings)
  } catch (error) {
    console.error('Error saving settings:', error)
    throw error
  }
}

/**
 * Register settings UI
 */
export function registerSettingsUI(): void {
  try {
    logseq.App.registerUIItem('toolbar', {
      key: 'logseq-checklist-settings',
      template: `
        <button
          class="button is-small"
          data-on-click="showSettingsModal"
          title="Checklist Settings"
        >
          <i class="fas fa-cog"></i>
        </button>
      `
    })
    
    // Register the settings modal
    logseq.App.registerUIItem('modal', {
      key: 'logseq-checklist-settings-modal',
      template: `
        <div class="modal is-active">
          <div class="modal-background" data-on-click="closeSettingsModal"></div>
          <div class="modal-content">
            <div class="box">
              <h3 class="title is-4">Checklist Plugin Settings</h3>
              
              <div class="field">
                <label class="label">Checklist Tag</label>
                <div class="control">
                  <input
                    class="input"
                    type="text"
                    id="checklist-tag-input"
                    placeholder="checklist"
                  >
                </div>
                <p class="help">Tag used to identify checklist blocks</p>
              </div>
              
              <div class="field">
                <label class="label">Checkbox Tag</label>
                <div class="control">
                  <input
                    class="input"
                    type="text"
                    id="checkbox-tag-input"
                    placeholder="checkbox"
                  >
                </div>
                <p class="help">Tag used to identify checkbox blocks</p>
              </div>
              
              <div class="field">
                <label class="label">Checkbox Property Pattern</label>
                <div class="control">
                  <input
                    class="input"
                    type="text"
                    id="checkbox-property-input"
                    placeholder="property"
                    value="property"
                  >
                </div>
                <p class="help">Pattern to detect checkbox property changes (e.g., "property" or "cb")</p>
              </div>
              
              <div class="buttons">
                <button
                  class="button is-primary"
                  data-on-click="saveSettings"
                >
                  Save Settings
                </button>
                <button
                  class="button"
                  data-on-click="closeSettingsModal"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
          <button
            class="modal-close is-large"
            aria-label="close"
            data-on-click="closeSettingsModal"
          ></button>
        </div>
      `
    })
    
    // Register event handlers
    logseq.App.onMacroRendererSlotted(({ slot, payload }) => {
      if (payload.args[0] === 'showSettingsModal') {
        showSettingsModal()
      }
    })
    
    // Define the macro handlers
    window['showSettingsModal'] = showSettingsModal
    window['closeSettingsModal'] = closeSettingsModal
    window['saveSettings'] = saveSettingsFromUI
    
  } catch (error) {
    console.error('Error registering settings UI:', error)
  }
}

async function showSettingsModal(): Promise<void> {
  try {
    const settings = await getSettings()
    
    // Set current values in the modal
    const checklistInput = document.getElementById('checklist-tag-input') as HTMLInputElement
    const checkboxInput = document.getElementById('checkbox-tag-input') as HTMLInputElement
    const propertyInput = document.getElementById('checkbox-property-input') as HTMLInputElement
    
    if (checklistInput) checklistInput.value = settings.checklistTag
    if (checkboxInput) checkboxInput.value = settings.checkboxTag
    if (propertyInput) propertyInput.value = settings.checkboxPropertyPattern || 'property'
    
    // Show the modal
    logseq.showMainUI()
  } catch (error) {
    console.error('Error showing settings modal:', error)
  }
}

async function closeSettingsModal(): Promise<void> {
  logseq.hideMainUI()
}

async function saveSettingsFromUI(): Promise<void> {
  try {
    const checklistInput = document.getElementById('checklist-tag-input') as HTMLInputElement
    const checkboxInput = document.getElementById('checkbox-tag-input') as HTMLInputElement
    const propertyInput = document.getElementById('checkbox-property-input') as HTMLInputElement
    
    const settings: PluginSettings = {
      checklistTag: checklistInput?.value || 'checklist',
      checkboxTag: checkboxInput?.value || 'checkbox',
      checkboxPropertyPattern: propertyInput?.value || 'property'
    }
    
    await saveSettings(settings)
    closeSettingsModal()
    
    // Show success message
    logseq.UI.showMsg('✅ Checklist settings saved!', 'success')
    
    // Reload plugin to apply new settings
    setTimeout(() => {
      window.location.reload()
    }, 1000)
    
  } catch (error) {
    console.error('Error saving settings:', error)
    logseq.UI.showMsg('❌ Error saving settings', 'error')
  }
}