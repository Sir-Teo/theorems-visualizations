// Systems Biology — Chapter 3: Feed-forward loops and temporal programs (after U. Alon, An Introduction to Systems Biology)
//
// Conventions: X is the input regulator, Y the intermediate, Z the target. Edge signs are listed in the order (X→Y, Y→Z, X→Z).
// Time is measured in units of 1/α_Y (the removal rate of Y), levels are scaled so that Y and Z saturate at 1.
// Every curve is computed from the ODEs in ch03.shared.js (fflSim); nothing is a fitted or digitised curve.
import { FFL_TYPES, fflType, isCoherent, fflSim, crossAfter, edge, hillAct, hillRep } from './ch03.shared.js';

const NAMES = ['X', 'Y', 'Z'];
/** Draw X, Y, Z (and optionally the thresholds) from a simulation result on stage S. */
function traces(S, r, o = {}) {
  const pts = (a) => r.t.map((t, i) => [t, a[i]]);
  S.path(pts(r.X), { color: 'muted', width: 2, dash: true });
  S.path(pts(r.Y), { color: 'blue', width: 3 });
  S.path(pts(r.Z), { color: 'green', width: 3.5 });
  if (o.simple) S.path(pts(o.simple.Z), { color: 'faint', width: 2, dash: true });
}
const sgn = (s) => (s > 0 ? '+' : '−');

export default {
  collection: 'sysbio',
  chapter: 3,
  title: 'Feed-forward loops and temporal programs',
  summary: String.raw`In a feed-forward loop a regulator acts on a target both directly and through an intermediate. The coherent version with AND logic filters out brief input pulses and responds only to persistent signals; the incoherent version makes pulses and speeds responses (and, with the right parameters, can detect fold changes). Single-input modules and multi-output loops order genes in time so that a pathway’s enzymes appear just when they are needed.`,
  items: [
    // ───────────────────────────────────────────────────────────── 3.1
    {
      num: '3.1',
      kind: 'Concept',
      name: 'The eight feed-forward loop types',
      statement: String.raw`A **feed-forward loop** (FFL) is a three-gene pattern in which a transcription factor $X$ regulates a target $Z$ and also regulates a second transcription factor $Y$, which regulates $Z$ as well: the edges are $X\to Y$, $Y\to Z$ and $X\to Z$. Each edge can be an activation ($+$) or a repression ($-$), so there are $2^3=8$ **types**. The loop is **coherent** when the direct sign equals the product of the signs along the indirect path, $s_{XZ}=s_{XY}\,s_{YZ}$ (four types, C1–C4), and **incoherent** when it is the opposite (four types, I1–I4). The type with all three edges activating is C1; the type with $X\to Y\to Z$ activating and $X\dashv Z$ repressing is I3; the type with $X\to Y$ activating, $Y\dashv Z$ repressing and $X\to Z$ activating is I1.`,
      idea: String.raw`The classification is a sign count on a triangle. Two paths lead from $X$ to $Z$, the direct edge and the path through $Y$; the sign of a path is the product of its edge signs. If both paths agree in sign the loop is coherent, otherwise the two paths push $Z$ in opposite directions and it is incoherent. Naming the types C1–C4 and I1–I4 and then asking how each one responds to a step in $X$ is the programme of the next items. In the *E. coli* and yeast transcription networks the FFL is a significant motif (1.9), and two of the eight types, C1 and I1, are far commoner than the rest.`,
      caption: String.raw`Choose the sign of each edge (top) or click one of the eight miniatures (middle): the diagram classifies the loop and the bottom panel simulates its response to $X$ switching on at $t=2$ and off at $t=9$ (grey dashed $X$, blue $Y$, green $Z$), with AND or OR logic at $Z$. Notice that in the coherent types the direct edge and the path through $Y$ push $Z$ the same way, whereas in the incoherent ones they oppose each other.`,
      deps: ['sysbio-1.9'],
      refs: ['Alon: The Feed Forward Loop'],
      tags: ['feed-forward loop', 'motifs'],
      credit: 'S. Shen-Orr, R. Milo, S. Mangan & U. Alon, 2002 (FFL as a motif in E. coli; Nature Genetics 31: 64–68); S. Mangan & U. Alon, 2003 (the eight types; PNAS 100: 11980–11985)',
      verify: true,
      scope: String.raw`The type numbering is the one used by Mangan & Alon. I do not reproduce the observed frequencies of the eight types in *E. coli* and yeast: the literature reports that C1 and I1 are the most abundant, but I could not check the underlying counts, so the picture shows no frequency bars. The panel uses a Hill model with $n=4$, equal thresholds $K=0.5$ and a step-like input; real loops have unequal thresholds and kinetics.`,
      links: { doi: 'https://doi.org/10.1073/pnas.2133841100' },
      viz(v) {
        const SG = [{ value: '1', label: '+' }, { value: '-1', label: '−' }];
        const eXY = v.select('X → Y', SG, '1'), eYZ = v.select('Y → Z', SG, '1'), eXZ = v.select('X → Z', SG, '1');
        const LG = v.select('logic at Z', ['AND', 'OR'], 'AND');
        const A = v.stage({ x: [-0.55, 2.55], y: [-0.55, 1.65], equal: true, axes: false, height: 250, minWidth: 280, title: 'the loop' });
        const B = v.stage({ x: [0, 4], y: [0, 2.1], equal: true, axes: false, height: 250, minWidth: 280, title: 'the eight types (click one)' });
        const C = v.stage({ x: [0, 16], y: [-0.05, 1.15], axes: 'box', gutter: true, height: 260, full: true, xlabel: 'time (units of 1/α_Y)', ylabel: 'level (scaled)' });
        const P = [[0, 0], [1, 1.1], [2, 0]];
        const link = (S, a, b, sign, gap, o) => {
          const dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy);
          const ux = dx / L, uy = dy / L;
          edge(S, a[0] + ux * gap, a[1] + uy * gap, b[0] - ux * gap, b[1] - uy * gap, sign, o);
        };
        const cur = () => [Number(eXY.value), Number(eYZ.value), Number(eXZ.value)];
        v.legend([['green', 'activation'], ['red', 'repression'], ['muted', 'X', { dash: true }], ['blue', 'Y'], ['green', 'Z (thick)']]);
        let info = '';
        v.render(() => {
          const [a, b, c] = cur();
          const id = fflType(a, b, c), coh = isCoherent(a, b, c);
          // big diagram
          link(A, P[0], P[1], a, 0.2, { width: 4, bar: 0.1 });
          link(A, P[1], P[2], b, 0.2, { width: 4, bar: 0.1 });
          link(A, P[0], P[2], c, 0.2, { width: 4, bar: 0.1 });
          NAMES.forEach((n, i) => A.dot(P[i][0], P[i][1], { r: 15, color: i === 2 ? 'green' : i === 1 ? 'blue' : 'muted', label: n, labelPos: i === 1 ? 'n' : 's' }));
          A.text(id, 1, 0.32, { size: 30, color: coh ? 'green' : 'orange', align: 'center' });
          A.text(coh ? 'coherent' : 'incoherent', 1, -0.32, { size: 13, color: 'muted', align: 'center' });
          // eight miniatures
          FFL_TYPES.forEach((t, k) => {
            const col = k % 4, row = k < 4 ? 0 : 1, ox = col, oy = row === 0 ? 1.05 : 0;
            if (t.id === id) B.rect(ox + 0.04, oy + 0.03, ox + 0.96, oy + 1.0, { fill: 'accent', fillAlpha: 0.14, color: 'accent', radius: 6 });
            const q = [[ox + 0.17, oy + 0.28], [ox + 0.5, oy + 0.82], [ox + 0.83, oy + 0.28]];
            link(B, q[0], q[1], t.s[0], 0.07, { width: 2, bar: 0.05 });
            link(B, q[1], q[2], t.s[1], 0.07, { width: 2, bar: 0.05 });
            link(B, q[0], q[2], t.s[2], 0.07, { width: 2, bar: 0.05 });
            q.forEach((p) => B.dot(p[0], p[1], { r: 4, color: 'ink' }));
            B.text(t.id, ox + 0.5, oy + 0.12, { size: 13, color: t.id === id ? 'accent' : 'ink', align: 'center' });
          });
          // response
          const p = { sxy: a, syz: b, sxz: c, lg: LG.value, Kxy: 0.5, Kyz: 0.5, Kxz: 0.5, n: 4, by: 1, ay: 1, bz: 6, az: 6 };
          const r = fflSim(p, (t) => (t >= 2 && t < 9 ? 1 : 0), 16, 0.01);
          traces(C, r);
          info = `**${id}** (${coh ? 'coherent' : 'incoherent'}): signs $(s_{XY},s_{YZ},s_{XZ})=(${sgn(a)},${sgn(b)},${sgn(c)})$, indirect path $s_{XY}s_{YZ}=${sgn(a * b)}$, direct edge ${sgn(c)}.`;
        });
        B.onClick((x, y) => {
          const col = Math.floor(x), row = y >= 1.05 ? 0 : 1;
          if (col < 0 || col > 3) return;
          const t = FFL_TYPES[row * 4 + col];
          eXY.set(String(t.s[0])); eYZ.set(String(t.s[1])); eXZ.set(String(t.s[2]));
          v.invalidate();
        });
        v.readout(() => info);
      },
    },
    // ───────────────────────────────────────────────────────────── 3.2
    {
      num: '3.2',
      kind: 'Model',
      name: 'Coherent type-1 FFL with AND logic',
      statement: String.raw`The **C1-FFL** has $X\to Y$, $Y\to Z$, $X\to Z$ all activating, and $Z$ is produced only when **both** $X$ and $Y$ are active (AND logic, 1.4):
$$\dot Y=\beta_Y\,f(X;K_{XY})-\alpha_Y Y,\qquad \dot Z=\beta_Z\,f(X;K_{XZ})\,f(Y;K_{YZ})-\alpha_Z Z,$$
with Hill activation terms $f$ (1.3). After $X$ is switched on, $Y$ rises as $Y_{\rm st}(1-e^{-\alpha_Y t})$ and $Z$ can start only when $Y$ has crossed its threshold, after
$$T_{\rm ON}=\frac1{\alpha_Y}\ln\frac1{1-K_{YZ}/Y_{\rm st}}$$
(step-like limit of large Hill coefficient). When $X$ is switched off, $f(X)$ drops at once and $Z$ stops being produced at once.`,
      idea: String.raw`Because $Z$ needs two keys, the later of the two decides. $X$ is active immediately, so the wait is for the slower key $Y$; its accumulation is the production–degradation relaxation of 1.5, and the time to reach the threshold $K_{YZ}$ is where $Y_{\rm st}(1-e^{-\alpha_Yt})=K_{YZ}$, which gives $T_{\rm ON}$. On the way down the AND term vanishes as soon as the first key (here $X$) is removed, so there is no corresponding wait. The delay is therefore asymmetric, which is the content of the next item.`,
      caption: String.raw`Blue: $Y$, green: $Z$, grey dashed: the input $X$, faint dashed: a simply regulated gene that follows $X$ alone. Drag the threshold $K_{YZ}$ and the pulse length; the orange line marks $K_{YZ}$ on the $Y$ axis and the vertical line the predicted $T_{\rm ON}$ after the step. Make the pulse shorter than $T_{\rm ON}$ and $Z$ never switches on.`,
      deps: ['sysbio-3.1', 'sysbio-1.4'],
      refs: ['Alon: The Feed Forward Loop'],
      tags: ['feed-forward loop', 'coherent'],
      credit: 'S. Mangan & U. Alon, 2003 (PNAS 100: 11980–11985)',
      scope: String.raw`Deterministic ODE model with a sharp ($n=6$) Hill threshold on $Y$, a very fast activation of $Y$ and $Z$ by $X$ (threshold 0.1, so a fully-on $X$ is always above it), $\alpha_Z=6\alpha_Y$ and a binary input. The closed form for $T_{\rm ON}$ is the step-function limit; the picture reports the simulated crossing time next to it.`,
      viz(v) {
        const K = v.slider(String.raw`threshold $K_{YZ}/Y_{\rm st}$`, 0.05, 0.9, 0.5, { step: 0.01 });
        const D = v.slider('pulse length (units of 1/α_Y)', 0.3, 7, 4, { step: 0.05 });
        const S = v.stage({ x: [0, 13], y: [-0.05, 1.15], axes: 'box', gutter: true, height: 340, full: true, xlabel: 'time (units of 1/α_Y)', ylabel: 'level (scaled)' });
        let m = {};
        v.render(() => {
          const t0 = 1, k = K.value, d = D.value;
          const base = { sxy: 1, syz: 1, sxz: 1, lg: 'AND', Kxy: 0.1, Kyz: k, Kxz: 0.1, n: 6, by: 1, ay: 1, bz: 6, az: 6 };
          const Xf = (t) => (t >= t0 && t < t0 + d ? 1 : 0);
          const r = fflSim(base, Xf, 13, 0.005);
          const r0 = fflSim({ ...base, Kyz: 1e-6 }, Xf, 13, 0.005);
          S.hline(k, { color: 'orange', dash: true });
          S.text('K_YZ', 12.9, k, { color: 'orange', align: 'right', dy: -9 });
          const Ton = Math.log(1 / (1 - k));
          S.vline(t0 + Ton, { color: 'orange', dash: [3, 3], width: 1 });
          S.vband(t0 + d, t0 + d + 0.001, { color: 'faint' });
          traces(S, r, { simple: r0 });
          const tY = crossAfter(r.t, r.Y, k, t0) - t0;
          const half = 0.5 * Math.max(...r.Z), zmax = Math.max(...r.Z);
          m = { Ton, tY, zmax, tZ: zmax > 0.5 ? crossAfter(r.t, r.Z, 0.5, t0) - t0 : NaN, off: zmax > 0.5 ? crossAfter(r.t, r.Z.map((z, i) => (r.t[i] > t0 + d ? z : 9)), 0.5, t0 + d) - (t0 + d) : NaN, half };
        });
        v.legend([['muted', 'input X', { dash: true }], ['blue', 'intermediate Y'], ['green', 'target Z (C1, AND)'], ['faint', 'Z with simple regulation', { dash: true }], ['orange', 'threshold K_YZ', { dash: true }]]);
        v.readout(() => `Predicted $T_{\\rm ON}=\\ln\\frac1{1-K}=${v.fix(m.Ton, 2)}$; simulated: $Y$ crosses $K_{YZ}$ at $${v.fix(m.tY, 2)}$` + (m.zmax > 0.5 ? `, $Z$ reaches 0.5 at $${v.fix(m.tZ, 2)}$ after the step and falls to 0.5 only $${v.fix(m.off, 2)}$ after $X$ is switched off.` : `. The pulse (${v.fix(D.value, 2)}) is shorter than $T_{\\rm ON}$: $Z$ peaks at only $${v.fix(m.zmax, 2)}$ and never switches on.`));
      },
    },
    // ───────────────────────────────────────────────────────────── 3.3
    {
      num: '3.3',
      kind: 'Theorem',
      name: 'C1-FFL is a sign-sensitive delay (persistence detector)',
      statement: String.raw`Take the C1-FFL of 3.2 in the step-function limit. With **AND** logic, the output $Z$ follows an $X$-pulse of length $D$ only if $D$ exceeds the **ON delay** $T_{\rm ON}=\alpha_Y^{-1}\ln\bigl(1/(1-K_{YZ}/Y_{\rm st})\bigr)$ (up to the response time of $Z$ itself): shorter pulses are filtered out. Once on, $Z$ switches **off** immediately when $X$ does, so the delay applies to the ON step only. With **OR** logic the roles reverse: $Z$ turns on at once and turns off only after the **OFF delay** $T_{\rm OFF}=\alpha_Y^{-1}\ln(Y_{\rm st}/K_{YZ})$ during which $Y$ decays, and brief pulses are lengthened instead of removed.`,
      idea: String.raw`The delay is the time the intermediate needs to cross its threshold, computed in 3.2 from the exponential relaxation of 1.5. AND demands both keys, so the later key (accumulating $Y$) decides when $Z$ turns on, and the first key withdrawn (either one) decides when it turns off: ON is slow, OFF is fast. OR needs only one key, so the earlier key decides turning on and the *last* one withdrawn decides turning off: ON is fast, OFF slow. A pulse shorter than $T_{\rm ON}$ ends before $Y$ ever crosses $K_{YZ}$, so under AND it is invisible to $Z$.`,
      caption: String.raw`Left: six pulses of increasing duration (bands: green if $Z$ exceeded 0.5, red if it was filtered out) drive the circuit. Right: the peak of $Z$ in response to a single pulse of length $D$; the orange line is the predicted $T_{\rm ON}$ and the dots are the six pulses. Switch AND to OR to move the delay from the ON edge to the OFF edge, and drag $K_{YZ}$ to move the threshold of persistence.`,
      deps: ['sysbio-3.2'],
      refs: ['Alon: The Feed Forward Loop'],
      tags: ['feed-forward loop', 'filtering'],
      credit: 'S. Mangan & U. Alon, 2003 (PNAS 100: 11980–11985); S. Mangan, A. Zaslaver & U. Alon, 2003 (J. Mol. Biol. 334: 197–204)',
      scope: String.raw`Valid when $Z$ reacts much faster than $Y$ ($\alpha_Z=6\alpha_Y$ here) and the Hill terms are sharp; with a slow $Z$ its own response time adds to the measured delays. Noise (stochastic crossings of the threshold) is not modelled.`,
      viz(v) {
        const K = v.slider(String.raw`threshold $K_{YZ}/Y_{\rm st}$`, 0.1, 0.9, 0.5, { step: 0.01 });
        const LG = v.select('logic at Z', ['AND', 'OR'], 'AND');
        const DUR = [0.25, 0.5, 0.8, 1.2, 1.8, 3];
        const starts = []; let tt = 1;
        DUR.forEach((d) => { starts.push(tt); tt += d + 5; });
        const TEND = tt;
        const S1 = v.stage({ x: [0, TEND], y: [-0.05, 1.15], axes: 'box', gutter: true, height: 300, weight: 1.5, minWidth: 330, xlabel: 'time (units of 1/α_Y)', ylabel: 'level (scaled)' });
        const S2 = v.stage({ x: [0, 4], y: [0, 1.05], axes: 'box', gutter: true, height: 300, minWidth: 260, xlabel: 'pulse length D (units of 1/α_Y)', ylabel: 'peak of Z' });
        const mk = (k, lg) => ({ sxy: 1, syz: 1, sxz: 1, lg, Kxy: 0.1, Kyz: k, Kxz: 0.1, n: 8, by: 1, ay: 1, bz: 6, az: 6 });
        let msg = {};
        v.render(() => {
          const k = K.value, lg = LG.value, p = mk(k, lg);
          const Xf = (t) => { for (let i = 0; i < DUR.length; i++) if (t >= starts[i] && t < starts[i] + DUR[i]) return 1; return 0; };
          const r = fflSim(p, Xf, TEND, 0.01);
          let pass = 0;
          DUR.forEach((d, i) => {
            const e = starts[i] + d, lim = i + 1 < DUR.length ? starts[i + 1] : TEND;
            let pk = 0; for (let j = 0; j < r.t.length; j++) if (r.t[j] >= starts[i] && r.t[j] < lim) pk = Math.max(pk, r.Z[j]);
            const ok = pk > 0.5; if (ok) pass++;
            S1.vband(starts[i], e, { color: ok ? 'green' : 'red', alpha: 0.12 });
            S1.text(String(d), (starts[i] + e) / 2, 1.09, { size: 11, color: 'muted', align: 'center' });
          });
          traces(S1, r);
          // peak vs duration
          const Ds = []; for (let d = 0.04; d <= 4.001; d += 0.04) Ds.push(d);
          const pk = Ds.map((d) => { const q = fflSim(p, (t) => (t >= 1 && t < 1 + d ? 1 : 0), 1 + d + 7, 0.02); return [d, Math.max(...q.Z)]; });
          S2.path(pk, { color: 'green', width: 3 });
          S2.hline(0.5, { color: 'faint', dash: true });
          const Ton = Math.log(1 / (1 - k));
          S2.vline(Ton, { color: 'orange', dash: true, width: 2 });
          S2.text('T_ON', Ton, 0.1, { color: 'orange', align: 'left', dx: 6 });
          DUR.forEach((d) => { const q = pk.reduce((a, b) => (Math.abs(b[0] - d) < Math.abs(a[0] - d) ? b : a)); S2.dot(d, q[1], { r: 5, color: 'gold' }); });
          // delays from one long pulse
          const q = fflSim(p, (t) => (t >= 1 && t < 9 ? 1 : 0), 18, 0.005);
          msg = { pass, Ton, Toff: Math.log(1 / k), on: crossAfter(q.t, q.Z, 0.5, 1) - 1, off: crossAfter(q.t, q.Z.map((z, i) => (q.t[i] > 9 ? z : 9)), 0.5, 9) - 9 };
        });
        v.legend([['muted', 'input X', { dash: true }], ['blue', 'Y'], ['green', 'Z'], ['gold', 'the six pulses', { dot: true }]]);
        v.readout(() => `${LG.value}: ON delay (simulated) $${v.fix(msg.on, 2)}$, OFF delay $${v.fix(msg.off, 2)}$ in units of $1/\\alpha_Y$. Predictions: $T_{\\rm ON}=${v.fix(msg.Ton, 2)}$ (AND), $T_{\\rm OFF}=${v.fix(msg.Toff, 2)}$ (OR).\nPulses passed to $Z$: ${msg.pass} of 6 (lengths shown above the bands).`);
      },
    },
    // ───────────────────────────────────────────────────────────── 3.4
    {
      num: '3.4',
      kind: 'Phenomenon',
      name: 'Sign-sensitive delay in the arabinose system',
      statement: String.raw`The *E. coli* arabinose utilisation genes (*araBAD*) form a C1-FFL with AND logic: the cAMP-bound activator CRP ($X$) activates both the regulator AraC ($Y$) and the *araBAD* promoter ($Z$), and *araBAD* is switched on only when CRP and AraC with arabinose are both present. Mangan, Zaslaver and Alon measured promoter activity with GFP reporters after step changes in cAMP and found **sign-sensitive delay kinetics**: the response is fast to a step in one direction and delayed to a step in the other. In the AND model the delay appears after the ON step of cAMP, none after the OFF step.`,
      idea: String.raw`Before the experiment, the C1-FFL of 3.3 predicted that a persistence detector should show a delay only when $Y$ must accumulate, that is, when $X$ switches on. The test is to drive the real circuit with step-like inputs and read the promoter activity with the time resolution of a reporter (minutes). The model shows what such a measurement should look like, and the control (a promoter regulated by CRP alone) shows what no delay looks like. Without arabinose AraC is inactive and the promoter never turns on, which is the AND gate at work.`,
      caption: String.raw`**A reconstruction by the C1-FFL model, not the published data.** Left: cAMP steps up at $t=1$; right: cAMP steps down at $t=1$ (the system having first settled ON). Green: modelled *araBAD* promoter activity, faint dashed: a reference promoter regulated by CRP alone. Drag the AraC lifetime and the arabinose level: the delay on the ON step equals $\ln(1/(1-K/(a\,Y_{\rm st})))$ and grows as arabinose is lowered, while the OFF response stays fast.`,
      deps: ['sysbio-3.3'],
      refs: ['Alon: The Feed Forward Loop'],
      tags: ['feed-forward loop', 'E. coli'],
      credit: 'S. Mangan, A. Zaslaver & U. Alon, 2003 (J. Mol. Biol. 334: 197–204)',
      verify: true,
      scope: String.raw`Only the qualitative result (sign-sensitive delay of the arabinose promoter after cAMP steps, measured by GFP reporters) comes from the paper's abstract; I did not have access to its data, time scales or fits, so the time axis is in model units and no measured curve is drawn. Which direction is delayed, and the model's wiring (CRP$\to$araC, CRP and AraC·arabinose $\to$ araBAD), follow the standard textbook account and should be checked against the paper. Arabinose is modelled as a multiplicative factor on AraC's activity.`,
      viz(v) {
        const Y = v.slider('AraC removal rate α_Y (1/model time)', 0.3, 3, 1, { log: true, sig: 2 });
        const A = v.slider('arabinose (AraC activity factor)', 0.3, 1, 1, { step: 0.01 });
        const KZ = v.slider(String.raw`AraC threshold $K_{YZ}$ (in units of its maximum)`, 0.1, 0.5, 0.3, { step: 0.01 });
        const mk = (up) => v.stage({ x: [0, 14], y: [-0.05, 1.15], axes: 'box', gutter: true, height: 300, minWidth: 290, xlabel: 'time (model units)', ylabel: 'level (scaled)', title: up ? 'cAMP steps UP' : 'cAMP steps DOWN' });
        const SU = mk(true), SD = mk(false);
        let m = {};
        v.render(() => {
          const ay = Y.value, a = A.value, base = { sxy: 1, syz: 1, sxz: 1, lg: 'AND', Kxy: 0.1, Kyz: KZ.value / a, Kxz: 0.1, n: 6, by: ay, ay, bz: 4, az: 4 };
          const ref = { ...base, Kyz: 1e-6 };
          const up = (t) => (t >= 1 ? 1 : 0), dn = (t) => (t < 1 ? 1 : 0);
          const ru = fflSim(base, up, 14, 0.01), rd = fflSim(base, dn, 14, 0.01), cu = fflSim(ref, up, 14, 0.01), cd = fflSim(ref, dn, 14, 0.01);
          traces(SU, ru, { simple: cu }); traces(SD, rd, { simple: cd });
          SU.hline(KZ.value / a, { color: 'orange', dash: true });
          const hm = (r) => { const z = Math.max(...r.Z); return z > 0.5 ? crossAfter(r.t, r.Z, 0.5 * Math.min(1, z), 1) - 1 : NaN; };
          m = { up: hm(ru), dn: crossAfter(rd.t, rd.Z, 0.5, 1) - 1, cu: hm(cu), cd: crossAfter(cd.t, cd.Z, 0.5, 1) - 1, thr: KZ.value / a, pred: Math.log(1 / (1 - KZ.value / a)) / ay };
        });
        v.legend([['muted', 'cAMP-CRP (X)', { dash: true }], ['blue', 'AraC (Y)'], ['green', 'araBAD promoter (Z)'], ['faint', 'CRP-only reference promoter', { dash: true }], ['orange', 'AraC threshold', { dash: true }]]);
        v.readout(() => (m.thr >= 1 ? 'The AraC threshold exceeds the available AraC activity: the promoter never turns on (no arabinose, no expression).' : `Time to half-maximal promoter activity: ON step $${v.fix(m.up, 2)}$ (reference $${v.fix(m.cu, 2)}$; predicted AraC delay $${v.fix(m.pred, 2)}$), OFF step $${v.fix(m.dn, 2)}$ (reference $${v.fix(m.cd, 2)}$).`));
      },
    },
    // ───────────────────────────────────────────────────────────── 3.5
    {
      num: '3.5',
      kind: 'Model',
      name: 'Incoherent type-1 FFL',
      statement: String.raw`In the **I1-FFL**, $X$ activates $Z$ directly and also activates $Y$, which **represses** $Z$:
$$\dot Y=\beta_Y f(X;K_{XY})-\alpha_Y Y,\qquad \dot Z=\beta_Z\,f(X;K_{XZ})\,\bar f(Y;K_{YZ})-\alpha_Z Z,$$
with $\bar f$ the repressive Hill function (1.3). After $X$ steps on, $Z$ is first produced at the full rate; as $Y$ accumulates and passes $K_{YZ}$, production drops to a reduced level. If the repression is strong, $Z$ rises to a **pulse** and then settles at a lower steady state $Z_{\rm st}$; the ratio of the peak to $Z_{\rm st}$ grows with the repression strength $Y_{\rm st}/K_{YZ}$.`,
      idea: String.raw`The two arms of $X$ act with opposite sign and different speed. The activating arm is fast (a direct edge), the repressing arm is slow because $Y$ must first accumulate, with the time scale $1/\alpha_Y$ of 1.5. For a while $Z$ is produced as if no repression existed and climbs; then the repression takes over and production falls to $\beta_Z\bar f(Y_{\rm st})$, so $Z$ relaxes to the lower level $Z_{\rm st}=(\beta_Z/\alpha_Z)\bar f(Y_{\rm st})$. With suitable parameters the same circuit can also respond to fold changes of $X$ rather than absolute levels (Goentoro et al. 2009), which is not explored here.`,
      caption: String.raw`Left: $X$ (grey dashed) steps on at $t=1$; $Z$ (green) overshoots then settles; $Y$ is blue. Right: the same motion in the $(Y,Z)$ plane; the black curve is the quasi-steady relation $Z=\bar f(Y)$ towards which $Z$ is pulled. Raise the repression strength $Y_{\rm st}/K_{YZ}$ and the pulse sharpens and the steady state drops; make $Y$ fast (large $\alpha_Y/\alpha_Z$) and the pulse disappears into an immediate step.`,
      deps: ['sysbio-3.1'],
      refs: ['Alon: The Feed Forward Loop'],
      tags: ['feed-forward loop', 'incoherent', 'pulse'],
      credit: 'S. Mangan & U. Alon, 2003 (PNAS 100: 11980–11985)',
      scope: String.raw`Time in units of $1/\alpha_Z$; $X$ is a binary step and the direct activation is saturated (so $f(X)\approx1$). Hill coefficient and rates are free parameters here; real I1-FFLs differ in logic (e.g. the repressor may compete at a shared promoter).`,
      viz(v) {
        const F = v.slider(String.raw`repression strength $Y_{\rm st}/K_{YZ}$`, 1, 100, 4, { log: true, sig: 2 });
        const AY = v.slider(String.raw`speed of $Y$: $\alpha_Y/\alpha_Z$`, 0.1, 5, 0.5, { log: true, sig: 2 });
        const N = v.slider('cooperativity n', 1, 4, 2, { int: true });
        const S1 = v.stage({ x: [0, 10], y: [-0.05, 1.15], axes: 'box', gutter: true, height: 320, weight: 1.4, minWidth: 320, xlabel: 'time (units of 1/α_Z)', ylabel: 'level (scaled)' });
        const S2 = v.stage({ x: [0, 1.02], y: [0, 1.15], axes: 'box', gutter: true, height: 320, minWidth: 260, xlabel: 'repressor Y', ylabel: 'target Z' });
        let m = {};
        v.render(() => {
          const f = F.value, ay = AY.value, n = N.value;
          const p = { sxy: 1, syz: -1, sxz: 1, lg: 'AND', Kxy: 0.01, Kyz: 1 / f, Kxz: 0.01, n, by: ay, ay, bz: 1, az: 1 };
          const r = fflSim(p, (t) => (t >= 1 ? 1 : 0), 10, 0.005);
          traces(S1, r);
          const zst = r.Z[r.Z.length - 1], pk = Math.max(...r.Z), ip = r.Z.indexOf(pk);
          S1.hline(zst, { color: 'green', dash: true, width: 1 });
          S1.dot(r.t[ip], pk, { r: 6, color: 'gold' });
          S2.fn((y) => hillAct(1, 0.01, n) * hillRep(y, 1 / f, n), { color: 'ink', width: 2 });
          S2.path(r.Y.map((y, i) => [y, r.Z[i]]).filter((_, i) => r.t[i] >= 1), { color: 'green', width: 3 });
          S2.dot(0, r.Z[Math.round(1 / 0.005)], { r: 5, color: 'gold' });
          S2.dot(r.Y[r.Y.length - 1], zst, { r: 6, color: 'green' });
          m = { zst, pk, tp: r.t[ip] - 1, ratio: pk / zst };
        });
        v.legend([['muted', 'input X', { dash: true }], ['blue', 'repressor Y'], ['green', 'target Z'], ['ink', 'Z = f̄(Y) relation']]);
        v.readout(() => `Peak $Z=${v.fix(m.pk, 2)}$ at $t=${v.fix(m.tp, 2)}$ after the step; steady state $Z_{\\rm st}=${v.fix(m.zst, 3)}$ (equals $\\bar f(Y_{\\rm st})$). Peak/steady-state ratio $=${v.fix(m.ratio, 1)}$.`);
      },
    },
  ],
};
