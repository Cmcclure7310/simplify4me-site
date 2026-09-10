# Simplify 4 Me 3.0 — Upload checklist

## 1. Test locally once
1. Download the final release artifact.
2. Unzip `Simplify4Me-3.0.0-Chrome-Web-Store.zip` into a temporary folder.
3. In Chrome, open `chrome://extensions`.
4. Turn on **Developer mode**.
5. Choose **Load unpacked** and select the folder containing `manifest.json`.
6. Open a normal article page and run this five-minute smoke test:
   - Highlight a paragraph; confirm the Simplify bubble appears.
   - Open Simpler, Key Points, and Hard Words.
   - Use Copy.
   - Use Replace on a simple selection and click the undo toast.
   - Open Quick Read and switch Original/Simpler/Key Points.
   - Toggle Focus Mode and Complexity Lens.
   - Try Listen with a non-sensitive sample sentence.
   - Open Settings and add/remove one custom rule.
7. Remove the unpacked test extension when finished so it does not conflict with the store-installed copy.

## 2. Chrome Web Store — Package
Upload exactly:

**`Simplify4Me-3.0.0-Chrome-Web-Store.zip`**

Do not upload the whole release bundle. The Chrome package ZIP has `manifest.json` at the archive root.

## 3. Store listing
Use `STORE_LISTING.md` for:
- Product name
- Accessibility category recommendation
- Short description
- Detailed description
- Website/support links

Upload the five 1280×800 screenshots in their numbered order.

Upload:
- `small-promo-440x280.png` as the small promotional tile.
- `marquee-1400x560.png` as the marquee promotional image if the dashboard offers that field.

## 4. Privacy practices
Use `PRIVACY_DISCLOSURES.md`.

Important:
- Remote code: **No**.
- Website content: **Yes** because the extension handles page text locally to provide the user-facing feature.
- Web history: **Yes** because the optional “Always help on this site” feature stores a user-selected hostname locally.
- Do not check unrelated data categories merely because a webpage might happen to contain that type of information; the extension's declared handled category is website content.
- Complete the Limited Use certifications as described in the document.

Use the hosted Simplify 4 Me 3.0 `privacy.html` URL as the privacy policy.

## 5. Permission justifications
Copy the explanations from `PERMISSIONS.md` for:
- `storage`
- `contextMenus`
- broad HTTP/HTTPS content-script access

The extension intentionally does not request `tabs`, `history`, `cookies`, `webRequest`, `identity`, `downloads`, or remote API permissions.

## 6. Website
The final artifact includes `Simplify4Me-3.0.0-Website.zip`. Its contents are ready to host at the root of the existing Simplify 4 Me GitHub Pages site. It includes:
- `index.html`
- `privacy.html`
- `support.html`
- `changelog.html`
- local `assets/`

The site uses no external JavaScript or CDN dependency.

## 7. Before Submit for Review
Confirm:
- Version shown in uploaded package: **3.0.0**.
- Store description matches version 3.0 functionality.
- Privacy policy URL is live over HTTPS.
- Support page URL is live.
- Website URL points to the new Simplify 4 Me homepage.
- All five screenshots are current.
- Distribution remains what you intend (for example, Public and the desired countries/regions).
- Privacy answers accurately disclose Website Content and the optional stored hostname preference.

## 8. After submission
Do not delete the previous source/build until version 3.0 has passed review. Keep the final release artifact and SHA-256 checksums for rollback/reference.

## What not to do
- Do not add a remote `<script>` tag to the website and assume it belongs in the extension; extension code must remain packaged.
- Do not change the manifest version without rebuilding and rerunning the release tests.
- Do not claim Simplify 4 Me is generative AI. Version 3.0 uses deterministic local simplification and extractive key-point logic.
- Do not describe Read Aloud as a developer-operated offline speech system. It uses speech synthesis supplied by Chrome/your operating system and voice behavior can vary by device.
