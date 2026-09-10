# Simplify 4 Me 3.0.0 — Release notes

## Release title
**Simplify 4 Me 3.0 — Reading Assistant Update**

## Short update note
Simplify 4 Me has been rebuilt into a more complete private reading assistant. Version 3.0 adds highlight-to-Simplify, three simplification strengths, Key Points, Hard Words, Quick Read, Focus Mode, Complexity Lens, Read Aloud, safer replace/undo, improved custom rules, keyboard shortcuts, and a completely redesigned interface.

## What's new
- New highlight-to-Simplify button beside readable text selections.
- New polished in-page result card with Simpler, Key Points, and Hard Words tabs.
- Light, Clear, and Simple simplification strengths.
- Expanded deterministic local dictionary and phrase engine.
- Extractive Key Points designed to select source sentences instead of inventing new text.
- Hard Words definitions and plain-English alternatives.
- Quick Read distraction-free article view.
- Quick Read original/simpler/key-points modes, reading themes, text size, spacing, and width controls.
- Read Aloud through Chrome/OS speech synthesis.
- Focus Mode for following one readable block at a time.
- Complexity Lens using Chrome's Custom Highlight API where supported.
- Optional “Always help on this site” preference.
- Custom rule manager plus JSON settings export/import.
- Safe Replace restricted to a selection inside one text node, with an undo window.
- Right-click actions and keyboard shortcuts.
- New popup, settings page, and interactive first-run onboarding.
- Permission reduction and privacy review.
- No developer cloud backend, API key, remote JavaScript, externally downloaded AI model, or behavioral analytics service.

## Compatibility note
Tabs that were already open while Chrome updates the extension may need one refresh before the new content script becomes available. Chrome internal pages and other browser-protected pages cannot run the extension.

## Upgrade behavior
Version 3.0 seeds missing defaults without intentionally clearing unknown legacy storage. It includes defensive migration for common 2.x-style simplification level, custom-rule, and automatic-site storage keys. Because the original 2.1.2 archive was not available inside the final CI environment, exact migration of every historical private key cannot be asserted; the release preserves unrecognized local keys rather than deleting them.
