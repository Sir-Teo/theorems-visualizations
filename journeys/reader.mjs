import { createHash } from 'node:crypto';
import { canonicalBase } from '../scripts/static-ideas.mjs';
export const JOURNEY_CODE = ['journeys/reader.mjs', 'journeys/style.css', 'scripts/build-journeys.mjs'];
export const PLAN_FILES = ['docs/journeys/plans.json', 'docs/journeys/sources.json', 'docs/journeys/targets.json', 'docs/journeys/review-evidence.md', 'docs/journeys/review-cloth.md', 'docs/journeys/review-structure.md', 'scripts/check-journey-plans.mjs', 'docs/pilots/sequences/sources.json'];
export const hash = value => createHash('sha256').update(value).digest('hex');
export const json = value => JSON.stringify(value, null, 2) + '\n';
export const researchDigest = data => hash(json({ plans: data.plans, sources: data.sources, targets: data.targets }));
const insist = (ok, message) => { if (!ok) throw new Error(message); };
const text = value => typeof value === 'string' && value.trim().length > 0;
const esc = value => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#39;');
const link = (href, label) => `<a href="${esc(href)}">${esc(label)}</a>`;
const list = xs => '<ul>' + xs.map(x => '<li>' + esc(x) + '</li>').join('') + '</ul>';
const routePath = id => `journeys/${id}/`;
function evidence(ref, readEvidence) {
  insist(/^docs\/(?:releases|verification)\/[a-z0-9/.-]+\.(?:md|json)$/.test(ref?.path || '') && !ref.path.includes('..') && /^[a-f0-9]{64}$/.test(ref.sha256 || ''), 'Unsafe or unbound journey evidence');
  const bytes = readEvidence(ref.path); insist(hash(bytes) === ref.sha256, 'Journey evidence changed'); return bytes;
}
function routeIds(decision, data) {
  const rows = decision?.routes;
  insist(Array.isArray(rows) && rows.length && new Set(rows.map(r => r?.id)).size === rows.length, 'Missing or duplicate journey decisions');
  for (const row of rows) insist(data.plans.routes.some(r => r.id === row?.id) && row.revision === data.plans.version, 'Unknown journey revision');
  return rows.map(r => r.id);
}
function independent(reviewer, data) {
  insist(text(reviewer?.id) && reviewer.id !== data.plans.author && text(reviewer.role) && reviewer.independent === true, 'Independent journey review missing');
}
function authorize(d, data, context, historical = false) {
  const ids = routeIds(d, data);
  insist(d.schemaVersion === 1 && d.decision === 'approve-journey-delivery' && d.researchDigest === researchDigest(data), 'Journey research binding changed');
  insist(/^[a-f0-9]{64}$/.test(d.deliveryDigest || '') && canonicalBase(d.canonicalBase) && (historical || d.deliveryDigest === context.deliveryDigest && d.canonicalBase === context.base), 'Journey delivery or destination binding changed');
  insist(text(d.authorizedBy) && /^\d{4}-\d{2}-\d{2}$/.test(d.authorizedOn || '') && text(d.scope), 'Journey authorization missing');
  const selected = data.plans.routes.filter(r => ids.includes(r.id));
  const sources = [...new Set(selected.flatMap(r => r.steps.flatMap(s => s.sourceIds)))];
  const expected = [...sources, 'original-journey-prose', 'journey-software'].sort();
  insist(Array.isArray(d.materials) && json(d.materials.map(m => m?.id).sort()) === json(expected), 'Journey distribution must cover exact materials');
  for (const m of d.materials) {
    insist(text(m.basis) && text(m.scope) && text(m.territories), 'Journey material scope missing');
    independent(m.reviewer, data); evidence(m.evidence, context.readEvidence);
  }
  insist(Array.isArray(d.reviews) && json(d.reviews.map(r => r?.dimension).sort()) === json(['access', 'content', 'engineering']), 'Journey content, access and engineering decisions required');
  for (const r of d.reviews) { independent(r.reviewer, data); insist(text(r.scope), 'Journey review scope missing'); evidence(r.evidence, context.readEvidence); }
  insist(Array.isArray(d.openChecks) && d.openChecks.every(text), 'Explicit remaining-check disposition required');
  return ids;
}
export function resolveJourneyReleases(ledger, data, context) {
  insist(ledger?.schemaVersion === 1 && Array.isArray(ledger.events), 'Invalid journey release ledger');
  const base = canonicalBase(context.base); insist(base, 'Journey release requires a canonical base'); context = { ...context, base };
  const states = new Map();
  for (const event of ledger.events) {
    insist(['publish', 'withdraw'].includes(event?.type), 'Unknown journey release event');
    const d = JSON.parse(evidence(event.evidence, context.readEvidence)), ids = routeIds(d, data);
    if (event.type === 'publish') {
      authorize(d, data, context, true);
      for (const id of ids) {
        insist(states.get(id)?.state !== 'withdrawn', 'Withdrawn journey needs a new reviewed revision and explicit ledger migration');
        states.set(id, { id, revision: data.plans.version, state: 'published', decision: d });
      }
    } else {
      insist(d.schemaVersion === 1 && d.decision === 'withdraw-journeys' && text(d.authorizedBy) && /^\d{4}-\d{2}-\d{2}$/.test(d.authorizedOn || '') && text(d.reason), 'Journey withdrawal decision missing');
      for (const id of ids) {
        insist(states.get(id)?.state === 'published', 'Journey withdrawal needs a previous release');
        states.set(id, { id, revision: data.plans.version, state: 'withdrawn', reason: d.reason });
      }
    }
  }
  for (const state of states.values()) if (state.state === 'published') authorize(state.decision, data, context);
  return [...states.values()];
}

// A lesson's acceptance and its presence in this output are separate facts.
export function deliveredTargets(targets, { mode, legacyIds, editions }) {
  insist(['preview', 'release'].includes(mode) && editions?.mode === mode && Array.isArray(editions.explorations), 'Journey and edition modes differ');
  insist(new Set(editions.explorations.map(x => x.id)).size === editions.explorations.length, 'Duplicate delivered exploration');
  const allowed = mode === 'preview' ? ['preview'] : ['published', 'withdrawn'];
  for (const row of editions.explorations) {
    insist(allowed.includes(row.state) && Array.isArray(row.versions) && new Set(row.versions.map(v => v.revision)).size === row.versions.length, 'Invalid delivered edition state');
    insist(row.versions.every(v => allowed.includes(v.state) && v.href === `explore/${row.id}/versions/${v.revision}/`), 'Invalid delivered edition path');
  }
  const legacy = new Set(legacyIds), states = new Map();
  for (const t of targets.targets) {
    if (t.kind === 'legacy-accepted') states.set(t.id, legacy.has(t.id) ? 'available' : 'missing');
    else {
      const row = editions.explorations.find(x => x.id === t.id), version = row?.versions.find(v => v.revision === t.revision);
      if (version) insist(version.href === t.href, 'Delivered target differs from pinned edition path');
      states.set(t.id, !version ? 'missing' : version.state === 'withdrawn' ? 'withdrawn' : 'available');
    }
  }
  return states;
}
function shell(title, body, { depth = 1, mode, domainsAvailable = false, canonical = null } = {}) {
  const root = '../'.repeat(depth);
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="${canonical ? 'index,follow' : 'noindex,nofollow'}">${canonical ? `<link rel="canonical" href="${esc(canonical)}">` : ''}<title>${esc(title)} · Knowledge atlas</title><link rel="stylesheet" href="${root}assets/journeys/reader.css"></head><body><a class="skip" href="#main">Skip to content</a><header><a class="brand" href="${root}">Ideas, Visualized</a><span>${mode === 'preview' ? 'Local journey preview' : 'Knowledge atlas'}</span></header><main id="main" tabindex="-1"><nav class="atlas-nav" aria-label="Atlas sections">${link(root + 'ideas/', 'Reading library')}${link(root + 'explore/', 'Exploration editions')}${domainsAvailable ? link(root + 'domains/', 'Fields of knowledge') : ''}${link(root + 'journeys/', 'Cross-field journeys')}</nav>${body}</main><footer>${link(root + 'journeys/about/', 'Sources and review scope')}<p>A route connects questions. It does not establish mastery or replace the evidence needed in each field.</p></footer></body></html>\n`;
}
function sourceCard(source, level = 'h3') {
  return `<section class="source" id="source-${esc(source.id)}"><${level}>${link(source.url, source.title)}</${level}><p class="meta">External source · ${esc(source.creator)} · ${source.access === 'retained-scoped-receipt' ? 'Earlier scoped reading retained' : 'Scoped body reading'} · ${esc(source.readAt)}</p><dl>${['edition', 'locator', 'finding', 'limits', 'reuse'].map(k => `<dt>${esc({ edition: 'Edition or date', locator: 'Reading scope', finding: 'What it supports', limits: 'Limits', reuse: 'Reuse scope' }[k])}</dt><dd>${esc(source[k])}</dd>`).join('')}</dl></section>`;
}
// The source plan names an authoring brief; the delivered reader has its scoped source cards instead.
function readerTask(routeId, step) {
  if (routeId !== 'woven-cloth' || step.id !== 'practice') return step.task;
  const before = 'Use the retained Asare/Dento Mills research brief and, if accessible, its linked pages.';
  insist(step.task.startsWith(before), 'Unknown Asare reader instruction adapter');
  return 'Read the retained source descriptions below and, if accessible, their linked pages.' + step.task.slice(before.length);
}
export function renderJourneys(data, entries, availability, { mode = 'preview', base = null, domains = [] } = {}) {
  insist(['preview', 'release'].includes(mode), 'Unknown journey delivery mode'); base = canonicalBase(base);
  insist(mode === 'preview' ? !base : !!base, 'Preview has no canonical base; release requires one');
  insist(new Set(entries.map(e => e.id)).size === entries.length, 'Duplicate journey state');
  for (const e of entries) insist(data.plans.routes.some(r => r.id === e.id) && e.revision === data.plans.version && (mode === 'preview' ? e.state === 'preview' : ['published', 'withdrawn'].includes(e.state)), 'Unknown journey state or revision');
  const outputs = new Map(), rows = [], canonicalPaths = [], byTarget = new Map(data.targets.targets.map(t => [t.id, t])), bySource = new Map(data.sources.sources.map(s => [s.id, s]));
  if (!entries.length) return { outputs, rows, canonicalPaths, availableCount: 0, retainedCount: 0 };
  const liveDomains = new Map(domains.filter(d => ['preview', 'published'].includes(d.state)).map(d => [d.id, d])), domainsAvailable = domains.length > 0;
  const put = (path, title, body, depth, indexable = false) => {
    const canonical = mode === 'release' && indexable ? base + path : null;
    if (canonical) canonicalPaths.push(path);
    outputs.set(path + 'index.html', shell(title, body, { depth, mode, domainsAvailable, canonical }));
  };
  for (const e of entries) {
    const r = data.plans.routes.find(r => r.id === e.id), path = routePath(r.id);
    insist(r.steps.every(s => /^[a-z][a-z0-9-]*$/.test(s.id)), 'Unsafe journey step anchor');
    if (e.state === 'withdrawn') {
      insist(text(e.reason), 'Journey withdrawal reason missing');
      put(path, 'Withdrawn journey', `<h1>This journey has been withdrawn</h1><p>${esc(e.id)} · ${esc(e.revision)}</p><p>${esc(e.reason)}</p><p>Its identity remains reserved. The previous tasks, sources and lesson links are not included.</p>`, 2);
      rows.push({ id: e.id, revision: e.revision, state: 'withdrawn', href: path }); continue;
    }
    const absent = r.steps.filter(s => s.kind === 'accepted-lesson' && availability.get(s.targetId) !== 'available');
    if (absent.length) {
      insist(absent.every(s => ['missing', 'withdrawn'].includes(availability.get(s.targetId))), 'Unknown target availability');
      // Withhold the complete narrative as well: a route can paraphrase a removed lesson outside its own stop.
      put(path, 'Unavailable journey', `<h1>This journey is unavailable in this build</h1><p>${esc(e.id)} · ${esc(e.revision)}</p><p>${absent.length} required lesson edition${absent.length === 1 ? ' is' : 's are'} missing or withdrawn. The route’s tasks, source details and lesson links are withheld together.</p>`, 2);
      rows.push({ id: e.id, revision: e.revision, state: 'unavailable', href: path, unavailableTargets: absent.map(s => ({ id: s.targetId, state: availability.get(s.targetId) })) }); continue;
    }
    const sourceIds = [...new Set(r.steps.flatMap(s => s.sourceIds))];
    const counts = { lessons: r.steps.filter(s => s.kind === 'accepted-lesson').length, readings: r.steps.filter(s => s.kind === 'external-reading').length, gaps: r.steps.filter(s => s.kind === 'gap').length };
    const stepHTML = r.steps.map((s, i) => {
      const t = s.targetId ? byTarget.get(s.targetId) : null;
      insist(s.kind !== 'accepted-lesson' || t, 'Unknown journey target');
      const sources = s.sourceIds.map(id => { const source = bySource.get(id); insist(source, 'Unknown journey source'); return source; });
      const domainLinks = s.domainIds.filter(id => liveDomains.has(id)).map(id => link('../../domains/' + id + '/', liveDomains.get(id).title));
      const labels = { 'accepted-lesson': t?.kind === 'legacy-accepted' ? 'Existing idea' : mode === 'preview' ? 'Checked local exploration' : 'Exploration edition', 'external-reading': 'External reading', gap: 'Open step · lesson unavailable' };
      const target = t ? `<p class="destination">${link('../../' + t.href, 'Open: ' + t.title)}${t.revision ? ` <span class="meta">Edition ${esc(t.revision)}</span>` : ''}</p>` : '';
      const task = s.kind === 'gap' ? `<p>${esc(s.limit)}</p><p class="meta">This step is not a lesson or a completion requirement you can satisfy here.</p>` : `${target}<p class="entry">${esc(s.entrySupport)}</p><h3>Try this</h3><p>${esc(readerTask(r.id, s))}</p><details><summary>Compare your reasoning</summary><p>${esc(s.check)}</p></details><p class="limit"><strong>Keep this limit in view.</strong> ${esc(s.limit)}</p>${sources.length ? `<h3>Reading sources</h3><ul>${sources.map(x => `<li>${link(x.url, x.title)} · ${link('#source-' + x.id, 'Reading scope')}</li>`).join('')}</ul>` : ''}`;
      const edge = r.transitions[i];
      const transition = edge ? `<aside class="transition"><p class="kicker">${edge.kind === 'analogy' ? 'Analogy' : 'A different question'}</p><p>${esc(edge.reason)}</p><p class="meta">${esc(edge.limit)}</p></aside>` : '';
      return `<section class="step${s.kind === 'gap' ? ' gap' : ''}" id="step-${esc(s.id)}" data-kind="${s.kind}"><p class="kicker">${i + 1} / ${r.steps.length} · ${labels[s.kind]}</p><h2>${esc(s.title)}</h2><p class="question">${esc(s.question)}</p>${task}${domainLinks.length ? `<nav class="field-links" aria-label="Fields for step ${i + 1}">${domainLinks.join('')}</nav>` : ''}</section>${transition}`;
    }).join('');
    put(path, r.title, `<div class="hero"><p class="kicker">Cross-field journey · ${r.steps.length} stops</p><h1>${esc(r.title)}</h1><p class="lead">${esc(r.outcome)}</p><p>${esc(r.scope)}</p><p class="meta">${counts.lessons} lesson links · ${counts.readings} external readings · ${counts.gaps} open steps. No completion or mastery score is recorded.</p></div><div class="journey-layout"><nav class="contents" aria-label="Journey stops"><h2>On this route</h2><ol>${r.steps.map(s => '<li>' + link('#step-' + s.id, s.title) + '</li>').join('')}</ol></nav><div class="journey-body">${stepHTML}<section class="transfer"><h2>Bring the questions together</h2><p>${esc(r.transfer)}</p></section><section><h2>What this route still leaves open</h2>${list(r.gaps)}</section>${sourceIds.length ? `<section class="sources"><h2>Sources and reading limits</h2>${sourceIds.map(id => sourceCard(bySource.get(id))).join('')}</section>` : ''}</div></div>`, 2, true);
    rows.push({ id: r.id, revision: e.revision, state: e.state, href: path, title: r.title, outcome: r.outcome, counts, stops: r.steps.map(s => ({ id: s.id, kind: s.kind, ...(s.targetId ? { targetId: s.targetId, href: byTarget.get(s.targetId).href } : {}), sourceIds: s.sourceIds })) });
  }
  const live = rows.filter(r => ['preview', 'published'].includes(r.state)), inactive = rows.filter(r => !live.includes(r));
  put('journeys/', 'Cross-field journeys', `<div class="hero"><p class="kicker">Follow a question across fields</p><h1>Cross-field journeys</h1><p class="lead">Move between models, observations, records and situated practice. Each stop asks what the evidence can support—and what it leaves open.</p><p>${live.length} available journeys · ${inactive.length} unavailable or withdrawn. These routes reuse existing lessons; they add no lesson count.</p></div><div class="journey-grid">${live.map(r => `<article class="journey-card"><h2>${link(r.href.slice('journeys/'.length), r.title)}</h2><p>${esc(r.outcome)}</p><p class="meta">${r.counts.lessons} lesson links · ${r.counts.readings} external readings · ${r.counts.gaps} open steps</p></article>`).join('')}</div>${inactive.length ? `<section><h2>Unavailable routes</h2><ul>${inactive.map(r => '<li>' + link(r.href.slice('journeys/'.length), r.id + ' · ' + r.state) + '</li>').join('')}</ul></section>` : ''}`, 1, live.length > 0);
  put('journeys/about/', 'Journey sources and review scope', `<h1>Sources and review scope</h1><p>${mode === 'preview' ? 'These are local reader candidates. Current route changes have author checks; earlier scoped AI reviews remain historical. Local acceptance is not public release, professional review or observed learning.' : 'These routes have an exact delivery decision. That decision does not turn an external reading into an atlas lesson or supply missing human evidence.'}</p><h2>Different kinds of stop</h2><p>Lesson links lead to existing reading pages or an exact exploration edition. External readings leave the atlas. An open step has no available lesson and no completion checkbox.</p><h2>Connections have limits</h2><p>An analogy compares a representation while stating what does not transfer. A question shift changes the method or object. Sequence order does not create a prerequisite or prove a claim.</p><h2>Availability and saved work</h2><p>If a required lesson edition is absent or withdrawn, the whole route narrative is withheld. Withdrawn journeys keep only a reserved identity and notice. This reader does not read, write or migrate private notes, selections or completion state.</p><h2>Study depth</h2><p>The short entry explanations support bounded conceptual tasks. Follow each lesson’s prerequisites for its derivation or deeper study. A successful check here does not establish practical, professional or cultural competence.</p><h2>Source scope</h2><p>Available routes expose the exact source date, reading scope, limitations and reuse decision. Retained readings are labeled. No external images, courses or full texts are copied by this reader.</p>`, 2);
  outputs.set('journeys/catalog.json', json({ schemaVersion: 1, planVersion: data.plans.version, mode, journeys: rows, availableCount: live.length, retainedCount: rows.length, newLessons: 0 }));
  return { outputs, rows, canonicalPaths, availableCount: live.length, retainedCount: rows.length };
}
export function attachJourneyNavigation(path, html) {
  const prefix = '../'.repeat(path.split('/').length - 1);
  let before, after;
  if (path === 'index.html') { before = '<a href="explore/">Explore</a>'; after = before + '\n      <a data-journey-entry href="journeys/">Journeys</a>'; }
  else if (['ideas/index.html', 'explore/index.html', 'domains/index.html', 'explore/notebooks/index.html'].includes(path)) { before = '</main>'; after = `<nav data-journey-entry aria-label="Cross-field journeys">${link(prefix + 'journeys/', 'Follow a cross-field journey')}</nav></main>`; }
  else return html;
  insist(!html.includes('data-journey-entry') && html.split(before).length === 2, 'Unknown or repeated journey navigation adapter: ' + path);
  return html.replace(before, after);
}
