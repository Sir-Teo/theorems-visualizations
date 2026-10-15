// Algorithms — Chapter 5: Search trees and hashing (items 5.11–5.20; 5.1–5.10 in ch05.js)

const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
const LG = Math.log2;
const plural = (n, w, ws) => `${n} ${n === 1 ? w : ws || w + 's'}`;
const PRIME = 1000003;                                   // prime > every key used below
const GOLDEN = (Math.sqrt(5) - 1) / 2;
const uh = (a, b, p, m) => (x) => ((a * x + b) % p) % m; // ((ax + b) mod p) mod m
const tnum = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '{,}');
function distinct(r, cnt, lo, hi, step = 1) { const out = new Set(); while (out.size < cnt) out.add(lo + step * Math.floor(r() * ((hi - lo) / step + 1))); return [...out]; }
function poissonPmf(l, k) { let p = Math.exp(-l); for (let i = 1; i <= k; i++) p *= l / i; return p; }

// ---------- 5.13–5.14: open addressing
/** Fill a table of size m with the given probe scheme up to each load factor in `alphas`; measure searches. */
function oaSimulate(scheme, m, alphas, r, searches) {
  const T = new Uint8Array(m), stamp = new Int32Array(m); let sid = 0, n = 0, insSum = 0; const out = [], insCosts = [];
  const probe = (onSlot) => {           // runs a probe sequence until onSlot(slot) returns true; returns the number of probes
    let c = 0;
    if (scheme === 'uniform') { sid++; for (;;) { const s = Math.floor(r() * m); if (stamp[s] === sid) continue; stamp[s] = sid; c++; if (onSlot(s)) return c; } }
    const h1 = Math.floor(r() * m), h2 = scheme === 'linear' ? 1 : 1 + Math.floor(r() * (m - 1));
    for (let i = 0; ; i++) { c++; if (onSlot((h1 + i * h2) % m)) return c; }
  };
  for (const a of alphas) {
    while (n < Math.round(a * m)) { const c = probe((s) => { if (!T[s]) { T[s] = 1; return true; } return false; }); insSum += c; insCosts.push(c); n++; }
    let su = 0; const costs = [];
    for (let k = 0; k < searches; k++) { const c = probe((s) => !T[s]); su += c; costs.push(c); }
    out.push({ a: n / m, uns: su / searches, suc: insSum / n, costs, ins: insCosts.slice() });
  }
  return out;
}
const OA_THEORY = {
  uniform: { uns: (a) => 1 / (1 - a), suc: (a) => (a ? Math.log(1 / (1 - a)) / a : 1) },
  linear: { uns: (a) => 0.5 * (1 + 1 / (1 - a) ** 2), suc: (a) => 0.5 * (1 + 1 / (1 - a)) },
};

// ---------- 5.19–5.20: skip lists. Node 0 is the head; nodes 1..n hold the sorted keys; H[i] = tower height.
function skipSearch(H, keys, q) {
  const n = keys.length, top = H[0]; let i = 0, l = top - 1; const moves = [];
  const next = (i, l) => { for (let j = i + 1; j <= n; j++) if (H[j] > l) return j; return null; };
  for (;;) {
    const j = next(i, l);
    if (j != null && keys[j - 1] <= q) { moves.push({ t: 'r', i, j, l }); i = j; }
    else if (l > 0) { moves.push({ t: 'd', i, j: i, l }); l--; }
    else break;
  }
  return { moves, end: i, right: moves.filter((m) => m.t === 'r').length, down: moves.filter((m) => m.t === 'd').length };
}
const flips = (r, p = 0.5, cap = 12) => { const c = ['H']; while (c.length < cap && r() < p) c.push('H'); if (c.length < cap) c.push('T'); return c; }; // first entry: every key has level 0
const towerOf = (c) => c.filter((x) => x === 'H').length;
function drawSkip(s, H, keys, o = {}) {
  const n = keys.length, top = H[0];
  s.setView([-0.8, n + 1.8], [-1.35 - (o.padB || 0), top - 0.25 + (o.padT || 0)]);
  const bw = 0.29, bh = 0.3, fs = clamp(s.sx * 0.36, 8, 12.5);
  // links at every level
  for (let l = 0; l < top; l++) {
    let i = 0;
    for (let j = 1; j <= n + 1; j++) {
      if (j <= n && H[j] <= l) continue;
      const hot = o.hotLink && o.hotLink(i, j, l);
      s.arrow(i + bw, l, j - bw - 0.02, l, { color: hot || 'muted', width: hot ? 3 : 1.2, head: hot ? 8 : 6, alpha: hot ? 1 : 0.75 });
      i = j;
    }
  }
  // towers
  for (let j = 0; j <= n; j++) for (let l = 0; l < H[j]; l++) {
    const col = o.towerColor ? o.towerColor(j, l) : null;
    s.rect(j - bw, l - bh, j + bw, l + bh, { fill: col || 'panel', fillAlpha: col ? 0.3 : 1, color: col || (j ? 'muted' : 'ink'), width: col ? 2 : 1.3 });
  }
  for (let l = 0; l < top; l++) { s.rect(n + 1 - bw, l - bh, n + 1 + bw, l + bh, { fill: 'grid', fillAlpha: 1, color: 'faint', width: 1 }); }
  s.text('head', 0, -0.78, { align: 'center', size: 11, color: 'muted', weight: 600 });
  s.text('nil', n + 1, -0.78, { align: 'center', size: 11, color: 'muted', weight: 600 });
  keys.forEach((k, i) => s.text(String(k), i + 1, -0.78, { align: 'center', size: fs, weight: 700, color: o.keyColor ? o.keyColor(i + 1) || 'ink' : 'ink' }));
}

export default {
  collection: 'algo',
  chapter: 5,
  items: [
    // ------------------------------------------------------------------ 5.11
    {
      num: '5.11',
      kind: 'Definition',
      name: 'Hash tables with chaining',
      statement: String.raw`A **hash table** stores a dynamic set of keys from a universe $U$ in an array $T[0..m-1]$ of **buckets**, using a **hash function** $h:U\to\{0,\dots,m-1\}$. With **chaining**, bucket $T[j]$ holds a linked list (5.1) of all stored keys $k$ with $h(k)=j$: INSERT$(k)$ adds $k$ at the head of the list $T[h(k)]$ in $O(1)$ time, SEARCH$(k)$ scans that list, and DELETE removes a node from it. The **load factor** is $\alpha=n/m$, the average chain length. Typical hash functions are the division method $h(k)=k\bmod m$ and the multiplication method $h(k)=\lfloor m\,\{kA\}\rfloor$ with $0<A<1$.`,
      idea: String.raw`Two keys that hash to the same bucket — a **collision** — simply share a list, so the table never overflows; the price is that a search costs one hash evaluation plus the length of one chain. Everything therefore depends on how evenly $h$ spreads the keys actually stored: a good function makes every chain about $\alpha$ long (5.12), a function that ignores most of the key, or one whose structure matches the keys', piles them into a few chains.`,
      caption: String.raw`Choose a hash function, a key set, $m$ and the number of keys. Each new key goes to the head of its chain (gold), with its hash computed on top. Compare the longest chain with $\alpha$: the division method with $m = 10$ on multiples of 10, or the last-digit hash with $m > 10$, leaves most buckets empty.`,
      deps: ['algo-5.1'],
      refs: ['CLRS 4e §11.1', 'CLRS 4e §11.2'],
      credit: 'H. P. Luhn, 1953',
      tags: ['hashing'],
      viz(v) {
        const hs = v.select('hash', [{ value: 'div', label: '$k \\bmod m$' }, { value: 'mul', label: '$\\lfloor m\\{kA\\}\\rfloor$' }, { value: 'dig', label: 'last digit' }], 'div');
        const ks = v.select('keys', [{ value: 'rand', label: 'random' }, { value: 'tens', label: 'multiples of 10' }], 'rand');
        const mS = v.slider('buckets $m$', 4, 13, 9, { int: true });
        const nS = v.slider('keys $n$', 0, 30, 17, { int: true });
        let seed = 5;
        v.button('New keys', () => { seed++; });
        const s = v.stage({ x: [-2.6, 15], y: [-0.6, 13], axes: false, height: 380 });
        const H = {
          div: (k, m) => k % m, mul: (k, m) => Math.floor(m * ((k * GOLDEN) % 1)), dig: (k, m) => (k % 10) % m,
        };
        const HT = { div: (k, m, b) => `h(${k}) = ${k} \\bmod ${m} = ${b}`, mul: (k, m, b) => `h(${k}) = \\lfloor ${m}\\cdot\\{${k}A\\}\\rfloor = \\lfloor ${m}\\cdot ${((k * GOLDEN) % 1).toFixed(3)}\\rfloor = ${b}`, dig: (k, m, b) => `h(${k}) = (${k} \\bmod 10) \\bmod ${m} = ${b}` };
        let info = null;
        v.render(() => {
          const m = mS.value, n = nS.value, r = v.rng(seed * 31 + (ks.value === 'tens' ? 7 : 0));
          const keys = ks.value === 'rand' ? distinct(r, 30, 100, 999) : distinct(r, 30, 100, 990, 10);
          const ch = Array.from({ length: m }, () => []);
          for (let i = 0; i < n; i++) ch[H[hs.value](keys[i], m)].unshift(keys[i]);
          const last = n ? keys[n - 1] : null, lb = last != null ? H[hs.value](last, m) : -1;
          s.setView([-2.7, 15], [-0.7, m + 0.55]);
          const ry = (j) => m - 1 - j, step = 1.48, MAXV = 9;
          for (let j = 0; j < m; j++) {
            const y = ry(j), hot = j === lb;
            s.rect(-2.3, y - 0.38, -1.3, y + 0.38, { fill: hot ? 'gold' : 'panel', fillAlpha: hot ? 0.25 : 1, color: hot ? 'gold' : 'muted', width: hot ? 2.4 : 1.3 });
            s.text(String(j), -1.8, y, { align: 'center', size: 12.5, weight: 700, color: 'muted' });
            if (!ch[j].length) { s.text('nil', -0.9, y, { size: 11, color: 'faint' }); continue; }
            s.arrow(-1.3, y, -0.03, y, { color: hot ? 'orange' : 'ink', width: hot ? 2.4 : 1.3, head: 7 });
            ch[j].slice(0, MAXV).forEach((k, i) => {
              const x = i * step, isNew = hot && i === 0;
              s.rect(x, y - 0.36, x + 1.02, y + 0.36, { fill: isNew ? 'gold' : 'accent', fillAlpha: isNew ? 0.3 : 0.08, color: isNew ? 'gold' : 'accent', width: isNew ? 2.4 : 1.2 });
              s.text(String(k), x + 0.51, y, { align: 'center', size: 12, weight: 700 });
              if (i < Math.min(ch[j].length, MAXV) - 1) s.arrow(x + 1.02, y, x + step - 0.03, y, { color: 'ink', width: 1.2, head: 6 });
            });
            if (ch[j].length > MAXV) s.text(`+${ch[j].length - MAXV} more`, MAXV * step - 0.2, y, { size: 11.5, weight: 700, color: 'red' });
          }
          if (last != null) s.tex(HT[hs.value](last, m, lb), 6.2, m - 0.05, { size: 15, color: 'gold' });
          const lens = ch.map((c) => c.length);
          info = { m, n, longest: Math.max(...lens), empty: lens.filter((x) => !x).length, last, lb };
        });
        v.legend([['gold', 'newest key and its bucket', { area: true }], ['accent', 'chained keys', { area: true }]]);
        v.readout(() => {
          const { m, n, longest, empty } = info, a = n / m;
          return `$n = ${n}$, $m = ${m}$: load factor $\\alpha = n/m = ${v.fix(a, 2)}$ · longest chain **${longest}** ${longest > 2 * Math.ceil(a) + 2 ? '(far above α: the hash is not spreading these keys)' : ''} · empty buckets ${empty} of ${m} · insert at the head: $O(1)$ · a search costs 1 hash + one chain`;
        });
      },
    },
    // ------------------------------------------------------------------ 5.12
    {
      num: '5.12',
      kind: 'Theorem',
      name: 'Chaining: expected search time Θ(1 + α)',
      statement: String.raw`Assume **simple uniform hashing**: every key is equally likely to hash to each of the $m$ buckets, independently of the other keys. Then in a hash table with chaining and load factor $\alpha=n/m$,
(a) an unsuccessful search examines $\alpha$ keys on average, so it takes $\Theta(1+\alpha)$ expected time;
(b) a successful search for a uniformly chosen stored key examines $1+\frac{\alpha}{2}-\frac{\alpha}{2n}$ keys on average, also $\Theta(1+\alpha)$.

If $m$ grows in proportion to $n$, so that $\alpha=O(1)$, all dictionary operations take $O(1)$ expected time.`,
      idea: String.raw`(a) The searched key lands in a uniformly random bucket, whose expected length is $n/m=\alpha$. (b) With insertion at the head, finding the $i$-th inserted key scans it plus the keys inserted after it into the same bucket; by indicator variables and linearity of expectation (3.3) that is $1+\sum_{j>i}\frac1m$, and averaging over $i$ gives $1+\frac{n-1}{2m}$. The assumption is about the hash function *and* the keys together: a modulus sharing a factor with all the keys breaks it, which 5.15–5.17 address by choosing $h$ at random.`,
      caption: String.raw`Measured average costs (dots) for $\alpha$ from 0.25 to 5, each from a table of about 1000 buckets with $\alpha m$ keys: an unsuccessful search costs 1 (the hash) plus the keys it examines, against $1+\alpha$; a successful one costs the keys it examines, the one found included, against $1+\alpha/2$. The slider picks one $\alpha$, whose chain-length histogram is compared with the Poisson law that uniform hashing predicts. Switch to keys that are multiples of 8 hashed mod 1000 to watch the guarantee fail — and a prime modulus repair it.`,
      deps: ['algo-5.11', 'algo-3.3'],
      refs: ['CLRS 4e §11.2'],
      tags: ['hashing'],
      viz(v) {
        const sc = v.select('keys and hash', [{ value: 'good', label: 'random keys, $k \\bmod 1000$' }, { value: 'bad', label: 'multiples of 8, $k \\bmod 1000$' }, { value: 'prime', label: 'multiples of 8, $k \\bmod 997$' }], 'good');
        const aS = v.slider('load factor $\\alpha$', 0.25, 5, 2, { step: 0.25 });
        const P = v.stage({ x: [0, 5.15], y: [0, 9], axes: 'box', height: 320, minWidth: 300, title: 'average search cost (dots: measured)', xlabel: 'α' });
        const Hs = v.stage({ x: [-0.7, 14.7], y: [0, 0.6], axes: 'box', height: 320, minWidth: 260, title: 'fraction of buckets with each chain length', xlabel: 'chain length' });
        const cache = {}, AL = Array.from({ length: 20 }, (_, i) => (i + 1) / 4);
        const sim = (kind) => {
          if (cache[kind]) return cache[kind];
          const m = kind === 'prime' ? 997 : 1000, r = v.rng(kind === 'good' ? 11 : 12), key = () => (kind === 'good' ? Math.floor(r() * 1e9) : 8 * Math.floor(r() * 1.25e8));
          const out = AL.map((a) => {
            const n = Math.round(a * m), cnt = new Int32Array(m);
            for (let i = 0; i < n; i++) cnt[key() % m]++;
            let suc = 0; for (let j = 0; j < m; j++) suc += (cnt[j] * (cnt[j] + 1)) / 2;
            let uns = 0; const S = 3000; for (let t = 0; t < S; t++) uns += 1 + cnt[key() % m];
            const hist = new Map(); let mx = 0; for (let j = 0; j < m; j++) { hist.set(cnt[j], (hist.get(cnt[j]) || 0) + 1); mx = Math.max(mx, cnt[j]); }
            return { a, n, m, uns: uns / S, sucExam: suc / n, hist, mx, used: [...cnt].filter((c) => c).length };
          });
          return (cache[kind] = out);
        };
        let info = null;
        v.render(() => {
          const D = sim(sc.value), YM = 9, cur = D.find((d) => Math.abs(d.a - aS.value) < 1e-9) || D[7];
          P.fn((a) => 1 + a, { color: 'green', width: 2.2, domain: [0, 5.15] });
          P.fn((a) => 1 + a / 2, { color: 'teal', width: 2, dash: [7, 4], domain: [0, 5.15] });
          let off = false;
          for (const d of D) {
            const su = d.sucExam; // keys examined, the one found included
            if (d.uns <= YM) P.dot(d.a, d.uns, { r: 3.6, color: 'accent' }); else off = true;
            if (su <= YM) P.dot(d.a, su, { r: 3.6, color: 'purple' });
          }
          if (off) P.text('unsuccessful: 1 + 8α, off the chart ↑', 2.3, 8.3, { size: 11.5, color: 'accent', weight: 700 });
          P.vline(cur.a, { color: 'muted', width: 1, dash: [2, 3] });
          // histogram vs Poisson
          const mx = Math.max(14, cur.mx), fr = []; let fmax = 0;
          for (let c = 0; c <= mx; c++) { const f = (cur.hist.get(c) || 0) / cur.m; fr.push(f); fmax = Math.max(fmax, f); }
          const yt = Math.max(0.3, fmax * 1.12); Hs.setView([-0.22 * (mx + 1) - 0.7, mx + 0.7], [-0.07 * yt, yt]);
          fr.forEach((f, c) => { if (f) Hs.rect(c - 0.4, 0, c + 0.4, f, { fill: 'accent', fillAlpha: 0.45, color: 'accent', width: 1 }); });
          const pts = []; for (let c = 0; c <= mx; c++) pts.push([c, poissonPmf(cur.a, c)]);
          Hs.path(pts, { color: 'green', width: 1.8 }); pts.forEach(([c, y]) => Hs.dot(c, y, { r: 2.8, color: 'green' }));
          info = { cur };
        });
        v.legend([['accent', 'unsuccessful (measured)', { dot: true }], ['purple', 'successful (measured)', { dot: true }], ['green', '$1+\\alpha$ / Poisson($\\alpha$)'], ['teal', '$1+\\alpha/2$', { dash: true }]]);
        v.readout(() => {
          const { cur } = info, a = cur.a, n = cur.n;
          const base = `At $\\alpha = ${a}$ ($n = ${tnum(n)}$, $m = ${cur.m}$): unsuccessful **${v.fix(cur.uns, 2)}** vs $1+\\alpha = ${v.fix(1 + a, 2)}$ · successful **${v.fix(cur.sucExam, 2)}** vs $1+\\frac{\\alpha}{2}-\\frac{\\alpha}{2n} = ${v.fix(1 + a / 2 - a / (2 * n), 2)}$ · longest chain ${cur.mx}`;
          return base + (sc.value === 'bad' ? ` · only ${cur.used} of 1000 buckets are ever used: every key is $\\equiv 0 \\pmod 8$ and so is $1000$, **the uniformity assumption fails** ✗` : ' ✓');
        });
      },
    },
    // ------------------------------------------------------------------ 5.13
    {
      num: '5.13',
      kind: 'Definition',
      name: 'Open addressing: linear probing and double hashing',
      statement: String.raw`In **open addressing** all keys live in the table itself, so $n\le m$. A hash function now gives each key a **probe sequence** $h(k,0),h(k,1),\dots,h(k,m-1)$, a permutation of the slots: INSERT puts $k$ into the first empty slot of its sequence, and SEARCH follows the same sequence until it finds $k$ or an empty slot. Common choices, with auxiliary hash functions $h_1, h_2$:
- **linear probing** $h(k,i)=(h_1(k)+i)\bmod m$;
- **double hashing** $h(k,i)=(h_1(k)+i\,h_2(k))\bmod m$, where $h_2(k)$ is coprime to $m$ (e.g. $m$ prime and $1\le h_2(k)<m$).

Deletion must leave a "deleted" marker, since emptying a slot would cut the probe sequences that pass through it.`,
      idea: String.raw`Linear probing is simple and cache-friendly but suffers from **primary clustering**: a run of occupied slots is hit by every key hashing anywhere into it, so long runs grow faster than short ones and probe counts blow up as $\alpha\to1$. Double hashing gives keys that collide at their first probe different step sizes, so their sequences separate at once; its performance is close to the idealised uniform hashing of 5.14.`,
      caption: String.raw`The table of 31 slots is drawn as a ring; the arcs outside mark runs of occupied slots, coloured by length. Raise the number of keys and watch the newest key's probe sequence (numbered arrows): with linear probing it creeps along a cluster, with double hashing it jumps. Right: probes used by each insertion in order.`,
      deps: ['algo-5.11'],
      refs: ['CLRS 4e §11.4'],
      credit: 'Amdahl, Boehme, Rochester & Samuel (linear probing), 1954',
      tags: ['hashing'],
      viz(v) {
        const pr = v.select('probe sequence', [{ value: 'lin', label: 'linear probing' }, { value: 'dbl', label: 'double hashing' }], 'lin');
        const nS = v.slider('keys inserted', 0, 28, 21, { int: true });
        let seed = 2;
        v.button('New keys', () => { seed++; });
        const m = 31;
        const R = v.stage({ x: [-1.4, 1.4], y: [-1.4, 1.4], equal: true, axes: false, height: 370, minWidth: 330 });
        const B = v.stage({ x: [0.3, 28.7], y: [0, 14], axes: 'box', height: 370, minWidth: 240, title: 'probes used by each insertion', xlabel: 'key number' });
        const ang = (i) => Math.PI / 2 - (2 * Math.PI * i) / m, P = (i, rr = 1) => [rr * Math.cos(ang(i)), rr * Math.sin(ang(i))];
        const runCol = (L) => (L >= 8 ? 'red' : L >= 5 ? 'purple' : L >= 3 ? 'accent' : 'teal');
        let info = null;
        v.render(() => {
          const n = nS.value, keys = distinct(v.rng(seed * 13), 28, 0, 999), T = new Array(m).fill(null), costs = [], seqs = [];
          for (let t = 0; t < n; t++) {
            const k = keys[t], h1 = k % m, h2 = pr.value === 'lin' ? 1 : 1 + (k % (m - 1)), seq = [];
            for (let i = 0; i < m; i++) { const sl = (h1 + i * h2) % m; seq.push(sl); if (T[sl] == null) { T[sl] = k; break; } }
            costs.push(seq.length); seqs.push(seq);
          }
          // runs (circular)
          const runs = []; const occ = (i) => T[((i % m) + m) % m] != null;
          if (n === m) runs.push([0, m]); else if (n) { let s0 = 0; while (occ(s0)) s0++; for (let i = s0 + 1; i <= s0 + m; i++) { if (occ(i) && !occ(i - 1)) { let L = 0; while (occ(i + L)) L++; runs.push([i % m, L]); } } }
          for (const [a, L] of runs) {
            const t0 = ang(a) + Math.PI / m * 0.9, t1 = ang(a + L - 1) - Math.PI / m * 0.9;
            R.curve((u) => [1.22 * Math.cos(t0 + (t1 - t0) * u), 1.22 * Math.sin(t0 + (t1 - t0) * u)], 0, 1, { color: runCol(L), width: 6 });
            if (L >= 3) { const [x, y] = P(a + (L - 1) / 2, 1.36); R.text(String(L), x, y, { align: 'center', size: 11.5, weight: 700, color: runCol(L) }); }
          }
          const lastSeq = n ? seqs[n - 1] : [];
          for (let i = 0; i < m; i++) {
            const [x, y] = P(i), k = T[i], isNew = n && i === lastSeq[lastSeq.length - 1], tried = lastSeq.includes(i) && !isNew;
            R.circle(x, y, 0.088, { fill: isNew ? 'gold' : k != null ? 'accent' : 'panel', fillAlpha: isNew ? 0.6 : k != null ? 0.18 : 1, color: isNew ? 'gold' : tried ? 'orange' : k != null ? 'accent' : 'faint', width: isNew || tried ? 2.4 : 1.2 });
            if (k != null) R.text(String(k), x, y, { align: 'center', size: 9.5, weight: 700, color: 'ink', halo: false });
            const [lx, ly] = P(i, 0.8); R.text(String(i), lx, ly, { align: 'center', size: 9, color: 'muted' });
          }
          for (let t = 0; t + 1 < lastSeq.length; t++) {
            const [x0, y0] = P(lastSeq[t], 0.88), [x1, y1] = P(lastSeq[t + 1], 0.88), mx = (x0 + x1) / 2 * 0.86, my = (y0 + y1) / 2 * 0.86;
            R.curve((u) => [(1 - u) ** 2 * x0 + 2 * u * (1 - u) * mx + u * u * x1, (1 - u) ** 2 * y0 + 2 * u * (1 - u) * my + u * u * y1], 0, 1, { color: 'orange', width: 2 });
            R.arrow(0.25 * mx + 0.75 * x1 - (x1 - mx) * 0.02, 0.25 * my + 0.75 * y1, x1, y1, { color: 'orange', width: 2, head: 7 });
            R.text(String(t + 1), mx, my, { align: 'center', size: 10.5, weight: 700, color: 'orange' });
          }
          if (n) { const k = keys[n - 1]; R.corner(`newest key ${k}`, 'tl', { color: 'gold', weight: 700, size: 13 }); R.corner(pr.value === 'lin' ? `h₁ = ${k % m}, step 1` : `h₁ = ${k % m}, step h₂ = ${1 + (k % (m - 1))}`, 'bl', { color: 'muted', size: 12 }); R.corner(plural(lastSeq.length, 'probe'), 'tr', { color: 'orange', weight: 700, size: 13 }); }
          const ym = Math.max(10, ...costs) + 1; B.setView([-1.6, 28.7], [-0.07 * ym, ym]);
          costs.forEach((c, t) => B.rect(t + 0.62, 0, t + 1.38, c, { fill: t === n - 1 ? 'gold' : pr.value === 'lin' ? 'orange' : 'teal', fillAlpha: 0.55, color: t === n - 1 ? 'gold' : pr.value === 'lin' ? 'orange' : 'teal', width: 1 }));
          info = { n, costs, runs, lastSeq, keys };
        });
        v.legend([['gold', 'newest key', { area: true }], ['orange', 'its earlier probes'], ['teal', 'run of 1–2'], ['accent', '3–4'], ['purple', '5–7'], ['red', '8 or more occupied slots']]);
        v.readout(() => {
          const { n, costs, runs, lastSeq } = info; if (!n) return 'Empty table.';
          const avg = costs.reduce((a, b) => a + b, 0) / n, longest = Math.max(0, ...runs.map((r) => r[1]));
          return `$n = ${n}$, $m = ${m}$, $\\alpha = ${v.fix(n / m, 2)}$ · average probes per insertion **${v.fix(avg, 2)}** · longest run of occupied slots **${longest}** (${plural(runs.length, 'run')}) · newest key probed ${lastSeq.join(' → ')}`;
        });
      },
    },
    // ------------------------------------------------------------------ 5.14
    {
      num: '5.14',
      kind: 'Theorem',
      name: 'Open addressing: at most 1/(1 − α) expected probes',
      statement: String.raw`Assume **uniform hashing**: the probe sequence of each key is equally likely to be any of the $m!$ permutations of the slots, independently of other keys. In an open-address table with load factor $\alpha=n/m<1$:
(a) an unsuccessful search makes at most $\dfrac{1}{1-\alpha}$ probes in expectation (and so does an insertion);
(b) a successful search for a uniformly chosen stored key makes at most $\dfrac1\alpha\ln\dfrac1{1-\alpha}$ probes in expectation.

Linear probing does worse, about $\frac12\bigl(1+\frac1{(1-\alpha)^2}\bigr)$ and $\frac12\bigl(1+\frac1{1-\alpha}\bigr)$ (Knuth).`,
      idea: String.raw`(a) The first probe hits an occupied slot with probability $\frac nm=\alpha$; given that, the second hits one of the $n-1$ remaining occupied slots among $m-1$, with probability $\frac{n-1}{m-1}\le\alpha$, and so on. Hence $\Pr[X\ge i]\le\alpha^{i-1}$ and $E[X]=\sum_{i\ge1}\Pr[X\ge i]\le\sum_{i\ge0}\alpha^i=\frac1{1-\alpha}$, a geometric series (pma-3.26). (b) Searching for the $(i+1)$-st inserted key repeats its insertion, which cost at most $\frac{m}{m-i}$; averaging over $i$ gives $\frac1\alpha(H_m-H_{m-n})\le\frac1\alpha\ln\frac1{1-\alpha}$.`,
      caption: String.raw`Left (log scale): average probes measured while filling a table of 4093 slots to $\alpha = 0.99$ under uniform (random-permutation) probing, double hashing and linear probing, against the formulas. Right: the distribution of probe counts at the chosen $\alpha$, with the geometric law $\alpha^{i-1}(1-\alpha)$ behind the proof's bound $\Pr[X \ge i] \le \alpha^{i-1}$. Linear probing's histogram has the long tail of clustering.`,
      deps: ['algo-5.13', 'pma-3.26'],
      refs: ['CLRS 4e §11.4'],
      credit: 'Peterson, 1957; Knuth (linear probing), 1963',
      tags: ['hashing'],
      viz(v) {
        const kind = v.select('search', [{ value: 'uns', label: 'unsuccessful' }, { value: 'suc', label: 'successful' }], 'uns');
        const sch = v.select('histogram for', [{ value: 'uniform', label: 'uniform' }, { value: 'double', label: 'double hashing' }, { value: 'linear', label: 'linear' }], 'uniform');
        const aS = v.slider('$\\alpha$', 0.1, 0.98, 0.8, { step: 0.01 });
        const P = v.stage({ x: [0, 1], y: [0.8, 1e4], ylog: true, axes: 'box', height: 330, minWidth: 300, title: 'average probes against the load factor', xlabel: 'α' });
        const Hs = v.stage({ x: [0.3, 30.7], y: [0, 0.5], axes: 'box', height: 330, minWidth: 260, title: 'probe counts at the chosen α', xlabel: 'probes' });
        const M = 4093, AL = []; for (let a = 0.05; a < 0.951; a += 0.05) AL.push(+a.toFixed(2)); AL.push(0.97, 0.98, 0.99);
        const curves = {}; for (const s of ['uniform', 'double', 'linear']) curves[s] = oaSimulate(s, M, AL, v.rng(s.length * 7 + 1), 500);
        const hcache = new Map();
        const histAt = (s, a) => { const key = s + a; if (!hcache.has(key)) hcache.set(key, oaSimulate(s, M, [a], v.rng(99), 4000)[0]); return hcache.get(key); };
        const COL = { uniform: 'accent', double: 'teal', linear: 'orange' };
        let info = null;
        v.render(() => {
          const k = kind.value, a = aS.value;
          P.fn(OA_THEORY.uniform[k], { color: 'green', width: 2.2, domain: [0.001, 0.995] });
          P.fn(OA_THEORY.linear[k], { color: 'red', width: 2, dash: [7, 4], domain: [0.001, 0.995] });
          for (const s of ['linear', 'double', 'uniform']) for (const d of curves[s]) P.dot(d.a, d[k], { r: s === sch.value ? 3.8 : 2.8, color: COL[s] });
          P.vline(a, { color: 'muted', width: 1, dash: [2, 3] });
          const d = histAt(sch.value, a), xs = k === 'uns' ? d.costs : d.ins, cnt = new Map(); let tail = 0;
          for (const c of xs) { if (c > 30) tail++; else cnt.set(c, (cnt.get(c) || 0) + 1); }
          const N = xs.length; let fmax = 0; for (const c of cnt.values()) fmax = Math.max(fmax, c / N);
          const yt = Math.max(0.12, fmax * 1.12, (1 - a) * 1.12); Hs.setView([-2.6, 30.7], [-0.07 * yt, yt]);
          for (const [c, q] of cnt) Hs.rect(c - 0.4, 0, c + 0.4, q / N, { fill: COL[sch.value], fillAlpha: 0.45, color: COL[sch.value], width: 1 });
          if (k === 'uns') { const g = []; for (let i = 1; i <= 30; i++) g.push([i, a ** (i - 1) * (1 - a)]); Hs.path(g, { color: 'green', width: 1.8 }); g.forEach(([x, y]) => Hs.dot(x, y, { r: 2.5, color: 'green' })); }
          if (tail) Hs.text(`${v.fix((100 * tail) / N, 1)}% need more than 30 →`, 30.4, Math.max(0.12, fmax * 1.12) * 0.92, { align: 'right', size: 11.5, weight: 700, color: COL[sch.value] });
          const mean = xs.reduce((s1, c) => s1 + c, 0) / N, se = Math.sqrt(Math.max(0, xs.reduce((s1, c) => s1 + c * c, 0) / N - mean * mean) / N);
          info = { a: d.a, mean, se, k, s: sch.value, ge: xs.filter((c) => c >= 3).length / N };
        });
        v.legend([['accent', 'uniform', { dot: true }], ['teal', 'double hashing', { dot: true }], ['orange', 'linear probing', { dot: true }], ['green', 'uniform-hashing bound / geometric law'], ['red', 'Knuth: linear probing', { dash: true }]]);
        v.readout(() => {
          const { a, mean, se, k, s, ge } = info, U = OA_THEORY.uniform[k](a), L = OA_THEORY.linear[k](a);
          const name = { uniform: 'uniform probing', double: 'double hashing', linear: 'linear probing' }[s];
          return `$\\alpha = ${v.fix(a, 2)}$, ${name}: mean ${k === 'uns' ? 'unsuccessful' : 'successful'} probes **${v.fix(mean, 2)}** ± ${v.fix(se, 2)} · bound ${k === 'uns' ? '$\\frac1{1-\\alpha}$' : '$\\frac1\\alpha\\ln\\frac1{1-\\alpha}$'} $= ${v.fix(U, 2)}$ ${s === 'linear' ? (mean > U + 2 * se ? '— exceeded: clustering breaks uniform hashing' : '') : mean <= U + 2 * se ? (mean <= U ? '✓' : '✓ (within sampling error)') : '✗'} · linear-probing formula ${v.fix(L, 2)}` + (k === 'uns' ? ` · $\\Pr[X \\ge 3] = ${v.fix(ge, 3)}$ vs $\\alpha^2 = ${v.fix(a * a, 3)}$` : '');
        });
      },
    },
    // ------------------------------------------------------------------ 5.15
    {
      num: '5.15',
      kind: 'Definition',
      name: 'Universal families of hash functions',
      statement: String.raw`A finite family $\mathcal H$ of functions $U\to\{0,\dots,m-1\}$ is **universal** if for every pair of distinct keys $x\ne y$ in $U$,
$$\Pr_{h\in\mathcal H}\bigl[h(x)=h(y)\bigr]=\frac{\bigl|\{h\in\mathcal H: h(x)=h(y)\}\bigr|}{|\mathcal H|}\le\frac1m,$$
where $h$ is drawn uniformly from $\mathcal H$. The probability is over the choice of the function, not over the keys: the keys may be chosen by an adversary, as long as this is done before $h$ is drawn.`,
      idea: String.raw`$\frac1m$ is what a completely random function achieves, so a universal family imitates a random function on every *pair* of keys while being small enough to store and evaluate: one draw costs a few random numbers instead of a table of size $|U|$. No single function can be universal — with $|U|>m$ two keys always collide under it — and simple randomisations such as a random shift $(x+b)\bmod m$ do not help, because keys that differ by a multiple of $m$ collide under every shift.`,
      caption: String.raw`The grid shows every pair of keys from $U = \{0,\dots,15\}$; a cell's colour is the fraction of functions in the family that send both keys to the same bucket (blue up to $1/m$, red above). A universal family has no red cell. Click a cell for its exact count. The bars on the right collect all off-diagonal cells: universality means every bar lies left of the line $1/m$.`,
      deps: ['algo-5.11'],
      refs: ['CLRS 4e §11.3'],
      credit: 'Carter & Wegman, 1979',
      tags: ['hashing', 'randomized'],
      viz(v) {
        const fam = v.select('family', [{ value: 'one', label: 'one function $x \\bmod m$' }, { value: 'shift', label: '$(x+b) \\bmod m$' }, { value: 'ax', label: '$(ax \\bmod 17) \\bmod m$' }, { value: 'axb', label: '$((ax+b) \\bmod 17) \\bmod m$' }, { value: 'all', label: 'all functions' }], 'axb');
        const mS = v.slider('buckets $m$', 2, 8, 4, { int: true });
        const N = 16;
        const s = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 400, weight: 1.5, minWidth: 360 });
        const Q = v.stage({ x: [0, 1.02], y: [0, 1], axes: 'box', height: 400, minWidth: 220, title: 'off-diagonal pairs by collision probability', xlabel: 'Pr' });
        const T = v.table(s, { rows: N, cols: N, maxCell: 23, size: 9, labelSize: 10, rowLabels: (k) => String(k), colLabels: (k) => String(k), cornerLabel: 'x \\ y' });
        let sel = [3, 11], info = null;
        s.onClick((x, y) => { const c = T.hit(x, y); if (c && c.i >= 0 && c.j >= 0) sel = [c.i, c.j]; });
        const family = (f, m) => {
          if (f === 'one') return [(x) => x % m];
          if (f === 'shift') return Array.from({ length: m }, (_, b) => (x) => (x + b) % m);
          if (f === 'ax') return Array.from({ length: 16 }, (_, a) => (x) => (((a + 1) * x) % 17) % m);
          if (f === 'axb') { const H = []; for (let a = 1; a < 17; a++) for (let b = 0; b < 17; b++) H.push(uh(a, b, 17, m)); return H; }
          return null;
        };
        v.render(() => {
          const m = mS.value, H = family(fam.value, m), C = [];
          for (let i = 0; i < N; i++) { C.push([]); for (let j = 0; j < N; j++) { if (!H) { C[i].push(i === j ? 1 : 1 / m); continue; } let c = 0; for (const h of H) if (h(i) === h(j)) c++; C[i].push(c / H.length); } }
          const lim = 1 / m + 1e-12, red = [];
          for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) if (i !== j && C[i][j] > lim) red.push([i, j, 'red']);
          T.draw({
            value: () => null,
            fill: (i, j) => (i === j ? ['grid', 1] : C[i][j] > lim ? ['red', 0.25 + 0.6 * Math.min(1, (C[i][j] - 1 / m) / (1 - 1 / m))] : ['accent', 0.06 + 0.55 * C[i][j] * m]),
            highlight: [[sel[0], sel[1], 'gold']],
          });
          // distribution of off-diagonal values
          const vals = new Map(); for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) if (i !== j) { const k = C[i][j].toFixed(4); vals.set(k, (vals.get(k) || 0) + 1); }
          const tot = N * (N - 1); let ymax = 0; for (const c of vals.values()) ymax = Math.max(ymax, c / tot);
          Q.setView([0, 1.02], [0, Math.max(0.2, ymax * 1.12)]);
          Q.vband(0, 1 / m, { color: 'accent', alpha: 0.07 });
          for (const [k, c] of vals) { const x = +k; Q.rect(x - 0.012, 0, x + 0.012, c / tot, { fill: x > lim ? 'red' : 'accent', fillAlpha: 0.75, stroke: false }); }
          Q.vline(1 / m, { color: 'green', width: 2 }); Q.text('1/m', 1 / m, Math.max(0.2, ymax * 1.12) * 0.94, { dx: 5, size: 12, weight: 700, color: 'green' });
          info = { C, H, m, red: red.length / 2, max: Math.max(...C.flatMap((r, i) => r.filter((_, j) => j !== i))) };
        });
        v.legend([['accent', '$\\Pr \\le 1/m$', { area: true }], ['red', '$\\Pr > 1/m$', { area: true }], ['gold', 'selected pair']]);
        v.readout(() => {
          const { C, H, m, red, max } = info, [x, y] = sel, size = H ? H.length : null;
          const cell = x === y ? `pair (${x}, ${x}): a key always collides with itself` : `pair (${x}, ${y}): ${H ? `${Math.round(C[x][y] * size)} of ${size} functions collide` : `exactly $1/m$ of all $m^{16}$ functions collide`}, $\\Pr = ${v.fix(C[x][y], 3)}$`;
          return `${cell} · largest off-diagonal probability ${v.fix(max, 3)} vs $1/m = ${v.fix(1 / m, 3)}$ · ${red ? `${plural(red, 'pair')} above $1/m$: **not universal** ✗` : '**universal** ✓'}${size ? ` · $|\\mathcal H| = ${size}$` : ''}${fam.value === 'axb' ? ' · the same value for every pair, because $(r, s)$ is a uniform pair of distinct residues (5.16)' : ''}`;
        });
      },
    },
    // ------------------------------------------------------------------ 5.16
    {
      num: '5.16',
      kind: 'Theorem',
      name: 'The family ((ax + b) mod p) mod m is universal',
      statement: String.raw`Let $p$ be a prime with every key in $\{0,1,\dots,p-1\}$, and let $m<p$. For $a\in\{1,\dots,p-1\}$ and $b\in\{0,\dots,p-1\}$ put
$$h_{a,b}(x)=\bigl((ax+b)\bmod p\bigr)\bmod m .$$
The family $\mathcal H_{p,m}=\{h_{a,b}\}$ of $p(p-1)$ functions is universal: for distinct keys $x\ne y$ at most $p(p-1)/m$ of the pairs $(a,b)$ give $h_{a,b}(x)=h_{a,b}(y)$.`,
      idea: String.raw`Let $r=(ax+b)\bmod p$ and $s=(ay+b)\bmod p$. Then $r-s\equiv a(x-y)\not\equiv0$ because $p$ is prime and neither factor is divisible by $p$, so $r\ne s$; and $(a,b)\mapsto(r,s)$ is a bijection from the $p(p-1)$ pairs onto the $p(p-1)$ pairs with $r\ne s$, since $a=(r-s)(x-y)^{-1}$ and $b=r-ax$ can be solved mod $p$. So $(r,s)$ is a uniformly random pair of distinct residues, and for each $r$ at most $\lceil p/m\rceil-1\le(p-1)/m$ values $s\ne r$ satisfy $s\equiv r\pmod m$. With a composite modulus the bijection fails and collisions can exceed the bound.`,
      caption: String.raw`Fix two keys $x \ne y$. Left: every $(a, b)$, gold where $h_{a,b}(x) = h_{a,b}(y)$. Right: the pair $(r, s) = (ax+b, ay+b) \bmod p$ each $(a, b)$ maps to — every off-diagonal cell is hit exactly once, and the gold-outlined cells ($r \equiv s$ mod $m$) are the collisions. Click a left cell to see its image. Choose a composite modulus to break the bijection: when $x - y$ shares a factor with it, whole rows collide, cells are hit several times, the diagonal gets hit, and the bound fails.`,
      deps: ['algo-5.15'],
      refs: ['CLRS 4e §11.3'],
      credit: 'Carter & Wegman, 1979',
      tags: ['hashing'],
      viz(v) {
        const pS = v.select('modulus', [{ value: '11', label: '$p = 11$' }, { value: '13', label: '$13$' }, { value: '17', label: '$17$' }, { value: '12', label: '$12$ (not prime)' }, { value: '15', label: '$15$ (not prime)' }], '13', { onChange: () => clampXY() });
        const mS = v.slider('buckets $m$', 2, 6, 3, { int: true });
        const xS = v.slider('key $x$', 0, 16, 1, { int: true, onChange: () => clampXY() }), yS = v.slider('key $y$', 0, 16, 7, { int: true, onChange: () => clampXY() });
        const A = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 380, minWidth: 320, title: 'all $(a, b)$: gold = $x$ and $y$ collide' });
        const B = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 380, minWidth: 320, title: '$(r, s)$: how often each pair is hit' });
        const TA = v.table(A, { rows: 12, cols: 13, maxCell: 22, size: 9, labelSize: 9.5, cornerLabel: 'a \\ b' });
        const TB = v.table(B, { rows: 13, cols: 13, maxCell: 22, size: 9.5, labelSize: 9.5, cornerLabel: 'r \\ s' });
        let sel = [2, 5], info = null;
        function clampXY() { const p = +pS.value; if (xS.value >= p) xS.set(p - 1); if (yS.value >= p) yS.set(p - 2); if (sel[0] > p - 1) sel = [1, 0]; }
        A.onClick((x, y) => { const c = TA.hit(x, y); if (c && c.i >= 0 && c.j >= 0) sel = [c.i + 1, c.j]; });
        v.render(() => {
          const p = +pS.value, m = mS.value, X = Math.min(xS.value, p - 1), Y = Math.min(yS.value, p - 1);
          const hits = Array.from({ length: p }, () => new Array(p).fill(0)), col = [];
          let C = 0;
          for (let a = 1; a < p; a++) { col.push([]); for (let b = 0; b < p; b++) { const r = (a * X + b) % p, s2 = (a * Y + b) % p; hits[r][s2]++; const c = r % m === s2 % m; col[a - 1].push(c); if (c) C++; } }
          const [sa, sb] = sel, sr = (sa * X + sb) % p, ss = (sa * Y + sb) % p;
          TA.draw({
            rows: p - 1, cols: p, rowLabels: (i) => String(i + 1), colLabels: (j) => String(j), value: () => null,
            fill: (i, j) => (X === Y ? ['red', 0.3] : col[i][j] ? ['gold', 0.6] : ['accent', 0.05]), highlight: [[sa - 1, sb, 'ink']],
          });
          const out = [];
          for (let r = 0; r < p; r++) for (let s2 = 0; s2 < p; s2++) if (r % m === s2 % m && (r !== s2 || hits[r][s2])) out.push([r, s2, 'gold']);
          out.push([sr, ss, 'ink']);
          TB.draw({
            rows: p, cols: p, rowLabels: (i) => String(i), colLabels: (j) => String(j),
            value: (i, j) => (hits[i][j] > 1 ? String(hits[i][j]) : null),
            fill: (i, j) => (hits[i][j] === 0 ? (i === j ? ['grid', 1] : null) : hits[i][j] > 1 || i === j ? ['red', 0.45] : ['accent', 0.14]),
            highlight: out, highlightColor: 'gold',
          });
          const bound = (p * (p - 1)) / m;
          info = { p, m, X, Y, C, bound, sa, sb, sr, ss, prime: p === 11 || p === 13 || p === 17 };
        });
        v.legend([['gold', 'collision', { area: true }], ['accent', 'hit once', { area: true }], ['red', 'hit twice / diagonal', { area: true }]]);
        v.readout(() => {
          const { p, m, X, Y, C, bound, sa, sb, sr, ss, prime } = info;
          if (X === Y) return 'Choose two different keys $x \\ne y$.';
          const sel1 = `$(a, b) = (${sa}, ${sb})$: $r = ${sr}$, $s = ${ss}$, so $h(x) = ${sr % m}$, $h(y) = ${ss % m}$${sr % m === ss % m ? ' — collide' : ''}`;
          return `${sel1} · colliding pairs $(a, b)$: **${C}** of ${p * (p - 1)} · bound $p(p-1)/m = ${v.fix(bound, 1)}$ ${C <= bound + 1e-9 ? '✓' : '**exceeded** ✗'}${prime ? '' : (() => { const zs = []; for (let a = 1; a < p; a++) if ((a * (X - Y)) % p === 0) zs.push(a); return zs.length ? ` · ${p} is not prime and $a(x-y) \\equiv 0$ for $a \\in \\{${zs.join(', ')}\\}$: those rows collide entirely and the map to $(r, s)$ is not a bijection` : ` · ${p} is not prime, but $x - y$ is coprime to it, so the map stays injective here: choose keys whose difference shares a factor with ${p}`; })()}`;
        });
      },
    },
    // ------------------------------------------------------------------ 5.17
    {
      num: '5.17',
      kind: 'Theorem',
      name: 'Universal hashing gives O(1 + α) expected time on any input',
      statement: String.raw`Let $h$ be drawn uniformly from a universal family (5.15) *after* the $n$ keys are fixed, and store them in a table of $m$ buckets with chaining. For every key $x$, the expected number of other stored keys in $x$'s bucket is at most $\alpha=n/m$ if $x$ is not stored, and at most $(n-1)/m<\alpha$ if it is. Hence every search, insertion and deletion takes $O(1+\alpha)$ expected time — for **every** input, including one chosen by an adversary who knows the family but not the random choice.`,
      idea: String.raw`Write the number of keys colliding with $x$ as a sum of indicators $\sum_{y\ne x}[h(x)=h(y)]$; by linearity of expectation (3.3) its mean is $\sum_{y\ne x}\Pr[h(x)=h(y)]\le(n-1)\cdot\frac1m$ by universality. Nothing about the keys was assumed. The randomness has moved from the input (5.12) into the algorithm, so no fixed input is bad for it; an adversary who could see $h$ would again find a bad input, as the button below shows.`,
      caption: String.raw`Twenty-four keys all congruent to 3 mod 16 put every key into one bucket of the fixed function $k \bmod 16$ (left). Drawing $h_{a,b}$ from the universal family spreads the same keys out (middle); redraw it as often as you like. **Attack this h** lets an adversary who has seen $h$ pick colliding keys — and the next draw defeats them. Bottom: over 2000 draws, how many keys share the first key's bucket, with its mean against $(n-1)/m$.`,
      deps: ['algo-5.15', 'algo-5.12'],
      refs: ['CLRS 4e §11.3'],
      credit: 'Carter & Wegman, 1979',
      tags: ['hashing', 'randomized'],
      viz(v) {
        const m = 16, n = 24, p = PRIME;
        let r = v.rng(23), a = 1 + Math.floor(r() * (p - 1)), b = Math.floor(r() * p), mode = 'mod';
        const keysMod = Array.from({ length: n }, (_, i) => 3 + m * (5 + 7 * i));
        let keys = keysMod.slice();
        const ksel = v.select('keys', [{ value: 'mod', label: 'adversarial for $k \\bmod 16$' }, { value: 'rand', label: 'random' }], 'mod', { onChange: (x) => { mode = x; keys = x === 'mod' ? keysMod.slice() : Array.from({ length: n }, () => Math.floor(r() * p)); } });
        v.button('Draw a new h', () => { a = 1 + Math.floor(r() * (p - 1)); b = Math.floor(r() * p); if (mode === 'attack') mode = 'stale'; });
        v.button('Attack this h', () => { const h = uh(a, b, p, m), t = h(keys[0]), out = [keys[0]]; for (let x = 1; out.length < n && x < p; x++) if (h(x) === t && x !== keys[0]) out.push(x); keys = out; mode = 'attack'; });
        const A = v.stage({ x: [-2, 15.7], y: [-2, 26], axes: 'box', height: 230, minWidth: 260, title: 'buckets of the fixed $h(k) = k \\bmod 16$' });
        const B = v.stage({ x: [-2, 15.7], y: [-2, 26], axes: 'box', height: 230, minWidth: 260, title: 'buckets of a random $h_{a,b}$ from the universal family' });
        const C = v.stage({ x: [-0.7, 23.7], y: [0, 0.4], axes: 'box', height: 200, full: true, title: 'other keys in the first key’s bucket, over 2000 random draws of $h$', xlabel: 'keys sharing the bucket' });
        let info = null;
        v.render(() => {
          const fixed = new Array(m).fill(0), rnd = new Array(m).fill(0), h = uh(a, b, p, m);
          for (const k of keys) { fixed[k % m]++; rnd[h(k)]++; }
          const bar = (S, arr, col) => arr.forEach((c, j) => { if (c) { S.rect(j - 0.38, 0, j + 0.38, c, { fill: col, fillAlpha: 0.55, color: col, width: 1 }); S.text(String(c), j, c, { align: 'center', baseline: 'bottom', dy: -2, size: 10.5, weight: 700, color: col }); } });
          for (const S of [A, B]) S.hline(n / m, { color: 'green', width: 1.5, dash: [6, 4] });
          bar(A, fixed, mode === 'rand' ? 'accent' : 'red'); bar(B, rnd, mode === 'attack' ? 'red' : 'accent');
          B.corner(`a = ${a}, b = ${b}`, 'tr', { color: 'muted' });
          // many draws
          const rr = v.rng(4242 + keys[1]), cnt = new Array(n).fill(0); let sum = 0; const D = 2000;
          for (let t = 0; t < D; t++) { const g = uh(1 + Math.floor(rr() * (p - 1)), Math.floor(rr() * p), p, m), t0 = g(keys[0]); let c = 0; for (let i = 1; i < n; i++) if (g(keys[i]) === t0) c++; cnt[c]++; sum += c; }
          const fmax = Math.max(...cnt) / D, ct = Math.max(0.3, fmax * 1.15); C.setView([-1.5, 23.7], [-0.08 * ct, ct]);
          cnt.forEach((c, k) => { if (c) C.rect(k - 0.38, 0, k + 0.38, c / D, { fill: 'accent', fillAlpha: 0.45, color: 'accent', width: 1 }); });
          C.vline(sum / D, { color: 'accent', width: 2.2 }); C.vline((n - 1) / m, { color: 'green', width: 2, dash: [6, 4] });
          C.text(`mean ${v.fix(sum / D, 2)}`, sum / D, Math.max(0.3, fmax * 1.15) * 0.9, { dx: -6, align: 'right', size: 11.5, weight: 700, color: 'accent' });
          C.text(`(n − 1)/m = ${v.fix((n - 1) / m, 2)}`, (n - 1) / m, Math.max(0.3, fmax * 1.15) * 0.75, { dx: 6, size: 11.5, weight: 700, color: 'green' });
          let sq = 0; for (let i = 0; i < m; i++) { const c = Math.floor((p - 1 - i) / m) + 1; sq += c * (c - 1); }
          let s2 = 0; for (let k = 0; k < n; k++) s2 += cnt[k] * k * k; const sd = Math.sqrt(Math.max(0, s2 / D - (sum / D) ** 2) / D);
          info = { fl: Math.max(...fixed), rl: Math.max(...rnd), mean: sum / D, sd, exact: (n - 1) * sq / (p * (p - 1)) };
        });
        v.legend([['red', 'chains under a function the keys were chosen against', { area: true }], ['accent', 'chains under a fresh random $h$', { area: true }], ['green', 'load factor $\\alpha = 1.5$ / bound', { dash: true }]]);
        v.readout(() => {
          const { fl, rl, mean, sd, exact } = info;
          return `$n = ${n}$, $m = ${m}$, $\\alpha = ${n / m}$ · longest chain: fixed function **${fl}**, current random $h$ **${rl}**${mode === 'attack' ? ' (the keys were picked after seeing this $h$ — draw a new one)' : mode === 'stale' ? ' (keys chosen against the previous $h$: harmless now)' : ''} · keys sharing the first key's bucket: exact expectation over the family ${v.fix(exact, 4)} $\\le (n-1)/m = ${v.fix((n - 1) / m, 4)}$ ✓, measured over 2000 draws ${v.fix(mean, 3)} ± ${v.fix(sd, 3)} · so a search costs $\\le 1 + \\alpha$ in expectation`;
        });
      },
    },
    // ------------------------------------------------------------------ 5.18
    {
      num: '5.18',
      kind: 'Theorem',
      name: 'Perfect hashing: O(1) worst-case lookups in O(n) space',
      statement: String.raw`A static set of $n$ keys can be stored in $O(n)$ space so that every lookup takes $O(1)$ time in the worst case (two hash evaluations and two memory probes). The **two-level scheme** of Fredman, Komlós and Szemerédi hashes the keys into $m=n$ buckets with $h$ from a universal family; bucket $j$, holding $b_j$ keys, gets its own table of $b_j^2$ slots and a function $h_j$ from a universal family with no collision among those keys. With $h$ redrawn until $\sum_j b_j^2<4n$ and each $h_j$ redrawn until collision-free, the expected number of draws is constant at both levels, and the expected construction time is $O(n)$.`,
      idea: String.raw`Into $b^2$ slots, $b$ keys collide with expected count $\binom b2\frac1{b^2}<\frac12$ by universality (5.16), so by Markov's inequality a random $h_j$ is collision-free with probability more than $\frac12$. For the first level, $\sum_j b_j^2=n+2\cdot\#\{\text{colliding pairs}\}$ has expectation at most $n+n(n-1)/m<2n$ when $m=n$ (5.17), so $\Pr[\sum b_j^2\ge4n]<\frac12$. Each level therefore succeeds after fewer than two draws on average.`,
      caption: String.raw`Each row is a first-level bucket with its $b_j$ keys, and to its right the $b_j^2$-slot second-level table with the keys in place; the note gives how many draws of $h_j$ it took to avoid collisions. Click a key to see its lookup: one probe in each level. Redraw the first-level function and watch $\sum b_j^2$ against the histogram of 3000 draws, whose mean sits near $2n-1$.`,
      deps: ['algo-5.16', 'algo-5.17'],
      refs: ['Erickson notes: Hashing'],
      credit: 'Fredman, Komlós & Szemerédi, 1984',
      tags: ['hashing'],
      viz(v) {
        const nS = v.slider('keys $n$', 6, 16, 12, { int: true, onChange: () => { newKeys(); build(); } });
        const p = PRIME; let r = v.rng(8), keys = [], h1 = null, rows = [], tries1 = 0, look = null;
        function newKeys() { keys = distinct(r, nS.value, 10, 99); look = null; }
        function build() {
          const n = keys.length; tries1 = 0;
          for (;;) { tries1++; const a = 1 + Math.floor(r() * (p - 1)), b = Math.floor(r() * p); h1 = { a, b, f: uh(a, b, p, n) }; const sz = new Array(n).fill(0); keys.forEach((k) => sz[h1.f(k)]++); if (sz.reduce((s2, x) => s2 + x * x, 0) < 4 * n || tries1 > 50) break; }
          rows = Array.from({ length: n }, () => ({ keys: [] })); keys.forEach((k) => rows[h1.f(k)].keys.push(k));
          for (const row of rows) {
            const b2 = row.keys.length ** 2; row.tries = 0; row.fails = 0;
            if (!b2) continue;
            for (;;) { row.tries++; const a = 1 + Math.floor(r() * (p - 1)), b = Math.floor(r() * p), f = uh(a, b, p, b2), slots = new Array(b2).fill(null); let ok = true; for (const k of row.keys) { const s2 = f(k); if (slots[s2] != null) ok = false; slots[s2] = k; } if (ok) { row.slots = slots; row.ab = [a, b]; break; } row.fails++; }
          }
        }
        newKeys(); build();
        v.button('Redraw first level', () => { build(); look = null; });
        v.button('New keys', () => { newKeys(); build(); });
        const s = v.stage({ x: [-4, 30], y: [-0.6, 16], axes: false, height: 380, weight: 1.6, minWidth: 360 });
        const Q = v.stage({ x: [1, 6], y: [0, 0.5], axes: 'box', height: 380, minWidth: 220, title: '$\\sum_j b_j^2 / n$ over 3000 draws of $h$', xlabel: 'space / n' });
        s.onClick((x, y) => { const n = rows.length, j = Math.round(n - 1 - y); if (j < 0 || j >= n) return; const row = rows[j]; if (!row.slots) return; const w = cellW(); const i = Math.floor(x / w); if (i >= 0 && i < row.slots.length && row.slots[i] != null) look = row.slots[i]; });
        const cellW = () => { const mx = Math.max(1, ...rows.map((rw) => rw.keys.length ** 2)); return Math.min(1.6, 21 / mx); };
        const hcache = new Map(); let info = null;
        v.render(() => {
          const n = rows.length, w = cellW();
          s.setView([-4.2, 29.5], [-0.75, n + 0.2]);
          const lj = look != null ? h1.f(look) : -1;
          rows.forEach((row, j) => {
            const y = n - 1 - j, b = row.keys.length, hot = j === lj;
            s.rect(-3.9, y - 0.36, -2.9, y + 0.36, { fill: hot ? 'gold' : 'panel', fillAlpha: hot ? 0.35 : 1, color: hot ? 'gold' : 'muted', width: hot ? 2.2 : 1.2 });
            s.text(String(j), -3.4, y, { align: 'center', size: 10.5, color: 'muted', weight: 700 });
            s.text(`b=${b}`, -2.0, y, { align: 'center', size: 10.5, color: b > 2 ? 'orange' : 'muted', weight: 700 });
            if (!b) return;
            s.arrow(-1.2, y, -0.08, y, { color: hot ? 'gold' : 'muted', width: hot ? 2 : 1.1, head: 6 });
            row.slots.forEach((k, i) => {
              const x0 = i * w, isL = k != null && k === look;
              s.rect(x0, y - 0.34, x0 + w, y + 0.34, { fill: isL ? 'gold' : k != null ? 'accent' : 'panel', fillAlpha: isL ? 0.6 : k != null ? 0.18 : 1, color: k != null ? 'accent' : 'faint', width: 1 });
              if (k != null && w * s.sx > 16) s.text(String(k), x0 + w / 2, y, { align: 'center', size: clamp(w * s.sx * 0.5, 8, 11.5), weight: 700, halo: false });
            });
            s.text(`${plural(b * b, 'slot')} · ${plural(row.tries, 'draw')}`, row.slots.length * w + 0.4, y, { size: 10.5, color: row.tries > 1 ? 'orange' : 'muted' });
          });
          // histogram of sum b^2 / n for these keys
          const key = keys.join(',');
          if (!hcache.has(key)) { const rr = v.rng(77), vals = []; for (let t = 0; t < 3000; t++) { const f = uh(1 + Math.floor(rr() * (p - 1)), Math.floor(rr() * p), p, n), sz = new Array(n).fill(0); keys.forEach((k) => sz[f(k)]++); vals.push(sz.reduce((s2, x) => s2 + x * x, 0) / n); } hcache.set(key, vals); }
          const vals = hcache.get(key), cnt = new Map(); vals.forEach((x) => { const k = x.toFixed(4); cnt.set(k, (cnt.get(k) || 0) + 1); });
          let ym = 0; for (const c of cnt.values()) ym = Math.max(ym, c / vals.length);
          const srt = vals.slice().sort((a, b) => a - b), xmax = Math.max(5.5, srt[Math.floor(0.998 * srt.length)] + 0.4); Q.setView([0.15, xmax], [-0.07 * ym * 1.15, ym * 1.15]);
          Q.vband(4, xmax, { color: 'red', alpha: 0.06 });
          for (const [k, c] of cnt) { const x = +k; Q.rect(x - 0.06, 0, x + 0.06, c / vals.length, { fill: x >= 4 ? 'red' : 'accent', fillAlpha: 0.7, stroke: false }); }
          const mean = vals.reduce((a, b) => a + b, 0) / vals.length;
          Q.vline(mean, { color: 'accent', width: 2 }); Q.vline((2 * n - 1) / n, { color: 'green', width: 2, dash: [6, 4] }); Q.vline(4, { color: 'red', width: 1.5 });
          const cur = rows.reduce((a, rw) => a + rw.keys.length ** 2, 0) / n; Q.dot(cur, ym * 1.05, { r: 5, color: 'gold', label: 'now', labelPos: 'e' });
          Q.text('retry ≥ 4', 4, ym * 1.08, { dx: 4, size: 11, color: 'red', weight: 700 });
          info = { n, sum: cur * n, mean, frac4: vals.filter((x) => x >= 4).length / vals.length };
        });
        v.legend([['accent', 'stored key', { area: true }], ['gold', 'looked up', { area: true }], ['green', '$E\\sum b_j^2/n = (2n-1)/n$', { dash: true }], ['red', 'redraw region $\\ge 4n$']]);
        v.readout(() => {
          const { n, sum, mean, frac4 } = info, draws = rows.reduce((a, rw) => a + rw.tries, 0), used = rows.filter((rw) => rw.keys.length).length;
          const lk = look != null ? `lookup ${look}: $h(${look}) = ${h1.f(look)}$, then slot $h_{${h1.f(look)}}(${look})$ — **2 probes**, whatever the keys · ` : 'click a key to look it up · ';
          return lk + `space $\\sum b_j^2 = ${sum}$ ${sum < 4 * n ? '$< 4n$ ✓' : '(≥ 4n: redraw)'} with $n = ${n}$ (mean over draws ${v.fix(mean * n, 1)}, theory $2n-1 = ${2 * n - 1}$; $\\Pr[\\ge 4n] = ${v.fix(frac4, 3)} < \\frac12$ ✓) · first level drawn ${plural(tries1, 'time')}, second level ${draws} draws for ${used} tables`;
        });
      },
    },
    // ------------------------------------------------------------------ 5.19
    {
      num: '5.19',
      kind: 'Definition',
      name: 'Skip lists',
      statement: String.raw`A **skip list** stores a sorted set in a hierarchy of linked lists: level 0 links all keys in order, and each key is promoted to the next level independently with probability $\frac12$ (it flips a fair coin until tails), so its **tower** has a geometric height and level $\ell$ holds about $n/2^\ell$ keys. A head node of full height starts every level. **Search** for $q$ starts at the top level of the head and repeatedly moves right while the next key is at most $q$, otherwise drops down one level; at level 0 it stops at the largest key $\le q$. **Insertion** searches, flips the coins for the new tower and splices it into each of its levels.`,
      idea: String.raw`The upper levels are "express lanes": each is a random sample of about half of the level below, so a few steps at a high level skip over many keys at the bottom. Since the expected number of keys at level $\ell$ is $n/2^\ell$, about $\log_2 n$ levels exist, and between two consecutive drops the search makes about one right step on average (5.20) — the same logarithmic behaviour as a balanced tree, obtained from coin flips instead of rotations.`,
      caption: String.raw`Slide the search key $q$: the gold arrows are steps to the right, the orange ones drops to a lower level. **Insert random key** flips coins for a new tower (shown in gold with its flips). Compare the number of steps with $\log_2 n$, and press **New coins** to re-flip every tower.`,
      deps: ['algo-5.1'],
      refs: ['Erickson notes: Treaps and Skip Lists'],
      credit: 'William Pugh, 1990',
      tags: ['randomized', 'data structures'],
      viz(v) {
        let r = v.rng(19), keys = distinct(r, 14, 3, 97).sort((a, b) => a - b), coins = keys.map(() => flips(r)), newest = null;
        const q = v.slider('search key $q$', 1, 99, 61, { int: true });
        v.button('Insert random key', () => { if (keys.length >= 24) return; let k; do { k = Math.floor(Math.random() * 99) + 1; } while (keys.includes(k)); const c = flips(r); const i = keys.findIndex((x) => x > k); const at = i < 0 ? keys.length : i; keys.splice(at, 0, k); coins.splice(at, 0, c); newest = k; });
        v.button('New coins', () => { coins = keys.map(() => flips(r)); newest = null; });
        const s = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 330, full: true });
        let info = null;
        v.render(() => {
          const n = keys.length, H = [0, ...coins.map(towerOf)]; H[0] = Math.max(...H.slice(1)) + 1;
          const S = skipSearch(H, keys, q.value), rset = new Set(S.moves.filter((m) => m.t === 'r').map((m) => `${m.i},${m.j},${m.l}`));
          const ni = newest != null ? keys.indexOf(newest) + 1 : -1;
          drawSkip(s, H, keys, {
            padB: ni > 0 ? 0.55 : 0, padT: 0.5,
            hotLink: (i, j, l) => (rset.has(`${i},${j},${l}`) ? 'gold' : null),
            towerColor: (j, l) => (j === ni ? 'gold' : S.moves.some((m) => (m.i === j && m.l === l) || (m.t === 'r' && m.j === j && m.l === l)) ? 'accent' : null),
            keyColor: (j) => (j === S.end && j ? 'green' : null),
          });
          for (const mv of S.moves) if (mv.t === 'd') s.arrow(mv.i, mv.l - 0.3, mv.i, mv.l - 0.72, { color: 'orange', width: 2.6, head: 7 });
          if (ni > 0) s.text(coins[ni - 1].slice(1).join(' '), ni, -1.3, { align: 'center', size: 11, weight: 700, color: 'gold' });
          const qx = S.end + 0.5; s.line(qx, -0.45, qx, H[0] - 0.62, { color: 'green', width: 1.2, dash: [3, 4] }); s.text(`q = ${q.value}`, qx, H[0] - 0.62, { align: 'center', baseline: 'bottom', size: 11.5, weight: 700, color: 'green' });
          info = { n, S, levels: H[0] };
        });
        v.legend([['gold', 'step right'], ['orange', 'drop a level'], ['accent', 'nodes visited', { area: true }], ['green', 'largest key ≤ q']]);
        v.readout(() => {
          const { n, S, levels } = info, steps = S.right + S.down;
          return `search for ${q.value}: **${S.right}** right + **${S.down}** down = **${steps}** steps, ending at ${S.end ? keys[S.end - 1] : 'the head'}${S.end && keys[S.end - 1] === q.value ? ' (found)' : ''} · $n = ${n}$: $\\log_2 n = ${v.fix(LG(n), 2)}$, ${levels} levels including the head's top, expected search $\\approx 2\\log_2 n$ steps · a plain sorted list would need up to ${n} steps`;
        });
      },
    },
    // ------------------------------------------------------------------ 5.20
    {
      num: '5.20',
      kind: 'Theorem',
      name: 'Skip lists: expected O(log n) search, O(n) space',
      statement: String.raw`In a skip list on $n$ keys in which every key is promoted independently with probability $p\in(0,1)$:
(a) the expected total number of nodes (the sum of the tower heights) is $n/(1-p)=O(n)$;
(b) the number of levels is at most $\log_{1/p}n+O(1)$ in expectation, and $O(\log n)$ with high probability;
(c) the expected number of steps of a search is at most $\frac{1}{p}\log_{1/p}n+\frac{1}{1-p}+1$; for $p=\frac12$ this is $2\log_2 n+3$.`,
      idea: String.raw`(a) A tower has $1+\text{Geom}$ height with mean $1/(1-p)$; add over the keys by linearity (3.3). (b) The probability that some key reaches level $\ell$ is at most $np^\ell$ (a union bound), which is small once $\ell>\log_{1/p}n$. (c) **Backward analysis**: retrace the search path from its end. At each node on the way back, the path came from above exactly when the node's tower continues upward — a coin that came up heads with probability $p$ — and from the left otherwise. So climbing one level costs $1/p$ steps in expectation, a geometric series (pma-3.26), and climbing to level $\log_{1/p}n$ costs $\frac1p\log_{1/p}n$; the few levels above add $O(1)$.`,
      caption: String.raw`Top: replay a search backwards. Each step back either climbs (the tower continues: a head, ↑) or moves left (the tower ended: a tail, ←); the coin strip records the flips the path depends on. Bottom: over many random skip lists with $n$ keys and promotion probability $p$, histograms of search steps and of the number of levels, with Pugh's bound and $\log_{1/p} n$. Push $p$ toward 0 or 1 to see the trade-off between levels and steps per level.`,
      deps: ['algo-5.19', 'algo-3.3', 'pma-3.26'],
      refs: ['Erickson notes: Treaps and Skip Lists'],
      credit: 'William Pugh, 1990',
      tags: ['randomized'],
      viz(v) {
        const nS = v.slider('$n$', 16, 16384, 1024, { log: true, int: true });
        const pS = v.slider('promotion probability $p$', 0.1, 0.9, 0.5, { step: 0.05 });
        const r0 = v.rng(31), keys = distinct(r0, 16, 2, 98).sort((a, b) => a - b), coins = keys.map(() => flips(r0)), q = keys[12] + 1;
        const H = [0, ...coins.map(towerOf)]; H[0] = Math.max(...H.slice(1)) + 1;
        const S0 = skipSearch(H, keys, q), back = S0.moves.slice().reverse();
        const frames = [{ k: 0, note: `The search for ${q} ended at ${keys[S0.end - 1]} after ${S0.moves.length} steps. Walk the path backwards from there.` }];
        back.forEach((mv, i) => frames.push({ k: i + 1, note: mv.t === 'd' && mv.i === 0 ? `Climb the head's tower from level ${mv.l - 1} to ${mv.l}: the head has every level, so no coin is involved.` : mv.t === 'd' ? `Step back **up** from level ${mv.l - 1} to ${mv.l} at ${mv.i ? keys[mv.i - 1] : 'the head'}: its tower continues — a coin that came up **heads**.` : `Step back **left** at level ${mv.l} from ${keys[mv.j - 1]}: its tower stops at this level — **tails**; ${mv.i ? `the previous tower at this level is ${keys[mv.i - 1]}` : 'we reach the head'}.` }));
        frames.push({ k: back.length, note: `Back at the head's top level: ${back.filter((m) => m.t === 'd' && m.i > 0).length} climbs on heads, ${back.filter((m) => m.t === 'r').length} left steps on tails and ${back.filter((m) => m.t === 'd' && m.i === 0).length} climbs up the head. Each climb costs $1/p = 2$ steps on average.`, end: true });
        const St = v.steps({ frames, speed: 1.6, start: 9, still: 9 });
        const s = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 250, full: true });
        const A = v.stage({ x: [0, 60], y: [0, 0.2], axes: 'box', height: 210, minWidth: 260, title: 'search steps', xlabel: 'steps' });
        const B = v.stage({ x: [0, 30], y: [0, 0.6], axes: 'box', height: 210, minWidth: 260, title: 'number of levels', xlabel: 'levels' });
        const cache = new Map();
        const sim = (n, p) => {
          const key = n + '|' + p; if (cache.has(key)) return cache.get(key);
          const rr = v.rng(Math.round(n * 7 + p * 1000)), T = clamp(Math.round(5e6 / (n / (1 - p))), 100, 1500), steps = [], lev = []; let space = 0;
          const h = new Int32Array(n + 1);
          for (let t = 0; t < T; t++) {
            let mx = 0; for (let i = 1; i <= n; i++) { let c = 1; while (rr() < p && c < 400) c++; h[i] = c; space += c; if (c > mx) mx = c; }
            const top = mx + 1; h[0] = top; lev.push(top);
            // backward walk from a random end position (the largest key ≤ a random query)
            let i = Math.floor(rr() * (n + 1)), l = 0, c = 0;
            while (!(i === 0 && l === top - 1)) {
              if (i === 0) { l++; c++; continue; }
              if (h[i] > l + 1) { l++; c++; } else { let j = i - 1; while (j > 0 && h[j] <= l) j--; i = j; c++; }
            }
            steps.push(c);
          }
          const out = { steps, lev, space: space / (T * n), T };
          cache.set(key, out); return out;
        };
        let info = null;
        v.render(() => {
          const f = St.frame, done = new Set(back.slice(0, f.k).map((m) => m)), cur = f.k ? back[f.k - 1] : null;
          const visited = (j, l) => back.slice(0, f.k).some((m) => (m.t === 'r' ? (m.j === j || m.i === j) && m.l === l : m.i === j && (m.l === l || m.l - 1 === l)));
          drawSkip(s, H, keys, {
            padB: 0.75,
            hotLink: (i, j, l) => (back.slice(0, f.k).some((m) => m.t === 'r' && m.i === i && m.j === j && m.l === l) ? 'gold' : null),
            towerColor: (j, l) => (cur && ((cur.t === 'r' && cur.i === j && cur.l === l) || (cur.t === 'd' && cur.i === j && cur.l === l)) ? 'gold' : (j === S0.end && l === 0) || visited(j, l) ? 'accent' : null),
          });
          back.slice(0, f.k).forEach((m) => { if (m.t === 'd') s.arrow(m.i, m.l - 0.7, m.i, m.l - 0.32, { color: 'orange', width: 2.6, head: 7 }); });
          const strip = back.slice(0, f.k).map((m) => (m.t === 'd' ? (m.i === 0 ? '↑' : 'H↑') : 'T←'));
          s.text(`coins along the path, read backwards (↑ alone: climbing the head): ${strip.join('  ') || '—'}`, -0.6, -1.75, { size: 12, weight: 700, color: 'ink' });
          // histograms
          const n = Math.round(nS.value), p = pS.value, D = sim(n, p), L = Math.log(n) / Math.log(1 / p), bound = L / p + 1 / (1 - p) + 1;
          const hist = (Sx, xs, col, mark, markCol) => {
            const cnt = new Map(); let mx = 0, xmax = 0; for (const x of xs) { cnt.set(x, (cnt.get(x) || 0) + 1); xmax = Math.max(xmax, x); }
            for (const c of cnt.values()) mx = Math.max(mx, c / xs.length);
            const X1 = Math.max(xmax, mark) * 1.08 + 1; Sx.setView([-0.09 * X1, X1], [-0.08 * mx * 1.2, mx * 1.2]);
            const bw = Math.max(0.3, Math.min(0.42, X1 / 200));
            for (const [x, c] of cnt) Sx.rect(x - bw, 0, x + bw, c / xs.length, { fill: col, fillAlpha: 0.55, stroke: false });
            const mean = xs.reduce((a, b) => a + b, 0) / xs.length;
            Sx.vline(mean, { color: col, width: 2.2 }); Sx.vline(mark, { color: markCol, width: 2, dash: [6, 4] });
            return { mean, top: mx * 1.2 };
          };
          const a1 = hist(A, D.steps, 'accent', bound, 'green'), b1 = hist(B, D.lev, 'purple', L + 1, 'orange');
          A.text(`mean ${v.fix(a1.mean, 1)}`, a1.mean, a1.top * 0.92, { dx: -5, align: 'right', size: 11, weight: 700, color: 'accent' });
          A.text(`bound ${v.fix(bound, 1)}`, bound, a1.top * 0.78, { dx: 5, size: 11, weight: 700, color: 'green' });
          B.text(`mean ${v.fix(b1.mean, 1)}`, b1.mean, b1.top * 0.92, { dx: 5, size: 11, weight: 700, color: 'purple' });
          info = { n, p, D, L, bound, ms: a1.mean, ml: b1.mean };
        });
        v.legend([['gold', 'current backward step'], ['orange', 'climb = heads'], ['green', 'Pugh: $\\frac1p\\log_{1/p}n+\\frac1{1-p}+1$', { dash: true }], ['purple', 'levels'], ['orange', '$\\log_{1/p}n + 1$', { dash: true }]]);
        v.readout(() => {
          const { n, p, D, L, bound, ms, ml } = info;
          return `$n = ${tnum(n)}$, $p = ${v.fix(p, 2)}$ (${D.T} random lists): mean search steps **${v.fix(ms, 2)}** $\\le$ bound ${v.fix(bound, 2)} ${ms <= bound ? '✓' : '✗'} · mean levels ${v.fix(ml, 2)} vs $\\log_{1/p} n = ${v.fix(L, 2)}$ · nodes per key ${v.fix(D.space, 3)} vs $1/(1-p) = ${v.fix(1 / (1 - p), 3)}$`;
        });
      },
    },
  ],
};
