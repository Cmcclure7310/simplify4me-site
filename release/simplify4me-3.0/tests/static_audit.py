from pathlib import Path
from PIL import Image
import json, re, sys, zipfile

ROOT = Path(__file__).resolve().parents[1]
EXT = ROOT / 'extension'
DIST = ROOT / 'dist'
ASSETS = DIST / 'store-assets'
errors = []
checks = []

def check(condition, message):
    if condition:
        checks.append(message)
    else:
        errors.append(message)

manifest_path = EXT / 'manifest.json'
check(manifest_path.exists(), 'manifest.json exists')
manifest = json.loads(manifest_path.read_text(encoding='utf-8'))
check(manifest.get('manifest_version') == 3, 'Manifest V3')
check(manifest.get('version') == '3.0.0', 'Version is 3.0.0')
check(len(manifest.get('name','')) <= 45, 'Manifest name is within 45 characters')
check(len(manifest.get('description','')) <= 132, 'Manifest description is within 132 characters')
check(set(manifest.get('permissions', [])) <= {'storage','contextMenus'}, 'Only approved narrow API permissions are requested')
check('host_permissions' not in manifest, 'No redundant host_permissions block')
content_scripts = manifest.get('content_scripts',[{}])[0]
check(content_scripts.get('matches') == ['http://*/*','https://*/*'], 'Content script scope is ordinary HTTP/HTTPS pages')

required = [
    'service_worker.js','popup/popup.html','popup/popup.css','popup/popup.js',
    'options/options.html','options/options.css','options/options.js',
    'onboarding/onboarding.html','onboarding/onboarding.css','onboarding/onboarding.js',
    'content/content.js','content/content.css','shared/defaults.js','shared/simplify_engine.js','shared/simplify_enhancements.js',
    'icons/icon16.png','icons/icon32.png','icons/icon48.png','icons/icon128.png'
]
for rel in required:
    check((EXT / rel).is_file(), f'Packaged file exists: {rel}')

for rel in content_scripts.get('js', []):
    check((EXT / rel).is_file(), f'Manifest content-script JavaScript exists: {rel}')
for rel in content_scripts.get('css', []):
    check((EXT / rel).is_file(), f'Manifest content-script stylesheet exists: {rel}')

# Security/static dependency audit of extension code only.
text_files = list(EXT.rglob('*.js')) + list(EXT.rglob('*.html')) + list(EXT.rglob('*.css'))
remote_script = re.compile(r'<script[^>]+src=["\']https?://', re.I)
remote_css = re.compile(r'<link[^>]+href=["\']https?://', re.I)
network_api = re.compile(r'\b(fetch|XMLHttpRequest|WebSocket|EventSource)\s*\(', re.I)
dangerous_exec = re.compile(r'\beval\s*\(|\bnew\s+Function\s*\(|\bimportScripts\s*\(\s*["\']https?://', re.I)
inline_script = re.compile(r'<script(?![^>]*\bsrc=)[^>]*>\s*[^<\s]', re.I|re.S)
inline_event = re.compile(r'\son[a-z]+\s*=\s*["\']', re.I)

for file in text_files:
    value = file.read_text(encoding='utf-8')
    rel = file.relative_to(EXT)
    check(not remote_script.search(value), f'No remote script in {rel}')
    check(not remote_css.search(value), f'No remote stylesheet in {rel}')
    if file.suffix == '.js':
        check(not network_api.search(value), f'No direct network API in {rel}')
        check(not dangerous_exec.search(value), f'No dynamic/remote executable code in {rel}')
    if file.suffix == '.html':
        check(not inline_script.search(value), f'No inline executable script in {rel}')
        check(not inline_event.search(value), f'No inline event handlers in {rel}')

# Validate marketing artwork dimensions.
expected_assets = {
    'screenshot-1-simplify.png': (1280,800),
    'screenshot-2-quick-read.png': (1280,800),
    'screenshot-3-popup.png': (1280,800),
    'screenshot-4-focus-lens.png': (1280,800),
    'screenshot-5-private.png': (1280,800),
    'small-promo-440x280.png': (440,280),
    'marquee-1400x560.png': (1400,560),
}
for name, expected in expected_assets.items():
    p = ASSETS / name
    check(p.is_file(), f'Store asset exists: {name}')
    if p.is_file():
        with Image.open(p) as image:
            check(image.size == expected, f'{name} dimensions are {expected[0]}×{expected[1]}')
            check(image.mode in {'RGB','RGBA'}, f'{name} is a standard RGB/RGBA image')

for size in (16,32,48,128):
    p = EXT / 'icons' / f'icon{size}.png'
    if p.is_file():
        with Image.open(p) as image:
            check(image.size == (size,size), f'Extension icon {size}px has exact dimensions')

# Website is entirely static and locally styled/scripted, except intentional navigation links.
WEB = ROOT / 'website'
for name in ('index.html','privacy.html','support.html','changelog.html','assets/site.css','assets/site.js'):
    check((WEB / name).is_file(), f'Website file exists: {name}')
for html in WEB.glob('*.html'):
    value = html.read_text(encoding='utf-8')
    check(not remote_script.search(value), f'Website has no remote JavaScript: {html.name}')
    check(not remote_css.search(value), f'Website has no remote stylesheet: {html.name}')

# Policy copy must exist in the release package.
for name in ('STORE_LISTING.md','PRIVACY_DISCLOSURES.md','PERMISSIONS.md','RELEASE_NOTES.md','UPLOAD_CHECKLIST.md'):
    check((ROOT / 'docs' / name).is_file(), f'Release document exists: {name}')

# ZIP root requirement: when final ZIP exists, manifest must be at archive root.
zip_path = DIST / 'Simplify4Me-3.0.0-Chrome-Web-Store.zip'
if zip_path.exists():
    with zipfile.ZipFile(zip_path) as zf:
        names = zf.namelist()
        check('manifest.json' in names, 'Chrome Web Store ZIP has manifest.json at archive root')
        check(not any(name.startswith('extension/') for name in names), 'Chrome Web Store ZIP has no extra extension/ parent folder')
        check(all(not name.startswith('../') for name in names), 'Chrome Web Store ZIP contains no path traversal')

report = DIST / 'static-audit.txt'
report.parent.mkdir(parents=True, exist_ok=True)
report.write_text('\n'.join(['PASS  ' + c for c in checks] + ['FAIL  ' + e for e in errors]) + '\n', encoding='utf-8')
print(report.read_text(encoding='utf-8'))
if errors:
    print(f'{len(errors)} static audit failure(s).', file=sys.stderr)
    sys.exit(1)
print(f'PASS static_audit.py — {len(checks)} checks passed.')
