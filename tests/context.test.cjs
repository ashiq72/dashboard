const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const ts = require("typescript");
const React = require("react");
const { renderToStaticMarkup } = require("react-dom/server");

function moduleFromSource(file, mocks = {}) {
  const exports = {};
  const code = ts.transpileModule(fs.readFileSync(file, "utf8"), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      jsx: ts.JsxEmit.ReactJSX,
    },
  }).outputText;
  vm.runInNewContext(code, {
    exports,
    require: (name) => mocks[name] || require(name),
  });
  return exports;
}

test("provider refresh preserves the context used by existing auth consumers", () => {
  const context = moduleFromSource("src/app/auth-context.ts");
  const mocks = {
    "./auth-context": context,
    "../lib/session": { getStoredSession: () => null, clearSession() {} },
  };
  const first = moduleFromSource("src/app/auth.tsx", mocks);
  const refreshed = moduleFromSource("src/app/auth.tsx", mocks);
  function Consumer() {
    const { session } = context.useAuth();
    return React.createElement(
      "span",
      null,
      session ? "signed in" : "signed out",
    );
  }
  for (const provider of [first.AuthProvider, refreshed.AuthProvider]) {
    assert.equal(
      renderToStaticMarkup(
        React.createElement(provider, null, React.createElement(Consumer)),
      ),
      "<span>signed out</span>",
    );
  }
});

test("tenant provider shares the same auth context and survives its own refresh", () => {
  const auth = moduleFromSource("src/app/auth-context.ts");
  const tenant = moduleFromSource("src/app/tenant-context.ts");
  const { AuthProvider } = moduleFromSource("src/app/auth.tsx", {
    "./auth-context": auth,
    "../lib/session": { getStoredSession: () => null, clearSession() {} },
  });
  const mocks = {
    "./auth-context": auth,
    "./tenant-context": tenant,
    "../lib/api": { ecommerceApi: {} },
    "../shared/utils": { getErrorMessage: () => "error" },
  };
  function Consumer() {
    return React.createElement(
      "span",
      null,
      tenant.useTenant().tenant ? "store" : "no store",
    );
  }
  for (let refresh = 0; refresh < 2; refresh++) {
    const { TenantProvider } = moduleFromSource("src/app/tenant.tsx", mocks);
    assert.equal(
      renderToStaticMarkup(
        React.createElement(
          AuthProvider,
          null,
          React.createElement(
            TenantProvider,
            null,
            React.createElement(Consumer),
          ),
        ),
      ),
      "<span>no store</span>",
    );
  }
});

test("using an auth consumer without its provider still reports a wiring error", () => {
  const context = moduleFromSource("src/app/auth-context.ts");
  function Consumer() {
    context.useAuth();
    return null;
  }
  assert.throws(
    () => renderToStaticMarkup(React.createElement(Consumer)),
    /Auth context missing/,
  );
});
