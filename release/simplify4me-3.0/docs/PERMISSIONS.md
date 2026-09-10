# Chrome Web Store — Permission justifications

## `storage`
**Justification:**
Simplify 4 Me uses Chrome local extension storage to remember user-selected reading preferences, simplification strength, custom replacement rules, Quick Read appearance, speech rate, feature toggles, and hostnames the user explicitly chooses for “Always help on this site.” These settings stay local to the extension and are necessary to preserve the user's chosen reading experience.

## `contextMenus`
**Justification:**
Simplify 4 Me adds user-invoked right-click actions for simplifying selected text and opening Quick Read. This gives users a direct accessibility/readability workflow without copying text into another application.

## Website access / content-script match patterns
**Justification:**
Simplify 4 Me's core user-facing features operate on webpage text. The content script must run on ordinary HTTP and HTTPS webpages so the extension can show the highlight-to-Simplify control, locally process selected text, build Quick Read from visible readable text, highlight supported difficult words, and provide Focus Mode on the webpage the user is reading. The extension does not use this access for advertising, browsing analytics, credential access, or unrelated data collection.

## Why access is broad
The extension is a general reading assistant rather than a site-specific tool. Limiting it to a fixed domain list would prevent its advertised single purpose from working on webpages users choose across the web. Chrome-protected internal pages remain inaccessible to the extension.

## Permissions intentionally not requested
Simplify 4 Me 3.0 does **not** request:
- `tabs`
- `history`
- `cookies`
- `webRequest`
- `downloads`
- `clipboardRead`
- `clipboardWrite`
- `identity`
- `scripting`
- `notifications`
- `geolocation`
- `nativeMessaging`

The extension also does not declare remote code or a cloud host permission for an API/backend.
