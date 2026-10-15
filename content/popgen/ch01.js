// Population Genetics & Evolution — Chapter 1: Genetic variation and Hardy–Weinberg

// ── shared helpers ────────────────────────────────────────────────────────────
// House colours for the collection: genotypes AA blue, Aa purple, aa orange; alleles A blue, a orange.
const GCOL = ['blue', 'purple', 'orange'];
const ACOL = ['blue', 'orange'];
const GNAME = ['AA', 'Aa', 'aa'];
const SQ3 = Math.sqrt(3) / 2;
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));

/** One-slot cache: recompute only when the key changes. */
function memo() { let key, val; return (k, f) => { if (k !== key) { key = k; val = f(); } return val; }; }

/** Pearson χ² test of Hardy–Weinberg proportions from genotype counts (allele frequency estimated, 1 df). */
function hwTest(M, n0, n1, n2) {
  const n = n0 + n1 + n2, p = n ? (2 * n0 + n1) / (2 * n) : 0, q = 1 - p;
  const E = [n * p * p, 2 * n * p * q, n * q * q];
  let x2 = 0; [n0, n1, n2].forEach((o, i) => { if (E[i] > 1e-12) x2 += (o - E[i]) ** 2 / E[i]; });
  return { n, p, q, E, chi2: x2, pval: M.gammaQ(0.5, x2 / 2) };
}
/** Goodness-of-fit χ² of counts O against expected proportions e (classes with e = 0 skipped). */
function gof(M, O, e) {
  const n = O.reduce((a, b) => a + b, 0); let x2 = 0, k = 0;
  O.forEach((o, i) => { if (e[i] > 1e-12) { const E = n * e[i]; x2 += (o - E) ** 2 / E; k++; } });
  const df = Math.max(0, k - 1);
  return { chi2: x2, df, pval: df ? M.gammaQ(df / 2, x2 / 2) : 1 };
}
/** p-value with its relation sign: '= 0.123' or '< 0.0001'. */
const pText = (v, p) => (p < 1e-4 ? '< 0.0001' : '= ' + (p < 0.01 ? v.fix(p, 4) : v.fix(p, 3)));

/** Capsule outline centred at (cx, cy) with half-width hw and half-height hh (equal-aspect stage). */
function stadium(cx, cy, hw, hh) {
  const pts = [];
  for (let i = 0; i <= 12; i++) { const a = -Math.PI / 2 + (Math.PI * i) / 12; pts.push([cx + hw - hh + hh * Math.cos(a), cy + hh * Math.sin(a)]); }
  for (let i = 0; i <= 12; i++) { const a = Math.PI / 2 + (Math.PI * i) / 12; pts.push([cx - hw + hh + hh * Math.cos(a), cy + hh * Math.sin(a)]); }
  return pts;
}
/** A diploid individual: a capsule outlined in its genotype colour holding its two allele beads. */
function diploid(s, cx, cy, a1, a2, o = {}) {
  const w = o.w ?? 0.4, hh = o.h ?? 0.24, col = o.color || GCOL[a1 + a2];
  s.poly(stadium(cx, cy, w, hh), { fill: col, fillAlpha: o.fillAlpha ?? 0.13, color: col, width: o.width ?? 1.8 });
  const r = Math.max(2.5, hh * 0.7 * s.scale), d = w * 0.47;
  [a1, a2].forEach((a, i) => {
    const x = cx + (i ? d : -d);
    s.dot(x, cy, { r, color: ACOL[a], ring: false });
    if (r >= 6.5 && o.letters !== false) s.text(a ? 'a' : 'A', x, cy, { align: 'center', size: Math.round(r * 1.35), color: 'panel', halo: false, math: true, dy: 1 });
  });
}
/** A gamete chip: a bead with its allele letter. */
function chip(s, x, y, a, r = 12, alpha = 1) {
  s.dot(x, y, { r, color: ACOL[a], alpha });
  s.text(a ? 'a' : 'A', x, y, { align: 'center', size: Math.round(r * 1.35), color: 'panel', halo: false, math: true, dy: 1, alpha });
}
/** A pea (Mendel's seed traits): round or wrinkled outline, yellow or green; R in pixels. */
function pea(v, s, x, y, R, round, yellow) {
  const c = s.ctx, X = s.X(x), Y = s.Y(y), col = yellow ? 'gold' : 'green';
  c.save(); c.beginPath();
  for (let i = 0; i <= 72; i++) {
    const t = (i / 72) * 2 * Math.PI, rr = round ? R : R * (0.9 + 0.07 * Math.sin(6 * t + 0.7) + 0.05 * Math.sin(11 * t));
    const px = X + rr * Math.cos(t) * (round ? 1 : 1.05), py = Y + rr * Math.sin(t) * (round ? 0.94 : 0.86);
    if (i) c.lineTo(px, py); else c.moveTo(px, py);
  }
  c.closePath(); c.fillStyle = v.color(col, 0.85); c.fill(); c.lineWidth = 1.3; c.strokeStyle = v.color('ink', 0.55); c.stroke();
  if (round && R > 5) { c.beginPath(); c.ellipse(X - R * 0.33, Y - R * 0.33, R * 0.24, R * 0.15, -0.6, 0, 2 * Math.PI); c.fillStyle = 'rgba(255,255,255,0.55)'; c.fill(); }
  else if (R > 5) { c.beginPath(); c.moveTo(X - R * 0.5, Y - R * 0.1); c.quadraticCurveTo(X, Y + R * 0.25, X + R * 0.45, Y - R * 0.2); c.lineWidth = 1; c.strokeStyle = v.color('ink', 0.35); c.stroke(); }
  c.restore();
}
/** Exact (Levene 1949) distribution of the heterozygote count given n individuals and nA copies of A → [[h, prob], …]. */
function levene(M, n, nA) {
  const nB = 2 * n - nA, out = [];
  const lc = M.lgamma(n + 1) + M.lgamma(nA + 1) + M.lgamma(nB + 1) - M.lgamma(2 * n + 1);
  for (let h = nA % 2; h <= Math.min(nA, nB); h += 2) {
    const a = (nA - h) / 2, b = (nB - h) / 2;
    out.push([h, Math.exp(lc - M.lgamma(a + 1) - M.lgamma(h + 1) - M.lgamma(b + 1) + h * Math.LN2)]);
  }
  return out;
}
/** Genotype index (0 AA, 1 Aa, 2 aa) drawn with probabilities P, H (and 1 − P − H). */
const drawG = (r, P, H) => { const u = r(); return u < P ? 0 : u < P + H ? 1 : 2; };
/** Allele transmitted by a parent of genotype g (Mendelian segregation). */
const gamete = (r, g) => (g === 1 ? (r() < 0.5 ? 0 : 1) : g / 2);
/** De Finetti coordinates (x = p, height ∝ heterozygote frequency). */
const dfXY = (P, H) => [P + H / 2, H * SQ3];

export default {
  collection: 'popgen',
  chapter: 1,
  title: 'Genetic variation and Hardy–Weinberg',
  summary: String.raw`Mendel’s discrete factors turn a population into a pool of alleles. Under random mating the genotype frequencies are fixed by the allele frequencies after a single generation — the Hardy–Weinberg law — and the de Finetti diagram shows at a glance how far a population sits from it. Inbreeding, assortative mating and population subdivision each leave a characteristic heterozygote deficit, while sex linkage turns the approach to equilibrium into a damped oscillation. Along the way the chapter fixes the vocabulary used everywhere after: allele and genotype frequencies, heterozygosity, and identity by descent.`,
  items: [
    // ───────────────────────────────────────────────────────────── 1.1
    {
      num: '1.1',
      kind: 'Definition',
      name: 'Genes, alleles, genotypes and allele frequencies',
      statement: String.raw`A **gene** (or **locus**) is a heritable unit at a fixed place on a chromosome, and its alternative versions are **alleles**. A diploid individual carries two copies of every autosomal gene, one from each parent; the unordered pair of alleles it carries is its **genotype**, **homozygous** if the two copies are the same allele ($AA$ or $aa$) and **heterozygous** otherwise ($Aa$).

In a population of $N$ diploids with genotype counts $n_{AA}, n_{Aa}, n_{aa}$, the **genotype frequencies** are $P = n_{AA}/N$, $H = n_{Aa}/N$, $Q = n_{aa}/N$, and the **allele frequencies** are the shares of the $2N$ gene copies:
$$p = \frac{2n_{AA}+n_{Aa}}{2N} = P + \tfrac12 H, \qquad q = 1-p = Q + \tfrac12 H .$$
Genotype frequencies determine allele frequencies but not conversely: for $0<p<1$ many genotype mixtures share the same $p$.`,
      idea: String.raw`Allele frequencies count gene copies, genotype frequencies count individuals. A homozygote holds two copies of its allele and a heterozygote one of each, which gives $p = P + \tfrac12 H$. The reverse fails because the same $2N$ copies can be packaged into individuals in many ways: with $k$ copies of $A$ the number of heterozygotes can be anything from $k \bmod 2$ up to $\min(k, 2N-k)$ in steps of two. Which packaging a real population shows is the question the rest of the chapter answers — random mating picks a particular one (1.5).`,
      caption: String.raw`Forty individuals, each holding two gene copies (blue $A$, orange $a$); the outline shows the genotype (blue $AA$, purple $Aa$, orange $aa$). The slider sets how many of the 80 copies are $A$; the buttons repackage the *same* copies at random, like with like, or unlike with unlike. Click one individual and then another to swap a gene copy between them: the genotype bars jump, the allele bars never move. The purple slices show the heterozygotes’ copies being split half to $p$, half to $q$.`,
      deps: [],
      refs: ['Gillespie', 'Nielsen–Slatkin'],
      credit: 'Bateson, 1902 (allelomorph, homozygote, heterozygote); Johannsen, 1909 (gene, genotype)',
      tags: ['alleles', 'genotypes'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Allele_frequency' },
      viz(v) {
        const N = 40, COLS = 8, ROWS = 5, DY = 1.08, TOP = ROWS * DY + 0.04;
        const kS = v.slider('copies of $A$ among the $2N = 80$', 0, 80, 46, { int: true, onChange: () => build() });
        const how = v.select('package them', [{ value: 'random', label: 'at random' }, { value: 'like', label: 'like with like' }, { value: 'unlike', label: 'unlike with unlike' }], 'random', { onChange: () => build() });
        let seed = 11;
        v.button('Re-pair at random', () => { seed += 1; how.set('random'); build(); });
        const sP = v.stage({ x: [0, COLS], y: [0, TOP + 0.04], equal: true, axes: false, height: 300, weight: 1.35 });
        const sB = v.stage({ x: [-0.25, 6.15], y: [-0.17, 1.13], axes: false, height: 300 });
        let pop = [], sel = -1;
        const pos = (i) => [(i % COLS) + 0.5, TOP - (Math.floor(i / COLS) + 0.5) * DY];
        function build() {
          const k = kS.value, r = v.rng(seed);
          let pool = Array.from({ length: 2 * N }, (_, i) => (i < k ? 0 : 1));
          if (how.value === 'random') pool = r.shuffle(pool);
          else if (how.value === 'unlike') {
            const het = Math.min(k, 2 * N - k), out = [];
            for (let t = 0; t < het; t++) out.push(0, 1);
            for (let t = het; t < k; t++) out.push(0);
            for (let t = het; t < 2 * N - k; t++) out.push(1);
            pool = out;
          }
          pop = [];
          for (let i = 0; i < N; i++) pop.push([pool[2 * i], pool[2 * i + 1]]);
          if (how.value !== 'random') pop = r.shuffle(pop);
          sel = -1;
        }
        build();
        sP.onClick((x, y) => {
          let hit = -1;
          pop.forEach((_, i) => { const [cx, cy] = pos(i); if (Math.abs(x - cx) < 0.47 && Math.abs(y - cy) < 0.42) hit = i; });
          if (hit < 0) { sel = -1; return; }
          if (sel < 0 || sel === hit) { sel = sel === hit ? -1 : hit; return; }
          const A = pop[sel], B = pop[hit]; let done = false;
          for (const i of [1, 0]) for (const j of [0, 1]) if (!done && A[i] !== B[j]) { [A[i], B[j]] = [B[j], A[i]]; done = true; }
          sel = -1;
        });
        const counts = () => { const c = [0, 0, 0]; for (const [a, b] of pop) c[a + b]++; return c; };
        v.render(() => {
          pop.forEach(([a, b], i) => { const [cx, cy] = pos(i); diploid(sP, cx, cy, a, b, i === sel ? { color: 'gold', width: 3.4, fillAlpha: 0.3 } : {}); });
          const c = counts(), P = c[0] / N, H = c[1] / N, Q = c[2] / N, bw = 0.33;
          sB.line(-0.15, 0, 6.05, 0, { color: 'faint', width: 1 });
          sB.text('genotypes (count individuals)', 1.5, 1.08, { align: 'center', size: 11.5, color: 'muted', weight: 600 });
          sB.text('alleles (count copies)', 4.7, 1.08, { align: 'center', size: 11.5, color: 'muted', weight: 600 });
          [P, H, Q].forEach((f, g) => {
            const x = 0.5 + g;
            if (f > 0) sB.rect(x - bw, 0, x + bw, f, { fill: GCOL[g], fillAlpha: 0.72, color: GCOL[g], width: 1.2 });
            sB.text(v.fix(f, 3), x, f, { align: 'center', baseline: 'bottom', dy: -3, size: 11.5, weight: 600 });
            sB.tex(['P', 'H', 'Q'][g] + String.raw`\;(${GNAME[g]})`, x, -0.085, { color: GCOL[g], size: 13 });
          });
          const stack = (x, base, top, col, lab) => {
            if (top - base <= 0) return;
            sB.rect(x - bw, base, x + bw, top, { fill: col, fillAlpha: col === 'purple' ? 0.4 : 0.72, color: col, width: 1.2 });
            if (top - base > 0.075) sB.tex(lab, x, (base + top) / 2, { color: col === 'purple' ? 'purple' : 'panel', size: 13 });
          };
          stack(4.15, 0, P, 'blue', 'P'); stack(4.15, P, P + H / 2, 'purple', String.raw`\tfrac12H`);
          stack(5.25, 0, Q, 'orange', 'Q'); stack(5.25, Q, Q + H / 2, 'purple', String.raw`\tfrac12H`);
          sB.text(v.fix(P + H / 2, 3), 4.15, P + H / 2, { align: 'center', baseline: 'bottom', dy: -3, size: 11.5, weight: 600 });
          sB.text(v.fix(Q + H / 2, 3), 5.25, Q + H / 2, { align: 'center', baseline: 'bottom', dy: -3, size: 11.5, weight: 600 });
          sB.tex(String.raw`p\;(A)`, 4.15, -0.085, { color: 'blue', size: 13 }); sB.tex(String.raw`q\;(a)`, 5.25, -0.085, { color: 'orange', size: 13 });
          sP.corner(sel >= 0 ? 'now click another individual to swap a gene copy' : '', 'br', { color: 'gold', weight: 600 });
        });
        v.legend([['blue', '$AA$ · allele $A$', { area: true }], ['purple', '$Aa$ (one copy of each)', { area: true }], ['orange', '$aa$ · allele $a$', { area: true }]]);
        v.readout(() => {
          const c = counts(), k = 2 * c[0] + c[1], P = c[0] / N, H = c[1] / N, lo = k % 2, hi = Math.min(k, 2 * N - k);
          const range = hi === lo ? `only ${lo}` : hi === lo + 2 ? `${lo} or ${hi}` : `any of ${lo}, ${lo + 2}, …, ${hi}`;
          return String.raw`counts $n_{AA}:n_{Aa}:n_{aa} = ${c[0]}:${c[1]}:${c[2]}$ · counting gene copies $p = \frac{2n_{AA}+n_{Aa}}{2N} = \frac{${k}}{80} = ${v.fix(k / 80, 3)}$, and $P+\tfrac12 H = ${v.fix(P, 3)}+${v.fix(H / 2, 3)} = ${v.fix(P + H / 2, 3)}$ ✓ · with ${k} copies of $A$ the number of heterozygotes can be ${range}`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 1.2
    {
      num: '1.2',
      kind: 'Law',
      name: 'Mendel’s law of segregation',
      statement: String.raw`The two copies of a gene in a diploid parent separate (segregate) at meiosis, and each gamete receives exactly one of them, each with probability $\tfrac12$, independently of the other parent’s gamete. Consequently a cross $Aa\times Aa$ produces offspring genotypes $AA : Aa : aa$ in expected proportions $\tfrac14 : \tfrac12 : \tfrac14$ (a $3:1$ phenotype ratio when $A$ is dominant), a test cross $Aa\times aa$ gives $Aa : aa = 1:1$, and $AA \times aa$ gives only $Aa$. In $n$ offspring the observed genotype counts are multinomial with these proportions, so the observed shares approach them with errors of order $1/\sqrt n$.`,
      idea: String.raw`Meiosis halves the chromosome set: homologous chromosomes pair and are pulled to opposite poles, so each gamete carries one homologue, and with a fair meiosis either one equally often. Fertilisation then unites two independently formed gametes, so the offspring genotype is the sum of two independent fair coin flips — the four cells of the Punnett square are equally likely. Counting offspring is multinomial sampling, and the law of large numbers drives the observed shares to $\tfrac14, \tfrac12, \tfrac14$; a meiotic-drive allele that grabs more than half the gametes breaks the coin and shifts the ratios, which a $\chi^2$ test then detects.`,
      caption: String.raw`Press play: each offspring is made by drawing one gamete from each parent (the chips fly in from the margins) and lands in its Punnett cell; the cells darken with their observed share. On the right, the observed shares settle onto the expected values (dashed) inside the $\pm 2$ standard-error funnel. Raise the slider above $0.5$ to simulate meiotic drive: the heterozygote stops transmitting fairly, the shares converge to a different ratio, and the $\chi^2$ test against Mendel’s $1:2:1$ rejects. Mendel’s own $F_2$: 5474 round to 1850 wrinkled seeds, $2.96:1$.`,
      deps: ['popgen-1.1'],
      refs: ['Ewens §1.2'],
      credit: 'Mendel, 1866',
      scope: String.raw`Holds for nuclear genes of sexually reproducing diploids with a fair meiosis and equal viability of all gametes and zygotes. It fails for organelle genes (inherited from one parent), under meiotic drive or gametic selection (e.g. the mouse $t$-haplotype), and when genotypes differ in survival before they are counted.`,
      tags: ['Mendelian inheritance', 'segregation'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Mendelian_inheritance' },
      viz(v) {
        const M = v.M, NMAX = 5000, FLY = 0.35;
        const CROSS = { 'Aa×Aa': [[0, 1], [0, 1]], 'Aa×aa': [[0, 1], [1, 1]], 'AA×aa': [[0, 0], [1, 1]] };
        const cross = v.select('cross', [{ value: 'Aa×Aa', label: '$Aa\\times Aa$' }, { value: 'Aa×aa', label: '$Aa\\times aa$' }, { value: 'AA×aa', label: '$AA\\times aa$' }], 'Aa×Aa', { onChange: () => v.restart() });
        const kS = v.slider('share of $A$ among a heterozygote’s gametes', 0.3, 0.95, 0.5, { step: 0.01 });
        let seed = 7;
        v.button('New offspring', () => { seed += 1; v.restart(); });
        const sQ = v.stage({ x: [-0.78, 2.12], y: [-0.22, 2.72], equal: true, axes: false, height: 340 });
        const sC = v.stage({ x: [1, NMAX], y: [-0.02, 1.02], xlog: true, axes: 'box', height: 340, weight: 1.25, xlabel: 'offspring n', ylabel: 'share', title: 'observed genotype shares as offspring accumulate' });
        const cache = memo();
        const sim = () => cache([cross.value, kS.value, seed].join('|'), () => {
          const r = v.rng(seed), [P1, P2] = CROSS[cross.value], k = kS.value;
          const slot = (g) => (g[0] !== g[1] ? (r() < k ? 0 : 1) : r() < 0.5 ? 0 : 1);
          const c1 = new Uint8Array(NMAX), c2 = new Uint8Array(NMAX), gt = new Uint8Array(NMAX);
          for (let i = 0; i < NMAX; i++) { c1[i] = slot(P1); c2[i] = slot(P2); gt[i] = P1[c1[i]] + P2[c2[i]]; }
          const marks = [], cnt = [0, 0, 0]; let next = 1;
          for (let i = 0; i < NMAX; i++) { cnt[gt[i]]++; const n = i + 1; if (n >= next || n === NMAX) { marks.push([n, cnt[0] / n, cnt[1] / n, cnt[2] / n]); next = Math.max(n + 1, Math.round(n * 1.04)); } }
          return { c1, c2, gt, marks, P1, P2 };
        });
        const pA = (g, k) => (g[0] === g[1] ? (g[0] === 0 ? 1 : 0) : k);
        const expect = (k) => { const [P1, P2] = CROSS[cross.value], a = pA(P1, k), b = pA(P2, k); return [a * b, a * (1 - b) + (1 - a) * b, (1 - a) * (1 - b)]; };
        const nOf = (t) => (t < 4.2 ? Math.min(NMAX, Math.floor(t / FLY) + 1) : Math.min(NMAX, Math.round(13 * 10 ** ((t - 4.2) / 1.9))));
        let shownN = 1;
        v.animate((t) => {
          const S = sim(), n = nOf(t), u = (t / FLY) % 1, flying = t < 4.2 && u < 0.62;
          const shown = flying ? n - 1 : n; shownN = shown;
          const cell = [[0, 0], [0, 0]], cnt = [0, 0, 0];
          for (let i = 0; i < shown; i++) { cell[S.c2[i]][S.c1[i]]++; cnt[S.gt[i]]++; }
          const gname = (g) => (g[0] === g[1] ? (g[0] ? 'aa' : 'AA') : 'Aa');
          // ── Punnett square
          sQ.tex(String.raw`\text{parent 1: } ${gname(S.P1)}`, 1, 2.6, { size: 14 });
          sQ.tex(String.raw`\text{parent 2: } ${gname(S.P2)}`, -0.38, 2.6, { size: 14 });
          const last = n - 1, lc = S.c1[last], lr = S.c2[last];
          for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) {
            const g = S.P1[j] + S.P2[i], share = shown ? cell[i][j] / shown : 0, y0 = 1 - i;
            sQ.rect(j, y0, j + 1, y0 + 1, { fill: GCOL[g], fillAlpha: 0.08 + 1.3 * share, color: 'panel', width: 3 });
            sQ.tex(GNAME[g], j + 0.5, y0 + 0.78, { color: share > 0.3 ? 'panel' : GCOL[g], size: 16 });
            sQ.text(String(cell[i][j]), j + 0.5, y0 + 0.47, { align: 'center', size: 22, weight: 700, color: share > 0.3 ? 'panel' : 'ink', halo: share <= 0.3 });
            sQ.text(shown ? `${v.fix(100 * share, 1)}%` : '', j + 0.5, y0 + 0.2, { align: 'center', size: 11.5, color: share > 0.3 ? 'panel' : 'muted', halo: share <= 0.3 });
          }
          sQ.rect(0, 0, 2, 2, { color: 'faint', width: 1 });
          if (t < 6.5) sQ.rect(lc + 0.04, 1 - lr + 0.04, lc + 0.96, 2 - lr - 0.04, { color: 'gold', width: 3 });
          for (let j = 0; j < 2; j++) chip(sQ, j + 0.5, 2.25, S.P1[j], 13, flying && j === lc ? 0.35 : 1);
          for (let i = 0; i < 2; i++) chip(sQ, -0.36, 1.5 - i, S.P2[i], 13, flying && i === lr ? 0.35 : 1);
          if (flying) {
            const e = M.smoothstep(0, 0.62, u), cx = lc + 0.5, cy = 1.5 - lr;
            chip(sQ, M.lerp(lc + 0.5, cx - 0.16, e), M.lerp(2.25, cy - 0.3, e), S.P1[lc], 11);
            chip(sQ, M.lerp(-0.36, cx + 0.16, e), M.lerp(1.5 - lr, cy - 0.3, e), S.P2[lr], 11);
          }
          // ── convergence
          const E = expect(kS.value), E0 = expect(0.5);
          for (let g = 0; g < 3; g++) {
            if (E[g] <= 0 || E[g] >= 1) continue;
            const se = (m) => 2 * Math.sqrt((E[g] * (1 - E[g])) / m);
            sC.clip(() => { sC.fn((m) => E[g] + se(m), { color: GCOL[g], width: 1, alpha: 0.45 }); sC.fn((m) => E[g] - se(m), { color: GCOL[g], width: 1, alpha: 0.45 }); });
          }
          if (Math.abs(kS.value - 0.5) > 1e-9) E0.forEach((e, g) => { if (e > 0) sC.hline(e, { color: 'muted', width: 1.2, dash: [2, 4] }); });
          E.forEach((e, g) => { if (e > 0) sC.hline(e, { color: GCOL[g], width: 1.5, dash: [6, 4] }); });
          for (let g = 0; g < 3; g++) {
            if (E[g] <= 0) continue;
            const pts = S.marks.filter((m) => m[0] <= shown).map((m) => [m[0], m[1 + g]]);
            if (shown >= 1) pts.push([shown, cnt[g] / shown]);
            sC.path(pts, { color: GCOL[g], width: 2.2 });
            if (shown >= 1) sC.dot(shown, cnt[g] / shown, { r: 4, color: GCOL[g] });
          }
          sC.vline(Math.max(1, shown), { color: 'gold', width: 1.4 });
        }, { period: 11.5, still: 10.6 });
        v.legend([['blue', '$AA$'], ['purple', '$Aa$'], ['orange', '$aa$'], ['muted', 'expected share, ± 2 SE funnel', { dash: true }], ['gold', 'drawn now', { area: true }]]);
        v.readout(() => {
          const S = sim(), n = shownN, cnt = [0, 0, 0];
          for (let i = 0; i < n; i++) cnt[S.gt[i]]++;
          const E0 = expect(0.5), k = kS.value;
          if (cross.value === 'AA×aa') return String.raw`$n = ${n}$ offspring, **all** $Aa$ (${cnt[1]} of ${n}): every gamete of parent 1 carries $A$ and every gamete of parent 2 carries $a$ — the uniform $F_1$ generation.`;
          const T = gof(M, cnt, E0), ratio = cross.value === 'Aa×Aa' ? `${v.fix(4 * cnt[0] / Math.max(1, n), 2)} : ${v.fix(4 * cnt[1] / Math.max(1, n), 2)} : ${v.fix(4 * cnt[2] / Math.max(1, n), 2)}` : `${v.fix(2 * cnt[1] / Math.max(1, n), 2)} : ${v.fix(2 * cnt[2] / Math.max(1, n), 2)}`;
          const mendel = cross.value === 'Aa×Aa' ? '1 : 2 : 1' : '1 : 1';
          return String.raw`$n = ${n}$ offspring: $AA$ ${cnt[0]} · $Aa$ ${cnt[1]} · $aa$ ${cnt[2]} → ratio ${ratio} (Mendel ${mendel}) · $\chi^2 = ${v.fix(T.chi2, 2)}$ on ${T.df} df against Mendel, $p ${pText(v, T.pval)}$${Math.abs(k - 0.5) > 1e-9 ? ` · drive: heterozygotes pass on $A$ with probability ${v.fix(k, 2)}` : ''}`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 1.3
    {
      num: '1.3',
      kind: 'Law',
      name: 'Mendel’s law of independent assortment',
      statement: String.raw`Genes on different chromosomes segregate independently of each other: a double heterozygote $RrYy$ forms the four gamete types $RY, Ry, rY, ry$ in equal proportions $\tfrac14$ each. Selfing (or intercrossing) such double heterozygotes therefore gives the sixteen equally likely gamete combinations of a $4\times4$ Punnett square, and with $R$ and $Y$ dominant the four phenotype classes appear in the ratio $9:3:3:1$. For two genes on the *same* chromosome the gametes are instead $\tfrac{1-r}2$ of each parental type and $\tfrac r2$ of each recombinant type, where $r\in[0,\tfrac12]$ is the recombination fraction; independent assortment is the case $r=\tfrac12$.`,
      idea: String.raw`Each pair of homologous chromosomes orients on the metaphase plate independently of the other pairs, so which $R$-allele and which $Y$-allele end up in the same gamete is two independent fair coin flips: gamete frequencies are products, $\tfrac12\cdot\tfrac12$. With dominance, $P(R\_)=\tfrac34$ and $P(Y\_)=\tfrac34$ independently, which multiplies out to $\tfrac9{16},\tfrac3{16},\tfrac3{16},\tfrac1{16}$. Genes close together on one chromosome travel together unless a crossover separates them, so recombinant gametes are rarer than $\tfrac14$ and the Punnett square becomes lopsided — the observation that led to linkage maps.`,
      caption: String.raw`Mendel’s seed traits: round ($R$) over wrinkled ($r$) and yellow ($Y$) over green ($y$). Each row and column of the Punnett square is as wide as the frequency of its gamete type, so every cell’s area is the probability of that offspring. At $r = 0.5$ the grid is uniform and the bars match $9:3:3:1$ (green ticks). Lower $r$ to put the genes close together on one chromosome: recombinant gametes (orange labels) shrink, the classes drift away from $9:3:3:1$, and switching the parents to repulsion phase distorts them the other way. Choose *Mendel’s 556* to test his actual counts against each hypothesis.`,
      deps: ['popgen-1.2'],
      refs: ['Gillespie'],
      credit: 'Mendel, 1866; linkage: Bateson, Saunders & Punnett, 1905; Morgan, 1911',
      scope: String.raw`Holds for genes on different chromosomes, or so far apart on one chromosome that recombination reaches $r=\tfrac12$. Linked genes violate it, and so do chromosomal rearrangements and segregation distortion.`,
      tags: ['Mendelian inheritance', 'linkage'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Mendelian_inheritance#Law_of_Independent_Assortment' },
      viz(v) {
        const M = v.M, GAM = ['RY', 'Ry', 'rY', 'ry'], MENDEL = [315, 108, 101, 32];
        const CLS = [[true, true], [true, false], [false, true], [false, false]]; // [round, yellow]
        const cls = (a, b) => (GAM[a][0] === 'R' || GAM[b][0] === 'R' ? 0 : 2) + (GAM[a][1] === 'Y' || GAM[b][1] === 'Y' ? 0 : 1);
        const rS = v.slider('recombination fraction $r$', 0, 0.5, 0.5, { step: 0.01 });
        const phase = v.select('parents', [{ value: 'cis', label: 'coupling $RY/ry$' }, { value: 'trans', label: 'repulsion $Ry/rY$' }], 'cis');
        const data = v.select('seeds', [{ value: 'sim', label: 'simulated' }, { value: 'mendel', label: 'Mendel’s 556 (1866)' }], 'sim', { onChange: () => { const m = data.value === 'mendel'; nS.el.hidden = m; nb.hidden = m; } });
        const nS = v.slider('seeds $n$', 16, 2000, 556, { int: true });
        let seed = 4;
        const nb = v.button('New seeds', () => { seed += 1; });
        const sG = v.stage({ x: [-0.18, 1.03], y: [-0.03, 1.19], equal: true, axes: false, height: 340, title: 'Punnett square, cell area = probability' });
        const sB = v.stage({ x: [-0.6, 3.6], y: [-0.14, 0.75], axes: false, height: 340, weight: 1.05, title: 'phenotype classes' });
        const freqs = () => { const r = rS.value, nr = (1 - r) / 2, re = r / 2; return phase.value === 'cis' ? [nr, re, re, nr] : [re, nr, nr, re]; };
        const expected = () => { const f = freqs(), E = [0, 0, 0, 0]; for (let a = 0; a < 4; a++) for (let b = 0; b < 4; b++) E[cls(a, b)] += f[a] * f[b]; return E; };
        const cache = memo();
        const observed = () => (data.value === 'mendel' ? MENDEL : cache([rS.value, phase.value, nS.value, seed].join('|'), () => {
          const f = freqs(), r = v.rng(seed * 97 + 3), O = [0, 0, 0, 0];
          const pick = () => { let u = r(), k = 0; while (k < 3 && u >= f[k]) { u -= f[k]; k++; } return k; };
          for (let i = 0; i < nS.value; i++) O[cls(pick(), pick())]++;
          return O;
        }));
        const isRec = (a) => (phase.value === 'cis' ? a === 1 || a === 2 : a === 0 || a === 3);
        v.render(() => {
          const f = freqs(), X = [0]; f.forEach((w) => X.push(X[X.length - 1] + w));
          for (let a = 0; a < 4; a++) for (let b = 0; b < 4; b++) {
            const x0 = X[a], x1 = X[a + 1], y1 = 1 - X[b], y0 = 1 - X[b + 1];
            if (x1 - x0 < 1e-9 || y1 - y0 < 1e-9) continue;
            const [round, yellow] = CLS[cls(a, b)];
            sG.rect(x0, y0, x1, y1, { fill: yellow ? 'gold' : 'green', fillAlpha: 0.2, color: 'panel', width: 1.5 });
            const R = Math.min(x1 - x0, y1 - y0) * sG.scale * 0.3;
            if (R >= 3) pea(v, sG, (x0 + x1) / 2, (y0 + y1) / 2, Math.min(R, 15), round, yellow);
          }
          sG.rect(0, 0, 1, 1, { color: 'faint', width: 1 });
          for (let a = 0; a < 4; a++) {
            const w = f[a];
            if (w * sG.scale < 20) continue;
            const col = isRec(a) ? 'orange' : 'ink';
            sG.tex(GAM[a], (X[a] + X[a + 1]) / 2, 1.06, { color: col, size: 13 });
            sG.tex(GAM[a], -0.085, 1 - (X[a] + X[a + 1]) / 2, { color: col, size: 13 });
            sG.text(v.fix(w, 3), (X[a] + X[a + 1]) / 2, 1.135, { align: 'center', size: 10, color: 'muted' });
          }
          // bars
          const E = expected(), O = observed(), n = O.reduce((s, x) => s + x, 0), T = [9, 3, 3, 1].map((x) => x / 16), bw = 0.34;
          sB.line(-0.5, 0, 3.5, 0, { color: 'faint', width: 1 });
          for (let c = 0; c < 4; c++) {
            const [round, yellow] = CLS[c], col = yellow ? 'gold' : 'green', o = O[c] / n;
            sB.rect(c - bw, 0, c + bw, o, { fill: col, fillAlpha: 0.55, color: col, width: 1.2 });
            sB.rect(c - bw - 0.05, 0, c + bw + 0.05, E[c], { color: 'ink', width: 1.6, dash: [5, 3] });
            sB.line(c - bw - 0.12, T[c], c + bw + 0.12, T[c], { color: 'green', width: 2.6 });
            sB.text(String(O[c]), c, Math.max(o, E[c]), { align: 'center', baseline: 'bottom', dy: -4, size: 12, weight: 700 });
            pea(v, sB, c, -0.075, 11, round, yellow);
          }
          sB.corner(data.value === 'mendel' ? 'Mendel’s counts, 1866' : `${n} simulated seeds`, 'tr', { color: 'muted' });
        });
        v.legend([['gold', 'yellow seed', { area: true }], ['green', 'green seed', { area: true }], ['ink', 'expected for this $r$', { dash: true }], ['green', '$9:3:3:1$']]);
        v.readout(() => {
          const E = expected(), O = observed(), n = O.reduce((s, x) => s + x, 0), Tm = gof(M, O, E), T9 = gof(M, O, [9, 3, 3, 1].map((x) => x / 16));
          const ratio = E.map((e) => v.fix(16 * e, 2)).join(' : ');
          return String.raw`expected for $r = ${v.fix(rS.value, 2)}$: ${ratio} (sixteenths) · observed ${O.join(' : ')} of ${n} · against this expectation $\chi^2 = ${v.fix(Tm.chi2, 2)}$ (3 df), $p ${pText(v, Tm.pval)}$ · against $9:3:3:1$: $\chi^2 = ${v.fix(T9.chi2, 2)}$, $p ${pText(v, T9.pval)}$`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 1.4
    {
      num: '1.4',
      kind: 'Concept',
      name: 'Random mating as random union of gametes',
      statement: String.raw`**Random mating** means that mates are chosen without regard to their genotype at the locus studied. For an autosomal locus with equal allele frequencies in the two sexes it is equivalent to the **random union of gametes**: each parent contributes gametes to a common pool in which allele $A$ has frequency $p = P + \tfrac12 H$, and each offspring is formed by drawing two gametes independently from that pool. The offspring genotype frequencies are then the products of the gamete frequencies,
$$P' = p^2,\qquad H' = 2pq,\qquad Q' = q^2,$$
whatever the genotype mixture $(P,H,Q)$ of the parents was.`,
      idea: String.raw`A random parent transmits $A$ with probability $P\cdot 1 + H\cdot\tfrac12 + Q\cdot 0 = p$ (segregation, 1.2), and with random pairing the two parents — hence the two gametes — are independent. Independence turns the joint probability of the two gametes into a product, which is the unit square split at $p$ on both axes: $p^2$, two rectangles of $pq$, and $q^2$. The parental genotype mix enters only through $p$. Self-fertilisation breaks the independence (both gametes come from one individual), so the offspring pile up on the diagonal cells.`,
      caption: String.raw`Drag the two handles on the parents’ bar to give them any genotype mix. Their gametes go into one pool, where only $p$ matters. On the right each offspring is a dot at a random position inside the band of its first gamete (horizontal) and second gamete (vertical); the cells of the square have areas $p^2$, $2pq$, $q^2$. With random union of gametes or random pairs of parents the dots fill the square evenly, so the counts match the areas. Switch to self-fertilisation: dots crowd into the homozygote corners and the product rule fails.`,
      deps: ['popgen-1.2', 'prob-2.1.1a'],
      refs: ['Ewens §2.2'],
      tags: ['random mating', 'gametes'],
      viz(v) {
        const M = v.M, NP = 500;
        const mode = v.select('offspring from', [{ value: 'gametes', label: 'random union of gametes' }, { value: 'pairs', label: 'random pairs of parents' }, { value: 'self', label: 'self-fertilisation' }], 'gametes');
        const nS = v.slider('offspring', 50, 3000, 900, { int: true });
        let seed = 9;
        v.button('New sample', () => { seed += 1; });
        const sL = v.stage({ x: [-0.04, 1.04], y: [0, 1.02], axes: false, height: 360, title: 'parents → gametes → one pool' });
        const sU = v.stage({ x: [-0.14, 1.04], y: [-0.14, 1.04], equal: true, axes: false, height: 360, title: 'union of two gametes' });
        const YH = 0.94;
        const h1 = sL.handle(0.35, YH, { color: 'blue', constrain: (x) => [clamp(x, 0, h2.x), YH] });
        const h2 = sL.handle(0.55, YH, { color: 'orange', constrain: (x) => [clamp(x, h1.x, 1), YH] });
        const parents = () => { const nAA = Math.round(NP * h1.x), nAa = Math.round(NP * h2.x) - nAA; return { nAA, nAa, naa: NP - nAA - nAa }; };
        const cache = memo();
        const sim = () => {
          const { nAA, nAa } = parents();
          return cache([nAA, nAa, mode.value, nS.value, seed].join('|'), () => {
            const r = v.rng(seed), p = (2 * nAA + nAa) / (2 * NP), par = [];
            for (let i = 0; i < NP; i++) par.push(i < nAA ? 0 : i < nAA + nAa ? 1 : 2);
            const pts = [[], [], []], cnt = [0, 0, 0];
            for (let i = 0; i < nS.value; i++) {
              let a, b;
              if (mode.value === 'gametes') { a = r() < p ? 0 : 1; b = r() < p ? 0 : 1; }
              else if (mode.value === 'pairs') { a = gamete(r, par[(r() * NP) | 0]); b = gamete(r, par[(r() * NP) | 0]); }
              else { const g = par[(r() * NP) | 0]; a = gamete(r, g); b = gamete(r, g); }
              const x = a === 0 ? r() * p : p + r() * (1 - p), y = b === 0 ? r() * p : p + r() * (1 - p);
              pts[a + b].push([x, y]); cnt[a + b]++;
            }
            return { p, pts, cnt };
          });
        };
        const urn = (() => { const r = v.rng(21), out = []; while (out.length < 170) { const x = r.uniform(0.1, 0.9), y = r.uniform(0.07, 0.36); out.push([x, y, r()]); } return out; })();
        v.render(() => {
          const { nAA, nAa, naa } = parents(), P = nAA / NP, H = nAa / NP, Q = naa / NP, S = sim(), p = S.p;
          // parents' bar
          const seg = (x0, x1, y0, y1, col, a = 0.7) => { if (x1 - x0 > 1e-6) sL.rect(x0, y0, x1, y1, { fill: col, fillAlpha: a, color: 'panel', width: 1.5 }); };
          sL.text('parents (drag the handles)', 0, 0.995, { size: 11.5, color: 'muted', weight: 600 });
          seg(0, P, 0.8, 0.9, 'blue'); seg(P, P + H, 0.8, 0.9, 'purple'); seg(P + H, 1, 0.8, 0.9, 'orange');
          [[0, P, 'AA', P], [P, P + H, 'Aa', H], [P + H, 1, 'aa', Q]].forEach(([a, b, lab, f]) => { if (b - a > 0.12) sL.text(`${lab} ${v.fix(100 * f, 0)}%`, (a + b) / 2, 0.85, { align: 'center', size: 11.5, weight: 700, color: 'panel', halo: false, math: false }); });
          // flows to gametes
          seg(0, P, 0.67, 0.8, 'blue', 0.12); seg(P, P + H / 2, 0.67, 0.8, 'blue', 0.12); seg(P + H / 2, P + H, 0.67, 0.8, 'orange', 0.12); seg(P + H, 1, 0.67, 0.8, 'orange', 0.12);
          if (H > 0.09) { sL.text('½ A', P + H / 4, 0.735, { align: 'center', size: 11, color: 'blue', weight: 600 }); sL.text('½ a', P + (3 * H) / 4, 0.735, { align: 'center', size: 11, color: 'orange', weight: 600 }); }
          seg(0, p, 0.57, 0.67, 'blue'); seg(p, 1, 0.57, 0.67, 'orange');
          if (p > 0.1) sL.text(`A  p = ${v.fix(p, 3)}`, p / 2, 0.62, { align: 'center', size: 11.5, weight: 700, color: 'panel', halo: false });
          if (p < 0.9) sL.text(`a  q = ${v.fix(1 - p, 3)}`, (1 + p) / 2, 0.62, { align: 'center', size: 11.5, weight: 700, color: 'panel', halo: false });
          sL.text('gametes', 0, 0.52, { size: 11.5, color: 'muted', weight: 600 });
          // urn
          const c = sL.ctx; c.save(); c.beginPath(); c.roundRect(sL.X(0.06), sL.Y(0.45), sL.X(0.94) - sL.X(0.06), sL.Y(0.02) - sL.Y(0.45), 18);
          c.fillStyle = v.color('faint', 0.18); c.fill(); c.strokeStyle = v.color('muted', 0.6); c.lineWidth = 1.5; c.stroke(); c.restore();
          sL.dots(urn.filter((d) => d[2] < p), { r: 3.4, color: 'blue' }); sL.dots(urn.filter((d) => d[2] >= p), { r: 3.4, color: 'orange' });
          sL.text('the gamete pool: every gamete independent', 0.5, 0.405, { align: 'center', size: 11, color: 'muted' });
          // unit square
          const cells = [[0, 0, p, p, 0], [p, 0, 1, p, 1], [0, p, p, 1, 1], [p, p, 1, 1, 2]];
          for (const [x0, y0, x1, y1, g] of cells) if (x1 > x0 && y1 > y0) sU.rect(x0, y0, x1, y1, { fill: GCOL[g], fillAlpha: 0.12, color: GCOL[g], width: 1.2 });
          for (let g = 0; g < 3; g++) sU.dots(S.pts[g], { r: 1.9, color: GCOL[g], alpha: 0.85 });
          sU.rect(0, 0, 1, 1, { color: 'muted', width: 1.2 });
          const lab = (x, y, s, ok) => { if (ok) sU.tex(s, x, y, { size: 14, color: 'ink' }); };
          lab(p / 2, p / 2, String.raw`p^2`, p > 0.14); lab((1 + p) / 2, (1 + p) / 2, String.raw`q^2`, p < 0.86);
          lab((1 + p) / 2, p / 2, String.raw`pq`, p > 0.14 && p < 0.86); lab(p / 2, (1 + p) / 2, String.raw`pq`, p > 0.14 && p < 0.86);
          sU.tex('A', p / 2, -0.06, { color: 'blue', size: 14 }); sU.tex('a', (1 + p) / 2, -0.06, { color: 'orange', size: 14 });
          sU.tex('A', -0.06, p / 2, { color: 'blue', size: 14 }); sU.tex('a', -0.06, (1 + p) / 2, { color: 'orange', size: 14 });
          sU.text('first gamete', 0.5, -0.115, { align: 'center', size: 11, color: 'muted' });
          sU.text('second', -0.1, 1.02, { align: 'left', size: 11, color: 'muted' });
        });
        v.legend([['blue', '$AA$ / $A$', { dot: true }], ['purple', '$Aa$', { dot: true }], ['orange', '$aa$ / $a$', { dot: true }]]);
        v.readout(() => {
          const { nAA, nAa, naa } = parents(), S = sim(), p = S.p, q = 1 - p, n = nS.value, c = S.cnt, e = [p * p, 2 * p * q, q * q], T = gof(M, c, e);
          const P = nAA / NP, H = nAa / NP, Q = naa / NP;
          const self = mode.value === 'self' ? String.raw` · selfing predicts $P+\tfrac H4 : \tfrac H2 : Q+\tfrac H4 = ${v.fix(P + H / 4, 3)} : ${v.fix(H / 2, 3)} : ${v.fix(Q + H / 4, 3)}$` : '';
          return String.raw`parents $P:H:Q = ${v.fix(P, 2)}:${v.fix(H, 2)}:${v.fix(Q, 2)}$, so $p = ${v.fix(p, 3)}$ · ${n} offspring $= ${v.fix(c[0] / n, 3)} : ${v.fix(c[1] / n, 3)} : ${v.fix(c[2] / n, 3)}$ against the products $p^2 : 2pq : q^2 = ${v.fix(e[0], 3)} : ${v.fix(e[1], 3)} : ${v.fix(e[2], 3)}$ · $\chi^2 = ${v.fix(T.chi2, 1)}$ (2 df), $p\text{-value} ${pText(v, T.pval)}$${self}`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 1.5
    {
      num: '1.5',
      kind: 'Theorem',
      name: 'Hardy–Weinberg law',
      statement: String.raw`Consider an autosomal locus with alleles $A, a$ in a diploid population with non-overlapping generations, and assume random mating (1.4), equal allele frequencies in the two sexes, no selection, mutation or migration, and a population so large that sampling fluctuations can be ignored. Whatever the genotype frequencies $(P, H, Q)$ of the parents, after **one** generation the genotype frequencies are
$$P' = p^2,\qquad H' = 2pq,\qquad Q' = q^2 \qquad (p = P + \tfrac12H,\; q = 1-p),$$
the allele frequency is unchanged, $p' = p$, and these **Hardy–Weinberg proportions** then persist in every later generation.`,
      idea: String.raw`By random union of gametes (1.4) the offspring frequencies are the products $p^2, 2pq, q^2$ of the gamete frequencies, which depend on the parents only through $p$. The new allele frequency is $p' = p^2 + \tfrac12\cdot 2pq = p(p+q) = p$, so the next generation draws from the same gamete pool and lands on the same proportions: the map $(P,H,Q)\mapsto(p^2,2pq,q^2)$ is idempotent. If the sexes start with different allele frequencies $p_f \neq p_m$, the first offspring have $p_fp_m, \dots$ instead, and equilibrium arrives one generation later at $p = \tfrac12(p_f+p_m)$.`,
      caption: String.raw`A population of 1008 individuals (one square each: blue $AA$, purple $Aa$, orange $aa$) mates at random, generation after generation. The lines are the genotype frequencies; the rings mark $p^2, 2pq, q^2$ computed from the *parents’* allele frequency. However generation 0 is made up, generation 1 already sits on the rings and stays there, while $p$ moves only by sampling noise. Choose the start in which all females are $AA$ and all males $aa$: generation 1 is all heterozygotes, off the rings — equal allele frequencies in the two sexes is a real hypothesis — and Hardy–Weinberg arrives in generation 2.`,
      deps: ['popgen-1.4'],
      refs: ['Ewens §1.2', 'Gillespie'],
      credit: 'Hardy, 1908; Weinberg, 1908',
      scope: String.raw`Holds for an autosomal locus under random mating in a large population with no selection, mutation or migration and equal allele frequencies in the sexes. Sex-linked loci (1.9), inbreeding (1.13), assortative mating (1.15), subdivision (1.16), selection and drift all produce departures.`,
      tags: ['Hardy–Weinberg', 'random mating'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Hardy%E2%80%93Weinberg_principle' },
      viz(v) {
        const M = v.M, W = 36, HH = 28, G = 14, RATE = 1.35;
        let seed = 3;
        const start = v.select('generation 0', [{ value: 'homo', label: 'only $AA$ and $aa$' }, { value: 'het', label: 'only $Aa$' }, { value: 'sex', label: '♀ all $AA$, ♂ all $aa$' }], 'homo', { onChange: () => { p0.el.hidden = start.value !== 'homo'; reset(); } });
        const p0 = v.slider('starting $p$', 0.05, 0.95, 0.7, { step: 0.01, onChange: () => reset() });
        v.button('New run', () => { seed += 1; reset(); });
        const sG = v.stage({ height: 330, weight: 1 });
        const sT = v.stage({ height: 330, weight: 1.3, axes: 'box', xlabel: 'generation', title: 'genotype frequencies (lines) and $p^2,\\,2pq,\\,q^2$ from the parents’ $p$ (rings)' });
        const A = v.agents(sG, {
          size: [W, HH], seed, animate: false, controls: false,
          states: [{ name: 'AA', color: 'blue' }, { name: 'Aa', color: 'purple' }, { name: 'aa', color: 'orange' }],
          init: (r, i) => {
            if (start.value === 'het') return 1;
            if (start.value === 'sex') return i % 2 === 0 ? 0 : 2;
            return r() < p0.value ? 0 : 2;
          },
          step: (Mo, r) => { // one generation of random mating; even columns female, odd columns male
            const g = Mo.grid, fem = [], mal = [];
            for (let k = 0; k < Mo.N; k++) ((k % W) % 2 ? mal : fem).push(g[k]);
            const nx = new Uint8Array(Mo.N);
            for (let k = 0; k < Mo.N; k++) nx[k] = gamete(r, fem[(r() * fem.length) | 0]) + gamete(r, mal[(r() * mal.length) | 0]);
            g.set(nx);
          },
          stats: (Mo) => { let s = 0; for (let k = 0; k < Mo.N; k++) s += Mo.grid[k]; return { p: 1 - s / (2 * Mo.N) }; },
        });
        const reset = () => { A.reset(seed); v.restart(); };
        const sync = (gen) => { if (A.t > gen) A.reset(seed); if (A.t < gen) A.model.step(gen - A.t); };
        v.animate((t) => {
          sync(Math.min(G, Math.floor(t * RATE)));
          A.draw();
          A.plot(sT, { series: ['AA', 'Aa', 'aa'], window: G, y: [-0.03, 1.05] });
          const Hs = A.history;
          for (let i = 1; i < Hs.t.length; i++) {
            const pp = Hs.p[i - 1], e = [pp * pp, 2 * pp * (1 - pp), (1 - pp) ** 2];
            e.forEach((x, g) => sT.dot(Hs.t[i], x, { r: 5, hollow: true, color: GCOL[g], width: 1.6 }));
          }
          sG.corner(`generation ${A.t}`, 'tl', { color: 'ink', weight: 700 });
        }, { period: G / RATE + 2.5, still: G / RATE + 1 });
        v.legend([['blue', '$AA$'], ['purple', '$Aa$'], ['orange', '$aa$'], ['muted', 'ring: Hardy–Weinberg value from the parents', { dot: true }]]);
        v.readout(() => {
          const Hs = A.history, i = Hs.t.length - 1, P = Hs.AA[i], H = Hs.Aa[i], Q = Hs.aa[i], N = W * HH;
          if (i === 0) return String.raw`generation 0: $P:H:Q = ${v.fix(P, 3)}:${v.fix(H, 3)}:${v.fix(Q, 3)}$ with $p = ${v.fix(Hs.p[0], 3)}$ — Hardy–Weinberg would have $2pq = ${v.fix(2 * Hs.p[0] * (1 - Hs.p[0]), 3)}$ heterozygotes. Press play.`;
          const pp = Hs.p[i - 1], T = hwTest(M, Math.round(P * N), Math.round(H * N), Math.round(Q * N));
          return String.raw`generation ${Hs.t[i]}: observed $P:H:Q = ${v.fix(P, 3)}:${v.fix(H, 3)}:${v.fix(Q, 3)}$ · from the parents’ $p = ${v.fix(pp, 3)}$: $p^2:2pq:q^2 = ${v.fix(pp * pp, 3)}:${v.fix(2 * pp * (1 - pp), 3)}:${v.fix((1 - pp) ** 2, 3)}$ · allele frequency ${v.fix(Hs.p[0], 3)} → ${v.fix(Hs.p[i], 3)} (sampling noise only) · HW test on this generation: $\chi^2 = ${v.fix(T.chi2, 2)}$, $p ${pText(v, T.pval)}$`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 1.6
    {
      num: '1.6',
      kind: 'Concept',
      name: 'De Finetti diagram',
      statement: String.raw`The genotype frequencies $(P, H, Q)$ at a biallelic locus are a point of the triangle $P + H + Q = 1$, $P,H,Q\ge 0$; drawn as an equilateral triangle with vertices $AA$, $Aa$, $aa$, the distance from the point to each side is proportional to one frequency. In this **de Finetti diagram** the horizontal coordinate is the allele frequency $p = P + \tfrac12H$ and the height is proportional to $H$. Populations in Hardy–Weinberg proportions lie on the parabola $H = 2p(1-p)$; points above it have a heterozygote excess, points below a deficit, and one generation of random mating moves any point vertically (at constant $p$) onto the parabola.`,
      idea: String.raw`Barycentric coordinates turn three frequencies summing to one into a point in a triangle, and with the $AA$ and $aa$ vertices on the base the horizontal position is $P\cdot1 + H\cdot\tfrac12 + Q\cdot0 = p$. The Hardy–Weinberg law (1.5) says random mating keeps $p$ and replaces $H$ by $2pq$: a vertical drop or rise onto the curve. Any force that acts on genotypes rather than on gametes — non-random mate choice, selection between fertilisation and census, the mixing of populations — leaves its mark as a distance from the parabola, which is why the diagram is the standard way to see departures.`,
      caption: String.raw`Drag the blue handle to set the parents’ genotype frequencies. Each gold dot is one simulated population of 400 offspring after one generation; the dots scatter around the green ring, the Hardy–Weinberg point straight below or above the parents, and the right panel shows the $\chi^2$ test of each run against the $\chi^2_1$ curve. Now break an assumption: assortative mating (by phenotype, $A$ dominant) or 50% selfing pull the cloud below the curve, selection against $aa$ before the census lifts it above, immigrants from a population with $p_m = 0.15$ drag it down (a Wahlund mixture), and a population of 16 scatters it widely and shifts $p$ itself.`,
      deps: ['popgen-1.5'],
      refs: ['Nielsen–Slatkin'],
      credit: 'de Finetti, 1926',
      tags: ['Hardy–Weinberg', 'de Finetti diagram'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/De_Finetti_diagram' },
      viz(v) {
        const M = v.M, R = 90;
        const proc = v.select('', [{ value: 'random', label: 'random mating' }, { value: 'assort', label: 'assortative' }, { value: 'inbreed', label: '50% selfing' }, { value: 'small', label: '$N = 16$' }, { value: 'select', label: 'selection' }, { value: 'migrate', label: 'migration' }], 'random');
        const sT = v.stage({ x: [-0.06, 1.06], y: [-0.11, 0.93], equal: true, axes: false, height: 380, weight: 1.5 });
        const sH = v.stage({ x: [0, 12], y: [0, 1.3], axes: 'box', height: 380, xlabel: 'χ²', title: 'HW test of each run' });
        const hp = sT.handle(0.62, 0.1 * SQ3, { color: 'accent', label: 'parents', labelPos: 'e', constrain: (x, y) => { const H = clamp(y / SQ3, 0, 1); return [clamp(x, H / 2, 1 - H / 2), H * SQ3]; } });
        const PM = 0.15, MIG = 0.35, SEL = 0.6, SELF = 0.5;
        const cache = memo();
        const runs = () => cache([hp.x.toFixed(4), hp.y.toFixed(4), proc.value].join('|'), () => {
          const H = hp.y / SQ3, P = hp.x - H / 2, r = v.rng(17), pr = proc.value, N = pr === 'small' ? 16 : 400, out = [];
          for (let k = 0; k < R; k++) {
            const c = [0, 0, 0];
            let made = 0, guard = 0;
            while (made < N && guard++ < 50 * N) {
              let g1 = drawG(r, P, H), g2;
              if (pr === 'assort') g2 = g1 === 2 ? 2 : r() < P / Math.max(1e-12, P + H) ? 0 : 1;
              else if (pr === 'inbreed' && r() < SELF) g2 = g1;
              else g2 = drawG(r, P, H);
              const child = gamete(r, g1) + gamete(r, g2);
              if (pr === 'select' && child === 2 && r() < SEL) continue;
              c[child]++; made++;
            }
            if (pr === 'migrate') { // replace a share of the census by immigrants in HW with p = PM
              const m = Math.round(MIG * N);
              for (let j = 0; j < m; j++) { const u = r() * N; let g = u < c[0] ? 0 : u < c[0] + c[1] ? 1 : 2; c[g]--; c[drawG(r, PM * PM, 2 * PM * (1 - PM))]++; }
            }
            const T = hwTest(M, c[0], c[1], c[2]);
            out.push({ P: c[0] / N, H: c[1] / N, Q: c[2] / N, chi2: T.chi2, p: T.p });
          }
          return out;
        });
        v.render(() => {
          const H = hp.y / SQ3, P = hp.x - H / 2, p = P + H / 2, Rn = runs();
          sT.poly([[0, 0], [1, 0], [0.5, SQ3]], { color: 'muted', width: 1.4, fill: 'faint', fillAlpha: 0.07 });
          sT.fn((x) => SQ3 * 2 * x * (1 - x), { domain: [0, 1], color: 'green', width: 2.4 });
          sT.text('heterozygote excess', 0.5, 0.62, { align: 'center', size: 11, color: 'muted', math: true });
          sT.text('deficit', 0.5, 0.2, { align: 'center', size: 11, color: 'muted', math: true });
          sT.tex(String.raw`H = 2pq`, 0.86, 0.3, { color: 'green', size: 13 });
          sT.line(p, 0, p, SQ3 * (1 - Math.abs(2 * p - 1)), { color: 'accent', width: 1, dash: [4, 4], alpha: 0.7 });
          sT.tex('aa', -0.03, -0.05, { size: 14, color: 'orange' }); sT.tex('AA', 1.03, -0.05, { size: 14, color: 'blue' }); sT.tex('Aa', 0.5, SQ3 + 0.045, { size: 14, color: 'purple' });
          [0.25, 0.5, 0.75].forEach((t) => { sT.line(t, 0, t, -0.015, { color: 'muted', width: 1 }); sT.text(String(t), t, -0.045, { align: 'center', size: 10.5, color: 'muted' }); });
          sT.text('p', 0.5, -0.09, { align: 'center', size: 13, color: 'muted', math: true });
          sT.dots(Rn.map((o) => dfXY(o.P, o.H)), { r: 2.8, color: 'gold' });
          const mP = M.mean(Rn.map((o) => o.P)), mH = M.mean(Rn.map((o) => o.H)), [mx, my] = dfXY(mP, mH);
          const [hx, hy] = [p, SQ3 * 2 * p * (1 - p)];
          sT.dot(hx, hy, { r: 7, hollow: true, color: 'green', width: 2.4 });
          if (Math.hypot(mx - hp.x, my - hp.y) > 0.02) sT.arrow(hp.x, hp.y, mx, my, { color: 'gold', width: 1.8, head: 8 });
          sT.dot(mx, my, { r: 5, color: 'gold' });
          // χ² panel
          const xs = Rn.map((o) => Math.min(o.chi2, 11.99)), big = Rn.filter((o) => o.chi2 >= 12).length;
          sH.hist(xs, { bins: M.linspace(0, 12, 25), density: true, color: 'gold', fillAlpha: 0.45 });
          sH.clip(() => sH.fn((x) => M.dist.chi2(1).pdf(x), { domain: [0.03, 12], color: 'green', width: 2 }));
          sH.vline(3.84, { color: 'red', dash: [5, 4], width: 1.4 });
          sH.text('5% cut-off', 3.95, 1.2, { size: 10.5, color: 'red' });
          if (big) sH.text(`${big} runs beyond 12 →`, 11.8, 0.25, { align: 'right', size: 11, color: 'gold', weight: 600 });
        });
        v.legend([['green', 'Hardy–Weinberg parabola'], ['gold', 'one simulated generation', { dot: true }], ['green', 'HW point for the parents’ $p$', { dot: true }], ['green', '$\\chi^2_1$ density (right)']]);
        v.readout(() => {
          const H = hp.y / SQ3, P = hp.x - H / 2, p = P + H / 2, Rn = runs(), rej = Rn.filter((o) => o.chi2 > 3.841).length;
          const mH = M.mean(Rn.map((o) => o.H)), mp = M.mean(Rn.map((o) => o.p)), sdp = M.stdev(Rn.map((o) => o.p)), F = 1 - mH / (2 * mp * (1 - mp));
          return String.raw`parents $P:H:Q = ${v.fix(P, 2)}:${v.fix(H, 2)}:${v.fix(1 - P - H, 2)}$, $p = ${v.fix(p, 3)}$ · offspring (mean of ${R} runs): $H = ${v.fix(mH, 3)}$ against $2pq = ${v.fix(2 * mp * (1 - mp), 3)}$ for their own $p = ${v.fix(mp, 3)}$ (spread ${v.fix(sdp, 3)}) · $F = 1 - H/2pq = ${v.fix(F, 3)}$ · the $\chi^2$ test rejects HW in **${rej} of ${R}** runs (about ${Math.round(0.05 * R)} expected if HW holds)`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 1.7
    {
      num: '1.7',
      kind: 'Method',
      name: 'Testing Hardy–Weinberg proportions',
      statement: String.raw`From a sample of $n$ individuals with genotype counts $n_{AA}, n_{Aa}, n_{aa}$, estimate the allele frequency by gene counting, $\hat p = (2n_{AA}+n_{Aa})/2n$ (the maximum-likelihood estimate, standard error $\sqrt{\hat p\hat q/2n}$ under Hardy–Weinberg), form the expected counts $n\hat p^2, 2n\hat p\hat q, n\hat q^2$, and compute
$$X^2 = \sum_{\text{genotypes}} \frac{(\text{observed}-\text{expected})^2}{\text{expected}} .$$
Under Hardy–Weinberg proportions $X^2$ is approximately $\chi^2$ with $3-1-1 = 1$ degree of freedom (one parameter estimated). When an allele is rare the approximation fails, and the **exact test** is used instead: conditional on $n$ and the allele count $n_A$, the heterozygote count has the distribution
$$P(n_{Aa}=h \mid n, n_A) = \frac{n!}{n_{AA}!\,h!\,n_{aa}!}\,\frac{2^{h}\,n_A!\,n_a!}{(2n)!},$$
and the $p$-value is the total probability of the outcomes no more likely than the one observed.`,
      idea: String.raw`Conditioning on the allele counts removes the unknown $p$: under random union of gametes (1.4) the $2n$ sampled gene copies are paired into individuals at random, and counting the pairings with $h$ heterozygotes gives Levene’s formula. Pearson’s statistic compares counts with their expectations and is asymptotically $\chi^2$ with degrees of freedom equal to the number of classes minus one minus the number of estimated parameters (here $3-1-1$). The asymptotics need every expected count to be reasonably large; with a rare allele the expected number of rare homozygotes is far below one, a single such individual inflates $X^2$ enormously, and the exact distribution shows how much less surprising it really is.`,
      caption: String.raw`MN blood groups are codominant, so every genotype can be read off directly — the classic test case. Left: observed counts (filled) against Hardy–Weinberg expectations (dashed outlines). Right: the distribution of $X^2$ in 4000 random re-pairings of the sample’s own alleles (drawn from the exact distribution) against the $\chi^2_1$ curve. The large samples fit Hardy–Weinberg and the histogram follows the curve; in the rare-allele sample the re-pairings take only a handful of values and the $\chi^2$ $p$-value is far too small next to the exact one. *Custom* lets you enter counts.`,
      deps: ['popgen-1.5', 'stat-6.14', 'stat-3.5'],
      refs: ['Nielsen–Slatkin'],
      credit: 'Pearson, 1900 (χ² test); Levene, 1949; Haldane, 1954 (exact test)',
      tags: ['Hardy–Weinberg', 'hypothesis testing'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Hardy%E2%80%93Weinberg_principle#Significance_tests_for_deviation' },
      viz(v) {
        const M = v.M, S = 4000;
        const DATA = {
          us: { c: [1787, 3039, 1303], note: 'MN blood groups, 6129 US individuals (a classic textbook sample)' },
          navajo: { c: [305, 52, 4], note: 'MN blood groups, 361 Navajo (a classic textbook sample)' },
          rare: { c: [45, 3, 2], note: 'a rare allele: 50 individuals, 7 copies of N' },
          deficit: { c: [80, 60, 60], note: 'a heterozygote deficit (e.g. an inbred or mixed sample)' },
        };
        const which = v.select('sample', [{ value: 'us', label: 'US, n = 6129' }, { value: 'navajo', label: 'Navajo, n = 361' }, { value: 'rare', label: 'rare allele' }, { value: 'deficit', label: 'deficit' }, { value: 'custom', label: 'custom' }], 'us', { onChange: () => { const c = which.value === 'custom'; for (const s of sl) s.el.hidden = !c; } });
        const sl = [v.slider('$n_{MM}$', 0, 400, 30, { int: true }), v.slider('$n_{MN}$', 0, 400, 60, { int: true }), v.slider('$n_{NN}$', 0, 400, 10, { int: true })];
        for (const s of sl) s.el.hidden = true;
        const sB = v.stage({ x: [-0.6, 2.6], y: [0, 1], axes: false, height: 330, title: 'observed (filled) and expected (dashed)' });
        const sX = v.stage({ x: [0, 10], y: [0, 1.2], axes: 'box', height: 330, weight: 1.2, xlabel: 'X²', title: '$X^2$ under random re-pairing of the sample’s alleles' });
        const counts = () => (which.value === 'custom' ? sl.map((s) => s.value) : DATA[which.value].c);
        const cache = memo();
        const analyse = () => {
          const c = counts();
          return cache(c.join(','), () => {
            const n = c[0] + c[1] + c[2], nA = 2 * c[0] + c[1], T = hwTest(M, c[0], c[1], c[2]);
            if (!n || nA === 0 || nA === 2 * n) return { n, T, dist: null };
            const dist = levene(M, n, nA), p = nA / (2 * n), q = 1 - p, E = [n * p * p, 2 * n * p * q, n * q * q];
            const x2 = (h) => { const o = [(nA - h) / 2, h, (2 * n - nA - h) / 2]; return o.reduce((s, x, i) => s + (x - E[i]) ** 2 / E[i], 0); };
            const pObs = dist.find((d) => d[0] === c[1])?.[1] ?? 0;
            const exact = Math.min(1, dist.reduce((s, d) => s + (d[1] <= pObs * (1 + 1e-7) ? d[1] : 0), 0));
            const cum = []; let acc = 0; for (const d of dist) { acc += d[1]; cum.push(acc); }
            const r = v.rng(31), sims = new Float64Array(S); let ge = 0;
            for (let k = 0; k < S; k++) {
              const u = r() * acc; let lo = 0, hi = cum.length - 1;
              while (lo < hi) { const m = (lo + hi) >> 1; if (cum[m] >= u) hi = m; else lo = m + 1; }
              sims[k] = x2(dist[lo][0]); if (sims[k] >= T.chi2 - 1e-9) ge++;
            }
            return { n, T, dist, exact, sims, mc: ge / S };
          });
        };
        v.render(() => {
          const c = counts(), A = analyse(), T = A.T, top = Math.max(1, ...c, ...T.E) * 1.22;
          sB.setView(null, [-top * 0.1, top]);
          sB.line(-0.5, 0, 2.5, 0, { color: 'faint', width: 1 });
          ['MM', 'MN', 'NN'].forEach((lab, g) => {
            sB.rect(g - 0.32, 0, g + 0.32, c[g], { fill: GCOL[g], fillAlpha: 0.65, color: GCOL[g], width: 1.2 });
            sB.rect(g - 0.38, 0, g + 0.38, T.E[g], { color: 'ink', width: 1.6, dash: [5, 3] });
            sB.text(`${c[g]}`, g, Math.max(c[g], T.E[g]), { align: 'center', baseline: 'bottom', dy: -16, size: 12.5, weight: 700, color: GCOL[g] });
            sB.text(`exp ${v.fix(T.E[g], 1)}`, g, Math.max(c[g], T.E[g]), { align: 'center', baseline: 'bottom', dy: -3, size: 10.5, color: 'muted' });
            sB.tex(lab, g, -top * 0.05, { size: 14, color: GCOL[g] });
          });
          if (!A.dist) { sX.corner('only one allele present — nothing to test', 'tl', { color: 'muted' }); return; }
          const xmax = Math.min(60, Math.max(10, T.chi2 * 1.15 + 1));
          sX.setView([0, xmax], [0, 1.2]);
          sX.hist(Array.from(A.sims).map((x) => Math.min(x, xmax * 0.999)), { bins: M.linspace(0, xmax, 41), density: true, color: 'accent', fillAlpha: 0.35 });
          sX.clip(() => sX.fn((x) => M.dist.chi2(1).pdf(x), { domain: [0.02, xmax], color: 'green', width: 2.2 }));
          sX.vline(T.chi2, { color: 'red', width: 2 });
          sX.text(`observed X² = ${v.fix(T.chi2, 2)}`, T.chi2, 1.12, { align: T.chi2 > xmax * 0.6 ? 'right' : 'left', dx: T.chi2 > xmax * 0.6 ? -6 : 6, size: 11.5, color: 'red', weight: 600 });
        });
        v.legend([['accent', 're-pairing distribution', { area: true }], ['green', '$\\chi^2_1$ density'], ['red', 'observed $X^2$']]);
        v.readout(() => {
          const c = counts(), A = analyse(), T = A.T, n = A.n;
          if (!A.dist) return `n = ${n}: only one allele present, so there is no test.`;
          const se = Math.sqrt((T.p * T.q) / (2 * n)), note = which.value === 'custom' ? '' : `${DATA[which.value].note} · `;
          return String.raw`${note}$\hat p_M = \frac{2\cdot${c[0]}+${c[1]}}{${2 * n}} = ${v.fix(T.p, 4)} \pm ${v.fix(se, 4)}$ · $X^2 = ${v.fix(T.chi2, 3)}$ → $p ${pText(v, T.pval)}$ from $\chi^2_1$ · exact test $p ${pText(v, A.exact)}$ · re-pairing simulation $p ${pText(v, A.mc)}$`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 1.8
    {
      num: '1.8',
      kind: 'Theorem',
      name: 'Hardy–Weinberg with multiple alleles',
      statement: String.raw`Let a locus have $k$ alleles $A_1,\dots,A_k$ with frequencies $p_1,\dots,p_k$ ($\sum p_i = 1$), and assume the conditions of the Hardy–Weinberg law. After one generation of random mating the genotype frequencies are
$$P(A_iA_i) = p_i^2, \qquad P(A_iA_j) = 2p_ip_j \quad (i<j),$$
the terms of the expansion of $(p_1+\dots+p_k)^2$, and they persist thereafter with the $p_i$ unchanged. There are $k(k+1)/2$ genotypes, and the total heterozygote frequency is $H = 1-\sum_i p_i^2$, largest ($1-1/k$) when all alleles are equally common.`,
      idea: String.raw`Random union of gametes (1.4) works allele by allele: two independent draws from a pool with frequencies $p_i$ give the ordered pair $(A_i, A_j)$ with probability $p_ip_j$, and the unordered genotype $A_iA_j$ ($i\ne j$) collects both orders. Summing over all pairs reproduces $(\sum p_i)^2 = 1$ — the multinomial expansion. Homozygotes are the diagonal of the $k\times k$ table, so $H = 1-\sum p_i^2$; and the new frequency of $A_i$ is $p_i^2 + \sum_{j\ne i} p_ip_j = p_i$, so the proportions are stable.`,
      caption: String.raw`The unit square is cut at the cumulative allele frequencies on both axes, giving the $k\times k$ table of products $p_ip_j$; drag the handles on the top edge to change the frequencies and the slider to change $k$. Each dot is one simulated individual placed inside the cell of its two gametes. The homozygote cells (diagonal, outlined) hold a share $\sum p_i^2$ of the dots; the table on the right compares observed counts with the expected $n p_i^2$ and $2np_ip_j$, and the readout compares the observed heterozygote share with $1-\sum p_i^2$.`,
      deps: ['popgen-1.5', 'comb-1.12'],
      refs: ['Ewens §2.4'],
      credit: 'Bernstein, 1924 (ABO blood groups as three alleles at one locus)',
      tags: ['Hardy–Weinberg', 'multiple alleles'],
      viz(v) {
        const M = v.M, COLS = ['blue', 'orange', 'teal', 'pink', 'gold', 'purple'], BASE = [0.38, 0.24, 0.16, 0.11, 0.07, 0.04];
        const kS = v.slider('alleles $k$', 2, 6, 4, { int: true, onChange: () => setK() });
        const nS = v.slider('individuals $n$', 50, 3000, 600, { int: true });
        let seed = 5;
        v.button('New sample', () => { seed += 1; });
        const sU = v.stage({ x: [-0.1, 1.04], y: [-0.06, 1.12], equal: true, axes: false, height: 370 });
        const sT = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 370, title: 'genotype counts: observed, expected' });
        const YH = 1.065, hs = [];
        for (let i = 0; i < 5; i++) {
          const h = sU.handle(0, YH, { color: 'ink', r: 6, constrain: (x) => { const lo = i ? hs[i - 1].x + 0.02 : 0.02, hi = i < kS.value - 2 ? hs[i + 1].x - 0.02 : 0.98; return [clamp(x, lo, hi), YH]; } });
          hs.push(h);
        }
        function setK() {
          const k = kS.value, w = BASE.slice(0, k), s = w.reduce((a, b) => a + b, 0); let acc = 0;
          hs.forEach((h, i) => { if (i < k - 1) { acc += w[i] / s; h.set(acc, YH); h.visible = true; } else h.visible = false; });
        }
        setK();
        const freqs = () => { const k = kS.value, c = [0, ...hs.slice(0, k - 1).map((h) => h.x), 1], p = []; for (let i = 0; i < k; i++) p.push(c[i + 1] - c[i]); return { p, c }; };
        const T = v.table(sT, { rows: 4, cols: 4, maxCell: 58, size: 12.5, pairColors: ['ink', 'muted'], pairSep: ' / ' });
        const cache = memo();
        const sim = () => {
          const { p, c } = freqs();
          return cache([c.map((x) => x.toFixed(4)).join(','), nS.value, seed].join('|'), () => {
            const r = v.rng(seed * 13 + 1), k = p.length, cnt = Array.from({ length: k }, () => new Array(k).fill(0)), pts = [];
            const pick = () => { const u = r(); let i = 0; while (i < k - 1 && u >= c[i + 1]) i++; return i; };
            for (let t = 0; t < nS.value; t++) {
              const a = pick(), b = pick();
              pts.push([c[a] + r() * p[a], c[b] + r() * p[b], a === b]);
              cnt[Math.min(a, b)][Math.max(a, b)]++;
            }
            return { cnt, pts };
          });
        };
        v.render(() => {
          const { p, c } = freqs(), k = p.length, S = sim(), n = nS.value;
          for (let i = 0; i < k; i++) for (let j = 0; j < k; j++) {
            const col = i === j ? COLS[i] : v.mix(COLS[i], COLS[j], 0.5);
            sU.rect(c[i], c[j], c[i + 1], c[j + 1], { fill: col, fillAlpha: i === j ? 0.3 : 0.12, color: 'panel', width: 1.5 });
          }
          sU.dots(S.pts.filter((d) => !d[2]).map((d) => [d[0], d[1]]), { r: 1.7, color: 'ink', alpha: 0.45 });
          sU.dots(S.pts.filter((d) => d[2]).map((d) => [d[0], d[1]]), { r: 1.9, color: 'ink', alpha: 0.85 });
          for (let i = 0; i < k; i++) sU.rect(c[i], c[i], c[i + 1], c[i + 1], { color: COLS[i], width: 2.2 });
          sU.rect(0, 0, 1, 1, { color: 'muted', width: 1.2 });
          for (let i = 0; i < k; i++) {
            if (p[i] * sU.scale > 16) sU.tex(`A_${i + 1}`, (c[i] + c[i + 1]) / 2, 1.025, { color: COLS[i], size: 12.5 });
            if (p[i] * sU.scale > 16) sU.tex(`A_${i + 1}`, -0.05, (c[i] + c[i + 1]) / 2, { color: COLS[i], size: 12.5 });
          }
          T.draw({
            rows: k, cols: k, size: k > 4 ? 10.5 : 12.5,
            rowLabels: (i) => `$A_${i + 1}$`, colLabels: (j) => `$A_${j + 1}$`,
            rowLabelColor: (i) => COLS[i], colLabelColor: (j) => COLS[j],
            value: (i, j) => (j < i ? null : [S.cnt[i][j], v.fix(n * (i === j ? p[i] * p[i] : 2 * p[i] * p[j]), n * p[i] * p[j] < 100 ? 1 : 0)]),
            fill: (i, j) => (j < i ? null : i === j ? [COLS[i], 0.22] : null),
          });
        });
        v.legend([['ink', 'homozygote (diagonal cell)', { dot: true }], ['muted', 'heterozygote', { dot: true }]]);
        v.readout(() => {
          const { p } = freqs(), k = p.length, S = sim(), n = nS.value, s2 = p.reduce((a, x) => a + x * x, 0);
          let hom = 0; for (let i = 0; i < k; i++) hom += S.cnt[i][i];
          const O = [], E = [];
          for (let i = 0; i < k; i++) for (let j = i; j < k; j++) { O.push(S.cnt[i][j]); E.push(i === j ? p[i] * p[i] : 2 * p[i] * p[j]); }
          const G = gof(M, O, E);
          return String.raw`$k = ${k}$ alleles, ${(k * (k + 1)) / 2} genotypes · $p = (${p.map((x) => v.fix(x, 3)).join(', ')})$ · predicted heterozygosity $1-\sum p_i^2 = ${v.fix(1 - s2, 3)}$ (maximum $1-1/k = ${v.fix(1 - 1 / k, 3)}$) · observed ${n - hom} of ${n} $= ${v.fix((n - hom) / n, 3)}$ · goodness of fit over all genotypes $\chi^2 = ${v.fix(G.chi2, 1)}$ on ${G.df} df, $p ${pText(v, G.pval)}$`;
        });
      },
    },
  ],
};
