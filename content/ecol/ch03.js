// Ecology — Chapter 3: Dispersal and metapopulations
import { logP, metaSeries, gridInit, gridFrac, gridStep, drawGrid, roots01 } from './ch03.shared.js';

export default {
  collection: 'ecol',
  chapter: 3,
  title: 'Dispersal and metapopulations',
  summary: String.raw`Many species live as networks of local populations that wink out and are refounded by dispersers. Levins’ model reduces this to a balance of colonization and extinction with a sharp persistence threshold, which explains why habitat loss can doom a species long before its last patch disappears. Rescue effects, source–sink structure and habitat choice by ideal free individuals complete the spatial picture.`,
  items: [
    // ───────────────────────────────────────────────────────────── 3.1
    {
      num: '3.1',
      kind: 'Model',
      name: 'Levins metapopulation model',
      credit: 'R. Levins, 1969',
      statement: String.raw`A species occupies a large set of identical habitat patches, each either occupied or empty. Every occupied patch goes extinct at rate $e$; every empty patch is colonized at rate $c\,p$, proportional to the fraction $p$ of patches that are occupied (propagules reach every patch equally easily). For many patches the occupied fraction obeys $$\frac{dp}{dt}=c\,p\,(1-p)-e\,p .$$ The species is described by one number, $p(t)$, even though each patch flickers randomly.`,
      scope: String.raw`Needs many identical patches, global (well-mixed) dispersal, and colonization and extinction that are independent from patch to patch. With few patches the real process is a random walk that can hit zero; with only local dispersal the equation overstates occupancy.`,
      idea: String.raw`In a short time $dt$ an occupied patch dies with probability $e\,dt$ and an empty patch is colonized with probability $c\,p\,dt$; averaging over many patches turns these probabilities into the rates $-ep$ and $+cp(1-p)$. The result has exactly the form of the logistic equation (mathbio-1.4) with growth rate $c-e$ and "carrying capacity" $1-e/c$, so the metapopulation fills a fraction of its habitat, never all of it, because some patches are always between extinction and recolonization.`,
      caption: String.raw`Left: a $30\times30$ array of patches (900) is simulated patch by patch; blue patches are occupied. Right: the simulated fraction $p(t)$ (blue) hugs the solution of the differential equation (orange). Drag $c$ and $e$ and watch the plateau move to $1-e/c$. Now switch on **local dispersal only**: colonists come only from the eight neighbours, occupied patches clump, and the plateau sinks below the well-mixed prediction.`,
      deps: ['mathbio-1.4'],
      refs: ['Begon ch. 6'],
      tags: ['metapopulation', 'colonization', 'extinction'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Metapopulation' },
      viz(v) {
        const L = 30, TT = 40;
        let S;
        const reset = () => S.reset();
        const cS = v.slider('colonization rate $c$', 0.1, 2, 0.8, { step: 0.05, onChange: reset });
        const eS = v.slider('extinction rate $e$', 0.05, 1.5, 0.3, { step: 0.05, onChange: reset });
        const p0S = v.slider('initial occupied fraction', 0.02, 1, 0.1, { step: 0.02, onChange: reset });
        const loc = v.toggle('local dispersal only (8 neighbours)', false, { onChange: reset });
        S = v.sim(() => {
          const st = gridInit(L, v.rng(7), p0S.value, null);
          st.hist = [gridFrac(st)];
          return st;
        }, (st, dt) => { gridStep(st, dt, cS.value, eS.value, { local: loc.value }); st.hist.push(gridFrac(st)); }, { dt: 0.1, maxSteps: 600 });
        const A = v.stage({ x: [-0.4, L + 0.4], y: [-0.4, L + 0.4], axes: false, equal: true, height: 320, weight: 1, title: '900 habitat patches' });
        const B = v.stage({ x: [0, TT], y: [0, 1], axes: 'box', gutter: true, height: 320, weight: 1.4, xlabel: 'time', ylabel: 'occupied fraction $p$', title: 'fraction of patches occupied' });
        let info = null;
        v.animate((t) => {
          S.advance(2 * t);
          const st = S.state, c = cS.value, e = eS.value, pst = Math.max(0, 1 - e / c);
          drawGrid(A, st);
          const h = st.hist;
          B.hline(pst, { color: 'green', width: 1.6, dash: [6, 4] });
          const ode = []; for (let i = 0; i <= 200; i++) { const tt = (TT * i) / 200; ode.push([tt, logP(c, c - e, h[0], tt)]); }
          B.path(ode, { color: 'orange', width: 2.6 });
          B.path(h.map((p, i) => [i * 0.1, p]), { color: 'accent', width: 2.2 });
          const tn = st.t, pn = h[h.length - 1];
          B.dot(tn, pn, { r: 5, color: 'gold' });
          info = { pn, ode: logP(c, c - e, h[0], tn), pst, c, e, tn };
        }, { period: TT / 2, still: TT / 2 - 0.1 });
        v.legend([['accent', 'simulation (900 patches)'], ['orange', '$dp/dt=cp(1-p)-ep$'], ['green', '$1-e/c$', { dash: true }]]);
        v.readout(() => info && String.raw`$t=${v.fix(info.tn, 1)}$: simulated $p=${v.fix(info.pn, 3)}$, differential equation $p=${v.fix(info.ode, 3)}$ · equilibrium $p^*=1-e/c=${v.fix(info.pst, 3)}$ (with $e/c=${v.fix(info.e / info.c, 2)}$)` + (loc.value ? ' · local dispersal: the well-mixed assumption is broken, so the simulation need not follow the equation' : ''));
      },
    },
    // ───────────────────────────────────────────────────────────── 3.2
    {
      num: '3.2',
      kind: 'Theorem',
      name: 'Persistence threshold and equilibrium occupancy 1 − e/c',
      credit: 'R. Levins, 1969',
      statement: String.raw`In the Levins model $\dot p=cp(1-p)-ep$ with $c,e>0$: if $e\ge c$ every solution tends to $p=0$, so the species goes extinct. If $e<c$ the state $p=0$ is unstable and every solution starting from $p(0)>0$ converges to the single positive equilibrium $p^*=1-e/c$. The species persists exactly when $c>e$, i.e. when one occupied patch produces on average more than one newly colonized patch before it dies.`,
      scope: String.raw`A statement about the deterministic equation (infinitely many patches). A real metapopulation has finitely many patches, so even for $e<c$ chance can remove the last occupied patch; the smaller the network, the more the sharp threshold is blurred.`,
      idea: String.raw`Write $\dot p=p\,(c(1-p)-e)$. At $p=0$ the linearization is $\dot p\approx (c-e)p$, which grows if $c>e$ and decays if $c<e$. For $c>e$ the bracket is positive for $p<1-e/c$ and negative above it, so $p$ is pushed toward $1-e/c$ from both sides; for $c\le e$ it is negative for all $p>0$. Equivalently $1/p$ satisfies a linear equation (this is the logistic equation of mathbio-1.4), which gives the solution explicitly.`,
      caption: String.raw`Drag the gold handle along the horizontal axis to set $e/c$ (with $c=1$). The curve is the theorem, $\max(0,1-e/c)$; the dots are averages over 10 simulated metapopulations of $N$ patches each, started at half occupancy and run to $t=40$. Right: the 12 runs at the chosen $e/c$, with the deterministic solution (orange). With many patches the dots hug the line and fall to zero at $e/c=1$; shrink $N$ and the runs scatter, extinctions appear below the threshold, and the corner of the curve is rounded off.`,
      deps: ['ecol-3.1'],
      refs: ['Begon ch. 6'],
      tags: ['persistence', 'threshold', 'metapopulation'],
      viz(v) {
        const Nsl = v.slider('number of patches $N$', 20, 400, 100, { step: 10, int: true });
        let seed = 3;
        v.button('New runs', () => { seed += 1; });
        const A = v.stage({ x: [0, 1.5], y: [-0.08, 1.05], axes: 'box', gutter: true, height: 330, weight: 1, xlabel: 'extinction / colonization ratio $e/c$', ylabel: 'occupied fraction', title: 'equilibrium occupancy' });
        const B = v.stage({ x: [0, 40], y: [0, 1.02], axes: 'box', gutter: true, height: 330, weight: 1, xlabel: 'time (in units of $1/c$)', ylabel: 'occupied fraction $p$', title: 'twelve runs at the chosen $e/c$' });
        const hd = A.handle(0.6, 0, { color: 'gold', r: 8, label: 'e/c', constrain: (x) => [Math.min(1.5, Math.max(0.02, x)), 0] });
        const T = 40, dt = 0.2;
        const run = (N, ratio, sd, k) => metaSeries(v.rng(sd), { N, c: 1, e: ratio, T, dt, p0: 0.5 });
        let sweep = { key: '', pts: [] }, info = null;
        v.render(() => {
          const N = Nsl.value, ratio = hd.x;
          if (sweep.key !== N + '|' + seed) {
            const pts = [];
            for (let j = 0; j <= 15; j++) {
              const r = 0.1 * j;
              let m = 0, R = 10;
              for (let q = 0; q < R; q++) m += run(N, r || 0.001, 1000 * seed + 50 * j + q)[Math.round(T / dt)];
              pts.push([r, m / R]);
            }
            sweep = { key: N + '|' + seed, pts };
          }
          A.fn((x) => Math.max(0, 1 - x), { color: 'green', width: 2.8, domain: [0, 1.5] });
          A.vline(1, { color: 'red', width: 1.2, dash: [5, 4] });
          A.dots(sweep.pts, { r: 4.5, color: 'accent' });
          A.dot(ratio, Math.max(0, 1 - ratio), { r: 6, color: 'gold' });
          let ext = 0, fin = 0;
          const tt = (i) => i * dt;
          B.hline(Math.max(0, 1 - ratio), { color: 'green', width: 1.4, dash: [6, 4] });
          for (let q = 0; q < 12; q++) {
            const s = run(N, ratio, 77 * seed + q);
            const pts = []; for (let i = 0; i < s.length; i += 2) pts.push([tt(i), s[i]]);
            const last = s[s.length - 1]; fin += last; if (last === 0) ext++;
            B.path(pts, { color: last === 0 ? 'red' : 'accent', width: 1.5, alpha: 0.65 });
          }
          const ode = []; for (let i = 0; i <= 200; i++) ode.push([(T * i) / 200, logP(1, 1 - ratio, 0.5, (T * i) / 200)]);
          B.path(ode, { color: 'orange', width: 2.6 });
          info = { ratio, pst: Math.max(0, 1 - ratio), ext, mean: fin / 12, N };
        });
        v.legend([['green', '$\\max(0,1-e/c)$'], ['accent', 'simulation average / surviving run'], ['red', 'run that went extinct'], ['orange', 'deterministic solution']]);
        v.readout(() => info && String.raw`$e/c=${v.fix(info.ratio, 2)}$ → ${info.ratio < 1 ? String.raw`$c>e$: the theorem predicts $p^*=${v.fix(info.pst, 2)}$` : String.raw`$e\ge c$: the theorem predicts extinction`}; the 12 runs ($N=${info.N}$) end at mean $p=${v.fix(info.mean, 2)}$ with **${info.ext} of 12 extinct**` + (info.ratio < 1 && info.ext ? ' — extinctions below the threshold are a finite-size effect: with few patches the last occupied one can vanish by chance' : ''));
      },
    },
    // ───────────────────────────────────────────────────────────── 3.3
    {
      num: '3.3',
      kind: 'Model',
      name: 'Habitat destruction in the Levins model',
      credit: 'R. Lande, 1987; D. Tilman, R. M. May, C. L. Lehman & M. A. Nowak, 1994',
      statement: String.raw`Let a fraction $D$ of the patches be permanently destroyed, at random, so a fraction $1-D$ remains suitable. Colonists can settle only in empty suitable patches, so with $p$ the fraction of all patches that are occupied, $$\frac{dp}{dt}=c\,p\,(1-D-p)-e\,p,\qquad p^*=\max\bigl(0,\;1-D-e/c\bigr).$$ The occupied fraction falls linearly with $D$ and reaches zero at the critical loss $D_c=1-e/c$, even though a fraction $e/c$ of the original habitat is still intact and empty.`,
      scope: String.raw`Random loss in the well-mixed Levins model. Loss that is clustered or that removes the best-connected patches changes the threshold; local dispersal makes the real threshold higher (a species is lost sooner) than $1-e/c$. Lande (1987) used the idea of a threshold fraction of suitable habitat in a related territorial model; Tilman et al. (1994) used this form of destruction for competing species.`,
      idea: String.raw`Destroying patches removes targets for colonists, not the colonists themselves: the equation is the Levins model with the ceiling $1-p$ lowered to $1-D-p$. Writing it as $\dot p=p\,(r-cp)$ with net growth rate $r=c(1-D)-e$, the persistence theorem (3.2) applies with $r>0$ as the condition. Persistence therefore requires the remaining habitat $1-D$ to exceed $e/c$: the species needs a minimum amount of habitat, set by how good it is at colonizing relative to how often it goes extinct.`,
      caption: String.raw`Drag the gold handle (destroyed fraction $D$) on the right. Grey squares are destroyed patches, blue ones occupied, pale ones suitable but empty; the simulation restarts with every suitable patch occupied. The right panel shows the remaining habitat $1-D$ (orange), the predicted occupancy $p^*$ (blue) and the shaded gap of suitable habitat that stays empty. Push $D$ past the red line: the species vanishes while grey squares are still a minority.`,
      deps: ['ecol-3.2'],
      refs: ['Begon ch. 6'],
      tags: ['habitat loss', 'fragmentation', 'threshold'],
      viz(v) {
        const L = 30, N = L * L;
        const eS = v.slider('extinction / colonization ratio $e/c$', 0.05, 0.9, 0.25, { step: 0.01, onChange: () => S.reset() });
        const order = v.rng(21).shuffle(Array.from({ length: N }, (_, i) => i)), rank = new Int32Array(N);
        order.forEach((cell, r) => { rank[cell] = r; });
        let S;
        const B = v.stage({ x: [0, 1], y: [-0.08, 1.02], axes: 'box', gutter: true, height: 330, weight: 1.2, xlabel: 'fraction of habitat destroyed $D$', ylabel: 'fraction of all patches', title: 'what survives destruction' });
        const dh = B.handle(0.3, 0, { color: 'gold', r: 8, label: 'D', constrain: (x) => [Math.min(0.98, Math.max(0, x)), 0] });
        dh.onDrag = () => S.reset();
        const okMask = () => { const m = new Uint8Array(N), D = dh.x; for (let i = 0; i < N; i++) m[i] = rank[i] >= D * N ? 1 : 0; return m; };
        S = v.sim(() => { const ok = okMask(); return gridInit(L, v.rng(5), 1, ok); }, (st, dt) => gridStep(st, dt, 1, eS.value, {}), { dt: 0.1, maxSteps: 600 });
        const A = v.stage({ x: [-0.4, L + 0.4], y: [-0.4, L + 0.4], axes: false, equal: true, height: 330, weight: 1, title: 'the landscape' });
        let info = null;
        v.animate((t) => {
          S.advance(2 * t);
          const st = S.state, e = eS.value, D = dh.x, Dc = 1 - e, pst = Math.max(0, 1 - D - e);
          drawGrid(A, st);
          B.between((x) => Math.max(0, 1 - x - e), (x) => 1 - x, 0, 1, { fill: 'orange', fillAlpha: 0.18 });
          B.fn((x) => 1 - x, { color: 'orange', width: 2.2, domain: [0, 1] });
          B.fn((x) => Math.max(0, 1 - x - e), { color: 'accent', width: 3, domain: [0, 1] });
          B.vline(Dc, { color: 'red', width: 1.4, dash: [6, 4] });
          B.text('$D_c=1-e/c$', Dc, 0.96, { color: 'red', dx: -6, align: 'right', size: 12 });
          const pn = gridFrac(st);
          B.dot(D, pn, { r: 6, color: 'green' });
          info = { D, e, pst, pn, left: 1 - D, Dc };
        }, { period: 20, still: 19.9 });
        v.legend([['orange', 'suitable habitat $1-D$'], ['accent', 'predicted occupancy $1-D-e/c$'], ['green', 'simulated occupancy now', { dot: true }]]);
        v.readout(() => info && String.raw`$D=${v.fix(info.D, 2)}$: habitat left $1-D=${v.fix(info.left, 2)}$, predicted $p^*=\max(0,1-D-e/c)=${v.fix(info.pst, 2)}$, simulated $p=${v.fix(info.pn, 2)}$ · critical loss $D_c=${v.fix(info.Dc, 2)}$` + (info.D > info.Dc ? String.raw` · **beyond $D_c$ the species is doomed although ${v.fix(100 * info.left, 0)} % of the habitat remains**` : ''));
      },
    },
    // ───────────────────────────────────────────────────────────── 3.4
    {
      num: '3.4',
      kind: 'Phenomenon',
      name: 'Extinction debt',
      credit: 'D. Tilman, R. M. May, C. L. Lehman & M. A. Nowak, 1994',
      statement: String.raw`After habitat is lost, a metapopulation does not drop to its new equilibrium at once. Occupancy relaxes over many generations, so the number of patches (or species) present just after the loss exceeds what the remaining habitat can sustain in the long run; the difference is the **extinction debt**, extinctions that are already committed but not yet realised. If the loss takes the habitat below the persistence threshold, the debt is the whole population.`,
      scope: String.raw`Tilman et al. (1994) showed this for competing species in a Levins-type model, where the best competitors are the most vulnerable. Here the debt is shown for a single species in the Levins model: the relaxation time is $1/|c(1-D)-e|$, which grows without bound as the remaining habitat approaches the threshold. Time units are $1/c$; real time scales depend on generation times.`,
      idea: String.raw`Habitat destruction (3.3) changes the equilibrium immediately, but the state only follows through the dynamics $\dot p=p\,(r-cp)$, with $r=c(1-D)-e$ the net growth rate. Near either equilibrium the distance to it shrinks like $e^{-|r|t}$, so the delay is $1/|r|$. As $D$ approaches $D_c=1-e/c$, $r\to0$ and the delay diverges: critical slowing down. Landscapes that look healthy for generations after a loss may already be committed to losing the species.`,
      caption: String.raw`The landscape is intact until $t=10$, then a fraction $D$ of patches is destroyed at random. Blue line: deterministic occupancy; faint lines: eight stochastic runs. The orange shading is the debt, current occupancy minus the eventual equilibrium. Raise $D$ toward the red threshold on the right panel and the decline stretches from a few time units to many hundreds; set $D$ just beyond it and the species lingers for a very long time before disappearing.`,
      deps: ['ecol-3.3'],
      refs: ['Begon ch. 6'],
      tags: ['extinction debt', 'habitat loss', 'time lag'],
      viz(v) {
        const T = 100, dt = 0.25, t0 = 10;
        const Ds = v.slider('habitat destroyed $D$', 0.05, 0.95, 0.72, { step: 0.01 });
        const es = v.slider('extinction / colonization ratio $e/c$', 0.05, 0.9, 0.25, { step: 0.01 });
        const Ns = v.slider('number of patches $N$', 50, 400, 200, { step: 10, int: true });
        let seed = 5;
        v.button('New runs', () => { seed += 1; });
        const A = v.stage({ x: [0, T], y: [0, 1], axes: 'box', gutter: true, height: 330, weight: 1.4, xlabel: 'time (units of $1/c$)', ylabel: 'occupied fraction of all patches', title: 'occupancy after a sudden loss' });
        const B = v.stage({ x: [0, 1], y: [1, 500], ylog: true, axes: 'box', gutter: true, height: 330, weight: 1, xlabel: 'fraction destroyed $D$', ylabel: 'relaxation time $1/|r|$', title: 'how long the debt lasts' });
        let info = null;
        v.render(() => {
          const D = Ds.value, e = es.value, N = Ns.value, pOld = Math.max(0, 1 - e), pNew0 = pOld * (1 - D), r = (1 - D) - e, pEnd = Math.max(0, r);
          const f = (t) => (t < t0 ? pOld : logP(1, r, pNew0, t - t0));
          A.hline(pEnd, { color: 'green', width: 1.4, dash: [6, 4] });
          A.vline(t0, { color: 'red', width: 1.2, dash: [5, 4] });
          const th = []; for (let i = 0; i <= 400; i++) th.push((T * i) / 400);
          A.between((t) => (t < t0 ? pEnd : f(t)), () => pEnd, t0, T, { fill: 'orange', fillAlpha: 0.3 });
          for (let q = 0; q < 8; q++) {
            const s = metaSeries(v.rng(300 * seed + q), { N, c: 1, e, T, dt, p0: pOld, D: (t) => (t < t0 ? 0 : D) });
            const pts = []; for (let i = 0; i < s.length; i += 2) pts.push([i * dt, s[i]]);
            A.path(pts, { color: 'accent', width: 1.2, alpha: 0.35 });
          }
          A.path(th.map((t) => [t, f(t)]), { color: 'accent', width: 3.2 });
          A.text('loss', t0, 0.97, { color: 'red', dx: 5, align: 'left', size: 12 });
          A.text('eventual equilibrium', T - 2, pEnd + 0.03, { color: 'green', align: 'right', size: 11 });
          const Dc = 1 - e, tau = 1 / Math.max(Math.abs(r), 1e-3);
          B.fn((x) => Math.min(500, 1 / Math.max(Math.abs(1 - x - e), 1e-3)), { color: 'accent', width: 2.8, domain: [0, 1] });
          B.vline(Dc, { color: 'red', width: 1.4, dash: [6, 4] });
          B.dot(D, Math.min(500, tau), { r: 7, color: 'gold' });
          const debt0 = pNew0 - pEnd, later = f(t0 + 20) - pEnd;
          info = { D, pOld, pNew0, pEnd, debt0, frac20: debt0 > 1e-9 ? later / debt0 : 0, tau, Dc, r };
        });
        v.legend([['accent', 'deterministic $p(t)$'], ['accent', 'stochastic runs', { dash: true }], ['orange', 'extinction debt', { area: true }], ['green', 'new equilibrium', { dash: true }]]);
        v.readout(() => info && String.raw`Before the loss $p=${v.fix(info.pOld, 2)}$; just after, $p=${v.fix(info.pNew0, 2)}$; eventually $p^*=${v.fix(info.pEnd, 2)}$. **Debt at the moment of loss: ${v.fix(info.debt0, 2)}** of all patches` + (info.pEnd === 0 ? ' (the whole population: the species is committed to extinction)' : '') + String.raw` · relaxation time $1/|r|=${v.fix(info.tau, 1)}$; 20 time units after the loss ${v.fix(100 * info.frac20, 0)} % of the debt is still unpaid · threshold $D_c=${v.fix(info.Dc, 2)}$`);
      },
    },
    // ───────────────────────────────────────────────────────────── 3.5
    {
      num: '3.5',
      kind: 'Phenomenon',
      name: 'Rescue effect',
      credit: 'J. H. Brown & A. Kodric-Brown, 1977',
      statement: String.raw`When dispersers from other patches arrive often, they can prop up a small local population that would otherwise go extinct, so the extinction rate of a patch falls as the fraction $p$ of occupied patches rises. In a Levins model with extinction rate $e(p)=e\,e^{-kp}$ the equation $$\dot p=p\,\bigl[c(1-p)-e\,e^{-kp}\bigr]$$ can have two stable states (extinction and a high-occupancy state) separated by an unstable threshold: a metapopulation that would be lost from low occupancy can persist if it starts, or is pushed, above the threshold.`,
      scope: String.raw`Brown and Kodric-Brown introduced the rescue effect for islands in the MacArthur–Wilson framework, as lower extinction on islands that receive more immigrants. The particular exponential form $e\,e^{-kp}$ and the global dispersal used here are an illustrative choice; the qualitative bistability needs only that extinction falls fast enough with occupancy.`,
      idea: String.raw`Without rescue ($k=0$) the model is Levins' (3.1) and has a single globally attracting equilibrium for $c>e$. Rescue makes per-patch extinction depend on $p$, turning $\dot p/p=c(1-p)-e\,e^{-kp}$ into a function that can start negative at $p=0$ (if $c<e$) and become positive at larger $p$. Its two zeros are the unstable threshold and the high stable state; the sign of the bracket tells which way each starting point flows.`,
      caption: String.raw`Left: the same grid as in 3.1; pale gold flashes mark patches where an extinction was just cancelled by immigration. Right: the net growth rate $\dot p$ against $p$; green dots are stable equilibria, the red ring the unstable threshold. Set the rescue strength $k$ to zero and the threshold disappears (extinction is the only stable state when $c<e$). With $k$ large, start below the threshold and the metapopulation dies; start above it and it recovers.`,
      deps: ['ecol-3.1'],
      refs: ['Begon ch. 6'],
      tags: ['rescue effect', 'bistability', 'immigration'],
      viz(v) {
        const L = 30;
        let S;
        const reset = () => S.reset();
        const kS = v.slider('rescue strength $k$', 0, 8, 5, { step: 0.1, onChange: reset });
        const cS = v.slider('colonization rate $c$', 0.2, 1.5, 0.6, { step: 0.05, onChange: reset });
        const eS = v.slider('extinction rate $e$', 0.2, 1.5, 1, { step: 0.05, onChange: reset });
        const p0S = v.slider('initial occupied fraction', 0.02, 1, 0.5, { step: 0.02, onChange: reset });
        S = v.sim(() => gridInit(L, v.rng(9), p0S.value, null), (st, dt) => gridStep(st, dt, cS.value, eS.value, { k: kS.value }), { dt: 0.1, maxSteps: 600 });
        const A = v.stage({ x: [-0.4, L + 0.4], y: [-0.4, L + 0.4], axes: false, equal: true, height: 320, weight: 1, title: 'patches' });
        const B = v.stage({ x: [0, 1], y: [-0.25, 0.25], axes: 'box', gutter: true, height: 320, weight: 1.2, xlabel: 'occupied fraction $p$', ylabel: '$dp/dt$', title: 'net growth rate' });
        let info = null;
        v.animate((t) => {
          S.advance(2 * t);
          const st = S.state, c = cS.value, e = eS.value, k = kS.value;
          drawGrid(A, st);
          const F = (p) => p * (c * (1 - p) - e * Math.exp(-k * p));
          const lo = Math.min(...[0, 0.2, 0.4, 0.6, 0.8, 1].map(F)), hi = Math.max(...[0.1, 0.3, 0.5, 0.7, 0.9].map(F));
          B.setView([0, 1], [Math.min(-0.05, lo * 1.3 - 0.01), Math.max(0.05, hi * 1.3 + 0.01)]);
          B.hline(0, { color: 'muted', width: 1 });
          B.fn(F, { color: 'accent', width: 3, domain: [0, 1] });
          const rs = roots01((p) => c * (1 - p) - e * Math.exp(-k * p));
          const lowStable = c - e < 0;
          if (lowStable) B.dot(0, 0, { r: 6, color: 'green' }); else B.dot(0, 0, { r: 6, hollow: true, color: 'red' });
          for (const r of rs) B.dot(r.p, 0, { r: 6, color: r.stable ? 'green' : 'red', hollow: !r.stable });
          const pn = gridFrac(st);
          B.dot(pn, F(pn), { r: 5, color: 'gold' });
          A.corner(`rescues this step: ${st.rescued}`, 'tl', { color: 'ink', plate: true });
          info = { rs, lowStable, pn, c, e, k };
        }, { period: 20, still: 19.9 });
        v.legend([['accent', '$dp/dt$'], ['green', 'stable state', { dot: true }], ['red', 'unstable threshold', { dot: true }], ['gold', 'current $p$', { dot: true }]]);
        v.readout(() => {
          if (!info) return '';
          const th = info.rs.filter((r) => !r.stable).map((r) => v.fix(r.p, 2)), hs = info.rs.filter((r) => r.stable).map((r) => v.fix(r.p, 2));
          return String.raw`Simulated $p=${v.fix(info.pn, 2)}$ · extinction $p=0$ is ${info.lowStable ? '**stable**' : 'unstable'}` + (hs.length ? ` · stable occupied state(s): $p^*=${hs.join(', ')}$` : ' · no occupied equilibrium') + (th.length ? ` · threshold at $p=${th.join(', ')}$: start above it and the metapopulation persists, below it and it dies` : '') + (info.k === 0 ? ' · no rescue: this is the Levins model' : '');
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 3.6
    {
      num: '3.6',
      kind: 'Model',
      name: 'Source–sink dynamics',
      credit: 'H. R. Pulliam, 1988',
      statement: String.raw`Two habitats are linked by dispersal. In the **source**, births exceed deaths, so the population would grow to its carrying capacity $K$ by itself; in the **sink**, deaths exceed births at every density, so on its own the population declines at net rate $d$. With a fraction $m$ per unit time of the source population emigrating to the sink, $$\dot N_1=rN_1\Bigl(1-\frac{N_1}{K}\Bigr)-mN_1,\qquad \dot N_2=-dN_2+mN_1 .$$ If $r>m$ the source persists at $N_1^*=K(1-m/r)$ and the sink is held at $N_2^*=mN_1^*/d$, which can exceed $N_1^*$. Cut the link ($m=0$) and the sink decays as $e^{-dt}$.`,
      scope: String.raw`A deterministic two-patch caricature: logistic growth in the source, density-independent net loss in the sink, a constant emigration fraction, no return migration and no behavioural habitat choice. Pulliam (1988) built a more general model with several habitats and density-dependent regulation; the point shown here, that a count of individuals in a habitat does not show that the habitat is self-sustaining, is the central one.`,
      idea: String.raw`The sink equation is linear: the sink loses individuals at rate $d$ per capita and gains $mN_1$ from the source, so it settles where gain equals loss, $N_2^*=mN_1/d$. The source equation is logistic (mathbio-1.2 and 1.4 show the exponential and logistic pieces) with emigration acting as an extra death rate $m$, which lowers its growth rate to $r-m$ and its equilibrium to $K(1-m/r)$. When $m\ge r$ the source itself becomes a sink and everything is lost.`,
      caption: String.raw`Left: circle area is population size; the arrow is the flow of emigrants. Right: both populations over time, with their equilibria (dashed). The corridor is cut at $t=35$ (toggle it off to keep it open): the sink collapses at rate $d$ while the source, relieved of emigration, climbs to $K$. Raise $m$ or lower $d$ and the sink holds more animals than the source that feeds it; push $m$ past $r$ and the source is drained as well.`,
      deps: ['mathbio-1.2'],
      refs: ['Begon ch. 6'],
      tags: ['source-sink', 'dispersal', 'habitat quality'],
      viz(v) {
        const K = 100, TT = 60, TC = 35;
        let S;
        const reset = () => S.reset();
        const rS = v.slider('source growth rate $r$', 0.1, 1.5, 0.5, { step: 0.05, onChange: reset });
        const mS = v.slider('emigration rate $m$', 0, 0.6, 0.15, { step: 0.01, onChange: reset });
        const dS = v.slider('sink net loss rate $d$', 0.02, 0.6, 0.1, { step: 0.01, onChange: reset });
        const cut = v.toggle('cut the corridor at $t=35$', true, { onChange: reset });
        S = v.sim(() => ({ N1: 10, N2: 0, t: 0, h: [[0, 10, 0]] }), (st, dt) => {
          const r = rS.value, d = dS.value, m = cut.value && st.t >= TC ? 0 : mS.value;
          const f = (a, b) => [r * a * (1 - a / K) - m * a, -d * b + m * a];
          const k1 = f(st.N1, st.N2), k2 = f(st.N1 + (dt / 2) * k1[0], st.N2 + (dt / 2) * k1[1]);
          st.N1 += dt * k2[0]; st.N2 += dt * k2[1]; st.t += dt;
          st.h.push([st.t, st.N1, st.N2]);
        }, { dt: 0.1, maxSteps: 1000 });
        const A = v.stage({ x: [0, 10], y: [0, 5], equal: true, axes: false, height: 300, weight: 1, title: 'two habitats and a corridor' });
        const B = v.stage({ x: [0, TT], y: [0, 120], axes: 'box', gutter: true, height: 300, weight: 1.3, xlabel: 'time', ylabel: 'individuals', title: 'population sizes' });
        let info = null;
        v.animate((tt) => {
          S.advance(2 * tt);
          const st = S.state, r = rS.value, d = dS.value, m0 = mS.value, open = !(cut.value && st.t >= TC);
          const N1s = Math.max(0, K * (1 - m0 / r)), N2s = (m0 * N1s) / d;
          const rad = (N) => 0.25 + 1.5 * Math.sqrt(Math.max(0, N) / 200);
          A.circle(2.4, 2.5, rad(st.N1), { fill: 'green', fillAlpha: 0.3, color: 'green', width: 2 });
          A.circle(7.6, 2.5, rad(st.N2), { fill: 'red', fillAlpha: 0.25, color: 'red', width: 2 });
          A.circle(2.4, 2.5, rad(N1s), { color: 'green', width: 1, dash: [4, 4], alpha: 0.7 });
          A.circle(7.6, 2.5, rad(N2s), { color: 'red', width: 1, dash: [4, 4], alpha: 0.7 });
          A.text('source', 2.4, 4.7, { color: 'green', align: 'center', size: 13, weight: 700 });
          A.text('sink', 7.6, 4.7, { color: 'red', align: 'center', size: 13, weight: 700 });
          A.text(`${v.fix(st.N1, 0)}`, 2.4, 2.5, { align: 'center', baseline: 'middle', size: 15, weight: 700 });
          A.text(`${v.fix(st.N2, 0)}`, 7.6, 2.5, { align: 'center', baseline: 'middle', size: 15, weight: 700 });
          if (open) A.arrow(2.4 + rad(st.N1) + 0.15, 2.5, 7.6 - rad(st.N2) - 0.15, 2.5, { color: 'orange', width: 1 + 8 * m0 * st.N1 / K });
          else { A.line(4.4, 2.5, 5.6, 2.5, { color: 'muted', width: 2, dash: [3, 4] }); A.text('corridor cut', 5, 3.0, { color: 'muted', align: 'center', size: 12 }); }
          B.setView([0, TT], [0, Math.max(120, 1.15 * Math.max(N2s, N1s, K))]);
          if (cut.value) B.vline(TC, { color: 'red', dash: [5, 4], width: 1.2 });
          B.hline(N1s, { color: 'green', dash: [6, 4], width: 1.2 }); B.hline(N2s, { color: 'red', dash: [6, 4], width: 1.2 });
          if (cut.value) B.fn((x) => (x >= TC ? (st.h.find((q) => q[0] >= TC) || st.h[st.h.length - 1])[2] * Math.exp(-d * (x - TC)) : NaN), { color: 'red', width: 1.4, dash: [2, 4], domain: [TC, TT] });
          B.path(st.h.map((q) => [q[0], q[1]]), { color: 'green', width: 3 });
          B.path(st.h.map((q) => [q[0], q[2]]), { color: 'red', width: 3 });
          info = { N1: st.N1, N2: st.N2, N1s, N2s, r, m: m0, d, open, t: st.t };
        }, { period: TT / 2, still: 17 });
        v.legend([['green', 'source $N_1$'], ['red', 'sink $N_2$'], ['red', 'sink without immigration $e^{-dt}$', { dash: true }]]);
        v.readout(() => info && (info.m >= info.r ? String.raw`$m\ge r$: emigration drains the source faster than it grows, so it too declines to zero` : String.raw`Equilibria with the corridor open: $N_1^*=K(1-m/r)=${v.fix(info.N1s, 0)}$, $N_2^*=mN_1^*/d=${v.fix(info.N2s, 0)}$ (${info.N2s > info.N1s ? '**the sink holds more individuals than the source**' : 'the sink holds fewer'}) · now $t=${v.fix(info.t, 0)}$: $N_1=${v.fix(info.N1, 0)}$, $N_2=${v.fix(info.N2, 0)}$` + (info.open ? '' : ' · corridor cut: the sink dies away at rate $d$')));
      },
    },
    // ───────────────────────────────────────────────────────────── 3.7
    {
      num: '3.7',
      kind: 'Model',
      name: 'Incidence function model (Hanski)',
      credit: 'I. Hanski, 1994',
      statement: String.raw`A spatially realistic metapopulation model: each patch $i$ has an area $A_i$ and a position, and in each year it is a two-state Markov chain (empty or occupied). An occupied patch goes extinct with probability $E_i=\min\{1,(A_0/A_i)^x\}$, so small patches are risky. An empty patch is colonized with probability $C_i=S_i^2/(S_i^2+y^2)$, where the connectivity $S_i=\sum_{j\ne i}p_j\,e^{-\alpha d_{ij}}A_j$ adds up the neighbours that are occupied, weighted by their size and by how far their dispersers must travel. The long-run probability that patch $i$ is occupied, its **incidence**, is $J_i=C_i/(C_i+E_i-C_iE_i)$ when a rescue effect lets immigration cancel some extinctions.`,
      scope: String.raw`Versions differ in whether a rescue effect is included and in how area enters colonization (here $A_j$ to the first power). The picture below is a synthetic landscape with illustrative parameters; Hanski fitted the parameters of such a model to patch-occupancy surveys of the Glanville fritillary butterfly on the Åland islands, and no survey data are reproduced here. Here $J_i$ is evaluated with the neighbours' occupancies set to their long-run simulated frequencies, which is how the model is used with survey data (observed occupancy pattern in, predicted incidence out); the stochastic chain itself also feeds back on those occupancies, so agreement is approximate.`,
      idea: String.raw`Treating each patch as a Markov chain with transition probabilities $C_i$ (empty to occupied) and $E_i(1-C_i)$ (occupied to empty) gives a stationary occupancy $J_i$ that depends on the neighbours' occupancy through $S_i$. Feeding the pattern of occupancy into $S_i$ predicts each patch's incidence. This is the patch-by-patch version of the Levins model (3.1): the same balance of colonization and extinction, now with extinction set by area and colonization by distance-weighted neighbours.`,
      caption: String.raw`Left: a random landscape of 45 patches (area $\propto$ circle area), animated year by year; filled = occupied. **Click a patch** to remove it from the landscape. Right: each patch's predicted incidence $J_i$ against the fraction of years it was occupied in a 2 500-year simulation of the chain; points near the diagonal mean the formula predicts the simulation. Small, isolated patches have low incidence; remove a hub and its neighbours' incidence drops.`,
      deps: ['ecol-3.1'],
      refs: ['Begon ch. 6'],
      tags: ['metapopulation', 'patch occupancy', 'spatial model'],
      viz(v) {
        const n = 45, r0 = v.rng(12), P = [], Ar = [];
        for (let i = 0; i < n; i++) { P.push([0.4 + 9.2 * r0(), 0.4 + 9.2 * r0()]); Ar.push(Math.min(4, Math.max(0.08, 0.6 * Math.exp(0.9 * r0.normal())))); }
        const Dm = P.map((a) => P.map((b) => Math.hypot(a[0] - b[0], a[1] - b[1])));
        const aS = v.slider('distance decay $\\alpha$', 0.3, 3, 1.2, { step: 0.05, onChange: () => S.reset() });
        const yS = v.slider('colonization scale $y$', 0.3, 8, 1.2, { step: 0.1, onChange: () => S.reset() });
        const a0S = v.slider('critical area $A_0$', 0.02, 0.6, 0.15, { step: 0.01, onChange: () => S.reset() });
        const xS = v.slider('extinction exponent $x$', 0.5, 3, 1.2, { step: 0.1, onChange: () => S.reset() });
        const alive = new Uint8Array(n).fill(1);
        let rev = 0, S;
        const E = (i) => Math.min(1, Math.pow(a0S.value / Ar[i], xS.value));
        const conn = (i, occ, W) => { let s = 0; for (let j = 0; j < n; j++) if (j !== i && alive[j]) s += W[i][j] * occ[j]; return s; };
        const Wm = () => P.map((_, i) => P.map((_, j) => Math.exp(-aS.value * Dm[i][j]) * Ar[j]));
        const Cf = (s) => (s * s) / (s * s + yS.value ** 2 + 1e-12);
        let cache = { key: '' };
        function solve() {
          const key = [aS.value, yS.value, a0S.value, xS.value, rev].join('|');
          if (cache.key === key) return cache;
          const W = Wm(), J0 = new Float64Array(n).fill(0.5);
          for (let it = 0; it < 150; it++) for (let i = 0; i < n; i++) {
            if (!alive[i]) { J0[i] = 0; continue; }
            const c = Cf(conn(i, J0, W)), e = E(i);
            J0[i] = 0.5 * J0[i] + 0.5 * (c / (c + e - c * e + 1e-12));
          }
          const r = v.rng(31 + rev), occ = new Uint8Array(n), cnt = new Float64Array(n), Y = 2500, burn = 200;
          for (let i = 0; i < n; i++) occ[i] = alive[i] && r() < J0[i] ? 1 : 0;
          for (let yr = 0; yr < Y + burn; yr++) {
            const nxt = new Uint8Array(n);
            for (let i = 0; i < n; i++) {
              if (!alive[i]) continue;
              const c = Cf(conn(i, occ, W)), e = E(i);
              nxt[i] = occ[i] ? (r() < e * (1 - c) ? 0 : 1) : r() < c ? 1 : 0;
            }
            occ.set(nxt);
            if (yr >= burn) for (let i = 0; i < n; i++) cnt[i] += occ[i];
          }
          const F = Array.from(cnt, (x) => x / Y);
          // incidence from the connectivities of the long-run occupancy pattern, as when the model is fitted to a survey
          const J = new Float64Array(n);
          for (let i = 0; i < n; i++) if (alive[i]) { const c = Cf(conn(i, F, W)), e = E(i); J[i] = c / (c + e - c * e + 1e-12); }
          cache = { key, W, J, F, J0 };
          return cache;
        }
        S = v.sim(() => { const c = solve(); const rr = v.rng(77 + rev), occ = new Uint8Array(n); for (let i = 0; i < n; i++) occ[i] = alive[i] && rr() < c.F[i] ? 1 : 0; return { occ, rr, yr: 0 }; }, (st) => {
          const c = solve(), nxt = new Uint8Array(n);
          for (let i = 0; i < n; i++) {
            if (!alive[i]) continue;
            const cc = Cf(conn(i, st.occ, c.W)), e = E(i);
            nxt[i] = st.occ[i] ? (st.rr() < e * (1 - cc) ? 0 : 1) : st.rr() < cc ? 1 : 0;
          }
          st.occ = nxt; st.yr++;
        }, { dt: 1, maxSteps: 200 });
        const A = v.stage({ x: [-0.3, 10.3], y: [-0.3, 10.3], equal: true, axes: false, height: 340, weight: 1, title: 'patch network (click a patch to remove or restore it)' });
        const B = v.stage({ x: [0, 1], y: [0, 1], axes: 'box', gutter: true, height: 340, weight: 1, xlabel: 'predicted incidence $J_i$', ylabel: 'fraction of years occupied (simulation)', title: 'formula against simulation' });
        A.onClick((x, y) => {
          let best = -1, bd = 0.8;
          for (let i = 0; i < n; i++) { const d = Math.hypot(P[i][0] - x, P[i][1] - y); if (d < bd) { bd = d; best = i; } }
          if (best >= 0) { alive[best] = alive[best] ? 0 : 1; rev++; S.reset(); v.invalidate(); }
        });
        let info = null;
        v.animate((t) => {
          S.advance(4 * t);
          const st = S.state, c = solve();
          for (let i = 0; i < n; i++) {
            const rad = 0.12 + 0.3 * Math.sqrt(Ar[i]);
            if (!alive[i]) { A.dot(P[i][0], P[i][1], { r: 4, hollow: true, color: 'faint', ring: false }); continue; }
            A.circle(P[i][0], P[i][1], rad, { fill: st.occ[i] ? 'accent' : 'panel', fillAlpha: st.occ[i] ? 0.9 : 0.6, color: st.occ[i] ? 'accent' : 'muted', width: 1.6 });
          }
          B.line(0, 0, 1, 1, { color: 'green', width: 1.6, dash: [6, 4] });
          let sse = 0, cntA = 0, mJ = 0, mF = 0;
          for (let i = 0; i < n; i++) if (alive[i]) { B.dot(c.J[i], c.F[i], { r: 3 + 2.2 * Math.sqrt(Ar[i]), color: 'accent', alpha: 0.7, ring: false }); sse += (c.J[i] - c.F[i]) ** 2; cntA++; mJ += c.J[i]; mF += c.F[i]; }
          const now = st.occ.reduce((a, b) => a + b, 0);
          info = { rmse: Math.sqrt(sse / Math.max(1, cntA)), mJ: mJ / Math.max(1, cntA), mF: mF / Math.max(1, cntA), now, cntA, yr: st.yr };
        }, { period: 50, still: 30 });
        v.readout(() => info && String.raw`Year ${info.yr}: ${info.now} of ${info.cntA} patches occupied · over 2 500 simulated years the mean occupancy is ${v.fix(100 * info.mF, 0)} % against a predicted mean incidence ${v.fix(100 * info.mJ, 0)} % · root-mean-square gap between $J_i$ and the simulated frequency: ${v.fix(info.rmse, 3)}`);
      },
    },
    // ───────────────────────────────────────────────────────────── 3.8
    {
      num: '3.8',
      kind: 'Hypothesis',
      name: 'Core–satellite hypothesis',
      credit: 'I. Hanski, 1982',
      statement: String.raw`Across a set of habitat patches, the species of a community should fall into two groups: **core** species that occupy most sites and **satellite** species confined to a few, with few species in between, so the distribution of regional occupancy is bimodal. Hanski explained this with a metapopulation model in which extinction falls as a species becomes more widespread (a rescue effect): species whose colonization beats extinction run away to occupy nearly everything, and the rest stay rare.`,
      scope: String.raw`This page uses a minimal model written for illustration (patch-count Markov chains with extinction rate $e(1-\rho p)$ and a small propagule rain $\varepsilon$ from outside), not Hanski's own equations or data. Empirical tests of bimodal occupancy distributions have been mixed: some surveys find it, others find unimodal patterns, and sampling can also produce bimodality on its own.`,
      idea: String.raw`With rescue strength $\rho$ the occupancy follows $\dot p=(cp+\varepsilon)(1-p)-ep(1-\rho p)$. For $\rho=1$ this factorizes as $(1-p)\,[(c-e)p+\varepsilon]$: if $c>e-\varepsilon$ the factor in brackets stays positive and $p\to1$ (a core species); otherwise it settles at $p^*=\varepsilon/(e-c)$, near zero unless $c$ is almost $e$ (a satellite). Species that differ only slightly in $c/e$ therefore end up at very different occupancies. Without rescue ($\rho=0$) occupancy varies smoothly with $c/e$, as in the Levins model (3.1), and no gap appears.`,
      caption: String.raw`Each of 160 species has its own colonization rate $c$ (spread of $\ln(c/e)$ set by the slider) and the same extinction rate. Left: simulated regional occupancy of every species against $\ln(c/e)$, with the deterministic prediction (orange). Right: the histogram of occupancy. With rescue **on** the histogram has two peaks; slide $\rho$ to zero and the gap fills in, so the hypothesis depends on the rescue effect (3.5). Fewer sites blur both peaks.`,
      deps: ['ecol-3.5'],
      refs: ['Begon ch. 6'],
      tags: ['core-satellite', 'regional distribution', 'rescue effect'],
      viz(v) {
        const ns = 160, rr = v.rng(4), U = Array.from({ length: ns }, () => rr.normal());
        let seed = 1;
        const rho = v.slider('rescue strength $\\rho$', 0, 1, 1, { step: 0.05 });
        const sg = v.slider('spread of $\\ln(c/e)$', 0.2, 1.6, 0.8, { step: 0.05 });
        const mu = v.slider('typical $\\ln(c/e)$', -1, 1, 0, { step: 0.05 });
        const eps = v.slider('propagule rain $\\varepsilon$', 0.005, 0.1, 0.03, { step: 0.005 });
        const Ns = v.slider('sites per species $N$', 20, 200, 60, { step: 10, int: true });
        v.button('Resample', () => { seed++; });
        const A = v.stage({ x: [-2.5, 2.5], y: [-0.05, 1.05], axes: 'box', gutter: true, height: 330, weight: 1.1, xlabel: 'colonization / extinction, $\\ln(c/e)$', ylabel: 'fraction of sites occupied', title: 'one dot per species' });
        const B = v.stage({ x: [0, 1], y: [0, 1], axes: 'box', gutter: true, height: 330, weight: 1, xlabel: 'regional occupancy', ylabel: 'fraction of species', title: 'distribution of occupancy' });
        const det = (c, rh, ep) => { let p = 0.3; for (let i = 0; i < 3000; i++) p += 0.1 * ((c * p + ep) * (1 - p) - p * (1 - rh * p)); return Math.max(0, Math.min(1, p)); };
        let cache = { key: '' }, info = null;
        v.render(() => {
          const key = [rho.value, sg.value, mu.value, eps.value, Ns.value, seed].join('|');
          if (cache.key !== key) {
            const N = Ns.value, r = v.rng(500 + seed), sim = [], dd = [], xs = [];
            for (let s = 0; s < ns; s++) {
              const lc = mu.value + sg.value * U[s], c = Math.exp(lc);
              let n = Math.round(0.3 * N);
              for (let st = 0; st < 400; st++) {
                const p = n / N, pe = 1 - Math.exp(-0.2 * (1 - rho.value * p)), pc = 1 - Math.exp(-0.2 * (c * p + eps.value));
                let ex = 0, co = 0;
                for (let i = 0; i < n; i++) if (r() < pe) ex++;
                for (let i = 0; i < N - n; i++) if (r() < pc) co++;
                n += co - ex;
              }
              sim.push(n / N); dd.push(det(c, rho.value, eps.value)); xs.push(lc);
            }
            cache = { key, sim, dd, xs };
          }
          const { sim, dd, xs } = cache;
          A.fn((x) => det(Math.exp(x), rho.value, eps.value), { color: 'orange', width: 2.6, domain: [-2.5, 2.5], n: 90 });
          for (let s = 0; s < ns; s++) A.dot(Math.max(-2.45, Math.min(2.45, xs[s])), sim[s], { r: 3.4, color: 'accent', alpha: 0.7, ring: false });
          const Hs = v.M.histogram(sim, { bins: 20, range: [0, 1.0001] }), Hd = v.M.histogram(dd, { bins: 20, range: [0, 1.0001] });
          const top = Math.max(...Hs.counts, ...Hd.counts) / ns;
          B.setView([0, 1], [0, top * 1.12]);
          B.hist({ edges: Hs.edges, counts: Hs.counts.map((c) => c / ns) }, { color: 'accent', fillAlpha: 0.3 });
          B.hist({ edges: Hd.edges, counts: Hd.counts.map((c) => c / ns) }, { color: 'orange', fillAlpha: 0, outline: true });
          const low = sim.filter((p) => p < 0.25).length / ns, high = sim.filter((p) => p > 0.75).length / ns;
          info = { low, high, mid: 1 - low - high };
        });
        v.legend([['accent', 'simulated species'], ['orange', 'deterministic prediction']]);
        v.readout(() => info && String.raw`Satellite-like ($p<0.25$): ${v.fix(100 * info.low, 0)} % of species · core-like ($p>0.75$): ${v.fix(100 * info.high, 0)} % · in between: ${v.fix(100 * info.mid, 0)} %` + (info.mid < 0.2 && info.low > 0.1 && info.high > 0.1 ? ' → two groups: **bimodal**' : ' → no clear gap in the middle'));
      },
    },
    // ───────────────────────────────────────────────────────────── 3.9
    {
      num: '3.9',
      kind: 'Model',
      name: 'Ideal free distribution',
      credit: 'S. D. Fretwell & H. L. Lucas Jr., 1970',
      statement: String.raw`$N$ foragers choose between patches whose resources arrive at rates $r_1,r_2$ and share each patch equally, so a forager's intake in patch $i$ is $r_i/n_i$. If every forager knows the intakes (**ideal**) and may settle in either patch without cost (**free**), nobody can do better by moving at equilibrium: intakes are equal, $r_1/n_1=r_2/n_2$, so the numbers match the inputs, $n_1/n_2=r_1/r_2$ (**input matching**).`,
      scope: String.raw`Holds for equal competitors with full information and no travel or interference costs. Unequal competitors, interference, or imperfect information give "undermatching": too many animals in poor patches. The sliders let you degrade the information.`,
      idea: String.raw`If intake in patch 1 exceeded that in patch 2, any forager in patch 2 would gain by moving, which raises $n_1$ and lowers $r_1/n_1$ until the gain vanishes; the same argument runs the other way. The only state with no profitable move is equal intake. Because intake falls with density, moves are self-correcting and the distribution settles at $n_i=N\,r_i/(r_1+r_2)$.`,
      caption: String.raw`Foragers (dots) reconsider their patch at random times and move if the other patch would pay more after they join it. Drag the food-share and population sliders: the distribution tracks the input ratio and the two intakes equalize (bottom right). Now raise **random moves**: with poor information the fraction in patch 1 sits closer to one half than the inputs warrant, which is undermatching.`,
      deps: [],
      refs: ['Begon ch. 6'],
      tags: ['habitat choice', 'foraging', 'game theory'],
      viz(v) {
        let S;
        const reset = () => S.reset();
        const Ns = v.slider('foragers $N$', 10, 200, 60, { step: 5, int: true, onChange: reset });
        const qs = v.slider('share of food arriving in patch 1', 0.1, 0.9, 0.67, { step: 0.01 });
        const eta = v.slider('random moves (poor information)', 0, 1, 0, { step: 0.05, onChange: reset });
        const TT = 160;
        S = v.sim(() => { const N = Ns.value, side = new Uint8Array(N); const r = v.rng(15); for (let i = 0; i < N; i++) side[i] = r() < 0.5 ? 0 : 1; return { side, r, t: 0, h: [] }; }, (st) => {
          const N = st.side.length, r = st.r, q = qs.value;
          let n1 = 0; for (let i = 0; i < N; i++) if (st.side[i] === 0) n1++;
          for (let k = 0; k < N; k++) {
            const i = Math.floor(r() * N);
            if (r() > 0.25) continue;
            const cur = st.side[i];
            if (r() < eta.value) { const to = r() < 0.5 ? 0 : 1; if (to !== cur) { n1 += to === 0 ? 1 : -1; st.side[i] = to; } continue; }
            const n2 = N - n1, gain1 = q / Math.max(1, n1 + (cur === 1 ? 1 : 0)), gain2 = (1 - q) / Math.max(1, n2 + (cur === 0 ? 1 : 0));
            const here = cur === 0 ? q / n1 : (1 - q) / n2, there = cur === 0 ? gain2 : gain1;
            if (there > here + 1e-12) { st.side[i] = 1 - cur; n1 += cur === 0 ? -1 : 1; }
          }
          st.t++; st.h.push(n1 / N);
        }, { dt: 1, maxSteps: 400 });
        const A = v.stage({ x: [0, 11], y: [0, 6], equal: true, axes: false, height: 300, weight: 1.2, title: 'two feeding patches' });
        const B = v.stage({ x: [0, TT], y: [0, 1], axes: 'box', gutter: true, height: 300, weight: 1, xlabel: 'time', ylabel: 'fraction in patch 1', title: 'where the foragers are' });
        const C = v.stage({ x: [0, 3], y: [0, 1], axes: 'box', gutter: true, height: 300, weight: 0.7, ylabel: 'intake per forager', title: 'intake per forager (relative)', xticks: [[1, 'patch 1'], [2, 'patch 2']] });
        const pos = Array.from({ length: 200 }, (_, i) => { const rr = v.rng(100 + i); return [rr(), rr()]; });
        let info = null;
        v.animate((t) => {
          S.advance(8 * t);
          const st = S.state, N = st.side.length, q = qs.value;
          let n1 = 0; for (let i = 0; i < N; i++) if (st.side[i] === 0) n1++;
          const n2 = N - n1;
          A.rect(0.3, 0.5, 5.2, 5.5, { fill: 'green', fillAlpha: 0.04 + 0.3 * q, color: 'green', width: 1.6 });
          A.rect(5.8, 0.5, 10.7, 5.5, { fill: 'green', fillAlpha: 0.04 + 0.3 * (1 - q), color: 'green', width: 1.6 });
          A.text(`food input ${v.fix(100 * q, 0)} %`, 2.75, 5.8, { align: 'center', size: 12, color: 'green' });
          A.text(`food input ${v.fix(100 * (1 - q), 0)} %`, 8.25, 5.8, { align: 'center', size: 12, color: 'green' });
          for (let i = 0; i < N; i++) {
            const left = st.side[i] === 0, x0 = left ? 0.3 : 5.8;
            A.dot(x0 + 0.2 + 4.5 * pos[i][0], 0.7 + 4.6 * pos[i][1], { r: 4, color: left ? 'accent' : 'orange', ring: false, alpha: 0.9 });
          }
          B.hline(q, { color: 'green', width: 1.8, dash: [6, 4] });
          B.hline(0.5, { color: 'faint', width: 1, dash: [3, 4] });
          B.path(st.h.map((p, i) => [i + 1, p]), { color: 'accent', width: 2.4 });
          const i1 = n1 ? q / n1 : 0, i2 = n2 ? (1 - q) / n2 : 0, mx = Math.max(i1, i2, 1e-9);
          C.bars([i1 / mx, i2 / mx], { x0: 1, dx: 1, color: (val, k) => (k === 0 ? 'accent' : 'orange') });
          info = { n1, n2, N, q, i1: i1 * N, i2: i2 * N, target: N * q };
        }, { period: 20, still: 19.9 });
        v.legend([['accent', 'patch 1'], ['orange', 'patch 2'], ['green', 'input matching $r_1/(r_1+r_2)$', { dash: true }]]);
        v.readout(() => info && String.raw`$n_1=${info.n1}$, $n_2=${info.n2}$ (input matching predicts $n_1=${v.fix(info.target, 1)}$) · intake per forager relative to an equal share: patch 1 ${v.fix(info.i1, 2)}, patch 2 ${v.fix(info.i2, 2)}` + (eta.value > 0 ? ' · with random moves the animals are not ideal: expect undermatching (a distribution closer to half and half)' : ' · equal intakes: no forager gains by moving'));
      },
    },
  ],
};
