import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { externalContentHashes } from '../scripts/verification-external-imports.mjs';

function fixture(t, files) {
  const root = mkdtempSync(join(tmpdir(), 'atlas-external-imports-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const put = (name, source) => { const file = join(root, name); mkdirSync(dirname(file), { recursive: true }); writeFileSync(file, source); };
  for (const [name, source] of Object.entries(files)) put(name, source);
  return { root, put };
}
const sha = source => createHash('sha256').update(source).digest('hex');

test('external closure follows static imports, re-exports, literals and cycles without evaluating modules', t => {
  const files = {
    'content/a/ch01.js': `import './bridge.js';
      throw Error('must not evaluate');
      // import('../missing/comment.js')
      const prose = "import('../missing/string.js')";
      const rich = String.raw\`import('../missing/prose.js')\`;
      const pattern = /import\('fake-regex'\)/;
      if (true) /import\('fake-after-if'\)/.test('');
      const object = { import: x => x }; object.import('not-a-module');
      const url = import.meta.url;
      const later = () => import('../b/lazy.js?cache=1#fragment');
      const template = () => import(\`../c/literal.js\`);
      const interpolation = \`value: \${import('../c/inside-template.js')}\`;
      import '../../assets/js/viz/core.js';`,
    'content/a/bridge.js': `export * from '../b/shared.js';`,
    'content/a/ch02.js': `export { value as renamed } from '../b/named.js';
      export * as helpers from '../c/namespace.js';
      const escaped = () => import('../c/\\u0065scaped.js');`,
    'content/b/shared.js': `export * from '../c/deep.js'; export * from '../a/bridge.js';`,
    'content/b/named.js': 'export const value = 7;',
    'content/b/lazy.js': `export { value } from './named.js';`,
    'content/c/deep.js': `export * from '../b/shared.js';`,
    'content/c/literal.js': 'export const literal = true;',
    'content/c/inside-template.js': 'export const inside = true;',
    'content/c/namespace.js': 'export const helper = true;',
    'content/c/escaped.js': 'export const escaped = true;',
    'content/c/unrelated.js': 'not imported and must not enter the closure',
  };
  const { root } = fixture(t, files), actual = externalContentHashes('a', { root });
  const expectedNames = ['content/b/lazy.js', 'content/b/named.js', 'content/b/shared.js',
    'content/c/deep.js', 'content/c/escaped.js', 'content/c/inside-template.js', 'content/c/literal.js', 'content/c/namespace.js'];
  assert.deepEqual(Object.keys(actual), expectedNames);
  assert.deepEqual(actual, Object.fromEntries(expectedNames.map(name => [name, sha(files[name])])));
});

test('changing an external helper invalidates evidence while unrelated source and owner files do not enter its map', t => {
  const { root, put } = fixture(t, {
    'content/a/ch01.js': `import './helper.js';`,
    'content/a/helper.js': `export * from '../b/input.js';`,
    'content/b/input.js': 'export const n = 1;',
    'content/b/unrelated.js': 'export const n = 2;',
  });
  const first = externalContentHashes('a', { root });
  put('content/b/unrelated.js', 'export const n = 3;');
  put('content/a/ch01.js', `import './helper.js'; // local hash handles this edit`);
  assert.deepEqual(externalContentHashes('a', { root }), first);
  put('content/b/input.js', 'export const n = 99;');
  const changed = externalContentHashes('a', { root });
  assert.notDeepEqual(changed, first);
  assert.equal(changed['content/b/input.js'], sha('export const n = 99;'));
  // The closure itself changes when a helper gains a new transitive input.
  put('content/b/input.js', `export * from './unrelated.js';`);
  assert.deepEqual(Object.keys(externalContentHashes('a', { root })), ['content/b/input.js', 'content/b/unrelated.js']);
});

test('nonliteral dynamic paths fail closed with source locations, including concatenated string prefixes', t => {
  for (const expression of ['import(path)', "import('../b/' + name)", 'import(`../b/${name}.js`)']) {
    const { root } = fixture(t, { 'content/a/ch01.js': `// line one\nconst load = () => ${expression};` });
    assert.throws(() => externalContentHashes('a', { root }), /content\/a\/ch01\.js:2:\d+: Nonliteral dynamic import/);
  }
});

test('missing content and unsupported external module paths cannot produce a passing partial closure', t => {
  for (const [source, expected] of [
    [`import '../b/missing.js';`, /content\/a\/ch01\.js:1:1:.*ENOENT/],
    [`export * from 'https://example.invalid/module.js';`, /Unsupported module path/],
    [`import '../../outside.js';`, /Module path leaves content/],
  ]) {
    const { root } = fixture(t, { 'content/a/ch01.js': source });
    assert.throws(() => externalContentHashes('a', { root }), expected);
  }
});

test('root-absolute browser content paths resolve inside the supplied fixture and ignore common runtime imports', t => {
  const { root } = fixture(t, {
    'content/a/ch01.js': `import '/content/b/input.js?version=2'; import '/assets/js/viz/math.js';`,
    'content/b/input.js': 'export const input = 5;',
  });
  assert.deepEqual(externalContentHashes('a', { root }), { 'content/b/input.js': sha('export const input = 5;') });
  assert.throws(() => externalContentHashes('../a', { root }), /Invalid collection/);
});

test('nested local helpers and imported resources excluded from the original collection hash are guarded', t => {
  const { root, put } = fixture(t, {
    'content/a/ch01.js': `import './nested/helper.js';`,
    'content/a/nested/helper.js': `import data from '../table.json' with { type: 'json' }; export { data };`,
    'content/a/table.json': '{"constant":1}',
  });
  const before = externalContentHashes('a', { root });
  assert.deepEqual(Object.keys(before), ['content/a/nested/helper.js', 'content/a/table.json']);
  put('content/a/table.json', '{"constant":2}');
  assert.notEqual(externalContentHashes('a', { root })['content/a/table.json'], before['content/a/table.json']);
});

test('a current cross-collection import includes the re-exported architecture helper chain', () => {
  const actual = externalContentHashes('tech');
  for (const name of ['content/arch/ch01.shared.js', 'content/arch/ch03.shared.js']) {
    assert.equal(actual[name], sha(readFileSync(new URL('../' + name, import.meta.url))));
  }
});
