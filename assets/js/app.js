// Single-page app: hash router, pages, search, theme.
import { mount, richHTML, inlineHTML, escapeHTML, resetColors } from './viz/core.js';
import { renderLineage, renderChapterGraph, renderFlow, MapView, fullLabel, displayNum, kindAbbr } from './graph.js';

const app = document.getElementById('app');
const BOOK_INFO = {
  pma: { blurb: 'The classic first course in rigorous analysis: the real numbers and their completeness, metric-space topology, sequences and series, continuity, differentiation, the Riemann–Stieltjes integral, uniform convergence, special functions, calculus in several variables and differential forms, and a first look at Lebesgue theory.' },
  rca: { blurb: 'Measure and integration done abstractly, L^p and Hilbert spaces, Banach-space techniques, complex measures, differentiation and Fourier analysis — then a full course in complex analysis, from Cauchy’s theorem through conformal mapping and H^p spaces to Banach algebras.' },
  fa: { blurb: 'Topological vector spaces and the great theorems built on completeness and convexity — Baire, Banach–Steinhaus, open mapping, Hahn–Banach, Krein–Milman — then distributions, Fourier transforms and PDE, Tauberian theory, and spectral theory in Banach algebras and on Hilbert space.' },
};
const BOOK_SHORT = { pma: 'PMA', rca: 'RCA', fa: 'FA' };
let G = null;           // graph state built from the catalog
let cleanup = null;     // teardown for the current page
const modCache = new Map();

// ------------------------------------------------------------ data
async function loadCatalog() {
  const res = await fetch('data/catalog.json', { cache: 'no-cache' });
  const cat = await res.json();
  const byId = new Map(cat.items.map((it) => [it.id, it]));
  const children = new Map(cat.items.map((it) => [it.id, []]));
  for (const it of cat.items) for (const d of it.deps) children.get(d)?.push(it.id);
  const order = new Map(cat.items.map((it, i) => [it.id, i]));
  const bookIdx = { pma: 0, rca: 1, fa: 2 };
  G = { ...cat, byId, children, order, bookIdx };
  G.edgeCount = cat.items.reduce((s, it) => s + it.deps.length, 0);
  buildSearch();
}
const chapterOf = (b, c) => G.books.find((B) => B.id === b)?.chapters.find((C) => C.n === c);
const chapterLabel = (b, c) => (b === 'rca' && c === 0 ? 'Prologue' : `Chapter ${c}`);
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
const link = (it, cls = 'chip') => `<a class="${cls}" data-book="${it.b}" href="#/t/${it.id}" title="${escapeHTML(fullLabel(it))}"><span class="book-dot"></span><span class="num">${it.b !== curBook ? BOOK_SHORT[it.b] + ' ' : ''}${displayNum(it)}</span><span class="nm">${inlineHTML(it.name)}</span></a>`;
let curBook = null;
function setTitle(t) { document.title = t ? `${t} · Rudin, Visualized` : 'Rudin, Visualized — every theorem, illustrated'; }
function setNav(key) { document.querySelectorAll('[data-nav]').forEach((a) => a.classList.toggle('on', a.dataset.nav === key)); }
const go = (hash) => { location.hash = hash; };
const ICON_HAND = '<svg width="15" height="15" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 11V5.5a1.5 1.5 0 0 1 3 0V11m0-1.5a1.5 1.5 0 0 1 3 0V11m0-.5a1.5 1.5 0 0 1 3 0V15a6 6 0 0 1-6 6h-.6a6 6 0 0 1-4.8-2.4L4.2 15a1.6 1.6 0 0 1 2.5-2L9 15" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>';

// ------------------------------------------------------------ pages
function pageHome() {
  setTitle(''); setNav(''); curBook = null;
  const nViz = G.items.filter((it) => it.viz).length;
  const thms = G.items.filter((it) => it.kind !== 'Definition').length;
  // the longest chain of reasoning in the whole graph
  const deepest = G.items.reduce((a, b) => (b.depth > a.depth ? b : a), G.items[0]);
  const chain = [];
  for (let cur = deepest; cur; ) { chain.unshift(cur); cur = cur.deps.map((d) => G.byId.get(d)).sort((a, b) => b.depth - a.depth)[0]; }
  const cited = (it) => (G.children.get(it.id) || []).length;
  const pillars = G.items.filter((it) => it.kind !== 'Definition').sort((a, b) => cited(b) - cited(a) || b.desc - a.desc).slice(0, 12);
  const el = h(`<div>
    <section class="wrap hero">
      <div class="eyebrow">Principles · Real &amp; Complex · Functional</div>
      <h1>Rudin, <em>visualized.</em></h1>
      <p class="lede">Every theorem in Walter Rudin's three analysis books, each with an interactive picture you can push and pull — and the web of dependencies that carries you from the least-upper-bound property to the spectral theorem.</p>
      <div class="hero-stats">
        <span><b>${thms}</b>theorems &amp; lemmas</span>
        <span><b>${nViz}</b>interactive visualizations</span>
        <span><b>${G.edgeCount}</b>dependency links</span>
        <span><b>${G.books.reduce((s, B) => s + B.chapters.length, 0)}</b>chapters</span>
      </div>
      <div style="display:flex;gap:10px;margin-top:22px;flex-wrap:wrap">
        <a class="btn primary" href="#/map">Explore the dependency map →</a>
        <a class="btn" href="#/book/pma">Start with Baby Rudin</a>
      </div>
    </section>
    <section class="wrap">
      <div class="card flow-card">
        <div class="flow-head"><h2>How the three books build on one another</h2><span class="muted" style="font-size:13px">Each curve: results of one chapter used in another · hover a chapter</span></div>
        <div style="overflow-x:auto" id="flow"></div>
      </div>
    </section>
    ${chain.length > 2 ? `<section class="wrap">
      <div class="section-title"><h2>The longest thread</h2><span class="muted">${chain.length} results, each resting on the one before</span></div>
      <div class="card" style="padding:16px 18px"><div class="chip-list" id="chain"></div></div>
    </section>` : ''}
    <section class="wrap">
      <div class="section-title"><h2>The books</h2></div>
      <div class="books" id="books"></div>
    </section>
    <section class="wrap">
      <div class="section-title"><h2>Workhorses</h2><span class="muted">the results cited most often by later proofs</span></div>
      <div class="featured" id="pillars"></div>
    </section>
  </div>`);
  app.replaceChildren(el);
  renderFlow(el.querySelector('#flow'), G, { onOpenChapter: (b, c) => go(`#/book/${b}/${c}`) });
  const chainEl = el.querySelector('#chain');
  if (chainEl) chainEl.innerHTML = chain.map((it) => link(it)).join('<span class="faint" aria-hidden="true">→</span>');
  const books = el.querySelector('#books');
  for (const B of G.books) {
    const n = B.chapters.reduce((s, C) => s + C.count, 0);
    books.append(h(`<div class="card book-card" data-book="${B.id}">
      <div class="eyebrow">${B.nick}</div>
      <h2><a href="#/book/${B.id}">${B.title}</a></h2>
      <div class="ed">${B.edition} · ${n} results</div>
      <p class="desc">${escapeHTML(BOOK_INFO[B.id].blurb)}</p>
      <ul class="ch-list">${B.chapters.map((C) => `<li><a href="#/book/${B.id}/${C.n}"><span class="n">${C.n}</span><span class="t">${escapeHTML(C.title)}</span><span class="c">${C.count}</span></a></li>`).join('')}</ul>
    </div>`));
  }
  const pil = el.querySelector('#pillars');
  for (const it of pillars) pil.append(h(`<a class="card feat" data-book="${it.b}" href="#/t/${it.id}"><span class="eyebrow"><span class="book-dot"></span>${BOOK_SHORT[it.b]} · ${escapeHTML(fullLabel(it))}</span><span class="nm">${inlineHTML(it.name)}</span><span class="why">cited directly by ${cited(it)} results · ${it.desc} depend on it</span></a>`));
}

function pageBook(b) {
  const B = G.books.find((x) => x.id === b); if (!B) return pageNotFound();
  setTitle(B.title); setNav(b); curBook = b;
  const n = B.chapters.reduce((s, C) => s + C.count, 0);
  const el = h(`<div class="wrap" data-book="${b}">
    <div class="page-head">
      <div class="crumbs"><a href="#/">Home</a><span class="sep">/</span><span>${B.short}</span></div>
      <div class="eyebrow" style="color:var(--bc)">${B.nick} · ${B.edition}</div>
      <h1>${B.title}</h1>
      <p class="sub">${escapeHTML(BOOK_INFO[b].blurb)}</p>
      <div class="stats-row"><span><b>${B.chapters.length}</b> chapters</span><span><b>${n}</b> results</span></div>
    </div>
    <div class="chapters-grid">${B.chapters.map((C) => `<a class="card ch-card" href="#/book/${b}/${C.n}">
      <span class="eyebrow">${chapterLabel(b, C.n)}</span><h3>${escapeHTML(C.title)}</h3>
      <div class="sum">${inlineHTML(C.summary || '')}</div>
      <div class="meta">${C.count} results · ${C.viz} visualizations</div></a>`).join('')}</div>
    <div class="card flow-card" style="margin-top:22px">
      <div class="flow-head"><h2>Inside the book</h2><span class="muted" style="font-size:13px">arcs: results of one chapter used in a later one</span></div>
      <div style="overflow-x:auto" id="flow"></div>
    </div>
  </div>`);
  app.replaceChildren(el);
  renderFlow(el.querySelector('#flow'), G, { books: [b], onOpenChapter: (bb, c) => go(`#/book/${bb}/${c}`) });
}

function pageChapter(b, c) {
  const B = G.books.find((x) => x.id === b); const C = chapterOf(b, c); if (!B || !C) return pageNotFound();
  setTitle(`${B.short} ${chapterLabel(b, c)}: ${C.title}`); setNav(b); curBook = b;
  const items = G.items.filter((it) => it.b === b && it.c === c);
  const prev = B.chapters[B.chapters.indexOf(C) - 1], next = B.chapters[B.chapters.indexOf(C) + 1];
  const extDeps = new Set(); for (const it of items) for (const d of it.deps) if (!items.some((x) => x.id === d)) extDeps.add(d);
  const el = h(`<div class="wrap" data-book="${b}">
    <div class="page-head">
      <div class="crumbs"><a href="#/">Home</a><span class="sep">/</span><a href="#/book/${b}">${B.short}</a><span class="sep">/</span><span>${chapterLabel(b, c)}</span></div>
      <div class="thm-head">
        <div><div class="eyebrow" style="color:var(--bc)">${B.short} · ${chapterLabel(b, c)}</div><h1>${escapeHTML(C.title)}</h1></div>
        <div class="thm-nav">${prev ? `<a class="btn" href="#/book/${b}/${prev.n}" title="${escapeHTML(prev.title)}">← ${prev.n}</a>` : ''}${next ? `<a class="btn" href="#/book/${b}/${next.n}" title="${escapeHTML(next.title)}">${next.n} →</a>` : ''}</div>
      </div>
      <p class="sub">${inlineHTML(C.summary || '')}</p>
      <div class="stats-row"><span><b>${items.length}</b> results</span><span><b>${items.filter((i) => i.viz).length}</b> visualizations</span><span><b>${extDeps.size}</b> results used from earlier chapters</span></div>
    </div>
    <div class="card ch-graph-card">
      <div class="cg-head"><h2 style="font-size:21px">Dependency graph</h2><span class="legend-row"><span><svg width="22" height="8"><line x1="0" y1="4" x2="22" y2="4" stroke="var(--ink-3)" stroke-width="1.6"/></svg>within the chapter</span><span><svg width="22" height="8"><line x1="0" y1="4" x2="22" y2="4" stroke="var(--bc)" stroke-width="1.6" stroke-dasharray="4 3"/></svg>from earlier chapters</span><span><svg width="22" height="12"><rect x="1" y="1" width="20" height="10" rx="3" fill="none" stroke="var(--bc)" stroke-dasharray="3 2"/></svg>definition</span></span></div>
      <div class="lineage-svg-wrap" id="cg"></div>
    </div>
    <div class="thm-list">${items.map((it) => `<a class="card thm-card" data-book="${b}" href="#/t/${it.id}">
      <div class="top"><span class="num">${displayNum(it)}</span><span class="kind">${it.kind === 'Corollary' && /[a-z]$/.test(it.num) ? 'Corollary' : it.kind}</span></div>
      <div class="nm">${inlineHTML(it.name)}</div>
      <div class="st">${richHTML(it.st)}</div>
      <div class="foot"><span>builds on ${it.deps.length}</span><span>used by ${(G.children.get(it.id) || []).length}</span>${it.viz ? '<span>● interactive</span>' : ''}</div>
    </a>`).join('')}</div>
  </div>`);
  app.replaceChildren(el);
  renderChapterGraph(el.querySelector('#cg'), G, b, c, { onOpen: (it) => go(`#/t/${it.id}`), onOpenChapter: (bb, cc) => go(`#/book/${bb}/${cc}`) });
}

async function pageTheorem(id) {
  const it = G.byId.get(id); if (!it) return pageNotFound();
  const B = G.books.find((x) => x.id === it.b); const C = chapterOf(it.b, it.c);
  setTitle(`${B.short} ${fullLabel(it)}: ${it.name.replace(/\$/g, '')}`); setNav(it.b); curBook = it.b;
  const sameBook = G.items.filter((x) => x.b === it.b);
  const idx = sameBook.indexOf(it); const prev = sameBook[idx - 1], next = sameBook[idx + 1];
  const deps = it.deps.map((d) => G.byId.get(d)).filter(Boolean);
  const users = (G.children.get(it.id) || []).map((d) => G.byId.get(d));
  const see = (it.see || []).map((d) => G.byId.get(d)).filter(Boolean);
  const seeBack = G.items.filter((x) => (x.see || []).includes(it.id) && !see.includes(x));
  const related = [...see, ...seeBack];
  const el = h(`<div class="wrap thm-page" data-book="${it.b}">
    <div class="crumbs"><a href="#/">Home</a><span class="sep">/</span><a href="#/book/${it.b}">${B.short}</a><span class="sep">/</span><a href="#/book/${it.b}/${it.c}">${chapterLabel(it.b, it.c)} · ${escapeHTML(C.title)}</a></div>
    <div class="thm-head">
      <div class="thm-title"><div class="eyebrow"><span class="book-dot"></span>${escapeHTML(fullLabel(it))}${it.verify ? ' <span class="faint" title="Numbering reconstructed — not yet checked against the book">· number unverified</span>' : ''}</div><h1>${inlineHTML(it.name)}</h1></div>
      <div class="thm-nav">
        ${prev ? `<a class="btn" href="#/t/${prev.id}" title="${escapeHTML(fullLabel(prev))}">← ${displayNum(prev)}</a>` : ''}
        ${next ? `<a class="btn" href="#/t/${next.id}" title="${escapeHTML(fullLabel(next))}">${displayNum(next)} →</a>` : ''}
      </div>
    </div>
    <div class="statement">${richHTML(it.st)}</div>
    <div class="thm-grid">
      <div class="card viz-card" ${it.viz ? '' : 'hidden'}><div class="viz-caption" id="caption"></div><div id="viz"><div class="viz-placeholder">Loading visualization…</div></div></div>
      <div class="side-grid">
        <div class="card panel"><h2>Why it's true</h2><div class="prose" id="idea"><span class="faint">…</span></div></div>
        <div class="card panel">
          <h2>Builds on <span class="count">${deps.length}</span></h2>
          <div class="chip-list">${deps.length ? deps.map((d) => link(d)).join('') : '<span class="empty-note">Nothing earlier in the graph — a starting point.</span>'}</div>
          <h2 style="margin-top:18px">Used by <span class="count">${users.length}</span></h2>
          <div class="chip-list">${users.length ? users.map((d) => link(d)).join('') : '<span class="empty-note">No later result in the graph cites it directly.</span>'}</div>
          ${related.length ? `<h2 style="margin-top:18px">Across the books</h2><div class="chip-list">${related.map((d) => link(d)).join('')}</div>` : ''}
          <div class="stats-row"><span><b>${it.anc}</b> results in its full ancestry</span><span><b>${it.desc}</b> results rely on it</span><span>depth <b>${it.depth}</b></span></div>
        </div>
      </div>
      <div class="card lineage-card">
        <div class="lineage-head"><h2>Lineage</h2>
          <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap"><span class="muted" style="font-size:13px">prerequisites, steps back:</span>
            <div class="seg" id="depth"><button data-d="1">1</button><button data-d="2">2</button><button data-d="3">3</button><button data-d="99">all</button></div>
            <a class="btn" href="#/map?focus=${it.id}">Show on map</a></div>
        </div>
        <div class="lineage-svg-wrap" id="lineage"></div>
      </div>
    </div>
    <p class="kbd-hint" style="margin-top:18px">Tip: use ← and → to step through ${B.short} in order.</p>
  </div>`);
  app.replaceChildren(el);
  // lineage
  let depth = 2; try { depth = +(localStorage.getItem('lineageDepth') || 2); } catch { /* ignore */ }
  const drawLineage = () => {
    el.querySelectorAll('#depth button').forEach((b) => b.classList.toggle('on', +b.dataset.d === depth));
    renderLineage(el.querySelector('#lineage'), G, it.id, { depth, onOpen: (x) => go(`#/t/${x.id}`) });
  };
  el.querySelectorAll('#depth button').forEach((b) => b.addEventListener('click', () => { depth = +b.dataset.d; try { localStorage.setItem('lineageDepth', depth); } catch { /* ignore */ } drawLineage(); }));
  drawLineage();
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
  setTitle('Dependency map'); setNav('map'); curBook = null;
  const host = document.createElement('div');
  app.replaceChildren(host);
  const view = new MapView(host, G, { onOpen: (id) => go(`#/t/${id}`), focus: params.get('focus') });
  cleanup = () => view.destroy();
}

function pageAbout() {
  setTitle('About'); setNav('about'); curBook = null;
  const unverified = G.items.filter((it) => it.verify).length;
  app.replaceChildren(h(`<div class="wrap"><div class="page-head about">
    <div class="crumbs"><a href="#/">Home</a><span class="sep">/</span><span>About</span></div>
    <h1>About this atlas</h1>
    <p class="sub">A visual companion to Walter Rudin's <i>Principles of Mathematical Analysis</i> (3rd ed.), <i>Real and Complex Analysis</i> (3rd ed.) and <i>Functional Analysis</i> (2nd ed.).</p>
    <h2>What is here</h2>
    <p>Every numbered theorem, lemma, corollary and proposition, plus the key definitions they rest on, gets its own page: a statement in plain mathematical language, an interactive visualization, a short account of why it is true, and its place in the dependency graph.</p>
    <h2>Reading the graph</h2>
    <ul>
      <li><b>Builds on</b> lists the results a proof actually uses; <b>used by</b> lists the results that cite it.</li>
      <li>The <b>lineage</b> view on each theorem page shows prerequisites a chosen number of steps back (redundant shortcuts are hidden).</li>
      <li>The <a href="#/map">map</a> lays out all three books left to right, chapter by chapter. Hover any node to light up its full ancestry (blue) and everything that depends on it (green).</li>
      <li><b>Across the books</b> links connect the same idea in its different incarnations — Baire's theorem in RCA and FA, Hahn–Banach for normed spaces and for locally convex spaces.</li>
    </ul>
    <h2>Caveats</h2>
    <p>This is an unofficial study aid, not affiliated with the author or publisher. All statements and explanations are written afresh, in our own words; nothing here replaces the books themselves. Theorem numbers and dependency links were reconstructed and may contain mistakes — ${unverified} items are explicitly flagged as “number unverified”. Corrections are very welcome — the <a href="#/audit">audit list</a> collects every flagged item.</p>
    <h2>How it is built</h2>
    <p>A static site: each chapter is a JavaScript module holding its results and their visualizations, drawn with a small canvas library; KaTeX renders the mathematics. The source is on <a href="https://github.com/Sir-Teo/theorems-visualizations">GitHub</a>.</p>
  </div></div>`));
}

function pageAudit() {
  setTitle('Numbering audit'); setNav('about'); curBook = null;
  const flagged = G.items.filter((it) => it.verify);
  const groups = new Map();
  for (const it of flagged) { const k = `${it.b}/${it.c}`; if (!groups.has(k)) groups.set(k, []); groups.get(k).push(it); }
  app.replaceChildren(h(`<div class="wrap"><div class="page-head">
    <div class="crumbs"><a href="#/">Home</a><span class="sep">/</span><a href="#/about">About</a><span class="sep">/</span><span>Audit</span></div>
    <h1>Numbering audit</h1>
    <p class="sub">${flagged.length} of ${G.items.length} items carry a reconstructed number or kind that has not been checked against the printed book. If you have the books at hand, these are the ones to look at.</p>
  </div>
  ${[...groups].map(([k, its]) => { const [b, c] = k.split('/'); const C = chapterOf(b, +c); return `<section data-book="${b}" style="margin-top:22px"><h2 style="font-size:20px;margin-bottom:10px"><span class="book-dot"></span> ${BOOK_SHORT[b]} · ${chapterLabel(b, +c)} · ${escapeHTML(C?.title || '')} <span class="faint" style="font:500 13px var(--font-mono)">${its.length}</span></h2><div class="chip-list">${its.map((it) => link(it)).join('')}</div></section>`; }).join('')}
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
  const [path, qs] = raw.split('?');
  const params = new URLSearchParams(qs || '');
  const parts = path.split('/').filter(Boolean);
  closeSearch();
  try {
    if (!parts.length) pageHome();
    else if (parts[0] === 'book' && parts.length === 2) pageBook(parts[1]);
    else if (parts[0] === 'book' && parts.length === 3) pageChapter(parts[1], +parts[2]);
    else if (parts[0] === 't' && parts[1]) await pageTheorem(decodeURIComponent(parts[1]));
    else if (parts[0] === 'map') pageMap(params);
    else if (parts[0] === 'about') pageAbout();
    else if (parts[0] === 'audit') pageAudit();
    else pageNotFound();
  } catch (e) {
    console.error(e);
    app.replaceChildren(h(`<div class="wrap page-head"><h1>Something went wrong</h1><p class="sub">${escapeHTML(e.message)}</p></div>`));
  }
  if (parts[0] !== 'map') window.scrollTo(0, 0);
}

// ------------------------------------------------------------ search
let SIDX = [];
const plain = (s) => (s || '').replace(/\$[^$]*\$/g, ' ').replace(/[\\{}^_]/g, ' ').toLowerCase();
function buildSearch() {
  SIDX = G.items.map((it) => ({ it, num: it.num, name: plain(it.name) + ' ' + it.name.toLowerCase(), body: `${plain(it.st)} ${(it.tags || []).join(' ')} ${it.kind.toLowerCase()} ${BOOK_SHORT[it.b].toLowerCase()}` }));
}
function search(q) {
  q = q.trim().toLowerCase(); if (!q) return [];
  const toks = q.split(/\s+/).filter(Boolean);
  const bookTok = toks.find((t) => ['pma', 'rca', 'fa'].includes(t));
  const numTok = toks.find((t) => /^\d+\.\d+[a-z]?$/.test(t));
  const words = toks.filter((t) => t !== bookTok && t !== numTok);
  const out = [];
  for (const e of SIDX) {
    if (bookTok && e.it.b !== bookTok) continue;
    let s = 0;
    if (numTok) { if (e.num === numTok) s += 100; else if (e.num.startsWith(numTok)) s += 30; else continue; }
    let ok = true;
    for (const w of words) {
      if (e.name.includes(w)) s += e.name.startsWith(w) || e.name.includes(' ' + w) ? 14 : 9;
      else if (e.body.includes(w)) s += 3;
      else { ok = false; break; }
    }
    if (!ok) continue;
    if (!words.length && !numTok && bookTok) s += 1;
    if (s > 0) out.push([s + (e.it.kind === 'Definition' ? 0 : 0.5) + Math.min(2, (e.it.desc || 0) / 40), e.it]);
  }
  return out.sort((a, b) => b[0] - a[0]).slice(0, 14).map((x) => x[1]);
}
const sInput = document.getElementById('search'), sBox = document.getElementById('search-results');
let sSel = 0, sRes = [];
function renderSearch() {
  sRes = search(sInput.value); sSel = Math.min(sSel, Math.max(0, sRes.length - 1));
  if (!sInput.value.trim()) { closeSearch(); return; }
  sBox.innerHTML = sRes.length ? sRes.map((it, i) => `<div class="sr-item${i === sSel ? ' sel' : ''}" role="option" data-id="${it.id}" data-book="${it.b}"><span class="sr-num"><span class="book-dot"></span> ${BOOK_SHORT[it.b]} ${displayNum(it)}</span><span class="sr-name">${inlineHTML(it.name)}</span><span class="sr-sub">${escapeHTML(fullLabel(it))} · ${escapeHTML(chapterOf(it.b, it.c)?.title || '')}</span></div>`).join('') : '<div class="sr-item"><span></span><span class="faint">No matches</span></div>';
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
  catch (e) { app.innerHTML = `<div class="wrap page-head"><h1>Could not load the catalog</h1><p class="sub">${escapeHTML(e.message)}</p></div>`; return; }
  window.addEventListener('hashchange', route);
  route();
})();
