// Numerical Analysis — Chapter 1 (floating point): helpers shared by ch01.js and ch01-b.js.
// Everything here is real IEEE-754 arithmetic: bit patterns come from DataView, and the narrower formats
// (binary16, binary32) are emulated by rounding each operation exactly to their grid.

export const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
export const logspace = (a, b, n) => Array.from({ length: n }, (_, i) => a * (b / a) ** (i / (n - 1)));
const SUP = '⁰¹²³⁴⁵⁶⁷⁸⁹';
export const sup = (n) => String(n).split('').map((d) => (d === '-' ? '⁻' : SUP[+d])).join('');
/** Plain-text scientific notation 1.23×10⁻⁵ (real minus). */
export function sci(x, d = 3) {
  if (x === 0) return '0'; if (!isFinite(x)) return x > 0 ? '∞' : '−∞';
  const [m, e] = x.toExponential(d - 1).split('e'); const k = +e;
  return `${m.replace('-', '−')}×10${sup(k)}`;
}
/** TeX scientific notation. */
export function tsci(x, d = 3) {
  if (x === 0) return '0'; if (!isFinite(x)) return x > 0 ? '\\infty' : '-\\infty';
  const [m, e] = x.toExponential(d - 1).split('e');
  return +e === 0 ? m : `${m}\\times10^{${+e}}`;
}

// ---------------------------------------------------------------- formats
export const FORMATS = {
  half: { key: 'half', name: 'binary16', short: 'half', eb: 5, fb: 10, bias: 15, p: 11 },
  single: { key: 'single', name: 'binary32', short: 'single', eb: 8, fb: 23, bias: 127, p: 24 },
  double: { key: 'double', name: 'binary64', short: 'double', eb: 11, fb: 52, bias: 1023, p: 53 },
};
for (const f of Object.values(FORMATS)) { f.u = 2 ** -f.p; f.eps = 2 ** -(f.p - 1); f.emin = 1 - f.bias; f.emax = f.bias; f.max = (2 - 2 ** -f.fb) * 2 ** f.bias; f.tiny = 2 ** f.emin; f.sub = 2 ** (f.emin - f.fb); }

const dv = new DataView(new ArrayBuffer(8));
/** Unbiased binary exponent of a positive finite double (exact, also for subnormals). */
export function floorLog2(a) {
  dv.setFloat64(0, a); const E = (dv.getUint32(0) >>> 20) & 0x7ff;
  if (E) return E - 1023;
  let e = -1023, m = a; while (m < 2 ** -1022) { m *= 2; e--; } return e + 1;
}
const rne = (q) => { const f = Math.floor(q), d = q - f; return d < 0.5 ? f : d > 0.5 ? f + 1 : (f % 2 === 0 ? f : f + 1); };
/**
 * Round the double x to format fmt (default: round to nearest, ties to even). mode: 'near' | 'zero' | 'up' | 'down' | 'away'.
 * Overflow gives ±Infinity (or the largest finite number for directed modes that round toward zero).
 */
export function rnd(x, fmt, mode = 'near') {
  if (fmt === FORMATS.double || !isFinite(x) || x === 0) return x;
  const neg = x < 0, a = Math.abs(x);
  const e = Math.max(floorLog2(a), fmt.emin), ulp = 2 ** (e - fmt.fb), q = a / ulp, f = Math.floor(q), d = q - f;
  let m;
  if (mode === 'near') m = d < 0.5 ? f : d > 0.5 ? f + 1 : (f % 2 === 0 ? f : f + 1);
  else if (mode === 'away') m = d < 0.5 ? f : f + 1;
  else if (mode === 'zero') m = f;
  else if (mode === 'up') m = neg ? f : (d > 0 ? f + 1 : f);
  else m = neg ? (d > 0 ? f + 1 : f) : f;
  let r = m * ulp;
  if (r > fmt.max) r = (mode === 'zero' || (mode === 'up' && neg) || (mode === 'down' && !neg)) ? fmt.max : Infinity;
  return neg ? -r : r;
}
/** Operation helpers for emulated arithmetic in format fmt. */
export const mkOps = (fmt) => {
  const r = (x) => rnd(x, fmt);
  return { r, add: (a, b) => r(a + b), sub: (a, b) => r(a - b), mul: (a, b) => r(a * b), div: (a, b) => r(a / b), sqrt: (a) => r(Math.sqrt(a)) };
};

// ---------------------------------------------------------------- bit patterns
/** Bits (array of 0/1, index 0 = sign) of x stored in fmt; x is first rounded to nearest. */
export function encode(x, fmt) {
  const n = 1 + fmt.eb + fmt.fb, bits = new Array(n).fill(0);
  const neg = x < 0 || Object.is(x, -0); bits[0] = neg ? 1 : 0;
  const setField = (from, len, val) => { let b = BigInt(val); for (let i = len - 1; i >= 0; i--) { bits[from + i] = Number(b & 1n); b >>= 1n; } };
  if (Number.isNaN(x)) { setField(1, fmt.eb, (1n << BigInt(fmt.eb)) - 1n); setField(1 + fmt.eb, fmt.fb, 1n << BigInt(fmt.fb - 1)); return bits; }
  const a = rnd(Math.abs(x), fmt);
  if (a === Infinity) { setField(1, fmt.eb, (1n << BigInt(fmt.eb)) - 1n); return bits; }
  if (a === 0) return bits;
  const e = floorLog2(a);
  if (e < fmt.emin) { setField(1 + fmt.eb, fmt.fb, a / 2 ** (fmt.emin - fmt.fb)); return bits; }
  setField(1, fmt.eb, e + fmt.bias);
  setField(1 + fmt.eb, fmt.fb, (a / 2 ** e - 1) * 2 ** fmt.fb);
  return bits;
}
const bitsBig = (bits, from, len) => { let b = 0n; for (let i = 0; i < len; i++) b = (b << 1n) | BigInt(bits[from + i]); return b; };
export const fieldsOf = (bits, fmt) => ({ s: bits[0], E: Number(bitsBig(bits, 1, fmt.eb)), F: bitsBig(bits, 1 + fmt.eb, fmt.fb) });
/** Value of a bit pattern. */
export function decode(bits, fmt) {
  const { s, E, F } = fieldsOf(bits, fmt), sg = s ? -1 : 1, top = (1 << fmt.eb) - 1;
  if (E === top) return F === 0n ? sg * Infinity : NaN;
  if (E === 0) return sg * Number(F) * 2 ** (fmt.emin - fmt.fb);
  return sg * (1 + Number(F) / 2 ** fmt.fb) * 2 ** (E - fmt.bias);
}
/** Neighbouring representable numbers of the finite value a >= 0 (a must be representable). */
export function succ(a, fmt) { const b = encode(a, fmt); const n = bitsBig(b, 0, b.length) + 1n; return fromBig(n, fmt); }
export function pred(a, fmt) { const b = encode(a, fmt); const n = bitsBig(b, 0, b.length) - 1n; return fromBig(n, fmt); }
function fromBig(n, fmt) { const len = 1 + fmt.eb + fmt.fb, bits = []; for (let i = len - 1; i >= 0; i--) bits.push(Number((n >> BigInt(i)) & 1n)); return decode(bits, fmt); }
/** Next float above / below any representable x. */
export const nextUp = (x, fmt) => (x === 0 ? fmt.sub : x > 0 ? succ(x, fmt) : -pred(-x, fmt));
export const nextDown = (x, fmt) => -nextUp(-x, fmt);
/** Spacing of the floats around |x| (ulp of x in format fmt). */
export const ulpOf = (x, fmt) => 2 ** (Math.max(floorLog2(Math.abs(x) || fmt.tiny), fmt.emin) - fmt.fb);

// ---------------------------------------------------------------- exact arithmetic with BigInt
/** x = m · 2^e exactly (m BigInt). */
export function decomp(x) {
  if (x === 0) return { m: 0n, e: 0 };
  dv.setFloat64(0, x); const hi = dv.getUint32(0), lo = dv.getUint32(4);
  const E = (hi >>> 20) & 0x7ff; let m = (BigInt(hi & 0xfffff) << 32n) | BigInt(lo);
  let e; if (E) { m |= 1n << 52n; e = E - 1075; } else e = -1074;
  return { m: hi >>> 31 ? -m : m, e };
}
const bitLen = (b) => (b < 0n ? -b : b).toString(2).length;
/** Number(a / b) for BigInts, accurate to double precision for any sizes. */
export function ratioNum(a, b) {
  if (a === 0n) return 0;
  const sg = (a < 0n) !== (b < 0n) ? -1 : 1; a = a < 0n ? -a : a; b = b < 0n ? -b : b;
  const sh = 70 - (bitLen(a) - bitLen(b));
  const q = sh >= 0 ? (a << BigInt(sh)) / b : a / (b << BigInt(-sh));
  let r = Number(q), k = -sh; // value = r · 2^k, do the scaling in two steps to avoid under/overflow
  const h = Math.trunc(k / 2); return sg * r * 2 ** h * 2 ** (k - h);
}
/** Exact sum of doubles: {n, e} with value n·2^e. */
export function exactSum(arr) {
  const ds = arr.map(decomp); let emin = Infinity; for (const d of ds) if (d.m !== 0n && d.e < emin) emin = d.e;
  if (emin === Infinity) return { n: 0n, e: 0 };
  let n = 0n; for (const d of ds) n += d.m << BigInt(d.e - emin);
  return { n, e: emin };
}
export function ratOfDouble(x) { const d = decomp(x); return d.e >= 0 ? { N: d.m << BigInt(d.e), D: 1n } : { N: d.m, D: 1n << BigInt(-d.e) }; }
/** Exact rational of a plain decimal literal like "0.1", "-12.5e-3", or null. */
export function ratOfLiteral(str) {
  const m = /^\s*([+-]?)(\d*)\.?(\d*)(?:e([+-]?\d+))?\s*$/i.exec(str);
  if (!m || (!m[2] && !m[3])) return null;
  let exp10 = (m[4] ? +m[4] : 0) - m[3].length; if (Math.abs(exp10) > 400 || m[2].length + m[3].length > 400) return null;
  let N = BigInt((m[2] || '0') + (m[3] || '')); let D = 1n;
  if (exp10 >= 0) N *= 10n ** BigInt(exp10); else D = 10n ** BigInt(-exp10);
  return { N: m[1] === '-' ? -N : N, D };
}
export const ratSub = (a, b) => ({ N: a.N * b.D - b.N * a.D, D: a.D * b.D });
export const ratAdd = (a, b) => ({ N: a.N * b.D + b.N * a.D, D: a.D * b.D });
export const ratNum = (a) => ratioNum(a.N, a.D);
/** Sign of x − R, exactly. */
export const cmpRat = (x, R) => { const r = ratOfDouble(x); const d = r.N * R.D - R.N * r.D; return d > 0n ? 1 : d < 0n ? -1 : 0; };
/** Number(x − exact) where exact = {n, e}. */
export function errVs(x, ex) {
  const d = decomp(x), e0 = Math.min(ex.e, d.m === 0n ? ex.e : d.e);
  const D = (d.m << BigInt(d.e - e0)) - (ex.n << BigInt(ex.e - e0));
  return Number(D) * 2 ** e0;
}
/** Exact decimal expansion of a finite double, no trailing zeros ("0.1000000000000000055511151231257827…"). */
export function exactDecimal(x) {
  if (x === 0) return '0';
  const { m, e } = decomp(Math.abs(x)); let s;
  if (e >= 0) s = (m << BigInt(e)).toString();
  else {
    const digits = (m * 5n ** BigInt(-e)).toString().padStart(-e + 1, '0');
    const ip = digits.slice(0, digits.length + e), fp = digits.slice(digits.length + e).replace(/0+$/, '');
    s = fp ? `${ip}.${fp}` : ip;
  }
  return (x < 0 ? '−' : '') + s;
}
/** Truncate a long decimal string to at most k characters, adding "…". */
export const clip = (s, k) => (s.length > k ? s.slice(0, k) + '…' : s);

// ---------------------------------------------------------------- summation algorithms
export function naiveSum(a, ops) { const r = ops ? ops.r : (x) => x; let s = 0; for (let i = 0; i < a.length; i++) s = r(s + a[i]); return s; }
export function kahanSum(a, ops) {
  const r = ops ? ops.r : (x) => x; let s = 0, c = 0;
  for (let i = 0; i < a.length; i++) { const y = r(a[i] - c), t = r(s + y); c = r(r(t - s) - y); s = t; }
  return s;
}
export function pairwiseSum(a, lo = 0, hi = a.length, ops) {
  const n = hi - lo; if (n <= 2) { let s = 0; for (let i = lo; i < hi; i++) s = ops ? ops.r(s + a[i]) : s + a[i]; return s; }
  const mid = lo + (n >> 1); const x = pairwiseSum(a, lo, mid, ops), y = pairwiseSum(a, mid, hi, ops); return ops ? ops.r(x + y) : x + y;
}
/** Error-free transformation: s + x = t + err exactly. */
export function twoSum(s, x) { const t = s + x, bp = t - s; return [t, (s - (t - bp)) + (x - bp)]; }
export function twoProd(a, b) {
  const sp = (x) => { const c = 134217729 * x, hi = c - (c - x); return [hi, x - hi]; };
  const p = a * b, [ah, al] = sp(a), [bh, bl] = sp(b);
  return [p, ((ah * bh - p) + ah * bl + al * bh) + al * bl];
}

// ---------------------------------------------------------------- stage helpers
/** Make stage s a pixel canvas (x to the right, y UP from the bottom); returns {w, h, Y} where Y(py) converts a top-down pixel row. */
export function px(s) { const w = s.width, h = s.height; s.setView([0, w], [0, h]); return { w, h, Y: (py) => h - py }; }
/** Exact value of an {n, e} exact sum as a double. */
export const exNum = (ex) => ratioNum(ex.n, 1n) * 2 ** ex.e;
/** Integer square root of a BigInt. */
export function isqrt(n) { if (n < 2n) return n; let x = 1n << BigInt((bitLen(n) >> 1) + 1); for (;;) { const y = (x + n / x) >> 1n; if (y >= x) return x; x = y; } }
