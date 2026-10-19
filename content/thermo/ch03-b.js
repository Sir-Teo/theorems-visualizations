// Thermodynamics & Statistical Mechanics — Chapter 3 (part b): Maxwell relations, stability and the third law
import { clamp, lerp, R, vdw, pdiff, thermoSquare, bar, kellRho, kellKappa, kellAlpha, WATER, waterAt } from './ch03.shared.js';

// ---------- helpers for this part ----------
const L = 1e-3, KJ = 1e3, BAR = 1e5;
/** Signed logarithmic squash for colour maps of quantities spanning decades: sign(x) log10(1 + |x|/x0). */
const slog = (x, x0) => Math.sign(x) * Math.log10(1 + Math.abs(x) / x0);
/** Simpson integral. */
const simpson = (f, a, b, n = 200) => { const h = (b - a) / n; let s = f(a) + f(b); for (let i = 1; i < n; i++) s += f(a + i * h) * (i % 2 ? 4 : 2); return s * h / 3; };
/** State-variable accessors on the (T, v) plane for a van der Waals model M. */
const vars = (M) => ({ T: (T) => T, V: (T, v) => v, P: M.P, S: M.s, U: M.u, H: M.h });
/** Upper concave hull of sampled points (xs ascending): returns the hull as a function by linear interpolation. */
function hullFn(xs, ys, upper = true) {
  const sg = upper ? 1 : -1, H = [];
  for (let i = 0; i < xs.length; i++) {
    while (H.length >= 2) { const a = H[H.length - 2], b = H[H.length - 1]; const cr = (xs[b] - xs[a]) * (ys[i] - ys[a]) - (ys[b] - ys[a]) * (xs[i] - xs[a]); if (sg * cr >= 0) H.pop(); else break; }
    H.push(i);
  }
  const hx = H.map((i) => xs[i]), hy = H.map((i) => ys[i]);
  const f = (x) => { if (x <= hx[0]) return hy[0]; for (let k = 1; k < hx.length; k++) if (x <= hx[k]) return lerp(hy[k - 1], hy[k], (x - hx[k - 1]) / (hx[k] - hx[k - 1])); return hy[hy.length - 1]; };
  f.segs = []; for (let k = 1; k < hx.length; k++) if (H[k] - H[k - 1] > 2) f.segs.push([hx[k - 1], hx[k], hy[k - 1], hy[k]]);
  return f;
}

export default {
  collection: 'thermo',
  chapter: 3,
  items: [
    // ------------------------------------------------------------------ 3.11
    {
      num: '3.11', kind: 'Theorem', name: 'Maximum work and exergy',
      statement: String.raw`Let a body pass from a state $(U, S)$ to the dead state $(U_0, S_0)$ in which it is in equilibrium with an environment at temperature $T_0$ (and, if volume changes, pressure $P_0$). The work that can be extracted by any combination of engines that exchange heat only with the body and the environment is at most the **exergy** (availability)
$$W_{\max} = (U - U_0) - T_0(S - S_0) + P_0(V - V_0),$$
reached only by reversible operation. Any irreversibility destroys work in proportion to the entropy it generates: $W = W_{\max} - T_0\,S_{\text{gen}}$ (Gouy–Stodola). For a block of constant heat capacity $C$ at temperature $T_h$, $W_{\max} = C\big[(T_h - T_0) - T_0\ln(T_h/T_0)\big]$.`,
      idea: String.raw`Body, engines and environment form an isolated system. Energy conservation gives $W = (U - U_0) - Q_0$, where $Q_0$ is the heat dumped into the environment, and the entropy principle (2.10, 3.10) requires $Q_0/T_0 - (S - S_0) \ge 0$. So $Q_0 \ge T_0(S - S_0)$ and $W \le (U - U_0) - T_0(S - S_0)$; the gap is $T_0$ times the entropy generated. Equivalently, each parcel of heat $dQ = -C\,dT$ leaving the block at $T$ can run a Carnot engine of efficiency $1 - T_0/T$ (2.5), and the exergy is the integral of these efficiencies — a Riemann integral, approached from below by any finite sequence of engines.`,
      caption: String.raw`A hot block cools to the environment at 298 K through a sequence of engines. Horizontally: heat taken from the block so far; vertically: the efficiency available to the engine using that heat. The green curve $1 - T_0/T$ bounds the area — the exergy. Each engine works while the block cools through one temperature step, but can only use the *lowest* temperature of its step (the heat flows to it through a finite temperature difference), so the extracted work is the gold staircase: a lower Riemann sum. **Raise the number of engines** and the staircase fills the area; switch the engines to the Curzon–Ahlborn efficiency of 2.17 and it cannot. The bars give the work, the exergy, the heat released $\Delta U$ and the minimum heat $T_0\Delta S$ that must go to the environment.`,
      deps: ['thermo-3.10'],
      see: ['thermo-2.5', 'thermo-2.17'],
      refs: ['Schroeder §5.1', 'Callen ch. 4'],
      tags: ['exergy', 'maximum work'],
      credit: 'Gibbs, 1873 (available energy); Gouy, 1889; Stodola, 1898',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Exergy' },
      viz(v) {
        const T0 = 298.15;
        const nS = v.slider('number of engines', 1, 200, 4, { int: true, log: true });
        const Th = v.slider('block starts at $T_h$', 350, 1500, 900, { step: 5, fmt: (x) => x.toFixed(0) + ' K' });
        const C = v.slider('heat capacity $C$', 0.5, 5, 1, { step: 0.1, fmt: (x) => v.fix(x, 1) + ' kJ/K' });
        const eng = v.select('engines', [{ value: 'carnot', label: 'reversible (Carnot)' }, { value: 'ca', label: 'max power (Curzon–Ahlborn)' }], 'carnot');
        const sp = v.stage({ x: [0, 1], y: [0, 1], height: 330, axes: 'box', gutter: true, xlabel: 'heat drawn from the block (kJ)', ylabel: 'efficiency', weight: 1.35, title: 'work = area under the efficiency curve' });
        const sb = v.stage({ x: [-0.6, 3.6], y: [0, 1], height: 330, axes: 'box', gutter: true, ylabel: 'kJ', weight: 0.85, title: 'ledger', xticks: [[0, 'W'], [1, 'exergy'], [2, 'ΔU'], [3, 'T₀ΔS']] });
        let st = null;
        v.render(() => {
          const c = C.value, th = Th.value, n = nS.value, Qtot = c * (th - T0);
          const Tof = (Q) => th - Q / c, eff = (T) => (eng.value === 'carnot' ? 1 - T0 / T : 1 - Math.sqrt(T0 / T));
          sp.setView([0, Qtot], [0, 1]);
          sp.fn((Q) => 1 - T0 / Tof(Q), { domain: [0, Qtot * 0.9999], fill: 'green', fillAlpha: 0.14, color: 'green', width: 2.4 });
          if (eng.value === 'ca') sp.fn((Q) => 1 - Math.sqrt(T0 / Tof(Q)), { domain: [0, Qtot * 0.9999], color: 'orange', width: 1.6, dash: [6, 4] });
          let W = 0;
          for (let k = 1; k <= n; k++) {
            const Qa = Qtot * (k - 1) / n, Qb = Qtot * k / n, Tk = Tof(Qb), e = eff(Tk);
            W += (Qb - Qa) * e;
            sp.rect(Qa, 0, Qb, e, { fill: 'gold', fillAlpha: 0.55, color: 'gold', width: n > 60 ? 0 : 1 });
          }
          const Ex = c * ((th - T0) - T0 * Math.log(th / T0));
          // temperature ticks along the top
          for (const T of [400, 600, 800, 1000, 1200, 1400]) if (T < th) { const Q = c * (th - T); sp.vline(Q, { color: 'faint', width: 1, dash: [2, 4] }); sp.text(`${T} K`, Q, 0.97, { align: 'center', size: 10.5, color: 'muted', plate: true }); }
          sp.text('block temperature →', Qtot * 0.02, 0.9, { size: 11, color: 'muted' });
          const vals = [W, Ex, Qtot, c * T0 * Math.log(th / T0)];
          sb.setView([-0.6, 3.6], [0, Math.max(...vals) * 1.15]);
          const cl = ['gold', 'green', 'red', 'blue'];
          vals.forEach((x, i) => { bar(sb, i, x, 0.32, cl[i]); sb.text(v.fix(x, 1), i, x, { dy: -10, align: 'center', size: 11, plate: true }); });
          st = { W, Ex, Qtot, n, Sgen: (Ex - W) / T0 };
        });
        v.legend([['green', 'Carnot bound $1 - T_0/T$ (area = exergy)', { area: true }], ['gold', 'work of the engines', { area: true }]]);
        v.readout(() => {
          if (!st) return '';
          const { W, Ex, Qtot, n, Sgen } = st;
          return `${n} engine${n > 1 ? 's' : ''}: work **${v.fix(W, 2)} kJ** · exergy $C[(T_h - T_0) - T_0\\ln(T_h/T_0)]$ = **${v.fix(Ex, 2)} kJ** (${v.fix(100 * W / Ex, 1)} % of it) out of $\\Delta U$ = ${v.fix(Qtot, 1)} kJ · entropy generated $S_{\\text{gen}}$ = ${v.fix(Sgen * 1e3, 2)} J/K, and $T_0 S_{\\text{gen}}$ = ${v.fix(Ex - W, 2)} kJ is exactly the work lost`;
        });
      },
    },
    // ------------------------------------------------------------------ 3.12
    {
      num: '3.12', kind: 'Theorem', name: 'Maxwell relations',
      statement: String.raw`For a simple system with fixed $N$, equality of the mixed second derivatives of $U(S, V)$, $H(S, P)$, $F(T, V)$ and $G(T, P)$ gives
$$\left(\frac{\partial T}{\partial V}\right)_S = -\left(\frac{\partial P}{\partial S}\right)_V,\quad \left(\frac{\partial T}{\partial P}\right)_S = \left(\frac{\partial V}{\partial S}\right)_P,\quad \left(\frac{\partial S}{\partial V}\right)_T = \left(\frac{\partial P}{\partial T}\right)_V,\quad -\left(\frac{\partial S}{\partial P}\right)_T = \left(\frac{\partial V}{\partial T}\right)_P.$$
They hold for every substance whose potentials are twice continuously differentiable, and they turn hard-to-measure entropy derivatives into derivatives of the equation of state. (Allowing $N$ to vary gives further relations such as $(\partial\mu/\partial V)_{T,N} = -(\partial P/\partial N)_{T,V}$.)`,
      idea: String.raw`From $dF = -S\,dT - P\,dV$ (3.7), $S = -\partial_T F$ and $P = -\partial_V F$; Schwarz's theorem (pma 9.41) on $\partial_V\partial_T F = \partial_T\partial_V F$ gives $(\partial S/\partial V)_T = (\partial P/\partial T)_V$. The other three come the same way from $dU$, $dH$, $dG$. The **thermodynamic square** remembers them all: potentials sit on the sides between their natural variables, and each relation is read off by walking around a corner — the sign is minus when the two arrows point differently. The content is that the "entropy side" of each equation, which no instrument measures directly, equals a mechanical derivative of $P$, $V$, $T$.`,
      caption: String.raw`Carbon dioxide as a van der Waals fluid over the plane of molar volume and temperature (the critical point is the gold dot; the dark curve bounds the unstable region below it, where the identities still hold mathematically). Choose a relation: the left map is its left-hand side, the right map its right-hand side, each **computed independently by finite differences** — moving along a curve of constant $T$, $S$, $P$ or $V$ found numerically — and shown on the same signed-log colour scale with the same contour levels. The two maps are indistinguishable. **Drag the probe** to compare the numbers. The square highlights the potential whose mixed derivatives are being equated.`,
      deps: ['thermo-3.7', 'pma-9.41'],
      see: ['thermo-3.13', 'thermo-4.1'],
      refs: ['Callen ch. 7', 'Tong ch. 4'],
      tags: ['Maxwell relations', 'van der Waals'],
      credit: 'Maxwell, 1871 (Theory of Heat); the square is due to Max Born, 1929',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Maxwell_relations' },
      viz(v) {
        const REL = {
          F: { lhs: ['S', 'V', 'T', 1], rhs: ['P', 'T', 'V', 1], tex: '\\left(\\frac{\\partial S}{\\partial V}\\right)_T = \\left(\\frac{\\partial P}{\\partial T}\\right)_V', unit: 'Pa/K' },
          G: { lhs: ['S', 'P', 'T', -1], rhs: ['V', 'T', 'P', 1], tex: '-\\left(\\frac{\\partial S}{\\partial P}\\right)_T = \\left(\\frac{\\partial V}{\\partial T}\\right)_P', unit: 'm³/(mol K)' },
          U: { lhs: ['T', 'V', 'S', 1], rhs: ['P', 'S', 'V', -1], tex: '\\left(\\frac{\\partial T}{\\partial V}\\right)_S = -\\left(\\frac{\\partial P}{\\partial S}\\right)_V', unit: 'K mol/m³' },
          H: { lhs: ['T', 'P', 'S', 1], rhs: ['V', 'S', 'P', 1], tex: '\\left(\\frac{\\partial T}{\\partial P}\\right)_S = \\left(\\frac{\\partial V}{\\partial S}\\right)_P', unit: 'K/Pa' },
        };
        const which = v.select('potential', [{ value: 'F', label: '$F(T, V)$' }, { value: 'G', label: '$G(T, P)$' }, { value: 'U', label: '$U(S, V)$' }, { value: 'H', label: '$H(S, P)$' }], 'F');
        const M = vdw('CO2'), Vv = vars(M);
        const X = [0.07, 2], Y = [220, 480];
        const mk = (title) => v.stage({ x: X, y: Y, xlog: true, height: 320, axes: 'box', gutter: true, xlabel: 'v (L/mol)', ylabel: 'T (K)', title, minWidth: 230 });
        const sa = mk('left-hand side'), sb = mk('right-hand side');
        const sq = v.stage({ x: [-1.6, 1.6], y: [-2.3, 1.6], equal: true, height: 320, axes: false, weight: 0.62, minWidth: 180, title: 'thermodynamic square' });
        const pr = sa.handle(0.35, 330, { color: 'gold', label: 'probe' });
        const side = (k, w) => { const [A, B, Cc, sg] = REL[k][w]; return (T, vL) => sg * pdiff(Vv[A], Vv[B], Vv[Cc], T, vL * L); };
        let st = null;
        v.render(() => {
          const k = which.value, r = REL[k], fa = side(k, 'lhs'), fb = side(k, 'rhs');
          // colour scale: signed log of the values, range from the 3rd–97th percentiles of a coarse grid of the left side
          const raw = []; for (let i = 0; i < 14; i++) for (let j = 0; j < 14; j++) { const x = fa(Y[0] + (Y[1] - Y[0]) * (j + 0.5) / 14, X[0] * (X[1] / X[0]) ** ((i + 0.5) / 14)); if (isFinite(x)) raw.push(x); }
          const mags = raw.map(Math.abs).sort((a, b) => a - b), x0 = mags[Math.floor(mags.length / 2)] * 0.05 || 1;
          const sl = raw.map((x) => slog(x, x0)).sort((a, b) => a - b), p3 = sl[Math.floor(sl.length * 0.03)], p97 = sl[Math.floor(sl.length * 0.97)];
          const pos = p3 > 0, neg = p97 < 0, m = Math.max(Math.abs(p3), Math.abs(p97));
          const opt = pos || neg ? { range: [p3, p97], cmap: 'theme', color: pos ? 'red' : 'blue' } : { range: [-m, m], cmap: 'theme-diverging', neg: 'blue', pos: 'red' };
          const ga = (vL, T) => slog(fa(T, vL), x0), gb = (vL, T) => slog(fb(T, vL), x0);
          sa.heat(ga, { ...opt, res: 4, key: 'a' + k }); sb.heat(gb, { ...opt, res: 4, key: 'b' + k });
          const lv = Array.from({ length: 7 }, (_, i) => lerp(opt.range[0], opt.range[1], (i + 0.5) / 7));
          const stab = (g) => (vL, T) => (pdiff(M.P, Vv.V, Vv.T, T, vL * L) < 0 ? g(vL, T) : NaN);
          sa.contour(stab(ga), lv, { color: 'ink', width: 0.8, alpha: 0.35, res: 55 }); sb.contour(stab(gb), lv, { color: 'ink', width: 0.8, alpha: 0.35, res: 55 });
          const spin = (vL, T) => pdiff(M.P, Vv.V, Vv.T, T, vL * L);
          for (const s of [sa, sb]) {
            s.contour(spin, [0], { color: 'ink', width: 1.4, alpha: 0.7, res: 70 });
            s.dot(M.vc / L, M.Tc, { r: 5, color: 'gold', hollow: true });
          }
          sa.text('unstable', 0.11, 238, { size: 11, color: 'ink', plate: true });
          sb.dot(pr.x, pr.y, { r: 6, color: 'gold' });
          // square
          const corners = [...new Set([...r.lhs.slice(0, 3), ...r.rhs.slice(0, 3)])];
          thermoSquare(sq, 0, 0.1, 1.05, { hot: k, corners });
          sq.tex(r.tex, 0, -1.65, { align: 'center', size: 14 });
          const a = fa(pr.y, pr.x), b = fb(pr.y, pr.x);
          st = { a, b, r };
        });
        v.readout(() => {
          if (!st) return '';
          const { a, b, r } = st;
          return `probe at $v$ = ${v.fix(pr.x, 3)} L/mol, $T$ = ${v.fix(pr.y, 1)} K: left side = **$${v.sci(a, 6)}$**, right side = **$${v.sci(b, 6)}$** ${r.unit} · relative difference $${v.sci(Math.abs(a - b) / Math.max(Math.abs(a), Math.abs(b), 1e-300), 1)}$ (finite-difference rounding)`;
        });
      },
    },
    // ------------------------------------------------------------------ 3.13
    {
      num: '3.13', kind: 'Method', name: 'Manipulating partial derivatives',
      statement: String.raw`Any first derivative $(\partial X/\partial Y)_Z$ of state variables of a simple system with fixed $N$ can be expressed in terms of three measurable ones — the heat capacity $c_P = T(\partial s/\partial T)_P$, the expansion coefficient $\alpha = \tfrac1v(\partial v/\partial T)_P$ and the isothermal compressibility $\kappa_T = -\tfrac1v(\partial v/\partial P)_T$ — together with $T$, $P$, $v$. The tools are:

- the reciprocal rule $(\partial X/\partial Y)_Z = 1/(\partial Y/\partial X)_Z$ and the triple product rule $(\partial X/\partial Y)_Z(\partial Y/\partial Z)_X(\partial Z/\partial X)_Y = -1$;
- the chain rule through an intermediate variable, or Jacobians $\partial(X, Z)/\partial(Y, Z)$;
- the differentials $dU, dH, dF, dG$ to eliminate potentials, and the Maxwell relations (3.12) to eliminate entropy derivatives at constant $T$.

Examples: the adiabatic coefficient $(\partial T/\partial P)_s = Tv\alpha/c_P$, the Joule–Thomson coefficient $(\partial T/\partial P)_h = v(T\alpha - 1)/c_P$, the Joule coefficient $(\partial T/\partial v)_u = -(T\alpha/\kappa_T - P)/c_v$.`,
      idea: String.raw`With two independent variables every state function is a function on a plane, so partial derivatives obey the rules of the implicit function theorem (pma 9.28) and the chain rule (pma 9.38) for maps of the plane; Jacobians make the bookkeeping mechanical because $\partial(X, Z)/\partial(Y, Z) = (\partial X/\partial Y)_Z$ and Jacobians multiply. The recipe: bring potentials into the numerator and remove them with their differentials; bring entropy into the numerator and remove it with a Maxwell relation or $c_P/T$; finally replace $(\partial v/\partial T)_P$ and $(\partial v/\partial P)_T$ by $v\alpha$ and $-v\kappa_T$. The Joule–Thomson coefficient changes sign on the **inversion curve** $T\alpha = 1$: throttling cools a gas only inside it, which is how gases are liquefied (chapter 4).`,
      caption: String.raw`Choose a derivative and step through its reduction with ▶. The final line is evaluated for nitrogen as a van der Waals fluid at the probe state, with $c_P$, $\alpha$ and $\kappa_T$ themselves measured by finite differences — and compared with a *direct* finite difference taken along a numerically traced adiabat, isenthalp or line of constant energy. The map shows the chosen derivative over the $(T, P)$ plane; for Joule–Thomson the green curve is the inversion curve where it vanishes. The van der Waals model puts nitrogen's maximum inversion temperature at $2a/Rb$ ≈ 851 K; the measured value is about 621 K (marked), a reminder that the model is qualitative.`,
      deps: ['pma-9.28', 'pma-9.38', 'thermo-3.12'],
      see: ['thermo-3.14', 'thermo-4.1'],
      refs: ['Callen ch. 7', 'Kardar §1.8', 'Zemansky & Dittman, Heat and Thermodynamics (N₂ inversion temperature)'],
      tags: ['partial derivatives', 'Joule–Thomson'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Joule%E2%80%93Thomson_effect' },
      viz(v) {
        const M = vdw('N2'), Vv = vars(M);
        const TGT = {
          JT: { label: 'Joule–Thomson $(\\partial T/\\partial P)_h$', hold: 'H', unit: 'K/bar', scale: BAR,
            lines: ['\\left(\\frac{\\partial T}{\\partial P}\\right)_h = -\\frac{(\\partial h/\\partial P)_T}{(\\partial h/\\partial T)_P}', '(\\partial h/\\partial P)_T = T\\left(\\frac{\\partial s}{\\partial P}\\right)_T + v,\\quad (\\partial h/\\partial T)_P = c_P', '\\left(\\frac{\\partial s}{\\partial P}\\right)_T = -\\left(\\frac{\\partial v}{\\partial T}\\right)_P = -v\\alpha', '\\left(\\frac{\\partial T}{\\partial P}\\right)_h = \\frac{v\\,(T\\alpha - 1)}{c_P}'],
            notes: ['Triple product rule: trade the constant $h$ for a ratio of derivatives of $h$.', 'Use $dh = T\\,ds + v\\,dP$ to remove the enthalpy.', 'Maxwell relation from $G$ removes the entropy derivative.', 'Only measurable quantities remain. It vanishes on the inversion curve $T\\alpha = 1$.'],
            final: (q) => q.v * (q.T * q.alpha - 1) / q.cP },
          ad: { label: 'adiabatic $(\\partial T/\\partial P)_s$', hold: 'S', unit: 'K/bar', scale: BAR,
            lines: ['\\left(\\frac{\\partial T}{\\partial P}\\right)_s = -\\frac{(\\partial s/\\partial P)_T}{(\\partial s/\\partial T)_P}', '(\\partial s/\\partial T)_P = c_P/T', '\\left(\\frac{\\partial s}{\\partial P}\\right)_T = -v\\alpha', '\\left(\\frac{\\partial T}{\\partial P}\\right)_s = \\frac{Tv\\alpha}{c_P}'],
            notes: ['Triple product rule.', 'Definition of the heat capacity at constant pressure.', 'Maxwell relation from $G$.', 'Always positive when $\\alpha > 0$: adiabatic compression heats.'],
            final: (q) => q.T * q.v * q.alpha / q.cP },
          J: { label: 'Joule $(\\partial T/\\partial v)_u$', hold: 'U', unit: 'K mol/L', scale: L,
            lines: ['\\left(\\frac{\\partial T}{\\partial v}\\right)_u = -\\frac{(\\partial u/\\partial v)_T}{(\\partial u/\\partial T)_v}', '(\\partial u/\\partial v)_T = T\\left(\\frac{\\partial s}{\\partial v}\\right)_T - P,\\quad (\\partial u/\\partial T)_v = c_v', '\\left(\\frac{\\partial s}{\\partial v}\\right)_T = \\left(\\frac{\\partial P}{\\partial T}\\right)_v = \\frac{\\alpha}{\\kappa_T}', '\\left(\\frac{\\partial T}{\\partial v}\\right)_u = -\\frac{T\\alpha/\\kappa_T - P}{c_v}'],
            notes: ['Triple product rule.', 'Use $du = T\\,ds - P\\,dv$ to remove the energy.', 'Maxwell relation from $F$, then the triple product rule for $(\\partial P/\\partial T)_v$.', 'Free expansion cools a real gas; for van der Waals this is exactly $-a/(c_v v^2)$.'],
            final: (q) => -(q.T * q.alpha / q.kT - q.P) / q.cv },
        };
        const tgt = v.select('derivative', Object.entries(TGT).map(([value, o]) => ({ value, label: o.label })), 'JT', { onChange: () => S.reset(frames(), { at: 'end' }) });
        const frames = () => { const t = TGT[tgt.value]; return t.lines.map((_, i) => ({ k: i, note: t.notes[i] })); };
        const S = v.steps({ frames: frames(), start: 'end', still: 3 });
        const sw = v.stage({ x: [0, 1], y: [0, 1], height: 330, axes: false, weight: 1, title: 'reduction' });
        const sm = v.stage({ x: [140, 1000], y: [1, 500], height: 330, axes: 'box', gutter: true, xlabel: 'T (K)', ylabel: 'P (bar)', weight: 1.05, title: 'the derivative over the (T, P) plane' });
        const pr = sm.handle(300, 50, { color: 'gold', label: 'probe' });
        const meas = (T, P) => {   // measurable coefficients by finite differences, at (T, P)
          const vv = M.vOf(T, P), Tf = Vv.T, Vf = Vv.V;
          const dvdT = pdiff(Vf, Tf, M.P, T, vv), dvdP = pdiff(Vf, M.P, Tf, T, vv);
          return { T, P, v: vv, alpha: dvdT / vv, kT: -dvdP / vv, cP: T * pdiff(M.s, Tf, M.P, T, vv), cv: T * pdiff(M.s, Tf, Vf, T, vv) };
        };
        const direct = (k, T, P) => { const vv = M.vOf(T, P), t = TGT[k]; return k === 'J' ? pdiff(Vv.T, Vv.V, Vv.U, T, vv) : pdiff(Vv.T, M.P, Vv[t.hold], T, vv); };
        let st = null;
        v.render(() => {
          const k = tgt.value, t = TGT[k], f = S.frame || { k: 3 };
          // blackboard
          t.lines.forEach((ln, i) => { if (i > f.k) return; sw.tex(ln, 0.02, 0.88 - i * 0.235, { align: 'left', size: i === 3 ? 16 : 14.5, color: i === f.k ? 'accent' : 'ink' }); });
          for (let i = 1; i <= f.k; i++) sw.line(0.02, 0.88 - i * 0.235 + 0.11, 0.98, 0.88 - i * 0.235 + 0.11, { color: 'grid', width: 1 });
          // map
          const val = (T, PB) => direct(k, T, PB * BAR) * t.scale;
          const [x0c, rc] = k === 'J' ? [0.5, 3.6] : [0.1, 0.9];
          sm.heat((T, PB) => slog(val(T, PB), x0c), { range: [-rc, rc], cmap: 'theme-diverging', neg: k === 'JT' ? 'red' : 'blue', pos: k === 'JT' ? 'blue' : 'red', res: 4, key: 'm' + k });
          if (k === 'ad') sm.corner('red: positive everywhere — adiabatic compression heats', 'tl', { color: 'red', plate: true });
          if (k === 'J') sm.corner('blue: negative everywhere — free expansion cools', 'tl', { color: 'blue', plate: true });
          if (k === 'JT') {
            sm.contour((T, PB) => val(T, PB), [0], { color: 'green', width: 2.6, res: 80 });
            sm.vline(621, { color: 'ink', dash: [5, 4], width: 1.3 });
            sm.text('measured N₂ max. inversion ≈ 621 K', 615, 470, { size: 11, color: 'ink', plate: true, align: 'right' });
            sm.text('cools on throttling', 200, 120, { size: 11.5, color: 'blue', weight: 650, plate: true });
            sm.text('heats', 940, 420, { size: 11.5, color: 'red', weight: 650, plate: true, align: 'right' });
          }
          const q = meas(pr.x, pr.y * BAR), fin = t.final(q) * t.scale, dir = direct(k, pr.x, pr.y * BAR) * t.scale;
          if (f.k === 3) sw.text(`at the probe: ${v.fix(fin, 5)} ${t.unit}`, 0.02, 0.06, { size: 12.5, weight: 650, color: 'green' });
          st = { q, fin, dir, t };
        });
        v.readout(() => {
          if (!st) return '';
          const { q, fin, dir, t } = st;
          return `N₂ (van der Waals) at ${v.fix(q.T, 0)} K, ${v.fix(q.P / BAR, 1)} bar: $v$ = ${v.fix(q.v / L, 4)} L/mol, $c_P$ = ${v.fix(q.cP, 3)} J/(mol K), $c_v$ = ${v.fix(q.cv, 3)}, $\\alpha$ = $${v.sci(q.alpha, 4)}$ K⁻¹, $\\kappa_T$ = $${v.sci(q.kT * BAR, 4)}$ bar⁻¹ · reduced formula: **${v.fix(fin, 5)} ${t.unit}** · direct finite difference along the constant-${t.hold === 'H' ? 'h' : t.hold === 'S' ? 's' : 'u'} curve: **${v.fix(dir, 5)} ${t.unit}**`;
        });
      },
    },
    // ------------------------------------------------------------------ 3.14
    {
      num: '3.14', kind: 'Theorem', name: 'C_P − C_V = TVα²/κ_T',
      statement: String.raw`For any simple system,
$$C_P - C_V = \frac{TV\alpha^2}{\kappa_T},\qquad \alpha = \frac1V\left(\frac{\partial V}{\partial T}\right)_P,\quad \kappa_T = -\frac1V\left(\frac{\partial V}{\partial P}\right)_T,$$
and also $\kappa_T - \kappa_S = TV\alpha^2/C_P$, so $C_P/C_V = \kappa_T/\kappa_S$. Since stability requires $\kappa_T > 0$ (3.15), $C_P \ge C_V$, with equality exactly where $\alpha = 0$ — for water at about 4 °C, its density maximum. For an ideal gas $\alpha = 1/T$, $\kappa_T = 1/P$ and the formula reduces to $C_P - C_V = nR$ (1.15).`,
      idea: String.raw`Write $S(T, P) = S(T, V(T, P))$, so $(\partial S/\partial T)_P = (\partial S/\partial T)_V + (\partial S/\partial V)_T(\partial V/\partial T)_P$. Multiply by $T$: $C_P = C_V + T(\partial P/\partial T)_V\,V\alpha$ after the Maxwell relation $(\partial S/\partial V)_T = (\partial P/\partial T)_V$ (3.12); the triple product rule (3.13) gives $(\partial P/\partial T)_V = \alpha/\kappa_T$. The difference is the extra heat needed at constant pressure to do the work of expansion against the cohesive and external forces — zero when the body does not expand.`,
      caption: String.raw`**Water**: the dots are $c_p$ and $c_v$ of liquid water at 1 atm from the IAPWS-95 formulation (NIST Chemistry WebBook); the right panel compares their tabulated difference with $T\alpha^2/(\rho\kappa_T)$ computed from Kell's 1975 fits of density and compressibility — two independent sources that agree. The gap closes at 3.98 °C where $\alpha$ changes sign. **Drag the cursor**. Switch to **CO₂ near its critical point** (van der Waals, 80 bar): here $c_P$ and $c_V$ are each measured by finite differences of the model's state functions, and the formula tracks a huge, sharp peak in the difference.`,
      deps: ['thermo-3.12', 'thermo-3.13'],
      see: ['thermo-1.15', 'thermo-1.13'],
      refs: ['Callen ch. 7', 'Kell, J. Chem. Eng. Data 20, 97 (1975)', 'Wagner & Pruß, J. Phys. Chem. Ref. Data 31, 387 (2002) — IAPWS-95, via the NIST Chemistry WebBook'],
      tags: ['heat capacity', 'water'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Relations_between_heat_capacities' },
      viz(v) {
        const sub = v.select('substance', [{ value: 'w', label: 'liquid water, 1 atm (data)' }, { value: 'c', label: 'CO₂ at 80 bar (van der Waals)' }], 'w', { onChange: () => cur.set(sub.value === 'w' ? 30 : 330, 0) });
        const sl = v.stage({ x: [0, 100], y: [3.7, 4.25], height: 320, axes: 'box', gutter: true, xlabel: 't (°C)', ylabel: 'kJ/(kg K)', weight: 1, title: 'the two heat capacities' });
        const sr = v.stage({ x: [0, 100], y: [0, 0.5], height: 320, axes: 'box', gutter: true, xlabel: 't (°C)', ylabel: 'kJ/(kg K)', weight: 1, title: '$c_p - c_v$ against $T\\alpha^2/\\rho\\kappa_T$' });
        let cy = 3.74;
        const cur = sl.handle(30, 3.74, { color: 'gold', constrain: (x) => [x, cy] });
        const M = vdw('CO2'), Vv = vars(M), PC = 80 * BAR;
        const co2 = (T) => { const vv = M.vOf(T, PC); const cP = T * pdiff(M.s, Vv.T, M.P, T, vv), cV = T * pdiff(M.s, Vv.T, Vv.V, T, vv); const a = pdiff(Vv.V, Vv.T, M.P, T, vv) / vv, k = -pdiff(Vv.V, M.P, Vv.T, T, vv) / vv; return { cP, cV, f: T * vv * a * a / k, a, k }; };
        let st = null;
        v.render(() => {
          if (sub.value === 'w') {
            sl.setView([0, 100], [3.72, 4.26]); sr.setView([0, 100], [-0.02, 0.5]);
            sl.setLabels('t (°C)', 'kJ/(kg K)'); sr.setLabels('t (°C)', 'kJ/(kg K)');
            cy = 3.74; cur.set(clamp(cur.x, 0.5, 99.5), cy);
            sl.path(WATER.map((r) => [r[0], r[1]]), { color: 'red', width: 1.6, alpha: 0.6 }); sl.dots(WATER.map((r) => [r[0], r[1]]), { r: 4.5, color: 'red' });
            sl.path(WATER.map((r) => [r[0], r[2]]), { color: 'blue', width: 1.6, alpha: 0.6 }); sl.dots(WATER.map((r) => [r[0], r[2]]), { r: 4.5, color: 'blue' });
            sl.tex('c_p', 95, 4.215, { size: 16, color: 'red', align: 'right', dy: -12 }); sl.tex('c_v', 95, 3.79, { size: 16, color: 'blue', align: 'right', dy: -14 });
            const f = (t) => (t + 273.15) * kellAlpha(t) ** 2 / (kellRho(t) * kellKappa(t)) / KJ;
            sr.fn(f, { color: 'green', width: 2.6, domain: [0, 100] });
            sr.dots(WATER.map((r) => [r[0], r[1] - r[2]]), { r: 4.5, color: 'ink' });
            sr.vline(3.98, { color: 'faint', dash: [4, 4] }); sr.text('α = 0 at 3.98 °C', 5, 0.46, { size: 11, color: 'muted' });
            const t = cur.x; sl.vline(t, { color: 'gold', width: 1.4 }); sr.vline(t, { color: 'gold', width: 1.4 });
            st = { w: true, t, cp: waterAt(t, 1), cv: waterAt(t, 2), f: f(t), a: kellAlpha(t), k: kellKappa(t), rho: kellRho(t) };
            v.legend([['red', '$c_p$ (IAPWS-95)', { dot: true }], ['blue', '$c_v$ (IAPWS-95)', { dot: true }], ['ink', '$c_p - c_v$ tabulated', { dot: true }], ['green', '$T\\alpha^2/\\rho\\kappa_T$ from Kell (1975)']]);
          } else {
            const T0 = 296, T1 = 420;
            const pts = []; for (let i = 0; i <= 140; i++) { const T = T0 + (T1 - T0) * i / 140, q = co2(T); pts.push([T, q]); }
            const mx = Math.max(...pts.map((p) => p[1].cP));
            sl.setView([T0, T1], [0, mx * 1.08]); sr.setView([T0, T1], [0, Math.max(...pts.map((p) => p[1].cP - p[1].cV)) * 1.1]);
            sl.setLabels('T (K)', 'J/(mol K)'); sr.setLabels('T (K)', 'J/(mol K)');
            cy = mx * 0.04; cur.set(clamp(cur.x, T0 + 1, T1 - 1), cy);
            sl.path(pts.map(([T, q]) => [T, q.cP]), { color: 'red', width: 2.4 }); sl.path(pts.map(([T, q]) => [T, q.cV]), { color: 'blue', width: 2.4 });
            sr.path(pts.map(([T, q]) => [T, q.cP - q.cV]), { color: 'ink', width: 5, alpha: 0.35 });
            sr.path(pts.map(([T, q]) => [T, q.f]), { color: 'green', width: 2, dash: [6, 4] });
            const T = cur.x, q = co2(T); sl.vline(T, { color: 'gold', width: 1.4 }); sr.vline(T, { color: 'gold', width: 1.4 });
            st = { w: false, T, ...q };
            v.legend([['red', '$c_P$ by finite differences'], ['blue', '$c_V$ by finite differences'], ['ink', '$c_P - c_V$'], ['green', '$Tv\\alpha^2/\\kappa_T$', { dash: true }]]);
          }
        });
        v.readout(() => {
          if (!st) return '';
          if (st.w) { const { t, cp, cv, f, a, k, rho } = st; return `water at ${v.fix(t, 1)} °C: $\\alpha$ = $${v.sci(a, 3)}$ K⁻¹, $\\kappa_T$ = $${v.sci(k, 4)}$ Pa⁻¹, $\\rho$ = ${v.fix(rho, 2)} kg/m³ → $T\\alpha^2/\\rho\\kappa_T$ = **${v.fix(f * 1000, 2)} J/(kg K)** · tabulated $c_p - c_v$ = **${v.fix((cp - cv) * 1000, 2)} J/(kg K)** (interpolated between table rows) · $c_p/c_v$ = ${v.fix(cp / cv, 4)}`; }
          const { T, cP, cV, f, a } = st;
          return `CO₂ at ${v.fix(T, 1)} K, 80 bar: $c_P$ = ${v.fix(cP, 2)}, $c_V$ = ${v.fix(cV, 3)} J/(mol K) → $c_P - c_V$ = **${v.fix(cP - cV, 3)}** · $Tv\\alpha^2/\\kappa_T$ = **${v.fix(f, 3)} J/(mol K)** · ($\\alpha$ = $${v.sci(a, 3)}$ K⁻¹; for an ideal gas the difference would be $R$ = 8.314)`;
        });
      },
    },
    // ------------------------------------------------------------------ 3.15
    {
      num: '3.15', kind: 'Theorem', name: 'Stability and concavity of entropy',
      statement: String.raw`An equilibrium state of a simple system is stable against internal redistribution only if the fundamental relation is **concave**: for all splits of the system into two parts with $(U \pm \Delta U, V \pm \Delta V)$ per half,
$$S(U + \Delta U, V + \Delta V) + S(U - \Delta U, V - \Delta V) \le 2S(U, V).$$
Locally: $\partial^2 S/\partial U^2 \le 0$, $\partial^2S/\partial V^2 \le 0$ and $S_{UU}S_{VV} - S_{UV}^2 \ge 0$, equivalently $C_V \ge 0$ and $\kappa_T \ge 0$. In the transformed potentials: $F$ is convex in $V$ and concave in $T$; $G$ is concave in both $T$ and $P$. Where a model's relation violates concavity, the system splits into two phases, and the true equilibrium relation is the **concave hull** (for $S$) or **convex hull** (for $F$) — straight segments joining coexisting phases.`,
      idea: String.raw`If the chord between $(U - \Delta U)$ and $(U + \Delta U)$ passed above $S(U)$, transferring $\Delta U$ from one half to the other would raise the total entropy, and by the maximum principle (3.4, 2.10) the uniform state would not be equilibrium. Concavity of a smooth function (rca 3.1 on convex functions) is equivalent to the second-derivative conditions; translated through $T$ and $P$ they read $C_V > 0$ and $\kappa_T > 0$. The Legendre transform (3.7) turns concavity of $S$ (convexity of $U$) into the stated properties of $F$ and $G$. The hull construction is the same as Maxwell's equal-area rule for the van der Waals loop (4.3).`,
      caption: String.raw`**Drag the state** along the curve and widen the split $\delta$. The two halves sit at the ends of the chord (dots); their average, the chord's midpoint, is compared with the uniform state. **Entropy picture** (a model $S(U)$ with a convex stretch, dimensionless, drawn tilted by the slope $1/T_{\text{co}}$ of its common tangent): where the curve is concave, splitting lowers the total entropy and the system returns to uniformity; on the convex stretch splitting *raises* it — the uniform state is unstable. The dashed concave hull is the true equilibrium entropy. **Van der Waals** (CO₂ below its critical temperature): stability now needs $F(v)$ convex. The left curve is drawn as $F(v) + P_{\text{co}}v$, tilted by the slope of the common tangent — a linear term changes neither convexity nor the outcome of a split — so the double well shows plainly. On the stretch where $F$ is not convex, the pressure rises with volume ($\kappa_T < 0$, red on the right) and the fluid separates into liquid and gas along the common tangent, whose slope gives the flat coexistence pressure.`,
      deps: ['thermo-3.4', 'rca-3.1', 'opt-3.3'],
      see: ['thermo-3.7', 'thermo-4.3', 'pchem-7.7'],
      refs: ['Callen ch. 8', 'Kardar §1.9'],
      tags: ['stability', 'convexity'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Thermodynamic_stability' },
      viz(v) {
        const mode = v.select('picture', [{ value: 'S', label: 'entropy S(U), concave?' }, { value: 'F', label: 'van der Waals F(v), convex?' }], 'F', { onChange: () => hd.set(mode.value === 'S' ? 1.9 : 0.15, 0) });
        const del = v.slider('split $\\delta$', 0.01, 0.6, 0.18, { step: 0.005, fmt: (x) => v.fix(x, 3) });
        const Tsl = v.slider('$T$ (van der Waals)', 240, 320, 270, { step: 1, fmt: (x) => x + ' K' });
        const sa = v.stage({ x: [0, 1], y: [0, 1], height: 330, axes: 'box', gutter: true, xlabel: 'v (L/mol)', ylabel: 'F', weight: 1.1 });
        const sb = v.stage({ x: [0, 1], y: [0, 1], height: 330, axes: 'box', gutter: true, xlabel: 'v (L/mol)', ylabel: 'P (bar)', weight: 1 });
        const CO2 = vdw('CO2');
        const Stoy = (u) => 2.2 * Math.log(u) + 0.25 * Math.tanh((u - 2) / 0.12);
        const hd = sa.handle(0.15, 0, { color: 'gold', label: 'state', constrain: (x) => [x, curveY(x)] });
        let curveY = (x) => 0;
        let st = null;
        v.render(() => {
          const S = mode.value === 'S'; Tsl.el.hidden = S;
          const T = Tsl.value;
          const X = S ? [0.8, 3.4] : [0.065, 0.8];
          // van der Waals: F(v) tilted by the common tangent, F + P_co v (a linear term changes neither convexity nor the split test)
          const f0 = (vL) => CO2.f(T, vL * L) / KJ;
          let tilt = 0;
          if (!S) { const xs0 = [], ys0 = []; for (let i = 0; i <= 800; i++) { const x = lerp(X[0], X[1], i / 800); xs0.push(x); ys0.push(f0(x)); } const h0 = hullFn(xs0, ys0, false); tilt = h0.segs.length ? -(h0.segs[0][3] - h0.segs[0][2]) / (h0.segs[0][1] - h0.segs[0][0]) : CO2.P(T, hd.x * L) * L / KJ; }
          if (S) { const xs0 = [], ys0 = []; for (let i = 0; i <= 800; i++) { const x = lerp(X[0], X[1], i / 800); xs0.push(x); ys0.push(Stoy(x)); } const h0 = hullFn(xs0, ys0, true); const sg = h0.segs[0]; tilt = sg ? -(sg[3] - sg[2]) / (sg[1] - sg[0]) : 0; }
          const f = S ? (u) => Stoy(u) + tilt * u : (vL) => f0(vL) + tilt * vL;
          curveY = f;
          const xs = [], ys = []; for (let i = 0; i <= 800; i++) { const x = lerp(X[0], X[1], i / 800); xs.push(x); ys.push(f(x)); }
          const hull = hullFn(xs, ys, S);
          const d = del.value * (S ? 1 : 0.25), x0 = clamp(hd.x, X[0] + d, X[1] - d);
          hd.set(x0, f(x0));
          let lo = Math.min(...ys), hi = Math.max(...ys);
          if (!S) { let bar0 = 0; xs.forEach((x, i) => { bar0 = Math.max(bar0, ys[i] - hull(x)); }); if (bar0 > 1e-4) hi = Math.min(hi, lo + 3.5 * bar0); }
          sa.setView(X, [lo - 0.06 * (hi - lo), hi + 0.08 * (hi - lo)]);
          sa.setTitle(S ? '$S(U) - U/T_{\\text{co}}$ — must be concave' : `$F(v) + P_{\\text{co}}v$ at ${T} K — must be convex`);
          sa.setLabels(S ? 'U' : 'v (L/mol)', S ? 'S − U/Tco' : 'F + Pco·v (kJ/mol)');
          for (const [a, b] of hull.segs) sa.vband(a, b, { color: 'red', alpha: 0.07 });
          sa.fn(f, { color: 'ink', width: 2.4, domain: X, n: 400 });
          sa.fn(hull, { color: 'green', width: 2, dash: [7, 5], domain: X, n: 400 });
          const xa = x0 - d, xb = x0 + d, ya = f(xa), yb = f(xb), mid = (ya + yb) / 2, y0 = f(x0);
          const gain = S ? mid - y0 : y0 - mid; // > 0 means splitting is favourable
          const col = gain > 0 ? 'red' : 'green';
          sa.line(xa, ya, xb, yb, { color: col, width: 2 });
          sa.dot(xa, ya, { r: 5, color: col }); sa.dot(xb, yb, { r: 5, color: col });
          sa.dot(x0, mid, { r: 5, color: col, hollow: true });
          sa.line(x0, y0, x0, mid, { color: col, width: 1.4, dash: [3, 3] });
          // second panel: slope of the relation
          let curv;
          if (S) {
            const dS = (u) => (Stoy(u + 1e-4) - Stoy(u - 1e-4)) / 2e-4, dH = (u) => (hull(u + 1e-3) - hull(u - 1e-3)) / 2e-3 - tilt;
            const ds = xs.map(dS);
            sb.setView(X, [Math.min(...ds) - 0.2, Math.max(...ds) + 0.2]);
            sb.setTitle('$1/T = dS/dU$: must decrease'); sb.setLabels('U', '1/T');
            sb.fn(dS, { color: 'ink', width: 2.4, domain: X, n: 400 });
            for (let i = 1; i < 800; i++) if (ds[i] > ds[i - 1]) sb.line(xs[i - 1], ds[i - 1], xs[i], ds[i], { color: 'red', width: 4 });
            sb.fn(dH, { color: 'green', width: 2, dash: [7, 5], domain: [X[0] + 0.01, X[1] - 0.01], n: 400 });
            curv = (Stoy(x0 + 1e-3) - 2 * Stoy(x0) + Stoy(x0 - 1e-3)) / 1e-6;
          } else {
            const P = (vL) => CO2.P(T, vL * L) / BAR, ps = xs.map(P);
            sb.setView(X, [Math.max(-60, Math.min(...ps)) - 5, Math.min(140, Math.max(...ps.slice(40))) + 5]);
            sb.setTitle('pressure $P = -\\partial F/\\partial v$: must fall'); sb.setLabels('v (L/mol)', 'P (bar)');
            sb.fn(P, { color: 'ink', width: 2.4, domain: X, n: 400 });
            for (let i = 1; i < 800; i++) if (ps[i] > ps[i - 1]) sb.line(xs[i - 1], ps[i - 1], xs[i], ps[i], { color: 'red', width: 4 });
            for (const [a, b, fa, fb] of hull.segs) { const Pco = (tilt - (fb - fa) / (b - a)) * KJ / L / BAR; sb.line(a, Pco, b, Pco, { color: 'green', width: 2.4, dash: [7, 5] }); sb.text(`coexistence ${v.fix(Pco, 1)} bar`, b, Pco, { dx: 6, dy: -10, size: 11, color: 'green', plate: true }); }
            sb.vline(x0, { color: 'gold', width: 1.2 });
            if (T >= CO2.Tc) sb.corner('above T_c: no unstable stretch', 'tr', { color: 'green' });
            curv = (f(x0 + 1e-4) - 2 * f(x0) + f(x0 - 1e-4)) / 1e-8;
          }
          st = { S, gain, curv, x0 };
        });
        v.legend([['green', 'hull = true equilibrium relation', { dash: true }], ['red', 'unstable stretch']]);
        v.readout(() => {
          if (!st) return '';
          const { S, gain, curv, x0 } = st;
          const what = S ? 'total entropy' : 'total free energy';
          return `state ${S ? 'U' : 'v'} = ${v.fix(x0, 3)}${S ? '' : ' L/mol'} · splitting into halves at ±δ changes the ${what} per half by **${S ? '+' : '−'}${v.fix(Math.abs(gain), 5)}${gain > 0 ? '' : ' (unfavourable)'}** ${S ? '' : 'kJ/mol'} → ${gain > 0 ? '**unstable**: the system separates' : '**stable**: it returns to uniformity'} · local curvature ${S ? "S''" : "F''"} = ${v.fix(curv, S ? 3 : 1)} ${S ? (curv < 0 ? '< 0 (concave)' : '> 0 (convex: unstable)') : (curv > 0 ? '> 0 (convex)' : '< 0 (κ_T < 0: unstable)')}`;
        });
      },
    },
    // ------------------------------------------------------------------ 3.17
    {
      num: '3.17', kind: 'Law', name: 'Third law of thermodynamics',
      statement: String.raw`**Nernst–Planck form.** As $T \to 0$ the entropy of a system in internal equilibrium approaches a constant independent of pressure, volume, field or phase; for a non-degenerate ground state that constant is zero, $S \to k\ln g_0$ in general.

Consequences: every heat capacity vanishes, $C \to 0$ (so $S = \int_0^T C\,dT'/T'$ converges); by the Maxwell relations (3.12) the expansion coefficient $\alpha = -\tfrac1V(\partial S/\partial P)_T \to 0$ and $(\partial P/\partial T)_V \to 0$; and absolute zero cannot be reached in finitely many steps (3.18). Glasses and crystals with frozen disorder (ice, CO) keep a **residual entropy** because they are not in internal equilibrium on laboratory timescales.`,
      idea: String.raw`Statistically, $S = k\ln\Omega$ and as $T \to 0$ only the ground level is occupied, so $\Omega \to g_0$. Quantization is essential: the gaps between levels make occupation of excited states die off like $e^{-\Delta/kT}$ (Einstein solid, two-level systems) or as a power (phonons in the Debye model give $C \propto T^3$), and $\int C\,dT/T$ then converges. A classical model with $C$ = const has $S = C\ln T + \text{const} \to -\infty$ — classical physics contradicts the third law, one of the first signs of quantum mechanics. Since $S(T, X)$ approaches the same value for every $X$, its derivatives with respect to $X$ vanish, and Maxwell's relations transfer this to $\alpha$.`,
      caption: String.raw`Entropy (left) and heat capacity (right, log–log) per mole against temperature in units of each model's characteristic temperature $\theta$. **Pick a model** and **drag the temperature**. The Einstein and Debye solids approach $S = 0$ with $C$ vanishing exponentially or as $T^3$ (slope 3 on the log axes); a two-level system with a doubly degenerate ground state keeps $R\ln 2$; ice, modelled as a Debye solid plus Pauling's count of proton arrangements, keeps $R\ln\tfrac32$ = 3.37 J/(K mol), against 3.4 ± 0.2 J/(K mol) measured calorimetrically by Giauque & Stout (1936). The classical solid's constant $C = 3R$ breaks the law: its entropy dives to $-\infty$.`,
      deps: ['thermo-3.12'],
      see: ['thermo-3.18'],
      refs: ['Kardar §1.10', 'Callen ch. 11', 'Giauque & Stout, J. Am. Chem. Soc. 58, 1144 (1936)', 'Pauling, J. Am. Chem. Soc. 57, 2680 (1935)'],
      tags: ['third law', 'entropy'],
      credit: 'Nernst, 1906 (heat theorem); Planck, 1911 (S → 0)',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Third_law_of_thermodynamics' },
      viz(v) {
        const debyeS = (x) => { const I = simpson((y) => (y < 1e-9 ? y * y : y ** 3 / Math.expm1(y)), 0, Math.min(x, 60), 200); return 3 * (4 * I / x ** 3 - Math.log(-Math.expm1(-x))); };
        const debyeC = (x) => { const I = simpson((y) => (y < 1e-9 ? y * y : y ** 4 * Math.exp(y) / Math.expm1(y) ** 2), 0, Math.min(x, 60), 200); return 9 * I / x ** 3; };
        const MODELS = {
          E: { label: 'Einstein solid', color: 'blue', S: (t) => { const x = 1 / t; return 3 * (x / Math.expm1(x) - Math.log(-Math.expm1(-x))); }, C: (t) => { const x = 1 / t; return 3 * x * x * Math.exp(x) / Math.expm1(x) ** 2; } },
          D: { label: 'Debye solid', color: 'teal', S: (t) => debyeS(1 / t), C: (t) => debyeC(1 / t) },
          two: { label: 'two-level, $g_0 = 2$', color: 'purple', S: (t) => { const x = 1 / t, Z = 2 + Math.exp(-x); return Math.log(Z) + x * Math.exp(-x) / Z; }, C: (t) => { const x = 1 / t, Z = 2 + Math.exp(-x); return x * x * 2 * Math.exp(-x) / (Z * Z); } },
          ice: { label: 'ice (Debye + Pauling)', color: 'orange', S: (t) => debyeS(1 / t) + Math.log(1.5), C: (t) => debyeC(1 / t) },
          cl: { label: 'classical solid', color: 'red', S: (t) => 3 * (1 + Math.log(t)), C: () => 3 },
        };
        const which = v.select('model', Object.entries(MODELS).map(([value, o]) => ({ value, label: o.label })), 'ice');
        const tS = v.slider('$T/\\theta$', 0.01, 1.5, 0.3, { log: true, fmt: (x) => v.fix(x, 3) });
        const sa = v.stage({ x: [0, 1.5], y: [-1.2, 6], height: 330, axes: 'box', gutter: true, xlabel: 'T/θ', ylabel: 'S/R', weight: 1, title: 'entropy per mole' });
        const sb = v.stage({ x: [0.01, 1.5], y: [1e-6, 5], xlog: true, ylog: true, height: 330, axes: 'box', gutter: true, xlabel: 'T/θ', ylabel: 'C/R', weight: 1, title: 'heat capacity (log–log)' });
        let st = null;
        v.render(() => {
          const k = which.value, t = tS.value;
          sa.hline(0, { color: 'muted', width: 1 });
          sa.hline(Math.log(1.5), { color: 'orange', width: 1, dash: [3, 4], alpha: 0.7 });
          sa.hline(Math.log(2), { color: 'purple', width: 1, dash: [3, 4], alpha: 0.7 });
          for (const [key, m] of Object.entries(MODELS)) {
            const on = key === k;
            sa.fn(m.S, { color: m.color, width: on ? 3 : 1.3, alpha: on ? 1 : 0.4, domain: [0.004, 1.5], n: 300 });
            sb.fn(m.C, { color: m.color, width: on ? 3 : 1.3, alpha: on ? 1 : 0.4, domain: [0.01, 1.5], n: 200 });
          }
          sb.fn((x) => 234 * x ** 3, { color: 'ink', width: 1, dash: [5, 4], domain: [0.01, 0.06] });
          sb.text('∝ T³', 0.035, 234 * 0.035 ** 3, { dx: 6, dy: 12, size: 11, color: 'muted' });
          const m = MODELS[k], S = m.S(t), C = m.C(t);
          sa.vline(t, { color: 'gold', width: 1.3 }); sb.vline(t, { color: 'gold', width: 1.3 });
          sa.dot(t, S, { r: 6, color: m.color });
          if (C > 1e-6) sb.dot(t, C, { r: 6, color: m.color });
          sa.text('R ln(3/2): Pauling', 1.48, Math.log(1.5), { align: 'right', dy: 10, size: 10.5, color: 'orange' });
          sa.text('R ln 2', 1.48, Math.log(2), { align: 'right', dy: -9, size: 10.5, color: 'purple' });
          if (k === 'ice') sa.rect(0.0, 3.4 / R - 0.21 / R, 0.08, 3.4 / R + 0.21 / R, { fill: 'ink', fillAlpha: 0.15, color: 'ink', width: 1 });
          if (k === 'ice') sa.text('measured, 1936', 0.09, 3.4 / R, { dx: 4, dy: -12, size: 10.5, color: 'ink', plate: true });
          st = { S, C, t, k, S0: m.S(0.01) };
        });
        v.readout(() => {
          if (!st) return '';
          const { S, C, t, k, S0 } = st;
          return `${MODELS[k].label.replace(/\$/g, '')} at $T/\\theta$ = ${v.fix(t, 3)}: $S/R$ = **${v.fix(S, 4)}** (${v.fix(S * R, 2)} J/(K mol)), $C/R$ = $${v.sci(C, 3)}$ · at $T/\\theta$ = 0.01: $S/R$ = ${v.fix(S0, 4)} ${k === 'cl' ? '— and falling without bound: **violates** the third law' : k === 'ice' || k === 'two' ? `→ residual ${v.fix(S0 * R, 2)} J/(K mol)` : '→ 0'}`;
        });
      },
    },
    // ------------------------------------------------------------------ 3.18
    {
      num: '3.18', kind: 'Phenomenon', name: 'Unattainability of absolute zero',
      statement: String.raw`No finite sequence of processes can cool a system to $T = 0$. In a cooling scheme that alternates isothermal changes of a control parameter $X$ (magnetic field, pressure) with adiabatic ones, each step lowers the temperature by a fraction that shrinks as $T \to 0$, because the entropy curves $S(T, X_1)$ and $S(T, X_2)$ meet at $T = 0$ (3.17). Conversely, if the entropy curves for different $X$ ended at different values at $T = 0$, a single adiabatic step could reach absolute zero. Temperatures in the nanokelvin range are reached, but never zero.`,
      idea: String.raw`An adiabatic reversible step keeps $S$ fixed, so it moves horizontally between the two curves on a $T$–$S$ diagram; an isothermal step moves vertically. If both curves start from the same $S$ at $T = 0$, the horizontal step from $S(T, X_2)$ on the high-field curve lands at a positive temperature, and the staircase only approaches the origin. For an ideal paramagnet with a small internal field $b$, $S$ depends on $B_{\text{eff}}/T$ with $B_{\text{eff}} = \sqrt{B^2 + b^2}$, so each demagnetization multiplies $T$ by the fixed factor $b/\sqrt{B_1^2 + b^2}$: geometric decay, infinitely many steps. Setting $b = 0$ separates the curves at $T = 0$ ($S = k\ln 2$ for zero field) — violating the third law — and one step reaches zero.`,
      caption: String.raw`Adiabatic demagnetization of a model spin-½ paramagnet (moment $\mu_B$ per spin) starting at 1 K. The two curves are $S/Nk$ in zero field and in the field $B_1$. Step with ▶: magnetize at constant temperature (down), then demagnetize adiabatically (left). **Change $B_1$ and the internal field $b$**; turn on log axes to see equal steps in $\log T$ — the staircase never ends, while the entropy it works with shrinks toward zero. Set $b = 0$ and the zero-field curve no longer comes down to the origin: then a single demagnetization reaches $T = 0$, which is exactly what the third law forbids.`,
      deps: ['thermo-3.17'],
      refs: ['Tong ch. 4'],
      tags: ['third law', 'cooling'],
      credit: 'Nernst, 1912; adiabatic demagnetization proposed by Debye and Giauque, 1926',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Magnetic_refrigeration' },
      viz(v) {
        const MUK = 0.67171381563;  // μ_B / k_B in K/T (CODATA 2018)
        const B1 = v.slider('field $B_1$', 0.1, 2, 0.5, { step: 0.01, fmt: (x) => v.fix(x, 2) + ' T', onChange: () => S.reset(frames(), { at: 'keep' }) });
        const bS = v.slider('internal field $b$', 0, 0.2, 0.08, { step: 0.005, fmt: (x) => v.fix(x * 1000, 0) + ' mT', onChange: () => S.reset(frames(), { at: 'keep' }) });
        const lg = v.toggle('log axes', false);
        const Sof = (T, B) => { const Be = Math.hypot(B, bS.value); if (Be === 0) return Math.LN2; const x = MUK * Be / T; if (x > 300) return 0; if (x > 15) return Math.exp(-2 * x) * (1 + 2 * x); return Math.log(2 * Math.cosh(x)) - x * Math.tanh(x); };
        const T0 = 1;
        const frames = () => {
          const out = [{ T: T0, S: Sof(T0, 0), path: [[T0, Sof(T0, 0)]], cyc: 0, note: 'Start: the salt sits in zero field at 1 K, in contact with a bath.' }];
          let T = T0, path = [[T0, Sof(T0, 0)]];
          for (let c = 1; c <= 10; c++) {
            const s1 = Sof(T, B1.value); path = path.concat([[T, s1]]);
            out.push({ T, S: s1, path, cyc: c, note: `Cycle ${c}: magnetize at constant T = ${v.fmt(T, 3)} K; the field orders the spins and the entropy drops (heat goes to the bath).` });
            const be = Math.hypot(B1.value, bS.value), Tn = bS.value === 0 ? 0 : T * bS.value / be;
            path = path.concat([[Tn, s1]]); T = Tn;
            out.push({ T, S: s1, path, cyc: c, note: Tn === 0 ? 'Demagnetize adiabatically: with b = 0 the zero-field entropy is ln 2 at every T > 0, so the state at this entropy is T = 0 — reached in one step. The third law forbids this.' : `Demagnetize adiabatically (isolated): S stays fixed, B → 0, and T falls by the factor b/√(B₁² + b²) to ${v.fmt(Tn, 3)} K.` });
            if (Tn === 0) break;
          }
          return out;
        };
        const S = v.steps({ frames: frames(), start: 6, still: 6, speed: 1.2 });
        const sp = v.stage({ x: [0, 1.1], y: [0, 0.75], height: 340, axes: 'box', gutter: true, xlabel: 'T (K)', ylabel: 'S / Nk', weight: 1.4, title: 'entropy of the paramagnet' });
        const sc = v.stage({ x: [0, 11], y: [1e-12, 2], ylog: true, height: 340, axes: 'box', gutter: true, xlabel: 'cycle', ylabel: 'T (K)', weight: 0.8, title: 'temperature after each cycle' });
        let st = null;
        v.render(() => {
          const f = S.frame, L0 = lg.value;
          const xmin = Math.max(1e-6, (f.T || 1e-3) * 0.3);
          sp.setScale({ xlog: L0, ylog: L0, x: L0 ? [Math.min(1e-3, xmin), 1.5] : [0, 1.1], y: L0 ? [1e-14, 12] : [0, 0.75] });
          const dom = L0 ? [Math.min(1e-3, xmin), 1.5] : [1e-4, 1.1];
          sp.fn((T) => Sof(T, 0), { color: 'blue', width: 2.4, domain: dom, n: 400 });
          sp.fn((T) => Sof(T, B1.value), { color: 'red', width: 2.4, domain: dom, n: 400 });
          sp.hline(Math.LN2, { color: 'faint', dash: [3, 4] });
          sp.text('ln 2', L0 ? dom[0] * 1.3 : 0.02, Math.LN2, { dy: -9, size: 11, color: 'muted' });
          const pth = f.path.map(([T, s]) => [L0 ? Math.max(T, dom[0]) : T, s]);
          sp.path(pth, { color: 'gold', width: 2.6 });
          sp.dot(L0 ? Math.max(f.T, dom[0]) : f.T, f.S, { r: 6, color: 'gold' });
          sp.text('B = 0', L0 ? 1.2 : 1.05, Sof(L0 ? 1.2 : 1.05, 0), { dy: -10, align: 'right', size: 11.5, color: 'blue', weight: 650 });
          sp.text(`B = ${v.fix(B1.value, 2)} T`, L0 ? 1.2 : 1.05, Sof(L0 ? 1.2 : 1.05, B1.value), { dy: 14, align: 'right', size: 11.5, color: 'red', weight: 650 });
          // temperatures per cycle
          const Ts = []; let T = T0; Ts.push([0, T]);
          for (let c = 1; c <= 10; c++) { T = bS.value === 0 ? 0 : T * bS.value / Math.hypot(B1.value, bS.value); Ts.push([c, T]); }
          sc.dots(Ts.filter((p) => p[1] > 0), { r: 4.5, color: 'blue' });
          sc.path(Ts.filter((p) => p[1] > 0), { color: 'blue', width: 1.4 });
          if (bS.value === 0) sc.text('T = 0 after one cycle', 1.2, 1e-6, { size: 11.5, color: 'red', weight: 650 });
          sc.vline(f.cyc, { color: 'gold', width: 1.4 });
          st = { f, ratio: bS.value / Math.hypot(B1.value, bS.value) };
        });
        v.legend([['blue', 'zero field'], ['red', 'field $B_1$'], ['gold', 'isothermal / adiabatic steps']]);
        v.readout(() => {
          if (!st) return '';
          const { f, ratio } = st;
          return `after ${f.cyc} cycle${f.cyc === 1 ? '' : 's'}: $T$ = **${f.T === 0 ? '0 K' : v.fmt(f.T, 4) + ' K'}** · factor per cycle $b/\\sqrt{B_1^2 + b^2}$ = ${v.fix(ratio, 4)} ${ratio > 0 ? `· reaching 1 μK would take ${Math.ceil(Math.log(1e-6) / Math.log(ratio))} cycles, and 0 K infinitely many` : '· one cycle reaches zero: only possible because the curves do not meet at T = 0'}`;
        });
      },
    },
    // ------------------------------------------------------------------ 3.19
    {
      num: '3.19', kind: 'Model', name: 'Rubber-band thermodynamics',
      statement: String.raw`Model a rubber band as a chain of $n$ moles of freely jointed segments of length $\ell$, each pointing forward or back along the band, with maximum length $L_{\max}$, plus vibrational degrees of freedom of heat capacity $C$ that do not depend on the length ("ideal rubber"). With $x = L/L_{\max}$ the configurational entropy is
$$S_{\text{conf}}(L) = nR\Big[\ln 2 - \tfrac{1+x}2\ln(1+x) - \tfrac{1-x}2\ln(1-x)\Big],$$
and with the identity $dU = T\,dS + f\,dL$ the tension is $f = -T(\partial S/\partial L)_T = \dfrac{nRT}{L_{\max}}\operatorname{artanh} x$, proportional to $T$ at fixed length. Hence (a) stretching **adiabatically** warms the band, $C\ln(T_2/T_1) = S_{\text{conf}}(L_1) - S_{\text{conf}}(L_2)$; (b) heating it under a **fixed load** makes it **contract**, $x = \tanh\!\big(fL_{\max}/nRT\big)$; and the Maxwell relation $(\partial S/\partial L)_T = -(\partial f/\partial T)_L$ links the two.`,
      idea: String.raw`The tension of rubber is entropic, like the pressure of an ideal gas: a stretched chain has fewer arrangements, so it pulls back to recover entropy, and the pull grows with temperature. From $F = U - TS$ with $U$ independent of $L$, $f = (\partial F/\partial L)_T = -T(\partial S/\partial L)_T$. In an adiabatic stretch the total entropy is fixed, so the configurational entropy lost must reappear as vibrational entropy — the band warms (you can feel it with your lip). Under fixed load, warming increases $T$ in $f = (nRT/L_{\max})\operatorname{artanh} x$, so $x$ must fall: the Gough–Joule effect, the opposite of ordinary thermal expansion. The Maxwell relation from $F(T, L)$ (3.12) says the same thing in one line.`,
      caption: String.raw`The chain on top is drawn with the number of forward and backward segments set by the current length. **Adiabatic stretch**: drag the length; the band starts at 300 K and its temperature rises as the configurational entropy (blue bar) turns into vibrational entropy (orange bar) at constant total. **Heating under load**: hang a fixed tension and drag the temperature; the band shortens. The middle panel shows tension–length isotherms (tension ∝ $T$), the right panel the path in the plane you are exploring. The readout checks the Maxwell relation by finite differences. Model values: $n$ = 0.002 mol of segments, $L_{\max}$ = 50 cm, $C$ = 0.5 J/K (a fraction of a gram of rubber); the chain is drawn with 24 representative segments.`,
      deps: ['thermo-3.12'],
      refs: ['Callen ch. 3', 'Kittel & Kroemer, Thermal Physics ch. 3'],
      tags: ['rubber elasticity', 'entropic force'],
      credit: 'Gough, 1805; Joule, 1859',
      scope: String.raw`Ideal rubber: energy independent of length, segments freely jointed, far from crystallization (which real rubber shows beyond several hundred per cent strain). Real bands warm by a few kelvin on fast large stretches, in line with the model's magnitude.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Rubber_elasticity' },
      viz(v) {
        const n = 0.002, LM = 0.5, C = 0.5, Tst = 300;
        const mode = v.select('experiment', [{ value: 'ad', label: 'adiabatic stretch' }, { value: 'ld', label: 'heating under a fixed load' }], 'ad');
        const xS = v.slider('length $L$', 0, 45, 30, { step: 0.5, fmt: (x) => v.fix(x, 1) + ' cm' });
        const fS = v.slider('load $f$', 1, 12, 5, { step: 0.1, fmt: (x) => v.fix(x, 1) + ' N' });
        const TS = v.slider('temperature', 250, 400, 300, { step: 1, fmt: (x) => x + ' K' });
        const sch = v.stage({ x: [-1, 52], y: [-3, 5], height: 170, axes: false, full: true, title: 'the chain' });
        const sf = v.stage({ x: [0, 50], y: [0, 1], height: 300, axes: 'box', gutter: true, xlabel: 'L (cm)', ylabel: 'f (N)', weight: 1, title: 'tension–length isotherms' });
        const sp = v.stage({ x: [0, 1], y: [0, 1], height: 300, axes: 'box', gutter: true, xlabel: 'T (K)', ylabel: 'L (cm)', weight: 1 });
        const Sc = (x) => (x <= -1 || x >= 1 ? -Infinity : n * R * (Math.LN2 - (1 + x) / 2 * Math.log1p(x) - (1 - x) / 2 * Math.log1p(-x)));
        const ften = (T, L) => n * R * T / LM * Math.atanh(clamp(L / LM, -0.999999, 0.999999));
        const Stot = (T, L) => Sc(L / LM) + C * Math.log(T / Tst);
        const PERM = v.rng(11).shuffle(Array.from({ length: 24 }, (_, i) => i));
        let st = null;
        v.render(() => {
          const ad = mode.value === 'ad';
          xS.el.hidden = !ad; fS.el.hidden = TS.el.hidden = ad;
          let T, Lm;
          if (ad) { Lm = xS.value / 100; T = Tst * Math.exp((Sc(0) - Sc(Lm / LM)) / C); }
          else { T = TS.value; Lm = LM * Math.tanh(fS.value * LM / (n * R * T)); }
          const x = Lm / LM;
          // chain: N segments of length L_max/N (drawn in cm, so the end sits at the real length), zigzagging down the panel
          const N = 24, seg = LM * 100 / N, nf = Math.round(N * (1 + x) / 2);
          const rank = PERM;
          const fwd = new Set(rank.slice(0, nf));
          let px = 0; const pts = [[0, 4]];
          for (let i = 0; i < N; i++) { px += (fwd.has(i) ? 1 : -1) * seg; pts.push([px, 4 - 6.4 * (i + 1) / N]); }
          sch.rect(-1, -2.8, 0, 4.6, { fill: 'muted', fillAlpha: 0.7, stroke: false });
          sch.vline(nf * seg - (N - nf) * seg, { color: 'orange', width: 1, dash: [4, 4] });
          sch.path(pts, { color: 'ink', width: 1.8 });
          sch.dots(pts, { r: 3, color: 'teal' });
          sch.arrow(px, pts[N][1], px + 3.5, pts[N][1], { color: 'orange', width: 2.4 });
          sch.text(`L = ${v.fix(Lm * 100, 1)} cm · ${nf} of ${N} segments forward · T = ${v.fix(T, 2)} K`, 51.5, 4.45, { align: 'right', size: 12, weight: 650, color: 'ink', plate: true });
          // isotherms
          const fmax = ften(400, 0.47);
          sf.setView([0, 50], [0, fmax]);
          for (const Ti of [250, 300, 350, 400]) { sf.fn((Lc) => ften(Ti, Lc / 100), { color: 'faint', width: 1.3, domain: [0, 49] }); sf.text(`${Ti} K`, 47, ften(Ti, 0.47), { size: 10.5, color: 'muted', align: 'right', dx: -4, dy: -6 }); }
          sf.fn((Lc) => ften(T, Lc / 100), { color: 'red', width: 2.2, domain: [0, 49] });
          if (ad) { const path = []; for (let i = 0; i <= 90; i++) { const Lc = 45 * i / 90, TT = Tst * Math.exp((Sc(0) - Sc(Lc / 100 / LM)) / C); path.push([Lc, ften(TT, Lc / 100)]); } sf.path(path, { color: 'gold', width: 2.4 }); }
          else sf.hline(fS.value, { color: 'orange', width: 2, dash: [6, 4] });
          sf.dot(Lm * 100, ften(T, Lm), { r: 6, color: 'gold' });
          // right panel
          if (ad) {
            sp.setTitle('entropy budget at constant total S'); sp.setLabels(null, 'J/K'); sp.setTicks([[0.25, 'configurational'], [0.75, 'vibrational']], null);
            const a = Sc(x) - Sc(0), b = C * Math.log(T / Tst), m = Math.max(0.002, Math.abs(a), Math.abs(b)) * 1.4;
            sp.setView([0, 1], [-m, m]); sp.hline(0, { color: 'muted', width: 1 });
            bar(sp, 0.25, a, 0.15, 'blue'); bar(sp, 0.75, b, 0.15, 'orange');
            sp.text(v.fix(a, 4), 0.25, a, { dy: 14, align: 'center', size: 11, plate: true }); sp.text(v.fix(b, 4), 0.75, b, { dy: -10, align: 'center', size: 11, plate: true });
          } else {
            sp.setTitle('length against temperature at fixed load'); sp.setLabels('T (K)', 'L (cm)'); sp.setTicks(null, null);
            sp.setView([250, 400], [0, 50]);
            for (const fl of [2, 4, 6, 8, 10, 12]) sp.fn((TT) => 100 * LM * Math.tanh(fl * LM / (n * R * TT)), { color: fl === fS.value ? 'orange' : 'faint', width: 1.2, domain: [250, 400] });
            sp.fn((TT) => 100 * LM * Math.tanh(fS.value * LM / (n * R * TT)), { color: 'orange', width: 2.6, domain: [250, 400] });
            sp.dot(T, Lm * 100, { r: 6, color: 'gold' });
            sp.text('heating shortens the band', 395, 3, { align: 'right', size: 11, color: 'muted' });
          }
          // Maxwell check at (T, L)
          const h1 = 1e-3, h2 = 1e-5, Lc = clamp(Lm, 0.001, 0.49);
          const dSdL = (Stot(T, Lc + h2) - Stot(T, Lc - h2)) / (2 * h2), dfdT = (ften(T + h1, Lc) - ften(T - h1, Lc)) / (2 * h1);
          st = { T, Lm, dSdL, dfdT, f: ften(T, Lm) };
        });
        v.readout(() => {
          if (!st) return '';
          const { T, Lm, dSdL, dfdT, f } = st;
          return `$L$ = ${v.fix(Lm * 100, 2)} cm, $T$ = **${v.fix(T, 2)} K**, tension $f$ = ${v.fix(f, 3)} N · Maxwell relation from $F(T, L)$: $(\\partial S/\\partial L)_T$ = ${v.fix(dSdL, 5)} J/(K·m) and $-(\\partial f/\\partial T)_L$ = ${v.fix(-dfdT, 5)} N/K — equal, so the tension of a stretched band rises as it warms`;
        });
      },
    },
  ],
};
