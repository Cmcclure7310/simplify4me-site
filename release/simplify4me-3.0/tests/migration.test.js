const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');

const ROOT = path.resolve(__dirname, '..');
const workerPath = path.join(ROOT, 'extension', 'service_worker.js');

let store = {};
let opened = [];
let menus = [];
let installedListener;
let startupListener;
let contextClickListener;
let commandListener;
let runtimeMessageListener;

function installChromeStub() {
  global.chrome = {
    storage: {
      local: {
        get: async () => ({ ...store }),
        set: async patch => Object.assign(store, patch),
        clear: async () => { store = {}; }
      }
    },
    runtime: {
      onInstalled: { addListener: fn => { installedListener = fn; } },
      onStartup: { addListener: fn => { startupListener = fn; } },
      onMessage: { addListener: fn => { runtimeMessageListener = fn; } },
      getURL: rel => `chrome-extension://test/${rel}`
    },
    contextMenus: {
      removeAll: async () => { menus = []; },
      create: item => menus.push(item),
      onClicked: { addListener: fn => { contextClickListener = fn; } }
    },
    commands: { onCommand: { addListener: fn => { commandListener = fn; } } },
    tabs: {
      create: async details => { opened.push(details); return { id: opened.length, ...details }; },
      query: async () => [{ id: 99, url: 'https://example.com' }],
      sendMessage: async () => ({ ok: true })
    }
  };
}

installChromeStub();
vm.runInThisContext(fs.readFileSync(workerPath, 'utf8'), { filename: workerPath });

assert.equal(typeof installedListener, 'function', 'Service worker must register onInstalled');
assert.equal(typeof startupListener, 'function', 'Service worker must register onStartup');
assert.equal(typeof contextClickListener, 'function', 'Service worker must register context-menu handler');
assert.equal(typeof commandListener, 'function', 'Service worker must register keyboard-command handler');
assert.equal(typeof runtimeMessageListener, 'function', 'Service worker must register runtime message handler');

(async () => {
  // Fresh install.
  store = {};
  opened = [];
  await installedListener({ reason: 'install' });
  assert.equal(store.schemaVersion, 3, 'Fresh install should seed schema version 3');
  assert.equal(store.strength, 'clear', 'Fresh install should seed Clear mode');
  assert.equal(store.selectionBubble, true, 'Fresh install should enable selection bubble');
  assert.deepEqual(store.customRules, [], 'Fresh install should seed empty custom rules');
  assert.deepEqual(store.alwaysHelpSites, [], 'Fresh install should seed empty site preferences');
  assert.equal(opened.length, 1, 'Fresh install should open onboarding once');
  assert.match(opened[0].url, /onboarding\/onboarding\.html$/, 'Fresh install should open packaged onboarding page');
  assert.equal(menus.length, 2, 'Fresh install should create two context-menu commands');

  // Upgrade from plausible v2 storage: map known legacy values, preserve unknown data, do not re-open onboarding.
  store = {
    mode: 'strong',
    rules: {
      'commence': 'begin',
      'utilize': 'use'
    },
    trustedDomains: ['https://example.com/news', 'reading.test'],
    legacyFeatureFlag: 'preserve-me'
  };
  opened = [];
  await installedListener({ reason: 'update', previousVersion: '2.1.2' });
  assert.equal(store.schemaVersion, 3, 'Upgrade should write schema version 3');
  assert.equal(store.strength, 'simple', 'Legacy strong mode should migrate to Simple');
  assert.ok(Array.isArray(store.customRules) && store.customRules.some(r => r.from === 'commence' && r.to === 'begin'), 'Legacy rules object should migrate');
  assert.ok(store.alwaysHelpSites.includes('example.com'), 'Legacy URL should migrate to hostname only');
  assert.ok(store.alwaysHelpSites.includes('reading.test'), 'Legacy bare hostname should migrate');
  assert.equal(store.legacyFeatureFlag, 'preserve-me', 'Unknown historical storage keys must not be deleted');
  assert.equal(opened.length, 0, 'Update should not re-open first-run onboarding');

  // Existing v3 values win over legacy leftovers.
  store = {
    schemaVersion: 3,
    strength: 'light',
    customRules: [{ from: 'one', to: 'two' }],
    alwaysHelpSites: ['kept.example'],
    mode: 'strong',
    rules: { three: 'four' }
  };
  await installedListener({ reason: 'update', previousVersion: '2.9.9' });
  assert.equal(store.strength, 'light', 'Current v3 strength should not be overwritten by legacy mode');
  assert.deepEqual(store.customRules, [{ from: 'one', to: 'two' }], 'Current custom rules should not be overwritten');
  assert.deepEqual(store.alwaysHelpSites, ['kept.example'], 'Current site preference should not be overwritten');

  console.log('PASS migration.test.js — fresh install defaults, onboarding, context menus, legacy upgrade mapping, preservation, and current-setting precedence validated.');
})().catch(error => {
  console.error(error);
  process.exit(1);
});
