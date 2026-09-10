(() => {
  'use strict';
  const { DEFAULTS, normalizeSettings } = globalThis.S4MDefaults;
  const $ = selector => document.querySelector(selector);
  let settings;

  function flash(message = 'Saved') {
    $('#saved').textContent = message;
    clearTimeout(flash.timer);
    flash.timer = setTimeout(() => { $('#saved').textContent = ''; }, 1500);
  }

  async function save(patch) {
    settings = normalizeSettings({ ...settings, ...patch });
    await chrome.storage.local.set(patch);
    flash();
  }

  function paintStrength() {
    document.querySelectorAll('[data-strength]').forEach(button => button.classList.toggle('active', button.dataset.strength === settings.strength));
  }

  function paintRanges() {
    $('#fontScale').value = settings.readerFontScale;
    $('#fontScaleOut').textContent = `${Math.round(settings.readerFontScale * 100)}%`;
    $('#lineHeight').value = settings.readerLineHeight;
    $('#lineHeightOut').textContent = settings.readerLineHeight.toFixed(2);
    $('#readerWidth').value = settings.readerWidth;
    $('#readerWidthOut').textContent = `${settings.readerWidth}px`;
    $('#ttsRate').value = settings.ttsRate;
    $('#ttsRateOut').textContent = `${settings.ttsRate.toFixed(2)}×`;
  }

  function renderRules() {
    const root = $('#rules');
    root.textContent = '';
    if (!settings.customRules.length) {
      const empty = document.createElement('div');
      empty.className = 'rule';
      empty.textContent = 'No custom rules yet.';
      root.append(empty);
      return;
    }
    settings.customRules.forEach((rule, index) => {
      const row = document.createElement('div');
      row.className = 'rule';
      const from = document.createElement('b'); from.textContent = rule.from;
      const arrow = document.createElement('span'); arrow.textContent = '→';
      const to = document.createElement('span'); to.textContent = rule.to;
      const remove = document.createElement('button');
      remove.type = 'button';
      remove.textContent = 'Remove';
      remove.setAttribute('aria-label', `Remove ${rule.from}`);
      remove.addEventListener('click', async () => {
        const customRules = settings.customRules.filter((_, i) => i !== index);
        await save({ customRules });
        renderRules();
      });
      row.append(from, arrow, to, remove);
      root.append(row);
    });
  }

  async function init() {
    settings = normalizeSettings(await chrome.storage.local.get(null));
    paintStrength();
    paintRanges();
    renderRules();
    $('#readerTheme').value = settings.readerTheme;
    $('#selectionBubble').checked = settings.selectionBubble;
    $('#showStats').checked = settings.showReadingStats;
  }

  document.querySelectorAll('[data-strength]').forEach(button => button.addEventListener('click', async () => {
    await save({ strength: button.dataset.strength });
    paintStrength();
  }));

  $('#readerTheme').addEventListener('change', event => save({ readerTheme: event.target.value }));
  for (const [id, key] of [
    ['fontScale','readerFontScale'], ['lineHeight','readerLineHeight'], ['readerWidth','readerWidth'], ['ttsRate','ttsRate']
  ]) {
    $('#'+id).addEventListener('input', async event => {
      await save({ [key]: Number(event.target.value) });
      paintRanges();
    });
  }
  $('#selectionBubble').addEventListener('change', event => save({ selectionBubble: event.target.checked }));
  $('#showStats').addEventListener('change', event => save({ showReadingStats: event.target.checked }));

  $('#ruleForm').addEventListener('submit', async event => {
    event.preventDefault();
    const from = $('#ruleFrom').value.trim();
    const to = $('#ruleTo').value.trim();
    if (!from || !to) return;
    const customRules = [...settings.customRules.filter(rule => rule.from.toLowerCase() !== from.toLowerCase()), { from, to }];
    await save({ customRules });
    event.target.reset();
    renderRules();
  });

  $('#exportBtn').addEventListener('click', () => {
    const blob = new Blob([JSON.stringify(settings, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'simplify4me-settings.json';
    anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 500);
  });

  $('#importInput').addEventListener('change', async event => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const parsed = JSON.parse(await file.text());
      const next = normalizeSettings(parsed);
      await chrome.storage.local.set(next);
      settings = next;
      paintStrength();
      paintRanges();
      renderRules();
      $('#readerTheme').value = settings.readerTheme;
      $('#selectionBubble').checked = settings.selectionBubble;
      $('#showStats').checked = settings.showReadingStats;
      flash('Imported');
    } catch {
      flash('Invalid settings file');
    }
    event.target.value = '';
  });

  $('#resetBtn').addEventListener('click', async () => {
    if (!confirm('Reset all Simplify 4 Me settings on this device?')) return;
    await chrome.storage.local.clear();
    await chrome.storage.local.set(DEFAULTS);
    settings = normalizeSettings(DEFAULTS);
    paintStrength();
    paintRanges();
    renderRules();
    $('#readerTheme').value = settings.readerTheme;
    $('#selectionBubble').checked = true;
    $('#showStats').checked = true;
    flash('Reset complete');
  });

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== 'local') return;
    const patch = Object.fromEntries(Object.entries(changes).map(([key, value]) => [key, value.newValue]));
    settings = normalizeSettings({ ...settings, ...patch });
  });

  init();
})();
