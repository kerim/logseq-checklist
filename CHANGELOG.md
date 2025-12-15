# Changelog

All notable changes to the Logseq Checklist Progress Indicator plugin will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.1.21] - 2025-12-15

### Fixed
- **ReferenceError in events.ts** - Fixed undefined `propertyPattern` variable reference
- Changed to use `checkboxProperty` variable instead (leftover from previous refactoring)
- Eliminates console error that appeared on every database change

## [0.1.20] - 2025-12-15

### Fixed
- **Checkbox value reading** - Now reads properties directly from block object instead of `block.properties`
- **Property access in Logseq DB** - Discovered properties are stored as namespaced keys on block object
- **Checkbox state detection** - Can now properly read true/false values from checkbox properties

### Changed
- Rewrote `getCheckboxValue()` to iterate over block object keys
- Now looks for keys starting with `:` and containing `property`
- Checks if value is boolean type (checkbox properties are boolean)
- Skips metadata properties like `:logseq.property/created-by-ref`

### Technical Details
- In Logseq DB, properties are NOT stored in `block.properties` (which is always undefined)
- Properties are stored directly on block object with namespaced keys: `:user.property/name` or `:logseq.property/name`
- Example: `:user.property/cbproperty-O9FVGbdJ` with boolean value
- This is the correct Logseq DB data model for property access

## [0.1.18] - 2025-12-15

### Fixed
- **Checkbox tag detection** - Now uses datascript queries instead of `block.properties.tags`
- **hasCheckboxTag() function** - Completely rewritten to match checklist tag detection approach
- **Checkbox counting** - Now properly detects blocks tagged with #checkbox

### Changed
- Made `hasCheckboxTag()` use the same reliable datascript query pattern as checklist detection
- Added content-based detection as primary method (fastest)
- Added datascript query as secondary method (most reliable)
- Kept properties.tags check as fallback for edge cases

### Technical Details
- `block.properties.tags` is always undefined when blocks are retrieved via API
- Must use datascript queries: `[:find (pull ?b [*]) :where [?b :block/tags ?t] [?t :block/title "checkbox"]]`
- This matches the same fix applied to checklist tag detection in v0.1.16

## [0.1.17] - 2025-12-15

### Changed
- Added comprehensive debug logging throughout update flow
- Added logs to scheduleUpdate, updateChecklistProgress, and countCheckboxes
- Helps diagnose issues with checkbox detection and progress updates

## [0.1.16] - 2025-12-15

### Fixed
- **Datascript query wrapper** - Removed `{:query ...}` wrapper that was causing parse errors
- **Query format** - Now using raw datalog format as expected by `logseq.DB.datascriptQuery()` API
- **Tag detection** - Queries now execute successfully without parse errors

### Changed
- Query format changed from `{:query [:find ...]}` to raw `[:find ...]` format
- Both `src/events.ts` and `src/progress.ts` now use consistent raw datalog syntax
- Added clarifying comments about datascriptQuery expecting raw format

### Technical Details
- The `{:query ...}` wrapper is for UI queries (in blocks), not for the datascriptQuery API
- The API expects raw datalog: `[:find (pull ?b [*]) :where ...]`
- v0.1.15 incorrectly used wrapped format which continued to fail

## [0.1.15] - 2025-12-15

### Fixed
- **Datascript query syntax** - FINALLY fixed using proper `(pull ?b [*])` syntax instead of `[?block-uuid]`
- **Tag detection query** - replaced incorrect vector format with proper pull pattern
- **Query parsing error** - resolved "Cannot parse :find" error by using correct Logseq DB query structure
- **Result processing** - updated to handle full block objects instead of UUIDs

### Changed
- Query in `src/events.ts` now uses `{:query [:find (pull ?b [*]) :where [?b :block/tags ?t] [?t :block/title "tag"]]}` format
- Query in `src/progress.ts` updated to use proper tag matching instead of string matching for consistency
- Improved code comments to explain correct datascript query syntax
- Result processing now filters full block objects to find matching UUID

### Technical Details
- Previous attempts (v0.1.13, v0.1.14) used `[:find [?block-uuid]]` which is invalid datascript syntax
- Correct format requires `(pull ?b [*])` to return full block entities
- Tag matching must use `[?b :block/tags ?t]` followed by `[?t :block/title "tagname"]`
- Based on Logseq DB knowledge documentation and working examples in codebase

## [0.1.14] - 2025-12-14

### Fixed
- **Datascript query syntax** - fixed `:find` clause to use vector format `[?block-uuid]`
- **Query parsing error** - resolved "Cannot parse :find, expected: (find-rel | find-coll | find-tuple | find-scalar)"
- **Tag detection query** - now uses proper datascript query structure

### Changed
- Updated datascript query to use correct `:find [?block-uuid]` syntax
- Improved query error handling and logging
- Simplified result processing

## [0.1.13] - 2025-12-14

### Fixed
- **Tag detection in Logseq DB graphs** - completely rewrote tag detection to use proper datascript queries
- **Query syntax** - now uses correct `{:query ...}` format for Logseq DB
- **Tag matching** - uses `:block/title` which works for both built-in and custom tags
- **Class-based tag detection** - properly finds blocks with `:user.class/checklist-SlGqj6-b` tags

### Changed
- Replaced complex class API calls with simple datascript query
- Simplified tag detection to focus on the most reliable method
- Updated query to match the actual Logseq DB data structure
- Improved debug logging to show query results

### Removed
- Unnecessary API calls that were causing errors
- Complex fallback methods that weren't working
- Redundant error handling

## [0.1.12] - 2025-12-14

### Fixed
- **Datascript query structure** - rewritten query to properly find class properties
- **Query variable binding** - corrected `:find` clause to match `:where` variables
- **Property extraction** - fixed array indexing for [block, property] results

### Changed
- Updated query to find [?block ?property] pairs instead of just [?property]
- Improved query structure to match Logseq's datascript expectations
- Enhanced debug logging for query results

### Removed
- Unnecessary database fetch that wasn't being used

## [0.1.11] - 2025-12-14

### Fixed
- **Datascript query syntax** - fixed query to find checkbox class properties
- **Query variable binding** - corrected `:find` clause to match actual results
- **Property extraction** - fixed array indexing for query results

### Changed
- Simplified datascript query to only find property (not class-uuid + property)
- Updated result processing to handle single-variable queries
- Improved error handling for query failures

## [0.1.10] - 2025-12-14

### Added
- **Smart checkbox property detection** - queries checkbox class to find exact property
- **Dynamic property discovery** - no more guessing property patterns
- **Direct class inspection** - reads `:build/class-properties` from checkbox class

### Fixed
- **Property pattern guessing** - replaced with exact property lookup
- **Configuration complexity** - removed unnecessary property pattern setting
- **Detection accuracy** - now uses the actual property name from the class definition

### Changed
- Replaced pattern-based detection with class-based property discovery
- Added `getCheckboxPropertyFromClass()` function
- Updated `isActualCheckboxChange()` to use exact property matching
- Removed reliance on property pattern settings

### Removed
- **Checkbox Property Pattern setting** - no longer needed
- Pattern-based guessing logic
- Unnecessary configuration complexity

## [0.1.9] - 2025-12-14

### Fixed
- **Import error** - fixed incorrect import of registerSettings function
- **Initialization error** - plugin now loads properly

## [0.1.8] - 2025-12-14

### Added
- **Proper Logseq settings implementation** using `logseq.useSettingsSchema()`
- **Built-in settings UI** - no more manual modal implementation
- **Synchronous settings access** via `logseq.settings`

### Fixed
- **Settings implementation** - now follows Logseq best practices
- **Settings access** - removed manual storage, uses Logseq's built-in system
- **Settings UI** - uses native Logseq settings panel

### Changed
- Replaced manual settings UI with `logseq.useSettingsSchema()`
- Updated all settings access to use synchronous `logseq.settings`
- Removed manual settings storage/retrieval functions
- Updated function names: `registerSettings()` instead of `registerSettingsUI()`

### Removed
- Manual settings modal implementation
- Custom settings storage using `getUserConfigs/setUserConfigs`
- Complex UI registration code

## [0.1.7] - 2025-12-14

### Added
- **Robust tag detection** with multiple fallback methods
- **Content-based tag detection** - checks for `#tag` in block content
- **Datascript query support** for tag detection
- **Comprehensive debug logging** for each tag detection method

### Fixed
- **Tag detection issue** - blocks now properly identified as checklists
- Multiple ways to detect tags to handle different Logseq block structures
- Fallback methods when `properties.tags` is undefined

### Changed
- Replaced simple tag checking with `checkBlockHasTag()` helper function
- Added 4 different tag detection methods with fallback chain
- Enhanced debug logging to show which method succeeded

## [0.1.6] - 2025-12-14

### Added
- **Enhanced debug logging** for parent checklist detection
- Detailed logging of block hierarchy traversal
- Logging of tag checking process
- Safety limits to prevent infinite loops

### Fixed
- Checkbox detection now working correctly with default settings
- Property pattern "property" successfully matches "user.property/cbproperty-O9FVGbdJ"
- Entity ID to block conversion working properly

### Changed
- Updated `findParentChecklistBlock()` to use configured checklist tag
- Added comprehensive debug logging to trace parent finding process
- Improved error handling in parent traversal

## [0.1.5] - 2025-12-14

### Added
- **Settings infrastructure**: Configurable checklist and checkbox tags
- **Settings UI**: Toolbar button and modal for configuring plugin behavior
- **Dynamic tag detection**: Uses configured tags instead of hardcoded values
- **Configurable property pattern**: Users can specify what property changes to detect

### Changed
- Updated checkbox detection to use settings-based property pattern
- Made tag checking dynamic based on user configuration
- Improved debug logging to show which pattern is being used

## [0.1.4] - 2025-12-14

### Added
- Added detailed txData contents logging to debug checkbox change detection
- Will show full datom structure to understand why checkbox changes aren't being detected

## [0.1.3] - 2025-12-14

### Fixed
- Fixed DB.onChanged handler to access txData from change object correctly
- The hook receives `{ blocks, deletedAssets, deletedBlockUuids, txData, txMeta }`, not just the array
- Added more detailed debug logging throughout the change detection flow

## [0.1.2] - 2025-12-14

### Fixed
- Fixed `txData.filter is not a function` error in DB.onChanged handler
- Added defensive type checking for txData parameter
- Added comprehensive debug logging to understand DB.onChanged data format

## [0.1.1] - 2025-12-14

### Changed
- **BREAKING:** Updated checkbox detection to use `#checkbox` tags instead of markdown checkboxes
- Plugin now only counts blocks tagged with `#checkbox` nested under blocks tagged with `#checklist`
- Checkbox state is read from checkbox-type properties on `#checkbox` tagged blocks

### Added
- Debug logging to help identify property structure during testing
- More flexible checkbox property detection (looks for any boolean property)

### Fixed
- Corrected README documentation to reflect proper Logseq DB checkbox usage

## [0.1.0] - 2025-12-14

### Added
- Initial release of Checklist Progress Indicator plugin
- Real-time automatic updates via `DB.onChanged` hook
- Manual update command: `/Update checklist progress`
- Recursive checkbox counting (counts at any depth)
- Debounced updates (300ms) to prevent UI thrashing
- Comprehensive error handling and logging
- Support for nested checklists

### Features
- Automatically adds progress indicators like `(1/3)` to blocks tagged with `#checklist`
- Updates progress when checkboxes are toggled
- Fallback to manual command if automatic updates unavailable
- Works with Logseq DB graphs (0.11.0+)

### Technical Details
- Built with TypeScript
- Uses Vite bundler with vite-plugin-logseq
- Requires @logseq/libs ^0.2.8
- Clean project structure with separate modules for events, progress, and content manipulation

[0.1.0]: https://github.com/yourusername/logseq-checklist/releases/tag/v0.1.0
