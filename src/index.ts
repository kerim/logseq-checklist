import '@logseq/libs'
import { handleDatabaseChanges } from './events'
import { updateAllChecklists } from './progress'
import { registerSettings } from './settings'

/**
 * Main plugin initialization
 */
async function main() {
  console.log('Checklist Progress Indicator plugin loaded')

  try {
    // Register settings using Logseq's built-in settings system
    registerSettings()
    console.log('Settings registered using Logseq schema')

    // Setup DB change listener for automatic updates
    if (logseq.DB?.onChanged) {
      logseq.DB.onChanged((txData) => {
        handleDatabaseChanges(txData)
      })
      console.log('DB.onChanged listener registered')
    } else {
      console.warn('DB.onChanged not available - automatic updates disabled')
      logseq.UI.showMsg(
        '⚠️ Checklist plugin: Automatic updates not available. Use manual command instead.',
        'warning'
      )
    }

    // Register manual update slash command (always available as fallback)
    logseq.Editor.registerSlashCommand('Update checklist progress', async () => {
      try {
        const count = await updateAllChecklists()
        logseq.UI.showMsg(`✅ Updated ${count} checklist(s)`, 'success')
      } catch (error) {
        console.error('Error updating checklists:', error)
        logseq.UI.showMsg('❌ Error updating checklists', 'error')
      }
    })

    console.log('Slash command registered: /Update checklist progress')
  } catch (error) {
    console.error('Error initializing checklist plugin:', error)
    logseq.UI.showMsg('❌ Checklist plugin initialization failed', 'error')
  }
}

// Bootstrap the plugin
logseq.ready(main).catch(console.error)
