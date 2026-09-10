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
    try {
      const tabs = await chrome.tabs.query({});
      for (const tab of tabs) {
        if (tab.id && /^https?:/i.test(tab.url || '')) chrome.tabs.sendMessage(tab.id, { type: 'S4M_SETTINGS_UPDATED' }).catch(() => {});
      }
    } catch {}
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
      const remove = document.createElement('button'); remove.type = 'button'; remove.textContent = 'Remove'; remove.setAttribute('aria-label', `Remove ${rule.from}`);
      remove.addEventListener('click', async () => {
        const customRules = settings.customRules.filter((_, i) => i !== index);
        await save({ customRules }); renderRules();
      });
      row.append(from, arrow, to, remove); root.append(row);
    });
  }

  async function init() {
    settings = normalizeSettings(await chrome.storage.local.get(null));
    paintStrength(); paintRanges(); renderRules();
    $('#readerTheme').value = settings.readerTheme;
    $('#selectionBubble').checked = settings.selectionBubble;
    $('#showStats').checked = settings.showReadingStats;
  }

  document.querySelectorAll('[data-strength]').forEach(button => button.addEventListener('click', async () => { await save({ strength: button.dataset.strength }); paintStrength(); }));
  $('#readerTheme').addEventListener('change', e => save({ readerTheme: e.target.value }));
  for (const [id, key, convert] of [
    ['fontScale','readerFontScale',Number], ['lineHeight','readerLineHeight',Number], ['readerWidth','readerWidth',Number], ['ttsRate','ttsRate',Number]
  ]) $('#'+id).addEventListener('input', async e => { await save({ [key]: convert(e.target.value) }); paintRanges(); });
  $('#selectionBubble').addEventListener('change', e => save({ selectionBubble: e.target.checked }));
  $('#showStats').addEventListener('change', e => save({ showReadingStats: e.target.checked }));

  $('#ruleForm').addEventListener('submit', async e => {
    e.preventDefault();
    const from = $('#ruleFrom').value.trim(), to = $('#ruleTo').value.trim();
    if (!from || !to) return;
    const customRules = [...settings.customRules.filter(r => r.from.toLowerCase() !== from.toLowerCase()), { from, to }];
    await save({ customRules });
    e.target.reset(); renderRules();
  });

  $('#exportBtn').addEventListener('click', () => {
    const blob = new Blob([JSON.stringify(settings, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob), a = document.createElement('a');
    a.href = url; a.download = 'simplify4me-settings.json'; a.click(); setTimeout(() => URL.revokeObjectURL(url), 500);
  });

  $('#importInput').addEventListener('change', async e => {
    const file = e.target.files?.[0]; if (!file) return;
    try {
      const parsed = JSON.parse(await file.text()), next = normalizeSettings(parsed);
      await chrome.storage.local.set(next); settings = next; paintStrength(); paintRanges(); renderRules();
      $('#readerTheme').value = settings.readerTheme; $('#selectionBubble').checked = settings.selectionBubble; $('#showStats').checked = settings.showReadingStats; flash('Imported');
    } catch { flash('Invalid settings file'); }
    e.target.value = '';
  });

  $('#resetBtn').addEventListener('click', async () => {
    if (!confirm('Reset all Simplify 4 Me settings on this device?')) return;
    await chrome.storage.local.clear(); await chrome.storage.local.set(DEFAULTS); settings = normalizeSettings(DEFAULTS); paintStrength(); paintRanges(); renderRules(); $('#readerTheme').value = settings.readerTheme; $('#selectionBubble').checked = true; $('#showStats').checked = true; flash('Reset complete');
  });

  init();
})();
