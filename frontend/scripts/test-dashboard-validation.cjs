const fs = require('node:fs');
const ts = require('../node_modules/typescript');
const assert = require('node:assert/strict');
const { test } = require('node:test');
require.extensions['.ts'] = (module, file) => module._compile(ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText, file);
const { validNonNegativeNumber, validDocumentDate, validateServiceEntry } = require('../src/utils/dashboardValidation.ts');

test('amount and odometer reject malformed, negative and non-finite input', () => {
  for (const value of ['', ' ', '-1', 'Infinity', 'NaN', '1e8', '100abc', '1,500']) assert.equal(validNonNegativeNumber(value), false, value);
  for (const value of ['0', '1500', '200.50', ' 42 ']) assert.equal(validNonNegativeNumber(value), true, value);
});
test('dates reject rollover and require the displayed date format', () => {
  for (const value of ['2026-02-29', '2026-04-31', '2026-13-01', '22/09/2026', '', '2026-09-22T00:00:00Z']) assert.equal(validDocumentDate(value), false, value);
  assert.equal(validDocumentDate('2024-02-29'), true);
  assert.equal(validDocumentDate('2026-09-22'), true);
});
test('service date cannot be in the future and next service must advance odometer', () => {
  assert.match(validateServiceEntry('2999-01-01', '100', '20', ''), /future/);
  assert.match(validateServiceEntry('2024-01-01', '100', '20', '100'), /greater/);
  assert.match(validateServiceEntry('2024-01-01', '100', '20', '99'), /greater/);
  assert.equal(validateServiceEntry('2024-01-01', '100', '0', '3100'), null);
  assert.equal(validateServiceEntry('2024-01-01', '100', '20', ''), null);
});
