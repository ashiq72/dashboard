const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

function load(file, mocks = {}, globals = {}) {
  const exports = {};
  const code = ts.transpileModule(fs.readFileSync(file, 'utf8').replaceAll('import.meta.env', '({})'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  }).outputText;
  vm.runInNewContext(code, { exports, require: (name) => mocks[name] || require(name), ...globals });
  return exports;
}
test('phone login sends the same canonical number used by tenant provisioning', async () => {
  const requests = [];
  const api = load('src/lib/api.ts', {
    './phone': load('src/lib/phone.ts'),
    './session': { getStoredSession: () => null },
  }, {
    Headers, FormData, AbortController,
    window: { setTimeout, clearTimeout },
    fetch: async (url, options) => {
      requests.push(JSON.parse(options.body));
      return new Response(JSON.stringify({ success: true, data: { accessToken: 'fixture', tenantId: 'test-store' } }), { status: 200 });
    },
  });
  await api.login('+880 1712-345678', 'test-password');
  assert.equal(requests[0].phone, '01712345678');
  await assert.rejects(() => api.login('+441712345678', 'test-password'), /BD phone number/);
  assert.equal(requests.length, 1);
});
