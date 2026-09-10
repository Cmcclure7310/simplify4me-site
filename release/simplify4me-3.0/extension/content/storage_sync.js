(() => {
  'use strict';
  if (!chrome?.storage?.onChanged) return;
  chrome.storage.onChanged.addListener((_changes, areaName) => {
    if (areaName !== 'local') return;
    try {
      chrome.runtime.sendMessage({ type: 'S4M_NOOP_STORAGE_CHANGED' }).catch(() => {});
    } catch {}
    try {
      window.postMessage({ source: 'simplify4me', type: 'storage-changed' }, location.origin);
    } catch {}
  });
})();
