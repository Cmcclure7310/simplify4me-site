const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');

const ROOT = path.resolve(__dirname, '..');
for (const name of ['simplify_engine.js', 'simplify_enhancements.js']) {
  const file = path.join(ROOT, 'extension', 'shared', name);
  vm.runInThisContext(fs.readFileSync(file, 'utf8'), { filename: file });
}

const E = globalThis.S4MEngine;
assert(E, 'S4MEngine must be exported to globalThis');
assert.equal(E.__enhancedV3, true, 'Version 3 enhancements must be loaded');

function equal(actual, expected, message) {
  assert.strictEqual(actual, expected, message);
}
function includes(actual, needle, message) {
  assert(actual.includes(needle), `${message}\nExpected to include: ${needle}\nActual: ${actual}`);
}
function notIncludes(actual, needle, message) {
  assert(!actual.includes(needle), `${message}\nDid not expect: ${needle}\nActual: ${actual}`);
}

// Phrase simplification.
equal(E.simplifyText('Prior to launch, utilize the checklist.', 'clear'), 'Before launch, use the checklist.', 'Common formal wording should simplify');

// Strength gating.
equal(E.simplifyText('The result is viable.', 'light'), 'The result is viable.', 'Light mode should preserve level-2 words');
equal(E.simplifyText('The result is viable.', 'clear'), 'The result is workable.', 'Clear mode should simplify level-2 words');

// Capitalization preservation.
equal(E.simplifyText('UTILIZE this now.', 'clear'), 'USE this now.', 'All-caps source should keep all-caps replacement');
equal(E.simplifyText('Utilize this now.', 'clear'), 'Use this now.', 'Title-case source should keep title case');

// Version 3 grammar/vocabulary enhancement.
const demo = E.simplifyText('Prior to the implementation of the revised procedure, personnel are required to ascertain whether the documentation is sufficient and subsequently provide assistance to individuals who require clarification.', 'clear');
includes(demo, 'Before starting the revised procedure', 'Version 3 should simplify implementation phrasing cleanly');
includes(demo, 'staff must find out', 'Version 3 should simplify personnel/required/ascertain');
includes(demo, 'documents', 'Version 3 should simplify documentation');
includes(demo, 'help people', 'Version 3 should avoid the ungrammatical phrase help to people');
includes(demo, 'need explanation', 'Version 3 should simplify require clarification');

// Custom rule priority and phrase sorting.
equal(E.simplifyText('The Department of Extremely Complex Things will commence.', 'clear', [
  { from: 'Department of Extremely Complex Things', to: 'Special Team' },
  { from: 'commence', to: 'kick off' }
]), 'The Special Team will kick off.', 'Custom rules should run before built-in replacements');

// URLs and emails are protected from token rewriting.
const protectedText = 'Visit https://example.com/utilize and email utilize@example.com before you utilize the tool.';
const protectedResult = E.simplifyText(protectedText, 'clear');
includes(protectedResult, 'https://example.com/utilize', 'URL text must remain unchanged');
includes(protectedResult, 'utilize@example.com', 'Email text must remain unchanged');
includes(protectedResult, 'use the tool', 'Normal surrounding text should still simplify');

// Empty/no-op behavior.
equal(E.simplifyText('', 'clear'), '', 'Empty input should remain empty');
equal(E.simplifyText('Plain short text.', 'clear'), 'Plain short text.', 'Already-clear text should remain stable');

// Strong mode can simplify punctuation boundaries conservatively.
const strong = E.simplifyText('The process is viable; subsequently, proceed.', 'simple');
includes(strong, 'workable', 'Simple mode should simplify viable');
notIncludes(strong, ';', 'Simple mode may split a semicolon into a sentence boundary');

// Hard-word definitions are local and deterministic.
const hard = E.getHardWords('Personnel received comprehensive documentation to mitigate a detrimental outcome.', 10);
assert(hard.some(item => item.word === 'comprehensive' && item.simpler === 'complete'), 'Hard Words should identify comprehensive');
assert(hard.some(item => item.word === 'mitigate' && item.simpler === 'reduce'), 'Hard Words should identify mitigate');
assert(hard.some(item => item.word === 'personnel' && item.simpler === 'staff'), 'Hard Words should include version 3 vocabulary');

// Key points are extractive: every returned point must be a source sentence.
const source = 'The first rule is important because it protects users. The office opens at nine each morning. Staff must verify all required documents before approval. Decorative plants were moved last week. Finally, the team should report any major risk immediately.';
const sourceSentences = new Set(E.splitSentences(source));
const points = E.extractKeyPoints(source, 3);
assert(points.length > 0 && points.length <= 3, 'Key Points should respect requested maximum');
for (const point of points) assert(sourceSentences.has(point), 'Key Points must never invent a sentence');

// Reading statistics are finite and bounded.
for (const sample of ['', 'Hello.', source, 'One two three four five six seven.']) {
  const stats = E.readingStats(sample);
  assert(Number.isFinite(stats.words) && stats.words >= 1, 'Word count must be finite');
  assert(Number.isFinite(stats.sentences) && stats.sentences >= 1, 'Sentence count must be finite');
  assert(Number.isFinite(stats.estimatedGrade) && stats.estimatedGrade >= 0 && stats.estimatedGrade <= 18, 'Estimated grade must be bounded');
  assert(Number.isInteger(stats.minutes) && stats.minutes >= 1, 'Reading time must be a positive integer');
}

// Input values must not be mutated.
const rules = [{ from: 'utilize', to: 'use' }];
const before = JSON.stringify(rules);
E.simplifyText('Utilize this.', 'clear', rules);
equal(JSON.stringify(rules), before, 'Engine must not mutate caller custom rules');

console.log('PASS engine.test.js — deterministic simplification, v3 grammar enhancements, privacy protection, key-points extraction, hard words, and reading stats validated.');
