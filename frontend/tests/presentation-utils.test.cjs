const path = require('node:path');
const fs = require('node:fs');
const ts = require('typescript');
const vm = require('node:vm');
const test = require('node:test');
const assert = require('node:assert/strict');

const sandboxFetchPath = path.resolve(
  __dirname,
  '../src/components/thread/tool-views/utils/sandbox-fetch.ts',
);

function loadSandboxFetchModule() {
  const source = fs.readFileSync(sandboxFetchPath, 'utf8');
  const transpiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2019,
    },
    fileName: sandboxFetchPath,
  });

  const module = { exports: {} };
  const context = {
    module,
    exports: module.exports,
    require,
    console,
    URL,
  };

  Object.defineProperty(context, 'fetch', {
    get() {
      return global.fetch;
    },
    configurable: true,
  });

  vm.runInNewContext(transpiled.outputText, context, { filename: sandboxFetchPath });
  return context.module.exports;
}

const { fetchSandboxJsonWithWarningBypass } = loadSandboxFetchModule();

function createResponse({ ok, status = 200, statusText = 'OK', contentType, jsonBody }) {
  return {
    ok,
    status,
    statusText,
    headers: {
      get(name) {
        if (name?.toLowerCase() === 'content-type') {
          return contentType ?? null;
        }
        return null;
      },
    },
    json: async () => jsonBody,
  };
}

test('returns JSON when the sandbox responds with application/json directly', async (t) => {
  const originalFetch = global.fetch;
  t.after(() => {
    global.fetch = originalFetch;
  });

  const expected = { hello: 'world' };

  global.fetch = async () =>
    createResponse({
      ok: true,
      contentType: 'application/json',
      jsonBody: expected,
    });

  const result = await fetchSandboxJsonWithWarningBypass('https://sandbox.example/metadata.json');
  assert.deepEqual(result, expected);
});

test('bypasses Daytona warning by posting to accept endpoint before retrying JSON fetch', async (t) => {
  const originalFetch = global.fetch;
  t.after(() => {
    global.fetch = originalFetch;
  });

  const calls = [];

  global.fetch = async (input, init = {}) => {
    calls.push({ url: input.toString(), init });

    if (calls.length === 1) {
      return createResponse({
        ok: true,
        contentType: 'text/html',
      });
    }

    if (calls.length === 2) {
      assert.equal(init.method, 'POST');
      return createResponse({
        ok: true,
        contentType: 'application/json',
        jsonBody: { accepted: true },
      });
    }

    return createResponse({
      ok: true,
      contentType: 'application/json',
      jsonBody: { success: true },
    });
  };

  const result = await fetchSandboxJsonWithWarningBypass('https://sandbox.example/metadata.json');

  assert.deepEqual(result, { success: true });
  assert.equal(calls.length, 3);
  assert.ok(
    calls[1].url.startsWith('https://sandbox.example/accept-daytona-preview-warning'),
    'accept endpoint should be called',
  );
});

test('throws when Daytona bypass POST request fails', async (t) => {
  const originalFetch = global.fetch;
  t.after(() => {
    global.fetch = originalFetch;
  });

  global.fetch = async (_input, init = {}) => {
    if (init.method === 'POST') {
      return createResponse({
        ok: false,
        status: 500,
        statusText: 'Server Error',
        contentType: 'text/plain',
      });
    }

    return createResponse({
      ok: true,
      contentType: 'text/html',
    });
  };

  await assert.rejects(
    () => fetchSandboxJsonWithWarningBypass('https://sandbox.example/metadata.json'),
    /Failed to bypass Daytona warning \(500\)/,
  );
});

test('invokes unexpected content handler and throws when response is not JSON', async (t) => {
  const originalFetch = global.fetch;
  t.after(() => {
    global.fetch = originalFetch;
  });

  const contentTypes = [];

  global.fetch = async () =>
    createResponse({
      ok: true,
      contentType: 'text/plain',
    });

  await assert.rejects(
    () =>
      fetchSandboxJsonWithWarningBypass('https://sandbox.example/metadata.json', {
        unexpectedContentHandler: (type) => contentTypes.push(type),
      }),
    /Unexpected content type from sandbox: text\/plain/,
  );

  assert.deepEqual(contentTypes, ['text/plain']);
});
