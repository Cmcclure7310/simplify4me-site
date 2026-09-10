(() => {
  'use strict';
  const sample = document.querySelector('#sample');
  const bubble = document.querySelector('#demoBubble');
  const result = document.querySelector('#demoResult');
  const simpleText = document.querySelector('#simpleText');
  const wordStat = document.querySelector('#wordStat');

  function selectedSampleText() {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed || !selection.rangeCount) return '';
    const range = selection.getRangeAt(0);
    if (!sample.contains(range.commonAncestorContainer) && range.commonAncestorContainer !== sample) return '';
    return selection.toString().replace(/\s+/g, ' ').trim();
  }

  function showBubble() {
    const text = selectedSampleText();
    if (!text) { bubble.style.display = 'none'; return; }
    const rect = window.getSelection().getRangeAt(0).getBoundingClientRect();
    const parent = sample.closest('.browser').getBoundingClientRect();
    bubble.style.display = 'block';
    bubble.style.left = `${Math.max(18, Math.min(parent.width - 125, rect.left - parent.left + rect.width / 2 - 55))}px`;
    bubble.style.top = `${Math.max(80, rect.bottom - parent.top + 7)}px`;
  }

  document.addEventListener('mouseup', () => setTimeout(showBubble, 0));
  document.addEventListener('keyup', () => setTimeout(showBubble, 0));
  bubble.addEventListener('mousedown', event => event.preventDefault());
  bubble.addEventListener('click', () => {
    const text = selectedSampleText() || sample.textContent;
    const simplified = globalThis.S4MEngine.simplifyText(text, 'clear');
    simpleText.textContent = simplified;
    const stats = globalThis.S4MEngine.readingStats(text);
    const newStats = globalThis.S4MEngine.readingStats(simplified);
    wordStat.textContent = `${stats.words} words • about ${Math.max(0, stats.estimatedGrade - newStats.estimatedGrade).toFixed(1)} grade levels easier`;
    result.hidden = false;
    bubble.style.display = 'none';
  });
  document.querySelector('#resetDemo').addEventListener('click', () => { result.hidden = true; window.getSelection()?.removeAllRanges(); });
  document.querySelector('#settingsBtn').addEventListener('click', () => chrome.runtime.openOptionsPage());
  document.querySelector('#closeBtn').addEventListener('click', () => window.close());
})();
