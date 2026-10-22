import { createHash } from 'node:crypto';
import { richHTML, inlineHTML, escapeHTML } from '../assets/js/viz/core.js';
const ID = /^[a-z][a-z0-9]{1,7}-\d{1,2}(?:\.\d{1,3}){1,2}[a-z]?$/;
export const digest = x => createHash('sha256').update(JSON.stringify(x)).digest('hex');
// KaTeX 0.16 cannot attach a superscript to a spacing atom; retain the degree on an empty base.
export const staticTex = tex => tex.replaceAll('\\,^\\circ', '\\,{}^\\circ');
export function canonicalBase(value) {
  if (value == null) return null;
  const u = new URL(value);
  if (!['https:', 'http:'].includes(u.protocol) || u.username || u.password || u.search || u.hash || !u.pathname.endsWith('/') || /%|\/{2}/.test(u.pathname)) throw new Error('Canonical base must be a clean HTTP(S) directory URL');
  return u.href;
}
export function projectIdeas(data, ids, aliases) {
  if (!Array.isArray(ids) || !ids.length || new Set(ids).size !== ids.length || ids.some(id => !ID.test(id))) throw new Error('Invalid accepted identity roster');
  const byId = new Map(data.items.map(x => [x.id, x])), cols = new Map(data.collections.map(x => [x.id, x]));
  if (byId.size !== data.items.length) throw new Error('Duplicate written identities');
  const selected = ids.map(id => {
    const i = byId.get(id); if (!i) throw new Error('Accepted idea missing: ' + id);
    const c = cols.get(i.col), ch = data.chapters.get(i.col + '/' + i.chapter);
    if (!c || !ch || !['name', 'statement', 'idea'].every(k => typeof i[k] === 'string')) throw new Error('Missing readable idea content: ' + id);
    const item = Object.fromEntries(['id', 'col', 'chapter', 'num', 'kind', 'name', 'statement', 'idea', 'caption', 'scope', 'credit', 'verify', 'refs', 'links', 'paper', 'deps', 'see', 'introduces'].map(k => [k, i[k] ?? null]));
    return { item, collection: { id: c.id, title: c.title, source: c.source ?? null }, chapter: { title: ch.title } };
  });
  if (!Array.isArray(aliases) || new Set(aliases.map(a => a.id)).size !== aliases.length) throw new Error('Invalid alias roster');
  const accepted = new Set(ids);
  for (const a of aliases) if (!ID.test(a.id) || accepted.has(a.id) || !accepted.has(a.to) || data.aliases.get(a.id)?.to !== a.to) throw new Error('Alias must resolve directly to its frozen written target');
  return { selected, aliases };
}
export function selectFrozenIdeas(data, manifest) {
  if (manifest.schemaVersion !== 1 || !/^[a-f0-9]{40}$/.test(manifest.acceptedCommit || '') || !/^[a-f0-9]{64}$/.test(manifest.snapshotDigest || '')) throw new Error('Invalid accepted snapshot contract');
  const p = projectIdeas(data, manifest.ids, manifest.aliases);
  if (digest(p) !== manifest.snapshotDigest) throw new Error('Accepted static content changed; reconcile the accepted snapshot explicitly');
  return p;
}
const esc = escapeHTML;
const safeLink = x => { try { const u = new URL(x); return ['https:', 'http:'].includes(u.protocol) && !u.username && !u.password ? u.href : null; } catch { return null; } };
function shell(title, body, { depth, path, base, canonicalPath = path, noindex = false }) {
  const prefix = '../'.repeat(depth), canonical = base ? new URL(canonicalPath, base).href : null;
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)} · Ideas, Visualized</title>${!base || noindex ? '<meta name="robots" content="noindex,follow">' : ''}${canonical ? `<link rel="canonical" href="${esc(canonical)}">` : ''}<meta name="description" content="${esc(title + ' — a reading page with its explanation, qualifications, sources and dependencies.')}"/><link rel="icon" href="${prefix}assets/favicon.svg" type="image/svg+xml"><link rel="stylesheet" href="${prefix}assets/vendor/google-fonts/fonts.css"><link rel="stylesheet" href="${prefix}assets/vendor/katex-0.16.11/katex.min.css"><link rel="stylesheet" href="${prefix}assets/css/style.css"><link rel="stylesheet" href="${prefix}assets/css/reading.css"><script type="module" src="${prefix}assets/js/reading.js"></script></head><body><a class="skip-link" href="#main">Skip to reading</a><header class="reading-header"><a href="${prefix}ideas/">Ideas, visualized · Reading library</a><button type="button" data-reading-theme hidden>Change theme</button></header><main id="main" class="reading-main" tabindex="-1">${body}</main><footer class="reading-footer">An unofficial atlas. Explanations are paraphrased; original sources and verification flags retain their scope. <a href="${prefix}#/about">About and caveats</a></footer></body></html>\n`;
}
function sources(source) {
  if (!source) return '<p>No collection citation recorded.</p>';
  const entries = Object.entries(source).filter(([k]) => k !== 'type');
  return '<dl>' + entries.map(([key, value]) => `<dt>${esc(key)}</dt><dd>${esc(typeof value === 'string' ? value : Array.isArray(value) ? value.map(x => typeof x === 'string' ? x : JSON.stringify(x)).join('; ') : JSON.stringify(value))}</dd>`).join('') + '</dl>';
}
export function renderStaticIdeas(projected, { base = null } = {}) {
  base = canonicalBase(base);
  const outputs = new Map(), canonicalPaths = [], byId = new Map(projected.selected.map(p => [p.item.id, p]));
  const put = (path, title, body, depth, options = {}) => {
    outputs.set(path + 'index.html', shell(title, body, { path, base, depth, ...options }));
    if (!options.noindex) canonicalPaths.push(path);
  };
  for (const p of projected.selected) {
    const i = p.item;
    const related = (ids, heading) => !ids?.length ? '' : `<section><h2>${heading}</h2><ul>${ids.map(id => byId.has(id) ? `<li><a href="../${id}/">${inlineHTML(byId.get(id).item.name)}</a> <span class="muted">${esc(id)}</span></li>` : `<li><a href="../../#/t/${esc(id)}">${esc(id)} — interactive route (outside this reading snapshot)</a></li>`).join('')}</ul></section>`;
    const links = Object.entries(i.links || {}).filter(([, u]) => safeLink(u));
    put('ideas/' + i.id + '/', i.name, `<nav aria-label="Breadcrumb"><a href="../">Reading library</a> / <a href="../collections/${i.col}/">${esc(p.collection.title)}</a></nav><p class="eyebrow">${esc(i.kind)} · ${esc(i.id)} · ${esc(p.chapter.title)}</p><h1>${inlineHTML(i.name)}</h1>${i.credit ? `<p class="muted">${esc(i.credit)}</p>` : ''}${i.verify ? '<p class="reading-notice">This idea carries a legacy verification flag. Its original numbering or source details need checking.</p>' : ''}<div class="reading-actions"><a data-interactive href="../../#/t/${i.id}">Open the interactive explanation</a><a href="../../#/evidence/${i.id}">Sources and review status</a></div><section><h2>Statement</h2><div class="prose">${richHTML(i.statement)}</div></section><section><h2>Explanation</h2><div class="prose">${richHTML(i.idea)}</div></section>${i.scope ? `<section><h2>Scope and qualifications</h2><div class="prose">${richHTML(i.scope)}</div></section>` : ''}${i.caption ? `<details><summary>What to explore in the visualization</summary><div class="prose">${richHTML(i.caption)}</div></details>` : ''}${related(i.deps, 'Prerequisites')}${related(i.see, 'Related ideas')}${related(i.introduces, 'Ideas introduced')}<section><h2>Sources</h2>${i.paper ? `<div class="reading-notice"><h3>Paper bibliography</h3>${sources(i.paper)}</div>` : ''}${i.refs?.length ? `<ul>${i.refs.map(ref => `<li>${esc(ref)}</li>`).join('')}</ul>` : '<p>No item-level reference list is recorded.</p>'}${links.length ? `<ul>${links.map(([label, u]) => `<li><a href="${esc(safeLink(u))}" rel="noopener">${esc(label)}</a></li>`).join('')}</ul>` : ''}<h3>Collection reading route</h3>${sources(p.collection.source)}<p class="muted">A collection citation is a reading route, not an item-specific read or independent review receipt.</p></section>`, 2);
  }
  const collections = [...new Map(projected.selected.map(p => [p.collection.id, p.collection])).values()].sort((a,b) => a.title.localeCompare(b.title));
  for (const c of collections) {
    const ps = projected.selected.filter(p => p.collection.id === c.id).sort((a,b) => a.item.num.localeCompare(b.item.num, 'en', { numeric: true })), chapters = [...new Set(ps.map(p => p.item.chapter))].sort((a,b) => a-b);
    put('ideas/collections/' + c.id + '/', c.title, `<nav><a href="../../">← Reading library</a></nav><h1>${esc(c.title)}</h1><p>${ps.length} written ideas in the reading library.</p>${chapters.map(ch => `<section><h2>${ch}. ${esc(ps.find(p => p.item.chapter === ch).chapter.title)}</h2><ul>${ps.filter(p => p.item.chapter === ch).map(p => `<li><a href="../../${p.item.id}/">${esc(p.item.num)} · ${inlineHTML(p.item.name)}</a></li>`).join('')}</ul></section>`).join('')}`, 3);
  }
  put('ideas/', 'Reading library', `<h1>Reading library</h1><p class="lede">Read statements, explanations and source qualifications without running a visualization. Each page links to its interactive companion.</p><p>${byId.size.toLocaleString('en-US')} written ideas · ${collections.length} collections. Cross-listings point to the same idea.</p><ul class="reading-collections">${collections.map(c => `<li><a href="collections/${c.id}/">${esc(c.title)}</a></li>`).join('')}</ul>`, 1);
  for (const a of projected.aliases) put('ideas/' + a.id + '/', 'Cross-listed idea', `<h1>This idea is cross-listed</h1><p>${esc(a.id)} points to ${esc(a.to)}.</p><p><a data-reading-alias href="../${a.to}/">Continue to ${inlineHTML(byId.get(a.to).item.name)}</a></p><p>The canonical identity and its saved interactive state are preserved.</p>`, 2, { canonicalPath: 'ideas/' + a.to + '/', noindex: true });
  if (base) outputs.set('sitemap.xml', '<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' + canonicalPaths.map(path => '<url><loc>' + esc(new URL(path, base).href) + '</loc></url>').join('') + '</urlset>\n');
  return { outputs, canonicalPaths, items: byId.size, aliases: projected.aliases.length, collections: collections.length };
}
