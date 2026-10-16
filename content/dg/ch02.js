// Differential Geometry of Curves & Surfaces — Chapter 2: Space curves (2.1–2.7)
import {
  TAU, clamp, add, sub, mul, dot, cross, len, unit, mkCurve, tableOf, atS, dds, CURVES, curveChoices, FC,
  scene, plot, drawTrack, drawFrame, bbox, integrateFS, rotMat, applyMat,
} from './ch02.shared.js';

const PI = Math.PI;

export default {
  collection: 'dg',
  chapter: 2,
  title: 'Space curves',
  summary: String.raw`In space a curve bends and twists. The Frenet frame — tangent, normal, binormal — rotates as it moves, at rates given by curvature and torsion, and the Frenet–Serret equations make this precise. Curvature and torsion determine a space curve up to rigid motion, and the local canonical form shows what each of them looks like from the three coordinate planes of the frame.`,
  items: [
    // ───────────────────────────────────────────────────────────── 2.1
    {
      num: '2.1',
      kind: 'Definition',
      name: 'Curvature of a space curve',
      statement: String.raw`Let $\alpha: I \to \R^3$ be a regular curve of class $C^2$. Its **curvature** at $t$ is
$$\kappa(t) = \frac{|\alpha'(t) \times \alpha''(t)|}{|\alpha'(t)|^{3}} \;\ge\; 0 .$$
If $\alpha$ is parametrized by arc length this is $\kappa(s) = |\alpha''(s)| = |T'(s)|$: the rate at which the unit tangent $T = \alpha'$ turns. Curvature does not depend on the parametrization and is unchanged by rotations and translations. Unlike a plane curve, a space curve has no preferred side to bend towards, so $\kappa$ is never negative. A curve has $\kappa \equiv 0$ exactly when it is a straight line; an isolated point with $\kappa = 0$ is a *flat point*.`,
      idea: String.raw`With arc length as parameter (dg-1.3) the tangent is a unit vector, so $T\cdot T = 1$ gives $T\cdot T' = 0$: the derivative of the tangent is pure turning, perpendicular to the motion, and its size is the curvature. For an arbitrary regular parametrization with speed $v = |\alpha'|$, the chain rule gives $\alpha'' = v' T + v^2 T'$; the cross product with $\alpha' = vT$ kills the tangential part and leaves $v^3\, T \times T'$, which yields the formula. In the plane this is the absolute value of the signed curvature of dg-1.4.`,
      caption: String.raw`Slide the point along the curve (shaded blue to red by curvature). The red arrow is the acceleration $T'(s)$ of the unit-speed curve, measured by differencing the tangent; the readout compares its length with the formula above. The plot underneath shows $\kappa(s)$. On the **curve with a flat point** the arrow shrinks to nothing at the middle of the curve, where $\kappa = 0$, even though the curve is perfectly smooth there.`,
      deps: ['dg-1.4'],
      refs: ['do Carmo §1-5', 'Pressley Ch. 2'],
      tags: ['curvature', 'space curves'],
      viz(v) {
        const sel = v.select('curve', curveChoices(['trefoil', 'helix', 'viviani', 'cubic', 'flat']), 'trefoil');
        const uS = v.slider('position $s/L$', 0, 1, 0.2, { step: 0.001 });
        const aS = v.slider('arrow scale', 0.3, 2.5, 1, { step: 0.01 });
        const { S, sc } = scene(v, { title: 'the curve, shaded by curvature; red arrow $=T^{\\prime}(s)$' });
        const P = plot(v, { xlabel: 'arc length $s$', ylabel: '$\\kappa(s)$', title: 'curvature along the curve' });
        let tab = null, key = '', kmax = 1, info = { k1: 0, k2: 0, s: 0 };
        v.render(() => {
          if (key !== sel.value) {
            key = sel.value; tab = tableOf(CURVES[key], 480);
            kmax = Math.max(...tab.fr.map((f) => f.kappa)) || 1;
            P.setView([0, tab.L], [-0.04 * kmax, kmax * 1.12]);
          }
          const L = tab.L, h = L * 2e-4;
          const s = clamp(uS.value * L, h, L - h), here = atS(tab, s);
          const T1 = atS(tab, s + h).T, T0 = atS(tab, s - h).T;
          const acc = mul(sub(T1, T0), 1 / (2 * h));
          sc.begin();
          drawTrack(sc, tab.p, { width: 3.2 }, tab.fr.slice(0, -1).map((f) => v.mix('blue', 'red', Math.sqrt(Math.min(1, f.kappa / kmax)))));
          sc.arrow(here.p, add(here.p, mul(here.T, 0.55)), { color: 'blue', width: 2.2 });
          if (len(acc) > 1e-4) sc.arrow(here.p, add(here.p, mul(acc, aS.value)), { color: 'red', width: 3.2 });
          sc.dot(here.p, { color: 'gold', r: 6 });
          sc.flush();
          P.path(tab.s.map((si, i) => [si, tab.fr[i].kappa]), { color: 'ink', width: 2.4 });
          P.dot(s, here.kappa, { color: 'gold', r: 6 });
          info = { k1: len(acc), k2: here.kappa, s, L };
        });
        v.readout(() => String.raw`$s = ${v.fix(info.s, 2)}$ of $L = ${v.fix(info.L, 2)}$ · length of $T'(s)$ from differencing the tangent: $${v.fix(info.k1, 5)}$ · formula $|\alpha'\times\alpha''|/|\alpha'|^3$: $${v.fix(info.k2, 5)}$${info.k2 < 0.02 ? ' — the curve is momentarily almost straight here' : ''}`);
      },
    },

    // ───────────────────────────────────────────────────────────── 2.2
    {
      num: '2.2',
      kind: 'Definition',
      name: 'Frenet frame: tangent, normal and binormal',
      statement: String.raw`Let $\alpha$ be a regular curve of class $C^3$ with $\kappa(t) > 0$ (no flat points). Its **Frenet frame** at $t$ is the orthonormal, right-handed triple
$$T = \frac{\alpha'}{|\alpha'|}, \qquad N = \frac{T'}{|T'|}, \qquad B = T \times N,$$
the unit tangent, the **principal normal** (pointing to the side the curve bends towards) and the **binormal**. The plane through $\alpha(t)$ spanned by $T, N$ is the **osculating plane**; $N, B$ span the **normal plane** and $T, B$ the **rectifying plane**. Where $\kappa = 0$ the vector $N$ is not defined, and so neither is the frame.`,
      idea: String.raw`$T$ is a unit vector, so $T'$ is perpendicular to it (dg-2.1) and can be normalized as soon as it is not zero, which is exactly the condition $\kappa > 0$. Then $B = T\times N$ completes an orthonormal right-handed basis that varies smoothly with $t$ ($C^1$ if $\alpha$ is $C^3$). The osculating plane is the plane that best approximates the curve to second order at the point; the frame is the curve's own moving coordinate system, and everything that follows is about how it turns.`,
      caption: String.raw`Press play, or drag the position slider, to move the frame along the curve: $\mathbf T$ is blue, $\mathbf N$ orange, $\mathbf B$ purple. Choose which of the three coordinate planes of the frame to shade; rotate the view by dragging the background. The plot shows $\kappa(s)$ and $\tau(s)$ for the same curve (torsion is defined in the next item). The readout checks that the three vectors really are unit, mutually orthogonal and right-handed.`,
      deps: ['dg-2.1'],
      refs: ['do Carmo §1-5'],
      tags: ['Frenet frame', 'osculating plane'],
      credit: 'Frenet, 1847; Serret, 1851',
      viz(v) {
        const sel = v.select('curve', curveChoices(['trefoil', 'helix', 'viviani', 'cubic']), 'trefoil');
        const pl = v.select('shade the', [{ value: 'osc', label: 'osculating plane $(T,N)$' }, { value: 'rect', label: 'rectifying plane $(T,B)$' }, { value: 'norm', label: 'normal plane $(N,B)$' }, { value: 'none', label: 'none' }], 'osc');
        const uS = v.slider('position $s/L$', 0, 1, 0.08, { step: 0.001 });
        const { S, sc } = scene(v, { title: 'Frenet frame riding the curve' });
        const P = plot(v, { xlabel: 'arc length $s$', ylabel: 'value', title: 'curvature and torsion' });
        v.legend([['teal', '$\\kappa(s)$'], ['pink', '$\\tau(s)$']]);
        let tab = null, key = '', fr = null, shown = 0;
        const PER = 14;
        v.animate((t) => {
          if (v.playing) uS.set((t / PER) % 1);
          if (key !== sel.value) {
            key = sel.value; tab = tableOf(CURVES[key], 480);
            const vals = tab.fr.flatMap((f) => [f.kappa, f.tau]); const hi = Math.max(...vals), lo = Math.min(0, ...vals);
            P.setView([0, tab.L], [lo - 0.08 * (hi - lo), hi + 0.12 * (hi - lo)]);
          }
          const s = uS.value * tab.L; fr = atS(tab, s); shown = s;
          sc.begin();
          drawTrack(sc, tab.p, { color: 'muted', width: 2.4 });
          if (fr.ok) {
            const k = { osc: ['T', 'N', 'orange'], rect: ['T', 'B', 'teal'], norm: ['N', 'B', 'purple'], none: null }[pl.value];
            if (k) sc.disc(fr[k[0]], fr[k[1]], 0.8, { fill: k[2], fillAlpha: 0.2, color: k[2], grid: true }, fr.p);
            drawFrame(sc, fr.p, fr, 0.75);
          }
          sc.dot(fr.p, { color: 'gold', r: 6 });
          sc.flush();
          P.path(tab.s.map((si, i) => [si, tab.fr[i].kappa]), { color: 'teal', width: 2.4 });
          P.path(tab.s.map((si, i) => [si, tab.fr[i].tau]), { color: 'pink', width: 2.4 });
          P.vline(s, { color: 'gold', alpha: 0.8 });
        }, { period: PER, still: 3.2 });
        v.readout(() => {
          if (!fr || !fr.ok) return 'here $\\kappa = 0$: the frame is not defined';
          const { T, N, B } = fr;
          const unitErr = Math.max(Math.abs(len(T) - 1), Math.abs(len(N) - 1), Math.abs(len(B) - 1));
          const orth = Math.max(Math.abs(dot(T, N)), Math.abs(dot(T, B)), Math.abs(dot(N, B)));
          return String.raw`$s=${v.fix(shown, 2)}$: $\kappa=${v.fix(fr.kappa, 3)}$, $\tau=${v.fix(fr.tau, 3)}$\nlargest deviation of $|T|,|N|,|B|$ from 1: $${v.sci(unitErr + 1e-17, 2)}$ · largest $|T\cdot N|, |T\cdot B|, |N\cdot B|$: $${v.sci(orth + 1e-17, 2)}$ · $\det[T\,N\,B] = ${v.fix(dot(T, cross(N, B)), 6)}$ (right-handed)`;
        });
      },
    },

    // ───────────────────────────────────────────────────────────── 2.3
    {
      num: '2.3',
      kind: 'Definition',
      name: 'Torsion',
      statement: String.raw`Let $\alpha$ be a $C^3$ curve with $\kappa > 0$, parametrized by arc length. Since $B$ is a unit vector and $B \perp T$, its derivative is a multiple of $N$; the **torsion** $\tau$ is defined by $B' = -\tau N$. For any regular parametrization
$$\tau = \frac{(\alpha' \times \alpha'')\cdot \alpha'''}{|\alpha' \times \alpha''|^{2}} .$$
Torsion measures how fast the osculating plane turns about the tangent line, i.e. how fast the curve leaves its osculating plane. It is a signed quantity: with the convention $B' = -\tau N$ a right-handed screw has $\tau > 0$ (some books use $B' = +\tau N$, which reverses the sign). Reversing the orientation of the curve does not change $\tau$; reflecting it in a mirror changes its sign.`,
      idea: String.raw`From $B\cdot B = 1$ we get $B' \perp B$, and from $B\cdot T = 0$ we get $B'\cdot T = -B\cdot T' = -\kappa\, B\cdot N = 0$. So $B'$ is perpendicular to both $B$ and $T$, hence parallel to $N$; call the coefficient $-\tau$. Differentiating $B = T\times N$ and using $T' = \kappa N$ gives the formula in terms of $\alpha', \alpha'', \alpha'''$ (the triple product measures the volume the three derivatives span, which is $0$ when the curve stays in a plane).`,
      caption: String.raw`The orange disc is the osculating plane at the gold point; the faint disc is the osculating plane a short way back. Move the point and watch the plane rock about the tangent line: the purple binormal tilts. The red arrow at the tip of $\mathbf B$ is $B'(s)$, measured by differencing; it points along $-\mathbf N$ and its signed length is $\tau$, plotted in blue and checked against the triple-product formula. Choose the planar ellipse to see $\tau \equiv 0$.`,
      deps: ['dg-2.2'],
      refs: ['do Carmo §1-5'],
      tags: ['torsion', 'osculating plane'],
      viz(v) {
        const sel = v.select('curve', curveChoices(['helix', 'trefoil', 'viviani', 'cubic', 'ellipse']), 'trefoil');
        const uS = v.slider('position $s/L$', 0, 1, 0.12, { step: 0.001 });
        const bS = v.slider('look back $\\Delta s/L$', 0.02, 0.3, 0.1, { step: 0.001 });
        const aS = v.slider('arrow scale for $B^{\\prime}$', 0.5, 6, 2.5, { step: 0.01 });
        const { S, sc } = scene(v, { title: 'the osculating plane rocking about the tangent' });
        const P = plot(v, { xlabel: 'arc length $s$', ylabel: '$\\tau(s)$', title: 'torsion along the curve' });
        v.legend([['accent', 'triple-product formula'], ['gold', 'measured $-N\\cdot B^{\\prime}$', { dash: true }]]);
        let tab = null, key = '', info = {};
        const PER = 14;
        v.animate((t) => {
          if (v.playing) uS.set((t / PER) % 1);
          if (key !== sel.value) {
            key = sel.value; tab = tableOf(CURVES[key], 480);
            const vals = tab.fr.map((f) => f.tau); const hi = Math.max(...vals, 0.5), lo = Math.min(...vals, -0.5);
            P.setView([0, tab.L], [lo - 0.12 * (hi - lo), hi + 0.12 * (hi - lo)]);
          }
          const c = tab.c, s = uS.value * tab.L, fr = atS(tab, s), back = atS(tab, s - bS.value * tab.L);
          sc.begin();
          drawTrack(sc, tab.p, { color: 'muted', width: 2.4 });
          if (back.ok) sc.disc(back.T, back.N, 0.7, { fill: 'muted', fillAlpha: 0.1, color: 'muted', alpha: 0.5, width: 1 }, back.p);
          let meas = NaN;
          if (fr.ok) {
            sc.disc(fr.T, fr.N, 0.8, { fill: 'orange', fillAlpha: 0.2, color: 'orange', grid: true }, fr.p);
            drawFrame(sc, fr.p, fr, 0.8);
            const Bp = dds(c, fr.t, (f) => f.B || [0, 0, 0]);
            meas = -dot(Bp, fr.N);
            const tip = add(fr.p, mul(fr.B, 0.8));
            sc.arrow(tip, add(tip, mul(Bp, aS.value)), { color: 'red', width: 3 });
          }
          sc.dot(fr.p, { color: 'gold', r: 6 });
          sc.flush();
          P.hline(0, { color: 'faint' });
          P.path(tab.s.map((si, i) => [si, tab.fr[i].tau]), { color: 'accent', width: 2.6 });
          if (fr.ok) { P.dot(s, meas, { color: 'gold', r: 5, hollow: true }); }
          P.vline(s, { color: 'gold', alpha: 0.7 });
          info = { s, tau: fr.tau, meas, ok: fr.ok, k: fr.kappa };
        }, { period: 14, still: 3.2 });
        v.readout(() => !info.ok ? 'here $\\kappa = 0$, so $B$ and $\\tau$ are undefined' : String.raw`$s=${v.fix(info.s, 2)}$: $\kappa = ${v.fix(info.k, 3)}$ · $\tau$ from the formula: $${v.fix(info.tau, 5)}$ · $\tau$ from differencing $B$: $${v.fix(info.meas, 5)}$ ${Math.abs(info.tau) < 1e-6 ? '— the plane does not rock: this curve is planar' : info.tau > 0 ? '(positive: right-handed turning)' : '(negative: left-handed turning)'}`);
      },
    },

    // ───────────────────────────────────────────────────────────── 2.4
    {
      num: '2.4',
      kind: 'Theorem',
      name: 'Frenet–Serret formulas',
      statement: String.raw`Let $\alpha(s)$ be a unit-speed curve of class $C^3$ with $\kappa(s) > 0$ and Frenet frame $(T, N, B)$. Then
$$T' = \kappa N, \qquad N' = -\kappa T + \tau B, \qquad B' = -\tau N,$$
that is, in the moving frame $\dfrac{d}{ds}(T,N,B)^{\!\top} = A\,(T,N,B)^{\!\top}$ with the skew-symmetric matrix
$$A = \begin{pmatrix} 0 & \kappa & 0\\ -\kappa & 0 & \tau\\ 0 & -\tau & 0\end{pmatrix}.$$
Only two functions, $\kappa$ and $\tau$, govern how the frame turns.`,
      idea: String.raw`The first and third equations are the definitions of $\kappa$ (dg-2.1) and $\tau$ (dg-2.3). For the middle one, expand $N'$ in the orthonormal basis: $N'\cdot N = 0$ because $|N| = 1$; $N'\cdot T = -N\cdot T' = -\kappa$ by differentiating $N\cdot T = 0$; and $N'\cdot B = -N\cdot B' = \tau$ by differentiating $N\cdot B = 0$. Equivalently, the derivative matrix of an orthonormal frame is always skew-symmetric, and the zeros in $A$ come from the way $T$ and $B$ are built.`,
      caption: String.raw`At the gold point, the thick coloured arrows at the tips of $\mathbf T,\mathbf N,\mathbf B$ are the right-hand sides $\kappa N$, $-\kappa T+\tau B$, $-\tau N$; the thin gold arrows are the derivatives $T', N', B'$ measured by differencing the frames a distance $\delta$ apart in the parameter. They coincide. The plot shows the residuals of all three formulas along the whole curve on a log scale: shrink $\delta$ and they fall to numerical zero (and, for extremely small $\delta$, rise again from rounding error).`,
      deps: ['dg-2.3'],
      refs: ['do Carmo §1-5', 'Pressley Ch. 2'],
      tags: ['Frenet–Serret', 'moving frame'],
      credit: 'Frenet, 1847; Serret, 1851',
      viz(v) {
        const sel = v.select('curve', curveChoices(['trefoil', 'helix', 'viviani', 'cubic']), 'trefoil');
        const uS = v.slider('position $s/L$', 0, 1, 0.3, { step: 0.001 });
        const dS = v.slider('difference step $\\delta$', 1e-6, 0.1, 1e-3, { log: true, sig: 1 });
        const { S, sc } = scene(v, { title: 'formula (thick) versus measured derivative (thin gold)' });
        const P = plot(v, { x: [0, 1], y: [1e-13, 1], ylog: true, xlabel: 'arc length $s$', ylabel: 'residual', title: 'how far the formulas are from the measured derivatives' });
        v.legend([['blue', '$|T^{\\prime}-\\kappa N|$'], ['orange', '$|N^{\\prime}+\\kappa T-\\tau B|$'], ['purple', '$|B^{\\prime}+\\tau N|$']]);
        let tab = null, key = '', info = {};
        const resid = (c, t, d) => {
          const f = c.at(t), a = c.at(t + d), b = c.at(t - d), sp = c.speed(t);
          const D = (g) => g(a).map((x, i) => (x - g(b)[i]) / (2 * d * sp));
          const Tp = D((q) => q.T), Np = D((q) => q.N), Bp = D((q) => q.B);
          return { f, Tp, Np, Bp, rT: len(sub(Tp, mul(f.N, f.kappa))), rN: len(sub(Np, add(mul(f.T, -f.kappa), mul(f.B, f.tau)))), rB: len(add(Bp, mul(f.N, f.tau))) };
        };
        v.render(() => {
          if (key !== sel.value) { key = sel.value; tab = tableOf(CURVES[key], 200); P.setView([0, tab.L], [1e-13, 1]); }
          const c = tab.c, d = dS.value, s = uS.value * tab.L, t = atS(tab, s).t;
          const R = resid(c, t, d), f = R.f;
          sc.begin();
          drawTrack(sc, tab.p, { color: 'muted', width: 2.4 });
          if (f.ok) {
            drawFrame(sc, f.p, f, 0.8, { labels: false, width: 2 });
            const k = 0.55;
            const pairs = [['T', mul(f.N, f.kappa), R.Tp], ['N', add(mul(f.T, -f.kappa), mul(f.B, f.tau)), R.Np], ['B', mul(f.N, -f.tau), R.Bp]];
            for (const [key2, rhs, meas] of pairs) {
              const tip = add(f.p, mul(f[key2], 0.8));
              sc.arrow(tip, add(tip, mul(rhs, k)), { color: FC[key2], width: 4.5, top: false });
              sc.arrow(tip, add(tip, mul(meas, k)), { color: 'gold', width: 1.6, head: 7 });
            }
          }
          sc.dot(f.p, { color: 'gold', r: 6 });
          sc.flush();
          const lines = { rT: [], rN: [], rB: [] };
          const m = 140;
          for (let i = 0; i <= m; i++) {
            const ti = c.t0 + ((c.t1 - c.t0) * (i + 0.5)) / (m + 1), q = resid(c, ti, d);
            if (!q.f.ok) continue;
            const si = tab.L * ((ti - c.t0) / (c.t1 - c.t0));
            for (const kk of ['rT', 'rN', 'rB']) lines[kk].push([si, Math.max(q[kk], 1e-14)]);
          }
          P.path(lines.rT, { color: 'blue', width: 2 }); P.path(lines.rN, { color: 'orange', width: 2 }); P.path(lines.rB, { color: 'purple', width: 2 });
          P.vline(s, { color: 'gold', alpha: 0.7 });
          info = { ok: f.ok, k: f.kappa, tau: f.tau, rT: R.rT, rN: R.rN, rB: R.rB, d };
        });
        v.readout(() => !info.ok ? 'here $\\kappa=0$' : String.raw`$\begin{pmatrix}T'\\N'\\B'\end{pmatrix}=\begin{pmatrix}0&${v.fix(info.k, 3)}&0\\-${v.fix(info.k, 3)}&0&${v.fix(info.tau, 3)}\\0&${v.fix(-info.tau, 3)}&0\end{pmatrix}\begin{pmatrix}T\\N\\B\end{pmatrix}$\nresiduals at this point with $\delta=${v.sci(info.d, 1)}$: $${v.sci(info.rT + 1e-17, 2)}$, $${v.sci(info.rN + 1e-17, 2)}$, $${v.sci(info.rB + 1e-17, 2)}$`);
      },
    },

    // ───────────────────────────────────────────────────────────── 2.5
    {
      num: '2.5',
      kind: 'Proposition',
      name: 'The circular helix',
      statement: String.raw`The helix $\alpha(t) = (a\cos t,\; a\sin t,\; b t)$ with $a > 0$ and $b \in \R$ has constant curvature and constant torsion,
$$\kappa = \frac{a}{a^2 + b^2}, \qquad \tau = \frac{b}{a^2 + b^2},$$
so $\kappa^2 + \tau^2 = 1/(a^2 + b^2)$ and $\tau/\kappa = b/a$. It is right-handed when $b > 0$ ($\tau > 0$) and left-handed when $b < 0$; for $b = 0$ it degenerates to a circle of radius $a$, with $\tau = 0$. Conversely (dg-2.7), these are the only curves with constant $\kappa > 0$ and constant $\tau$.`,
      idea: String.raw`Differentiate: $\alpha' = (-a\sin t, a\cos t, b)$, $\alpha'' = (-a\cos t, -a\sin t, 0)$, $\alpha''' = (a\sin t, -a\cos t, 0)$. Then $|\alpha'| = \sqrt{a^2 + b^2}$ is constant, $\alpha'\times\alpha'' = (-ab\sin t,\; ab\cos t,\; -a^2)$ has length $a\sqrt{a^2+b^2}$ and $(\alpha'\times\alpha'')\cdot\alpha''' = a^2 b$. Plug into the formulas of dg-2.1 and dg-2.3. Geometrically the helix is a straight line wrapped on a cylinder: unrolling the cylinder makes it a line of slope $b/a$.`,
      caption: String.raw`Change the radius $a$ and the pitch parameter $b$ (negative $b$ gives a left-handed helix). The readout compares curvature and torsion measured numerically at ten points along the curve with the formulas: they are the same at every point. The right panel unrolls the cylinder for one turn: the helix becomes the hypotenuse of a triangle with legs $2\pi a$ and $2\pi b$, which is why nothing about it can change from point to point.`,
      deps: ['dg-2.4'],
      refs: ['do Carmo §1-5'],
      tags: ['helix', 'curvature', 'torsion'],
      viz(v) {
        const aS = v.slider('radius $a$', 0.3, 1.6, 1, { step: 0.01 });
        const bS = v.slider('pitch parameter $b$', -0.3, 0.3, 0.15, { step: 0.005 });
        const uS = v.slider('position', 0, 1, 0.4, { step: 0.001 });
        const { S, sc } = scene(v, { title: 'circular helix on its cylinder', yaw: -0.55, pitch: 0.3 });
        const U = v.stage({ x: [-1, 10], y: [-1, 4], equal: true, axes: false, height: 400, weight: 0.8, minWidth: 250, title: 'the cylinder unrolled, one turn' });
        let info = {};
        v.render(() => {
          const a = aS.value, b = bS.value;
          const c = mkCurve((t) => [a * Math.cos(t), a * Math.sin(t), b * t], -TAU, TAU);
          const t = -TAU + uS.value * 2 * TAU, f = c.at(t);
          sc.begin();
          for (let k = 0; k < 14; k++) { const ph = (TAU * k) / 14; sc.line([a * Math.cos(ph), a * Math.sin(ph), -6.4 * b - 0.1], [a * Math.cos(ph), a * Math.sin(ph), 6.4 * b + 0.1], { color: 'faint', width: 0.8, alpha: 0.5 }, 1); }
          const ring = (z) => Array.from({ length: 61 }, (_, i) => [a * Math.cos((TAU * i) / 60), a * Math.sin((TAU * i) / 60), z]);
          drawTrack(sc, ring(-6.4 * b - 0.1), { color: 'faint', width: 1, alpha: 0.6 }); drawTrack(sc, ring(6.4 * b + 0.1), { color: 'faint', width: 1, alpha: 0.6 });
          const pts = Array.from({ length: 241 }, (_, i) => c.r(-TAU + (2 * TAU * i) / 240));
          drawTrack(sc, pts, { color: 'blue', width: 3 });
          drawFrame(sc, f.p, f, 0.7);
          sc.dot(f.p, { color: 'gold', r: 6 });
          sc.flush();
          // unrolled cylinder: one turn is a triangle with legs 2πa and 2π|b|
          const W = TAU * a, H = TAU * Math.abs(b);
          U.setView([-0.12 * W - 0.5, 1.12 * W + 0.5], [-0.35 * W - 0.2, Math.max(H, 0.8) + 0.5 * W]);
          const sg = Math.sign(b) || 1;
          U.poly([[0, 0], [W, 0], [W, sg * H]], { fill: 'blue', fillAlpha: 0.08, stroke: false });
          U.segment([0, 0], [W, 0], { color: 'muted', width: 2 }); U.segment([W, 0], [W, sg * H], { color: 'muted', width: 2 });
          U.segment([0, 0], [W, sg * H], { color: 'blue', width: 3.2 });
          U.tex('2\\pi a', W / 2, -0.07 * W - 0.1, { align: 'center', baseline: 'top', color: 'muted', size: 14 });
          U.tex('2\\pi b', W + 0.04 * W + 0.1, (sg * H) / 2, { align: 'left', color: 'muted', size: 14 });
          U.tex(`\\text{one turn: length } ${v.fix(TAU * Math.hypot(a, b), 2)}`, W / 2, sg * H / 2 + 0.2 * W + (sg > 0 ? 0 : 0), { align: 'center', color: 'blue', size: 14 });
          // numerical check along the curve
          let dk = 0, dt = 0;
          for (let i = 0; i < 10; i++) { const q = c.at(-TAU + (2 * TAU * (i + 0.5)) / 10); dk = Math.max(dk, Math.abs(q.kappa - a / (a * a + b * b))); dt = Math.max(dt, Math.abs(q.tau - b / (a * a + b * b))); }
          info = { a, b, k: f.kappa, tau: f.tau, dk, dt };
        });
        v.readout(() => String.raw`$a=${v.fix(info.a, 2)}$, $b=${v.fix(info.b, 3)}$: $\kappa=${v.fix(info.k, 5)}$ (formula $a/(a^2+b^2)=${v.fix(info.a / (info.a ** 2 + info.b ** 2), 5)}$), $\tau=${v.fix(info.tau, 5)}$ (formula $b/(a^2+b^2)=${v.fix(info.b / (info.a ** 2 + info.b ** 2), 5)}$)\nlargest deviation from the formulas over ten points: $${v.sci(info.dk + 1e-17, 2)}$ and $${v.sci(info.dt + 1e-17, 2)}$ · $\kappa^2+\tau^2=${v.fix(info.k ** 2 + info.tau ** 2, 5)}$ · ${info.b > 0.0005 ? 'right-handed' : info.b < -0.0005 ? 'left-handed' : 'a circle'}`);
      },
    },

    // ───────────────────────────────────────────────────────────── 2.6
    {
      num: '2.6',
      kind: 'Proposition',
      name: 'Zero torsion means a plane curve',
      statement: String.raw`Let $\alpha$ be a $C^3$ regular curve with $\kappa(t) > 0$ for all $t$ in an interval. Then $\tau \equiv 0$ on the interval if and only if $\alpha$ lies in a plane. The hypothesis $\kappa > 0$ cannot be dropped: if $\kappa$ vanishes at some points the torsion is not even defined there, and a curve may have $\tau = 0$ wherever it is defined without being planar (dg-2.12).`,
      idea: String.raw`If $\tau \equiv 0$, then $B' = -\tau N = 0$, so $B = B_0$ is a constant unit vector. Then $\dfrac{d}{ds}\,(\alpha\cdot B_0) = T\cdot B_0 = 0$, so $\alpha\cdot B_0$ is constant: the curve lies in the plane $\{x : x\cdot B_0 = \text{const}\}$. Conversely if $\alpha$ lies in a plane with unit normal $n$, then $T$ and $T'$ are parallel to the plane, so $N$ is too, and $B = T\times N = \pm n$ is constant; hence $B' = 0$ and $\tau = 0$.`,
      caption: String.raw`The curve is a tilted ellipse that you lift out of its plane by the amount $\lambda$ (it becomes a wave). Purple arrows are binormals along the curve; the shaded disc is the best-fitting plane (found by principal components). At $\lambda = 0$ every binormal is parallel to the disc's normal, $\tau$ is zero to rounding error, and the curve is exactly in the plane; any $\lambda > 0$ tilts the binormals and the plot shows how far $B(s)$ wanders from $B(0)$.`,
      deps: ['dg-2.4'],
      refs: ['do Carmo §1-5'],
      tags: ['torsion', 'plane curves'],
      viz(v) {
        const lS = v.slider('lift out of the plane $\\lambda$', 0, 0.8, 0.4, { step: 0.001 });
        const { S, sc } = scene(v, { title: 'binormals and the best-fitting plane', yaw: -0.8, pitch: 0.42 });
        const P = plot(v, { x: [0, 1], y: [0, 90], xlabel: 'arc length $s$', ylabel: 'degrees', title: 'angle between $B(s)$ and $B(0)$' });
        const Q = rotMat(0.5, 0.45, 0.2);
        let info = {};
        v.render(() => {
          const lam = lS.value;
          const c = mkCurve((t) => applyMat(Q, [1.5 * Math.cos(t), 1.0 * Math.sin(t), lam * Math.sin(2 * t)]), 0, TAU, { closed: true });
          const tab = tableOf(c, 300);
          // best-fitting plane: eigenvectors of the covariance matrix
          const bb = bbox(tab.p), cov = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];
          const cen = tab.p.slice(0, -1).reduce((s, p) => add(s, p), [0, 0, 0]).map((x) => x / tab.n);
          for (const p of tab.p.slice(0, -1)) { const d = sub(p, cen); for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) cov[i][j] += (d[i] * d[j]) / tab.n; }
          const E = v.M.eigSym(cov), nrm = E.vectors.map((r) => r[2]), a1 = E.vectors.map((r) => r[0]), a2 = E.vectors.map((r) => r[1]);
          let thick = 0; for (const p of tab.p) thick = Math.max(thick, Math.abs(dot(sub(p, cen), nrm)));
          sc.begin();
          sc.disc(a1, a2, 1.75, { fill: 'accent', fillAlpha: 0.1, color: 'accent', grid: true, width: 1 }, cen);
          drawTrack(sc, tab.p, { color: 'ink', width: 3 });
          let maxTau = 0, maxAng = 0; const B0 = tab.fr[0].B;
          const angs = [];
          for (let i = 0; i <= tab.n; i++) {
            const f = tab.fr[i]; maxTau = Math.max(maxTau, Math.abs(f.tau));
            const ang = (Math.acos(clamp(dot(f.B, B0), -1, 1)) * 180) / PI; angs.push([tab.s[i], ang]); maxAng = Math.max(maxAng, ang);
          }
          for (let k = 0; k < 16; k++) { const f = tab.fr[Math.round((k * tab.n) / 16)]; sc.arrow(f.p, add(f.p, mul(f.B, 0.5)), { color: 'purple', width: 2.2, head: 8 }); }
          sc.flush();
          P.setView([0, tab.L], [0, Math.max(10, maxAng * 1.15)]);
          P.path(angs, { color: 'purple', width: 2.6 });
          info = { lam, maxTau, maxAng, thick };
        });
        v.readout(() => String.raw`$\lambda=${v.fix(info.lam, 3)}$: largest $|\tau|$ along the curve: $${v.sci(info.maxTau + 1e-17, 2)}$ · largest angle between $B(s)$ and $B(0)$: $${v.fix(info.maxAng, 4)}^\circ$ · largest distance from the best-fitting plane: $${v.sci(info.thick + 1e-17, 2)}$ ${info.maxTau < 1e-6 ? '— $\\tau\\equiv0$ and the curve is planar' : '— not planar'}`);
      },
    },

    // ───────────────────────────────────────────────────────────── 2.7
    {
      num: '2.7',
      kind: 'Theorem',
      name: 'Fundamental theorem of space curves',
      statement: String.raw`Let $\kappa, \tau: [0, L] \to \R$ be smooth functions with $\kappa > 0$. Then there is a unit-speed curve $\alpha: [0, L] \to \R^3$ whose curvature is $\kappa$ and whose torsion is $\tau$, and it is unique up to a rotation and translation of space: any two such curves differ by $x \mapsto Rx + d$ with $R \in SO(3)$. A mirror image has the same curvature and the opposite torsion, so the sign of $\tau$ tells the two handednesses apart. Positivity of $\kappa$ matters: at a zero of $\kappa$ the frame, and with it the equations below, break down (dg-2.12).`,
      idea: String.raw`Pick any starting frame $(T_0, N_0, B_0)$ and solve the linear system of ordinary differential equations $\alpha' = T$, $T' = \kappa N$, $N' = -\kappa T + \tau B$, $B' = -\tau N$ (dg-2.4) with these initial values; existence and uniqueness of solutions of linear ODEs on all of $[0, L]$ (ode-2.4) gives a curve. Because the coefficient matrix is skew-symmetric, $T,N,B$ stay orthonormal, so the curve has the required $\kappa$ and $\tau$. Two solutions differ only in their starting frame, i.e. by the rigid motion carrying one starting frame to the other.`,
      caption: String.raw`Choose $\kappa(s)$ and $\tau(s)$ from the menu (or type your own formulas in $s$ under **custom**) and a length $L$. The blue curve is built by integrating the Frenet–Serret system from the standard frame. The orange copy starts from a frame you rotate with the three angle sliders and shift with the separation slider: it is a rigid motion of the blue curve, and the readout confirms that the distances between corresponding pairs of points are unchanged. Switch on **mirror** to flip the sign of $\tau$: you get the mirror image, whose distances still agree but which no rotation can bring onto the blue curve (the signed volume of corresponding point triples changes sign).`,
      deps: ['dg-2.4', 'ode-2.4'],
      refs: ['do Carmo §1-5'],
      tags: ['curvature', 'torsion', 'ODE'],
      viz(v) {
        const PRE = {
          helix: { k: () => 1, t: () => 0.55, name: 'helix' },
          cone: { k: (s) => 0.35 + 0.16 * s, t: () => 0.7, name: 'tightening spiral' },
          wave: { k: (s) => 1.1 + 0.6 * Math.sin(1.3 * s), t: (s) => 1.4 * Math.cos(0.7 * s), name: 'wobble' },
          circle: { k: () => 1, t: () => 0, name: 'circle ($\\tau=0$)' },
          custom: { name: 'custom' },
        };
        const sel = v.select('functions', Object.entries(PRE).map(([value, p]) => ({ value, label: p.name })), 'wave');
        const kIn = v.input('$\\kappa(s)=$', '1 + 0.5*sin(s)', { vars: ['s'], width: 200 });
        const tIn = v.input('$\\tau(s)=$', 'cos(s/2)', { vars: ['s'], width: 200 });
        const LS = v.slider('length $L$', 2, 16, 9, { step: 0.05 });
        const yS = v.slider('rotate copy: yaw', -PI, PI, 0.9, { step: 0.01 });
        const pS = v.slider('pitch', -1.5, 1.5, 0.5, { step: 0.01 });
        const rS = v.slider('roll', -PI, PI, 0.4, { step: 0.01 });
        const xS = v.slider('separation', 0, 3, 1.6, { step: 0.01 });
        const mir = v.toggle('mirror: $\\tau\\to-\\tau$', false);
        const { S, sc } = scene(v, { title: 'the curve (blue) and a rigid motion of it (orange)' });
        const P = plot(v, { xlabel: 'arc length $s$', ylabel: 'value', title: 'the data $\\kappa(s)$ and $\\tau(s)$' });
        v.legend([['teal', '$\\kappa(s)$'], ['pink', '$\\tau(s)$']]);
        let info = {};
        v.render(() => {
          kIn.el.hidden = tIn.el.hidden = sel.value !== 'custom';
          const pre = PRE[sel.value];
          const kf = sel.value === 'custom' ? (kIn.fn || (() => 1)) : pre.k, tf = sel.value === 'custom' ? (tIn.fn || (() => 0)) : pre.t;
          const L = LS.value, n = 500, sgn = mir.value ? -1 : 1;
          const A = integrateFS(kf, tf, L, n, { p: [0, 0, 0], T: [1, 0, 0], N: [0, 1, 0], B: [0, 0, 1] });
          const R = rotMat(yS.value, pS.value, rS.value), col = (j) => [R[0][j], R[1][j], R[2][j]];
          const Bc = integrateFS(kf, (s) => sgn * tf(s), L, n, { p: [0, 0, 0], T: col(0), N: col(1), B: col(2) });
          const bb = bbox(A.map((q) => q.p)), sc1 = 1.45 / Math.max(bb.r, 0.3), off = [xS.value, 0, 0];
          const toA = (q) => mul(sub(q.p, bb.c), sc1);
          const toB = (q) => add(mul(sub(q.p, bb.c), sc1), off);
          const pa = A.map(toA), pb = Bc.map(toB);
          sc.begin();
          drawTrack(sc, pa, { color: 'blue', width: 3.2 }); drawTrack(sc, pb, { color: 'orange', width: 3.2 });
          sc.dot(pa[0], { color: 'blue', r: 5 }); sc.dot(pb[0], { color: 'orange', r: 5 });
          sc.flush();
          // pairwise distances and signed volumes of corresponding triples
          let dd = 0, vol = 0, volA = 0;
          const idx = Array.from({ length: 24 }, (_, i) => Math.round((i * n) / 23));
          for (let i = 0; i < idx.length; i++) for (let j = i + 1; j < idx.length; j++) dd = Math.max(dd, Math.abs(len(sub(A[idx[i]].p, A[idx[j]].p)) - len(sub(Bc[idx[i]].p, Bc[idx[j]].p))));
          const vo = (X, a, b, c) => dot(cross(sub(X[b].p, X[a].p), sub(X[c].p, X[a].p)), sub(X[idx[idx.length - 1]].p, X[a].p));
          const triple = (X) => { let m = 0, sgnv = 0; for (let k = 0; k < 40; k++) { const a = idx[(k * 3) % 24], b = idx[(k * 5 + 7) % 24], c = idx[(k * 7 + 13) % 24]; const val = dot(cross(sub(X[b].p, X[a].p), sub(X[c].p, X[a].p)), sub(X[idx[(k * 11 + 5) % 24]].p, X[a].p)); if (Math.abs(val) > m) { m = Math.abs(val); sgnv = Math.sign(val); } } return [m, sgnv]; };
          const [mA, sA] = triple(A), [mB, sB] = triple(Bc);
          const kmin = Math.min(...A.map((q) => kf(q.s)));
          // the data
          const ks = A.map((q) => [q.s, kf(q.s)]), ts = A.map((q) => [q.s, tf(q.s)]);
          const vals = ks.concat(ts).map((q) => q[1]), hi = Math.max(...vals, 0.5), lo = Math.min(...vals, -0.5);
          P.setView([0, L], [lo - 0.1 * (hi - lo), hi + 0.1 * (hi - lo)]);
          P.hline(0, { color: 'faint' });
          P.path(ks, { color: 'teal', width: 2.6 }); P.path(ts, { color: 'pink', width: 2.6 });
          if (mir.value) P.path(ts.map(([s, y]) => [s, -y]), { color: 'pink', width: 1.8, dash: true });
          const orth = Math.max(...A.map((q) => Math.abs(dot(q.T, q.N)) + Math.abs(dot(q.N, q.B)) + Math.abs(dot(q.T, q.B)) + Math.abs(len(q.T) - 1)));
          info = { dd, same: sA === sB, mA, mB, mirror: mir.value, kmin, orth };
        });
        v.readout(() => String.raw`largest change in a distance between corresponding points of the two curves: $${v.sci(info.dd + 1e-17, 2)}$ · orientation of corresponding point triples: ${info.same ? 'the same, so a rotation and translation carry one curve onto the other' : 'reversed: the orange curve is a mirror image of the blue one'}\n$\min\kappa = ${v.fix(info.kmin, 3)}$ ${info.kmin <= 0 ? '— not positive: the theorem does not apply' : ''} · frame orthonormality drift after integration: $${v.sci(info.orth + 1e-17, 2)}$`);
      },
    },
  ],
};
