import assert from 'node:assert/strict';
import { chromium } from 'playwright-core';
import { createServer } from '../scripts/serve.mjs';
import { findBrowser } from '../scripts/browser.mjs';
const server = createServer(); await new Promise(r => server.listen(0, r));
const browser = await chromium.launch({ executablePath: findBrowser(), headless: true }), page = await browser.newPage(), errors = [];
page.on('pageerror', e => errors.push(e.message));
await page.route(/\/tools\/harness\.html\?/, async route => {
  const response = await route.fetch(); let body = await response.text();
  body = body.replace("renderRich(document.getElementById('idea'), item.idea || '');", "renderRich(document.getElementById('idea'), item.idea || '');const scope=document.createElement('div');scope.className='prose';scope.style.marginTop='14px';document.getElementById('wrap').append(scope);renderRich(scope,item.scope||'');");
  body = body.replace('stats.stages++;', `stats.stages++;(window.__S||=[]).push(s);const begin=s.begin.bind(s);s.begin=()=>{s.__P=[];s.__D=[];s.__DS=[];s.__RC=[];s.__FT=[];return begin();};for(const[k,list]of[['path','__P'],['dot','__D'],['dots','__DS'],['rect','__RC']]){const f=s[k].bind(s);s[k]=(...a)=>{s[list].push(a);return f(...a);};}const fill=s.ctx.fillText.bind(s.ctx);s.ctx.fillText=(t,x,y,...a)=>{const m=s.ctx.measureText(t);s.__FT.push([String(t),x-m.actualBoundingBoxLeft,y-m.actualBoundingBoxAscent,x+m.actualBoundingBoxRight,y+m.actualBoundingBoxDescent,!!s._clipped]);return fill(t,x,y,...a);};`);
  body = body.replace('return item.viz(v);', `const ro=v.readout.bind(v);v.readout=f=>ro(()=>{window.__R=f();window.__RV=(window.__C||[]).map(c=>c.value);window.__RT=(window.__TG||[]).map(c=>c.value);window.__RS=(window.__SEL||[]).map(c=>c.value);return window.__R;});const slider=v.slider.bind(v);v.slider=(...a)=>{const c=slider(...a);(window.__C||=[]).push(c);return c;};const select=v.select.bind(v);v.select=(...a)=>{const c=select(...a);(window.__SEL||=[]).push(c);return c;};const toggle=v.toggle.bind(v);v.toggle=(...a)=>{const c=toggle(...a);(window.__TG||=[]).push(c);return c;};return item.viz(v);`);
  await route.fulfill({ response, body });
});
const near = (a, b, t = 1e-9) => assert.ok(Math.abs(a - b) <= t * Math.max(1, Math.abs(b)), `${a} != ${b}`);
async function done() { await page.waitForFunction(() => JSON.stringify(window.__RT)===JSON.stringify((window.__TG||[]).map(c=>c.value)) && JSON.stringify(window.__RV) === JSON.stringify((window.__C||[]).map(c => c.value)) && JSON.stringify(window.__RS) === JSON.stringify((window.__SEL || []).map(c => c.value))); }
async function load(id, theme, width) {
  await page.setViewportSize({ width, height: 1600 });
  await page.goto(`http://localhost:${server.address().port}/tools/harness.html?file=content/phil/ch04.js&id=phil-${id}&theme=${theme}&w=${width - 50}&still=1&wait=150`);
  await page.waitForFunction(() => window.__done); const d = await page.evaluate(() => window.__done);
  assert.deepEqual(d.errors, []); assert.deepEqual(d.texErrors, []); assert.deepEqual(d.blank, []); await done();
}
async function mode(name) { await page.getByRole('button', { name, exact: true }).click(); await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))); await done(); }
async function snapshot() {
  const a = await page.evaluate(() => ({ r: window.__R, audit: window.__audit, values: (window.__C||[]).map(c => c.value), modes: (window.__SEL || []).map(c => c.value), toggles:(window.__TG||[]).map(c=>c.value), e: window.__vizErrors || [], tex: document.querySelectorAll('.katex-error').length, overflow: [...document.querySelectorAll('.katex-display')].filter(e => e.scrollWidth > e.clientWidth + 1).map(e => e.textContent), pageOverflow: document.documentElement.scrollWidth > innerWidth + 1,
    S: window.__S.map(s => ({ visible: s.el.style.display !== 'none', w: s.width, h: s.height, b: s.bounds, paths: s.__P, dots: [...s.__D, ...s.__DS.flatMap(([ps,o])=>ps.map(([x,y])=>[x,y,o]))], rect: s.__RC, text: s.__FT, pb: [s.X(s.bounds.x[0]), s.Y(s.bounds.y[1]), s.X(s.bounds.x[1]), s.Y(s.bounds.y[0])], pp: s.__P.map(([pts,o={}]) => ({r:(o.width??2)/2,pts:pts.map(p => p && [s.X(p[0]), s.Y(p[1])])})), glyph: [...s.__D.map(([x,y,o={}])=>[s.X(x),s.Y(y),(o.r??4)+(o.hollow?(o.width??1.8)/2:o.ring!==false&&(o.r??4)>=3?.75:0)]),...s.__DS.flatMap(([ps,o={}])=>ps.map(([x,y])=>[s.X(x),s.Y(y),o.r??2.5]))], rr:s.__RC.map(([x,y,X,Y,o={}])=>[s.X(x),s.Y(y),s.X(X),s.Y(Y),o.stroke===false?0:(o.width??2)/2]) })) }));
  assert.deepEqual(a.e, []); assert.deepEqual(a.overflow, []); assert.equal(a.tex, 0); assert.equal(a.pageOverflow, false); assert.doesNotMatch(a.r, /NaN|Infinity|undefined|\\n/);
  for (const s of a.S.filter(s => s.visible)) {
    for (const {pts,r} of s.pp) for (const p of pts) if (p) { assert.ok(p.every(Number.isFinite)); assert.ok(p[0]-r >= s.pb[0] - 1e-7 && p[0]+r <= s.pb[2] + 1e-7 && p[1]-r >= s.pb[1] - 1e-7 && p[1]+r <= s.pb[3] + 1e-7, 'complete plotted paths'); }
    for (const [x, y, X, Y] of s.rect) for (const [u, v] of [[x, y], [X, Y]]) assert.ok(u >= s.b.x[0] - 1e-9 && u <= s.b.x[1] + 1e-9 && v >= s.b.y[0] - 1e-9 && v <= s.b.y[1] + 1e-9, 'complete histogram/model rectangle');
    for(const[x,y,X,Y,r]of s.rr)assert.ok(Math.min(x,X)-r>=s.pb[0]-1e-7&&Math.max(x,X)+r<=s.pb[2]+1e-7&&Math.min(y,Y)-r>=s.pb[1]-1e-7&&Math.max(y,Y)+r<=s.pb[3]+1e-7,'complete rectangle strokes');
    for (const [x, y, r] of s.glyph) assert.ok(x - r >= s.pb[0] && x + r <= s.pb[2] && y - r >= s.pb[1] && y + r <= s.pb[3], 'full marker/ring');
    for (const [t, x, y, X, Y, clipped] of s.text) { assert.ok(x >= -1 && y >= -1 && X <= s.w + 1 && Y <= s.h + 1, `canvas text ${t}`); if (clipped) assert.ok(x - 2 >= s.pb[0] && X + 2 <= s.pb[2] && y - 2 >= s.pb[1] && Y + 2 <= s.pb[3], `text halo ${t}`); }
  }
  return a;
}
await page.route(/\/content\/phil\/ch04\.js$/, async route => {
  const response = await route.fetch();
  const body = (await response.text()).replace('st = model;', 'st = window.__audit = model;');
  await route.fulfill({ response, body });
});
const codes = ['T', 'F', 'N', 'B'], status = [1, 2, 0, 3];
const bits = { 1: [1, 0], 2: [0, 1], 0: [0, 0], 3: [1, 1] };
const domains = { classical: [1, 2], gap: [1, 2, 0], glut: [1, 2, 3], four: [1, 2, 0, 3] };
const operations = { liar: 'object liar ¬T(L)', teller: 'truth-teller T(U)', external: 'external not-true report E' };
const choices = { classical: 'true / false only', gap: 'also neither', glut: 'also both', four: 'neither and both' };
const names = { 1: 'true only', 2: 'false only', 0: 'neither', 3: 'both' };
function reference(operation, domain, enrich) {
  const allowed = domains[domain], compared = operation !== 'external' || enrich;
  const rows = status.map(input => {
    const [t, f] = bits[input];
    const pair = operation === 'liar' ? [f, t] : operation === 'teller' ? [t, f] : t ? [0, 1] : [1, 0];
    const output = status.find(c => bits[c].every((v, i) => v === pair[i]));
    return { input, output, allowed: allowed.includes(input), equal: input === output, bits: [t, f], outputBits: pair, externalNotTrue: t === 0 };
  });
  return { compared, rows, fixed: compared ? rows.filter(r => r.allowed && r.equal).map(r => r.input) : null };
}
async function settle() { await page.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)))); await done(); }
async function toggle(value, keyboard = false) {
  const checkbox = page.getByRole('checkbox', { name: 'add E as a self-applicable object rule', exact: true });
  if ((await checkbox.isChecked()) !== value) {
    if (keyboard) { await checkbox.focus(); await checkbox.press('Space'); }
    else await page.getByText('add E as a self-applicable object rule', { exact: true }).click();
    await settle();
  }
  assert.equal(await checkbox.isChecked(), value);
}
async function check() {
  const a = await snapshot(), q = a.audit, r = reference(q.sentence, q.domain, q.enrich), s = a.S[0];
  assert.equal(a.S.length, 1); assert.deepEqual(a.modes, [q.sentence, q.domain]); assert.deepEqual(a.toggles, [q.enrich]);
  assert.deepEqual(q.rows, r.rows); assert.equal(q.compared, r.compared); assert.deepEqual(q.fixed, r.fixed);
  const controls = await page.evaluate(() => ({
    selection: [...document.querySelectorAll('.ctl-select')].map(el => [...el.querySelectorAll('button')].filter(b => b.getAttribute('aria-pressed') === 'true').map(b => b.textContent)),
    toggleHidden: window.__TG[0].el.hidden,
    toggleDisplay: getComputedStyle(window.__TG[0].el).display,
    checked: document.querySelector('input[type=checkbox]').checked,
  }));
  assert.deepEqual(controls.selection, [[operations[q.sentence]], [choices[q.domain]]]);
  assert.equal(controls.checked, q.enrich); assert.equal(controls.toggleHidden, q.sentence !== 'external');
  assert.equal(controls.toggleDisplay === 'none', q.sentence !== 'external');
  assert.equal(s.rect.length, 4); assert.equal(s.dots.length, 8); assert.equal(s.text.length, 30);
  for (const [i, row] of r.rows.entries()) {
    const y = 8.5 - 2 * i, fixed = r.compared && row.allowed && row.equal;
    const [x, y0, X, Y, rect] = s.rect[i]; near(x, .3); near(X, 11.7); near(y0, y - .67); near(Y, y + .67); assert.equal(rect.fill, fixed ? 'green' : 'faint');
    const inputCode = codes[status.indexOf(row.input)], outputCode = codes[status.indexOf(row.output)];
    const expected = [inputCode, `(${row.bits.join(',')})`, outputCode, `(${row.outputBits.join(',')})`, '→', !row.allowed ? 'excluded' : !r.compared ? 'report' : fixed ? 'fixed' : 'changes'];
    const labels = s.text.slice(4 + i * 6, 10 + i * 6);
    assert.deepEqual(labels.map(t => t[0]), expected);
    for (let n = 0; n < labels.length; n++) for (let m = 0; m < n; m++) {
      const [, l, t, R, b] = labels[n], [, ll, tt, RR, bb] = labels[m];
      assert.ok(R + 1 < ll || RR + 1 < l || b + 1 < tt || bb + 1 < t, `separate row labels: ${expected[n]}, ${expected[m]}`);
    }
    for (const [j, k] of [[0, 1], [1, 3]]) {
      const glyph = s.glyph[2 * i + j], label = labels[k];
      assert.ok(label[1] > glyph[0] + glyph[2] + 2, 'bit pair clears the complete hollow badge');
    }
    assert.ok(a.r.includes(`${inputCode} → ${outputCode}`) === row.allowed, 'readout mappings include exactly permitted statuses');
  }
  if (!r.compared) { assert.match(a.r, /no self-equation is imposed/); assert.doesNotMatch(a.r, /No permitted fixed status/); }
  else if (!r.fixed.length) assert.match(a.r, /No permitted fixed status/);
  else assert.ok(a.r.includes(`Fixed statuses: **${r.fixed.map(x => names[x]).join(', ')}**`));
  if (q.sentence === 'external' && q.enrich) assert.match(a.r, /failure belongs to that explicit enrichment/);
  return a;
}
async function shot(name, width, theme) {
  await page.screenshot({ path: `/tmp/atlas-phil-liar-${name}-${width}-${theme}.png`, fullPage: true });
  await page.locator('.stage').screenshot({ path: `/tmp/atlas-phil-liar-${name}-${width}-${theme}-panel.png` });
}
try {
  for (const theme of ['light', 'dark']) for (const width of [1450, 430]) {
    await load('4.1', theme, width); await check(); await shot('classical', width, theme);
    for (const [operation, label] of Object.entries(operations)) {
      await mode(label);
      for (const [domain, choice] of Object.entries(choices)) {
        await mode(choice);
        if (operation === 'external') {
          for (const enrich of [false, true]) { await toggle(enrich); await check(); }
        } else await check();
      }
    }
    // Exercise native keyboard activation as well as clicks, including state kept while hidden.
    await mode(operations.external); await mode(choices.four); await toggle(false, true); await check(); await shot('external-report', width, theme);
    await toggle(true, true); await check(); await shot('enriched', width, theme);
    for (const operation of ['liar', 'teller']) {
      await page.getByRole('button', { name: operations[operation], exact: true }).press('Enter'); await settle();
      for (const domain of Object.keys(choices)) {
        await page.getByRole('button', { name: choices[domain], exact: true }).press('Space'); await settle();
        const a = await check(); assert.equal(a.audit.enrich, true); assert.equal(a.audit.sentence, operation); assert.equal(a.audit.domain, domain);
      }
    }
    await mode(operations.liar); await mode(choices.gap); await check(); await shot('gap', width, theme);
    await mode(choices.glut); await check(); await shot('glut', width, theme);
    await mode(choices.four); await check(); await shot('four', width, theme);
    console.log(`PASS liar ${width} ${theme}: all operation/domain modes, both explicit external enrichment states, hidden-toggle persistence, native select Enter/Space and checkbox Space; exact row/status/readout agreement, complete 8 hollow badges and 4 rectangle strokes, measured nonoverlapping labels, TeX and page bounds`);
  }
  assert.deepEqual(errors, []);
} catch (e) {
  console.error(e); await page.screenshot({ path: '/tmp/atlas-phil-liar-failure.png', fullPage: true }); throw e;
} finally { await browser.close(); await new Promise(r => server.close(r)); }
