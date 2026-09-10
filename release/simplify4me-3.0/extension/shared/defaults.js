(() => {
  'use strict';
  const DEFAULTS = Object.freeze({
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
  });
  function normalizeSettings(input = {}) {
    const merged = { ...DEFAULTS, ...input };
    if (!['light','clear','simple'].includes(merged.strength)) merged.strength = 'clear';
    if (!['light','warm','midnight'].includes(merged.readerTheme)) merged.readerTheme = 'midnight';
    merged.readerFontScale = Math.min(1.5, Math.max(.85, Number(merged.readerFontScale) || 1));
    merged.readerLineHeight = Math.min(2.2, Math.max(1.35, Number(merged.readerLineHeight) || 1.75));
    merged.readerWidth = Math.min(980, Math.max(560, Number(merged.readerWidth) || 760));
    merged.ttsRate = Math.min(1.8, Math.max(.65, Number(merged.ttsRate) || 1));
    merged.ttsPitch = Math.min(1.5, Math.max(.5, Number(merged.ttsPitch) || 1));
    merged.alwaysHelpSites = Array.isArray(merged.alwaysHelpSites) ? [...new Set(merged.alwaysHelpSites.filter(v => typeof v === 'string' && v.length < 255))].slice(0,500) : [];
    merged.customRules = Array.isArray(merged.customRules) ? merged.customRules.filter(r => r && typeof r.from === 'string' && typeof r.to === 'string').map(r => ({from:r.from.trim().slice(0,120),to:r.to.trim().slice(0,120)})).filter(r => r.from && r.to).slice(0,500) : [];
    return merged;
  }
  globalThis.S4MDefaults = { DEFAULTS, normalizeSettings };
})();
