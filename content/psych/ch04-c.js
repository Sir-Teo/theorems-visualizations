// Psychology & Perception — Chapter 4: Early vision (items 4.11–4.14)
import { anchoredReflectances, cornsweetCusp } from './verification-models.js';
import { grey, clamp01, logistic, smooth01, logTicks, BLIND } from './ch04.shared.js';

export default {
  collection: 'psych',
  chapter: 4,
  items: [
    // ------------------------------------------------------------------ 4.11
    {
      num: '4.11',
      kind: 'Phenomenon',
      name: 'Craik–O’Brien–Cornsweet illusion',
      statement: String.raw`Two adjacent regions of **exactly equal** luminance can look clearly different in lightness if their common border has a particular profile: a sharp step from bright to dark at the border, relaxing smoothly over a distance (the *cusp* or *Cornsweet profile*) to the common luminance on both sides. The side next to the bright flank looks lighter than the side next to the dark flank over its whole area, although the luminance away from the edge is the same. Covering the sharp edge (and the first part of the tails) makes the two regions look equal again.`,
      idea: String.raw`If the visual system encodes mainly *luminance gradients that are steep enough* (edges) and discards slow ones (4.7: a centre–surround filter attenuates low spatial frequencies), then lightness is reconstructed by **integrating the edge signals** from a reference point. In the cusp profile the one sharp edge contributes a jump of $2a$ while the two shallow tails, which would give back $-a$ on each side, fall below the cutoff and are ignored. The integration then "fills in" a step of $2a$ across the whole of both regions. A real step of the same height, covered, still leaves the two sides differently bright; the cover only helps because the covered cusp has no net luminance difference left. The model below is a deliberately minimal version of this edge-integration idea.`,
      caption: String.raw`**Top:** luminance along a line across the border (**black**) and the lightness the edge-integration model reconstructs (**green**). Drag the **gold** handle to move a grey *cover* across the border, and change its width. **Bottom:** the stimulus as it appears (upper strip) and the model's lightness (lower strip). Raise the *slow-gradient cutoff* and more of the tails is ignored; lower it, and the model reports the tails and the illusion shrinks. Choose *real step* to compare with an edge of the same height: the covered step still looks different, the covered cusp does not. This is a toy model of the illusion, not a fit to data.`,
      deps: ['psych-4.7'],
      refs: ['Goldstein ch. 3'],
      tags: ['Cornsweet', 'edge integration', 'illusion'],
      credit: 'Kenneth Craik (1966), Vivian O’Brien (1959, Am. J. Psychol. 72: 299; Craik–O’Brien) and Tom Cornsweet (1969–70; Visual Perception, Academic Press, 1970)',
      scope: String.raw`The illusion is robust for edges with fairly steep cores and tails that spread over several degrees; it weakens with very shallow cusps, with edges blurred by the optics, and for larger fields. The Cornsweet profile also supports a simpler description: the visual system treats the edge as a luminance step and interpolates between edges.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Cornsweet_illusion' },
      verify: true,
      viz(v) {
        const prof = v.select('Edge', [{ value: 'cusp', label: 'Cornsweet cusp' }, { value: 'step', label: 'real step' }], 'cusp');
        const amp = v.slider('edge size $a$', 0.04, 0.3, 0.16, { step: 0.005 });
        const wd = v.slider('tail length $w$', 0.3, 3, 1.4, { step: 0.05 });
        const cw = v.slider('cover half-width', 0, 2.5, 0.8, { step: 0.05 });
        const cut = v.slider('slow-gradient cutoff', 0.02, 1.5, 0.35, { step: 0.01 });
        const cov = v.toggle('cover on', true);
        const N = 500, X1 = 10, dx = X1 / N, L0 = 0.5, XE = 5;
        const pl = v.stage({ x: [0, 10], y: [0.3, 0.7], axes: 'box', gutter: true, height: 250, weight: 1.4, minWidth: 340, ylabel: 'luminance / lightness', xlabel: 'position across the border', title: 'profile and reconstructed lightness' });
        const strip = v.stage({ x: [0, 10], y: [0, 2], axes: false, height: 130, weight: 1.4, minWidth: 340, title: 'what is shown (top) and the model’s lightness (bottom)' });
        const hc = pl.handle(5, 0.33, { color: 'gold', r: 8, label: 'cover', labelPos: 'n', constrain: (x) => [Math.min(8, Math.max(2, x)), 0.33] });
        v.legend([['ink', 'luminance on the screen'], ['green', 'model lightness'], ['gold', 'cover']]);
        let info = null;
        v.render(() => {
          const a = amp.value, w = wd.value, c = hc.x, h = cw.value, on = cov.value && h > 0;
          const L = Array.from({ length: N }, (_, i) => {
            const x = (i + 0.5) * dx;
            if (on && Math.abs(x - c) <= h) return L0;
            if (prof.value === 'step') return x < XE ? L0 + a : L0 - a;
            return cornsweetCusp(x,a,w,XE,L0);
          });
          // edge integration: keep only gradients steeper than the cutoff (luminance units per unit x)
          const P = new Array(N); P[0] = L[0];
          for (let i = 1; i < N; i++) { const d = (L[i] - L[i - 1]) / dx; P[i] = P[i - 1] + (Math.abs(d) >= cut.value ? L[i] - L[i - 1] : 0); }
          const i1 = Math.round(1 / dx), i2 = N - 1 - i1;
          const shift = L0 - (P[i1] + P[i2]) / 2;
          const Pn = P.map((p) => p + shift);
          pl.setView([0,10],[Math.min(.3,...L,...Pn)-.02,Math.max(.7,...L,...Pn)+.02]);
          pl.rect(c - h, Math.min(.3,...L,...Pn)-.02, c + h, Math.max(.7,...L,...Pn)+.02, { fill: 'gold', fillAlpha: on ? 0.18 : 0.04, stroke: false });
          pl.path(L.map((l, i) => [(i + 0.5) * dx, l]), { color: 'ink', width: 3 });
          pl.path(Pn.map((p, i) => [(i + 0.5) * dx, p]), { color: 'green', width: 2.6 });
          pl.hline(L0, { color: 'faint', dash: [4, 3] });
          const lo = L0 - a - 0.02, hi = L0 + a + 0.02;
          strip.raster((x, y) => { const i = Math.min(N - 1, Math.floor(x / dx)); const g = y > 1 ? L[i] : Pn[i]; return [...grey(g), 1]; }, { res: 2, key: `${prof.value}|${a}|${w}|${c.toFixed(2)}|${h}|${cut.value}|${on}` });
          strip.rect(0, 0, 10, 2, { color: 'faint', fill: false, stroke: true });
          info = { Ld: L[i1] - L[i2], Pd: Pn[i1] - Pn[i2], L1: L[i1], L2: L[i2] };
        });
        v.readout(() => info ? `Far-field luminance: left ${v.fix(info.L1, 3)}, right ${v.fix(info.L2, 3)} (physical difference **${v.fix(info.Ld, 3)}**) · model lightness difference **${v.fix(info.Pd, 3)}**${prof.value === 'cusp' && Math.abs(info.Pd) > 0.02 ? ' — an illusion: the model sees a step where there is none' : prof.value === 'cusp' ? ' — illusion gone' : ''}` : '');
      },
    },
    // ------------------------------------------------------------------ 4.12
    {
      num: '4.12',
      kind: 'Phenomenon',
      name: 'Lightness constancy and the anchoring problem',
      statement: String.raw`A surface's luminance is the product of its reflectance and the illumination, $L=\rho\,E$, yet we see lightness that tracks the reflectance: a sheet of white paper looks white in dim and in bright light, and coal looks black even in sunshine, although coal in the sun can send more light to the eye than white paper in the shade. This is **lightness constancy**. Since the luminance ratio between two surfaces under the same light equals their reflectance ratio, ratios can be recovered, but to say what grey a surface *is* you need an **anchor**: a rule for which luminance counts as white. Gilchrist's anchoring theory proposes that the highest luminance in a framework of common illumination looks white, and that the visual system mixes local and global frameworks.`,
      idea: String.raw`Ratios of luminances within one illumination are preserved by the edge computation of 4.7–4.11 and equal ratios of reflectance. The remaining unknown is one scale factor per framework; "highest luminance = white" fixes it, so $\hat\rho_i=0.9\,L_i/L_{\max}$ (taking a white surface to reflect about 90%). With several illumination fields, the anchor may be the framework's maximum, the global maximum, or a weighted average of the **separately computed reflectances**, $0.9L_i\{w/L_{\max,\rm local}+(1-w)/L_{\max,\rm global}\}$; the mixture explains the partial failures of constancy, such as a spotlit black paper looking lighter than it should when the global anchor dominates. The lightness model below is the simplest member of this family; it is not the full theory.`,
      caption: String.raw`A row of 14 grey papers (reflectances 3% to 90%, a range of 30 : 1). Drag the **gold** handle to move a spotlight over six of them and change its strength $S$. **Top row:** the physical luminances of the papers (what reaches the eye). **Middle row:** the model's perceived lightness. **Right:** perceived against true reflectance on log axes: perfect constancy lies on the diagonal. With *local anchoring* near1, illumination changes cancel within each framework; absolute reflectance is recovered when that framework includes a90% white reference; at 0 the visual system reports luminance relative to the brightest paper in the whole scene, and the papers in the spot are pushed toward white. The framework weights are a toy version of Gilchrist's proposal and the numbers are not experimental data.`,
      deps: ['art-6.12', 'psych-4.10'],
      refs: ['Goldstein ch. 9'],
      tags: ['lightness constancy', 'anchoring', 'illumination'],
      credit: 'Gilchrist, Kossyfidis, Bonato, Agostini, Cataliotti, Li, Spehar, Annan & Economou, 1999, “An anchoring theory of lightness perception”, Psychol. Rev.106(4):795–834, §5.4 equation3',
      scope: String.raw`Constancy is good but not perfect and depends on the clarity of the illumination boundary, the number of surfaces and the size of the fields; the highest-luminance rule is the first approximation of anchoring theory (Gilchrist's later rules add a bias toward area and a gradual local–global weighting).`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Lightness_(color)' },
      viz(v) {
        const S = v.slider('spotlight strength $S$', 1, 30, 10, { log: true });
        const wl = v.slider('local anchoring weight', 0, 1, 0.9, { step: 0.01 });
        const R = [0.35, 0.9, 0.09, 0.6, 0.03, 0.18, 0.6, 0.35, 0.03, 0.9, 0.18, 0.09, 0.6, 0.35], NP = R.length, K = 6;
        const sc = v.stage({ x: [0, NP], y: [-0.5, 6.4], axes: false, height: 330, weight: 1.5, minWidth: 340, title: 'the scene and what it looks like' });
        const sp = v.stage({ x: [-1.8, 0.05], y: [-1.8, 0.05], axes: 'box', gutter: true, equal: true, height: 330, weight: 0.85, minWidth: 270, xlabel: 'true reflectance (log₁₀)', ylabel: 'perceived reflectance (log₁₀)', title: 'constancy', xticks: logTicks(-1.8, 0.05), yticks: logTicks(-1.8, 0.05) });
        const hs = sc.handle(7, 5.7, { color: 'gold', r: 8, label: 'drag', labelPos: 'n', constrain: (x) => [Math.min(NP - K / 2, Math.max(K / 2, Math.round(x))), 5.7] });
        v.legend([['orange', 'in the spotlight', { dot: true }], ['blue', 'outside', { dot: true }], ['muted', 'perfect constancy', { dash: true }]]);
        let info = null;
        v.render(() => {
          const c = hs.x, s = S.value, lit = R.map((_, i) => i + 0.5 >= c - K / 2 && i + 0.5 <= c + K / 2);
          const Lm = R.map((r, i) => r * (lit[i] ? s : 1));
          const gmax = Math.max(...Lm), lmax = (f) => Math.max(...Lm.filter((_, i) => lit[i] === f));
          const lmaxIn = lmax(true), lmaxOut = lmax(false);
          const P=anchoredReflectances(Lm,lit,wl.value);
          const lower=Math.min(-1.8,...P.map(x=>Math.log10(x)))-.1;sp.setView([lower,.05],[lower,.05]);
          sc.rect(c - K / 2, 4.3, c + K / 2, 5.3, { fill: 'gold', fillAlpha: 0.22, stroke: false });
          sc.text('spotlight', c, 4.8, { align: 'center', size: 11.5, color: 'gold', weight: 600 });
          R.forEach((r, i) => {
            sc.rect(i + 0.06, 2.6, i + 0.94, 3.9, { fill: grey(Math.pow(Lm[i] / gmax, 0.45)), fillAlpha: 1, color: lit[i] ? 'orange' : 'faint', width: lit[i] ? 2 : 1 });
            sc.rect(i + 0.06, 0.6, i + 0.94, 1.9, { fill: grey(Math.pow(P[i] / 0.9, 0.45)), fillAlpha: 1, color: 'faint', width: 1 });
            sc.text(`${Math.round(r * 100)}%`, i + 0.5, 0.1, { align: 'center', size: 10.5, color: 'muted' });
          });
          sc.text('luminance reaching the eye', 0.1, 4.05, { align: 'left', size: 11.5, color: 'muted', dy: 0, dx: 0 });
          sc.text('perceived lightness (model)', 0.1, 2.15, { align: 'left', size: 11.5, color: 'muted' });
          sp.line(-1.8, -1.8, 0.05, 0.05, { color: 'muted', dash: [5, 4] });
          R.forEach((r, i) => sp.dot(Math.log10(r), Math.log10(P[i]), { r: 5.5, color: lit[i] ? 'orange' : 'blue' }));
          const dev = R.map((r, i) => Math.abs(Math.log10(P[i] / r)));
          info = { rangeL: Math.max(...Lm) / Math.min(...Lm), rangeP: Math.max(...P) / Math.min(...P), dev: dev.reduce((a, b) => a + b, 0) / NP, inMax: lmaxIn / lmaxOut, worst: Math.max(...dev) };
        });
        v.readout(() => info ? `Luminance range in the scene ${v.fix(info.rangeL, 0)} : 1 (true reflectance range 30 : 1) · perceived range ${v.fix(info.rangeP, 0)} : 1 · mean error in perceived reflectance ${v.fix(100 * (Math.pow(10, info.dev) - 1), 0)}% (a factor of ${v.fix(Math.pow(10, info.worst), 1)} at worst)` : '');
      },
    },
    // ------------------------------------------------------------------ 4.13
    {
      num: '4.13',
      kind: 'Phenomenon',
      name: 'The blind spot and perceptual filling-in',
      statement: String.raw`Each eye has a region, the **optic disc**, where the optic nerve leaves the retina and there are no photoreceptors. It lies about $15^\circ$ toward the nose from the fovea, so in the visual field it is about $12$–$15^\circ$ to the temporal side of fixation, roughly $5^\circ$ wide and $7^\circ$ high. A small object falling entirely inside it cannot be seen, yet we do not see a hole: the region is **filled in** with the surrounding colour, texture or line, so that a line crossing it looks continuous. Seeing with the hole filled is done by the brain, not by the eye.`,
      idea: String.raw`The retinal image has no information at the disc, and the other eye usually covers it. The visual system infers the content of a missing area from its surroundings (a continuation of edges, textures and colour, as for natural images), so what is "seen" there is a guess based on the neighbouring surface. Because filling-in uses the surround, objects larger than the disc are only partly erased and a small object lying across the disc's edge appears as a crescent. Ramachandran and Gregory (1991) also demonstrated filling-in at the natural blind spot, while most of their experiments used artificial scotomas with intact photoreceptors.`,
      caption: String.raw`**Top:** the visual field of your right eye (cover the left, fix your gaze on the red cross) with the blind spot outlined. Drag the **gold** dot into the outlined ellipse and change its size, or switch the eye. **Bottom:** what the model says you perceive: the region of the blind spot is filled with the surround's pattern, and the dot (if any of it is visible) is cut off at the edge of the hole. To try it for real, put the page at arm's length, cover the left eye, look at the cross and slide your head closer or farther until the dot vanishes. The size and position of the ellipse are typical textbook values and vary between people; you can calibrate them from the point where the dot vanishes.`,
      deps: ['psych-4.1'],
      refs: ['Goldstein ch. 2'],
      tags: ['blind spot', 'filling-in', 'optic disc'],
      credit: 'Ramachandran & Gregory,1991, Nature350:699–702 (complete author reprint); approximate blind-spot geometry',
      scope: String.raw`The size and position vary between people and with the measurement method (horizontal diameter estimates range from about 3° to 7°); the pattern completion depends on the pattern: smooth lines and textures fill well, while complex or large patterns may not.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Blind_spot_(vision)' },
      viz(v) {
        const eye = v.select('Eye', [{ value: 'R', label: 'right eye' }, { value: 'L', label: 'left eye' }], 'R');
        const pat = v.select('Surround', [{ value: 'plain', label: 'plain' }, { value: 'stripes', label: 'stripes' }, { value: 'line', label: 'line' }, { value: 'color', label: 'colour' }], 'stripes');
        const rd = v.slider('dot radius (degrees)', 0.4, 6, 1.5, { step: 0.05 });
        const FX = [-12, 30], FY = [-16, 16];
        const top = v.stage({ x: FX, y: FY, equal: true, axes: false, height: 290, weight: 1.4, minWidth: 340, title: 'the screen' });
        const bot = v.stage({ x: FX, y: FY, equal: true, axes: false, height: 290, weight: 1.4, minWidth: 340, title: 'what you perceive (model)' });
        const hd = top.handle(15.5, -1.5, { color: 'gold', r: 7, label: 'dot', labelPos: 'n' });
        const bx = () => (eye.value === 'R' ? BLIND.x : -BLIND.x);
        const bg = (x, y, p) => {
          if (p === 'plain') return [205, 205, 195];
          if (p === 'stripes') return Math.floor((x + 100) / 1.6) % 2 === 0 ? [215, 215, 205] : [90, 100, 130];
          if (p === 'line') return Math.abs(y - BLIND.y) < 0.45 ? [30, 30, 40] : [215, 215, 205];
          return [60 + 20 * Math.sin(x / 6), 150 + 40 * Math.sin(y / 5), 90 + 20 * Math.cos(x / 9)];
        };
        const inHole = (x, y) => ((x - bx()) / BLIND.rx) ** 2 + ((y - BLIND.y) / BLIND.ry) ** 2 <= 1;
        let info = null;
        v.render(() => {
          const p = pat.value, r = rd.value, dx = hd.x, dy = hd.y;
          const isDot = (x, y) => (x - dx) ** 2 + (y - dy) ** 2 <= r * r;
          top.raster((x, y) => [...(isDot(x, y) ? [20, 20, 20] : bg(x, y, p)), 1], { res: 3, key: `T${p}|${dx.toFixed(2)}|${dy.toFixed(2)}|${r}|${eye.value}` });
          bot.raster((x, y) => [...(inHole(x, y) ? bg(x, y, p) : isDot(x, y) ? [20, 20, 20] : bg(x, y, p)), 1], { res: 3, key: `B${p}|${dx.toFixed(2)}|${dy.toFixed(2)}|${r}|${eye.value}` });
          const bxv = bx();
          top.curve((t) => [bxv + BLIND.rx * Math.cos(t), BLIND.y + BLIND.ry * Math.sin(t)], 0, 2 * Math.PI, { color: 'red', width: 2, dash: [5, 4] });
          const cross = (s) => { s.line(-1, 0, 1, 0, { color: 'red', width: 2.5 }); s.line(0, -1, 0, 1, { color: 'red', width: 2.5 }); };
          cross(top); cross(bot);
          top.text(eye.value === 'R' ? 'cover the left eye, fix the red cross' : 'cover the right eye, fix the red cross', 9, 14, { align: 'center', size: 11.5, color: 'ink', plate: true });
          let inside = 0, tot = 0;
          for (let a = -r; a <= r; a += r / 12) for (let b = -r; b <= r; b += r / 12) if (a * a + b * b <= r * r) { tot++; if (inHole(dx + a, dy + b)) inside++; }
          info = { f: inside / tot, ecc: Math.hypot(dx, dy) };
        });
        v.readout(() => info ? `Dot at ${v.fix(info.ecc, 1)}° from fixation · **${v.fix(100 * info.f, 0)}%** of it lies inside the blind spot${info.f > 0.999 ? ' — **invisible**; the hole is filled with the surround' : info.f > 0 ? ' — partly visible (the dot is larger than the hole, or straddles its edge)' : ''}` : '');
      },
    },
    // ------------------------------------------------------------------ 4.14
    {
      num: '4.14',
      kind: 'Phenomenon',
      name: 'Troxler fading',
      statement: String.raw`If you fixate a point steadily, a faint, blurry, low-contrast object in the periphery gradually fades and is replaced by the background, within a few seconds, and reappears when you move your eyes or when the object moves. The fading is faster for objects that are further from fixation, larger, lower in contrast and with blurrier edges. It is the same process as the disappearance of a perfectly stabilised retinal image, and it shows that the visual system signals *changes* and gives little weight to a constant input.`,
      idea: String.raw`Neurons in the visual system adapt: their response to a steady input declines as an internal gain or state variable $a$ follows the input, $\tau\,\dot a=u-a$, so the net signal $r=u-a$ decays with time constant $\tau$ unless $u$ changes. Fixational eye movements move the image across the receptors, and an edge converts that motion into changes of $u$; a sharp edge turns a tiny movement into a large change, a blurry one does not. Blurry peripheral targets, seen by large receptive fields that move little relative to the blur, are therefore the first to go. Riggs and colleagues showed in 1953 that optically stabilising an image on the retina makes it fade completely in a second or two.`,
      caption: String.raw`Fixate the red cross (look at the model's cross, not the blobs). **Top:** six soft blobs at different distances from fixation, drawn with the opacity the model assigns to them. **Bottom:** each blob's visibility against time. Each blob is seen by a model unit at its edge: its input moves with the eye's jitter, adapts with time constant $\tau$ (shorter further out) and the visibility is the unit's net response. Raise the *edge blur* to make blobs fade faster; raise the *image motion* (or tick *jiggle*) to keep them alive. The time constants and units are a model chosen to give fading over a few seconds, not fitted to data.`,
      deps: ['psych-4.6'],
      refs: ['Goldstein ch. 3'],
      tags: ['Troxler', 'adaptation', 'fixation'],
      credit: 'Ignaz Paul Vital Troxler, 1804 (unconfirmed); stabilised images: Ditchburn & Ginsborg 1952 and Riggs, Ratliff, Cornsweet & Cornsweet, 1953, J. Opt. Soc. Am. 43: 495–501',
      scope: String.raw`Fading needs steady fixation (fixational eye movements and microsaccades normally refresh the image, so the effect is strongest with careful fixation and low-contrast targets); the model uses one adapting unit per blob.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Troxler%27s_fading' },
      verify: true,
      viz(v) {
        const bl = v.slider('edge blur (degrees)', 0.05, 3, 1.4, { step: 0.05 });
        const mo = v.slider('image motion (degrees, rms)', 0, 0.4, 0.03, { step: 0.005 });
        const jig = v.toggle('jiggle the picture', false);
        const E = [3.5, 5, 6.5, 8, 9.5, 11], CC = [0.9, 0.8, 0.7, 0.9, 0.8, 0.7], ANG = [20, 105, 165, 215, 285, 340].map((a) => (a * Math.PI) / 180);
        const COL = ['accent', 'orange', 'green', 'purple', 'teal', 'pink'];
        const PER = 20, DT = 0.05;
        const fld = v.stage({ x: [-14, 14], y: [-10, 10], equal: true, axes: false, height: 300, weight: 1.1, minWidth: 300, title: 'what you see (model opacity)' });
        const tr = v.stage({ x: [0, PER], y: [0, 1.05], axes: 'box', gutter: true, height: 300, weight: 1, minWidth: 290, xlabel: 'time (s)', ylabel: 'visibility', title: 'visibility of each blob' });
        const S = v.sim(() => ({ a: E.map(() => 0), j: E.map(() => 0), ema: E.map(() => 1), hist: [], rng: v.rng(21), acc: 0 }), (st, dt, t) => {
          const J = (jig.value ? 0.18 : 0) + mo.value, tauJ = 0.25;
          for (let i = 0; i < E.length; i++) {
            st.j[i] += (-st.j[i] / tauJ) * dt + J * Math.sqrt((2 * dt) / tauJ) * st.rng.normal();
            const u = CC[i] * logistic(st.j[i] / Math.max(0.03, bl.value * 0.25)), tau = 6 / (0.6 + 0.35 * E[i]);
            st.a[i] += ((u - st.a[i]) / tau) * dt;
            const r = Math.abs(u - st.a[i]);
            st.ema[i] += (r / (0.5 * CC[i]) - st.ema[i]) * (dt / 0.4);
          }
          st.acc += dt; if (st.acc >= 0.1) { st.acc = 0; st.hist.push([t, st.ema.map((x) => clamp01(x))]); }
        }, { dt: DT });
        v.legend(COL.map((c, i) => [c, `${E[i]}°`]));
        let cur = null;
        v.animate((t) => {
          S.advance(t); const st = S.state; cur = st.ema.map((x) => clamp01(x));
          fld.rect(-14, -10, 14, 10, { fill: grey(0.88), fillAlpha: 1, stroke: false });
          E.forEach((e, i) => {
            const cx = e * Math.cos(ANG[i]) * 1.1, cy = e * Math.sin(ANG[i]) * 0.8;
            for (let k = 8; k >= 1; k--) fld.circle(cx, cy, 0.5 + 0.28 * k * (0.6 + 0.4 * bl.value), { fill: [70, 90, 150], fillAlpha: cur[i] * 0.1 * CC[i], stroke: false });
            fld.text(`${e}°`, cx, cy - 2.2, { align: 'center', size: 10.5, color: 'muted' });
          });
          fld.line(-0.8, 0, 0.8, 0, { color: 'red', width: 2.6 }); fld.line(0, -0.8, 0, 0.8, { color: 'red', width: 2.6 });
          for (let i = 0; i < E.length; i++) tr.path(st.hist.map((h) => [h[0], h[1][i]]), { color: COL[i], width: 2.2 });
          tr.vline(t, { color: 'faint', width: 1 });
        }, { period: PER, still: 3.5 });
        v.readout(() => cur ? `Visibility now: ${cur.map((x, i) => `${E[i]}° ${v.fix(100 * x, 0)}%`).join(' · ')} · time constants ${E.map((e) => v.fix(6 / (0.6 + 0.35 * e), 1)).join(', ')} s` : '');
      },
    },
  ],
};
