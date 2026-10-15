// Special and General Relativity — Chapter 1 (paper): Einstein 1905, Zur Elektrodynamik bewegter Körper
//
// Checked: the English translation on Wikisource (Saha, 1920 edition) for the synchronisation rule t_B − t_A = t′_A − t_B (§1),
// the conclusion "we can attach no absolute significance to the concept of synchronism" (§2), and the moving clock that lags
// by ½ t v²/c², hence an equator clock running slow against a pole clock (§4).
// Tests quoted: Bailey et al., Nature 268 (1977) 301–305: muons at γ = 29.33 in the CERN storage ring, τ⁺ = 64.419(58) µs;
// muon lifetime at rest 2.1969811 µs (PDG).

const TAU_MU = 2.1969811;                 // µs
const BAILEY = { gamma: 29.33, tau: 64.419, err: 0.058 };
const V_EQ = (2 * Math.PI * 6378137) / 86164.1; // m/s, equatorial rotation speed
const C_SI = 299792458;
const LT = (b, t, x) => { const g = 1 / Math.sqrt(1 - b * b); return [g * (t - b * x), g * (x - b * t)]; }; // (t, x) → (t′, x′), c = 1
const LTinv = (b, tp, xp) => { const g = 1 / Math.sqrt(1 - b * b); return [g * (tp + b * xp), g * (xp + b * tp)]; };

export default {
  collection: 'rel',
  chapter: 1,
  items: [
    // ───────────────────────────────────────────────────────────── 1.14
    {
      num: '1.14',
      kind: 'Paper',
      name: 'Zur Elektrodynamik bewegter Körper',
      paper: { authors: 'A. Einstein', year: 1905, title: 'Zur Elektrodynamik bewegter Körper', venue: 'Annalen der Physik 322 (10): 891–921', doi: '10.1002/andp.19053221004' },
      introduces: ['rel-1.3', 'rel-1.5', 'rel-1.6', 'rel-1.10', 'rel-2.4'],
      credit: 'Albert Einstein, received 30 June 1905',
      statement: String.raw`Einstein raised two statements to postulates — the **principle of relativity** (the laws of physics take the same form in every inertial frame) and the **constancy of the speed of light** (light in vacuum moves with the same speed $c$ whatever the motion of its source, rel-1.3) — and showed that together they are consistent once time is defined operationally. Clocks at $A$ and $B$ are **synchronous** if a light signal sent from $A$ at $t_A$, reflected at $B$ at $t_B$ and back at $A$ at $t'_A$ satisfies $t_B-t_A=t'_A-t_B$ (rel-1.5). From this he derived the Lorentz transformation between frames in relative motion with speed $v$,
$$t'=\gamma\Big(t-\frac{vx}{c^2}\Big),\quad x'=\gamma(x-vt),\quad \gamma=\frac1{\sqrt{1-v^2/c^2}},$$
and its consequences: events simultaneous in one frame are not in another (rel-1.6); a moving rod is shortened by $1/\gamma$; a moving clock runs slow by $1/\gamma$ — a clock carried around a closed path lags by $\tfrac12 t v^2/c^2$, so "a clock at the equator must be slower by a very small amount than a similarly constructed clock at the pole" (rel-1.10); velocities compose so that none exceeds $c$ (rel-2.4); and Maxwell's equations keep their form, with electric and magnetic fields mixing between frames. Scope: inertial frames in flat spacetime; gravity requires general relativity.`,
      idea: String.raw`By 1905 Maxwell's electrodynamics seemed to single out a frame at rest in the ether, yet every attempt to detect the Earth's motion through it failed (Michelson–Morley, rel-1.13). Lorentz and Poincaré had found the transformations that leave Maxwell's equations invariant and interpreted the "local time" $t-vx/c^2$ as a mathematical device; FitzGerald and Lorentz explained the null result by a physical contraction of moving bodies. Einstein's paper, which opens with the asymmetry between a magnet moving past a conductor and a conductor moving past a magnet, removed the ether altogether: what had been a dynamical puzzle became kinematics. The key step is the analysis of simultaneity — synchronising clocks by light signals in a moving frame, the observers at rest find them out of step by $\gamma vL/c^2$ for clocks a distance $L$ apart (in the moving frame), so the "local time" is the time those clocks really show. Minkowski recast the theory in 1908 as the geometry of spacetime, which is the picture drawn here. Time dilation is now tested to parts in $10^3$ with muons in a storage ring and to $10^{-9}$ with ion clocks; Einstein's equator–pole example, though, is cancelled exactly by gravitational time dilation on the geoid, which only general relativity explains.`,
      caption: String.raw`Left: Minkowski's diagram in the platform frame, $ct$ up and $x$ across, light along the $45^\circ$ lines (gold). **Drag the velocity** of the train: its time axis $ct'$ and space axis $x'$ (blue) tilt symmetrically toward the light line; the faint hyperbolas mark one and two units of the train's own time and length. The train's rear clock $A$ sends a light flash to the front clock $B$, which reflects it: in the train frame the two legs take equal times, which is Einstein's synchronisation rule, but the platform sees unequal legs, and the train's line of simultaneity (blue dashed) is not horizontal. **Drag the purple event** to read its coordinates in both frames. Right: light clocks — the photon in the moving clock runs a longer zig-zag path, so its ticks (dots on its worldline at left) come $\gamma$ times less often; play to watch the platform's "now" climb the diagram.`,
      deps: ['rel-1.2', 'em-13.1', 'em-10.3', 'em-11.20'],
      see: ['rel-1.13'],
      refs: [],
      tags: ['special relativity', 'simultaneity', 'history'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/On_the_Electrodynamics_of_Moving_Bodies' },
      viz(v) {
        const M = v.M, L0 = 1.5, H = 0.5, TMAX = 4.4;
        const bS = v.slider('train speed $v/c$', -0.9, 0.9, 0.5, { step: 0.01 });
        const D = v.stage({ x: [-1.3, 3.3], y: [-0.25, TMAX], equal: true, axes: false, height: 400, weight: 1.15, minWidth: 300, title: 'spacetime diagram, platform frame ($c = 1$)' });
        const Kl = v.stage({ x: [0, 4], y: [-0.25, 2.25], equal: true, axes: false, height: 400, weight: 1, minWidth: 280, title: 'light clocks: on the platform (top) and on the train (bottom)' });
        const E = D.handle(2.2, 2.6, { color: 'purple', label: 'E', labelPos: 'ne' });
        let st = {};
        v.animate((tA) => {
          const b = bS.value, g = 1 / Math.sqrt(1 - b * b), now = (tA * 0.5) % TMAX;
          // ---- Minkowski diagram
          D.line(-1.3, 0, 3.3, 0, { color: 'muted', width: 1.2 }); D.line(0, -0.25, 0, TMAX, { color: 'muted', width: 1.2 });
          D.text('x', 3.25, 0, { dy: 10, align: 'right', color: 'muted', math: true }); D.text('ct', 0, TMAX - 0.05, { dx: -6, align: 'right', color: 'muted', math: true });
          D.line(-0.25, -0.25, TMAX, TMAX, { color: 'gold', width: 1, alpha: 0.5, dash: [3, 3] }); D.line(0.25, -0.25, -1.3, 1.3, { color: 'gold', width: 1, alpha: 0.5, dash: [3, 3] });
          for (const s of [1, 2, 3, 4]) {
            D.curve((u) => [Math.sinh(u) * s, Math.cosh(u) * s], -1.6, 1.6, { color: 'faint', width: 1 });   // ct² − x² = s²: unit times
            if (s <= 2) D.curve((u) => [Math.cosh(u) * s, Math.sinh(u) * s], -0.9, 1.3, { color: 'faint', width: 1, dash: [2, 3] }); // x² − ct² = s²: unit lengths
          }
          // train axes
          const tAx = (s) => LTinv(b, s, 0), xAx = (s) => LTinv(b, 0, s);
          D.arrow(...[tAx(-0.2)[1], tAx(-0.2)[0]], ...[tAx(TMAX / g * 0.98)[1], tAx(TMAX / g * 0.98)[0]], { color: 'accent', width: 2, head: 8 });
          D.arrow(...[xAx(-0.4)[1], xAx(-0.4)[0]], ...[xAx(3.1 / g)[1], xAx(3.1 / g)[0]], { color: 'accent', width: 2, head: 8 });
          const tl = tAx(TMAX / g * 0.92), xl = xAx(3.0 / g);
          D.text('ct′', tl[1], tl[0], { dx: 8, color: 'accent', math: true }); D.text('x′', xl[1], xl[0], { dy: -12, color: 'accent', math: true });
          // the train: rear A at x′ = 0, front B at x′ = L0
          const wl = (xp) => [LTinv(b, -1, xp), LTinv(b, TMAX * 1.2, xp)].map(([t, x]) => [x, t]);
          D.clip(() => { D.path(wl(0), { color: 'accent', width: 1.4, alpha: 0.6 }); D.path(wl(L0), { color: 'accent', width: 1.4, alpha: 0.6 }); });
          D.clip(() => { const a = wl(0)[0], q = wl(L0)[0]; });
          // Einstein's synchronisation: emission at A (t′ = 0), reflection at B (t′ = L0), return at A (t′ = 2 L0)
          const e0 = LTinv(b, 0, 0), e1 = LTinv(b, L0, L0), e2 = LTinv(b, 2 * L0, 0);
          D.path([[e0[1], e0[0]], [e1[1], e1[0]], [e2[1], e2[0]]], { color: 'gold', width: 2.4 });
          [[e0, 'emit at A'], [e1, 'reflect at B'], [e2, 'back at A']].forEach(([e, s], k) => { D.dot(e[1], e[0], { r: 4.5, color: 'gold' }); D.text(s, e[1], e[0], { dx: k === 1 ? 8 : -8, align: k === 1 ? 'left' : 'right', size: 10.5, color: 'gold' }); });
          // simultaneity through the reflection event: train frame (blue dashed) vs platform (grey)
          const s1 = LTinv(b, L0, -1.5), s2 = LTinv(b, L0, 3);
          D.clip(() => D.line(s1[1], s1[0], s2[1], s2[0], { color: 'accent', dash: [6, 4], width: 1.4 }));
          D.line(-1.3, e1[0], 3.3, e1[0], { color: 'muted', dash: [2, 4], width: 1 });
          // train clock ticks on A's worldline (every 2H of proper time) and the platform's "now"
          for (let k = 1; k * 2 * H * g <= TMAX; k++) { const ev = LTinv(b, k * 2 * H, 0); D.dot(ev[1], ev[0], { r: 3, color: 'teal' }); }
          D.hline(now, { color: 'red', width: 1.2, alpha: 0.7 });
          D.text('now (platform)', 3.25, now, { dy: -8, align: 'right', size: 10, color: 'red' });
          // draggable event
          const [tp, xp] = LT(b, E.y, E.x);
          const pT = LTinv(b, tp, 0), pX = LTinv(b, 0, xp);
          D.line(E.x, E.y, pX[1], pX[0], { color: 'purple', dash: [3, 3], width: 1 }); D.line(E.x, E.y, pT[1], pT[0], { color: 'purple', dash: [3, 3], width: 1 });
          D.line(E.x, E.y, E.x, 0, { color: 'muted', dash: [1, 3], width: 1 }); D.line(E.x, E.y, 0, E.y, { color: 'muted', dash: [1, 3], width: 1 });
          // ---- light clocks
          const per0 = 2 * H, perT = 2 * H * g, tri = (t, p) => { const f = (t / p) % 1; return f < 0.5 ? 2 * f : 2 - 2 * f; };
          const yTop = 1.35, yBot = 0.05;
          // platform clock
          Kl.line(0.3, yTop, 0.9, yTop, { color: 'ink', width: 3 }); Kl.line(0.3, yTop + H * 1.6, 0.9, yTop + H * 1.6, { color: 'ink', width: 3 });
          Kl.dot(0.6, yTop + tri(now, per0) * H * 1.6, { r: 4.5, color: 'gold' });
          Kl.text(`ticks: ${Math.floor(now / per0)}`, 1.05, yTop + 0.4, { size: 11, color: 'ink' });
          // train clock moving at b (wraps across the panel)
          const span = 3.4, x0 = 0.3, xc = x0 + (((b * now) % span) + span) % span;
          Kl.line(xc - 0.3, yBot, xc + 0.3, yBot, { color: 'accent', width: 3 }); Kl.line(xc - 0.3, yBot + H * 1.6, xc + 0.3, yBot + H * 1.6, { color: 'accent', width: 3 });
          const trail = [];
          for (let k = 0; k <= 80; k++) { const t = Math.max(0, now - (k / 80) * perT); const xx = x0 + (((b * t) % span) + span) % span; trail.push(Math.abs(xx - xc) < span / 2 + 0.01 && (k === 0 || Math.abs(xx - trail[trail.length - 1]?.[0] ?? xx) < 0.5) ? [xx, yBot + tri(t, perT) * H * 1.6] : null); }
          Kl.path(trail, { color: 'gold', width: 1.4, alpha: 0.7 });
          Kl.dot(xc, yBot + tri(now, perT) * H * 1.6, { r: 4.5, color: 'gold' });
          Kl.text(`ticks: ${Math.floor(now / perT)}`, 3.95, yBot + 0.4, { size: 11, color: 'accent', align: 'right' });
          Kl.text(`platform time ${v.fix(now, 2)}: one platform tick = ${v.fix(per0, 2)}, one train tick = γ × ${v.fix(per0, 2)} = ${v.fix(perT, 2)}`, 2, 2.15, { align: 'center', size: 10.5, color: 'muted' });
          st = { b, g, tp, xp, e1 };
        }, { period: 2 * TMAX, still: 2 * 3.1 });
        v.legend([['accent', 'train axes, worldlines of A and B'], ['gold', 'light signal (Einstein’s synchronisation)'], ['teal', 'ticks of the train’s clock A', { dot: true }], ['purple', 'event E projected onto both frames', { dash: true }]]);
        v.readout(() => {
          const { b, g, tp, xp, e1 } = st; if (!g) return '';
          const legs = [1 / (g * (1 - b)) * L0, 1 / (g * (1 + b)) * L0], lagDay = 0.5 * 86400 * (V_EQ / C_SI) ** 2 * 1e9;
          return `$v/c$ = ${v.fix(b, 2)}, $\\gamma$ = ${v.fix(g, 4)} · light-clock tick on the train lasts ${v.fix(g, 4)}× longer in platform time · train clocks synchronised by Einstein's rule, $L$ = ${L0} apart, differ on the platform by $\\gamma vL/c^2$ = ${v.fix(g * b * L0, 3)}: the flash's legs take ${v.fix(legs[0], 3)} and ${v.fix(legs[1], 3)} platform units (train: ${L0} and ${L0}) · event E: platform $(ct, x)$ = (${v.fix(E.y, 2)}, ${v.fix(E.x, 2)}), train $(ct', x')$ = (${v.fix(tp, 2)}, ${v.fix(xp, 2)}); interval $c^2t^2-x^2$ = ${v.fix(E.y ** 2 - E.x ** 2, 3)} in both · test: muons at $\\gamma$ = ${BAILEY.gamma} live ${BAILEY.tau} ± ${BAILEY.err} µs (Bailey et al. 1977) against $\\gamma\\tau_0$ = ${v.fix(BAILEY.gamma * TAU_MU, 2)} µs · Einstein's equator clock: $\\tfrac12 v^2/c^2$ with $v$ = ${v.fix(V_EQ, 1)} m/s is ${v.fix(lagDay, 0)} ns per day — but on the geoid gravity cancels it exactly`;
        });
      },
    },
  ],
};
