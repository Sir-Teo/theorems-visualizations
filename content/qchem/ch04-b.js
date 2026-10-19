// Quantum Chemistry & Spectroscopy — Chapter 4, part b: items 4.7–4.12 (4.1–4.6 are in ch04.js)
import { HARTREE_EV, A0_ANG, KB_MEV, IE, radialLevels, boxMatrix, boxX, goldenMin } from './ch04.shared.js';

import { gaussianEnergy, gaussianPartial, gaussianOptimum, virialPotential, virialState, crossingState } from './qchem-source-audit-identities.shared.js';

import { drudeEnergy, drudeCovariance, PAIR_EPS, PAIR_SIG, PAIR_RM, pairPotential, pairC6, exp6Core, pairB2, pairBoyle } from './qchem-source-audit-dispersion.shared.js';

import { squareBasis, squareWave } from './qchem-source-audit-perturbation.shared.js';

const EBOX = (n) => (n * n * Math.PI * Math.PI) / 2;       // box [0,1], ħ = m = 1

export default {
  collection: 'qchem',
  chapter: 4,
  items: [
    // ------------------------------------------------------------------ 4.7
    {
      num: '4.7',
      kind: 'Method',
      name: 'Degenerate perturbation theory',
      credit: 'Degenerate perturbation method; projection derivation: Fitzpatrick, Quantum Mechanics, §12.6, pp. 160–162',
      statement: String.raw`Let $H_0$ be self-adjoint with an isolated eigenvalue $E_0$ of finite multiplicity $g$, and let $P$ project onto that eigenspace. Suppose $H(\lambda)=H_0+\lambda W$ has differentiable eigenvalue branches near zero (for example, a bounded self-adjoint perturbation of a discrete level). The first derivatives $E_i'(0)$ are the eigenvalues $w_i$ of the **projected** Hermitian matrix $PWP$. The zeroth-order vectors are its orthonormal eigenvectors within the $E_0$ subspace, and $E_i(\lambda)=E_0+\lambda w_i+o(\lambda)$. A smooth analytic perturbation gives the usual $O(\lambda^2)$ remainder.`,
      scope: String.raw`Diagonalize the whole degenerate block before using denominators only for states outside it. A repeated first-order root does not select a unique basis; further effective perturbation is needed if higher orders split it. No invertibility of $PWP$ is required: zero first-order shifts are valid. Its eigenvectors are eigenvectors of the projection, not necessarily of the full perturbation operator. Strong finite couplings need not follow first-order formulas.`,
      idea: String.raw`In the degenerate subspace $H^{(0)}$ acts as a multiple of the identity, so any combination is a legitimate zeroth-order state and the perturbation decides which one the true eigenstate approaches as $\lambda\to0$. Projecting $(H^{(0)}+\lambda W)\psi=E\psi$ onto the subspace at order $\lambda$ gives $\sum_b(W_{ab}-w\,\delta_{ab})c_b=0$: the eigenproblem of a small Hermitian matrix (1.3 guarantees real $w$ and orthogonal $c$), the same secular determinant as in the linear variation method (4.2) restricted to the degenerate block.`,
      caption: String.raw`**One particle** in a two-dimensional unit square, $\hbar=m=1$. States $(1,2)$ and $(2,1)$ share $E_0=5\pi^2/2$. Dashed orange slopes come from their exact $2\times2$ perturbation block. Solid lines are Galerkin eigenvalues in a basis of 36 functions; at each strength, the two states with greatest weight in the original two-state subspace are selected and ordered by energy. This overlap rule is a numerical branch selector, not a theorem about all strong-coupling levels. The wavefunction includes all 36 coefficients and its color scale is normalized to its sampled maximum. For $xy$, first-order shifts share the mean $\lambda/4$ and split by $\pm\lambda|W_{12,21}|$; mixing by 45° is in **state-coefficient space**, not a literal spatial rotation of the square. For $x^2$ the block is diagonal; for $x$ it is proportional to the identity and does not split at first order.`,
      deps: ['qchem-4.4', 'qchem-1.6', 'qm-11.4'],
      see: ['qm-11.4'],
      refs: ['Fitzpatrick, Quantum Mechanics, §12.6, pp. 160–162, equations (12.87)–(12.102); interpret H1 as its projection in the degenerate block'],
      tags: ['degenerate perturbation theory', 'mixing', 'square box'],
      verify: false,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Perturbation_theory_(quantum_mechanics)#Degenerate_energy_levels' },
      viz(v) {
        const M=v.M,N=6,LMAX=60,B=squareBasis(M,N),{P,Q,energy:E0,W:Wm,pair}=B;
        const kindS = v.select('perturbation $W$', [{ value: 'xy', label: '$xy$' }, { value: 'x2', label: '$x^2$' }, { value: 'x', label: '$x$' }], 'xy');
        const lamS = v.slider('strength $\\lambda$', 0, LMAX, 30, { step: 0.5 });
        const showS = v.select('wavefunction', [{ value: 'lo', label: 'lower finite-basis' }, { value: 'hi', label: 'upper finite-basis' }, { value: 'p', label: 'unperturbed $\\psi_{12}$' }], 'lo');
        const sL = v.stage({ x: [0, LMAX], y: [-8, 8], axes: 'box', gutter: true, height: 330, weight: 1.1, xlabel: 'λ', ylabel: 'E − 5π²/2', title: 'the degenerate pair' });
        const sH = v.stage({ x: [0, 1], y: [0, 1], equal: true, axes: 'box', gutter: true, height: 330, weight: 0.9, xlabel: 'x', ylabel: 'y', title: 'wavefunction ψ(x, y)' });
        const cache = {}; const curves = (kind) => cache[kind] ||= Array.from({ length: 31 }, (_, i) => { const l = (LMAX * i) / 30; return [l, pair(kind, l).E]; });
        const phi = (n, x) => Math.SQRT2 * Math.sin(n * Math.PI * x);
        let info = null;
        v.render(() => {
          const kind = kindS.value, lam = lamS.value, cv = curves(kind), pr = pair(kind, lam), e0 = E0[P];
          const wpp = Wm[kind][P][P], wqq = Wm[kind][Q][Q], wpq = Wm[kind][P][Q];
          const mid = (wpp + wqq) / 2, half = Math.hypot((wpp - wqq) / 2, wpq);
                    const ys=[0,...cv.flatMap(q=>q[1].map(e=>e-e0)),...pr.E.map(e=>e-e0),LMAX*wpp,LMAX*wqq,LMAX*(mid-half),LMAX*(mid+half)],yl=Math.min(...ys),yh=Math.max(...ys);sL.setView([-2,LMAX+2],[yl-.08*(yh-yl)-.1,yh+.08*(yh-yl)+.1]);
          sL.hline(0, { color: 'faint' });
          sL.line(0, 0, LMAX, LMAX * wpp, { color: 'muted', dash: [2, 4], width: 1.4 });
          sL.line(0, 0, LMAX, LMAX * wqq, { color: 'muted', dash: [2, 4], width: 1.4 });
          sL.line(0, 0, LMAX, LMAX * (mid - half), { color: 'orange', dash: true, width: 1.8 });
          sL.line(0, 0, LMAX, LMAX * (mid + half), { color: 'orange', dash: true, width: 1.8 });
          for (let j = 0; j < 2; j++) sL.path(cv.map((q) => [q[0], q[1][j] - e0]), { color: j ? 'accent' : 'green', width: 2.5 });
          sL.vline(lam, { color: 'gold', dash: true });
          sL.dot(lam, pr.E[0] - e0, { r: 6, color: 'green' }); sL.dot(lam, pr.E[1] - e0, { r: 6, color: 'accent' });
          // wavefunction
          const sel = showS.value;
          const c=sel==='p'?Array.from({length:N*N},(_,i)=>i===P?1:0):pr.c[sel==='lo'?0:1],wave=(x,y)=>squareWave(c,N,x,y);let peak=1e-12;for(let i=0;i<=60;i++)for(let j=0;j<=60;j++)peak=Math.max(peak,Math.abs(wave(i/60,j/60)));
          sH.heat((x,y)=>wave(x,y)/peak,{range:[-1,1],cmap:'theme-diverging',neg:'orange',pos:'accent',res:3,key:`${kind},${lam},${sel},${v.rgb('panel').join(',')}`});
          const cp = sel === 'p' ? 1 : (pr.c[sel === 'lo' ? 0 : 1][P]), cq = sel === 'p' ? 0 : (pr.c[sel === 'lo' ? 0 : 1][Q]);
          info = { kind, lam, wpp, wqq, wpq, split: pr.E[1] - pr.E[0], pred: 2 * half * lam, cp, cq, sel, weight: pr.weight };
        });
        v.legend([['green', 'finite-basis lower'], ['accent', 'finite-basis upper'], ['orange', 'degenerate first order', { dash: true }], ['muted', 'naive $\\lambda W_{aa}$', { dash: [2, 4] }]]);
        v.readout(() => info && `block $W=\\begin{pmatrix}${v.fix(info.wpp, 4)}&${v.fix(info.wpq, 4)}\\\\${v.fix(info.wpq, 4)}&${v.fix(info.wqq, 4)}\\end{pmatrix}$ in the basis $(\\psi_{12},\\psi_{21})$ · predicted splitting $2\\lambda\\sqrt{((W_{11}-W_{22})/2)^2+W_{12}^2}=${v.fix(info.pred, 3)}$, finite-basis $${v.fix(info.split, 3)}$\nsubspace weights ${v.fix(info.weight[0],3)}, ${v.fix(info.weight[1],3)} · the state drawn has coefficients $(c_{12},c_{21})=(${v.fix(info.cp, 3)},${v.fix(info.cq, 3)})$ · ordinary second order would contain $|W_{12}|^2/(E^{(0)}-E^{(0)})=${Math.abs(info.wpq) > 1e-6 ? `${v.fix(info.wpq ** 2, 4)}/0\\to\\infty` : '0/0 (no coupling)'}$`);
      },
    },
    // ------------------------------------------------------------------ 4.8
    {
      num: '4.8',
      kind: 'Theorem',
      name: 'Hellmann–Feynman theorem',
      credit: 'Hellmann–Feynman theorem; original force derivation: Feynman, Forces in Molecules, Physical Review 56 (1939), 340–343',
      statement: String.raw`For a differentiable self-adjoint Hamiltonian family and a differentiable normalized eigenstate branch in a common admissible domain, $H(\lambda)\psi(\lambda)=E(\lambda)\psi(\lambda)$,
$$E'(\lambda)=\langle\psi|\partial_\lambda H|\psi\rangle.$$
The same derivative identity holds for a differentiable variational optimum in a parameter-independent trial family. For a fixed-nuclei Coulomb Hamiltonian including nuclear repulsion, the physical nuclear force is $-\nabla_AE=-\langle\nabla_AH\rangle$: the classical electrostatic force from the other nuclei and electron charge density.`,
      scope: String.raw`A normalized trial branch has an additional term $2\operatorname{Re}\langle\psi'|(H-E)\psi\rangle$. Eigenstates make it vanish; stationarity over every parameter through which the trial state moves also suffices. Stationarity is not necessary: a frozen trial state has $\psi'=0$, so the identity holds for its own energy even when it is inaccurate. A parameter-dependent incomplete basis can add basis-derivative (Pulay) terms. Degeneracies require a differentiable eigenbranch, not an arbitrary discontinuously chosen eigenvector.`,
      idea: String.raw`Differentiate $E=\langle\psi|H|\psi\rangle$ with $\langle\psi|\psi\rangle=1$ (differentiation under the integral sign, pma-9.42): $E'=\langle\psi|H'|\psi\rangle+\langle\psi'|H|\psi\rangle+\langle\psi|H|\psi'\rangle=\langle H'\rangle+E\,\frac{d}{d\lambda}\langle\psi|\psi\rangle=\langle H'\rangle$, because $H\psi=E\psi$ makes the two extra terms multiples of $\langle\psi'|\psi\rangle+\langle\psi|\psi'\rangle=0$. For a stationary trial function the same cancellation holds with $\partial E/\partial c_i=0$.`,
      caption: String.raw`A harmonic or quartic oscillator, in $\hbar=m=1$ units. Blue is a finite-difference energy reference, with a green tangent from the same numerical state. At the ground level, orange is the optimized Gaussian and red is a fixed-width Gaussian. Each tangent is anchored to its own energy curve: both Gaussian derivatives obey the displayed expectation identity, although the fixed-width energy and slope can differ from the true answer. A frozen nonstationary state is therefore not a counterexample. The readout gives the actual numerical derivative residual, using a one-sided secant at parameter endpoints. Density is normalized on the computational box $[-7,7]$ and displayed on $[-4,4]$.`,
      deps: ['qchem-1.3', 'pma-9.42', 'qm-11.7'],
      see: ['qm-11.7', 'qchem-4.6'],
      refs: ['Feynman, Forces in Molecules (1939), pp. 340–343, full proof on p. 341 and Coulomb reduction on p. 342'],
      tags: ['Hellmann–Feynman', 'forces', 'derivative of energy'],
      verify: false,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Hellmann%E2%80%93Feynman_theorem' },
      viz(v) {
        const M = v.M;
        const sysS = v.select('parameter', [{ value: 'w', label: 'frequency $\\omega$ in $\\tfrac12\\omega^2x^2$' }, { value: 'l', label: 'quartic $\\lambda$ in $\\tfrac12x^2+\\lambda x^4$' }], 'w');
        const nS = v.select('level $n$', [0, 1, 2].map((n) => ({ value: n, label: String(n) })), 0);
        const pw = v.slider('parameter $\\omega$', 0.5, 2.5, 1.4, { step: 0.01 }), pl = v.slider('parameter $\\lambda$', 0, 1.5, 0.6, { step: 0.01 });
        const sf = v.slider('frozen trial width $s_0$', 0.3, 4, 1.0, { step: 0.01 });
        const upd = () => { pw.el.hidden = sysS.value !== 'w'; pl.el.hidden = sysS.value !== 'l'; };
        const sE = v.stage({ x: [0, 1], y: [0, 1], axes: 'box', gutter: true, height: 330, weight: 1.1, xlabel: 'parameter', ylabel: 'energy', title: 'E(parameter) and tangents' });
        const sP = v.stage({ x: [-4, 4], y: [0, 1], axes: 'box', gutter: true, height: 330, weight: 0.9, xlabel: 'x', ylabel: '|ψ|²', title: 'states at this parameter' });
        const pot = (sys, p) => (x) => (sys === 'w' ? 0.5 * p * p * x * x : 0.5 * x * x + p * x ** 4);
        const dH = (sys, p, x) => (sys === 'w' ? p * x * x : x ** 4);                // ∂H/∂p
        const solve = (sys, p, k = 3) => M.schrodinger1D(pot(sys, p), [-7, 7], { n: 560, k });
        const Et = gaussianEnergy, dEt = gaussianPartial, sOpt = gaussianOptimum;
        const exp = (sol, k, f) => { let t = 0; for (let i = 0; i < sol.x.length; i++) t += sol.psi[k][i] ** 2 * f(sol.x[i]); return t * (sol.x[1] - sol.x[0]); };
        const curveCache = {};
        const curve = (sys, k) => curveCache[sys + k] ||= (() => { const lo = sys === 'w' ? 0.5 : 0, hi = sys === 'w' ? 2.5 : 1.5, pts = []; for (let i = 0; i <= 40; i++) { const p = lo + ((hi - lo) * i) / 40; pts.push([p, solve(sys, p, k + 1).E[k]]); } return pts; })();
        let info = null;
        v.render(() => {
          upd();
          const sys = sysS.value, k = +nS.value, p = (sys === 'w' ? pw : pl).value, lo = sys === 'w' ? 0.5 : 0, hi = sys === 'w' ? 2.5 : 1.5, s0 = sf.value;
          const pts = curve(sys, k), sol = solve(sys, p, k + 1), E = sol.E[k], slopeExact = exp(sol, k, x => dH(sys, p, x)), so = sOpt(sys, p);
          const d = .22 * (hi-lo), xl = Math.max(lo,p-d), xr = Math.min(hi,p+d), tang = (e,m) => [[xl,e+(xl-p)*m],[xr,e+(xr-p)*m]];
          const opt = k===0 ? Array.from({length:61},(_,i)=>{const x=lo+(hi-lo)*i/60;return[x,Et(sys,x,sOpt(sys,x))];}) : [];
          const frozen = k===0 ? opt.map(([x])=>[x,Et(sys,x,s0)]) : [];
          const yt = [...pts,...opt,...frozen,...tang(E,slopeExact),...(k===0?[...tang(Et(sys,p,so),dEt(sys,p,so)),...tang(Et(sys,p,s0),dEt(sys,p,s0))]:[])].map(q=>q[1]);
          const yl=Math.min(...yt), yh=Math.max(...yt), pad=.08*(yh-yl);
          sE.setView([lo-.04*(hi-lo),hi+.04*(hi-lo)], [yl-pad,yh+pad]);sE.setLabels(sys==='w'?'ω':'λ','E');
          sE.path(pts,{color:'accent',width:2.6});
          if(k===0){sE.path(opt,{color:'orange',dash:true,width:1.8});sE.path(frozen,{color:'red',dash:[2,3],width:1.5});sE.path(tang(Et(sys,p,so),dEt(sys,p,so)),{color:'orange',width:1.8});sE.path(tang(Et(sys,p,s0),dEt(sys,p,s0)),{color:'red',width:1.8});}
          sE.path(tang(E,slopeExact),{color:'green',width:2.6});sE.dot(p,E,{r:6,color:'accent'});
          // state panel
          sP.setView([-4, 4], [0, 1.15 * Math.max(.9, ...Array.from(sol.psi[k], y => y*y), ...(k===0?[Math.sqrt(so/Math.PI),Math.sqrt(s0/Math.PI)]:[]))]);
          sP.path(Array.from(sol.x, (x, i) => [x, sol.psi[k][i] ** 2]).filter(q=>Math.abs(q[0])<=4), { color: 'accent', width: 2.4 });
          if (k === 0) {
            const g = (s) => (x) => Math.sqrt(s / Math.PI) * Math.exp(-s * x * x);
            sP.fn(g(so), { color: 'orange', dash: true, width: 1.8 }); sP.fn(g(s0), { color: 'red', dash: [2, 3], width: 1.5 });
          }
          const h = 0.01, fd = (solve(sys, Math.min(hi, p + h), k + 1).E[k] - solve(sys, Math.max(lo, p - h), k + 1).E[k]) / (Math.min(hi, p + h) - Math.max(lo, p - h));
          info = { sys, k, p, E, slopeExact, fd, so, s0, eo: Et(sys, p, so), dopt: dEt(sys, p, so), dfr: dEt(sys, p, s0) };
        });
        v.legend([['accent', 'finite-difference reference'], ['green', 'tangent from numerical state'], ['orange', 'optimised Gaussian', { dash: true }], ['red', 'frozen-width Gaussian', { dash: [2, 3] }]]);
        v.readout(() => info && String.raw`numerical reference: secant $dE/dp=${v.fix(info.fd,4)}$, state expectation $\langle\partial_pH\rangle=${v.fix(info.slopeExact,4)}$, difference ${v.fix(info.fd-info.slopeExact,6)}` + (info.k===0 ? '\n' + String.raw`optimized Gaussian $s=${v.fix(info.so,3)}$, $E=${v.fix(info.eo,4)}$: own-curve slope ${v.fix(info.dopt,4)}; frozen width $s_0=${v.fix(info.s0,2)}$: own-curve slope ${v.fix(info.dfr,4)}, difference from reference slope ${v.fix(info.dfr-info.slopeExact,4)}. Both trial derivatives obey the expectation identity.` : '\nGaussian trials are hidden for excited levels.'));
      },
    },
    // ------------------------------------------------------------------ 4.9
    {
      num: '4.9',
      kind: 'Theorem',
      name: 'Quantum virial theorem',
      credit: 'Quantum virial theorem; complete scaling proof: Tong, Topics in Quantum Mechanics (2017), §2.1.3',
      statement: String.raw`For a normalized stationary bound state of $H=\mathbf p^2/(2m)+V$ in infinite space, suppose dilation is an admissible differentiable variation and all required expectations exist. Then
$$2\langle T\rangle=\langle\mathbf r\cdot\nabla V\rangle.$$
If $V$ is homogeneous of degree $s\ne0$, $2\langle T\rangle=s\langle V\rangle$ and $E=(s+2)\langle V\rangle/2$. For Coulomb, $\langle T\rangle=-E$ and $\langle V\rangle=2E$; for an oscillator, $\langle T\rangle=\langle V\rangle=E/2$. A logarithmic potential is a separate case, $rV'=1$, not a homogeneous potential with $s=0$.`,
      scope: String.raw`The boundary/domain conditions matter: a hard-wall box has a boundary pressure term, and nonnormalizable scattering states do not satisfy this bound-state argument. For a stationary electronic state at fixed nuclei, include nuclear repulsion in $V$ and set $\mathbf F_A=-\nabla_AE$. Coulomb homogeneity gives $2\langle T\rangle+\langle V\rangle=-\sum_A\mathbf R_A\cdot\nabla_AE=\sum_A\mathbf R_A\cdot\mathbf F_A$. Thus equilibrium forces imply zero; zero scalar virial alone does not prove every force is zero.`,
      idea: String.raw`For $\psi_a(\mathbf r)=a^{3/2}\psi(a\mathbf r)$, the kinetic term scales as $a^2$ while the potential expectation is $\int|\psi(\mathbf y)|^2V(\mathbf y/a)\,d\mathbf y$. Its derivative at $a=1$ is $-\langle\mathbf r\cdot\nabla V\rangle$. Stationarity therefore gives the result. Homogeneity supplies $\mathbf r\cdot\nabla V=sV$. For fixed Coulomb nuclei, Euler's identity for simultaneous electronic and nuclear scaling gives $\sum_i\mathbf r_i\cdot\nabla_iV+\sum_A\mathbf R_A\cdot\nabla_AV=-V$; combine this with the electronic virial and Hellmann–Feynman to obtain the stated nuclear-force sign.`,
      caption: String.raw`Radial $s$-wave finite-difference states with $\hbar=m=1$, $V=\operatorname{sgn}(s)r^s$ for $s\ne0$, and $V=\ln r$ at zero. The computational box has a remote Dirichlet wall. The density is rescaled above its energy and displayed through 99.5% of its radial probability; it is normalized on the full computational box. Bars show independently computed finite-grid kinetic/potential expectations and the eigenvalue. The readout reports the actual virial residual and outer-10%-box probability, rather than declaring exact equality. Right: numerical ground-state ratios and the infinite-space line $s/2$; the log case has no $s/2$ ratio prediction.`,
      deps: ['qchem-4.8', 'mech-8.16'],
      see: ['mech-8.16', 'qchem-4.3'],
      refs: ['Tong, Topics in Quantum Mechanics (2017), §2.1.3, pp. 33–34, equations (2.8)–(2.9)', 'Leon van Dommelen, Quantum Mechanics for Engineers, Appendix A.17, complete scaling proof and boundary qualification', 'Feynman (1939), p. 341, nuclear energy derivatives'],
      tags: ['virial theorem', 'kinetic and potential energy', 'scaling'],
      verify: false,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Virial_theorem' },
      viz(v) {
        const M = v.M;
        const sS = v.slider('exponent $s$ in $V\\propto r^s$ ($s=0$: $\\ln r$)', -1, 4, -1, { step: 0.25 });
        const nS = v.select('level', [{ value: 0, label: '1s' }, { value: 1, label: '2s' }, { value: 2, label: '3s' }], 0);
        const pot = virialPotential, solve = (s,k) => virialState(M,s,k);
        const sP = v.stage({ x: [0, 10], y: [-2, 4], axes: 'box', gutter: true, height: 320, weight: 1.1, xlabel: 'r', ylabel: 'energy', title: 'potential, level and u²' });
        const sB = v.stage({ x: [0.5, 5.5], y: [-2, 2], axes: 'box', gutter: true, height: 320, weight: 0.9, xlabel: '', ylabel: 'energy', title: 'the pieces', xticks: [[1, '⟨T⟩'], [2, '⟨V⟩'], [3, 'E'], [4, '2⟨T⟩'], [5, '⟨rV′⟩']] });
        const sR = v.stage({ x: [-1.2, 4.2], y: [-1.5, 2.5], axes: 'box', gutter: true, height: 320, weight: 0.9, xlabel: 'exponent s', ylabel: '⟨T⟩ / ⟨V⟩', title: 'ratio against the exponent' });
        const ratios = []; for (let s = -1; s <= 4.001; s += 0.5) if (Math.abs(s) > 1e-9) { const st = solve(s,0); ratios.push([s, st.T / st.V]); }
        let info = null;
        v.render(() => {
          const s = sS.value, k = +nS.value, sol = solve(s,k), st = sol, V = pot(s);
          const rr = (i) => (i + 1) * sol.h, u = sol.u;
          let rmx = 0, acc = 0; for (let i = 0; i < u.length; i++) { acc += u[i] * u[i] * sol.h; if (acc > 0.995) { rmx = rr(i); break; } }
          const R = Math.max(2, rmx * 1.1), emin = Math.min(st.E, V(0.3)) - 0.3, emax = st.E + 0.3 * Math.abs(st.E) + 1.5;
          sP.setView([0, R], [Math.max(emin, st.E - 2 * Math.abs(st.E) - 1), emax]);
          const vlo = sP.yr[0], vhi = sP.yr[1], rlo = Math.max(.05, s < 0 ? (-vlo) ** (1/s) : s === 0 ? Math.exp(vlo) : Math.max(0,vlo) ** (1/s)), rhi = Math.min(R, s > 0 ? vhi ** (1/s) : s === 0 ? Math.exp(vhi) : R);
          if (rlo < rhi) sP.fn(V, { color: 'ink', width: 2, domain: [rlo, rhi] });
          sP.hline(st.E, { color: 'orange', dash: true });
          const mu = Math.max(...u.map((x) => x * x)), sc = (0.6 * (emax - st.E)) / mu;
          sP.path(Array.from({ length: u.length }, (_, i) => [rr(i), st.E + sc * u[i] * u[i]]).filter((q) => q[0] <= R), { color: 'accent', width: 2.2 });
          const rVp = s === 0 ? 1 : s * st.V, vals = [st.T, st.V, st.E, 2 * st.T, rVp], mx = Math.max(...vals.map(Math.abs), 0.1) * 1.2;
          sB.setView([0.5, 5.5], [-mx, mx]); sB.hline(0, { color: 'faint' });
          sB.bars(vals, { x0: 1, color: (val, i) => ['gold', 'purple', 'orange', 'green', 'green'][i], width: 0.65 });
          sR.hline(0, { color: 'faint' });
          sR.line(-1, -0.5, 4, 2, { color: 'green', dash: true, width: 1.8 });
          sR.dots(ratios, { r: 4, color: 'accent' });
          if (s !== 0) sR.dot(s, st.T / st.V, { r: 7, color: 'gold' });
          info = { s, k, ...st, rVp, ratio: st.T / st.V };
        });
        v.legend([['accent', '$u^2$ (drawn at the level)'], ['green', 'virial line $s/2$', { dash: true }], ['accent', '1s ratios', { dot: true }]]);
        v.readout(() => info && String.raw`finite grid: $\langle T\rangle=${v.fix(info.T,5)}$, $\langle V\rangle=${v.fix(info.V,5)}$, $E=${v.fix(info.E,5)}$, energy-sum residual ${v.fix(info.T+info.V-info.E,7)}. Virial: $2\langle T\rangle=${v.fix(2*info.T,5)}$ vs $\langle rV'\rangle=${v.fix(info.rVp,5)}$, residual ${v.fix(2*info.T-info.rVp,6)}.` + '\n' + String.raw`box radius ${v.fix(info.rmax,1)}, mesh ${v.fix(info.h,4)}, probability in outer 10% ${info.tail.toExponential(2)}` + (info.s===0?' · logarithmic case: rV′=1':String.raw` · $\langle T\rangle/\langle V\rangle=${v.fix(info.ratio,5)}$ vs $s/2=${v.fix(info.s/2,3)}$`));
      },
    },
    // ------------------------------------------------------------------ 4.10
    {
      num: '4.10',
      kind: 'Theorem',
      name: 'Non-crossing rule',
      credit: 'Non-crossing rule; two-level parameter-count proof: Tong, Topics in Quantum Mechanics (2017), §2.3.3, p. 54; real-symmetric specialization below',
      statement: String.raw`An isolated real-symmetric two-level block has eigenvalues $E_\pm=\bar E\pm\sqrt{d^2+V^2}$, where $d=(H_{22}-H_{11})/2$. A degeneracy requires both $d=0$ and $V=0$. If these two real conditions are locally independent, their common zero set in $f\ge2$ parameters has dimension $f-2$, with a double-cone splitting in the two transverse coordinates. A generic one-parameter family therefore avoids a same-symmetry crossing. A symmetry-forbidden coupling $V\equiv0$ allows a crossing when the diagonal energies coincide.`,
      scope: String.raw`Genericity requires independent conditions; specially tuned one-parameter families can cross. For a general complex Hermitian block, the imaginary off-diagonal part adds a third real condition, giving generic codimension three. Conical shape requires linear independence of the two splitting gradients. Electronic energy surfaces remain defined near degeneracy; the single-surface Born–Oppenheimer approximation can fail there.`,
      idea: String.raw`In the two-dimensional space of the two levels the Hamiltonian is a real symmetric matrix $\begin{pmatrix}H_{11}&V\\V&H_{22}\end{pmatrix}$ and the eigenvalues coincide only if both conditions $H_{11}=H_{22}$ and $V=0$ hold. Generically, tuning one real parameter cannot satisfy two independent scalar conditions; a second independent coordinate supplies the other degree of freedom. This is the same counting that makes the degenerate perturbation problem of 4.7 split: the repulsion is the secular determinant of 4.2 with the coupling in the off-diagonal. Symmetry sets $V=0$ identically, which is the one way to cross for free (cf. mech-11.13).`,
      caption: String.raw`Dashed diabatic energies have half-difference $d=0.9(R-R_0)$. Same-symmetry coupling $V=0.5q$ opens a gap $2|V|$ and exchanges state character; different symmetry forces $V=0$. The second panel shows the exact two-level double cone over $(d,V)$ and the sweep at fixed $V$. At $q=0$ the sweep reaches the tip. This deliberately tuned crossing illustrates why a generic one-coordinate sweep with fixed nonzero coupling avoids it; it does not forbid every accidental crossing in a diatomic molecule.`,
      deps: ['qchem-4.7', 'qchem-4.2', 'mech-11.13'],
      see: ['mech-11.13', 'qm-11.5'],
      refs: ['Tong, Topics in Quantum Mechanics (2017), §2.3.3, p. 54 (Hermitian three-condition argument), specialized to real two-level matrices'],
      tags: ['avoided crossing', 'conical intersection', 'symmetry'],
      verify: false,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Avoided_crossing' },
      viz(v) {
        const M = v.M, G = 0.5, A = 1.0;       // coupling V = G q; half-difference of the diabats d = A (R − R0)
        const symS = v.select('the two states have', [{ value: 'same', label: 'the same symmetry' }, { value: 'diff', label: 'different symmetry' }], 'same');
        const qS = v.slider('second coordinate $q$ (V = 0.5 q)', -1, 1, 0.5, { step: 0.01 });
        const s2 = v.stage({ x: [-1, 1], y: [-1.6, 1.6], axes: 'box', gutter: true, height: 340, weight: 1.1, xlabel: 'R − R₀', ylabel: 'energy', title: 'potential energy curves' });
        const s3 = v.stage3d({ height: 340, range: 2.1, yaw: 0.7, pitch: 0.35, labels: ['d', 'V', 'E'], weight: 0.9 });
        let info = null;
        v.render(() => {
          const same = symS.value === 'same', V = same ? G * qS.value : 0;
          qS.el.hidden = !same;
          const e1 = R => -.9 * R, e2 = R => .9 * R;      // diabatic lines H11, H22 (average zero)
          s2.hline(0, { color: 'faint' });
          s2.line(-1, e1(-1), 1, e1(1), { color: 'accent', dash: true, alpha: 0.7, width: 1.5 }); s2.line(-1, e2(-1), 1, e2(1), { color: 'orange', dash: true, alpha: 0.7, width: 1.5 });
          const d = (R) => A * 0.9 * R, E = (R, sg) => sg < 0 ? crossingState(R,V).lower : crossingState(R,V).upper;
          const w = (R, sg) => { const dd = d(R), r = Math.hypot(dd, V) || 1e-12; return 0.5 * (1 + (sg * dd) / r); };   // weight of diabat 2 in state sg  (sg=+1 upper)
          for (const sg of [-1, 1]) {
            const NSEG = 160;
            for (let i = 0; i < NSEG; i++) { const R0 = -1 + (2 * i) / NSEG, R1 = -1 + (2 * (i + 1)) / NSEG; s2.segment([R0, E(R0, sg)], [R1, E(R1, sg)], { color: v.mix('accent', 'orange', w((R0 + R1) / 2, sg) ), width: 3.2 }); }
          }
          if (same && Math.abs(V) > 1e-6) { s2.measure(0.02, -Math.abs(V), 0.02, Math.abs(V), '2|V|'); }
          // cone
          const cone = (sg) => s3.surface((r, ph) => [r * Math.cos(ph), r * Math.sin(ph), sg * r], [0, 1.2], [0, 2 * Math.PI], { n: 26, color: sg > 0 ? 'orange' : 'accent', alpha: 0.35, wire: true });
          cone(1); cone(-1);
          const path = (sg) => s3.curve((t) => [A * 0.9 * t, V, sg * Math.hypot(A * 0.9 * t, V)], -1, 1);
          path(1); path(-1);
          s3.dot([0, 0, 0], { label: 'degeneracy' });
          info = { same, V, gap: 2 * Math.abs(V), q: qS.value };
        });
        v.legend([['accent', 'diabatic state 1 / its character'], ['orange', 'diabatic state 2 / its character']]);
        v.readout(() => info && (info.same ? `coupling $V=0.5\\,q=${v.fix(info.V, 3)}$ · minimum gap $2|V|=${v.fix(info.gap, 3)}$ at the would-be crossing · ${info.V === 0 ? '**$q=0$: a deliberately tuned conical crossing**; a generic fixed nonzero coupling avoids this tip' : 'the sweep passes at distance $|V|$ from the tip, so the levels repel'}` : '$V\\equiv0$ by symmetry: the curves cross at $R_0$ with no gap, the two states do not talk to each other'));
      },
    },
    // ------------------------------------------------------------------ 4.11
    {
      num: '4.11',
      kind: 'Phenomenon',
      name: 'London dispersion forces',
      credit: 'London dispersion interaction; derivation: Toulouse et al., JCP 138, 194106 (2013), Appendix A; oscillator derivation: Ángyán et al. (2019), author Chapter 2',
      statement: String.raw`For nonoverlapping neutral atoms in nondegenerate isotropic ground states, with negligible retardation, the leading dipole-dispersion energy is $-C_6/R^6$. With complete excited-state sums (including continuum contributions),
$$C_6=\frac{2}{3(4\pi\varepsilon_0)^2}\sum_{m,n\ne0}\frac{|\langle0_A|\boldsymbol\mu_A|m\rangle|^2|\langle0_B|\boldsymbol\mu_B|n\rangle|^2}{(E_m^A-E_0^A)+(E_n^B-E_0^B)}.$$
For identical isotropic single-frequency oscillators with polarizability volume $\alpha'=\alpha/(4\pi\varepsilon_0)$, this becomes $C_6=\tfrac34\hbar\omega_0\alpha'^2$. Substituting an atomic ionization energy for $\hbar\omega_0$ is an additional approximation.`,
      scope: String.raw`The dipole expansion omits overlap/exchange and higher multipoles; retardation changes the asymptotic law at much longer distances. No universal percentage accuracy is assigned to the one-frequency approximation. Preset polarizabilities are rounded values compiled in Dzuba et al. (2018), Table I, with the provenance of that table; ionization energies are rounded NIST handbook values. They set illustrative oscillators, not a measured pair-potential fit. Instability at $\kappa\ge1$ is a defect of the undamped harmonic model, not a physical collapse prediction.`,
      idea: String.raw`The dipole tensor along the separation axis is proportional to $\operatorname{diag}(1,1,-2)/R^3$. First-order energy vanishes without permanent dipoles; second order sums negative terms $-|W_{0,mn}|^2/(\Delta E_m+\Delta E_n)$. Isotropy contributes $1/3$ from each atom, while the tensor's squared norm is $1+1+4=6$, giving the coefficient $6/9=2/3$. The axial oscillator pair has frequencies $\omega_0\sqrt{1\pm\kappa}$, $\kappa=2\alpha'/R^3$. Its zero-point shift is $-\hbar\omega_0\kappa^2/8+O(\kappa^4)$; two transverse pairs with coupling $\kappa/2$ bring the total to $-3\hbar\omega_0\alpha'^2/(4R^6)$.`,
      caption: String.raw`Choose a preset or edit its parameters. The energy is the exact stable three-pair harmonic-model zero-point shift, compared on log axes with its $-C_6/R^6$ asymptote. Stable rationalized arithmetic retains small shifts at large separation. The shaded region has no normalizable oscillator ground state. At a stable selected separation, the right panel draws 500 deterministic Gaussian samples of the axial dipole coordinates and their two-standard-deviation mode ellipse; its axes expand to contain every sample and ellipse. Sample correlation fluctuates; the readout is the analytic model correlation. These are fluctuations of oscillator coordinates, not literal atom shapes.`,
      deps: ['qchem-4.5', 'qchem-4.6', 'qm-11.17'],
      see: ['qm-11.17', 'qchem-4.12'],
      refs: ['Toulouse et al., JCP 138, 194106 (2013), Appendix A, equations A1–A6', 'Ángyán, Dobson, Jansen and Gould (2019), author manuscript Chapter 2, §§2.5–2.6', 'Dzuba et al., arXiv:1805.04989v2 (2018), Table I', 'NIST Handbook, neutral He/Ne/Ar/Kr/Xe ionization energies'],
      tags: ['dispersion', 'van der Waals', 'Drude model'],
      verify: false,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/London_dispersion_force' },
      viz(v) {
        const M = v.M;
        // Rounded compiled polarizabilities: Dzuba et al. Table I; neutral ionization energies checked against NIST Handbook.
        const ATOMS = { He: { Z: 2, a: 1.3838 }, Ne: { Z: 10, a: 2.6611 }, Ar: { Z: 18, a: 11.083 }, Kr: { Z: 36, a: 16.74 }, Xe: { Z: 54, a: 27.292 } };
        const A03 = A0_ANG ** 3, C6conv = HARTREE_EV * A0_ANG ** 6;
        const atom = v.select('preset (London’s $\\hbar\\omega_0\\approx I$)', [...Object.keys(ATOMS), 'custom'], 'Ar', { onChange: (x) => { if (ATOMS[x]) { aS.set(ATOMS[x].a * A03); wS.set(IE[ATOMS[x].Z - 1]); } } });
        const aS = v.slider('polarizability volume $\\alpha\'$ (Å³)', 0.1, 6, ATOMS.Ar.a * A03, { step: 0.01 });
        const wS = v.slider('$\\hbar\\omega_0$ (eV)', 5, 30, IE[17], { step: 0.01 });
        const rS = v.slider('separation $R$ (Å)', 1.6, 12, 3.8, { step: 0.05 });
        const sE = v.stage({ x: [1.2, 14], y: [1e-4, 1e4], xlog: true, ylog: true, axes: 'box', gutter: true, height: 330, weight: 1.15, xlabel: 'R (Å)', ylabel: '|ΔE| (meV)', title: 'dispersion energy of two atoms' });
        const sS = v.stage({ x: [-3.2, 3.2], y: [-3.2, 3.2], equal: true, axes: 'box', gutter: true, height: 330, weight: 0.85, xlabel: 'x₁', ylabel: 'x₂', title: 'correlated dipole fluctuations' });
        const dE = drudeEnergy;
        const rng = v.rng(7), Zs = Array.from({ length: 500 }, () => [rng.normal(), rng.normal()]);
        let info = null;
        v.render(() => {
          const al = aS.value, w = wS.value, R = rS.value, C6 = 0.75 * w * al * al, k = (2 * al) / R ** 3;
          const Rc = (2 * al) ** (1 / 3);
          const xs=Array.from({length:241},(_,i)=>1.2*(14/1.2)**(i/240)),asym=xs.map(x=>[x,C6/x**6*1e3]),valid=xs.filter(x=>x>Rc*1.0001).map(x=>[x,-dE(x,al,w)*1e3]),e=dE(R,al,w),ys=[...asym,...valid].map(q=>q[1]);if(Number.isFinite(e))ys.push(-e*1e3);
          const yl=Math.min(...ys)*.6,yh=Math.max(...ys)*1.8;sE.setView([1.2,14],[yl,yh]);
          if(Rc>1.2)sE.vband(1.2,Math.min(14,Rc),{color:'muted',alpha:.18});
          sE.path(asym,{color:'orange',dash:true,width:1.8});sE.path(valid,{color:'accent',width:2.6});
          if(Number.isFinite(e))sE.dot(R,-e*1e3,{r:7,color:'gold'});
          if(Rc>1.2)sE.text('κ ≥ 1: no stable ground state',1.25,yl*2,{color:'muted',size:10});
          // correlated Gaussians for the axial pair: modes (x1 ± x2)/√2 with ω² = ω0²(1 ∓ κ), variances 1/(2√(1∓κ)) in units of ħ/mω0
          if (k < 1) {
            const cov = drudeCovariance(k), vs = cov.symmetric, va = cov.antisymmetric, pts = Zs.map(([a, b]) => { const X = a * Math.sqrt(vs), Y = b * Math.sqrt(va); return [(X + Y) / Math.SQRT2, (X - Y) / Math.SQRT2]; });
            const h=1.12*Math.max(3, ...pts.flat().map(Math.abs), Math.SQRT2*Math.sqrt(vs+va));sS.setView([-h,h],[-h,h]);
            sS.dots(pts, { r: 2, color: 'accent', alpha: 0.5 });
            sS.line(-3, -3, 3, 3, { color: 'faint', dash: true });
            sS.curve((t) => { const X = 2 * Math.sqrt(vs) * Math.cos(t), Y = 2 * Math.sqrt(va) * Math.sin(t); return [(X + Y) / Math.SQRT2, (X - Y) / Math.SQRT2]; }, 0, 2 * Math.PI, { color: 'orange', width: 2 });
            info = { al, w, R, C6, k, e, corr: (vs - va) / (vs + va), ok: true };
          } else { sS.setView([-3.2,3.2],[-3.2,3.2]);sS.text('no normalizable ground state',0,0,{align:'center',color:'muted',size:11});info = { al, w, R, C6, k, e, corr: NaN, ok: false }; }
        });
        v.legend([['accent', 'Drude energy shift (exact for the model)'], ['orange', '$-C_6/R^6$', { dash: true }]]);
        v.readout(() => info && (info.ok ? `at $R=${v.fix(info.R, 2)}$ Å: $\\kappa=2\\alpha'/R^3=${v.fix(info.k, 3)}$ · $\\Delta E=${v.fix(info.e * 1e3, 3)}$ meV (asymptote $-C_6/R^6=-${v.fix((info.C6 / info.R ** 6) * 1e3, 3)}$ meV)` : `at $R=${v.fix(info.R, 2)}$ Å the coupling is $\\kappa\\ge1$: the soft mode has no restoring force (model breakdown)`) + `\n$C_6\\approx\\tfrac34\\hbar\\omega_0\\alpha'^2=${v.fix(info.C6, 1)}$ eV Å⁶ $=${v.fix(info.C6 / C6conv, 1)}$ a.u. · correlation of the axial dipole coordinates $\\langle x_1x_2\\rangle/\\langle x^2\\rangle=${info.ok ? v.fix(info.corr, 3) : '—'}$`);
      },
    },
    // ------------------------------------------------------------------ 4.12
    {
      num: '4.12',
      kind: 'Model',
      name: 'Lennard-Jones potential',
      credit: 'Lennard–Jones pair model; derivation and Mayer expansion: Arovas, Thermodynamics and Statistical Mechanics, §6.3.3',
      statement: String.raw`The effective isotropic Lennard–Jones pair model is
$$U(r)=4\varepsilon[(\sigma/r)^{12}-(\sigma/r)^6],\qquad \varepsilon,\sigma>0.$$
It has $U(\sigma)=0$, a minimum $-\varepsilon$ at $r_m=2^{1/6}\sigma$, and a model tail coefficient $C_6^{\rm model}=4\varepsilon\sigma^6$. The inverse-sixth-power tail models nonretarded dispersion. The inverse-twelfth-power repulsion is phenomenological; neither exponent nor fitting both well parameters forces the model coefficient to equal the physical atom's dispersion coefficient.`,
      scope: String.raw`The displayed $\varepsilon/k_B=119.8$ K and $\sigma=3.405$ Å are chosen illustrative model parameters; their original fit is not asserted. The classical low-density formula $B_2=2\pi N_A\int_0^\infty[1-e^{-U/(k_BT)}]r^2dr$ neglects quantum statistics and many-body forces. The unmodified exponential–sixth-power potential diverges attractively at the origin and gives a divergent integral; the displayed exp-6 model instead has an explicit impenetrable core at its inner local maximum.`,
      idea: String.raw`Differentiating the 12–6 form locates its minimum and depth. The Mayer expansion gives $B_2=-N_A\int f(\mathbf r)\,d^3r/2$ with $f=e^{-U/(k_BT)}-1$. A repulsive core contributes positively; an attractive tail contributes negatively. Keeping $r_m$ and $\varepsilon$ fixed while changing $n$ or $\alpha$ changes both the wall and the long-range coefficient, so changes in $B_2$ cannot be attributed only to wall steepness. The full infinite-range integral is numerically compactified, with no finite-range tail cutoff.`,
      caption: String.raw`The chosen parameters define a model, not a fit verified against measured argon data. Compare 12–6, $n$–6 and **hard-core modified** exp-6 at fixed minimum position/depth. The steepness changes the tail coefficient as well as the wall. The potential panel shows the finite energy window; the exp-6 exclusion is shaded only where its core overlaps the displayed radial window. The right panel integrates each declared model over $0<r<\infty$ and brackets its Boyle-temperature zero; 12–6 gives approximately $3.41793\,\varepsilon/k_B$. No Boyle temperature is claimed for the divergent unmodified exp-6 potential.`,
      deps: ['qchem-4.11', 'qchem-3.1'],
      see: ['qchem-4.11'],
      refs: ['Arovas, Thermodynamics and Statistical Mechanics, §6.3.3, equations (6.55)–(6.57), (6.72)–(6.76), (6.89)–(6.92)'],
      tags: ['Lennard-Jones', 'intermolecular potential', 'second virial coefficient'],
      verify: false,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Lennard-Jones_potential' },
      viz(v) {
        const EPS = PAIR_EPS, SIG = PAIR_SIG, RM = PAIR_RM;
        const form = v.select('repulsive wall', [{ value: 'lj', label: '12–6' }, { value: 'nm', label: '$n$–6' }, { value: 'exp', label: 'exp-6' }], 'lj', { onChange: (f) => { stp.el.hidden = f === 'lj'; if (f === 'nm') stp.set(16); if (f === 'exp') stp.set(14); } });
        const stp = v.slider('steepness ($n$ or $\\alpha$)', 8, 24, 14, { step: 0.1 });
        stp.el.hidden = true;
        const sU = v.stage({ x: [3, 8.5], y: [-14, 30], axes: 'box', gutter: true, height: 330, weight: 1.1, xlabel: 'r (Å)', ylabel: 'U (meV)', title: 'pair potential' });
        const sB = v.stage({ x: [60, 1000], y: [-400, 80], axes: 'box', gutter: true, height: 330, weight: 0.95, xlabel: 'T (K)', ylabel: 'B₂ (cm³/mol)', title: 'second virial coefficient' });
        const U = pairPotential, rPeak = exp6Core, B2 = pairB2;
        const plotU=(fn,style)=>{let pts=[];for(let i=0;i<=700;i++){const r=3+5.5*i/700,y=fn(r);if(Number.isFinite(y)&&y>=-14&&y<=30)pts.push([r,y]);else if(pts.length){sU.path(pts,style);pts=[];}}if(pts.length)sU.path(pts,style);};
        let info = null;
        v.render(() => {
          const f = form.value, s = f === 'lj' ? 12 : stp.value;
          const rp = f === 'exp' ? rPeak(s) : 0;
          if (f === 'exp' && rp > 3) sU.rect(3, -14, Math.min(rp,8.5), 30, { color: 'muted', fill: 'muted', fillAlpha: 0.15, stroke: false });
          sU.hline(0, { color: 'faint' }); sU.hline(-EPS, { color: 'green', dash: true, alpha: 0.7 });
          sU.vline(SIG, { color: 'faint', dash: true }); sU.vline(RM, { color: 'green', dash: true, alpha: 0.7 });
          if (f !== 'lj') plotU((r) => U('lj', 12, r), { color: 'muted', dash: true, width: 1.6, domain: [3, 8.5] });
          const C6 = pairC6(f,s);
          plotU((r) => -C6 / r ** 6, { color: 'orange', dash: [2, 3], width: 1.4, domain: [3.3, 8.5] });
          plotU((r) => (f === 'exp' && r < rp ? NaN : U(f, s, r)), { color: 'accent', width: 2.6, domain: [3, 8.5] });
          sU.dot(RM, -EPS, { r: 5, color: 'green', label: `rₘ = ${RM.toFixed(2)} Å`, labelPos: 'n' });
          sU.text('σ₁₂₋₆', SIG, 27, { color: 'muted', align: 'center' });
          const Ts = Array.from({ length: 36 }, (_, i) => 60 + (940 * i) / 35), pts = Ts.map((T) => [T, B2(f, s, T)]);
          const ref = f === 'lj' ? null : Ts.map((T) => [T, B2('lj', 12, T)]);
          const ys = [...pts,...(ref||[])].map(p=>p[1]),yl=Math.min(0,...ys),yh=Math.max(0,...ys);sB.setView([40,1020],[yl-.08*(yh-yl),yh+.12*(yh-yl)]);
          if (ref) sB.path(ref, { color: 'muted', dash: true, width: 1.6 });
          sB.hline(0, { color: 'faint' });
          sB.path(pts, { color: 'accent', width: 2.6 });
          const TB = pairBoyle(f,s);
          if(TB!==null)sB.dot(TB,0,{r:6,color:'gold',label:`Boyle T ≈ ${TB.toFixed(1)} K`,labelPos:'ne'});
          info = { f, s, C6, TB, rp, b300: B2(f, s, 300) };
        });
        v.legend([['accent', 'this potential'], ['muted', '12–6', { dash: true }], ['orange', '$-C_6/r^6$ tail', { dash: [2, 3] }], ['green', 'well: $-\\varepsilon$, $r_m$', { dash: true }]]);
        v.readout(() => info && `$r_m=${v.fix(RM, 3)}$ Å, depth $\\varepsilon=${v.fix(EPS, 2)}$ meV, $\\sigma_{12-6}=${v.fix(SIG, 3)}$ Å, tail coefficient $C_6=${v.fix(info.C6 / (HARTREE_EV * A0_ANG ** 6) * 1e-3, 1)}$ a.u. (for the 12–6: $4\\varepsilon\\sigma^6$) · $B_2(300\\,\\mathrm{K})=${v.fix(info.b300, 1)}$ cm³/mol · Boyle temperature ${info.TB === null ? '—' : v.fix(info.TB, 0) + ' K'} (12–6: $3.42\\,\\varepsilon/k_B\\approx410$ K)` + (info.f === 'exp' ? `\nthe exp-6 curve turns over at $r=${v.fix(info.rp, 2)}$ Å (${info.rp < 3 ? 'below the displayed radial window' : 'shaded'}, treated as a hard core in $B_2$)` : ''));
      },
    },
  ],
};
