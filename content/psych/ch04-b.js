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
      viz(v) {
        const M = v.M, N = 25;
        const pat = v.select('Light', [{ value: 'one', label: 'single cell' }, { value: 'patch', label: 'patch' }, { value: 'edge', label: 'edge' }], 'edge');
        const kk = v.slider('inhibition strength', 0, 0.5, 0.18, { step: 0.005 });
        const lam = v.slider('spread (receptors)', 0.5, 5, 2, { step: 0.1 });
        const wd = v.slider('patch width $w$', 1, 12, 5, { int: true });
        const mode = v.select('Steady state', [{ value: 'rec', label: 'recurrent (solved)' }, { value: 'one', label: 'one pass' }], 'rec');
        const e0 = 0.35, thr = 0.1;
        const inp = v.stage({ x: [0, N], y: [0, 1.25], axes: false, height: 200, weight: 1.4, minWidth: 340, title: 'light on the receptors' });
        const out = v.stage({ x: [0, N], y: [-0.2, 1.25], axes: false, height: 240, weight: 1.4, minWidth: 340, title: 'steady response' });
        const hd = inp.handle(12.5, 1.1, { color: 'gold', r: 8, label: 'move', labelPos: 'n', constrain: (x) => [Math.min(N - 1, Math.max(1, Math.round(x - 0.5) + 0.5)), 1.1] });
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
            const hi = r[N - 1], lo = r[0], pkv = info.pk, dpv = info.dp;
            return `Far from the edge the lit side settles at ${v.fix(hi, 3)} and the dark side at ${v.fix(lo, 3)} (uninhibited 1 and ${e0}); at the edge the bright side peaks at **${v.fix(pkv, 3)}** (+${v.fix(100 * (pkv - hi) / Math.max(hi, 1e-9), 0)}%) and the dark side dips to **${v.fix(dpv, 3)}** (${v.fix(100 * (dpv - lo) / Math.max(lo, 1e-9), 0)}%).`;
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
        const rs = v.stage({ x: [0, 10], y: [-0.45, 0.45], axes: 'box', gutter: true, height: 210, weight: 1.4, minWidth: 340, ylabel: 'response', xlabel: 'position', title: 'response of the centre–surround unit' });
        const st = v.stage({ x: [0, 10], y: [0, 2], axes: false, height: 120, weight: 1.4, minWidth: 340, title: 'stimulus (top) and model brightness (bottom)' });
        const L = (x, a, b) => (x <= a ? LO : x >= b ? HI : LO + ((HI - LO) * (x - a)) / (b - a));
        const ha = lum.handle(3.8, LO, { color: 'gold', r: 8, constrain: (x) => [Math.min(Math.max(x, 1.5), hb.x - 0.1), LO] });
        const hb = lum.handle(6.2, HI, { color: 'gold', r: 8, constrain: (x) => [Math.max(Math.min(x, 8.5), ha.x + 0.1), HI] });
        let R = null, key = '', info = null;
        v.legend([['ink', 'luminance'], ['accent', 'unit response'], ['muted', 'plateau levels', { dash: true }]]);
        v.render(() => {
          const a = ha.x, b = hb.x; ha.set(a, LO); hb.set(b, HI);
          const l = Array.from({ length: N }, (_, i) => L(X0 + (i + 0.5) * dx, a, b));
          R = dog1(l, sc.value / dx, (sc.value * sr.value) / dx, kk.value);
          lum.fn((x) => L(x, a, b), { domain: [0, 10], color: 'ink', width: 3 });
          const i1 = Math.floor(0.4 * N * 0.1), i2 = N - i1;
          const pl = R[Math.floor(0.08 * N)], ph = R[Math.floor(0.92 * N)];
          rs.hline(pl, { color: 'muted', dash: [5, 4] }); rs.hline(ph, { color: 'muted', dash: [5, 4] });
          rs.path(R.map((r, i) => [X0 + (i + 0.5) * dx, r]), { color: 'accent', width: 2.8 });
          // extremes near the knees
          let mx = -9, mxi = 0, mn = 9, mni = 0;
          for (let i = 0; i < N; i++) { const x = X0 + (i + 0.5) * dx; if (x > b - 1.2 && x < b + 1.2 && R[i] > mx) { mx = R[i]; mxi = i; } if (x > a - 1.2 && x < a + 1.2 && R[i] < mn) { mn = R[i]; mni = i; } }
          rs.dot(X0 + (mxi + 0.5) * dx, mx, { r: 5, color: 'green' }); rs.dot(X0 + (mni + 0.5) * dx, mn, { r: 5, color: 'red' });
          const span = Math.max(1e-6, ph - pl), lo = Math.min(R[Math.floor(0.08 * N)], mn), hi2 = Math.max(ph, mx);
          const k2 = `${a.toFixed(2)}|${b.toFixed(2)}|${sc.value}|${sr.value}|${kk.value}`;
          st.raster((x, y) => { const i = Math.min(N - 1, Math.max(0, Math.floor((x - X0) / dx))); if (y > 1) return [...grey(l[i]), 1]; const t = 0.5 + 0.5 * (R[i] - (pl + ph) / 2) / Math.max(1e-6, Math.max(hi2 - (pl + ph) / 2, (pl + ph) / 2 - lo)); return [...grey(LO + (HI - LO) * clamp01(t)), 1]; }, { res: 2, key: k2 });
          info = { over: (mx - ph) / span, under: (pl - mn) / span, xb: X0 + (mxi + 0.5) * dx, xa: X0 + (mni + 0.5) * dx, a, b, ph, pl };
        });
        v.readout(() => info ? `Bright band: response peaks ${v.fix(100 * info.over, 0)}% of the plateau step above the bright plateau, at x = ${v.fix(info.xb, 2)} (knee at ${v.fix(info.b, 2)}) · dark band: ${v.fix(100 * info.under, 0)}% below the dark plateau, at x = ${v.fix(info.xa, 2)} (knee at ${v.fix(info.a, 2)}) · ramp width ${v.fix(info.b - info.a, 2)} vs surround width ${v.fix(sc.value * sr.value, 2)}` : '');
      },
    },
  ],
};
