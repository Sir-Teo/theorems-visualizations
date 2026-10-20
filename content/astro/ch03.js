// Astrophysics & Celestial Mechanics — Chapter 3: Tides, spin and small bodies

import {
  TAU, DEG, clamp, memo, sci, G, C_LIGHT, AU, GM_SUN, L_SUN, K_B, M_H, AMU, YEAR, BODY, interp,
  rocheBranch, orbitTable, spinOrbit, hillKick, HILL_MIN,
} from './ch03.shared.js';

import { auditedHillKick, advanceToyRing, ringStats, ringHistogram } from './source-audit-rings.shared.js';
import { lockingModel, lunarModel, jeansModel, resonanceWindow } from './source-audit-tides.shared.js';

// ── quantities shared by several items (NASA NSSDC fact-sheet values via BODY; G CODATA 2018) ─────────────────
const GM_EARTH = G * BODY.earth.M, GM_MOON = G * BODY.moon.M;
const T_SYN = 29.530589; // synodic month, days
/** Ratio of the Sun's to the Moon's tide-raising strength, (GM☉/d☉³)/(GM☾/d☾³), with d☉ = 1 AU and d☾ = 384 400 km. */
const K_SUN = (GM_SUN / AU ** 3) / (GM_MOON / BODY.moon.a ** 3);
const fmtSci = (v, x, d = 2) => (x === 0 ? '0' : v.sci(x, d));

export default {
  collection: 'astro',
  chapter: 3,
  title: 'Tides, spin and small bodies',
  summary: String.raw`The difference of gravity across a body raises tidal bulges; friction makes them lag, transferring spin angular momentum into orbits so that days lengthen, moons recede and spins lock — sometimes into resonances like Mercury’s 3:2. Tides tear apart bodies inside the Roche limit, make rings, and heat Io. Rotation flattens planets, thermal speeds let light gases escape from their atmospheres, and sunlight itself drags dust inward.`,
  items: [
    // ───────────────────────────────────────────────────────────── 3.1
    {
      num: '3.1',
      kind: 'Phenomenon',
      name: 'Spring and neap tides',
      statement: String.raw`The Moon and the Sun each raise two tidal bulges on Earth's oceans, one facing the body and one opposite, because the pull of a distant mass $M$ at distance $d$ varies across Earth by an amount $\propto GM/d^3$. The solar bulge has about $0.46$ the strength of the lunar one. The two semidiurnal tides add: around new and full Moon (Sun, Earth, Moon in a line) the bulges coincide and the range of the tide is largest (**spring tides**); near first and third quarter they are $90^\circ$ apart and the solar tide partly cancels the lunar one (**neap tides**). In the equilibrium-tide idealisation the daily range is proportional to $\sqrt{1 + k^2 + 2k\cos 2\psi}$, where $\psi$ is the Moon's elongation from the Sun and $k \approx 0.46$, so springs exceed neaps by a factor $(1+k)/(1-k) \approx 2.7$, twice a synodic month.`,
      idea: String.raw`The tide-raising acceleration is the difference of the body's gravity across Earth (mech 9.3): a quadrupole field, $\propto GM/d^3\,(3\cos^2\vartheta - 1)/2$ with $\vartheta$ the angle from the body's direction. The Sun is $2.7\times10^7$ times more massive than the Moon but $389$ times farther, and the cube of the distance wins, leaving the Sun with $k = (GM_\odot/d_\odot^3)/(GM_\mathbb{C}/d_\mathbb{C}^3) \approx 0.46$. Both fields have period $12$ h as Earth turns beneath them, so the two sinusoids are added with a relative phase set by the Moon's elongation $2\psi$: in step at new and full Moon, in opposition at the quarters.

The unit-circle representation of sine and cosine in pma-8.7 adds the two semidiurnal components as complex amplitudes. Their combined amplitude is the modulus of $1+ke^{2i\psi}$, whose square is $1+k^2+2k\cos2\psi$. This gives the spring/neap ratio by substituting aligned and opposite phases. The result belongs to the linear equilibrium-tide superposition, not a prediction of a particular ocean basin response.`,
      caption: String.raw`Drag the **day of the lunar month** (days since new Moon). Left: the equilibrium ocean (heavily exaggerated) is the sum of the lunar bulge (blue dashes) and the solar bulge (gold dashes); watch the two bulge axes fall together at new and full Moon and cross at right angles at the quarters. Right: the daily tidal range through the month — two springs and two neaps; the dot follows the slider. Switch the Sun's tide off to see a flat line.`,
      scope: String.raw`Equilibrium-tide idealisation: ocean in instantaneous balance, no continents, circular lunar orbit in the ecliptic. Real tides are dynamic responses of ocean basins; the observed springs lag the syzygies, and the Moon's distance and declination add further modulations.`,
      deps: ['mech-9.3', 'pma-8.7'],
      refs: ['Carroll–Ostlie §19.2'],
      tags: ['tides', 'Moon', 'Sun'],
      viz(v) {
        const day = v.slider('day of the lunar month', 0, T_SYN, 3, { step: 0.05, fmt: (d) => v.fix(d, 1) });
        const sunOn = v.toggle('include the Sun’s tide', true);
        const s = v.stage({ x: [-2.3, 2.3], y: [-2.1, 2.1], equal: true, axes: false, height: 330, weight: 1, title: 'the equilibrium ocean (looking down on the north pole)' });
        const g = v.stage({ x: [0, T_SYN], y: [0, 1.7], axes: 'box', gutter: true, height: 330, weight: 1.25, xlabel: 'days since new Moon', ylabel: 'daily range / lunar-only range', title: 'tidal range through the month',
          xticks: [[0, 'new'], [T_SYN / 4, '1st qtr'], [T_SYN / 2, 'full'], [3 * T_SYN / 4, '3rd qtr'], [T_SYN, 'new']] });
        const k = () => (sunOn.value ? K_SUN : 0);
        const hOf = (phi, psi, kk) => 0.5 * (3 * Math.cos(phi - psi) ** 2 - 1) + kk * 0.5 * (3 * Math.cos(phi) ** 2 - 1);
        const rangeAt = (psi, kk) => { let lo = 1e9, hi = -1e9; for (let i = 0; i < 90; i++) { const h = hOf((TAU * i) / 90, psi, kk); lo = Math.min(lo, h); hi = Math.max(hi, h); } return (hi - lo) / 1.5; };
        let cur = null;
        v.render(() => {
          const psi = (TAU * day.value) / T_SYN, kk = k();
          const r0 = 0.9, A = 0.2;
          const ring = (fn) => { const pts = []; for (let i = 0; i <= 200; i++) { const p = (TAU * i) / 200; pts.push([fn(p) * Math.cos(p), fn(p) * Math.sin(p)]); } return pts; };
          s.circle(0, 0, 0.78, { fill: 'muted', fillAlpha: 0.35, color: 'muted', width: 1 });
          s.poly(ring((p) => r0 + A * hOf(p, psi, kk)), { fill: 'accent', fillAlpha: 0.22, color: 'accent', width: 2 });
          s.path(ring((p) => r0 + A * hOf(p, psi, 0)), { color: 'blue', width: 1.2, dash: [5, 4] });
          if (kk > 0) s.path(ring((p) => r0 + A * kk * 0.5 * (3 * Math.cos(p) ** 2 - 1)), { color: 'gold', width: 1.2, dash: [5, 4] });
          // Sun and Moon
          s.arrow(2.2, 0, 1.65, 0, { color: 'gold', width: 2.2 });
          s.text('to the Sun', 2.2, 0, { color: 'gold', size: 10.5, dy: -12, align: 'right' });
          const mx = 1.55 * Math.cos(psi), my = 1.55 * Math.sin(psi);
          s.dot(mx, my, { r: 7, color: 'muted' });
          s.text('Moon', mx, my, { color: 'muted', size: 10.5, dy: -13, align: 'center' });
          s.corner(`elongation ${v.fix((psi / DEG), 0)}°`, 'tl', { color: 'ink', weight: 600 });
          // monthly curve
          const Rf = (d) => rangeAt((TAU * d) / T_SYN, kk);
          g.hline(1, { color: 'faint', width: 1, dash: [3, 4] });
          if (kk > 0) { g.hline(1 + kk, { color: 'green', width: 1, dash: [6, 4] }); g.hline(1 - kk, { color: 'red', width: 1, dash: [6, 4] }); }
          g.fn(Rf, { color: 'accent', width: 2.4, n: 240 });
          const R = Rf(day.value);
          g.vline(day.value, { color: 'gold', width: 1.2 });
          g.dot(day.value, R, { r: 6, color: 'gold' });
          if (kk > 0) { g.text('springs: $1+k$', T_SYN * 0.5, 1 + kk, { color: 'green', size: 10.5, dy: -9, align: 'center' }); g.text('neaps: $1-k$', T_SYN * 0.25, 1 - kk, { color: 'red', size: 10.5, dy: 14, align: 'center' }); }
          cur = { R, kk, psi };
        });
        v.legend([['blue', 'lunar bulge', { dash: true }], ['gold', 'solar bulge', { dash: true }], ['accent', 'total ocean surface / tidal range']]);
        v.readout(() => {
          if (!cur) return '';
          const kk = cur.kk;
          let out = String.raw`$k = (GM_\odot/d_\odot^3)\big/(GM_\mathbb{C}/d_\mathbb{C}^3) = ${v.fix(K_SUN, 3)}$ (from $GM_\odot$, $1$ AU, the Moon's mass and $384\,400$ km) · range today $= \sqrt{1+k^2+2k\cos 2\psi} = ${v.fix(cur.R, 3)}$ of the lunar-only range`;
          if (kk > 0) out += String.raw` · springs : neaps $= (1+k)/(1-k) = ${v.fix((1 + kk) / (1 - kk), 2)}$`;
          return out;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 3.2
    {
      num: '3.2',
      kind: 'Phenomenon',
      name: 'Tidal friction: longer days, receding Moon',
      statement: String.raw`Because Earth turns faster than the Moon orbits, friction in the oceans and solid body drags the tidal bulge ahead of the Earth–Moon line by a small lag angle $\delta$. The Moon's pull on the bulge slows Earth's spin and the bulge's pull on the Moon speeds it up, so spin angular momentum passes into the orbit: the day lengthens and the Moon recedes. For a circular orbit with a constant lag the torque is $N = \tfrac32 k_2 \frac{G M_\mathbb{C}^2 R^5}{a^6}\sin 2\delta$ and the orbit grows as $\dot a = 3\,\frac{k_2}{Q}\,\frac{M_\mathbb{C}}{M_\oplus}\left(\frac{R}{a}\right)^5 n\,a$ with $\sin2\delta = 1/Q$. Total angular momentum of Earth's spin plus the lunar orbit is conserved (neglecting the Sun). Laser ranging gives a present recession of $\approx 3.8$ cm per year.`,
      idea: String.raw`The pulls of Moon on bulge and bulge on Moon are equal and opposite (a pair of forces along lines that miss the centres by $R\sin\delta$), so they exchange angular momentum without creating any: $C\dot\omega = -\dot L_\mathrm{orb}$ (mech 2.12, spin plus orbital angular momentum). Because $L_\mathrm{orb} \propto \sqrt{a}$ and the bulge's torque falls like $a^{-6}$, the recession slows as the Moon moves out: $\dot a \propto a^{-11/2}$ and $a^{13/2}$ grows linearly in time. Only the product $k_2/Q$ is needed; here it is fixed so that the model reproduces the measured $3.8$ cm/yr, and $k_2 = 0.3$ is assumed to draw the lag angle.

The separated-equation method ode-1.3 applies to the positive orbital radius: write $\dot a=C a^{-11/2}$ with C fixed by the constant-lag model. Integrating gives $a^{13/2}=a_0^{13/2}+(13/2)Ct$ while the model assumptions hold. The positive-radius restriction permits division by the power of a; no extrapolation through the planet or through a change of dissipation law follows from this solution.`,
      caption: String.raw`Drag the **handle** on the dial to change the lag angle $\delta$ (angles are drawn eight times too large; the green ring marks the lag implied by today's measured recession, for an assumed $k_2 = 0.3$). The bulge, being ahead of the Earth–Moon line, pulls the Moon forward along its orbit (red). Move the **time** slider: the Moon's distance and the length of the day follow from constant lag plus conservation of angular momentum. The curves stop at a chosen inner cutoff of ten Earth radii and at spin–orbit synchronism. Beyond either boundary the plotted outward-transfer model is not continued; it does not predict a collision or reverse spin.`,
      scope: String.raw`Constant-lag, circular, equatorial orbit; Earth's spin, the lunar orbit and nothing else (the Sun's tide is ignored, as is the Moon's spin). Valid for $a \gg R_\oplus$. The real dissipation depends on the arrangement of oceans and varied strongly over geological time.`,
      deps: ['mech-9.3', 'mech-2.12', 'ode-1.3'],
      refs: ['Goldreich–Peale (1966), p.426 Eq.(7)', 'Williams–Turyshev–Boggs (2014), pp.1–5 and endnotes b–c'],
      tags: ['tides', 'angular momentum', 'Moon'],
      credit: 'Apollo lunar laser ranging, 1969 onward',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Tidal_acceleration' },
      viz(v) {
        const E = BODY.earth, Mm = BODY.moon.M, a0 = BODY.moon.a, R = E.R;
        const C = 0.3307 * E.M * R * R, w0 = TAU / 86164.1; // moment of inertia factor 0.3307 (approximate), sidereal rotation
        const mu0 = (E.M * Mm) / (E.M + Mm), n0 = Math.sqrt(G * (E.M + Mm) / a0 ** 3);
        const rate0 = 0.03808 / YEAR; // m/s, 3.8 cm per year (NASA Moon fact sheet; lunar laser ranging)
        const kq = rate0 / (3 * (Mm / E.M) * (R / a0) ** 5 * n0 * a0); // implied k2/Q
        const K2 = 0.3, delta0 = 0.5 * Math.asin(kq / K2);
        const Lorb = (a) => mu0 * Math.sqrt(G * (E.M + Mm) * a), Ltot = C * w0 + Lorb(a0);
        const dial = 1.55, MAG = 8; // the lag is drawn 8 times too large so that it can be seen and dragged
        const s = v.stage({ x: [-1.9, 5.3], y: [-2.1, 2.1], equal: true, axes: false, height: 270, full: true, title: 'tidal bulge with lag angle $\\delta$ (angle drawn ×8, sizes not to scale)' });
        const ga = v.stage({ x: [-1.6, 5], y: [0, 700], axes: 'box', gutter: true, height: 250, weight: 1, xlabel: 'time (Gyr from today)', ylabel: 'Earth–Moon distance (10³ km)', title: 'the orbit grows' });
        const gl = v.stage({ x: [-1.6, 5], y: [0, 160], axes: 'box', gutter: true, height: 250, weight: 1, xlabel: 'time (Gyr from today)', ylabel: 'rotation period of Earth (h)', title: 'the day lengthens' });
        const tS = v.slider('time $t$ (Gyr)', -1.6, 5, 0, { step: 0.05, fmt: (x) => v.fix(x, 2) });
        const H = s.handle(dial * Math.cos(MAG * delta0), dial * Math.sin(MAG * delta0), { color: 'orange', r: 7, constrain: (x, y) => { const p = clamp(Math.atan2(y, x), 0, 0.9); return [dial * Math.cos(p), dial * Math.sin(p)]; } });
        v.button('zero dissipation', () => H.set(dial, 0));
        let cur = null;
        v.render(() => {
          const del = Math.atan2(H.y, H.x) / MAG, sc = Math.sin(2 * del) / Math.sin(2 * delta0), drawn = del * MAG;
          const model = lunarModel(sc), state = model.evaluate(tS.value);
          const aOf = (t) => { const q = model.evaluate(t); return q.valid ? q.a : NaN; };
          const wOf = model.w, a = state.a, w = state.w;
          // left picture
          const bulge = (ang) => { const pts = []; for (let i = 0; i <= 160; i++) { const p = (TAU * i) / 160, r = 1 + 0.26 * 0.5 * (3 * Math.cos(p - ang) ** 2 - 1); pts.push([r * Math.cos(p), r * Math.sin(p)]); } return pts; };
          const Mx = 4.4;
          s.poly(bulge(drawn), { fill: 'accent', fillAlpha: 0.22, color: 'accent', width: 2 });
          s.circle(0, 0, 0.88, { fill: 'muted', fillAlpha: 0.4, color: 'muted' });
          s.dot(Mx, 0, { r: 8, color: 'muted' }); s.text('Moon', Mx, 0, { color: 'muted', size: 10.5, dy: 18, align: 'center' });
          s.line(0, 0, Mx, 0, { color: 'faint', width: 1, dash: [3, 4] });
          const tip = [1.3 * Math.cos(drawn), 1.3 * Math.sin(drawn)];
          s.line(0, 0, 1.55 * Math.cos(drawn), 1.55 * Math.sin(drawn), { color: 'orange', width: 1.4 });
          const arc = []; for (let i = 0; i <= 40; i++) { const p = (0.9 * i) / 40; arc.push([dial * Math.cos(p), dial * Math.sin(p)]); }
          s.path(arc, { color: 'faint', width: 1, dash: [2, 4] });
          const t0 = MAG * delta0;
          s.dot(dial * Math.cos(t0), dial * Math.sin(t0), { r: 4.5, hollow: true, color: 'green' });
          s.text('today', dial * Math.cos(t0), dial * Math.sin(t0), { color: 'green', size: 10, dx: -8, dy: -4, align: 'right' });
          s.text('drag', 1.55 * Math.cos(drawn), 1.55 * Math.sin(drawn), { color: 'orange', size: 10, dx: 10, dy: -6, align: 'left' });
          // the pull of the bulge on the Moon (forward, i.e. toward the leading bulge) and of the Moon on the bulge (back)
          const dx = tip[0] - Mx, dy = tip[1], dn = Math.hypot(dx, dy);
          s.arrow(Mx, 0, Mx + (dx / dn) * 1.3, (dy / dn) * 1.3, { color: 'red', width: 2.4 });
          s.text('bulge pulls the Moon forward', Mx - 0.4, (dy / dn) * 1.3 + 0.35, { color: 'red', size: 10.5, align: 'center' });
          s.arrow(tip[0], tip[1], tip[0] + (-dx / dn) * 1.3, tip[1] + (-dy / dn) * 1.3, { color: 'red', width: 1.8 });
          s.text('Moon pulls the bulge back', 1.7, -0.55 + 1.15 * Math.sin(drawn), { color: 'red', size: 10.5, align: 'left' });
          s.text(`lag $\\delta = ${v.fix(del / DEG, 2)}^\\circ$ (drawn ${v.fix(drawn / DEG, 0)}°)`, 0, -1.7, { color: 'orange', size: 11, align: 'center' });
          const sp = []; for (let i = 0; i <= 30; i++) { const p = 0.5 + (1.9 * i) / 30; sp.push([0.55 * Math.cos(p), 0.55 * Math.sin(p)]); }
          s.path(sp, { color: 'ink', width: 1.6 }); s.arrow(sp[28][0], sp[28][1], sp[30][0], sp[30][1], { color: 'ink', width: 1.6 }); s.text('spin', 0, -0.15, { color: 'ink', size: 10, align: 'center' });
          // curves
          const T = []; for (let i = 0; i <= 130; i++) T.push(-1.6 + (6.6 * i) / 130);
          const pa = [], pl = [];
          for (const t of T) { const aa = aOf(t); if (!(aa > R * 1.01) || !isFinite(aa)) continue; const ww = wOf(aa); pa.push([t, aa / 1e6]); if (ww > 0) pl.push([t, (TAU / ww) / 3600]); }
          ga.hline(a0 / 1e6, { color: 'faint', width: 1, dash: [3, 4] });
          ga.setView([-1.6, 5], [0, Math.max(a0 / 1e6, ...pa.map(q => q[1])) * 1.1]);
          gl.setView([-1.6, 5], [0, Math.max(24, ...pl.map(q => q[1])) * 1.1]);
          ga.path(pa, { color: 'accent', width: 2.4 }); if (state.valid) ga.dot(tS.value, a / 1e6, { r: 6, color: 'gold' });
          gl.path(pl, { color: 'accent', width: 2.4 }); if (w > 0) gl.dot(tS.value, (TAU / w) / 3600, { r: 6, color: 'gold' });
          gl.hline(TAU / w0 / 3600, { color: 'faint', width: 1, dash: [3, 4] });
          if (!state.valid) ga.corner('outside the plotted model domain', 'tr', { color: 'red' });
          cur = { del, sc, a, w, state, model, dLODms: model.dLODms };
        });
        v.readout(() => {
          if (!cur) return '';
          return String.raw`lag factor $\sin2\delta/\sin2\delta_0 = ${v.fix(cur.sc, 2)}$ · recession at today's distance: $${v.fix(3.808 * cur.sc, 3)}$ cm/yr · model day lengthening $${v.fix(cur.dLODms, 2)}$ ms/century · implied $k_2/Q = ${v.fix(kq * cur.sc, 4)}$` + (cur.state.valid ? String.raw` · at $t=${v.fix(tS.value, 2)}$ Gyr: $a=${v.fix(cur.a / 1e6, 0)}\times10^3$ km; spin period $${v.fix(TAU / cur.w / 3600, 1)}$ h` : ` · outside model domain: ${cur.state.reason}; no continuation is plotted`) + ' · calibration: Williams et al. (2014), 38.08 ± 0.19 mm/yr from 43 years of LLR; constant lag is an extrapolation, not a reconstruction of ancient tides.';

        });
      },
    },
    // ───────────────────────────────────────────────────────────── 3.3
    {
      num: '3.3',
      kind: 'Phenomenon',
      name: 'Tidal locking',
      statement: String.raw`A satellite on a circular orbit about a much heavier planet is flexed by the planet's tide. Dissipation in that flexing exerts a torque that drives its spin $\omega$ toward the mean motion $n$ (keeping one face toward the planet) in a time of order
$$t_\mathrm{lock} \approx \frac{I|\omega_0-n|}{N},\quad N=\frac32\frac{G M_p^2 k_2R^5}{Qa^6},\qquad k_2 = \frac{3/2}{1 + 19\mu/(2\rho g R)},\quad I \approx 0.4\,mR^2,$$
where $a$ is the orbital radius, $Q$ the tidal dissipation factor, $\mu$ the rigidity, $\rho$, $g$, $R$ the satellite's density, surface gravity and radius. For initially fast spins the strong $a^6$ dependence makes locking quick for close moons and takes longer than the age of the Solar System for distant ones. Here $Q^{-1}=\sin(2\delta)$ fixes the geometric-lag convention. The torque spins a slow satellite up and a fast satellite down; the plotted orbit is held fixed.`,
      idea: String.raw`The same lagging bulge as in 3.2, now on the satellite: the dissipative torque reverses sign across synchronism, driving a fast spin down and a slow spin up until spin equals orbital rate. The braking torque is $\propto k_2 G M_p^2R^5/(Q a^6)$ (steep in $a$, since tides scale as $a^{-3}$ and the lag torque as the tide squared) and it acts on the moment of inertia $I$, so dividing the initial spin by the resulting deceleration gives the estimate. For $\omega_0\gg n$, the estimate is $2I\omega_0Qa^6/(3GM_p^2k_2R^5)$. The Love number $k_2$ is the satellite's response: small for a rigid rocky body ($\mu$ large), $3/2$ for a fluid one.`,
      caption: String.raw`Choose the **planet** and the **rigidity** of the moon, then drag the **orbit handle** along the curve of locking time against distance (in planet radii). The right panel is the spin of that moon against time (log scales) from its initial spin toward synchronous rotation $\omega = n$. Compare the locking time with the age of the Solar System (dashed line). The Moon sits at 60 Earth radii.`,
      scope: String.raw`An order-of-magnitude estimate: it assumes a homogeneous body, constant $Q$, a fixed orbit, circular orbit and no resonances; the result is extremely sensitive to $a$, $Q$ and $\mu$ and may be uncertain by orders of magnitude. Nonuniform bodies and eccentric orbits can lock elsewhere (3.4).`,
      deps: ['astro-3.2'],
      refs: ['Fang–Margot (2012), §2 p.4 and §2.2 pp.6–7, Eqs.(2)–(3)', 'Goldreich–Peale (1966), p.426 Eq.(7)'],
      tags: ['tides', 'spin', 'moons'],
      viz(v) {
        const PL = { earth: BODY.earth, jupiter: BODY.jupiter, saturn: BODY.saturn };
        const MU = { rock: 3e10, ice: 4e9 }; // typical rigidity values (rock, ice), Pa
        const planet = v.select('planet', [{ value: 'earth', label: 'Earth' }, { value: 'jupiter', label: 'Jupiter' }, { value: 'saturn', label: 'Saturn' }], 'earth');
        const mat = v.select('moon is', [{ value: 'rock', label: 'rock ($\\mu = 3\\times10^{10}$ Pa)' }, { value: 'ice', label: 'ice ($\\mu = 4\\times10^{9}$ Pa)' }, { value: 'rubble', label: 'soft solid ($\\mu = 10^{8}$ Pa)' }], 'rock');
        const Rs = v.slider('moon radius (km)', 10, 3000, 1737, { log: true, sig: 3 });
        const rhoS = v.slider('moon density (kg/m³)', 500, 5000, 3344, { step: 10 });
        const Qs = v.slider('dissipation factor $Q$', 10, 1000, 100, { log: true, sig: 2 });
        const P0 = v.slider('initial spin period (h)', 2, 100, 12, { log: true, sig: 2 });
        const g = v.stage({ x: [1.5, 300], xlog: true, y: [1e2, 1e16], ylog: true, axes: 'box', gutter: true, height: 330, weight: 1.1, xlabel: 'orbit radius $a$ / planet radius', ylabel: 'locking time (yr)', title: 'locking time vs distance' });
        const h = v.stage({ x: [1e2, 1e12], xlog: true, y: [1, 2000], ylog: true, axes: 'box', gutter: true, height: 330, weight: 1, xlabel: 'time (yr)', ylabel: 'spin rate $\\omega/n$', title: 'spin evolution at the chosen distance' });
        const A = g.handle(60, 1e8, { color: 'accent', r: 7, label: 'moon', labelPos: 'ne', constrain: (x) => { const X = clamp(x, 1.6, 280); return [X, tl(X)]; } });
        const mu = () => (mat.value === 'rubble' ? 1e8 : MU[mat.value]);
        function model(aRp) {
          return lockingModel({planet: PL[planet.value], radius: Rs.value * 1e3, rho: rhoS.value, rigidity: mu(), Q: Qs.value, period: P0.value * 3600, distance: aRp});
        }
        function tl(aRp) { const D = model(aRp); return D.valid && D.tl > 0 ? D.tl : NaN; }
        let cur = null;
        v.render(() => {
          const xs = []; for (let i = 0; i <= 140; i++) xs.push(1.5 * Math.pow(300 / 1.5, i / 140));
          const pts = xs.map((x) => [x, tl(x)]).filter(q => Number.isFinite(q[1]));
          const times = pts.map(q => q[1]);
          g.setView([1.5, 300], [Math.min(1e2, ...times) / 2, Math.max(4.5e9, ...times) * 2]);
          g.hline(4.5e9, { color: 'green', width: 1.2, dash: [6, 4] });
          g.text('age of the Solar System', 1.7, 4.5e9, { color: 'green', size: 10, dy: -9, align: 'left' });
          g.path(pts, { color: 'accent', width: 2.4 });
          // constrain handle to the curve (re-pin after parameter changes)
          const X = clamp(A.x, 1.6, 280); if (Number.isFinite(tl(X))) A.set(X, tl(X));
          const D = model(X); cur = D; A.visible = D.valid && D.tl > 0;
          if (BODY.moon && planet.value === 'earth') { g.vline(BODY.moon.a / BODY.earth.R, { color: 'faint', width: 1, dash: [3, 4] }); g.text('Moon', BODY.moon.a / BODY.earth.R, 1e3, { color: 'faint', size: 10, dx: 5, dy: 0, align: 'left' }); }
          // despinning history
          const tStart = Math.max(1e-6, Math.min(1e2, D.tl / 100)), tEnd = Math.max(1e12, D.tl * 2), N = 120, hp = [];
          h.setView([tStart, tEnd], [Math.min(1, D.w0 / D.n) * .8, Math.max(1, D.w0 / D.n) * 1.2]);
          for (let i = 0; i <= N; i++) {
            const t = i === N ? tEnd : tStart * Math.pow(tEnd / tStart, i / N);
            if (D.valid) hp.push([t, D.spin(t) / D.n]);
          }
          h.hline(1, { color: 'faint', width: 1 });
          h.vline(4.5e9, { color: 'green', width: 1.2, dash: [6, 4] });
          h.path(hp, { color: 'accent', width: 2.4 });
          if (isFinite(D.tl) && D.valid && D.tl >= tStart && D.tl <= tEnd) h.dot(D.tl, 1, { r: 6, color: 'gold' });
        });
        v.legend([['accent', 'model'], ['green', 'age of the Solar System', { dash: true }], ['gold', 'spin reaches $\\omega = n$']]);
        v.readout(() => {
          if (!cur) return '';
          const D = cur, T = D.tl;
          if (!D.valid) return 'Outside the light-satellite approximation (mass ratio exceeds 2%) or overlapping bodies; no synchronization curve is shown.';
          return String.raw`$a = ${v.fix(A.x, 1)}\,R_p = ${v.fix((A.x * D.p.R) / 1e6, 1)}\times10^3$ km · $k_2 = ${v.fix(D.k2, 3)}$ · orbital period $${v.fix(TAU / D.n / 86400, 2)}$ d · locking time $\approx ${fmtSci(v, T, 2)}$ yr` + (T < 4.5e9 ? ' — model time shorter than 4.5 Gyr' : ' — model time longer than 4.5 Gyr');
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 3.4
    {
      num: '3.4',
      kind: 'Phenomenon',
      name: 'Mercury’s 3:2 spin–orbit resonance',
      statement: String.raw`Mercury turns three times on its axis for every two orbits around the Sun (rotation $58.65$ d, orbit $87.97$ d). A slightly elongated (triaxial) planet feels a torque from the Sun, and with the orbit's eccentricity ($e = 0.2056$) the rotation angle $\theta$ obeys
$$\begin{gathered}\ddot\theta =\\ -\tfrac32\,\frac{B-A}{C}\,\frac{GM_\odot}{r^3}\,\sin 2(\theta - f),\end{gathered}$$
a pendulum equation driven by the changing distance $r$ and true anomaly $f$. Averaging near $\dot\theta=\tfrac p2 n$ ($p$ an integer) gives a resonant restoring term only when its Fourier coefficient is nonzero; a sufficiently small opposing torque can then leave a stable libration. At $e=0$ only 1:1 remains: the other integer and half-integer resonances also require eccentricity. Tidal despinning that slows a fast-rotating planet can capture it into one of these states as it passes; the capture probability depends on the eccentricity history, and Mercury's final state is the 3:2.`,
      idea: String.raw`Averaged over an orbit the torque has a nonzero mean only when $\theta$ advances by a multiple of $\pi$ per orbit, and the strength of the term at $\dot\theta = \frac p2 n$ is set by an eccentricity-dependent Fourier coefficient (not generally monotone in $e$). Near each resonance the dynamics is a pendulum (mech 4.15): a libration island in the spin phase portrait bounded by a separatrix, whose width scales as $\sqrt{(B-A)/C}$. Slow tidal braking pushes $\omega$ down through the islands; whether the planet is trapped depends on the phase at which it arrives, hence a probability.

The Fourier coefficient in the averaged torque is selected by the orthogonality in pma-8.10. Expand the periodic orbital factor in integer harmonics of mean anomaly. Near $2\dot\theta=pn$, averaging its product with the spin phase over an orbital cycle retains the matching p-th coefficient, while nonmatching integer harmonics have zero mean. This explains the resonance selection rule; whether the retained coefficient vanishes and whether capture occurs remain separate dynamical questions.`,
      caption: String.raw`Left: Poincaré section of the spin, sampled once per orbit at perihelion — the angle $\theta$ against spin rate $\omega = \dot\theta/n$. Each curve is one initial condition followed for 260 orbits; the closed loops at $\omega = 1,\ 3/2,\ 2,\ 5/2$ are resonance islands. Drag the **gold point** to launch your own spin. Changing $e$ changes the islands; at $e = 0$ every resonance except 1:1 vanishes. Press **Despin ×40** (right): forty spins with random phase start fast and feel a tidal braking torque proportional to $\omega - n$; the last 64 orbits are classified by the unwrapped resonant angle. A span below $\pi$ is labelled a finite-window libration candidate, not a proof of permanent capture. Some runs remain unclassified. This toy model's counts are not the published capture probabilities.`,
      scope: String.raw`Rigid, planar spin with a fixed axis, Keplerian orbit; the triaxiality $\sigma = (B-A)/C$ is exaggerated by default so that the islands are visible (Mercury's value, estimated from the MESSENGER gravity coefficient $C_{22}$ and the polar moment of inertia, is of order $10^{-4}$). The tidal torque is modelled as a viscous term $-\kappa(\omega - n)$ (the no-capture result for a constant averaged torque concerns the autonomous averaged pendulum of Goldreich–Peale §III); real tidal torques are not linear, and actual capture involves the eccentricity history and core–mantle friction.`,
      deps: ['astro-3.3', 'mech-4.15', 'pma-8.10'],
      refs: ['Goldreich–Peale (1966), pp.425–438, especially §II Eqs.(1)–(7), §III and §IV.A'],
      tags: ['resonance', 'spin–orbit', 'Mercury'],
      credit: 'Goldreich & Peale, 1966 (dynamics and model-dependent capture analysis)',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Mercury_(planet)' },
      viz(v) {
        const eS = v.slider('orbital eccentricity $e$', 0, 0.4, 0.2056, { step: 0.001 });
        const sS = v.slider('triaxiality $\\sigma = (B-A)/C$', 1e-4, 3e-2, 8e-3, { log: true, sig: 2 });
        const kS = v.slider('tidal braking rate $\\kappa/n$', 3e-4, 2e-2, 3e-3, { log: true, sig: 2 });
        const ph = v.stage({ x: [0, 180], y: [0, 3.2], axes: 'box', gutter: true, height: 360, weight: 1.15, xlabel: 'spin angle $\\theta$ mod 180° at perihelion', ylabel: 'spin rate $\\omega$ ($n$)', title: 'Poincaré section',
          yticks: [[0, '0'], [1, '1'], [1.5, '3/2'], [2, '2'], [2.5, '5/2'], [3, '3']], xticks: [0, 45, 90, 135, 180] });
        const tr = v.stage({ x: [0, 400], y: [0, 3.4], axes: 'box', gutter: true, height: 360, weight: 1, xlabel: 'time (orbits)', ylabel: 'spin rate $\\omega$ ($n$)', title: 'despinning ensemble',
          yticks: [[0, '0'], [1, '1'], [1.5, '3/2'], [2, '2'], [2.5, '5/2'], [3, '3']] });
        const P = ph.handle(30, 1.5, { color: 'gold', r: 7, label: 'your spin', labelPos: 'ne', constrain: { x: [0, 180], y: [0.1, 3.1] } });
        const cache = memo(), cacheE = memo();
        let ens = null, runKey = '';
        const NORB = 260;
        let cur = null;
        const section = () => cache(`${eS.value}|${sS.value}`, () => {
          const tab = orbitTable(eS.value, 64), out = [];
          const ics = [];
          for (let i = 0; i < 26; i++) { const w0 = 0.2 + (3.0 * (i + 0.5)) / 26; ics.push([0.4 + 0.37 * i, w0]); }          // circulating curves
          for (const wc of [1, 1.5, 2, 2.5, 3]) for (const dw of [0.004, 0.02, 0.045, 0.08, 0.13]) ics.push([0, wc + dw]);  // nested loops around each resonance
          for (const wc of [1, 1.5, 2, 2.5, 3]) for (const dw of [0.01, 0.05]) ics.push([Math.PI / 2, wc + dw]);          // near the separatrix
          ics.forEach(([th0, w0], i) => {
            const st = [th0, w0], pts = [];
            for (let k = 0; k < NORB; k++) { spinOrbit(tab, sS.value, 0, st); pts.push([((((st[0] % Math.PI) + Math.PI) % Math.PI) * 180) / Math.PI, st[1]]); }
            out.push({ w0, pts, i });
          });
          return out;
        });
        function runEnsemble(first) {
          const tab = orbitTable(eS.value, 40), rng = v.rng(2024), K = kS.value, W0 = 3.3;
          const tMax = Math.ceil(7 / K / TAU) + 30, out = { runs: [], count: { '1': 0, '3/2': 0, '2': 0, '5/2': 0, '3': 0, other: 0 }, tMax };
          for (let j = 0; j < 40; j++) {
            const st = [rng() * Math.PI, W0 + 0.03 * rng()], tr = [], states = [];
            for (let k = 0; k <= tMax; k++) { tr.push([k, st[1]]); states.push([k, st[0]]); spinOrbit(tab, sS.value, K, st); }
            let cls = 'other';
            for (const [key, val] of [['1', 1], ['3/2', 1.5], ['2', 2], ['5/2', 2.5], ['3', 3]]) if (resonanceWindow(states.slice(-64), val).librationCandidate) cls = key;
            out.count[cls]++; out.runs.push({ tr, cls });
          }
          ens = out; runKey = `${eS.value}|${sS.value}|${kS.value}`;
          if (first !== true) v.invalidate();
        }
        v.button('Despin ×40', () => runEnsemble());
        runEnsemble(true);
        v.onCleanup(() => { ens = null; });
        const COLS = ['blue', 'teal', 'purple', 'orange', 'green', 'pink'];
        const col = (i) => COLS[i % COLS.length];
        v.render(() => {
          const D = section();
          const ext = D.flatMap(r => r.pts.map(p => p[1]));
          ph.setView([0, 180], [Math.min(0, ...ext) - .1, Math.max(3.2, ...ext) + .1]);
          for (const run of D) ph.dots(run.pts, { r: 1.3, color: col(run.i) });
          for (const w of [1, 1.5, 2, 2.5, 3]) ph.hline(w, { color: 'faint', width: 1, dash: [2, 5], alpha: 0.6 });
          // user trajectory
          const tab = orbitTable(eS.value, 64), st = [(P.x * Math.PI) / 180, P.y], mine = [[P.x, P.y]], states = [[0, st[0]]];
          for (let k = 0; k < 260; k++) { spinOrbit(tab, sS.value, 0, st); states.push([k+1, st[0]]); mine.push([((((st[0] % Math.PI) + Math.PI) % Math.PI) * 180) / Math.PI, st[1]]); }
          const allY = [...ext, ...mine.map(q => q[1])];
          ph.setView([0, 180], [Math.min(0, ...allY) - .1, Math.max(3.2, ...allY) + .1]);
          ph.dots(mine, { r: 1.9, color: 'gold' });
          const wmin = Math.min(...mine.map((q) => q[1])), wmax = Math.max(...mine.map((q) => q[1]));
          // despin ensemble
          for (const w of [1, 1.5, 2, 2.5, 3]) tr.hline(w, { color: 'faint', width: 1, dash: [2, 5] });
          if (ens && runKey === `${eS.value}|${sS.value}|${kS.value}`) {
            const rates = ens.runs.flatMap(r => r.tr.map(p => p[1]));
            tr.setView([0, ens.tMax], [rates.reduce((a,b) => Math.min(a,b), 0) - .1, rates.reduce((a,b) => Math.max(a,b), 3.4) + .1]);
            for (const r of ens.runs) tr.path(r.tr, { color: r.cls === '3/2' ? 'green' : r.cls === '2' ? 'orange' : r.cls === '5/2' ? 'purple' : r.cls === '1' ? 'blue' : 'muted', width: r.cls === '3/2' ? 1.6 : 1, alpha: r.cls === '3/2' ? 0.95 : 0.55 });
          } else { tr.corner('press “Despin ×40”', 'tr', { color: 'muted' }); }
          cur = { wmin, wmax, candidate: [1, 1.5, 2, 2.5, 3].find(p => resonanceWindow(states.slice(-64), p).librationCandidate) };
        });
        v.legend([['teal', 'spin states (one curve per initial condition)', { dot: true }], ['gold', 'your spin', { dot: true }], ['green', 'finite-window candidate near 3:2'], ['orange', 'candidate near 2:1'], ['blue', 'candidate near 1:1']]);
        v.readout(() => {
          const e = eS.value;
          let out = String.raw`$e = ${v.fix(e, 4)}$, $\sigma = ${fmtSci(v, sS.value, 2)}$` + (e < 1e-3 ? ' · circular orbit: only $\\omega = 1$ (synchronous) survives; all non-synchronous islands vanish' : '');
          if (cur) out += String.raw` · your trajectory has $\omega \in [${v.fix(cur.wmin, 2)},\, ${v.fix(cur.wmax, 2)}]$` + (cur.candidate ? ` — finite-window libration candidate near ${cur.candidate}:1 (not permanent-capture certification)` : ' — no finite-window libration candidate; this test does not establish chaos');
          if (ens && runKey === `${eS.value}|${sS.value}|${kS.value}`) { const c = ens.count; out += String.raw` · of 40 despinning spins, finite-window candidates: $${c['3/2']}$ in 3:2, $${c['2']}$ in 2:1, $${c['5/2']}$ in 5:2, $${c['1']}$ near 1:1, $${c.other + c['3']}$ other`; }
          out += ' · deterministic 40-phase sample under an illustrative linear torque; no published or population capture probability is inferred.';
          return out;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 3.5
    {
      num: '3.5',
      kind: 'Theorem',
      name: 'Roche limit',
      statement: String.raw`A satellite held together by its own gravity alone (no material strength) cannot survive in a circular synchronous orbit about a primary of radius $R$ and density $\rho_p$ closer than
$$d_\mathrm{Roche} \approx 2.44\,R\left(\frac{\rho_p}{\rho_m}\right)^{1/3}$$
where $\rho_m$ is the satellite's density; the value $2.44$ is Roche's result for a fluid body that stretches into an ellipsoid (more exact treatments give $2.455$). For a rigid spherical satellite, comparing the tidal pull $2GMr/d^3$ with the satellite's surface gravity $Gm/r^2$ gives the smaller $d \approx 1.26\,R(\rho_p/\rho_m)^{1/3}$. Inside the limit a fluid or rubble-pile moon is torn apart and its debris spreads into a ring.`,
      idea: String.raw`Tides stretch the satellite along the line to the primary (mech 9.3) while self-gravity pulls it into a sphere. A rigid sphere only has to keep a loose rock on its surface (tide $=$ gravity). A fluid satellite does much worse because it deforms: the long axis presents a larger tidal arm and its surface gravity weakens, so the stretch runs away. For a homogeneous body in the quadrupole tidal field and synchronous spin one solves the ellipsoid-figure equation $(A_1 - 3\varepsilon)a_1^2 = A_2a_2^2 = (A_3+\varepsilon)a_3^2$, $\varepsilon = M/2\pi\rho_m d^3$, with $A_i$ the standard index symbols; equilibrium ellipsoids exist only for $d$ above a threshold, which is the fluid Roche limit. The limit depends only on the density ratio, not on the satellite's size.`,
      caption: String.raw`Drag the **distance** (in units of $R(\rho_p/\rho_m)^{1/3}$) toward the planet. In **fluid** mode the satellite is the equilibrium ellipsoid computed from the figure equation — drawn enlarged, with its true axis ratios: it lengthens and, at $\approx 2.45$, no equilibrium exists and it shears into a ring. In **rigid** mode a sphere survives down to $1.26$, where the tide at its surface overcomes its gravity and loose material lifts off. Right: the axis ratios $a_i/r$ along the fluid branch and the rigid-body tidal-to-gravity ratio. Pick the planet and the satellite's density for the distances in kilometres.`,
      scope: String.raw`Synchronously rotating, homogeneous, strengthless body in the quadrupole (small-satellite) tidal field. Real moons have strength, structure and orbits that are not synchronous; the limit marks where a rubble pile fails, not where every body does. Debris near the limit is also affected by the primary's oblateness and by the satellite's finite size.`,
      deps: ['mech-9.3'],
      refs: ['Murray–Dermott §4.8', 'Carroll–Ostlie §19.2'],
      tags: ['tides', 'Roche limit', 'rings'],
      credit: 'É. Roche, 1848',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Roche_limit' },
      viz(v) {
        const B = rocheBranch(), Dcrit = B.Dcrit;
        const PL = { earth: BODY.earth, jupiter: BODY.jupiter, saturn: BODY.saturn };
        const mode = v.select('satellite', [{ value: 'fluid', label: 'fluid / rubble pile' }, { value: 'rigid', label: 'rigid sphere' }], 'fluid');
        const planet = v.select('planet', [{ value: 'earth', label: 'Earth' }, { value: 'jupiter', label: 'Jupiter' }, { value: 'saturn', label: 'Saturn' }], 'saturn');
        const rhoM = v.slider('satellite density $\\rho_m$ (kg/m³)', 300, 5000, 900, { step: 10 });
        const dS = v.slider('distance $d$ / [$R(\\rho_p/\\rho_m)^{1/3}$]', 1, 4.5, 3.6, { step: 0.005, fmt: (x) => v.fix(x, 2) });
        const s = v.stage({ x: [-1.5, 6], y: [-2.2, 2.2], equal: true, axes: false, height: 340, weight: 1.4, title: 'planet and satellite (satellite drawn enlarged, orbit plane)' });
        const g = v.stage({ x: [1, 4.5], y: [0, 2.4], axes: 'box', gutter: true, height: 340, weight: 1, xlabel: '$d$ / [$R(\\rho_p/\\rho_m)^{1/3}$]', ylabel: 'axis ratio $a_i/r$, tide/gravity', title: 'shape along the way in' });
        let cur = null;
        v.render(() => {
          const p = PL[planet.value], ratio = Math.cbrt(p.rho / rhoM.value), D = dS.value, dR = D * ratio;   // d in planet radii
          s.setView([-1.3, Math.max(dR + 1.5, 4.5)], [-1.6, 1.6]);
          s.circle(0, 0, 1, { fill: 'gold', fillAlpha: 0.35, color: 'gold', width: 2 });
          s.text(p.name, 0, 0, { color: 'ink', size: 11, align: 'center' });
          const rd = 0.5; // drawn radius of the satellite
          const fl = mode.value === 'fluid';
          let state = 'intact';
          if (fl) {
            if (D >= Dcrit) {
              const a1 = interp(B.D.slice().reverse(), B.a1.slice().reverse(), D), a2 = interp(B.D.slice().reverse(), B.a2.slice().reverse(), D);
              const pts = []; for (let i = 0; i <= 100; i++) { const t = (TAU * i) / 100; pts.push([dR + rd * a1 * Math.cos(t), rd * a2 * Math.sin(t)]); }
              s.poly(pts, { fill: 'accent', fillAlpha: 0.35, color: 'accent', width: 2 });
              cur = { a1, a2 };
            } else {
              // disrupted: debris spreading along the orbit
              const rng = v.rng(5); state = 'torn apart';
              const spread = Math.min(TAU, 0.9 + 6 * (Dcrit - D));
              for (let i = 0; i < 160; i++) { const ang = (rng() - 0.5) * spread, rr = dR * (1 + 0.04 * (rng() - 0.5)); s.dot(rr * Math.cos(ang), rr * Math.sin(ang), { r: 2.4, color: 'accent' }); }
              cur = null;
            }
          } else {
            const q = 2 / D ** 3; // tidal / self gravity at the surface, rigid sphere
            s.circle(dR, 0, rd, { fill: 'accent', fillAlpha: 0.35, color: 'accent', width: 2 });
            if (q > 1) { state = 'rocks lifted off'; const rng = v.rng(9); for (let i = 0; i < 14; i++) { const sg = i % 2 ? 1 : -1; s.dot(dR + sg * (rd + 0.05 + 0.09 * i * 0.2 + 0.05 * rng()), (rng() - 0.5) * 0.35, { r: 2.6, color: 'red' }); } }
            cur = { q };
          }
          s.arrow(dR, 0, dR - 1.6, 0, { color: 'red', width: 1.4 });
          s.text('to the planet', dR - 0.8, 0, { color: 'red', size: 10, dy: -9, align: 'center' });
          s.corner(`d = ${v.fix(dR, 2)} ${p.name} radii  ·  ${state}`, 'tl', { color: state === 'intact' ? 'green' : 'red', weight: 600 });
          // right panel
          g.fn((x) => 2 / x ** 3, { color: 'red', width: 1.8, dash: [6, 4], domain: [1, 4.5] });
          g.path(B.D.map((x, i) => [x, B.a1[i]]), { color: 'blue', width: 2.2 });
          g.path(B.D.map((x, i) => [x, B.a2[i]]), { color: 'green', width: 2.2 });
          g.path(B.D.map((x, i) => [x, B.a3[i]]), { color: 'orange', width: 2.2 });
          g.hline(1, { color: 'faint', width: 1, dash: [2, 4] });
          g.vline(Dcrit, { color: 'blue', width: 1.2, dash: [3, 3] });
          g.vline(Math.cbrt(2), { color: 'red', width: 1.2, dash: [3, 3] });
          g.text(`fluid: ${v.fix(Dcrit, 3)}`, Dcrit, 2.2, { color: 'blue', size: 10.5, dx: 5, align: 'left' });
          g.text('rigid: 1.26', Math.cbrt(2), 2.2, { color: 'red', size: 10.5, dx: 5, align: 'left' });
          g.vband(1, Dcrit, { color: 'blue', alpha: 0.05 });
          g.text('no fluid equilibrium', (1 + Dcrit) / 2, 0.55, { color: 'blue', size: 10.5, align: 'center' });
          g.vline(D, { color: 'gold', width: 1.4 });
        });
        v.legend([['blue', '$a_1/r$ (toward the planet)'], ['green', '$a_2/r$'], ['orange', '$a_3/r$ (spin axis)'], ['red', 'rigid: tide / self-gravity', { dash: true }]]);
        v.readout(() => {
          const p = PL[planet.value], ratio = Math.cbrt(p.rho / rhoM.value);
          return String.raw`fluid limit $= ${v.fix(Dcrit, 3)}\,R(\rho_p/\rho_m)^{1/3} = ${v.fix((Dcrit * ratio * p.R) / 1e6, 1)}\times10^3$ km (${v.fix(Dcrit * ratio, 2)} ${p.name} radii) · rigid limit $= 2^{1/3}R(\rho_p/\rho_m)^{1/3} = ${v.fix((Math.cbrt(2) * ratio * p.R) / 1e6, 1)}\times10^3$ km · density ratio $\rho_p/\rho_m = ${v.fix(p.rho / rhoM.value, 2)}$` + (cur && cur.a1 ? String.raw` · axes $a_1 : a_2 : a_3 = ${v.fix(cur.a1, 3)} : ${v.fix(cur.a2, 3)} : ${v.fix(1 / (cur.a1 * cur.a2), 3)}$` : '') + (p.name === 'Earth' && Math.abs(rhoM.value - 3344) < 100 ? String.raw` · the Moon (at 384 400 km) is about ${v.fix(BODY.moon.a / (Dcrit * ratio * p.R), 0)} times farther out than the fluid limit` : '');
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 3.6
    {
      num: '3.6',
      kind: 'Phenomenon',
      name: 'Planetary rings and shepherd moons',
      statement: String.raw`Particles in planetary rings exchange angular momentum through collisions, and an unperturbed ring can spread. Nearby satellites perturb the ring and can help maintain sharp edges or narrow ringlets. An exterior particle passing a small moon on a near-circular orbit can gain guiding-centre radius, while the corresponding interior encounter loses it. **This repulsion alone is not a complete confinement mechanism:** satellite forcing also injects energy, and collisions in the nonaxisymmetric perturbed flow can change even the direction of angular-momentum transport. Physical shepherding requires a consistent energy and angular-momentum budget, not simply a balance of independent repulsive kicks and an assumed viscosity.`,
      idea: String.raw`Expand the planet's field in a frame rotating with a small moon. In units of its Hill radius $R_H=a(m/3M_p)^{1/3}$ and $1/n$, the planar equations are $\ddot x-2\dot y-3x=-3x/r^3$, $\ddot y+2\dot x=-3y/r^3$, with $r^2=x^2+y^2$. The unforced guiding centre is $x_g=2(\dot y+2x)$. A numerical passing encounter gives its change. At large separation $|D|$ the weak-encounter change scales as $\operatorname{sgn}(D)|D|^{-5}$; this is an asymptotic scaling, not a sharp transition at a particular Hill radius. Borderies, Goldreich and Tremaine's complete shepherding discussion explains why dissipation and angular-momentum transport in the perturbed ring cannot be replaced by a simple unperturbed viscous prescription.`,
      caption: String.raw`A **kick-plus-diffusion toy**, with radial deviations stretched ×3. Both rings receive exactly the same seeded random-walk increments; one additionally receives numerical Hill-encounter kicks from two fixed moons. Change the **moon mass**, **diffusion** or presence of moons to restart a comparable experiment. Increasing moon mass can narrow the surviving sample or remove it entirely; a narrow surviving sample does not prove physical confinement. Red points are retired by the chosen $2.6R_H$ encounter cutoff or at the radial-box boundaries; they are not simulated scattered trajectories. The histogram is surviving fraction per unit $a$, normalized by the original particle number, so its area decreases when particles leave.`,
      scope: String.raw`Illustrative stochastic prescription, **not a self-consistent collisional ring or shepherding calculation**: it does not track epicyclic energy, reciprocal moon migration, collision stress or total angular momentum. Fixed circular moons, small relative separations, exaggerated masses. Kicks interpolate independent numerical encounters started500/1000 Hill radii away, extrapolated in $1/Y$; residual boundary/integration and interpolation errors remain. The $2.6R_H$ retirement rule is chosen, not a universal horseshoe/scattering boundary; the open box is $0.8\le a\le1.2$. No satellite-discovery priority or actual ring lifetime is inferred.`,
      deps: ['astro-3.5', 'astro-2.8'],
      refs: ['Borderies–Goldreich–Tremaine (1984), Unsolved Problems in Planetary Ring Dynamics, §§IV–V pp.722–732, especially §V.C pp.728–732', 'Hill expansion and independent encounter audit in verification report'],
      tags: ['rings', 'resonance', 'moons'],
      credit: 'Borderies, Goldreich & Tremaine, 1984 (physical caveats and shepherding treatment)',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Shepherd_moon' },
      viz(v) {
        let S = null;
        const restart = () => { if (S) S.reset(); };
        const mS = v.slider('moon mass ratio $m/M_p$', 1e-7, 1e-4, 1e-5, { log: true, sig: 2, fmt: (x) => x.toExponential(1), onChange: restart });
        const dS = v.slider('viscous spreading (rms step per √orbit)', 2e-4, 3e-3, 1e-3, { log: true, sig: 2, onChange: restart });
        const on = v.toggle('shepherd moons present', true, { onChange: restart });
        const GAIN = 3, NP = 360, AM = 0.07; // moons at a = 1 ∓ 0.07
        const s = v.stage({ x: [-1.65, 1.65], y: [-1.65, 1.65], equal: true, axes: false, height: 360, weight: 1.15, title: 'the ring (radial scale stretched ×3)' });
        const g = v.stage({ x: [0.8, 1.2], y: [0, 1], axes: 'box', gutter: true, height: 360, weight: 1, xlabel: 'orbital radius $a$', ylabel: 'surviving fraction per unit a', title: 'radial profile' });
        S = v.sim(() => {
          const rng = v.rng(77), st = { t: 0, rng, a: new Float64Array(NP), ph: new Float64Array(NP), b: new Float64Array(NP), pb: new Float64Array(NP), lost: new Uint8Array(NP), lostB: new Uint8Array(NP), ml: [0, 1.7, 4.1].slice(0, 3), mph: [0, 0], nLost: 0, prev: new Float64Array(2 * NP), prevB: new Float64Array(NP) };
          for (let i = 0; i < NP; i++) { st.a[i] = 1 + 0.012 * (rng() + rng() - 1); st.b[i] = st.a[i]; st.ph[i] = rng() * TAU; st.pb[i] = st.ph[i]; }
          st.mph = [0.4, 2.9];
          return st;
        }, (st, dt) => {
          advanceToyRing(st, dt, {mu: mS.value, sigma: dS.value, moons: on.value});
        }, { dt: 0.05 });
        let cur = null;
        v.animate((t) => {
          S.advance(t * 6);
          const st = S.state, mu = mS.value, RH = Math.cbrt(mu / 3);
          const T = st.t;
          // polar picture, co-rotating drawing is not needed: positions are physical angles
          s.circle(0, 0, 0.12, { fill: 'gold', fillAlpha: 0.5, color: 'gold' });
          for (let i = 0; i < NP; i++) {
            const rr = 1 + (st.a[i] - 1) * GAIN;
            if (st.lost[i]) { s.dot(rr * Math.cos(st.ph[i]), rr * Math.sin(st.ph[i]), { r: 1.6, color: 'red' }); continue; }
            s.dot(rr * Math.cos(st.ph[i]), rr * Math.sin(st.ph[i]), { r: 1.7, color: 'accent' });
          }
          s.circle(0, 0, 1, { color: 'faint', width: 1, dash: [2, 5] });
          if (on.value) for (let j = 0; j < 2; j++) {
            const am = j === 0 ? 1 - AM : 1 + AM, rr = 1 + (am - 1) * GAIN;
            s.dot(rr * Math.cos(st.mph[j]), rr * Math.sin(st.mph[j]), { r: 6, color: 'muted' });
            s.circle(0, 0, rr, { color: 'faint', width: 1, dash: [3, 4] });
          }
          s.corner(`t = ${v.fix(T, 0)} orbits`, 'tl', { color: 'ink', weight: 600 });
          // profile
          const H1 = ringHistogram(st.b, st.lostB), H2 = ringHistogram(st.a, st.lost), top = Math.max(1, ...H1.counts, ...H2.counts) * 1.1;
          g.setView([.8, 1.2], [0, top]);
          const norm = H => H;
          g.hist(norm(H1), { color: 'muted', fillAlpha: 0, outline: true, density: false });
          g.hist(norm(H2), { color: 'accent', fillAlpha: 0.35, density: false });
          if (on.value) { g.vline(1 - AM, { color: 'red', width: 1.5 }); g.vline(1 + AM, { color: 'red', width: 1.5 }); }
          const F = ringStats(st.b, st.lostB), M = ringStats(st.a, st.lost);
          cur = { T, rf: F.rms, rm: M.rms, nLost: NP - M.count, nFree: F.count, remaining: M.count, RH };
        }, { period: 80, still: 79.5 });
        v.legend([['accent', 'test ring (moon toggle)', { dot: true }], ['muted', 'reference ring (no moons)', { dash: true }], ['red', 'moon orbits / retired markers', { dot: true }]]);
        v.readout(() => {
          if (!cur) return '';
          return String.raw`$R_H/a = ${v.fix(cur.RH, 4)}$ · moons at $\pm0.07a$, ${v.fix(.07 / cur.RH, 1)} Hill radii from centre · time ${v.fix(cur.T, 0)} orbits · surviving particles ${cur.remaining}/${NP} in test sample, ${cur.nFree}/${NP} in reference sample · surviving rms width: ${cur.rm === null ? 'undefined (no surviving particles)' : fmtSci(v, cur.rm, 2)} in test sample; ${cur.rf === null ? 'undefined (no surviving particles)' : fmtSci(v, cur.rf, 2)} in reference sample · moons ${on.value ? 'on' : 'off'} · retired ${cur.nLost}/${NP} by chosen encounter/boundary rules · kick-plus-diffusion comparison only: neither narrowing nor removal certifies physical shepherding.`;

        });
      },
    },
    // ───────────────────────────────────────────────────────────── 3.7
    {
      num: '3.7',
      kind: 'Phenomenon',
      name: 'Tidal heating of Io',
      statement: String.raw`Io keeps one face toward Jupiter, but its orbit is slightly eccentric ($e = 0.004$), so the tide Jupiter raises on it grows and shrinks, and its bulge is flexed once per $1.77$-day orbit. The internal friction turns orbital energy into heat at a rate
$$\dot E = \frac{21}{2}\,\frac{k_2}{Q}\,\frac{G M_J^2 R^5\, n\, e^2}{a^6},$$
($M_J$ Jupiter's mass, $R$, $a$, $n$ Io's radius, orbital radius and mean motion). This is proportional to $e^2$, and tides alone would circularise the orbit in roughly $10^5$ years (for $k_2/Q$ of order $10^{-2}$); the heating continues because Io's mean motions are locked in the Laplace resonance with Europa and Ganymede (2.10), which keeps pumping its eccentricity. This supplies Io’s intense volcanism, with thermal radiation of order $10^{14}$ W.`,
      idea: String.raw`The tidal energy is dissipated only in the time-varying part of the tide. For a synchronous satellite on a circular orbit the bulge is fixed and nothing flexes (tidal locking, 3.3, has already removed the steady part); with eccentricity the distance changes by $\pm ae$ and the tide amplitude $\propto (a/r)^3$ by $\pm3e$ to first order in $e$, and the dissipation scales with the square of that, hence $e^2$ and the steep $a^{-6}$. Tides also act to reduce $e$, on a time $\tau_e = \frac{2}{21n}\frac{Q}{k_2}\frac{m}{M_J}\left(\frac aR\right)^5$; the Laplace resonance in this system (2.10), which transfers angular-momentum and energy among the three moons, can sustain a forced $e$ against this. Peale, Cassen and Reynolds (1979) predicted a largely molten interior and speculated about widespread recurrent volcanism; their paper discussed the forthcoming Voyager images.

The leading eccentricity estimate uses Taylor theorem pma-5.15 on the inverse-cube tidal amplitude. If $r=a(1+\eta)$ with small eta, then $(a/r)^3=1-3\eta+O(\eta^2)$. The time-dependent part is therefore first order in e, and its quadratic dissipation is leading order $e^2$. This establishes the power counting, not the numerical coefficient or an all-eccentricity heating law.`,
      caption: String.raw`Left: the strength of Jupiter's tide on Io over one orbit, $(a/r)^3$: its first-order swing is $\pm3e$. Middle: dissipated power against eccentricity for the chosen $k_2/Q$; drag the **eccentricity handle** (the vertical marker marks Io's value, the band the historical background-emission benchmark adopted by Veeder et al. (2012)). Right: with the resonance **off**, tides alone damp $e$ (and the heating) away in $\tau_e$; with it **on**, the chosen $e$ is imposed as constant. The three-moon resonance dynamics is not integrated.`,
      scope: String.raw`Exact synchronous rotation with no physical libration, zero obliquity, quadrupole tide and leading order in small eccentricity; uniform dissipation described by a single $k_2/Q$, with the eccentricity given. $k_2/Q$ of Io is uncertain; the slider shows what value would be needed to match the observed output. The band is $1.05\pm0.12\times10^{14}$ W, adopted in Veeder et al. (2012) §1.1 from nine apparitions in 1983–1993; the uncertainty is their temporal standard deviation, not a bound on every epoch. This is not a current measurement or an exact equilibrium heat budget. Peale et al. (1979) Eq.(7) uses a different numerical coefficient; the displayed $21/2$ expression and its restrictive assumptions follow Makarov–Efroimsky (2014) §3, Eq.(8).`,
      deps: ['astro-3.2', 'astro-2.10', 'pma-5.15'],
      refs: ['Peale–Cassen–Reynolds (1979), pp.892–894', 'Makarov–Efroimsky (2014), §§2–3 pp.2–4 Eqs.(3),(7)–(9)', 'Fang–Margot (2012), p.5 Eq.(1)', 'Veeder et al. (2012), §1.1 p.703 and Table2 p.704'],
      tags: ['tides', 'Io', 'volcanism'],
      credit: 'Peale, Cassen & Reynolds, 1979',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Tidal_heating' },
      viz(v) {
        const Io = BODY.io, MJ = BODY.jupiter.M, n = TAU / Io.P;
        const kq = v.slider('$k_2/Q$ of Io', 0.003, 0.1, 0.015, { log: true, sig: 2 });
        const res = v.toggle('impose constant forced $e$', true);
        const P = (e, k) => 10.5 * k * G * MJ ** 2 * Io.R ** 5 * n * e * e / Io.a ** 6;
        const s = v.stage({ x: [0, 360], y: [0.95, 1.05], axes: 'box', gutter: true, height: 300, weight: 1, xlabel: 'orbital phase (mean anomaly, °)', ylabel: 'tide strength $(a/r)^3$', title: 'the tide flexes Io', xticks: [0, 90, 180, 270, 360] });
        const p = v.stage({ x: [0, 0.01], y: [0, 3], axes: 'box', gutter: true, height: 300, weight: 1, xlabel: 'eccentricity $e$', ylabel: 'tidal power (10¹⁴ W)', title: 'power against eccentricity' });
        const d = v.stage({ x: [0, 1], y: [0, 4.2], axes: 'box', gutter: true, height: 300, weight: 1, xlabel: 'time (Myr)', ylabel: 'power (10¹⁴ W)', title: 'with and without the resonance' });
        const H = p.handle(Io.e, P(Io.e, 0.015) / 1e14, { color: 'accent', r: 7, label: 'e', labelPos: 'ne', constrain: (x) => { const X = clamp(x, 0, 0.01); return [X, P(X, kq.value) / 1e14]; } });
        let cur = null;
        v.render(() => {
          const k = kq.value, e = clamp(H.x, 0, 0.01); H.set(e, P(e, k) / 1e14);
          // tide over one orbit
          const f = (M) => { let E = M; for (let i = 0; i < 40; i++) E -= (E - e * Math.sin(E) - M) / (1 - e * Math.cos(E)); const r = 1 - e * Math.cos(E); return 1 / r ** 3; };
          s.setView([0, 360], [1 - 3.4 * 0.01, 1 + 3.4 * 0.01]);
          s.hline(1, { color: 'faint', width: 1 });
          s.fn((x) => f(x * DEG), { color: 'accent', width: 2.4, n: 200 });
          s.text(`first-order $\\pm 3e = \\pm ${v.fix(3 * e * 100, 2)}\\%$`, 180, 1 + 3.2 * 0.01, { color: 'ink', size: 11, align: 'center' });
          // power curve
          p.setView([0, 0.01], [0, Math.max(3, P(0.01, k) / 1e14 * 1.05)]);
          p.fn((x) => P(x, k) / 1e14, { color: 'accent', width: 2.4, n: 60 });
          p.hband(0.93, 1.17, { color: 'green', alpha: 0.18 });
          p.text('1983–1993 benchmark', 0.0001, 1.17, { color: 'green', size: 10, dy: -9, align: 'left' });
          p.vline(Io.e, { color: 'faint', width: 1, dash: [3, 4] });
          // eccentricity damping
          const tauE = (2 / (21 * n)) * (1 / k) * (Io.M / MJ) * (Io.a / Io.R) ** 5 / YEAR; // yr
          const ytop = Math.max(1.4, P(e, k) / 1e14 * 1.1), xmax = Math.max(0.05, 3 * tauE / 1e6);
          d.setView([0, xmax], [0, ytop]);
          d.hband(0.93, 1.17, { color: 'green', alpha: 0.18 });
          const e0 = e;
          if (res.value) d.hline(P(e0, k) / 1e14, { color: 'accent', width: 2.4 });
          else d.fn((t) => P(e0 * Math.exp(-(t * 1e6) / tauE), k) / 1e14, { color: 'red', width: 2.4, n: 200, domain: [0, xmax] });
          d.vline(tauE / 1e6, { color: 'faint', width: 1, dash: [3, 4] });
          cur = { e, k, Pw: P(e, k), tauE, need: 1e14 / P(Io.e, 1) };
        });
        v.legend([['accent', 'tidal power'], ['green', 'historical benchmark (Veeder2012)', { area: true }], ['red', 'decay without resonance']]);
        v.readout(() => {
          if (!cur) return '';
          const n1 = 1 / 1.769138, n2 = 1 / 3.551181, n3 = 1 / 7.154553;
          return String.raw`$\dot E = ${v.fix(cur.Pw / 1e14, 2)}\times10^{14}$ W at $e = ${v.fix(cur.e, 4)}$, $k_2/Q = ${v.fix(cur.k, 3)}$ · circularisation time $\tau_e = ${fmtSci(v, cur.tauE, 1)}$ yr · matching $10^{14}$ W at Io's $e = 0.004$ needs $k_2/Q \approx ${v.fix(cur.need, 3)}$ · Laplace relation from the orbital periods $1/P_1 - 3/P_2 + 2/P_3 = ${v.fix(n1 - 3 * n2 + 2 * n3, 5)}$ d$^{-1}$ ≈ 0 · historical benchmark $1.05\pm0.12\times10^{14}$ W (1983–1993 temporal mean/standard deviation, adopted in Veeder2012); forced eccentricity is imposed, not dynamically calculated`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 3.8
    {
      num: '3.8',
      kind: 'Model',
      name: 'Rotational flattening of planets',
      statement: String.raw`A fluid planet in hydrostatic equilibrium (fluid-2.2) that rotates with angular velocity $\Omega$ has a surface of constant effective potential: it bulges at the equator. The size of the effect is set by $q = \Omega^2R^3/GM$, the ratio of centrifugal to gravitational acceleration at the equator, and by how centrally concentrated the mass is. For small $q$ the flattening $f = (R_\mathrm{eq} - R_\mathrm{pol})/R_\mathrm{eq}$ is $f \approx \tfrac54 q$ for a uniform (Maclaurin) spheroid and, to first order, $f = \dfrac{\tfrac52 q}{1 + \tfrac{25}{4}\,(1 - \tfrac32 K)^2}$ (Darwin–Radau) with $K = C/MR^2$ the moment-of-inertia factor: $K = 0.4$ for a uniform sphere and less for a centrally condensed one, which is flattened less.`,
      idea: String.raw`In the rotating frame the surface is an equipotential of gravity plus the centrifugal potential (mech 9.7), so the surface has to dip at the pole by the amount that the centrifugal term lifts the equator. For a homogeneous body this is solved exactly by the Maclaurin spheroids, for which $\Omega^2/\pi G\rho$ is an explicit function of the eccentricity; for a body in which the density increases inward Clairaut's equation links the flattening of each layer to the density profile, and Radau's approximation reduces it to a single relation between $f$, $q$ and $C/MR^2$. Concentrating mass toward the centre makes the interior gravity field nearly that of a point, which is less deformable.

Taylor theorem pma-5.15 gives the small-eccentricity limit of the stated homogeneous Maclaurin figure relation: $\Omega^2/(\pi G\rho)=(8/15)e^2+O(e^4)$, while the geometric flattening is $f=1-\sqrt{1-e^2}=e^2/2+O(e^4)$. Since $q=3\Omega^2/(4\pi G\rho)$ to this order, eliminating e yields $f=5q/4+O(q^2)$. This derives the uniform-fluid first-order coefficient, not the separate Darwin-Radau approximation for a centrally condensed body.`,
      caption: String.raw`Pick **Earth**, **Jupiter** or **Saturn** (its rotation, size and mass are loaded) or move the **spin period** and **concentration** $K$ yourself: the outline is the computed spheroid (exaggerated for Earth) against a circle of equal equatorial radius. Right: flattening against $q$ for several $K$ (log axes), the exact Maclaurin curve for a uniform fluid, and the observed planets. The observed values sit near the curves; the **inferred $K$** is the concentration that would reproduce each planet's flattening.`,
      scope: String.raw`Rigid-rotation hydrostatic equilibrium, small flattening (Radau–Darwin is first order). The giant planets rotate differentially in their winds, which causes percent-level departures; Earth is also not perfectly hydrostatic. The Maclaurin curve is drawn only up to $e \approx 0.81$, beyond which these spheroids are secularly unstable to the triaxial Jacobi ellipsoids.`,
      deps: ['mech-9.7', 'fluid-2.2', 'pma-5.15'],
      refs: ['Murray–Dermott §4.5'],
      tags: ['rotation', 'shape', 'hydrostatics'],
      credit: 'Maclaurin, 1742; Clairaut, 1743',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Clairaut%27s_theorem' },
      viz(v) {
        const PLN = { earth: { ...BODY.earth, K: 0.3307, name: 'Earth' }, jupiter: { ...BODY.jupiter, name: 'Jupiter' }, saturn: { ...BODY.saturn, name: 'Saturn' } };
        const sel = v.select('planet', [{ value: 'earth', label: 'Earth' }, { value: 'jupiter', label: 'Jupiter' }, { value: 'saturn', label: 'Saturn' }], 'jupiter', { onChange: (k) => { const p = PLN[k]; per.set(p.P / 3600); Ks.set(p.K || inferK(p)); } });
        const qOf = (p, P) => ((TAU / P) ** 2 * p.R ** 3) / (G * p.M);
        const radau = (q, K) => (2.5 * q) / (1 + 6.25 * (1 - 1.5 * K) ** 2);
        const inferK = (p) => { const q = qOf(p, p.P), s2 = (2.5 * q) / p.f - 1; return (2 / 3) * (1 - 0.4 * Math.sqrt(Math.max(s2, 0))); };
        const per = v.slider('spin period (h)', 2, 40, 9.925, { log: true, sig: 3 });
        const Ks = v.slider('concentration $K = C/MR^2$', 0.15, 0.4, inferK(PLN.jupiter), { step: 0.002, fmt: (x) => v.fix(x, 3) });
        const s = v.stage({ x: [-1.45, 1.45], y: [-1.3, 1.3], equal: true, axes: false, height: 340, weight: 1, title: 'meridian section (equatorial radius = 1)' });
        const g = v.stage({ x: [1e-3, 0.35], xlog: true, y: [1e-3, 0.35], ylog: true, axes: 'box', gutter: true, height: 340, weight: 1.2, xlabel: '$q = \\Omega^2R^3/GM$', ylabel: 'flattening $f$', title: 'flattening against rotation' });
        const mac = []; for (let e = 0.03; e <= 0.81; e += 0.01) { const W = (2 * Math.sqrt(1 - e * e) / e ** 3) * (3 - 2 * e * e) * Math.asin(e) - (6 * (1 - e * e)) / (e * e); mac.push([0.75 * W / Math.sqrt(1 - e * e), 1 - Math.sqrt(1 - e * e)]); }
        let cur = null;
        v.render(() => {
          const p = PLN[sel.value], q = qOf(p, per.value * 3600), K = Ks.value, f = radau(q, K);
          const mag = f < 0.02 ? 0.05 / f : 1;
          const ell = (ff, color, o = {}) => { const pts = []; for (let i = 0; i <= 180; i++) { const t = (TAU * i) / 180; pts.push([Math.cos(t), (1 - mag * ff) * Math.sin(t)]); } s.path(pts, { color, width: o.width || 2.2, dash: o.dash }); };
          s.circle(0, 0, 1, { color: 'faint', width: 1.2, dash: [4, 4] });
          const sh = []; for (let i = 0; i <= 180; i++) { const t = (TAU * i) / 180; sh.push([Math.cos(t), (1 - mag * f) * Math.sin(t)]); }
          s.poly(sh, { fill: 'accent', fillAlpha: 0.2, color: 'accent', width: 2.2 });
          if (sel.value !== 'earth') ell(p.f, 'red', { dash: [5, 4], width: 1.4 });
          s.line(0, -1.2, 0, 1.2, { color: 'faint', width: 1, dash: [2, 4] });
          s.text('spin axis', 0, 1.2, { color: 'muted', size: 10, dx: 5, align: 'left' });
          s.corner(`$f = ${v.fix(f, 4)}$` + (mag > 1 ? ` (drawn ×${v.fix(mag, 0)})` : ''), 'tl', { color: 'accent', weight: 600 });
          // flattening plot
          for (const [KK, col, lab] of [[0.4, 'blue', '0.4'], [0.33, 'teal', '0.33'], [0.25, 'purple', '0.25'], [0.2, 'orange', '0.2']]) {
            g.fn((x) => radau(x, KK), { color: col, width: 1.5, dash: [5, 4], domain: [1e-3, 0.35], n: 60 });
          }
          g.path(mac, { color: 'green', width: 2.4 });
          g.fn((x) => radau(x, K), { color: 'accent', width: 2.4, domain: [1e-3, 0.35], n: 60 });
          for (const key of ['earth', 'jupiter', 'saturn']) { const pp = PLN[key]; g.dot(qOf(pp, pp.P), pp.f, { r: 5, color: 'red' }); g.text(pp.name, qOf(pp, pp.P), pp.f, { color: 'red', size: 10.5, dx: 8, dy: 8, align: 'left' }); }
          g.dot(q, f, { r: 6, color: 'gold' });
          cur = { q, f, K, p, Kinf: sel.value === 'earth' ? NaN : inferK(p) };
        });
        v.legend([['accent', 'Darwin–Radau, your $K$'], ['green', 'Maclaurin (uniform fluid), exact'], ['blue', '$K=0.4$ … $0.2$ (dashed)', { dash: true }], ['red', 'observed flattening', { dot: true }]]);
        v.readout(() => {
          if (!cur) return '';
          const { q, f, K, p } = cur;
          return String.raw`$q = ${v.fix(q, 4)}$ → $f = ${v.fix(f, 4)}$ (uniform fluid: $\tfrac54 q = ${v.fix(1.25 * q, 4)}$) · observed for ${p.name} (NASA fact sheet): $f = ${v.fix(p.f, 5)}$ at its actual spin` + (isFinite(cur.Kinf) ? String.raw` · concentration needed to reproduce it: $K \approx ${v.fix(cur.Kinf, 3)}$` : String.raw` · Earth's $K \approx 0.33$ (a dense core) reproduces its $f$`);
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 3.9
    {
      num: '3.9',
      kind: 'Phenomenon',
      name: 'Jeans escape of planetary atmospheres',
      statement: String.raw`The classical Jeans model assumes an isotropic Maxwell–Boltzmann velocity distribution at temperature $T$ at a collisionless exobase (radius $r$, density $n_c$). Those in the high-speed tail that exceed the escape speed $v_\mathrm{esc} = \sqrt{2GM/r}$ and are moving outward leave. The outcome is controlled by the Jeans parameter $\lambda = \dfrac{GMm}{k_BT\,r} = \dfrac{v_\mathrm{esc}^2}{v_0^2}$ ($v_0 = \sqrt{2k_BT/m}$): the escaping flux per unit area is $\Phi = n_c\,\dfrac{v_0}{2\sqrt\pi}\,(1+\lambda)\,e^{-\lambda}$, which falls exponentially with $\lambda$. At large $\lambda$ this particular thermal flux is exponentially suppressed; at small $\lambda$ a static Jeans model may fail and a flowing atmosphere must be considered.`,
      idea: String.raw`The speed distribution (thermo 6.15) $f(v) \propto v^2 e^{-mv^2/2k_BT}$ is Gaussian in the velocity, so the fraction beyond a speed $v_\mathrm{esc}$ falls like $e^{-\lambda}$ with $\lambda = mv_\mathrm{esc}^2/2k_BT$, the ratio of the gravitational binding energy to the thermal energy. Escape speed (mech 3.13) fixes the cutoff; mass $m$ and temperature $T$ set the width. The $e^{-\lambda}$ makes the effect extremely selective: a factor of 4 in mass (H against He) changes the loss rate by many orders of magnitude.

The escape flux weights outward velocities by their normal component, rather than using the unweighted speed-tail probability. Angular integration of an isotropic Maxwellian leaves a radial integral proportional to $\int_{\sqrt\lambda}^{\infty}u^3e^{-u^2}\,du$. With $s=u^2$, integration by parts pma-6.22 gives $\tfrac12(1+\lambda)e^{-\lambda}$, with the upper endpoint vanishing. This is the origin of the displayed prefactor under the static collisionless assumptions.`,
      caption: String.raw`Left: the speed distributions of H, He, N$_2$ and CO$_2$ at the chosen temperature; the vertical line is the escape speed and the **shaded speed tails** include both inward and outward directions. They are not the escaping flux, which also weights the outward velocity component. Change the **body**, the **temperature** (and, for Earth, the exobase **altitude**) and watch the tails vanish for heavy gases. Right: the diagnostic time $n_cH/\Phi$, with local scale height $H=r/\lambda$, against 4.5 Gyr. This is a fixed-flux, one-local-scale-height column, not a whole-atmosphere lifetime. The tail integrals extend to infinity; only a finite portion of each curve is drawn.`,
      scope: String.raw`Static, collisionless exobase with a Maxwellian distribution. The exobase temperature of Earth varies strongly with solar activity (the value here is illustrative); Jeans escape is not the only loss process — for hydrogen on Earth it is limited by diffusion from below, and heavier species are lost mainly by non-thermal processes (ionisation by sunlight and solar-wind interaction). The column diagnostic ignores resupply and assumes the flux remains fixed as the column depletes. The Moon option is a hypothetical surface Maxwellian: no collisional lunar exobase or observed atmospheric lifetime is being modelled. For small $\lambda$, read the formula as a formal estimate outside the static Jeans regime.`,
      deps: ['mech-3.13', 'thermo-6.15', 'pma-6.22'],
      refs: ['Mueller-Wodarg (2001), The Neutral Atmosphere, pp.31–32 (PDF33–34)', 'Direct outward-velocity integral and scale-height calculation in verification report'],
      tags: ['atmospheres', 'escape', 'Maxwell–Boltzmann'],
      viz(v) {
        const SP = [{ k: 'H', m: 1.008 * AMU, color: 'orange' }, { k: 'He', m: 4.0026 * AMU, color: 'purple' }, { k: 'N₂', m: 28.014 * AMU, color: 'blue' }, { k: 'CO₂', m: 44.009 * AMU, color: 'red' }];
        const body = v.select('body', [{ value: 'earth', label: 'Earth (exobase)' }, { value: 'moon', label: 'Moon (surface)' }], 'earth', { onChange: (k) => { T.set(k === 'earth' ? 1000 : 390); alt.el.hidden = k !== 'earth'; } });
        const T = v.slider('temperature $T$ (K)', 100, 3000, 1000, { log: true, sig: 3 });
        const alt = v.slider('exobase altitude (km)', 0, 1500, 500, { step: 10 });
        const logy = v.toggle('logarithmic density axis (shows the tails)', true);
        const s = v.stage({ x: [0, 14], y: [1e-12, 2], ylog: true, axes: 'box', gutter: true, height: 330, weight: 1.25, xlabel: 'molecular speed (km/s)', ylabel: 'speed probability density (per km/s)', title: 'Maxwell–Boltzmann speeds' });
        const g = v.stage({ x: [0.4, 4.6], y: [-3, 24], axes: 'box', gutter: true, height: 330, weight: 1, xlabel: '', ylabel: '$\\log_{10}$ column diagnostic (yr)', title: 'one local scale-height column / fixed flux',
          xticks: [[1, 'H'], [2, 'He'], [3, 'N₂'], [4, 'CO₂']] });
        let cur = null;
        v.render(() => {
          const isE = body.value === 'earth', Mb = isE ? BODY.earth.M : BODY.moon.M, Rb = (isE ? BODY.earth.R + alt.value * 1e3 : BODY.moon.R), vesc = Math.sqrt(2 * G * Mb / Rb), TT = T.value;
          alt.el.hidden = !isE;
          const rows = SP.map((sp) => {
            const D = jeansModel({mass: Mb, radius: Rb, particleMass: sp.m, temperature: TT}), z = Math.sqrt(D.lambda);
            const frac = v.M.erfc(z) + 2 / Math.sqrt(Math.PI) * z * Math.exp(-D.lambda);
            return { ...sp, ...D, frac };
          });
          const dens = (sp, vk) => { const v_ = vk * 1e3, a = sp.m / (2 * Math.PI * K_B * TT); return 4 * Math.PI * a ** 1.5 * v_ * v_ * Math.exp(-sp.m * v_ * v_ / (2 * K_B * TT)) * 1e3; }; // per km/s
          const xmax = Math.max(vesc * 1.15 / 1e3, ...rows.map(r => 4 * r.v0 / 1e3));
          const top = Math.max(...rows.map(r => dens(r, r.v0 / 1e3)));
          const floor = top * 1e-13;
          s.setScale({ ylog: logy.value, x: [0, xmax], y: logy.value ? [floor, top * 2] : [0, top * 1.1] });
          for (const r of rows) {
            s.fn((x) => logy.value && dens(r, x) < floor ? NaN : dens(r, x), { color: r.color, width: 2.2, n: 260 });
            if (vesc / 1e3 < xmax) s.fn((x) => logy.value && dens(r, x) < floor ? NaN : dens(r, x), { color: r.color, stroke: false, fill: true, base: logy.value ? floor : 0, fillAlpha: 0.35, domain: [vesc / 1e3, xmax], n: 100 });
          }
          s.vline(vesc / 1e3, { color: 'ink', width: 1.6, dash: [6, 4] });
          s.text(`$v_\\mathrm{esc} = ${v.fix(vesc / 1e3, 2)}$ km/s`, vesc / 1e3, logy.value ? top * 1.2 : top * 1.04, { color: 'ink', size: 11, dx: vesc / 1e3 > 6 ? -6 : 6, align: vesc / 1e3 > 6 ? 'right' : 'left' });
          const ymin = Math.min(-3, ...rows.map(r => r.logYears)) - 1, ymax = Math.max(11, ...rows.map(r => r.logYears)) + 1;
          g.setView([0.4, 4.6], [ymin, ymax]);
          // column diagnostic times
          g.hline(Math.log10(4.5e9), { color: 'green', width: 1.2, dash: [6, 4] });
          g.text('age of the Solar System', 0.45, Math.log10(4.5e9), { color: 'green', size: 10, dy: -9, align: 'left' });
          rows.forEach((r, i) => {
            const y = r.logYears;
            g.rect(i + 0.65, ymin, i + 1.35, y, { fill: r.color, fillAlpha: 0.45, color: r.color });
          });
          cur = { rows, vesc, Rb };
        });
        v.legend([['orange', 'H'], ['purple', 'He'], ['blue', 'N₂'], ['red', 'CO₂']]);
        v.readout(() => {
          if (!cur) return '';
          const r = cur.rows;
          const times = r.map(z => `${z.k}: $10^{${v.fix(z.logYears, 2)}}$`).join(', ');
          return String.raw`$v_\mathrm{esc}=\sqrt{2GM/r}=${v.fix(cur.vesc / 1e3, 2)}$ km/s at $r=${v.fix(cur.Rb / 1e3, 0)}$ km · Jeans parameters $\lambda$: ${r.map(z => `${z.k} $${v.fix(z.lambda, 2)}$`).join(', ')} · fixed-flux local-column diagnostic (yr): ${times}` + ' · shaded speed tail includes inward velocities; the outward energetic fraction is half the full speed tail, and neither is a flux.' + (r.some(z => z.lambda < 3) ? ' Small Jeans parameter: static-exobase assumptions may fail; formal estimates only.' : '') + (body.value === 'moon' ? ' Hypothetical Maxwellian lunar surface, not an observed lunar atmospheric model.' : ' Earth temperature and reference altitude are illustrative; no atmospheric collision profile is calculated.');

        });
      },
    },
    // ───────────────────────────────────────────────────────────── 3.10
    {
      num: '3.10',
      kind: 'Phenomenon',
      name: 'Poynting–Robertson drag',
      statement: String.raw`A dust grain orbiting the Sun absorbs sunlight and re-emits it isotropically in its own frame. In the Sun's frame the grain's motion tilts the absorbed radiation momentum, so the radiation force has a small component against the velocity:
$$\begin{gathered}\mathbf F_\mathrm{rad} =\\ \beta\,\frac{GMm}{r^2}\left[\Big(1 - \frac{\dot r}{c}\Big)\hat{\mathbf r} - \frac{\mathbf v}{c}\right],\\ \beta = \frac{3L_\odot Q_\mathrm{pr}}{16\pi G M_\odot c\,\rho s}\end{gathered}$$
($s$ grain radius, $\rho$ density, $Q_\mathrm{pr}$ the radiation-pressure efficiency, $\approx1$ for large grains). The radial part just weakens gravity by the factor $1-\beta$; the drag part removes angular momentum, so the grain spirals inward: for a circular orbit $dr/dt = -2\beta GM/(cr)$ and it reaches the Sun in $t_\mathrm{PR} = c\,r_0^2/(4\beta GM)$, proportional to the grain size and to $r_0^2$.`,
      idea: String.raw`To first order in $v/c$ the radiation is aberrated: seen from the Sun the light a moving grain absorbs comes from a direction tilted by $v/c$ (relativistic aberration, rel 2.10), and the radiation pressure (em 11.6) it exerts is not quite radial. The tangential piece $-\beta\,GMm\,v/(c\,r^2)$ is a drag. On a circular orbit the angular momentum is $h = \sqrt{GMr}$, so $\dot h = -\beta (GM)^{3/2}/(c\,r^{3/2})$ gives $\dot r = -2\beta GM/(cr)$ and integrates to $r^2 = r_0^2 - 4\beta GM\,t/c$. A grain launched from a circular parent orbit starts on an ellipse of eccentricity $e = \beta/(1-\beta)$, which the drag then circularises as it shrinks (orbit elements, 1.1).

For the circular-orbit approximation, separation of variables ode-1.3 integrates $\dot r=-C/r$ on $r>0$, with $C=2\beta GM/c$ fixed. It yields $r^2=r_0^2-2Ct$, hence the stated formal endpoint time. This is a solution only until that positive-radius branch ends; a real solar surface or a failure of the circular approximation can terminate the model earlier.`,
      caption: String.raw`Choose $\beta$ (small grains have large $\beta$). The simulation integrates the full force law with the speed of light set to $c = 20$ circular speeds (the real value, $\approx 10^4$ circular speeds at 1 AU, would make the spiral invisible); time is in orbital periods. Left: the spiral; middle: semi-major axis against time, with the analytic $a^2 = a_0^2 - 4\beta GM t/c$ dashed; right: the real inspiral time for the grain radius and density you pick, from the same law with the real $c$.`,
      scope: String.raw`Valid to first order in $v/c$, for a perfectly absorbing, isotropically re-emitting spherical grain (the constant $Q_\mathrm{pr}\approx1$ needs $s$ larger than the wavelength of sunlight, a few micrometres or more). The simulated $c$ is deliberately small; the analytic law for circular orbits neglects the small eccentricity corrections. Very small grains are blown out by radiation pressure instead ($\beta > 1/2$).`,
      deps: ['rel-2.10', 'astro-1.1', 'em-11.6', 'ode-1.3'],
      refs: ['Murray–Dermott §3.14'],
      tags: ['dust', 'radiation', 'orbits'],
      credit: 'Poynting, 1903; Robertson, 1937',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Poynting%E2%80%93Robertson_effect' },
      viz(v) {
        const CS = 20; // speed of light in the simulation, units of the parent's circular speed
        const bS = v.slider('$\\beta$ = radiation force / gravity', 0.005, 0.3, 0.05, { log: true, sig: 2, onChange: () => { if (S) S.reset(); } });
        const rho = v.select('grain density', [{ value: 1000, label: '1000 kg/m³ (ice-like)' }, { value: 2500, label: '2500 kg/m³ (silicate)' }, { value: 7800, label: '7800 kg/m³ (iron)' }], 2500);
        const r0S = v.slider('starting distance (AU)', 0.3, 10, 1, { log: true, sig: 2 });
        let S = null;
        const s = v.stage({ x: [-1.3, 1.3], y: [-1.3, 1.3], equal: true, axes: false, height: 340, weight: 1, title: 'grain orbit (full force law)' });
        const g = v.stage({ x: [0, 100], y: [0, 1.1], axes: 'box', gutter: true, height: 340, weight: 1, xlabel: 'time (orbits)', ylabel: 'semi-major axis $a$', title: 'inspiral' });
        const k = v.stage({ x: [1, 1000], xlog: true, y: [1e2, 1e9], ylog: true, axes: 'box', gutter: true, height: 340, weight: 1, xlabel: 'grain radius (μm)', ylabel: 'inspiral time (yr)', title: 'real timescale' });
        const init = () => { const b = bS.value; return { x: 1, y: 0, vx: 0, vy: 1, t: 0, n: 0, trail: [[1, 0]], aT: [[0, (1 - b) / (1 - 2 * b)]], b, done: false }; };
        S = v.sim(init, (st, dt) => {
          if (st.done) return;
          const b = st.b;
          const F = (X) => { // X = [x, y, vx, vy]
            const r2 = X[0] * X[0] + X[1] * X[1], r = Math.sqrt(r2), r3 = r2 * r, vr = (X[0] * X[2] + X[1] * X[3]) / r, f = b / r2;
            return [X[2], X[3], -X[0] / r3 + f * ((1 - vr / CS) * (X[0] / r) - X[2] / CS), -X[1] / r3 + f * ((1 - vr / CS) * (X[1] / r) - X[3] / CS)];
          };
          let X = [st.x, st.y, st.vx, st.vy];
          const r = Math.hypot(X[0], X[1]);
          if (r < 0.05 || r > 8) { st.done = true; return; }
          const nsub = Math.max(1, Math.ceil(dt / (0.02 * Math.min(1, r) ** 1.5))), h = dt / nsub;
          for (let i = 0; i < nsub; i++) {
            const k1 = F(X), k2 = F(X.map((q, j) => q + 0.5 * h * k1[j])), k3 = F(X.map((q, j) => q + 0.5 * h * k2[j])), k4 = F(X.map((q, j) => q + h * k3[j]));
            X = X.map((q, j) => q + (h / 6) * (k1[j] + 2 * k2[j] + 2 * k3[j] + k4[j]));
          }
          st.x = X[0]; st.y = X[1]; st.vx = X[2]; st.vy = X[3]; st.t += dt; st.n++;
          const last = st.trail[st.trail.length - 1];
          if (Math.hypot(st.x - last[0], st.y - last[1]) > 0.012) st.trail.push([st.x, st.y]);
          if (st.n % 8 === 0) { const rr = Math.hypot(st.x, st.y), v2 = st.vx * st.vx + st.vy * st.vy; st.aT.push([st.t / TAU, 1 / (2 / rr - v2 / (1 - b))]); }
        }, { dt: 0.05 });
        let cur = null;
        v.animate((t) => {
          const b = bS.value, a0 = (1 - b) / (1 - 2 * b), tFall = (CS * a0 * a0) / (4 * b) / TAU; // orbits
          S.advance(t * clamp(tFall / 18, 1.5, 40) * TAU);
          const st = S.state;
          const analytic = (to) => { const z = a0 * a0 - (4 * b * to * TAU) / CS; return z > 0 ? Math.sqrt(z) : 0; };
          s.circle(0, 0, 0.05, { fill: 'gold', fillAlpha: 0.6, color: 'gold' });
          s.circle(0, 0, 1, { color: 'faint', width: 1, dash: [2, 5] });
          s.path(st.trail, { color: 'accent', width: 1.2, alpha: 0.85 });
          s.dot(st.x, st.y, { r: 5, color: 'accent' });
          const ext = 1.15 * a0 * (1 + b / (1 - b));
          s.setView([-ext, ext], [-ext, ext]);
          const xmax = Math.max(10, Math.ceil((tFall * 1.1) / 10) * 10);
          g.setView([0, xmax], [0, a0 * 1.1]);
          g.fn(analytic, { color: 'green', width: 2, dash: [6, 4], n: 120 });
          g.path(st.aT, { color: 'accent', width: 2.2 });
          g.vline(tFall, { color: 'faint', width: 1, dash: [3, 4] });
          const rr = r0S.value, den = +rho.value;
          const tReal = (s_um) => { const sm = s_um * 1e-6, bb = (3 * L_SUN) / (16 * Math.PI * GM_SUN * C_LIGHT * den * sm); return (C_LIGHT * (rr * AU) ** 2) / (4 * bb * GM_SUN) / YEAR; };
          k.fn(tReal, { color: 'accent', width: 2.4, n: 100 });
          const sNow = (3 * L_SUN) / (16 * Math.PI * GM_SUN * C_LIGHT * den * b);
          k.dot(clamp(sNow * 1e6, 1, 1000), tReal(clamp(sNow * 1e6, 1, 1000)), { r: 6, color: 'gold' });
          cur = { b, sNow, tFall, tReal: tReal(sNow * 1e6), a0 };
        }, { period: 90, still: 9 });
        v.legend([['accent', 'simulation'], ['green', '$a^2 = a_0^2 - 4\\beta GM t/c$', { dash: true }], ['gold', 'now / your $\\beta$', { dot: true }]]);
        v.readout(() => {
          if (!cur) return '';
          return String.raw`$\beta = ${v.fix(cur.b, 3)}$ → grain radius $s = 3L_\odot/(16\pi GMc\rho\beta) = ${v.fix(cur.sNow * 1e6, 1)}\ \mu$m (with $Q_\mathrm{pr}=1$) · launched from a circular orbit: $a_0 = ${v.fix(cur.a0, 3)}$, $e = ${v.fix(cur.b / (1 - cur.b), 3)}$ · simulated fall time $c\,a_0^2/4\beta GM = ${v.fix(cur.tFall, 0)}$ orbits (at $c = 20$) · real inspiral time from $${v.fix(r0S.value, 2)}$ AU: $${fmtSci(v, cur.tReal, 2)}$ yr, i.e. $\approx ${v.fix(cur.tReal / 1e3, 1)}\times10^3$ yr for this grain; at 1 AU the law gives $t_\mathrm{PR}\approx 400/\beta$ yr`;
        });
      },
    },
  ],
};
