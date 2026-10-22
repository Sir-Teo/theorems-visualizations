// Assemble a local release candidate into a NEW directory. Never deploy or overwrite a checkout.
import { readFile, writeFile, mkdir, cp, lstat, realpath, readdir } from 'node:fs/promises';
import { resolve, dirname, relative, isAbsolute, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
import { createHash } from 'node:crypto';
import { ROOT, loadAll } from './lib.mjs';
import { canonicalBase, selectFrozenIdeas, renderStaticIdeas, staticTex } from './static-ideas.mjs';
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
async function regularTree(path) {
  const s = await lstat(path); if (s.isFile()) return;
  if (!s.isDirectory()) throw new Error('Candidate inputs must be regular files/directories: ' + path);
  for (const e of await readdir(path)) await regularTree(join(path, e));
}
export async function generatedDataDigest(directory) {
  const files = {};
  async function visit(prefix = '') {
    for (const entry of (await readdir(join(directory, prefix), { withFileTypes: true })).sort((a,b) => a.name.localeCompare(b.name))) {
      const path = prefix ? prefix + '/' + entry.name : entry.name;
      if (entry.isDirectory()) await visit(path);
      else if (entry.isFile()) {
        let bytes = await readFile(join(directory, path));
        if (['index.json','home.json'].includes(path)) { const data = JSON.parse(bytes); delete data.generated; bytes = JSON.stringify(data); }
        files[path] = hash(bytes);
      } else throw new Error('Generated data must contain regular files only: ' + path);
    }
  }
  await visit();
  return hash(JSON.stringify(files));
}
export async function buildStaticIdeas({ out, base = null } = {}) {
  if (!out) throw new Error('An explicit new --out directory is required');
  const output = resolve(out), root = await realpath(ROOT), parent = await realpath(dirname(output));
  const rel = relative(root, join(parent, output.slice(dirname(output).length + 1)));
  if (!rel || (!rel.startsWith('..' + '/') && !isAbsolute(rel))) throw new Error('Output must be outside the source checkout');
  if (await lstat(output).then(() => true, e => { if (e.code === 'ENOENT') return false; throw e; })) throw new Error('Output already exists; choose a new directory');
  base = canonicalBase(base);
  const manifest = JSON.parse(await readFile(join(ROOT, 'static-pages/accepted.json'), 'utf8'));
  const data = await loadAll();
  const problems = data.problems.filter(p => p.level === 'error'); if (problems.length) throw new Error(problems.map(p => p.msg).join('\n'));
  const projected = selectFrozenIdeas(data, manifest);
  if (data.items.map(i => i.id).sort().join('\n') !== [...manifest.ids].sort().join('\n')) throw new Error('Source inventory contains work outside the accepted roster; assemble from the accepted checkout');
  const catalog = JSON.parse(await readFile(join(ROOT, 'data/index.json'), 'utf8'));
  if (catalog.items.map(i => i.id).sort().join('\n') !== [...manifest.ids].sort().join('\n')) throw new Error('Production catalog differs from accepted identity roster; build the accepted base first');
  const dataDigest = await generatedDataDigest(join(ROOT,'data'));
  if (!/^[a-f0-9]{64}$/.test(manifest.dataDigest || '') || dataDigest !== manifest.dataDigest) throw new Error('Generated data differs from the reviewed snapshot; stale shards or evidence require explicit reconciliation');
  for (const path of ['index.html', '.nojekyll', 'assets', 'content', 'data']) await regularTree(join(ROOT, path));
  const module = { exports: {} }; vm.runInNewContext(await readFile(join(ROOT, 'assets/vendor/katex-0.16.11/katex.min.js'), 'utf8'), { module, exports: module.exports });
  let normalizedDegreeExpressions = 0;
  const previous = globalThis.window; globalThis.window = { katex: { renderToString(tex, options) { const normalized = staticTex(tex); if (normalized !== tex) normalizedDegreeExpressions++; return module.exports.renderToString(normalized, options); } }, __texStrict: true, __texErrors: [] };
  let rendered, mathErrors;
  try { rendered = renderStaticIdeas(projected, { base }); mathErrors = [...new Set(window.__texErrors)]; }
  finally { if (previous === undefined) delete globalThis.window; else globalThis.window = previous; }
  // Strict math failure is diagnostic and does not silently bless unreadable static output.
  if (mathErrors.length) throw new Error('Static math failed (' + mathErrors.length + '): ' + mathErrors.slice(0, 8).join('\n'));
  await mkdir(output); // Exclusive creation after all validation. A collision fails; no replacement/delete.
  for (const path of ['index.html', '.nojekyll', 'assets', 'content', 'data']) await cp(join(ROOT, path), join(output, path), { recursive: true, errorOnExist: true, force: false });
  let index = await readFile(join(output, 'index.html'), 'utf8');
  if (!index.includes('<nav class="nav"') || !index.includes('<main id="app"') || !index.includes('<a href="#/map"')) throw new Error('Unknown app shell; reconcile reading navigation explicitly');
  index = index.replace('<a href="#/map"', '<a href="ideas/">Read</a>\n      <a href="#/map"').replace('<main id="app"', '<noscript><p class="wrap"><a href="ideas/">Open the reading library without JavaScript</a></p></noscript>\n<main id="app"');
  await writeFile(join(output, 'index.html'), index);
  for (const [path, bytes] of rendered.outputs) { await mkdir(dirname(join(output, path)), { recursive: true }); await writeFile(join(output, path), bytes); }
  const report = { schemaVersion: 1, acceptedCommit: manifest.acceptedCommit, snapshotDigest: manifest.snapshotDigest, dataDigest, canonicalBase: base, items: rendered.items, collections: rendered.collections, aliases: rendered.aliases, canonicalPages: rendered.canonicalPaths.length, outputFiles: rendered.outputs.size, mathErrors: 0, normalizedDegreeExpressions, renderedDigest: hash([...rendered.outputs].map(([path, text]) => path + '\0' + hash(text)).join('\n')), sourceFiles: Object.fromEntries(await Promise.all(['static-pages/accepted.json','scripts/static-ideas.mjs','scripts/build-static-ideas.mjs','assets/js/reading.js','assets/css/reading.css','assets/js/viz/core.js','assets/vendor/katex-0.16.11/katex.min.js'].map(async p => [p, hash(await readFile(join(ROOT,p)))]))), scope: 'Local candidate only; no deployment or new acceptance. Local new-format previews and planning/review documents excluded.' };
  await writeFile(join(output, 'static-build.json'), JSON.stringify(report, null, 2) + '\n');
  return { ...report, output };
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const args = process.argv.slice(2), options = {};
    while (args.length) { const flag = args.shift(); if (flag === '--out') options.out = args.shift(); else if (flag === '--base-url') options.base = args.shift(); else throw new Error('Unknown argument: ' + flag); }
    console.log(JSON.stringify(await buildStaticIdeas(options), null, 2));
  } catch (e) { console.error(e.message); process.exitCode = 1; }
}
