// Special & General Relativity — Chapter 4 (items 4.7–4.12): invariant mass, decays, Compton scattering, thresholds, binding energy, rocket
import { gam, boostEp, pStar, eng, ME, MP, MN, MMU, MPI, MK, U_MEV, NUCL, M_H1, M_NEUT } from './ch04.shared.js';

export default {
  collection: 'rel',
  chapter: 4,
  items: [
    // ───────────────────────────────────────────────────────────── 4.7
    {
      num: '4.7',
      kind: 'Definition',
      name: 'Invariant mass and the centre-of-momentum frame',
      statement: String.raw`For a system of particles with total four-momentum $P^\mu=\sum_ip_i^\mu=(E_{\text{tot}}/c,\mathbf P)$, the **invariant mass** is $M$ defined by $M^2c^4=E_{\text{tot}}^2-|\mathbf P|^2c^2$. It is the same in every inertial frame and is **not** the sum of the particles' masses. If $P^\mu$ is timelike there is a unique frame, the **centre-of-momentum (CM) frame**, moving with velocity $\mathbf V=\mathbf Pc^2/E_{\text{tot}}$, in which $\mathbf P=0$ and $E_{\text{tot}}=Mc^2$. For a single particle $M$ is its rest mass; for a decay's products $M$ is the mass of the parent.`,
      idea: String.raw`$P^\mu$ is a sum of four-vectors, hence a four-vector, and its Minkowski length (rel-4.1) is a Lorentz scalar. A timelike four-vector can always be boosted to point along the time axis, exactly as one boosts a single massive particle to its rest frame; the required boost has the velocity $\mathbf Pc^2/E_{\text{tot}}$ of the $\mathbf P/E$ ratio of rel-4.2. So the products of any reaction have a well-defined total mass, whatever the lab frame.`,
      caption: String.raw`Three particles (pion masses, momenta drawn at random; **Resample** gives a new spray) are shown in the lab frame, where the parent flies along $+x$. The chain of arrows adds the momenta; the gold arrow is the total $\mathbf P$. **Slide the observer frame** and watch the individual momenta, $\sum E$ and $\mathbf P$ change while $M=\sqrt{E^2-P^2}$ does not. The right plot shows $\sum E$ and $|\mathbf P|$ against the frame; $\sum E$ is smallest, and equal to $M$, exactly in the CM frame (button).`,
      deps: ['rel-4.3', 'rel-4.2'],
      refs: ['Taylor–Wheeler §8.3'],
      tags: ['invariant mass', 'centre of momentum', 'decay'],
      viz(v) {
        const mp = 0.1396, bL = 0.5;
        let seed = 7, parts = [];
        const gen = () => {
          const r = v.rng(seed++), q = [];
          const a = [r.uniform(0.15, 0.45), r.uniform(0, 6.28)], b = [r.uniform(0.15, 0.45), r.uniform(0, 6.28)];
          const p1 = [a[0] * Math.cos(a[1]), a[0] * Math.sin(a[1])], p2 = [b[0] * Math.cos(b[1]), b[0] * Math.sin(b[1])], p3 = [-p1[0] - p2[0], -p1[1] - p2[1]];
          parts = [p1, p2, p3].map((p) => { const E = Math.sqrt(mp * mp + p[0] * p[0] + p[1] * p[1]); const [E2, px2] = boostEp(E, p[0], -bL); return [E2, px2, p[1]]; });
        };
        gen();
        const fS = v.slider('observer frame $\\beta_o$', -0.8, 0.9, 0, { step: 0.005 });
        let bcm = 0;
        v.button('Resample', () => gen());
        v.button('go to CM frame', () => fS.set(bcm));
        const A = v.stage({ x: [-0.5, 1.5], y: [-0.8, 0.8], equal: true, axes: true, height: 380, minWidth: 300, title: 'momenta $(p_x, p_y)$ in GeV/$c$, added head to tail' });
        const B = v.stage({ x: [-0.8, 0.9], y: [0, 3], axes: 'box', gutter: true, height: 380, minWidth: 300, weight: 0.9, xlabel: 'observer frame $\\beta_o$', ylabel: 'GeV', title: 'what the frame changes, and what it does not' });
        let st = {};
        const cols = ['blue', 'orange', 'teal'];
        v.render(() => {
          const bo = fS.value;
          const tot0 = parts.reduce((s, q) => [s[0] + q[0], s[1] + q[1], s[2] + q[2]], [0, 0, 0]);
          bcm = tot0[1] / tot0[0];
          const M = Math.sqrt(tot0[0] ** 2 - tot0[1] ** 2 - tot0[2] ** 2);
          const q = parts.map((p) => { const [E, px] = boostEp(p[0], p[1], bo); return [E, px, p[2]]; });
          let x = 0, y = 0;
          q.forEach((p, i) => { A.arrow(x, y, x + p[1], y + p[2], { color: cols[i], width: 2.6 }); x += p[1]; y += p[2]; });
          A.arrow(0, 0, x, y, { color: 'gold', width: 3.4 });
          A.dot(0, 0, { r: 3.5, color: 'ink' });
          const Et = q.reduce((s, p) => s + p[0], 0), Pt = Math.hypot(x, y);
          B.hline(M, { color: 'green', width: 2, dash: [5, 4] });
          B.fn((b) => { const g = gam(b); return g * (tot0[0] - b * tot0[1]); }, { color: 'accent', width: 2.6 });
          B.fn((b) => Math.abs(gam(b) * (tot0[1] - b * tot0[0])), { color: 'orange', width: 2.6 });
          B.vline(bo, { color: 'gold', width: 1.2 }); B.dot(bo, Et, { r: 5, color: 'accent' }); B.dot(bo, Pt, { r: 5, color: 'orange' });
          B.vline(bcm, { color: 'green', width: 1, dash: [3, 3] });
          st = { Et, Pt, M, bcm, bo, sumM: 3 * mp };
        });
        v.legend([['accent', '$\\sum E$'], ['orange', '$|\\mathbf P|$'], ['green', 'invariant mass $M$'], ['gold', 'total $\\mathbf P$ (left)']]);
        v.readout(() => {
          const { Et, Pt, M, bcm, bo, sumM } = st; if (Et === undefined) return '';
          return String.raw`Frame $\beta_o=${v.fix(bo, 3)}$: $\sum E=${v.fix(Et, 4)}$ GeV, $|\mathbf P|=${v.fix(Pt, 4)}$ GeV/$c$, so $M=\sqrt{E^2-P^2}=${v.fix(Math.sqrt(Math.max(0, Et * Et - Pt * Pt)), 4)}$ GeV.` + '\n' +
            String.raw`The three pions alone have $\sum m=${v.fix(sumM, 4)}$ GeV, less than $M=${v.fix(M, 4)}$ GeV; the CM frame is at $\beta_o=${v.fix(bcm, 3)}$ (the parent's own speed).`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 4.8
    {
      num: '4.8',
      kind: 'Model',
      name: 'Two-body decay kinematics',
      statement: String.raw`A particle of mass $M$ at rest decays into two particles of masses $m_1,m_2$. Conservation of four-momentum fixes everything except direction: the products have equal and opposite momenta of magnitude
$$p^*=\frac{c}{2M}\sqrt{\big[M^2-(m_1+m_2)^2\big]\big[M^2-(m_1-m_2)^2\big]},\qquad E_1^*=\frac{M^2+m_1^2-m_2^2}{2M}c^2 ,$$
and $E_2^*=Mc^2-E_1^*$. If the parent moves with speed $\beta c$, the lab energy of product 1 is $E_1=\gamma(E_1^*+\beta p^*c\cos\theta^*)$, with $\theta^*$ the emission angle in the rest frame. For an unpolarized (isotropic) decay $\cos\theta^*$ is uniform, so the lab energy is uniformly distributed between $\gamma(E_1^*\mp\beta p^*c)$, a flat box.`,
      idea: String.raw`In the parent's rest frame $P^\mu=(Mc,\mathbf 0)$. Write $p_2=P-p_1$ and square it, using $p_2^2=m_2^2c^2$ and $P\cdot p_1=MEc^{-1}\!E_1^*$; that gives $E_1^*$ directly (rel-4.7), and $p^*$ follows from rel-4.2. The Lorentz boost (rel-2.1) gives the lab energy, linear in $\cos\theta^*$; a uniform $\cos\theta^*$ then has a uniform image.`,
      caption: String.raw`**Choose the decay** ($\pi^+\to\mu^+\nu$ or $K^+\to\mu^+\nu$; the neutrino mass is neglected) and the pion's **Lorentz factor**. Left: the muon momentum in the parent's rest frame is a circle of radius $p^*$ (grey); in the lab it becomes an ellipse. **Drag the handle** around the circle to choose the emission angle. Right: the lab muon energies of 4000 isotropic decays fill the flat box predicted by the formula (green).`,
      deps: ['rel-4.7'],
      refs: ['Taylor–Wheeler ch. 8'],
      tags: ['decay', 'kinematics', 'pion'],
      scope: String.raw`Spin-0 parent (isotropic emission in its rest frame) and a massless neutrino; masses from the Particle Data Group (π⁺ 139.57039 MeV, K⁺ 493.677 MeV, μ⁺ 105.6583755 MeV).`,
      viz(v) {
        const dec = v.select('decay', [{ value: 'pi', label: '$\\pi^+\\to\\mu^+\\nu$' }, { value: 'k', label: '$K^+\\to\\mu^+\\nu$' }], 'pi');
        const gS = v.slider('parent Lorentz factor $\\gamma$', 1, 60, 4, { log: true, sig: 3 });
        const A = v.stage({ x: [-500, 500], y: [-300, 300], equal: true, axes: true, height: 380, minWidth: 300, title: 'muon momentum $(p_x, p_y)$ in MeV/$c$' });
        const B = v.stage({ x: [0, 100], y: [0, 1], axes: 'box', gutter: true, height: 380, minWidth: 300, weight: 1.1, xlabel: 'lab muon energy $E_\\mu$ (MeV)', ylabel: 'probability density', title: '4000 isotropic decays, boosted' });
        const H = A.handle(14, 26, { color: 'gold', label: 'θ*', labelPos: 'ne', constrain: (x, y) => { const r = Math.hypot(x, y) || 1; return [x / r * ps(), y / r * ps()]; } });
        const ps = () => { const M = dec.value === 'pi' ? MPI : MK; return pStar(M, MMU, 0); };
        let st = {};
        const NS = 4000;
        v.render(() => {
          const M = dec.value === 'pi' ? MPI : MK, p = pStar(M, MMU, 0), Es = Math.sqrt(MMU * MMU + p * p);
          const g = gS.value, b = Math.sqrt(1 - 1 / (g * g));
          if (Math.hypot(H.x, H.y) < 1e-9 || Math.abs(Math.hypot(H.x, H.y) - p) > 0.5) { const th = Math.atan2(H.y, H.x); H.set(p * Math.cos(th), p * Math.sin(th)); }
          const R = g * (Es + b * p) * 1.1;
          const Lx = Math.max(R, 1.1 * g * (p + b * Es)) + 10;
          A.setView([-Lx * 0.35, Lx], [-Lx * 0.55, Lx * 0.55]);
          A.curve((t) => [p * Math.cos(t), p * Math.sin(t)], 0, 6.2832, { color: 'muted', width: 1.4 });
          A.curve((t) => [g * (p * Math.cos(t) + b * Es), p * Math.sin(t)], 0, 6.2832, { color: 'accent', width: 2.6 });
          const th = Math.atan2(H.y, H.x), lx = g * (p * Math.cos(th) + b * Es), ly = p * Math.sin(th);
          A.arrow(0, 0, p * Math.cos(th), p * Math.sin(th), { color: 'gold', width: 2 }); A.arrow(0, 0, lx, ly, { color: 'accent', width: 3 });
          A.dot(g * b * Es, 0, { r: 3.5, color: 'ink' });
          const Emin = g * (Es - b * p), Emax = g * (Es + b * p);
          const vals = []; for (let i = 0; i < NS; i++) { const c = -1 + (2 * (i + 0.5)) / NS; vals.push(g * (Es + b * p * c)); }
          const pad = Math.max(1e-6, (Emax - Emin) * 0.1);
          B.setView([Math.max(0, Emin - pad), Emax + pad], [0, 1.5 / Math.max(Emax - Emin, 1e-6)]);
          B.hist(vals, { bins: 40, range: [Emin, Emax], density: true, color: 'accent', fillAlpha: 0.3 });
          B.rect(Emin, 0, Emax, 1 / Math.max(Emax - Emin, 1e-9), { color: 'green', stroke: true, fill: false, width: 2 });
          const Eth = g * (Es + b * p * Math.cos(th));
          B.vline(Eth, { color: 'gold', width: 1.4 });
          st = { M, p, Es, g, b, Emin, Emax, Eth, th };
        });
        v.legend([['muted', 'rest-frame circle (radius $p^*$)'], ['accent', 'lab ellipse / histogram'], ['green', 'predicted flat box'], ['gold', 'chosen decay']]);
        v.readout(() => {
          const { M, p, Es, g, b, Emin, Emax, Eth, th } = st; if (!p) return '';
          return String.raw`Rest frame: $p^*=${v.fix(p, 3)}$ MeV/$c$, $E^*_\mu=${v.fix(Es, 3)}$ MeV (kinetic ${v.fix(Es - MMU, 3)} MeV), the same in every decay.` + '\n' +
            String.raw`Lab ($\gamma=${v.fix(g, 2)}$, $\beta=${v.fix(b, 4)}$): $E_\mu\in[${v.fix(Emin, 2)},\,${v.fix(Emax, 2)}]$ MeV, flat. Chosen angle $\theta^*=${v.fix(th * 180 / Math.PI, 0)}^\circ$ gives $E_\mu=${v.fix(Eth, 2)}$ MeV.`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 4.9
    {
      num: '4.9',
      kind: 'Phenomenon',
      name: 'Compton scattering',
      credit: 'A. H. Compton, 1922–1923',
      statement: String.raw`A photon of wavelength $\lambda$ scatters from a free electron at rest through an angle $\theta$. Conservation of four-momentum alone gives the scattered wavelength
$$\lambda'-\lambda=\frac{h}{m_ec}\,(1-\cos\theta)=2\lambda_C\sin^2\frac\theta2 ,\qquad \lambda_C=\frac{h}{m_ec}\approx2.4263\ \text{pm},$$
independent of $\lambda$, with maximum shift $2\lambda_C$ at backscatter. The electron recoils with kinetic energy $hc/\lambda-hc/\lambda'$ at an angle $\varphi$ given by $\cot\varphi=(1+\varepsilon)\tan(\theta/2)$ where $\varepsilon=h\nu/m_ec^2$. The classical (Thomson) picture predicts no shift.`,
      idea: String.raw`Put the photon's four-momentum $k=(h/\lambda)(1,\hat{\mathbf n})$ and the electron's $(m_ec,\mathbf 0)$ into conservation (rel-4.3): $k+p=k'+p'$. Isolate $p'=k+p-k'$ and square it, using $p'^2=m_e^2c^2$ and $k^2=k'^2=0$ for massless quanta (rel-4.6): the result is $p\cdot(k-k')=k\cdot k'$, which reads $m_ec\,(h/\lambda-h/\lambda')=(h/\lambda)(h/\lambda')(1-\cos\theta)$. Dividing by $h^2/\lambda\lambda'$ gives the shift. No wave theory and no force law is used.`,
      caption: String.raw`**Drag the scattered-photon handle** in the left panel (momentum in units of $m_ec$): the triangle $\mathbf k=\mathbf k'+\mathbf q$ closes by itself with the electron's recoil $\mathbf q$. Change the **incident wavelength**: the right panel plots the shift $\Delta\lambda(\theta)$, which does not depend on it, but the *relative* shift $\Delta\lambda/\lambda$ in the readout does: a few percent for a 71 pm X-ray at 90°, and a few parts in $10^{6}$ for visible light, which is why the effect is only seen with X-rays and gamma rays. The readout checks energy conservation with the recoil electron's exact relativistic energy.`,
      deps: ['rel-4.3', 'rel-4.6'],
      refs: ['Taylor–Wheeler ch. 8'],
      tags: ['Compton effect', 'photon', 'scattering'],
      scope: String.raw`Free, initially stationary electron (valid when the photon energy greatly exceeds the electron's binding energy); no spin or polarization effects in the shift, which is purely kinematic.`,
      viz(v) {
        const lamC = 2.42631023867;
        const lS = v.slider('incident wavelength $\\lambda$ (pm)', 0.1, 1e4, 71.07, { log: true, sig: 3 });
        const A = v.stage({ x: [-0.6, 1.6], y: [-1, 1], equal: true, axes: false, height: 380, minWidth: 300, title: "momenta in units of the incident photon's: $\\mathbf k=\\mathbf k'+\\mathbf q$" });
        const B = v.stage({ x: [0, 180], y: [0, 5.2], axes: 'box', gutter: true, height: 380, minWidth: 300, weight: 1, xlabel: 'scattering angle $\\theta$ (degrees)', ylabel: '$\\lambda\'-\\lambda$ (pm)', title: 'wavelength shift' });
        const rr = (th) => 1 / (1 + (lamC / lS.value) * (1 - Math.cos(th)));
        const H = A.handle(rr(1.2) * Math.cos(1.2), rr(1.2) * Math.sin(1.2), { color: 'orange', label: "k'", labelPos: 'ne', constrain: (x, y) => { const th = Math.max(0.02, Math.min(Math.PI - 0.02, Math.atan2(Math.abs(y), x))); return [rr(th) * Math.cos(th), rr(th) * Math.sin(th)]; } });
        let st = {};
        v.render(() => {
          const lam = lS.value, eps = lamC / lam;
          const th = Math.max(0.02, Math.min(Math.PI - 0.02, Math.atan2(Math.abs(H.y), H.x)));
          const r = 1 / (1 + eps * (1 - Math.cos(th))); H.set(r * Math.cos(th), r * Math.sin(th));
          const kx = r * Math.cos(th), ky = r * Math.sin(th);
          A.curve((t) => { const q = 1 / (1 + eps * (1 - Math.cos(t))); return [q * Math.cos(t), q * Math.sin(t)]; }, 0, Math.PI, { color: 'faint', width: 1.4 });
          A.curve((t) => { const q = 1 / (1 + eps * (1 - Math.cos(t))); return [q * Math.cos(t), -q * Math.sin(t)]; }, 0, Math.PI, { color: 'faint', width: 1.4 });
          A.arrow(0, 0, 1, 0, { color: 'accent', width: 3 }); A.arrow(0, 0, kx, ky, { color: 'orange', width: 3 }); A.arrow(kx, ky, 1, 0, { color: 'green', width: 3 });
          A.dot(0, 0, { r: 4, color: 'ink' });
          A.text('$\\mathbf k$', 0.5, 0, { color: 'accent', dy: 14 }); A.text("$\\mathbf k'$", kx / 2, ky / 2, { color: 'orange', dx: -14, dy: -4 }); A.text('$\\mathbf q$', (1 + kx) / 2, ky / 2, { color: 'green', dx: 14, dy: -4 });
          A.text('$\\theta$', 0.2, 0.06 + ky * 0.1, { color: 'muted', size: 14 });
          const d = lamC * (1 - Math.cos(th));
          B.fn((t) => lamC * (1 - Math.cos(t * Math.PI / 180)), { color: 'accent', width: 2.6 });
          B.hline(2 * lamC, { color: 'muted', dash: [4, 4], width: 1 }); B.hline(lamC, { color: 'faint', dash: [3, 3], width: 1 });
          B.dot(th * 180 / Math.PI, d, { r: 6, color: 'orange' });
          const lam2 = lam + d;
          // exact energy conservation in units of m_e c^2
          const E0 = eps, E1 = lamC / lam2, qx = 1 * eps - E1 * Math.cos(th), qy = -E1 * Math.sin(th);
          const Ee = Math.sqrt(1 + qx * qx + qy * qy), resid = E0 + 1 - E1 - Ee, phi = Math.atan2(-qy, qx);
          st = { lam, lam2, d, th, eps, T: (E0 - E1) * ME, resid, phi };
        });
        v.legend([['accent', 'incident photon $\\mathbf k$'], ['orange', 'scattered photon $\\mathbf k\'$'], ['green', 'electron recoil $\\mathbf q$'], ['faint', 'possible $\\mathbf k\'$ (all angles)']]);
        v.readout(() => {
          const { lam, lam2, d, th, eps, T, resid, phi } = st; if (!lam) return '';
          return String.raw`$\lambda=${v.fix(lam, lam < 10 ? 3 : 2)}$ pm (photon energy ${eng(eps * ME)}), $\theta=${v.fix(th * 180 / Math.PI, 1)}^\circ$: $\lambda'=${v.fix(lam2, 3)}$ pm, shift $${v.fix(d, 4)}$ pm $=${v.fix(100 * d / lam, 3)}\%$ of $\lambda$.` + '\n' +
            String.raw`Recoil electron: kinetic energy ${eng(T)} at $\varphi=${v.fix(phi * 180 / Math.PI, 1)}^\circ$. Energy balance $E_0+m_ec^2-E'-E_e=${v.sci(Math.abs(resid) + 1e-16, 2)}$ (zero up to rounding).`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 4.10
    {
      num: '4.10',
      kind: 'Theorem',
      name: 'Threshold energy for particle production',
      statement: String.raw`A reaction $a+b\to$ (final state of total rest mass $M_f$) is possible only if the invariant mass of the initial state satisfies $s=(p_a+p_b)^2c^2\ge M_f^2c^4$, with equality (the **threshold**) when all products are at rest in the CM frame. For a beam particle of energy $E$ on a **fixed target** of mass $m$ at rest, $s=m_a^2c^4+m^2c^4+2mc^2E$; for **two colliding beams** of equal mass $m$, equal energy $E$ and opposite momenta, $s=4E^2$. To create extra mass $X$ in $pp\to pp\,X$, the needed beam kinetic energy is
$$T_{\text{fixed}}=2Xc^2+\frac{X^2c^2}{2m},\qquad T_{\text{collider}}=\frac{Xc^2}2\ \text{(per beam)} .$$`,
      idea: String.raw`The invariant mass of rel-4.7 is the same in every frame, and it cannot decrease below $M_f$ in the final state, since at best the products are at rest in the CM frame where $E_{\text{tot}}=M_fc^2$ (rel-4.3). In the lab of a fixed target most of the beam energy is locked in the motion of the final CM, which must carry the total momentum, so the threshold grows like $X^2$; in a collider the CM is at rest and all the energy is available, so it grows like $X$.`,
      caption: String.raw`**Choose the mass $X$ to be created** (slider, or one of the buttons: neutral pion, a proton–antiproton pair, the $Z$ boson, the Higgs boson; this is only the kinematic threshold, not the cross-section). The left plot is log–log: the fixed-target beam energy bends upward into a parabola ($\propto X^2$) while the collider's per-beam energy stays linear. The right plot shows the fraction of the beam kinetic energy that goes into new mass: 100% for a collider, falling as $1/(2+X/2m)$ for a fixed target.`,
      deps: ['rel-4.7'],
      refs: ['Taylor–Wheeler ch. 8'],
      tags: ['threshold', 'collider', 'antiproton'],
      credit: 'Antiproton threshold exploited at the Bevatron; observed by Chamberlain, Segrè, Wiegand & Ypsilantis, 1955',
      viz(v) {
        const xS = v.slider('created mass $X$ (GeV/$c^2$)', 0.1, 300, 1.876, { log: true, sig: 3 });
        const m = MP / 1000;
        for (const [lab, x] of [['π⁰ (0.135)', 0.13498], ['p p̄ pair (1.876)', 2 * m], ['Z (91.19)', 91.1876], ['Higgs (≈125)', 125.2]]) v.button(lab, () => xS.set(x));
        const A = v.stage({ x: [0.1, 300], y: [0.03, 1e5], axes: 'box', gutter: true, height: 380, minWidth: 300, xlog: true, ylog: true, xlabel: 'created mass $X c^2$ (GeV)', ylabel: 'beam kinetic energy (GeV)', title: 'beam energy needed' });
        const B = v.stage({ x: [0.1, 300], y: [0, 1.05], axes: 'box', gutter: true, height: 380, minWidth: 300, xlog: true, weight: 0.9, xlabel: 'created mass $X c^2$ (GeV)', ylabel: 'fraction of beam energy that becomes mass', title: 'efficiency' });
        const Tf = (X) => 2 * X + X * X / (2 * m), Tc = (X) => X / 2;
        let st = {};
        v.render(() => {
          const X = xS.value;
          A.fn((x) => Tf(x), { color: 'red', width: 2.6, n: 200 }); A.fn((x) => Tc(x), { color: 'green', width: 2.6, n: 200 });
          A.fn((x) => x * x / (2 * m), { color: 'faint', width: 1, dash: true, n: 100 });
          A.vline(X, { color: 'gold', width: 1.2 }); A.dot(X, Tf(X), { r: 5.5, color: 'red' }); A.dot(X, Tc(X), { r: 5.5, color: 'green' });
          B.fn((x) => x / Tf(x), { color: 'red', width: 2.6, n: 200 }); B.hline(1, { color: 'green', width: 2.6 });
          B.vline(X, { color: 'gold', width: 1.2 }); B.dot(X, X / Tf(X), { r: 5.5, color: 'red' });
          st = { X, tf: Tf(X), tc: Tc(X) };
        });
        v.legend([['red', 'fixed target (beam on a proton at rest)'], ['green', 'collider (each beam)'], ['faint', '$X^2/2m$ asymptote', { dash: true }]]);
        v.readout(() => {
          const { X, tf, tc } = st; if (!X) return '';
          return String.raw`To create $X=${v.fix(X, 3)}$ GeV: fixed target needs beam $T=${v.fix(tf, 3)}$ GeV ($=${v.fix(tf / m, 1)}\,m_pc^2$); a collider needs only $${v.fix(tc, 3)}$ GeV per beam (${v.fix(2 * tc, 3)} GeV total).` + '\n' +
            String.raw`The fixed-target machine is ${v.fix(tf / (2 * tc), 1)} times as demanding. For $p\bar p$ production ($X=2m_p$) the threshold is $T=6m_pc^2=${v.fix(6 * m, 3)}$ GeV.`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 4.11
    {
      num: '4.11',
      kind: 'Phenomenon',
      name: 'Mass defect and nuclear binding energy',
      statement: String.raw`A bound nucleus of $Z$ protons and $N$ neutrons has rest mass **less** than the sum of its parts; the **mass defect** $\Delta m=Zm_p+Nm_n-m_{\text{nucleus}}$ gives the **binding energy** $B=\Delta m\,c^2$, the work needed to take it apart. The binding energy per nucleon $B/A$ rises steeply to about $8$ MeV by $A\approx 20$, peaks near $8.8$ MeV around iron and nickel (it is largest for $^{62}$Ni), and declines slowly to $7.6$ MeV for uranium. Hence fusing light nuclei or splitting very heavy ones releases the difference $Q=\sum m_{\text{in}}c^2-\sum m_{\text{out}}c^2$.`,
      idea: String.raw`By mass–energy equivalence (rel-4.4), the energy $B$ that was released when the nucleus formed left with the products' kinetic energy and radiation, and the system's rest mass fell by $B/c^2$. The strong force attracts nucleons at short range, so $B/A$ grows with $A$ until each nucleon has all the neighbours it can reach; then the long-range Coulomb repulsion of the protons, growing like $Z^2$, bends the curve down. The peak is where the two effects balance, so reactions that move nuclei toward it release energy.`,
      caption: String.raw`The dots are measured binding energies per nucleon from the 2020 Atomic Mass Evaluation (a selection of 39 nuclides). **Click a dot (or use the buttons) to choose a nucleus**; the right panel shows the mass per nucleon of the free hydrogen-atom/neutron mix against the bound nucleus, the gap being the mass defect. Choose a **reaction** to see $Q$ computed from the atomic masses: ringed dots are the nuclei involved.`,
      deps: ['rel-4.4'],
      refs: ['Taylor–Wheeler §8.7'],
      tags: ['binding energy', 'nuclear', 'fission'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Nuclear_binding_energy', data: 'https://www-nds.iaea.org/amdc/' },
      scope: String.raw`Data: AME2020 (Wang et al., Chinese Physics C 45, 030003, 2021); masses are of neutral atoms, so the electron masses cancel in the defect when hydrogen atoms replace protons.`,
      viz(v) {
        const R = [
          { id: 'dt', lab: 'D+T→⁴He+n (fusion)', ins: [2014101.777844, 3016049.28132], outs: [4002603.25413, M_NEUT], hi: [[2, 1], [3, 1], [4, 2]] },
          { id: 'h4', lab: '4 ¹H→⁴He (net)', ins: [4 * M_H1], outs: [4002603.25413], hi: [[4, 2]] },
          { id: 'u', lab: 'n+²³⁵U→¹⁴¹Ba+⁹²Kr+3n (fission)', ins: [M_NEUT, 235043928.117], outs: [140914403.653, 91926173.092, 3 * M_NEUT], hi: [[235, 92], [141, 56], [92, 36]] },
        ];
        const rS = v.select('reaction', R.map((r) => ({ value: r.id, label: r.lab })), 'dt');
        let sel = NUCL.findIndex((n) => n[0] === 'Fe' && n[1] === 56);
        const A = v.stage({ x: [0, 250], y: [0, 9.6], axes: 'box', gutter: true, height: 380, minWidth: 320, xlabel: 'mass number $A$', ylabel: '$B/A$ (MeV per nucleon)', title: 'binding energy per nucleon (AME2020)' });
        const B = v.stage({ x: [0, 3], y: [925, 940], axes: 'box', gutter: true, height: 380, minWidth: 260, weight: 0.7, xticks: [[0.75, 'free'], [2.25, 'bound']], ylabel: 'mass per nucleon, MeV/$c^2$ (axis cut at 925)', title: 'the mass defect' });
        const mu = (x) => x * U_MEV * 1e-6;
        const sorted = NUCL.map((n, i) => i).sort((a, b) => NUCL[a][1] - NUCL[b][1]);
        A.onClick((x, y) => { let bi = 0, bd = 1e9; NUCL.forEach((n, i) => { const d = Math.hypot((n[1] - x) / 250 * 8, (n[3] / 1000 - y) / 9.6 * 5); if (d < bd) { bd = d; bi = i; } }); sel = bi; v.invalidate(); });
        v.button('◀', () => { const k = sorted.indexOf(sel); sel = sorted[(k + sorted.length - 1) % sorted.length]; });
        v.button('▶', () => { const k = sorted.indexOf(sel); sel = sorted[(k + 1) % sorted.length]; });
        let st = {};
        v.render(() => {
          const rx = R.find((r) => r.id === rS.value);
                    for (const [i, n] of NUCL.entries()) A.dot(n[1], n[3] / 1000, { r: 4.2, color: i === sel ? 'red' : 'accent' });
          for (const [a, z] of rx.hi) { const n = NUCL.find((q) => q[1] === a && q[2] === z); if (n) A.dot(n[1], n[3] / 1000, { r: 9, hollow: true, color: 'green' }); }
          if (rx.id === 'h4') A.dot(1, 0, { r: 9, hollow: true, color: 'green' });
          const n = NUCL[sel], Z = n[2], Nn = n[1] - n[2], Mat = n[4];
          A.text(`${n[1]}${n[0]}`, n[1], n[3] / 1000, { color: 'red', dy: -14, size: 13 });
          const free = (Z * M_H1 + Nn * M_NEUT), defect = free - Mat, Bcalc = mu(defect) * 1, perFree = mu(free) / n[1], perBound = mu(Mat) / n[1];
          B.rect(0.25, 925, 1.25, perFree, { fill: 'orange', fillAlpha: 0.5, color: 'orange' }); B.rect(1.75, 925, 2.75, perBound, { fill: 'blue', fillAlpha: 0.5, color: 'blue' });
          B.hline(perFree, { color: 'orange', dash: [4, 4], width: 1 });
          B.measure(2.9, perBound, 2.9, perFree, '');
          const Q = (rx.ins.reduce((s, x) => s + x, 0) - rx.outs.reduce((s, x) => s + x, 0)) * U_MEV * 1e-6;
          st = { n, Z, Nn, Bcalc, perFree, perBound, Q, rx, defectu: defect / 1e6 };
        });
        v.legend([['accent', 'measured $B/A$'], ['red', 'selected nucleus'], ['green', 'nuclei in the reaction']]);
        v.readout(() => {
          const { n, Z, Nn, Bcalc, perFree, perBound, Q, rx, defectu } = st; if (!n) return '';
          return String.raw`$^{${n[1]}}$${n[0]} ($Z=${Z}$, $N=${Nn}$): $\Delta m=${v.fix(defectu, 6)}$ u $\Rightarrow B=${v.fix(Bcalc, 2)}$ MeV, i.e. $B/A=${v.fix(Bcalc / n[1], 3)}$ MeV (table: ${v.fix(n[3] / 1000, 3)}); ${v.fix(100 * Bcalc / (n[1] * perFree), 2)}% of the mass has vanished into binding.` + '\n' +
            String.raw`Reaction ${rx.lab}: $Q=\sum m_{\text{in}}c^2-\sum m_{\text{out}}c^2=${v.fix(Q, 2)}$ MeV, from the atomic masses.`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 4.12
    {
      num: '4.12',
      kind: 'Model',
      name: 'Relativistic rocket equation',
      statement: String.raw`A rocket whose exhaust leaves with constant speed $u$ **relative to the rocket**, and whose rest mass falls from $m_0$ to $m$, ends (starting from rest) with rapidity $\eta=(u/c)\ln(m_0/m)$, i.e. with speed
$$\frac vc=\tanh\!\Big(\frac uc\ln\frac{m_0}{m}\Big)$$
in the launch frame. In the limit $u\ll c$ this is Tsiolkovsky's $v=u\ln(m_0/m)$; for a photon rocket ($u=c$) it is $v/c=(R^2-1)/(R^2+1)$ with $R=m_0/m$. The mass ratio needed for a given final speed $\beta$ is $R=\big[(1+\beta)/(1-\beta)\big]^{c/2u}$, which grows exponentially with $c/u$.`,
      idea: String.raw`Momentum conservation in the rocket's instantaneous rest frame (rel-4.3) is the same as in Newtonian mechanics (mech-2.7): $m\,dv'=-u\,dm$, there. Velocities add as rapidities (rel-2.3), and the rapidity increment seen in that comoving frame is $d\eta=dv'/c$. So $d\eta=-(u/c)\,dm/m$ and integrating gives $\eta=(u/c)\ln(m_0/m)$. The speed is $c\tanh\eta$, always below $c$, instead of Newton's $u\ln R$, which does not stop at $c$.

For positive remaining mass, $1/m$ is continuous and its logarithmic antiderivative is supplied by pma 8.6. The fundamental theorem (pma 6.21) integrates the stated comoving momentum balance between the two positive endpoint masses. The logarithm product rule gives $\log m_0-\log m=\log(m_0/m)$, producing the rapidity. Exhaust speed is held constant in this calculation; it is not a proof of a variable-exhaust rocket law.`,
      caption: String.raw`**Set the exhaust speed** $u/c$ and the **mass ratio** $R=m_0/m$. Left: final speed against $\ln R$; the relativistic curve (blue) bends over to $c$ while the Newtonian one (dashed) crosses it. Right: the mass ratio needed to reach a chosen speed for several exhaust speeds ($u=c$ is the photon rocket); **drag the handle** to the target speed and read off how much of the launch mass must be fuel.`,
      deps: ['rel-4.3', 'rel-2.3', 'mech-2.7', 'pma-6.21', 'pma-8.6'],
      refs: ['Taylor–Wheeler ch. 8'],
      tags: ['rocket', 'rapidity', 'Tsiolkovsky'],
      scope: String.raw`Straight-line motion with constant exhaust speed relative to the rocket and no external force; $m$ is the rocket's rest mass including its remaining fuel.`,
      viz(v) {
        const uS = v.slider('exhaust speed $u/c$', 0.02, 1, 0.4, { step: 0.01 });
        const RS = v.slider('mass ratio $R=m_0/m$', 1, 1e4, 8, { log: true, sig: 3 });
        const A = v.stage({ x: [0, 9], y: [0, 1.6], axes: 'box', gutter: true, height: 380, minWidth: 300, xlabel: '$\\ln(m_0/m)$', ylabel: 'final speed $v/c$', title: 'speed of the rocket' });
        const B = v.stage({ x: [0, 0.999], y: [1, 1e6], axes: 'box', gutter: true, height: 380, minWidth: 300, ylog: true, xlabel: 'target speed $v/c$', ylabel: 'mass ratio $m_0/m$ needed', title: 'cost of speed' });
        const H = B.handle(0.9, 100, { color: 'gold', label: 'target', labelPos: 'ne', constrain: (x) => [Math.max(0.05, Math.min(0.995, x)), 1] });
        const need = (b, u) => Math.exp(Math.atanh(b) * 1 / u);
        let st = {};
        v.render(() => {
          const u = uS.value, R = RS.value, L = Math.log(R), bt = H.x;
          A.hline(1, { color: 'gold', width: 1.4, dash: [5, 4] });
          A.fn((x) => Math.tanh(u * x), { color: 'accent', width: 2.8 });
          A.fn((x) => u * x, { color: 'ink', width: 1.8, dash: true });
          A.vline(L, { color: 'faint', width: 1 }); A.dot(L, Math.tanh(u * L), { r: 6, color: 'accent' }); A.dot(L, u * L, { r: 4.5, color: 'ink' });
          for (const [uu, col] of [[0.1, 'muted'], [0.3, 'teal'], [0.5, 'purple'], [1, 'orange']]) B.fn((x) => need(x, uu), { color: col, width: 1.8, n: 200 });
          B.fn((x) => need(x, u), { color: 'accent', width: 3, n: 200 });
          H.set(bt, Math.max(1, Math.min(1e6, need(bt, u))));
          st = { u, R, L, vr: Math.tanh(u * L), vn: u * L, bt, need: need(bt, u) };
        });
        v.legend([['accent', 'relativistic'], ['ink', 'Newtonian $u\\ln R$', { dash: true }], ['orange', '$u=c$'], ['purple', '$u=0.5c$'], ['teal', '$u=0.3c$'], ['muted', '$u=0.1c$']]);
        v.readout(() => {
          const { u, R, L, vr, vn, bt, need } = st; if (!u) return '';
          return String.raw`$u=${v.fix(u, 2)}c$, $R=${v.fix(R, 2)}$ ($\ln R=${v.fix(L, 3)}$): relativistic $v=${v.fix(vr, 4)}c$ (rapidity ${v.fix(u * L, 3)}) vs Newtonian $${v.fix(vn, 4)}c$${vn >= 1 ? ' (exceeds $c$)' : ''}.` + '\n' +
            String.raw`To reach $v=${v.fix(bt, 3)}c$ with this exhaust takes $m_0/m=${need < 1e4 ? v.fix(need, 1) : v.sci(need, 3)}$, so ${v.fix(100 * (1 - 1 / need), need < 100 ? 1 : 3)}% of the launch mass must be fuel.`;
        });
      },
    },
  ],
};
