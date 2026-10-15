// Number Theory — Chapter 1: Divisibility and primes (part 2: 1.8–1.14)
// Infinitely many primes (Euclid, primes ≡ 3 mod 4, Fermat numbers), the sieve of Eratosthenes, long gaps between
// primes, linear Diophantine equations and the two-coin Frobenius problem. Part 1 is ch01.js.

// ---------- shared helpers ----------
const PALETTE = ['blue', 'teal', 'purple', 'orange', 'pink', 'gold', 'green', 'red'];
/** Rounded rectangle in pixel coordinates (stage S), filled and/or stroked with palette colours. */
function rbox(v, S, X, Y, W, H, r, st = {}) {
  const c = S.ctx; c.save(); c.beginPath();
  if (c.roundRect) c.roundRect(X, Y, W, H, r); else c.rect(X, Y, W, H);
  if (st.fill) { c.fillStyle = v.color(st.fill, st.fillAlpha ?? 1); c.fill(); }
  if (st.stroke) { c.lineWidth = st.width ?? 1.5; c.strokeStyle = v.color(st.stroke, st.alpha ?? 1); c.setLineDash(st.dash || []); c.stroke(); }
  c.restore();
}
/** A labelled chip (pixel coordinates, centred at X, Y); returns its rectangle for hit-testing. */
function chip(v, S, X, Y, w, h, label, st = {}) {
  rbox(v, S, X - w / 2, Y - h / 2, w, h, Math.min(8, h / 3), { fill: st.fill, fillAlpha: st.fillAlpha ?? 0.22, stroke: st.stroke ?? st.fill, width: st.width ?? 1.4, dash: st.dash });
  S.textPx(label, X, Y + 0.5, { align: 'center', size: st.size ?? 13, weight: st.weight ?? 650, color: st.color ?? 'ink', halo: false });
  return [X - w / 2, Y - h / 2, X + w / 2, Y + h / 2];
}
const inRect = (r, X, Y) => r && X >= r[0] && X <= r[2] && Y >= r[1] && Y <= r[3];
/** Digits grouped by thin spaces for TeX: 30031 → "30\,031". */
function grp(n) { const s = String(n); if (s.length <= 4) return s; return s.replace(/\B(?=(\d{3})+(?!\d))/g, '\\,'); }
/** Prime factorisation (from M.factor output) as TeX. */
const facTexOf = (fs) => fs.map(([p, e]) => (Number(e) > 1 ? `${grp(p)}^{${e}}` : grp(p))).join('\\cdot ');
/** Wrap a negative number in parentheses for products. */
const par = (x) => (x < 0 ? `(${x})` : `${x}`);

/** All primes up to 10^7 by an odd-only sieve of Eratosthenes, computed once per page (≈ 50 ms). */
let PRIME_TABLE = null;
function primeTable() {
  if (PRIME_TABLE) return PRIME_TABLE;
  const N = 1e7, half = N >> 1, comp = new Uint8Array(half); // index i ↔ 2i + 1
  for (let i = 1; (2 * i + 1) * (2 * i + 1) <= N; i++) if (!comp[i]) { const p = 2 * i + 1; for (let j = (p * p) >> 1; j < half; j += p) comp[j] = 1; }
  const primes = new Int32Array(664579); let k = 0; primes[k++] = 2;
  for (let i = 1; i < half; i++) if (!comp[i]) primes[k++] = 2 * i + 1;
  PRIME_TABLE = { N, primes: primes.subarray(0, k) };
  return PRIME_TABLE;
}
/** π(x) for x ≤ 10^7 by binary search in the prime table. */
function piAt(x) { const P = primeTable().primes; let lo = 0, hi = P.length; while (lo < hi) { const m = (lo + hi) >> 1; if (P[m] <= x) lo = m + 1; else hi = m; } return lo; }
/** Logarithmic integral li(x) for x > 1 (Ramanujan-style series γ + ln ln x + Σ (ln x)^k / (k·k!)). */
function li(x) { const L = Math.log(x); let s = 0.5772156649015329 + Math.log(L), term = 1; for (let k = 1; k < 200; k++) { term *= L / k; s += term / k; if (term / k < 1e-16 * Math.abs(s)) break; } return s; }
const LI2 = li(2);

export default {
  collection: 'nt',
  chapter: 1,
  items: [
    // ------------------------------------------------------------------ 1.8
    {
      num: '1.8',
      kind: 'Theorem',
      name: 'Euclid’s theorem: infinitely many primes',
      statement: String.raw`There are infinitely many prime numbers. More precisely: for any finite list of primes $p_1,\dots,p_k$, every prime factor of $N=p_1p_2\cdots p_k+1$ is a prime that is not on the list.`,
      idea: String.raw`$N>1$, so it has a prime factor $q$ (the existence half of 1.6: its smallest divisor $>1$ is prime). Each $p_i$ leaves remainder $1$ when dividing $N$, so $q\ne p_i$ for every $i$ — no finite list contains all primes. $N$ itself need not be prime ($2\cdot3\cdot5\cdot7\cdot11\cdot13+1=59\cdot509$); only its factors matter. Feeding back the smallest new factor each time gives the Euclid–Mullin sequence $2,3,7,43,13,53,5,\dots$. The argument also yields a (very weak) count: $p_{n+1}\le p_1\cdots p_n+1$ gives $p_n\le2^{2^{n-1}}$, i.e. $\pi(x)\ge\log_2\log_2x+1$ — the truth, $\pi(x)\sim x/\ln x$, is the prime number theorem.`,
      caption: String.raw`Click primes to build any finite list (or use the slider for the first $k$ primes). The product plus one is factored live: its prime factors are always new — green — although the number itself is often composite. *Euclid–Mullin* adds the smallest new factor to the list. Below, $\pi(x)$ is counted by a sieve up to $10^7$ on log–log axes against $x/\ln x$, $\operatorname{Li}(x)$ and the bound Euclid’s argument guarantees; move $x$ to read the numbers.`,
      deps: ['nt-1.6'],
      tags: ['primes', 'infinitude'],
      credit: 'Euclid, Elements IX.20, c. 300 BC',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Euclid%27s_theorem' },
      viz(v) {
        const M = v.M, CAP = 10n ** 21n;
        const POOL = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53];
        let chosen = new Set(POOL.slice(0, 6)), extra = [], msg = '';
        const kS = v.slider('first $k$ primes', 0, 16, 6, { int: true, onChange: (k) => { chosen = new Set(POOL.slice(0, k)); extra = []; msg = ''; } });
        const cache = new Map();
        const listNow = () => [...POOL.filter((p) => chosen.has(p)), ...extra];
        const prodOf = (L) => L.reduce((t, p) => t * BigInt(p), 1n);
        const facOf = (N) => { const key = String(N); if (!cache.has(key)) cache.set(key, M.factor(N)); return cache.get(key); };
        v.button('Euclid–Mullin: add the smallest new factor', () => {
          const L = listNow(), P = prodOf(L); if (P >= CAP) { msg = 'product too large to factor instantly'; return; }
          const q = facOf(P + 1n)[0][0], np = P * q;
          if (np >= CAP) { msg = `next factor ${q}: the product would pass 10²¹ — stop here`; return; }
          if (q <= 53n) chosen.add(Number(q)); else extra.push(q);
          msg = `added ${q}`;
        });
        const xS = v.slider('$x$', 10, 1e7, 1e5, { log: true, sig: 3 });
        const C = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 236, full: true });
        const Pl = v.stage({ x: [2, 1e7], y: [0.8, 1.5e6], xlog: true, ylog: true, height: 300, full: true, axes: 'box', grid: true, xlabel: 'x', title: 'how many? $\\pi(x)$ counted by a sieve up to $10^7$ (log–log axes)' });
        let rects = [];
        C.onClick((x, y) => {
          const X = C.X(x), Y = C.Y(y);
          for (const { r, p, ext } of rects) if (inRect(r, X, Y)) {
            if (ext) extra = extra.filter((q) => q !== p);
            else if (chosen.has(p)) chosen.delete(p); else chosen.add(p);
            msg = ''; return;
          }
        });
        // π(x) as a step path: exact steps below 2000, then 600 log-spaced samples
        const P = primeTable().primes, path = [];
        let i0 = 0;
        for (; i0 < P.length && P[i0] < 2000; i0++) path.push([P[i0], i0 || 0.5], [P[i0], i0 + 1]);
        for (let j = 0, i = i0; j <= 600; j++) { const x = 2000 * Math.pow(5000, j / 600); while (i < P.length && P[i] <= x) i++; path.push([x, i]); }
        const euclid = []; for (let n = 1; n <= 5; n++) { const x0 = Math.pow(2, Math.pow(2, n - 1)), x1 = Math.pow(2, Math.pow(2, n)); euclid.push([Math.max(2, x0), n], [Math.min(1e7, x1), n]); }
        v.legend([['accent', '$\\pi(x)$'], ['orange', '$x/\\ln x$', { dash: true }], ['green', '$\\operatorname{Li}(x)=\\int_2^x dt/\\ln t$'], ['red', 'what Euclid’s argument guarantees']]);
        let st = null;
        v.render(() => {
          const L = listNow(), Pr = prodOf(L), N = Pr + 1n, W = C.width;
          // chips of the pool (and of larger primes added by Euclid–Mullin)
          rects = [];
          const all = [...POOL.map((p) => ({ p, ext: false })), ...extra.map((p) => ({ p, ext: true }))];
          const cw = Math.min(46, (W - 24) / all.length);
          all.forEach(({ p, ext }, i) => {
            const X = 12 + cw * (i + 0.5), on = ext || chosen.has(p);
            const r = chip(v, C, X, 30, cw - 5, 26, String(p), { fill: on ? (ext ? 'gold' : 'accent') : 'faint', fillAlpha: on ? 0.3 : 0.08, stroke: on ? (ext ? 'gold' : 'accent') : 'faint', color: on ? 'ink' : 'muted', size: String(p).length > 6 ? 9 : 12.5 });
            rects.push({ r, p, ext });
          });
          C.textPx(L.length ? `your list: ${L.length} prime${L.length === 1 ? '' : 's'}` : 'your list is empty (the empty product is 1)', 12, 58, { size: 11, color: 'muted' });
          const prodTex = L.length === 0 ? '1' : L.length <= 9 ? L.map(String).join('\\cdot ') : `${L.slice(0, 4).join('\\cdot ')}\\cdots ${L[L.length - 1]}`;
          C.texPx(`N = ${prodTex} + 1 = ${grp(N)}`, W / 2, 92, { size: 17 });
          if (Pr >= CAP) { C.textPx('product too large to factor instantly — remove a prime', W / 2, 150, { align: 'center', size: 13, color: 'red', weight: 650 }); st = null; return; }
          const fs = facOf(N), prime = fs.length === 1 && fs[0][1] === 1;
          const fw = fs.map(([p, e]) => Math.max(54, 10 * String(p).length + (e > 1 ? 18 : 0) + 18));
          let X = W / 2 - (fw.reduce((t, w) => t + w + 14, 0) - 14) / 2 + 26;
          C.textPx('=', X - 26, 150, { size: 17, color: 'muted', align: 'center' });
          fs.forEach(([p, e], k) => {
            const w = fw[k];
            chip(v, C, X + w / 2, 150, w, 34, `${p}${e > 1 ? '^' + e : ''}`, { fill: 'green', fillAlpha: 0.22, stroke: 'green', size: 14 });
            C.textPx(prime ? 'N itself is prime' : 'new prime', X + w / 2, 124, { align: 'center', size: 10.5, color: 'green', weight: 650 });
            if (k < fs.length - 1) C.textPx('×', X + w + 7, 150, { size: 15, color: 'muted', align: 'center' });
            X += w + 14;
          });
          const res = L.slice(0, 8).map((p) => `${p}`);
          C.texPx(L.length ? `N \\bmod p = 1 \\text{ for } p = ${res.join(', ')}${L.length > 8 ? ',\\dots' : ''}\\ \\Rightarrow\\ \\text{no listed prime divides } N` : '\\text{no primes listed: } N = 2 \\text{ is already a new prime}', W / 2, 202, { size: 13.5, color: 'muted' });
          if (msg) C.corner(msg, 'tr', { size: 11.5, color: msg.startsWith('added') ? 'gold' : 'red', weight: 650 });
          // π(x)
          const x = xS.value;
          Pl.fn((t) => t / Math.log(t), { color: 'orange', width: 2, dash: [6, 4], domain: [2.5, 1e7] });
          Pl.fn((t) => li(t) - LI2, { color: 'green', width: 2, domain: [2.05, 1e7] });
          Pl.path(path, { color: 'accent', width: 2.2 });
          Pl.path(euclid, { color: 'red', width: 2 });
          Pl.vline(x, { color: 'muted', dash: [3, 4], width: 1 });
          const px = piAt(x), eb = Math.floor(Math.log2(Math.log2(x))) + 1;
          Pl.dot(x, Math.max(px, 0.9), { r: 4.5, color: 'accent' }); Pl.dot(x, x / Math.log(x), { r: 3.5, color: 'orange' }); Pl.dot(x, li(x) - LI2, { r: 3.5, color: 'green' }); Pl.dot(x, eb, { r: 3.5, color: 'red' });
          st = { L, N, fs, prime, x, px, eb };
        });
        v.readout(() => {
          if (!st) return 'Remove a prime to bring the product below $10^{21}$.';
          const { L, N, fs, prime, x, px, eb } = st, li_ = li(x) - LI2;
          const head = prime ? `$N = ${grp(N)}$ is itself prime — and not on the list.` : `$N = ${grp(N)} = ${facTexOf(fs)}$ is not prime, but none of its prime factors is on the list.`;
          return head + ` · At $x = ${grp(Math.round(x))}$: $\\pi(x) = ${grp(px)}$, $x/\\ln x = ${grp(Math.round(x / Math.log(x)))}$ (ratio ${v.fix(px / (x / Math.log(x)), 3)}), $\\operatorname{Li}(x) = ${grp(Math.round(li_))}$ (ratio ${v.fix(px / li_, 4)}); Euclid’s argument alone guarantees only $\\pi(x) \\ge ${eb}$.` + (L.length >= 8 ? '' : '');
        });
      },
    },
    // ------------------------------------------------------------------ 1.9
    {
      num: '1.9',
      kind: 'Algorithm',
      name: 'Sieve of Eratosthenes',
      statement: String.raw`**Input:** an integer $N\ge2$. Write down $2,3,\dots,N$. Repeatedly take the smallest number $p$ not yet crossed out and not yet used — it is prime — and cross out its multiples $p^2,\ p^2+p,\ p^2+2p,\dots\le N$. **Stop** as soon as $p^2>N$. **Output:** the numbers never crossed out, which are exactly the primes $\le N$.

Cost: about $N\sum_{p\le\sqrt N}1/p\approx N\ln\ln N$ crossings.`,
      idea: String.raw`A number survives the step for $p$ exactly when $p$ does not divide it, so after the primes $<p$ have been used, the survivors are the numbers with no prime factor below $p$. Such a survivor $m<p^2$ must be prime — a composite $m$ has a prime factor $\le\sqrt m<p$. This one invariant explains everything: the smallest survivor is always prime, crossing may start at $p^2$ (the smaller multiples $kp$, $k<p$, have the smaller factor $k$’s prime and are already gone), and the sieve may stop once $p^2>N$, because then every survivor is below $p^2$.`,
      caption: String.raw`Step through the sieve (▶ plays it). Each prime crosses out its multiples in its own colour, starting at $p^2$; green numbers are *certified* primes — survivors below $p^2$ for the next prime $p$ — and the green region grows until $p^2>N$, when every survivor is certified. Switch the layout: in rows of $30=2\cdot3\cdot5$ the primes fall into the 8 columns coprime to $30$; on the Ulam spiral they cluster on diagonals. Start at $2p$ instead of $p^2$ to see the wasted crossings in red.`,
      deps: ['nt-1.1'],
      tags: ['primes', 'algorithms'],
      credit: 'Eratosthenes of Cyrene, c. 240 BC (reported by Nicomachus)',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Sieve_of_Eratosthenes' },
      viz(v) {
        const M = v.M;
        const lay = v.select('layout', [{ value: 'r20', label: 'rows of 20' }, { value: 'r30', label: 'rows of 30' }, { value: 'ulam', label: 'Ulam spiral' }], 'r20');
        const waste = v.toggle('start at $2p$ instead of $p^2$', false);
        const G = v.stage({ x: [0, 20], y: [-20, 0], equal: true, axes: false, height: 470 });
        const NN = { r20: 400, r30: 450, ulam: 441 }, COL = { 2: 'blue', 3: 'orange', 5: 'purple', 7: 'teal', 11: 'pink', 13: 'gold', 17: 'gray', 19: 'muted' };
        const colOf = (p) => COL[p] || 'muted';
        let N = 400, ps = [], spf = null, pos = null;
        const setup = () => {
          N = NN[lay.value]; ps = M.sieve(Math.floor(Math.sqrt(N)));
          spf = new Int32Array(N + 1); for (const p of M.sieve(N)) for (let m = p; m <= N; m += p) if (!spf[m]) spf[m] = p;
          pos = new Array(N + 1);
          if (lay.value === 'ulam') {
            let x = 0, y = 0, k = 1, len = 1, d = 0; const D = [[1, 0], [0, 1], [-1, 0], [0, -1]]; pos[1] = [0, 0];
            while (k < N) { for (let rep = 0; rep < 2 && k < N; rep++) { for (let s = 0; s < len && k < N; s++) { x += D[d][0]; y += D[d][1]; pos[++k] = [x, y]; } d = (d + 1) % 4; } len++; }
          } else { const C = lay.value === 'r20' ? 20 : 30; for (let k = 1; k <= N; k++) pos[k] = [((k - 1) % C) + 0.5, -(Math.floor((k - 1) / C) + 0.5)]; }
        };
        const build = () => {
          setup();
          const fr = [{ s: 0, note: `The numbers $2, 3, \\dots, ${N}$ ($1$ is neither prime nor composite). The smallest one, $2$, has no smaller factor: it is prime.` }];
          ps.forEach((p, i) => {
            const nx = ps[i + 1], bound = nx ? nx * nx : null;
            fr.push({ s: i + 1, p, line: [1, 2], note: `$p = ${p}$ is the smallest survivor, so it is prime. Cross out ${waste.value ? `$${2 * p}, ${3 * p}, \\dots$` : `$${p}^2 = ${p * p},\\ ${p * p + p}, \\dots$`} $\\le ${N}$.` + (bound ? ` Afterwards every survivor below $${nx}^2 = ${bound}$ is certified prime.` : '') });
          });
          const q = M.sieve(100).find((t) => t * t > N);
          fr.push({ s: ps.length + 1, final: true, line: 3, note: `The next prime is $${q}$ and $${q}^2 = ${q * q} > ${N}$: stop. Every survivor is prime — $\\pi(${N}) = ${M.sieve(N).length}$.` });
          return fr;
        };
        const S = v.steps({ frames: build, speed: 0.5, transition: 1.3, start: 3, still: 3, codePos: 'below', counter: 'frame',
          code: ['for p = 2, 3, 5, … while $p^2 \\le N$:   // p = smallest survivor', '    cross out $p^2,\\ p^2 + p,\\ p^2 + 2p, \\dots \\le N$', 'return the survivors   // exactly the primes ≤ N'] });
        let key = '', counts = null;
        const crossList = (p) => { const out = []; for (let m = waste.value ? 2 * p : p * p; m <= N; m += p) out.push(m); return out; };
        v.legend([['blue', '×2'], ['orange', '×3'], ['purple', '×5'], ['teal', '×7'], ['pink', '×11, 13, …'], ['green', 'certified prime', { area: true }], ['red', 'crossed again (wasted)', { dot: true }]].map(([c, l, o]) => [c, l, o ?? { area: true }]));
        v.render(() => {
          const k = `${lay.value}|${waste.value}`;
          if (k !== key) { if (key) S.reset({ at: 'keep' }); else setup(); key = k; }
          const f = S.frame, s = f.s ?? 0, t = S.tween;
          if (lay.value === 'ulam') G.setView([-10.6, 10.6], [-10.6, 10.6]); else if (lay.value === 'r20') G.setView([0, 20], [-20, 0]); else G.setView([0, 30], [-15, 0]);
          const cur = s >= 1 && !f.final ? ps[s - 1] : null, list = cur ? crossList(cur) : [], done = Math.floor(t * list.length + 1e-9);
          const nowSet = new Set(list.slice(0, done));
          const idxOf = (p) => ps.indexOf(p) + 1; // step at which p crosses
          const bound = f.final ? Infinity : cur ? (t >= 1 ? (ps[s] ? ps[s] * ps[s] : Infinity) : cur * cur) : 4;
          const half = 0.47, sc = G.scale, fsz = Math.min(12, sc * 0.42);
          let wasted = 0, crossed = 0;
          for (let m = 1; m <= N; m++) {
            const [x, y] = pos[m], comp = m > 1 && spf[m] !== m, first = comp ? idxOf(spf[m]) : Infinity;
            let fill = null, alpha = 0, slash = null;
            if (m === 1) { fill = 'gray'; alpha = 0.18; }
            else if (comp && first < s) { fill = colOf(spf[m]); alpha = 0.3; slash = 0.45; }
            else if (comp && first === s && nowSet.has(m)) { fill = colOf(cur); alpha = 0.62; slash = 0.9; }
            else if (m < bound) { fill = 'green'; alpha = 0.32; }
            if (fill) G.rect(x - half, y - half, x + half, y + half, { fill, fillAlpha: alpha, stroke: false });
            if (slash) G.line(x - 0.36, y - 0.36, x + 0.36, y + 0.36, { color: 'ink', width: 1.1, alpha: slash * 0.6 });
            if (cur && nowSet.has(m) && comp && first < s) { G.rect(x - half + 0.04, y - half + 0.04, x + half - 0.04, y + half - 0.04, { color: 'red', width: 2 }); }
            if (cur === m) G.rect(x - half, y - half, x + half, y + half, { color: 'gold', width: 3 });
            const alive = !(comp && (first < s || (first === s && nowSet.has(m))));
            if (sc >= 15) G.text(String(m), x, y, { align: 'center', size: m >= 100 ? fsz * 0.92 : fsz, weight: alive && m > 1 ? 650 : 500, color: alive && m > 1 ? 'ink' : 'muted', halo: false });
          }
          // crossing statistics
          for (let i = 0; i < ps.length; i++) {
            const p = ps[i], L = crossList(p), upto = i + 1 < s ? L.length : i + 1 === s && !f.final ? done : f.final ? L.length : 0;
            for (let j = 0; j < upto; j++) { crossed++; if (spf[L[j]] !== p) wasted++; }
          }
          counts = { crossed, wasted, alive: (() => { let a = 0; for (let m = 2; m <= N; m++) { const comp = spf[m] !== m, first = comp ? idxOf(spf[m]) : Infinity; if (!(comp && (first < s || (first === s && nowSet.has(m))))) a++; } return a; })(), bound, cur };
        });
        v.readout(() => {
          if (!counts) return '';
          const { crossed, wasted, alive, bound, cur } = counts;
          const pi = M.sieve(N).length;
          return `$N = ${N}$: ${crossed} crossings so far, of which ${wasted} hit an already crossed number${waste.value ? ' (red) — starting at $p^2$ avoids the multiples $kp$ with $k < p$' : ''}; ${alive} survivors` + (bound === Infinity ? `, all prime: $\\pi(${N}) = ${pi}$.` : `, of which those below $${bound}$ are certified prime${cur ? ` (now sieving with $p = ${cur}$)` : ''}.`);
        });
      },
    },
    // ------------------------------------------------------------------ 1.10
    {
      num: '1.10',
      kind: 'Theorem',
      name: 'Infinitely many primes ≡ 3 (mod 4)',
      statement: String.raw`There are infinitely many primes $p\equiv3 \pmod 4$. More precisely: if $p_1,\dots,p_k$ are primes $\equiv 3 \pmod 4$, then $N=4p_1\cdots p_k-1$ has a prime factor $q\equiv3\pmod 4$, and $q$ is not on the list.`,
      idea: String.raw`$N$ is odd and $N\equiv3\pmod4$. Odd numbers are $\equiv1$ or $3 \pmod 4$, and a product of numbers $\equiv1$ is again $\equiv1$; so not all prime factors of $N$ can be $\equiv1$ — some prime factor $q$ is $\equiv3 \pmod 4$. Every listed $p_i$ leaves remainder $-1$ when dividing $N$, so $q$ is new. The mirror attempt for primes $\equiv1 \pmod4$, $N=4p_1\cdots p_k+1$, fails: $3\cdot3\equiv1$, so $N$ may have no prime factor $\equiv1$ at all ($4\cdot5+1=3\cdot7$). That case needs a better polynomial: every odd prime factor of $(2p_1\cdots p_k)^2+1$ is $\equiv1\pmod4$, which uses quadratic residues (chapter 4).`,
      caption: String.raw`Click primes to choose a list. The number $N$ is factored live and each factor is tagged with its residue mod 4; a new prime $\equiv3$ always appears. Switch to $4P+1$ with primes $\equiv1$ to watch the analogous argument break (try the list $\{5\}$: $21=3\cdot7$), and to $(2P)^2+1$ to see the repair. The little table shows why $\equiv3$ cannot hide: residues $1$ multiply to $1$.`,
      deps: ['nt-1.8', 'nt-1.6'],
      tags: ['primes', 'infinitude', 'congruences'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Dirichlet%27s_theorem_on_arithmetic_progressions' },
      viz(v) {
        const M = v.M, CAP = 10n ** 21n;
        const P3 = [3, 7, 11, 19, 23, 31, 43, 47, 59, 67, 71, 79, 83], P1 = [5, 13, 17, 29, 37, 41, 53, 61, 73, 89, 97, 101, 109];
        const mode = v.select('', [{ value: 'm3', label: '$4P - 1$ (primes $\\equiv 3$)' }, { value: 'm1', label: '$4P + 1$ (primes $\\equiv 1$) — fails' }, { value: 'sq', label: '$(2P)^2 + 1$ — the repair' }], 'm3');
        const sel = { m3: new Set([3, 7, 11]), m1: new Set([5]), sq: new Set([5]) };
        const C = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 330, full: true });
        let rects = [], st = null, msg = '';
        const cache = new Map();
        const facOf = (N) => { const k = String(N); if (!cache.has(k)) cache.set(k, M.factor(N)); return cache.get(k); };
        const numberOf = (m, L) => { const P = L.reduce((t, p) => t * BigInt(p), 1n); return m === 'm3' ? 4n * P - 1n : m === 'm1' ? 4n * P + 1n : (2n * P) ** 2n + 1n; };
        C.onClick((x, y) => {
          const X = C.X(x), Y = C.Y(y), m = mode.value, S = sel[m];
          for (const { r, p } of rects) if (inRect(r, X, Y)) {
            if (S.has(p)) { S.delete(p); msg = ''; return; }
            const L = [...S, p];
            if (numberOf(m, L) >= CAP) { msg = 'that would make N larger than 10²¹ — too large to factor instantly'; return; }
            S.add(p); msg = ''; return;
          }
        });
        v.render(() => {
          const m = mode.value, pool = m === 'm3' ? P3 : P1, S = sel[m], L = pool.filter((p) => S.has(p));
          const W = C.width, N = numberOf(m, L);
          rects = [];
          C.textPx(m === 'm3' ? 'primes ≡ 3 (mod 4):' : 'primes ≡ 1 (mod 4):', 12, 30, { size: 12, color: 'muted' });
          const cw = Math.min(46, (W - 170) / pool.length);
          pool.forEach((p, i) => {
            const X = 160 + cw * (i + 0.5), on = S.has(p), col = p % 4 === 3 ? 'purple' : 'teal';
            rects.push({ r: chip(v, C, X, 30, cw - 5, 26, String(p), { fill: on ? col : 'faint', fillAlpha: on ? 0.3 : 0.08, stroke: on ? col : 'faint', color: on ? 'ink' : 'muted', size: 12.5 }), p });
          });
          const Ptex = L.length ? L.join('\\cdot ') : '1';
          const expr = m === 'm3' ? `4\\cdot(${Ptex}) - 1` : m === 'm1' ? `4\\cdot(${Ptex}) + 1` : `(2\\cdot ${L.length > 1 ? `(${Ptex})` : Ptex})^2 + 1`;
          C.texPx(`N = ${expr} = ${grp(N)} \\equiv ${Number(N % 4n)} \\pmod 4`, W / 2, 84, { size: 17 });
          const fs = facOf(N);
          const items = fs.map(([p, e]) => ({ p, e, r: Number(p % 4n), isNew: !L.includes(Number(p)) }));
          const fw = items.map(({ p, e }) => Math.max(58, 10 * String(p).length + (e > 1 ? 18 : 0) + 22));
          let X = W / 2 - (fw.reduce((t, w) => t + w + 16, 0) - 16) / 2;
          items.forEach((it, k) => {
            const w = fw[k], col = it.r === 3 ? 'purple' : it.r === 1 ? 'teal' : 'gray';
            const good = (m === 'm3' && it.r === 3) || (m !== 'm3' && it.r === 1);
            chip(v, C, X + w / 2, 150, w, 36, `${it.p}${it.e > 1 ? '^' + it.e : ''}`, { fill: col, fillAlpha: 0.25, stroke: good ? 'green' : col, width: good ? 3 : 1.4, size: 14 });
            C.textPx(`≡ ${it.r} (mod 4)`, X + w / 2, 180, { align: 'center', size: 11, color: col, weight: 650 });
            if (good) C.textPx('new ✓', X + w / 2, 124, { align: 'center', size: 11, color: 'green', weight: 700 });
            if (k < items.length - 1) C.textPx('×', X + w + 8, 150, { size: 15, color: 'muted', align: 'center' });
            X += w + 16;
          });
          const has3 = items.some((it) => it.r === 3), has1 = items.some((it) => it.r === 1);
          let verdict, vcol;
          if (m === 'm3') { verdict = `N ≡ 3 (mod 4), so some prime factor is ≡ 3 — here ${items.filter((it) => it.r === 3).map((it) => it.p).join(', ')}, and none of them is on the list.`; vcol = 'green'; }
          else if (m === 'm1') { verdict = has1 ? 'A new prime ≡ 1 (mod 4) did appear — but only by luck: nothing forces it.' : 'No prime factor ≡ 1 (mod 4) at all: the factors ≡ 3 pair up (3·3 ≡ 1). The argument fails.'; vcol = has1 ? 'orange' : 'red'; }
          else { verdict = 'Every prime factor of (2P)² + 1 is ≡ 1 (mod 4) (−1 is a square mod p only for p ≡ 1), and none is on the list.'; vcol = 'green'; }
          C.textPx(verdict, W / 2, 218, { align: 'center', size: 12.5, color: vcol, weight: 650 });
          // mod-4 multiplication of odd residues
          const tx = W - 150, ty = 252, c = 26;
          C.textPx('odd residues mod 4 multiply:', tx - 6, ty - 8, { size: 10.5, color: 'muted' });
          [['·', '1', '3'], ['1', '1', '3'], ['3', '3', '1']].forEach((row, i) => row.forEach((val, j) => {
            const X0 = tx + j * c, Y0 = ty + i * c * 0.85;
            if (i && j) rbox(v, C, X0 - c / 2 + 2, Y0 - c * 0.38, c - 4, c * 0.76, 4, { fill: val === '1' ? 'teal' : 'purple', fillAlpha: 0.22 });
            C.textPx(val, X0, Y0, { align: 'center', size: 12, weight: i && j ? 650 : 500, color: i && j ? 'ink' : 'muted', halo: false });
          }));
          C.textPx(has3 && m === 'm3' ? 'a product of 1s is 1 — so N ≡ 3 needs a factor ≡ 3' : '3 · 3 ≡ 1: two factors ≡ 3 can hide in N ≡ 1', 12, ty + 22, { size: 11.5, color: 'muted' });
          if (msg) C.corner(msg, 'br', { size: 11, color: 'red', weight: 600 });
          st = { m, L, N, fs, has1, has3 };
        });
        v.readout(() => {
          if (!st) return '';
          const { m, L, N, fs } = st;
          const head = `$N = ${grp(N)} = ${facTexOf(fs)}$. `;
          if (m === 'm3') return head + `Each listed $p$ divides $N + 1$, so $N \\bmod p = p - 1$ for $p \\in \\{${L.join(', ') || '\\,'}\\}$; the factor${fs.filter(([p]) => p % 4n === 3n).length > 1 ? 's' : ''} $\\equiv 3$ ${fs.filter(([p]) => p % 4n === 3n).map(([p]) => grp(p)).join(', ')} ${fs.filter(([p]) => p % 4n === 3n).length > 1 ? 'are' : 'is'} new.`;
          if (m === 'm1') return head + (st.has1 ? 'This list happened to produce a prime $\\equiv 1$; for the list $\\{5\\}$ it does not ($21 = 3\\cdot 7$), so the method proves nothing.' : 'No prime $\\equiv 1 \\pmod 4$ divides $N$ — the mirror image of the argument fails.');
          return head + 'All prime factors are $\\equiv 1 \\pmod 4$ and new: this polynomial proves that there are infinitely many primes $\\equiv 1 \\pmod 4$.';
        });
      },
    },
    // ------------------------------------------------------------------ 1.11
    {
      num: '1.11',
      kind: 'Theorem',
      name: 'Fermat numbers are pairwise coprime',
      statement: String.raw`The Fermat numbers $F_n=2^{2^n}+1$ $(n\ge0)$ — $3,5,17,257,65537,\dots$ — satisfy
$$F_0F_1\cdots F_{n-1}=F_n-2\qquad(n\ge1),$$
and consequently $\gcd(F_m,F_n)=1$ for all $m\ne n$. In particular each $F_n$ has a prime factor dividing no other Fermat number, which gives another proof that there are infinitely many primes.`,
      idea: String.raw`Induction: $F_0\cdots F_{n-1}\cdot F_n=(F_n-2)F_n=(2^{2^n}-1)(2^{2^n}+1)=2^{2^{n+1}}-1=F_{n+1}-2$. In binary, $F_0\cdots F_{n-1}=2^{2^n}-1$ is a string of $2^n$ ones, and adding $2$ turns it into $F_n=10\cdots01$. If $d$ divides $F_m$ and $F_n$ with $m<n$, then $d$ divides $F_n-F_0\cdots F_{n-1}=2$; Fermat numbers are odd, so $d=1$. The Mersenne numbers $2^n-1$ do *not* behave like this: $\gcd(2^m-1,2^n-1)=2^{\gcd(m,n)}-1$.`,
      caption: String.raw`The table shows $\gcd(F_m,F_n)$ for $m,n\le7$, computed exactly with big integers — off the diagonal it is always $1$. Click a cell: the right panel writes the products $F_0F_1\cdots F_{k-1}$ in binary (all ones, doubling in length) and the $+2$ that produces $F_n$. Switch to Mersenne numbers $2^n-1$ to see what failure looks like: common factors $2^d-1$, visible as repeated blocks of $d$ ones.`,
      deps: ['nt-1.2'],
      tags: ['primes', 'gcd', 'infinitude'],
      credit: 'Goldbach, letter to Euler, 1730',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Fermat_number' },
      viz(v) {
        const M = v.M;
        const fam = v.select('', [{ value: 'F', label: 'Fermat $F_n = 2^{2^n}+1$' }, { value: 'M', label: 'Mersenne $M_n = 2^n - 1$' }], 'F', { onChange: () => { sel = fam.value === 'F' ? [2, 4] : [3, 5]; } });
        const Ts = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 380, weight: 0.85, minWidth: 300 });
        const Bs = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 380, weight: 1.35, minWidth: 420 });
        const F = (n) => 2n ** (2n ** BigInt(n)) + 1n, Mn = (n) => 2n ** BigInt(n) - 1n;
        let sel = [2, 4];
        const tbl = v.table(Ts, { rows: 8, cols: 8, maxCell: 40, size: 12.5, labelSize: 12.5 });
        Ts.onClick((x, y) => { const h = tbl.hit(x, y); if (h && h.i >= 0 && h.j >= 0) sel = [h.i, h.j]; });
        const F7 = [59649589127497217n, 5704689200685129054721n];
        const facCache = new Map();
        const factF = (n) => {
          if (facCache.has(n)) return facCache.get(n);
          const out = n <= 6 ? M.factor(F(n)).map(([p]) => p) : F7; facCache.set(n, out); return out;
        };
        let st = null;
        v.render(() => {
          const fm = fam.value, off = fm === 'F' ? 0 : 1, val = fm === 'F' ? F : Mn;
          const nm = (k) => (fm === 'F' ? `F_${k}` : `M_${k}`);
          const g = (i, j) => M.gcd(val(i + off), val(j + off));
          tbl.draw({
            rowLabels: (i) => `$${nm(i + off)}$`, colLabels: (j) => `$${nm(j + off)}$`, cornerLabel: 'gcd',
            value: (i, j) => (i === j ? `$${nm(i + off)}$` : String(g(i, j))),
            fill: (i, j) => (i === j ? ['blue', 0.12] : g(i, j) === 1n ? ['green', 0.2] : ['red', 0.4]),
            highlight: [[sel[0], sel[1]]],
          });
          Ts.setTitle(fm === 'F' ? '$\\gcd(F_m, F_n)$, exact' : '$\\gcd(M_m, M_n) = M_{\\gcd(m,n)}$');
          // ---- binary panel
          const W = Bs.width, H = Bs.height, [i, j] = sel;
          if (fm === 'F') {
            const n = Math.max(i, j, 1), m = Math.min(i, j), show = Math.min(n, 5);
            Bs.setTitle(n <= 5 ? `$F_0F_1\\cdots F_{${n - 1}} = 2^{2^{${n}}} - 1$ in binary, then $+2 = F_{${n}}$` : `$F_{${n}}$ has $2^{${n}} + 1$ binary digits — too many to draw`);
            const bits = 2 ** show + 1, lw = 128, bw = Math.min(16, (W - lw - 20) / bits), rowH = Math.min(36, (H - 40) / (show + 2.4));
            const X1 = W - 12;
            const rowBits = (Y, str, col, label, hl) => {
              Bs.texPx(label, lw - 10, Y, { align: 'right', size: 13, color: hl ? 'accent' : 'ink' });
              for (let b = 0; b < str.length; b++) {
                const X = X1 - (str.length - b) * bw, one = str[b] === '1';
                rbox(v, Bs, X + 1, Y - bw / 2 + 1, bw - 2, bw - 2, 2, one ? { fill: col, fillAlpha: 0.85 } : { stroke: 'faint', width: 1 });
              }
            };
            if (n <= 5) {
              let prod = 1n;
              for (let k = 0; k < n; k++) {
                prod *= F(k);
                const lab = k === 0 ? 'F_0' : k === 1 ? 'F_0F_1' : k === 2 ? 'F_0F_1F_2' : `F_0\\cdots F_{${k}}`;
                rowBits(18 + rowH * (k + 0.5), prod.toString(2), 'gold', lab, k === m - 1 || k === m);
              }
              const Yp = 18 + rowH * (n + 0.35);
              rowBits(Yp, '10', 'muted', '+\\,2', false);
              Bs.line(Bs.invX(lw), Bs.invY(Yp + rowH * 0.5), Bs.invX(X1), Bs.invY(Yp + rowH * 0.5), { color: 'muted', width: 1 });
              rowBits(18 + rowH * (n + 1.25), F(n).toString(2), 'green', `F_{${n}}`, true);
            } else {
              Bs.texPx(`F_0F_1\\cdots F_{${n - 1}} = 2^{${2 ** n}} - 1 = \\underbrace{11\\cdots1}_{${2 ** n}}{}_2`, W / 2, H * 0.35, { size: 16 });
              Bs.texPx(`F_{${n}} = 1\\underbrace{00\\cdots0}_{${2 ** n - 1}}1_2 = F_0\\cdots F_{${n - 1}} + 2`, W / 2, H * 0.55, { size: 16 });
            }
            const fac = factF(n), ok = fac.reduce((t, p) => t * p, 1n) === F(n);
            const ftxt = fac.length === 1 ? `F_{${n}} = ${grp(F(n))}\\ \\text{is prime}` : `F_{${n}} = ${fac.map(grp).join('\\cdot ')}`;
            Bs.texPx(ftxt, W / 2, H - 22, { size: n >= 6 ? 12 : 14, color: fac.length === 1 ? 'green' : 'ink' });
            st = { fm, m, n, fac, ok };
          } else {
            const a = i + 1, b = j + 1, d = Number(M.gcd(a, b));
            Bs.setTitle(`$M_{${a}}$ and $M_{${b}}$ in binary, cut into blocks of $\\gcd(${a}, ${b}) = ${d}$ digits`);
            const bw = Math.min(30, (W - 140) / 8), X1 = W - 30;
            const draw = (Y, k, lab) => {
              Bs.texPx(lab, 100, Y, { align: 'right', size: 14 });
              for (let bpos = 0; bpos < k; bpos++) {
                const X = X1 - (k - bpos) * bw, blk = Math.floor((k - 1 - bpos) / d);
                rbox(v, Bs, X + 1, Y - bw / 2 + 1, bw - 2, bw - 2, 3, { fill: blk % 2 ? 'orange' : 'purple', fillAlpha: 0.75 });
                Bs.textPx('1', X + bw / 2, Y, { align: 'center', size: 12, weight: 650, halo: false, color: 'panel' });
              }
            };
            draw(80, a, `M_{${a}} = ${2 ** a - 1}`); draw(150, b, `M_{${b}} = ${2 ** b - 1}`); draw(220, d, `M_{${d}} = ${2 ** d - 1}`);
            Bs.texPx(`2^{${a}} - 1 = (2^{${d}} - 1)(1 + 2^{${d}} + \\cdots + 2^{${a - d}})`, W / 2, 285, { size: 14, color: d > 1 ? 'red' : 'green' });
            Bs.texPx(d > 1 ? `\\gcd(M_{${a}}, M_{${b}}) = M_{${d}} = ${2 ** d - 1} \\ne 1` : `\\gcd(${a}, ${b}) = 1 \\Rightarrow \\gcd(M_{${a}}, M_{${b}}) = 1`, W / 2, 325, { size: 14, color: d > 1 ? 'red' : 'green' });
            st = { fm, a, b, d };
          }
        });
        v.readout(() => {
          if (!st) return '';
          if (st.fm === 'M') return `Mersenne numbers share factors whenever their indices do: $\\gcd(2^{${st.a}} - 1, 2^{${st.b}} - 1) = 2^{${st.d}} - 1 = ${2 ** st.d - 1}$. Off-diagonal entries are $1$ only for coprime indices — no analogue of the Fermat identity.`;
          const { m, n, fac, ok } = st;
          const who = n <= 4 ? 'prime (Fermat checked $F_0, \\dots, F_4$)' : n === 5 ? 'composite — Euler, 1732 (factored live here)' : n === 6 ? 'composite — Landry, 1880 (factored live)' : 'composite — Morrison & Brillhart, 1970 (known factors, product and primality checked live)';
          return `Cell $(F_{${m}}, F_{${n}})$: ` + (m === n ? `the diagonal is $F_{${n}}$ itself. ` : `a common divisor would divide $F_{${n}} - F_0\\cdots F_{${n - 1}} = 2$, and Fermat numbers are odd, so $\\gcd = 1$. `) + `$F_{${n}}$ is ${who}${n >= 7 ? (ok ? ' ✓' : ' ✗') : ''}. Its prime factor $${grp(fac[0])}$ divides no other $F_k$ — one new prime per Fermat number.`;
        });
      },
    },
    // ------------------------------------------------------------------ 1.12
    {
      num: '1.12',
      kind: 'Theorem',
      name: 'Arbitrarily long gaps between primes',
      statement: String.raw`For every $n\ge2$ the $n-1$ consecutive integers
$$n!+2,\ n!+3,\ \dots,\ n!+n$$
are all composite. Hence the gaps $p_{k+1}-p_k$ between consecutive primes are unbounded: for every $n$ some gap is at least $n$.`,
      idea: String.raw`For $2\le k\le n$, $k$ divides $n!$ and $k$, hence $k\mid n!+k$, and $n!+k>k$ — so $n!+k$ is composite with the explicit witness $k$. This is an existence proof, and a wasteful one: a gap of length $n$ appears long before $n!$. On average the gap near $x$ is about $\ln x$ (the prime number theorem); the record gaps grow roughly like $(\ln x)^2$ (Cramér’s conjecture). The theorem sits comfortably beside the conjecture that gaps of length $2$ (twin primes) also recur for ever.`,
      caption: String.raw`Slide $n$: the run $n!+2,\dots,n!+n$ is shown with the witness $k\mid n!+k$ in every cell; the two ends $n!+1$ and $n!+n+1$ are tested for primality. Below, every gap between consecutive primes up to $10^7$ (from a sieve) is binned by position and length; gold dots are the record gaps. The green dot marks where a gap $\ge n$ first occurs — compare with $n!$, far off to the right.`,
      deps: ['nt-1.1'],
      tags: ['primes', 'gaps'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Prime_gap' },
      viz(v) {
        const M = v.M;
        const nS = v.slider('$n$', 2, 30, 10, { int: true });
        const A = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 150, full: true });
        const Gs = v.stage({ x: [10, 1e7], y: [0, 165], xlog: true, axes: 'box', height: 330, full: true, xlabel: 'position p (log scale)', ylabel: 'gap', title: 'gaps $p_{k+1} - p_k$ between consecutive primes up to $10^7$: how often (shade), records (gold)' });
        // gap statistics, once
        const P = primeTable().primes, NX = 240, NY = 83, cnt = new Int32Array(NX * NY), recs = [];
        let rec = 0, cmax = 1;
        for (let i = 1; i < P.length; i++) {
          const p = P[i - 1], g = P[i] - p;
          if (g > rec) { rec = g; recs.push([p, g]); }
          if (p < 10) continue;
          const bx = Math.min(NX - 1, Math.floor(((Math.log10(p) - 1) / 6) * NX)), by = Math.min(NY - 1, g >> 1), k = by * NX + bx;
          cnt[k]++; if (cnt[k] > cmax) cmax = cnt[k];
        }
        const lcm = Math.log(1 + cmax);
        const fact = (n) => { let f = 1n; for (let k = 2; k <= n; k++) f *= BigInt(k); return f; };
        v.legend([['accent', 'number of gaps (darker = more)', { area: true }], ['gold', 'record gap', { dot: true }], ['orange', 'average gap $\\ln p$'], ['purple', '$(\\ln p)^2$ (Cramér)', { dash: true }], ['green', 'first gap $\\ge n$', { dot: true }]]);
        let st = null;
        v.render(() => {
          const n = nS.value, F = fact(n), W = A.width;
          // ---- the run n!+2 … n!+n
          const cells = n + 1, cw = Math.min(56, (W - 24) / cells), x0 = W / 2 - (cw * cells) / 2, Y = 70;
          const p1 = M.isPrime(F + 1n), p2 = M.isPrime(F + BigInt(n + 1));
          for (let k = 1; k <= n + 1; k++) {
            const X = x0 + cw * (k - 0.5), end = k === 1 || k === n + 1, pr = k === 1 ? p1 : p2;
            const col = end ? (pr ? 'green' : 'gray') : 'red';
            rbox(v, A, X - cw / 2 + 2, Y - 22, cw - 4, 44, 6, { fill: col, fillAlpha: end ? 0.22 : 0.18, stroke: col, width: 1.4, dash: end ? [4, 3] : null });
            A.textPx(`+${k}`, X, Y - 8, { align: 'center', size: Math.min(12, cw * 0.4), weight: 650, halo: false });
            A.textPx(end ? (pr ? 'prime' : 'comp.') : `${k} |`, X, Y + 10, { align: 'center', size: Math.min(10.5, cw * 0.36), color: col, weight: 650, halo: false });
          }
          A.textPx(`n! = ${n}! = ${F.toString().length > 26 ? F.toString().slice(0, 12) + '…' + ` (${F.toString().length} digits)` : F.toString()}`, W / 2, 20, { align: 'center', size: 12.5, color: 'muted' });
          A.textPx(`${n - 1} consecutive composites n!+2 … n!+n (red); the dashed ends n!+1 and n!+${n + 1} are tested`, W / 2, 124, { align: 'center', size: 11.5, color: 'muted' });
          // ---- gap landscape
          const acc = v.rgb('accent'), key = 'gaps' + acc.join(',');
          Gs.raster((x, y) => {
            if (x < 10 || y < 0) return null;
            const bx = Math.floor(((Math.log10(x) - 1) / 6) * NX), by = Math.floor(y / 2);
            if (bx < 0 || bx >= NX || by >= NY) return null;
            const c = cnt[by * NX + bx]; if (!c) return null;
            return [acc[0], acc[1], acc[2], Math.round(255 * (0.12 + 0.8 * (Math.log(1 + c) / lcm)))];
          }, { res: 2, key });
          Gs.axes();
          Gs.fn((t) => Math.log(t), { color: 'orange', width: 2 });
          Gs.fn((t) => Math.log(t) ** 2, { color: 'purple', width: 1.8, dash: [6, 4] });
          const rp = []; recs.forEach(([p, g]) => { if (p >= 10) rp.push([p, g]); });
          Gs.dots(rp, { r: 3, color: 'gold' });
          Gs.hline(n, { color: 'green', width: 1, dash: [3, 4] });
          const first = recs.find(([, g]) => g >= n);
          if (first && first[0] >= 10) Gs.dot(first[0], first[1], { r: 6, color: 'green', label: `${first[0]} → ${first[0] + first[1]}`, labelPos: 'nw' });
          const Fn = Number(F);
          if (Fn <= 1e7) { Gs.vline(Fn + 2, { color: 'red', width: 1.5, dash: [5, 4] }); Gs.text(`n! + 2`, Fn + 2, 150, { color: 'red', size: 11.5, align: 'right', dx: -5, weight: 650 }); }
          else Gs.corner(`n! + 2 ≈ 10^${Math.floor(Math.log10(Fn))} — far off to the right →`, 'tr', { color: 'red', size: 12, weight: 650 });
          st = { n, F, p1, p2, first };
        });
        v.readout(() => {
          if (!st) return '';
          const { n, F, p1, p2, first } = st;
          const ends = `$n!+1$ is ${p1 ? 'prime' : 'composite'} and $n!+${n + 1}$ is ${p2 ? 'prime' : 'composite'}`;
          return `$${n}! + k$ is divisible by $k$ for $k = 2, \\dots, ${n}$: ${n - 1} consecutive composites; ${ends}. ` + (first ? `But the first gap of length $\\ge ${n}$ already follows the prime $${grp(first[0])}$ (next prime $${grp(first[0] + first[1])}$, gap ${first[1]}), while $n! + 2$ has ${F.toString().length} digits. The largest gap below $10^7$ is 154.` : '');
        });
      },
    },
    // ------------------------------------------------------------------ 1.13
    {
      num: '1.13',
      kind: 'Theorem',
      name: 'Linear Diophantine equations',
      statement: String.raw`Let $a,b,c$ be integers with $a,b$ not both $0$, and $g=\gcd(a,b)$. The equation $ax+by=c$ has an integer solution $(x,y)$ if and only if $g\mid c$. In that case, if $(x_0,y_0)$ is one solution, all solutions are
$$x=x_0+\frac bg\,t,\qquad y=y_0-\frac ag\,t\qquad(t\in\Z).$$
A particular solution is obtained by scaling a Bézout pair: if $ax'+by'=g$, take $(x_0,y_0)=\frac cg(x',y')$.`,
      idea: String.raw`Every value $ax+by$ is a multiple of $g$, so $g\nmid c$ rules out solutions; conversely Bézout (1.4) reaches $g$ and hence every multiple of $g$. If $(x,y)$ and $(x_0,y_0)$ both solve the equation, then $a(x-x_0)=-b(y-y_0)$; dividing by $g$ gives coprime coefficients, and Euclid’s lemma (in its gcd form, 1.5) forces $\frac bg\mid x-x_0$. Geometrically: the line $ax+by=c$ either misses every point of $\Z^2$ or passes through infinitely many, spaced by the vector $(\frac bg,-\frac ag)$.`,
      caption: String.raw`Set $a$, $b$ and $c$. On the left, the line $ax+by=c$ over the integer grid: green dots are its lattice points, joined by the step vector $(b/g,-a/g)$. Choose a $c$ that is not a multiple of $g$ and the line turns red — it threads between the lattice points, and the nearest solvable lines are dashed. On the right, for each integer $x$, the height of the line above the lattice point just below it: these heights take only $b/g$ values, and $0$ is among them exactly when $g\mid c$.`,
      deps: ['nt-1.4', 'nt-1.5'],
      tags: ['diophantine equations', 'gcd'],
      credit: 'Āryabhaṭa, 499 (the kuṭṭaka method)',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Diophantine_equation#Linear_Diophantine_equations' },
      viz(v) {
        const M = v.M, R = 10;
        const aS = v.slider('$a$', 1, 12, 4, { int: true }), bS = v.slider('$b$', 1, 12, 6, { int: true }), cS = v.slider('$c$', -30, 30, 10, { int: true });
        const L = v.stage({ x: [-R - 0.5, R + 0.5], y: [-R - 0.5, R + 0.5], equal: true, height: 400, weight: 1, minWidth: 320, title: 'the line $ax + by = c$ over $\\mathbb Z^2$' });
        const Fs = v.stage({ x: [-R - 0.7, R + 0.7], y: [-0.1, 1.12], height: 400, weight: 1, minWidth: 300, axes: 'box', title: 'for each integer $x$: height of the line above the lattice point below', xlabel: 'x' });
        let st = null;
        v.render(() => {
          const a = aS.value, b = bS.value, c = cS.value, g = M.gcd(a, b), ok = c % g === 0;
          const lineAt = (cc, style) => L.clip(() => L.line(-R - 1, (cc + a * (R + 1)) / b, R + 1, (cc - a * (R + 1)) / b, style));
          const pts = []; for (let x = -R; x <= R; x++) for (let y = -R; y <= R; y++) pts.push([x, y]);
          L.dots(pts, { r: 1.7, color: 'muted', alpha: 0.6 });
          const sols = (cc) => { const out = []; for (let x = -R; x <= R; x++) { const num = cc - a * x; if (num % b === 0 && Math.abs(num / b) <= R) out.push([x, num / b]); } return out; };
          if (!ok) {
            for (const cc of [c - (((c % g) + g) % g), c - (((c % g) + g) % g) + g]) { lineAt(cc, { color: 'green', width: 1.2, dash: [5, 5], alpha: 0.6 }); L.dots(sols(cc), { r: 3.2, color: 'green', alpha: 0.45 }); }
            lineAt(c, { color: 'red', width: 2.6 });
          } else {
            lineAt(c, { color: 'accent', width: 2.4 });
            const S = sols(c);
            for (let i = 0; i + 1 < S.length; i++) L.arrow(S[i][0], S[i][1], S[i + 1][0], S[i + 1][1], { color: 'green', width: 1.8, head: 8 });
            S.forEach(([x, y]) => L.dot(x, y, { r: 5.5, color: 'green' }));
            if (S.length) { const [x, y] = S[Math.floor((S.length - 1) / 2)]; L.tex(`(${x}, ${y})`, x, y, { dx: 14, dy: -14, size: 13, color: 'green', align: 'left' }); }
            if (S.length >= 2) { const [x, y] = S[Math.floor((S.length - 1) / 2)]; L.tex(`+(${b / g}, ${-a / g})`, x + b / g / 2, y - a / g / 2, { dx: 12, dy: 10, size: 12, color: 'green', align: 'left' }); }
          }
          // fractional heights
          const lev = new Set(); for (let x = 0; x < b; x++) lev.add(M.mod(c - a * x, b));
          for (const r of lev) Fs.hline(r / b, { color: r === 0 ? 'green' : 'faint', width: r === 0 ? 1.6 : 1, dash: [4, 4] });
          if (!ok) { Fs.hline(0, { color: 'red', width: 1.6 }); Fs.text('height 0 never reached', R + 0.5, 0.035, { color: 'red', size: 11.5, align: 'right', weight: 650 }); }
          for (let x = -R; x <= R; x++) { const h = M.mod(c - a * x, b) / b; Fs.line(x, 0, x, h, { color: h === 0 ? 'green' : 'accent', width: 2, alpha: 0.5 }); Fs.dot(x, h, { r: h === 0 ? 5.5 : 4, color: h === 0 ? 'green' : 'accent' }); }
          Fs.corner(`${lev.size} possible heights, period b/g = ${b / g} in x`, 'tr', { size: 11.5 });
          st = { a, b, c, g, ok };
        });
        v.readout(() => {
          if (!st) return '';
          const { a, b, c, g, ok } = st;
          if (!ok) return `$\\gcd(${a}, ${b}) = ${g}$ does not divide $${c}$: every value $${a}x + ${b}y$ is a multiple of $${g}$, so the line meets no lattice point. The nearest solvable right-hand sides are $${c - M.mod(c, g)}$ and $${c - M.mod(c, g) + g}$.`;
          const { x, y } = M.egcd(a, b), x0 = (c / g) * x, y0 = (c / g) * y;
          return `$\\gcd(${a}, ${b}) = ${g}$ divides $${c}$ ✓. Bézout: $${a}\\cdot ${par(x)} + ${b}\\cdot ${par(y)} = ${g}$; scaling by $${c / g}$ gives $(x_0, y_0) = (${x0}, ${y0})$, and all solutions are $(x, y) = (${x0} + ${b / g}t,\\ ${y0} - ${a / g}t)$, $t \\in \\mathbb Z$.`;
        });
      },
    },
    // ------------------------------------------------------------------ 1.14
    {
      num: '1.14',
      kind: 'Theorem',
      name: 'Frobenius coin problem for two coins',
      statement: String.raw`Let $a,b\ge2$ be coprime integers. An integer $n\ge0$ is *representable* if $n=ax+by$ with integers $x,y\ge0$. Then:
(a) every $n>ab-a-b$ is representable, while $ab-a-b$ itself is not (the *Frobenius number*);
(b) for $0\le n\le ab-a-b$, exactly one of $n$ and $ab-a-b-n$ is representable, so exactly $\tfrac12(a-1)(b-1)$ nonnegative integers are not representable.
If $\gcd(a,b)>1$, infinitely many integers (all non-multiples of $\gcd(a,b)$) are not representable.`,
      idea: String.raw`Arrange $0,1,2,\dots$ in $a$ columns by their remainder mod $a$. The multiples $0,b,2b,\dots,(a-1)b$ land in different columns (since $\gcd(a,b)=1$), one in each; in its column, everything from that multiple upward is representable (add $a$’s) and everything below is not (a representation would need fewer $b$’s, landing in another column). The highest starting point is $(a-1)b$, so the last gap sits just below it, at $(a-1)b-a=ab-a-b$. For (b): if $n=ax+by$ and $ab-a-b-n=ax'+by'$ with $x,y,x',y'\ge0$, adding gives $a(x+x'+1)+b(y+y'+1)=ab$, impossible by the uniqueness in 1.13; and a counting argument with the columns shows one of the two is always representable.`,
      caption: String.raw`Choose coin values $a$ and $b$. The grid puts each amount in the column of its remainder mod $a$: green amounts can be paid, red ones cannot, and each column turns green at the first multiple of $b$ it contains (bold outline) — a staircase whose top gap is $ab-a-b$. Click an amount: its partner $ab-a-b-n$ lights up, and exactly one of the two is payable (see also the number line). Make $a$ and $b$ share a factor and whole columns stay red for ever.`,
      deps: ['nt-1.13'],
      tags: ['diophantine equations', 'combinatorics'],
      credit: 'Sylvester, 1882–1884',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Coin_problem' },
      viz(v) {
        const M = v.M;
        const aS = v.slider('coin $a$', 2, 12, 5, { int: true }), bS = v.slider('coin $b$', 2, 16, 7, { int: true });
        const G = v.stage({ x: [-1, 5], y: [-1, 8], equal: true, axes: false, height: 400, title: 'amounts in columns by remainder mod $a$' });
        const Nl = v.stage({ x: [-1, 30], y: [-1, 1.6], axes: false, height: 118, full: true });
        let sel = 9, st = null, geo = null;
        G.onClick((x, y) => { if (!geo) return; const c = Math.round(x), r = Math.round(y); if (c >= 0 && c < geo.a && r >= 0 && r < geo.rows) sel = r * geo.a + c; });
        Nl.onClick((x) => { const n = Math.round(x); if (n >= 0 && geo && n <= geo.nMax) sel = n; });
        const rep = (n, a, b) => { for (let y = 0; y * b <= n; y++) if ((n - y * b) % a === 0) return [(n - y * b) / a, y]; return null; };
        v.render(() => {
          const a = aS.value, b = bS.value, g = M.gcd(a, b), cop = g === 1, F = a * b - a - b;
          const first = new Array(a).fill(Infinity); for (let k = 0; k < a; k++) { const n = k * b; first[n % a] = Math.min(first[n % a], n); }
          const rows = cop ? Math.floor(((a - 1) * b) / a) + 2 : b + 2, nMax = rows * a - 1;
          geo = { a, rows, nMax };
          G.setView([-0.7, a - 0.3], [-0.7, rows - 0.3]);
          if (sel > nMax) sel = Math.min(nMax, cop ? Math.max(0, F - 3) : 1);
          const partner = cop && sel <= F ? F - sel : null, sc = G.scale;
          for (let n = 0; n <= nMax; n++) {
            const c = n % a, r = Math.floor(n / a), pay = n >= first[c];
            G.rect(c - 0.46, r - 0.46, c + 0.46, r + 0.46, { fill: pay ? 'green' : 'red', fillAlpha: pay ? 0.28 : 0.3, stroke: false });
            if (n === first[c]) G.rect(c - 0.46, r - 0.46, c + 0.46, r + 0.46, { color: 'green', width: 2.6 });
            if (cop && n === F) G.rect(c - 0.5, r - 0.5, c + 0.5, r + 0.5, { color: 'red', width: 3 });
            if (n === sel) G.rect(c - 0.5, r - 0.5, c + 0.5, r + 0.5, { color: 'ink', width: 2.6 });
            if (n === partner) G.rect(c - 0.5, r - 0.5, c + 0.5, r + 0.5, { color: 'purple', width: 2.6, dash: [4, 3] });
            if (sc >= 16) G.text(String(n), c, r + (n === first[c] && sc >= 30 ? 0.1 : 0), { align: 'center', size: Math.min(13, sc * 0.4), weight: pay ? 650 : 500, color: pay ? 'ink' : 'red', halo: false });
            if (n === first[c] && sc >= 30) G.text(`${n / b}b`, c, r - 0.28, { align: 'center', size: Math.min(10, sc * 0.26), color: 'green', halo: false });
          }
          if (cop) { const c = F % a, r = Math.floor(F / a); G.text('F', c + 0.46, r + 0.46, { align: 'right', baseline: 'top', size: 11, color: 'red', weight: 700, dx: -2, dy: 2, halo: false }); }
          // number line 0 … max
          const top = cop ? Math.max(F + Math.min(a, b) + 2, 12) : Math.min(nMax, 4 * a * b);
          Nl.setView([-1, top + 1], [-1, 1.6]);
          Nl.line(-0.5, 0, top + 0.5, 0, { color: 'muted', width: 1 });
          for (let n = 0; n <= top; n++) { const pay = n >= first[n % a]; Nl.dot(n, 0, { r: top > 90 ? 2.2 : 3.6, color: pay ? 'green' : 'red' }); }
          if (cop) {
            Nl.vline(F / 2, { color: 'muted', dash: [3, 4], width: 1 });
            Nl.text(`F = ab − a − b = ${F}`, F, -0.62, { align: 'center', size: 11.5, color: 'red', weight: 650 });
            Nl.dot(F, 0, { r: 5.5, color: 'red' });
            if (partner != null && partner !== sel) Nl.curve((t) => [sel + (partner - sel) * t, 0.12 + 1.1 * Math.sin(Math.PI * t)], 0, 1, { color: 'purple', width: 1.8 });
          } else Nl.corner(`gcd(a, b) = ${g}: only multiples of ${g} can ever be paid`, 'tr', { size: 11.5, color: 'red', weight: 650 });
          Nl.dot(sel, 0, { r: 6, color: 'ink' });
          let unpay = 0; if (cop) for (let n = 0; n <= F; n++) if (n < first[n % a]) unpay++;
          st = { a, b, g, F, unpay, cop, first, partner };
        });
        v.readout(() => {
          if (!st) return '';
          const { a, b, g, F, unpay, cop, first, partner } = st;
          const pay = (n) => n >= first[n % a], show = (n) => { const r = rep(n, a, b); return r ? `$${n} = ${r[0]}\\cdot ${a} + ${r[1]}\\cdot ${b}$` : `$${n}$ cannot be paid`; };
          if (!cop) return `$\\gcd(${a}, ${b}) = ${g} > 1$: amounts not divisible by $${g}$ are never payable — infinitely many gaps. ${show(sel)}.`;
          let s = `Largest unpayable amount $F = ${a}\\cdot${b} - ${a} - ${b} = ${F}$; unpayable amounts: ${unpay} $= \\tfrac12(${a}-1)(${b}-1)$ ✓. `;
          if (partner != null) s += `${show(sel)}; partner $${F} - ${sel} = ${partner}$: ${show(partner)} — ${pay(sel) !== pay(partner) ? 'exactly one of the two is payable ✓' : '✗'}.`;
          else s += `${show(sel)} (every amount above $${F}$ is payable).`;
          return s;
        });
      },
    },
  ],
};
