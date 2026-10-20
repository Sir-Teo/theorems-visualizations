// Astrophysics & Celestial Mechanics — Chapter 4: Light and the observable properties of stars
// (items 4.1–4.6 here; 4.7–4.12 in ch04-b.js)

import {
  TAU, DEG, clamp, memo, sci, AU, L_SUN, R_SUN, T_SUN, SIGMA,
  planckL, wienPeak, bbColor, BAND, bandT, bvToy, tBallesteros,
} from './ch04.shared.js';

import { syntheticColour, ballesterosColourTemperature, energyBand } from './source-audit-photometry.shared.js';

export default {
  collection: 'astro',
  chapter: 4,
  title: 'Light and the observable properties of stars',
  summary: String.raw`Everything we know about stars comes from their light. Parallax gives distances, the inverse-square law converts brightness to luminosity, and stars radiate roughly as blackbodies, so colour gives temperature and luminosity plus temperature gives radius. Spectral lines arise from atomic transitions; the Boltzmann and Saha equations explain why line strengths peak at particular temperatures and hence the spectral sequence. The Hertzsprung–Russell diagram organizes it all, and binaries reveal the steep mass–luminosity relation.`,
  items: [
    // ───────────────────────────────────────────────────────────── 4.1
    {
      num: '4.1',
      kind: 'Definition',
      name: 'Parallax and the parsec',
      statement: String.raw`As the Earth circles the Sun, a nearby star appears to trace a small ellipse against the far more distant background, with semi-major axis $p$ (the **annual parallax**). For a baseline of $1$ AU and a star at distance $d \gg 1$ AU, $\tan p = 1\,\text{AU}/d$, so $p \approx 1\,\text{AU}/d$ in radians. The modern **parsec** is defined exactly as $1\ \text{pc} = (648000/\pi)\ \text{AU} \approx 3.0857\times10^{16}$ m $\approx 3.26$ light-years. For this small-angle model, with $p$ in arcseconds and $d$ in parsecs,
$$d \approx \frac{1}{p}.$$
The ellipse is flattened by the factor $\sin\beta$ for a star at ecliptic latitude $\beta$ (a circle at the pole, a line in the ecliptic).`,
      idea: String.raw`It is nothing but the triangle Sun–Earth–star with a right angle at the Sun when the Earth is a quarter of a year from alignment: the side opposite the small angle $p$ is $1$ AU, the long side is $d$. The exact parsec definition agrees with the small-angle triangle, rather than $1/\tan(1\mathrm{arcsec})$ AU. The reciprocal relation is free of conversion constants in these units. Measuring $p$ means measuring a displacement, so the useful range is set by the astrometric precision $\sigma_p$: linear uncertainty propagation is useful when $\sigma_p/p$ is small, so a nominal $10\%$ linearized distance precision needs $p\ge 10\sigma_p$, i.e. $d \le 100\ \text{pc}/\sigma_p[\text{mas}]$.

Taylor theorem pma-5.15 explains the stated uncertainty propagation. Expanding the reciprocal at a positive parallax p gives $1/(p+\Delta p)=1/p-\Delta p/p^2+O((\Delta p)^2)$ on a neighborhood bounded away from zero. Thus the fractional linearized distance error has scale $\sigma_p/p$. This local expansion does not justify reciprocal estimates near zero parallax or assign a distance to a negative noisy measurement.`,
      caption: String.raw`Slide the **distance** and the **time of year**: left, the Earth moves around the Sun (schematic, not to scale) and the line of sight to the star swings; right, the star's path against the background field, which is rescaled to fit (see the width in the corner). The red circle has radius equal to an **assumed parallax uncertainty**; it is an illustrative size comparison, not an astrometric position fit; push the star far enough away and its ellipse sinks into the circle: the signal-to-noise ratio becomes small and direct inversion is unreliable. Change the ecliptic latitude to flatten the ellipse.`,
      scope: String.raw`Annual parallax only (the heliocentric triangle, $d\gg1$ AU). The three noise values 10, 1 and 0.03 mas are illustrative assumptions, not performance promises for named instruments. Distance uncertainty is only linearized at high signal-to-noise; a noisy measured parallax need not be positive, and estimating distance requires an inference model, not a negative-distance interpretation. No real observations are fitted here.`,
      deps: ['pma-5.15'],
      refs: ['IAU (2015), Resolution B2, note 4', 'Bailer-Jones (2015), §§1–3 pp.1–3'],
      tags: ['distance', 'parallax', 'astrometry'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Parsec' },
      viz(v) {
        const dS = v.slider('distance $d$ (pc)', 1.3, 3000, 8, { log: true, sig: 2, fmt: (x) => v.fmt(x, 3) });
        const day = v.slider('time of year (days)', 0, 365, 70, { step: 1 });
        const beta = v.slider('ecliptic latitude $\\beta$ (°)', 0, 90, 55, { step: 1 });
        const TEL = { ground: { s: 10, name: '10mas scenario' }, hip: { s: 1, name: '1mas scenario' }, gaia: { s: 0.03, name: '0.03mas scenario' } };
        const tel = v.select('assumed parallax uncertainty', [{ value: 'ground', label: '10 mas' }, { value: 'hip', label: '1 mas' }, { value: 'gaia', label: '0.03 mas' }], 'hip');
        const orb = v.stage({ x: [-1.8, 1.8], y: [-1.5, 3.7], equal: true, axes: false, height: 330, weight: 0.9, title: 'seen from above the ecliptic (schematic)' });
        const sky = v.stage({ x: [-1, 1], y: [-1, 1], equal: true, axes: false, height: 330, weight: 1, title: 'the star against distant background stars' });
        const r = v.rng(4);
        const bg = Array.from({ length: 16 }, () => [r.uniform(-0.9, 0.9), r.uniform(-0.9, 0.9)]);
        let half = 1, stat = {};
        v.render(() => {
          const th = (TAU * day.value) / 365, ex = Math.cos(th), ey = Math.sin(th);
          const D = 3.2;
          orb.circle(0, 0, 1, { color: 'faint', width: 1.4, dash: [4, 4] });
          orb.segment([0, 0], [0, D], { color: 'faint', dash: [3, 4], width: 1.2 });
          orb.segment([ex, ey], [0, D], { color: 'accent', width: 1.6 });
          orb.dot(0, 0, { r: 8, color: 'gold' }); orb.text('Sun', 0, 0, { dx: 14, dy: 12, size: 11, color: 'gold' });
          orb.dot(ex, ey, { r: 5.5, color: 'blue' }); orb.text('Earth', ex, ey, { dx: ex >= 0 ? 12 : -12, dy: 0, size: 11, color: 'blue', align: ex >= 0 ? 'left' : 'right' });
          orb.dot(0, D, { r: 6, color: 'orange' }); orb.text('star (far away: not to scale)', 0, D, { dy: -14, size: 11, color: 'orange', align: 'center' });
          orb.tex('p', 0.12, D - 0.9, { color: 'accent', size: 14 });
          orb.text('1 AU', 0, -1, { dy: 16, size: 10.5, color: 'muted', align: 'center' });
          const p = 1 / dS.value, sg = TEL[tel.value].s / 1000, b = beta.value * DEG;
          half = 1.15 * (p + sg);
          const pos = (t) => [-p * Math.cos(t), p * Math.sin(b) * Math.sin(t)];
          sky.setView([-half, half], [-half, half]);
          for (const q of bg) sky.dot(q[0] * half, q[1] * half, { r: 2.6, color: 'faint' });
          const pts = []; for (let i = 0; i <= 120; i++) pts.push(pos((TAU * i) / 120));
          sky.path(pts, { color: 'accent', width: 1.4, alpha: 0.7 });
          const c = pos(th);
          sky.circle(c[0], c[1], sg, { color: 'red', width: 1.6, dash: [4, 3] });
          sky.dot(c[0], c[1], { r: 5.5, color: 'orange' });
          sky.corner(`field width ${p > 0.05 ? v.fix(2 * half, 2) + '″' : v.fix(2000 * half, 2) + ' mas'}`, 'bl', { color: 'muted' });
          sky.corner('red: assumed parallax uncertainty', 'br', { color: 'red' });
          stat = { p, sg, snr: p / sg };
        });
        v.readout(() => `$p = 1/d = ${v.fix(stat.p * 1000, stat.p < 0.01 ? 2 : 1)}$ mas  ·  error $\\sigma_p = ${TEL[tel.value].s}$ mas  ·  $p/\\sigma_p = ${v.fmt(stat.snr, 3)}$\n${stat.snr > 10 ? 'linearized distance uncertainty below 10%' : stat.snr > 3 ? 'formal linear estimate ' + v.fix(100 / stat.snr, 0) + '%; nonlinear distance uncertainty not computed' : 'low signal-to-noise: reciprocal distance requires a noise/prior model'}  ·  nominal distance for 10% linearized precision: ${v.fmt(100 / TEL[tel.value].s, 3)} pc`);
      },
    },

    // ───────────────────────────────────────────────────────────── 4.2
    {
      num: '4.2',
      kind: 'Definition',
      name: 'Flux, luminosity and the inverse-square law',
      statement: String.raw`The **luminosity** $L$ of a star is the total energy it radiates per second (watts; the Sun has $L_\odot = 3.828\times10^{26}$ W). The **flux** $F$ is the energy per second crossing unit area perpendicular to the light, measured at the observer. If the star radiates isotropically into empty space, and nothing absorbs the light, every sphere centred on the star is crossed by the same total power $L$, so at distance $d$
$$F = \frac{L}{4\pi d^2}.$$
Hence a measured flux together with a known distance gives the luminosity, $L = 4\pi d^2 F$ (and a known $L$ gives the distance).`,
      idea: String.raw`Energy conservation in vacuum: the power through a sphere of radius $d$ does not depend on $d$, and the sphere's area is $4\pi d^2$, so the flux (power per area) must fall as $d^{-2}$. Geometrically, the same bundle of rays that fills a unit square at distance $1$ spreads over $r^2$ unit squares at distance $r$. Together with parallax (4.1) this turns a brightness into an intrinsic power.`,
      caption: String.raw`Drag the **detector** along the beam (left). The beam has a square cross section of side $r$ at distance $r$, so the unit tile always catches the same rays but a share $1/r^2$ of them. Right: the beam seen head on, with 500 photons placed at random; those inside the tile are gold. Below, the flux at that distance for the Sun, and the luminosity recovered from it: always $3.83\times10^{26}$ W.`,
      scope: String.raw`Isotropic emission into transparent space. Interstellar dust dims distant stars (extinction), and a non-spherical or beamed source needs an angle-dependent flux.`,
      deps: ['astro-4.1'],
      refs: ['Carroll–Ostlie §3.2'],
      tags: ['flux', 'luminosity', 'distance'],
      viz(v) {
        const side = v.stage({ x: [-0.2, 3.6], y: [-2.1, 2.1], axes: false, height: 320, weight: 1.15, title: 'side view of the beam (distance in AU, the source is the Sun)' });
        const face = v.stage({ x: [-1.85, 1.85], y: [-1.85, 1.85], equal: true, axes: false, height: 320, weight: 0.85, title: 'the beam head on: one unit tile' });
        const h = side.handle(1.0, 0, { color: 'accent', r: 7, constrain: { x: [0.3, 3.4], y: [0, 0] } });
        const rr = v.rng(31);
        const ph = Array.from({ length: 500 }, () => [rr.uniform(-0.5, 0.5), rr.uniform(-0.5, 0.5)]);
        let st = {};
        v.render(() => {
          const x = h.x;
          side.poly([[0, 0], [3.5, 1.75], [3.5, -1.75]], { fill: 'gold', fillAlpha: 0.2, color: 'gold', width: 1.2 });
          for (const [pl, nm] of [[0.387, 'Mercury'], [0.723, 'Venus'], [1, 'Earth'], [1.524, 'Mars']]) {
            side.vline(pl, { color: 'faint', width: 1, dash: [2, 4] });
          }
          side.dot(0, 0, { r: 9, color: 'gold' });
          side.text('Sun', 0, 0, { dx: 4, dy: 20, size: 11, color: 'gold', align: 'left' });
          side.text('Mercury', 0.387, -1.95, { size: 9.5, color: 'muted', align: 'center' });
          side.text('Earth', 1, -1.95, { size: 9.5, color: 'muted', align: 'center' });
          side.text('Mars', 1.524, -1.95, { size: 9.5, color: 'muted', align: 'center' });
          side.line(x, -x / 2, x, x / 2, { color: 'orange', width: 2 });
          side.line(x, -0.5, x, 0.5, { color: 'accent', width: 6, alpha: 0.9 });
          side.text('beam cross-section', x, x / 2, { dx: 10, dy: -14, size: 10.5, color: 'orange', align: 'left' });
          side.text('1 m² tile', x, -0.5, { dx: 10, dy: 28, size: 10.5, color: 'accent', align: 'left' });
          // face-on
          const hs = x / 2;
          face.rect(-hs, -hs, hs, hs, { color: 'orange', width: 2, fill: 'orange', fillAlpha: 0.06 });
          face.rect(-0.5, -0.5, 0.5, 0.5, { color: 'accent', width: 2.2, fill: 'accent', fillAlpha: 0.18 });
          let hit = 0;
          for (const q of ph) { const px = q[0] * x, py = q[1] * x, inn = Math.abs(px) <= 0.5 && Math.abs(py) <= 0.5; if (inn) hit++; face.dot(px, py, { r: 2.1, color: inn ? 'gold' : 'muted', alpha: inn ? 1 : 0.55 }); }
          const d = x * AU, F = L_SUN / (4 * Math.PI * d * d);
          st = { x, hit, F, L: 4 * Math.PI * d * d * F };
        });
        v.readout(() => `$d = ${v.fix(st.x, 2)}$ AU  ·  tile catches ${st.hit} of 500 photons (expected $500/r^2 = ${v.fix(500 / st.x ** 2, 0)}$)\n$F = L/4\\pi d^2 = ${v.fix(st.F, 1)}$ W/m²  ·  $L = 4\\pi d^2 F = ${v.sci(st.L, 4)}$ W`);
      },
    },

    // ───────────────────────────────────────────────────────────── 4.3
    {
      num: '4.3',
      kind: 'Definition',
      name: 'Magnitudes and the distance modulus',
      statement: String.raw`The **apparent magnitude** $m$ is a logarithmic measure of flux, defined so that a difference of five magnitudes is a flux ratio of exactly $100$:
$$m_1 - m_2 = -2.5\log_{10}\frac{F_1}{F_2}\qquad\Longleftrightarrow\qquad \frac{F_1}{F_2}=100^{(m_2-m_1)/5}\approx 2.512^{\,m_2-m_1}.$$
Larger $m$ means a fainter star. The **absolute magnitude** $M$ is the apparent magnitude the star would have at $10$ pc. Because $F\propto d^{-2}$ (4.2),
$$m - M = 5\log_{10}\frac{d}{10\ \text{pc}},$$
the **distance modulus**, which gives the distance of any star of known $M$ from its apparent magnitude.`,
      idea: String.raw`The conventional logarithmic scale turns flux ratios into additive magnitude differences: five magnitudes correspond exactly to a factor100. Moving the star from $d$ to $10$ pc multiplies the flux by $(d/10\,\text{pc})^2$; taking $-2.5\log_{10}$ of the inverse-square law of 4.2 turns that factor into $5\log_{10}(d/10\ \text{pc})$ magnitudes.

The product and inverse logarithm rules pma-8.6 apply to positive flux and distance. Taking a logarithm turns the inverse-square flux ratio into minus twice a log-distance ratio, and the magnitude coefficient then gives the factor five in the distance modulus. Exponentiating inverts the relation. Extinction adds its separately specified magnitude term rather than being canceled by the logarithm.`,
      caption: String.raw`Left: apparent magnitude against distance for the chosen absolute magnitude; the line crosses $m=M$ at $10$ pc, always rises with slope $5$ per decade of distance, and the horizontal lines are illustrative detection thresholds 6 and 30 mag (the **handle** slides along the distance axis). Right: drag the two magnitudes $m_1,m_2$ on the flux ruler; five magnitudes always give a factor 100.`,
      scope: String.raw`Ignores interstellar extinction, which adds a term $A$ to the modulus ($m-M=5\log_{10}(d/10\,\text{pc})+A$), and the dependence of magnitude on the filter (bolometric versus band magnitudes, 4.6). The menu supplies synthetic example values of $M$, not catalogue measurements of named stars. The detection thresholds are illustrative, not universal naked-eye or telescope limits.`,
      deps: ['astro-4.2', 'pma-8.6'],
      refs: ['IAU (2015), Resolution B2, Eqs.(2)–(4), standard10pc reference distance', 'Direct subtraction of logarithmic magnitudes and inverse-square flux law'],
      tags: ['magnitude', 'distance modulus', 'photometry'],
      viz(v) {
        const PRE = { sun: ['model M=4.83', 4.83], vega: ['model M=0.60', .6], sir: ['model M=1.43', 1.43], prox: ['model M=15.50', 15.5], sg: ['model M=−7', -7] };
        const Mabs = v.slider('absolute magnitude $M$', -9, 17, 4.83, { step: 0.01, fmt: (x) => v.fix(x, 2) });
        const pre = v.select('example', Object.entries(PRE).map(([k, a]) => ({ value: k, label: a[0] })), 'sun', { onChange: (k) => Mabs.set(PRE[k][1]) });
        const A = v.stage({ x: [1, 1e5], y: [-40, 14], xlog: true, axes: 'box', gutter: true, height: 330, weight: 1.05, xlabel: 'distance (pc)', ylabel: 'apparent magnitude m (brighter ↑)', title: 'm = M + 5 log₁₀(d/10 pc)',
          yticks: [-10, 0, 10, 20, 30].map((m) => [-m, String(m)]) });
        const B = v.stage({ x: [-3, 11], y: [3e-5, 30], ylog: true, axes: 'box', gutter: true, height: 330, weight: 1, xlabel: 'magnitude m', ylabel: 'flux relative to m = 0', title: 'the flux ruler: 5 magnitudes = ×100' });
        const hd = A.handle(10, 0, { color: 'accent', r: 7, constrain: (x) => [clamp(x, 1, 1e5), -(Mabs.value + 5 * Math.log10(clamp(x, 1, 1e5) / 10))] });
        const m1 = B.handle(0, 1, { color: 'blue', r: 7, constrain: (x) => [clamp(x, -3, 11), Math.pow(10, -0.4 * clamp(x, -3, 11))], label: 'm₁', labelPos: 'ne' });
        const m2 = B.handle(5, 0.01, { color: 'orange', r: 7, constrain: (x) => [clamp(x, -3, 11), Math.pow(10, -0.4 * clamp(x, -3, 11))], label: 'm₂', labelPos: 'ne' });
        let d0 = 10;
        v.render(() => {
          const M = Mabs.value;
          hd.set(hd.x, -(M + 5 * Math.log10(hd.x / 10)));
          A.fn((d) => -(M + 5 * Math.log10(d / 10)), { color: 'accent', width: 2.2 });
          A.vline(10, { color: 'faint', width: 1, dash: [3, 4] });
          A.hline(-6, { color: 'green', width: 1.2, dash: [5, 4] }); A.text('assumed limit6mag', 1e5, -6, { size: 10.5, color: 'green', dy: -9, align: 'right' });
          A.hline(-30, { color: 'red', width: 1.2, dash: [5, 4] }); A.text('assumed limit30mag', 1e5, -30, { size: 10.5, color: 'red', dy: -9, align: 'right' });
          A.text('10 pc', 10, -37, { size: 10.5, color: 'muted', dx: 4, align: 'left' });
          d0 = hd.x;
          B.fn((m) => Math.pow(10, -0.4 * m), { color: 'ink', width: 1.8 });
          for (let m = -2; m <= 10; m += 1) B.dot(m, Math.pow(10, -0.4 * m), { r: m % 5 === 0 ? 4.5 : 2.5, color: m % 5 === 0 ? 'green' : 'muted' });
          B.segment([m1.x, m1.y], [m2.x, m1.y], { color: 'muted', dash: [4, 4], width: 1.2 }); B.segment([m2.x, m1.y], [m2.x, m2.y], { color: 'muted', dash: [4, 4], width: 1.2 });
        });
        v.readout(() => {
          const M = Mabs.value, m = M + 5 * Math.log10(d0 / 10), dm = m2.x - m1.x;
          return `$d = ${v.fmt(d0, 3)}$ pc  →  $m = M + 5\\log_{10}(d/10) = ${v.fix(m, 2)}$ (${m <= 6 ? 'brighter than assumed 6 mag threshold' : m <= 30 ? 'between assumed 6 and 30 mag thresholds' : 'fainter than assumed 30 mag threshold'})\n$m_2 - m_1 = ${v.fix(dm, 2)}$  →  $F_1/F_2 = 100^{(m_2-m_1)/5} = ${v.fmt(Math.pow(100, dm / 5), 4)}$`;
        });
      },
    },

    // ───────────────────────────────────────────────────────────── 4.4
    {
      num: '4.4',
      kind: 'Definition',
      name: 'Effective temperature: stars as blackbodies',
      statement: String.raw`A star's photosphere radiates approximately like a blackbody (thermo 9.4). The **effective temperature** $T_{\rm eff}$ is *defined* as the temperature of the blackbody of the same radius $R$ that would emit the star's luminosity:
$$L = 4\pi R^2\sigma T_{\rm eff}^4 .$$
For a true blackbody the temperature can also be read from the spectrum: the peak of $B_\lambda$ lies at $\lambda_{\max}T = 2.898\times10^{-3}$ m K (Wien's law, thermo 9.5), and the whole shape $B_\lambda(T)$ can be fitted. A real star departs from the fit, mainly because the absorption lines of metals (**line blanketing**) remove light at blue and ultraviolet wavelengths.`,
      idea: String.raw`The Stefan–Boltzmann law (thermo 9.6) says a blackbody surface emits $\sigma T^4$ per unit area; multiplying by the area $4\pi R^2$ and equating to the measured luminosity defines $T_{\rm eff}$. A star is not a perfect blackbody (it radiates from a range of depths, each with its own temperature, and absorbs selectively), so a blackbody *fitted* to its spectrum gives a number that depends on the wavelengths used. The fit is a colour temperature; $T_{\rm eff}$ is the energy-based one.`,
      caption: String.raw`Dots are a **model spectrum** (a blackbody at the true $T_{\rm eff}$ of the chosen model star, dimmed in the blue by a toy blanketing factor, with 2 % noise; not real data). Drag the **temperature** slider to fit a Planck curve (amplitude fitted for you), or read the best least-squares fit (green) and the Wien peak. Turn the **blanketing** to zero and the three temperatures coincide; turn it up and the colour temperature drifts away from $T_{\rm eff}$.`,
      scope: String.raw`Model stars are specified by $T_{\rm eff}$ and $R$ (Sun-like 5772 K, 1 $R_\odot$; Vega-like 9600 K, 2.4 $R_\odot$; K-giant-like 4300 K, 25 $R_\odot$); $L$ follows from the definition. The spectra are synthetic: the blanketing shape is a caricature, not a calculated atmosphere.`,
      deps: ['astro-4.2', 'thermo-9.5', 'thermo-9.6'],
      refs: ['Carroll–Ostlie §3.4'],
      tags: ['temperature', 'blackbody', 'spectrum'],
      viz(v) {
        const STAR = { sun: { T: 5772, R: 1, n: 'Sun-like' }, vega: { T: 9600, R: 2.4, n: 'Vega-like' }, kg: { T: 4300, R: 25, n: 'K-giant-like' } };
        const who = v.select('model star', [{ value: 'sun', label: 'Sun-like' }, { value: 'vega', label: 'Vega-like' }, { value: 'kg', label: 'K-giant-like' }], 'sun');
        const blk = v.slider('line blanketing', 0, 1, 0.6, { step: 0.01 });
        const Tf = v.slider('fitted blackbody temperature (K)', 2500, 15000, 5000, { step: 10, fmt: (x) => v.fix(x, 0) });
        const best = v.toggle('show best least-squares fit', true);
        const s = v.stage({ x: [200, 1200], y: [0, 1.25], axes: 'box', gutter: true, height: 340, xlabel: 'wavelength (nm)', ylabel: 'relative flux per unit wavelength' });
        const NM = Array.from({ length: 96 }, (_, i) => 250 + i * 10);
        const cacheO = memo(), cacheB = memo();
        const obs = () => cacheO(who.value + blk.value, () => {
          const T = STAR[who.value].T, r = v.rng(12), ob = NM.map((nm) => planckL(nm * 1e-9, T) * (1 - blk.value * 0.55 / (1 + Math.exp((nm - 400) / 28))) * (1 + 0.02 * r.normal()));
          const mx = Math.max(...ob); return ob.map((o) => o / mx);
        });
        const shape = (nm, T) => planckL(nm * 1e-9, T);
        const amp = (o, T, lo = 350, hi = 1000) => { let a = 0, b = 0; NM.forEach((nm, i) => { if (nm >= lo && nm <= hi) { const f = shape(nm, T); a += o[i] * f; b += f * f; } }); return a / b; };
        const rms = (o, T) => { const A = amp(o, T); let e = 0, n = 0; NM.forEach((nm, i) => { if (nm >= 350 && nm <= 1000) { e += (o[i] - A * shape(nm, T)) ** 2; n++; } }); return Math.sqrt(e / n); };
        const bestT = () => cacheB(who.value + blk.value, () => { const o = obs(); let bt = 3000, be = 1e9; for (let T = 2500; T <= 15000; T += 20) { const e = rms(o, T); if (e < be) { be = e; bt = T; } } return bt; });
        let st = {};
        v.render(() => {
          const o = obs(), T = Tf.value, A = amp(o, T), Tb = bestT(), Ab = amp(o, Tb);
          s.vband(350, 1000, { color: 'accent', alpha: 0.05 });
          if (best.value) s.fn((nm) => Ab * shape(nm, Tb), { color: 'green', width: 2, dash: [6, 4], domain: [200, 1200] });
          s.fn((nm) => A * shape(nm, T), { color: 'accent', width: 2.4, domain: [200, 1200] });
          s.dots(NM.map((nm, i) => [nm, o[i]]), { r: 2.6, color: 'gold' });
          s.vline(wienPeak(T) * 1e9, { color: 'blue', width: 1, dash: [3, 4] });
          s.text('Wien peak of the fit', wienPeak(T) * 1e9, 1.2, { size: 10.5, color: 'blue', dx: 5, align: 'left' });
          s.text('fitting window 350–1000 nm', 365, 0.06, { size: 10, color: 'muted', align: 'left' });
          st = { T, Tb, rmsT: rms(o, T) };
        });
        v.readout(() => {
          const S = STAR[who.value], L = 4 * Math.PI * (S.R * R_SUN) ** 2 * SIGMA * S.T ** 4, Te = Math.pow(L / (4 * Math.PI * (S.R * R_SUN) ** 2 * SIGMA), 0.25);
          return `$T_{\\rm eff}$ from $L=4\\pi R^2\\sigma T^4$ ($L=${v.fmt(L / L_SUN, 3)}\\,L_\\odot$, $R=${S.R}\\,R_\\odot$): **${v.fix(Te, 0)} K**\nbest-fit blackbody: **${v.fix(st.Tb, 0)} K**  ·  Wien peak of your fit: ${v.fix(wienPeak(st.T) * 1e9, 0)} nm  ·  your fit ${v.fix(st.T, 0)} K, rms misfit ${v.fix(st.rmsT * 100, 1)} %`;
        });
      },
    },

    // ───────────────────────────────────────────────────────────── 4.5
    {
      num: '4.5',
      kind: 'Theorem',
      name: 'Stellar radii from L = 4πR²σT⁴',
      statement: String.raw`A star of luminosity $L$ and effective temperature $T_{\rm eff}$ has radius
$$R = \sqrt{\frac{L}{4\pi\sigma T_{\rm eff}^4}},\qquad\text{or}\qquad \frac{R}{R_\odot}=\Big(\frac{L}{L_\odot}\Big)^{1/2}\Big(\frac{T_\odot}{T_{\rm eff}}\Big)^{2},$$
with $T_\odot = 5772$ K. In a plot of $\log L$ against $\log T_{\rm eff}$ the stars of a given radius lie on a line $\log L = 2\log R + 4\log T_{\rm eff} + \text{const}$: a family of parallel lines of slope $4$. Stellar radii span about seven orders of magnitude, from $\sim\!10^{-2}R_\odot$ (white dwarfs, Earth-sized) to $\sim\!10^{3}R_\odot$ (red supergiants).`,
      idea: String.raw`Rearrange the definition of $T_{\rm eff}$ (4.4): the luminosity is the surface flux $\sigma T_{\rm eff}^4$ times the area $4\pi R^2$, and $L$ comes from flux and distance (4.2). So for a given temperature a larger star must be more luminous, and for a given luminosity a cooler star must be larger: red giants are red *and* luminous, hence enormous. No telescope resolves most stars; this is how their sizes are known.

Using the positive-power definition and logarithm identities pma-8.6, the temperature-radius luminosity equation becomes an affine equation in log coordinates. Holding R fixed gives slope four in log luminosity versus log effective temperature, while changing R shifts the intercept by twice its logarithm. This coordinate change uses the effective-temperature definition and supplies no independent atmosphere or radius measurement.`,
      caption: String.raw`Drag the star in the log–log plane (or pick a **type**); the lines are loci of constant radius. On the left the star is drawn to scale beside the Sun (yellow, radius 1), the window zooming to fit; its colour is that of a blackbody at $T_{\rm eff}$. Compare a white dwarf, the Sun, and a red supergiant that would swallow the orbit of Mars.`,
      scope: String.raw`Uses the *effective* temperature, a definition; the “radius” is that of the photosphere where the star becomes transparent, which for a very extended star (supergiant) is a fuzzy surface. The types in the menu are typical round values, not particular stars.`,
      deps: ['astro-4.4', 'astro-4.2', 'pma-8.6'],
      refs: ['Carroll–Ostlie §3.4'],
      tags: ['radius', 'luminosity', 'temperature'],
      viz(v) {
        const PRE = { sun: ['Sun', 5772, 1], rg: ['red supergiant', 3600, 1e5], bs: ['blue supergiant', 12000, 1.2e5], rd: ['red dwarf', 3000, 0.0015], wd: ['white dwarf', 20000, 0.01] };
        const hr = v.stage({ x: [-4.7, -3.4], y: [-4.2, 6.2], axes: 'box', gutter: true, height: 340, weight: 1.15, xlabel: 'effective temperature (K)', ylabel: 'luminosity (L☉)', title: 'lines of constant radius',
          xticks: [[-Math.log10(30000), '30 000'], [-Math.log10(10000), '10 000'], [-Math.log10(5000), '5 000'], [-Math.log10(3000), '3 000']], yticks: [[-4, '10⁻⁴'], [-2, '0.01'], [0, '1'], [2, '100'], [4, '10⁴'], [6, '10⁶']] });
        const scl = v.stage({ x: [-1.3, 1.3], y: [-1.3, 1.3], equal: true, axes: false, height: 340, weight: 0.85, title: 'to scale, beside the Sun' });
        const pre = v.select('type', Object.entries(PRE).map(([k, a]) => ({ value: k, label: a[0] })), 'sun', { onChange: (k) => hs.set(-Math.log10(PRE[k][1]), Math.log10(PRE[k][2])) });
        const hs = hr.handle(-Math.log10(5772), 0, { color: 'accent', r: 8, constrain: { x: [-4.65, -3.45], y: [-4.1, 6.1] } });
        let st = {};
        v.render(() => {
          for (const R of [0.01, 0.1, 1, 10, 100, 1000]) {
            // log L = 2 log R + 4 log(T/Tsun)
            const f = (lx) => 2 * Math.log10(R) + 4 * (-lx - Math.log10(T_SUN));
            hr.path([[-4.7, f(-4.7)], [-3.4, f(-3.4)]], { color: 'faint', width: 1.2 });
            const lx = R >= 100 ? -3.62 : -4.45; hr.text(R >= 1 ? `${R} R☉` : `${R} R☉`, lx, f(lx), { size: 10, color: 'muted', dy: -9, align: 'center' });
          }
          hr.dot(-Math.log10(T_SUN), 0, { r: 5, color: 'gold', label: 'Sun', labelPos: 'se' });
          const T = Math.pow(10, -hs.x), L = Math.pow(10, hs.y), R = Math.sqrt(L) * (T_SUN / T) ** 2;
          hs.color = 'accent';
          const sc = Math.max(R, 1) * 1.15;
          scl.setView([-sc, sc], [-sc, sc]);
          scl.circle(0, 0, R, { fill: bbColor(v, T), fillAlpha: 0.95, color: 'ink', width: 1 });
          scl.circle(0, 0, 1, { fill: [255, 214, 70], fillAlpha: R >= 1 ? 0.75 : 0.95, color: 'gold', width: 1.6 });
          if (R < 1) scl.text('the star (dot at centre)', 0, 0, { dy: -30, size: 10.5, color: 'muted', align: 'center' });
          scl.corner(`radius ${v.fmt(R, 3)} R☉`, 'tl', { color: 'ink', weight: 600 });
          st = { T, L, R };
        });
        v.readout(() => `$T_{\\rm eff} = ${v.fix(st.T, 0)}$ K, $L = ${sci(v, st.L, 2)}\\,L_\\odot$  →  $R = \\sqrt{L/4\\pi\\sigma T^4} = ${v.fmt(st.R, 3)}\\,R_\\odot$ = $${v.sci(st.R * R_SUN / 1000, 2)}$ km = ${v.fmt(st.R * R_SUN / 6.371e6, 3)} Earth radii (${v.fmt(st.R * R_SUN / AU, 3)} AU)`);
      },
    },

    // ───────────────────────────────────────────────────────────── 4.6
    {
      num: '4.6',
      kind: 'Definition',
      name: 'Colour index',
      statement: String.raw`A **colour index** is the difference of a star's magnitudes in two wavelength bands, for instance $B-V = m_B - m_V$ (blue minus visual filter of the Johnson–Morgan system). Since a magnitude difference is a flux ratio (4.3), $B-V = -2.5\log_{10}(F_B/F_V) + \text{const}$, the constant being fixed by convention (the separate band zero points are fixed by the chosen photometric system). For blackbody-like stars the ratio $F_B/F_V$ depends only on temperature, and it increases with $T$, so $B-V$ **decreases monotonically with temperature** within a fixed idealized blackbody family and fixed filters. Within that model a calibrated two-filter ratio can constrain a colour temperature, with no spectrum and no distance needed (the distance divides out of the flux ratio).`,
      idea: String.raw`The two filters sample a Planck spectrum at two wavelengths. For $T$ so high that both bands lie on the Rayleigh–Jeans side the ratio is a constant; as $T$ drops, the peak of the Planck curve (Wien's law) moves from the blue towards the red, and light in $B$ falls faster than in $V$. The map $T\mapsto F_B/F_V$ is monotone, so it can be inverted. Interstellar dust reddens a star and is the main source of ambiguity, and one colour alone cannot determine both temperature and extinction; atmospheric composition, line blanketing and surface gravity introduce further departures from a blackbody.`,
      caption: String.raw`Drag the **temperature**: left, a blackbody spectrum with two filter curves (here Gaussian toys, not the tabulated Johnson curves; shaded: the part of the spectrum each filter lets through). Right: $B-V$ against $T$ from this model (calibrated so that $5772$ K gives $0.65$) and the blackbody-derived formula of Ballesteros (2012) for comparison; dots mark synthetic blackbodies at known temperatures; their colours are calculated, not catalogue observations. The two curves need not agree because their band definitions/calibrations differ.`,
      scope: String.raw`Model calibrated to a single point (the Sun), so absolute values of $B-V$ for hot and cool stars are only indicative: real stars have line blanketing, and the real filters are not Gaussians. The Gaussian bands integrate **energy** over the displayed 250–900 nm interval; they are not measured Johnson response functions or a photon-counting detector model. The anchor $(5772\mathrm{K},0.65)$ is a chosen toy calibration, not a fresh solar-colour measurement. Ballesteros Eq.(14) is an approximate comparison, not an exact inverse of these toy bands.`,
      credit: 'Ballesteros, 2012 (approximate colour-temperature comparison)',
      deps: ['astro-4.4', 'astro-4.3'],
      refs: ['Ballesteros (2012), pp.1–4, especially Eq.(14) and the broad-filter qualifications immediately before it', 'IAU (2015), Resolution B2, logarithmic magnitude convention'],
      tags: ['colour', 'photometry', 'temperature'],
      viz(v) {
        const T = v.slider('temperature $T$ (K)', 2500, 30000, 5772, { log: true, sig: 3, fmt: (x) => v.fix(x, 0) });
        const sp = v.stage({ x: [250, 900], y: [0, 2.6], axes: 'box', gutter: true, height: 330, weight: 1.1, xlabel: 'wavelength (nm)', ylabel: 'relative flux per unit wavelength', title: 'a blackbody seen through B and V filters' });
        const cv = v.stage({ x: [2500, 30000], y: [-0.5, 2.3], xlog: true, axes: 'box', gutter: true, height: 330, weight: 1, xlabel: 'temperature (K)', ylabel: 'B − V', title: 'B − V falls as the temperature rises' });
        const MODELS = [3000,5000,5772,10000,20000];
        v.render(() => {
          const t = T.value, ref = planckL(550e-9, t);
          const spectralTop = Math.max(1,...Array.from({length:651},(_,i)=>planckL((250+i)*1e-9,t)/ref));
          sp.setView([250,900],[0,spectralTop*1.15]);
          sp.fn((nm) => bandT('B', nm), { color: 'blue', width: 1, dash: [4, 4], alpha: 0.7 });
          sp.fn((nm) => bandT('V', nm), { color: 'green', width: 1, dash: [4, 4], alpha: 0.7 });
          sp.fn((nm) => (planckL(nm * 1e-9, t) / ref) * bandT('B', nm), { fill: true, color: 'blue', fillAlpha: 0.3, width: 1.4, n: 400 });
          sp.fn((nm) => (planckL(nm * 1e-9, t) / ref) * bandT('V', nm), { fill: true, color: 'green', fillAlpha: 0.3, width: 1.4, n: 400 });
          sp.fn((nm) => planckL(nm * 1e-9, t) / ref, { color: 'ink', width: 2.2, n: 400 });
          sp.text('B', BAND.B.c, spectralTop*1.08, { color: 'blue', size: 13, align: 'center' }); sp.text('V', BAND.V.c + 60, spectralTop*1.08, { color: 'green', size: 13, align: 'center' });
          cv.fn(syntheticColour, { color: 'accent', width: 2.4 });
          const pts = []; for (let bv = -.5; bv <= 3; bv += .01) {const tt=ballesterosColourTemperature(bv);if(tt>=2500&&tt<=30000)pts.push([tt,bv]);}
          cv.setView([2500,30000],[Math.min(syntheticColour(30000),...pts.map(p=>p[1]))-.12,Math.max(syntheticColour(2500),...pts.map(p=>p[1]))+.12]);
          cv.path(pts, { color: 'orange', width: 1.6, dash: [6, 4] });
          for(const tt of MODELS)cv.dot(tt,syntheticColour(tt),{r:4,color:'purple',label:`${tt}K`,labelPos:'ne'});
          cv.dot(t, syntheticColour(t), { r: 7, color: 'gold' });
          cv.corner('model (solid), Ballesteros 2012 (dashed)', 'tr', { color: 'muted' });
        });
        v.readout(() => `$T = ${v.fix(T.value, 0)}$ K  →  $B - V = ${v.fix(syntheticColour(T.value), 2)}$ (synthetic energy bands, chosen zero point) · band energy ratio $F_B/F_V = ${v.fix(energyBand('B',T.value)/energyBand('V',T.value),4)}$ · Ballesteros formula applied to that colour gives ${v.fix(ballesterosColourTemperature(syntheticColour(T.value)), 0)} K`);
      },
    },
  ],
};
