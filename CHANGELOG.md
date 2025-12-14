# Changelog

All notable changes to the Logseq Checklist Progress Indicator plugin will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
