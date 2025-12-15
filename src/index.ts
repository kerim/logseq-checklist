import '@logseq/libs'
import { handleDatabaseChanges } from './events'
import { registerSettings } from './settings'

/**
 * Main plugin initialization
 */
async function main() {
  try {
    // Register settings using Logseq's built-in settings system
    registerSettings()

    // Setup DB change listener for automatic updates
    if (logseq.DB?.onChanged) {
      logseq.DB.onChanged((txData) => {
        handleDatabaseChanges(txData)
      })
    } else {
      logseq.UI.showMsg(
        'Checklist plugin: Automatic updates not available in this Logseq version',
        'warning'
      )
    }
  } catch (error) {
    console.error('Error initializing checklist plugin:', error)
    logseq.UI.showMsg('Checklist plugin initialization failed', 'error')
  }
}

// Bootstrap the plugin
logseq.ready(main).catch(console.error)
