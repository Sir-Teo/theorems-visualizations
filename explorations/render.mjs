export const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const list = xs => '<ul>' + xs.map(x => '<li>' + esc(x) + '</li>').join('') + '</ul>';
const labels = { direct: 'Direct statement', inference: 'Interpretation / inference', unsupported: 'Not established by this pair' };
function sourceCards(r) {
  return r.passages.map(p => {
    const s = r.sources.find(x => x.id === p.sourceId);
    return `<article class="source-card" id="passage-${p.id}" data-passage="${p.id}">
      <p class="eyebrow">${esc(s.creator)}</p><h3>${esc(p.title)}</h3>
      <p class="source-form">${{ quotation: 'Quotation', paraphrase: 'Editorial paraphrase', original: 'Original explanation' }[p.form]}</p>
      ${p.form === 'quotation' ? '<blockquote' : '<p class="passage"'} lang="${p.language}">${esc(p.text)}${p.form === 'quotation' ? '</blockquote>' : '</p>'}
      <p><strong>Editorial context:</strong> ${esc(p.context)}</p><details><summary>Source and reuse details</summary>
      <p><a href="${esc(s.url)}">${esc(s.title)}</a></p><p>${esc(s.locator)} · ${esc(s.date)}</p>
      <p>${esc(s.rights.basis)}</p><p class="muted">${esc(s.rights.scope)}</p></details></article>`;
  }).join('');
}
function activity(r) {
  const a = r.activity;
  if (a.type === 'source-comparison') {
    return `<div class="interactive" hidden><label for="task">Choose a claim</label>
      <select id="task">${a.prompts.map(p => `<option value="${p.id}">${esc(p.claim)}</option>`).join('')}</select><p id="current-claim" class="current-claim"></p>
      <div class="control-grid"><div><label for="evidence">Select the most relevant passage</label>
      <select id="evidence"><option value="none">Neither establishes the claim</option>${r.passages.map(p => `<option value="${p.id}">${esc(p.title)}</option>`).join('')}</select></div>
      <div><label for="category">How is the claim supported?</label><select id="category">${Object.entries(labels).map(([k,v]) => `<option value="${k}">${v}</option>`).join('')}</select></div></div>
      <button id="check" class="primary" type="button">Compare with the evidence guide</button>
      <p id="feedback" class="feedback" role="status" aria-live="polite"></p></div>
      <details class="static-guide"><summary>Read every claim and its evidence guide</summary>
      ${a.prompts.map(p => `<section><h3>${esc(p.claim)}</h3><p><strong>${labels[p.answer]}.</strong> ${esc(p.feedback)}</p><p>Evidence: ${p.evidenceIds.map(id => id === 'none' ? 'Neither selected document establishes this claim.' : `<a href="#passage-${id}">${esc(r.passages.find(x => x.id === id).title)}</a>`).join('; ')}</p></section>`).join('')}</details>`;
  }
  return `<div class="interactive" hidden><label for="lens">Choose a reading focus</label>
    <select id="lens">${a.lenses.map(l => `<option value="${l.id}">${esc(l.label)}</option>`).join('')}</select>
    <div id="lens-detail" class="lens-detail" aria-live="polite"></div>
    <label for="category">What kind of note are you writing?</label>
    <select id="category"><option value="observation">An observation about these words</option><option value="interpretation">A possible interpretation</option><option value="needs-language-evidence">A claim needing original-language evidence</option></select></div>
    <details class="static-guide"><summary>Read all three comparison guides</summary>
    ${a.lenses.map(l => `<section><h3>${esc(l.label)}</h3><p>${esc(l.observation)}</p><p>${esc(l.question)}</p>${list(l.readings)}<p>${esc(l.boundary)}</p></section>`).join('')}</details>`;
}
function shell(title, body, depth, script = '') {
  const prefix = '../'.repeat(depth);
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow"><meta name="description" content="Draft source-based explorations for Ideas, Visualized.">
<title>${esc(title)} · Ideas, Visualized</title><link rel="stylesheet" href="${prefix}explorations/style.css"></head>
<body><a class="skip" href="#main">Skip to the exploration</a>
<header class="site-header"><a href="${prefix}#/">Ideas, Visualized</a><span>Exploration workshop</span></header>
${body}<footer><p>Local previews. Review scope and public release are separate.</p><a href="${prefix}docs/master-plan-handoff.md">Editorial status and next work</a></footer>${script}</body></html>\n`;
}
export function renderExploration(r, collectionTitles = {}) {
  if (r.status === 'withdrawn') return shell('Withdrawn preview', `<main id="main" tabindex="-1"><h1>This preview has been withdrawn</h1><p>The identity is reserved. Editorial source files may still retain the former text; this local preview is not a public takedown system.</p><a href="../">Return to the workshop</a></main>`, 3);
  const a = r.activity, prefix = '../../../';
  const status = { draft: 'Draft · independent review pending', 'in-review': 'Under independent review', accepted: 'Reviewed · local preview' }[r.status];
  const body = `<main id="main" tabindex="-1"><nav aria-label="Workshop"><a href="../">← Both pilot explorations</a></nav>
    <section class="hero"><p class="eyebrow">${esc(status)}</p><h1>${esc(r.title)}</h1>
    <p class="subtitle">${esc(r.subtitle)}</p><p class="lede">${esc(r.summary)}</p>
    ${(r.reviewLimitations || []).map(note => `<p class="muted">${esc(note)}</p>`).join('')}
    <p class="scope">${esc(r.scope)}</p><ol class="steps"><li>Read the sources</li><li>Compare the evidence</li><li>Explain a limitation</li></ol></section>
    <section aria-labelledby="source-heading"><div class="section-heading"><span>01</span><h2 id="source-heading">Read closely</h2></div>
    <div class="sources">${sourceCards(r)}</div></section>
    <section class="context"><h2>What this comparison can establish</h2>${list(r.context)}
${r.timeline.length ? '<ol class="timeline">' + r.timeline.map(t => `<li><strong>${esc(t.date)}</strong><span>${esc(t.event)}</span><small>${esc(t.precision)} precision</small></li>`).join('') + '</ol>' : ''}
    </section>
    <section class="activity" aria-labelledby="activity-heading"><div class="section-heading"><span>02</span><h2 id="activity-heading">Make a comparison</h2></div>
    <noscript><p>The source text, comparison guides and transfer task work without JavaScript. Use the guides below and write your notes separately.</p></noscript>
    ${activity(r)}<div class="interactive notes" hidden><label for="notes">Your evidence and explanation</label>
    <textarea id="notes" rows="5" maxlength="1500" aria-describedby="notes-help" placeholder="Name the words, then explain what they support and what they do not."></textarea>
    <p id="notes-help" class="muted">One notebook for this exploration revision, up to 1,500 characters. Notes stay in this browser. Shared links contain selections only. Nothing is sent to a server.</p>
    <p id="save-status" role="status" class="muted"></p>
    <div class="actions"><button id="share" type="button">Copy a link to these selections</button><button id="export" type="button">Export notes</button><button id="previous-notes" type="button" hidden>Export earlier notes</button><button id="reset" type="button">Reset and erase this revision’s notes</button></div>
    <label id="share-label" for="share-url" hidden>Shareable link (notes excluded)</label><input id="share-url" readonly hidden>
    <p id="state-status" role="status"></p></div></section>
    <section class="transfer" aria-labelledby="transfer-heading"><div class="section-heading"><span>03</span><h2 id="transfer-heading">Try the idea elsewhere</h2></div>
    <p>${esc(a.transfer)}</p><details><summary>What a careful explanation includes</summary>${list(a.rubric)}</details>
    <p>There is no automatic score for your written interpretation. Use the guide to inspect your reasoning.</p></section>
    <section class="related"><h2>Connections into the atlas</h2><p>Optional collection routes; these are not prerequisites or independent evidence for this task.</p>
    <div class="actions">${r.relatedCollectionIds.map(id => `<a href="${prefix}#/c/${id}">${esc(collectionTitles[id] || id)}</a>`).join('')}</div></section>
    </main>`;
  const json = JSON.stringify(r).replace(/</g, '\\u003c');
  return shell(r.title, body, 3, `<script id="exploration-data" type="application/json">${json}</script><script type="module" src="../../../explorations/ui.mjs"></script>`);
}
export function renderIndex(records) {
  return shell('Two ways to read evidence', `<main id="main" tabindex="-1"><section class="hero"><p class="eyebrow">New formats · two pilot explorations</p><h1>Two ways to read evidence</h1><p class="lede">Explore what a document establishes and how a translation shapes a reading. These local previews keep their sources and limits in view.</p></section>
    <div class="pilot-grid">${records.map((r,i) => r.status === 'withdrawn' ? `<article class="source-card"><h2><a href="./${r.id}/">Withdrawn preview</a></h2><p>This identity remains reserved.</p></article>` : `<article class="source-card"><p class="eyebrow">0${i+1} · ${r.pilotId === 'P01' ? 'History' : 'Literature'}</p><h2><a href="./${r.id}/">${esc(r.title)} →</a></h2><p>${esc(r.summary)}</p><p class="muted">${r.status === 'accepted' ? 'Reviewed for local preview.' : r.status === 'in-review' ? 'Independent review in progress; local preview only.' : 'Declared independent reviews remain pending.'}</p>${(r.reviewLimitations || []).map(note => `<p class="muted">${esc(note)}</p>`).join('')}</article>`).join('')}</div></main>`, 2);
}
