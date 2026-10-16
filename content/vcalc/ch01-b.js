// Vector Calculus — Chapter 1: Vectors, curves and the geometry of space
// Part 2 (1.7–1.11): parametrized curves, arc length, curvature, Newton's second law along a path.
// (1.10, the Frenet–Serret formulas, is cross-listed from the dg collection.)
import {
  tn, tf, tup, add3, sub3, mul3, dot3, cross3, norm3, unit3, derivs, frenet, sample, circle3, arc3,
} from './ch01.shared.js';

const DEG = Math.PI / 180, TAU = 2 * Math.PI;

export default {
  collection: 'vcalc',
  chapter: 1,
  items: [
    // ------------------------------------------------------------------ 1.7
    {
      num: '1.7',
      kind: 'Definition',
      name: 'Parametrized curves, velocity and speed',
      statement: String.raw`A **parametrized curve** in $\R^3$ is a continuous map $\mathbf c:[a,b]\to\R^3$, $t\mapsto(x(t),y(t),z(t))$; think of $t$ as time and $\mathbf c(t)$ as the position of a moving point. If the components are differentiable, the **velocity** is $\mathbf c'(t)=(x'(t),y'(t),z'(t))$, the **speed** is $|\mathbf c'(t)|$, and when $\mathbf c'(t)\neq 0$ the velocity is tangent to the path. A **reparametrization** $\tilde{\mathbf c}=\mathbf c\circ\varphi$ by a differentiable increasing bijection $\varphi$ traces the same set in the same direction, with velocity $\tilde{\mathbf c}'(\tau)=\varphi'(\tau)\,\mathbf c'(\varphi(\tau))$: the direction is unchanged and the speed is multiplied by $\varphi'$. (With $\varphi'<0$ the direction is reversed.)`,
      idea: String.raw`Velocity is the limit of the chord vectors $(\mathbf c(t+h)-\mathbf c(t))/h$, taken componentwise, so it is tangent to the path when it is non-zero — the chords become secant lines that settle onto the tangent line. The reparametrization rule is the chain rule applied to each component. A path is a set with a direction; a parametrization is a *schedule* for travelling along it, and different schedules give different speeds on the same path.`,
      caption: String.raw`Press play: the gold point runs along the curve and the arrow is its velocity, drawn at a fixed scale. Below, the speed $|\mathbf c'|$ is plotted against time for the original schedule (grey) and for the reparametrization you choose (colour). Under $\tau\mapsto\tau^2$ the point starts from rest and ends fast, under the smooth ease it starts and ends gently, under *reversed* it runs backwards. The traced path never changes, and the readout confirms that the total length travelled is the same for every schedule.`,
      deps: ['pma-5.16', 'pma-6.26'],
      refs: ['Marsden–Tromba §2.4'],
      tags: ['curves', 'velocity', 'reparametrization'],
      credit: 'Lissajous figures: J. A. Lissajous, 1857 (earlier studied by N. Bowditch, 1815)',
      viz(v) {
        const M = v.M;
        const CV = {
          helix: { f: (t) => [Math.cos(t), Math.sin(t), 0.12 * (t - TAU)], t: [0, 2 * TAU], view: [-0.6, 0.42] },
          liss: { f: (t) => [1.4 * Math.sin(3 * t + 0.8), 1.1 * Math.sin(2 * t), 0], t: [0, TAU], view: [0, 1.4] },
          trefoil: { f: (t) => [0.5 * (Math.sin(t) + 2 * Math.sin(2 * t)), 0.5 * (Math.cos(t) - 2 * Math.cos(2 * t)), -0.5 * Math.sin(3 * t)], t: [0, TAU], view: [-0.5, 0.7] },
        };
        const PH = {
          id: { f: (u) => u, label: '$\\tau$ (original)' },
          quad: { f: (u) => u * u, label: '$\\tau^2$' },
          ease: { f: (u) => u * u * (3 - 2 * u), label: 'smooth ease' },
          rev: { f: (u) => 1 - u, label: 'reversed $1-\\tau$' },
        };
        const cur = v.select('curve', [{ value: 'helix', label: 'helix' }, { value: 'liss', label: 'Lissajous' }, { value: 'trefoil', label: 'trefoil knot' }], 'helix', { onChange: () => { const c = CV[cur.value]; sc.yaw = c.view[0]; sc.pitch = c.view[1] + (cur.value === 'liss' ? 0.1 : 0); } });
        const rep = v.select('schedule', Object.entries(PH).map(([value, p]) => ({ value, label: p.label })), 'ease');
        const S = v.stage({ x: [-1.8, 1.8], y: [-1.55, 1.55], equal: true, axes: false, height: 400, weight: 1.15 });
        const sc = v.scene3(S, { yaw: -0.6, pitch: 0.42, axis: 1.45, lim: 1.5, hint: true });
        const G = v.stage({ x: [0, 1], y: [0, 1], axes: 'box', gutter: true, height: 400, weight: 0.9, xlabel: 'time τ', ylabel: 'speed |c′|', title: 'speed against time' });
        let st = null;
        const q = (c, ph) => (u) => c.f(c.t[0] + (c.t[1] - c.t[0]) * ph.f(u));
        const spd = (qq, u) => { const h = 1e-5, a = qq(u - h), b = qq(u + h); return norm3(sub3(b, a)) / (2 * h); };
        v.animate((time) => {
          const c = CV[cur.value], ph = PH[rep.value], q1 = q(c, PH.id), q2 = q(c, ph);
          const u = (time / 6) % 1, p = q2(u);
          const vel = derivs(q2, M.clamp(u, 1e-4, 1 - 1e-4), 1e-5).v, sp = norm3(vel);
          const L1 = M.integrate((x) => spd(q1, x), 0, 1, 600), L2 = M.integrate((x) => spd(q2, x), 0, 1, 600);
          const k = 0.9 / (L1 || 1), done = sample((x) => q2(x), 0, u, 80);
          sc.begin();
          sc.path(sample((x) => q1(x), 0, 1, 220), { color: 'faint', width: 1.4 });
          sc.path(done, { color: 'accent', width: 2.6 });
          sc.arrow(p, add3(p, mul3(vel, k)), { color: 'orange', width: 2.8 });
          sc.dot(p, { r: 6, color: 'gold' });
          sc.flush();
          const N = 160, us = Array.from({ length: N + 1 }, (_, i) => i / N), s1 = us.map((x) => spd(q1, x)), s2 = us.map((x) => spd(q2, x));
          const ymax = Math.max(...s1, ...s2) * 1.12;
          G.setView([0, 1], [0, ymax]);
          G.path(us.map((x, i) => [x, s1[i]]), { color: 'muted', width: 1.6, dash: true });
          G.path(us.map((x, i) => [x, s2[i]]), { color: 'orange', width: 2.4 });
          G.vline(u, { color: 'faint' });
          G.dot(u, sp, { color: 'gold', r: 6 });
          st = { L1, L2, sp, u, vel };
        }, { period: 6, still: 2.2 });
        v.legend([['accent', 'path travelled so far'], ['orange', 'velocity $\\mathbf c\'$'], ['muted', 'original speed', { dash: true }]]);
        v.readout(() => `Speed now: $${tf(st.sp, 3)}$ at $\\tau=${tf(st.u, 2)}$. Length of the path travelled in total: original schedule $${tf(st.L1, 4)}$, chosen schedule $${tf(st.L2, 4)}$ (the integral $\\int_0^1|\\mathbf c'|\\,d\\tau$ does not depend on the schedule).`);
      },
    },
    // ------------------------------------------------------------------ 1.8
    {
      num: '1.8',
      kind: 'Theorem',
      name: 'Arc length as the integral of speed',
      statement: String.raw`Let $\mathbf c:[a,b]\to\R^3$ be continuously differentiable. The lengths $\sum_i|\mathbf c(t_i)-\mathbf c(t_{i-1})|$ of inscribed polygons, over all partitions $a=t_0<\dots<t_n=b$, have a finite supremum (the curve is **rectifiable**), and this supremum — the **arc length** — equals $\displaystyle\int_a^b|\mathbf c'(t)|\,dt$. The polygon lengths increase to this value as the partition is refined, and the value does not depend on the parametrization. Continuity of $\mathbf c$ alone is not enough: there are continuous curves, such as the Koch curve, whose polygon lengths grow without bound.`,
      idea: String.raw`Each chord is $\mathbf c(t_i)-\mathbf c(t_{i-1})=\int_{t_{i-1}}^{t_i}\mathbf c'$, and the length of an integral of a vector is at most the integral of its length, so every polygon is at most $\int|\mathbf c'|$. Conversely, $\mathbf c'$ is uniformly continuous on $[a,b]$, so on a fine partition it hardly varies within a subinterval and the chord is almost $|\mathbf c'(t_i)|\,\Delta t_i$; the sum of these is a Riemann sum for $\int|\mathbf c'|$. Together the two bounds squeeze the supremum onto the integral (Rudin 6.27 in the one-dimensional-integral language of Chapter 6).`,
      caption: String.raw`Choose a smooth curve and slide $N$, the number of equal parameter steps: the polygon with $N$ chords hugs the curve and its length (left panel curve, right panel graph) rises towards the dashed line — the integral of the speed, which for the cycloid, the ellipse and the parabola can be checked against a known value. Then switch to the **Koch curve**, which is continuous but has no tangent anywhere: each time $N$ is multiplied by $4$ the polygon is $\tfrac43$ times longer, and the graph never levels off.`,
      deps: ['vcalc-1.7', 'pma-6.27'],
      refs: ['Marsden–Tromba §4.2'],
      tags: ['arc length', 'rectifiable', 'polygons'],
      credit: 'H. von Koch, 1904 (a continuous curve without tangents)',
      viz(v) {
        const M = v.M, S3 = Math.sqrt(3);
        // Koch curve on [0,1] from (-2,-0.7) to (2,-0.7) via the 4-map IFS in complex form
        const kochPt = (t) => {
          if (t <= 0) return [0, 0]; if (t >= 1) return [1, 0];
          const d = []; let x = t;
          for (let i = 0; i < 12; i++) { x *= 4; const k = Math.min(3, Math.floor(x)); d.push(k); x -= k; }
          let re = 0, im = 0;
          for (let i = d.length - 1; i >= 0; i--) {
            let r, m;
            if (d[i] === 0) { r = re / 3; m = im / 3; }
            else if (d[i] === 1) { r = (0.5 * re - (S3 / 2) * im) / 3 + 1 / 3; m = ((S3 / 2) * re + 0.5 * im) / 3; }
            else if (d[i] === 2) { r = (0.5 * re + (S3 / 2) * im) / 3 + 0.5; m = (-(S3 / 2) * re + 0.5 * im) / 3 + S3 / 6; }
            else { r = re / 3 + 2 / 3; m = im / 3; }
            re = r; im = m;
          }
          return [re, im];
        };
        const a = 1.8, b = 1.0, mEll = 1 - (b * b) / (a * a);
        const CV = {
          cyc: { name: 'cycloid arch', f: (u) => { const t = u * TAU; return [t - Math.sin(t) - Math.PI, 1 - Math.cos(t) - 1]; }, sp: (u) => 2 * Math.abs(Math.sin(u * Math.PI)) * TAU, exact: 8, exactTex: '8R=8', view: [[-3.5, 3.5], [-1.5, 1.5]] },
          ell: { name: 'ellipse', f: (u) => [a * Math.cos(u * TAU), b * Math.sin(u * TAU)], sp: (u) => TAU * Math.hypot(a * Math.sin(u * TAU), b * Math.cos(u * TAU)), exact: 4 * a * M.ellipE(mEll), exactTex: '4a\\,E(e^2)', view: [[-2.6, 2.6], [-1.6, 1.6]] },
          par: { name: 'parabola $y=x^2$', f: (u) => { const x = -1.4 + 2.8 * u; return [x, x * x - 1]; }, sp: (u) => 2.8 * Math.sqrt(1 + 4 * (-1.4 + 2.8 * u) ** 2), exact: 1.4 * Math.sqrt(1 + 4 * 1.96) + 0.5 * Math.asinh(2.8), exactTex: 'x\\sqrt{1+4x^2}+\\tfrac12\\operatorname{arsinh}2x', view: [[-2.4, 2.4], [-1.5, 1.5]] },
          koch: { name: 'Koch curve', f: (u) => { const p = kochPt(u); return [-2 + 4 * p[0], -0.8 + 4 * p[1]]; }, sp: null, exact: null, view: [[-2.5, 2.5], [-1.5, 1.5]] },
        };
        const cur = v.select('curve', Object.entries(CV).map(([value, c]) => ({ value, label: c.name })), 'ell');
        const N = v.slider('$N$ chords', 1, 1024, 8, { int: true, log: true });
        const S = v.stage({ x: [-2.6, 2.6], y: [-1.6, 1.6], equal: true, axes: false, height: 360, weight: 1.15 });
        const G = v.stage({ x: [1, 1024], y: [0, 1], xlog: true, axes: 'box', gutter: true, height: 360, weight: 1, xlabel: 'number of chords N', ylabel: 'length of polygon', title: 'inscribed polygon length' });
        const cache = {};
        const polyLen = (c, n) => { let L = 0, p = c.f(0); for (let i = 1; i <= n; i++) { const q = c.f(i / n); L += Math.hypot(q[0] - p[0], q[1] - p[1]); p = q; } return L; };
        const Ns = [1, 2, 3, 4, 6, 8, 12, 16, 24, 32, 48, 64, 96, 128, 192, 256, 384, 512, 768, 1024];
        let st = null;
        v.render(() => {
          const key = cur.value, c = CV[key], n = N.value;
          const [xr, yr] = c.view; S.setView(xr, yr);
          if (!cache[key]) cache[key] = { Ls: Ns.map((m) => polyLen(c, m)), L: c.sp ? M.integrate(c.sp, 0, 1, 4000) : null };
          const { Ls, L } = cache[key];
          const nn = Math.min(n, key === 'koch' ? 1024 : 1024);
          S.path(sample((u) => c.f(u), 0, 1, key === 'koch' ? 1500 : 400).map((p) => p), { color: 'faint', width: 4, alpha: 0.5 });
          const poly = Array.from({ length: nn + 1 }, (_, i) => c.f(i / nn));
          S.path(poly, { color: 'accent', width: 1.8 });
          if (nn <= 64) S.dots(poly, { r: 3, color: 'gold' });
          const Ln = polyLen(c, nn);
          const ymax = key === 'koch' ? Math.max(...Ls) * 1.08 : L * 1.12;
          G.setView([1, 1024], [0, ymax]);
          G.path(Ns.map((m, i) => [m, Ls[i]]), { color: 'accent', width: 1.8 });
          if (L) G.hline(L, { color: 'green', dash: true });
          G.dot(nn, Ln, { color: 'gold', r: 6 });
          st = { Ln, L, nn, key, k: Math.log(nn) / Math.log(4) };
        });
        v.readout(() => {
          const { Ln, L, nn, key } = st;
          if (key === 'koch') return `With $N=${nn}$ chords the polygon has length $${tf(Ln, 3)}$. At $N=4^k$ it is exactly $4\\,(4/3)^k$ ($k=${tf(st.k, 2)}$): it keeps growing, so the Koch curve has **no** finite length — there is no velocity $\\mathbf c'$ to integrate.`;
          const ex = CV[key].exact;
          return `Polygon with $N=${nn}$: $${tf(Ln, 5)}$. Integral of the speed, $\\int_a^b|\\mathbf c'|\\,dt=${tf(L, 5)}$${ex ? `; closed form $${tf(ex, 5)}$` : ''}. Gap $${v.sci(Math.abs(L - Ln) + 1e-300, 2)}$ — the polygon is always shorter and the gap closes like $1/N^2$.`;
        });
      },
    },
    // ------------------------------------------------------------------ 1.9
    {
      num: '1.9',
      kind: 'Definition',
      name: 'Curvature and the osculating circle',
      statement: String.raw`For a regular $C^2$ curve $\mathbf c$ the **unit tangent** is $\mathbf T=\mathbf c'/|\mathbf c'|$ and the **curvature** is the rate at which it turns per unit length of path, $\kappa=\bigl|d\mathbf T/ds\bigr|=\dfrac{|\mathbf c'\times\mathbf c''|}{|\mathbf c'|^3}$. Where $\kappa\neq0$, the **unit normal** is $\mathbf N=(d\mathbf T/ds)/\kappa$ and the **osculating circle** is the circle of radius $1/\kappa$ and centre $\mathbf c+\mathbf N/\kappa$, lying in the plane of $\mathbf T$ and $\mathbf N$. It is the circle that touches the curve to second order. For a plane curve one may use the signed curvature $\kappa_s=(x'y''-y'x'')/|\mathbf c'|^3$, which changes sign at an inflection point, where the osculating circle jumps to the other side and degenerates to the tangent line ($\kappa=0$).`,
      idea: String.raw`Since $|\mathbf T|=1$, $\mathbf T'\perp\mathbf T$, so $d\mathbf T/ds=\kappa\mathbf N$ defines $\kappa$ and $\mathbf N$. Differentiating $\mathbf c'=|\mathbf c'|\mathbf T$ gives $\mathbf c''=|\mathbf c'|'\mathbf T+|\mathbf c'|^2\kappa\mathbf N$, hence $\mathbf c'\times\mathbf c''=|\mathbf c'|^3\kappa\,\mathbf T\times\mathbf N$ and the formula. A circle of radius $R$ has $\kappa=1/R$ (the tangent turns through $2\pi$ over arc length $2\pi R$), and the osculating circle is the one with the same position, tangent and curvature as the curve at the point. It is also the limit of the circles through three nearby points of the curve (Leibniz, 1686).`,
      caption: String.raw`Slide $t$ (or drag the gold point) along the curve. The frame $\mathbf T$ (blue), $\mathbf N$ (red), $\mathbf B=\mathbf T\times\mathbf N$ (green) rides along, together with the osculating circle, and the right panel plots the curvature. The dashed gold circle is the circle through the three curve points at $t-h$, $t$, $t+h$: shrink $h$ and its radius converges to $1/\kappa$. On the cubic, slide through the inflection point: $\kappa$ crosses zero, the circle becomes a line and re-forms on the other side. For the space curves, view the plane of the circle from the side and also read the torsion $\tau$.`,
      deps: ['vcalc-1.8'],
      refs: ['Marsden–Tromba §4.2'],
      tags: ['curvature', 'osculating circle', 'Frenet frame'],
      credit: 'Leibniz, “Meditatio nova de natura anguli contactus”, Acta Eruditorum, June 1686',
      viz(v) {
        const M = v.M;
        const CV = {
          cubic: { name: 'cubic', planar: true, f: (t) => [t, 0.9 * (t ** 3 - t), 0], t: [-1.35, 1.35], view: [0.0, 1.38], ex: (t) => { const y1 = 0.9 * (3 * t * t - 1), y2 = 5.4 * t; return Math.abs(y2) / (1 + y1 * y1) ** 1.5; } },
          ell: { name: 'ellipse', planar: true, f: (t) => [1.6 * Math.cos(t), 1.0 * Math.sin(t), 0], t: [0, TAU], view: [0.0, 1.38], ex: (t) => 1.6 / (1.6 * 1.6 * Math.sin(t) ** 2 + Math.cos(t) ** 2) ** 1.5 },
          spiral: { name: 'spiral', planar: true, f: (t) => { const r = 0.12 + 0.11 * t; return [r * Math.cos(t), r * Math.sin(t), 0]; }, t: [0, 4 * Math.PI], view: [0.0, 1.38], ex: null },
          helix: { name: 'helix', planar: false, f: (t) => [Math.cos(t), Math.sin(t), 0.12 * (t - TAU)], t: [0, 2 * TAU], view: [-0.7, 0.4], ex: () => 1 / (1 + 0.0144) },
          trefoil: { name: 'trefoil', planar: false, f: (t) => [0.5 * (Math.sin(t) + 2 * Math.sin(2 * t)), 0.5 * (Math.cos(t) - 2 * Math.cos(2 * t)), -0.5 * Math.sin(3 * t)], t: [0, TAU], view: [-0.5, 0.75], ex: null },
        };
        let tcur = 0.9, guard = false;
        const cur = v.select('curve', Object.entries(CV).map(([value, c]) => ({ value, label: c.name })), 'ell', { onChange: () => { const c = CV[cur.value]; sc.yaw = c.view[0]; sc.pitch = c.view[1]; tcur = c.t[0] + 0.3 * (c.t[1] - c.t[0]); tsl.set(0.3); hp.set(c.f(tcur)); } });
        const tsl = v.slider('position along the curve', 0, 1, 0.3, { step: 0.001, onChange: (x) => { if (guard) return; const c = CV[cur.value]; tcur = c.t[0] + x * (c.t[1] - c.t[0]); hp.set(c.f(tcur)); } });
        const hh = v.slider('$h$ (three-point circle)', 0.02, 1.2, 0.6, { step: 0.01 });
        const S = v.stage({ x: [-2.6, 2.6], y: [-2.2, 2.2], equal: true, axes: false, height: 420, weight: 1.25 });
        const sc = v.scene3(S, { yaw: 0, pitch: 1.38, axis: 1.6, lim: 3 });
        const G = v.stage({ x: [0, 1], y: [-1, 1], axes: 'box', gutter: true, height: 420, weight: 0.8, xlabel: 'parameter t', ylabel: 'κ (and τ for space curves)', title: 'curvature along the curve', minWidth: 250 });
        const nearest = (c, p) => {
          let best = c.t[0], bd = Infinity;
          for (let i = 0; i <= 600; i++) { const t = c.t[0] + ((c.t[1] - c.t[0]) * i) / 600, d = norm3(sub3(c.f(t), p)); if (d < bd) { bd = d; best = t; } }
          return best;
        };
        const hp = sc.handle(CV.ell.f(CV.ell.t[0] + 0.3 * TAU), { color: 'gold', label: '', lim: 3, snap: (p) => { const c = CV[cur.value]; tcur = nearest(c, p); guard = true; tsl.set((tcur - c.t[0]) / (c.t[1] - c.t[0])); guard = false; return c.f(tcur); } });
        tcur = CV.ell.t[0] + 0.3 * TAU; hp.set(CV.ell.f(tcur));
        const inBox = (p) => Math.abs(p[0]) < 2.25 && Math.abs(p[1]) < 1.85 && Math.abs(p[2]) < 1.85;
        const drawPts = (pts, st) => { let seg = []; for (const p of pts) { if (inBox(p)) seg.push(p); else { if (seg.length > 1) sc.path(seg, st); seg = []; } } if (seg.length > 1) sc.path(seg, st); };
        let cacheKey = null, curv = null;
        let st = null;
        v.render(() => {
          const c = CV[cur.value], f = c.f;
          if (cacheKey !== cur.value) {
            cacheKey = cur.value; curv = [];
            const n = 240;
            for (let i = 0; i <= n; i++) {
              const t = c.t[0] + ((c.t[1] - c.t[0]) * i) / n, F = frenet(f, t, 1e-3);
              const sgn = c.planar ? Math.sign(cross3(F.v, F.a)[2]) || 1 : 1;
              let tau = 0;
              if (!c.planar) { const h2 = 0.02, r3 = (x) => derivs(f, x, h2).a, jerk = mul3(sub3(r3(t + h2), r3(t - h2)), 1 / (2 * h2)), cr = cross3(F.v, F.a); tau = dot3(cr, jerk) / (dot3(cr, cr) || 1); }
              curv.push([t, sgn * F.kappa, tau]);
            }
          }
          const t = tcur, F = frenet(f, t, 1e-3), p = F.p;
          const sgn = c.planar ? (Math.sign(cross3(F.v, F.a)[2]) || 1) : 1, ks = sgn * F.kappa;
          let N = F.N, B = F.B;
          if (c.planar) { N = [-F.T[1], F.T[0], 0]; B = [0, 0, 1]; N = F.kappa > 1e-6 ? mul3(N, sgn) : [-F.T[1], F.T[0], 0]; B = cross3(F.T, N); }
          sc.begin();
          sc.path(sample(f, c.t[0], c.t[1], 300), { color: 'ink', width: 2.2, alpha: 0.85 });
          const reg = F.kappa > 0.02;
          if (reg) {
            const R = 1 / F.kappa, ctr = add3(p, mul3(N, R));
            drawPts(circle3(ctr, mul3(N, -1), F.T, R, 120), { color: 'purple', width: 1.8 });
            sc.dot(ctr, { r: 3.5, color: 'purple' });
            sc.line(p, ctr, { color: 'purple', width: 1, dash: [3, 3], alpha: 0.7 });
          } else {
            sc.line(sub3(p, mul3(F.T, 3)), add3(p, mul3(F.T, 3)), { color: 'purple', width: 1.8 });
          }
          // circle through three points at t-h, t, t+h
          const hv = hh.value, t0 = Math.max(c.t[0], t - hv), t2 = Math.min(c.t[1], t + hv);
          const A = f(t0), Bq = f(t), C = f(t2);
          const a = sub3(A, C), b = sub3(Bq, C), ab = cross3(a, b);
          let R3 = null;
          if (norm3(ab) > 1e-9) {
            const ctr3 = add3(C, mul3(cross3(sub3(mul3(b, dot3(a, a)), mul3(a, dot3(b, b))), ab), 1 / (2 * dot3(ab, ab))));
            R3 = norm3(a) * norm3(b) * norm3(sub3(a, b)) / (2 * norm3(ab));
            if (R3 < 12) { const e1 = unit3(sub3(Bq, ctr3)), e2 = unit3(cross3(unit3(ab), e1)); drawPts(circle3(ctr3, e1, e2, R3, 120), { color: 'gold', width: 1.6, dash: [5, 4] }); }
            sc.dots([A, C], { r: 3.5, color: 'gold' });
          }
          const s = 0.55;
          sc.arrow(p, add3(p, mul3(F.T, s)), { color: 'blue', width: 2.8 });
          if (F.kappa > 1e-4) sc.arrow(p, add3(p, mul3(N, s)), { color: 'red', width: 2.8 });
          if (!c.planar && F.kappa > 1e-4) sc.arrow(p, add3(p, mul3(B, s)), { color: 'green', width: 2.8 });
          sc.dot(p, { r: 5, color: 'gold', top: true });
          sc.flush();
          // curvature graph
          const km = Math.max(0.6, ...curv.map((q) => Math.abs(q[1])), ...(c.planar ? [] : curv.map((q) => Math.abs(q[2])))) * 1.1;
          G.setView(c.t, c.planar ? [-km, km] : [-km * 0.4, km]);
          G.hline(0, { color: 'faint' });
          G.path(curv.map((q) => [q[0], q[1]]), { color: 'accent', width: 2 });
          if (!c.planar) G.path(curv.map((q) => [q[0], q[2]]), { color: 'teal', width: 2, dash: true });
          G.dot(t, ks, { color: 'gold', r: 6 });
          G.vline(t, { color: 'faint', dash: true });
          // independent check: |T(t+h) - T(t-h)| / (arc length between)
          const hs = 2e-3, Ta = frenet(f, t - hs).T, Tb = frenet(f, t + hs).T;
          const arcL = M.integrate((x) => norm3(derivs(f, x, 1e-5).v), t - hs, t + hs, 8);
          const kTurn = norm3(sub3(Tb, Ta)) / arcL;
          // torsion by finite differences
          let tau = null;
          if (!c.planar) { const h2 = 0.02, d1 = derivs(f, t, h2).v; const r3 = (x) => derivs(f, x, h2).a; const jerk = mul3(sub3(r3(t + h2), r3(t - h2)), 1 / (2 * h2)); const cr = cross3(F.v, F.a); tau = dot3(cr, jerk) / dot3(cr, cr); }
          st = { ks, kappa: F.kappa, kTurn, exact: c.ex ? c.ex(t) : null, R: F.kappa > 1e-9 ? 1 / F.kappa : Infinity, R3, tau, planar: c.planar };
        });
        v.legend([['ink', 'curve'], ['purple', 'osculating circle'], ['gold', 'circle through 3 points', { dash: true }], ['blue', '$\\mathbf T$'], ['red', '$\\mathbf N$'], ['green', '$\\mathbf B$']]);
        v.readout(() => {
          const s = st;
          const r = s.kappa > 0.02 ? `radius $1/\\kappa=${tf(s.R, 3)}$` : 'curvature $\\approx0$: the circle has become the tangent line';
          return `${s.planar ? `Signed curvature $\\kappa_s=${tf(s.ks, 4)}$` : `$\\kappa=${tf(s.kappa, 4)}$, torsion $\\tau=${tf(s.tau, 4)}$`}; ${r}. Check by turning rate $|\\Delta\\mathbf T|/\\Delta s=${tf(s.kTurn, 4)}$${s.exact != null ? `, closed form $${tf(s.exact, 4)}$` : ''}. Three-point circle (h = ${tf(hh.value)}): radius ${s.R3 ? '$' + tf(s.R3, 3) + '$' : 'undefined'}.`;
        });
      },
    },
    // ------------------------------------------------------------------ 1.11
    {
      num: '1.11',
      kind: 'Law',
      name: 'Newton’s second law along a path',
      statement: String.raw`Newton’s second law, $\mathbf F=m\mathbf a$, with $\mathbf a=\mathbf c''(t)$ the acceleration of a particle of constant mass $m$ moving on a curve $\mathbf c$, can be read off in the Frenet frame of the path: with speed $v=|\mathbf c'|$,
$$\mathbf a=\frac{dv}{dt}\,\mathbf T+\kappa v^{2}\,\mathbf N .$$
The force needed therefore has a **tangential part** $m\,\dot v$ (speeding up or braking) and a **normal part** $m\kappa v^2$ pointing to the centre of curvature (turning). The normal part grows with the square of the speed and in proportion to the curvature, and exists even at constant speed.`,
      idea: String.raw`Write $\mathbf c'=v\mathbf T$ and differentiate with the product rule: $\mathbf c''=\dot v\,\mathbf T+v\,\dot{\mathbf T}$. By the chain rule $\dot{\mathbf T}=\frac{d\mathbf T}{ds}\dot s=\kappa v\,\mathbf N$ (1.9), which gives the formula. Multiplying by $m$ is Newton’s second law (law II of the *Principia*, 1687, in the form $\mathbf F=m\mathbf a$ for constant mass in an inertial frame). For the normal part, the force must turn the velocity, and the bigger $v$ or $\kappa$ is, the faster the velocity direction has to change.`,
      caption: String.raw`A 1200 kg car drives round a closed track (one unit of the drawing is 12 m). Choose the driver: constant speed, speeding up and slowing down along the lap, or braking into the bends. The pink arrow is the acceleration; the orange and purple arrows are its tangential and normal parts, and the graph shows both along the whole lap. Increase the **wiggle** of the track or the cruising speed and the normal part $v^2\kappa$ jumps in the bends. Lower the **grip** $\mu$: when $m\kappa v^2$ exceeds the friction limit $\mu mg$ the car turns red and would skid.`,
      deps: ['vcalc-1.9'],
      refs: ['Marsden–Tromba §4.1'],
      tags: ['Newton', 'acceleration', 'curvature'],
      credit: 'Newton, Philosophiæ Naturalis Principia Mathematica, 1687 (Lex II)',
      scope: String.raw`Holds in an inertial frame, for a particle of constant mass moving at speeds far below $c$.`,
      viz(v) {
        const M = v.M, Sc = 12, g = 9.81, m = 1200;
        const mode = v.select('driver', [{ value: 'const', label: 'constant speed' }, { value: 'wave', label: 'speed up and down' }, { value: 'brake', label: 'brake into bends' }], 'brake');
        const wig = v.slider('track wiggle', 0, 0.2, 0.06, { step: 0.005 });
        const v0 = v.slider('cruising speed (m/s)', 6, 18, 10, { step: 0.5 });
        const mu = v.slider('grip $\\mu$', 0.2, 1.2, 1.1, { step: 0.01 });
        const S = v.stage({ x: [-2.4, 2.4], y: [-1.6, 1.6], equal: true, axes: false, height: 380, weight: 1.15 });
        const G = v.stage({ x: [0, 1], y: [-8, 12], axes: 'box', gutter: true, height: 380, weight: 1, xlabel: 'distance along the lap (m)', ylabel: 'acceleration (m/s²)', title: 'tangential and normal acceleration' });
        const NS = 720;
        let tab = null, tabKey = null;
        const build = () => {
          const A = wig.value, md = mode.value, V0 = v0.value;
          const pos = (p) => { const R = 1.65 * (1 + A * Math.cos(3 * p) + 0.5 * A * Math.sin(5 * p)); return [R * Math.cos(p), 0.78 * R * Math.sin(p)]; };
          const ph = [], P = [], s = [0];
          for (let i = 0; i <= NS; i++) { const p = (TAU * i) / NS; ph.push(p); P.push(pos(p)); if (i) s.push(s[i - 1] + Sc * Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1])); }
          const L = s[NS];
          // curvature (1/m), signed, by finite differences in phase
          const kap = ph.map((p) => { const h = 1e-3, d = derivs((q) => [...pos(q), 0], p, h), c = cross3(d.v, d.a)[2]; return (c / norm3(d.v) ** 3) / Sc; });
          const vOf = (i) => (md === 'const' ? V0 : md === 'wave' ? V0 * (1 + 0.38 * Math.sin((TAU * s[i]) / L * 2 + 0.6)) : V0 * 1.15 / (1 + 15 * kap[i] * kap[i]));
          const vv = ph.map((_, i) => vOf(i));
          const sAt = (j) => (j < 0 ? s[j + NS] - L : j > NS ? s[j - NS] + L : s[j]), vAt = (j) => vv[((j % NS) + NS) % NS];
          const aT = vv.map((_, i) => vv[i] * (vAt(i + 1) - vAt(i - 1)) / (sAt(i + 1) - sAt(i - 1)));
          const aN = vv.map((x, i) => x * x * Math.abs(kap[i]));
          const tm = [0]; for (let i = 1; i <= NS; i++) tm.push(tm[i - 1] + (s[i] - s[i - 1]) * 0.5 * (1 / vv[i] + 1 / vv[i - 1]));
          return { ph, P, s, L, kap, vv, aT, aN, tm, T: tm[NS], pos };
        };
        const at = (arr, ts, t) => { let lo = 0, hi = ts.length - 1; while (hi - lo > 1) { const mid = (lo + hi) >> 1; if (ts[mid] <= t) lo = mid; else hi = mid; } const w = (t - ts[lo]) / ((ts[hi] - ts[lo]) || 1); return arr[lo] + w * (arr[hi] - arr[lo]); };
        let st = null;
        v.animate((time) => {
          const key = `${mode.value}|${wig.value}|${v0.value}`;
          if (key !== tabKey) { tab = build(); tabKey = key; }
          const D = tab, t = time % D.T;
          const i = (() => { let lo = 0, hi = NS; while (hi - lo > 1) { const mid = (lo + hi) >> 1; if (D.tm[mid] <= t) lo = mid; else hi = mid; } return lo; })();
          const w = (t - D.tm[i]) / ((D.tm[i + 1] - D.tm[i]) || 1);
          const ph = D.ph[i] + w * (D.ph[i + 1] - D.ph[i]);
          const f = (q) => [...D.pos(q), 0], dd = derivs(f, ph, 1e-4), Fr = frenet(f, ph, 1e-3);
          const sgn = Math.sign(cross3(Fr.v, Fr.a)[2]) || 1;
          const T = Fr.T.slice(0, 2), Nn = [-T[1] * sgn, T[0] * sgn];
          const vs = D.vv[i] + w * (D.vv[i + 1] - D.vv[i]), k = Math.abs(D.kap[i] + w * (D.kap[i + 1] - D.kap[i])), aT = D.aT[i] + w * (D.aT[i + 1] - D.aT[i]), aN = vs * vs * k;
          const skid = m * aN > mu.value * m * g;
          const pos = D.pos(ph);
          const sc = 0.07; // drawing units per m/s²
          S.path(D.P, { color: 'ink', width: 22, alpha: 0.1 });
          S.path(D.P, { color: 'muted', width: 1.2, dash: true });
          S.dot(pos[0], pos[1], { r: 8, color: skid ? 'red' : 'gold' });
          const aa = [aT * T[0] + aN * Nn[0], aT * T[1] + aN * Nn[1]];
          S.arrow(pos[0], pos[1], pos[0] + aT * sc * T[0], pos[1] + aT * sc * T[1], { color: 'orange', width: 2.6 });
          S.arrow(pos[0], pos[1], pos[0] + aN * sc * Nn[0], pos[1] + aN * sc * Nn[1], { color: 'purple', width: 2.6 });
          S.arrow(pos[0], pos[1], pos[0] + aa[0] * sc, pos[1] + aa[1] * sc, { color: 'pink', width: 3.2 });
          S.arrow(pos[0], pos[1], pos[0] + vs * 0.09 * T[0], pos[1] + vs * 0.09 * T[1], { color: 'blue', width: 2 });
          // lap graph
          G.hline(0, { color: 'faint' });
          G.hline(mu.value * g, { color: 'red', dash: true, alpha: 0.7 });
          G.text('friction limit μg', D.L * 0.98, mu.value * g + 0.9, { size: 11, color: 'red', align: 'right' });
          G.setView([0, D.L], [-8, 12]);
          G.path(D.s.map((x, j) => [x, D.aN[j]]), { color: 'purple', width: 2 });
          G.path(D.s.map((x, j) => [x, D.aT[j]]), { color: 'orange', width: 2 });
          const sNow = D.s[i] + w * (D.s[i + 1] - D.s[i]);
          G.vline(sNow, { color: 'faint', dash: true });
          G.dot(sNow, aN, { color: 'purple', r: 5 }); G.dot(sNow, aT, { color: 'orange', r: 5 });
          // independent check: acceleration by finite differences of the position in time
          const hh = 0.02;
          const posAt = (tt) => { const u = ((tt % D.T) + D.T) % D.T; let lo = 0, hi = NS; while (hi - lo > 1) { const mid = (lo + hi) >> 1; if (D.tm[mid] <= u) lo = mid; else hi = mid; } const ww = (u - D.tm[lo]) / ((D.tm[lo + 1] - D.tm[lo]) || 1); return D.pos(D.ph[lo] + ww * (D.ph[lo + 1] - D.ph[lo])).map((x) => x * Sc); };
          const p0 = posAt(t - hh), p1 = posAt(t), p2 = posAt(t + hh);
          const afd = [(p2[0] - 2 * p1[0] + p0[0]) / (hh * hh), (p2[1] - 2 * p1[1] + p0[1]) / (hh * hh)];
          st = { vs, k, aT, aN, skid, afd: Math.hypot(afd[0], afd[1]), amag: Math.hypot(aT, aN), F: m * Math.hypot(aT, aN) / 1000, FN: m * aN / 1000, lim: mu.value * m * g / 1000 };
        }, { period: 3600, still: 4.5 });
        v.legend([['blue', 'velocity'], ['orange', 'tangential $\\dot v\\,\\mathbf T$'], ['purple', 'normal $\\kappa v^2\\mathbf N$'], ['pink', 'acceleration $\\mathbf a$']]);
        v.readout(() => `Speed $${tf(st.vs, 1)}$ m/s, curvature $\\kappa=${tf(st.k, 4)}$ m$^{-1}$ (radius ${st.k > 1e-4 ? tf(1 / st.k, 1) : '∞'} m). Tangential $\\dot v=${tf(st.aT, 2)}$, normal $\\kappa v^2=${tf(st.aN, 2)}$ m/s², so $|\\mathbf a|=\\sqrt{\\dot v^2+(\\kappa v^2)^2}=${tf(st.amag, 2)}$ — finite differences of the position give $${tf(st.afd, 2)}$. Force on the car: $${tf(st.F, 2)}$ kN, of which $${tf(st.FN, 2)}$ kN sideways (limit $${tf(st.lim, 2)}$ kN)${st.skid ? ' — **skidding**' : ''}.`);
      },
    },
  ],
};
