import {clamp} from './ch04.shared.js';
// ── 4.1 helpers ─────────────────────────────────────────────────────────────────────────────────────────────────────────
// [name, age from Ma, age to Ma, cm3 low, cm3 high, colour, label x, label y]  (rounded, indicative)
export const HOMININS = [
  ['A. afarensis', 3.9, 3.0, 400, 550, 'orange', -3.45, 595, 'center'],
  ['A. africanus', 3.0, 2.0, 420, 600, 'teal', -2.7, 685, 'center'],
  ['P. boisei', 2.3, 1.2, 480, 550, 'purple', -1.45, 440, 'center'],
  ['H. habilis', 2.3, 1.65, 500, 700, 'gold', -1.75, 765, 'right'],
  ['H. erectus', 1.9, 0.1, 550, 1100, 'accent', -1.0, 800, 'center'],
  ['H. heidelbergensis', 0.7, 0.2, 1100, 1400, 'pink', 0.05, 1260, 'left'],
  ['H. neanderthalensis', 0.43, 0.04, 1200, 1750, 'red', 0.05, 1680, 'left'],
  ['H. sapiens', 0.3, 0, 1100, 1750, 'green', 0.05, 1470, 'left'],
];
export const BIPED = [[-4.4, 'Ardipithecus', 150], [-3.66, 'Laetoli footprints', 215], [-3.2, '“Lucy”', 150]];
export const kleiber = (kg) => 3.39 * kg ** 0.75;       // basal metabolic rate, W
export const brainW = (cc) => 0.0112 * cc;             // 11.2 W/kg, with illustrative1g/cm3 volume-to-mass conversion

// ── 4.2 helpers: caricature orbital elements, t in kyr (negative = past) ───────────────────────────────────────────────────
const D2R = Math.PI / 180;
const ECC = [[0.011, 405], [0.0083, 124], [0.0077, 95]];
const ECC_PH = (() => {
  const ph = [0, 1.0, 2.3];
  ph[0] = Math.acos(clamp((0.0167 - 0.028 - ECC[1][0] * Math.cos(ph[1]) - ECC[2][0] * Math.cos(ph[2])) / ECC[0][0], -1, 1));
  return ph;
})();
export const eccT = (t) => 0.028 + ECC.reduce((s, [A, P], k) => s + A * Math.cos((2 * Math.PI * t) / P + ECC_PH[k]), 0);
export const oblT = (t) => 23.34 + 1.2 * Math.cos((2 * Math.PI * t) / 41 + 1.49);
export const varpiT = (t) => 283 * D2R + (2 * Math.PI * t) / 21;
/** Daily-mean insolation at the summer solstice, W/m2, latitude `lat` (degrees). */
export function solsticeQ(t, lat) {
  const e = eccT(t), E = oblT(t) * D2R, w = varpiT(t), phi = lat * D2R;
  const rho = (1 + e * Math.sin(w)) / (1 - e * e);
  const ch = -Math.tan(phi) * Math.tan(E);
  const h0 = ch >= 1 ? 0 : ch <= -1 ? Math.PI : Math.acos(ch);
  return (1361 / Math.PI) * rho * rho * (h0 * Math.sin(phi) * Math.sin(E) + Math.cos(phi) * Math.cos(E) * Math.sin(h0));
}

// ── 4.3 helpers ─────────────────────────────────────────────────────────────────────────────────────────────────────────
// [name, lon, lat, age in ka, group, note]
export const SITES = [
  ['Jebel Irhoud', -8.9, 31.9, 315, 'africa', 'early H. sapiens'],
  ['Omo Kibish', 35.9, 5.4, 233, 'africa', 'Omo I predates ash233±22ka(2σ); not a direct fossil date'],
  ['Misliya', 35.0, 32.7, 185, 'levant', 'upper jaw, 177–194 ka'],
  ['Qafzeh', 35.3, 32.7, 100, 'levant', 'rounded'],
  ['Madjedbebe', 132.9, -12.6, 65, 'sahul', 'contested; ≈50 ka widely used'],
  ['Lake Mungo', 143.1, -33.7, 42, 'sahul', 'rounded'],
  ['Bacho Kiro', 25.4, 42.9, 45, 'europe', 'before 45 ka'],
  ['Ust’-Ishim', 71.0, 57.7, 45, 'siberia', 'genome, 45 ka'],
  ['Tianyuan', 115.9, 39.6, 40, 'east', 'rounded'],
  ['White Sands', -106.2, 32.8, 22, 'america', '21–23 ka, contested'],
  ['Monte Verde', -73.2, -41.5, 14.5, 'america', 'rounded'],
];

/** Exact relaxation for each one-kyr piecewise-constant forcing interval; output includes the initial state. */
export function iceResponse(forcing,tauGrowth,tauMelt,dt=1,initial=0){const ice=[initial];let V=initial;for(let i=1;i<forcing.length;i++){const target=-forcing[i-1],tau=target>V?tauGrowth:tauMelt;V=target+(V-target)*Math.exp(-dt/tau);ice.push(V);}return ice;}
export function orbitalRun(latitude,tauGrowth,tauMelt,initial=0){const all=Array.from({length:6001},(_,i)=>solsticeQ(i-6000,latitude)),Q=all.slice(-2001),mean=Q.reduce((s,x)=>s+x,0)/Q.length,sd=Math.sqrt(Q.reduce((s,x)=>s+(x-mean)**2,0)/Q.length),forcing=all.map(q=>(q-mean)/sd),fullIce=iceResponse(forcing,tauGrowth,tauMelt,1,initial);return{Q,x:forcing.slice(-2001),ice:fullIce.slice(-2001),m:mean,sd};}
export function relativePower(amplitudes){const peak=Math.max(...amplitudes.slice(1));return amplitudes.map(a=>peak>0?(a/peak)**2:0);}
