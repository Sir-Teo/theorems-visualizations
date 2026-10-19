import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';

const root = new URL('../', import.meta.url);
const read = path => readFile(new URL(path, root));
const hash = data => createHash('sha256').update(data).digest('hex');
test('pinned KaTeX assets and every stylesheet font match their release manifest', async () => {
  const prefix = 'assets/vendor/katex-0.16.11/', provenance = JSON.parse(await read(prefix + 'provenance.json'));
  assert.equal(provenance.version, '0.16.11'); assert.equal(provenance.license, 'MIT');
  assert.equal(provenance.tarball, 'https://registry.npmjs.org/katex/-/katex-0.16.11.tgz');
  assert.match(provenance.integrity, /^sha512-/);
  for (const [path, spec] of Object.entries(provenance.files)) { const data = await read(prefix + path); assert.equal(data.length, spec.bytes); assert.equal(hash(data), spec.sha256, path); }
  const css = String(await read(prefix + 'katex.min.css')), fonts = [...css.matchAll(/url\(([^)]+)\)/g)].map(m => m[1]);
  assert.equal(new Set(fonts).size, 60);
  for (const path of fonts) { assert.ok(path.startsWith('fonts/')); assert.ok(provenance.files[path], path); }
  assert.match(String(await read(prefix + 'LICENSE')), /MIT License[\s\S]*Copyright[\s\S]*Permission is hereby granted/);
});
test('local Google font faces retain families, styles, weights and all subset files', async () => {
  const prefix = 'assets/vendor/google-fonts/', provenance = JSON.parse(await read(prefix + 'provenance.json')), css = String(await read(prefix + 'fonts.css'));
  assert.equal(hash(css), provenance.localStylesheetSHA256); assert.doesNotMatch(css, /https?:|@import/);
  let restored = css;
  for (const [source, spec] of Object.entries(provenance.fonts)) {
    assert.ok(source.startsWith('https://fonts.gstatic.com/')); const data = await read(prefix + spec.path);
    assert.equal(data.length, spec.bytes); assert.equal(hash(data), spec.sha256, spec.path);
    assert.ok(css.includes(`url(${spec.path})`)); restored = restored.replaceAll(spec.path, source);
  }
  assert.equal(hash(restored), provenance.upstreamStylesheetSHA256, 'the only CSS edits are font source URLs');
  const faces = [...css.matchAll(/@font-face\s*\{([^}]+)\}/g)].map(m => m[1]);
  const inventory = new Set(faces.map(face => ['font-family', 'font-style', 'font-weight'].map(key => face.match(new RegExp(`${key}:\\s*([^;]+)`))[1].replaceAll("'", '')).join('/')));
  assert.deepEqual([...inventory].sort(), ['Inter/normal/400', 'Inter/normal/500', 'Inter/normal/600', 'JetBrains Mono/normal/400', 'JetBrains Mono/normal/500', 'Newsreader/italic/400', 'Newsreader/italic/500', 'Newsreader/normal/400', 'Newsreader/normal/500', 'Newsreader/normal/600'].sort());
  for (const [family, spec] of Object.entries(provenance.licenses)) { const data = await read(prefix + family + '-OFL.txt'); assert.equal(hash(data), spec.sha256); assert.match(String(data), /SIL OPEN FONT LICENSE Version 1\.1/); }
});
test('all HTML entrypoints use local runtime styles and scripts', async () => {
  const entries = ['index.html', ...(await readdir(new URL('tools/', root))).filter(path => path.endsWith('.html')).map(path => 'tools/' + path)];
  for (const path of entries) {
    const html = String(await read(path));
    assert.doesNotMatch(html, /(?:href|src)=["']https?:\/\/(?:cdn\.jsdelivr\.net|fonts\.(?:googleapis|gstatic)\.com)/, path);
    for (const match of html.matchAll(/(?:src|href)=["']([^"']+\.(?:js|css))["']/g)) {
      assert.doesNotMatch(match[1], /^https?:/, path); await readFile(new URL(match[1], new URL(path, root)));
    }
  }
});
