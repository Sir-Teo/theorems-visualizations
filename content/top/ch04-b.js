// Topology — Chapter 4: Compactness, part b (items 4.7–4.12)
import { randIntervals, greedyCover, drawBars, CYC, discFunctions, discSampleExtrema, waveMaximum, lebesgueDiscs, ambientClearance, compactCoverMinimum, punctureCoverConstant } from './ch04.shared.js';

const clamp = (x, a, b) => Math.min(b, Math.max(a, x));

export default {
  collection: 'top',
  chapter: 4,
  items: [
    // ------------------------------------------------------------------ 4.7
    {
      num: '4.7',
      kind: 'Theorem',
      name: 'Finite products of compact spaces are compact',
      statement: String.raw`If $X$ and $Y$ are compact, then $X\times Y$ is compact; by induction any finite product of compact spaces is compact.`,
      idea: String.raw`Cover $X\times Y$ by open sets, which we may take to be basic boxes. For each $x\in X$, the slice $\{x\}\times Y$ is homeomorphic to $Y$, hence compact, so finitely many boxes cover it; by the tube lemma (4.6) they also cover a tube $W_x\times Y$. The tubes $W_x$ cover $X$, so finitely many of them do, and the boxes belonging to those finitely many tubes form a finite subcover of the product. Compactness is used twice, once on each factor.`,
      caption: String.raw`The unit square is covered by open rectangles (faint). Step through the proof from left to right: at a slice $x=x_i$ (gold) finitely many rectangles cover the vertical segment; the intersection of their $x$-extents is the tube $W_i\times[0,1]$ (coloured), and the next slice is placed at its right edge. When the tubes reach $1$ the rectangles used form a finite subcover. “Resample” redraws the cover; the grid size changes how many rectangles overlap.`,
      deps: ['top-4.6'],
      refs: ['Munkres §26'],
      tags: ['compactness', 'products'],
      viz(v) {
        const g = v.slider('grid of rectangles', 3, 8, 5, { int: true, onChange: () => S.reset({ at: 'start' }) });
        let seed = 2;
        v.button('Resample', () => { seed++; S.reset({ at: 'start' }); });
        const s = v.stage({ x: [-0.08, 1.08], y: [-0.08, 1.08], equal: true, axes: false, height: 420 });
        let rects = [];
        const build = () => {
          const n = g.value, R = v.rng(seed), sp = 1 / (n - 1);
          rects = [];
          for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
            const cx = i * sp + (R() - 0.5) * 0.1 * sp, cy = j * sp + (R() - 0.5) * 0.1 * sp, hx = sp * (0.7 + 0.5 * R()), hy = sp * (0.7 + 0.5 * R());
            rects.push([cx - hx, cx + hx, cy - hy, cy + hy]);
          }
          const tubes = []; let x = 0, guard = 0;
          while (x <= 1 && guard++ < 40) {
            const cand = rects.map((_, i) => i).filter((i) => rects[i][0] < x && x < rects[i][1]);
            const gc = greedyCover(cand.map((i) => [rects[i][2], rects[i][3]]), 0, 1);
            if (!gc.ok) break;
            const ch = gc.chosen.map((k) => cand[k]);
            const wl = Math.max(...ch.map((i) => rects[i][0])), wr = Math.min(...ch.map((i) => rects[i][1]));
            tubes.push({ x, ch, wl, wr }); x = wr;
          }
          const fr = [];
          tubes.forEach((t, k) => {
            fr.push({ tubes: tubes.slice(0, k), cur: t, stage: 'slice', note: String.raw`Slice at $x=${t.x.toFixed(2)}$: the segment $\{x\}\times[0,1]$ is compact, so **${t.ch.length}** rectangles cover it.` });
            fr.push({ tubes: tubes.slice(0, k + 1), cur: t, stage: 'tube', note: String.raw`All of them contain $x$; the intersection of their $x$-extents, $W=(${t.wl.toFixed(2)},${t.wr.toFixed(2)})$, is open, and $W\times[0,1]$ is covered by the same rectangles (tube lemma).` });
          });
          const all = new Set(tubes.flatMap((t) => t.ch));
          fr.push({ tubes, cur: null, stage: 'done', all, note: String.raw`The tubes $W_1,\dots,W_${tubes.length}$ cover $[0,1]$, so the **${all.size}** rectangles used form a finite subcover of the square.` });
          return fr;
        };
        const S = v.steps({ frames: () => build(), speed: 0.7, still: 'end' });
        v.render(() => {
          const f = S.frame; if (!f.tubes) return;
          const cl = (r) => [Math.max(r[0], -0.05), Math.max(r[2], -0.05), Math.min(r[1], 1.05), Math.min(r[3], 1.05)];
          const rc = (r, st) => { const c = cl(r); s.rect(c[0], c[1], c[2], c[3], st); };
          rects.forEach((r) => rc(r, { color: 'faint', width: 0.8, alpha: 0.6, fill: 'blue', fillAlpha: 0.04 }));
          f.tubes.forEach((t, k) => {
            const c = CYC[k % CYC.length];
            s.rect(Math.max(t.wl, -0.05), 0, Math.min(t.wr, 1.05), 1, { fill: c, fillAlpha: f.stage === 'done' ? 0.05 : 0.13, color: c, width: 1.6, dash: [5, 4] });
            t.ch.forEach((i) => rc(rects[i], { color: c, width: 1.6, fill: c, fillAlpha: f.stage === 'done' ? 0.04 : 0.1 }));
          });
          if (f.cur && f.stage === 'slice') {
            s.line(f.cur.x, 0, f.cur.x, 1, { color: 'gold', width: 3 });
            f.cur.ch.forEach((i) => rc(rects[i], { color: 'gold', width: 2.2, fill: 'gold', fillAlpha: 0.15 }));
          }
          s.rect(0, 0, 1, 1, { color: 'ink', width: 1.5 });
        });
        v.readout(() => { const f = S.frame; return f.tubes ? `Tubes so far: **${f.tubes.length}**${f.all ? ` · rectangles in the finite subcover: **${f.all.size}** of ${rects.length}` : ''}.` : ''; });
      },
    },
    // ------------------------------------------------------------------ 4.8
    {
      num: '4.8',
      kind: 'Theorem',
      name: 'Projection along a compact factor is closed',
      statement: String.raw`If $Y$ is compact, then the projection $\pi_1\colon X\times Y\to X$ is a closed map: it sends closed sets to closed sets. (For non-compact $Y$ this fails.)`,
      idea: String.raw`Let $Z\subset X\times Y$ be closed and let $x_0\notin\pi_1(Z)$. Then the slice $\{x_0\}\times Y$ lies in the open set $N=(X\times Y)\setminus Z$, and by the tube lemma (4.6) some tube $W\times Y\subset N$. Then $W$ is a neighbourhood of $x_0$ disjoint from $\pi_1(Z)$, so the complement of $\pi_1(Z)$ is open. For $Y=\R$ and $Z=\{xy=1\}$ the slice over $0$ lies in the complement of $Z$, but no tube does, and indeed $\pi_1(Z)=\R\setminus\{0\}$.`,
      caption: String.raw`The closed set $Z=\{xy=a\}\cap(\R\times Y)$ is drawn on the left; its shadow on the $x$-axis is the green bar below. Drag the gold point along $Z$ and watch its shadow. With $Y=[-L,L]$ the shadow is the closed set $|x|\ge a/L$ — the shadow stays away from $0$. With $Y=\R$ the shadow slides arbitrarily close to $0$ without reaching it: it is $\R\setminus\{0\}$, not closed.`,
      deps: ['top-4.6'],
      refs: ['Munkres §26'],
      tags: ['compactness', 'closed maps'],
      viz(v) {
        const sp = v.select('the factor $Y$', [{ value: 'c', label: 'compact $[-L,L]$' }, { value: 'r', label: '$\\R$' }], 'c');
        const L = v.slider('$L$', 1, 5, 2, { step: 0.1 });
        const a = v.slider('$a$ in $xy=a$', 0.2, 2, 1.2, { step: 0.05 });
        const s = v.stage({ x: [-4, 4], y: [-5, 5], axes: true, height: 330, title: 'the closed set $Z\\subset X\\times Y$', xlabel: '$x$', ylabel: '$y$', full: true });
        const P = v.stage({ x: [-4, 4], y: [-1, 1], axes: false, height: 120, title: 'its image $\\pi_1(Z)$ in $X$', full: true });
        const hz = s.handle(1.2 / 1.5, 1.5, { color: 'gold', r: 7, constrain: (x, y) => { let yy = y; if (Math.abs(yy) < 0.2) yy = yy < 0 ? -0.2 : 0.2; return [a.value / yy, yy]; } });
        let info = null;
        v.render(() => {
          const compact = sp.value === 'c', A = a.value, LL = compact ? L.value : 5;
          L.el.hidden = !compact;
          if (compact) { s.rect(-4, LL, 4, 5, { fill: 'muted', fillAlpha: 0.08, stroke: false }); s.rect(-4, -5, 4, -LL, { fill: 'muted', fillAlpha: 0.08, stroke: false }); s.hline(LL, { color: 'muted', width: 1, dash: true }); s.hline(-LL, { color: 'muted', width: 1, dash: true }); }
          const lo = Math.max(A / 4, 0.001), hi = LL;
          if (hi > lo) { s.curve((t) => [A / t, t], lo, hi, { color: 'blue', width: 3, n: 160 }); s.curve((t) => [A / t, t], -hi, -lo, { color: 'blue', width: 3, n: 160 }); }
          const yc = clamp(hz.y, -LL, LL); const ys = Math.abs(yc) < 0.2 ? 0.2 : yc; hz.set(A / ys, ys);
          s.line(hz.x, hz.y, hz.x, -5, { color: 'gold', width: 1.3, dash: true });
          s.vline(0, { color: 'faint', width: 1.2, dash: [3, 3] });
          const g = A / LL;
          P.line(-4, 0, -g, 0, { color: 'green', width: 7, cap: 'butt' }); P.line(g, 0, 4, 0, { color: 'green', width: 7, cap: 'butt' });
          P.dot(-g, 0, { r: 5, color: 'green', hollow: !compact }); P.dot(g, 0, { r: 5, color: 'green', hollow: !compact });
          P.dot(0, 0, { r: 6, hollow: true, color: 'red' });
          P.text('0', 0, -0.55, { align: 'center', size: 12, color: 'red' });
          P.dot(clamp(hz.x, -4, 4), 0, { r: 6, color: 'gold' });
          info = { compact, g, A, LL };
        });
        v.legend([['blue', 'closed set $Z$'], ['green', 'projection $\\pi_1(Z)$'], ['gold', 'a point of $Z$ and its shadow', { dot: true }]]);
        v.readout(() => {
          if (!info) return '';
          if (info.compact) return `$Y=[-${v.fix(info.LL, 1)},${v.fix(info.LL, 1)}]$: $\\pi_1(Z)=\\{|x|\\ge ${v.fix(info.g, 3)}\\}$ is **closed** (its two end points belong to it). $0$ has a neighbourhood $(-${v.fix(info.g, 2)},${v.fix(info.g, 2)})$ missing the shadow: that is the tube.`;
          return `$Y=\\R$: $\\pi_1(Z)=\\R\\setminus\\{0\\}$. The points of $Z$ with large $|y|$ have shadows $a/y\\to0$ but $0$ is never reached: the shadow of a closed set is **not closed**, so $\\pi_1$ is not a closed map when $Y$ is not compact.`;
        });
      },
    },
    // ------------------------------------------------------------------ 4.9
    {
      num: '4.9',
      kind: 'Theorem',
      name: 'Compactness via the finite intersection property',
      statement: String.raw`A space $X$ is compact if and only if every family of closed subsets with the **finite intersection property** (every finite subfamily has nonempty intersection) has nonempty intersection. In particular a nested sequence $C_1\supset C_2\supset\cdots$ of nonempty closed subsets of a compact space has $\bigcap_nC_n\ne\varnothing$.`,
      idea: String.raw`Take complements: a family of closed sets $C_\alpha$ has empty intersection exactly when the open sets $X\setminus C_\alpha$ cover $X$, and a finite subfamily of the $C_\alpha$ has empty intersection exactly when the corresponding open sets have a finite subcover. So “every open cover has a finite subcover” is word for word the contrapositive of “finite intersection property implies nonempty intersection”.`,
      caption: String.raw`Three nested families. Increase $k$ to include more sets: the intersection of the first $k$ sets (green) is never empty, as the finite intersection property says. Whether the **whole** intersection is empty depends on compactness and closedness: in $[0,1]$ with closed sets $[0,1/n]$ it is $\{0\}$; the closed sets $[n,\infty)$ of $\R$ and the non-closed sets $(0,1/n]$ both have empty intersection.`,
      deps: ['top-4.1'],
      see: ['pma-2.36'],
      refs: ['Munkres §26'],
      tags: ['compactness', 'closed sets'],
      viz(v) {
        const fam = v.select('family', [{ value: 'A', label: '$[0,1/n]\\subset[0,1]$' }, { value: 'B', label: '$[n,\\infty)\\subset\\R$' }, { value: 'C', label: '$(0,1/n]\\subset[0,1]$' }], 'A');
        const k = v.slider('sets included, $k$', 1, 16, 5, { int: true });
        const s = v.stage({ x: [-0.12, 1.08], y: [-1, 17.5], axes: false, height: 420 });
        let info = null;
        v.render(() => {
          const f = fam.value, K = k.value;
          const B = f === 'B';
          s.setView(B ? [-1.6, 19] : [-0.12, 1.08], [15.6 - K - 2.4, 17.3]);
          const top = 16.5;
          for (let n = 1; n <= K; n++) {
            const y = top - n + 1, col = CYC[(n - 1) % CYC.length];
            if (f === 'A') s.interval(0, 1 / n, y, { color: col, width: 6, r: 4 });
            else if (f === 'C') s.interval(0, 1 / n, y, { color: col, width: 6, r: 4, open: [true, false] });
            else { s.line(n, y, 18.2, y, { color: col, width: 6, cap: 'butt' }); s.dot(n, y, { r: 4, color: col }); s.text('$\\to\\infty$', 18.7, y, { size: 12, color: col }); }
            s.text(`$C_{${n}}$`, B ? -0.4 : -0.03, y, { size: 12, color: col, align: B ? 'center' : 'right' });
          }
          const yb = top - K - 0.9;
          if (f === 'A') s.interval(0, 1 / K, yb, { color: 'green', width: 9, r: 5 });
          else if (f === 'C') s.interval(0, 1 / K, yb, { color: 'green', width: 9, r: 5, open: [true, false] });
          else { s.line(K, yb, 18.2, yb, { color: 'green', width: 9, cap: 'butt' }); s.dot(K, yb, { r: 5, color: 'green' }); s.text('$\\to\\infty$', 18.7, yb, { size: 12, color: 'green' }); }
          s.text('$C_1\\cap\\dots\\cap C_k$', B ? 9 : 0.5, yb - 0.9, { size: 12, color: 'green', align: 'center' });
          info = { f, K };
        });
        v.readout(() => {
          if (!info) return '';
          const { f, K } = info;
          if (f === 'A') return `$C_1\\cap\\dots\\cap C_{${K}}=[0,1/${K}]\\ne\\varnothing$ for every $k$, and the whole intersection is $\\{0\\}\\ne\\varnothing$: $[0,1]$ is compact, the sets are closed.`;
          if (f === 'B') return `$C_1\\cap\\dots\\cap C_{${K}}=[${K},\\infty)\\ne\\varnothing$ for every $k$, yet $\\bigcap_nC_n=\\varnothing$: the finite intersection property holds, the intersection is empty because $\\R$ is **not compact**.`;
          return `$C_1\\cap\\dots\\cap C_{${K}}=(0,1/${K}]\\ne\\varnothing$ for every $k$, yet $\\bigcap_n(0,1/n]=\\varnothing$: $[0,1]$ is compact, but these sets are **not closed** in it ($0$ is a limit point), so the theorem does not apply.`;
        });
      },
    },
    // ------------------------------------------------------------------ 4.10
    {
      num: '4.10',
      kind: 'Theorem',
      name: 'Closed intervals in a linear continuum are compact',
      statement: String.raw`Let $L$ be a linear continuum (a totally ordered set with the least-upper-bound property and no gaps, in the order topology; e.g. $\R$). Then every closed interval $[a,b]\subset L$ is compact. In particular $[0,1]$ is compact (the Heine–Borel theorem for $n=1$).`,
      idea: String.raw`Given an open cover $\mathcal U$ of $[a,b]$, let $S$ be the set of $x\in[a,b]$ such that $[a,x]$ is covered by finitely many members of $\mathcal U$. Then $a\in S$, and $c=\sup S$ exists by the least-upper-bound property. A set $U\in\mathcal U$ containing $c$ contains an interval around $c$; finitely many sets cover $[a,x]$ for some $x$ in it with $x<c$, and adding $U$ covers $[a,y]$ for some $y>c$ (or all of $[a,b]$ if $c=b$). So $c=b\in S$. If the order has a gap — as $\Q$ does at $\sqrt2$ — then $\sup S$ does not exist and the argument has nowhere to stand.`,
      caption: String.raw`Choose the space. In $[0,1]$ step through the proof: the set $S$ of points up to which finitely many sets suffice (green bar) is pushed right by one set at a time until it passes $1$. In $\Q\cap[0,2]$ with the cover $(-1,\sqrt2-\tfrac1n)$, $(\sqrt2+\tfrac1n,3)$, the reach creeps up to $\sqrt2$, which is not a point of the space: nothing can be added, and no finite subfamily covers $\Q\cap[0,2]$.`,
      credit: String.raw`Borel, 1895 (countable covers); Cousin, 1895, and Lebesgue, 1898 (arbitrary covers)`,
      deps: ['top-4.1', 'top-1.6', 'pma-1.10'],
      see: ['pma-2.40'],
      refs: ['Munkres §27'],
      tags: ['compactness', 'least upper bound'],
      viz(v) {
        const sp = v.select('space', [{ value: 'R', label: '$[0,1]$' }, { value: 'Q', label: '$\\Q\\cap[0,2]$' }], 'R', { onChange: () => S.reset({ at: 'start' }) });
        const s = v.stage({ x: [-0.1, 1.1], y: [-0.1, 1.05], axes: false, height: 340 });
        const R2 = Math.SQRT2;
        const frames = () => {
          if (sp.value === 'R') {
            const ints = randIntervals(v.rng(8), 9, 0.55 / 9 + 0.03, 0.2), gc = greedyCover(ints, 0, 1);
            const fr = [{ k: 0, ints, ch: [], p: 0, note: String.raw`$S=\{x:[0,x]\text{ is covered by finitely many sets}\}$. It contains $0$ (some set contains $0$), so $c=\sup S$ exists.` }];
            gc.chosen.forEach((i, k) => fr.push({ k: k + 1, ints, ch: gc.chosen.slice(0, k + 1), p: gc.reach[k + 1], note: k + 1 < gc.chosen.length ? String.raw`A set containing the current reach $c=${gc.reach[k].toFixed(3)}$ is an open interval: $S$ contains points beyond $c$, so $c$ was not the supremum — push the reach on to $${gc.reach[k + 1].toFixed(3)}$.` : String.raw`The last set reaches beyond $1$: $[0,1]$ is covered by **${gc.chosen.length}** sets. So $\sup S=1\in S$.` }));
            return fr;
          }
          const N = 9, A = Array.from({ length: N }, (_, n) => [-1, R2 - 1 / (n + 1)]);
          const fr = [{ q: true, A: [], p: 0, note: String.raw`Cover the rational points of $[0,2]$ by $A_n=(-1,\sqrt2-\tfrac1n)$ and $B_n=(\sqrt2+\tfrac1n,3)$. The point $\sqrt2$ is not in the space.` }];
          for (let n = 1; n <= N; n++) fr.push({ q: true, A: A.slice(0, n), p: R2 - 1 / n, note: n < N ? String.raw`Using $A_{${n}}$: the reach is $\sqrt2-\tfrac1{${n}}=${(R2 - 1 / n).toFixed(3)}$. Each step gets closer to $\sqrt2$ but not past it.` : String.raw`The reach tends to $\sqrt2$ and stops there: $\sup S=\sqrt2\notin\Q$, no set of the cover contains it, and no finite subfamily covers $\Q\cap[0,2]$.` });
          return fr;
        };
        const S = v.steps({ frames, speed: 0.8, still: 3 });
        v.render(() => {
          const f = S.frame; if (f.p === undefined) return;
          if (f.q) {
            s.setView([-0.35, 3.2], [-0.25, 1.05]);
            s.line(0, 0.05, 2, 0.05, { color: 'ink', width: 4, cap: 'butt' });
            s.dot(0, 0.05, { r: 5, color: 'ink' }); s.dot(2, 0.05, { r: 5, color: 'ink' });
            f.A.forEach((a, k) => s.interval(Math.max(a[0], -0.3), a[1], 0.2 + 0.07 * k, { color: 'blue', width: 3.5, r: 2.5, open: [true, true] }));
            for (let n = 1; n <= 9; n++) s.interval(R2 + 1 / n, 3.15, 0.2 + 0.07 * (n - 1) + 0.0, { color: 'faint', width: 3.5, r: 2.5, open: [true, true], alpha: 0.5 });
            if (f.p > 0) s.interval(0, f.p, 0.9, { color: 'green', width: 9, r: 4, open: [false, true] });
            s.dot(R2, 0.05, { r: 6, hollow: true, color: 'red' }); s.text('$\\sqrt2$', R2, -0.1, { size: 15, color: 'red' });
          } else {
            s.setView([-0.1, 1.1], [-0.1, 1.05]);
            s.line(0, 0.05, 1, 0.05, { color: 'ink', width: 4, cap: 'butt' });
            s.dot(0, 0.05, { r: 5, color: 'ink' }); s.dot(1, 0.05, { r: 5, color: 'ink' });
            const done = new Set(f.ch);
            drawBars(s, f.ints, (i) => i, 0.95, -0.4 / 12, (i) => (done.has(i) ? CYC[f.ch.indexOf(i) % CYC.length] : 'faint'), { width: 3.2, alpha: 0.8, r: 2.4 });
            if (f.p > 0) s.interval(0, Math.min(f.p, 1), 0.1, { color: 'green', width: 9, r: 4, open: [false, f.p <= 1] });
          }
        });
        v.legend([['green', 'the set $S$: reached with finitely many sets'], ['blue', 'sets used'], ['red', 'the missing point', { dot: true }]]);
        v.readout(() => `Reach so far: $c=${S.frame.p === undefined ? 0 : v.fix(S.frame.p, 4)}$.`);
      },
    },
    // ------------------------------------------------------------------ 4.11
    {
      num: '4.11',
      kind: 'Theorem',
      name: 'Extreme value theorem',
      statement: String.raw`If $X$ is nonempty and compact and $f\colon X\to\R$ is continuous, then $f$ attains a maximum and a minimum: there are $p,q\in X$ with $f(q)\le f(x)\le f(p)$ for all $x\in X$. More generally a continuous real function on a compact space is bounded.`,
      idea: String.raw`The image $f(X)$ is compact (4.4), so a compact subset of $\R$: it is closed because $\R$ is Hausdorff (4.3), and bounded because the cover by $(-n,n)$ has a finite subcover. A nonempty closed bounded set of reals contains its supremum and its infimum, and those are the values $f(p)$ and $f(q)$. Without compactness the image can be a non-closed set like $[0,1)$ and the supremum is a value that is approached, not attained.`,
      caption: String.raw`The heat map shows $f$ on the disc. Drag the probe; red and blue dots show the largest and smallest values on the finite polar grid, not certified extrema. Hollow markers are analytic references (the wave maximum is evaluated numerically from its stationary equations). On the open disc, the tilted plane $x+0.6y$ has supremum $\sqrt{1.36}$ only on the removed boundary. The wave function instead attains its maximum inside the open disc; its minimum is reached only on the boundary. Thus noncompactness permits failure of attainment but does not force it. Grid density controls the sample approximation.`,
      deps: ['top-4.4', 'top-4.10'],
      see: ['pma-4.16'],
      refs: ['Munkres (2nd ed.), Theorem 27.4'],
      links: { source: 'https://raw.githubusercontent.com/enilsen16/The-Math-Group/master/Munkres-Topology.pdf' },
      tags: ['compactness', 'optimization'],
      viz(v) {
        const fs = v.select('function $f$', [{ value: 'wave', label: '$\\sin 2.5x+\\cos 2y+0.4xy$' }, { value: 'plane', label: '$x+0.6\\,y$' }], 'wave');
        const reg = v.select('region', [{ value: 'closed', label: 'closed disc' }, { value: 'open', label: 'open disc' }], 'closed');
        const nn = v.slider('grid density $N$', 4, 120, 20, { int: true });
        const s = v.stage({ x: [-1.35, 1.35], y: [-1.35, 1.35], equal: true, axes: false, height: 400 });
        const F=discFunctions,reference=waveMaximum(),planeMax=Math.sqrt(1.36);
        const hq = s.handle(0.2, -0.3, { color: 'gold', r: 7, label: 'probe', labelPos: 'ne', constrain: (x, y) => { const r = Math.hypot(x, y); return r > 0.98 ? [(x / r) * 0.98, (y / r) * 0.98] : [x, y]; } });
        let info = null;
        v.render(() => {
          const f = F[fs.value], closed = reg.value === 'closed';
          const lo=-2.2,hi=2.2;
          s.raster((x, y) => (x * x + y * y <= 1 ? [...v.M.cmap((f(x, y) - lo) / (hi - lo), 'viridis'), 1] : null), { key: fs.value, res: 3 });
          s.circle(0, 0, 1, { color: 'ink', width: closed ? 2.5 : 1.8, dash: closed ? false : [6, 5] });
          const r = discSampleExtrema(fs.value, nn.value, closed);
          const probe = f(hq.x, hq.y);
          s.dot(r.best[1], r.best[2], { r: 8, color: 'red', label: 'sample max', labelPos: 'se' });
          s.dot(r.low[1], r.low[2], { r: 8, color: 'blue', label: 'sample min', labelPos: 'sw' });
          const refs=fs.value==='plane'?[[planeMax,1/planeMax,.6/planeMax],[-planeMax,-1/planeMax,-.6/planeMax]]:[reference];
          refs.forEach((p,i)=>s.dot(p[1],p[2],{r:6,hollow:true,color:i?'blue':'red'}));
          info = { r, probe, closed, plane:fs.value==='plane' };
        });
        v.readout(() => {
          if (!info) return '';
          const {r,probe,closed,plane}=info;
          const base=`probe: $f=${v.fix(probe,3)}$ · sample max $${v.fix(r.best[0],4)}$ at $(${v.fix(r.best[1],3)},${v.fix(r.best[2],3)})$, sample min $${v.fix(r.low[0],4)}$.`;
          if(closed)return `${base} The nonempty closed disc is compact, so both extrema are attained. ${plane?`Exact maximum/minimum: $\\pm\\sqrt{1.36}$.`:`The wave maximum is $\\approx${v.fix(reference[0],6)}$ at the interior point $(${v.fix(reference[1],6)},${v.fix(reference[2],6)})$.`} A finite sample can miss the actual extremizers.`;
          if(plane)return `${base} The open disc has no maximum or minimum. Its supremum is $\\sqrt{1.36}=${v.fix(planeMax,6)}$; the sampled maximum is $${v.fix(planeMax-r.best[0],6)}$ below it. The infimum is $-\\sqrt{1.36}$.`;
          return `${base} On the open disc the wave maximum is attained at an interior point, with value $\\approx${v.fix(reference[0],6)}$. Its boundary minimum is not attained. A gap in a finite sample does not prove nonattainment.`;
        });
      },
    },
    // ------------------------------------------------------------------ 4.12
    {
      num: '4.12',
      kind: 'Lemma',
      name: 'Lebesgue number lemma',
      statement: String.raw`Let $(X,d)$ be a nonempty compact metric space and $\mathcal U$ an open cover of $X$. There is $\delta>0$ such that every subset of $X$ of diameter less than $\delta$ lies in some member of $\mathcal U$. One can choose $\delta$ so that every relative open ball $B_X(x,\delta)$ also lies in one cover member. Such a $\delta$ is a **Lebesgue number**.`,
      idea: String.raw`If $X$ itself belongs to the cover, any positive number works. Otherwise choose a finite subcover $U_1,\ldots,U_m$ and put $L(x)=\max_i\operatorname{dist}(x,X\setminus U_i)$. The complements are nonempty, so $L$ is a finite 1-Lipschitz function. Openness of the cover gives $L(x)>0$, and compactness gives a positive minimum $\delta$. For each $x$, some $U_i$ contains $B_X(x,\delta)$; a set of diameter less than $\delta$ lies in such a ball about any of its points. In the punctured-disc example, each drawn disc has centre norm $0.75s$ and radius $0.4s$, so the norms of its points have ratio at most $1.15/0.35=23/7<4$. Thus $p$ and $4p$ cannot lie in one member. Taking $0<|p|<\min(1/4,\delta/3)$ disproves any proposed Lebesgue number for the infinite cover.`,
      caption: String.raw`The heat map is the **ambient** clearance $\ell(x)=\max_i(r_i-|x-c_i|)$ for the drawn discs: a full Euclidean ball of radius at most $\ell(x)$ fits in one disc. This gives a sufficient bound for relative balls in $X$, and may differ from the best relative-space bound. For the closed unit disc, rotational symmetry gives the exact clearance minimum and profile $m(r)=\min_{r\le|x|\le1}\ell(x)$. For the punctured disc, only rings $0,\ldots,J$ and the covered annulus $2^{-(J+1)}\le|x|\le1$ are displayed; its curve and blue marker are sampled estimates. The dashed green line is a separate analytic guarantee on that annulus. Increasing $J$ halves that guarantee. The full infinite cover has no Lebesgue number, as the pair argument shows. Drag the ball to test actual ambient containment.`,
      deps: ['top-4.1', 'top-1.5'],
      refs: ['Munkres (2nd ed.), Lemma 27.5'],
      links: { source: 'https://raw.githubusercontent.com/enilsen16/The-Math-Group/master/Munkres-Topology.pdf' },
      tags: ['compactness', 'metric spaces'],
      viz(v) {
        const sp = v.select('space', [{ value: 'c', label: 'closed disc (compact)' }, { value: 'p', label: 'punctured disc (not compact)' }], 'c');
        const J = v.slider('last ring index $J$', 2, 9, 5, { int: true });
        const scale = v.slider('size of the 7 discs (compact cover)', 0.95, 1.4, 1, { step: 0.01 });
        const rho = v.slider('radius of the ball', 0.005, 0.5, 0.1, { step: 0.005 });
        const s = v.stage({ x: [-1.2, 1.2], y: [-1.2, 1.2], equal: true, axes: false, height: 370, title: 'the drawn discs and ambient clearance' });
        const G = v.stage({ x: [0.002, 1], y: [0, 0.35], xlog: true, axes: 'box', gutter: true, height: 370, title: 'clearance profile and uniform guarantee', xlabel: '$r$', ylabel: '$m$' });
        const constrain=(x,y)=>{const r=Math.hypot(x,y),min=sp.value==='c'?0:2**-(J.value+1),q=clamp(r,min,1);return r?[x*q/r,y*q/r]:[q,0];};
        const hb=s.handle(.55,.3,{color:'gold',r:7,constrain});
        let cache={key:''};
        let info = null;
        v.render(() => {
          const compact = sp.value === 'c'; J.el.hidden = compact; scale.el.hidden = !compact;
          const key = compact ? 'c' + scale.value : 'p' + J.value;
          if(cache.key!==key){
            const D=lebesgueDiscs(compact,scale.value,J.value),rmin=compact?0:2**-(J.value+1),start=compact?.002:rmin;
            const rs=Array.from({length:70},(_,i)=>start*Math.pow(1/start,i/69));
            let mm,lmin,arg,guarantee;
            if(compact){const exact=compactCoverMinimum(scale.value);lmin=exact.value;arg=exact.point;guarantee=lmin;mm=rs.map(r=>compactCoverMinimum(scale.value,r).value);}
            else{
              const samples=rs.map(r=>{let best={value:Infinity,point:[r,0]};for(let k=0;k<90;k++){const t=2*Math.PI*k/90,p=[r*Math.cos(t),r*Math.sin(t)],v=ambientClearance(D,...p).value;if(v<best.value)best={value:v,point:p};}return best;});
              const best=samples.reduce((a,b)=>a.value<b.value?a:b);lmin=best.value;arg=best.point;mm=samples.map(p=>p.value);for(let i=mm.length-2;i>=0;i--)mm[i]=Math.min(mm[i],mm[i+1]);
              guarantee=punctureCoverConstant*rmin;
            }
            cache={key,D,rs,mm,rmin,lmin,arg,guarantee};
          }
          const {D,rs,mm,rmin,lmin,arg,guarantee}=cache;
          const p=constrain(hb.x,hb.y);hb.set(...p);
          const extent=1.08*Math.max(1+rho.value,...D.flatMap(([x,y,r])=>[Math.abs(x)+r,Math.abs(y)+r]));s.setView([-extent,extent],[-extent,extent]);
          G.setView([compact?.002:rmin*.9,1.05],[0,1.2*Math.max(...mm,guarantee)]);
          s.raster((x, y) => { const r = Math.hypot(x, y); if (r > 1 || r < rmin) return null; const z = ambientClearance(D,x,y).value; return [...v.M.cmap(clamp(z / 0.3, 0, 1), 'magma'), 1]; }, { key, res: 3 });
          D.forEach(([cx, cy, r]) => s.circle(cx, cy, r, { color: 'faint', width: 0.8, alpha: 0.8 }));
          s.circle(0, 0, 1, { color: 'ink', width: 1.6 });
          if (!compact) s.dot(0, 0, { r: 4, hollow: true, color: 'ink' });
          const {value:Lx,index:bi}=ambientClearance(D,hb.x,hb.y),fits=rho.value<=Lx;
          if (fits && bi >= 0) s.circle(D[bi][0], D[bi][1], D[bi][2], { fill: 'green', fillAlpha: 0.12, color: 'green', width: 2 });
          s.circle(hb.x, hb.y, rho.value, { color: fits ? 'green' : 'red', width: 2.4, fill: fits ? 'green' : 'red', fillAlpha: 0.2 });
          s.dot(arg[0], arg[1], { r: 6, color: 'blue', label: compact?'min clearance':'sample min', labelPos: 'w' });
          G.line(rs[0], 0, 1, 0, { color: 'faint', width: 1 });
          G.path(rs.map((r, k) => [r, Math.max(0, mm[k])]), { color: 'accent', width: 3 });
          if (!compact) G.vline(rmin, { color: 'orange', width: 1.3, dash: true });
          G.hline(guarantee, { color: 'green', width: 1.4, dash: [5, 4] });
          info={compact,lmin,Lx,fits,n:D.length,guarantee,rmin};
        });
        v.legend([['accent','clearance profile (puncture: sampled)'],['green','analytic uniform guarantee']]);
        v.readout(() => {
          if (!info) return '';
          const {compact,lmin,Lx,fits,n,guarantee,rmin}=info;
          const tail=compact?`Seven discs cover the closed unit disc. The analytic uniform clearance is $\\delta\\approx${v.fix(guarantee,6)}>0$; this is a valid Lebesgue number.`:`${n} discs from rings $0,\\ldots,${J.value}$ cover the displayed annulus $|x|\\ge${v.sci(rmin,3)}$. Sampled minimum $\\approx${v.sci(lmin,3)}$ (estimate); analytic uniform lower bound $\\delta_J\\approx${v.sci(guarantee,3)}$. The bound halves with each added ring; the full punctured-disc cover has no Lebesgue number.`;
          return `At the probe, ambient clearance $\\ell(x)\\approx${v.fix(Lx,6)}$; radius $${v.fix(rho.value,3)}$ **${fits?'fits inside one drawn disc':'does not fit in any single drawn disc'}**. ${tail}`;
        });
      },
    },
  ],
};
