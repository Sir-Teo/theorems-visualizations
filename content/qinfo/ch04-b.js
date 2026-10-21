// Quantum Information & Computation — Chapter 4: Circuits and universality (part b: items 4.5–4.9)
import {
  TAU, R2, cmul, cabs2, normalize, applyOne, applyCX, outerV, ptrace, blochRho, cplx, GATE, zeroState, H2,
  qapply, qangleAxis, qrot, qdist, qmul, buildNet, solovayKitaev, GL, Tableau,
} from './ch04.shared.js';

import {auditedSK,kickback,oracleOutput,isingModel,stateDistance} from './algorithm-sources-audit.shared.js';

const fix = (v, x, d = 3) => v.fix(Math.abs(x) < 0.5 * 10 ** -d ? 0 : x, d);

export default {
  collection: 'qinfo',
  chapter: 4,
  items: [
    // ------------------------------------------------------------------ 4.5
    {
      num: '4.5',
      kind: 'Theorem',
      name: 'Solovay–Kitaev theorem',
      statement: String.raw`Let $\mathcal G\subset SU(2)$ be a finite set that contains its own inverses and generates a dense subgroup. Then there is a constant $c$ such that for every $U\in SU(2)$ and every $\varepsilon>0$ some word of length $O(\log^{c}(1/\varepsilon))$ in the elements of $\mathcal G$ approximates $U$ within $\varepsilon$ in operator norm, and such a word can be found by a classical algorithm in time $O(\log^{c'}(1/\varepsilon))$. The Dawson–Nielsen construction gives $c=\log5/\log(3/2)\approx3.97$. Its arithmetic-operation count has $c\prime=\log3/\log(3/2)\approx2.71$ for a compressed recursive output; explicitly listing all gates costs $O(\log^{3.97}(1/\varepsilon))$. These counts exclude fixed gate-set preprocessing and precision-dependent arithmetic cost. Consequently a circuit containing $m$ single-qubit rotations (with its other gates fixed) can compile those rotations to accuracy $\delta$ using $O(m\log^{c}(m/\delta))$ gates of a fixed inverse-closed universal SU(2) instruction set.`,
      idea: String.raw`Start from a coarse net: every $U$ is within $\varepsilon_0$ of some short word $U_0$. Then $\Delta=UU_0^\dagger$ is a rotation by a small angle, and any small rotation is a *group commutator* $\Delta=VWV^\dagger W^\dagger$ of two rotations $V,W$ of size only about $\sqrt{\|\Delta-I\|}$. Approximate $V$ and $W$ recursively (by words $\tilde V,\tilde W$ at the previous level) and set $U_1=\tilde V\tilde W\tilde V^\dagger\tilde W^\dagger U_0$. The commutator is quadratic in its factors, so errors of size $\varepsilon$ in $V,W$ move the commutator only by $O(\varepsilon\sqrt{\|\Delta-I\|})$: $\varepsilon_{n+1}\le c\,\varepsilon_n^{3/2}$. The error therefore falls doubly exponentially in the depth $n$, while the word length grows only like $5^n$.`,
      caption: String.raw`The base net enumerates reduced words in $H,T,T^\dagger$ up to length $L_0$. Choose a target rotation (random or by sliders) and a recursion depth. Left: length against error for $n=0,1,2,\dots$ on log–log axes; each point is the actual evaluated output word. Right: consecutive errors and an **empirical** $c\varepsilon^{3/2}$ fitted to this one target’s observed ratios. This fitted curve is not a certified uniform error bound or a proof that the base net covers all gates. Exact-zero errors are reported and omitted from log axes. Make the net too coarse (small $L_0$) and the recursion may fail to improve: the hypothesis "$\varepsilon_0$ small enough" matters.`,
      deps: ['qinfo-4.4'],
      refs: ['Dawson & Nielsen, The Solovay–Kitaev algorithm, complete §§2–4 pp2–9: Definition1, Theorem1, equations(1)–(20), including compressed-output cost caveat: https://arxiv.org/pdf/quant-ph/0505030'],
      tags: ['Solovay–Kitaev', 'gate synthesis', 'group commutator'],
      scope: String.raw`The source theorem uses literal SU(2) operator norm and a sufficiently fine inverse-closed net. This visualization compiles H/T gates **up to global phase**: quaternion signs are identified and the distance is $\min(\|U-V\|,\|U+V\|)$. It is the operator distance minimized over the two SU(2) lifts; the literal SU(2) distance retains the sign. The displayed finite net is not certified to meet the source's uniform cover threshold. The implementation materializes its output word and uses Float64 arithmetic.`,
      credit: 'Solovay–Kitaev theorem; constructive proof and cost model: Dawson & Nielsen (2005 preprint)',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Solovay%E2%80%93Kitaev_theorem', arxiv: 'https://arxiv.org/abs/quant-ph/0505030' },
      viz(v) {
        const A = v.stage({ x: [1, 1e5], y: [1e-6, 3], xlog: true, ylog: true, axes: 'box', gutter: true, height: 330, weight: 1.15, xlabel: 'word length $\\ell$', ylabel: 'error $\\varepsilon_n$', title: 'length against error' });
        const B = v.stage({ x: [1e-6, 1], y: [1e-8, 1], xlog: true, ylog: true, axes: 'box', gutter: true, height: 330, weight: 1, xlabel: '$\\varepsilon_n$', ylabel: '$\\varepsilon_{n+1}$', title: 'one recursion step' });
        const L0 = v.slider('base net: words up to length $L_0$', 3, 12, 10, { int: true });
        const depth = v.slider('depth $n$', 0, 4, 3, { int: true });
        const ang = v.slider('rotation angle', 0, Math.PI, 1.3, { step: 0.01 });
        const pol = v.slider('axis: polar angle', 0, Math.PI, 1.0, { step: 0.01 });
        const azi = v.slider('axis: azimuth', 0, TAU, 2.0, { step: 0.01 });
        let cache = null, cur;
        v.button('Random target', () => { const r = v.rng(Math.floor(Math.random() * 1e6)); ang.set(0.3 + 2.7 * r()); pol.set(Math.acos(1 - 2 * r())); azi.set(TAU * r()); });
        v.button('identity target',()=>ang.set(0));v.button('T target',()=>{ang.set(Math.PI/4);pol.set(0);azi.set(0);});
        v.render(() => {
          const key = `${L0.value}|${ang.value}|${pol.value}|${azi.value}`;
          if (!cache || cache.key !== key) {
            const net = buildNet(L0.value), U = qrot([Math.sin(pol.value) * Math.cos(azi.value), Math.sin(pol.value) * Math.sin(azi.value), Math.cos(pol.value)], ang.value);
            cache = { key, net, tr: auditedSK(net, U, 4) };
          }
          const tr = cache.tr, up = tr.slice(0, depth.value + 1);
          const pts=tr.filter(r=>r.err>0).map(r=>[Math.max(r.len,1),r.err]),selected=up.filter(r=>r.err>0).map(r=>[Math.max(r.len,1),r.err]),ys=pts.map(p=>p[1]);
          A.setView([1,Math.max(10,...tr.map(r=>r.len))*1.2],ys.length?[Math.min(...ys)*.5,Math.max(...ys)*2]:[1e-16,1]);
          A.path(pts,{color:'faint',width:1.2,dash:true});A.path(selected,{color:'accent',width:2.2});
          tr.forEach((r,i)=>{if(r.err>0)A.dot(Math.max(r.len,1),r.err,{color:i<=depth.value?'accent':'muted',r:i===depth.value?6.5:4,label:`n=${i}`,labelPos:'ne'});});
          let cmax=0;const pairs=[],pairLevels=[];for(let i=0;i+1<tr.length;i++)if(tr[i].err>0){cmax=Math.max(cmax,tr[i+1].err/tr[i].err**1.5);if(tr[i+1].err>0){pairs.push([tr[i].err,tr[i+1].err]);pairLevels.push(i);}}
          const lo=Math.min(1e-3,...pairs.flat())*.5,hi=Math.max(1,...pairs.flat())*1.2,xs=Array.from({length:61},(_,k)=>lo*(hi/lo)**(k/60)),line=xs.map(x=>[x,cmax*x**1.5]).filter(p=>p[1]>0),yall=[...pairs.map(p=>p[1]),...line.map(p=>p[1])];
          B.setView([lo,hi],yall.length?[Math.min(...yall)*.5,Math.max(...yall)*1.2]:[1e-16,1]);B.path(line,{color:'green',width:1.6,dash:true});
          pairs.forEach((p,i)=>B.dot(...p,{color:'orange',r:4.5,label:`${pairLevels[i]}→${pairLevels[i]+1}`,labelPos:'nw'}));
          if(!ys.length)A.text('exact projective match; log error undefined',2,1e-8,{color:'muted',size:12});
          cur = { tr, cmax, n: depth.value, net: cache.net.length };
        });
        v.legend([['accent', 'error against word length'], ['green', 'curve $c\\,\\varepsilon^{3/2}$', { dash: true }], ['orange', 'consecutive levels']]);
        v.readout(() => {
          const r = cur.tr[cur.n], r0 = cur.tr[0], grow = cur.n ? cur.tr[cur.n].len / Math.max(1, cur.tr[cur.n - 1].len) : 0;
          const improving = cur.tr.every((x, i) => i === 0 || x.err <= cur.tr[i - 1].err * 1.0001);
          return `net of ${cur.net} distinct rotations, base error $\\varepsilon_0=${fix(v, r0.err, 4)}$ with ${r0.len} letters\ndepth ${cur.n}: error $${v.sci(r.err, 3)}$ with a word of ${r.len} letters${grow ? ` (${fix(v, grow, 1)}× the previous level; without cancellations it would be 5×)` : ''}; single-target empirical $c\\approx${fix(v, cur.cmax, 2)}$ (not a certified bound)\n${improving ? 'The error decreases at every level.' : 'Some computed level does not improve; this finite net/Float64 run does not establish the theorem hypotheses.'}`;
        });
      },
    },

    // ------------------------------------------------------------------ 4.6
    {
      num: '4.6',
      kind: 'Theorem',
      name: 'Gottesman–Knill theorem',
      statement: String.raw`Any quantum circuit made of Hadamard, phase ($S$) and CNOT gates, with preparation of computational-basis states and measurements in the computational basis, can be simulated on a classical computer in polynomial time: the state is the common $+1$ eigenstate of $n$ commuting Pauli generators, and each Clifford gate or measurement updates a $2n\times(2n+1)$ binary tableau in $O(n)$ (gate) or $O(n^2)$ (measurement) time. Such a state is stored with $O(n^2)$ bits, while the state vector needs $2^n$ amplitudes. Inserting $T$ leaves these gate-set hypotheses; it does not imply every resulting state is non-stabilizer (for example $T|0\rangle=|0\rangle$).`,
      idea: String.raw`A stabilizer state $|\psi\rangle$ is fixed by $n$ independent commuting Pauli operators $g_1,\dots,g_n$, and these determine it completely. If $U$ is Clifford, $U|\psi\rangle$ is stabilized by $Ug_iU^\dagger$, which are again Pauli strings (qinfo-4.3), so a gate is just a rewrite of $n$ short bit-strings (Heisenberg picture); a $Z$ measurement either leaves the outcome fixed (if $\pm Z_a$ is in the stabilizer group) or gives a fair coin and replaces one generator. The tableau adds $n$ destabilizer rows so that measurement can be done in time $O(n^2)$ (Aaronson–Gottesman). The theorem does not say that entanglement is classically cheap in general: GHZ states are entangled, but a generic circuit with $T$ gates is believed to be hard to simulate.`,
      caption: String.raw`A random Clifford circuit (gates drawn from $H,S,\mathrm{CNOT}$ on $n$ qubits) is simulated two ways: the exact state vector (pale bars) and the stabilizer tableau, sampled by many measurement runs (gold ticks). Gold ticks are finite samples and need not equal exact probabilities; the stabilizer list shows the $n$ generators. Right: ideal packed-tableau bits versus Float64 state-vector bits as $n$ grows (excluding object/scratch overhead). Insert a $T$ gate with the slider and the tableau route is no longer valid.`,
      deps: ['qinfo-4.3'],
      refs: ['Aaronson & Gottesman, Improved Simulation of Stabilizer Circuits, §§II–III pp3–5, Theorem1, complete update algorithm and Proposition3 proof: https://arxiv.org/pdf/quant-ph/0406196'],
      tags: ['stabilizer', 'classical simulation', 'Clifford group'],
      scope: String.raw`Clifford circuits on computational-basis inputs with $Z$ measurements (and classical control). This display checks $n\le6$; Aaronson–Gottesman’s CHP implementation demonstrates much larger systems. Logical packed-bit counts are not JavaScript allocation measurements.`,
      credit: 'D. Gottesman, “The Heisenberg representation of quantum computers”, Group22 (Hobart, 1998), arXiv:quant-ph/9807006; improved tableau algorithm: S. Aaronson and D. Gottesman, Phys. Rev. A 70, 052328 (2004)',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Gottesman%E2%80%93Knill_theorem', arxiv: 'https://arxiv.org/abs/quant-ph/9807006' },
      viz(v) {
        const P = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 300, weight: 1.5, title: 'outcome probabilities: exact vector (bars) against tableau samples (ticks)' });
        const Mm = v.stage({ x: [1, 60], y: [1, 2e20], ylog: true, axes: 'box', gutter: true, height: 300, weight: 1, xlabel: 'qubits $n$', ylabel: 'bits (specified representations)', title: 'memory' });
        const nq = v.slider('qubits $n$', 2, 6, 4, { int: true });
        const depth = v.slider('Clifford gates', 2, 40, 18, { int: true });
        const nT = v.slider('extra $T$ gates', 0, 3, 0, { int: true });
        const shots = v.slider('tableau samples', 200, 5000, 2000, { log: true, int: true });
        let seed = 5; v.button('New circuit', () => { seed++; });
        let cur;
        v.render(() => {
          const n = nq.value, N = 1 << n, r = v.rng(seed * 101 + n), gates = [];
          for (let i = 0; i < depth.value; i++) { const t = r.int(0, 3), a = r.int(0, n - 1); let b = r.int(0, n - 1); if (b === a) b = (a + 1) % n; gates.push(t === 0 ? ['h', a] : t === 1 ? ['s', a] : ['cx', a, b]); }
          for (let k = 0; k < nT.value; k++) gates.splice(r.int(0, gates.length), 0, ['t', r.int(0, n - 1)]);
          let psi = zeroState(N); const tab = new Tableau(n);
          for (const g of gates) {
            if (g[0] === 'cx') { psi = applyCX(psi, g[1], g[2], n); tab.cx(g[1], g[2]); } else { psi = applyOne(psi, GATE[g[0] === 'h' ? 'H' : g[0] === 's' ? 'S' : 'T'](), g[1], n); if (g[0] === 'h') tab.h(g[1]); else if (g[0] === 's') tab.s(g[1]); }
          }
          const pr = psi.map(cabs2), ok = nT.value === 0, rr = v.rng(seed * 7 + 1), cnt = new Array(N).fill(0);
          if (ok) for (let sh = 0; sh < shots.value; sh++) { const t = tab.clone(); let idx = 0; for (let a = 0; a < n; a++) idx = (idx << 1) | t.measure(a, () => (rr() < 0.5 ? 0 : 1)).bit; cnt[idx]++; }
          const fr = cnt.map((c) => c / shots.value);
          // bars
          const cx = P.ctx, W = P.W, H = P.H, left = 44, right = 14, top = 48, bottom = N > 8 ? 40 : 28, bw = (W - left - right) / N, base = H - bottom, ph = base - top, mx = Math.max(...pr, ...(ok ? fr : [0]), 0.05) * 1.1;
          cx.save(); cx.font = '500 10.5px Inter, system-ui'; cx.textAlign = 'right'; cx.textBaseline = 'middle'; cx.fillStyle = v.color('muted');
          for (const f of [0, 0.5, 1]) { const y = base - f * ph; cx.strokeStyle = v.color(f ? 'grid' : 'faint'); cx.beginPath(); cx.moveTo(left, y); cx.lineTo(W - right, y); cx.stroke(); cx.fillText((f * mx).toFixed(2), left - 6, y); }
          for (let i = 0; i < N; i++) {
            const x = left + i * bw, w = Math.max(2, bw * 0.66), xc = x + bw / 2, h = (pr[i] / mx) * ph;
            if (h > 0.2) { cx.fillStyle = v.color('accent', 0.45); cx.fillRect(xc - w / 2, base - h, w, h); }
            if (ok) { const y = base - (fr[i] / mx) * ph; cx.strokeStyle = v.color('gold'); cx.lineWidth = 2.4; cx.beginPath(); cx.moveTo(xc - w / 2 - 2, y); cx.lineTo(xc + w / 2 + 2, y); cx.stroke(); }
            if (N <= 16 || i % Math.ceil(N/16) === 0) { cx.save(); cx.fillStyle = v.color('muted'); cx.textBaseline = 'top'; cx.textAlign = 'center'; cx.font = '500 9.5px "JetBrains Mono", monospace'; if (N > 8) { cx.translate(xc, base + 5); cx.rotate(-Math.PI / 4); cx.textAlign = 'right'; } cx.fillText(i.toString(2).padStart(n, '0'), N > 8 ? 0 : xc, N > 8 ? 0 : base + 6); cx.restore(); }
          }
          if (!ok) { cx.fillStyle = v.color('red'); cx.font = '600 13px Inter, system-ui'; cx.textAlign = 'center'; cx.textBaseline = 'middle'; cx.fillText('T inserted: Clifford-only tableau route disabled', W / 2, top + 8); }
          else { cx.fillStyle = v.color('muted'); cx.font = '500 11.5px "JetBrains Mono", monospace'; cx.textAlign = 'left'; cx.textBaseline = 'top'; tab.stabilizers().slice(0, 6).forEach((s, i) => cx.fillText(`g${i + 1} = ${s}`, left + 6 + (i % 3) * 120, 4 + Math.floor(i / 3) * 15)); }
          cx.restore();
          // memory
          const ns = [...Array(60).keys()].map((k) => k + 1);
          Mm.path(ns.map((m) => [m, 2 * m * (2 * m + 1)]), { color: 'green', width: 2.2 }); Mm.path(ns.map((m) => [m, 128 * 2 ** m]), { color: 'red', width: 2.2 });
          Mm.hline(128 * 2 ** 33, { color: 'muted', dash: true, width: 1 }); Mm.text('33-qubit Float64 vector: 128 GiB', 14, 128 * 2 ** 33 * 8, { size: 11, color: 'muted', align: 'left' });
          Mm.vline(n, { color: 'gold', width: 1.4 });
          let tv = 0; if (ok) for (let i = 0; i < N; i++) tv += Math.abs(pr[i] - fr[i]) / 2;
          const sup = pr.filter((p) => p > 1e-9), flat = sup.length && sup.every((p) => Math.abs(p - sup[0]) < 1e-9);
          cur = { n, ok, tv, sup: sup.length, flat, bits: 2 * n * (2 * n + 1), amps: 2 * N, mix: 1 / Math.sqrt(shots.value), gates: gates.length };
        });
        v.legend([['green', 'tableau: $2n(2n+1)$ bits'], ['red', 'Float64 vector: $128\\cdot2^n$ bits']]);
        v.readout(() => cur.ok
          ? `n = ${cur.n}, ${cur.gates} gates. Packed tableau: ${cur.bits} logical bits (scratch excluded); Float64 state vector: ${cur.amps*64} bits. Total variation distance between tableau samples and the exact distribution: $${fix(v, cur.tv, 3)}$ (sampling noise ≈ $${fix(v, cur.mix * Math.sqrt(cur.sup) / 2, 3)}$)\nThe outcome distribution is uniform on ${cur.sup} strings${cur.flat ? ' (a flat distribution on an affine subspace, as every stabilizer state gives)' : ''}.`
          : `n = ${cur.n}: T gates were inserted. The Clifford-only tableau comparison is disabled; this does not classify the output as non-stabilizer or prove nonflat probabilities. Direct matrix evolution still gives the exact probabilities shown.`);
      },
    },

    // ------------------------------------------------------------------ 4.7
    {
      num: '4.7',
      kind: 'Phenomenon',
      name: 'Phase kickback',
      statement: String.raw`Let $U$ be a unitary with eigenvector $U|u\rangle=e^{i\varphi}|u\rangle$. For the controlled gate $\Lambda(U)=|0\rangle\langle0|\otimes I+|1\rangle\langle1|\otimes U$,
$$\begin{gathered}\Lambda(U)\bigl(|c\rangle\otimes|u\rangle\bigr)\\=\bigl(\Lambda_\varphi|c\rangle\bigr)\otimes|u\rangle,\qquad\\\Lambda_\varphi=\mathrm{diag}(1,e^{i\varphi}),\end{gathered}$$
so the **target is unchanged and the eigenphase appears on the control**: for the control $|+\rangle$ the Bloch vector turns about $Z$ by $\varphi$. For a pure target $|\psi\rangle$ and control $|+\rangle$, the control coherence is $z=\langle\psi|U|\psi\rangle$. Entanglement occurs exactly when $|z|<1$; a target superposition across different eigenvalues has this property, but equal eigenphases or a single occupied eigenspace do not. In particular CNOT with target $|-\rangle$ acts on the control as $Z$.`,
      idea: String.raw`This is the linearity of the controlled gate on a product with an eigenvector: the branch where the control is $|1\rangle$ picks up the scalar $e^{i\varphi}$ and the branch $|0\rangle$ does not, and a scalar on one branch is a relative phase between the branches of the *control* even though it was produced by acting on the target. The phase is invisible to a measurement of the target alone but is read out by interfering the control (a Hadamard, qinfo-1.3). Phase estimation and related algorithms exploit this effect.

The equality case in Cauchy-Schwarz ladr-6.14 explains the pure-target boundary. Both $|\psi\rangle$ and $U|\psi\rangle$ have norm one, so $|z|\le1$, with equality exactly when they are scalar multiples: the target occupies one eigenspace. The equal-control branch state has reduced purity $(1+|z|^2)/2$, hence is entangled exactly when $|z|<1$. Equal eigenphases give equality even when several eigenvectors are occupied.`,
      caption: String.raw`Left sphere: the **control** after the controlled-$U$, starting from $|+\rangle$ (grey arrow); right sphere: the **target** (its eigen-axis $\hat n$ in orange). $U=e^{i\gamma}R_{\hat n}(\alpha)$ has eigenphases $\gamma\mp\alpha/2$ for the target states $|\pm\hat n\rangle$. Set the mixing $\beta=0$ (target an eigenstate) and the control rotates about $Z$ by exactly the eigenphase while its length stays 1; for $0<\beta<\pi/2$ and distinct eigenphases it becomes entangled. At $\beta=\pi/2$ the target is the other eigenstate and the control is pure again. The curve is the $\beta=0$ reference; the gold dot shows the actual selected state, and azimuth is undefined when its coherence is zero.`,
      deps: ['qinfo-2.1', 'qinfo-1.3', 'ladr-6.14'],
      refs: ['Cleve et al., Quantum Algorithms Revisited, §1 pp2–3 equation(1.2), complete controlled-unitary derivation: https://arxiv.org/pdf/quant-ph/9708016'],
      tags: ['phase kickback', 'controlled gates', 'eigenphase'],
      scope: String.raw`Ideal controlled-$U$ and pure product input. With the chosen control $|+\rangle$, reduced-state purity gives an exact entanglement test; this is a finite two-qubit calculation, not a test of a generic algorithm's speedup.`,
      credit: 'Phase-kickback treatment: Cleve, Ekert, Macchiavello & Mosca (1997 preprint)',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Quantum_phase_estimation_algorithm' },
      viz(v) {
        const S1 = v.stage3d({ height: 320, range: 1.5, weight: 1, title: 'control qubit' });
        const S2 = v.stage3d({ height: 320, range: 1.5, weight: 1, title: 'target qubit' });
        const Pl = v.stage({ x: [0, TAU], y: [-Math.PI, Math.PI], axes: 'box', gutter: true, height: 230, full: true, xlabel: 'rotation angle $\\alpha$', ylabel: 'control azimuth', title: 'azimuth of the control against $\\alpha$ ($\\beta=0$, target $|+\\hat n\\rangle$)' });
        const Q = v.quantum();
        const al = v.slider('rotation angle $\\alpha$', 0, TAU, 1.5, { step: 0.01 });
        const gm = v.slider('extra phase $\\gamma$', -Math.PI, Math.PI, 0, { step: 0.01 });
        const pol = v.slider('axis polar angle', 0, Math.PI, Math.PI / 2, { step: 0.01 });
        const azi = v.slider('axis azimuth', 0, TAU, 0, { step: 0.01 });
        const beta = v.slider('mixing $\\beta$', 0, Math.PI / 2, 0, { step: 0.01 });
        v.button('CNOT, target $|-\\rangle$', () => { al.set(Math.PI); gm.set(Math.PI / 2); pol.set(Math.PI / 2); azi.set(0); beta.set(Math.PI / 2); });
        const run=kickback;v.button('equal superposition',()=>beta.set(Math.PI/4));v.button('zero rotation',()=>al.set(0));v.button('opposite eigenstate',()=>beta.set(Math.PI/2));
        let cur;
        v.render(() => {
          const th = pol.value, ph = azi.value, r = run(al.value, gm.value, th, ph, beta.value), nax = [Math.sin(th) * Math.cos(ph), Math.sin(th) * Math.sin(ph), Math.cos(th)];
          Q.bloch(S1, r.control, { extra: [{ v: [1, 0, 0], color: 'muted', label: '|{+}\\rangle' }], angles: false });
          Q.bloch(S2, r.target, { extra: [{ v: nax, color: 'orange', label: '\\hat n' }], color: 'teal' });
          const pts = [...Array(121).keys()].map((k) => { const a = (k / 120) * TAU, rr = run(a, gm.value, th, ph, 0); return [a, Math.atan2(rr.control[1], rr.control[0])]; });
          for (let i = 1; i < pts.length; i++) if (Math.abs(pts[i][1] - pts[i - 1][1]) < 3) Pl.line(pts[i - 1][0], pts[i - 1][1], pts[i][0], pts[i][1], { color: 'accent', width: 2 });
          if(r.azimuth!==null)Pl.dot(al.value,r.azimuth,{color:'gold',r:6});
          cur=r;
        });
        v.readout(()=>`Control coherence $z=\\langle\\psi|U|\\psi\\rangle=${fix(v,cur.overlap[0],4)}+(${fix(v,cur.overlap[1],4)})i$; Bloch length $|z|=${fix(v,cur.length,6)}$. ${cur.length<1-1e-10?'Control and target are entangled.':'Product output within numerical tolerance (length within 1e−10 of 1); smaller entanglement is unresolved here.'}\nControl azimuth: ${cur.azimuth===null?'undefined (zero coherence)':`$${fix(v,cur.azimuth,5)}$ rad`}; norm squared $${fix(v,cur.norm,6)}$. The blue curve is the positive-axis eigenstate reference only.`);
      },
    },

    // ------------------------------------------------------------------ 4.8
    {
      num: '4.8',
      kind: 'Definition',
      name: 'Quantum oracles',
      statement: String.raw`A Boolean function $f:\{0,1\}^n\to\{0,1\}$ is given to a quantum algorithm as an **oracle**: the unitary
$$\begin{gathered}O_f|x\rangle|y\rangle=|x\rangle|y\oplus f(x)\rangle\\\qquad(x\in\{0,1\}^n,\ y\in\{0,1\}),\end{gathered}$$
a permutation of the $2^{n+1}$ basis states (so it is unitary and its own inverse). Feeding the target $|-\rangle=(|0\rangle-|1\rangle)/\sqrt2$ turns the bit oracle into a **phase oracle**:
$$O_f|x\rangle|-\rangle=(-1)^{f(x)}|x\rangle|-\rangle .$$
One call applied to a superposition $\sum_x\alpha_x|x\rangle$ produces $\sum_x\alpha_x|x\rangle|y\oplus f(x)\rangle$ coherently. A measurement does not reveal all values of $f$ from this one query. Query complexity counts calls to $O_f$; the gate cost of building $O_f$ from $f$'s circuit (qinfo-4.1) is a separate matter.`,
      idea: String.raw`Computing $f$ reversibly needs the answer written *into* a spare bit, not over the input, which is the Toffoli construction of qinfo-4.1; XOR-ing keeps the map invertible whatever $f$ is. The phase oracle is phase kickback (qinfo-4.7): with $y=|-\rangle$ the target is an eigenvector of the flip $X$ with eigenvalue $-1$, so the controlled flip "if $f(x)=1$" multiplies the branch $|x\rangle$ by $-1$ and leaves the target alone. Writing $f$ as a table, $O_f$ is a product of one multiply-controlled NOT for every $x$ with $f(x)=1$ — at most $2^n$ of them.

For every Boolean f, applying the bit oracle twice restores y because XOR with the same bit cancels. It therefore permutes the entire computational basis bijectively, whatever collisions f itself has. The orthonormal-basis characterization ladr-7.53 makes its linear extension unitary. Reversibility belongs to the enlarged map retaining x, not to f alone; no assumption that f is injective is needed.`,
      caption: String.raw`Click the cells of the truth table to define $f$ on 3 bits (or use a preset). Choose the input register (a basis state, or the uniform superposition from a Hadamard layer) and the target. The bars show the 16 probabilities $|a_{xy}|^2$, with colour giving amplitude phase, after one oracle call; the circuit below builds $O_f$ from one multiply-controlled NOT per $x$ with $f(x)=1$ (open circles are controls on $0$). The readout verifies that this circuit equals $O_f$ on all 16 basis states. With target $|-\rangle$, the amplitudes just change sign where $f=1$.`,
      deps: ['qinfo-4.1', 'qinfo-4.7', 'ladr-7.53'],
      refs: ['Cleve et al., Quantum Algorithms Revisited, complete §§2–3 pp4–7, equations(2.1)–(2.3),(3.3)–(3.6): https://arxiv.org/pdf/quant-ph/9708016'],
      tags: ['oracle', 'query complexity', 'phase oracle'],
      scope: String.raw`Black-box model: algorithms are compared by the number of oracle calls. Real speed-ups must also account for the cost of implementing $O_f$.`,
      credit: 'Reversible bit/phase oracle formulation: Cleve, Ekert, Macchiavello & Mosca (1997 preprint)',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Oracle_machine#Quantum_oracle' },
      viz(v) {
        const Tt = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 330, weight: 0.8, minWidth: 190, title: 'truth table (click to flip)' });
        const Am = v.stage({ axes: false, height: 330, weight: 1.6, title: 'probabilities and amplitude phases after one oracle call' });
        const Dg = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 210, full: true, title: 'the oracle as a circuit' });
        const Q = v.quantum();
        let f = [0, 1, 1, 0, 1, 0, 0, 1];
        const preset = (name, fn) => v.button(name, () => { f = [...Array(8).keys()].map(fn); });
        preset('constant 0', () => 0); preset('parity', (x) => (x ^ (x >> 1) ^ (x >> 2)) & 1); preset('AND', (x) => (x === 7 ? 1 : 0)); preset('majority', (x) => (((x & 1) + ((x >> 1) & 1) + ((x >> 2) & 1)) >= 2 ? 1 : 0)); preset('first bit', (x) => (x >> 2) & 1);
        const inreg = v.select('input register', [{ value: 'sup', label: 'uniform superposition' }, { value: 'x', label: 'basis state' }], 'sup');
        const xs = v.slider('basis state $x$', 0, 7, 5, { int: true });
        const tg = v.select('target', [{ value: '0', label: '$|0\\rangle$' }, { value: '1', label: '$|1\\rangle$' }, { value: 'm', label: '$|-\\rangle$' }], '0');
        const T = v.table(Tt, { rows: 8, cols: 1, square: false, maxCell: 34, cellAspect: 2.2, size: 15, rowLabels: [...Array(8).keys()].map((x) => x.toString(2).padStart(3, '0')), colLabels: ['f(x)'], cornerLabel: 'x' });
        Tt.onClick((x, y) => { const c = T.hit(x, y); if (c && c.i >= 0 && c.j >= 0) f[c.i] ^= 1; });
        let cur;
        v.render(() => {
          const N=16,result=oracleOutput(f,{uniform:inreg.value==='sup',x:xs.value,target:tg.value}),a=result.out;
          Q.amplitudes(Am, Q.state(a), { wheel: true });
          T.draw({ value: (i) => f[i], fill: (i) => (f[i] ? ['green', 0.34] : null), format: (x) => String(x) });
          // circuit: one multi-controlled NOT per minterm
          const ones = f.map((b, x) => (b ? x : -1)).filter((x) => x >= 0), cx = Dg.ctx, W = Dg.W, H = Dg.H, left = 60, colW = Math.min(70, (W - left - 30) / Math.max(1, ones.length)), Y = (q) => 22 + q * ((H - 44) / 3), X = (i) => left + 30 + i * colW;
          const ink = v.color('ink'), panel = v.color('panel');
          cx.save(); cx.strokeStyle = v.color('muted'); cx.lineWidth = 1.4; cx.font = '600 13px Inter, system-ui'; cx.fillStyle = ink; cx.textAlign = 'right'; cx.textBaseline = 'middle';
          for (let q = 0; q < 4; q++) { cx.beginPath(); cx.moveTo(left - 6, Y(q)); cx.lineTo(X(Math.max(1, ones.length)) - 10, Y(q)); cx.stroke(); cx.fillText(q < 3 ? `x${q}` : 'y', left - 12, Y(q)); }
          ones.forEach((x, i) => {
            const px = X(i); cx.strokeStyle = ink; cx.lineWidth = 1.8; cx.beginPath(); cx.moveTo(px, Y(0)); cx.lineTo(px, Y(3)); cx.stroke();
            for (let q = 0; q < 3; q++) { const bit = (x >> (2 - q)) & 1; cx.beginPath(); cx.arc(px, Y(q), 5, 0, TAU); if (bit) { cx.fillStyle = ink; cx.fill(); } else { cx.fillStyle = panel; cx.fill(); cx.stroke(); } }
            cx.beginPath(); cx.arc(px, Y(3), 10, 0, TAU); cx.fillStyle = panel; cx.fill(); cx.stroke(); cx.beginPath(); cx.moveTo(px - 10, Y(3)); cx.lineTo(px + 10, Y(3)); cx.moveTo(px, Y(3) - 10); cx.lineTo(px, Y(3) + 10); cx.stroke();
            cx.fillStyle = v.color('muted'); cx.font = '500 11px "JetBrains Mono", monospace'; cx.textAlign = 'center'; cx.fillText(x.toString(2).padStart(3, '0'), px, 8);
          });
          if (!ones.length) { cx.fillStyle = v.color('muted'); cx.font = '600 14px Inter, system-ui'; cx.textAlign = 'left'; cx.fillText('f ≡ 0: the oracle is the identity (no gates)', left + 20, Y(1.5)); }
          cx.restore();
          // verification: apply the minterm gates to every basis state
          let ok = true; for (let s = 0; s < N; s++) { let y = s & 1; const x = s >> 1; for (const m of ones) if (m === x) y ^= 1; if (((x << 1) | y) !== ((x << 1) | ((s & 1) ^ f[x]))) ok = false; }
          const sgn = tg.value === 'm' ? f.filter((b) => b).length : 0;
          cur = { norm:result.norm, ones: ones.length, ok, sup: inreg.value === 'sup', m: tg.value === 'm', sgn, bal: ones.length === 4, cons: ones.length === 0 || ones.length === 8 };
        });
        v.readout(() => `Raw state norm squared $${fix(v,cur.norm,6)}$. $f$ has ${cur.ones} ones: the circuit uses ${cur.ones} multi-controlled NOT gates (at most $2^3=8$) and equals $O_f$ on all 16 basis states: **${cur.ok ? 'yes' : 'NO'}**\n${cur.m ? `target $|-\\rangle$: each amplitude is multiplied by $(-1)^{f(x)}$ and the target is left unchanged — a phase oracle` : 'target in a basis state: f(x) is XOR-ed into it; entanglement occurs only if the input has support on both f=0 and f=1'}\n$f$ is ${cur.cons ? '**constant**' : cur.bal ? '**balanced**' : 'neither constant nor balanced'}`);
      },
    },

    // ------------------------------------------------------------------ 4.9
    {
      num: '4.9',
      kind: 'Algorithm',
      name: 'Hamiltonian simulation by Trotterization',
      statement: String.raw`Let $H=\sum_{j=1}^m H_j$ be a finite-dimensional Hermitian Hamiltonian, $t\ge0$, and integer $r\ge1$; use the operator norm and $\hbar=1$.
Write $P_1(\tau)=e^{-iH_1\tau}\cdots e^{-iH_m\tau}$. Then
$$\begin{gathered}\left\|e^{-iHt}-P_1(t/r)^r\right\|\\\le\frac{t^2}{2r}\sum_{j<k}\|[H_j,H_k]\|.\end{gathered}$$
For two terms $H=A+B$, define the symmetric step $S_2(\tau)=e^{-iA\tau/2}e^{-iB\tau}e^{-iA\tau/2}$.
Writing $C_B=\|[B,[B,A]]\|$ and $C_A=\|[A,[A,B]]\|$, the symmetric-step bound is
$$\begin{gathered}\|S_2(t/r)^r-e^{-iHt}\|\\\le\frac{t^3}{r^2}\left(\frac{C_B}{12}+\frac{C_A}{24}\right).\end{gathered}$$
These bounds hold for every normalized input state. For a polynomial number of bounded-norm, constant-locality terms whose exponentials are efficiently implementable, they give a polynomial gate cost in $n,t,1/\varepsilon$; locality alone without bounds on coefficients and input description is not enough.`,
      idea: String.raw`Variation of parameters expresses the difference between a two-term product step and exact evolution as a double integral of unitary conjugates of $[A,B]$. Unitary invariance of the norm bounds it by $\tau^2\|[A,B]\|/2$, with no discarded BCH tail. Telescoping $r$ unitary steps gives $r$ times the one-step bound; induction over the terms gives the displayed sum. For the symmetric step the first-order defect cancels and a triple integral gives the two nested-commutator coefficients above. The BCH series explains the local orders heuristically, while the integral argument supplies a global bound.

The operator-norm triangle inequality ladr-7.87 is the step that turns local integral defects into the global bound. The difference between r product steps and r exact steps is a telescoping sum of r terms, each a one-step defect multiplied on both sides by unitaries. Those factors preserve operator norm, so the sum has norm at most r times the one-step bound. This uses finite-dimensional Hermitian generators and exact unitary factors; it does not discard a formal series tail.`,
      caption: String.raw`A transverse-field Ising chain of 5 spins, $H=\sum Z_iZ_{i+1}+g\sum X_i$, started in $|00000\rangle$ (non-commuting terms $A=\sum ZZ$ and $B=g\sum X$). Left: the state error $\|\psi_{\rm Trotter}-\psi_{\rm exact}\|$ at time $t$ against the number of steps $r$ on log–log axes: the asymptotic first-/second-order trends have slopes $-1$/$-2$ (finite-range slopes can differ), and the dashed line is the commutator bound $t^2\|[A,B]\|/2r$. Right: $\langle Z_2\rangle$ over time for a fixed step size $\tau$; the product-formula points are drawn at integer multiples of $\tau$. For this initial A-eigenstate and Z observable, first- and second-order curves coincide at these step endpoints: the intervening diagonal A half-steps cannot change Z probabilities. Exact zero errors are reported and omitted from logarithmic error axes.`,
      deps: ['qinfo-4.2', 'fa-13.38', 'qm-5.15', 'ladr-7.87'],
      refs: ['Childs, Su, Tran, Wiebe & Zhu, Theory of Trotter Error with Commutator Scaling, §5.1 pp37–39, equations(139)–(152), complete proofs of Propositions15–16: https://arxiv.org/pdf/1912.08854'],
      tags: ['Hamiltonian simulation', 'Trotter formula', 'quantum simulation'],
      scope: String.raw`Finite chain, real symmetric $H$, exact reference by diagonalization. Operator-norm bounds hold for every state; the observed state error can be much smaller.`,
      credit: 'Lie–Trotter and symmetric product formulas; explicit bounds from Childs et al.',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Hamiltonian_simulation' },
      viz(v) {
        const E = v.stage({ x: [1, 300], y: [1e-8, 3], xlog: true, ylog: true, axes: 'box', gutter: true, height: 320, weight: 1.1, xlabel: 'number of steps $r$', ylabel: 'state error', title: 'error at time $t$ against steps' });
        const Z = v.stage({ x: [0, 6], y: [-1.05, 1.05], axes: 'box', gutter: true, height: 320, weight: 1, xlabel: 'time', ylabel: '$\\langle Z_2\\rangle$', title: 'dynamics at fixed step size' });
        const g = v.slider('field $g$', 0, 2, 1, { step: 0.05 });
        const tt = v.slider('time $t$', 0, 6, 3, { step: 0.1 });
        const tau = v.slider('step size $\\tau$', 0.05, 1.2, 0.5, { step: 0.01 });
        let ecache;const exact=g=>{if(!ecache||ecache.g!==g)ecache={g,...isingModel(g,v.M.eigSym)};return ecache;};
        let cur;
        v.render(() => {
          const ex=exact(g.value),T=tt.value,ref=ex.state(T),rs=[1,...Array.from({length:24},(_,k)=>Math.round(1.25**(k+3)))].filter((x,i,a)=>a.indexOf(x)===i&&x<=300);
          const e1=rs.map(r=>[r,stateDistance(ex.trotter(r,T,1),ref)]),e2=rs.map(r=>[r,stateDistance(ex.trotter(r,T,2),ref)]),bound=rs.map(r=>[r,T*T*ex.comm/(2*r)]),positive=[...e1,...e2,...bound].filter(p=>p[1]>0),ys=positive.map(p=>p[1]);
          E.setView([1,300],ys.length?[Math.min(...ys)*.6,Math.max(...ys)*1.6]:[1e-14,1]);
          for(const[P,color,dash]of[[bound,'red',true],[e1,'accent',false],[e2,'green',false]]){const pts=P.filter(p=>p[1]>0);E.path(pts,{color,dash,width:dash?1.6:2.2});if(!dash)E.dots(pts,{color,r:3});}
          if(!ys.length)E.text('exact zero errors (not on log axis)',15,1e-7,{size:12,color:'muted',align:'center'});
          const K=Math.floor(6/tau.value),dense=Array.from({length:121},(_,k)=>[6*k/120,ex.Z(ex.state(6*k/120))]),p1=[[0,1]],p2=[[0,1]];let a1=ex.zero(),a2=ex.zero();
          for(let k=1;k<=K;k++){a1=ex.step(a1,tau.value,1);a2=ex.step(a2,tau.value,2);p1.push([k*tau.value,ex.Z(a1)]);p2.push([k*tau.value,ex.Z(a2)]);}
          Z.path(dense,{color:'ink',width:2});for(const[P,color]of[[p1,'accent'],[p2,'green']]){Z.path(P,{color,width:1.8});Z.dots(P,{color,r:2.6});}
          const slope=P=>P[0][1]>0&&P.at(-1)[1]>0?Math.log(P.at(-1)[1]/P[0][1])/Math.log(P.at(-1)[0]/P[0][0]):null;
          cur={comm:ex.comm,s1:slope(e1),s2:slope(e2),within:e1.every((p,i)=>p[1]<=bound[i][1]+2e-11),min:Math.min(...e1.map(p=>p[1]),...e2.map(p=>p[1])),zeros:[...e1,...e2].filter(p=>p[1]===0).length};
        });
        v.legend([['accent', 'first order (Lie–Trotter)'], ['green', 'second order (Strang)'], ['red', 'bound $t^2\\|[A,B]\\|/2r$', { dash: true }], ['ink', 'exact']]);
        v.readout(()=>`$\\|[A,B]\\|=${fix(v,cur.comm,4)}$; finite endpoint log–log slopes: first order ${cur.s1===null?'undefined (zero error)':fix(v,cur.s1,3)}, second order ${cur.s2===null?'undefined (zero error)':fix(v,cur.s2,3)}.\nSmallest computed state error $${v.sci(cur.min,3)}$; ${cur.zeros} exact-zero samples omitted from log axes. First-order state errors satisfy the unmodified operator bound within numerical reference tolerance: **${cur.within?'yes':'no'}**. Finite checks illustrate, rather than prove, the source inequalities.`);
      },
    },
  ],
};
