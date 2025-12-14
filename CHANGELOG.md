# Changelog

All notable changes to the Logseq Checklist Progress Indicator plugin will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
