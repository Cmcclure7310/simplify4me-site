# Chrome Web Store — Privacy practices answers

Use these answers for Simplify 4 Me 3.0. The wording is deliberately conservative because Chrome treats website content and locally handled sensitive data as information that must be described accurately.

## Single purpose description
**Simplify 4 Me makes webpage text easier to read and understand through local text simplification, extractive key points, hard-word help, distraction-free reading, focus tools, and optional read-aloud support.**

## Does the extension use remote code?
**No.**

All JavaScript required by Simplify 4 Me is packaged inside the extension. It does not load remote JavaScript, remote modules, WebAssembly, or executable code from an external server. It does not use `eval()` or `new Function()` to execute downloaded code.

## User data categories
### Website content — YES
The extension intentionally reads and processes text from webpages to provide selected-text simplification, Key Points, Hard Words, Quick Read, Focus Mode, and Complexity Lens. This processing is directly required for the user-facing reading features. The extension does not transmit that webpage content to a developer-operated server or cloud AI service.

### Web history — YES, limited local site preference
If the user explicitly enables **Always help on this site**, Simplify 4 Me stores that website's hostname locally so it can remember the user's choice. It does not build a general browsing-history log, track page visits, record timestamps, or transmit the hostname to the developer. This disclosure is included because Chrome's policy treats stored domains/URLs as browsing activity even when stored locally.

### Personally identifiable information — NO
The extension does not request or intentionally collect a user's name, email address, physical address, phone number, government identifier, or account identity.

### Health information — NO
The extension does not intentionally collect or store health data as a product feature. Text present on a webpage may be locally processed only when needed for the user-invoked reading feature; it is not categorized, profiled, or transmitted by Simplify 4 Me.

### Financial and payment information — NO
The extension does not intentionally collect or store financial/payment data as a product feature. It avoids editable form fields and does not transmit webpage text.

### Authentication information — NO
The extension does not read passwords, authentication cookies, login tokens, or credentials.

### Personal communications — NO
The extension does not provide email/message access or intentionally collect communications as a separate product feature. If a normal webpage contains readable text and the user selects it, the extension's reading transform occurs locally in the same manner as other page text.

### Location — NO
The extension does not request or derive precise or coarse location.

### User activity — NO
Version 3.0 has no behavioral analytics service, clickstream logging, keystroke logging, mouse tracking for analytics, or developer-operated usage telemetry. Pointer movement is observed only while Focus Mode is active to visually follow the readable block under the pointer; it is not stored or transmitted.

## Limited Use certifications
Certify the following as true:

- User data is used only to provide or improve Simplify 4 Me's single reading-assistant purpose.
- User data is not sold to third parties.
- User data is not used or transferred for personalized, retargeted, or interest-based advertising.
- User data is not used or transferred to determine creditworthiness or lending purposes.
- User data is not transferred except as necessary to provide a user-requested feature or as otherwise permitted by Chrome Web Store policy and law.
- No developer employee or contractor has routine access to users' webpage text because Simplify 4 Me does not transmit it to a developer-operated service.

## Read Aloud disclosure
When the user intentionally selects **Listen**, the extension hands the requested text to the speech-synthesis feature provided by Chrome or the operating system. Simplify 4 Me does not operate a speech server and does not make a network request for this feature itself. Voice processing behavior can depend on the browser, operating system, and selected voice.

## Privacy policy URL
Host `privacy.html` from the included website package and use that HTTPS URL in the Developer Dashboard.

## Important submission note
Chrome's Dashboard labels can change. If the Dashboard asks whether a category is *handled, processed, used, stored, or collected* rather than transmitted, keep **Website content** checked and keep **Web history** checked because the optional per-site preference stores a hostname locally. Do not represent locally processed website content as “not handled.”
