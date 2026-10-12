// Rudin, Functional Analysis — Chapter 1: Topological Vector Spaces
// Part 1 of 6: normed spaces, the basic definitions, invariance, types of spaces, separation (1.2–1.12).

const TAU = 2 * Math.PI;
function circlePoly(cx, cy, r, n = 96) { const out = []; for (let i = 0; i < n; i++) { const t = TAU * i / n; out.push([cx + r * Math.cos(t), cy + r * Math.sin(t)]); } return out; }
function ellipsePoly(cx, cy, a, b, phi, n = 96) {
  const c = Math.cos(phi), s = Math.sin(phi), out = [];
  for (let i = 0; i < n; i++) { const t = TAU * i / n, u = a * Math.cos(t), w = b * Math.sin(t); out.push([cx + c * u - s * w, cy + s * u + c * w]); }
  return out;
}
function segDist(px, py, ax, ay, bx, by) {
  const ex = bx - ax, ey = by - ay, L = ex * ex + ey * ey || 1;
  let t = ((px - ax) * ex + (py - ay) * ey) / L; t = t < 0 ? 0 : t > 1 ? 1 : t;
  return Math.hypot(px - ax - t * ex, py - ay - t * ey);
}
function edgeDist(px, py, poly) { let d = Infinity; for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) d = Math.min(d, segDist(px, py, poly[j][0], poly[j][1], poly[i][0], poly[i][1])); return d; }
function inPoly(x, y, poly) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = poly[i][0], yi = poly[i][1], xj = poly[j][0], yj = poly[j][1];
    if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}
/** First exit distance of the ray t·(ux,uy), t > 0, from a polygon containing 0 (radial function of a star-shaped set). */
function rayExit(poly, ux, uy) {
  let best = Infinity;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const ax = poly[j][0], ay = poly[j][1], ex = poly[i][0] - ax, ey = poly[i][1] - ay;
    const den = ux * ey - uy * ex; if (Math.abs(den) < 1e-12) continue;
    const t = (ax * ey - ay * ex) / den, s = (ax * uy - ay * ux) / den;
    if (s >= -1e-9 && s <= 1 + 1e-9 && t > 1e-12 && t < best) best = t;
  }
  return best;
}
/** Minkowski functional of a polygon that is star-shaped about 0. */
function gaugePoly(poly, x, y) { const r = Math.hypot(x, y); if (r < 1e-15) return 0; return r / rayExit(poly, x / r, y / r); }
const pnorm = (x, y, p) => p === Infinity ? Math.max(Math.abs(x), Math.abs(y)) : Math.pow(Math.abs(x) ** p + Math.abs(y) ** p, 1 / p);
function isConvexPoly(poly) {
  let sgn = 0;
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i], b = poly[(i + 1) % poly.length], c = poly[(i + 2) % poly.length];
    const cr = (b[0] - a[0]) * (c[1] - b[1]) - (b[1] - a[1]) * (c[0] - b[0]);
    if (Math.abs(cr) < 1e-10) continue;
    if (!sgn) sgn = Math.sign(cr); else if (Math.sign(cr) !== sgn) return false;
  }
  return true;
}

export default {
  book: 'fa',
  chapter: 1,
  title: 'Topological Vector Spaces',
  summary: String.raw`A topological vector space is a vector space whose topology makes addition and scalar multiplication continuous. Rudin first extracts what this forces — separation of compact and closed sets by translates of one neighbourhood, the Hausdorff property, balanced and bounded neighbourhoods — and shows that a finite-dimensional space carries only one such topology while local compactness forces finite dimension. A countable local base yields an invariant metric; seminorms and Minkowski functionals describe exactly the locally convex spaces, and Kolmogorov's criterion says when a norm exists. Quotient spaces and the classical examples $C(\Omega)$, $H(\Omega)$, $C^\infty(\Omega)$, $\mathscr{D}_K$ and $L^p$ with $0<p<1$ close the chapter.`,
  items: [
    // ------------------------------------------------------------------ 1.2
    {
      num: '1.2',
      kind: 'Definition',
      name: 'Normed spaces and Banach spaces',
      statement: String.raw`A vector space $X$ is a **normed space** if every $x\in X$ is assigned a number $\norm{x}\ge 0$ such that
(a) $\norm{x+y}\le\norm{x}+\norm{y}$ for all $x,y$;
(b) $\norm{\alpha x}=\abs{\alpha}\,\norm{x}$ for every scalar $\alpha$;
(c) $\norm{x}>0$ whenever $x\ne 0$.
Then $d(x,y)=\norm{x-y}$ is a metric on $X$, with open balls $B(x,r)=\{y:\norm{y-x}<r\}$. A normed space that is complete in this metric is a **Banach space**.`,
      idea: String.raw`The norm metric has two features that the rest of the chapter abstracts: it is translation invariant, $d(x+z,y+z)=d(x,y)$, and its balls are convex and balanced with $B(0,r)=r\,B(0,1)$. So the scaled copies of a single convex bounded set form a local base — and Kolmogorov's theorem (1.39) shows that this property characterises normable spaces.`,
      caption: String.raw`Pick an $\ell^p$ norm on $\R^2$ and drag $x$ and $y$. The shaded set is the unit ball; the dashed curve is the sphere of radius $\norm{x}+\norm{y}$, and $x+y$ never leaves it. With $p=\tfrac12$ the formula is no longer a norm: its "ball" is not convex, and with $x$ and $y$ on different axes the readout catches the failure of (a).`,
      deps: [],
      see: ['rca-5.1'],
      tags: ['normed spaces', 'metric'],
      viz(v) {
        const P = v.select('$p$', [{ value: 1, label: '$1$' }, { value: 2, label: '$2$' }, { value: 4, label: '$4$' }, { value: Infinity, label: '$\\infty$' }, { value: 0.5, label: '$\\tfrac12$ (not a norm)' }], 2);
        const S = v.stage({ x: [-3, 3], y: [-2.1, 2.1], equal: true, height: 360 });
        const hx = S.handle(1.15, 0.2, { color: 'blue', label: 'x' });
        const hy = S.handle(0.15, 0.95, { color: 'purple', label: 'y' });
        let st = {};
        v.render(() => {
          const p = P.value;
          const zx = hx.x + hy.x, zy = hx.y + hy.y;
          const nx = pnorm(hx.x, hx.y, p), ny = pnorm(hy.x, hy.y, p), nz = pnorm(zx, zy, p);
          const ok = nz <= nx + ny + 1e-9;
          S.ball(0, 0, 1, { p, fill: 'accent', fillAlpha: 0.13, color: 'accent', width: 1.8 });
          S.ball(0, 0, nx + ny, { p, color: ok ? 'green' : 'red', width: 1.6, dash: [6, 5] });
          S.line(hx.x, hx.y, zx, zy, { color: 'faint', width: 1.2, dash: [3, 4] });
          S.line(hy.x, hy.y, zx, zy, { color: 'faint', width: 1.2, dash: [3, 4] });
          S.arrow(0, 0, hx.x, hx.y, { color: 'blue', width: 2 });
          S.arrow(0, 0, hy.x, hy.y, { color: 'purple', width: 2 });
          S.arrow(0, 0, zx, zy, { color: ok ? 'green' : 'red', width: 2.4 });
          S.dot(zx, zy, { color: ok ? 'green' : 'red', r: 5, label: 'x+y', labelPos: 'ne' });
          const u = p === Infinity ? 1 : Math.pow(0.5, 1 / p);
          S.tex('B(0,1)', -u, u, { color: 'accent', align: 'right', baseline: 'bottom', dx: -4, dy: -2, size: 14 });
          const R = nx + ny, w = p === Infinity ? R : R * Math.pow(0.5, 1 / p);
          S.tex('\\|x\\|+\\|y\\|', w, -w, { color: ok ? 'green' : 'red', align: 'left', baseline: 'top', dx: 4, dy: 2, size: 14 });
          if (!ok) S.corner('triangle inequality fails — not a norm', 'tl', { color: 'red', weight: 600 });
          st = { nx, ny, nz, ok, p };
        });
        v.readout(() => {
          const { nx, ny, nz, ok, p } = st; if (nx == null) return '';
          const P2 = p === Infinity ? '\\infty' : p === 0.5 ? '1/2' : String(p);
          return `$\\|x\\|_{${P2}} = ${v.fix(nx, 3)},\\ \\|y\\|_{${P2}} = ${v.fix(ny, 3)},\\ \\|x+y\\|_{${P2}} = ${v.fix(nz, 3)} ${ok ? '\\le' : '>'} ${v.fix(nx + ny, 3)}$` + (ok ? ' — (a) holds.' : ' — (a) fails.');
        });
      },
    },
    // ------------------------------------------------------------------ 1.4
    {
      num: '1.4',
      kind: 'Definition',
      name: 'Convex and balanced sets',
      statement: String.raw`Let $\Phi$ be the scalar field ($\R$ or $\C$). In a vector space $X$ over $\Phi$ one writes $x+A=\{x+a:a\in A\}$, $A+B=\{a+b:a\in A,\ b\in B\}$ and $\lambda A=\{\lambda a:a\in A\}$. A subset $Y$ is a **subspace** if it is a vector space under the same operations. A set $C\subset X$ is **convex** if $tC+(1-t)C\subset C$ for every $t\in[0,1]$. A set $B\subset X$ is **balanced** if $\alpha B\subset B$ for every $\alpha\in\Phi$ with $\abs{\alpha}\le 1$.`,
      idea: String.raw`Both notions are purely algebraic, but they become topological once neighbourhoods are required to have them: every TVS has a local base of balanced sets (1.14), and convex ones define local convexity (1.8). Over $\R$ a balanced set is exactly one that is symmetric and star-shaped about $0$; over $\C$ it must also be invariant under every rotation $x\mapsto e^{i\theta}x$, which is a much stronger requirement.`,
      caption: String.raw`Pick a set $S\subset\R^2$ and drag $x$ and $y$. The segment $[x,y]$ tests convexity. The orange set $\{\alpha x:\abs{\alpha}\le 1\}$ tests balance: over $\R$ it is the segment $[-x,x]$, over $\C$ (identify $\R^2$ with $\C$) it is the whole disc of radius $\abs{x}$. Pieces that leave $S$ turn red.`,
      deps: [],
      verify: true,
      tags: ['convexity', 'balanced sets'],
      viz(v) {
        const rot = (pts, a) => pts.map(([x, y]) => [x * Math.cos(a) - y * Math.sin(a), x * Math.sin(a) + y * Math.cos(a)]);
        const SH = {
          disc: { label: 'disc', poly: circlePoly(0, 0, 1.3, 120) },
          square: { label: 'square', poly: rot([[-1.05, -1.05], [1.05, -1.05], [1.05, 1.05], [-1.05, 1.05]], 0.35) },
          star: { label: 'star', poly: Array.from({ length: 8 }, (_, k) => { const r = k % 2 ? 0.5 : 1.65, t = k * Math.PI / 4 + 0.2; return [r * Math.cos(t), r * Math.sin(t)]; }) },
          tri: { label: 'triangle', poly: [[-1.25, -0.85], [1.7, -0.55], [0.05, 1.45]] },
          off: { label: 'shifted disc', poly: circlePoly(0.6, 0.3, 1.15, 120) },
        };
        for (const k in SH) {
          const P = SH[k].poly, rho = (t) => rayExit(P, Math.cos(t), Math.sin(t));
          let symR = true, symC = true; const r0 = rho(0);
          for (let i = 0; i < 90; i++) { const t = i * Math.PI / 90, a = rho(t), b = rho(t + Math.PI); if (Math.abs(a - b) > 1e-6 * a) symR = false; if (Math.abs(a - r0) > 1e-3 * r0) symC = false; }
          SH[k].convex = isConvexPoly(P); SH[k].balR = symR; SH[k].balC = symR && symC;
        }
        const which = v.select('$S$', Object.entries(SH).map(([value, o]) => ({ value, label: o.label })), 'star');
        const field = v.select('scalars', [{ value: 'R', label: '$\\R$' }, { value: 'C', label: '$\\C$' }], 'R');
        const S = v.stage({ x: [-2.6, 2.6], y: [-1.9, 1.9], equal: true, height: 360, ticks: false });
        const hx = S.handle(1.18, 0.24, { color: 'blue', label: 'x' });
        const hy = S.handle(-0.22, 1.1, { color: 'purple', label: 'y' });
        let st = {};
        const pieces = (pts, P) => { const ins = [], out = []; let cur = null, curIn = null; for (const q of pts) { const i = inPoly(q[0], q[1], P); if (i !== curIn) { if (cur) (curIn ? ins : out).push(cur); cur = cur ? [cur[cur.length - 1], q] : [q]; curIn = i; } else cur.push(q); } if (cur) (curIn ? ins : out).push(cur); return { ins, out }; };
        v.render(() => {
          const sh = SH[which.value], P = sh.poly;
          S.poly(P, { fill: 'accent', fillAlpha: 0.12, color: 'accent', width: 2 });
          // balance test for x
          const C = field.value === 'C';
          let balOK = true;
          if (C) {
            const r = Math.hypot(hx.x, hx.y);
            for (let i = 0; i < 64 && balOK; i++) for (let j = 1; j <= 6; j++) { const t = TAU * i / 64, q = r * j / 6; if (!inPoly(q * Math.cos(t), q * Math.sin(t), P)) { balOK = false; break; } }
            S.circle(0, 0, r, { fill: 'orange', fillAlpha: 0.14, color: 'orange', width: 1.4 });
            const circ = Array.from({ length: 241 }, (_, i) => [r * Math.cos(TAU * i / 240), r * Math.sin(TAU * i / 240)]);
            for (const seg of pieces(circ, P).out) S.path(seg, { color: 'red', width: 3.2 });
          } else {
            const seg = Array.from({ length: 121 }, (_, i) => { const a = -1 + 2 * i / 120; return [a * hx.x, a * hx.y]; });
            const pc = pieces(seg, P); balOK = pc.out.length === 0;
            for (const s2 of pc.ins) S.path(s2, { color: 'orange', width: 3.4 });
            for (const s2 of pc.out) S.path(s2, { color: 'red', width: 3.4 });
            S.dot(-hx.x, -hx.y, { color: 'orange', r: 4, label: '−x', labelPos: 'sw' });
          }
          // convexity test
          const seg = Array.from({ length: 121 }, (_, i) => [hx.x + (hy.x - hx.x) * i / 120, hx.y + (hy.y - hx.y) * i / 120]);
          const pc = pieces(seg, P); const convOK = pc.out.length === 0;
          for (const s2 of pc.ins) S.path(s2, { color: 'green', width: 2.6 });
          for (const s2 of pc.out) S.path(s2, { color: 'red', width: 2.6, dash: [5, 4] });
          S.dot(0, 0, { color: 'ink', r: 3 });
          const bal = C ? sh.balC : sh.balR;
          S.corner(`S is ${sh.convex ? 'convex' : 'not convex'} · ${bal ? 'balanced' : 'not balanced'} over ${C ? 'ℂ' : 'ℝ'}`, 'tl', { color: sh.convex && bal ? 'green' : 'muted', weight: 600 });
          const inX = inPoly(hx.x, hx.y, P), inY = inPoly(hy.x, hy.y, P);
          st = { convOK, balOK, inX, inY, C };
        });
        v.legend([['green', 'segment $[x,y]$'], ['orange', '$\\{\\alpha x : |\\alpha|\\le 1\\}$'], ['red', 'leaves $S$']]);
        v.readout(() => {
          const s = st; if (s.inX == null) return '';
          if (!s.inX || !s.inY) return 'Drag both $x$ and $y$ into $S$ to test it.';
          return `$[x,y]\\subset S$: ${s.convOK ? 'yes' : '**no** — this pair witnesses non-convexity'}. $\\;\\{\\alpha x:|\\alpha|\\le1,\\ \\alpha\\in${s.C ? '\\C' : '\\R'}\\}\\subset S$: ${s.balOK ? 'yes' : '**no** — $S$ is not balanced'}.`;
        });
      },
    },
    // ------------------------------------------------------------------ 1.6
    {
      num: '1.6',
      kind: 'Definition',
      name: 'Topological vector spaces; bounded sets',
      statement: String.raw`A **topological vector space** (TVS) is a vector space $X$ with a topology $\tau$ such that
(a) every one-point set $\{x\}$ is closed, and
(b) addition $X\times X\to X$ and scalar multiplication $\Phi\times X\to X$ are continuous.
Such a $\tau$ is called a **vector topology**. A set $E\subset X$ is **bounded** if for every neighbourhood $V$ of $0$ there is $s>0$ such that $E\subset tV$ for all $t>s$.`,
      idea: String.raw`Continuity of addition at $(0,0)$ says that every neighbourhood $W$ of $0$ contains $V+V$ for some neighbourhood $V$; continuity of scalar multiplication lets neighbourhoods be shrunk and stretched. Boundedness is defined through these dilations alone, with no metric in sight. In a normed space it is the familiar notion, but in a metric TVS it can differ from metric boundedness: the invariant metric $d/(1+d)$ makes every set metrically bounded.`,
      caption: String.raw`Choose a neighbourhood $V$ of $0$ and a set $E$, then stretch $V$ with the slider $t$ (the view zooms out with it). The readout computes $s=\sup_{x\in E}\mu_V(x)$, the smallest stretch that swallows $E$. A bounded $E$ lies in $tV$ for every $t>s$. A line through $0$ or a parabola always sticks out (red), however large $t$ is and however $V$ is shaped.`,
      deps: ['fa-1.4'],
      verify: true,
      tags: ['topological vector spaces', 'boundedness'],
      viz(v) {
        const Vsh = v.select('$V$', [{ value: 'disc', label: 'disc' }, { value: 'ell', label: 'thin ellipse' }, { value: 'sq', label: 'square' }], 'disc');
        const Esh = v.select('$E$', [{ value: 'blob', label: 'blob (bounded)' }, { value: 'line', label: 'line through 0' }, { value: 'par', label: 'parabola' }], 'blob');
        const t = v.slider('$t$', 0.5, 40, 5.5, { log: true, decimals: 2 });
        const S = v.stage({ x: [-4, 4], y: [-2.6, 2.6], equal: true, height: 370, ticks: false });
        const blob = v.M.blob(2.0, 1.1, 0.85, 7, 0.32, 140);
        const Vpoly = (k) => k === 'disc' ? circlePoly(0, 0, 0.45, 120) : k === 'ell' ? ellipsePoly(0, 0, 0.9, 0.16, 0.55, 140) : [[-0.4, -0.4], [0.4, -0.4], [0.4, 0.4], [-0.4, 0.4]];
        let st = {};
        v.render(() => {
          const V = Vpoly(Vsh.value), tt = t.value;
          const tV = V.map(([x, y]) => [tt * x, tt * y]);
          const ext = Math.max(...tV.map(([x, y]) => Math.max(Math.abs(x) / 1.55, Math.abs(y)))) * 1.18;
          const R = Math.max(2.6, ext);
          S.setView([-R * 1.55, R * 1.55], [-R, R]);
          const b = S.bounds;
          S.poly(tV, { fill: 'orange', fillAlpha: 0.13, color: 'orange', width: 1.8 });
          S.poly(V, { fill: 'orange', fillAlpha: 0.35, color: 'orange', width: 1.2 });
          S.tex('V', 0, 0, { color: 'orange', size: 13, dx: 10, dy: -10 });
          const lft = tV.reduce((a, q) => (q[0] < a[0] ? q : a), [1e9, 0]);
          S.tex('tV', lft[0], lft[1], { color: 'orange', align: 'right', dx: -6 });
          let s = 0, out = false, far = null;
          const mu = (x, y) => gaugePoly(V, x, y);
          if (Esh.value === 'blob') {
            for (const [x, y] of blob) s = Math.max(s, mu(x, y));
            out = s >= tt;
            S.poly(blob, { fill: 'blue', fillAlpha: 0.22, color: 'blue', width: 2 });
            if (out) {
              const c = S.ctx; c.save(); c.beginPath();
              c.rect(0, 0, S.width, S.height);
              tV.forEach(([x, y], i) => (i ? c.lineTo(S.X(x), S.Y(y)) : c.moveTo(S.X(x), S.Y(y)))); c.closePath();
              c.clip('evenodd');
              S.poly(blob, { fill: 'red', fillAlpha: 0.55, color: 'red', width: 2.4 });
              c.restore();
            }
            S.tex('E', 2.0, 1.1, { color: 'blue', size: 17 });
          } else {
            const pts = [];
            const L = Math.max(b.x[1], b.y[1]) * 1.6;
            for (let i = 0; i <= 600; i++) {
              const u = -L + 2 * L * i / 600;
              pts.push(Esh.value === 'line' ? [u * 0.96, u * 0.28 + 0.0] : [u, 0.35 * u * u - 0.9]);
            }
            s = Infinity; out = true;
            let cur = [], curOut = null;
            const flush = () => { if (cur.length > 1) S.path(cur, { color: curOut ? 'red' : 'blue', width: curOut ? 3 : 2.4 }); };
            for (const q of pts) { const o = mu(q[0], q[1]) >= tt; if (o !== curOut) { flush(); cur = cur.length ? [cur[cur.length - 1]] : []; curOut = o; } cur.push(q); }
            flush();
            far = pts.find((q) => mu(q[0], q[1]) >= tt && Math.abs(q[0]) < b.x[1] && Math.abs(q[1]) < b.y[1]);
            if (far) S.dot(far[0], far[1], { color: 'red', r: 5, label: 'outside tV', labelPos: 'se', math: false, labelSize: 12 });
            const lab = Esh.value === 'line' ? [b.x[1] * 0.8, b.x[1] * 0.8 * 0.28 / 0.96] : [0, -0.9];
            S.tex('E', lab[0], lab[1], { color: 'blue', size: 17, dy: -14 });
          }
          S.dot(0, 0, { color: 'ink', r: 3 });
          st = { s, out, tt, bounded: Esh.value === 'blob' };
        });
        v.legend([['orange', '$V$ and $tV$', { area: true }], ['blue', '$E$'], ['red', '$E\\setminus tV$']]);
        v.readout(() => {
          const { s, out, tt, bounded } = st; if (s == null) return '';
          if (bounded) return `$s=\\sup_{x\\in E}\\mu_V(x) = ${v.fix(s, 3)}$, $\\ t = ${v.fix(tt, 2)}$: ` + (out ? 'part of $E$ is still outside $tV$ — keep stretching.' : '$E\\subset tV$, and the same holds for every larger $t$: $E$ is **bounded**.');
          return `$t = ${v.fix(tt, 2)}$: $E\\not\\subset tV$ — and no $t$ helps, because $\\mu_V$ is unbounded on $E$. $E$ is **not bounded**.`;
        });
      },
    },
    // ------------------------------------------------------------------ 1.7
    {
      num: '1.7',
      kind: 'Proposition',
      name: 'Translations and dilations are homeomorphisms',
      statement: String.raw`Let $X$ be a TVS. For $a\in X$ and a scalar $\lambda\ne 0$, the translation $T_a x=a+x$ and the multiplication $M_\lambda x=\lambda x$ are homeomorphisms of $X$ onto $X$.

Consequently every vector topology is **translation invariant**: $E$ is open if and only if each translate $a+E$ is open. It is therefore determined by any **local base** — a family $\mathscr B$ of neighbourhoods of $0$ such that every neighbourhood of $0$ contains a member of $\mathscr B$ — and the open sets are exactly the unions of translates $x+V$ with $V\in\mathscr B$.`,
      idea: String.raw`$T_a$ and $M_\lambda$ are bijections with inverses $T_{-a}$ and $M_{1/\lambda}$, and all four maps are continuous because addition and scalar multiplication are. Hence a set $G$ is open iff for each $x\in G$ the set $G-x$ is a neighbourhood of $0$, i.e. iff some $V\in\mathscr B$ satisfies $x+V\subset G$.`,
      caption: String.raw`Left: an open set $G$ and a local base $V_n=(0.8)^n U$ made of shrinking copies of one shape $U$. Drag $x$: the green translate $x+V_n$ is the largest member that fits ($x+V_{n-1}$, dashed, does not). The faint translates at other points show $G$ as a union of translates. Right: after $M_\lambda$ and $T_a$ the image of $x+V_n$ is again a neighbourhood of the image point and contains a translated base member.`,
      deps: ['fa-1.6'],
      verify: true,
      tags: ['topological vector spaces', 'local base'],
      viz(v) {
        const M = v.M;
        const Ush = v.select('base shape $U$', [{ value: 'disc', label: 'disc' }, { value: 'sq', label: 'square' }, { value: 'ell', label: 'slanted ellipse' }], 'disc');
        const lam = v.slider('$\\lambda$', 0.35, 1.6, 0.8, { step: 0.01 });
        const L = v.stage({ x: [-2.4, 2.4], y: [-2, 2], equal: true, height: 330, ticks: false, title: 'in $X$: $x+V_n\\subset G$' });
        const R = v.stage({ x: [-2.4, 2.4], y: [-2, 2], equal: true, height: 330, ticks: false, title: 'after $T_a M_\\lambda$: image of $G$ and of $x+V_n$' });
        const G = M.blob(0, 0, 1.35, 11, 0.38, 160);
        const hx = L.handle(0.55, 0.35, { color: 'accent', label: 'x' });
        const ha = R.handle(0.4, -0.2, { color: 'gray', label: 'a', r: 6 });
        const U = (k) => k === 'disc' ? circlePoly(0, 0, 1, 72) : k === 'sq' ? [[-0.8, -0.8], [0.8, -0.8], [0.8, 0.8], [-0.8, 0.8]] : ellipsePoly(0, 0, 1.3, 0.45, 0.7, 72);
        const fits = (cx, cy, poly, s) => poly.every(([x, y]) => inPoly(cx + s * x, cy + s * y, G)) && inPoly(cx, cy, G);
        const firstFit = (cx, cy, poly) => { for (let n = 0; n < 40; n++) if (fits(cx, cy, poly, Math.pow(0.8, n))) return n; return null; };
        const rng = M.rng(5); const samples = []; while (samples.length < 18) { const p = [rng.uniform(-1.9, 1.9), rng.uniform(-1.9, 1.9)]; if (inPoly(p[0], p[1], G)) samples.push(p); }
        let st = {};
        v.render(() => {
          const u = U(Ush.value);
          L.poly(G, { fill: 'accent', fillAlpha: 0.08, color: 'accent', width: 1.6, dash: [6, 4] });
          L.tex('G', -1.05, 1.0, { color: 'accent', size: 17 });
          for (const [px, py] of samples) { const n = firstFit(px, py, u); if (n == null) continue; const s = Math.pow(0.8, n); L.poly(u.map(([a, b]) => [px + s * a, py + s * b]), { color: 'green', width: 0.8, alpha: 0.3 }); L.dot(px, py, { color: 'green', r: 1.6, alpha: 0.6 }); }
          const inside = inPoly(hx.x, hx.y, G);
          const n = inside ? firstFit(hx.x, hx.y, u) : null;
          if (n != null) {
            const s = Math.pow(0.8, n), s0 = s / 0.8;
            L.poly(u.map(([a, b]) => [hx.x + s0 * a, hx.y + s0 * b]), { color: 'red', width: 1.4, dash: [4, 4] });
            L.poly(u.map(([a, b]) => [hx.x + s * a, hx.y + s * b]), { fill: 'green', fillAlpha: 0.22, color: 'green', width: 2 });
          }
          // right panel: image under x -> lambda x + a
          const l = lam.value, ax = ha.x, ay = ha.y, f = ([x, y]) => [l * x + ax, l * y + ay];
          R.poly(G.map(f), { fill: 'accent', fillAlpha: 0.08, color: 'accent', width: 1.6, dash: [6, 4] });
          R.arrow(0, 0, ax, ay, { color: 'gray', width: 1.4, head: 7 });
          R.dot(0, 0, { color: 'ink', r: 2.5 });
          const fx = f([hx.x, hx.y]);
          let m = null;
          if (n != null) {
            const s = Math.pow(0.8, n);
            R.poly(u.map(([a, b]) => f([hx.x + s * a, hx.y + s * b])), { fill: 'orange', fillAlpha: 0.2, color: 'orange', width: 2 });
            m = n + 1 + Math.ceil(Math.log(l) / Math.log(0.8) - 1e-9); m = Math.max(0, m);
            const sm = Math.pow(0.8, m);
            R.poly(u.map(([a, b]) => [fx[0] + sm * a, fx[1] + sm * b]), { fill: 'green', fillAlpha: 0.25, color: 'green', width: 1.6 });
            R.poly(u.map(([a, b]) => f([hx.x + s * a, hx.y + s * b])), { color: 'orange', width: 2.2 });
          }
          R.dot(fx[0], fx[1], { color: 'accent', r: 5, label: 'λx+a', labelPos: 'ne' });
          L.dot(0, 0, { color: 'ink', r: 2.5 });
          if (!inside) L.corner('drag x into G', 'tl', { color: 'red', weight: 600 });
          st = { n, m, l, inside };
        });
        v.legend([['green', 'translated base member', { area: true }], ['orange', 'image $\\lambda(x+V_n)+a$', { area: true }], ['red', '$x+V_{n-1}$ (too big)', { dash: true }]]);
        v.readout(() => {
          const { n, m, l } = st; if (n == null) return '';
          return `$x+V_{${n}}\\subset G$ but $x+V_{${n - 1}}\\not\\subset G$. After the homeomorphism: $\\lambda(x+V_{${n}})+a = (\\lambda x+a)+${v.fix(l, 2)}\\,V_{${n}} \\supset (\\lambda x+a)+V_{${m}}$ — images of open sets are open.`;
        });
      },
    },
    // ------------------------------------------------------------------ 1.8
    {
      num: '1.8',
      kind: 'Definition',
      name: 'Types of topological vector spaces',
      statement: String.raw`Let $X$ be a TVS with topology $\tau$.
- $X$ is **locally convex** if it has a local base whose members are convex.
- $X$ is **locally bounded** if $0$ has a bounded neighbourhood.
- $X$ is **locally compact** if $0$ has a neighbourhood with compact closure.
- $X$ is **metrizable** if $\tau$ is induced by some metric $d$.
- $X$ is an **F-space** if $\tau$ is induced by a complete invariant metric.
- $X$ is a **Fréchet space** if it is a locally convex F-space.
- $X$ is **normable** if $\tau$ is induced by some norm; normed and Banach spaces are as in 1.2.
- $X$ has the **Heine–Borel property** if every closed and bounded subset of $X$ is compact.`,
      idea: String.raw`These properties are tied together by the theorems of the chapter: locally bounded spaces have a countable local base and are therefore metrizable (1.15, 1.24); normable means locally convex and locally bounded (1.39); local compactness, or the Heine–Borel property in a locally bounded space, forces finite dimension (1.22, 1.23).`,
      caption: String.raw`Pick a space. Green boxes are properties it has, grey boxes properties it lacks; arrows are implications proved in this chapter (a joined arrow needs both of its sources). Every arrow that leaves a green box lands on a green box — and the examples show that no arrow can be reversed for free.`,
      deps: ['fa-1.2', 'fa-1.4', 'fa-1.6'],
      tags: ['topological vector spaces', 'classification'],
      viz(v) {
        const EX = {
          Rn: { label: '$\\R^n$', p: 'fd lc lb lk met F Fr nor Ban HB', note: 'Finite-dimensional: every property holds, and by 1.21 there is only one vector topology.' },
          l2: { label: '$\\ell^2$', p: 'lc lb met F Fr nor Ban', note: 'A Hilbert (hence Banach) space. Its closed unit ball is bounded but not compact (1.22).' },
          c00: { label: '$c_{00}$', p: 'lc lb met nor', note: 'Finitely supported sequences with the sup norm: normable but not complete, so not an F-space (compare 1.27).' },
          C: { label: '$C(\\Omega)$', p: 'lc met F Fr', note: 'Uniform convergence on compacta (1.44): Fréchet, not locally bounded, no Heine–Borel property.' },
          H: { label: '$H(\\Omega)$', p: 'lc met F Fr HB', note: 'Holomorphic functions (1.45): Fréchet with the Heine–Borel property (Montel) — so by 1.23 not locally bounded.' },
          Cinf: { label: '$C^\\infty(\\Omega)$', p: 'lc met F Fr HB', note: 'Smooth functions with all derivatives on compacta (1.46): Fréchet with the Heine–Borel property, not normable.' },
          Lp: { label: '$L^p,\\ 0<p<1$', p: 'lb met F', note: 'Locally bounded F-space (1.47) that is not locally convex — its only convex open sets are $\\emptyset$ and $L^p$.' },
          D: { label: '$\\mathscr D(\\Omega)$', p: 'lc HB', note: 'Test functions with the inductive-limit topology (Chapter 6): locally convex with the Heine–Borel property, but not metrizable.' },
        };
        const which = v.select('space', Object.entries(EX).map(([value, o]) => ({ value, label: o.label })), 'C');
        const S = v.stage({ x: [0, 12], y: [0, 6.4], height: 360, axes: false });
        const N = {
          Ban: [2.0, 5.5, 'Banach'], fd: [9.6, 5.5, 'finite-dimensional'],
          Fr: [1.25, 3.95, 'Fréchet'], nor: [5.05, 3.95, 'normable'], lk: [7.6, 3.95, 'locally compact'], HB: [10.6, 3.95, 'Heine–Borel'],
          F: [1.25, 2.35, 'F-space'], lc: [3.55, 2.35, 'locally convex'], lb: [6.55, 2.35, 'locally bounded'],
          met: [3.1, 0.75, 'metrizable'],
        };
        const HW = 1.05, HH = 0.32;
        const edge = (a, b) => { const [x1, y1] = N[a], [x2, y2] = N[b]; const dx = x2 - x1, dy = y2 - y1; const t1 = Math.min(HW / Math.abs(dx || 1e-9), HH / Math.abs(dy || 1e-9)); return [x1 + dx * t1, y1 + dy * t1, x2 - dx * t1, y2 - dy * t1]; };
        const E1 = [['Ban', 'Fr', ''], ['Ban', 'nor', ''], ['Fr', 'F', ''], ['Fr', 'lc', ''], ['F', 'met', ''], ['nor', 'lc', ''], ['nor', 'lb', ''], ['lb', 'met', '1.24'], ['fd', 'lk', ''], ['fd', 'HB', ''], ['lk', 'fd', '1.22'], ['fd', 'nor', '1.21']];
        const J = [[['lc', 'lb'], 'nor', [5.05, 2.35], '1.39'], [['lb', 'HB'], 'fd', [9.0, 3.05], '1.23']];
        v.render(() => {
          const ex = EX[which.value], has = new Set(ex.p.split(' '));
          const arrowCol = (ok) => (ok ? 'green' : 'faint');
          for (const [a, b, lab] of E1) {
            if (a === 'lk' && b === 'fd') { const [x1, y1, x2, y2] = edge(a, b); S.arrow(x1 + 0.08, y1, x2 + 0.08, y2, { color: arrowCol(has.has(a)), width: 1.6, head: 8 }); S.text(lab, (x1 + x2) / 2 + 0.3, (y1 + y2) / 2, { size: 10.5, color: 'muted' }); continue; }
            if (a === 'fd' && b === 'lk') { const [x1, y1, x2, y2] = edge(a, b); S.arrow(x1 - 0.08, y1, x2 - 0.08, y2, { color: arrowCol(has.has(a)), width: 1.6, head: 8 }); continue; }
            const [x1, y1, x2, y2] = edge(a, b);
            S.arrow(x1, y1, x2, y2, { color: arrowCol(has.has(a)), width: 1.6, head: 8 });
            if (lab) S.text(lab, (x1 + x2) / 2, (y1 + y2) / 2, { size: 10.5, color: 'muted', dx: 6, dy: -8 });
          }
          for (const [[a, b], to, [jx, jy], lab] of J) {
            const ok = has.has(a) && has.has(b);
            for (const s of [a, b]) { const [x, y] = N[s]; const dx = jx - x, dy = jy - y, t1 = Math.min(HW / Math.abs(dx || 1e-9), HH / Math.abs(dy || 1e-9)); S.line(x + dx * t1, y + dy * t1, jx, jy, { color: arrowCol(ok), width: 1.6 }); }
            const [tx, ty] = N[to]; const dx = tx - jx, dy = ty - jy; const t1 = Math.min(HW / Math.abs(dx || 1e-9), HH / Math.abs(dy || 1e-9));
            S.arrow(jx, jy, tx - dx * t1, ty - dy * t1, { color: arrowCol(ok), width: 1.6, head: 8 });
            S.dot(jx, jy, { color: arrowCol(ok), r: 3.5 });
            S.text(lab, jx, jy, { size: 10.5, color: 'muted', dx: lab === '1.39' ? -6 : 8, dy: lab === '1.39' ? -12 : 4, align: lab === '1.39' ? 'right' : 'left' });
          }
          for (const [k, [x, y, lab]] of Object.entries(N)) {
            const on = has.has(k);
            S.rect(x - HW, y - HH, x + HW, y + HH, { fill: on ? 'green' : 'panel', fillAlpha: on ? 0.16 : 1, color: on ? 'green' : 'faint', width: on ? 1.8 : 1.1 });
            S.text(lab, x, y, { align: 'center', size: 12.5, color: on ? 'ink' : 'muted', weight: on ? 600 : 500 });
          }
        });
        v.readout(() => EX[which.value].note);
      },
    },
    // ------------------------------------------------------------------ 1.10
    {
      num: '1.10',
      kind: 'Theorem',
      name: 'Compact and closed sets are separated by a neighbourhood',
      statement: String.raw`Let $K$ and $C$ be subsets of a topological vector space $X$ such that $K$ is compact, $C$ is closed, and $K\cap C=\emptyset$. Then $0$ has a neighbourhood $V$ with
$$(K+V)\cap(C+V)=\emptyset .$$`,
      idea: String.raw`A preliminary lemma: continuity of addition gives, for every neighbourhood $W$ of $0$, a symmetric neighbourhood $U$ with $U+U+U\subset W$. For each $x\in K$ the open set $X\setminus C$ contains $x$, so some symmetric $V_x$ has $(x+V_x+V_x+V_x)\cap C=\emptyset$, i.e. $(x+V_x+V_x)\cap(C+V_x)=\emptyset$. Compactness picks finitely many $x_i$ with $K\subset\bigcup(x_i+V_{x_i})$, and the intersection of the $V_{x_i}$ is the required $V$. Without compactness the $V_x$ may shrink to nothing.`,
      caption: String.raw`Drag the compact disc $K$ and change the radius $r$ of the ball $V$. Blue is $K+V$, red is $C+V$ around the closed set $C$ (the region under the wave together with the island). They are disjoint exactly when $r\le\tfrac12\dist(K,C)$, which is positive because $K$ is compact. Switch to the closed but non-compact $K=\{(x,1/x):x>0\}$ and $C=\{y\le 0\}$: now $\dist(K,C)=0$, and every $V$ produces an overlap (dark red), which moves further out as $r$ shrinks.`,
      deps: ['fa-1.6', 'fa-1.7'],
      tags: ['separation', 'compactness'],
      viz(v) {
        const mode = v.select('', [{ value: 'cpt', label: '$K$ compact' }, { value: 'hyp', label: '$K$ closed, not compact' }], 'cpt');
        const rS = v.slider('radius $r$ of $V$', 0.05, 1.0, 0.3, { step: 0.01 });
        const S = v.stage({ x: [-3.8, 3.8], y: [-1.6, 2.2], equal: true, height: 380 });
        const k = S.handle(-1.2, 0.85, { color: 'blue', label: 'K' });
        const rhoK = 0.55;
        const wave = (x) => -0.75 + 0.32 * Math.sin(1.6 * x + 0.4);
        const IS = [2.3, 1.2, 0.5];
        function dWave(px, py, n = 48, R = 1.7) {
          if (py <= wave(px)) return 0;
          let d = py - wave(px);
          for (let i = 0; i <= n; i++) { const x = px - R + 2 * R * i / n; d = Math.min(d, Math.hypot(px - x, py - wave(x))); }
          return d;
        }
        const dC = (px, py, n) => Math.min(dWave(px, py, n), Math.max(0, Math.hypot(px - IS[0], py - IS[1]) - IS[2]));
        function dHyp(px, py) {
          let d = Infinity;
          for (let i = 0; i <= 160; i++) { const x = Math.exp(Math.log(0.04) + (Math.log(60) - Math.log(0.04)) * i / 160); d = Math.min(d, Math.hypot(px - x, py - 1 / x)); }
          return d;
        }
        let last = null, st = {};
        v.render(() => {
          const r = rS.value, cpt = mode.value === 'cpt';
          if (last !== mode.value) { last = mode.value; if (cpt) S.setView([-3.8, 3.8], [-1.6, 2.2]); else S.setView([-0.8, 8.2], [-1.3, 3.2]); k.visible = cpt; }
          const red = v.rgb('red'), blue = v.rgb('blue'), dark = v.rgb('red');
          if (cpt) {
            const kx = k.x, ky = k.y, R = rhoK + r;
            S.raster((x, y) => {
              const inC = dC(x, y) < r, inK = Math.hypot(x - kx, y - ky) < R;
              if (inC && inK) return [dark[0] * 0.75, dark[1] * 0.4, dark[2] * 0.45, 210];
              if (inC) return [red[0], red[1], red[2], 40];
              if (inK) return [blue[0], blue[1], blue[2], 45];
              return null;
            }, { res: 2, key: `${r}|${kx}|${ky}|${red}|${blue}` });
            // C itself
            const top = []; for (let i = 0; i <= 200; i++) { const x = -12 + 24 * i / 200; top.push([x, wave(x)]); }
            S.poly(top.concat([[12, -30], [-12, -30]]), { fill: 'red', fillAlpha: 0.32, color: 'red', width: 2 });
            S.circle(IS[0], IS[1], IS[2], { fill: 'red', fillAlpha: 0.32, color: 'red', width: 2 });
            S.circle(kx, ky, R, { color: 'blue', width: 1.2, dash: [4, 4] });
            S.circle(kx, ky, rhoK, { fill: 'blue', fillAlpha: 0.35, color: 'blue', width: 2 });
            S.tex('C', 2.3, 1.2, { color: 'red', size: 17 });
            S.tex('C', 3.2, -1.25, { color: 'red', size: 17 });
            // distance and witness
            let best = Infinity, bp = null;
            for (let i = 0; i <= 720; i++) { const t = TAU * i / 720, px = kx + rhoK * Math.cos(t), py = ky + rhoK * Math.sin(t); const d = dC(px, py, 240); if (d < best) { best = d; bp = [px, py]; } }
            const dist = Math.max(0, best);
            // V drawn at the top-left corner for scale
            const b = S.bounds, vx = b.x[0] + 0.25 + r, vy = b.y[1] - 0.25 - r;
            S.circle(vx, vy, r, { fill: 'orange', fillAlpha: 0.3, color: 'orange', width: 1.6 });
            S.tex('V', vx + r, vy, { color: 'orange', align: 'left', dx: 6 });
            const ok = dist > 0 && r <= dist / 2;
            S.corner(dist <= 0 ? 'K meets C — hypotheses fail' : ok ? '(K+V) ∩ (C+V) = ∅' : 'V too large: the sets overlap', 'tr', { color: dist <= 0 ? 'red' : ok ? 'green' : 'red', weight: 600 });
            st = { cpt, dist, r, ok };
          } else {
            S.raster((x, y) => {
              const inC = y < r, inK = x > 0 && dHyp(x, y) < r;
              if (inC && inK) return [dark[0] * 0.75, dark[1] * 0.4, dark[2] * 0.45, 210];
              if (inC) return [red[0], red[1], red[2], 40];
              if (inK) return [blue[0], blue[1], blue[2], 45];
              return null;
            }, { res: 2, key: `h${r}|${red}|${blue}` });
            S.poly([[-50, 0], [50, 0], [50, -50], [-50, -50]], { fill: 'red', fillAlpha: 0.32, color: 'red', width: 2 });
            S.fn((x) => 1 / x, { domain: [0.2, 60], color: 'blue', width: 2.6 });
            S.tex('K=\\{y=1/x\\}', 4.6, 1.05, { color: 'blue', align: 'left', size: 15 });
            S.circle(7.6, 2.55, r, { fill: 'orange', fillAlpha: 0.3, color: 'orange', width: 1.6 });
            S.tex('V', 7.6 - r, 2.55, { color: 'orange', align: 'right', dx: -6 });
            S.tex('C=\\{y\\le 0\\}', 7.6, -0.75, { color: 'red', size: 15 });
            const x0 = 1 / (2 * r);
            if (x0 < 8.2) { S.vline(x0, { color: 'red', dash: [3, 4], width: 1 }); S.text('overlap from x ≈ 1/(2r)', x0, 2.9, { size: 11.5, color: 'red', dx: 4, align: 'left' }); }
            S.corner('no V works: dist(K, C) = 0', 'bl', { color: 'red', weight: 600 });
            st = { cpt, r, x0 };
          }
        });
        v.legend([['blue', '$K+V$', { area: true }], ['red', '$C+V$', { area: true }], [v.mix('red', 'ink', 0.35), 'overlap', { area: true }], ['orange', '$V$ (to scale)', { area: true }]]);
        v.readout(() => {
          const s = st; if (s.r == null) return '';
          if (s.cpt) return `$\\dist(K,C) = ${v.fix(s.dist, 3)}$, so every $r\\le ${v.fix(s.dist / 2, 3)}$ works; $\\;r = ${v.fix(s.r, 2)}$ ` + (s.ok ? '— separated.' : '— too large.');
          return `$r=${v.fix(s.r, 2)}$: the point $(x,1/x)\\in K$ and $(x,0)\\in C$ are within $2r$ once $x>${v.fix(s.x0, 2)}$, so $K+V$ and $C+V$ meet. Compactness is what rules this out.`;
        });
      },
    },
    // ------------------------------------------------------------------ 1.11
    {
      num: '1.11',
      kind: 'Theorem',
      name: 'Members of a local base contain closures of members',
      statement: String.raw`If $\mathscr B$ is a local base for a topological vector space $X$, then every member of $\mathscr B$ contains the closure of some member of $\mathscr B$.`,
      idea: String.raw`Take $W\in\mathscr B$ and apply 1.10 with $K=\{0\}$ and $C=X\setminus W$: there is a neighbourhood of $0$, which may be shrunk to a member $V\in\mathscr B$, with $V\cap(C+V)=\emptyset$. Since $C+V$ is open and misses $V$, it also misses $\overline V$; in particular $\overline V\cap C=\emptyset$, i.e. $\overline V\subset W$.`,
      caption: String.raw`Drag the vertices of the open neighbourhood $W$ of $0$ and grow the base member $V=rB$ (choose the shape $B$). Red is $C=X\setminus W$; pink is the thickening $C+V$. As long as $r\le\tfrac12\delta$, where $\delta$ is the $B$-distance from $0$ to $C$, the ball $V$ misses $C+V$ and the closed ball $\overline V$ (solid outline) sits inside $W$.`,
      deps: ['fa-1.10'],
      verify: true,
      tags: ['separation', 'local base'],
      viz(v) {
        const M = v.M;
        const B = v.select('shape $B$', [{ value: 2, label: 'disc' }, { value: Infinity, label: 'square' }, { value: 1, label: 'diamond' }], 2);
        const rS = v.slider('$r$', 0.05, 1.4, 0.35, { step: 0.01 });
        const S = v.stage({ x: [-2.8, 2.8], y: [-1.9, 1.9], equal: true, height: 370, ticks: false });
        const init = [[1.7, 0.1], [0.9, 1.35], [-0.55, 0.65], [-1.7, 1.15], [-1.5, -0.9], [0.35, -1.45]];
        const H = init.map(([x, y]) => S.handle(x, y, { color: 'accent', r: 6 }));
        const gdist = (px, py, ax, ay, bx, by, p) => {
          let lo = 0, hi = 1;
          const f = (t) => pnorm(px - ax - t * (bx - ax), py - ay - t * (by - ay), p);
          for (let i = 0; i < 28; i++) { const m1 = lo + (hi - lo) / 3, m2 = hi - (hi - lo) / 3; if (f(m1) < f(m2)) hi = m2; else lo = m1; }
          return f((lo + hi) / 2);
        };
        const dBdry = (px, py, W, p) => { let d = Infinity; for (let i = 0, j = W.length - 1; i < W.length; j = i++) d = Math.min(d, p === 2 ? segDist(px, py, W[j][0], W[j][1], W[i][0], W[i][1]) : gdist(px, py, W[j][0], W[j][1], W[i][0], W[i][1], p)); return d; };
        let st = {};
        v.render(() => {
          const W = H.map((h) => [h.x, h.y]), p = B.value, r = rS.value;
          const red = v.rgb('red');
          S.raster((x, y) => {
            if (!inPoly(x, y, W)) return [red[0], red[1], red[2], 70];
            if (dBdry(x, y, W, p) < r) return [red[0], red[1], red[2], 30];
            return null;
          }, { res: p === 2 ? 2 : 3, key: `${W.flat().join()}|${p}|${r}|${red}` });
          S.poly(W, { color: 'accent', width: 1.8, dash: [6, 4], fill: 'accent', fillAlpha: 0.06 });
          const zeroIn = inPoly(0, 0, W);
          const delta = zeroIn ? dBdry(0, 0, W, p) : 0;
          const ok = zeroIn && r <= delta / 2 + 1e-12, closedIn = zeroIn && r < delta;
          S.ball(0, 0, r, { p, fill: 'blue', fillAlpha: 0.22, stroke: false });
          S.ball(0, 0, r, { p, color: ok ? 'green' : closedIn ? 'orange' : 'red', width: 2.4 });
          if (zeroIn) S.ball(0, 0, delta / 2, { p, color: 'green', width: 1, dash: [3, 4] });
          S.dot(0, 0, { color: 'ink', r: 3 });
          S.tex('W', W[0][0], W[0][1], { color: 'accent', dx: 16, size: 16 });
          S.tex('C=X\\setminus W', S.bounds.x[1], S.bounds.y[1], { color: 'red', align: 'right', baseline: 'top', dx: -10, dy: 8 });
          S.tex('\\overline{V}', r * 0.72, r * 0.72, { color: ok ? 'green' : 'ink', align: 'left', baseline: 'bottom', dx: 4, dy: -2, size: 14 });
          st = { zeroIn, delta, r, ok, closedIn };
        });
        v.legend([['red', '$C$', { area: true }], [v.mix('red', 'panel', 0.55), '$C+V$', { area: true }], ['blue', '$V=rB$', { area: true }], ['green', 'radius $\\delta/2$', { dash: true }]]);
        v.readout(() => {
          const s = st; if (s.r == null) return '';
          if (!s.zeroIn) return 'Move the vertices so that $W$ contains $0$.';
          return `$\\delta = ${v.fix(s.delta, 3)}$, $r = ${v.fix(s.r, 3)}$: ` + (s.ok ? '$V\\cap(C+V)=\\emptyset$, hence $\\overline V\\subset W$.' : s.closedIn ? '$V$ now meets $C+V$; $\\overline V\\subset W$ still holds here, but the argument no longer certifies it.' : '$\\overline V$ reaches $C$.');
        });
      },
    },
    // ------------------------------------------------------------------ 1.12
    {
      num: '1.12',
      kind: 'Theorem',
      name: 'Every topological vector space is Hausdorff',
      statement: String.raw`Every topological vector space $X$ is a Hausdorff space: if $x\ne y$ there are neighbourhoods of $x$ and of $y$ that do not intersect.`,
      idea: String.raw`Apply 1.10 with $K=\{x\}$ and $C=\{y\}$: a point is compact, and $\{y\}$ is closed by axiom (a) of 1.6. This gives a neighbourhood $V$ of $0$ with $(x+V)\cap(y+V)=\emptyset$. The axiom that points are closed is essential: a topology defined by a single seminorm has continuous operations but is not Hausdorff.`,
      caption: String.raw`Drag $x$ and $y$. With a norm topology the neighbourhoods $x+V$ and $y+V$ — the largest $V$ of the chosen shape that works — separate them. Switch to the topology of the seminorm $p(z)=\abs{z_1}$, where axiom (a) fails: neighbourhoods are vertical strips, the closure of $\{x\}$ is the whole vertical line through $x$, and points on the same vertical line cannot be separated.`,
      deps: ['fa-1.10', 'fa-1.6'],
      verify: true,
      tags: ['separation', 'Hausdorff'],
      viz(v) {
        const topo = v.select('topology', [{ value: 'norm', label: 'norm (points closed)' }, { value: 'semi', label: 'seminorm $|z_1|$' }], 'norm');
        const shape = v.select('shape of $V$', [{ value: 2, label: 'disc' }, { value: Infinity, label: 'square' }, { value: 1, label: 'diamond' }], 2);
        const S = v.stage({ x: [-3, 3], y: [-1.9, 1.9], equal: true, height: 350, ticks: false });
        const hx = S.handle(-0.9, -0.35, { color: 'blue', label: 'x' });
        const hy = S.handle(0.7, 0.6, { color: 'purple', label: 'y' });
        v.button('put $y$ above $x$', () => { hy.set(hx.x, hx.y + 1.1); });
        let st = {};
        v.render(() => {
          const p = shape.value;
          if (topo.value === 'norm') {
            const d = pnorm(hx.x - hy.x, hx.y - hy.y, p), r = d / 2 * 0.97;
            S.ball(hx.x, hx.y, r, { p, fill: 'blue', fillAlpha: 0.18, color: 'blue', width: 1.8 });
            S.ball(hy.x, hy.y, r, { p, fill: 'purple', fillAlpha: 0.18, color: 'purple', width: 1.8 });
            S.tex('x+V', hx.x, hx.y - r, { color: 'blue', baseline: 'top', dy: 4, size: 14 });
            S.tex('y+V', hy.x, hy.y + r, { color: 'purple', baseline: 'bottom', dy: -4, size: 14 });
            S.corner(d > 1e-9 ? 'separated: (x+V) ∩ (y+V) = ∅' : 'x = y', 'tl', { color: 'green', weight: 600 });
            st = { norm: true, d };
          } else {
            const gap = Math.abs(hx.x - hy.x), r = Math.max(0.04, gap / 2 * 0.97);
            const b = S.bounds;
            const strip = (cx, col) => S.rect(cx - r, b.y[0] - 1, cx + r, b.y[1] + 1, { fill: col, fillAlpha: 0.14, color: col, width: 1.2, dash: [5, 4] });
            strip(hx.x, 'blue'); strip(hy.x, 'purple');
            S.vline(hx.x, { color: 'blue', width: 2.2, alpha: 0.7 });
            S.vline(hy.x, { color: 'purple', width: 2.2, alpha: 0.7 });
            S.text('closure of {x}', hx.x, b.y[0] + 0.25, { size: 11.5, color: 'blue', dx: 6, align: 'left' });
            const sep = gap > 0.06;
            S.corner(sep ? 'strips of width < |x₁ − y₁| separate' : 'x₁ = y₁: every pair of neighbourhoods meets', 'tl', { color: sep ? 'green' : 'red', weight: 600 });
            st = { norm: false, gap };
          }
        });
        v.readout(() => {
          const s = st; if (s.norm == null) return '';
          if (s.norm) return `$d = ${v.fix(s.d, 3)}$: any $V$ of radius $<d/2$ gives disjoint neighbourhoods — the space is Hausdorff.`;
          return `$|x_1-y_1| = ${v.fix(s.gap, 3)}$. The seminorm $|z_1|$ vanishes on the vertical axis, so $\\overline{\\{0\\}} = \\{0\\}\\times\\R$: points are not closed, and points on one vertical line are inseparable.`;
        });
      },
    },
  ],
};
