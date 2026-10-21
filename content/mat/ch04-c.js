// Materials Science — Chapter 4, part c: items 4.9–4.11 (precipitation hardening and Orowan bypass, annealing of cold-worked metal, hardness testing)
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));

import { AGING, orowan, shearing, radiusAt, agingPoint, agingPeak } from './source-audit-aging.shared.js';

import { mcInit, mcSweep, mcStats, recoveryFactor } from './source-audit-aging.shared.js';

import { INDENT, indentation, rockwellC, minimumBallExponent } from './source-audit-indentation.shared.js';

export default {
  collection: 'mat',
  chapter: 4,
  items: [
    // ───────────────────────────────────────────────────────────────────────────────────────────────── 4.9
    {
      num: '4.9',
      kind: 'Model',
      name: 'Precipitation hardening and Orowan bypass',
      statement: String.raw`Precipitation can impede dislocation motion by cutting particles or by bowing between particles and leaving Orowan loops. In a **fixed-volume-fraction toy model**, assume cutting resistance $\Delta\tau_{\rm sh}=A\sqrt{rf}$ and bypass resistance $\Delta\tau_{\rm Or}=Gb/\lambda$, with the chosen spacing $\lambda=r(\sqrt{2\pi/(3f)}-2)$. The lower of these two resistances increases and then decreases as $r$ grows. This gives a model peak at their crossing, not a universal law for every precipitate chemistry or aging treatment.`,
      idea: String.raw`For fixed $f$, write the tensile increments as $A_T\sqrt{rf}$ and $B_T(f)/r$. Their crossing is exactly $r_*=[B_T/(A_T\sqrt f)]^{2/3}$. Here $A_T$ is calibrated so that $r_*=r_c$ at $f=0.03$. A diffusion-controlled **late coarsening** approximation is $r^3-r_0^3=K(T)t$ at nearly constant volume fraction; it does not describe initial nucleation or growth. Thus $t_*=(r_*^3-r_0^3)/K(T)$ when this is nonnegative. Changing temperature changes this toy clock, while the peak height at fixed $f,r_c$ stays unchanged.`,
      caption: String.raw`Move the time slider or drag the black curve's handle. The top drawing is a schematic: the offset between the cut particle halves is exaggerated, and bypass loops are illustrative. The lower plots show both assumed strength branches without clipping (logarithmic strength axis), their lower envelope, and the evolving radius. A crossover outside the displayed time interval is reported explicitly.`,
      deps: ['mat-3.6', 'mat-4.8'],
      refs: ['Simm et al., MSEA 702 (2017), §5.1 Eq. (6), §5.2 Eqs. (7)–(10), Figs. 9–10; author PDF: https://www.phase-trans.msm.cam.ac.uk/2017/marageing2_Simm_M_2017.pdf', 'Bhadeshia, Bainite in Steels, 3rd ed. (2015), §4.4 pp. 98–99, Eq. (4.5); author PDF: https://www.phase-trans.msm.cam.ac.uk/2018/Bainite_small.pdf'],
      tags: ['age hardening', 'precipitates', 'Orowan'],
      credit: 'Mechanism comparison follows the explicit lower-resistance model discussed by Simm and coauthors (2017); numerical calibration and regular-spacing geometry here are illustrative.',
      scope: String.raw`Chosen constants: $G=26$ GPa, $b=0.286$ nm, $M=3.06$, matrix strength 60 MPa, $r_0=1.2$ nm. The assumed rate reaches 6 nm in 10 h at 190 °C, with an adjustable activation energy. These are synthetic Al-like settings, not a fit to an alloy. The spacing replaces a distribution of spherical particle intersections by one regular spacing; actual cutting laws, logarithmic line-tension corrections, size distributions, changing fraction and precipitate transformations are omitted. A coarsening law applied over the entire slider interval is an extrapolation of the toy model.`,
      verify: false,
      viz(v) {
        const fS = v.slider('volume fraction $f$ (%)', 1, 8, 3, { step: .1 });
        const TS = v.slider('aging temperature (°C)', 150, 240, 190, { step: 1 });
        const rcS = v.slider('reference crossover $r_c$ (nm, at 3%)', 3, 12, 6, { step: .5 });
        const QS = v.slider('assumed activation energy $Q$ (eV)', .8, 1.6, 1.2, { step: .05 });
        const tS = v.slider('aging time (h)', .01, 10000, 10, { log: true, decimals: 2 });
        const A = v.stage({ x: [-10, 90], y: [-30, 30], equal: true, axes: false, height: 230, full: true, title: 'schematic cutting or bypass snapshots' });
        const B = v.stage({ x: [.01, 1e4], y: [50, 1e4], xlog: true, ylog: true, axes: 'box', gutter: true, height: 320, weight: 1.3, xlabel: 'model aging time (h)', ylabel: 'tensile strength (MPa, log scale)', title: 'two assumed resistances and their lower envelope' });
        const C = v.stage({ x: [.01, 1e4], y: [0, 60], xlog: true, axes: 'box', gutter: true, height: 320, weight: .8, minWidth: 250, xlabel: 'model aging time (h)', ylabel: 'radius (nm)', title: 'assumed coarsening' });
        const point = t => agingPoint(t, fS.value / 100, TS.value, QS.value, rcS.value);
        const h = B.handle(10, point(10).s, { color: 'accent', r: 8, constrain: x => { const t = clamp(x, .01, 1e4); return [t, point(t).s]; } });
        h.onDrag = () => tS.set(clamp(h.x, .01, 1e4));
        let info;
        v.render(() => {
          const f = fS.value / 100, t = tS.value, cur = point(t), pk = agingPeak(f, TS.value, QS.value, rcS.value), first = point(.01), last = point(1e4);
          const top = AGING.matrix + Math.max(last.sh, first.orr);
          B.setView([.01, 1e4], [50, top * 1.4]);
          B.fn(x => AGING.matrix + point(x).sh, { domain: [.01, 1e4], color: 'accent', dash: true, width: 1.8 });
          B.fn(x => AGING.matrix + point(x).orr, { domain: [.01, 1e4], color: 'red', dash: true, width: 1.8 });
          B.fn(x => point(x).s, { domain: [.01, 1e4], color: 'ink', width: 3 });
          if (pk.inWindow) { B.vline(pk.t, { color: 'green', dash: true }); B.text('model peak', pk.t, 55, { color: 'green', size: 11 }); }
          h.set(t, cur.s);
          C.setView([.01, 1e4], [0, last.r * 1.15]);
          C.fn(x => point(x).r, { domain: [.01, 1e4], color: 'orange', width: 2.5 });
          if (pk.inWindow) C.vline(pk.t, { color: 'green', dash: true });
          C.vline(t, { color: 'accent', dash: true }); C.dot(t, cur.r, { color: 'accent', fill: 'accent', r: 6 });
          const r = cur.r, L = r * Math.sqrt(2 * Math.PI / (3 * f)), lam = L - 2 * r, sheared = cur.sh <= cur.orr;
          const x0 = -.6 * L, x1 = 3.6 * L, hh = (x1 - x0) * .3;
          A.setView([x0, x1], [-hh, hh]);
          A.line(x0, 0, x1, 0, { color: 'faint', dash: true });
          for (let k = 0; k < 4; k++) {
            const cx = (k + .2) * L;
            if (sheared) {
              A.curve(q => [cx + r * Math.cos(q), r * Math.sin(q)], Math.PI, 2 * Math.PI, { color: 'purple', width: 2 });
              A.line(cx - r, 0, cx + r, 0, { color: 'purple' });
              A.curve(q => [cx + .3 * r + r * Math.cos(q), r * Math.sin(q)], 0, Math.PI, { color: 'purple', width: 2 });
              A.line(cx - .7 * r, 0, cx + 1.3 * r, 0, { color: 'purple' });
            } else { A.circle(cx, 0, r, { fill: 'purple', fillAlpha: .25, color: 'purple' }); A.circle(cx, 0, 1.2 * r, { color: 'orange', width: 2 }); }
          }
          if (!sheared) for (let k = 0; k < 3; k++) { const ca = (k + .2) * L + r, cb = (k + 1.2) * L - r, R = (cb - ca) / 2; A.curve(q => [(ca + cb) / 2 + R * Math.cos(q), R * Math.sin(q)], Math.PI, 0, { color: 'accent', width: 3 }); }
          else A.line(x0, -.3 * L, x1, -.3 * L, { color: 'accent', width: 3 });
          A.text(sheared ? 'cut halves: exaggerated displacement' : 'bypass arcs and schematic residual loops', x0 + .05 * (x1 - x0), -.6 * L, { color: 'accent', size: 12, align: 'left' });
          A.text(`$r=${r.toFixed(2)}$ nm; $\\lambda=${lam.toFixed(2)}$ nm`, x1 - .03 * (x1 - x0), .85 * hh, { color: 'muted', size: 12, align: 'right' });
          info = { cur, pk, sheared };
        });
        v.legend([['accent', 'matrix + cutting resistance', { dash: true }], ['red', 'matrix + bypass resistance', { dash: true }], ['ink', 'lower envelope'], ['green', 'crossing inside the displayed interval', { dash: true }]]);
        v.readout(() => {
          if (!info) return '';
          const { cur, pk, sheared } = info;
          const status = pk.inWindow ? `Model peak ${v.fix(pk.crossoverStrength, 1)} MPa at ${v.fmt(pk.t, 4)} h and ${v.fix(pk.r, 2)} nm.` : `The crossing is ${pk.position} the displayed .01–10000 h interval; its formal time is ${v.fmt(pk.t, 4)} h. The visible maximum is ${v.fix(pk.visible.s, 1)} MPa at ${v.fmt(pk.visibleTime, 3)} h.`;
          return `Synthetic model at ${v.fmt(tS.value, 4)} h, ${TS.value} °C: radius ${v.fix(cur.r, 2)} nm; cutting increment ${v.fix(cur.sh, 1)} MPa, bypass increment ${v.fix(cur.orr, 1)} MPa; lower-envelope strength ${v.fix(cur.s, 1)} MPa (${sheared ? 'cutting' : 'bypass'}).\n${status} Temperature changes the clock, not the fixed-fraction crossing strength.`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────────────────────────────────────────── 4.10
    {
      num: '4.10',
      kind: 'Phenomenon',
      name: 'Recovery, recrystallization and grain growth',
      statement: String.raw`Annealing cold-worked metal can reduce its stored defect energy. **Recovery** includes defect annihilation and dislocation rearrangement within the deformed microstructure. **Recrystallization** replaces deformed material by grains with much lower dislocation content, driven by the stored-energy difference. **Grain growth** reduces grain-boundary energy. These processes can overlap. In an ideal self-similar, curvature-controlled growth regime, a characteristic diameter obeys $d^2-d_0^2\propto t$; this is not a guaranteed exponent of every finite lattice run.`,
      idea: String.raw`The illustration uses orientation labels $o_i$ and deformed-state indicators $f_i\in\{0,1\}$, with energy $E=\sum_{\langle i,j\rangle}[o_i\ne o_j]+E_s\sum_i f_i$ (each eight-neighbor pair counted once). A site copies a random neighbor's orientation and state only when $\Delta E\le0$. One sweep is $N^2$ random attempts with replacement. This is a zero-lattice-temperature, neighbor-copy variant: there is no physical temperature or calibrated clock. Stored energy favors strain-free material, but curvature can eliminate a small embryo. The model allows both kinds of site conversion when they lower energy.`,
      caption: String.raw`Press play or advance 40 sweeps. Grey sites retain the deformed state; bright sites are strain-free. The plots track the strain-free site fraction, an assumed normalized strength proxy, stored energy, and mean area of eight-neighbor connected orientation regions (periodic edges). Nuclei are seeded only at initialization. The decay switch reduces stored energy concurrently with boundary motion; it does not resolve the microscopic recovery mechanism.`,
      deps: ['mat-3.8', 'mat-2.7'],
      refs: ['Rollett and Manohar, Monte Carlo Modeling of Grain Growth and Recrystallization, author chapter (14 December 2003), §§4.3–4.6, Eq. (15), Eqs. (19)–(20): https://mm.math.cmu.edu/slides/Review_MonteCarlo.final.pdf', 'Bhadeshia, Metals and Alloys, Lectures 6–7, printed pp. 37–45: https://www.phase-trans.msm.cam.ac.uk/abstracts/L6-8.pdf'],
      tags: ['annealing', 'recrystallization', 'grain growth'],
      credit: 'Potts microstructure framework presented by Rollett and Manohar; neighbor-copy rule, seeded crosses and decay/proxy functions here are illustrative choices.',
      scope: String.raw`A $96\times96$ periodic square lattice with eight-neighbor boundary energy 1 per unlike pair, initial elongated Voronoi regions and five-site embryo-placement attempts. Placements may overlap. Energy is nonincreasing at each accepted update for fixed $E_s$; neither the strain-free fraction nor individual grain areas must be monotone. The optional factor $R(t)=0.4+0.6e^{-t/40}$ scales $E_s$ and the displayed proxy $\sqrt{(1-X)R}$; these are chosen functions, not measured hardness, dislocation densities or seconds. Lattice anisotropy, finite size, faceting and initialization can affect coarsening.`,
      verify: false,
      viz(v) {
        const N = 96;
        let S;
        const reset = () => { S.reset(); };
        const EsS = v.slider('stored energy $E_s$ (per site)', 0.4, 3, 1.5, { step: 0.05, onChange: reset });
        const nucS = v.slider('embryo placement attempts', 0, 300, 120, { step: 1, int: true, onChange: reset });
        const recT = v.toggle('assumed stored-energy decay', false, { onChange: reset });
        const seedS = v.slider('random seed', 1, 40, 5, { step: 1, int: true, onChange: reset });
        const DT = 1 / 30;
        const R = t => recoveryFactor(t, recT.value);
        S = v.sim(() => mcInit(N, nucS.value, seedS.value, v), (st) => {
          mcSweep(st, EsS.value * R(st.t));
        }, { dt: DT, maxSteps: 400 });
        v.button('Advance 40 sweeps', () => { for (let k = 0; k < 40; k++) mcSweep(S.state, EsS.value * R(S.state.t)); });
        const A = v.stage({ x: [0, N], y: [0, N], equal: true, axes: false, height: 380, weight: 1.05, title: 'microstructure (strain-free = bright, deformed = grey)' });
        const B = v.stage({ x: [0, 720], y: [0, 1.05], axes: 'box', gutter: true, height: 380, weight: 1.15, xlabel: 'Monte Carlo sweeps (uncalibrated)', ylabel: 'relative', title: 'site fractions and assumed proxies' });
        const C = v.stage({ x: [0, 720], y: [0, 400], axes: 'box', gutter: true, height: 230, full: true, xlabel: 'Monte Carlo steps', ylabel: 'mean grain area (sites)', title: 'mean grain area' });
        const names = ['accent', 'orange', 'green', 'teal', 'purple', 'pink', 'gold'];
        const base = names.map((n) => v.rgb(n)), grey = v.rgb('muted'), pan = v.rgb('panel');
        let info = null, lastKey = '';
        v.animate((t) => {
          S.advance(t);
          const st = S.state, o = st.o, f = st.f;
          A.raster((x, y) => {
            const i = Math.floor(y), j = Math.floor(x); if (i < 0 || j < 0 || i >= N || j >= N) return null;
            const p = i * N + j, id = o[p];
            let c = base[(id * 5 + (id >> 3)) % names.length];
            const shade = 0.82 + 0.18 * (((id * 2654435761) >>> 0) / 4294967296);
            let col;
            if (f[p]) col = [grey[0] * 0.55 + pan[0] * 0.45, grey[1] * 0.55 + pan[1] * 0.45, grey[2] * 0.55 + pan[2] * 0.45].map((q) => q * (0.85 + 0.3 * (((id * 40503) % 97) / 97) * 0.5));
            else col = [c[0] * shade, c[1] * shade, c[2] * shade];
            const edge = o[i * N + ((j + 1) % N)] !== id || o[((i + 1) % N) * N + j] !== id;
            if (edge) col = col.map((q, k) => q * 0.42 + (v.rgb('ink')[k]) * 0.1);
            return [col[0], col[1], col[2], 255];
          }, { res: 3, key: `${st.t}|${seedS.value}|${nucS.value}|${EsS.value}|${recT.value}` });
          // plots
          const h = st.hist, current = mcStats(st);
          const tmax = Math.max(720, st.t + 20);
          B.setView([0, tmax], [0, 1.05]); C.setView([0, tmax], [0, Math.max(100, N * N / current.ng, ...h.map((p) => (N * N) / p.ng)) * 1.1]);
          const rel = h.map((p) => ({ t: p.t, fx: 1 - p.fdef, rho: Math.sqrt(p.fdef * R(p.t)), er: R(p.t) * p.fdef }));
          B.path(rel.map((p) => [p.t, p.fx]), { color: 'green', width: 2.6 });
          B.path(rel.map((p) => [p.t, p.rho]), { color: 'accent', width: 2.6 });
          B.path(rel.map((p) => [p.t, p.er]), { color: 'orange', width: 2.2, dash: true });
          const last = { t: st.t, fx: 1 - current.fdef, ng: current.ng };
          B.dot(st.t, last.fx, { color: 'green', r: 3 }); C.dot(st.t, N * N / current.ng, { color: 'purple', r: 3 });
          C.path(h.map((p) => [p.t, (N * N) / p.ng]), { color: 'purple', width: 2.4 });
          info = { st, last, Es: EsS.value * R(st.t), proxy: Math.sqrt(current.fdef * R(st.t)) };
        }, { period: 24, still: 20 });
        v.legend([['green', 'recrystallized fraction'], ['accent', 'assumed normalized strength proxy'], ['orange', 'stored energy / initial per-site value', { dash: true }], ['purple', 'mean grain area']]);
        v.readout(() => {
          if (!info) return '';
          const { st, last, Es, proxy } = info;
          return `Sweep ${st.t}: ${v.fix(last.fx * 100, 1)}% strain-free sites; assumed normalized strength proxy ${v.fix(proxy, 3)}; stored energy per deformed site ${v.fix(Es, 2)}; ${last.ng} eight-neighbor orientation regions, mean area ${v.fix((N * N) / last.ng, 1)} sites.\n${nucS.value === 0 ? 'No strain-free embryos were seeded; neighbor copying cannot create that state.' : 'Seeded embryos can grow, shrink or disappear; this run does not establish a universal nucleation threshold or growth exponent.'} Plotted samples occur every four sweeps, with current-state markers. No HV calibration or physical-time conversion is assumed.`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────────────────────────────────────────── 4.11
    {
      num: '4.11',
      kind: 'Method',
      name: 'Hardness testing and Tabor’s relation',
      statement: String.raw`Indentation tests define hardness through a specified geometry and loading procedure. With load $P$ in kgf and dimensions in mm, the conventional numbers are $$\mathrm{HB}=\frac{2P}{\pi D(D-\sqrt{D^2-d^2})},\qquad \mathrm{HV}=\frac{2P\sin68^\circ}{d^2}\approx1.8544P/d^2,$$ using ball diameter $D$, residual impression diameter $d$ for Brinell, and mean residual diagonal $d$ for a 136° Vickers pyramid. These use curved/sloping areas, unlike the mean **projected-area pressure** $p_m=P_N/A_{\rm proj}$ in MPa. Rockwell C instead uses two depth readings under the same preliminary force: $\mathrm{HRC}=100-\Delta h/(0.002\,\mathrm{mm})$.`,
      idea: String.raw`In a fully plastic approximation, $p_m\approx C\sigma(\varepsilon_r)$, with a constraint factor of order three. The demonstration chooses $C=3$ and $\sigma(\varepsilon_p)=\sigma_{\rm ref}(\varepsilon_p/0.002)^n$. For a ball, the chosen representative strain is $\varepsilon_r=0.2a/R=0.2d/D$, with contact radius $a$ and ball radius $R=D/2$; for the sharp pyramid it is fixed at 0.08. These empirical choices are not universal material inversions. Solving $P_N=p_m A_{\rm proj}$ predicts an ideal contact size. Rockwell depth difference is entered separately: it cannot be obtained from the Vickers depth formula.`,
      caption: String.raw`For Brinell or Vickers, choose a force, reference flow stress and exponent. The drawings show ideal contact geometry with elastic recovery neglected; the curve recomputes the contact solution for every exponent. A ball contact beyond its hemisphere is explicitly unsupported. In Rockwell mode, enter the measured differential depth: the two readings are under 10 kgf, before and after a 150 kgf total-force cycle. The diagrams show the procedure and scale arithmetic, not an elastic-plastic penetration simulation.`,
      deps: ['mat-4.3', 'mat-4.5'],
      refs: ['Low, NIST SP 960-5 (2001), §§2.2–2.4, Table 1, Fig. 1, §3.3.8.1: https://nvlpubs.nist.gov/nistpubs/Legacy/SP/nistspecialpublication960-5.pdf', 'NIST SRM 1896a certificate, p. 2 Eq. (1), Vickers geometry and kgf/mm² definition: https://tsapps.nist.gov/srmext/certificates/archives/1896a.pdf', 'Gabauer, UNCERT CoP 14 (2000), §1 pp. 1–2: https://www.npl.co.uk/getmedia/dd265533-ce7b-4613-9227-ad3035d5a48a/cop14.pdf', 'Chang et al., Advances in Materials Science and Engineering (2018), §2.1 Eqs. (1)–(6): https://oa.upm.es/87018/1/5496395.pdf'],
      tags: ['hardness', 'indentation', 'Tabor'],
      credit: 'Test definitions follow the cited NIST and UNCERT presentations; the Tabor-type representative-stress approximation and its limitations are discussed by Chang and coauthors (2018).',
      scope: String.raw`Synthetic rigid-plastic model, $C=3$, ball diameter 10 mm; pile-up, sink-in, elastic recovery, specimen thickness, indentation size effects and the elastic-to-plastic transition are omitted. The reference stress is defined at plastic strain 0.002. Its power law and the selected representative strains are extrapolated over the slider range. A computed contact size is treated as a residual size only under this zero-recovery assumption. HB and HV numbers use the conventional kgf/mm² normalization; multiply by 9.80665 to express the corresponding area-based pressure in MPa. HRC is dimensionless, depends on the specified loading/depth cycle, and has no modeled conversion to HB, HV or tensile strength here. The Rockwell arithmetic slider extends beyond typical working ranges and does not certify test applicability.`,
      verify: false,
      viz(v) {
        const test = v.select('test', [{ value: 'brinell', label: 'Brinell (10 mm ball)' }, { value: 'vickers', label: 'Vickers (136° pyramid)' }, { value: 'rockwell', label: 'Rockwell C (depth cycle)' }], 'vickers', { onChange: id => { if (id !== 'rockwell') P.set(id === 'brinell' ? 3000 : 30); } });
        const s0S = v.slider('reference flow stress $\\sigma_{\\rm ref}$ (MPa)', 50, 1800, 250, { step: 5 });
        const nS = v.slider('hardening exponent $n$', 0, .5, .2, { step: .01 });
        const P = v.slider('force $P$ (kgf)', 1, 3000, 30, { log: true, decimals: 0 });
        const hS = v.slider('measured differential depth $\\Delta h$ (µm)', 0, 240, 100, { step: 1 });
        const A = v.stage({ x: [-1, 1], y: [-1, 1], equal: false, aspect: 1, axes: false, height: 290, weight: 1, minWidth: 240, title: 'contact outline / Rockwell force cycle' });
        const B = v.stage({ x: [-1, 1], y: [-1, 1], equal: false, aspect: 1, axes: false, height: 290, weight: 1, minWidth: 240, title: 'ideal section / Rockwell datum readings' });
        const C = v.stage({ x: [0, .5], y: [0, 20], axes: 'box', gutter: true, height: 290, weight: 1, minWidth: 250, xlabel: 'hardening exponent', ylabel: '$p_m/\\sigma_{\\rm ref}$', title: 'model response / depth scale' });
        const hC = C.handle(.2, 3, { color: 'accent', r: 7, constrain: 'x' });
        hC.onDrag = () => { if (test.value === 'rockwell') hS.set(Math.round(clamp(hC.x, 0, 240))); else nS.set(Math.round(clamp(hC.x, 0, .5) * 100) / 100); };
        let info;
        v.render(() => {
          const tt = test.value, rw = tt === 'rockwell';
          P.el.hidden = rw; s0S.el.hidden = rw; nS.el.hidden = rw; hS.el.hidden = !rw;
          hC.visible = true;
          if (rw) {
            const dh = hS.value, HRC = rockwellC(dh / 1000);
            A.setView([-1, 9], [-50, 200]);
            A.path([[0,0],[1,10],[3,10],[4,150],[5,150],[6,10],[8,10]], { color: 'accent', width: 3 });
            A.text('150 kgf total', 4.5, 175, { size: 12, align: 'center' }); A.text('10 kgf at both readings', 4, -25, { size: 11, align: 'center' });
            A.dot(3,10,{ color:'red',r:5 }); A.dot(8,10,{ color:'red',r:5 });
            B.setView([-1, 9], [-280, 70]);
            B.line(0,0,4,0,{color:'accent',width:2}); B.line(5,-dh,8,-dh,{color:'green',width:2});
            B.dot(3,0,{color:'accent',r:5}); B.dot(8,-dh,{color:'green',r:5});
            B.text('initial datum = 0', 2, 35, {size:11,align:'center'}); B.text('final reading',6.5,-dh-25,{size:11,align:'center'});
            B.arrow(4.5,0,4.5,-dh,{color:'red',both:true,head:5}); B.text(`$\\Delta h=${dh.toFixed(0)}$ µm`, 4, -260, {color:'red',size:12,align:'center'});
            C.setLabels('differential depth (µm)', 'HRC (dimensionless)'); C.setView([0,240],[-25,105]);
            C.fn(x => rockwellC(x/1000), {domain:[0,240],color:'ink',width:2.6}); hC.set(dh,HRC);
            info = { rw, dh, HRC }; return;
          }
          const r = indentation(tt,s0S.value,nS.value,P.value);
          const lo = tt === 'brinell' ? Math.max(0,minimumBallExponent(s0S.value,P.value)) : 0;
          const data = [];
          if (lo <= .5) for (let j=0;j<=150;j++) { const n=lo+(.5-lo)*j/150, q=indentation(tt,s0S.value,n,P.value); if(q.ok)data.push([n,q.ratio]); }
          C.setLabels('hardening exponent $n$', '$p_m/\\sigma_{\\rm ref}$'); C.setView([0,.5],[0,Math.max(4,...data.map(p=>p[1]))*1.15]);
          C.path(data,{color:'ink',width:2.6}); C.hline(3,{color:'red',dash:true});
          C.text('chosen C = 3', .49, 3.25, {color:'red',size:11,align:'right'});
          hC.visible = r.ok;
          if(!r.ok){
            A.setView([-1,1],[-1,1]); B.setView([-1,1],[-1,1]);
            A.text('No ball contact solution',0,.25,{color:'red',size:12,align:'center'}); A.text('within the hemisphere',0,-.05,{color:'red',size:12,align:'center'});
            B.text('Lower force or',0,.15,{size:12,align:'center'}); B.text('raise reference stress',0,-.15,{size:12,align:'center'});
            info={rw,r};return;
          }
          hC.set(nS.value,r.ratio);
          const half = (tt === 'brinell' ? r.a : r.d/2)*1.65;
          A.setView([-half,half],[-half,half]); B.setView([-half,half],[-half,half]);
          if(tt==='brinell') {
            A.circle(0,0,r.a,{fill:'accent',fillAlpha:.18,color:'accent',width:2.5});
            A.arrow(-r.a,-.25*half,r.a,-.25*half,{both:true,color:'red',head:5});
            A.text(`$d=${r.d.toFixed(3)}$ mm`,0,-.5*half,{color:'red',size:12,align:'center'});
            const angle=Math.asin(Math.min(1,r.a/r.R));
            B.curve(q=>[r.R*Math.sin(q),r.R-r.h-r.R*Math.cos(q)],-angle,angle,{n:60,color:'accent',width:3});
          } else {
            const a=r.d/2;
            A.poly([[a,0],[0,a],[-a,0],[0,-a]],{fill:'accent',fillAlpha:.18,color:'accent',width:2.5});
            A.arrow(-a,0,a,0,{both:true,color:'red',head:5}); A.text(`$d=${r.d.toFixed(3)}$ mm`,0,-.5*half,{color:'red',size:12,align:'center'});
            B.path([[-r.hw,0],[0,-r.h],[r.hw,0]],{color:'accent',width:3});
          }
          B.hline(0,{color:'muted'});
          B.arrow(half*.85,0,half*.85,-r.h,{both:true,color:'red',head:5});
          B.text(`$h=${r.h.toFixed(4)}$ mm`,0,-Math.max(r.h*1.25,half*.4),{color:'red',size:12,align:'center'});
          B.text(tt==='vickers'?'section through opposite face midpoints':'contact arc only; rest of ball omitted',0,half*.27,{size:10.5,color:'muted',align:'center'});
          info={rw,r,tt};
        });
        v.readout(() => {
          if(!info)return '';
          if(info.rw)return `Differential depth ${v.fix(info.dh,0)} µm = ${v.fix(info.dh/1000,3)} mm; HRC = ${v.fix(info.HRC,1)}. Both depth readings use 10 kgf, with 150 kgf total force applied between them. This is entered depth data, not a prediction from the flow-stress sliders; cycle timings are schematic. The arithmetic is not clamped to a working range.`;
          const {r,tt}=info;
          if(!r.ok)return `Unsupported ball-contact geometry: the model requires radius ${v.fix(r.requiredRadius,3)} mm > ball radius ${v.fix(r.R,1)} mm. No HB, depth or pressure prediction is reported. The exponent curve shows only the subset with a contact inside the hemisphere.`;
          const number=tt==='brinell'?`HB = ${v.fix(r.HB,1)}`:`HV = ${v.fix(r.HV,1)}`;
          return `Chosen representative strain ${v.fix(r.er,4)}, projected-area pressure ${v.fix(r.pm,1)} MPa = ${v.fix(r.ratio,3)} times the reference stress. ${number} (conventional kgf/mm² normalization); corresponding curved/sloping-area pressure ${v.fix((tt==='brinell'?r.HB:r.HV)*INDENT.g,1)} MPa.\nIdeal ${tt==='brinell'?'diameter':'diagonal'} ${v.fix(r.d,4)} mm and depth ${v.fix(r.h,4)} mm assume no elastic recovery. The curve recomputes contact size at each exponent. No Rockwell or tensile-strength conversion is inferred.`;
        });
      },
    },
  ],
};
