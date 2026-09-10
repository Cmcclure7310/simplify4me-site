(() => {
  'use strict';

  const { normalizeSettings } = globalThis.S4MDefaults;
  const hints = {
    light: 'Small wording changes while keeping the original style.',
    clear: 'Plain everyday language without over-changing the original.',
    simple: 'Stronger changes, shorter wording, and easier vocabulary.'
  };

  let settings;
  let tabId;
  const $ = selector => document.querySelector(selector);

  async function getActiveTab() {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    return tab;
  }

  async function send(type, extra = {}) {
    if (!tabId) throw new Error('No active tab');
    return chrome.tabs.sendMessage(tabId, { type, ...extra });
  }

  function setSwitch(node, enabled) {
    node.setAttribute('aria-checked', String(Boolean(enabled)));
  }

  function paintStrength() {
    document.querySelectorAll('[data-strength]').forEach(button => {
      button.classList.toggle('active', button.dataset.strength === settings.strength);
    });
    $('#strengthLabel').textContent = settings.strength[0].toUpperCase() + settings.strength.slice(1);
    $('#strengthHint').textContent = hints[settings.strength];
  }

  function setStatus(text, error = false) {
    const node = $('#pageStatus');
    node.classList.toggle('error', error);
    node.lastElementChild.textContent = text;
  }

  async function init() {
    settings = normalizeSettings(await chrome.storage.local.get(null));
    paintStrength();
    const tab = await getActiveTab();
    tabId = tab?.id || null;

    if (!tabId || !/^https?:/i.test(tab?.url || '')) {
      setStatus('Open a normal webpage to use reading tools', true);
      document.querySelectorAll('[data-action], #lensToggle, #siteToggle').forEach(button => {
        button.disabled = true;
      });
      return;
    }

    try {
      const page = await send('S4M_GET_STATUS');
      setStatus(`Ready on ${page.hostname}`);
      setSwitch($('#lensToggle'), page.lensEnabled);
      setSwitch($('#siteToggle'), page.alwaysHelp);
      $('#siteLabel').textContent = page.alwaysHelp ? 'Complexity Lens turns on here' : 'Remember this website';
      $('#focusState').textContent = page.focusEnabled ? 'On' : 'Off';
      $('#focusState').classList.toggle('on', page.focusEnabled);
    } catch {
      setStatus('Refresh this page once after updating', true);
    }
  }

  document.querySelectorAll('[data-strength]').forEach(button => {
    button.addEventListener('click', async () => {
      settings.strength = button.dataset.strength;
      await chrome.storage.local.set({ strength: settings.strength });
      paintStrength();
      try { await send('S4M_SET_STRENGTH', { strength: settings.strength }); } catch {}
    });
  });

  document.querySelector('[data-action="simplify"]').addEventListener('click', () => send('S4M_SIMPLIFY').catch(() => {}));
  document.querySelector('[data-action="quick"]').addEventListener('click', () => send('S4M_QUICK_READ').catch(() => {}));
  document.querySelector('[data-action="listen"]').addEventListener('click', () => send('S4M_LISTEN').catch(() => {}));

  document.querySelector('[data-action="focus"]').addEventListener('click', async () => {
    try {
      const result = await send('S4M_TOGGLE_FOCUS');
      $('#focusState').textContent = result.enabled ? 'On' : 'Off';
      $('#focusState').classList.toggle('on', result.enabled);
    } catch {}
  });

  $('#lensToggle').addEventListener('click', async () => {
    try {
      const result = await send('S4M_TOGGLE_LENS');
      setSwitch($('#lensToggle'), result.enabled);
    } catch {}
  });

  $('#siteToggle').addEventListener('click', async () => {
    const enabled = $('#siteToggle').getAttribute('aria-checked') !== 'true';
    setSwitch($('#siteToggle'), enabled);
    $('#siteLabel').textContent = enabled ? 'Complexity Lens turns on here' : 'Remember this website';
    try { await send('S4M_SET_ALWAYS_HELP', { enabled }); } catch {}
  });

  $('#settingsBtn').addEventListener('click', () => chrome.runtime.openOptionsPage());
  $('#helpBtn').addEventListener('click', () => chrome.tabs.create({ url: chrome.runtime.getURL('onboarding/onboarding.html') }));

  init().catch(() => setStatus('Could not connect to this page', true));
})();
