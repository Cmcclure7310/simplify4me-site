(() => {
  'use strict';
  const engine = globalThis.S4MEngine;
  if (!engine || engine.__enhancedV3) return;

  const baseSimplify = engine.simplifyText.bind(engine);
  const baseHardWords = engine.getHardWords.bind(engine);

  const clearWordRules = [
    ['personnel', 'staff'],
    ['documentation', 'documents'],
    ['individuals', 'people'],
    ['individual', 'person'],
    ['require', 'need'],
    ['clarification', 'explanation']
  ];

  const hardWordExtras = {
    personnel: ['staff', 'the people or staff involved'],
    documentation: ['documents', 'written records or documents'],
    clarification: ['explanation', 'something that makes the meaning clearer'],
    implementation: ['putting in place', 'the act of putting a plan or process into use']
  };

  function escapeRegExp(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  function preserveCase(source, replacement) {
    if (!replacement) return '';
    if (source.toUpperCase() === source && /[A-Z]/.test(source)) return replacement.toUpperCase();
    if (source[0] === source[0]?.toUpperCase()) return replacement[0].toUpperCase() + replacement.slice(1);
    return replacement;
  }

  function wordReplace(text, from, to) {
    return text.replace(new RegExp(`\\b${escapeRegExp(from)}\\b`, 'gi'), match => preserveCase(match, to));
  }

  function simplifyText(input, strength = 'clear', customRules = []) {
    let value = baseSimplify(input, strength, customRules);
    if (!value || strength === 'light') return value;

    value = value
      .replace(/\bbefore the implementation of\b/gi, match => preserveCase(match, 'before starting'))
      .replace(/\bhelp to ([A-Za-z])/g, 'help $1');

    for (const [from, to] of clearWordRules) value = wordReplace(value, from, to);

    if (strength === 'simple') {
      value = value
        .replace(/\bthe process of\b/gi, 'the process of')
        .replace(/\badditional\b/gi, 'more')
        .replace(/\bapproximately\b/gi, 'about');
    }
    return value.replace(/\s{2,}/g, ' ').replace(/\s+([,.;:!?])/g, '$1').trim();
  }

  function getHardWords(text, limit = 12) {
    const existing = baseHardWords(text, Math.max(limit, 12));
    const seen = new Set(existing.map(item => item.word));
    const words = String(text || '').toLowerCase().match(/[a-z][a-z'-]*/g) || [];
    for (const word of words) {
      if (seen.has(word) || !hardWordExtras[word]) continue;
      const [simpler, meaning] = hardWordExtras[word];
      existing.push({ word, simpler, meaning });
      seen.add(word);
      if (existing.length >= limit) break;
    }
    return existing.slice(0, limit);
  }

  globalThis.S4MEngine = Object.freeze({
    ...engine,
    simplifyText,
    getHardWords,
    __enhancedV3: true
  });
})();
