import assert from 'node:assert/strict';
import { chromium } from 'playwright-core';
import { createServer } from '../scripts/serve.mjs';
import { findBrowser } from '../scripts/browser.mjs';
import { daily, data, rng } from '../content/fin/ch05.shared.js';
import { dailyCalendar } from '../content/fin/source-audit-daily-calendar.js';
const server = createServer(); await new Promise(r => server.listen(0, r));
const browser = await chromium.launch({ executablePath: findBrowser(), headless: true }), page = await browser.newPage(), errors = [];
page.on('pageerror', e => errors.push(e.message));
await page.route(/\/tools\/harness\.html\?/, async route => {
  const response = await route.fetch(); let body = await response.text();
  body = body.replace('stats.stages++;', `stats.stages++;(window.__S||=[]).push(s);const begin=s.begin.bind(s);s.begin=()=>{s.__P=[];s.__D=[];s.__RC=[];s.__FT=[];return begin();};for(const[k,list]of[['path','__P'],['dot','__D'],['rect','__RC']]){const f=s[k].bind(s);s[k]=(...a)=>{s[list].push(a);return f(...a);};}const fill=s.ctx.fillText.bind(s.ctx);s.ctx.fillText=(t,x,y,...a)=>{const m=s.ctx.measureText(t);s.__FT.push([String(t),x-m.actualBoundingBoxLeft,y-m.actualBoundingBoxAscent,x+m.actualBoundingBoxRight,y+m.actualBoundingBoxDescent,!!s._clipped]);return fill(t,x,y,...a);};`);
  body = body.replace('return item.viz(v);', `const ro=v.readout.bind(v);v.readout=f=>ro(()=>{window.__R=f();window.__RV=(window.__C||[]).map(c=>c.value);window.__RS=(window.__SEL||[]).map(c=>c.value);return window.__R;});const slider=v.slider.bind(v);v.slider=(...a)=>{const c=slider(...a);(window.__C||=[]).push(c);return c;};const select=v.select.bind(v);v.select=(...a)=>{const c=select(...a);(window.__SEL||=[]).push(c);return c;};return item.viz(v);`);
  await route.fulfill({ response, body });
});
const near = (a, b, t = 1e-9) => assert.ok(Math.abs(a - b) <= t * Math.max(1, Math.abs(b)), `${a} != ${b}`);
async function done() { await page.waitForFunction(() => JSON.stringify(window.__RV) === JSON.stringify(window.__C.map(c => c.value)) && JSON.stringify(window.__RS) === JSON.stringify(window.__SEL.map(c => c.value))); }
async function load(id, theme, width) {
  await page.setViewportSize({ width, height: 1600 });
  await page.goto(`http://localhost:${server.address().port}/tools/harness.html?file=content/fin/${id === '5.1' ? 'ch05' : 'ch05-c'}.js&id=fin-${id}&theme=${theme}&w=${width - 50}&still=1&wait=150`);
  await page.waitForFunction(() => window.__done); const d = await page.evaluate(() => window.__done);
  assert.deepEqual(d.errors, []); assert.deepEqual(d.texErrors, []); assert.deepEqual(d.blank, []); await done();
}
async function mode(name) { await page.getByRole('button', { name, exact: true }).click(); await done(); }
async function set(values, log = []) {
  await page.locator('input[type=range]').evaluateAll((es, [vals, log]) => es.forEach((e, i) => { e.value = log.includes(i) ? Math.log10(vals[i]) : vals[i]; e.dispatchEvent(new Event('input', { bubbles: true })); }), [values, log]);
  await done(); const actual = await page.evaluate(() => window.__C.map(c => c.value)); const publicEntry = actual.length === 4 && (await page.evaluate(() => window.__SEL[0].value)) === 'semi'; actual.forEach((x, i) => near(x, publicEntry && i === 3 ? Math.max(0, values[i]) : values[i], log.includes(i) ? .008 : 1e-10));
}
async function snapshot() {
  const a = await page.evaluate(() => ({ r: window.__R, values: window.__C.map(c => c.value), modes: window.__SEL.map(c => c.value), e: window.__vizErrors || [], tex: document.querySelectorAll('.katex-error').length, overflow: [...document.querySelectorAll('.katex-display')].filter(e => e.scrollWidth > e.clientWidth + 1).map(e => e.textContent), pageOverflow: document.documentElement.scrollWidth > innerWidth + 1,
    S: window.__S.map(s => ({ visible: s.el.style.display !== 'none', w: s.width, h: s.height, b: s.bounds, paths: s.__P, dots: s.__D, rect: s.__RC, text: s.__FT, pb: [s.X(s.bounds.x[0]), s.Y(s.bounds.y[1]), s.X(s.bounds.x[1]), s.Y(s.bounds.y[0])], pp: s.__P.map(([pts]) => pts.map(p => p && [s.X(p[0]), s.Y(p[1])])), glyph: s.__D.map(([x, y, o = {}]) => [s.X(x), s.Y(y), (o.r ?? 4) + .75]) })) }));
  assert.deepEqual(a.e, []); assert.deepEqual(a.overflow, []); assert.equal(a.tex, 0); assert.equal(a.pageOverflow, false); assert.doesNotMatch(a.r, /NaN|Infinity|undefined|\\n/);
  for (const s of a.S.filter(s => s.visible)) {
    for (const pts of s.pp) for (const p of pts) if (p) { assert.ok(p.every(Number.isFinite)); assert.ok(p[0] >= s.pb[0] - 1e-7 && p[0] <= s.pb[2] + 1e-7 && p[1] >= s.pb[1] - 1e-7 && p[1] <= s.pb[3] + 1e-7, 'complete plotted paths'); }
    for (const [x, y, X, Y] of s.rect) for (const [u, v] of [[x, y], [X, Y]]) assert.ok(u >= s.b.x[0] - 1e-9 && u <= s.b.x[1] + 1e-9 && v >= s.b.y[0] - 1e-9 && v <= s.b.y[1] + 1e-9, 'complete histogram/model rectangle');
    for (const [x, y, r] of s.glyph) assert.ok(x - r >= s.pb[0] && x + r <= s.pb[2] && y - r >= s.pb[1] && y + r <= s.pb[3], 'full marker/ring');
    for (const [t, x, y, X, Y, clipped] of s.text) { assert.ok(x >= -1 && y >= -1 && X <= s.w + 1 && Y <= s.h + 1, `canvas text ${t}`); if (clipped) assert.ok(x - 2 >= s.pb[0] && X + 2 <= s.pb[2] && y - 2 >= s.pb[1] && Y + 2 <= s.pb[3], `text halo ${t}`); }
  }
  return a;
}
const D = daily(), M = data(), C = dailyCalendar();
async function check51() {
  const a = await snapshot(); assert.deepEqual(a.S.map(s => s.visible), a.modes[0] === 'weak' ? [true, true, false] : [true, false, true]);
  if (a.modes[0] === 'weak') {
    const start = a.modes[1] === 'b' ? D.yearStart[27] : 1, end = a.modes[1] === 'a' ? D.yearStart[27] : D.n, cost = a.values[0] * 1e-4;
    let previous = 0, units = 0, sums = [0, 0, 0], wealth = [1, 1, 1]; const paths = a.S[1].paths;
    assert.equal(paths.length, 3); paths.forEach(([p]) => { assert.equal(p.length, end - start + 1); near(p[0][0], C.years[start - 1]); near(p[0][1], 0); });
    for (let i = start; i < end; i++) {
      const pos = Math.sign(D.r[i - 1]) || 1, turn = Math.abs(pos - previous) + (i === end - 1 ? 1 : 0), returns = [D.r[i], pos * D.r[i], pos * D.r[i] - cost * turn]; previous = pos; units += turn;
      returns.forEach((r, k) => { sums[k] += r; wealth[k] *= 1 + r; const p = paths[k][0][i - start + 1]; near(p[0], C.years[i]); near(p[1], Math.log10(wealth[k])); });
    }
    assert.ok(a.r.includes(`${units.toLocaleString('en-US')} signal units charged`)); assert.ok(a.r.includes(`${(end - start).toLocaleString('en-US')} rule days`)); assert.match(a.r, /not compound growth rates or significance tests/);
    assert.match(a.r, /no efficiency verdict follows/); assert.match(a.r, /daily rebalancing trades are uncharged/);
  } else {
    const [, L, tau, entry] = a.values, level = t => t < 0 ? L * (1 + t / 30) : 1 - (1 - L) * Math.exp(-t / tau);
    for (const [t, y] of a.S[2].paths[0][0]) near(y, level(t)); near(a.S[2].dots[0][0], entry); near(a.S[2].dots[0][1], level(entry));
    if (a.modes[0] === 'semi') assert.ok(entry >= 0); assert.match(a.r, /not returns or evidence/);
  }
  return a;
}
async function check514(seed) {
  const a = await snapshot(), m = a.modes[0], s = a.S[['weak', 'semi', 'strong', 'joint'].indexOf(m)]; assert.equal(a.S.filter(s => s.visible).length, 1);
  if (m === 'weak') {
    const k = a.values[0]; const bars = s.rect; assert.equal(bars.length, 10);
    for (let j = 0; j < 10; j++) { const xs = Array.from(M.ind[j]), mean = xs.reduce((a, b) => a + b, 0) / xs.length, centered = xs.map(x => x - mean); let num = 0, den = 0; for (let i = 0; i < xs.length; i++) { den += centered[i] ** 2; if (i + k < xs.length) num += centered[i] * centered[i + k]; } near(bars[j][3], num / den); }
    assert.match(a.r, /not a simultaneous 95% band/);
  } else if (m === 'semi') {
    const p = a.values[1], paths = s.paths; assert.equal(paths.length, 3);
    for (let j = 0; j < 61; j++) { const t = j - 30, base = .9 * Math.min(j, 30), delta = .35 * Math.min(Math.max(t, 0), 6); near(paths[0][0][j][1], base + (1 - p) * delta); near(paths[1][0][j][1], base - p * delta); near(paths[2][0][j][1], p * paths[0][0][j][1] + (1 - p) * paths[1][0][j][1]); }
    assert.match(a.r, /flat|by construction/); assert.match(a.r, /zero weight is a counterfactual/);
  } else if (m === 'strong') {
    const R = rng(seed * 17), vals = []; let hits = 0, skilled = 0;
    for (let i = 0; i < 400; i++) { const sk = R() < a.values[2], z = (sk ? 3 : -.8) / (4 / Math.sqrt(10)) + R.normal(); vals.push(z); skilled += +sk; hits += +(z > 1.96); }
    const bars = s.rect.slice(1); assert.equal(bars.length, 28); const counts = bars.map(() => 0), lo = bars[0][0], width = bars[0][2] - lo;
    vals.forEach(z => { assert.ok(z > lo && z < bars.at(-1)[2]); counts[Math.min(27, Math.max(0, Math.floor((z - lo) / width)))]++; }); bars.forEach((r, i) => near(r[3], counts[i] / 400));
    assert.ok(a.r.includes(`${hits}/400 exceed z`)); assert.ok(a.r.includes(`${skilled} assigned skilled funds`)); assert.match(a.r, /400\/400/); assert.match(a.r, /positive half of a two-sided 5%/);
  } else {
    const beta = a.values[3], gamma = a.values[4]; assert.equal(s.rect.length, 4); assert.equal(s.dots.length, 2);
    for (let i = 0; i < 2; i++) { const x = i ? 1 : -1; near(s.rect[2 * i][3], .5 + beta * x); near(s.rect[2 * i + 1][3], .5 + gamma * x); near(s.dots[i][0], x); near(s.dots[i][1], (beta - gamma) * x); }
    assert.ok(a.r.replaceAll('−', '-').includes(`abnormal gain = ${(beta - gamma).toFixed(2)}`));
    if (beta === gamma) assert.match(a.r, /zero conditional abnormal means even when raw returns are predictable/);
  }
  return a;
}
try {
  for (const theme of ['light', 'dark']) for (const width of [1450, 430]) {
    await load('5.1', theme, width);
    for (const sample of ['1963–1989', '1990–2026', '1963–2026']) { await mode(sample); for (const cost of [0, 10]) { await set([cost, .2, 5, 2], [2]); await check51(); } }
    await page.screenshot({ path: `/tmp/atlas-fin-efficiency-rule-${width}-${theme}.png`, fullPage: true });
    for (const f of ['semi-strong', 'strong']) { await mode(f); for (const L of [0, 1]) for (const tau of [.2, 60]) for (const entry of [-30, 30]) { await set([2, L, tau, entry], [2]); await check51(); } }
    await mode('semi-strong'); await set([2, .2, 60, 2], [2]); await check51(); await page.screenshot({ path: `/tmp/atlas-fin-efficiency-news-${width}-${theme}.png`, fullPage: true });
    console.log(`PASS EMH5.1 ${width} ${theme}: all6 sample/cost boundaries, all16 news corners, complete actual-day paths/costs, clamped public entry, glyph/text/TeX and overflow`);
    await load('5.14', theme, width); for (let k = 1; k <= 12; k++) { await set([k, .7, 0, 2, 2]); await check514(3); }
    await page.screenshot({ path: `/tmp/atlas-fin-efficiency-industries-${width}-${theme}.png`, fullPage: true });
    await mode('semi-strong'); for (let k = 0; k <= 20; k++) { await set([1, k / 20, 0, 2, 2]); await check514(3); }
    await page.screenshot({ path: `/tmp/atlas-fin-efficiency-splits-${width}-${theme}.png`, fullPage: true });
    await mode('strong'); for (const skill of [0, .3]) { await set([1, .7, skill, 2, 2]); await check514(3); }
    await page.getByRole('button', { name: 'Resample funds', exact: true }).click(); await page.waitForTimeout(30); await check514(4); await page.screenshot({ path: `/tmp/atlas-fin-efficiency-funds-${width}-${theme}.png`, fullPage: true });
    await mode('joint hypothesis'); for (const beta of [0, 4]) for (const gamma of [0, 4]) { await set([1, .7, 0, beta, gamma]); await check514(4); }
    await set([1, .7, 0, 2, 2]); await check514(4); await page.screenshot({ path: `/tmp/atlas-fin-efficiency-joint-${width}-${theme}.png`, fullPage: true });
    assert.equal(await page.getByRole('button', { name: 'Resample funds', exact: true }).isVisible(), false);
    for (const i of [3, 4]) { const e = page.locator('input[type=range]').nth(i); await e.scrollIntoViewIfNeeded(); for (const key of ['Home', 'End']) { await e.press(key); await done(); await check514(4); } }
    console.log(`PASS Fama5.14 ${width} ${theme}: all120 industry/lag values, all21 weights, complete400funds/reseed, all4 benchmark corners, equal-positive slopes, native keyboard endpoints and layout bounds`);
  }
  assert.deepEqual(errors, []);
} catch (e) { console.error(e); await page.screenshot({ path: '/tmp/atlas-fin-efficiency-failure.png', fullPage: true }); throw e; }
finally { await browser.close(); await new Promise(r => server.close(r)); }
