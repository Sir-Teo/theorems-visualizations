// Understanding Machine Learning — Chapter 1: Introduction
//
// Two pictures of what learning is for: why a learner needs a prior (rats and pigeons), and the four axes along which learning
// problems differ (a toy threshold-learning spam filter whose error curve is simulated for each combination of switches).
import { clamp, rand, hashStr, memo, mean, commas, lineMass, lineDraw, GAP_W, BEHAVIOURS, pigeonRun, favouriteShare } from './ch01.shared.js';

const fx = (x) => (x <= 0 ? "0" : x < 1e-3 ? `${(x * 10 ** -Math.floor(Math.log10(x || 1))).toFixed(1)}\\times10^{${Math.floor(Math.log10(x || 1))}}` : x.toFixed(3));
const TH = 0.37; // the true spam threshold of the toy filter in item 1.1b

/** Estimates θ̂_1..θ̂_M and the examples a learner sees: cfg = {labels, active, teacher, gap}. */
function learnerRun(cfg, seed, M) {
  const r = rand(seed), est = [], xs = [], ys = [], asked = [];
  let lo = 0, hi = 1; // largest ham seen, smallest spam seen
  const pts = [];
  for (let i = 0; i < M; i++) {
    let x;
    if (cfg.labels === 'sup' && cfg.active) { x = (lo + hi) / 2; asked.push(true); }
    else {
      asked.push(false);
      if (cfg.labels === 'sup' && cfg.teacher === 'helpful') { const d = 0.3 * 0.5 ** Math.floor(i / 2); x = TH + (i % 2 ? d : -d); }
      else if (cfg.labels === 'sup' && cfg.teacher === 'adversarial') x = i % 2 ? 0.9 + 0.1 * r() : 0.1 * r();
      else x = lineDraw(r, TH, cfg.gap);
    }
    const y = x > TH ? 1 : 0;
    xs.push(x); ys.push(y); pts.push(x);
    if (cfg.labels === 'sup') { if (y) hi = Math.min(hi, x); else lo = Math.max(lo, x); est.push((lo + hi) / 2); }
    else {
      const s = pts.slice().sort((a, b) => a - b); let best = -1, at = 0.5;
      for (let j = 0; j + 1 < s.length; j++) if (s[j + 1] - s[j] > best) { best = s[j + 1] - s[j]; at = (s[j] + s[j + 1]) / 2; }
      est.push(s.length > 1 ? at : 0.5);
    }
  }
  return { est, xs, ys, asked };
}

export default {
  collection: 'ml',
  chapter: 1,
  title: 'Introduction',
  summary: String.raw`Learning is the conversion of experience into expertise. The chapter contrasts rats that learn to avoid poisoned bait with Skinner's superstitious pigeons to argue that useful learning needs built-in prior knowledge, describes when a hand-written program is not enough and a learned one is needed, and sorts learning tasks along four axes: supervised or not, active or passive, helpful or adversarial teacher, online or batch. The book's main concern is supervised, statistical, batch learning by a passive learner.`,
  items: [
    // ───────────────────────────────────────────────────────────── 1.1a
    {
      num: '1.1a',
      kind: 'Concept',
      name: 'Inductive bias: bait shyness versus pigeon superstition',
      statement: String.raw`A learner that is willing to credit **any** event it experienced with causing an outcome has nothing to prefer among the many coincidences in its past, so it either needs a great deal of data or locks onto a spurious rule. A learner that comes equipped with a **prior restriction** on what may cause what (an *inductive bias*) can learn from very little data, but only as long as the world respects the restriction: the same restriction makes it unable to learn when the cause lies outside what it allows.

The two classical illustrations are the rat that avoids a bait after a single bout of nausea, because it considers only what it ate as a possible cause of sickness, and Skinner's pigeons, fed at fixed intervals whatever they did, several of which developed a repeated ritual that they apparently believed brought the food.`,
      idea: String.raw`Learning from a sample is an inference from finitely many observed cases to the unseen ones, and a finite sample is consistent with many explanations. If every one of $F$ cues may be the cause, then after $n$ poisonings the cues that happened to be present every time are still all candidates: the true cause plus each other cue with probability $2^{-n}$, so the number of impostors is binomial with $F-1$ trials and success probability $p=2^{-n}$, and a learner choosing uniformly among the candidates is right with probability $\mathbb E\big[\tfrac1{1+K}\big]=\dfrac{1-(1-p)^F}{Fp}$ (about $1/(1+(F-1)p)$ when $F$ is small). Restricting the candidates to the taste of the bait removes the competition at once. The price is exactly the price paid in the No-Free-Lunch theorem (ml-5.1): a restriction that does not match the world gives a learner that never succeeds. The pigeon is the other face of the coin: with no prior against "my wing flap brings food", credit given to whatever it was doing when food arrived feeds back into what it does next, and a ritual is born.

For $F\ge1$ and $p>0$, write $1/(k+1)=\int_0^1t^k\,dt$. The binomial theorem (comb 1.7) turns the finite weighted sum for the success probability into $\int_0^1(1-p+pt)^{F-1}\,dt$. The fundamental theorem (pma 6.21) evaluates this polynomial integral as $[1-(1-p)^F]/(Fp)$. This derives the stated toy-model average rather than replacing the random number of competitors by its mean.

The rat calculation assumes an idealized sampling model: the true cause is present at every poisoned meal, while each irrelevant cue is independently present with probability $1/2$ at each meal, independently across cues as well. A particular irrelevant cue survives $n$ meals exactly when the product of its $n$ presence indicators is $1$; the independent-product expectation rule (PROB 2.1.13) makes its survival probability $2^{-n}$. Survival indicators for different cues are measurable functions of disjoint independent cue columns, so the independent-block argument (PROB 2.1.10) makes them independent. Their sum is therefore binomial, supplying the premise of the finite expectation calculation above. The code illustrates this ideal model with separate seeded draws per cue and meal; neither genuine independence of a deterministic generator nor a model fitted to animal cognition is claimed.`,
      caption: String.raw`**Left:** eight simulated pigeons, fed every 15 s whatever they do; each line is the share of the last minute spent on the bird's favourite behaviour (dashed: $1/6$ if nothing is learned). The ribbon shows the last 90 s of the bold bird (gold ticks are feedings). Switch the learner to the *prior* one and no ritual forms. **Right:** the rat. Dots are 600 simulated rats, the thin curve is the exact $\frac{1-(1-p)^F}{Fp}$ with $p=2^{-n}$. Add cues, then switch the world so that sickness is caused by the sound-and-light cue instead of the taste: the rat with the taste prior never learns, the unrestricted one still does.`,
      deps: ['comb-1.7', 'pma-6.21', 'prob-2.1.13', 'prob-2.1.10'],
      see: ['phil-8.1', 'ml-5.1'],
      refs: ['UML §1.1'],
      tags: ['inductive bias', 'prior knowledge'],
      credit: 'Garcia & Koelling, 1966 (bait shyness); Skinner, 1948 (superstition in the pigeon)',
      scope: String.raw`Illustrative simulation. The pigeon rule (credit to the behaviour in progress at feeding; choice proportional to credit squared) and the rat's hypothesis search are toy models chosen to show the effect, not fits to the animal data.`,
      verify: true,
      viz(v) {
        const K = BEHAVIOURS.length, NB = 8, COL = ['accent', 'orange', 'green', 'red', 'purple', 'teal'];
        const priorS = v.select('learner', [{ value: 'none', label: 'no prior: any event may be the cause' }, { value: 'prior', label: 'built-in prior' }], 'none');
        const minS = v.slider('exposure (minutes)', 1, 30, 20, { int: true });
        const FS = v.slider('cues the rat attends to, $F$', 2, 12, 6, { int: true });
        const worldS = v.select('rat\'s world: sickness follows', [{ value: 'taste', label: 'the taste' }, { value: 'light', label: 'the sound and light' }], 'taste');
        const seedS = v.slider('birds: seed', 1, 20, 3, { int: true });
        const sP = v.stage({ x: [0, 30], y: [0, 1], axes: 'box', gutter: true, height: 270, weight: 1.1, xlabel: 'minutes', ylabel: 'share of favourite behaviour', title: 'eight pigeons, food every 15 s' });
        const sR = v.stage({ x: [0.5, 8.5], y: [0, 1.14], axes: 'box', gutter: true, height: 270, weight: 0.9, xlabel: 'poisoned meals $n$', ylabel: 'P(learns the true cause)', title: 'the rat', xticks: [1, 2, 3, 4, 5, 6, 7, 8] });
        const sB = v.stage({ x: [0, 90], y: [0, 1], axes: false, height: 78, full: true, title: 'bold pigeon, last 90 s: what it was doing (colour) and the feedings (gold)' });
        const runs = memo(), rats = memo();
        const getRuns = () => runs([priorS.value, seedS.value], () => Array.from({ length: NB }, (_, b) => pigeonRun(hashStr('pg' + seedS.value + '|' + b), 1800, 15, priorS.value === 'none')));
        const getRats = (F, world, prior) => rats([F, world, prior], () => {
          const out = [], r = rand(hashStr('rat' + F + world));
          for (let n = 1; n <= 8; n++) {
            let ok = 0; const R = 600;
            for (let t = 0; t < R; t++) {
              // cue 0 = the taste, cue 1 = sound and light, the others are noise cues present with probability 1/2 at each meal
              const cause = world === 'taste' ? 0 : 1, alive = new Array(F).fill(true);
              for (let i = 0; i < n; i++) for (let c = 0; c < F; c++) { const present = c === cause ? true : r() < 0.5; if (!present) alive[c] = false; }
              const cand = []; for (let c = 0; c < F; c++) if (alive[c] && (prior === 'none' || c === 0)) cand.push(c);
              if (cand.length && cand[Math.floor(r() * cand.length)] === cause) ok++;
            }
            out.push(ok / R);
          }
          return out;
        });
        let info = null;
        v.render(() => {
          const T = minS.value * 60, R = getRuns(), prior = priorS.value, F = FS.value, world = worldS.value;
          sP.setView([0, minS.value], [0, 1]);
          sP.hline(1 / K, { color: 'muted', dash: true, width: 1.2 });
          sP.text('uniform: 1/6', minS.value, 1 / K, { color: 'muted', size: 11, align: 'right', dy: 11 });
          let best = 0, bestShare = 0;
          R.forEach((run, b) => {
            const pts = []; for (let t = 60; t <= T; t += 10) pts.push([t / 60, favouriteShare(run, t, 60).share]);
            sP.path(pts, { color: b === 0 ? 'gold' : 'accent', width: b === 0 ? 3 : 1.3, alpha: b === 0 ? 1 : 0.55 });
            const fin = favouriteShare(run, T, 120); if (fin.share > bestShare) { bestShare = fin.share; best = b; }
          });
          const fins = R.map((run) => favouriteShare(run, T, 120));
          const lock = fins.filter((f) => f.share > 0.5).length;
          // ribbon of bird 0
          const run0 = R[0], t0 = Math.max(0, T - 90);
          for (let i = 0; i < 90; i++) { const a = run0.act[t0 + i]; sB.rect(i, 0.1, i + 1, 0.62, { fill: COL[a], fillAlpha: 0.85, stroke: false }); if (run0.food[t0 + i]) { sB.line(i + 0.5, 0.62, i + 0.5, 0.95, { color: 'gold', width: 2.4 }); sB.dot(i + 0.5, 0.95, { r: 3.5, color: 'gold' }); } }
          // rat
          const sim = getRats(F, world, prior), simOther = getRats(F, world, prior === 'none' ? 'prior' : 'none');
          const ex = (n) => { const p = 2 ** -n; return (1 - (1 - p) ** F) / (F * p); }, exact = []; for (let n = 1; n <= 8; n++) exact.push([n, ex(n)]);
          sR.path(simOther.map((y, i) => [i + 1, y]), { color: 'faint', width: 2, dash: true });
          if (prior === 'none') sR.path(exact, { color: 'ink', width: 1.2 });
          sR.path(sim.map((y, i) => [i + 1, y]), { color: prior === 'none' ? 'accent' : 'green', width: 2.6 });
          sR.dots(sim.map((y, i) => [i + 1, y]), { r: 4.5, color: prior === 'none' ? 'accent' : 'green' });
          sR.text(prior === 'none' ? 'dashed: taste prior' : 'dashed: no prior', 0.7, 1.07, { color: 'muted', size: 11, align: 'left' });
          info = { lock, fins, n1: sim[0], n3: sim[2], prior, world, F, best };
        });
        v.legend([['gold', 'bold pigeon'], ['accent', 'other pigeons / learner without prior'], ['green', 'learner with the taste prior'], ['faint', 'the other learner', { dash: true }]]);
        v.readout(() => {
          if (!info) return '';
          const { lock, n1, n3, prior, world, F } = info, exa = (n) => { const p = 2 ** -n; return (1 - (1 - p) ** F) / (F * p); };
          return String.raw`**Pigeons:** ${lock} of ${NB} spend more than half of their time on one behaviour in the last 2 minutes ${prior === 'none' ? '(a "superstition": the food never depended on it)' : '(no credit is ever assigned, so nothing is learned)'}.` + '\n' +
            String.raw`**Rat** (${F} cues, sickness follows ${world === 'taste' ? 'the taste' : 'the sound and light'}): P(correct cause) after one poisoned meal $=${n1.toFixed(2)}$, after three $=${n3.toFixed(2)}$ ` + (prior === 'prior' && world === 'light' ? String.raw`— **the prior excludes the true cause, so it never learns**.` : prior === 'prior' ? String.raw`— one meal is enough.` : String.raw`(exact formula: $${exa(1).toFixed(2)}$ and $${exa(3).toFixed(2)}$).`);
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 1.1b
    {
      num: '1.1b',
      kind: 'Concept',
      name: 'Types of learning: supervised, active, online, adversarial',
      statement: String.raw`Learning tasks differ along four independent axes.

- **Supervised or unsupervised:** the learner sees labelled examples $(x,y)$ and must predict labels, or sees only the instances $x$ and must find structure.
- **Passive or active:** the learner receives whatever examples come, or chooses which instance to ask the label of.
- **Helpful, indifferent or adversarial teacher:** examples are chosen to teach, drawn at random, or chosen to mislead.
- **Online or batch:** the learner must predict each instance as it arrives, and is charged for every mistake, or it first trains on a sample and is judged afterwards on fresh data.

This book studies the corner of supervised, passive learning from examples drawn at random (neither helpful nor adversarial), in the batch protocol.`,
      idea: String.raw`The axes change how fast the learner's error falls. In the toy filter the unknown is one threshold $\theta$ on a spam score. A passive learner with random examples locates $\theta$ to within about $1/m$ after $m$ labels. An active learner can bisect the interval that is still undecided and halves the uncertainty with every query, so its error falls like $2^{-m}$. A helpful teacher does the same by showing examples that straddle the boundary more and more tightly; an adversarial one can keep the learner at distance $0.13$ forever by showing only extreme messages. Without labels, only structure in the instances (here a clean gap between the two clusters) can reveal the boundary. In the online protocol the same estimates are charged as they are made, so the quantity to look at is the total of the errors.`,
      caption: String.raw`Flip the four switches. **Top:** the flow of messages (and of labels, queries and predictions) between the teacher, the learner and the rule it is building. **Middle:** one seeded run on the score line, with the true boundary (green) and the learner's estimate (gold); drag $m$ to watch it settle. **Bottom:** the average over 200 runs, always against the book's setting (dashed). Adversarial is only visible when learning passively with labels, and the unsupervised learner only works when you turn on the gap between the clusters.`,
      deps: [],
      refs: ['UML §1.3'],
      tags: ['supervised learning', 'online learning', 'active learning'],
      scope: String.raw`Illustrative simulation on one threshold $\theta=0.37$: the learners (midpoint of the tightest labelled bracket, bisection queries, largest gap for clustering) are the simplest sensible ones, not a survey of the field.`,
      verify: true,
      viz(v) {
        const labS = v.select('labels', [{ value: 'sup', label: 'supervised' }, { value: 'unsup', label: 'unsupervised' }], 'sup');
        const actS = v.select('examples', [{ value: 'passive', label: 'passive' }, { value: 'active', label: 'active (learner asks)' }], 'passive');
        const teaS = v.select('teacher', [{ value: 'helpful', label: 'helpful' }, { value: 'random', label: 'random' }, { value: 'adversarial', label: 'adversarial' }], 'random');
        const proS = v.select('protocol', [{ value: 'batch', label: 'batch' }, { value: 'online', label: 'online' }], 'batch');
        const gapT = v.toggle('clean gap between the two kinds of mail', false);
        const mS = v.slider('examples seen, $m$', 1, 30, 8, { int: true });
        const sF = v.stage({ x: [0, 10], y: [0, 4], axes: false, height: 190, full: true, title: 'what flows between teacher, learner and rule' });
        const sL = v.stage({ x: [0, 1], y: [-1, 1], axes: 'box', gutter: true, height: 150, weight: 1, xlabel: 'spam score $x$', yticks: [], title: 'one run on the score line (blue ham, orange spam; rings were queried)' });
        const sE = v.stage({ x: [1, 30], y: [1e-4, 1], ylog: true, axes: 'box', gutter: true, height: 150, weight: 1, xlabel: 'examples $m$', ylabel: 'expected error', title: 'error of the learner (average of 200 runs)' });
        const curves = memo();
        const cfg = () => ({ labels: labS.value, active: actS.value === 'active', teacher: teaS.value, gap: gapT.value });
        const avgErr = (c) => {
          const R = 200, M = 30, acc = new Float64Array(M);
          for (let k = 0; k < R; k++) { const run = learnerRun(c, hashStr('ml11b' + k), M); for (let i = 0; i < M; i++) acc[i] += lineMass(run.est[i], TH, TH, c.gap); }
          return Array.from(acc, (a) => a / R);
        };
        const BOOK = { labels: 'sup', active: false, teacher: 'random' };
        let info = null;
        v.animate((t) => {
          const c = cfg(), m = mS.value, prot = proS.value;
          const gk = c.gap ? 'g' : 'n';
          const mine = curves(['me', c.labels, c.active, c.teacher, c.gap].join(), () => avgErr(c));
          const book = curves(['book', gk].join(), () => avgErr({ ...BOOK, gap: c.gap }));
          const eff = c.labels === 'unsup' ? 'random' : c.active ? '—' : c.teacher;
          // ---- the flow diagram
          const box = (x0, y0, x1, y1, title, sub, col) => { sF.rect(x0, y0, x1, y1, { fill: col, fillAlpha: 0.1, color: col, width: 1.6, radius: 8 }); sF.text(title, (x0 + x1) / 2, y1 - 0.45, { align: 'center', size: 13, weight: 700, color: col }); if (sub) sF.text(sub, (x0 + x1) / 2, y0 + 0.55, { align: 'center', size: 11.5, color: 'muted' }); };
          const teacher = c.labels === 'unsup' ? 'inbox (no labels)' : c.active ? 'oracle (answers queries)' : c.teacher === 'helpful' ? 'helpful teacher' : c.teacher === 'adversarial' ? 'adversarial teacher' : 'random inbox';
          box(0.2, 1.1, 2.9, 3.0, 'world', teacher, c.teacher === 'adversarial' && !c.active && c.labels === 'sup' ? 'red' : 'accent');
          box(4.1, 1.1, 6.2, 3.0, 'learner', c.labels === 'unsup' ? 'clusters the scores' : 'fits a threshold', 'orange');
          box(7.3, 1.1, 9.8, 3.0, 'rule', prot === 'online' ? 'predicts every message' : 'frozen after training', 'green');
          const tok = (x0, x1, y, col, off, label) => { for (let j = 0; j < 3; j++) { const f = ((t * 0.55 + j / 3 + off) % 1 + 1) % 1; sF.rect(x0 + (x1 - x0) * f - 0.12, y - 0.12, x0 + (x1 - x0) * f + 0.12, y + 0.12, { fill: col, fillAlpha: 0.95, stroke: false, radius: 3 }); } sF.arrow(x0, y, x1, y, { color: 'muted', width: 1.2 }); if (label) sF.text(label, (x0 + x1) / 2, y, { align: 'center', size: 11, color: 'muted', dy: -10 }); };
          if (c.active && c.labels === 'sup') { tok(4.1, 2.9, 2.5, 'gold', 0, 'query x'); tok(2.9, 4.1, 1.7, 'orange', 0.5, 'label y'); } else tok(2.9, 4.1, 2.2, c.labels === 'sup' ? (Math.floor(t * 0.55 * 1.5) % 2 ? 'orange' : 'accent') : 'faint', 0, c.labels === 'sup' ? 'x and label y' : 'x only');
          tok(6.2, 7.3, 2.0, 'green', 0, 'rule θ̂');
          if (prot === 'online') { sF.arrow(8.55, 1.1, 8.55, 0.4, { color: 'red', width: 1.6 }); sF.text('predict, then see the label: every mistake counts', 8.9, 0.22, { align: 'right', size: 11, color: 'red' }); }
          else sF.text('train on m examples, then judged on fresh mail', 9.8, 0.22, { align: 'right', size: 11, color: 'muted' });
          const book4 = c.labels === 'sup' && !c.active && c.teacher === 'random' && prot === 'batch';
          sF.text(book4 ? 'this is the setting studied in the book' : 'the book studies: supervised · passive · random · batch', 0.2, 0.22, { size: 11.5, color: book4 ? 'green' : 'muted', weight: book4 ? 700 : 400 });
          // ---- one run
          const run = learnerRun(c, hashStr('run11b' + (c.gap ? 1 : 0)), 30), est = run.est[m - 1];
          sL.setView([0, 1], [-1, 1]);
          if (c.gap) sL.vband(TH - GAP_W, TH + GAP_W, { color: 'faint', alpha: 0.15 });
          sL.vband(Math.min(est, TH), Math.max(est, TH), { color: 'red', alpha: 0.18 });
          sL.line(0, 0, 1, 0, { color: 'muted', width: 1.2 });
          sL.vline(TH, { color: 'green', width: 2.4 }); sL.vline(est, { color: 'gold', width: 2.4 });
          sL.text('true θ', TH, 0.82, { color: 'green', size: 12, align: TH < est ? 'right' : 'left', dx: TH < est ? -4 : 4 });
          sL.text('estimate θ̂', est, -0.85, { color: 'gold', size: 12, align: TH < est ? 'left' : 'right', dx: TH < est ? 4 : -4 });
          for (let i = 0; i < m; i++) {
            const x = run.xs[i], y = run.ys[i], col = c.labels === 'unsup' ? 'muted' : y ? 'orange' : 'accent', yy = 0.22 + 0.5 * ((i * 7919) % 5) / 5 * (y ? 1 : -1) * (c.labels === 'unsup' ? 0 : 1) + (c.labels === 'unsup' ? 0.18 * (((i * 7919) % 5) / 5 - 0.5) : 0);
            sL.dot(x, yy, { r: 5, color: col, hollow: run.asked[i], alpha: 0.9 });
          }
          // ---- error curve
          const ser = (arr) => arr.map((e, i) => [i + 1, Math.max(e, 1e-4)]);
          const cum = (arr) => { let s = 0; return arr.map((e, i) => { s += i === 0 ? 0.5 : arr[i - 1]; return s; }); };
          if (prot === 'online') {
            sE.setScale({ ylog: false, y: [0, 12] }); sE.setLabels('examples $m$', 'expected mistakes so far');
            sE.path(cum(book).map((e, i) => [i + 1, e]), { color: 'faint', dash: true, width: 2 });
            sE.path(cum(mine).map((e, i) => [i + 1, e]), { color: 'accent', width: 2.8 });
            sE.vline(m, { color: 'gold', width: 1.4 });
          } else {
            sE.setScale({ ylog: true, y: [1e-4, 1] }); sE.setLabels('examples $m$', 'expected error');
            sE.path(ser(book), { color: 'faint', dash: true, width: 2 });
            sE.path(ser(mine), { color: 'accent', width: 2.8 });
            sE.vline(m, { color: 'gold', width: 1.4 });
          }
          info = { err: lineMass(est, TH, TH, c.gap), avg: mine[m - 1], bookAvg: book[m - 1], eff, c, m, prot, cumMe: cum(mine)[m - 1], cumBook: cum(book)[m - 1] };
        }, { period: 4, still: 1.3 });
        v.legend([['accent', 'the learner chosen'], ['faint', 'the book\'s setting', { dash: true }], ['gold', 'estimate · $m$'], ['green', 'true boundary']]);
        v.readout(() => {
          if (!info) return '';
          const { err, avg, bookAvg, c, m, prot, cumMe, cumBook } = info;
          const note = c.labels === 'unsup' ? (c.gap ? 'the gap gives the clustering away' : 'with no cluster structure the clustering learns nothing about the spam rule') : c.active ? 'the learner chooses the points, so the teacher is irrelevant' : c.teacher === 'adversarial' ? 'only extreme messages are shown' : c.teacher === 'helpful' ? 'the teacher straddles the boundary' : 'random examples';
          return String.raw`After $m=${m}$ examples this run has error $${err.toFixed(3)}$; averaged over 200 runs: $${fx(avg)}$ (book's setting $${fx(bookAvg)}$)` + (prot === 'online' ? String.raw` · expected mistakes so far $${cumMe.toFixed(2)}$ (book's setting $${cumBook.toFixed(2)}$)` : '') + ` · ${note}.`;
        });
      },
    },
  ],
};
