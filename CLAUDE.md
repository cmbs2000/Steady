@AGENTS.md

# Update path reporting

Whenever you finish making a change to the app, explicitly state whether it can ship via EAS Update or needs a full rebuild:

- **EAS Update** — JS/asset-only changes: new screens, logic, styling, data/content changes, bug fixes.
- **Full rebuild required** — anything touching native code: new native libraries, permission changes, icon/splash screen changes, or other native config.

Format at the end of your response:

```
Update path: EAS Update
```
or
```
Update path: Full rebuild required (reason: [why])
```

If a single change mixes both kinds of edits (e.g., a new screen that also needs a new native permission), say so explicitly rather than defaulting to one label — the whole change won't ship until a rebuild happens even if most of it is just JS.

This applies to every change, every session — not just when asked.
