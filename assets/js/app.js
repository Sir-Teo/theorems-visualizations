// Single-page app: hash router, pages, search, theme.
import { mount, richHTML, inlineHTML, escapeHTML, resetColors } from './viz/core.js';
import { buildIndex, runSearch, highlight, norm } from './search.js';
import { decodeState, stateURL } from './share-state.js';
import { renderLineage, renderChapterGraph, renderFlow, chapterFlow, collectionFlow, renderChord, MapView, TimelineView, renderTreemap, fullLabel, displayNum, kindAbbr, setAtlas, colShort, depsOf } from './graph.js';

const app = document.getElementById('app');
if (new URLSearchParams(location.search).get('embed') === '1' && location.hash.startsWith('#/t/')) document.documentElement.classList.add('embed-view');
document.querySelector('.skip-link').addEventListener('click', (e) => { e.preventDefault(); app.focus(); app.scrollIntoView(); });
const SITE = 'Ideas, Visualized';
let G = null;           // current atlas state; home.json is upgraded on demand to the complete index
let homeCatalog = null, catalogFull = false, catalogP = null, homeP = null, searchP = null, searchReady = false;
let routeVersion = 0;
const viewIsCurrent = () => { const version = routeVersion; return () => version === routeVersion; };
let cleanup = null;     // teardown for the current page
const modCache = new Map();

// ------------------------------------------------------------ data
function installCatalog(cat) {
  const planned = cat.planned || [];
  const byId = new Map([...cat.items, ...planned].map((it) => [it.id, it]));
  const children = new Map(cat.items.map((it) => [it.id, []]));
  for (const it of cat.items) for (const d of it.deps) children.get(d)?.push(it.id);
  const colById = new Map(cat.collections.map((C) => [C.id, C]));
  const colIdx = new Map(cat.collections.map((C, i) => [C.id, i]));
  const fieldById = new Map(cat.fields.map((F) => [F.id, F]));
  // cross-listings: a chapter may list another collection's idea under its own number
  const alias = new Map(cat.collections.flatMap((C) => C.chapters.flatMap((Ch) => (Ch.cross || []).map(([num, to]) => [`${C.id}-${num}`, to]))));
  G = { ...cat, planned, byId, children, colById, colIdx, fieldById, alias };
  indexGraph();
  G.edgeCount = cat.items.reduce((s, it) => s + it.deps.length, 0);
  G.live = cat.collections.filter((C) => C.count);
  setAtlas(G);
  buildSearch();
}
async function fetchJSON(path) {
  const res = await fetch(path, { cache: 'no-cache' });
  if (!res.ok) throw new Error(`Could not load ${path} (${res.status})`);
  return res.json();
}
function ensureHome() {
  if (homeCatalog) return Promise.resolve(homeCatalog);
  if (!homeP) homeP = fetchJSON('data/home.json').then(cat => (homeCatalog = cat)).catch(error => { homeP = null; throw error; });
  return homeP;
}
function ensureCatalog() {
  if (catalogFull) return Promise.resolve();
  if (!catalogP) catalogP = fetchJSON('data/index.json').then(cat => { installCatalog(cat); catalogFull = true; }).catch(error => { catalogP = null; throw error; });
  return catalogP;
}
async function loadCatalog() {
  const raw = location.hash.replace(/^#/, '') || '/';
  if (raw === '/' || raw === 'fields' || raw.startsWith('/?')) { const home = await ensureHome(); if (!catalogFull) installCatalog(home); }
  else await ensureCatalog();
  buildNav();
}
/** order and reverse edges over written + planned items */
function indexGraph() {
  const all = [...G.items, ...G.planned];
  G.order = new Map(all.map((it, i) => [it.id, i]));
  G.allChildren = new Map(all.map((it) => [it.id, []]));
  for (const it of all) for (const d of depsOf(it)) G.allChildren.get(d)?.push(it.id);
  // landmark papers ↔ the ideas they first put forward
  G.introducedBy = new Map();
  for (const it of all) for (const d of it.intro || []) { if (!G.introducedBy.has(d)) G.introducedBy.set(d, []); G.introducedBy.get(d).push(it.id); }
}
let plannedP = null;
/** Planned (not yet written) items live in data/planned.json and are merged into the graph on demand. */
function ensurePlanned() {
  if (!plannedP) plannedP = ensureCatalog().then(() => fetchJSON('data/planned.json')).then((P) => {
    const list = [];
    for (const C of G.collections) for (const [num, c, k, name, deps, x, y, pa] of P.cols[C.id] || []) list.push({ id: `${C.id}-${num}`, col: C.id, c, num, kind: P.kinds[k], name, deps, x, y, planned: true, ...(pa ? { yr: pa.y, au: pa.a, intro: pa.i } : {}) });
    G.planned = list;
    for (const it of list) G.byId.set(it.id, it);
    // A collection page can load its details before the planned graph is requested.
    for (const [col, det] of shardData) applyShard(col, det);
    indexGraph();
  }).catch((e) => { plannedP = null; throw e; });
  return plannedP;
}
const shards = new Map();
const shardData = new Map();
function applyShard(col, det) {
  const { _ch, ...rest } = det;
  for (const [n, sum] of Object.entries(_ch || {})) { const Ch = chapterOf(col, +n); if (Ch) Ch.summary = sum; }
  for (const [id, d] of Object.entries(rest)) { const it = G.byId.get(id); if (it) Object.assign(it, d); }
}
/** Per-collection details (statements, refs, …) are lazy-loaded from data/col/<id>.json. */
function loadShard(col) {
  if (!shards.has(col)) {
    shards.set(col, fetchJSON(`data/col/${col}.json`).then((det) => {
      shardData.set(col, det);
      applyShard(col, det);
    }).catch(() => { shards.delete(col); }));
  }
  return shards.get(col);
}
const loadShards = (cols) => Promise.all([...new Set(cols)].map(loadShard));
/** Full statement/credit search is requested by an actual query, never by home-page idle work. */
function ensureSearch() {
  if (!searchP) searchP = ensurePlanned().then(() => loadShards(G.live.map(C => C.id))).then(() => {
    if (G.live.some(C => !shardData.has(C.id))) throw new Error('Search details could not load');
    buildSearch(); searchReady = true;
  }).catch(error => { searchP = null; throw error; });
  return searchP;
}
const chapterOf = (col, c) => G.colById.get(col)?.chapters.find((C) => C.n === c);
const chapterLabel = (col, c) => G.colById.get(col)?.chapterLabels?.[c] || `Chapter ${c}`;
async function loadModule(file) {
  if (!modCache.has(file)) modCache.set(file, import('../../' + file).then((m) => m.default));
  return modCache.get(file);
}
async function loadItem(it) {
  const ch = await loadModule(it.file);
  return ch.items.find((x) => x.num === it.num);
}

// ------------------------------------------------------------ helpers
const h = (html) => { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; };
let curCol = null;
const link = (it, cls = 'chip') => `<a class="${cls}${it.planned ? ' planned' : ''}" data-col="${it.col}" href="#/t/${it.id}" title="${escapeHTML(fullLabel(it))}${it.planned ? ' (planned)' : ''}"><span class="col-dot"></span><span class="num">${it.col !== curCol ? colShort(it.col) + ' ' : ''}${displayNum(it)}</span><span class="nm">${inlineHTML(it.name)}</span></a>`;
function setTitle(t) { document.title = t ? `${t} · ${SITE}` : `${SITE} — the ideas of human knowledge, illustrated`; }
function setNav(key) { document.querySelectorAll('[data-nav]').forEach((a) => { const on = a.dataset.nav === key; a.classList.toggle('on', on); if (on) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); }); }
const go = (hash) => { location.hash = hash; };
const ICON_HAND = '<svg width="15" height="15" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 11V5.5a1.5 1.5 0 0 1 3 0V11m0-1.5a1.5 1.5 0 0 1 3 0V11m0-.5a1.5 1.5 0 0 1 3 0V15a6 6 0 0 1-6 6h-.6a6 6 0 0 1-4.8-2.4L4.2 15a1.6 1.6 0 0 1 2.5-2L9 15" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const plural = (n, w) => `${n} ${w}${n === 1 ? '' : 's'}`;
const fieldCols = (F) => G.collections.filter((C) => C.field === F.id);
function sourceLine(C) {
  const s = C.source || {};
  if (s.type === 'book') return `${escapeHTML(s.author)}, <i>${escapeHTML(s.title)}</i>, ${escapeHTML(s.edition || '')}${s.license ? ` · ${s.url ? `<a href="${escapeHTML(s.url)}" target="_blank" rel="noopener">${escapeHTML(s.license)}</a>` : escapeHTML(s.license)}` : ''}`;
  return 'Curated course';
}
const progress = (C) => {
  const tot = C.count + C.planned;
  return tot ? `<span class="progress" title="${C.count} written · ${C.planned} planned"><span style="width:${(100 * C.count / tot).toFixed(1)}%"></span></span>` : '';
};
const colStatus = (C) => C.count ? `${C.count} results${C.planned ? ` · ${C.planned} planned` : ''}` : C.planned ? `${C.planned} planned` : 'planned shelf';
function flowFor(colIds) {
  const live = colIds.filter((id) => G.colById.get(id)?.count);
  return live.length && live.length <= 4 ? { mode: 'chapters', live } : null;
}

// ------------------------------------------------------------ navigation menu
function buildNav() {
  const menu = document.getElementById('fields-menu'); if (!menu) return;
  menu.innerHTML = G.fields.map((F) => `<div class="fm-field" data-field="${F.id}"><a class="fm-head" href="#/f/${F.id}"><span class="col-dot" style="--bc:var(--f-${F.id})"></span>${escapeHTML(F.title)}</a>
    <div class="fm-cols">${fieldCols(F).map((C) => `<a href="#/c/${C.id}" data-col="${C.id}" class="${C.count ? '' : 'soon'}">${escapeHTML(C.title)}${C.count ? ` <span class="c">${C.count}</span>` : ''}</a>`).join('')}</div></div>`).join('');
  const det = document.getElementById('fields-nav');
  menu.addEventListener('click', (e) => { if (e.target.closest('a')) det.open = false; });
  document.addEventListener('click', (e) => { if (det.open && !e.target.closest('#fields-nav')) det.open = false; });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && det.open) { det.open = false; det.querySelector('summary').focus(); } });
}

// ------------------------------------------------------------ pages
async function pageHome() {
  const isCurrent = viewIsCurrent(), H = await ensureHome();
  if (!isCurrent()) return;
  setTitle(''); setNav(''); curCol = null;
  const homeById = new Map([...H.items, ...H.planned].map(it => [it.id, it]));
  const nViz = H.home.vizCount, chain = H.home.chain.map(id => homeById.get(id));
  const cited = it => H.home.cited[it.id] || 0;
  const pillars = H.home.pillars.map(id => homeById.get(id));
  const liveFields = G.fields.filter((F) => fieldCols(F).some((C) => C.count));
  const newChapters = [
    ['pl', 5, 'Data, recursion and effects'],
    ['ling', 5, 'Syntax: the structure of sentences'],
  ].filter(([col, chapter]) => H.collections.some(C => C.id === col && C.chapters.some(Ch => Ch.n === chapter && Ch.count)));
  const el = h(`<div>
    <section class="wrap hero">
      <div class="hero-layout">
        <div class="hero-intro">
          <h1>Ideas, <em>visualized.</em></h1>
          <p class="lede">Interactive explanations of ideas across mathematics, science, society, the arts and the humanities.</p>
          ${newChapters.length ? `<p class="meta refs-inline">New: ${newChapters.map(([col, chapter, title]) => `<a href="#/c/${col}/${chapter}">${escapeHTML(title)}</a>`).join(' · ')}</p>` : ''}
          <div class="hero-actions">
            <a class="btn primary" href="#/map">Explore the map <span aria-hidden="true">↗</span></a>
            <a class="hero-browse" href="#fields">Browse the fields <span aria-hidden="true">↓</span></a>
          </div>
        </div>
        <div class="hero-discover">
          <label class="sr-only" for="hero-query">Search the atlas</label>
          <form class="hero-search" role="search" id="hero-search"><input id="hero-query" type="search" name="q" placeholder="Search ideas, people, fields…" aria-label="Search the atlas"><button class="btn primary" type="submit" aria-label="Search the atlas"><svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="m16 16 4 4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg></button></form>
          <div class="hero-try"><span>Start with</span><a href="#/search?q=entropy">Entropy</a><a href="#/search?q=fixed%20point">Fixed points</a><a href="#/search?q=kind%3Aparadox">Paradoxes</a></div>
        </div>
      </div>
      <div class="hero-stats">
        <div><b>${H.home.itemCount.toLocaleString('en')}</b><span>ideas</span></div>
        <div><b>${nViz.toLocaleString('en')}</b><span>visualizations</span></div>
        <div><b>${H.home.edgeCount.toLocaleString('en')}</b><span>connections</span></div>
        <a href="#fields"><b>${G.live.length}</b><span>collections</span></a>
        <a href="#fields"><b>${G.fields.length}</b><span>fields</span></a>
      </div>
    </section>
    <section class="wrap">
      <div class="card flow-card">
        <div class="flow-head"><h2>Everything at a glance</h2><span class="muted" style="font-size:13px" id="tm-hint">area ∝ ideas · solid = written, pale = planned · click a field to zoom in</span></div>
        <div class="tm-crumbs" id="tm-crumbs"></div>
        <div id="treemap"></div>
      </div>
    </section>
    <section class="wrap">
      <div class="card flow-card">
        <div class="flow-head"><h2>How the fields lean on one another</h2><span class="muted" style="font-size:13px">every dependency link that crosses a field boundary, written and planned · hover to trace · click a field to open it</span></div>
        <div class="chord-wrap"><div id="chord"></div><div class="chord-side"><h3>Strongest flows</h3><ol class="flow-list" id="flow-list"></ol></div></div>
      </div>
    </section>
    ${G.paperCount ? `<section class="wrap">
      <div class="section-title"><h2>Landmark papers</h2><span class="muted">${G.paperCount} papers that changed their fields, each linked to the ideas it introduced · <a href="#/papers">all papers →</a></span></div>
      <div class="card papers-timeline home-papers" id="home-ptl"></div>
      <div class="papers-list" id="home-papers"></div>
    </section>` : ''}
    ${(G.bridges || []).length ? `<section class="wrap">
      <div class="section-title"><h2>Bridges</h2><span class="muted">one idea followed across fields · <a href="#/bridges">all bridges →</a></span></div>
      <div class="col-grid">${G.bridges.slice(0, 6).map((B) => `<a class="card bridge-card" href="#/bridge/${B.slug}"><h3>${escapeHTML(B.title)}</h3><div class="sum">${inlineHTML(B.blurb || '')}</div><div class="meta">${fieldDots(B, homeById)} ${B.steps.length} steps</div></a>`).join('')}</div>
    </section>` : ''}
    <section class="wrap" id="fields">
      <div class="section-title"><h2>The fields</h2><span class="muted">${G.collections.length} collections across ${G.fields.length} fields · faded shelves are planned</span></div>
      <div class="field-grid" id="field-grid"></div>
    </section>
    ${chain.length > 2 ? `<section class="wrap">
      <div class="section-title"><h2>The longest thread</h2><span class="muted">${chain.length} results, each resting on the one before</span></div>
      <div class="card" style="padding:16px 18px"><div class="chip-list" id="chain"></div></div>
    </section>` : ''}
    <section class="wrap">
      <div class="section-title"><h2>Workhorses</h2><span class="muted">the results cited most often by later ones</span></div>
      <div class="featured" id="pillars"></div>
    </section>
  </div>`);
  app.replaceChildren(el);
  el.querySelector('#hero-search')?.addEventListener('submit', (e) => { e.preventDefault(); const q = new FormData(e.target).get('q'); if (String(q).trim()) go(`#/search?q=${encodeURIComponent(q)}`); });
  // treemap overview, zoomable into a field
  let tmField = null;
  const drawTM = () => {
    el.querySelector('#tm-crumbs').innerHTML = tmField ? `<a href="#/" data-tm-up>All fields</a><span class="sep">/</span><span>${escapeHTML(G.fieldById.get(tmField).title)}</span> · <a href="#/f/${tmField}">open the field page →</a>` : '';
    el.querySelector('[data-tm-up]')?.addEventListener('click', (e) => { e.preventDefault(); tmField = null; drawTM(); });
    renderTreemap(el.querySelector('#treemap'), G, { field: tmField, onField: (f) => { tmField = f; drawTM(); }, onCollection: (c) => go(`#/c/${c}`), onChapter: (c, n) => go(`#/c/${c}/${n}`), height: innerWidth < 700 ? 420 : 520 });
  };
  drawTM();
  const ro = new ResizeObserver(() => { clearTimeout(ro.t); ro.t = setTimeout(drawTM, 120); }); ro.observe(el.querySelector('#treemap'));
  cleanup = () => ro.disconnect();
  // chord diagram of cross-field links, with the strongest directed flows beside it
  const fe = G.fieldEdges || [];
  const chord = renderChord(el.querySelector('#chord'), { fields: G.fields, edges: fe, onField: (f) => go(`#/f/${f}`) });
  const fl = el.querySelector('#flow-list'), top = [...fe].sort((a, b) => b.n - a.n).slice(0, 10), maxN = top[0]?.n || 1;
  fl.innerHTML = top.map((e) => `<li data-a="${e.from}" data-b="${e.to}"><span class="fl-t"><span style="color:var(--f-${e.from})">${escapeHTML(G.fieldById.get(e.from).short)}</span> → <span style="color:var(--f-${e.to})">${escapeHTML(G.fieldById.get(e.to).short)}</span></span><span class="fl-bar"><i style="width:${(100 * e.n) / maxN}%;background:var(--f-${e.from})"></i></span><span class="fl-n">${e.n}</span></li>`).join('');
  for (const li of fl.children) { li.addEventListener('pointerenter', () => chord?.focus(li.dataset.a, li.dataset.b)); li.addEventListener('pointerleave', () => chord?.focus(null)); }
  // landmark papers: a compact timeline and a few to open (interactive ones first)
  if (G.paperCount) {
    const host = el.querySelector('#home-ptl'); if (!host?.isConnected) return;
    const papers = [...H.items, ...H.planned].filter((it) => it.kind === 'Paper');
    const view = new TimelineView(host, G, { items: papers, what: 'papers', fit: true, onOpen: (id) => go(`#/t/${id}`) });
    const prev = cleanup; cleanup = () => { prev?.(); view.destroy(); };
    const pick = [...papers.filter((p) => !p.planned).sort((a, b) => (a.yr ?? 0) - (b.yr ?? 0))];
    const famous = ['info-5.18', 'toc-7.13', 'rel-1.14', 'astro-10.19', 'bioinf-1.13', 'popgen-1.17', 'game-1.11', 'ode-10.15'];
    for (const id of famous) { const p = homeById.get(id); if (p && !pick.includes(p)) pick.push(p); }
    el.querySelector('#home-papers').innerHTML = pick.slice(0, 6).map((p) => `<a class="paper-row${p.planned ? ' planned' : ''}" data-col="${p.col}" href="#/t/${p.id}"><span class="yr">${p.yr ?? ''}</span><span><div class="tt">${inlineHTML(p.name)}</div><div class="au">${escapeHTML(p.au || '')} · ${escapeHTML(G.colById.get(p.col).short)}</div></span><span class="st">${p.planned ? 'planned' : '● interactive'}</span></a>`).join('');
  }
  const chainEl = el.querySelector('#chain');
  if (chainEl) chainEl.innerHTML = chain.map((it) => link(it)).join('<span class="faint" aria-hidden="true">→</span>');
  const grid = el.querySelector('#field-grid');
  for (const F of G.fields) {
    const cols = fieldCols(F); const n = cols.reduce((s, C) => s + C.count, 0);
    grid.append(h(`<div class="card field-card" data-field="${F.id}" style="--fc:var(--f-${F.id})">
      <h2><a href="#/f/${F.id}">${escapeHTML(F.title)}</a></h2>
      <div class="ed">${plural(cols.length, 'collection')}${n ? ` · ${n.toLocaleString('en')} ideas` : ' · coming soon'}</div>
      <p class="desc">${inlineHTML(F.blurb)}</p>
      <ul class="col-list">${cols.map((C) => `<li data-col="${C.id}" class="${C.count ? '' : 'soon'}"><a href="#/c/${C.id}"><span class="col-dot"></span><span class="t">${escapeHTML(C.title)}</span><span class="c">${C.count || (C.planned ? `${C.planned}·` : '')}</span></a></li>`).join('')}</ul>
    </div>`));
  }
  const pil = el.querySelector('#pillars');
  for (const it of pillars) pil.append(h(`<a class="card feat" data-col="${it.col}" href="#/t/${it.id}"><span class="eyebrow"><span class="col-dot"></span>${escapeHTML(colShort(it.col))} · ${escapeHTML(fullLabel(it))}</span><span class="nm">${inlineHTML(it.name)}</span><span class="why">cited directly by ${cited(it)} results · ${it.desc} depend on it</span></a>`));
}

function pageField(f) {
  const F = G.fieldById.get(f); if (!F) return pageNotFound();
  setTitle(F.title); setNav('fields'); curCol = null;
  const cols = fieldCols(F); const n = cols.reduce((s, C) => s + C.count, 0); const pl = cols.reduce((s, C) => s + C.planned, 0);
  const el = h(`<div class="wrap" data-field="${F.id}" style="--fc:var(--f-${F.id})">
    <div class="page-head">
      <div class="crumbs"><a href="#/">Home</a><span class="sep">/</span><span>${escapeHTML(F.title)}</span></div>
      <div class="eyebrow" style="color:var(--fc)">Field</div>
      <h1>${escapeHTML(F.title)}</h1>
      <p class="sub">${inlineHTML(F.blurb)}</p>
      <div class="stats-row"><span><b>${cols.length}</b> collections</span><span><b>${cols.filter((C) => C.count).length}</b> live</span><span><b>${n.toLocaleString('en')}</b> ideas written</span>${pl ? `<span><b>${pl.toLocaleString('en')}</b> planned</span>` : ''}</div>
    </div>
    ${F.areas.map((A) => { const ac = cols.filter((C) => C.area === A.id); return ac.length ? `<section class="field-area"><h2 class="area-title">${escapeHTML(A.title)}</h2><div class="col-grid">${ac.map((C) => `<a class="card col-card ${C.count ? '' : 'soon'}" data-col="${C.id}" href="#/c/${C.id}">
      <span class="eyebrow"><span class="col-dot"></span>${escapeHTML(C.short)} · ${C.source?.type === 'book' ? 'book' : 'curated course'}</span>
      <h3>${escapeHTML(C.title)}</h3>
      <div class="sum">${inlineHTML(C.blurb)}</div>
      <div class="meta">${progress(C)}${colStatus(C)}</div></a>`).join('')}</div></section>` : ''; }).join('')}
    <div class="card flow-card" style="margin-top:22px">
      <div class="flow-head"><h2>At a glance</h2><span class="muted" style="font-size:13px">collections and chapters · area ∝ ideas · solid = written, pale = planned</span></div>
      <div id="treemap"></div>
    </div>
    <div class="card flow-card" id="flow-card" style="margin-top:28px">
      <div class="flow-head"><h2>How the collections connect</h2><span class="muted" style="font-size:13px">curves: results of one collection used in another</span></div>
      <div style="overflow-x:auto" id="flow"></div>
    </div>
  </div>`);
  app.replaceChildren(el);
  const drawTM = () => renderTreemap(el.querySelector('#treemap'), G, { field: F.id, onCollection: (c) => go(`#/c/${c}`), onChapter: (c, n) => go(`#/c/${c}/${n}`), height: 440 });
  drawTM();
  const ro = new ResizeObserver(() => { clearTimeout(ro.t); ro.t = setTimeout(drawTM, 120); }); ro.observe(el.querySelector('#treemap'));
  cleanup = () => ro.disconnect();
  const ff = flowFor(cols.map((C) => C.id));
  const flow = ff ? chapterFlow(G, ff.live) : collectionFlow(G, F.areas.map((A) => ({ title: A.title, color: `var(--f-${F.id})`, colIds: cols.filter((C) => C.area === A.id).map((C) => C.id) })));
  if (flow.columns.some((c) => c.rows.length)) renderFlow(el.querySelector('#flow'), { ...flow, onOpen: (R) => go(R.ch != null ? `#/c/${R.col}/${R.ch}` : `#/c/${R.col}`) });
  else el.querySelector('#flow-card').remove();
}

async function pageCollection(id) {
  const isCurrent = viewIsCurrent();
  const C = G.colById.get(id); if (!C) return pageNotFound();
  const F = G.fieldById.get(C.field);
  setTitle(C.title); setNav('fields'); curCol = id;
  if (C.chapters.length) await loadShard(id);
  if (!isCurrent()) return;
  const refs = C.source?.type === 'course' ? C.source.refs || [] : [];
  const el = h(`<div class="wrap" data-col="${C.id}">
    <div class="page-head">
      <div class="crumbs"><a href="#/">Home</a><span class="sep">/</span><a href="#/f/${F.id}">${escapeHTML(F.title)}</a><span class="sep">/</span><span>${escapeHTML(C.short)}</span></div>
      <div class="eyebrow" style="color:var(--bc)">${C.nick ? `${C.nick} · ` : ''}${sourceLine(C)}</div>
      <h1>${escapeHTML(C.title)}</h1>
      <p class="sub">${inlineHTML(C.blurb)}</p>
      <div class="stats-row"><span><b>${C.chapters.length}</b> chapters</span><span><b>${C.count}</b> written</span>${C.planned ? `<span><b>${C.planned}</b> planned</span>` : ''}${C.viz ? `<span><b>${C.viz}</b> visualizations</span>` : ''}</div>
      ${refs.length ? `<div class="refs"><span class="eyebrow">Built from</span><ul>${refs.map((r) => `<li>${escapeHTML(r)}</li>`).join('')}</ul></div>` : ''}
    </div>
    ${C.chapters.length ? `<div class="chapters-grid">${C.chapters.map((Ch) => `<a class="card ch-card ${Ch.count ? '' : 'soon'}" href="#/c/${C.id}/${Ch.n}">
      <span class="eyebrow">${chapterLabel(C.id, Ch.n)}</span><h3>${escapeHTML(Ch.title || '')}</h3>
      <div class="sum">${inlineHTML(Ch.summary || '')}</div>
      <div class="meta">${Ch.count ? `${Ch.count} results · ${Ch.viz} visualizations` : ''}${Ch.planned ? `${Ch.count ? ' · ' : ''}${Ch.planned} planned` : ''}${Ch.cross ? `${Ch.count || Ch.planned ? ' · ' : ''}${Ch.cross.length} cross-listed` : ''}</div></a>`).join('')}</div>`
    : `<div class="card empty-shelf"><h2>A planned shelf</h2><p>No syllabus or results yet. This collection is part of the <a href="#/status">roadmap</a>; its outline will appear here first, then its results, each with an interactive picture.</p></div>`}
    ${C.count ? `<div class="card flow-card" style="margin-top:22px">
      <div class="flow-head"><h2>Inside the collection</h2><span class="muted" style="font-size:13px">arcs: results of one chapter used in a later one</span></div>
      <div style="overflow-x:auto" id="flow"></div>
    </div>` : ''}
  </div>`);
  app.replaceChildren(el);
  if (C.count) renderFlow(el.querySelector('#flow'), { ...chapterFlow(G, [C.id]), onOpen: (R) => go(`#/c/${R.col}/${R.ch}`) });
}

async function pageChapter(col, c) {
  const isCurrent = viewIsCurrent();
  const C = G.colById.get(col); const Ch = chapterOf(col, c); if (!C || !Ch) return pageNotFound();
  setTitle(`${C.short} ${chapterLabel(col, c)}: ${Ch.title}`); setNav('fields'); curCol = col;
  await Promise.all([loadShard(col), ensurePlanned()]);
  if (!isCurrent()) return;
  const items = G.items.filter((it) => it.col === col && it.c === c);
  const planned = G.planned.filter((it) => it.col === col && it.c === c);
  const cross = (Ch.cross || []).map(([num, to]) => [num, G.byId.get(to)]).filter(([, it]) => it);
  await loadShards(cross.map(([, it]) => it.col));
  if (!isCurrent()) return;
  const idx = C.chapters.indexOf(Ch); const prev = C.chapters[idx - 1], next = C.chapters[idx + 1];
  const extDeps = new Set(); for (const it of items) for (const d of it.deps) if (!items.some((x) => x.id === d)) extDeps.add(d);
  const el = h(`<div class="wrap" data-col="${col}">
    <div class="page-head">
      <div class="crumbs"><a href="#/">Home</a><span class="sep">/</span><a href="#/f/${C.field}">${escapeHTML(G.fieldById.get(C.field).title)}</a><span class="sep">/</span><a href="#/c/${col}">${escapeHTML(C.short)}</a><span class="sep">/</span><span>${chapterLabel(col, c)}</span></div>
      <div class="thm-head">
        <div><div class="eyebrow" style="color:var(--bc)">${escapeHTML(C.short)} · ${chapterLabel(col, c)}</div><h1>${escapeHTML(Ch.title || '')}</h1></div>
        <div class="thm-nav">${prev ? `<a class="btn" href="#/c/${col}/${prev.n}" aria-label="Previous chapter: ${escapeHTML(prev.title || '')}" title="${escapeHTML(prev.title || '')}">← ${prev.n}</a>` : ''}${next ? `<a class="btn" href="#/c/${col}/${next.n}" aria-label="Next chapter: ${escapeHTML(next.title || '')}" title="${escapeHTML(next.title || '')}">${next.n} →</a>` : ''}</div>
      </div>
      <p class="sub">${inlineHTML(Ch.summary || '')}</p>
      <div class="stats-row"><span><b>${items.length}</b> results</span><span><b>${items.filter((i) => i.viz).length}</b> visualizations</span>${items.length ? `<span><b>${extDeps.size}</b> results used from elsewhere</span>` : ''}${planned.length ? `<span><b>${planned.length}</b> planned</span>` : ''}${cross.length ? `<span><b>${cross.length}</b> cross-listed</span>` : ''}</div>
    </div>
    ${items.length ? `<div class="card ch-graph-card">
      <div class="cg-head"><h2 style="font-size:21px">Dependency graph</h2><span class="legend-row"><span><svg width="22" height="8"><line x1="0" y1="4" x2="22" y2="4" stroke="var(--ink-3)" stroke-width="1.6"/></svg>within the chapter</span><span><svg width="22" height="8"><line x1="0" y1="4" x2="22" y2="4" stroke="var(--bc)" stroke-width="1.6" stroke-dasharray="4 3"/></svg>from elsewhere</span><span><svg width="22" height="12"><rect x="1" y="1" width="20" height="10" rx="3" fill="none" stroke="var(--bc)" stroke-dasharray="3 2"/></svg>definition</span></span></div>
      <div class="lineage-svg-wrap" id="cg"></div>
    </div>` : ''}
    <div class="thm-list">${items.map((it) => `<a class="card thm-card" data-col="${col}" href="#/t/${it.id}">
      <div class="top"><span class="num">${displayNum(it)}</span><span class="kind">${it.kind}</span></div>
      <div class="nm">${inlineHTML(it.name)}</div>
      <div class="st">${richHTML(it.st || '')}</div>
      <div class="foot"><span>builds on ${it.deps.length}</span><span>used by ${(G.children.get(it.id) || []).length}</span>${it.viz ? '<span>● interactive</span>' : ''}</div>
    </a>`).join('')}</div>
    ${planned.length ? `<div class="section-title"><h2>On the syllabus</h2><span class="muted">${plural(planned.length, 'item')} planned, not written yet</span></div>
    <div class="thm-list">${planned.map((it) => `<a class="card thm-card planned" data-col="${col}" href="#/t/${it.id}">
      <div class="top"><span class="num">${displayNum(it)}</span><span class="kind">${it.kind} · planned</span></div>
      <div class="nm">${inlineHTML(it.name)}</div>
      ${it.pic ? `<div class="st pic">${inlineHTML(it.pic)}</div>` : it.refs ? `<div class="st">${escapeHTML(it.refs.join(' · '))}</div>` : ''}
    </a>`).join('')}</div>` : ''}
    ${cross.length ? `<div class="section-title"><h2>Cross-listed</h2><span class="muted">${cross.length === 1 ? 'an idea' : `${cross.length} ideas`} this chapter covers that live in another collection</span></div>
    <div class="thm-list">${cross.map(([num, it]) => `<a class="card thm-card${it.planned ? ' planned' : ''}" data-col="${it.col}" href="#/t/${it.id}">
      <div class="top"><span class="num">${escapeHTML(num)} → ${escapeHTML(G.colById.get(it.col).short)} ${displayNum(it)}</span><span class="kind">${it.kind}${it.planned ? ' · planned' : ''}</span></div>
      <div class="nm">${inlineHTML(it.name)}</div>
      ${it.st ? `<div class="st">${richHTML(it.st)}</div>` : it.pic ? `<div class="st pic">${inlineHTML(it.pic)}</div>` : ''}
    </a>`).join('')}</div>` : ''}
  </div>`);
  app.replaceChildren(el);
  if (items.length) renderChapterGraph(el.querySelector('#cg'), G, col, c, { onOpen: (it) => go(`#/t/${it.id}`), onOpenChapter: (cc, n) => go(`#/c/${cc}/${n}`) });
}

/** Citation card for a landmark paper (full metadata comes from the collection shard). */
function paperBlock(it) {
  const p = it.paper; if (!p) return '';
  const href = p.doi ? `https://doi.org/${p.doi}` : p.url;
  return `<div class="paper-cite"><span class="eyebrow">Paper · ${escapeHTML(String(p.year))}</span>
    <div class="pc-authors">${escapeHTML(p.authors)}</div>
    <div class="pc-title">${href ? `<a href="${escapeHTML(href)}" target="_blank" rel="noopener">${inlineHTML(p.title)}</a>` : inlineHTML(p.title)}</div>
    ${p.venue ? `<div class="pc-venue">${inlineHTML(p.venue)}</div>` : ''}${p.doi ? `<div class="pc-doi">doi:${escapeHTML(p.doi)}</div>` : ''}</div>`;
}
/** "Introduced here" (on a paper) and "First published in" (on an idea). */
function paperLinks(it) {
  const intro = (it.intro || []).map((d) => G.byId.get(d)).filter(Boolean);
  const by = (G.introducedBy?.get(it.id) || []).map((d) => G.byId.get(d)).filter(Boolean);
  return `${intro.length ? `<h2 style="margin-top:18px">Introduced here <span class="count">${intro.length}</span></h2><div class="chip-list">${intro.map((d) => link(d)).join('')}</div>` : ''}${by.length ? `<h2 style="margin-top:18px">First published in</h2><div class="chip-list">${by.map((d) => link(d)).join('')}</div>` : ''}`;
}

/** One line under an idea's title naming the landmark paper(s) that first put it forward. */
function provenance(it) {
  const by = (G.introducedBy?.get(it.id) || []).map((d) => G.byId.get(d)).filter(Boolean);
  if (!by.length) return '';
  return `<div class="provenance"><span class="eyebrow">First published in</span> ${by.map((p) => `<a href="#/t/${p.id}"><span class="pv-au">${escapeHTML(p.au || '')}${p.yr ? ` ${p.yr}` : ''}</span>, <i>${inlineHTML(p.name)}</i></a>`).join('; ')}</div>`;
}

function lineageBlock(it) {
  return `<div class="card lineage-card">
    <div class="lineage-head"><h2>Lineage</h2>
      <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap"><span class="muted" style="font-size:13px">prerequisites, steps back:</span>
        <div class="seg" id="depth" role="group" aria-label="Prerequisite depth"><button data-d="1">1</button><button data-d="2">2</button><button data-d="3">3</button><button data-d="99">all</button></div>
        <a class="btn" href="#/map?focus=${it.id}">Show on map</a><a class="btn" href="#/path/${it.id}">Plan a path</a></div>
    </div>
    <p class="graph-hint" id="lineage-hint" hidden>Scroll horizontally to explore the graph.</p><div class="lineage-svg-wrap" id="lineage"></div>
  </div>`;
}
function wireLineage(el, it) {
  let depth = 2; try { depth = +(localStorage.getItem('lineageDepth') || 2); } catch { /* ignore */ }
  const drawLineage = () => {
    el.querySelectorAll('#depth button').forEach((b) => { const on = +b.dataset.d === depth; b.classList.toggle('on', on); b.setAttribute('aria-pressed', String(on)); });
    const host = el.querySelector('#lineage');
    renderLineage(host, G, it.id, { depth, onOpen: (x) => go(`#/t/${x.id}`) });
    el.querySelector('#lineage-hint').hidden = host.scrollWidth <= host.clientWidth;
  };
  el.querySelectorAll('#depth button').forEach((b) => b.addEventListener('click', () => { depth = +b.dataset.d; try { localStorage.setItem('lineageDepth', depth); } catch { /* ignore */ } drawLineage(); }));
  drawLineage();
}

async function pagePlanned(it) {
  const isCurrent = viewIsCurrent();
  const C = G.colById.get(it.col); const Ch = chapterOf(it.col, it.c);
  await loadShard(it.col);
  if (!isCurrent()) return;
  setTitle(`${C.short} ${it.num}: ${it.name.replace(/\$/g, '')} (planned)`); setNav('fields'); curCol = it.col;
  const deps = depsOf(it).map((d) => G.byId.get(d)).filter(Boolean);
  const users = (G.allChildren.get(it.id) || []).map((d) => G.byId.get(d));
  const el = h(`<div class="wrap thm-page" data-col="${it.col}">
    <div class="crumbs"><a href="#/">Home</a><span class="sep">/</span><a href="#/c/${it.col}">${escapeHTML(C.short)}</a><span class="sep">/</span><a href="#/c/${it.col}/${it.c}">${chapterLabel(it.col, it.c)} · ${escapeHTML(Ch?.title || '')}</a></div>
    <div class="thm-head"><div class="thm-title"><div class="eyebrow"><span class="col-dot"></span>${escapeHTML(fullLabel(it))} · planned</div><h1>${inlineHTML(it.name)}</h1>${provenance(it)}</div></div>
    ${paperBlock(it)}
    <div class="statement planned-note">This ${it.kind.toLowerCase()} is on the syllabus of <a href="#/c/${it.col}">${escapeHTML(C.title)}</a> but has not been written yet. Its place in the graph is already known.
      ${it.pic ? `<div class="pic-plan"><span class="eyebrow">Planned visualization</span> ${inlineHTML(it.pic)}</div>` : ''}
      ${it.refs ? `<div class="refs-inline">References: ${escapeHTML(it.refs.join(' · '))}</div>` : ''}</div>
    <div class="thm-grid">
      <div class="card panel">
        <h2>Builds on <span class="count">${deps.length}</span></h2>
        <div class="chip-list">${deps.length ? deps.map((d) => link(d)).join('') : '<span class="empty-note">A starting point.</span>'}</div>
        <h2 style="margin-top:18px">Used by <span class="count">${users.length}</span></h2>
        <div class="chip-list">${users.length ? users.map((d) => link(d)).join('') : '<span class="empty-note">Nothing cites it yet.</span>'}</div>
        ${paperLinks(it)}
      </div>
      ${lineageBlock(it)}
    </div>
  </div>`);
  app.replaceChildren(el);
  wireLineage(el, it);
}

async function pageTheorem(id, params = new URLSearchParams()) {
  const isCurrent = viewIsCurrent();
  await ensurePlanned().catch(() => {});
  if (!isCurrent()) return;
  const it = G.byId.get(id); if (!it) return pageNotFound();
  if (it.planned) return await pagePlanned(it);
  const C = G.colById.get(it.col); const Ch = chapterOf(it.col, it.c);
  setTitle(`${C.short} ${fullLabel(it)}: ${it.name.replace(/\$/g, '')}`); setNav('fields'); curCol = it.col;
  await loadShard(it.col);
  if (!isCurrent()) return;
  const same = G.items.filter((x) => x.col === it.col);
  const idx = same.indexOf(it); const prev = same[idx - 1], next = same[idx + 1];
  const deps = it.deps.map((d) => G.byId.get(d)).filter(Boolean);
  const pdeps = (it.pdeps || []).map((d) => G.byId.get(d)).filter(Boolean);
  const users = (G.allChildren.get(it.id) || []).map((d) => G.byId.get(d));
  const see = (it.see || []).map((d) => G.byId.get(d)).filter(Boolean);
  const seeBack = G.items.filter((x) => (x.see || []).includes(it.id) && !see.includes(x));
  const related = [...see, ...seeBack];
  const links = it.links ? Object.entries(it.links).filter(([, u]) => u) : [];
  const el = h(`<div class="wrap thm-page" data-col="${it.col}">
    <div class="crumbs"><a href="#/">Home</a><span class="sep">/</span><a href="#/f/${C.field}">${escapeHTML(G.fieldById.get(C.field).short)}</a><span class="sep">/</span><a href="#/c/${it.col}">${escapeHTML(C.short)}</a><span class="sep">/</span><a href="#/c/${it.col}/${it.c}">${chapterLabel(it.col, it.c)} · ${escapeHTML(Ch?.title || '')}</a></div>
    <div class="thm-head">
      <div class="thm-title"><div class="eyebrow"><span class="col-dot"></span>${escapeHTML(fullLabel(it))}${it.credit ? ` · ${escapeHTML(it.credit)}` : ''}${it.verify ? ' <span class="faint" title="Numbering reconstructed — not yet checked against the source">· number unverified</span>' : ''}</div><h1>${inlineHTML(it.name)}</h1>${provenance(it)}</div>
      <div class="thm-nav">
        ${prev ? `<a class="btn" href="#/t/${prev.id}" aria-label="Previous idea: ${escapeHTML(prev.name)}" title="${escapeHTML(fullLabel(prev))}">← ${displayNum(prev)}</a>` : ''}
        ${next ? `<a class="btn" href="#/t/${next.id}" aria-label="Next idea: ${escapeHTML(next.name)}" title="${escapeHTML(fullLabel(next))}">${displayNum(next)} →</a>` : ''}
      </div>
    </div>
    ${paperBlock(it)}
    <div class="statement">${richHTML(it.st || '')}${it.scope ? `<div class="scope"><span class="eyebrow">Holds when</span> ${inlineHTML(it.scope)}</div>` : ''}</div>
    <div class="thm-grid">
      <div class="card viz-card" ${it.viz ? '' : 'hidden'}><div class="viz-caption" id="caption"></div><div id="viz"><div class="viz-placeholder">Loading visualization…</div></div>
        <details class="viz-share"><summary>Share / embed</summary>
          <p>Includes controls, 2D handles, 3D camera, proof step and a paused animation time. Other edited data and simulation history are included only when this visualization supports sharing them.</p>
          <p class="share-adapters"></p>
          <button class="btn share-create" type="button">Create state link</button>
          <div class="share-output" hidden><label>Link to this state<input class="share-url" readonly aria-label="Link to this visualization state"></label><button class="btn share-copy" type="button">Copy link</button>
          <label>Embed in a course page<textarea class="share-embed" readonly rows="3" aria-label="Embed code for this visualization state"></textarea></label><a class="share-preview" target="_blank" rel="noopener">Preview embed ↗</a></div>
          <p class="share-status" role="status"></p>
        </details></div>
      <div class="side-grid">
        <div class="card panel"><h2>Why it's true</h2><div class="prose" id="idea"><span class="faint">…</span></div>
          ${it.refs || links.length ? `<div class="refs-inline">${it.refs ? `<span class="eyebrow">Read more</span> ${escapeHTML(it.refs.join(' · '))}` : ''}${links.map(([k, u]) => ` · <a href="${escapeHTML(u)}" target="_blank" rel="noopener">${escapeHTML(k)}</a>`).join('')}</div>` : ''}
        </div>
        <div class="card panel">
          <h2>Builds on <span class="count">${deps.length + pdeps.length}</span></h2>
          <div class="chip-list">${deps.length || pdeps.length ? [...deps, ...pdeps].map((d) => link(d)).join('') : '<span class="empty-note">Nothing earlier in the graph — a starting point.</span>'}</div>
          <h2 style="margin-top:18px">Used by <span class="count">${users.length}</span></h2>
          <div class="chip-list">${users.length ? users.map((d) => link(d)).join('') : '<span class="empty-note">No later result in the graph cites it directly.</span>'}</div>
          ${paperLinks(it)}
          ${related.length ? `<h2 style="margin-top:18px">Across the atlas</h2><div class="chip-list">${related.map((d) => link(d)).join('')}</div>` : ''}
          ${bridgesOf(it.id).length ? `<h2 style="margin-top:18px">On the bridge${bridgesOf(it.id).length > 1 ? 's' : ''}</h2><div class="chip-list">${bridgesOf(it.id).map((B) => `<a class="chip" href="#/bridge/${B.slug}"><span class="nm">${escapeHTML(B.title)}</span></a>`).join('')}</div>` : ''}
          <div class="stats-row"><span><b>${it.anc}</b> results in its full ancestry</span><span><b>${it.desc}</b> results rely on it</span><span>depth <b>${it.depth}</b></span></div>
        </div>
      </div>
      ${lineageBlock(it)}
    </div>
    <p class="kbd-hint" style="margin-top:18px">Tip: use ← and → to step through ${escapeHTML(C.short)} in order.</p>
    <a class="embed-attribution" target="_blank" rel="noopener">Ideas, visualized · Open full explanation ↗</a>
  </div>`);
  app.replaceChildren(el);
  const fullURL = new URL(location.href); fullURL.searchParams.delete('embed');
  const fullParams = new URLSearchParams(params); fullParams.delete('embed');
  fullURL.hash = `/t/${encodeURIComponent(id)}${fullParams.size ? `?${fullParams}` : ''}`;
  el.querySelector('.embed-attribution').href = fullURL.href;
  wireLineage(el, it);
  // keyboard prev/next
  const onKey = (e) => {
    if (e.target.closest('input, textarea, select, button, summary, .lineage-svg-wrap, .stage-box, [contenteditable]') || e.metaKey || e.ctrlKey || e.altKey) return;
    if (e.key === 'ArrowLeft' && prev) go(`#/t/${prev.id}`);
    if (e.key === 'ArrowRight' && next) go(`#/t/${next.id}`);
  };
  window.addEventListener('keydown', onKey);
  let destroyViz = null; let alive = true;
  cleanup = () => { alive = false; window.removeEventListener('keydown', onKey); destroyViz?.(); };
  // content module (idea, caption, viz)
  try {
    const full = await loadItem(it);
    if (!alive || !full) return;
    el.querySelector('#idea').innerHTML = richHTML(full.idea || '');
    if (full.viz) {
      el.querySelector('#caption').innerHTML = full.caption ? ICON_HAND + richHTML(full.caption) : '';
      let state = null, stateError = '';
      const status = el.querySelector('.share-status');
      if (params.has('s')) {
        try { const saved = decodeState(params.get('s')); if (saved.item !== id) throw new Error('This saved state belongs to a different idea.'); state = saved; }
        catch (error) { status.textContent = stateError = `Saved state could not be read: ${error.message}`; el.querySelector('.viz-share').open = true; }
      }
      destroyViz = mount(el.querySelector('#viz'), full.viz, { state, onStateError: error => { status.textContent = `Saved state could not be restored: ${error.message}`; el.querySelector('.viz-share').open = true; } });
      if (stateError) { const notice = document.createElement('div'); notice.className = 'viz-state-notice'; notice.setAttribute('role', 'status'); notice.textContent = stateError; el.querySelector('#viz').prepend(notice); }
      const custom = destroyViz.stateInfo().custom;
      el.querySelector('.share-adapters').textContent = custom.length ? `Also includes: ${custom.join(', ')}. Other custom edits and samples are excluded.` : 'Custom graph edits, drawn points, random samples and simulation history are excluded from this link.';
      el.querySelector('.share-create').addEventListener('click', () => {
        try {
          const saved = destroyViz.snapshot(), url = stateURL(location.href, id, saved), embed = stateURL(location.href, id, saved, true);
          el.querySelector('.share-url').value = url;
          el.querySelector('.share-embed').value = `<iframe src="${escapeHTML(embed)}" title="${escapeHTML(it.name.replace(/\$/g, ''))}" width="100%" height="640" loading="lazy" style="border:0"></iframe>`;
          el.querySelector('.share-preview').href = embed; el.querySelector('.share-output').hidden = false;
          status.textContent = 'State link created. Recreate the link after making further changes.';
        } catch (error) { status.textContent = error.message; }
      });
      el.querySelector('.share-copy').addEventListener('click', async () => {
        const input = el.querySelector('.share-url');
        try { await navigator.clipboard.writeText(input.value); status.textContent = 'State link copied.'; }
        catch { input.focus(); input.select(); status.textContent = 'Link selected. Copy it with your keyboard.'; }
      });
    }
  } catch (e) {
    console.error(e);
    el.querySelector('#viz').innerHTML = `<div class="viz-error">Could not load this visualization: ${escapeHTML(e.message)}</div>`;
  }
}

async function pageMap(params) {
  const isCurrent = viewIsCurrent();
  setTitle('Map'); setNav('map'); curCol = null;
  await ensurePlanned().catch(() => {});
  if (!isCurrent()) return;
  const host = document.createElement('div');
  app.replaceChildren(host);
  const q0 = params.get('q') || '';
  let queryVersion = 0;
  const apply = async (q, fit) => {
    const version = ++queryVersion;
    if (!q.trim()) { view.setHighlight(null); history.replaceState(null, '', '#/map'); return; }
    try { await ensureSearch(); }
    catch {
      if (isCurrent() && version === queryVersion) host.querySelector('.map-q-n').textContent = 'Search could not load';
      return;
    }
    if (!isCurrent() || version !== queryVersion) return;
    const R = runSearch(SIDX, q, G, { limit: 1e6 }); view.setHighlight(new Set(R.all.map((it) => it.id)), { fit });
    history.replaceState(null, '', `#/map?q=${encodeURIComponent(q)}`);
  };
  const view = new MapView(host, G, { onOpen: (id) => go(`#/t/${id}`), focus: params.get('focus'), loadShard, onQuery: apply, query: q0 });
  if (q0) apply(q0, true);
  cleanup = () => { view.dead = true; view.destroy(); };
}

// ------------------------------------------------------------ prerequisite planner
const KNOWN_KEY = 'knownIdeas';
function loadKnown() { try { return new Set(JSON.parse(localStorage.getItem(KNOWN_KEY) || '[]')); } catch { return new Set(); } }
function saveKnown(set) { try { localStorage.setItem(KNOWN_KEY, JSON.stringify([...set])); } catch { /* ignore */ } }
/** All prerequisites of `id` (written and planned), in an order where each comes after its own prerequisites. */
function prerequisites(id) {
  const anc = new Set(); const stack = [id];
  while (stack.length) { const x = stack.pop(); for (const d of depsOf(G.byId.get(x))) if (G.byId.has(d) && !anc.has(d)) { anc.add(d); stack.push(d); } }
  const indeg = new Map([...anc].map((x) => [x, depsOf(G.byId.get(x)).filter((d) => anc.has(d)).length]));
  const kids = new Map([...anc].map((x) => [x, []])); for (const x of anc) for (const d of depsOf(G.byId.get(x))) if (anc.has(d)) kids.get(d).push(x);
  const rank = (x) => G.colIdx.get(G.byId.get(x).col) * 1e6 + (G.order.get(x) || 0);
  const ready = [...anc].filter((x) => !indeg.get(x)).sort((a, b) => rank(a) - rank(b)); const out = [];
  while (ready.length) { const x = ready.shift(); out.push(x); for (const k of kids.get(x)) { indeg.set(k, indeg.get(k) - 1); if (!indeg.get(k)) { const r = rank(k); let i = ready.findIndex((y) => rank(y) > r); if (i < 0) i = ready.length; ready.splice(i, 0, k); } } }
  return out;
}
async function pagePath(id) {
  const isCurrent = viewIsCurrent();
  await ensurePlanned().catch(() => {});
  if (!isCurrent()) return;
  const target = G.byId.get(id); if (!target) return pageNotFound();
  setTitle(`Path to ${target.name.replace(/\$/g, '')}`); setNav(''); curCol = null;
  const order = prerequisites(id);
  const known = loadKnown();
  const el = h(`<div class="wrap path-page"><div class="page-head">
    <div class="crumbs"><a href="#/">Home</a><span class="sep">/</span><a href="#/t/${id}">${escapeHTML(colShort(target.col))} ${displayNum(target)}</a><span class="sep">/</span><span>Path</span></div>
    <div class="eyebrow">Prerequisite planner</div>
    <h1>The path to <em>${inlineHTML(target.name)}</em></h1>
    <p class="sub">Everything this ${target.kind.toLowerCase()} rests on, in an order where each idea comes after the ideas it needs. Tick what you already know; the ideas you can learn next are highlighted. Your ticks are saved in this browser.</p>
    <div class="stats-row" id="path-stats"></div>
  </div><div id="path-list"></div></div>`);
  app.replaceChildren(el);
  const draw = () => {
    const frontier = new Set(order.filter((x) => !known.has(x) && depsOf(G.byId.get(x)).every((d) => !G.byId.has(d) || known.has(d))));
    const nk = order.filter((x) => known.has(x)).length;
    el.querySelector('#path-stats').innerHTML = `<span><b>${order.length}</b> prerequisites</span><span><b>${nk}</b> known</span><span><b>${frontier.size}</b> ready to learn next</span><span class="progress" style="--bc:var(--c-accent);width:120px"><span style="width:${order.length ? (100 * nk / order.length).toFixed(1) : 0}%"></span></span>${nk ? '<button class="btn" type="button" data-reset>Clear ticks</button>' : ''}`;
    el.querySelector('[data-reset]')?.addEventListener('click', () => { for (const x of order) known.delete(x); saveKnown(known); draw(); });
    // group consecutive ideas from the same chapter
    const groups = []; for (const x of order) { const it = G.byId.get(x); const k = `${it.col}/${it.c}`; if (!groups.length || groups[groups.length - 1].k !== k) groups.push({ k, its: [] }); groups[groups.length - 1].its.push(it); }
    el.querySelector('#path-list').innerHTML = (order.length ? groups.map((g) => { const [col, c] = g.k.split('/'); const Ch = chapterOf(col, +c); const allKnown = g.its.every((it) => known.has(it.id)); return `<section class="path-group" data-col="${col}"><h3><span class="col-dot"></span>${escapeHTML(colShort(col))} · ${chapterLabel(col, +c)} · ${escapeHTML(Ch?.title || '')}<button class="mark-all" type="button" data-group="${g.its.map((it) => it.id).join(',')}" data-on="${allKnown ? 0 : 1}">${allKnown ? 'unmark all' : 'I know all of these'}</button></h3><ul>${g.its.map((it) => `<li class="${known.has(it.id) ? 'known' : frontier.has(it.id) ? 'next' : ''}${it.planned ? ' planned' : ''}"><label><input type="checkbox" data-id="${it.id}" ${known.has(it.id) ? 'checked' : ''}><span class="num">${displayNum(it)}</span><span class="sr-only">I know ${inlineHTML(it.name)}</span></label><a href="#/t/${it.id}"><span class="kind">${kindAbbr(it.kind)}</span> ${inlineHTML(it.name)}</a>${frontier.has(it.id) ? '<span class="tag">learn next</span>' : ''}${it.planned ? '<span class="tag faint">planned</span>' : ''}</li>`).join('')}</ul></section>`; }).join('') : '<p class="empty-note">Nothing comes before it in the graph: a starting point.</p>')
      + `<section class="path-group target" data-col="${target.col}"><h3><span class="col-dot"></span>Goal</h3><ul><li class="${frontier.size === 0 && order.length ? 'next' : ''}"><span class="num">${displayNum(target)}</span><a href="#/t/${id}"><span class="kind">${kindAbbr(target.kind)}</span> ${inlineHTML(target.name)}</a></li></ul></section>`;
    el.querySelectorAll('#path-list [data-group]').forEach((b) => b.addEventListener('click', () => { for (const x of b.dataset.group.split(',')) { if (b.dataset.on === '1') known.add(x); else known.delete(x); } saveKnown(known); draw(); }));
    el.querySelectorAll('#path-list input[data-id]').forEach((cb) => cb.addEventListener('change', () => { if (cb.checked) known.add(cb.dataset.id); else known.delete(cb.dataset.id); saveKnown(known); draw(); }));
  };
  draw();
}

function bridgesOf(id) { return (G.bridges || []).filter((B) => B.steps.some((st) => st.id === id)); }
function fieldDots(B, lookup = G.byId) {
  const seq = []; for (const st of B.steps) { const it = lookup.get(st.id); const f = it && G.colById.get(it.col)?.field; if (f && seq[seq.length - 1] !== f) seq.push(f); }
  return `<span class="field-path">${seq.map((f) => `<span class="col-dot" style="--bc:var(--f-${f})" title="${escapeHTML(G.fieldById.get(f).title)}"></span>`).join('<span class="fp-sep"></span>')}</span>`;
}
function pageBridges() {
  setTitle('Bridges'); setNav('bridges'); curCol = null;
  app.replaceChildren(h(`<div class="wrap"><div class="page-head">
    <div class="crumbs"><a href="#/">Home</a><span class="sep">/</span><span>Bridges</span></div>
    <h1>Bridges</h1>
    <p class="sub">One idea, followed across collections and fields. Each bridge is a walk through the atlas, from the mathematics where an idea is born to the places it ends up doing work.</p>
  </div>
  <div class="col-grid">${(G.bridges || []).map((B) => `<a class="card bridge-card" href="#/bridge/${B.slug}"><h3>${escapeHTML(B.title)}</h3><div class="sum">${inlineHTML(B.blurb || '')}</div><div class="meta">${fieldDots(B)} ${B.steps.length} steps</div></a>`).join('')}</div></div>`));
}
async function pageBridge(slug) {
  const isCurrent = viewIsCurrent();
  const B = (G.bridges || []).find((x) => x.slug === slug); if (!B) return pageNotFound();
  await ensurePlanned().catch(() => {});
  if (!isCurrent()) return;
  setTitle(B.title); setNav('bridges'); curCol = null;
  await loadShards(B.steps.map((st) => G.byId.get(st.id)?.col).filter(Boolean));
  if (!isCurrent()) return;
  const el = h(`<div class="wrap bridge-page"><div class="page-head">
    <div class="crumbs"><a href="#/">Home</a><span class="sep">/</span><a href="#/bridges">Bridges</a><span class="sep">/</span><span>${escapeHTML(B.title)}</span></div>
    <div class="eyebrow">Bridge · ${B.steps.length} steps ${fieldDots(B)}</div>
    <h1>${escapeHTML(B.title)}</h1>
    <p class="sub">${inlineHTML(B.blurb || '')}</p>
  </div>
  <div class="bridge-picture-host"></div>
  <ol class="journey">${B.steps.map((st, i) => { const it = G.byId.get(st.id); if (!it) return ''; const C = G.colById.get(it.col); const F = G.fieldById.get(C.field); return `<li class="j-step${it.planned ? ' planned' : ''}" data-col="${it.col}" style="--fc:var(--f-${F.id})">
      <div class="j-rail"><span class="j-num">${i + 1}</span></div>
      <a class="card j-card" href="#/t/${it.id}">
        <div class="eyebrow"><span class="col-dot"></span>${escapeHTML(F.short)} · ${escapeHTML(C.short)} · ${escapeHTML(fullLabel(it))}${it.planned ? ' · planned' : ''}</div>
        <div class="nm">${inlineHTML(it.name)}</div>
        <div class="note">${inlineHTML(st.note || '')}</div>
      </a></li>`; }).join('')}</ol></div>`);
  app.replaceChildren(el);
  let alive = true, destroyPicture = null;
  cleanup = () => { alive = false; destroyPicture?.(); };
  try {
    const { mountBridgePicture } = await import('./bridge-viz.js');
    if (!alive) return;
    destroyPicture = mountBridgePicture(el.querySelector('.bridge-picture-host'), slug, id => { const it = G.byId.get(id); return it ? `${colShort(it.col)} ${displayNum(it)} · ${it.name.replace(/\$/g, '')}` : id; });
  } catch (error) { if (alive) el.querySelector('.bridge-picture-host').textContent = `Shared picture could not load: ${error.message}`; }
}

async function pageTimeline(params) {
  const isCurrent = viewIsCurrent();
  setTitle('Timeline'); setNav('timeline'); curCol = null;
  await ensurePlanned().catch(() => {});
  if (!isCurrent()) return;
  const items = [...G.items, ...G.planned].filter((it) => it.yr != null);
  if (!items.length) { app.replaceChildren(h(`<div class="wrap page-head"><h1>Timeline</h1><p class="sub">No dated ideas yet: items gain a place on the timeline when they carry a <code>credit</code> with a year.</p></div>`)); return; }
  const q = params?.get('q') || '';
  const host = document.createElement('div'); app.replaceChildren(host);
  let hl = null;
  if (q) { await ensureSearch(); if (!isCurrent()) return; const R = runSearch(SIDX, q, G, { limit: 1e6 }); hl = new Set(R.all.map((it) => it.id)); }
  const view = new TimelineView(host, G, { items, highlight: hl, what: q ? `dated ideas · highlighting “${escapeHTML(q)}” (${hl.size})` : 'dated ideas and papers (hollow: planned)', onOpen: (id) => go(`#/t/${id}`) });
  cleanup = () => view.destroy();
}

function pageStatus() {
  setTitle('Status'); setNav('status'); curCol = null;
  const tot = G.collections.reduce((s, C) => ({ n: s.n + C.count, p: s.p + C.planned, v: s.v + C.viz }), { n: 0, p: 0, v: 0 });
  const el = h(`<div class="wrap"><div class="page-head">
    <div class="crumbs"><a href="#/">Home</a><span class="sep">/</span><span>Status</span></div>
    <h1>Status of the atlas</h1>
    <p class="sub">Every collection, written and planned. A collection's syllabus is written first, so its ideas appear on the map as faded nodes; then each one is written up with a statement, an explanation and an interactive picture.</p>
    <div class="stats-row"><span><b>${tot.n.toLocaleString('en')}</b> written</span><span><b>${(G.plannedCount ?? tot.p).toLocaleString('en')}</b> planned on syllabi</span><span><b>${tot.v.toLocaleString('en')}</b> visualizations</span><span><b>${G.live.length}</b> / ${G.collections.length} collections live</span></div>
  </div>
  ${G.fields.map((F) => `<section class="status-field" data-field="${F.id}" style="--fc:var(--f-${F.id})"><h2><a href="#/f/${F.id}">${escapeHTML(F.title)}</a></h2>
    <table class="status-table" aria-label="${escapeHTML(F.title)} collection progress"><thead><tr><th>Collection</th><th>Type</th><th class="r" scope="col">Written</th><th class="r" scope="col">Planned</th><th class="r">Viz</th><th>Progress</th></tr></thead><tbody>
    ${fieldCols(F).map((C) => `<tr data-col="${C.id}" class="${C.count ? '' : 'soon'}"><td><a href="#/c/${C.id}"><span class="col-dot"></span><span class="st-title">${escapeHTML(C.title)}</span></a></td><td class="faint">${C.source?.type === 'book' ? 'book' : 'course'}</td><td class="r">${C.count || '–'}</td><td class="r">${C.planned || '–'}</td><td class="r">${C.viz || '–'}</td><td>${progress(C) || '<span class="faint">no syllabus yet</span>'}</td></tr>`).join('')}
    </tbody></table></section>`).join('')}
  </div>`);
  app.replaceChildren(el);
}

function pageAbout() {
  setTitle('About'); setNav('about'); curCol = null;
  const unverified = G.items.filter((it) => it.verify).length;
  app.replaceChildren(h(`<div class="wrap"><div class="page-head about">
    <div class="crumbs"><a href="#/">Home</a><span class="sep">/</span><span>About</span></div>
    <h1>About this atlas</h1>
    <p class="sub">An atlas of the ideas that hold human knowledge together, from the completeness of the real numbers to the circle of fifths, each one something you can see and test.</p>
    <h2>What is here</h2>
    <p>Each idea, whether a theorem, a physical law, an algorithm, an economic model, a phenomenon of perception or an invention, gets its own page. The page has a statement in plain language, an interactive visualization, a short account of why it is true or how it works, and its place in the dependency graph.</p>
    <p>The atlas is organized into <b>fields</b> (mathematics, physics, economics, music and more), each with several <b>collections</b>. Some collections follow a book's numbering, such as Rudin's analysis trilogy or Axler's <i>Linear Algebra Done Right</i>. Others are curated courses built from standard references.</p>
    <h2>Reading the graph</h2>
    <ul>
      <li><b>Builds on</b> lists what an explanation actually uses; <b>used by</b> lists what cites it. Links cross collections and fields: a law of physics can rest on a theorem of analysis.</li>
      <li>The <b>lineage</b> view on each page shows prerequisites a chosen number of steps back (redundant shortcuts are hidden).</li>
      <li>The <a href="#/map">map</a> lays out every collection, field by field. Hover any node to light up its full ancestry (blue) and everything that depends on it (green). Faded nodes are planned but not yet written.</li>
      <li><b>Across the atlas</b> links connect the same idea in its different incarnations.</li>
      <li><a href="#/bridges">Bridges</a> follow one idea across fields, step by step; the <a href="#/timeline">timeline</a> places every dated idea in history; and every page has a <b>plan a path</b> button that lists everything it rests on in learning order.</li>
    </ul>
    <h2>Caveats</h2>
    <p>This is an unofficial study aid, not affiliated with any author or publisher. All statements and explanations are written afresh, in our own words; nothing here replaces the books themselves. Numbering and dependency links were reconstructed and may contain mistakes; ${unverified} items are flagged as “number unverified”. Corrections are very welcome, and the <a href="#/audit">audit list</a> collects every flagged item.</p>
    <h2>How it is built</h2>
    <p>A static site: each chapter is a JavaScript module holding its results and their visualizations, drawn with a small canvas library; KaTeX renders the mathematics. The source is on <a href="https://github.com/Sir-Teo/theorems-visualizations">GitHub</a>.</p>
  </div></div>`));
}

function pageAudit() {
  setTitle('Numbering audit'); setNav('about'); curCol = null;
  const flagged = G.items.filter((it) => it.verify);
  const groups = new Map();
  for (const it of flagged) { const k = `${it.col}/${it.c}`; if (!groups.has(k)) groups.set(k, []); groups.get(k).push(it); }
  app.replaceChildren(h(`<div class="wrap"><div class="page-head">
    <div class="crumbs"><a href="#/">Home</a><span class="sep">/</span><a href="#/about">About</a><span class="sep">/</span><span>Audit</span></div>
    <h1>Numbering audit</h1>
    <p class="sub">${flagged.length} of ${G.items.length} items carry a reconstructed number or kind that has not been checked against the source. If you have the books at hand, these are the ones to look at.</p>
  </div>
  ${[...groups].map(([k, its]) => { const [col, c] = k.split('/'); const Ch = chapterOf(col, +c); return `<section data-col="${col}" style="margin-top:22px"><h2 style="font-size:20px;margin-bottom:10px"><span class="col-dot"></span> ${escapeHTML(colShort(col))} · ${chapterLabel(col, +c)} · ${escapeHTML(Ch?.title || '')} <span class="faint" style="font:500 13px var(--font-mono)">${its.length}</span></h2><div class="chip-list">${its.map((it) => link(it)).join('')}</div></section>`; }).join('')}
  </div>`));
}

function pageNotFound() {
  setTitle('Not found'); setNav('');
  app.replaceChildren(h(`<div class="wrap page-head"><h1>Not found</h1><p class="sub">That page doesn't exist (yet). <a href="#/">Back to the start</a>.</p></div>`));
}

// ------------------------------------------------------------ router
async function route(event) {
  const version = ++routeVersion;
  cleanup?.(); cleanup = null;
  const raw = location.hash.replace(/^#/, '') || '/';
  if (raw === 'fields') { if (location.hash !== '#/') { history.replaceState(null, '', '#/'); await route(); } document.getElementById('fields')?.scrollIntoView(); return; }
  const [path, qs] = raw.split('?');
  const params = new URLSearchParams(qs || '');
  const parts = path.split('/').filter(Boolean);
  document.documentElement.classList.toggle('embed-view', parts[0] === 't' && (new URLSearchParams(location.search).get('embed') === '1' || params.get('embed') === '1'));
  closeSearch();
  app.replaceChildren(h('<div class="loading" role="status">Loading…</div>'));
  // old book routes
  if (parts[0] === 'book' && parts[1]) { location.replace(`#/c/${parts.slice(1).join('/')}`); return; }
  try {
    if (parts.length) { await ensureCatalog(); if (version !== routeVersion) return; }
    if (!parts.length) await pageHome();
    else if (parts[0] === 'f' && parts[1]) pageField(parts[1]);
    else if (parts[0] === 'c' && parts.length === 2) await pageCollection(parts[1]);
    else if (parts[0] === 'c' && parts.length === 3) await pageChapter(parts[1], +parts[2]);
    else if (parts[0] === 't' && parts[1] && G.alias.has(decodeURIComponent(parts[1]))) location.replace(`#/t/${G.alias.get(decodeURIComponent(parts[1]))}${qs ? `?${qs}` : ''}`);
    else if (parts[0] === 't' && parts[1]) await pageTheorem(decodeURIComponent(parts[1]), params);
    else if (parts[0] === 'map') await pageMap(params);
    else if (parts[0] === 'status') pageStatus();
    else if (parts[0] === 'timeline') await pageTimeline(params);
    else if (parts[0] === 'search') await pageSearch(params);
    else if (parts[0] === 'papers') await pagePapers(params);
    else if (parts[0] === 'bridges') pageBridges();
    else if (parts[0] === 'path' && parts[1]) await pagePath(decodeURIComponent(parts[1]));
    else if (parts[0] === 'bridge' && parts[1]) await pageBridge(parts[1]);
    else if (parts[0] === 'about') pageAbout();
    else if (parts[0] === 'audit') pageAudit();
    else pageNotFound();
  } catch (e) {
    if (version !== routeVersion) return;
    console.error(e);
    app.replaceChildren(h(`<div class="wrap page-head"><h1>Something went wrong</h1><p class="sub">${escapeHTML(e.message)}</p></div>`));
  }
  if (version !== routeVersion) return;
  if (parts[0] !== 'map' && parts[0] !== 'timeline') window.scrollTo(0, 0);
  if (event?.type === 'hashchange') {
    const focusTarget = parts[0] === 'search' ? app.querySelector('.search-big input') : app;
    focusTarget?.focus({ preventScroll: true });
  }
}

// ------------------------------------------------------------ search
let SIDX = [];
function buildSearch() { SIDX = buildIndex({ G, chapterOf }); }
const searchHref = (q) => `#/search?q=${encodeURIComponent(q)}`;
/** One result row (dropdown and results page share it). */
function resultRow(it, Q, i, sel) {
  const C = G.colById.get(it.col);
  const sub = it.kind === 'Paper' ? `${escapeHTML(it.au || '')}${it.yr != null ? ` · ${it.yr}` : ''}` : `${escapeHTML(fullLabel(it))} · ${escapeHTML(chapterOf(it.col, it.c)?.title || '')}`;
  return `<a href="#/t/${it.id}" class="sr-item${i === sel ? ' sel' : ''}${it.planned ? ' planned' : ''}" data-href="#/t/${it.id}" data-col="${it.col}"><span class="sr-num"><span class="col-dot"></span> ${escapeHTML(C.short)} ${displayNum(it)}</span><span class="sr-name">${highlight(inlineHTML(it.name), Q)}${it.planned ? ' <span class="sr-tag">planned</span>' : ''}${it.kind === 'Paper' ? ' <span class="sr-tag paper">paper</span>' : ''}</span><span class="sr-sub">${sub}</span></a>`;
}
function pageRow(e, Q, i, sel) {
  const [href, label, title] = e.t === 'field' ? [`#/f/${e.F.id}`, 'Field', e.F.title] : e.t === 'col' ? [`#/c/${e.C.id}`, e.C.short, e.C.title] : e.t === 'ch' ? [`#/c/${e.C.id}/${e.Ch.n}`, `${e.C.short} ${chapterLabel(e.C.id, e.Ch.n)}`, e.Ch.title] : [`#/bridge/${e.B.slug}`, 'Bridge', e.B.title];
  return `<a href="${href}" class="sr-item sr-page${i === sel ? ' sel' : ''}" data-href="${href}" ${e.C ? `data-col="${e.C.id}"` : e.F ? `data-field="${e.F.id}"` : ''}><span class="sr-num">${escapeHTML(label)}</span><span class="sr-name">${highlight(escapeHTML(title), Q)}</span><span class="sr-sub">${e.t === 'col' ? escapeHTML(G.fieldById.get(e.C.field)?.short || '') : e.t === 'ch' ? escapeHTML(e.C.title) : ''}</span></a>`;
}
const sInput = document.getElementById('search'), sBox = document.getElementById('search-results');
sInput.setAttribute('role', 'combobox');
sInput.setAttribute('aria-autocomplete', 'list');
sInput.setAttribute('aria-controls', 'search-results');
sInput.setAttribute('aria-expanded', 'false');
let sSel = 0, sHrefs = [];
function renderSearch() {
  const q = sInput.value; if (!q.trim()) { closeSearch(); return; }
  const R = runSearch(SIDX, q, G, { limit: 8 });
  const pages = R.pages.slice(0, 3);
  sHrefs = [...pages.map((e) => null), ...R.items.map((it) => `#/t/${it.id}`), searchHref(q)];
  sSel = Math.min(sSel, sHrefs.length - 1);
  let i = 0;
  const rows = [...pages.map((e) => pageRow(e, R.Q, i++, sSel)), ...R.items.map((it) => resultRow(it, R.Q, i++, sSel))];
  sBox.innerHTML = (rows.length ? rows.join('') : '<div class="sr-item"><span></span><span class="faint">No matches. Try fewer words, or kind:, field:, year:, by:</span></div>')
    + `<a href="${searchHref(q)}" class="sr-item sr-all${i === sSel ? ' sel' : ''}" role="option" data-href="${searchHref(q)}"><span></span><span>${R.total > R.items.length ? `All ${R.total.toLocaleString('en')} results` : 'Open the results page'} · map · timeline →</span></a>`;
  sHrefs = [...sBox.querySelectorAll('[data-href]')].map((el) => el.dataset.href);
  sBox.querySelectorAll('[data-href]').forEach((el, index) => { el.id = `search-option-${index}`; el.setAttribute('role', 'option'); el.tabIndex = -1; el.setAttribute('aria-selected', String(index === sSel)); });
  sBox.classList.add('open');
  sInput.setAttribute('aria-expanded', 'true');
  sInput.setAttribute('aria-activedescendant', `search-option-${sSel}`);
}
function closeSearch() { sBox.classList.remove('open'); sInput.setAttribute('aria-expanded', 'false'); sInput.removeAttribute('aria-activedescendant'); sHrefs = []; }
function goSearch(href) { go(href); sInput.value = ''; sInput.blur(); closeSearch(); }
async function updateSearch() {
  const query = sInput.value;
  if (!query.trim()) { closeSearch(); return; }
  if (searchReady) { renderSearch(); return; }
  sHrefs = []; sSel = 0;
  sInput.setAttribute('aria-expanded', 'true'); sInput.removeAttribute('aria-activedescendant');
  sBox.innerHTML = '<div class="sr-item"><span></span><span class="faint">Searching the atlas…</span></div>';
  sBox.classList.add('open');
  try {
    await ensureSearch();
    if (sInput.value === query && document.activeElement === sInput) renderSearch();
  } catch {
    if (sInput.value === query && document.activeElement === sInput) sBox.innerHTML = '<div class="sr-item"><span></span><span class="faint">Search could not load. Try again.</span></div>';
  }
}
sInput.addEventListener('input', () => { sSel = 0; updateSearch(); });
sInput.addEventListener('focus', updateSearch);
sInput.addEventListener('keydown', (e) => {
  if (!searchReady && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) { e.preventDefault(); return; }
  if (e.key === 'ArrowDown') { sSel = Math.min(sHrefs.length - 1, sSel + 1); renderSearch(); sBox.querySelector('.sel')?.scrollIntoView({ block: 'nearest' }); e.preventDefault(); }
  else if (e.key === 'ArrowUp') { sSel = Math.max(0, sSel - 1); renderSearch(); sBox.querySelector('.sel')?.scrollIntoView({ block: 'nearest' }); e.preventDefault(); }
  else if (e.key === 'Enter') { const href = (e.metaKey || e.ctrlKey) ? searchHref(sInput.value) : sHrefs[sSel] || (sInput.value.trim() ? searchHref(sInput.value) : null); if (href) goSearch(href); }
  else if (e.key === 'Escape') { sInput.blur(); closeSearch(); }
});
sInput.addEventListener('blur', closeSearch);
sBox.addEventListener('mousedown', (e) => { const r = e.target.closest('[data-href]'); if (r && e.button === 0 && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey) { e.preventDefault(); goSearch(r.dataset.href); } });
document.addEventListener('click', (e) => { if (!e.target.closest('.search')) closeSearch(); });
window.addEventListener('keydown', (e) => { if (e.key === '/' && !e.metaKey && !e.ctrlKey && !e.altKey && !e.target.closest('input, textarea, select, [contenteditable]')) { e.preventDefault(); sInput.focus(); } });

/** Full results page: facets, results, and the matches shown on the map and timeline. */
async function pageSearch(params) {
  const isCurrent = viewIsCurrent();
  const q = params.get('q') || '';
  if (q.trim()) await ensureSearch();
  else await ensurePlanned();
  if (!isCurrent()) return;
  buildSearch();
  setTitle(q ? `Search: ${q}` : 'Search'); setNav(''); curCol = null;
  const R = runSearch(SIDX, q, G, { limit: 100000 });
  const facet = (title, counts, key, label) => { const es = Object.entries(counts).filter(([, n]) => n).sort((a, b) => b[1] - a[1]); return es.length ? `<div class="facet"><div class="eyebrow">${title}</div>${es.map(([k, n]) => `<a class="facet-row" href="${searchHref(`${q} ${key}:${k}`.trim())}"${key === 'field' ? ` data-field="${k}"` : ''}><span>${key === 'field' ? `<span class="col-dot" style="--bc:var(--f-${k})"></span>` : ''}${escapeHTML(label(k))}</span><b>${n.toLocaleString('en')}</b></a>`).join('')}</div>` : ''; };
  const PAGE = 60; let shown = 0;
  const el = h(`<div class="wrap search-page">
    <div class="page-head"><h1>Search</h1>
      <form class="search-big" role="search"><input type="search" name="q" value="${escapeHTML(q)}" placeholder="entropy · kind:paper field:physics · year:1900-1950 · by:noether · is:planned" aria-label="Search the atlas" autofocus><button class="btn" type="submit">Search</button></form>
      <details class="search-help"><summary>Search tips &amp; filters</summary><p>Words match names and descriptions (prefix, one typo allowed). Filters: <code>kind:theorem</code> <code>field:biology</code> <code>col:mech</code> <code>year:1900-1950</code> <code>year:&lt;1700</code> <code>by:shannon</code> <code>is:planned</code> <code>is:paper</code> <code>"exact phrase"</code></p></details>
      ${q ? `<div class="stats-row"><span><b>${R.total.toLocaleString('en')}</b> ideas</span><span><b>${R.facets.status.written.toLocaleString('en')}</b> written</span><span><b>${R.facets.status.planned.toLocaleString('en')}</b> planned</span>${R.total ? `<a class="btn" href="#/map?q=${encodeURIComponent(q)}">Show on the map</a><a class="btn" href="#/timeline?q=${encodeURIComponent(q)}">Show on the timeline</a>` : ''}</div>` : ''}
    </div>
    ${q ? `<div class="search-layout${!R.total ? ' no-results' : ''}">
      <details class="facet-panel card" ${!R.total ? 'hidden' : ''} ${matchMedia('(min-width: 761px)').matches ? 'open' : ''}><summary>Refine results</summary><aside class="facets">${facet('Field', R.facets.field, 'field', (k) => G.fieldById.get(k)?.short || k)}${facet('Kind', R.facets.kind, 'kind', (k) => k)}${facet('Status', R.facets.status, 'is', (k) => k)}</aside></details>
      <div>
        ${R.pages.length ? `<div class="sr-list sr-pages">${R.pages.map((e, i) => pageRow(e, R.Q, i, -1)).join('')}</div>` : ''}
        <div class="sr-list" id="sr-list"></div>
        <div style="margin-top:14px" id="sr-more"></div>
        ${!R.total && !R.pages.length ? '<p class="empty-note">Nothing matches. Try fewer words, a shorter prefix, or remove a filter.</p>' : ''}
      </div></div>` : ''}
  </div>`);
  app.replaceChildren(el);
  el.querySelector('form').addEventListener('submit', (e) => { e.preventDefault(); go(searchHref(new FormData(e.target).get('q'))); });
  const list = el.querySelector('#sr-list'), more = el.querySelector('#sr-more');
  const showMore = () => {
    const next = R.all.slice(shown, shown + PAGE); shown += next.length;
    list.insertAdjacentHTML('beforeend', next.map((it) => resultRow(it, R.Q, -1, -2)).join(''));
    more.innerHTML = shown < R.all.length ? `<button class="btn" type="button">Show ${Math.min(PAGE, R.all.length - shown)} more (${(R.all.length - shown).toLocaleString('en')} left)</button>` : '';
    more.querySelector('button')?.addEventListener('click', showMore);
  };
  if (list) showMore();
}

/** Landmark papers across all fields: timeline strip + lists by field. */
async function pagePapers(params) {
  const isCurrent = viewIsCurrent();
  await ensurePlanned().catch(() => {});
  if (!isCurrent()) return;
  setTitle('Landmark papers'); setNav('papers'); curCol = null;
  const papers = [...G.items, ...G.planned].filter((it) => it.kind === 'Paper').sort((a, b) => (a.yr ?? 9999) - (b.yr ?? 9999) || a.name.localeCompare(b.name));
  const fieldOf = (it) => G.colById.get(it.col)?.field;
  const introNames = (p) => (p.intro || []).map((id) => G.byId.get(G.alias?.get(id) || id)).filter(Boolean);
  // one normalized haystack per paper: title, authors, year, collection and the ideas it introduced
  const hay = new Map(papers.map((p) => [p.id, norm([p.name, p.au, p.yr, G.colById.get(p.col)?.short, G.colById.get(p.col)?.title, ...introNames(p).map((x) => x.name)].join(' '))]));
  const state = { field: params.get('field') || '', q: params.get('q') || '', by: params.get('by') === 'era' ? 'era' : 'field' };
  const byField = G.fields.map((F) => ({ F, n: papers.filter((p) => fieldOf(p) === F.id).length })).filter((x) => x.n);
  const ERAS = [[-1e9, 1600, 'Before 1600'], [1600, 1800, '1600–1799'], [1800, 1900, 'The nineteenth century'], [1900, 1945, '1900–1944'], [1945, 1970, '1945–1969'], [1970, 2000, '1970–1999'], [2000, 1e9, 'Since 2000']];
  const el = h(`<div class="wrap">
    <div class="page-head"><h1>Landmark papers</h1>
      <p class="sub">The papers that changed their fields, each linked to the ideas it first put forward and, as they are written, with an interactive recreation of its central result.</p>
      <div class="stats-row"><span><b>${papers.length}</b> papers</span><span><b>${papers.filter((p) => !p.planned).length}</b> written</span><span><b>${byField.length}</b> fields</span></div>
      <div class="chip-list field-chips"><button class="chip" data-field="">All</button>${byField.map(({ F, n }) => `<button class="chip" data-field="${F.id}"><span class="col-dot" style="--bc:var(--f-${F.id})"></span>${escapeHTML(F.short)} <span class="count">${n}</span></button>`).join('')}</div>
      <div class="papers-tools">
        <label class="papers-q"><svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" stroke-width="2"/><path d="M20 20l-4-4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg><input type="search" placeholder="Filter by title, author, year or idea…" aria-label="Filter papers" value="${escapeHTML(state.q)}"></label>
        <div class="seg" role="group" aria-label="Group papers"><button data-by="field">By field</button><button data-by="era">By era</button></div>
        <span class="papers-count muted"></span>
      </div>
    </div>
    ${papers.length ? `<div class="card papers-timeline" id="ptl"></div>` : '<div class="card empty-shelf"><p>The landmark papers are being researched and will appear here shortly.</p></div>'}
    <div class="papers-groups"></div>
  </div>`);
  app.replaceChildren(el);
  const groupsEl = el.querySelector('.papers-groups'), countEl = el.querySelector('.papers-count'), input = el.querySelector('.papers-q input');
  const host = el.querySelector('#ptl');
  let view = null;
  if (host) { view = new TimelineView(host, G, { items: papers, what: 'papers', fit: true, onOpen: (id) => go(`#/t/${id}`) }); cleanup = () => view.destroy(); }
  const row = (p, Q) => {
    const C = G.colById.get(p.col), ideas = introNames(p);
    const intro = ideas.length ? `<div class="pi">introduced ${ideas.slice(0, 3).map((x) => `<span>${highlight(inlineHTML(x.name), Q)}</span>`).join(', ')}${ideas.length > 3 ? ` and ${ideas.length - 3} more` : ''}</div>` : '';
    return `<a class="paper-row${p.planned ? ' planned' : ''}" data-col="${p.col}" href="#/t/${p.id}"><span class="yr">${p.yr ?? ''}</span><span><div class="tt">${highlight(inlineHTML(p.name), Q)}</div><div class="au">${highlight(escapeHTML(p.au || ''), Q)} · ${escapeHTML(C.short)}</div>${intro}</span><span class="st">${p.planned ? 'planned' : '● interactive'}</span></a>`;
  };
  const render = () => {
    const words = norm(state.q).split(/\s+/).filter(Boolean);
    const Q = { words, phrases: [] };
    const shown = papers.filter((p) => (!state.field || fieldOf(p) === state.field) && words.every((w) => hay.get(p.id).includes(w)));
    let groups;
    if (state.by === 'era') groups = ERAS.map(([a, b, t]) => ({ title: t, color: 'var(--ink)', ps: shown.filter((p) => (p.yr ?? 9999) >= a && (p.yr ?? 9999) < b) }));
    else groups = G.fields.map((F) => ({ title: F.title, color: `var(--f-${F.id})`, ps: shown.filter((p) => fieldOf(p) === F.id) }));
    groups = groups.filter((g) => g.ps.length);
    groupsEl.innerHTML = groups.length ? groups.map((g) => `<div class="section-title"><h2 style="color:${g.color}">${escapeHTML(g.title)}</h2><span class="muted">${g.ps.length} paper${g.ps.length === 1 ? '' : 's'}</span></div><div class="papers-list">${g.ps.map((p) => row(p, Q)).join('')}</div>`).join('')
      : `<div class="card empty-shelf"><p>No paper matches “${escapeHTML(state.q)}”. <a href="#/search?q=${encodeURIComponent(state.q)}">Search all ideas instead</a>.</p></div>`;
    countEl.textContent = shown.length === papers.length ? '' : `${shown.length} of ${papers.length}`;
    for (const b of el.querySelectorAll('.field-chips .chip')) { const on = b.dataset.field === state.field; b.classList.toggle('on', on); b.setAttribute('aria-pressed', String(on)); }
    for (const b of el.querySelectorAll('.seg button')) { const on = b.dataset.by === state.by; b.classList.toggle('on', on); b.setAttribute('aria-pressed', String(on)); }
    view?.setHighlight(state.field || words.length ? new Set(shown.map((p) => p.id)) : null);
    const qs = new URLSearchParams(); if (state.field) qs.set('field', state.field); if (state.q) qs.set('q', state.q); if (state.by === 'era') qs.set('by', 'era');
    history.replaceState(null, '', '#/papers' + (qs.toString() ? '?' + qs : ''));
  };
  el.querySelector('.field-chips').addEventListener('click', (e) => { const b = e.target.closest('.chip'); if (!b) return; state.field = b.dataset.field; render(); });
  el.querySelector('.seg').addEventListener('click', (e) => { const b = e.target.closest('button'); if (!b) return; state.by = b.dataset.by; render(); });
  let t = 0; input.addEventListener('input', () => { clearTimeout(t); t = setTimeout(() => { state.q = input.value; render(); }, 120); });
  const dispose = cleanup; cleanup = () => { clearTimeout(t); dispose?.(); };
  render();
}

// ------------------------------------------------------------ theme
function syncThemeButton() {
  const dark = (document.documentElement.dataset.theme || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')) === 'dark';
  const button = document.getElementById('theme-btn');
  button.setAttribute('aria-label', `Switch to ${dark ? 'light' : 'dark'} mode`);
  button.title = button.getAttribute('aria-label');
  const background = getComputedStyle(document.documentElement).getPropertyValue('--bg').trim();
  document.querySelectorAll('meta[name="theme-color"]').forEach((meta) => { meta.content = background; });
  button.innerHTML = dark
    ? '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5"/></svg>'
    : '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round" aria-hidden="true"><path d="M20.5 13A8.5 8.5 0 0 1 11 3.5 8.5 8.5 0 1 0 20.5 13Z"/></svg>';
}
function applyTheme(t) {
  if (t) document.documentElement.dataset.theme = t; else delete document.documentElement.dataset.theme;
  syncThemeButton();
  resetColors(); window.dispatchEvent(new Event('themechange'));
}
document.getElementById('theme-btn').addEventListener('click', () => {
  const cur = document.documentElement.dataset.theme || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  const t = cur === 'dark' ? 'light' : 'dark';
  try { localStorage.setItem('theme', t); } catch { /* ignore */ }
  applyTheme(t);
});
matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => { if (!document.documentElement.dataset.theme) applyTheme(null); });
syncThemeButton();

// ------------------------------------------------------------ boot
(async () => {
  try { await loadCatalog(); }
  catch (e) { app.innerHTML = `<div class="wrap page-head"><h1>Could not load the catalog</h1><p class="sub">${escapeHTML(e.message)} — run <code>npm run build</code> first.</p></div>`; return; }
  window.addEventListener('hashchange', route);
  route();
})();
