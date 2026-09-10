import { chromium } from 'playwright';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..');
const EXT = path.join(ROOT, 'extension');

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });

try {
  await page.addInitScript(() => {
    window.__S4M_TEST__ = true;
    const store = {
      schemaVersion: 3,
      strength: 'clear',
      readerTheme: 'midnight',
      readerFontScale: 1,
      readerLineHeight: 1.75,
      readerWidth: 760,
      focusEnabled: false,
      lensEnabled: false,
      selectionBubble: true,
      alwaysHelpSites: [],
      alwaysHelpBehavior: 'lens',
      customRules: [],
      ttsRate: 1,
      ttsPitch: 1,
      showReadingStats: true
    };
    window.__s4mStore = store;
    window.chrome = {
      storage: {
        local: {
          get: async () => ({ ...store }),
          set: async patch => Object.assign(store, patch),
          clear: async () => { for (const key of Object.keys(store)) delete store[key]; }
        }
      },
      runtime: {
        onMessage: { addListener: fn => { window.__s4mRuntimeListener = fn; } },
        sendMessage: async () => ({ ok: true }),
        getURL: value => value
      }
    };
  });

  const testHtml = `<!doctype html><html lang="en"><head><style>
    body{font-family:Arial,sans-serif;margin:60px;max-width:900px;line-height:1.65}
    article{display:block} p{font-size:18px;margin:0 0 24px}
  </style></head><body>
    <article>
      <h1>Reading test article</h1>
      <p id="target">Prior to the implementation of the revised procedure, personnel are required to ascertain whether the documentation is sufficient and subsequently provide assistance to people who require clarification.</p>
      <p>The organization will subsequently evaluate the information. It is important to note that staff must verify every required document before approval because incomplete information may cause a delay.</p>
      <p>A final paragraph provides additional information so Quick Read has enough readable article content to construct a calm reading view without relying on the original page layout or executable page markup.</p>
      <pre id="unsafe">Prior to this code sample, utilize the value carefully.</pre>
    </article>
  </body></html>`;
  await page.goto('data:text/html;charset=utf-8,' + encodeURIComponent(testHtml));

  await page.addScriptTag({ path: path.join(EXT, 'shared', 'defaults.js') });
  await page.addScriptTag({ path: path.join(EXT, 'shared', 'simplify_engine.js') });
  await page.addScriptTag({ path: path.join(EXT, 'shared', 'simplify_enhancements.js') });
  await page.addScriptTag({ path: path.join(EXT, 'content', 'content.js') });
  await page.waitForTimeout(50);

  const shadowExists = await page.evaluate(() => Boolean(document.querySelector('#s4m-root-host')?.shadowRoot));
  assert.equal(shadowExists, true, 'Test build must expose an open ShadowRoot');

  // Highlight a normal paragraph and verify the selection bubble appears.
  await page.evaluate(() => {
    const node = document.querySelector('#target').firstChild;
    const range = document.createRange();
    range.setStart(node, 0);
    range.setEnd(node, node.nodeValue.length);
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
    document.querySelector('#target').dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
  });
  await page.waitForTimeout(80);
  const bubbleVisible = await page.evaluate(() => getComputedStyle(document.querySelector('#s4m-root-host').shadowRoot.querySelector('.bubble')).display !== 'none');
  assert.equal(bubbleVisible, true, 'Selection bubble should appear on readable text');

  // Open result and confirm real core code simplifies the selection.
  await page.evaluate(() => document.querySelector('#s4m-root-host').shadowRoot.querySelector('.bubble').click());
  await page.waitForTimeout(40);
  const resultText = await page.evaluate(() => document.querySelector('#s4m-root-host').shadowRoot.querySelector('.result')?.textContent || '');
  assert.match(resultText, /Before starting the revised procedure/i, 'Result should simplify formal phrase wording');
  assert.match(resultText, /staff must find out/i, 'Result should simplify personnel/required/ascertain wording');
  assert.match(resultText, /help people/i, 'Result should preserve natural grammar after phrase simplification');

  // Key Points tab must render extractive bullets.
  await page.evaluate(() => {
    const tabs = [...document.querySelector('#s4m-root-host').shadowRoot.querySelectorAll('.tab')];
    tabs.find(button => button.textContent === 'Key Points').click();
  });
  const keyPointCount = await page.evaluate(() => document.querySelector('#s4m-root-host').shadowRoot.querySelectorAll('.points li').length);
  assert.ok(keyPointCount >= 1, 'Key Points should render at least one source sentence');

  // Hard Words should identify locally known difficult words.
  await page.evaluate(() => {
    const tabs = [...document.querySelector('#s4m-root-host').shadowRoot.querySelectorAll('.tab')];
    tabs.find(button => button.textContent === 'Hard Words').click();
  });
  const hardWords = await page.evaluate(() => document.querySelector('#s4m-root-host').shadowRoot.querySelector('.words')?.innerText || '');
  assert.match(hardWords, /ascertain/i, 'Hard Words should identify ascertain');
  assert.match(hardWords, /personnel/i, 'Hard Words should include version 3 vocabulary');

  // Re-open Simpler, safely replace a same-text-node selection, then undo.
  await page.evaluate(() => {
    const tabs = [...document.querySelector('#s4m-root-host').shadowRoot.querySelectorAll('.tab')];
    tabs.find(button => button.textContent === 'Simpler').click();
    const replace = [...document.querySelector('#s4m-root-host').shadowRoot.querySelectorAll('.btn')].find(button => button.textContent === 'Replace');
    if (!replace || replace.disabled) throw new Error('Replace unexpectedly unavailable');
    replace.click();
  });
  await page.waitForTimeout(30);
  const replaced = await page.locator('#target').textContent();
  assert.match(replaced, /^Before starting the revised procedure/i, 'Replace should modify only the selected text node');
  await page.evaluate(() => document.querySelector('#s4m-root-host').shadowRoot.querySelector('.toast').click());
  await page.waitForTimeout(20);
  const undone = await page.locator('#target').textContent();
  assert.match(undone, /^Prior to the implementation/i, 'Undo should restore the exact original text');

  // Unsafe code/pre text must not trigger a selection bubble.
  await page.evaluate(() => {
    const root = document.querySelector('#s4m-root-host').shadowRoot;
    root.querySelector('.bubble').style.display = 'none';
    root.querySelector('.card').classList.remove('open');
    const node = document.querySelector('#unsafe').firstChild;
    const range = document.createRange();
    range.selectNodeContents(node);
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
    document.querySelector('#unsafe').dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
  });
  await page.waitForTimeout(80);
  const unsafeBubble = await page.evaluate(() => getComputedStyle(document.querySelector('#s4m-root-host').shadowRoot.querySelector('.bubble')).display !== 'none');
  assert.equal(unsafeBubble, false, 'Selection bubble must stay off inside pre/code areas');

  // Runtime route: Quick Read must build a text-only reader from the article.
  await page.evaluate(() => {
    window.__s4mRuntimeListener({ type: 'S4M_QUICK_READ' }, {}, () => {});
  });
  await page.waitForTimeout(50);
  const readerData = await page.evaluate(() => {
    const root = document.querySelector('#s4m-root-host').shadowRoot;
    const reader = root.querySelector('.reader');
    return {
      exists: Boolean(reader),
      title: reader?.querySelector('h1')?.textContent || '',
      paragraphs: reader?.querySelectorAll('.article p').length || 0,
      scripts: reader?.querySelectorAll('script').length || 0,
      images: reader?.querySelectorAll('img').length || 0
    };
  });
  assert.equal(readerData.exists, true, 'Quick Read should open for article content');
  assert.match(readerData.title, /Reading test article/i, 'Quick Read should preserve article title as text');
  assert.ok(readerData.paragraphs >= 3, 'Quick Read should contain readable text blocks');
  assert.equal(readerData.scripts, 0, 'Quick Read must not reproduce executable source markup');
  assert.equal(readerData.images, 0, 'Quick Read 3.0 should remain text-first and not import remote images');

  // Quick Read simplification view should use the same engine.
  await page.evaluate(() => {
    const root = document.querySelector('#s4m-root-host').shadowRoot;
    [...root.querySelectorAll('.readerctrl')].find(button => button.textContent === 'Simpler').click();
  });
  const readerText = await page.evaluate(() => document.querySelector('#s4m-root-host').shadowRoot.querySelector('.article').innerText);
  assert.match(readerText, /Before starting the revised procedure/i, 'Quick Read simpler view should apply local simplification');

  // Close reader and verify Focus Mode route.
  await page.evaluate(() => {
    const root = document.querySelector('#s4m-root-host').shadowRoot;
    [...root.querySelectorAll('.readerctrl')].find(button => button.textContent === 'Close').click();
    window.__s4mRuntimeListener({ type: 'S4M_TOGGLE_FOCUS' }, {}, () => {});
  });
  const focusOn = await page.evaluate(() => document.querySelector('#s4m-root-host').shadowRoot.querySelector('.focus-ring').classList.contains('on'));
  assert.equal(focusOn, true, 'Focus Mode should activate through the runtime route');

  // Confirm source page never received result markup outside the isolated host.
  const leakedCards = await page.evaluate(() => document.querySelectorAll('body > .card, article > .card, .s4m-card').length);
  assert.equal(leakedCards, 0, 'Extension UI should remain isolated inside its Shadow DOM host');

  console.log('PASS browser.test.mjs — selection bubble, result views, safe replace/undo, unsafe-element guard, Quick Read, and Focus Mode validated in Chromium.');
} finally {
  await browser.close();
}
