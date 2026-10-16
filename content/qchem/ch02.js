// Quantum Chemistry & Spectroscopy — Chapter 2: The hydrogen atom (items 2.1–2.5; 2.6–2.10 are in ch02-b.js)
import { TAU, RY_EV, A0_PM, Rnl, realY, REAL_NAMES, LETTER, orbTeX, phi0, sphereInt, lobes, zeros } from './ch02.shared.js';

// Balmer lines, wavelengths in air as tabulated in standard references (from memory, see the item's caption): Hα … ε
const BALMER_AIR = { 3: 656.279, 4: 486.135, 5: 434.047, 6: 410.173, 7: 397.007 };
const SERIES = { 1: 'Lyman', 2: 'Balmer', 3: 'Paschen', 4: 'Brackett' };
// Edlén (1966) refractive index of standard air, σ = 1/λ_vac in µm⁻¹
const nAir = (lamNm) => { const s2 = (1e3 / lamNm) ** 2; return 1 + 1e-8 * (8342.13 + 2406030 / (130 - s2) + 15997 / (38.9 - s2)); };

export default {
  collection: 'qchem',
  chapter: 2,
  title: 'The hydrogen atom',
  summary: String.raw`The one problem in chemistry solved exactly in three dimensions. Separating the Coulomb problem in spherical coordinates gives the quantum numbers $n$, $l$ and $m$, the familiar s, p and d orbital shapes, and the Rydberg formula for the hydrogen spectrum. Electron spin and its coupling to orbital motion complete the picture, split the levels into fine structure and Zeeman patterns, and prepare the many-electron atom.`,
  items: [
    // ------------------------------------------------------------------ 2.1
    {
      num: '2.1',
      kind: 'Model',
      name: 'Hydrogen atom: separation in spherical coordinates',
      credit: 'Schrödinger, 1926',
      statement: String.raw`An electron of charge $-e$ bound to a fixed nucleus of charge $+Ze$ has $\hat H=-\frac{\hbar^2}{2m}\nabla^2-\frac{Ze^2}{4\pi\varepsilon_0 r}$. Because the potential depends only on $r$, the stationary equation separates in spherical coordinates: with $\psi(r,\theta,\varphi)=R(r)\,Y(\theta,\varphi)$ the angular factor satisfies $\hat L^2Y=\hbar^2l(l+1)Y$ (the rigid-rotor problem of 1.9) and the radial factor $u=rR$ satisfies, in atomic units,
$$-\tfrac12u''+\Big[\frac{l(l+1)}{2r^2}-\frac Zr\Big]u=E\,u .$$
Normalizable solutions exist only for $E_n=-\dfrac{Z^2}{2n^2}$ hartree, with the quantum numbers
$$n=1,2,3,\dots,\qquad l=0,1,\dots,n-1,\qquad m=-l,\dots,l,$$
giving $\psi_{nlm}=R_{nl}(r)Y_l^m(\theta,\varphi)$ with $n-l-1$ radial and $l$ angular nodal surfaces.`,
      scope: String.raw`Non-relativistic, infinite nuclear mass, no spin; reduced mass (2.2), spin–orbit coupling (2.8) and fields (2.10) are corrections to this model.`,
      idea: String.raw`Writing $\nabla^2$ in spherical coordinates (mech-8.2, qm-8.3) separates the angle-dependent part into $-\hat L^2/\hbar^2r^2$, so the angular equation is exactly the one solved in 1.9 and $l(l+1)$ enters the radial equation only as a repulsive centrifugal term. The radial equation has the form of a one-dimensional problem on $r>0$ with an effective potential; demanding that $u$ be finite at $0$ and decay at infinity truncates a power series, and the truncation condition is $n=l+1+n_r$ with $n_r\ge0$ radial nodes. The energy depends on $n$ only, because the $m$ never appears in the radial equation.`,
      caption: String.raw`Choose $n$, $l$ and $m$ (the sliders only allow legal combinations: $l\le n-1$, $|m|\le l$). Left: the radial factor $R_{nl}(r)$ with its $n-l-1$ nodes marked. Middle: the angular factor as a polar surface $|Y|$ (blue where positive, orange where negative; drag to rotate). Right: their product $\psi$ on a plane through the $z$ axis, drawn as $\operatorname{sign}\psi\,\sqrt{|\psi|}$ so that the outer lobes stay visible. The readout checks the separation honestly: both factors are normalized, and $R$ satisfies the radial equation with $E=-1/2n^2$ to finite-difference accuracy. Real combinations of $\pm m$ are used (see 2.5).`,
      deps: ['qchem-1.9', 'mech-8.2', 'qm-8.3'],
      see: ['qm-8.3'],
      refs: ['McQuarrie ch. 7'],
      tags: ['hydrogen atom', 'separation of variables', 'quantum numbers'],
      viz(v) {
        const M = v.M;
        const nS = v.slider('principal quantum number $n$', 1, 5, 3, { int: true, onChange: () => fix() });
        const lS = v.slider('orbital quantum number $l$', 0, 4, 1, { int: true, onChange: () => fix() });
        const mS = v.slider('magnetic quantum number $m$', -4, 4, 0, { int: true, onChange: () => fix() });
        function fix() {
          const n = nS.value; if (lS.value > n - 1) lS.set(n - 1);
          const l = Math.min(lS.value, n - 1); if (Math.abs(mS.value) > l) mS.set(Math.sign(mS.value) * l);
        }
        const sR = v.stage({ x: [0, 20], y: [-1, 1], height: 320, axes: 'box', gutter: true, weight: 1, xlabel: 'r / a₀', ylabel: 'R(r)', title: 'radial factor $R_{nl}(r)$' });
        const s3 = v.stage3d({ range: 1.7, height: 320, weight: 0.9, axes: false, yaw: -0.7, pitch: 0.35, title: 'angular factor $|Y|$' });
        const sC = v.stage({ x: [-10, 10], y: [-10, 10], equal: true, height: 320, axes: 'box', gutter: true, weight: 1, xlabel: 'ρ / a₀', ylabel: 'z / a₀', title: 'product $\\psi$ in a plane through the $z$ axis' });
        let st = null, heatKey = '', heatMax = 1;
        v.render(() => {
          const n = nS.value, l = Math.min(lS.value, n - 1), m = M.clamp(mS.value, -l, l);
          if (lS.value !== l) lS.set(l); if (mS.value !== m) mS.set(m);
          const ext = 1.7 * n * n + 3, f0 = phi0(m), R = (r) => Rnl(n, l, r);
          // radial panel
          let lo = 0, hi = 0; const NG = 600;
          for (let i = 0; i <= NG; i++) { const y = R((ext * i) / NG); lo = Math.min(lo, y); hi = Math.max(hi, y); }
          sR.setView([0, ext], [lo - 0.12 * (hi - lo), hi + 0.12 * (hi - lo)]);
          sR.hline(0, { color: 'faint' });
          sR.fn(R, { color: 'accent', width: 2.4, fill: 'accent', fillAlpha: 0.1, base: 0, n: 500 });
          const nodes = zeros(R, 0.02, ext, 4000);
          nodes.forEach((x) => sR.dot(x, 0, { r: 5, color: 'red' }));
          // angular surface
          const Y = (th, ph) => realY(l, m, th, ph);
          s3.begin();
          lobes(s3, Y, 1.35);
          s3.arrow([0, 0, -1.65], [0, 0, 1.65], { color: 'faint', width: 1 });
          s3.text('z', [0, 0, 1.8], { color: 'muted', math: true });
          s3.end();
          // product on a plane through the z axis
          const key = `${n},${l},${m}`;
          if (key !== heatKey) {
            heatKey = key; heatMax = 0;
            for (let i = 0; i < 60; i++) for (let j = 0; j < 60; j++) { const rho = -ext + (2 * ext * i) / 59, z = -ext + (2 * ext * j) / 59, r = Math.hypot(rho, z) || 1e-9; heatMax = Math.max(heatMax, Math.abs(R(r) * Y(Math.acos(z / r), rho >= 0 ? f0 : f0 + Math.PI))); }
          }
          sC.setView([-ext, ext], [-ext, ext]);
          sC.heat((rho, z) => { const r = Math.hypot(rho, z) || 1e-9, p = R(r) * Y(Math.acos(Math.max(-1, Math.min(1, z / r))), rho >= 0 ? f0 : f0 + Math.PI) / heatMax; return Math.sign(p) * Math.sqrt(Math.abs(p)); },
            { range: [-1, 1], cmap: 'theme-diverging', neg: 'orange', pos: 'accent', res: 3, key });
          // checks
          const NR = M.integrate((r) => R(r) ** 2 * r * r, 0, 4 * ext, 4000);
          const NY = sphereInt((th, ph) => Y(th, ph) ** 2);
          const E = -1 / (2 * n * n); let res = 0, mx = 0; const h = 1e-3;
          for (let r = 0.3; r < ext; r += ext / 150) {
            const d2 = (R(r + h) - 2 * R(r) + R(r - h)) / (h * h), d1 = (R(r + h) - R(r - h)) / (2 * h);
            res = Math.max(res, Math.abs(-0.5 * (d2 + (2 * d1) / r) + ((l * (l + 1)) / (2 * r * r) - 1 / r) * R(r) - E * R(r))); mx = Math.max(mx, Math.abs(R(r)));
          }
          st = { n, l, m, NR, NY, E, res: res / mx, nodes: nodes.length };
        });
        v.legend([['accent', 'positive'], ['orange', 'negative'], ['red', 'radial nodes', { dot: true }]]);
        v.readout(() => st && `Orbital $${orbTeX(st.n, st.l, st.m)}$ (a real combination of $\\pm m$): radial nodes **${st.nodes}** (rule $n-l-1=${st.n - st.l - 1}$), angular nodal surfaces $l=${st.l}$, total $n-1=${st.n - 1}$. $\\int R^2r^2dr=${v.fix(st.NR, 5)}$, $\\int|Y|^2d\\Omega=${v.fix(st.NY, 5)}$. Residual of the radial equation with $E=-\\tfrac1{2n^2}=${v.fix(st.E, 5)}$ hartree $=${v.fix(st.E * 27.211386, 3)}$ eV: $${v.sci(st.res, 1)}$ relative to $\\max|R|$.`);
      },
    },
    // ------------------------------------------------------------------ 2.2
    {
      num: '2.2',
      kind: 'Theorem',
      name: 'Energy levels and the Rydberg formula',
      credit: 'Balmer, 1885; Rydberg, 1888; Bohr, 1913; Schrödinger, 1926',
      statement: String.raw`The bound-state energies of a one-electron atom with nuclear charge $Z$ are
$$E_n=-\frac{\mu e^4Z^2}{2(4\pi\varepsilon_0)^2\hbar^2}\frac1{n^2}=-hcR_M\frac{Z^2}{n^2},\qquad R_M=R_\infty\frac{1}{1+m_e/M},$$
where $\mu$ is the reduced mass and $R_\infty=\dfrac{m_ee^4}{8\varepsilon_0^2h^3c}=1.0973731568\times10^{7}\,\mathrm{m^{-1}}$. A photon emitted in the jump from level $n_u$ to a lower level $n_l$ therefore has wavenumber
$$\tilde\nu=\frac1\lambda=R_M\Big(\frac1{n_l^2}-\frac1{n_u^2}\Big),$$
the **Rydberg formula**: the lines group into series ending on a common lower level ($n_l=1$ Lyman, 2 Balmer, 3 Paschen, 4 Brackett), each converging to a series limit $R_M/n_l^2$.`,
      scope: String.raw`Non-relativistic point nucleus; the measured lines are split by fine structure (2.8), the Lamb shift and hyperfine structure at the $10^{-5}$ level. Other isotopes only change $R_M$ through the nuclear mass.`,
      idea: String.raw`The radial equation of 2.1 has bound solutions only when the series truncates, which fixes $E=-Z^2/2n^2$ hartree: the same number for all $l<n$, hence the $n^2$-fold degeneracy $\sum_{l<n}(2l+1)$. The Bohr condition $h\nu=E_u-E_l$ (energy conservation for the emitted photon) turns the difference of two such levels into Balmer's empirical $1/4-1/n^2$ pattern. The tiny difference between $R_\infty$ and $R_H$ is the reduced-mass correction $\mu=m_e/(1+m_e/M)$, which also separates hydrogen from deuterium.`,
      caption: String.raw`**Click a level** on the energy ladder (or use the series buttons and the slider) to choose a jump $n_u\to n_l$: the arrow is drawn in the true colour of the photon where it is visible. The right panel places the lines of all four series on a logarithmic wavelength axis, with the series limits dashed and the visible band underneath; the chosen line is marked in gold. Switch the **nucleus** between infinite mass, $^{1}$H and $^{2}$H: the Balmer lines move by a few tenths of a nanometre. The readout recomputes the wavelength from $R_M$ and compares Balmer lines with tabulated air wavelengths (recalled from standard tables, not re-measured here).`,
      deps: ['qchem-2.1'],
      see: ['qm-1.4', 'qm-8.9'],
      refs: ['McQuarrie ch. 7'],
      tags: ['Rydberg formula', 'hydrogen spectrum', 'spectral series'],
      viz(v) {
        const M = v.M, C = M.CONST, Rinf = C.Ry;
        const MASS = { inf: 1, H: 1 / (1 + C.me / C.mp), D: 1 / (1 + 1 / 3670.4829) };
        const ser = v.select('series: lower level', Object.entries(SERIES).map(([k, nm]) => ({ value: k, label: `${nm} ($n_l=${k}$)` })), '2');
        const nuS = v.slider('upper level $n_u$', 2, 10, 3, { int: true });
        const iso = v.select('nucleus', [{ value: 'inf', label: 'infinite mass' }, { value: 'H', label: '¹H' }, { value: 'D', label: '²H (D)' }], 'H');
        const sL = v.stage({ x: [0, 11.4], y: [-14.9, 1.6], height: 340, axes: 'box', gutter: true, weight: 0.85, xticks: [], ylabel: 'E (eV)', title: 'levels $E_n=-13.606/n^2$ eV' });
        const sS = v.stage({ x: [80, 4600], y: [0, 5.2], xlog: true, height: 340, axes: 'box', gutter: true, weight: 1.3, xlabel: 'wavelength in vacuum (nm)', xticks: [100, 200, 400, 700, 1000, 2000, 4000], yticks: [], title: 'lines of the four series' });
        const En = (n) => -RY_EV / (n * n);
        const lam = (nl, nu, f) => 1e9 / (Rinf * f * (1 / (nl * nl) - 1 / (nu * nu)));
        const colOf = (nm) => (nm >= 380 && nm <= 780 ? M.wavelengthRGB(nm) : 'muted');
        sL.onClick((x, y) => {
          let best = 1, bd = 1e9; for (let n = 1; n <= 10; n++) { const d = Math.abs(En(n) - y); if (d < bd) { bd = d; best = n; } }
          const lo = +ser.value;
          if (best > lo) nuS.set(best); else if (best <= 4) { ser.set(String(best)); nuS.set(Math.max(nuS.value, best + 1)); }
        });
        let st = null;
        v.render(() => {
          const lo = +ser.value; if (nuS.value <= lo) nuS.set(lo + 1);
          const up = Math.max(nuS.value, lo + 1), f = MASS[iso.value];
          // ladder
          sL.hband(0, 1.6, { color: 'green', alpha: 0.07 }); sL.text('continuum (ionized)', 0.35, 0.8, { size: 11, color: 'green', align: 'left', baseline: 'middle' });
          let lastY = 1e9;
          for (let n = 1; n <= 10; n++) {
            const e = En(n), hi = n === lo || n === up;
            sL.line(0.3, e, 9.1, e, { color: hi ? 'ink' : 'muted', width: hi ? 2.8 : 1.5, alpha: hi ? 1 : 0.7 });
            if (hi || sL.Y(e) < lastY - 13) { sL.text(`n = ${n}`, 9.3, e, { size: 11, color: hi ? 'ink' : 'muted', align: 'left', baseline: 'middle' }); lastY = sL.Y(e); }
          }
          for (let u = lo + 1; u <= 10; u++) {
            const nm = lam(lo, u, f), x = 1 + 0.82 * (u - lo - 1), sel = u === up;
            sL.arrow(x, En(u), x, En(lo), { color: sel ? colOf(nm) : 'muted', width: sel ? 3.4 : 1.1, alpha: sel ? 1 : 0.45, head: sel ? 9 : 5 });
          }
          // spectrum
          for (let k = 380; k < 780; k += 4) sS.rect(k, 0.06, k + 4.4, 0.4, { fill: M.wavelengthRGB(k), fillAlpha: 0.9, stroke: false });
          sS.text('visible', 530, 0.62, { size: 10, color: 'muted', align: 'left', baseline: 'middle' });
          Object.entries(SERIES).forEach(([k, nm]) => {
            const nl = +k, y = 5 - nl; sS.hline(y, { color: 'faint', alpha: 0.5 });
            sS.text(nm, 84, y + 0.5, { size: 11, color: 'muted', align: 'left', baseline: 'middle' });
            sS.vline(lam(nl, 1e9, f), { color: 'green', width: 1, dash: [4, 3], alpha: nl === lo ? 0.9 : 0.35 });
            for (let u = nl + 1; u <= 14; u++) { const x = lam(nl, u, f), on = nl === lo && u === up; sS.line(x, y - 0.22, x, y + 0.22, { color: colOf(x), width: on ? 3.2 : 2, alpha: on ? 1 : 0.9 }); }
          });
          const xs = lam(lo, up, f); sS.dot(xs, 5 - lo, { r: 9, hollow: true, color: 'gold' });
          sS.text(`${SERIES[lo]} ${lo}←${up}`, xs, 5 - lo + 0.5, { size: 11, color: 'gold', align: 'center' });
          const vac = xs, air = vac / nAir(vac), E = En(up) - En(lo);
          st = { lo, up, f, vac, air, eV: E * f, meas: lo === 2 ? BALMER_AIR[up] : null };
        });
        v.readout(() => st && `${SERIES[st.lo]} line $n_u=${st.up}\\to n_l=${st.lo}$: $\\tilde\\nu=R_M\\big(\\tfrac1{${st.lo * st.lo}}-\\tfrac1{${st.up * st.up}}\\big)=${v.fix(1e-2 * Rinf * st.f * (1 / st.lo ** 2 - 1 / st.up ** 2), 2)}$ cm$^{-1}$ (with $R_M=${v.fix(1e-2 * Rinf * st.f, 3)}$ cm$^{-1}$) → $\\lambda_{\\rm vac}=${v.fix(st.vac, 3)}$ nm` + (st.vac > 200 ? `, in air ${v.fix(st.air, 3)} nm` : ' (ultraviolet: quoted in vacuum)') + `; photon energy $h\\nu=${v.fix(st.eV, 4)}$ eV $=E_u-E_l$.` + (st.meas ? `\nTabulated air wavelength of this Balmer line: ${st.meas.toFixed(3)} nm; computed minus tabulated: ${v.fix(st.air - st.meas, 3)} nm (isotope shift ¹H − ²H of this line, computed from the reduced masses: ${v.fix(lam(st.lo, st.up, MASS.H) / nAir(lam(st.lo, st.up, MASS.H)) - lam(st.lo, st.up, MASS.D) / nAir(lam(st.lo, st.up, MASS.D)), 3)} nm).` : '') + `\nSeries limit of the ${SERIES[st.lo]} series: ${v.fix(lamLimit(st), 2)} nm.`);
        function lamLimit(s) { return 1e9 / (Rinf * s.f / (s.lo * s.lo)); }
      },
    },
    // ------------------------------------------------------------------ 2.3
    {
      num: '2.3',
      kind: 'Definition',
      name: 'Spherical harmonics and s, p, d orbital shapes',
      statement: String.raw`The angular part of every central-field orbital is a **spherical harmonic** $Y_l^m(\theta,\varphi)\propto P_l^{|m|}(\cos\theta)\,e^{im\varphi}$, the joint eigenfunction of $\hat L^2$ and $\hat L_z$ with eigenvalues $\hbar^2l(l+1)$ and $\hbar m$. They are orthonormal on the sphere, $\int Y_l^{m*}Y_{l'}^{m'}\,d\Omega=\delta_{ll'}\delta_{mm'}$. Chemists use the **real** combinations $\cos m\varphi$ and $\sin m\varphi$ of $\pm m$, labelled by the letters $l=0,1,2,3\to\mathrm{s,p,d,f}$ and by the Cartesian monomial they resemble ($p_x,p_y,p_z$; $d_{z^2},d_{xz},d_{yz},d_{xy},d_{x^2-y^2}$; …). Each has exactly $l$ angular nodal surfaces: $|m|$ planes through the $z$ axis and $l-|m|$ cones (or the plane $z=0$) about it.`,
      idea: String.raw`$\hat L^2$ and $\hat L_z$ commute, so one can diagonalize them together: $e^{im\varphi}$ solves $\hat L_z$, single-valuedness forces integer $m$, and the polar equation becomes Legendre's equation whose regular solutions require $l\ge|m|$ and $L^2=l(l+1)\hbar^2$ (qm-7.5, 2.1). The polynomial $P_l^{|m|}(\cos\theta)$ has $l-|m|$ zeros in $0<\theta<\pi$, and $\cos m\varphi$ has $2|m|$ zero crossings per turn (that is, $|m|$ planes), which adds up to $l$ nodal surfaces. Different $(l,m)$ are eigenfunctions of a Hermitian operator with different eigenvalues, hence orthogonal (1.3).`,
      caption: String.raw`**Click a tile** in the table (rows $l$, columns $m$) or use the controls: the polar surface $r=|Y|$ on the left is coloured by sign (blue $+$, orange $-$) and rotates when dragged; each tile in the table shows the cross-section through the $z$ axis. The readout *counts* the nodal surfaces numerically by scanning signs along a circle of latitude and a meridian, and recomputes $\int|Y|^2d\Omega$ and the overlap with the previously selected harmonic (it is $1$ for the same function and $0$ for different ones).`,
      deps: ['qchem-2.1', 'qm-7.5'],
      refs: ['McQuarrie ch. 7'],
      tags: ['spherical harmonics', 'orbital shapes', 'nodal surfaces'],
      viz(v) {
        const M = v.M;
        const lS = v.select('$l$', [0, 1, 2, 3].map((l) => ({ value: String(l), label: `${LETTER[l]} ($l=${l}$)` })), '2', { onChange: () => { if (Math.abs(mS.value) > +lS.value) mS.set(Math.sign(mS.value) * +lS.value); } });
        const mS = v.slider('$m$ (real combination: $>0$ cos, $<0$ sin)', -3, 3, 0, { int: true });
        const s3 = v.stage3d({ range: 1.65, height: 360, weight: 1, axes: false, yaw: -0.7, pitch: 0.4, title: 'polar surface $|Y_l^m|$, coloured by sign' });
        const sT = v.stage({ x: [-4.3, 3.7], y: [-0.6, 3.95], equal: true, axes: false, height: 360, weight: 1, title: 'all real harmonics up to $l=3$ (cuts through the $z$ axis)' });
        sT.onClick((x, y) => {
          const l = Math.round(3.1 - y), m = Math.round(x);
          if (l >= 0 && l <= 3 && Math.abs(m) <= l) { lS.set(String(l)); mS.set(m); }
        });
        let st = null, prevKey = null, curKey = null;
        v.render(() => {
          const l = +lS.value, m = M.clamp(mS.value, -l, l); if (mS.value !== m) mS.set(m);
          const key = `${l},${m}`;
          if (key !== curKey) { prevKey = curKey; curKey = key; }
          const Y = (th, ph) => realY(l, m, th, ph);
          s3.begin(); lobes(s3, Y, 1.35);
          s3.arrow([0, 0, -1.6], [0, 0, 1.6], { color: 'faint', width: 1 }); s3.text('z', [0, 0, 1.75], { color: 'muted', math: true });
          s3.end();
          // tile table
          for (let mm = -3; mm <= 3; mm++) sT.text(String(mm).replace('-', '−'), mm, 3.62, { size: 11, color: 'muted', align: 'center' });
          for (let ll = 0; ll <= 3; ll++) {
            const cy = 3 - ll + 0.1; sT.text(`${LETTER[ll]}`, -3.95, cy, { size: 14, color: 'muted', align: 'center', baseline: 'middle', math: true });
            for (let mm = -ll; mm <= ll; mm++) {
              const sel = ll === l && mm === m, f0 = phi0(mm), mxT = (() => { let q = 0; for (let i = 0; i <= 30; i++) q = Math.max(q, Math.abs(realY(ll, mm, (i / 30) * Math.PI, f0))); return q; })();
              sT.rect(mm - 0.48, cy - 0.48, mm + 0.48, cy + 0.48, { color: sel ? 'accent' : 'faint', width: sel ? 2 : 1, fill: sel ? 'accent' : false, fillAlpha: 0.1, radius: 6 });
              for (const sg of [1, -1]) {
                let run = [], sign = 0;
                const flush = () => { if (run.length > 1) sT.poly([[mm, cy + 0.07], ...run, [mm, cy + 0.07]], { fill: sign > 0 ? 'accent' : 'orange', fillAlpha: 0.55, color: sign > 0 ? 'accent' : 'orange', width: 1 }); run = []; };
                for (let i = 0; i <= 60; i++) {
                  const th = (i / 60) * Math.PI, val = realY(ll, mm, th, sg > 0 ? f0 : f0 + Math.PI), r = (0.33 * Math.abs(val)) / mxT;
                  const sgn = val >= 0 ? 1 : -1; if (sgn !== sign && run.length) flush(); sign = sgn;
                  run.push([mm + sg * r * Math.sin(th), cy + 0.07 + r * Math.cos(th)]);
                }
                flush();
              }
              if (mm === 0 || ll <= 2) sT.text(`${REAL_NAMES[ll][mm].replace(/[_{}^]/g, '').replace('x2-y2', 'x²−y²').replace('z2', 'z²')}`, mm, cy - 0.38, { size: 9, color: 'muted', align: 'center' });
            }
          }
          // checks: norm, overlap, nodes
          const norm = sphereInt((th, ph) => Y(th, ph) ** 2, 60, 120);
          let ov = null;
          if (prevKey) { const [pl, pm] = prevKey.split(',').map(Number); ov = sphereInt((th, ph) => Y(th, ph) * realY(pl, pm, th, ph), 60, 120); }
          const f0 = phi0(m), mer = zeros((th) => Y(th, f0), 1e-4, Math.PI - 1e-4, 1500).length;
          let circ = 0; const th0 = 1.0 + 0.0713, N = 720; let s0 = Math.sign(Y(th0, 0.0007));
          for (let i = 1; i <= N; i++) { const sv = Math.sign(Y(th0, 0.0007 + (TAU * i) / N)); if (sv !== 0 && sv !== s0) { circ++; s0 = sv; } }
          st = { l, m, norm, ov, prev: prevKey, planes: circ / 2, cones: mer };
        });
        v.legend([['accent', '$Y>0$'], ['orange', '$Y<0$']]);
        v.readout(() => st && `$${orbTeX(0, st.l, st.m)}$ (${LETTER[st.l]} orbital, $l=${st.l}$, $|m|=${Math.abs(st.m)}$): nodal planes through the $z$ axis counted on a latitude circle **${st.planes}** ($=|m|$), nodal cones/plane in the polar direction counted on a meridian **${st.cones}** ($=l-|m|$), total **${st.planes + st.cones}** $=l$. $\\int|Y|^2d\\Omega=${v.fix(st.norm, 4)}$` + (st.ov != null ? `; overlap with the previous selection (${st.prev.replace(',', ', ')}): $${v.fix(Math.abs(st.ov) < 5e-4 ? 0 : st.ov, 3)}$.` : '.'));
      },
    },
    // ------------------------------------------------------------------ 2.4
    {
      num: '2.4',
      kind: 'Definition',
      name: 'Radial distribution function',
      statement: String.raw`For a hydrogen-like orbital $\psi_{nlm}=R_{nl}Y_l^m$ the probability of finding the electron in a thin spherical shell between $r$ and $r+dr$ (at any angle) is $P_{nl}(r)\,dr$ with the **radial distribution function**
$$P_{nl}(r)=r^2R_{nl}(r)^2,\qquad \int_0^\infty P_{nl}(r)\,dr=1,$$
using $\int|Y|^2d\Omega=1$. It is the density $|R|^2$ multiplied by the area $4\pi r^2$ of the shell (up to the angular factor). $|R_{nl}|^2$ is largest at the nucleus for s orbitals, but $P_{nl}$ always vanishes at $r=0$ and has $n-l$ maxima; the most probable radius of 1s is $a_0$ and the mean radius is $\langle r\rangle=\tfrac{a_0}2\,[3n^2-l(l+1)]/Z$.`,
      idea: String.raw`In spherical coordinates the volume element is $r^2\sin\theta\,dr\,d\theta\,d\varphi$, so integrating $|\psi|^2$ over the angles leaves $r^2R^2\int|Y|^2d\Omega=r^2R^2$ (qchem-2.1). A density that falls monotonically from the nucleus (1s) is multiplied by a growing $r^2$, and the product peaks where the two trends balance: at $a_0$ for 1s. Radial nodes (zeros of $R$, $n-l-1$ of them) are zeros of $P$ as well, so $P_{nl}$ has $n-l$ lobes; centrifugal repulsion pushes $l>0$ orbitals away from the nucleus.`,
      caption: String.raw`Pick an orbital. Left: the density $|R|^2$ (probability per unit *volume* along a ray); right: $P=r^2|R|^2$ (probability per unit *radius*). For s orbitals the first peaks at the nucleus while the second vanishes there. **Drag the orange handle** on the right panel: the shaded area is the probability of finding the electron inside radius $\rho$. Turn on **compare with 1s** to see how much further out the $n=2,3$ shells lie. Nodes (red) are counted live and compared with $n-l-1$.`,
      deps: ['qchem-2.1'],
      refs: ['McQuarrie ch. 7'],
      tags: ['radial distribution', 'probability density', 'nodes'],
      viz(v) {
        const M = v.M;
        const ORB = { '1s': [1, 0], '2s': [2, 0], '3s': [3, 0], '2p': [2, 1], '3p': [3, 1], '3d': [3, 2] };
        const sel = v.select('orbital', Object.keys(ORB).map((k) => ({ value: k, label: k })), '2s', { onChange: () => h.set(ORB[sel.value][0] ** 2 * 1.2, 0) });
        const cmp = v.toggle('compare with 1s', false);
        const sD = v.stage({ x: [0, 12], y: [0, 4.4], height: 330, axes: 'box', gutter: true, weight: 1, xlabel: 'r / a₀', ylabel: '|R(r)|²', title: 'density $|R_{nl}(r)|^2$' });
        const sP = v.stage({ x: [0, 12], y: [-0.06, 0.6], height: 330, axes: 'box', gutter: true, weight: 1, xlabel: 'r / a₀', ylabel: 'P(r) = r²|R|²', title: 'radial distribution $P=r^2|R|^2$' });
        const h = sP.handle(2.4, 0, { color: 'orange', r: 8, label: 'ρ', labelPos: 'n', constrain: 'x' });
        let st = null;
        v.render(() => {
          const [n, l] = ORB[sel.value], ext = 1.7 * n * n + 3, R = (r) => Rnl(n, l, r), P = (r) => r * r * R(r) ** 2;
          let dmax = 0, pmax = 0, rp = 0, NG = 800;
          for (let i = 1; i <= NG; i++) { const r = (ext * i) / NG; dmax = Math.max(dmax, R(r) ** 2); if (P(r) > pmax) { pmax = P(r); rp = r; } }
          dmax = Math.max(dmax, 1e-9); // 1s: R²(0)=4, P peaks at 0.541 (r = a₀)
          const ymaxD = Math.max(dmax, cmp.value ? 4 : 0) * 1.1, ymaxP = Math.max(pmax, cmp.value ? 0.5413 : 0) * 1.12;
          sD.setView([0, ext], [0, ymaxD]); sP.setView([0, ext], [-0.1 * ymaxP, ymaxP]);
          const rho = M.clamp(h.x, 0.02, ext); h.set(rho, -0.05 * ymaxP);
          if (cmp.value && sel.value !== '1s') { sD.fn((r) => Rnl(1, 0, r) ** 2, { color: 'green', width: 1.8, dash: [6, 4] }); sP.fn((r) => r * r * Rnl(1, 0, r) ** 2, { color: 'green', width: 1.8, dash: [6, 4] }); }
          sD.fn((r) => R(r) ** 2, { color: 'accent', width: 2.4, fill: 'accent', fillAlpha: 0.1, n: 500 });
          sP.fn(P, { domain: [0, rho], fill: 'orange', fillAlpha: 0.25, color: 'orange', width: 0.5, n: 300 });
          sP.fn(P, { color: 'accent', width: 2.4, n: 500 });
          sD.vline(1, { color: 'faint', dash: [3, 3] }); sP.vline(1, { color: 'faint', dash: [3, 3] }); sP.text('a₀', 1, ymaxP * 0.97, { size: 10, color: 'muted', align: 'left' });
          const nodes = zeros(R, 0.02, ext, 3000); nodes.forEach((x) => { sD.dot(x, 0, { r: 4.5, color: 'red' }); sP.dot(x, 0, { r: 4.5, color: 'red' }); });
          sP.dot(rp, pmax, { r: 5, color: 'gold' });
          const mean = M.integrate((r) => r * P(r), 0, ext * 3, 3000), Pin = M.integrate(P, 0, rho, 600), tot = M.integrate(P, 0, ext * 3, 3000);
          st = { sel: sel.value, n, l, nodes: nodes.length, rp, mean, Pin, tot, rho, R0: R(1e-9) ** 2 };
        });
        v.legend([['accent', 'orbital'], ['orange', 'probability inside ρ', { area: true }], ['red', 'radial nodes', { dot: true }], ['gold', 'most probable $r$', { dot: true }]]);
        v.readout(() => st && `**${st.sel}**: radial nodes counted **${st.nodes}**, rule $n-l-1=${st.n - st.l - 1}$. $|R(0)|^2=${v.fix(st.R0, 3)}$ (nonzero only for s) while $P(0)=0$. Highest peak of $P$ at $r=${v.fix(st.rp, 2)}\\,a_0$ (${v.fix(st.rp * 52.917721, 0)} pm); $\\langle r\\rangle=${v.fix(st.mean, 3)}\\,a_0$ against $\\tfrac12[3n^2-l(l+1)]=${v.fix(0.5 * (3 * st.n * st.n - st.l * (st.l + 1)), 3)}$. $\\int P\\,dr=${v.fix(st.tot, 4)}$; probability inside $\\rho=${v.fix(st.rho, 2)}\\,a_0$: **${v.fix(100 * st.Pin, 1)} %**.`);
      },
    },
    // ------------------------------------------------------------------ 2.5
    {
      num: '2.5',
      kind: 'Concept',
      name: 'Real orbitals as combinations of complex ones',
      statement: String.raw`For $m\ne0$ the eigenfunctions $\psi_{nl,\pm m}\propto e^{\pm im\varphi}$ of $\hat L_z$ are complex, with a current circulating about the $z$ axis. Because the hydrogen energy does not depend on $m$, any linear combination of the $2l+1$ degenerate functions of a shell is also an eigenfunction of $\hat H$ with the same $E_n$. The combinations
$$\psi_{nl,\cos m\varphi}=\tfrac1{\sqrt2}\big(\psi_{l,-m}+(-1)^m\psi_{l,m}\big)\propto\cos m\varphi,\qquad \psi_{nl,\sin m\varphi}=\tfrac{i}{\sqrt2}\big(\psi_{l,-m}-(-1)^m\psi_{l,m}\big)\propto\sin m\varphi$$
are real: for $l=1$ they are $p_x$ and $p_y$, and they are no longer eigenfunctions of $\hat L_z$ ($\langle L_z\rangle=0$ but $\Delta L_z=\hbar$). Which basis is used is a matter of convenience; observables of the degenerate shell do not depend on it.`,
      scope: String.raw`Mixing only changes the picture when the states are degenerate; in an electric or magnetic field (2.10) $m$ is again a good quantum number and the complex basis is the natural one along the field.`,
      idea: String.raw`Linearity of the Schrödinger equation (1.1) says that if $\hat H\psi_a=E\psi_a$ and $\hat H\psi_b=E\psi_b$ then every $c_a\psi_a+c_b\psi_b$ has the same energy, so the energy readout cannot see the mixing. Since $Y_1^{\pm1}\propto\sin\theta\,e^{\pm i\varphi}$, the sum and difference give $\sin\theta\cos\varphi$ and $\sin\theta\sin\varphi$; a relative phase $e^{2i\alpha}$ between the two just rotates the lobe about the $z$ axis by $\alpha$. Unequal weights give a complex combination that carries net angular momentum $\langle L_z\rangle=(|c_{+1}|^2-|c_{-1}|^2)\hbar$.`,
      caption: String.raw`The 2p shell. Write $\psi=a\,\psi_{2p,-1}+b\,\psi_{2p,+1}$ with $a=\cos\beta\,e^{i\alpha}$, $b=-\sin\beta\,e^{-i\alpha}$. **Drag the phase $\alpha$**: at $\beta=\pi/4$ (equal weights) the combination is a real p orbital and the lobe turns from $p_x$ ($\alpha=0$) to $p_y$ ($\alpha=\pi/2$) while the energy readout stays at $-3.401$ eV. **Drag the weight $\beta$** away from $\pi/4$: the lobe turns into a rotating ring (colour = phase of $\psi$) with $\langle L_z\rangle\neq0$; at $\beta=0$ or $\pi/2$ it is a pure $m=\mp1$ state.`,
      deps: ['qchem-2.3'],
      refs: ['McQuarrie ch. 7'],
      tags: ['real orbitals', 'degeneracy', 'superposition'],
      viz(v) {
        const M = v.M, Q = v.quantum();
        const aS = v.slider('relative phase $\\alpha$', 0, TAU, 0, { step: 0.01 });
        const bS = v.slider('weight angle $\\beta$ ($\\pi/4$: equal weights)', 0, Math.PI / 2, Math.PI / 4, { step: 0.005 });
        v.button('$p_x$', () => { aS.set(0); bS.set(Math.PI / 4); });
        v.button('$p_y$', () => { aS.set(Math.PI / 2); bS.set(Math.PI / 4); });
        v.button('$m=-1$', () => bS.set(0));
        v.button('$m=+1$', () => bS.set(Math.PI / 2));
        const s3 = v.stage3d({ range: 1.65, height: 330, weight: 1, axes: false, yaw: -0.5, pitch: 0.55, title: 'angular amplitude $|\\psi|$, coloured by phase' });
        const sP = v.stage({ x: [-1.4, 1.4], y: [-1.4, 1.4], equal: true, height: 330, axes: false, weight: 0.8, title: 'coefficients in the complex plane' });
        const sC = v.stage({ x: [-14, 14], y: [-14, 14], equal: true, height: 330, axes: 'box', gutter: true, weight: 1, xlabel: 'x / a₀', ylabel: 'y / a₀', title: 'cut $z=0$: brightness $|\\psi|^2$, hue = phase' });
        const A = Math.sqrt(3 / (8 * Math.PI)), R2 = (r) => Rnl(2, 1, r);
        // ψ_ang = a Y_{1,−1} + b Y_{1,+1} = A sinθ [cosβ e^{−iχ} + sinβ e^{+iχ}], χ = φ − α:  re = s(cosβ+sinβ)cosχ, im = s(sinβ−cosβ)sinχ
        const angC = (th, ph, al, be) => { const x = ph - al, s = A * Math.sin(th); return [s * (Math.cos(be) + Math.sin(be)) * Math.cos(x), s * (Math.sin(be) - Math.cos(be)) * Math.sin(x)]; };
        let st = null;
        v.render(() => {
          const al = aS.value, be = bS.value, col = (phi) => Q.phaseColor(phi);
          let mx = 0; for (let i = 0; i <= 30; i++) for (let j = 0; j < 36; j++) { const z = angC((i / 30) * Math.PI, (j / 36) * TAU, al, be); mx = Math.max(mx, Math.hypot(z[0], z[1])); }
          mx = mx || 1;
          s3.begin();
          s3.surface((th, ph) => { const z = angC(th, ph, al, be), r = (1.35 * Math.hypot(z[0], z[1])) / mx; return [r * Math.sin(th) * Math.cos(ph), r * Math.sin(th) * Math.sin(ph), r * Math.cos(th)]; }, [0, Math.PI], [0, TAU], { nu: 40, nv: 60, alpha: 0.92, colorFn: (th, ph) => { const z = angC(th, ph, al, be); return col(Math.atan2(z[1], z[0])); } });
          s3.arrow([0, 0, -1.6], [0, 0, 1.6], { color: 'faint', width: 1 }); s3.text('z', [0, 0, 1.75], { color: 'muted', math: true });
          s3.arrow([0, 0, 0], [1.7, 0, 0], { color: 'faint', width: 1 }); s3.text('x', [1.85, 0, 0], { color: 'muted', math: true });
          s3.arrow([0, 0, 0], [0, 1.7, 0], { color: 'faint', width: 1 }); s3.text('y', [0, 1.85, 0], { color: 'muted', math: true });
          s3.end();
          // phasors: a = cosβ e^{iα}, b = −sinβ e^{−iα}
          const a = [Math.cos(be) * Math.cos(al), Math.cos(be) * Math.sin(al)], b = [-Math.sin(be) * Math.cos(al), Math.sin(be) * Math.sin(al)];
          sP.circle(0, 0, 1, { color: 'faint', width: 1 }); sP.hline(0, { color: 'faint' }); sP.vline(0, { color: 'faint' });
          sP.arrow(0, 0, a[0], a[1], { color: 'green', width: 3 }); sP.arrow(0, 0, b[0], b[1], { color: 'purple', width: 3 });
          sP.text('a (m = −1)', a[0] * 1.1, a[1] * 1.1 + 0.08, { size: 11, color: 'green', align: 'center' }); sP.text('b (m = +1)', b[0] * 1.1, b[1] * 1.1 - 0.1, { size: 11, color: 'purple', align: 'center' });
          // cut z = 0
          const lut = Array.from({ length: 72 }, (_, k) => { const m = col((k / 72) * TAU).match(/[\d.]+/g).map(Number); return m.slice(0, 3); }), pn = rgbPanel();
          function rgbPanel() { return v.rgb('panel').slice(0, 3); }
          const norm = 1.0, ymax = (() => { let q = 0; for (let r = 0.5; r < 14; r += 0.25) q = Math.max(q, R2(r) ** 2); return q; })();
          sC.raster((x, y) => {
            const r = Math.hypot(x, y); if (r < 1e-6) return pn;
            const z = angC(Math.PI / 2, Math.atan2(y, x), al, be), amp = (R2(r) ** 2 * (z[0] * z[0] + z[1] * z[1])) / (ymax * mx * mx), t = Math.min(1, Math.pow(amp, 0.55) * 1.05);
            const k = (((Math.round((Math.atan2(z[1], z[0]) / TAU) * 72) % 72) + 72) % 72), c = lut[k];
            return [pn[0] + (c[0] - pn[0]) * t, pn[1] + (c[1] - pn[1]) * t, pn[2] + (c[2] - pn[2]) * t];
          }, { res: 3, key: `${al.toFixed(3)},${be.toFixed(3)}` });
          sC.axes();
          // checks
          const nrm = sphereInt((th, ph) => { const z = angC(th, ph, al, be); return z[0] * z[0] + z[1] * z[1]; }, 60, 120);
          const e = 1e-4; // ⟨ψ|−i∂φ ψ⟩ = ∫ (ψr ∂φψi − ψi ∂φψr) dΩ
          const Lz = sphereInt((th, ph) => { const z = angC(th, ph, al, be), zp = angC(th, ph + e, al, be), zm = angC(th, ph - e, al, be); return (z[0] * (zp[1] - zm[1]) - z[1] * (zp[0] - zm[0])) / (2 * e); }, 60, 120);
          let imx = 0, rmx = 0; for (let i = 1; i < 30; i++) for (let j = 0; j < 36; j++) { const z = angC((i / 30) * Math.PI, (j / 36) * TAU, al, be); imx = Math.max(imx, Math.abs(z[1])); rmx = Math.max(rmx, Math.abs(z[0])); }
          st = { al, be, nrm, Lz, Lzexp: Math.sin(be) ** 2 - Math.cos(be) ** 2, real: imx / (rmx || 1) < 1e-9 };
        });
        v.readout(() => st && `$\\alpha=${v.fix(st.al, 2)}$, $\\beta=${v.fix(st.be / Math.PI, 3)}\\pi$: $\\int|\\psi_{\\rm ang}|^2d\\Omega=${v.fix(st.nrm, 4)}$ · energy $\\langle H\\rangle=|a|^2E_{2p}+|b|^2E_{2p}=E_2=-3.401$ eV for every $\\alpha,\\beta$ · $\\langle L_z\\rangle$ by numerical integration $=${v.fix(Math.abs(st.Lz) < 5e-4 ? 0 : st.Lz, 3)}\\hbar$ (exact $|b|^2-|a|^2=${v.fix(Math.abs(st.Lzexp) < 5e-4 ? 0 : st.Lzexp, 3)}$) · ` + (st.real ? `**real wave function**: a p orbital pointing along azimuth $\\alpha=${v.fix(st.al, 2)}$ (${v.fix((st.al * 180) / Math.PI, 0)}°).` : 'complex wave function: carries circulating current.'));
      },
    },
  ],
};
