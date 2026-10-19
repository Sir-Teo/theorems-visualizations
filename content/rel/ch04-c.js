import {emissionLedger,comptonCollision,COMPTON_PM} from './rel-source-audit.js';
// Special & General Relativity — Chapter 4 (items 4.13–4.17): four-force, cyclotron, pair creation, and the papers of Einstein (1905) and Compton (1923)
import { gam, eng, ME, MP, U_MEV as U } from './ch04.shared.js';

export default {
  collection: 'rel',
  chapter: 4,
  items: [
    // ───────────────────────────────────────────────────────────── 4.13
    {
      num: '4.13',
      kind: 'Definition',
      name: 'Four-force and the relativistic second law',
      statement: String.raw`The **four-force** is $K^\mu=dp^\mu/d\tau=\gamma\,(\mathbf F\!\cdot\!\mathbf v/c,\ \mathbf F)$, where $\mathbf F=d\mathbf p/dt$ is the ordinary force and $\mathbf p=\gamma m\mathbf v$. The relativistic second law is $\mathbf F=d(\gamma m\mathbf v)/dt$, and its time component $dE/dt=\mathbf F\cdot\mathbf v$ is the work–energy theorem. Since $K\cdot u=0$ (the four-force is orthogonal to the four-velocity), the acceleration is in general not parallel to the force:
$$\mathbf a=\frac{1}{\gamma m}\Big(\mathbf F-\frac{(\mathbf F\cdot\mathbf v)\mathbf v}{c^2}\Big),$$
so $a_\parallel=F_\parallel/\gamma^3m$ and $a_\perp=F_\perp/\gamma m$. A constant force makes $\mathbf p$ grow linearly forever, while the speed saturates below $c$.`,
      idea: String.raw`Differentiating the invariant $p\cdot p=m^2c^2$ with respect to proper time gives $p\cdot K=0$, which is the statement $dE/dt=\mathbf F\cdot\mathbf v$. For the acceleration write $\mathbf F=d(\gamma m\mathbf v)/dt=\gamma m\,\mathbf a+m\mathbf v\,d\gamma/dt$ and use $d\gamma/dt=\gamma^3\mathbf v\cdot\mathbf a/c^2$; solving gives the formula above. Along the motion the factor $\gamma^3$ appears because $\gamma$ itself grows with speed (rel-3.5: the proper acceleration is $\gamma^3a$ there).`,
      caption: String.raw`A constant force $F$ (the green arrow, in units where $m=c=F=1$) pushes a particle that starts with speed $\beta_0$ along $+x$. **Set the force direction** relative to the motion and the **elapsed time**. Left: the trajectory (blue) against the Newtonian one with the same force (dashed). The orange arrow is the actual acceleration at the end: it is not parallel to the force except along or across the motion. Right: momentum grows without limit (orange), the speed levels off below $c$ (blue), whereas Newton's speed (dashed) crosses $c$.`,
      deps: ['rel-4.1', 'rel-3.5'],
      refs: ['Schutz ch. 2'],
      tags: ['four-force', 'second law', 'acceleration'],
      scope: String.raw`Point particle of constant rest mass, force defined as $d\mathbf p/dt$ in the observer's frame; the transformation of $\mathbf F$ between frames is not covered here.`,
      viz(v) {
        const bS = v.slider('initial speed $\\beta_0$ (along $+x$)', 0, 0.95, 0.6, { step: 0.01 });
        const aS = v.slider('force direction (degrees from $+x$)', 0, 180, 60, { step: 1 });
        const tS = v.slider('elapsed time $t$ (units $mc/F$)', 0.05, 6, 3, { step: 0.05 });
        const A = v.stage({ x: [-2, 10], y: [-1, 7], equal: true, axes: true, height: 380, minWidth: 300, title: 'trajectory in the lab, $x$ and $y$ in units $mc^2/F$' });
        const B = v.stage({ x: [0, 6], y: [0, 4], axes: 'box', gutter: true, height: 380, minWidth: 300, weight: 0.9, xlabel: 'time $t$ ($mc/F$)', ylabel: 'speed / momentum', title: 'momentum grows, speed saturates' });
        let st = {};
        v.render(() => {
          const b0 = bS.value, al = (aS.value * Math.PI) / 180, T = tS.value, N = 500;
          const Fx = Math.cos(al), Fy = Math.sin(al), g0 = gam(b0);
          const px0 = g0 * b0;
          const pts = [], pn = [];
          let x = 0, y = 0, px = px0, py = 0;
          const sp = (qx, qy) => { const e = Math.sqrt(1 + qx * qx + qy * qy); return [qx / e, qy / e]; };
          for (let i = 0; i <= N; i++) {
            const t = (T * i) / N;
            pts.push([x, y]); pn.push([b0 * t + 0.5 * Fx * t * t, 0.5 * Fy * t * t]);
            const [vx, vy] = sp(px, py), [wx, wy] = sp(px + (Fx * T) / N, py + (Fy * T) / N);
            x += ((vx + wx) / 2) * (T / N); y += ((vy + wy) / 2) * (T / N);
            px += (Fx * T) / N; py += (Fy * T) / N;
          }
          const xs = [...pts, ...pn].map((q) => q[0]), ys = [...pts, ...pn].map((q) => q[1]);
          const x0 = Math.min(-1, ...xs) - 1, x1 = Math.max(2, ...xs) + 1, y0 = Math.min(-1, ...ys) - 1, y1 = Math.max(2, ...ys) + 1;
          const w = Math.max(x1 - x0, (y1 - y0) * 1.1), h = w / 1.1;
          A.setView([x0, x0 + w], [(y0 + y1) / 2 - h / 2, (y0 + y1) / 2 + h / 2]);
          A.path(pn, { color: 'ink', width: 1.6, dash: [5, 4], alpha: 0.7 });
          A.path(pts, { color: 'accent', width: 3 });
          const [vx, vy] = sp(px, py), g = gam(Math.hypot(vx, vy)), vF = vx * Fx + vy * Fy;
          const ax = (Fx - vF * vx) / g, ay = (Fy - vF * vy) / g, sc = 0.12 * w;
          A.dot(x, y, { r: 5, color: 'accent' });
          A.arrow(x, y, x + sc * Fx, y + sc * Fy, { color: 'green', width: 2.6 }); A.arrow(x, y, x + sc * ax, y + sc * ay, { color: 'orange', width: 2.6 });
          A.arrow(x, y, x + sc * 0.6 * vx / Math.hypot(vx, vy || 1e-9) * 1, y + sc * 0.6 * vy / Math.hypot(vx, vy || 1e-9), { color: 'faint', width: 1.5 });
          // right
          B.hline(1, { color: 'gold', dash: [5, 4], width: 1.3 });
          const rows = (f) => { const a = []; for (let i = 0; i <= 120; i++) { const t = (6 * i) / 120; a.push([t, f(t)]); } return a; };
          B.path(rows((t) => { const qx = px0 + Fx * t, qy = Fy * t; return Math.hypot(qx, qy); }), { color: 'orange', width: 2.4 });
          B.path(rows((t) => { const qx = px0 + Fx * t, qy = Fy * t; return Math.hypot(qx, qy) / Math.sqrt(1 + qx * qx + qy * qy); }), { color: 'accent', width: 2.6 });
          B.path(rows((t) => Math.hypot(b0 + Fx * t, Fy * t)), { color: 'ink', width: 1.5, dash: [5, 4] });
          B.vline(T, { color: 'faint', width: 1 });
          const spd = Math.hypot(vx, vy);
          B.dot(T, spd, { r: 5, color: 'accent' });
          const ex = Math.hypot(px, py);
          st = { spd, g, ax, ay, Fx, Fy, K0: g * (Fx * vx + Fy * vy), px, py, ex };
        });
        v.legend([['accent', 'trajectory / speed'], ['ink', 'Newtonian (same force)', { dash: true }], ['orange', 'acceleration (left) / $|p|$ (right)'], ['green', 'force $F$']]);
        v.readout(() => {
          const { spd, g, ax, ay, Fx, Fy, K0, px, py, ex } = st; if (g === undefined) return '';
          const a = Math.hypot(ax, ay), ang = Math.abs(Math.atan2(Fx * ay - Fy * ax, Fx * ax + Fy * ay)) * 180 / Math.PI;
          return String.raw`Now: $\beta=${v.fix(spd, 4)}$, $\gamma=${v.fix(g, 3)}$, $|p|=${v.fix(ex, 3)}\,mc$. Four-force $K^\mu=\gamma(\mathbf F\!\cdot\!\mathbf v,\mathbf F)=(${v.fix(K0, 3)},\,${v.fix(g * Fx, 3)},\,${v.fix(g * Fy, 3)})$.` + '\n' +
            String.raw`Acceleration $|\mathbf a|=${v.fix(a, 3)}\,F/m$ (Newton: 1), pointing ${v.fix(ang, 1)}° away from the force. Work–energy: $dE/dt=\mathbf F\cdot\mathbf v=${v.fix(Fx * px / Math.sqrt(1 + px * px + py * py) + Fy * py / Math.sqrt(1 + px * px + py * py), 4)}$.`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 4.14
    {
      num: '4.14',
      kind: 'Model',
      name: 'Relativistic cyclotron motion',
      credit: 'E. O. Lawrence and M. S. Livingston, 1932 (Phys. Rev. 40, 19)',
      statement: String.raw`A particle of charge $q$ and momentum $p$ perpendicular to a uniform magnetic field $B$ moves on a circle of radius $r=p/qB$ with angular frequency
$$\omega=\frac{qB}{\gamma m},$$
and the magnetic force does no work, so $\gamma$ is constant on the circle. As the particle gains energy the radius grows with $p$ and the revolution frequency **falls** as $1/\gamma$. A cyclotron whose accelerating voltage alternates at the fixed frequency $qB/m$ therefore loses synchronism as $\gamma$ rises: the particle arrives at each gap later and later, and when its phase lag passes $90^\circ$ it is decelerated instead. The cure is to lower the drive frequency as $1/\gamma$ (synchrocyclotron) or to raise $B$ with radius (isochronous cyclotron, synchrotron).`,
      idea: String.raw`With the force $q\mathbf v\times\mathbf B$ always perpendicular to $\mathbf v$, $\gamma$ is constant and the relativistic second law (rel-4.13) reads $\gamma m\,\dot{\mathbf v}=q\mathbf v\times\mathbf B$: circular motion at the Larmor frequency reduced by $\gamma$. The Newtonian cyclotron (mech-1.18) has $\omega=qB/m$, independent of energy, which is what makes a fixed-frequency machine possible; the factor $\gamma$ spoils it. Each half-turn the phase against the drive slips by $\pi(\gamma-1)$.`,
      caption: String.raw`A proton in a 1.5 T field crosses a gap voltage $V$ twice per turn, beginning at the peak of the drive. **Choose the gap voltage** and switch between a **fixed** drive frequency and an ideally **tracking** one. Left: the orbit spirals out (radius in cm); with fixed frequency it turns round and spirals back in after the phase slips by $90^\circ$. Right: the kinetic energy against the number of gap crossings: linear for the tracking machine, while the fixed one peaks (at about 10 MeV for 200 kV) and then falls back.`,
      deps: ['rel-4.13', 'mech-1.18'],
      refs: ['Taylor–Wheeler ch. 8'],
      tags: ['cyclotron', 'accelerator', 'magnetic field'],
      scope: String.raw`Idealized: a point-like gap crossed with energy gain $eV\cos\psi$, no vertical focusing or phase-stability dynamics, and a simple model of the frequency drive; the numbers are illustrative.`,
      viz(v) {
        const VS = v.slider('gap voltage $V$ (kV)', 20, 2000, 200, { log: true, sig: 3 });
        const mode = v.select('drive', [{ value: 'fixed', label: 'fixed $\\omega=qB/m$' }, { value: 'track', label: 'tracks $1/\\gamma$' }], 'fixed');
        const B0 = 1.5, mc2 = MP; // tesla; MeV
        const A = v.stage({ x: [-40, 40], y: [-40, 40], equal: true, axes: true, height: 400, minWidth: 300, title: 'orbit in the dees (lengths in cm)' });
        const C = v.stage({ x: [0, 100], y: [0, 40], axes: 'box', gutter: true, height: 400, minWidth: 300, weight: 1.1, xlabel: 'gap crossings', ylabel: 'kinetic energy (MeV)', title: 'energy gain' });
        const rOf = (T) => Math.sqrt(T * (T + 2 * mc2)) / (299.792458 * B0) * 100; // cm
        const sim = (Vk, track, N) => {
          const eV = Vk / 1000; // MeV
          let T = 0.01, psi = 0; const Ts = [T], rs = [rOf(T)], ps = [0];
          for (let k = 1; k <= N; k++) {
            T = Math.max(0.001, T + eV * (track ? 1 : Math.cos(psi))); Ts.push(T); rs.push(rOf(T));
            psi += track ? 0 : Math.PI * (1 + T / mc2 - 1); ps.push(psi);
          }
          return { Ts, rs, ps };
        };
        let st = {};
        v.render(() => {
          const Vk = VS.value, eV = Vk / 1000, kc = Math.sqrt(mc2 / eV);
          const N = Math.max(30, Math.min(2500, Math.ceil(2.4 * kc)));
          const fx = sim(Vk, false, N), tk = sim(Vk, true, N), cur = mode.value === 'fixed' ? fx : tk;
          const Tmax = Math.max(...cur.Ts, ...tk.Ts.slice(0, Math.ceil(N * 0.0 + 1))) * 1.05;
          const Cy = Math.max(2, Math.max(...fx.Ts, tk.Ts[N]) * 1.08);
          C.setView([0, N], [0, Cy]);
          C.path(tk.Ts.map((t, k) => [k, t]), { color: 'green', width: 2.4 }); C.path(fx.Ts.map((t, k) => [k, t]), { color: 'accent', width: 2.4 });
          C.vline(kc, { color: 'faint', dash: [4, 4], width: 1 });
          // orbit spiral for current mode (all half-turns)
          const rmax = Math.max(...cur.rs) * 1.1;
          A.setView([-rmax, rmax], [-rmax * 1.1, rmax * 1.1]);
          let y = 0; const pts = [];
          for (let k = 0; k < cur.rs.length; k++) {
            const r = cur.rs[k], even = k % 2 === 0;
            for (let j = 0; j <= 20; j++) { const t = (Math.PI * j) / 20; pts.push(even ? [r * Math.sin(t), y - r + r * Math.cos(t)] : [-r * Math.sin(t), y + r - r * Math.cos(t)]); }
            y += even ? -2 * r : 2 * r;
          }
          A.vband(-0.15 * rmax / 20, 0.15 * rmax / 20, { color: 'gold', alpha: 0.35 });
          A.path(pts, { color: mode.value === 'fixed' ? 'accent' : 'green', width: 1.6 });
          const imax = cur.Ts.indexOf(Math.max(...cur.Ts));
          const Tm = Math.max(...fx.Ts);
          st = { eV, kc, N, Tm, kTm: fx.Ts.indexOf(Tm), Tf: fx.Ts[N], Tt: tk.Ts[N], g: 1 + cur.Ts[N] / mc2, rr: cur.rs[N] };
        });
        v.legend([['accent', 'fixed drive frequency'], ['green', 'frequency follows $qB/\\gamma m$'], ['gold', 'gap']]);
        v.readout(() => {
          const { eV, kc, N, Tm, kTm, Tf, Tt } = st; if (!eV) return '';
          return String.raw`$eV=${v.fix(eV * 1000, 0)}$ keV per crossing. Fixed frequency: the energy peaks at $T=${v.fix(Tm, 1)}$ MeV after ${kTm} crossings (phase slip $\psi=\pi/2$ at $\sqrt{mc^2/eV}\approx${v.fix(kc, 0)}$ crossings), then falls; a tracking drive reaches ${v.fix(Tt, 1)} MeV after ${N}.` + '\n' +
            String.raw`At $T=${v.fix(Tm, 1)}$ MeV, $\gamma=${v.fix(1 + Tm / mc2, 4)}$, the revolution frequency is already ${v.fix(100 * (1 - 1 / (1 + Tm / mc2)), 2)}% below the Newtonian $qB/2\pi m$.`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 4.15
    {
      num: '4.15',
      kind: 'Phenomenon',
      name: 'Pair creation and annihilation',
      credit: 'Dirac, 1928–1931 (prediction); C. D. Anderson, 1932 (positron); G. Breit and J. A. Wheeler, 1934 (γγ → e⁺e⁻)',
      statement: String.raw`A photon (or several) can convert into an electron–positron pair, and a pair can annihilate into photons, if four-momentum is conserved. The reaction $\gamma\gamma\to e^+e^-$ is allowed only when the invariant mass satisfies $s=2E_1E_2(1-\cos\theta)\ge(2m_ec^2)^2$ ($\theta$ the angle between the photon momenta), i.e. $E_1E_2\ge(m_ec^2)^2$ for head-on photons. A **lone** photon in empty space can never convert: its invariant mass is zero. A photon near a heavy nucleus of mass $M$ can, because the nucleus takes up momentum, once $E_\gamma\ge2m_ec^2(1+m_e/M)$. At rest, $e^+e^-$ annihilate into two photons of $511$ keV each, back to back.`,
      idea: String.raw`Apply the threshold theorem (rel-4.10) with final-state mass $2m_e$. The initial invariant mass of two photons is $s=(k_1+k_2)^2=2k_1\cdot k_2$ since $k_i^2=0$ (rel-4.6), which depends on the opening angle. A single photon has $k^2=0<(2m_ec)^2$ in all frames, so a lone photon cannot decay; adding a nucleus supplies $s=M^2+2ME_\gamma$, raising the invariant mass at the cost of a small recoil.`,
      caption: String.raw`Choose the **process**. For $\gamma\gamma$: set the two photon energies (log sliders) and the **angle** between them. The left panel plots the invariant mass $\sqrt s$ against the first photon's energy against the threshold $2m_ec^2$ (gold); the right panel is the $(E_1,E_2)$ map, with the threshold boundary for the chosen angle and for head-on photons. The buttons set up TeV gamma rays on starlight or on the cosmic microwave background. For a nucleus, only the photon energy matters; for a lone photon, nothing is ever enough.`,
      deps: ['rel-4.10', 'rel-4.6'],
      refs: ['Taylor–Wheeler §8.5', 'Taylor–Wheeler §8.7'],
      tags: ['pair production', 'antimatter', 'threshold'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Pair_production' },
      scope: String.raw`Kinematics only: this says what is allowed, not how likely; the cross-section (Breit–Wheeler) peaks a little above threshold.`,
      viz(v) {
        const proc = v.select('process', [{ value: 'gg', label: '$\\gamma\\gamma\\to e^+e^-$' }, { value: 'gN', label: '$\\gamma+$nucleus' }, { value: 'g', label: 'lone photon' }], 'gg');
        const E1S = v.slider('photon energy $E_1$ (eV)', 1e-4, 1e15, 3e12, { log: true, sig: 2, fmt: (x) => eng(x / 1e6, 2) });
        const E2S = v.slider('photon energy $E_2$ (eV)', 1e-4, 1e15, 2, { log: true, sig: 2, fmt: (x) => eng(x / 1e6, 2) });
        const thS = v.slider('angle between photons (°)', 1, 180, 180, { step: 1 });
        v.button('TeV γ + starlight (2 eV)', () => { E1S.set(5e11); E2S.set(2); thS.set(180); proc.set('gg', { fire: true }); });
        v.button('γ + CMB (6×10⁻⁴ eV)', () => { E1S.set(1e15); E2S.set(6.3e-4); thS.set(180); proc.set('gg', { fire: true }); });
        const m = ME * 1e6; // eV
        const Mn = MP * 1e6;
        const A = v.stage({ x: [1e-4, 1e15], y: [1e3, 1e16], axes: 'box', gutter: true, height: 380, minWidth: 300, xlog: true, ylog: true, xlabel: 'photon energy $E_1$ (eV)', ylabel: '$\\sqrt s$ (eV)', title: 'invariant mass available' });
        const B = v.stage({ x: [1e-4, 1e15], y: [1e-4, 1e15], axes: 'box', gutter: true, height: 380, minWidth: 300, xlog: true, ylog: true, xlabel: '$E_1$ (eV)', ylabel: '$E_2$ (eV)', title: 'where pairs can appear' });
        const sg = (E1, E2, th) => Math.sqrt(Math.max(1e-30, 2 * E1 * E2 * (1 - Math.cos(th))));
        let st = {};
        const sync = () => { const gg = proc.value === 'gg'; E2S.el.hidden = !gg; thS.el.hidden = !gg; B.el.style.display = gg ? '' : 'none'; };
        proc.onChange = sync; sync();
        v.render(() => {
          sync();
          const E1 = E1S.value, E2 = E2S.value, th = (thS.value * Math.PI) / 180, p = proc.value;
          let rt;
          A.hline(2 * m, { color: 'gold', width: 2, dash: [5, 4] });
          if (p === 'gg') {
            A.fn((x) => sg(x, E2, th), { color: 'accent', width: 2.6, n: 200 }); A.fn((x) => sg(x, E2, Math.PI), { color: 'muted', width: 1.2, dash: true, n: 200 });
            rt = sg(E1, E2, th); A.dot(E1, rt, { r: 6, color: rt >= 2 * m ? 'green' : 'red' });
            B.fn((x) => (2 * m * m) / (x * (1 - Math.cos(th)) || 1e-30), { color: 'accent', width: 2.4, n: 200 }); B.fn((x) => (m * m) / x, { color: 'muted', width: 1.2, dash: true, n: 200 });
            B.dot(E1, E2, { r: 6, color: rt >= 2 * m ? 'green' : 'red' });
            B.vline(5e11, { color: 'faint', width: 1, dash: [3, 3] });
          } else if (p === 'gN') {
            A.fn((x) => Math.sqrt(Mn * Mn + 2 * Mn * x) - Mn + 1e-3, { color: 'accent', width: 2.6, n: 200 });
            rt = Math.sqrt(Mn * Mn + 2 * Mn * E1) - Mn; A.dot(E1, Math.max(rt, 1e-3), { r: 6, color: rt >= 2 * m ? 'green' : 'red' });
          } else { rt = 0; A.text('$\\sqrt s=0$ for any energy (below the plot)', 1e7, 2.5e3, { color: 'red' }); A.dot(E1, 1.1e3, { r: 6, color: 'red' }); }
          const ok = p === 'g' ? false : rt >= 2 * m - 1e-9;
          let s = null;
          if (p === 'gg') { const Et = E1 + E2, P2 = E1 * E1 + E2 * E2 + 2 * E1 * E2 * Math.cos(th); s = { Et, Pm: Math.sqrt(P2), bcm: Math.sqrt(P2) / Et, beta: ok ? Math.sqrt(Math.max(0, 1 - (4 * m * m) / (rt * rt))) : 0 }; }
          st = { p, E1, E2, rt, ok, s, Eth: p === 'gN' ? 2 * m * (1 + m / Mn) : (m * m * 2) / (E2 * (1 - Math.cos(th))) };
        });
        v.legend([['accent', '$\\sqrt s$ (or excess over $M$)'], ['gold', 'threshold $2m_ec^2$ (dashed)'], ['muted', 'head-on photons', { dash: true }]]);
        v.readout(() => {
          const { p, E1, rt, ok, s, Eth } = st; if (!p) return '';
          const e = (x) => eng(x / 1e6);
          if (p === 'g') return String.raw`A lone photon: $s=(k)^2=0$ in every frame, so it cannot become a pair (needs $\sqrt s\ge2m_ec^2=${e(2 * m)}$). It needs a nucleus or a second photon.`;
          if (p === 'gN') return `Photon on a proton at rest: ${ok ? 'allowed' : 'forbidden'}. Energy available √s − M = ${e(rt)} against 2mc² = ${e(2 * m)}; the threshold photon energy 2mc²(1 + m/M) is just above that, ${eng(Eth / 1e6, 5)}.`;
          return `E₁ = ${e(E1)}, E₂ = ${e(st.E2)}: √s = ${e(rt)}. Pair creation is ${ok ? 'allowed' : 'forbidden'} (threshold 2mc² = ${e(2 * m)}).` + '\n' +
            (ok ? `In the CM frame each lepton has speed ${v.fix(s.beta, 5)} c; the CM moves at ${v.fix(s.bcm, 7)} c in this frame.` : `At this angle and E₂ the threshold would be reached for E₁ ≥ ${e(Eth)}.`);
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 4.16
    {
      num: '4.16',
      kind: 'Paper',
      name: 'Ist die Trägheit eines Körpers von seinem Energieinhalt abhängig?',
      paper: { authors: 'A. Einstein', year: 1905, title: 'Ist die Trägheit eines Körpers von seinem Energieinhalt abhängig?', venue: 'Annalen der Physik 323 (13): 639–641', doi: '10.1002/andp.19053231314' },
      introduces: ['rel-4.4'],
      verify: false,
      statement: String.raw`Einstein's three-page 1905 note considers a resting body emitting equal plane light pulses $L/2$ in opposite directions. Rest-frame energy conservation gives $E_0-E_1=L$; in a moving frame, transformation of light energy gives $H_0-H_1=\gamma L$. Subtracting the two balances, and identifying each $H-E$ with kinetic energy plus the same additive constant, yields
$$K_0-K_1=(\gamma-1)L\simeq\frac12\frac{L}{c^2}v^2.$$
Comparison with the low-speed kinetic-energy change identifies an inertial-mass decrease $\Delta m=L/c^2$. The paper generalizes the connection between mass and energy content and suggests highly variable-energy substances, such as radium salts, as possible tests.`,
      idea: String.raw`The argument compares energy conservation in two frames; it does not begin by assuming the body's total energy is $\gamma mc^2$. The light pulses have total energy $L$ in the body's rest frame and $\gamma L$ in the other frame, independent of their angle. Their difference requires a kinetic-energy decrease $(\gamma-1)L$. At low speed this is $\tfrac12(L/c^2)v^2$, identifying the change of inertial mass. The paper's notation uses $V$ for light speed, and states a mass change rather than the modern equation $E=mc^2$. This entry makes no claim of exclusive historical priority.`,
      caption: String.raw`The two equal rest-frame pulses acquire different energies and aberrated directions in the frame where the body moves right. **Change speed, pulse angle and emitted-energy fraction.** The ledger compares the kinetic-energy decrease required by the two energy balances with the prediction if the mass changes by $L/c^2$. Toggle **unchanged inertial mass** to set the predicted kinetic-energy change to zero. Rest energy still falls by $L$ in that counterfactual; the mismatch is $(\gamma-1)L$, not $\gamma L$. The lower panel shows the mass fraction implied by the modern relation. These figures reconstruct the argument; the original has no figure.`,
      deps: ['rel-2.1', 'rel-2.9', 'em-11.5', 'rel-1.14'],
      refs: ['Einstein, Annalen der Physik (series4)18 [overall323] (1905),639–641: light-energy transformation p.639, two balances p.640, kinetic-energy difference and low-speed mass change p.641; DOI10.1002/andp.19053231314'],
      tags: ['mass–energy', 'Einstein', 'thought experiment'],
      credit: 'Einstein, 1905; received 27 September',
      links: { doi: 'https://doi.org/10.1002/andp.19053231314', 'Full original German scan': 'https://zenodo.org/records/1424057/files/article.pdf?download=1', 'Full translation': 'https://www.fourmilab.ch/etexts/einstein/E_mc2/www/' },
      scope: String.raw`Original German pp.639–641 were read in full and checked against the Perrett–Jeffery translation. The final inertial-mass comparison is a low-speed argument; the exact difference of frame energies precedes it. The displayed body has positive remaining rest mass: $0<L/Mc^2\le0.9$. Pulse arrow length is proportional to energy in units of $L$, with an expanding moving-frame window. The bottom panel is modern mass-fraction bookkeeping, not reaction-yield data or an original figure.`,
      viz(v) {
        const bS=v.slider('speed of the moving frame $\\beta$',0,.95,.6,{step:.01}),fS=v.slider('emission angle $\\varphi$ (degrees)',0,90,40,{step:1}),LS=v.slider('emitted energy $L/Mc^2$',1e-10,.9,.1,{log:true,sig:2});
        const un=v.toggle('unchanged inertial mass',false);
        const A=v.stage({x:[-2.2,2.2],y:[-2,2],equal:true,axes:false,height:300,minWidth:220,title:'rest frame of the body'}),B=v.stage({x:[-2.2,2.2],y:[-2,2],equal:true,axes:false,height:300,minWidth:220,title:'frame where the body moves right'});
        const C=v.stage({x:[0,5],y:[0,3],axes:'box',gutter:true,height:300,minWidth:260,xticks:[[.8,'required ΔK'],[2.2,'mass model'],[3.6,'mismatch']],ylabel:'kinetic-energy decrease / L',title:'difference between the two energy balances'});
        const D=v.stage({x:[1e-10,1],y:[0,1],xlog:true,axes:'box',gutter:true,height:230,full:true,xlabel:'emitted energy fraction L / Mc²',ylabel:'mass decrease Δm / M',title:'modern mass-fraction bookkeeping'});
        let st={};
        v.render(()=>{
          const M=emissionLedger(bS.value,fS.value,un.value),ph=fS.value*Math.PI/180,c=Math.cos(ph),s=Math.sin(ph),R=Math.max(2.2,.35+1.3*Math.max(M.E1,M.E2)+.45);B.setView([-R,R],[-R,R]);
          for(const S of[A,B])S.circle(0,0,.35,{fill:'accent',fillAlpha:.4,color:'accent'});
          for(const sg of[-1,1]){A.arrow(.35*sg*c,.35*sg*s,1.25*sg*c,1.25*sg*s,{color:'gold',width:3});A.text('L/2',sg*c,sg*s,{color:'gold',dy:-12*sg});}
          for(const[E,d,dy]of[[M.E1,M.d1,-12],[M.E2,M.d2,12]]){B.arrow(.35*d[0],.35*d[1],(.35+1.3*E)*d[0],(.35+1.3*E)*d[1],{color:'gold',width:3});B.text(`${v.fix(E,2)} L`,(.55+.55*E)*d[0],(.55+.55*E)*d[1],{color:'gold',dy});}
          B.arrow(-.8*R,-.8*R,-.8*R+.8*bS.value+.15,-.8*R,{color:'accent',width:2});B.text(`v = ${v.fix(bS.value,2)} c`,-.8*R,-.65*R,{color:'accent',size:11});
          C.setView([0,5],[0,Math.max(1,1.25*M.required)]);
          for(const[x,y,col]of[[.8,M.required,'gold'],[2.2,M.predicted,'blue'],[3.6,M.difference,M.difference>1e-12?'red':'green']])C.rect(x-.4,0,x+.4,y,{color:col,fill:col,fillAlpha:.5});
          D.fn(x=>un.value?0:x,{domain:[1e-10,1],color:'blue',width:2.4,n:400});D.dot(LS.value,un.value?0:LS.value,{r:6,color:'gold'});D.vline(LS.value,{color:'gold',dash:true});
          st={...M,b:bS.value,angle:fS.value,L:LS.value,constantMass:un.value,R,massFraction:un.value?0:LS.value};
        });
        v.legend([['gold','required kinetic-energy decrease'],['blue','inertial-mass model'],['red','unbalanced kinetic energy']]);
        v.readout(()=>`The moving-frame pulses carry $${v.fix(st.E1,3)}L+${v.fix(st.E2,3)}L=\\gamma L$. Subtracting the rest-frame loss $L$ requires $\\Delta K=(\\gamma-1)L=${v.fix(st.required,4)}L$. The mass model gives $${v.fix(st.predicted,4)}L$, leaving mismatch $${v.fix(st.difference,4)}L$.\nLow-speed comparison: $(\\gamma-1)=${v.fix(st.required,5)}$ versus $\\beta^2/2=${v.fix(st.lowSpeed,5)}$. At $\\beta=0$ both vanish; a nonzero small speed identifies $\\Delta m=L/c^2$. The selected emitted fraction is $${v.sci(st.L,2)}$, with assumed mass decrease $\\Delta m/M=${v.sci(st.massFraction,2)}$.`);
      },
    },
    // ───────────────────────────────────────────────────────────── 4.17
    {

      num: '4.17',
      kind: 'Paper',
      name: 'Quantum Theory of the Scattering of X-rays by Light Elements',
      paper: { authors: 'Arthur H. Compton', year: 1923, title: 'A Quantum Theory of the Scattering of X-rays by Light Elements', venue: 'Physical Review 21 (5): 483–502', doi: '10.1103/PhysRev.21.483' },
      introduces: ['rel-4.9'],
      verify: false,
      statement: String.raw`Compton's May 1923 paper treats scattering as a collision between a light quantum and an initially resting, effectively free electron. Conservation of relativistic energy and momentum gives
$$\lambda'-\lambda=\frac{2h}{mc}\sin^2\frac\theta2=\frac{h}{mc}(1-\cos\theta).$$
His Eq. 31 uses $2h/mc=0.0484$ Å. In Fig. 4 and the discussion pp. 494–495, he compares incident Mo radiation with graphite scattering at 90°: the reported characteristic wavelength changes from 0.708 Å to 0.730 Å, a shift 0.022 Å, compared with the theoretical ≈0.024 Å. The paper also compares angular shifts for gamma rays; its wavelength formula assumes electron binding can be neglected.`,
      idea: String.raw`The outgoing photon has energy $hc/\lambda'$ and a changed momentum direction. The electron receives the momentum difference and its relativistic recoil kinetic energy. Eliminating that recoil from the two conservation equations produces the wavelength shift. This connects a directed light-quantum momentum to a measured spectral displacement. The paper separately proposes an approximate intensity formula; the visualization uses no such intensity prediction and does not substitute it for a later quantum-electrodynamic cross section.`,
      caption: String.raw`**Change the scattering angle**, or select 45°,90°,135°. The left panel overlays separately scaled **incident reference** (blue) and **scattered-model** (orange) Gaussian curves at the predicted wavelengths. The incident wavelength 70.8 pm is the rounded value quoted in the paper; curve widths and heights are illustrative. This compares two spectra, not two asserted components of one measured scattered spectrum. The right panel shows free-electron recoil energy. Toggle the idealized Thomson limit to show an unchanged wavelength and neglect recoil energy.`,
      deps: ['qm-1.3', 'rel-4.3', 'rel-4.6', 'qm-1.15'],
      refs: ['Compton, A Quantum Theory of the Scattering of X-rays by Light Elements, Physical Review21 (1923),483–502; Eqs.1–5 pp.486–487, Eq. 31 p.494, Fig. 4 and quoted wavelengths p.495, Table I p.496, binding limitations p.502; DOI10.1103/PhysRev.21.483', 'NIST CODATA 2022 wall chart: electron Compton wavelength2.42631023538(76)pm; BIPM exact SI h,c,e for energy conversion'],
      tags: ['Compton', 'photon', 'X-rays'],
      credit: 'Arthur H. Compton, Physical Review21 (1923),483–502',
      links: { doi: 'https://doi.org/10.1103/PhysRev.21.483', 'Full original paper': 'https://journals.aps.org/pr/pdf/10.1103/PhysRev.21.483', 'CODATA 2022 constants': 'https://physics.nist.gov/cuu/pdf/wall_2022.pdf' },
      scope: String.raw`Original 20-page paper was read in full. Its Fig. 4 compares primary and scattered spectra at 90°; this entry does not attribute the familiar later two-component scattered spectrum or a whole-atom recoil explanation to that figure. The 45°/90°/135° choices are model angles, also present in the paper's gamma-ray table, not three claimed Mo spectra. Photon energy and recoil use modern constants; the historical0.0484Å coefficient is identified separately. Gaussian heights/widths are assumed and each curve is drawn separately; they are not a fitted total spectrum. One ångström is 100 pm.`,
      viz(v) {
        const lam0=70.8,thS=v.slider('scattering angle $\\theta$ (degrees)',0,180,90,{step:1});for(const a of[45,90,135])v.button(a+'°',()=>thS.set(a));const cl=v.toggle('idealized Thomson limit (neglect recoil)',false);
        const A=v.stage({x:[66,79],y:[0,1.3],axes:'box',gutter:true,height:360,minWidth:300,xlabel:'wavelength (pm)',ylabel:'profiles (separate arbitrary units)',title:'incident reference and scattered model (schematic)'}),B=v.stage({x:[0,180],y:[0,1.4],axes:'box',gutter:true,height:360,minWidth:300,xlabel:'scattering angle θ (degrees)',ylabel:'electron recoil energy (keV)',title:'collision-model recoil'});
        let st={};const gauss=(x,mu,s)=>Math.exp(-.5*((x-mu)/s)**2);
        v.render(()=>{
          const C=comptonCollision(thS.value,lam0,cl.value);
          A.fn(x=>gauss(x,lam0,.35),{color:'accent',dash:true,width:2.1,n:400});A.fn(x=>.8*gauss(x,C.lambda,.5),{color:'orange',width:2.6,n:400});A.dot(lam0,1,{r:4,color:'accent',label:'incident reference',labelPos:'w'});A.dot(C.lambda,.8,{r:4,color:'orange',label:'scattered model',labelPos:'e'});A.measure(lam0,1.14,C.lambda,1.14,`Δλ = ${v.fix(C.shift,2)} pm`);
          B.fn(a=>comptonCollision(a,lam0,cl.value).T,{domain:[0,180],color:'green',width:2.6});B.dot(thS.value,C.T,{r:6,color:'orange'});B.hline(0,{color:'faint'});
          st={...C,angle:thS.value,classical:cl.value,lam0};
        });
        v.legend([['accent','incident reference (separate spectrum)'],['orange','scattered model'],['green','electron recoil energy']]);
        v.readout(()=>`$\\theta=${v.fix(st.angle,0)}^\\circ$: predicted scattered wavelength $${v.fix(st.lambda,3)}$ pm from $\\lambda_0=${v.fix(lam0,1)}$ pm (${v.fix(st.E0,3)} keV). Shift $\\Delta\\lambda=${v.fix(st.shift,3)}$ pm $=${v.fix(st.angstrom,5)}$ Å; recoil energy $${v.fix(st.T*1000,1)}$ eV.${st.classical?' Idealized Thomson limit: wavelength unchanged and recoil neglected.':' Free-electron quantum collision.'}\nThe original Eq. 31 uses $2h/mc=0.0484$ Å; CODATA 2022 gives $2\\lambda_C=${v.fix(2*COMPTON_PM/100,6)}$ Å. At90° the original reports a 0.022 Å shift, compared with its ≈0.024 Å prediction.`);
      },
    },
  ],
};
