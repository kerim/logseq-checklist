# Logseq Checklist Progress Indicator

Automatically adds progress indicators to blocks tagged with `#checklist`, showing completion status based on child checkbox items.

## Features

- ✅ **Real-time automatic updates** via `DB.onChanged` hook
- ✅ **Manual update command** as fallback (`/Update checklist progress`)
- ✅ **Recursive checkbox counting** - counts checkboxes at any depth
- ✅ **Debounced updates** - prevents UI thrashing during rapid changes
- ✅ **Clean integration** - progress indicators auto-update as you check/uncheck items

## Usage

### Automatic Mode (Recommended)

1. Tag a parent block with `#checklist`
2. Add child blocks tagged with `#checkbox`
3. Add a checkbox property to the `#checkbox` class (if not already set up)
4. Progress indicator updates automatically when you toggle checkboxes

**Example:**
```
- (1/3) watch these films #checklist
  - The Matrix #checkbox
  - Inception #checkbox
  - Interstellar #checkbox
```

The `(1/3)` indicator updates automatically as you toggle the checkbox property on child blocks.

### Manual Mode

If automatic updates aren't working, use the slash command:

1. Type `/Update checklist progress` anywhere in Logseq
2. All checklist blocks will be updated

## How It Works

### Checkbox Detection
- Plugin only counts blocks tagged with `#checkbox` that are nested under blocks tagged with `#checklist`
- The `#checkbox` class should have a checkbox-type property defined
- Checkbox state: `true` = checked ✅, `false` or `undefined` = unchecked ☐

### Progress Calculation
- Recursively traverses all child blocks (any depth) under `#checklist` blocks
- Counts blocks tagged with `#checkbox`
- Checks the boolean value of their checkbox property
- Displays as `(checked/total)` at the start of the checklist block

### Update Mechanism
- **Primary:** `DB.onChanged` listener detects checkbox changes
- **Fallback:** Manual slash command updates all checklists
- **Debouncing:** Updates are batched over 300ms to prevent thrashing

## Installation

### Development (Testing)

1. Clone or download this repository
2. Install dependencies:
   ```bash
   pnpm install
   ```
3. Build the plugin:
   ```bash
   pnpm run build
   ```
4. In Logseq:
   - Go to Settings → Plugins
   - Click "Load unpacked plugin"
   - Select this plugin directory

### Development with Watch Mode

For active development:
```bash
pnpm run dev
```

This rebuilds the plugin whenever you change source files. Logseq will auto-reload the plugin.

## Project Structure

```
logseq-checklist/
├── src/
│   ├── index.ts      # Plugin entry, DB.onChanged setup, slash command
│   ├── progress.ts   # Core algorithm (count, update)
│   ├── events.ts     # Event handling (filter, debounce, find parents)
│   ├── content.ts    # Content manipulation utilities
│   └── types.ts      # TypeScript interfaces
├── dist/             # Build output (auto-generated)
├── package.json      # Dependencies & Logseq metadata
└── README.md
```

## Requirements

- **Logseq:** 0.11.0+ (DB graph support)
- **@logseq/libs:** ^0.2.8 (for DB.onChanged API)

## Known Limitations

- Only works with DB graphs (not markdown graphs)
- Requires `DB.onChanged` API (available in recent Logseq versions)
- Progress indicators are text-based (not interactive UI elements)

## Troubleshooting

### Automatic updates not working?

1. Check Logseq version (needs 0.11.0+)
2. Check browser console for error messages
3. Use manual command as fallback: `/Update checklist progress`

### Progress indicator not appearing?

1. Make sure parent block is tagged with `#checklist`
2. Verify child blocks are tagged with `#checkbox` (not just markdown checkboxes)
3. Check that the `#checkbox` class has a checkbox property defined
4. Try manual update command
5. Check browser console for debug logs

### Wrong count?

1. Check that all checkboxes are properly formatted
2. Nested checklists should each have their own `#checklist` tag
3. Try manual update to recalculate

## Development

### Build Commands

- `pnpm run build` - Production build
- `pnpm run dev` - Development build with watch mode

### Testing

1. Create a test page in Logseq
2. Create the `#checkbox` class if it doesn't exist:
   - Type `#checkbox` and create it as a class
   - Add a checkbox property to the class schema
3. Add a checklist block:
   ```
   - test checklist #checklist
     - item 1 #checkbox
     - item 2 #checkbox
     - item 3 #checkbox
   ```
4. Toggle the checkbox property on child blocks and verify progress updates automatically
5. Test nested checklists
6. Test rapid toggling (debouncing)
7. Check browser console for `[DEBUG]` logs to see property structure

## License

MIT

## Contributing

Contributions welcome! Please test thoroughly before submitting PRs.

## Credits

Built with:
- [Logseq Plugin API](https://github.com/logseq/logseq)
- [@logseq/libs](https://www.npmjs.com/package/@logseq/libs)
- [Vite](https://vitejs.dev/)
- [vite-plugin-logseq](https://www.npmjs.com/package/vite-plugin-logseq)
