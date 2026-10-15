// Astrophysics & Celestial Mechanics — Chapter 1 (part b: 1.5–1.8)

// ── helpers ───────────────────────────────────────────────────────────────────
const TAU = 2 * Math.PI, DEG = Math.PI / 180;
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
/** One-slot cache: recompute only when the key changes. */
function memo() { let key, val; return (k, f) => { if (k !== key) { key = k; val = f(); } return val; }; }
const nums = (s) => s.split(',').map(Number);
/**
 * Fraction of a limb-darkened stellar disc (radius 1, quadratic law I = 1 − u1(1−μ) − u2(1−μ)², μ = √(1−ρ²))
 * hidden by an opaque disc of radius p whose centre is at projected distance z. Integrated over annuli.
 */
function hidden(p, z, u1 = 0, u2 = 0, n = 90) {
  if (z >= 1 + p) return 0;
  if (!u1 && !u2) { // uniform disc: exact lens area
    if (z <= Math.abs(1 - p)) return Math.min(1, p * p);
    const A = p * p * Math.acos(clamp((z * z + p * p - 1) / (2 * z * p), -1, 1)) + Math.acos(clamp((z * z + 1 - p * p) / (2 * z), -1, 1))
      - 0.5 * Math.sqrt(Math.max(0, (-z + p + 1) * (z + p - 1) * (z - p + 1) * (z + p + 1)));
    return A / Math.PI;
  }
  const I = (r) => { const mu = Math.sqrt(Math.max(0, 1 - r * r)); return 1 - u1 * (1 - mu) - u2 * (1 - mu) ** 2; };
  const lo = Math.max(0, z - p), hi = Math.min(1, z + p), h = (hi - lo) / n;
  let blocked = 0;
  for (let k = 0; k < n; k++) {
    const r = lo + (k + 0.5) * h;
    let frac;
    if (r + z <= p) frac = 1;
    else if (r <= p - z) frac = 1;
    else if (z < 1e-12) frac = r < p ? 1 : 0;
    else frac = Math.acos(clamp((r * r + z * z - p * p) / (2 * r * z), -1, 1)) / Math.PI;
    blocked += I(r) * frac * 2 * Math.PI * r * h;
  }
  const total = 2 * Math.PI * (0.5 - u1 / 6 - u2 / 12); // ∫ I 2πr dr over the unit disc
  return blocked / total;
}
/** Colour between orange (3000 K) and blue (30 000 K) on a log scale, as an [r, g, b] array from the palette. */
function tcol(v, T) {
  const stops = [[3000, v.rgb('red')], [4300, v.rgb('orange')], [5800, v.rgb('gold')], [10000, v.rgb('blue')]];
  const lt = Math.log(clamp(T, 3000, 10000));
  for (let k = 0; k + 1 < stops.length; k++) {
    const [Ta, A] = stops[k], [Tb, B] = stops[k + 1];
    if (lt <= Math.log(Tb)) { const s = (lt - Math.log(Ta)) / (Math.log(Tb) - Math.log(Ta)); return [0, 1, 2].map((j) => A[j] + (B[j] - A[j]) * s); }
  }
  return stops[3][1].slice(0, 3);
}
/** A star drawn with mild limb darkening (nested translucent discs). */
function star(s, x, y, R, col, alpha = 1) {
  for (let k = 0; k < 5; k++) s.circle(x, y, R * (1 - k * 0.17), { fill: col, fillAlpha: (k === 0 ? 0.55 : 0.22) * alpha, stroke: false });
  s.circle(x, y, R, { color: col, width: 1, alpha: 0.8 * alpha });
}

// Kepler-7 (KIC 5780885) long-cadence PDCSAP photometry, quarters 2–7 (MAST), quality flag 0, each quarter
// normalised by its median, folded on P = 4.885525 d (Latham et al. 2010), epoch refined by symmetry.
// K7_BIN: mean depth (ppm) in 80 bins of 0.2 h from −8 h to +8 h; K7_ERR: standard error (ppm);
// K7_RAW_H / K7_RAW_F: 360 randomly chosen individual 29.4-min points (hours from mid-transit, depth in ppm).
const K7_BIN = '5,28,-25,33,2,10,-37,-5,4,-33,16,-46,14,-2,-8,-21,-29,15,-5,-2,1,19,0,-14,17,58,152,1041,2942,4782,5853,6364,6688,6865,7106,7196,7292,7377,7428,7513,7467,7390,7413,7186,7223,6999,6899,6703,6367,5936,4708,3000,1037,191,40,-43,14,-70,-46,38,-7,36,-79,-19,-40,-92,32,-91,1,-60,-76,12,-82,9,-29,31,20,-58,13,-99';
const K7_ERR = '30,32,33,29,34,36,22,30,34,24,36,30,30,35,31,36,30,35,29,29,36,28,30,36,30,44,46,79,114,85,50,31,36,46,30,41,30,30,34,31,39,33,31,81,30,76,32,43,33,54,99,102,107,43,31,54,28,59,31,33,34,34,59,32,40,60,29,54,30,30,53,28,55,32,31,37,30,33,34,52';
const K7_RAW_H = '-1.39,-0.90,1.55,2.04,6.46,-3.88,1.02,2.49,4.86,-3.52,1.87,-7.98,-3.57,-1.61,-6.07,-2.63,-1.16,-0.18,3.25,6.68,-7.09,-4.15,3.70,-3.71,-5.71,-7.72,-6.25,-2.33,-0.36,2.58,-4.34,4.98,-5.85,-4.87,-0.46,7.39,-5.41,0.47,1.45,-4.97,-2.52,3.37,-6.98,-5.02,-3.55,0.38,3.81,6.26,7.73,-0.65,0.33,6.65,1.21,-1.78,2.63,3.12,6.06,-6.74,-5.76,3.07,6.01,7.98,-3.35,5.96,-7.82,-2.47,1.94,2.43,2.92,3.90,-7.97,-2.58,0.86,-6.06,-0.18,0.81,2.28,2.77,6.20,-6.60,-2.68,2.23,1.68,5.12,6.10,-5.23,-1.80,6.54,7.47,-7.29,-1.90,-1.41,3.98,2.95,-6.96,-5.48,-3.52,-1.07,3.83,-6.02,-5.53,-3.08,3.69,-7.15,-5.19,-4.70,1.67,2.17,-6.71,-0.83,-5.78,-3.82,-3.32,-1.36,0.60,4.03,-2.39,3.98,-5.87,-0.48,0.01,5.90,-1.50,-2.04,7.77,-5.52,-5.03,-0.61,2.33,5.27,-6.59,-1.68,0.28,1.26,5.67,6.16,-7.61,-6.63,-0.26,2.19,5.63,7.59,-6.19,1.17,-7.21,-5.74,7.99,-4.31,3.54,6.48,6.97,-6.80,-0.92,-6.85,-5.87,-5.38,-4.39,-3.41,1.49,-2.97,0.43,3.82,4.31,5.78,7.74,-6.03,0.34,6.23,-7.05,-6.56,-3.62,2.27,-4.64,-3.66,-0.72,0.75,-5.17,0.22,1.20,3.66,-7.66,7.05,6.52,7.99,-5.78,-4.80,-2.35,-1.37,3.54,6.48,-7.78,-3.37,-1.90,-1.41,4.48,4.97,6.44,1.94,6.85,-5.45,-4.96,7.79,-0.59,0.39,2.84,3.33,5.79,-3.57,7.71,-6.07,-3.61,3.74,4.23,4.72,5.21,-7.58,-5.62,0.27,-1.24,6.11,-4.23,-0.80,2.64,4.56,5.05,-5.78,2.55,7.95,-5.34,2.51,-5.38,1.98,-1.01,-0.52,1.44,5.86,-5.96,0.42,1.40,2.87,5.81,-0.61,3.32,4.79,5.77,-7.52,-3.10,0.33,1.31,1.80,4.25,5.23,6.71,0.78,1.76,7.15,0.73,3.67,5.14,-6.18,0.69,5.10,7.06,-7.21,-2.79,4.56,-7.74,-6.76,-1.37,2.06,-4.36,-1.46,-0.97,4.42,7.85,-1.51,0.45,4.37,-6.46,2.36,4.33,-7.98,-7.00,-5.09,-1.17,-0.19,3.74,4.72,5.70,-5.63,-2.69,4.18,6.14,-3.72,-6.27,-4.80,-0.88,2.56,0.06,6.92,7.90,-6.37,-1.96,-0.98,0.00,4.42,6.38,6.87,-7.89,-4.46,1.92,6.82,-7.45,-2.06,-1.08,-0.59,1.86,5.30,5.79,-7.01,-5.05,-3.58,-1.62,3.29,-7.06,-5.59,-4.12,-3.63,0.29,0.78,1.27,-5.15,-3.68,-1.72,-6.18,-5.20,7.55,-3.29,-0.35,-1.87,5.97,-7.32,-6.83,-6.34,-5.85,-5.36,1.51,0.97,2.93,6.85,-4.97,-3.01,5.33,-6.98,-2.56,-6.05,-5.07,-4.09,0.82,5.72';
const K7_RAW_F = '6516,6823,6336,4936,-247,-56,7209,1637,-50,-138,6258,100,-89,6482,-73,492,7115,7445,138,28,-51,46,82,-137,18,74,-138,2135,7259,680,-67,-138,-99,-98,7335,-91,293,7466,7058,-142,610,-214,114,361,127,7731,175,174,125,7416,7230,-161,6947,6234,503,-55,-76,-153,-6,31,116,-39,-24,47,200,1103,5738,2082,227,-56,-4,554,7143,394,7762,7342,3685,280,101,-310,-87,3844,6271,-159,-137,281,6545,237,-481,-180,5404,6404,-400,-112,296,29,77,7266,324,-205,-132,-173,149,-479,-424,-416,6089,3996,17,7490,-339,-126,-224,6630,7127,-136,2026,49,-184,7363,7534,-94,6493,5396,105,-16,29,7436,2799,47,-44,6395,7367,6992,-166,-35,-40,-84,7203,3890,-225,-141,-11,7164,254,103,111,107,-176,-233,-87,24,7131,253,188,228,-9,139,6917,215,7328,634,579,497,717,-297,7046,-317,110,196,185,3558,-10,106,7542,7316,102,7241,6808,-127,-308,-337,-1639,-1461,386,443,2884,7258,318,467,124,193,6021,6741,-54,-40,98,5843,229,-195,-343,-52,7184,7263,-27,58,-62,55,195,-108,24,-363,-119,-185,-221,-232,-242,7389,6913,-13,-175,7189,356,118,9,9,717,193,-54,889,127,5560,7237,7434,6870,-198,10,7580,6781,147,-117,7302,42,252,-16,247,288,7523,7132,6314,117,79,105,7157,6337,-290,7385,145,-42,-233,7314,-15,-62,94,-27,-84,226,80,6912,5039,106,6548,6919,-85,-138,6596,7449,63,-269,1810,-20,-31,-64,-249,6850,7274,-197,-91,-274,306,415,124,72,22,-178,-161,7041,326,7631,1,228,283,6010,7249,7721,21,128,240,-113,13,5709,-53,153,5385,7003,7305,6182,153,139,-90,-106,93,6551,-145,-131,-154,-92,-16,7463,6932,6728,-103,-82,6151,-7,120,256,-87,7393,4945,-756,68,72,41,25,72,6632,7301,2,12,31,-8,-245,-424,611,80,143,85,7351,188';

export default {
  collection: 'astro',
  chapter: 1,
  items: [
    // ───────────────────────────────────────────────────────────── 1.5
    {
      num: '1.5',
      kind: 'Model',
      name: 'Eclipsing binaries: radii from light curves',
      statement: String.raw`If the orbit of a binary is seen nearly edge-on ($i \approx 90^\circ$), each star passes in front of the other once per orbit and the total light dips twice. For a circular orbit of separation $a$ and period $P$ (relative speed $v = 2\pi a/P$), with first, second and third contact at times $t_a < t_b < t_c$ of a central eclipse,
$$R_s = \tfrac{v}{2}(t_b - t_a),\qquad R_\ell = \tfrac{v}{2}(t_c - t_a)$$
give the radii of the smaller and larger star. When both eclipses are total/annular, the same area is hidden in each, so the ratio of the two depths equals the ratio of surface brightnesses, $\big(T_{\rm eff,1}/T_{\rm eff,2}\big)^4$ for blackbody stars; the deeper (**primary**) eclipse is the one in which the hotter star is covered. Combined with radial velocities (1.4), where $\sin i \approx 1$ is now known, an eclipsing double-lined binary yields both masses and both radii.`,
      idea: String.raw`Seen from far away the stars are uniformly moving discs, so the timing of the contacts measures lengths: between first and second contact the small disc moves its own diameter across the large one’s edge, and between first and third it moves the sum of both diameters minus its own. The flux lost in an eclipse is the surface brightness of the covered star times the covered area (Stefan–Boltzmann, $F\propto T^4$); in total and annular eclipses the covered area is $\pi R_s^2$ in both, so the depth ratio isolates the temperatures. Limb darkening and a slightly inclined orbit round the corners of the light curve and spoil the simple formulas — which is why real analyses fit a model like the one computed here.`,
      caption: String.raw`Top left, the two stars as an observer would see them (colours from their temperatures, discs limb-darkened when the toggle is on); right, the computed light curve over one orbit, with the primary eclipse at phase 0. Drag the gold marker along the light curve to move in time. The readout measures the contact phases from the curve itself and recovers the radii, and compares the depth ratio with $(T_1/T_2)^4$. Lower the inclination until the eclipses become partial — the flat bottoms disappear and the radius formulas fail.`,
      deps: ['astro-1.4'],
      see: ['thermo-9.6'],
      refs: ['Carroll–Ostlie §7.3'],
      tags: ['binary stars', 'light curves', 'radii'],
      viz(v) {
        const R1S = v.slider('$R_1/a$', 0.05, 0.4, 0.22, { step: 0.005 });
        const R2S = v.slider('$R_2/a$', 0.02, 0.3, 0.1, { step: 0.005 });
        const T1S = v.slider('$T_1$ (K)', 3000, 30000, 9500, { log: true, sig: 3 });
        const T2S = v.slider('$T_2$ (K)', 3000, 30000, 5200, { log: true, sig: 3 });
        const iS = v.slider('inclination $i$', 70, 90, 90, { step: 0.1, fmt: (x) => `${v.fix(x, 1)}°` });
        const ld = v.toggle('limb darkening', false);
        const sky = v.stage({ x: [-1.4, 1.4], y: [-0.7, 0.7], equal: true, axes: false, height: 300, weight: 1, title: 'as seen by the observer' });
        const lc = v.stage({ x: [-0.25, 0.75], y: [0, 1.05], axes: 'box', height: 300, weight: 1.35, xlabel: 'orbital phase', ylabel: 'total flux (normalised)', title: 'light curve' });
        const H = lc.handle(0.06, 1, { color: 'gold', r: 7 });
        const cache = memo();
        const model = () => cache([R1S.value, R2S.value, T1S.value, T2S.value, iS.value, ld.value].join('|'), () => {
          const R1 = R1S.value, R2 = R2S.value, T1 = T1S.value, T2 = T2S.value, ci = Math.cos(iS.value * DEG), u = ld.value ? 0.6 : 0;
          const L1 = R1 * R1 * T1 ** 4, L2 = R2 * R2 * T2 ** 4, L = L1 + L2;
          const flux = (ph) => {
            const x = Math.sin(TAU * ph), y = ci * Math.cos(TAU * ph), z = Math.hypot(x, y), front2 = Math.cos(TAU * ph) > 0;
            // phase 0: star 2 in front of star 1
            if (front2) return (L - L1 * hidden(R2 / R1, z / R1, u, 0)) / L;
            return (L - L2 * hidden(R1 / R2, z / R2, u, 0)) / L;
          };
          const N = 1600, ph = [], fl = [];
          for (let k = 0; k <= N; k++) { const p = -0.25 + k / N; ph.push(p); fl.push(flux(p)); }
          // contact phases of the primary eclipse, measured from the curve (first drop, flat bottom start/end)
          const eps = 1e-7; let ta = NaN, tb = NaN, tc = NaN;
          const i0 = Math.round(0.25 * N), fmin = Math.min(...fl.slice(Math.round(0.15 * N), Math.round(0.35 * N)));
          for (let k = Math.round(0.1 * N); k <= i0; k++) if (fl[k] < 1 - eps) { ta = ph[k - 1] + (ph[k] - ph[k - 1]) * ((1 - eps - fl[k - 1]) / (fl[k] - fl[k - 1])); break; }
          const flat = (k) => Math.abs(fl[k] - fmin) < (u ? 2e-3 : 1e-7) * (1 - fmin) + 1e-12;
          for (let k = Math.round(0.1 * N); k <= i0; k++) if (flat(k)) { tb = ph[k]; break; }
          for (let k = Math.round(0.4 * N); k >= i0; k--) if (flat(k)) { tc = ph[k]; break; }
          const sec = Math.min(...fl.slice(Math.round(0.65 * N), Math.round(0.85 * N)));
          return { ph, fl, flux, ta, tb, tc, fmin, sec, L1, L2, R1, R2, T1, T2, u };
        });
        let cur = null;
        v.render(() => {
          const D = model(), ph = H.x, ci = Math.cos(iS.value * DEG);
          H.y = D.flux(ph);
          // sky view (separation a = 1); star 2 moves relative to star 1
          const x = Math.sin(TAU * ph), y = ci * Math.cos(TAU * ph), front2 = Math.cos(TAU * ph) > 0;
          const c1 = tcol(v, D.T1), c2 = tcol(v, D.T2), q = D.L2 / (D.L1 + D.L2) * 0; // star 1 kept at the centre
          const s1 = [-q * x, -q * y], s2 = [x, -y];
          const draw1 = () => (ld.value ? star(sky, s1[0], s1[1], D.R1, c1) : sky.circle(s1[0], s1[1], D.R1, { fill: c1, fillAlpha: 0.85, color: c1 }));
          const draw2 = () => (ld.value ? star(sky, s2[0], s2[1], D.R2, c2) : sky.circle(s2[0], s2[1], D.R2, { fill: c2, fillAlpha: 0.85, color: c2 }));
          if (front2) { draw1(); draw2(); } else { draw2(); draw1(); }
          sky.curve((t) => [Math.sin(t), -ci * Math.cos(t)], 0, TAU, { color: 'faint', width: 1, dash: [3, 4] });
          sky.text('1', s1[0], s1[1] + D.R1, { color: 'muted', size: 11, dy: -8, align: 'center' });
          sky.text('2', s2[0], s2[1] + D.R2, { color: 'muted', size: 11, dy: -8, align: 'center' });
          sky.corner(`phase ${v.fix(((ph % 1) + 1) % 1, 3)}`, 'tl', { color: 'gold' });
          // light curve
          const lo = Math.min(D.fmin, D.sec);
          const y0 = Math.max(0, lo - 0.1 * (1 - lo) - 0.02), y1 = 1 + 0.16 * (1 - lo) + 0.01;
          lc.setView([-0.25, 0.75], [y0, y1]);
          lc.path(D.ph.map((p, k) => [p, D.fl[k]]), { color: 'accent', width: 2.2 });
          if (isFinite(D.ta)) for (const [t, lab] of [[D.ta, 'a'], [D.tb, 'b'], [D.tc, 'c']]) if (isFinite(t)) { lc.vline(t, { color: 'orange', width: 1, dash: [3, 3], alpha: 0.8 }); lc.tex(`t_${lab}`, t, y0, { color: 'orange', size: 12, dy: -10, dx: lab === 'a' ? -7 : lab === 'c' ? 7 : 0 }); }
          lc.text('primary', isFinite(D.ta) ? D.ta : -0.05, D.fmin, { color: 'muted', size: 10.5, dx: -8, align: 'right' });
          lc.text('secondary', 0.5, D.sec, { color: 'muted', size: 10.5, dy: 12, align: 'center' });
          cur = D;
        });
        v.legend([['accent', 'computed light curve'], ['orange', 'contact phases measured from the curve', { dash: true }]]);
        v.readout(() => {
          if (!cur) return '';
          const D = cur, d1 = 1 - D.fmin, d2 = 1 - D.sec, ratio = d1 / d2, Tr = (D.T1 / D.T2) ** 4, hot = D.T1 > D.T2 ? 1 : 2;
          let out = String.raw`primary depth ${v.fix(d1 * 100, 2)}%, secondary ${v.fix(d2 * 100, 2)}%; ratio ${v.fix(ratio, 3)} vs $(T_1/T_2)^4 = ${v.fix(Tr, 3)}$ (primary eclipse = star ${hot === 1 ? 1 : 2}, the hotter, covered${hot === 2 ? ' — here star 2 is hotter, so the phase-0.5 dip is the deeper one' : ''})`;
          const Rs = Math.min(D.R1, D.R2), Rl = Math.max(D.R1, D.R2);
          if (isFinite(D.ta) && isFinite(D.tb) && isFinite(D.tc) && D.tc > D.tb + 1e-4) {
            const rs = Math.PI * (D.tb - D.ta), rl = Math.PI * (D.tc - D.ta);
            out += String.raw` · contacts $t_a, t_b, t_c$ = ${v.fix(D.ta, 4)}, ${v.fix(D.tb, 4)}, ${v.fix(D.tc, 4)} ⇒ $R_s/a = \pi(t_b - t_a) = ${v.fix(rs, 4)}$ (true ${v.fix(Rs, 4)}), $R_\ell/a = \pi(t_c - t_a) = ${v.fix(rl, 4)}$ (true ${v.fix(Rl, 4)})`;
            if (D.u > 0) out += ' — limb darkening makes the bottom curved, so the "flat" contacts are only approximate';
          } else out += ' · partial eclipse: no flat bottom, the second and third contacts do not exist and the radius formulas cannot be used';
          if (D.u === 0 && isFinite(D.tb) && Math.abs(ratio / Tr - 1) > 0.02) out += ' (depth ratio ≠ T⁴ ratio: the eclipses are not both total/annular)';
          return out;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 1.6
    {
      num: '1.6',
      kind: 'Method',
      name: 'Exoplanets by radial velocity and transits',
      statement: String.raw`A planet of mass $m_p \ll M_*$ on a circular orbit of period $P$ makes its star move on a small circle, with radial-velocity semi-amplitude
$$K = \Big(\frac{2\pi G}{P}\Big)^{1/3}\frac{m_p\sin i}{M_*^{2/3}},$$
so Doppler measurements give the **minimum mass** $m_p\sin i$. If the orbit is nearly edge-on the planet also **transits**, blocking a fraction
$$\delta \approx \Big(\frac{R_p}{R_*}\Big)^2$$
of the starlight (modified by limb darkening), and the shape of the transit fixes the impact parameter $b = (a/R_*)\cos i$, hence $i$. Radial velocities plus transits therefore give the planet’s true mass, radius and mean density.`,
      idea: String.raw`The star and planet orbit their barycentre (1.4) with $a_* = a\,m_p/M_*$, and Kepler’s third law (1.3) gives $a$ from $P$ and $M_*$; projecting the star’s orbital speed $2\pi a_*/P$ on the line of sight gives $K$ — the single-lined mass function with $m_p\ll M_*$. A transit is an eclipse (1.5) by a dark body: the depth measures the area ratio, and the durations of ingress and of the whole transit measure the chord the planet cuts across the disc, which depends on $b$. With $\sin i$ known from the transit, $m_p\sin i$ becomes $m_p$.`,
      caption: String.raw`**51 Peg b**, the first planet found around a Sun-like star: the curve uses the discovery parameters of Mayor & Queloz (1995: $P = 4.2293$ d, $K = 59$ m/s, $M_* = 1\,M_\odot$); the dots are simulated measurements with the noise you choose, and the fitted $K$ gives $m\sin i$. It does not transit. **Kepler-7b**: the right panel shows real *Kepler* photometry — 23 164 long-cadence points from quarters 2–7 folded on the period (grey), binned in 12-minute bins with error bars (black). Adjust $R_p/R_*$ and $b$ (or press *fit*) until the limb-darkened model, averaged over Kepler’s 29.4-minute exposures, passes through the bins; with Latham et al.’s (2010) $K = 42.9$ m/s the readout then gives a planet bigger than Jupiter but lighter than half of it — less dense than cork.`,
      deps: ['astro-1.4', 'astro-1.5'],
      refs: ['Carroll–Ostlie §7.4', 'Carroll–Ostlie §23.1'],
      tags: ['exoplanets', 'Doppler', 'transits'],
      credit: 'Mayor & Queloz, 1995 (RV); Charbonneau et al. and Henry et al., 1999 (transits)',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Methods_of_detecting_exoplanets' },
      viz(v) {
        const C = v.M.CONST, G = C.G, MS = C.Msun, RS = C.Rsun, MJ = 1.89813e27, RJ = 7.1492e7, DAY = 86400;
        const PL = {
          k7: { name: 'Kepler-7b', P: 4.885525, K: 42.9, Ms: 1.347, Rs: 1.843, aR: 7.22, transit: true },
          peg: { name: '51 Peg b', P: 4.2293, K: 59, Ms: 1.0, Rs: 1.15, aR: 8.8, transit: false },
        };
        const which = v.select('planet', [{ value: 'k7', label: 'Kepler-7b (RV + transit)' }, { value: 'peg', label: '51 Peg b (RV only)' }], 'k7');
        const sig = v.slider('RV noise σ (m/s)', 1, 30, 8, { step: 0.5 });
        const nRV = v.slider('RV measurements', 6, 60, 20, { int: true });
        const kS = v.slider('$R_p/R_*$', 0.04, 0.12, 0.076, { step: 0.0005, decimals: 4 });
        const bS = v.slider('impact parameter $b$', 0, 0.95, 0.2, { step: 0.005 });
        const ldT = v.toggle('limb darkening', true);
        const fitB = v.button('fit $R_p/R_*$ and $b$', () => fit());
        const rv = v.stage({ x: [0, 1], y: [-90, 90], axes: 'box', height: 330, weight: 1, xlabel: 'orbital phase', ylabel: 'stellar radial velocity (m/s)', title: 'radial velocity' });
        const tr = v.stage({ x: [-6, 6], y: [-9500, 1800], axes: 'box', height: 330, weight: 1.25, xlabel: 'hours from mid-transit', ylabel: 'change in flux (ppm)', title: 'transit' });
        const BIN = nums(K7_BIN), ERR = nums(K7_ERR), RH = nums(K7_RAW_H), RF = nums(K7_RAW_F);
        const binC = BIN.map((_, k) => -8 + 0.2 * k + 0.1);
        const U1 = 0.36, U2 = 0.27; // quadratic limb darkening typical of a 5900 K dwarf in the Kepler band
        const depthAt = (hrs, k, b, ldOn, Pd, aR) => {
          // average over the 29.4-min long-cadence exposure (7 sub-samples)
          let s = 0;
          for (let j = -3; j <= 3; j++) {
            const t = hrs + (j / 7) * 0.49, ph = (TAU * t) / (Pd * 24), x = aR * Math.sin(ph), y = b * Math.cos(ph), z = Math.hypot(x, y);
            s += Math.cos(ph) > 0 ? hidden(k, z, ldOn ? U1 : 0, ldOn ? U2 : 0, 60) : 0;
          }
          return (s / 7) * 1e6;
        };
        const chi2 = (k, b, ldOn) => { let c = 0; for (let j = 0; j < BIN.length; j++) { const m = depthAt(binC[j], k, b, ldOn, PL.k7.P, PL.k7.aR); c += ((BIN[j] - m) / ERR[j]) ** 2; } return c; };
        function fit() {
          if (which.value !== 'k7') return;
          let best = [Infinity, kS.value, bS.value];
          for (let k = 0.07; k <= 0.095; k += 0.001) for (let b = 0; b <= 0.9; b += 0.05) { const c = chi2(k, b, ldT.value); if (c < best[0]) best = [c, k, b]; }
          let [, k0, b0] = best;
          for (let k = k0 - 0.001; k <= k0 + 0.001; k += 0.0001) for (let b = Math.max(0, b0 - 0.05); b <= Math.min(0.95, b0 + 0.05); b += 0.005) { const c = chi2(k, b, ldT.value); if (c < best[0]) best = [c, k, b]; }
          kS.set(+best[1].toFixed(4)); bS.set(+best[2].toFixed(3));
        }
        const cacheRV = memo(), cacheC = memo();
        let cur = null;
        v.render(() => {
          const Pp = PL[which.value];
          // RV: simulated measurements around the published curve, least-squares fit of A sin + B cos + γ
          const D = cacheRV(`${which.value}|${sig.value}|${nRV.value}`, () => {
            const r = v.rng(1000 + nRV.value * 7 + Math.round(sig.value * 10)), N = nRV.value, ph = [], vv = [];
            for (let j = 0; j < N; j++) { const p = r(); ph.push(p); vv.push(-Pp.K * Math.sin(TAU * p) + sig.value * r.normal()); }
            const A = ph.map((p) => [Math.sin(TAU * p), Math.cos(TAU * p), 1]);
            const At = v.M.transpose(A), sol = v.M.solve(v.M.matMul(At, A), v.M.matVec(At, vv));
            const K = Math.hypot(sol[0], sol[1]);
            return { ph, vv, K, sK: sig.value * Math.sqrt(2 / N), sol };
          });
          const top = Math.max(80, Pp.K * 1.5 + 2 * sig.value);
          rv.setView([0, 1], [-top, top]);
          rv.hline(0, { color: 'faint', width: 1 });
          rv.fn((p) => -Pp.K * Math.sin(TAU * p), { color: 'muted', width: 1.2, dash: [5, 4] });
          rv.fn((p) => D.sol[0] * Math.sin(TAU * p) + D.sol[1] * Math.cos(TAU * p) + D.sol[2], { color: 'accent', width: 2.2 });
          D.ph.forEach((p, j) => { rv.line(p, D.vv[j] - sig.value, p, D.vv[j] + sig.value, { color: 'ink', width: 1, alpha: 0.4 }); rv.dot(p, D.vv[j], { r: 3, color: 'ink' }); });
          rv.corner(`${Pp.name}: P = ${Pp.P} d`, 'tr', { color: 'muted', size: 11.5 });
          // transit
          const msini = ((D.K * (Pp.P * DAY / (TAU * G)) ** (1 / 3) * (Pp.Ms * MS) ** (2 / 3)) / MJ);
          let T = null;
          if (Pp.transit) {
            tr.dots(RH.map((h, j) => [h, -RF[j]]), { r: 1.6, color: 'muted', alpha: 0.45 });
            binC.forEach((h, j) => { if (Math.abs(h) > 6.05) return; tr.line(h, -BIN[j] - ERR[j], h, -BIN[j] + ERR[j], { color: 'ink', width: 1.1 }); tr.dot(h, -BIN[j], { r: 2.6, color: 'ink' }); });
            const k = kS.value, b = bS.value, c2 = cacheC(`${k}|${b}|${ldT.value}`, () => chi2(k, b, ldT.value));
            tr.fn((h) => -depthAt(h, k, b, ldT.value, Pp.P, Pp.aR), { color: 'accent', width: 2.2, n: 240, domain: [-6, 6] });
            tr.hline(-k * k * 1e6, { color: 'orange', width: 1, dash: [4, 4] });
            tr.text('−(Rp/R*)²', -5.9, -k * k * 1e6, { color: 'orange', size: 10.5, dy: 9, align: 'left' });
            const inc = Math.acos(clamp(b / Pp.aR, 0, 1)), Rp = k * Pp.Rs * RS, mp = (msini * MJ) / Math.sin(inc), rho = mp / ((4 / 3) * Math.PI * Rp ** 3);
            T = { k, b, c2, inc, Rp, mp, rho };
          } else {
            tr.hline(0, { color: 'ink', width: 1.6 });
            const k = 1.2 * RJ / (Pp.Rs * RS);
            tr.fn((h) => -depthAt(h, k, 0, true, Pp.P, Pp.aR), { color: 'muted', width: 1.4, dash: [5, 4], domain: [-6, 6], n: 200 });
            tr.text('no transit is seen: the orbit is not edge-on', 0, -3600, { color: 'red', size: 12, align: 'center' });
            tr.text('dashed: the dip a 1.2 R_J planet would cause if it were', 0, -4600, { color: 'muted', size: 10.5, align: 'center' });
          }
          kS.el.hidden = bS.el.hidden = ldT.el.hidden = fitB.hidden = !Pp.transit;
          cur = { Pp, D, msini, T };
        });
        v.legend([['ink', 'measurements (RV simulated with your σ; transit: Kepler data, binned)', { dot: true }], ['accent', 'fitted / adjustable model'], ['muted', 'published orbit', { dash: true }]]);
        v.readout(() => {
          if (!cur) return '';
          const { Pp, D, msini, T } = cur;
          let out = String.raw`RV fit: $K = ${v.fix(D.K, 1)} \pm ${v.fix(D.sK, 1)}$ m/s (published ${Pp.K}) ⇒ $m_p\sin i = K\,(P/2\pi G)^{1/3}M_*^{2/3} = ${v.fix(msini, 3)}\,M_J$ for $M_* = ${Pp.Ms}\,M_\odot$ (the published orbit gives ${Pp.transit ? '0.437' : '0.47'})`;
          if (!T) return out + String.raw` · without a transit, $\sin i$ — and so the true mass — stays unknown`;
          out += String.raw` · transit: $\chi^2 = ${v.fix(T.c2, 1)}$ for 80 bins (≈ 80 is a good fit) · $R_p = ${v.fix(T.k, 4)}\times ${Pp.Rs}\,R_\odot = ${v.fix(T.Rp / RJ, 3)}\,R_J$, $i = ${v.fix(T.inc / DEG, 2)}^\circ$, $m_p = ${v.fix(T.mp / MJ, 3)}\,M_J$, mean density $${v.fix(T.rho / 1000, 3)}$ g/cm³ (Jupiter 1.33, Latham et al. 2010: 0.166)`;
          if (!ldT.value) out += ' · without limb darkening no choice of $R_p/R_*$ and $b$ fits the rounded bottom (best χ² ≈ 2700): real stellar discs are darker at the edge';
          return out;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 1.7
    {
      num: '1.7',
      kind: 'Phenomenon',
      name: 'Nodal precession from oblateness (J₂)',
      statement: String.raw`The equatorial bulge of a planet adds to its potential the quadrupole term $\Phi_2 = \frac{GM}{r}J_2\big(\frac{R}{r}\big)^2 P_2(\sin\phi)$ ($J_2 = 1.0826\times10^{-3}$ for the Earth). Averaged over an orbit it leaves $a$, $e$ and $i$ unchanged but makes the orbit plane precess about the polar axis at
$$\dot\Omega = -\frac{3}{2}\,n\,J_2\Big(\frac{R}{p}\Big)^2\cos i,\qquad p = a(1-e^2):$$
the node **regresses** (moves westward) for prograde orbits, advances for retrograde ones, and stands still for polar orbits. Choosing $i$ slightly above $90^\circ$ so that $\dot\Omega = +360^\circ/\text{yr}$ gives a **Sun-synchronous** orbit, whose plane keeps a fixed angle to the Sun all year (about $98^\circ$ for altitudes of 600–800 km). The perigee also precesses, at $\dot\omega = \frac34 nJ_2(R/p)^2(5\cos^2 i - 1)$.`,
      idea: String.raw`The bulge exerts a torque on the orbit: averaged over a revolution, the satellite is a ring of mass, and the extra pull of the equatorial bulge tries to twist this ring into the equatorial plane. Like a spinning top under gravity, the orbit’s angular momentum (orbital elements, 1.1) does not tip over but precesses about the polar axis, at a rate proportional to the torque component, hence to $\cos i$. The size of the effect follows from perturbation theory of the Kepler orbit; for slightly non-circular orbits the same averaged potential drives the apsidal motion of mech 8.11.`,
      caption: String.raw`Left: the Earth (equatorial plane shaded), a satellite’s orbit plane and the direction of the Sun, animated through one year; drag to rotate. Right: the nodal rate against inclination for the chosen altitude. The dot is **measured** by numerically integrating one day of motion in the full $J_2$ field and fitting the drift of the osculating node; the curve is the formula. Set $i \approx 98^\circ$: the dot meets the Sun-synchronous line and the angle between orbit plane and Sun stops changing. Switch $J_2$ off and the plane stays fixed in space while the Sun goes round.`,
      deps: ['astro-1.1', 'mech-8.11'],
      refs: ['Murray–Dermott §6.11'],
      tags: ['satellites', 'precession', 'oblateness'],
      viz(v) {
        const MU = 398600.4418, RE = 6378.137, J2V = 1.08263e-3, SUN = 360 / 365.2422; // km³/s², km, deg/day
        const hS = v.slider('altitude (km)', 300, 2000, 700, { step: 10 });
        const iS = v.slider('inclination $i$', 0, 180, 98.2, { step: 0.1, fmt: (x) => `${v.fix(x, 1)}°` });
        const j2 = v.toggle('$J_2$ (oblate Earth)', true);
        const S = v.stage({ x: [-1.7, 1.7], y: [-1.45, 1.45], equal: true, axes: false, height: 360, weight: 1.15, title: 'one year in 15 seconds' });
        const g = v.stage({ x: [0, 180], y: [-12, 12], axes: 'box', height: 360, weight: 1, xlabel: 'inclination i (°)', ylabel: 'nodal rate dΩ/dt (°/day)', title: 'regression of the node' });
        const sc = v.scene3(S, { yaw: -0.6, pitch: 0.38, axes: false });
        const rate = (a, inc) => (j2.value ? ((-1.5 * Math.sqrt(MU / a ** 3) * J2V * (RE / a) ** 2 * Math.cos(inc)) * 86400) / DEG : 0);
        const cache = memo();
        // integrate one day (or ≥ 10 orbits) in the J2 field, return the fitted nodal rate
        const measure = () => cache(`${hS.value}|${iS.value}|${j2.value}`, () => {
          const a = RE + hS.value, inc = iS.value * DEG, vc = Math.sqrt(MU / a), J = j2.value ? J2V : 0;
          let s = [a, 0, 0, 0, vc * Math.cos(inc), vc * Math.sin(inc)];
          const f = (y) => {
            const [x, yy, z] = y, r2 = x * x + yy * yy + z * z, r = Math.sqrt(r2), k = -MU / (r2 * r), q = 1.5 * J * MU * RE * RE / (r2 * r2 * r), z2 = (z * z) / r2;
            return [y[3], y[4], y[5], k * x - q * x * (1 - 5 * z2), k * yy - q * yy * (1 - 5 * z2), k * z - q * z * (3 - 5 * z2)];
          };
          const Tor = TAU * Math.sqrt(a ** 3 / MU), N = Math.max(10, Math.ceil(86400 / Tor)), T = N * Tor, steps = N * 160, h = T / steps;
          const ts = [], Om = [];
          let prev = null, off = 0;
          for (let k = 0; k <= steps; k++) {
            if (k % 4 === 0) {
              const hx = s[1] * s[5] - s[2] * s[4], hy = s[2] * s[3] - s[0] * s[5];
              let O = Math.atan2(hx, -hy) / DEG;
              if (prev != null) { while (O + off - prev > 180) off -= 360; while (O + off - prev < -180) off += 360; }
              prev = O + off; ts.push((k * h) / 86400); Om.push(prev);
            }
            if (k === steps) break;
            const k1 = f(s), s2 = s.map((c, j) => c + 0.5 * h * k1[j]), k2 = f(s2), s3 = s.map((c, j) => c + 0.5 * h * k2[j]), k3 = f(s3), s4 = s.map((c, j) => c + h * k3[j]), k4 = f(s4);
            s = s.map((c, j) => c + (h / 6) * (k1[j] + 2 * k2[j] + 2 * k3[j] + k4[j]));
          }
          const fit = v.M.linreg(ts, Om);
          return { rate: inc < 1e-3 || Math.abs(inc - Math.PI) < 1e-3 ? NaN : fit.slope, N, Tor };
        });
        let cur = null;
        v.animate((t) => {
          const a = RE + hS.value, inc = iS.value * DEG, day = (t / 15) * 365.25, M = measure();
          const r0 = isFinite(M.rate) ? M.rate : rate(a, inc), Om = (r0 * day) * DEG, lamS = (SUN * day) * DEG;
          const R = 0.62, ro = 1.22; // the Earth is drawn small so the orbit can be seen (not to scale)
          sc.begin();
          // Earth: equator disc, latitude circles and meridians
          sc.disc([1, 0, 0], [0, 1, 0], R, { fill: 'blue', fillAlpha: 0.16, color: 'blue', width: 1 });
          for (const lat of [-60, -30, 30, 60]) { const c = Math.cos(lat * DEG), z = Math.sin(lat * DEG), q = []; for (let k = 0; k <= 48; k++) { const u = (TAU * k) / 48; q.push([R * c * Math.cos(u), R * c * Math.sin(u), R * z]); } sc.path(q, { color: 'blue', width: 0.8, alpha: 0.35 }); }
          for (let m = 0; m < 6; m++) { const L = (m * Math.PI) / 6, q = []; for (let k = 0; k <= 48; k++) { const u = (TAU * k) / 48; q.push([R * Math.cos(u) * Math.cos(L), R * Math.cos(u) * Math.sin(L), R * Math.sin(u)]); } sc.path(q, { color: 'blue', width: 0.8, alpha: 0.35 }); }
          sc.line([0, 0, -0.95], [0, 0, 0.95], { color: 'muted', width: 1.2 }, 6);
          // orbit plane at this date
          const n = [Math.cos(Om), Math.sin(Om), 0], u = [-Math.sin(Om) * Math.cos(inc), Math.cos(Om) * Math.cos(inc), Math.sin(inc)];
          const q = []; for (let k = 0; k <= 96; k++) { const th = (TAU * k) / 96; q.push([ro * (Math.cos(th) * n[0] + Math.sin(th) * u[0]), ro * (Math.cos(th) * n[1] + Math.sin(th) * u[1]), ro * Math.sin(th) * u[2]]); }
          sc.poly(q.filter((_, k) => k % 3 === 0), { fill: 'accent', fillAlpha: 0.1, edge: false });
          sc.path(q, { color: 'accent', width: 2.2 });
          sc.line([-ro * n[0], -ro * n[1], 0], [ro * n[0], ro * n[1], 0], { color: 'orange', width: 1.6 }, 8);
          sc.dot([ro * n[0], ro * n[1], 0], { r: 4.5, color: 'orange' });
          // the Sun direction
          const sd = [Math.cos(lamS), Math.sin(lamS), 0];
          sc.arrow([0, 0, 0], [1.55 * sd[0], 1.55 * sd[1], 0], { color: 'gold', width: 2.4, head: 9 });
          sc.dot([1.6 * sd[0], 1.6 * sd[1], 0], { r: 7, color: 'gold' });
          sc.flush();
          const ang = (((Om - lamS) / DEG) % 360 + 540) % 360 - 180;
          S.corner(`day ${Math.floor(day)}: node − Sun = ${v.fix(ang, 1)}°`, 'tl', { color: 'muted', size: 12 });
          S.corner('Earth and orbit not to scale', 'bl', { color: 'faint', size: 10.5 });
          // rate vs inclination
          const lim = Math.max(2, Math.abs(rate(a, 0)) * 1.15);
          g.setView([0, 180], [-lim, lim]);
          g.hline(0, { color: 'faint', width: 1 });
          g.hline(SUN, { color: 'gold', width: 1.4, dash: [6, 4] });
          g.text('Sun-synchronous: +0.9856°/day', 4, SUN, { color: 'gold', size: 10.5, dy: -9, align: 'left' });
          g.fn((x) => rate(a, x * DEG), { color: 'accent', width: 2.2 });
          if (isFinite(M.rate)) g.dot(iS.value, M.rate, { r: 6, color: 'red' });
          // Sun-synchronous inclination for this altitude
          const cosI = -SUN / ((1.5 * Math.sqrt(MU / a ** 3) * J2V * (RE / a) ** 2 * 86400) / DEG);
          const iSSO = Math.abs(cosI) <= 1 ? Math.acos(cosI) / DEG : NaN;
          if (isFinite(iSSO) && j2.value) { g.vline(iSSO, { color: 'gold', width: 1, alpha: 0.6, dash: [2, 3] }); g.text(`${v.fix(iSSO, 2)}°`, iSSO, -lim, { color: 'gold', size: 10.5, dy: -10, align: 'center' }); }
          cur = { M, a, inc, iSSO, ang };
        }, { period: 15, still: 6 });
        v.legend([['accent', 'orbit plane; formula $-\\tfrac32 nJ_2(R/a)^2\\cos i$'], ['orange', 'line of nodes'], ['red', 'rate measured from the integration', { dot: true }], ['gold', 'direction of the Sun']]);
        v.readout(() => {
          if (!cur) return '';
          const { M, a, inc, iSSO } = cur, F = rate(a, inc);
          let out = String.raw`$a = ${v.fix(a, 0)}$ km, period ${v.fix(M.Tor / 60, 1)} min · integrated ${M.N} orbits: measured $\dot\Omega = ${isFinite(M.rate) ? v.fix(M.rate, 4) : '—'}$ °/day, formula ${v.fix(F, 4)} °/day${isFinite(M.rate) && Math.abs(F) > 1e-3 ? ` (agree to ${v.fix(Math.abs(M.rate / F - 1) * 100, 1)}%: the formula is first order in $J_2$ and treats the starting state as mean elements)` : ''}`;
          if (!j2.value) return out + ' · spherical Earth: the orbit plane is fixed in inertial space, so the Sun’s direction sweeps round it once a year';
          out += String.raw` · Sun-synchronous at $i = ${isFinite(iSSO) ? v.fix(iSSO, 2) + '^\\circ' : '\\text{(none)}'}$`;
          if (isFinite(iSSO) && Math.abs(iS.value - iSSO) < 0.3) out += ' — the plane now turns with the Sun: the same local solar time at every equator crossing, year round';
          else if (Math.abs(iS.value - 90) < 0.05) out += ' — polar orbit: no precession';
          return out;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 1.8
    {
      num: '1.8',
      kind: 'Hypothesis',
      name: 'Titius–Bode rule',
      statement: String.raw`The **Titius–Bode rule** (Titius 1766, publicised by Bode 1772) says that the planets’ semi-major axes in AU follow
$$a_n = 0.4 + 0.3\times 2^n,\qquad n = -\infty, 0, 1, 2, \dots$$
It fitted the six planets known at the time and seemed to be confirmed by Uranus (1781, predicted 19.6 AU, actual 19.2) and Ceres (1801, in the “gap” at 2.8 AU), but it fails for Neptune (38.8 predicted, 30.1 actual). There is no accepted dynamical derivation: roughly geometric spacing is what one expects of any system in which planets cannot sit too close together, and randomly generated systems obeying a minimum-spacing rule fit geometric laws about as well as the solar system does (Hayes & Tremaine 1998).`,
      idea: String.raw`A rule with three adjustable numbers fitted to a handful of increasing values can look impressive by chance, so the right test is statistical: compare the solar system’s fit with the fits achieved by systems generated *without* any law. Orbital stability forbids neighbouring planets from being closer than a few mutual Hill radii, which already makes the spacing roughly proportional to distance — i.e. geometric (orbital elements, 1.1, and the Hill sphere, 2.5). Whatever regularity remains is then not evidence for a law.`,
      caption: String.raw`Left: actual semi-major axes (filled) against the rule (hollow) on a log scale, with the percentage error; Neptune and Pluto break it. The dashed line is the best pure geometric law $a_n = AB^n$ for Mercury to Neptune with Ceres. Right: the same fit applied to 2000 random 9-planet systems whose planets are scattered at random in $\log a$ between 0.3 and 40 AU, subject only to a minimum ratio between neighbours (slider). The red line is the solar system. Press *new random system* to see one of them on the left. With the spacing set to the solar system’s own tightest pair (Earth/Venus, 1.38) about a quarter of the random systems fit as well as ours — a pattern, but no evidence of a law.`,
      deps: ['astro-1.1'],
      see: ['astro-2.5'],
      refs: ['Murray–Dermott §1.5'],
      tags: ['solar system', 'statistics', 'history'],
      credit: 'Titius, 1766; Bode, 1772',
      viz(v) {
        const PLAN = [['Mercury', 0.387, -Infinity], ['Venus', 0.723, 0], ['Earth', 1.0, 1], ['Mars', 1.524, 2], ['Ceres', 2.767, 3], ['Jupiter', 5.204, 4], ['Saturn', 9.583, 5], ['Uranus', 19.19, 6], ['Neptune', 30.07, 7], ['Pluto', 39.48, 8]];
        const kS = v.slider('minimum ratio of neighbouring a', 1.0, 1.6, 1.383, { step: 0.01 });
        const show = v.toggle('overlay a random system', false);
        let seed = 1;
        v.button('new random system', () => { seed++; showRand = true; });
        let showRand = false;
        const L = v.stage({ x: [-0.8, 9.5], y: [0.25, 160], ylog: true, axes: 'box', height: 340, weight: 1.2, xlabel: 'index n in the rule', ylabel: 'semi-major axis (AU)', title: 'the rule against the planets' });
        const R = v.stage({ x: [0, 0.25], y: [0, 1], axes: 'box', height: 340, weight: 1, xlabel: 'rms misfit of the best geometric law (dex)', ylabel: 'fraction of random systems', title: 'is our fit special?' });
        const fitGeo = (as) => { const xs = as.map((_, k) => k), ys = as.map((a) => Math.log10(a)), f = v.M.linreg(xs, ys); const rms = Math.sqrt(ys.reduce((s, y, k) => s + (y - f.predict(k)) ** 2, 0) / ys.length); return { f, rms }; };
        const solar = PLAN.slice(0, 9).map((p) => p[1]), SF = fitGeo(solar);
        const gen = (r, k) => {
          // 9 points uniform in log a on [log 0.3, log 40] with every gap ≥ log k (exact: uniform order statistics on a shortened interval, then spread)
          const lo = Math.log10(0.3), hi = Math.log10(40), g = Math.log10(k), Lr = hi - lo - 8 * g;
          if (Lr <= 0) return null;
          const u = Array.from({ length: 9 }, () => r() * Lr).sort((a, b) => a - b);
          return u.map((x, j) => 10 ** (lo + x + j * g));
        };
        const cache = memo();
        const sample = () => cache(kS.value, () => {
          const r = v.rng(4242), out = [];
          for (let j = 0; j < 2000; j++) { const s = gen(r, kS.value); if (s) out.push(fitGeo(s).rms); }
          return out;
        });
        v.render(() => {
          // left: rule vs planets
          for (let n = 0; n < PLAN.length; n++) {
            const [nm, a, m] = PLAN[n], tb = 0.4 + 0.3 * (m === -Infinity ? 0 : 2 ** m), bad = Math.abs(a / tb - 1) > 0.1;
            L.line(n, a, n, tb, { color: bad ? 'red' : 'faint', width: bad ? 2 : 1.2 });
            L.dot(n, tb, { r: 6, hollow: true, color: 'ink', width: 1.6 });
            L.dot(n, a, { r: 5, color: bad ? 'red' : 'accent' });
            L.text(nm, n, Math.min(a, tb), { color: bad ? 'red' : 'muted', size: 10, dy: 14, align: 'center' });
            L.text(`${a > tb ? '+' : '−'}${v.fix(Math.abs(a / tb - 1) * 100, 0)}%`, n, Math.max(a, tb), { color: bad ? 'red' : 'muted', size: 10, dy: -12, align: 'center' });
          }
          L.fn((x) => 10 ** SF.f.predict(x), { domain: [-0.3, 8.3], color: 'green', width: 1.4, dash: [6, 4] });
          L.setTicks(PLAN.map((p, n) => [n, p[2] === -Infinity ? '−∞' : String(p[2])]), null);
          if (show.value || showRand) {
            const r = v.rng(seed * 977), s = gen(r, kS.value);
            if (s) { const F = fitGeo(s); s.forEach((a, j) => L.dot(j, a, { r: 4, color: 'purple' })); L.fn((x) => 10 ** F.f.predict(x), { domain: [-0.3, 8.3], color: 'purple', width: 1.2, dash: [2, 3] }); L.corner(`random system #${seed}: rms ${v.fix(F.rms, 3)} dex`, 'tl', { color: 'purple', size: 11.5 }); }
          }
          // right: histogram of random-system misfits
          const xs = sample(); let ytop = 0.05;
          if (xs.length) {
            const Hh = v.M.histogram(xs, { bins: 40, range: [0, 0.25] }), tot = xs.length, fr = { edges: Hh.edges, counts: Hh.counts.map((c) => c / tot) };
            const ymax = Math.max(...fr.counts) * 1.4;
            ytop = Math.max(0.05, ymax); R.setView([0, 0.25], [0, ytop]);
            R.hist(fr, { color: 'purple', fillAlpha: 0.35 });
          } else R.text('spacing too large to fit 9 planets', 0.125, 0.5, { color: 'red', align: 'center' });
          R.vline(SF.rms, { color: 'red', width: 2 });
          R.text('solar system', SF.rms, ytop * 0.93, { color: 'red', size: 10.5, dx: 5, align: 'left' });
        });
        v.legend([['accent', 'actual a', { dot: true }], ['ink', 'Titius–Bode prediction', { dot: true }], ['green', 'best geometric law', { dash: true }], ['purple', 'random spaced systems']]);
        v.readout(() => {
          const xs = sample(), better = xs.filter((x) => x <= SF.rms).length;
          const med = xs.length ? v.M.median(xs) : NaN;
          return String.raw`Titius–Bode: Uranus off by ${v.fix(Math.abs(19.19 / 19.6 - 1) * 100, 1)}%, Neptune by ${v.fix(Math.abs(30.07 / 38.8 - 1) * 100, 0)}% · best geometric law for Mercury–Neptune (with Ceres): ratio $B = ${v.fix(10 ** SF.f.slope, 3)}$, rms misfit ${v.fix(SF.rms, 3)} dex (${v.fix((10 ** SF.rms - 1) * 100, 0)}% typical error) · random systems with neighbour ratio ≥ ${v.fix(kS.value, 2)}: median misfit ${v.fix(med, 3)} dex, and ${v.fix((100 * better) / Math.max(1, xs.length), 1)}% fit at least as well as the solar system${Math.abs(kS.value - 1.383) < 0.006 ? ' (spacing set to the solar system’s own tightest pair, Earth/Venus = 1.38)' : ''}${kS.value < 1.05 ? ' — with no spacing rule at all, random systems are lumpier and fit worse' : ''}`;
        });
      },
    },
  ],
};
