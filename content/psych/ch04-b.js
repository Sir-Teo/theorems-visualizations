// Psychology & Perception — Chapter 4: Early vision (items 4.6–4.10)
import { logTicks, grey, clamp01, blur1, dog1, blur2, smooth01 } from './ch04.shared.js';

export default {
  collection: 'psych',
  chapter: 4,
  items: [
    // ------------------------------------------------------------------ 4.6
    {
      num: '4.6',
      kind: 'Concept',
      name: 'Centre–surround receptive fields',
      statement: String.raw`A retinal ganglion cell does not respond to light everywhere equally: its **receptive field** (the region of the retina whose illumination changes its firing) has two concentric zones with opposite signs. In an **ON-centre** cell, light on the central zone raises the firing rate and light on the surrounding annulus lowers it; an **OFF-centre** cell is the mirror image. The weighting is well described by a **difference of Gaussians**, $w(r)=G_{\sigma_c}(r)-k\,G_{\sigma_s}(r)$ with $\sigma_s>\sigma_c$, and the cell's response is the weighted sum of the light, $\iint w\,S\,dA$. When the two zones balance ($k\approx1$), a uniform field produces almost no response: the cell reports local contrast, not absolute illumination.`,
      idea: String.raw`The response is a linear weighted sum of the image, i.e. the image correlated with the receptive-field weighting. Because the positive and negative weights have nearly equal totals, a uniform stimulus cancels, whereas a spot that fills the centre but not the surround, or an edge placed across the field, leaves some net excitation or inhibition. Growing a spot first adds centre excitation (rising response) and then starts to cover the opposed surround (falling response), which is why such cells prefer a spot of an optimal size. Kuffler recorded exactly this structure from cat retinal ganglion cells in 1953.`,
      caption: String.raw`**Left:** the receptive field (**red** = excitatory weights, **blue** = inhibitory) with a stimulus you place by dragging the **gold** handle; choose a *spot*, an *annulus* or a *uniform field*. **Right:** the firing rate of the model cell against the radius of a spot centred on the handle: it peaks when the spot just fills the centre and sinks as the surround is covered. Reduce the *surround strength* to see the cell become a plain light meter, and flip *ON-centre* to make the mirror-image cell. The weights, firing-rate scale and baseline are **model values** chosen for illustration.`,
      deps: ['psych-4.4'],
      refs: ['Goldstein ch. 3'],
      tags: ['receptive field', 'ganglion cell', 'contrast'],
      credit: 'Stephen Kuffler, 1953, J. Neurophysiol. 16: 37–68; the difference-of-Gaussians form: Rodieck, 1965 (unconfirmed)',
      scope: String.raw`This is the linear, static description. Real cells add nonlinearities (rectification, gain control), adaptation and, in the so-called Y cells, nonlinear subunits; and the sizes of centre and surround grow with distance from the fovea.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Receptive_field#Retinal_ganglion_cells' },
      verify: true,
      viz(v) {
        const shape = v.select('Stimulus', [{ value: 'spot', label: 'spot' }, { value: 'ring', label: 'annulus' }, { value: 'full', label: 'uniform field' }], 'spot');
        const rad = v.slider('stimulus radius', 0.2, 5.5, 1, { step: 0.05 });
        const sr = v.slider('surround width / centre width', 1.5, 5, 3, { step: 0.1 });
        const bal = v.slider('surround strength $k$', 0, 1.2, 0.9, { step: 0.01 });
        const on = v.toggle('ON-centre cell', true);
        const sc = 0.8, BASE = 20, GAIN = 60, CELL = 0.25, NG = 48;
        const rf = v.stage({ x: [-6, 6], y: [-6, 6], equal: true, axes: false, height: 330, weight: 1, minWidth: 290, title: 'receptive field and stimulus' });
        const tu = v.stage({ x: [0, 6], y: [0, 120], axes: 'box', gutter: true, height: 330, weight: 1, minWidth: 290, xlabel: 'radius of a centred spot', ylabel: 'firing rate (spikes/s)', title: 'tuning to spot size' });
        const hd = rf.handle(0, 0, { color: 'gold', r: 8, label: 'stimulus', labelPos: 'ne' });
        const W = (x, y, ss, k) => { const r2 = x * x + y * y; return Math.exp(-r2 / (2 * sc * sc)) / (2 * Math.PI * sc * sc) - k * Math.exp(-r2 / (2 * ss * ss)) / (2 * Math.PI * ss * ss); };
        const resp = (S, ss, k) => { let a = 0; for (let i = 0; i < NG; i++) for (let j = 0; j < NG; j++) { const x = -6 + (i + 0.5) * CELL, y = -6 + (j + 0.5) * CELL; if (S(x, y)) a += W(x, y, ss, k); } return a * CELL * CELL; };
        const rate = (R) => Math.max(0, BASE + GAIN * (on.value ? 1 : -1) * R);
        v.legend([['red', 'excitatory (ON) zone', { area: true }], ['blue', 'inhibitory zone', { area: true }], ['gold', 'stimulus']]);
        let st = null;
        v.render(() => {
          const ss = sc * sr.value, k = bal.value, sgn = on.value ? 1 : -1;
          const wmax = Math.abs(W(0, 0, ss, k));
          rf.raster((x, y) => { const c = v.diverge(Math.max(-1, Math.min(1, sgn * W(x, y, ss, k) / wmax)), 'blue', 'red'); return [...c, 1]; }, { res: 3, key: `${ss.toFixed(2)}|${k.toFixed(2)}|${sgn}` });
          const cx = hd.x, cy = hd.y, r = rad.value;
          const inS = shape.value === 'spot' ? (x, y) => (x - cx) ** 2 + (y - cy) ** 2 <= r * r : shape.value === 'ring' ? (x, y) => { const d = Math.hypot(x - cx, y - cy); return d >= r && d <= r + 1.5; } : () => true;
          if (shape.value === 'spot') rf.circle(cx, cy, r, { color: 'gold', width: 2.6, fill: 'gold', fillAlpha: 0.12 });
          else if (shape.value === 'ring') { rf.circle(cx, cy, r, { color: 'gold', width: 2.6 }); rf.circle(cx, cy, r + 1.5, { color: 'gold', width: 2.6 }); }
          else rf.rect(-6, -6, 6, 6, { color: 'gold', width: 4, fill: 'gold', fillAlpha: 0.08 });
          const R = resp(inS, ss, k), fr = rate(R);
          const Ru = resp(() => true, ss, k);
          tu.hline(BASE, { color: 'muted', dash: [5, 4] });
          tu.text('spontaneous rate', 5.9, BASE, { align: 'right', dy: 14, size: 11.5, color: 'muted' });
          const pts = []; for (let q = 0.1; q <= 6; q += 0.2) pts.push([q, rate(resp((x, y) => (x - cx) ** 2 + (y - cy) ** 2 <= q * q, ss, k))]);
          tu.path(pts, { color: 'accent', width: 2.8 });
          let best = pts[0]; for (const p of pts) if (p[1] > best[1]) best = p; // preferred size
          tu.dot(best[0], best[1], { r: 4, color: 'green' });
          if (shape.value === 'spot') tu.dot(r, rate(resp(inS, ss, k)), { r: 7, color: 'gold' });
          st = { fr, Ru, ru: rate(Ru), best };
        });
        v.readout(() => st ? `Firing rate for this stimulus: **${v.fix(st.fr, 0)} spikes/s** (baseline ${BASE}) · a uniform field gives ${v.fix(st.ru, 0)} spikes/s${st.ru <= BASE + 3 && st.ru >= BASE - 3 ? ' — almost no change from baseline' : ''} · preferred spot radius ≈ ${v.fix(st.best[0], 1)} (centre $\\sigma$ = 0.8)` : '');
      },
    },
    // ------------------------------------------------------------------ 4.7
    {
      num: '4.7',
      kind: 'Principle',
      name: 'Lateral inhibition (Hartline–Ratliff)',
      statement: String.raw`Neighbouring receptors inhibit one another, and the inhibition is stronger the closer they are and the more active the inhibiting receptor is. In the eye of the horseshoe crab *Limulus*, where the units can be recorded individually, the steady firing rate $r_p$ of unit $p$ obeys $$r_p=e_p-\sum_{q\ne p}k_{pq}\,\max(r_q-r_q^0,0),$$ where $e_p$ is the excitation from the light on $p$ itself, $k_{pq}$ the inhibitory coupling from $q$ to $p$ (falling with distance) and $r_q^0$ a threshold below which $q$ does not inhibit. Illuminating the neighbours therefore reduces the response of $p$ by an amount that adds up linearly over the neighbours, and the system as a whole responds more to differences in illumination than to its level.`,
      idea: String.raw`The inhibition acts on the *outputs* of the neighbours, which themselves are inhibited, so the equation is a coupled set that must be solved together; above threshold it is linear, $(I+K)\,\mathbf r=\mathbf e-K\mathbf r^0$, and a single matrix solve gives all responses. Hartline and Ratliff measured the couplings by illuminating pairs of units and found the linear sum with a threshold fitted the data. The steady state is not the one-step result $\mathbf e-K\mathbf e$: recurrent inhibition softens the effect, because a strongly inhibited neighbour inhibits less in return.`,
      caption: String.raw`Top: the light on a row of 25 receptors (a **single** lit cell, a **patch** of width $w$, or an **edge**; drag the **gold** handle to move it). Bottom: the steady firing rate from the Hartline–Ratliff equations. The **grey** outline is each unit's response if there were no inhibition. Raise the *strength* and *spread*: a cell in the lit region is driven less when its neighbours are also lit, the units beside a lit patch are suppressed, and at an edge the response overshoots on the bright side and undershoots on the dark side. *Recurrent* solves the equations to a steady state; *one pass* subtracts the neighbours' uninhibited responses. Couplings here are a model (exponential fall-off with distance), not Hartline and Ratliff's measured values.`,
      deps: ['psych-4.6'],
      refs: ['Goldstein ch. 3'],
      tags: ['lateral inhibition', 'Limulus', 'contrast'],
      credit: 'H. K. Hartline & F. Ratliff, 1957, J. Gen. Physiol. 40: 357–376 (Limulus eye); Hartline shared the 1967 Nobel Prize in Physiology or Medicine',
      scope: String.raw`Holds in the steady state for a model that is linear above a threshold, in the lateral eye of *Limulus*; the same architecture is found in the retinas of vertebrates, where it is only qualitatively similar (and acts through horizontal and amacrine cells).`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Lateral_inhibition' },
      verify: true,
      viz(v) {
        const M = v.M, N = 25;
        const pat = v.select('Light', [{ value: 'one', label: 'single cell' }, { value: 'patch', label: 'patch' }, { value: 'edge', label: 'edge' }], 'edge');
        const kk = v.slider('inhibition strength', 0, 0.5, 0.18, { step: 0.005 });
        const lam = v.slider('spread (receptors)', 0.5, 5, 2, { step: 0.1 });
        const wd = v.slider('patch width $w$', 1, 12, 5, { int: true });
        const mode = v.select('Steady state', [{ value: 'rec', label: 'recurrent (solved)' }, { value: 'one', label: 'one pass' }], 'rec');
        const e0 = 0.35, thr = 0.1;
        const inp = v.stage({ x: [0, N], y: [0, 1.4], axes: false, height: 200, weight: 1.4, minWidth: 340, title: 'light on the receptors' });
        const out = v.stage({ x: [0, N], y: [-0.2, 1.25], axes: false, height: 240, weight: 1.4, minWidth: 340, title: 'steady response' });
        const hd = inp.handle(12.5, 1.2, { color: 'gold', r: 8, label: 'move', labelPos: 'n', constrain: (x) => [Math.min(N - 1, Math.max(1, Math.round(x - 0.5) + 0.5)), 1.2] });
        const Kmat = (k, l) => Array.from({ length: N }, (_, p) => Array.from({ length: N }, (_, q) => (p === q ? 0 : k * Math.exp(-(Math.abs(p - q) - 1) / l) * (Math.abs(p - q) <= 8 ? 1 : 0))));
        const solve = (e, K, rec) => {
          if (!rec) return e.map((x, p) => x - K[p].reduce((a, kq, q) => a + kq * Math.max(e[q] - thr, 0), 0));
          let r = e.slice();
          for (let it = 0; it < 200; it++) { const nr = e.map((x, p) => x - K[p].reduce((a, kq, q) => a + kq * Math.max(r[q] - thr, 0), 0)); const d = nr.reduce((a, x, i) => a + Math.abs(x - r[i]), 0); r = r.map((x, i) => 0.5 * x + 0.5 * nr[i]); if (d < 1e-9) break; }
          return r;
        };
        v.legend([['accent', 'response with inhibition', { area: true }], ['muted', 'response with none', { dash: true }]]);
        let info = null;
        v.render(() => {
          const c = Math.round(hd.x - 0.5), w = wd.value, rec = mode.value === 'rec';
          const e = Array.from({ length: N }, (_, i) => {
            if (pat.value === 'one') return i === c ? 1 : e0;
            if (pat.value === 'patch') return i >= c - Math.floor(w / 2) && i < c - Math.floor(w / 2) + w ? 1 : e0;
            return i >= c ? 1 : e0;
          });
          const K = Kmat(kk.value, lam.value), r = solve(e, K, rec), r0 = solve(Array(N).fill(e0), K, rec);
          for (let i = 0; i < N; i++) {
            inp.rect(i + 0.08, 0, i + 0.92, e[i], { fill: 'gold', fillAlpha: 0.55, stroke: false });
            out.rect(i + 0.08, 0, i + 0.92, Math.max(r[i], -0.2), { fill: r[i] >= 0 ? 'accent' : 'red', fillAlpha: 0.75, stroke: false });
            out.line(i + 0.04, e[i], i + 0.96, e[i], { color: 'muted', width: 1.4, dash: [3, 3] });
          }
          out.hline(0, { color: 'faint' });
          // numbers
          let pk = -1, dp = 1e9; for (let i = 0; i < N; i++) { if (pat.value === 'edge') { if (i >= c) pk = Math.max(pk, r[i]); else dp = Math.min(dp, r[i]); } }
          info = { r, r0, c, e, pk, dp };
        });
        v.readout(() => {
          if (!info) return '';
          const { r, r0, c, e } = info;
          if (pat.value === 'edge') {
            const hi = r[Math.min(N - 1, Math.round((c + N) / 2))], lo = r[Math.max(0, Math.round(c / 2))], pkv = info.pk, dpv = info.dp;
            return `Away from the edge (the ends of a short row are less inhibited) the lit side settles at ${v.fix(hi, 3)} and the dark side at ${v.fix(lo, 3)} (uninhibited 1 and ${e0}); at the edge the bright side peaks at **${v.fix(pkv, 3)}** (+${v.fix(100 * (pkv - hi) / Math.max(hi, 1e-9), 0)}%) and the dark side dips to **${v.fix(dpv, 3)}** (${v.fix(100 * (dpv - lo) / Math.max(lo, 1e-9), 0)}%).`;
          }
          const cc = Math.min(N - 1, Math.max(0, c));
          const nb = Math.min(N - 1, cc + (pat.value === 'patch' ? Math.ceil(wd.value / 2) + 1 : 2));
          return `Lit unit ${cc + 1}: responds **${v.fix(r[cc], 3)}** (it would give 1 with no inhibition) · the unlit unit ${nb + 1} beside the light is pushed from ${v.fix(r0[nb], 3)} (when the whole row is at the background level) down to **${v.fix(r[nb], 3)}**.`;
        });
      },
    },
    // ------------------------------------------------------------------ 4.8
    {
      num: '4.8',
      kind: 'Theorem',
      name: 'Lateral inhibition predicts Mach bands',
      statement: String.raw`Let $L(x)$ be a luminance profile that is constant, ramps linearly and is constant again, and let a retinal unit respond to it with a centre–surround weighting $w=G_{\sigma_c}-k\,G_{\sigma_s}$ that integrates to $1-k$. Then for $k=1$ (balanced) the response $R=w*L$ is zero on the plateaus and, to a good approximation when the ramp width is small relative to $\sigma_s$, equals $-c\,L''$ smoothed at the scale of the centre: it **overshoots above** the bright plateau at the bright end of the ramp and **undershoots below** the dark plateau at the dark end. These two extremes occur at the **knees** of the profile (where $L'$ changes), exactly where observers see a bright band on the light side and a dark band on the dark side (the **Mach bands**), although the luminance there has no such features.`,
      idea: String.raw`Convolving with a kernel of zero total weight acts, to leading order, like a second derivative: $w*L\approx\tfrac{1}{2}(\sigma_c^2-k\sigma_s^2)L''$ for slowly varying $L$ (from the Taylor expansion of $L(x-y)$ in the convolution integral, the convolution of rca-8.13), and a piecewise-linear $L$ has $L''$ concentrated at the knees, with positive sign at the one and negative at the other. Because $\sigma_s>\sigma_c$ and $k=1$, the coefficient $\sigma_c^2-k\sigma_s^2$ is negative, so the response is proportional to $-L''$: positive at the bright knee, where the slope drops from positive to zero ($L''<0$), and negative at the dark knee ($L''>0$). That is the Mach band pattern. If the ramp is much wider than the surround, the profile is locally linear everywhere and the response is flat except for faint features, so the bands vanish.`,
      caption: String.raw`**Top:** the luminance profile (**black**), a plateau, a linear ramp and a plateau; drag the **gold** handles to move the knees. **Middle:** the response of the difference-of-Gaussians unit (**blue**), with the plateau levels (dashed). **Bottom:** the stimulus as a strip (above) and the model's "perceived brightness" (below, response rescaled to grey); the bands are in the lower strip and not in the upper. Widen the ramp and the bands fade. Change the surround weight: with $k=0$ there is no overshoot. Ernst Mach described the bands in 1865; this figure is computed, not measured.`,
      deps: ['psych-4.7', 'art-6.2', 'rca-8.13'],
      refs: ['Goldstein ch. 3'],
      tags: ['Mach bands', 'lateral inhibition', 'convolution'],
      credit: 'Ernst Mach, 1865 (bands); Ratliff, Hartline and others tied them to lateral inhibition, 1950s–60s (unconfirmed)',
      scope: String.raw`Valid for a linear centre–surround unit and ramps not much wider than the surround. Real Mach bands also depend on contrast, on viewing distance and on the shape of the ramp, and some of the effect may arise beyond the retina.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Mach_bands' },
      verify: true,
      viz(v) {
        const sc = v.slider('centre width $\\sigma_c$', 0.04, 0.4, 0.12, { step: 0.005 });
        const sr = v.slider('surround / centre width', 2, 8, 4, { step: 0.1 });
        const kk = v.slider('surround weight $k$', 0, 1.2, 1, { step: 0.01 });
        const N = 400, X0 = 0, X1 = 10, dx = (X1 - X0) / N, LO = 0.25, HI = 0.8;
        const lum = v.stage({ x: [0, 10], y: [0, 1], axes: 'box', gutter: true, height: 180, weight: 1.4, minWidth: 340, ylabel: 'luminance', title: 'stimulus' });
        const rs = v.stage({ x: [0, 10], y: [-0.1, 0.1], axes: 'box', gutter: true, height: 210, weight: 1.4, minWidth: 340, ylabel: 'response', xlabel: 'position', title: 'response of the centre–surround unit' });
        const st = v.stage({ x: [0, 10], y: [0, 2], axes: false, height: 120, weight: 1.4, minWidth: 340, title: 'stimulus (top) and model brightness (bottom)' });
        const L = (x, a, b) => (x <= a ? LO : x >= b ? HI : LO + ((HI - LO) * (x - a)) / (b - a));
        const ha = lum.handle(4.4, LO, { color: 'gold', r: 8, constrain: (x) => [Math.min(Math.max(x, 1.5), hb.x - 0.1), LO] });
        const hb = lum.handle(5.6, HI, { color: 'gold', r: 8, constrain: (x) => [Math.max(Math.min(x, 8.5), ha.x + 0.1), HI] });
        let R = null, key = '', info = null;
        v.legend([['ink', 'luminance'], ['accent', 'unit response'], ['muted', 'plateau levels', { dash: true }]]);
        v.render(() => {
          const a = ha.x, b = hb.x; ha.set(a, LO); hb.set(b, HI);
          const l = Array.from({ length: N }, (_, i) => L(X0 + (i + 0.5) * dx, a, b));
          R = dog1(l, sc.value / dx, (sc.value * sr.value) / dx, kk.value);
          lum.fn((x) => L(x, a, b), { domain: [0, 10], color: 'ink', width: 3 });
          const i1 = Math.floor(0.4 * N * 0.1), i2 = N - i1;
          const pl = R[Math.floor(0.08 * N)], ph = R[Math.floor(0.92 * N)];
          { let m = 0.02; for (const r of R) m = Math.max(m, Math.abs(r)); rs.setView([0, 10], [-1.35 * m, 1.35 * m]); }
          rs.hline(pl, { color: 'muted', dash: [5, 4] }); rs.hline(ph, { color: 'muted', dash: [5, 4] });
          rs.path(R.map((r, i) => [X0 + (i + 0.5) * dx, r]), { color: 'accent', width: 2.8 });
          // extremes near the knees
          let mx = -9, mxi = 0, mn = 9, mni = 0;
          for (let i = 0; i < N; i++) { const x = X0 + (i + 0.5) * dx; if (x > b - 1.2 && x < b + 1.2 && R[i] > mx) { mx = R[i]; mxi = i; } if (x > a - 1.2 && x < a + 1.2 && R[i] < mn) { mn = R[i]; mni = i; } }
          rs.dot(X0 + (mxi + 0.5) * dx, mx, { r: 5, color: 'green' }); rs.dot(X0 + (mni + 0.5) * dx, mn, { r: 5, color: 'red' });
          const span = Math.max(1e-6, ph - pl), lo = Math.min(R[Math.floor(0.08 * N)], mn), hi2 = Math.max(ph, mx);
          const k2 = `${a.toFixed(2)}|${b.toFixed(2)}|${sc.value}|${sr.value}|${kk.value}`;
          st.raster((x, y) => { const i = Math.min(N - 1, Math.max(0, Math.floor((x - X0) / dx))); if (y > 1) return [...grey(l[i]), 1]; const t = 0.5 + 0.5 * (R[i] - (pl + ph) / 2) / Math.max(1e-6, Math.max(hi2 - (pl + ph) / 2, (pl + ph) / 2 - lo)); return [...grey(LO + (HI - LO) * clamp01(t)), 1]; }, { res: 2, key: k2 });
          info = { over: (mx - ph) / (HI - LO), under: (pl - mn) / (HI - LO), xb: X0 + (mxi + 0.5) * dx, xa: X0 + (mni + 0.5) * dx, a, b, ph, pl };
        });
        v.readout(() => info ? `Bright band: response peaks ${v.fix(100 * info.over, 1)}% of the luminance step above the bright plateau, at x = ${v.fix(info.xb, 2)} (knee at ${v.fix(info.b, 2)}) · dark band: ${v.fix(100 * info.under, 1)}% below the dark plateau, at x = ${v.fix(info.xa, 2)} (knee at ${v.fix(info.a, 2)}) · ramp width ${v.fix(info.b - info.a, 2)} vs surround width ${v.fix(sc.value * sr.value, 2)}` : '');
      },
    },
    // ------------------------------------------------------------------ 4.9
    {
      num: '4.9',
      kind: 'Phenomenon',
      name: 'The Hermann grid and its wavy-line refutation',
      statement: String.raw`In a grid of black squares separated by white streets, faint dark smudges appear at the street intersections that you are not looking at (they vanish when you fixate one). The standard account (Baumgartner, 1960) is that a ganglion cell with a centre–surround field sitting on an intersection has more of its inhibitory surround lit (four streets) than a cell on a street (two), so it responds less. But when the straight streets are replaced by gently **wavy** or bent ones, the smudges are reported to weaken or disappear, although for modest bending a linear centre–surround model still predicts most of its dip at the crossings. This argues that the receptive-field account is, at best, incomplete, and that straightness of the grid lines matters.`,
      idea: String.raw`The centre–surround model is a linear filter, so the response at any point is a fixed weighted sum of the image near it; computing it for the straight grid does give lower values at the intersections than on the streets. The model's response to a modestly bent grid still contains dips at the (now curved) crossings, shrinking only gradually as the bending grows, but nothing in a filter of the model's kind makes the percept depend on whether the streets are straight, and the percept does. Geier and colleagues therefore proposed that the illusion arises from the straightness of the lines' edges (a property that requires orientation-selective cortical processing), not from retinal centre–surround cells alone. This item is deliberately a *test* of the model against an observation: the model's output is computed here; what you see is your own data.`,
      caption: String.raw`**Left:** the grid; fixate a point in the middle of a block of squares and look for grey smudges at the nearby crossings. Increase the *waviness* and see whether they weaken or vanish. **Right:** the output of a centre–surround model on the same picture (bright = strong response): the intersections show dips. The readout compares the model's response at the crossings with the middle of the streets, for the straight grid and for the grid as drawn. The model is a plain difference of Gaussians, with no orientation selectivity; "what the observers see" comes only from you and from the cited study.`,
      deps: ['psych-4.7'],
      refs: ['Goldstein ch. 3'],
      tags: ['Hermann grid', 'illusion', 'receptive field'],
      credit: 'Ludimar Hermann, 1870; Baumgartner, 1960 (centre–surround account, unconfirmed); Geier, Bernáth, Hudák & Séra, 2008, Perception 37: 651–665 (straightness)',
      scope: String.raw`How strong the illusion is depends on the width of the streets relative to the distance and on the size of the area of central vision viewed; and the question of which mechanism produces it is still debated.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Grid_illusion', geier: 'https://geier.hu/Hermann/index.html' },
      verify: true,
      viz(v) {
        const wst = v.slider('street width', 0.2, 1, 0.5, { step: 0.01 });
        const amp = v.slider('waviness (amplitude)', 0, 0.5, 0, { step: 0.01 });
        const sc = v.slider('model centre width $\\sigma_c$', 0.05, 0.4, 0.1, { step: 0.005 });
        const n = 120, P = 2.5, u = 10 / n, LAM = 1.7;
        const left = v.stage({ x: [0, 10], y: [0, 10], equal: true, axes: false, height: 330, weight: 1, minWidth: 290, title: 'the grid' });
        const right = v.stage({ x: [0, 10], y: [0, 10], equal: true, axes: false, height: 330, weight: 1, minWidth: 290, title: 'model response (difference of Gaussians)' });
        const make = (w, A) => {
          const a = new Float64Array(n * n);
          for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) {
            const x = (i + 0.5) * u, y = (j + 0.5) * u;
            const dx = ((((x - A * Math.sin((2 * Math.PI * y) / LAM)) % P) + P) % P) - P / 2, dy = ((((y - A * Math.sin((2 * Math.PI * x) / LAM)) % P) + P) % P) - P / 2;
            a[j * n + i] = Math.abs(dx) < w / 2 || Math.abs(dy) < w / 2 ? 1 : 0.04;
          }
          return a;
        };
        const respOf = (I, s) => { const c = blur2(I, n, n, s / u), b = blur2(I, n, n, (4 * s) / u); return Float64Array.from(c, (x, i) => x - b[i]); };
        const at = (R, x, y) => R[Math.min(n - 1, Math.max(0, Math.floor(y / u))) * n + Math.min(n - 1, Math.max(0, Math.floor(x / u)))];
        function dip(R, A) {
          let di = 0, ds = 0, c = 0;
          for (let k = 0; k < 4; k++) for (let m = 0; m < 4; m++) {
            let x = k * P + P / 2 + P, y = m * P + P / 2 + P; // intersection (streets are centred at P/2 + kP)
            x = k * P + P / 2; y = m * P + P / 2;
            for (let t = 0; t < 25; t++) { x = k * P + P / 2 + A * Math.sin((2 * Math.PI * y) / LAM); y = m * P + P / 2 + A * Math.sin((2 * Math.PI * x) / LAM); }
            if (x < 1.2 || x > 8.8 || y < 1.2 || y > 8.8) continue;
            const yy = y + P / 2, xx = k * P + P / 2 + A * Math.sin((2 * Math.PI * yy) / LAM);
            if (yy > 8.8) continue;
            di += at(R, x, y); ds += at(R, xx, yy); c++;
          }
          return c ? { di: di / c, ds: ds / c, dip: 1 - di / ds } : { di: 0, ds: 1, dip: 0 };
        }
        let info = null;
        v.render(() => {
          const w = wst.value, A = amp.value, s = sc.value;
          const I = make(w, A), R = respOf(I, s);
          const key = `${w}|${A}|${s}`;
          left.raster((x, y) => { const g = I[Math.max(0, Math.min(n - 1, Math.floor(y / u))) * n + Math.max(0, Math.min(n - 1, Math.floor(x / u)))]; return [...grey(g), 1]; }, { res: 2, key: 'L' + key });
          let lo = 1e9, hi = -1e9; for (let i = 0; i < R.length; i++) { lo = Math.min(lo, R[i]); hi = Math.max(hi, R[i]); }
          right.raster((x, y) => { const r = at(R, x, y); const t = (r - lo) / Math.max(1e-6, hi - lo); return [...grey(0.1 + 0.85 * t), 1]; }, { res: 2, key: 'R' + key });
          left.dot(5, 5, { r: 4, color: 'red' });
          const d1 = dip(R, A), d0 = A === 0 ? d1 : dip(respOf(make(w, 0), s), 0);
          info = { d1, d0 };
        });
        v.readout(() => info ? `Model response at the crossings relative to mid-street: ${v.fix(100 * (1 - info.d0.dip), 0)}% for the straight grid (a dip of ${v.fix(100 * info.d0.dip, 0)}%) and ${v.fix(100 * (1 - info.d1.dip), 0)}% for the grid as drawn (dip ${v.fix(100 * info.d1.dip, 0)}%). The reported percept of smudges is a separate matter: look at the left panel with waviness 0, then raise it.` : '');
      },
    },
    // ------------------------------------------------------------------ 4.10
    {
      num: '4.10',
      kind: 'Phenomenon',
      name: 'White’s illusion: contrast against lateral inhibition',
      statement: String.raw`Take vertical black and white stripes and replace short stretches of two stripes by grey bars of the **same** luminance, one lying in a black stripe and one in a white stripe. The bar in the **black** stripe looks **lighter** than the one in the white stripe. This is the *reverse* of what centre–surround inhibition predicts for the pattern as drawn: a bar in a black stripe has white stripes along its long sides, so a cell centred on it receives a lot of inhibitory light and should signal *darker*. By contrast, grey squares on a plain black and white background (simultaneous contrast) look as the model predicts, with the square on black lighter. So a purely local contrast account cannot be the whole story of lightness.`,
      idea: String.raw`Lateral inhibition (4.7) turns the image into a map of local contrasts; here the map contradicts the percept. Proposed repairs include multiscale filters whose coarse channels show contrast and fine channels assimilation (Blakeslee & McCourt's oriented difference-of-Gaussians model, 1999), and accounts in terms of grouping (the bar belongs with the stripe it lies in) or of framework anchoring (4.12). The effect depends on how much of each bar's border touches the contrasting stripes.`,
      caption: String.raw`**Left:** White's pattern (or the plain simultaneous-contrast *control*), with a **probe** square beside each grey bar. Both bars have the grey level set by *bar luminance*. Adjust the two **match** sliders until each probe looks the same grey as the bar beside it: the difference between your two settings is the size of the illusion for you (nulling it). **Right:** the output of a difference-of-Gaussians model with the scale you choose; the readout says which bar the model calls lighter. The model is plain centre–surround, one scale; real outcomes differ by observer and viewing conditions, and no data from experiments are shown.`,
      deps: ['psych-4.7', 'art-6.3'],
      refs: ['Goldstein ch. 9'],
      tags: ['White illusion', 'lightness', 'illusion'],
      credit: 'Michael White, 1979, Perception 8: 413–416; multiscale account: Blakeslee & McCourt, 1999, Vision Res. 39: 4361–4377 (volume and pages unconfirmed)',
      scope: String.raw`The size and even the direction of the effect change with the stripe width, bar length and viewing distance; the model comparison assumes the bars' long sides are longer than the receptive-field surround.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/White%27s_illusion' },
      verify: true,
      viz(v) {
        const pat = v.select('Pattern', [{ value: 'white', label: 'White’s stripes' }, { value: 'ctrl', label: 'control: plain background' }], 'white');
        const tg = v.slider('bar luminance', 0.25, 0.75, 0.5, { step: 0.01 });
        const sc = v.slider('model scale $\\sigma_c$', 0.05, 0.4, 0.12, { step: 0.005 });
        const mA = v.slider('your match for the upper bar (in the white stripe)', 0, 1, 0.5, { step: 0.005 });
        const mB = v.slider('your match for the lower bar (in the black stripe)', 0, 1, 0.5, { step: 0.005 });
        const nx = 200, ny = 120, u = 0.05;
        const A = [3, 0.9, 4, 2.9], B = [6, 3.1, 7, 5.1], AC = [3, 1.4, 4, 2.4], BC = [6, 3.6, 7, 4.6];
        const img = v.stage({ x: [0, 13.4], y: [0, 6], equal: true, axes: false, height: 330, weight: 1.35, minWidth: 340, title: 'stimulus and probes' });
        const mod = v.stage({ x: [0, 10], y: [0, 6], equal: true, axes: false, height: 250, weight: 1, minWidth: 280, title: 'model response' });
        const build = (p, T) => {
          const a = new Float64Array(nx * ny);
          const bar = p === 'white' ? [A, B] : [AC, BC];
          for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
            const x = (i + 0.5) * u, y = (j + 0.5) * u; let g;
            if (p === 'white') g = Math.floor(x) % 2 === 0 ? 0.04 : 1; else g = x < 5 ? 1 : 0.04;
            for (const r of bar) if (x >= r[0] && x < r[2] && y >= r[1] && y < r[3]) g = T;
            a[j * nx + i] = g;
          }
          return a;
        };
        let info = null;
        v.legend([['ink', 'stimulus'], ['gold', 'probe (your match)']]);
        v.render(() => {
          const p = pat.value, T = tg.value, I = build(p, T), s = sc.value / u;
          const c = blur2(I, nx, ny, s), b = blur2(I, nx, ny, 4 * s), R = Float64Array.from(c, (x, i) => x - b[i]);
          const key = `${p}|${T}|${sc.value}`;
          img.raster((x, y) => { if (x > 10) return [...grey(0.5), 1]; return [...grey(I[Math.max(0, Math.min(ny - 1, Math.floor(y / u))) * nx + Math.max(0, Math.min(nx - 1, Math.floor(x / u)))]), 1]; }, { res: 2, key: 'I' + key });
          const rA = p === 'white' ? A : AC, rB = p === 'white' ? B : BC;
          const sw = (r, m, lab) => { img.rect(10.7, r[1] + 0.3, 12.7, r[3] - 0.3, { fill: grey(m), fillAlpha: 1, color: 'gold', width: 1.6 }); };
          sw(rA, mA.value, 'A'); sw(rB, mB.value, 'B');
          img.text('A', (rA[0] + rA[2]) / 2 + 0.0, rA[3] + 0.3, { align: 'center', size: 12, color: 'gold', weight: 700 });
          img.text('B', (rB[0] + rB[2]) / 2, rB[3] + 0.3, { align: 'center', size: 12, color: 'gold', weight: 700 });
          const samp = (r) => { const cx = (r[0] + r[2]) / 2, cy = (r[1] + r[3]) / 2; let a = 0, k = 0; for (let dy = -0.3; dy <= 0.3; dy += 0.05) for (let dx = -0.3; dx <= 0.3; dx += 0.05) { const i = Math.floor((cx + dx) / u), j = Math.floor((cy + dy) / u); a += R[j * nx + i]; k++; } return a / k; };
          const ra = samp(rA), rb = samp(rB);
          let lo = 1e9, hi = -1e9; for (let i = 0; i < R.length; i++) { lo = Math.min(lo, R[i]); hi = Math.max(hi, R[i]); }
          mod.raster((x, y) => { const t = (R[Math.max(0, Math.min(ny - 1, Math.floor(y / u))) * nx + Math.max(0, Math.min(nx - 1, Math.floor(x / u)))] - lo) / Math.max(1e-6, hi - lo); return [...grey(0.05 + 0.9 * t), 1]; }, { res: 2, key: 'M' + key });
          for (const [r, l] of [[rA, 'A'], [rB, 'B']]) { mod.rect(r[0], r[1], r[2], r[3], { color: 'gold', width: 1.4, stroke: true, fillAlpha: 0 }); mod.text(l, (r[0] + r[2]) / 2, r[3] + 0.3, { align: 'center', color: 'gold', size: 12, weight: 700 }); }
          info = { ra, rb, p };
        });
        v.readout(() => {
          if (!info) return '';
          const model = info.ra > info.rb ? 'A (upper bar)' : 'B (lower bar)';
          const seen = info.p === 'white' ? 'B (the bar in the black stripe)' : 'B (the square on black)';
          return `Model output at the bar centres: A ${v.fix(info.ra, 3)}, B ${v.fix(info.rb, 3)} → the model calls **${model}** lighter · what most viewers report: **${seen}** lighter · your two matches differ by ${v.fix(mB.value - mA.value, 3)} (positive = B matched lighter than A)`;
        });
      },
    },
  ],
};
