(() => {
  'use strict';
  if (!chrome?.storage?.onChanged) return;
  chrome.storage.onChanged.addListener((_changes, areaName) => {
    if (areaName !== 'local') return;
    try { chrome.runtime.sendMessage({ type: 'S4M_STORAGE_CHANGED' }).catch(() => {}); } catch {}
  });
})();
