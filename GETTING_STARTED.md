# Logseq Checklist Progress Indicator Plugin

## What This Plugin Does

Automatically adds progress indicators to blocks tagged with `#checklist`, showing how many checkbox items are completed.

**Example:**
```
- (1/2) watch these films #checklist
  - [x] movie 1
  - [ ] movie 2
  - no checkbox
```

The plugin counts child blocks with the `#checkbox` tag and displays "(1/2)" where 1 = checked, 2 = total.

---

## Current Status: Planning Complete ✅

The plugin architecture is fully planned and ready for implementation. All code patterns, algorithms, and project structure are documented.

**Full Plan Location:** `/Users/niyaro/.claude/plans/lovely-mixing-wilkes.md`

---

## Decision Needed Before Implementation

### Update Mechanism (Choose One)

The Logseq plugin API doesn't currently have event listeners for checkbox changes. We need to decide how to trigger updates:

#### Option A: Manual Slash Command (Recommended for MVP)
- User types `/Update checklist progress` to refresh
- **Pros:** Simple, reliable, no performance overhead
- **Cons:** Requires manual trigger each time

#### Option B: Polling (Auto-Update)
- Automatically checks and updates every N seconds (e.g., every 5 seconds)
- **Pros:** Automatic, always current
- **Cons:** Performance cost, battery drain, potential UI lag

#### Option C: Hybrid
- Manual command + optional polling (toggle in settings)
- **Pros:** Flexible, best of both worlds
- **Cons:** More complex to implement

### Research Resources

Before deciding, you may want to check:
- **Logseq Plugin API Docs:** https://plugins-doc.logseq.com/
- **GitHub Issues:** Search for "event listener" or "block changed" at https://github.com/logseq/logseq/issues
- **Logseq Discord:** #plugin-dev channel
- **Example Plugins:** Check if popular plugins use real-time updates

---

## Technical Details

### How It Works

1. **Checkbox Detection:** Blocks tagged with `#checkbox` have a boolean `checkbox` property
   - `true` = checked ✅
   - `false` or `undefined` = unchecked ☐

2. **Progress Calculation:** Recursively traverses all child blocks (any depth) to count:
   - Total checkboxes
   - Checked checkboxes

3. **Content Update:** Safely adds/updates "(X/Y)" at the start of the checklist block content using regex

### Technology Stack

- **Language:** TypeScript
- **Bundler:** Vite with vite-plugin-logseq
- **Framework:** @logseq/libs ^0.2.8
- **Target:** Logseq DB graphs

---

## Project Structure (Planned)

```
logseq-checklist/
├── src/
│   ├── index.ts              # Plugin entry, command registration
│   ├── progress.ts           # Core logic: calculate & update
│   ├── content.ts            # Content manipulation utilities
│   └── types.ts              # TypeScript interfaces
├── dist/                     # Build output (auto-generated)
├── package.json              # Dependencies & config
├── tsconfig.json             # TypeScript config
├── vite.config.ts            # Vite bundler config
├── .gitignore
└── README.md
```

---

## Implementation Steps (When Ready)

### Phase 1: Project Setup
1. Create directory structure
2. Create configuration files (package.json, vite.config.ts, tsconfig.json)
3. Install dependencies with `pnpm install`

### Phase 2: Code Implementation
4. Write TypeScript files (types.ts, content.ts, progress.ts, index.ts)
5. Implement recursive traversal algorithm
6. Add error handling and user feedback

### Phase 3: Build & Test
7. Build with `pnpm run build`
8. Load plugin in Logseq (Settings → Plugins → Load unpacked)
9. Test with various scenarios (nested checkboxes, empty lists, etc.)

### Phase 4: Polish & Documentation
10. Add comprehensive error handling
11. Write README and CHANGELOG
12. Test edge cases

**Estimated Time:** 2-4 hours for MVP (manual slash command version)

---

## Reference Files

### Code Examples
- **Tag Schema POC:** `/Users/niyaro/Documents/Code/Logseq API/old POCs/logseq-tag-schema-poc/src/index.ts`
  - Plugin initialization pattern
  - Slash command registration
  - Error handling examples

- **Zotero DB Plugin:** `/Users/niyaro/Documents/Code/Logseq-Zotero Integration/logseq-zot-db-plugin/`
  - Recursive block traversal patterns
  - Complex plugin architecture

### Documentation
- **Logseq DB Plugin API Skill:** `/Users/niyaro/.claude/skills/logseq-db-plugin-api-skill/SKILL.md`
  - Complete API reference
  - Property handling
  - Query patterns

---

## Next Steps

1. **Research update mechanisms** (if desired) using resources above
2. **Choose update method:** Manual (Option A), Polling (Option B), or Hybrid (Option C)
3. **Start implementation:** Resume with Claude Code and reference the full plan
4. **Test thoroughly** with real Logseq graphs

---

## Questions?

- **Full detailed plan:** `/Users/niyaro/.claude/plans/lovely-mixing-wilkes.md`
- **Skill documentation:** `/Users/niyaro/.claude/skills/logseq-db-plugin-api-skill/SKILL.md`
- **When ready to implement:** Just tell Claude "let's implement the checklist plugin with [your chosen update method]"

---

**Status:** Ready to implement once update mechanism is decided! 🚀
