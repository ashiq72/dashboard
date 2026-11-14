const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const ts = require("typescript");

function load() {
  const data = new Map();
  const exports = {};
  const code = ts.transpileModule(
    fs.readFileSync("src/lib/session.ts", "utf8"),
    { compilerOptions: { module: ts.ModuleKind.CommonJS } },
  ).outputText;
  vm.runInNewContext(code, {
    exports,
    atob,
    localStorage: {
      getItem: (key) => data.get(key) || null,
      setItem: (key, value) => data.set(key, value),
      removeItem: (key) => data.delete(key),
    },
    window: { dispatchEvent() {} },
    Event,
  });
  return { ...exports, data };
}
function token(claims = {}) {
  return `header.${Buffer.from(JSON.stringify({ tenantId: "store-a", role: "admin", exp: Math.floor(Date.now() / 1000) + 600, ...claims })).toString("base64url")}.signature`;
}
test("dashboard stores the canonical admin tenant from login", () => {
  const session = load();
  session.saveSession(token(), "store-a");
  assert.equal(session.getStoredSession().tenantId, "store-a");
});
test("customer accounts, expired tokens and cross-tenant responses cannot open the admin dashboard", () => {
  const session = load();
  assert.throws(() => session.saveSession(token({ role: "user" }), "store-a"));
  assert.throws(() => session.saveSession(token({ exp: 1 }), "store-a"));
  assert.throws(() => session.saveSession(token(), "store-b"));
  assert.throws(() => session.saveSession("invalid", "store-a"));
  assert.equal(session.data.size, 0);
});
test("stored profile role cannot override the token role on reload", () => {
  const session = load();
  session.data.set(
    "commerce360.session",
    JSON.stringify({
      token: token({ role: "user" }),
      tenantId: "store-a",
      user: { role: "admin", tenantId: "store-a" },
    }),
  );
  assert.equal(session.getStoredSession(), null);
});
