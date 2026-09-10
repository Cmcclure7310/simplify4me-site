'use strict';

const DEFAULTS = {
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

async function migrateAndSeed() {
  const old = await chrome.storage.local.get(null);
  const patch = {};
  for (const [key, value] of Object.entries(DEFAULTS)) {
    if (old[key] === undefined) patch[key] = value;
  }

  if (old.strength === undefined) {
    const legacyLevel = old.simplificationLevel ?? old.level ?? old.mode;
    if (['light', 'clear', 'simple'].includes(legacyLevel)) patch.strength = legacyLevel;
    else if (legacyLevel === 'basic') patch.strength = 'light';
    else if (['medium', 'normal'].includes(legacyLevel)) patch.strength = 'clear';
    else if (['strong', 'easy'].includes(legacyLevel)) patch.strength = 'simple';
  }

  if (old.customRules === undefined) {
    const legacyRules = old.customReplacements ?? old.rules ?? old.replacements;
    if (Array.isArray(legacyRules)) {
      patch.customRules = legacyRules.map(item => {
        if (!item || typeof item !== 'object') return null;
        return {
          from: String(item.from ?? item.original ?? item.word ?? ''),
          to: String(item.to ?? item.replacement ?? item.simple ?? '')
        };
      }).filter(item => item?.from && item?.to);
    } else if (legacyRules && typeof legacyRules === 'object') {
      patch.customRules = Object.entries(legacyRules).map(([from, to]) => ({ from, to: String(to) }));
    }
  }

  if (old.alwaysHelpSites === undefined) {
    const legacySites = old.autoSites ?? old.trustedDomains ?? old.autoDomains ?? old.enabledSites ?? old.autoSimplifySites;
    if (Array.isArray(legacySites)) {
      patch.alwaysHelpSites = legacySites
        .filter(value => typeof value === 'string')
        .map(value => value.replace(/^https?:\/\//, '').split('/')[0]);
    }
  }

  patch.schemaVersion = 3;
  await chrome.storage.local.set(patch);
}

async function rebuildMenus() {
  await chrome.contextMenus.removeAll();
  chrome.contextMenus.create({ id: 's4m-simplify', title: 'Simplify selected text', contexts: ['selection'] });
  chrome.contextMenus.create({ id: 's4m-quickread', title: 'Open Quick Read', contexts: ['page'] });
}

chrome.runtime.onInstalled.addListener(async details => {
  try {
    await migrateAndSeed();
    await rebuildMenus();
    if (details.reason === 'install') {
      await chrome.tabs.create({ url: chrome.runtime.getURL('onboarding/onboarding.html') });
    }
  } catch (error) {
    console.error('Simplify 4 Me install setup failed:', error);
  }
});

chrome.runtime.onStartup.addListener(() => rebuildMenus().catch(console.error));

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (!tab?.id) return;
  if (info.menuItemId === 's4m-simplify') {
    chrome.tabs.sendMessage(tab.id, { type: 'S4M_SIMPLIFY_CONTEXT_SELECTION', text: info.selectionText || '' }).catch(() => {});
  }
  if (info.menuItemId === 's4m-quickread') {
    chrome.tabs.sendMessage(tab.id, { type: 'S4M_QUICK_READ' }).catch(() => {});
  }
});

chrome.commands.onCommand.addListener(async command => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) return;
  const map = {
    'simplify-selection': 'S4M_SIMPLIFY',
    'quick-read': 'S4M_QUICK_READ',
    'focus-mode': 'S4M_TOGGLE_FOCUS'
  };
  if (map[command]) chrome.tabs.sendMessage(tab.id, { type: map[command] }).catch(() => {});
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type !== 'S4M_STORAGE_CHANGED' || !sender.tab?.id) return;
  chrome.tabs.sendMessage(sender.tab.id, { type: 'S4M_SETTINGS_UPDATED' })
    .then(() => sendResponse({ ok: true }))
    .catch(() => sendResponse({ ok: false }));
  return true;
});
