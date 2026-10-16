// Topology — Chapter 3: Connectedness (items 3.1–3.7; 3.8–3.14 are in ch03-b.js, 3.15–3.21 in ch03-c.js)
import { sampleGrid, labelGrid, gridPath, shortcut, inShape, inShapes, shapeComponents, lineMeets, onSide, sineArc, segDist } from './ch03.shared.js';

const TAU = 2 * Math.PI;
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const mn = (s) => s.replace(/-/g, '−');
const CYC = ['blue', 'orange', 'green', 'pink', 'purple', 'teal'];

/** Unit normal and offset of the line through h1, h2 (normal rotated 90° from the direction). */
function lineOf(h1, h2) {
  let dx = h2.x - h1.x, dy = h2.y - h1.y; const L = Math.hypot(dx, dy) || 1;
  const n = [-dy / L, dx / L];
  return { n, c: n[0] * h1.x + n[1] * h1.y, d: [dx / L, dy / L] };
}
/** Draw the full line n·z = c across a stage window as a segment. */
function drawLine(s, ln, h1, opt = {}) {
  const T = 20; s.line(h1.x - ln.d[0] * T, h1.y - ln.d[1] * T, h1.x + ln.d[0] * T, h1.y + ln.d[1] * T, opt);
}

/** The test sets of 3.1 and 3.8: unions of discs and segments. */
const SETS31 = {
  two: { name: 'two disjoint closed discs', X: [{ t: 'disc', c: [-1.45, 0], r: 0.95 }, { t: 'disc', c: [1.45, 0], r: 0.95 }] },
  dumbbell: { name: 'dumbbell: two discs joined by a segment', X: [{ t: 'disc', c: [-1.7, 0], r: 0.8 }, { t: 'disc', c: [1.7, 0], r: 0.8 }, { t: 'seg', p: [-0.9, 0], q: [0.9, 0] }] },
  tclosed: { name: 'two closed discs touching at a point', X: [{ t: 'disc', c: [-1, 0], r: 1 }, { t: 'disc', c: [1, 0], r: 1 }] },
  topen: { name: 'two open discs, tangent point left out', X: [{ t: 'disc', c: [-1, 0], r: 1, open: true }, { t: 'disc', c: [1, 0], r: 1, open: true }] },
};

export default {
  collection: 'top',
  chapter: 3,
  title: 'Connectedness',
  summary: String.raw`A space is connected when it cannot be split into two disjoint open pieces, and continuous maps preserve this. The real line and every interval are connected because of the least-upper-bound property, which gives the intermediate value theorem in full generality. Path-connectedness is stronger, as the topologist’s sine curve shows, and the local versions of both notions explain why open connected sets in $\R^n$ are path-connected. Counting the pieces left after removing a point already tells many spaces apart.`,
  items: [
    // ------------------------------------------------------------------ 3.1
    {
      num: '3.1',
      kind: 'Definition',
      name: 'Connected spaces',
      statement: String.raw`A **separation** of a space $X$ is a pair of disjoint, nonempty, open subsets $U,V\subset X$ with $U\cup V=X$. The space $X$ is **connected** if it has no separation. Equivalently: the only subsets of $X$ that are both open and closed (clopen) are $\varnothing$ and $X$. A subset $A\subset X$ is connected when it is connected in the subspace topology, i.e. it cannot be covered by two open sets of $X$ whose traces on $A$ are disjoint and nonempty.`,
      idea: String.raw`If $U,V$ is a separation then $U=X\setminus V$ is also closed, so $U$ is a nonempty proper clopen set; conversely a nonempty proper clopen $U$ gives the separation $U,\,X\setminus U$. Connectedness is therefore a statement about the topology only, not about pictures: a set can look "in one piece" and still be disconnected (two open discs touching at a point that is left out), or look like two pieces yet be connected if a point joins them.`,
      caption: String.raw`Choose a set in the plane and drag the two handles to place a line. The line cuts the set into a blue half and a red half; this is a genuine separation only when the line meets **no point** of the set (every point must be in one open half) and both halves are nonempty. Try the two discs, then the dumbbell, then the two touching discs: two closed discs that touch cannot be split by any line (they are one piece), whereas open discs touching at a left-out point can. The readout also counts the pieces exactly, from which shapes touch.`,
      deps: ['top-1.1'],
      see: ['pma-2.45'],
      refs: ['Munkres §23'],
      tags: ['connectedness'],
      viz(v) {
        const sel = v.select('set $X$', [{ value: 'two', label: 'two closed discs' }, { value: 'dumbbell', label: 'dumbbell' }, { value: 'tclosed', label: 'touching closed discs' }, { value: 'topen', label: 'touching open discs' }], 'two');
        const s = v.stage({ x: [-3.2, 3.2], y: [-1.9, 1.9], equal: true, axes: false, height: 330 });
        const h1 = s.handle(0, -1.5, { color: 'gold', label: 'a', labelPos: 'e' }), h2 = s.handle(0, 1.5, { color: 'gold', label: 'b', labelPos: 'e' });
        let info = null;
        v.render(() => {
          const X = SETS31[sel.value].X, ln = lineOf(h1, h2);
          const sd = (x, y) => ln.n[0] * x + ln.n[1] * y - ln.c;
          s.raster((x, y) => {
            if (!inShapes(X, x, y)) return null;
            const d = sd(x, y);
            if (Math.abs(d) < 0.035) return [...v.rgb('gold').slice(0, 3), 0.95];
            return [...v.rgb(d > 0 ? 'blue' : 'red').slice(0, 3), 0.55];
          }, { key: [sel.value, h1.x.toFixed(2), h1.y.toFixed(2), h2.x.toFixed(2), h2.y.toFixed(2)].join(','), res: 3 });
          for (const S of X) { if (S.t === 'disc') s.circle(S.c[0], S.c[1], S.r, { color: 'ink', width: 1.4, dash: S.open ? [5, 4] : false }); else s.line(S.p[0], S.p[1], S.q[0], S.q[1], { color: 'ink', width: 3 }); }
          drawLine(s, ln, h1, { color: 'gold', width: 1.6, dash: [6, 4] });
          const meets = X.filter((S) => lineMeets(S, ln.n, ln.c)).length;
          const pos = X.some((S) => onSide(S, ln.n, ln.c, 1)), neg = X.some((S) => onSide(S, ln.n, ln.c, -1));
          info = { meets, pos, neg, ok: meets === 0 && pos && neg, k: shapeComponents(X).k };
        });
        v.legend([['blue', '$U$: points on one side'], ['red', '$V$: points on the other'], ['gold', 'points of $X$ on the line (in neither piece)', { dot: true }]]);
        v.readout(() => {
          if (!info) return '';
          const { meets, pos, neg, ok, k } = info;
          const why = ok ? '**a separation: $U,V$ are disjoint, nonempty, open in $X$, and $U\\cup V=X$.**' : meets ? `not a separation: the line passes through ${meets} part${meets > 1 ? 's' : ''} of $X$, and those points belong to neither piece.` : `not a separation: ${pos ? 'the red' : neg ? 'the blue' : 'both'} piece is empty.`;
          return `${why}\nExact count: $X$ has **${k}** connected piece${k > 1 ? 's' : ''} (${k > 1 ? 'a line between them gives a separation, so $X$ is disconnected' : 'so no pair $U,V$ whatsoever can separate it — a line is just one way to try'}).`;
        });
      },
    },
    // ------------------------------------------------------------------ 3.2
    {
      num: '3.2',
      kind: 'Theorem',
      name: 'Linear continua are connected',
      statement: String.raw`Let $L$ be a **linear continuum**: a totally ordered set with more than one element, with the least-upper-bound property, and such that between any two elements there is a third. With the order topology, $L$ is connected, and so are all its intervals and rays. In particular $\R$, the intervals of $\R$, and the dictionary-ordered square $[0,1]\times[0,1]$ are connected; $\Q$ is not a linear continuum.`,
      idea: String.raw`Suppose $L=A\cup B$ is a separation and take $a\in A$, $b\in B$ with $a<b$. The set $S=\{x\in A: x<b\}$ is bounded above, so it has a least upper bound $c\le b$. The point $c$ lies in $A$ or in $B$; if in $A$, openness of $A$ puts a whole interval above $c$ into $A$ (using density to get a point there), contradicting $c=\sup S$; if in $B$, openness of $B$ puts an interval below $c$ into $B$, so a smaller upper bound for $S$ exists. Every cut of a linear continuum is therefore *filled by a point*, and the point has nowhere to go.`,
      caption: String.raw`Slide the cut $c$ and decide in which piece the cut point lies. In $\Q$ a cut at an irrational number leaves two open pieces — a separation, because $\Q$ has a gap there. In $\R$, or in the dictionary-ordered square (drag the cut point to any $(a,b)$), the cut point must be put somewhere, and the piece that receives it is no longer open. Punch a hole in $\R$ and the gap — and the separation — returns.`,
      deps: ['top-3.1', 'top-1.6', 'pma-2.47'],
      refs: ['Munkres §24'],
      tags: ['connectedness', 'order'],
      viz(v) {
        const sp = v.select('space', [{ value: 'Q', label: '$\\Q\\cap[0,1]$' }, { value: 'R', label: '$[0,1]$' }, { value: 'hole', label: '$[0,1]\\setminus\\{\\tfrac12\\}$' }, { value: 'sq', label: 'ordered square' }], 'Q');
        const kind = v.select('cut point $c$ is', [{ value: 'irr', label: 'irrational' }, { value: 'rat', label: 'rational' }], 'irr');
        const put = v.select('put $c$ into', [{ value: 'A', label: 'lower piece' }, { value: 'B', label: 'upper piece' }], 'A');
        const L = v.stage({ x: [-0.05, 1.05], y: [-0.55, 0.75], axes: false, height: 210 });
        const Sq = v.stage({ x: [-0.08, 1.08], y: [-0.1, 1.1], equal: true, axes: false, height: 300 });
        const hc = L.handle(0.62, 0, { color: 'gold', label: 'c', labelPos: 's', constrain: (x) => [clamp(x, 0.04, 0.96), 0] });
        const hs = Sq.handle(0.5, 0.45, { color: 'gold', label: 'c', constrain: { x: [0.03, 0.97], y: [0.03, 0.97] } });
        let info = null;
        const upd = () => { const sq = sp.value === 'sq'; L.el.style.display = sq ? 'none' : ''; Sq.el.style.display = sq ? '' : 'none'; kind.el.hidden = sp.value !== 'Q'; };
        sp.el && upd();
        v.render(() => {
          upd();
          const space = sp.value;
          if (space === 'sq') {
            const a = hs.x, b = hs.y;
            Sq.rect(0, 0, a, 1, { fill: 'blue', fillAlpha: 0.2, stroke: false });
            Sq.rect(a, 0, 1, 1, { fill: 'red', fillAlpha: 0.2, stroke: false });
            Sq.rect(a - 0.004, 0, a + 0.004, b, { fill: 'blue', fillAlpha: 0.7, stroke: false });
            Sq.rect(a - 0.004, b, a + 0.004, 1, { fill: 'red', fillAlpha: 0.7, stroke: false });
            for (let k = 0; k <= 40; k++) Sq.line(k / 40, 0, k / 40, 1, { color: 'faint', width: 0.6, alpha: 0.5 });
            Sq.rect(0, 0, 1, 1, { color: 'ink', width: 1.5 });
            Sq.text('columns {x} × [0,1], ordered by x then y', 0.5, 1.065, { align: 'center', size: 11, color: 'muted' });
            info = { space, c: `(${v.fix(a, 2)},\\,${v.fix(b, 2)})` };
          } else {
            const c = hc.x, hole = space === 'hole';
            L.line(0, 0, c, 0, { color: 'blue', width: 6, cap: 'butt' });
            L.line(c, 0, 1, 0, { color: 'red', width: 6, cap: 'butt' });
            if (space === 'Q') { for (let k = 0; k < 120; k++) { const x = (k + 0.5) / 120; L.dot(x, 0.2, { r: 1.5, color: x < c ? 'blue' : 'red' }); } L.text('only the rationals are points of the space', 0.5, 0.5, { align: 'center', size: 11, color: 'muted' }); }
            if (hole) { L.dot(0.5, 0, { r: 6, hollow: true, color: 'ink' }); L.text('the missing point ½', 0.5, -0.32, { align: 'center', size: 11, color: 'muted' }); }
            const cInSpace = space === 'R' ? true : space === 'Q' ? kind.value === 'rat' : false;
            L.dot(c, 0, { r: 6.5, hollow: !cInSpace, color: 'gold' });
            info = { space, c: v.fix(c, 3), cIn: cInSpace, irr: space === 'Q' && kind.value === 'irr', hole, put: put.value };
            if (hole && Math.abs(c - 0.5) > 0.02) info.off = true;
          }
          hc.visible = space !== 'sq'; hs.visible = space === 'sq';
          put.el.hidden = (space === 'Q' && kind.value === 'irr') || (space === 'hole' && Math.abs(hc.x - 0.5) <= 0.02);
        });
        v.readout(() => {
          if (!info) return '';
          const { space } = info;
          if (space === 'sq') return `Cut at $c=${info.c}$. Lower piece $\\{<c\\}$ and upper piece $\\{>c\\}$ are open, but $c$ itself is in neither. Adding $c$ to the lower piece gives $\\{\\le c\\}$, which is **not open**: points of the next columns are arbitrarily close above $c$ in the order topology (there is no immediate successor). Adding it to the upper piece fails the same way below. No cut of the ordered square works — it is a linear continuum, hence connected.`;
          const pc = info.put === 'A' ? '\\{\\le c\\}' : '\\{\\ge c\\}', dir = info.put === 'A' ? 'above' : 'below';
          if (info.hole) return info.off ? `Cut at $c=${info.c}$, a point of the space: whichever piece receives $c$ stops being open, since points of the space lie arbitrarily close ${dir} $c$. Slide the cut onto the missing point ½.` : `**Cut at the hole $c=\\tfrac12$:** $[0,\\tfrac12)$ and $(\\tfrac12,1]$ are disjoint, nonempty, open in the space, and cover it — a separation. The cut has no point to fill it: $\\sup[0,\\tfrac12)=\\tfrac12$ is not in the space.`;
          if (info.irr) return `**Cut at the irrational $c\\approx${info.c}$:** $A=\\{x<c\\}$ and $B=\\{x>c\\}$ (rationals only) are open in $\\Q$, nonempty, disjoint, and cover $\\Q$. $A$ is bounded above but has no least upper bound in $\\Q$ — the gap. So $\\Q\\cap[0,1]$ is disconnected.`;
          return `Cut at the point $c=${info.c}$ of the space. Putting $c$ into the ${info.put === 'A' ? 'lower' : 'upper'} piece makes $${pc}$, which is **not open**: every neighbourhood of $c$ contains points ${dir} $c$. ${space === 'Q' ? 'Rational cuts do not separate; switch the cut to an irrational one.' : 'The least upper bound of the lower piece exists and has to be placed somewhere, so the interval is connected.'}`;
        });
      },
    },
    // ------------------------------------------------------------------ 3.3
    {
      num: '3.3',
      kind: 'Theorem',
      name: 'Continuous images of connected spaces are connected',
      statement: String.raw`If $f\colon X\to Y$ is continuous and $X$ is connected, then the image $f(X)$ is connected (in the subspace topology of $Y$). Consequently connectedness is a topological invariant: homeomorphic spaces are connected together or not at all.`,
      idea: String.raw`Replace $Y$ by $f(X)$, so $f$ is a continuous surjection, and suppose $U,V$ separate $Y$. Then $f^{-1}(U)$ and $f^{-1}(V)$ are open (continuity), disjoint, nonempty (surjectivity) and cover $X$ — a separation of $X$, contradiction. The proof turns separations of the target into separations of the source; the picture below shows the failure mode, a map that is **not** continuous.`,
      caption: String.raw`The parameter segment $[0,1]$ (left, coloured by $t$) is sent to the plane by a piecewise-linear map whose four vertices you drag. The image is one unbroken curve however you bend it. Now raise the jump: the map gets a discontinuity at the chosen time $t_0$ and its image splits into two pieces, which the exact gap measure and the piece counter confirm.`,
      deps: ['top-3.1', 'top-2.1'],
      see: ['pma-4.22'],
      refs: ['Munkres §23'],
      tags: ['connectedness', 'continuity'],
      viz(v) {
        const jump = v.slider('size of the jump', 0, 1.2, 0, { step: 0.01 });
        const t0 = v.slider('jump time $t_0$', 0.1, 0.9, 0.55, { step: 0.01 });
        const D = v.stage({ x: [-0.05, 1.05], y: [-1, 1], axes: false, height: 330, title: 'domain $X=[0,1]$' });
        const R = v.stage({ x: [-2.2, 2.2], y: [-1.6, 1.6], equal: true, axes: false, height: 330, title: 'image $f(X)\\subset\\R^2$' });
        const P = [[-1.7, -0.9], [-0.6, 0.9], [0.7, -0.7], [1.6, 0.6]].map((p, i) => R.handle(p[0], p[1], { color: 'accent', label: 'f(' + ['0', '⅓', '⅔', '1'][i] + ')' }));
        let info = null;
        const f = (t) => {
          const u = t * 3, k = Math.min(2, Math.floor(u)), w = u - k, a = P[k], b = P[k + 1];
          const j = t >= t0.value ? jump.value : 0;
          return [a.x + w * (b.x - a.x) + 0.8 * j, a.y + w * (b.y - a.y) + 0.6 * j];
        };
        v.render(() => {
          const N = 1200; let maxStep = 0, at = 0, pieces = 1; const pts = [];
          for (let i = 0; i <= N; i++) pts.push(f(i / N));
          const steps = []; for (let i = 0; i < N; i++) { const d = Math.hypot(pts[i + 1][0] - pts[i][0], pts[i + 1][1] - pts[i][1]); steps.push(d); if (d > maxStep) { maxStep = d; at = i; } }
          const thr = 0.05; for (const d of steps) if (d > thr) pieces++;
          for (let i = 0; i < N; i += 2) { const t = i / N, c = v.mix('blue', 'orange', t); D.line(t, 0, (i + 2) / N, 0, { color: c, width: 12, cap: 'butt' }); }
          D.vline(t0.value, { color: 'gold', width: 1.2, dash: [4, 3] }); D.text('t₀', t0.value, 0.45, { align: 'center', size: 12, color: 'gold' });
          for (let i = 0; i < N; i += 6) {
            const j = Math.min(N, i + 6); let ok = true; for (let k = i; k < j; k++) if (steps[k] > thr) ok = false;
            if (ok) R.line(pts[i][0], pts[i][1], pts[j][0], pts[j][1], { color: v.mix('blue', 'orange', i / N), width: 4.5 });
          }
          R.dot(pts[0][0], pts[0][1], { r: 5, color: 'blue' }); R.dot(pts[N][0], pts[N][1], { r: 5, color: 'orange' });
          info = { maxStep, pieces, j: jump.value, at };
        });
        v.readout(() => {
          if (!info) return '';
          const { maxStep, pieces, j } = info;
          return j === 0 ? `Continuous map: the largest gap between consecutive image samples ($1200$ of them) is $${v.fix(maxStep, 3)}$ and the image has **1** piece — a continuous image of $[0,1]$ is connected.` : `Jump $\\|f(t_0^+)-f(t_0^-)\\|=${v.fix(j, 2)}$: the map is discontinuous at $t_0$, the largest gap is $${v.fix(maxStep, 2)}$, and the image falls into **${pieces}** pieces. Only a discontinuity can disconnect the image.`;
        });
      },
    },
    // ------------------------------------------------------------------ 3.4
    {
      num: '3.4',
      kind: 'Theorem',
      name: 'Intermediate value theorem',
      statement: String.raw`Let $X$ be a connected space, $f\colon X\to\R$ continuous, and $a,b\in X$. If $r$ is a real number between $f(a)$ and $f(b)$, then there is $c\in X$ with $f(c)=r$. In particular a continuous function on an interval $[a,b]$ takes every value between $f(a)$ and $f(b)$; more generally $f(X)$ is an interval of $\R$.`,
      idea: String.raw`By 3.3 the image $f(X)$ is a connected subset of $\R$. A connected subset of $\R$ is an interval: if $r\notin f(X)$ lay between two of its points, the open rays $(-\infty,r)$ and $(r,\infty)$ would separate it. (Conversely intervals are connected by 3.2 — that is where the least-upper-bound property enters.) An interval containing $f(a)$ and $f(b)$ contains everything between them. The theorem is exactly where the least-upper-bound property of $\R$ enters topology.`,
      caption: String.raw`The function $f(x,y)=x+0.4y$ is defined on a region of the plane; slide the level $r$ and the points with $f=r$ light up. With the neck present the region is connected, every level between the minimum and the maximum is hit, and the image on the right is one interval. Cut the neck and the region falls into two lobes: a band of values in the middle is skipped.`,
      deps: ['top-3.3', 'top-3.2'],
      see: ['pma-4.23'],
      credit: 'Bolzano, 1817 (the one-variable case; the proof in this form uses the least-upper-bound property)',
      refs: ['Munkres §24'],
      tags: ['connectedness', 'intermediate value'],
      viz(v) {
        const neck = v.toggle('neck present (region connected)', true);
        const F = (x, y) => x + 0.4 * y;
        const lobes = [{ t: 'disc', c: [-1.7, 0.3], r: 0.95 }, { t: 'disc', c: [1.7, -0.2], r: 0.95 }];
        const necks = [{ t: 'disc', c: [-0.7, 0.15], r: 0.6 }, { t: 'disc', c: [0.7, -0.1], r: 0.6 }];
        const reg = (on) => (x, y) => inShapes(on ? lobes.concat(necks) : lobes, x, y);
        // exact image sets from a dense sample
        const img = (on) => { const g = sampleGrid(reg(on), [-3, 3], [-1.6, 1.6], 360, 190), vals = []; for (let j = 0; j < g.M; j++) for (let i = 0; i < g.N; i++) if (g.a[j * g.N + i]) vals.push(F(g.cx(i), g.cy(j))); vals.sort((a, b) => a - b); const bars = []; let lo = vals[0], pr = vals[0]; for (const x of vals) { if (x - pr > 0.03) { bars.push([lo, pr]); lo = x; } pr = x; } bars.push([lo, pr]); return { bars, min: vals[0], max: vals[vals.length - 1] }; };
        const IM = { true: img(true), false: img(false) };
        const r = v.slider('level $r$', -3.2, 3.2, 0.3, { step: 0.01 });
        const A = v.stage({ x: [-3.1, 3.1], y: [-1.7, 1.7], equal: true, axes: false, height: 300, title: 'region $X$, shaded by $f$' });
        const B = v.stage({ x: [-3.3, 3.3], y: [-0.8, 0.9], axes: false, height: 300, title: 'image $f(X)\\subset\\R$' });
        let info = null;
        v.render(() => {
          const on = neck.value, I = IM[on], lv = r.value;
          A.raster((x, y) => {
            if (!reg(on)(x, y)) return null;
            const val = F(x, y), hit = Math.abs(val - lv) < 0.045, R0 = reg(on);
            if (!(R0(x + 0.035, y) && R0(x - 0.035, y) && R0(x, y + 0.035) && R0(x, y - 0.035))) return [...v.rgb('ink').slice(0, 3), 0.7];
            return hit ? [...v.rgb('gold').slice(0, 3), 1] : [...v.diverge(val / 3.2, 'blue', 'red'), 0.62];
          }, { key: [on, lv.toFixed(3)].join(), res: 3 });
          for (const [a, b] of I.bars) B.line(a, 0, b, 0, { color: 'accent', width: 9, cap: 'butt' });
          B.vline(lv, { color: 'gold', width: 2 });
          B.text('$r$', lv, 0.55, { align: 'center', color: 'gold', size: 13 });
          // axis ticks
          for (let k = -3; k <= 3; k++) { B.line(k, -0.25, k, -0.15, { color: 'muted', width: 1 }); B.text(String(k).replace('-', '−'), k, -0.5, { align: 'center', size: 10.5, color: 'muted' }); }
          const hit = I.bars.some(([a, b]) => lv >= a - 0.015 && lv <= b + 0.015);
          info = { hit, bars: I.bars.length, min: I.min, max: I.max, lv };
        });
        v.legend([['gold', 'points with $f=r$'], ['accent', 'the set $f(X)$']]);
        v.readout(() => {
          if (!info) return '';
          const { hit, bars, min, max, lv } = info, inside = lv >= min && lv <= max;
          return `$f(X)$ is ${bars === 1 ? 'one interval' : `**${bars} separate intervals**`} from $${v.fix(min, 2)}$ to $${v.fix(max, 2)}$ (image sampled on a $360\\times190$ grid). Level $r=${v.fix(lv, 2)}$: ${hit ? 'attained' : inside ? '**not attained — a skipped value between min and max**' : 'outside the range'}.${neck.value ? ' With $X$ connected nothing between the extremes is skipped.' : ''}`;
        });
      },
    },
    // ------------------------------------------------------------------ 3.5
    {
      num: '3.5',
      kind: 'Theorem',
      name: 'Unions and closures of connected sets',
      statement: String.raw`(a) If $\{A_\alpha\}$ is a family of connected subsets of $X$ and all of them contain a common point (more generally, if $\bigcap A_\alpha\ne\varnothing$, or if the family is linked by a chain of overlaps), then $\bigcup A_\alpha$ is connected.
(b) If $A\subset X$ is connected and $A\subset B\subset\overline A$, then $B$ is connected. In particular the closure $\overline A$ of a connected set is connected.`,
      idea: String.raw`(a) A separation $U,V$ of the union restricts to a separation of each $A_\alpha$ unless that $A_\alpha$ lies wholly in one piece; the common point lies in one piece, say $U$, so every $A_\alpha$ lies in $U$ and $V$ is empty. (b) If $B=C\cup D$ is a separation, the connected $A$ lies wholly in $C$, say; then $\overline A\supset B$ and $C$ is closed in $B$ with $D$ containing a point of $\overline A$ — whose every neighbourhood meets $A\subset C$, contradicting that $D$ is open and disjoint from $C$.`,
      caption: String.raw`Left mode: three connected sets — a segment, a triangle and a disc — all pass through the gold point $p$; the union is one piece. Slide the disc away and the union splits unless it still overlaps another set. Right mode: the graph of $\sin(1/x)$ is connected; adding any part of the vertical segment keeps it connected, because every neighbourhood of a limit point (drag the ball) still meets the curve.`,
      deps: ['top-3.1'],
      refs: ['Munkres §23'],
      tags: ['connectedness', 'closure'],
      viz(v) {
        const mode = v.select('picture', [{ value: 'u', label: 'unions through a point' }, { value: 'c', label: 'closure of the sine graph' }], 'u');
        const away = v.slider('slide the disc away', 0, 1.6, 0, { step: 0.01 });
        const keep = v.slider('limit points added: $y\\le$', -1, 1, 0.3, { step: 0.01 });
        const eps = v.slider('ball radius $\\varepsilon$', 0.03, 0.4, 0.18, { step: 0.005 });
        const S = v.stage({ x: [-2.6, 2.6], y: [-1.7, 1.7], equal: true, axes: false, height: 340 });
        const hp = S.handle(0, 0, { color: 'gold', label: 'p', r: 7 });
        const C = v.stage({ x: [-0.3, 1.1], y: [-1.4, 1.4], equal: true, axes: false, height: 340 });
        const hq = C.handle(0, 0.4, { color: 'gold', label: 'q', constrain: (x, y) => [0, clamp(y, -1, 1)] });
        let info = null;
        v.render(() => {
          const u = mode.value === 'u';
          S.el.style.display = u ? '' : 'none'; C.el.style.display = u ? 'none' : '';
          away.el.hidden = !u; keep.el.hidden = u; eps.el.hidden = u;
          if (u) {
            const p = [hp.x, hp.y];
            const A1 = { t: 'seg', p: [p[0] - 1.6, p[1] - 0.5], q: [p[0] + 1.3, p[1] + 0.7] };
            const T = [[p[0], p[1]], [p[0] - 0.9, p[1] + 1.0], [p[0] - 1.9, p[1] + 0.2]].map((q, i, a) => ({ t: 'seg', p: q, q: a[(i + 1) % 3] }));
            const A2 = T, ctr = [p[0] + 0.8 + away.value * 1.3, p[1] - 0.6 - away.value * 0.6], rad = Math.hypot(0.8, 0.6);
            const A3 = { t: 'disc', c: ctr, r: rad };
            const sets = [[A1], A2, [A3]], flat = [...sets[0], ...sets[1], ...sets[2]];
            const comp = shapeComponents(flat);
            const names = ['blue', 'orange', 'green'];
            S.circle(ctr[0], ctr[1], rad, { fill: 'green', fillAlpha: 0.18, color: 'green', width: 2 });
            S.line(A1.p[0], A1.p[1], A1.q[0], A1.q[1], { color: 'blue', width: 3.5 });
            for (const s2 of A2) S.line(s2.p[0], s2.p[1], s2.q[0], s2.q[1], { color: 'orange', width: 3.5 });
            S.dot(p[0], p[1], { r: 7, color: 'gold' });
            const inA3 = Math.abs(Math.hypot(p[0] - ctr[0], p[1] - ctr[1]) - rad) < 1e-6;
            info = { u, k: comp.k, shared: inA3 ? 3 : 2 };
          } else {
            const y0 = hq.y, e = eps.value, pts = sineArc(0.0007, 0.6, 14);
            C.path(pts, { color: 'blue', width: 2 });
            C.line(0, -1, 0, -1 + (keep.value + 1), { color: 'green', width: 5 });
            C.line(0, keep.value, 0, 1, { color: 'green', width: 5, dash: [2, 4], alpha: 0.5 });
            const ex = e, ey = e;
            C.circle(0, y0, e, { color: 'gold', width: 2, fill: 'gold', fillAlpha: 0.08 });
            // arcs of the curve inside the ball
            let arcs = 0, inside = false;
            for (const [x, y] of sineArc(0.0007, 0.6, 40)) { const inn = (x / ex) ** 2 + ((y - y0) / ey) ** 2 < 1; if (inn && !inside) arcs++; inside = inn; }
            C.dot(0, y0, { r: 6, color: 'gold' });
            info = { u, arcs, y0, in: y0 <= keep.value + 1e-9 };
          }
        });
        v.legend([['blue', 'the connected sets'], ['gold', 'common point / limit point', { dot: true }], ['green', 'added limit points']]);
        v.readout(() => {
          if (!info) return '';
          if (info.u) return `The three sets${info.shared === 3 ? ' share the point $p$' : ' no longer all contain $p$ (the disc has left it)'}; their union has **${info.k}** exact piece${info.k > 1 ? 's' : ''}. ${info.k === 1 ? 'A union of connected sets linked through overlaps is connected.' : 'With no point linking the disc to the rest, the union is disconnected — the common point is what the theorem needs.'}`;
          return `$A$ = graph of $\\sin(1/x)$, $x>0$. The ball about $q=(0,${v.fix(info.y0, 2)})$ meets the curve in at least **${info.arcs}** separate arcs, and shrinking it never helps: every neighbourhood of a point of the segment meets $A$, so no open set can contain $q$ while staying away from the curve. Hence $A\\cup(\\{0\\}\\times[-1,${v.fix(info.y0 <= 1 ? Math.max(keep.value, -1) : 1, 2)}])$, and the full closure, are connected.`;
        });
      },
    },
    // ------------------------------------------------------------------ 3.6
    {
      num: '3.6',
      kind: 'Theorem',
      name: 'Finite products of connected spaces are connected',
      statement: String.raw`If $X$ and $Y$ are connected spaces then $X\times Y$ (product topology) is connected. By induction every finite product $X_1\times\dots\times X_n$ of connected spaces is connected. Conversely $X\times Y$ is connected only if both factors are, as they are its continuous images under the projections.`,
      idea: String.raw`Fix a base point $(a,b)$. The horizontal slice $X\times\{b\}$ is homeomorphic to $X$, hence connected; each vertical slice $\{x\}\times Y$ is homeomorphic to $Y$, hence connected. Join them into the "cross" $T_x=(X\times\{b\})\cup(\{x\}\times Y)$: two connected sets with the common point $(x,b)$, connected by 3.5(a). All crosses contain $(a,b)$, so their union — which is all of $X\times Y$ — is connected by 3.5(a) again.`,
      caption: String.raw`Choose $X$ and $Y$ as subsets of the line (each one interval or two). Drag $(a,b)$ and slide $x_1$: the green line is $X\times\{b\}$, the orange lines are the vertical slices $\{x\}\times Y$ swept so far, and the cross $T_{x_1}$ is darker. With both factors intervals the crosses sweep the whole rectangle; with a disconnected factor the horizontal or vertical slice itself breaks and so does the product.`,
      deps: ['top-3.5', 'top-2.8'],
      refs: ['Munkres §23'],
      tags: ['connectedness', 'product'],
      viz(v) {
        const xs = v.select('$X$', [{ value: 1, label: 'one interval' }, { value: 2, label: 'two intervals' }], 1);
        const ys = v.select('$Y$', [{ value: 1, label: 'one interval' }, { value: 2, label: 'two intervals' }], 1);
        const sw = v.slider('sweep $x_1$', 0, 3, 3, { step: 0.01 });
        const S = v.stage({ x: [-0.3, 3.3], y: [-0.3, 3.3], axes: 'box', gutter: true, height: 340, xlabel: 'X', ylabel: 'Y' });
        const ivs = (n) => (n === 1 ? [[0, 3]] : [[0, 1.2], [1.8, 3]]);
        const snap = (n) => (val) => { let best = val, bd = 9; for (const [a, b] of ivs(n)) { const c = clamp(val, a, b); if (Math.abs(c - val) < bd) { bd = Math.abs(c - val); best = c; } } return best; };
        const hp = S.handle(0.6, 0.6, { color: 'gold', label: '(a,b)', constrain: (x, y) => [snap(+xs.value)(x), snap(+ys.value)(y)] });
        let info = null;
        v.render(() => {
          const X = ivs(+xs.value), Y = ivs(+ys.value), b = snap(+ys.value)(hp.y), a = snap(+xs.value)(hp.x);
          for (const [x0, x1] of X) for (const [y0, y1] of Y) S.rect(x0, y0, x1, y1, { fill: 'blue', fillAlpha: 0.1, color: 'blue', width: 1 });
          const x1 = snap(+xs.value)(sw.value);
          // vertical slices swept so far
          for (let k = 0; k <= 45; k++) { const x = (3 * k) / 45; if (x > sw.value) break; if (!X.some(([p, q]) => x >= p && x <= q)) continue; for (const [y0, y1] of Y) S.line(x, y0, x, y1, { color: 'orange', width: 1, alpha: 0.55 }); }
          for (const [p, q] of X) S.line(p, b, q, b, { color: 'green', width: 4, cap: 'butt' });
          for (const [y0, y1] of Y) S.line(x1, y0, x1, y1, { color: 'orange', width: 4, cap: 'butt' });
          S.dot(a, b, { r: 6, color: 'gold' });
          info = { nx: X.length, ny: Y.length, crossOne: X.length === 1 && Y.length === 1 };
        });
        v.legend([['green', 'horizontal slice $X\\times\\{b\\}$'], ['orange', 'vertical slices $\\{x\\}\\times Y$']]);
        v.readout(() => {
          if (!info) return '';
          const { nx, ny } = info;
          return `$X$ has ${nx} component${nx > 1 ? 's' : ''}, $Y$ has ${ny}; the product $X\\times Y$ has $${nx}\\cdot${ny}=$ **${nx * ny}** component${nx * ny > 1 ? 's' : ''} (each pair of components gives one rectangle). ${nx * ny === 1 ? 'Every cross $T_x$ is connected and contains $(a,b)$, and their union is the whole rectangle.' : 'A slice through a disconnected factor is itself disconnected, so the crosses are no longer connected and the argument — correctly — breaks.'}`;
        });
      },
    },
    // ------------------------------------------------------------------ 3.7
    {
      num: '3.7',
      kind: 'Definition',
      name: 'Path-connected spaces',
      statement: String.raw`A **path** in $X$ from $x$ to $y$ is a continuous map $\gamma\colon[0,1]\to X$ with $\gamma(0)=x$, $\gamma(1)=y$. The space $X$ is **path-connected** if every two points are joined by a path in $X$. Being joined by a path is an equivalence relation, whose classes are the path components (3.10).`,
      idea: String.raw`Reversing a path and concatenating two paths (traverse each at double speed) give symmetry and transitivity, so "joined by a path" is an equivalence relation. Path-connectedness is a notion of *reachability* and is usually easier to verify than connectedness (it only needs one path per pair), but it is stronger: 3.8 shows it implies connectedness and 3.9 that the converse fails.`,
      caption: String.raw`Pick a region and drag the endpoints $x,y$. The computed shortest path (pixel search through the region, then straightened) is drawn in green when one exists. In the annulus any two points can be joined; in the slit annulus the path must go the long way round; between two disjoint discs no path exists — it would have to leave the region.`,
      deps: ['top-3.1'],
      refs: ['Munkres §24'],
      tags: ['connectedness', 'paths'],
      viz(v) {
        const reg = v.select('region $X$', [{ value: 'ann', label: 'annulus' }, { value: 'slit', label: 'slit annulus' }, { value: 'two', label: 'two discs' }], 'ann');
        const IN = {
          ann: (x, y) => { const r = Math.hypot(x, y); return r > 0.85 && r < 1.9; },
          slit: (x, y) => { const r = Math.hypot(x, y); return r > 0.85 && r < 1.9 && !(x > 0 && Math.abs(y) < 0.07); },
          two: (x, y) => Math.hypot(x - 1.35, y) < 0.95 || Math.hypot(x + 1.35, y) < 0.95,
        };
        const G = {}; for (const k of Object.keys(IN)) G[k] = sampleGrid(IN[k], [-2.6, 2.6], [-2.2, 2.2], 150, 126);
        const S = v.stage({ x: [-2.6, 2.6], y: [-2.2, 2.2], equal: true, axes: false, height: 360 });
        const hx = S.handle(0, 1.4, { color: 'gold', label: 'x' }), hy = S.handle(0, -1.4, { color: 'gold', label: 'y' });
        let info = null;
        v.render(() => {
          const g = G[reg.value], f = IN[reg.value];
          S.raster((x, y) => (f(x, y) ? [...v.rgb('blue').slice(0, 3), 0.3] : null), { key: reg.value, res: 3 });
          const raw = gridPath(g, [hx.x, hx.y], [hy.x, hy.y]);
          if (raw) {
            const p = shortcut(raw, f);
            S.path(p, { color: 'green', width: 4 });
            let len = 0; for (let i = 1; i < p.length; i++) len += Math.hypot(p[i][0] - p[i - 1][0], p[i][1] - p[i - 1][1]);
            info = { ok: true, len, inx: f(hx.x, hx.y), iny: f(hy.x, hy.y) };
          } else {
            const inx = f(hx.x, hx.y), iny = f(hy.x, hy.y);
            if (inx && iny) S.line(hx.x, hx.y, hy.x, hy.y, { color: 'red', width: 2.5, dash: [6, 5] });
            info = { ok: false, inx, iny, dist: Math.hypot(hx.x - hy.x, hx.y - hy.y) };
          }
        });
        v.legend([['blue', 'the region $X$'], ['green', 'a path in $X$ from $x$ to $y$'], ['red', 'the straight segment (leaves $X$)', { dash: true }]]);
        v.readout(() => {
          if (!info) return '';
          if (info.ok) return `**Path found**, length $\\approx${v.fix(info.len, 2)}$ (the points are $${v.fix(Math.hypot(hx.x - hy.x, hx.y - hy.y), 2)}$ apart in a straight line). ${reg.value === 'slit' ? 'The slit forces a detour: $X$ is still path-connected.' : ''}`;
          if (!info.inx || !info.iny) return 'A handle sits outside the region: both endpoints must be points of $X$.';
          return `**No path inside $X$** — the endpoints lie in different path components (the straight segment, dashed, leaves $X$, and so does every other curve). $X$ is not path-connected.`;
        });
      },
    },
  ],
};
