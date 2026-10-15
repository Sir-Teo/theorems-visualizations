// Single-page app: hash router, pages, search, theme.
import { mount, richHTML, inlineHTML, escapeHTML, resetColors } from './viz/core.js';
import { renderLineage, renderChapterGraph, renderFlow, chapterFlow, collectionFlow, MapView, TimelineView, renderTreemap, fullLabel, displayNum, kindAbbr, setAtlas, colShort, depsOf } from './graph.js';

const app = document.getElementById('app');
const SITE = 'Ideas, Visualized';
let G = null;           // atlas state built from data/index.json
let cleanup = null;     // teardown for the current page
const modCache = new Map();

// ------------------------------------------------------------ data
async function loadCatalog() {
  const res = await fetch('data/index.json', { cache: 'no-cache' });
  const cat = await res.json();
  for (const it of cat.planned) it.planned = true;
  const byId = new Map([...cat.items, ...cat.planned].map((it) => [it.id, it]));
  const children = new Map(cat.items.map((it) => [it.id, []]));
  for (const it of cat.items) for (const d of it.deps) children.get(d)?.push(it.id);
  const allChildren = new Map([...byId.keys()].map((id) => [id, []]));
  for (const it of byId.values()) for (const d of depsOf(it)) allChildren.get(d)?.push(it.id);
  const order = new Map([...cat.items, ...cat.planned].map((it, i) => [it.id, i]));
  const colById = new Map(cat.collections.map((C) => [C.id, C]));
  const colIdx = new Map(cat.collections.map((C, i) => [C.id, i]));
  const fieldById = new Map(cat.fields.map((F) => [F.id, F]));
  G = { ...cat, byId, children, allChildren, order, colById, colIdx, fieldById };
  G.edgeCount = cat.items.reduce((s, it) => s + it.deps.length, 0);
  G.live = cat.collections.filter((C) => C.count);
  setAtlas(G);
  buildSearch();
  buildNav();
  // statements for search: fetch every shard when the browser is idle
  const idle = window.requestIdleCallback || ((f) => setTimeout(f, 1200));
  idle(() => Promise.all(G.live.map((C) => loadShard(C.id))).then(buildSearch).catch(() => {}));
}
const shards = new Map();
/** Per-collection details (statements, refs, …) are lazy-loaded from data/col/<id>.json. */
function loadShard(col) {
  if (!shards.has(col)) {
    shards.set(col, fetch(`data/col/${col}.json`, { cache: 'no-cache' }).then((r) => (r.ok ? r.json() : {})).then((det) => {
      for (const [id, d] of Object.entries(det)) { const it = G.byId.get(id); if (it) Object.assign(it, d); }
    }).catch(() => { shards.delete(col); }));
  }
  return shards.get(col);
}
const loadShards = (cols) => Promise.all([...new Set(cols)].map(loadShard));
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
function setNav(key) { document.querySelectorAll('[data-nav]').forEach((a) => a.classList.toggle('on', a.dataset.nav === key)); }
const go = (hash) => { location.hash = hash; };
const ICON_HAND = '<svg width="15" height="15" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 11V5.5a1.5 1.5 0 0 1 3 0V11m0-1.5a1.5 1.5 0 0 1 3 0V11m0-.5a1.5 1.5 0 0 1 3 0V15a6 6 0 0 1-6 6h-.6a6 6 0 0 1-4.8-2.4L4.2 15a1.6 1.6 0 0 1 2.5-2L9 15" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const plural = (n, w) => `${n} ${w}${n === 1 ? '' : 's'}`;
const fieldCols = (F) => G.collections.filter((C) => C.field === F.id);
const isTheoremLike = (it) => it.kind !== 'Definition';
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
}

// ------------------------------------------------------------ pages
function pageHome() {
  setTitle(''); setNav(''); curCol = null;
  const nViz = G.items.filter((it) => it.viz).length;
  // the longest chain of reasoning in the whole graph
  const deepest = G.items.reduce((a, b) => (b.depth > a.depth ? b : a), G.items[0]);
  const chain = [];
  for (let cur = deepest; cur; ) { chain.unshift(cur); cur = cur.deps.map((d) => G.byId.get(d)).sort((a, b) => b.depth - a.depth)[0]; }
  const cited = (it) => (G.children.get(it.id) || []).length;
  // workhorses: the most-cited results, at most four per collection so every shelf shows up
  const perCol = new Map();
  const pillars = G.items.filter(isTheoremLike).sort((a, b) => cited(b) - cited(a) || b.desc - a.desc).filter((it) => { const n = perCol.get(it.col) || 0; if (n >= 4) return false; perCol.set(it.col, n + 1); return true; }).slice(0, 12);
  const liveFields = G.fields.filter((F) => fieldCols(F).some((C) => C.count));
  const el = h(`<div>
    <section class="wrap hero">
      <div class="eyebrow">Mathematics · Science · Society · Arts · Humanities</div>
      <h1>Ideas, <em>visualized.</em></h1>
      <p class="lede">The load-bearing ideas of human knowledge — theorems and laws, models and mechanisms, inventions and paradoxes — each with an interactive picture you can push and pull, all wired into one web of dependencies.</p>
      <div class="hero-stats">
        <span><b>${G.items.length.toLocaleString('en')}</b>ideas</span>
        <span><b>${nViz.toLocaleString('en')}</b>interactive visualizations</span>
        <span><b>${G.edgeCount.toLocaleString('en')}</b>dependency links</span>
        <span><b>${G.live.length}</b>of ${G.collections.length} collections live</span>
        <span><b>${G.fields.length}</b>fields</span>
      </div>
      <div style="display:flex;gap:10px;margin-top:22px;flex-wrap:wrap">
        <a class="btn primary" href="#/map">Explore the map →</a>
        <a class="btn" href="#fields">Browse the fields</a>
        <a class="btn" href="#/status">What's coming</a>
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
        <div class="flow-head"><h2>How the shelves build on one another</h2><span class="muted" style="font-size:13px">Each curve: results of one part used in another · hover to trace</span></div>
        <div style="overflow-x:auto" id="flow"></div>
      </div>
    </section>
    ${(G.bridges || []).length ? `<section class="wrap">
      <div class="section-title"><h2>Bridges</h2><span class="muted">one idea followed across fields · <a href="#/bridges">all bridges →</a></span></div>
      <div class="col-grid">${G.bridges.slice(0, 6).map((B) => `<a class="card bridge-card" href="#/bridge/${B.slug}"><h3>${escapeHTML(B.title)}</h3><div class="sum">${inlineHTML(B.blurb || '')}</div><div class="meta">${fieldDots(B)} ${B.steps.length} steps</div></a>`).join('')}</div>
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
  // flow: chapters when only a few collections are live, otherwise collections grouped by field
  const live = G.live.map((C) => C.id);
  const flow = live.length <= 4 ? chapterFlow(G, live) : collectionFlow(G, liveFields.map((F) => ({ title: F.title, color: `var(--f-${F.id})`, colIds: fieldCols(F).map((C) => C.id) })), { includePlanned: false });
  renderFlow(el.querySelector('#flow'), { ...flow, onOpen: (R) => go(R.ch != null ? `#/c/${R.col}/${R.ch}` : `#/c/${R.col}`) });
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
    ${F.areas.map((A) => { const ac = cols.filter((C) => C.area === A.id); return ac.length ? `<section class="area"><h2 class="area-title">${escapeHTML(A.title)}</h2><div class="col-grid">${ac.map((C) => `<a class="card col-card ${C.count ? '' : 'soon'}" data-col="${C.id}" href="#/c/${C.id}">
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

function pageCollection(id) {
  const C = G.colById.get(id); if (!C) return pageNotFound();
  const F = G.fieldById.get(C.field);
  setTitle(C.title); setNav('fields'); curCol = id;
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
      <div class="meta">${Ch.count ? `${Ch.count} results · ${Ch.viz} visualizations` : ''}${Ch.planned ? `${Ch.count ? ' · ' : ''}${Ch.planned} planned` : ''}</div></a>`).join('')}</div>`
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
  const C = G.colById.get(col); const Ch = chapterOf(col, c); if (!C || !Ch) return pageNotFound();
  setTitle(`${C.short} ${chapterLabel(col, c)}: ${Ch.title}`); setNav('fields'); curCol = col;
  await loadShard(col);
  const items = G.items.filter((it) => it.col === col && it.c === c);
  const planned = G.planned.filter((it) => it.col === col && it.c === c);
  const idx = C.chapters.indexOf(Ch); const prev = C.chapters[idx - 1], next = C.chapters[idx + 1];
  const extDeps = new Set(); for (const it of items) for (const d of it.deps) if (!items.some((x) => x.id === d)) extDeps.add(d);
  const el = h(`<div class="wrap" data-col="${col}">
    <div class="page-head">
      <div class="crumbs"><a href="#/">Home</a><span class="sep">/</span><a href="#/f/${C.field}">${escapeHTML(G.fieldById.get(C.field).title)}</a><span class="sep">/</span><a href="#/c/${col}">${escapeHTML(C.short)}</a><span class="sep">/</span><span>${chapterLabel(col, c)}</span></div>
      <div class="thm-head">
        <div><div class="eyebrow" style="color:var(--bc)">${escapeHTML(C.short)} · ${chapterLabel(col, c)}</div><h1>${escapeHTML(Ch.title || '')}</h1></div>
        <div class="thm-nav">${prev ? `<a class="btn" href="#/c/${col}/${prev.n}" title="${escapeHTML(prev.title || '')}">← ${prev.n}</a>` : ''}${next ? `<a class="btn" href="#/c/${col}/${next.n}" title="${escapeHTML(next.title || '')}">${next.n} →</a>` : ''}</div>
      </div>
      <p class="sub">${inlineHTML(Ch.summary || '')}</p>
      <div class="stats-row"><span><b>${items.length}</b> results</span><span><b>${items.filter((i) => i.viz).length}</b> visualizations</span>${items.length ? `<span><b>${extDeps.size}</b> results used from elsewhere</span>` : ''}${planned.length ? `<span><b>${planned.length}</b> planned</span>` : ''}</div>
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
  </div>`);
  app.replaceChildren(el);
  if (items.length) renderChapterGraph(el.querySelector('#cg'), G, col, c, { onOpen: (it) => go(`#/t/${it.id}`), onOpenChapter: (cc, n) => go(`#/c/${cc}/${n}`) });
}

function lineageBlock(it) {
  return `<div class="card lineage-card">
    <div class="lineage-head"><h2>Lineage</h2>
      <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap"><span class="muted" style="font-size:13px">prerequisites, steps back:</span>
        <div class="seg" id="depth"><button data-d="1">1</button><button data-d="2">2</button><button data-d="3">3</button><button data-d="99">all</button></div>
        <a class="btn" href="#/map?focus=${it.id}">Show on map</a><a class="btn" href="#/path/${it.id}">Plan a path</a></div>
    </div>
    <div class="lineage-svg-wrap" id="lineage"></div>
  </div>`;
}
function wireLineage(el, it) {
  let depth = 2; try { depth = +(localStorage.getItem('lineageDepth') || 2); } catch { /* ignore */ }
  const drawLineage = () => {
    el.querySelectorAll('#depth button').forEach((b) => b.classList.toggle('on', +b.dataset.d === depth));
    renderLineage(el.querySelector('#lineage'), G, it.id, { depth, onOpen: (x) => go(`#/t/${x.id}`) });
  };
  el.querySelectorAll('#depth button').forEach((b) => b.addEventListener('click', () => { depth = +b.dataset.d; try { localStorage.setItem('lineageDepth', depth); } catch { /* ignore */ } drawLineage(); }));
  drawLineage();
}

async function pagePlanned(it) {
  const C = G.colById.get(it.col); const Ch = chapterOf(it.col, it.c);
  await loadShard(it.col);
  setTitle(`${C.short} ${it.num}: ${it.name.replace(/\$/g, '')} (planned)`); setNav('fields'); curCol = it.col;
  const deps = depsOf(it).map((d) => G.byId.get(d)).filter(Boolean);
  const users = (G.allChildren.get(it.id) || []).map((d) => G.byId.get(d));
  const el = h(`<div class="wrap thm-page" data-col="${it.col}">
    <div class="crumbs"><a href="#/">Home</a><span class="sep">/</span><a href="#/c/${it.col}">${escapeHTML(C.short)}</a><span class="sep">/</span><a href="#/c/${it.col}/${it.c}">${chapterLabel(it.col, it.c)} · ${escapeHTML(Ch?.title || '')}</a></div>
    <div class="thm-head"><div class="thm-title"><div class="eyebrow"><span class="col-dot"></span>${escapeHTML(fullLabel(it))} · planned</div><h1>${inlineHTML(it.name)}</h1></div></div>
    <div class="statement planned-note">This ${it.kind.toLowerCase()} is on the syllabus of <a href="#/c/${it.col}">${escapeHTML(C.title)}</a> but has not been written yet. Its place in the graph is already known.
      ${it.pic ? `<div class="pic-plan"><span class="eyebrow">Planned visualization</span> ${inlineHTML(it.pic)}</div>` : ''}
      ${it.refs ? `<div class="refs-inline">References: ${escapeHTML(it.refs.join(' · '))}</div>` : ''}</div>
    <div class="thm-grid">
      <div class="card panel">
        <h2>Builds on <span class="count">${deps.length}</span></h2>
        <div class="chip-list">${deps.length ? deps.map((d) => link(d)).join('') : '<span class="empty-note">A starting point.</span>'}</div>
        <h2 style="margin-top:18px">Used by <span class="count">${users.length}</span></h2>
        <div class="chip-list">${users.length ? users.map((d) => link(d)).join('') : '<span class="empty-note">Nothing cites it yet.</span>'}</div>
      </div>
      ${lineageBlock(it)}
    </div>
  </div>`);
  app.replaceChildren(el);
  wireLineage(el, it);
}

async function pageTheorem(id) {
  const it = G.byId.get(id); if (!it) return pageNotFound();
  if (it.planned) return await pagePlanned(it);
  const C = G.colById.get(it.col); const Ch = chapterOf(it.col, it.c);
  setTitle(`${C.short} ${fullLabel(it)}: ${it.name.replace(/\$/g, '')}`); setNav('fields'); curCol = it.col;
  await loadShard(it.col);
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
      <div class="thm-title"><div class="eyebrow"><span class="col-dot"></span>${escapeHTML(fullLabel(it))}${it.credit ? ` · ${escapeHTML(it.credit)}` : ''}${it.verify ? ' <span class="faint" title="Numbering reconstructed — not yet checked against the source">· number unverified</span>' : ''}</div><h1>${inlineHTML(it.name)}</h1></div>
      <div class="thm-nav">
        ${prev ? `<a class="btn" href="#/t/${prev.id}" title="${escapeHTML(fullLabel(prev))}">← ${displayNum(prev)}</a>` : ''}
        ${next ? `<a class="btn" href="#/t/${next.id}" title="${escapeHTML(fullLabel(next))}">${displayNum(next)} →</a>` : ''}
      </div>
    </div>
    <div class="statement">${richHTML(it.st || '')}${it.scope ? `<div class="scope"><span class="eyebrow">Holds when</span> ${inlineHTML(it.scope)}</div>` : ''}</div>
    <div class="thm-grid">
      <div class="card viz-card" ${it.viz ? '' : 'hidden'}><div class="viz-caption" id="caption"></div><div id="viz"><div class="viz-placeholder">Loading visualization…</div></div></div>
      <div class="side-grid">
        <div class="card panel"><h2>Why it's true</h2><div class="prose" id="idea"><span class="faint">…</span></div>
          ${it.refs || links.length ? `<div class="refs-inline">${it.refs ? `<span class="eyebrow">Read more</span> ${escapeHTML(it.refs.join(' · '))}` : ''}${links.map(([k, u]) => ` · <a href="${escapeHTML(u)}" target="_blank" rel="noopener">${escapeHTML(k)}</a>`).join('')}</div>` : ''}
        </div>
        <div class="card panel">
          <h2>Builds on <span class="count">${deps.length + pdeps.length}</span></h2>
          <div class="chip-list">${deps.length || pdeps.length ? [...deps, ...pdeps].map((d) => link(d)).join('') : '<span class="empty-note">Nothing earlier in the graph — a starting point.</span>'}</div>
          <h2 style="margin-top:18px">Used by <span class="count">${users.length}</span></h2>
          <div class="chip-list">${users.length ? users.map((d) => link(d)).join('') : '<span class="empty-note">No later result in the graph cites it directly.</span>'}</div>
          ${related.length ? `<h2 style="margin-top:18px">Across the atlas</h2><div class="chip-list">${related.map((d) => link(d)).join('')}</div>` : ''}
          ${bridgesOf(it.id).length ? `<h2 style="margin-top:18px">On the bridge${bridgesOf(it.id).length > 1 ? 's' : ''}</h2><div class="chip-list">${bridgesOf(it.id).map((B) => `<a class="chip" href="#/bridge/${B.slug}"><span class="nm">${escapeHTML(B.title)}</span></a>`).join('')}</div>` : ''}
          <div class="stats-row"><span><b>${it.anc}</b> results in its full ancestry</span><span><b>${it.desc}</b> results rely on it</span><span>depth <b>${it.depth}</b></span></div>
        </div>
      </div>
      ${lineageBlock(it)}
    </div>
    <p class="kbd-hint" style="margin-top:18px">Tip: use ← and → to step through ${escapeHTML(C.short)} in order.</p>
  </div>`);
  app.replaceChildren(el);
  wireLineage(el, it);
  // keyboard prev/next
  const onKey = (e) => {
    if (e.target.closest('input, textarea, [contenteditable]') || e.metaKey || e.ctrlKey || e.altKey) return;
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
      destroyViz = mount(el.querySelector('#viz'), full.viz);
    }
  } catch (e) {
    console.error(e);
    el.querySelector('#viz').innerHTML = `<div class="viz-error">Could not load this visualization: ${escapeHTML(e.message)}</div>`;
  }
}

function pageMap(params) {
  setTitle('Map'); setNav('map'); curCol = null;
  const host = document.createElement('div');
  app.replaceChildren(host);
  const view = new MapView(host, G, { onOpen: (id) => go(`#/t/${id}`), focus: params.get('focus'), loadShard });
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
    el.querySelector('#path-list').innerHTML = (order.length ? groups.map((g) => { const [col, c] = g.k.split('/'); const Ch = chapterOf(col, +c); const allKnown = g.its.every((it) => known.has(it.id)); return `<section class="path-group" data-col="${col}"><h3><span class="col-dot"></span>${escapeHTML(colShort(col))} · ${chapterLabel(col, +c)} · ${escapeHTML(Ch?.title || '')}<button class="mark-all" type="button" data-group="${g.its.map((it) => it.id).join(',')}" data-on="${allKnown ? 0 : 1}">${allKnown ? 'unmark all' : 'I know all of these'}</button></h3><ul>${g.its.map((it) => `<li class="${known.has(it.id) ? 'known' : frontier.has(it.id) ? 'next' : ''}${it.planned ? ' planned' : ''}"><label><input type="checkbox" data-id="${it.id}" ${known.has(it.id) ? 'checked' : ''}><span class="num">${displayNum(it)}</span></label><a href="#/t/${it.id}"><span class="kind">${kindAbbr(it.kind)}</span> ${inlineHTML(it.name)}</a>${frontier.has(it.id) ? '<span class="tag">learn next</span>' : ''}${it.planned ? '<span class="tag faint">planned</span>' : ''}</li>`).join('')}</ul></section>`; }).join('') : '<p class="empty-note">Nothing comes before it in the graph: a starting point.</p>')
      + `<section class="path-group target" data-col="${target.col}"><h3><span class="col-dot"></span>Goal</h3><ul><li class="${frontier.size === 0 && order.length ? 'next' : ''}"><span class="num">${displayNum(target)}</span><a href="#/t/${id}"><span class="kind">${kindAbbr(target.kind)}</span> ${inlineHTML(target.name)}</a></li></ul></section>`;
    el.querySelectorAll('#path-list [data-group]').forEach((b) => b.addEventListener('click', () => { for (const x of b.dataset.group.split(',')) { if (b.dataset.on === '1') known.add(x); else known.delete(x); } saveKnown(known); draw(); }));
    el.querySelectorAll('#path-list input[data-id]').forEach((cb) => cb.addEventListener('change', () => { if (cb.checked) known.add(cb.dataset.id); else known.delete(cb.dataset.id); saveKnown(known); draw(); }));
  };
  draw();
}

function bridgesOf(id) { return (G.bridges || []).filter((B) => B.steps.some((st) => st.id === id)); }
function fieldDots(B) {
  const seq = []; for (const st of B.steps) { const it = G.byId.get(st.id); const f = it && G.colById.get(it.col)?.field; if (f && seq[seq.length - 1] !== f) seq.push(f); }
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
  const B = (G.bridges || []).find((x) => x.slug === slug); if (!B) return pageNotFound();
  setTitle(B.title); setNav('bridges'); curCol = null;
  await loadShards(B.steps.map((st) => G.byId.get(st.id)?.col).filter(Boolean));
  const el = h(`<div class="wrap bridge-page"><div class="page-head">
    <div class="crumbs"><a href="#/">Home</a><span class="sep">/</span><a href="#/bridges">Bridges</a><span class="sep">/</span><span>${escapeHTML(B.title)}</span></div>
    <div class="eyebrow">Bridge · ${B.steps.length} steps ${fieldDots(B)}</div>
    <h1>${escapeHTML(B.title)}</h1>
    <p class="sub">${inlineHTML(B.blurb || '')}</p>
  </div>
  <ol class="journey">${B.steps.map((st, i) => { const it = G.byId.get(st.id); if (!it) return ''; const C = G.colById.get(it.col); const F = G.fieldById.get(C.field); return `<li class="j-step${it.planned ? ' planned' : ''}" data-col="${it.col}" style="--fc:var(--f-${F.id})">
      <div class="j-rail"><span class="j-num">${i + 1}</span></div>
      <a class="card j-card" href="#/t/${it.id}">
        <div class="eyebrow"><span class="col-dot"></span>${escapeHTML(F.short)} · ${escapeHTML(C.short)} · ${escapeHTML(fullLabel(it))}${it.planned ? ' · planned' : ''}</div>
        <div class="nm">${inlineHTML(it.name)}</div>
        <div class="note">${inlineHTML(st.note || '')}</div>
      </a></li>`; }).join('')}</ol></div>`);
  app.replaceChildren(el);
}

function pageTimeline() {
  setTitle('Timeline'); setNav('timeline'); curCol = null;
  const host = document.createElement('div');
  app.replaceChildren(host);
  if (!G.items.some((it) => it.yr != null)) { app.replaceChildren(h(`<div class="wrap page-head"><h1>Timeline</h1><p class="sub">No dated ideas yet: items gain a place on the timeline when they carry a <code>credit</code> with a year.</p></div>`)); return; }
  const view = new TimelineView(host, G, { onOpen: (id) => go(`#/t/${id}`) });
  cleanup = () => view.destroy();
}

function pageStatus() {
  setTitle('Status'); setNav('status'); curCol = null;
  const tot = G.collections.reduce((s, C) => ({ n: s.n + C.count, p: s.p + C.planned, v: s.v + C.viz }), { n: 0, p: 0, v: 0 });
  const el = h(`<div class="wrap"><div class="page-head">
    <div class="crumbs"><a href="#/">Home</a><span class="sep">/</span><span>Status</span></div>
    <h1>Status of the atlas</h1>
    <p class="sub">Every collection, written and planned. A collection's syllabus is written first, so its ideas appear on the map as faded nodes; then each one is written up with a statement, an explanation and an interactive picture.</p>
    <div class="stats-row"><span><b>${tot.n.toLocaleString('en')}</b> written</span><span><b>${tot.p.toLocaleString('en')}</b> planned on syllabi</span><span><b>${tot.v.toLocaleString('en')}</b> visualizations</span><span><b>${G.live.length}</b> / ${G.collections.length} collections live</span></div>
  </div>
  ${G.fields.map((F) => `<section class="status-field" data-field="${F.id}" style="--fc:var(--f-${F.id})"><h2><a href="#/f/${F.id}">${escapeHTML(F.title)}</a></h2>
    <table class="status-table"><thead><tr><th>Collection</th><th>Type</th><th class="r">Written</th><th class="r">Planned</th><th class="r">Viz</th><th>Progress</th></tr></thead><tbody>
    ${fieldCols(F).map((C) => `<tr data-col="${C.id}" class="${C.count ? '' : 'soon'}"><td><a href="#/c/${C.id}"><span class="col-dot"></span>${escapeHTML(C.title)}</a></td><td class="faint">${C.source?.type === 'book' ? 'book' : 'course'}</td><td class="r">${C.count || '–'}</td><td class="r">${C.planned || '–'}</td><td class="r">${C.viz || '–'}</td><td>${progress(C) || '<span class="faint">no syllabus yet</span>'}</td></tr>`).join('')}
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
async function route() {
  cleanup?.(); cleanup = null;
  const raw = location.hash.replace(/^#/, '') || '/';
  if (raw === 'fields') { if (location.hash !== '#/') { history.replaceState(null, '', '#/'); await route(); } document.getElementById('fields')?.scrollIntoView(); return; }
  const [path, qs] = raw.split('?');
  const params = new URLSearchParams(qs || '');
  const parts = path.split('/').filter(Boolean);
  closeSearch();
  // old book routes
  if (parts[0] === 'book' && parts[1]) { location.replace(`#/c/${parts.slice(1).join('/')}`); return; }
  try {
    if (!parts.length) pageHome();
    else if (parts[0] === 'f' && parts[1]) pageField(parts[1]);
    else if (parts[0] === 'c' && parts.length === 2) pageCollection(parts[1]);
    else if (parts[0] === 'c' && parts.length === 3) await pageChapter(parts[1], +parts[2]);
    else if (parts[0] === 't' && parts[1]) await pageTheorem(decodeURIComponent(parts[1]));
    else if (parts[0] === 'map') pageMap(params);
    else if (parts[0] === 'status') pageStatus();
    else if (parts[0] === 'timeline') pageTimeline();
    else if (parts[0] === 'bridges') pageBridges();
    else if (parts[0] === 'path' && parts[1]) await pagePath(decodeURIComponent(parts[1]));
    else if (parts[0] === 'bridge' && parts[1]) await pageBridge(parts[1]);
    else if (parts[0] === 'about') pageAbout();
    else if (parts[0] === 'audit') pageAudit();
    else pageNotFound();
  } catch (e) {
    console.error(e);
    app.replaceChildren(h(`<div class="wrap page-head"><h1>Something went wrong</h1><p class="sub">${escapeHTML(e.message)}</p></div>`));
  }
  if (parts[0] !== 'map' && parts[0] !== 'timeline') window.scrollTo(0, 0);
}

// ------------------------------------------------------------ search
let SIDX = [];
const plain = (s) => (s || '').replace(/\$[^$]*\$/g, ' ').replace(/[\\{}^_]/g, ' ').toLowerCase();
function buildSearch() {
  SIDX = G.items.map((it) => {
    const C = G.colById.get(it.col);
    return { it, num: it.num, name: plain(it.name) + ' ' + it.name.toLowerCase(), body: `${plain(it.st)} ${(it.tags || []).join(' ')} ${it.kind.toLowerCase()} ${C.short.toLowerCase()} ${C.title.toLowerCase()} ${it.credit ? it.credit.toLowerCase() : ''}` };
  });
}
function search(q) {
  q = q.trim().toLowerCase(); if (!q) return [];
  const toks = q.split(/\s+/).filter(Boolean);
  const colTok = toks.find((t) => G.colById.has(t) || G.collections.some((C) => C.short.toLowerCase() === t));
  const colId = colTok && (G.colById.has(colTok) ? colTok : G.collections.find((C) => C.short.toLowerCase() === colTok).id);
  const fieldTok = toks.find((t) => t !== colTok && (G.fieldById.has(t.replace(/:$/, '')) || G.fields.some((F) => F.short.toLowerCase() === t.replace(/:$/, ''))));
  const fieldId = fieldTok && (G.fieldById.get(fieldTok.replace(/:$/, ''))?.id || G.fields.find((F) => F.short.toLowerCase() === fieldTok.replace(/:$/, '')).id);
  const numTok = toks.find((t) => /^\d+(\.\d+){1,2}[a-z]?$/.test(t));
  const words = toks.filter((t) => t !== colTok && t !== fieldTok && t !== numTok);
  const out = [];
  for (const e of SIDX) {
    if (colId && e.it.col !== colId) continue;
    if (fieldId && G.colById.get(e.it.col).field !== fieldId) continue;
    let s = 0;
    if (numTok) { if (e.num === numTok) s += 100; else if (e.num.startsWith(numTok)) s += 30; else continue; }
    let ok = true;
    for (const w of words) {
      if (e.name.includes(w)) s += e.name.startsWith(w) || e.name.includes(' ' + w) ? 14 : 9;
      else if (e.body.includes(w)) s += 3;
      else { ok = false; break; }
    }
    if (!ok) continue;
    if (!words.length && !numTok && (colId || fieldId)) s += 1;
    if (s > 0) out.push([s + (e.it.kind === 'Definition' ? 0 : 0.5) + Math.min(2, (e.it.desc || 0) / 40), e.it]);
  }
  return out.sort((a, b) => b[0] - a[0]).slice(0, 14).map((x) => x[1]);
}
const sInput = document.getElementById('search'), sBox = document.getElementById('search-results');
let sSel = 0, sRes = [];
function renderSearch() {
  sRes = search(sInput.value); sSel = Math.min(sSel, Math.max(0, sRes.length - 1));
  if (!sInput.value.trim()) { closeSearch(); return; }
  sBox.innerHTML = sRes.length ? sRes.map((it, i) => `<div class="sr-item${i === sSel ? ' sel' : ''}" role="option" data-id="${it.id}" data-col="${it.col}"><span class="sr-num"><span class="col-dot"></span> ${escapeHTML(colShort(it.col))} ${displayNum(it)}</span><span class="sr-name">${inlineHTML(it.name)}</span><span class="sr-sub">${escapeHTML(fullLabel(it))} · ${escapeHTML(chapterOf(it.col, it.c)?.title || '')}</span></div>`).join('') : '<div class="sr-item"><span></span><span class="faint">No matches</span></div>';
  sBox.classList.add('open');
}
function closeSearch() { sBox.classList.remove('open'); }
sInput.addEventListener('input', () => { sSel = 0; renderSearch(); });
sInput.addEventListener('focus', () => { if (sInput.value.trim()) renderSearch(); });
sInput.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowDown') { sSel = Math.min(sRes.length - 1, sSel + 1); renderSearch(); e.preventDefault(); }
  else if (e.key === 'ArrowUp') { sSel = Math.max(0, sSel - 1); renderSearch(); e.preventDefault(); }
  else if (e.key === 'Enter' && sRes[sSel]) { go(`#/t/${sRes[sSel].id}`); sInput.value = ''; sInput.blur(); closeSearch(); }
  else if (e.key === 'Escape') { sInput.blur(); closeSearch(); }
});
sBox.addEventListener('mousedown', (e) => { const r = e.target.closest('[data-id]'); if (r) { e.preventDefault(); go(`#/t/${r.dataset.id}`); sInput.value = ''; sInput.blur(); closeSearch(); } });
document.addEventListener('click', (e) => { if (!e.target.closest('.search')) closeSearch(); });
window.addEventListener('keydown', (e) => { if (e.key === '/' && !e.target.closest('input, textarea')) { e.preventDefault(); sInput.focus(); } });

// ------------------------------------------------------------ theme
function applyTheme(t) {
  if (t) document.documentElement.dataset.theme = t; else delete document.documentElement.dataset.theme;
  resetColors(); window.dispatchEvent(new Event('themechange'));
}
document.getElementById('theme-btn').addEventListener('click', () => {
  const cur = document.documentElement.dataset.theme || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  const t = cur === 'dark' ? 'light' : 'dark';
  try { localStorage.setItem('theme', t); } catch { /* ignore */ }
  applyTheme(t);
});
matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => { if (!document.documentElement.dataset.theme) applyTheme(null); });

// ------------------------------------------------------------ boot
(async () => {
  try { await loadCatalog(); }
  catch (e) { app.innerHTML = `<div class="wrap page-head"><h1>Could not load the catalog</h1><p class="sub">${escapeHTML(e.message)} — run <code>npm run build</code> first.</p></div>`; return; }
  window.addEventListener('hashchange', route);
  route();
})();
