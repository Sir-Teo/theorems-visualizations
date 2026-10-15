// Electromagnetism — Chapter 1: Charges, forces and Gauss's law (items 1.1–1.10; 1.11–1.19 in ch01-b.js)
//
// Units in the pictures: positions in cm, point charges in nC, line charges in nC/m, readouts in SI (v.M.si).

// ── shared helpers ────────────────────────────────────────────────────────────
const TAU = 2 * Math.PI;

/** Adaptive Simpson for a scalar f on [a, b] (non-finite samples count as 0). tol is absolute. */
function quad(f, a, b, tol = 1e-9, depth = 18, panels = 8) {
  const F = (x) => { const y = f(x); return isFinite(y) ? y : 0; };
  const S = (fa, fm, fb, h) => (h / 6) * (fa + 4 * fm + fb);
  const rec = (a, b, fa, fm, fb, whole, t, d) => {
    const m = (a + b) / 2, lm = (a + m) / 2, rm = (m + b) / 2, flm = F(lm), frm = F(rm);
    const L = S(fa, flm, fm, m - a), R = S(fm, frm, fb, b - m), diff = L + R - whole;
    if (d <= 0 || Math.abs(diff) <= 15 * t) return L + R + diff / 15;
    return rec(a, m, fa, flm, fm, L, t / 2, d - 1) + rec(m, b, fm, frm, fb, R, t / 2, d - 1);
  };
  let out = 0;
  for (let k = 0; k < panels; k++) {
    const x0 = a + ((b - a) * k) / panels, x1 = a + ((b - a) * (k + 1)) / panels, f0 = F(x0), f1 = F(x1), fm = F((x0 + x1) / 2);
    out += rec(x0, x1, f0, fm, f1, S(f0, fm, f1, x1 - x0), tol / panels, depth);
  }
  return out;
}
/** Adaptive Simpson for a 2-vector g(x) = [u, w] on [a, b]. */
function quad2(g, a, b, tol = 1e-9, depth = 18, panels = 8) {
  const G = (x) => { const r = g(x); return [isFinite(r[0]) ? r[0] : 0, isFinite(r[1]) ? r[1] : 0]; };
  const S = (fa, fm, fb, h) => [(h / 6) * (fa[0] + 4 * fm[0] + fb[0]), (h / 6) * (fa[1] + 4 * fm[1] + fb[1])];
  const rec = (a, b, fa, fm, fb, whole, t, d) => {
    const m = (a + b) / 2, flm = G((a + m) / 2), frm = G((m + b) / 2);
    const L = S(fa, flm, fm, m - a), R = S(fm, frm, fb, b - m), d0 = L[0] + R[0] - whole[0], d1 = L[1] + R[1] - whole[1];
    if (d <= 0 || (Math.abs(d0) <= 15 * t && Math.abs(d1) <= 15 * t)) return [L[0] + R[0] + d0 / 15, L[1] + R[1] + d1 / 15];
    const A = rec(a, m, fa, flm, fm, L, t / 2, d - 1), B = rec(m, b, fm, frm, fb, R, t / 2, d - 1);
    return [A[0] + B[0], A[1] + B[1]];
  };
  const out = [0, 0];
  for (let k = 0; k < panels; k++) {
    const x0 = a + ((b - a) * k) / panels, x1 = a + ((b - a) * (k + 1)) / panels, f0 = G(x0), f1 = G(x1), fm = G((x0 + x1) / 2);
    const r = rec(x0, x1, f0, fm, f1, S(f0, fm, f1, x1 - x0), tol / panels, depth);
    out[0] += r[0]; out[1] += r[1];
  }
  return out;
}
/** Integer with sign and thin-space digit groups: 31207553119 → '+31 207 553 119'. */
function groupInt(n) {
  const s = String(Math.abs(Math.round(n))).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return (n < 0 ? '−' : n > 0 ? '+' : '') + s;
}
/** Σ q (r − r_i)/|r − r_i|^{n+1} over sources {x, y, q} (cm, nC); times k·1e-9/(1e-2)^n gives N/C. */
function coul(src, x, y, n = 2) {
  let u = 0, w = 0;
  for (const s of src) {
    if (!s.q) continue;
    const dx = x - s.x, dy = y - s.y, r2 = dx * dx + dy * dy;
    if (r2 < 1e-16) return [NaN, NaN];
    const k = s.q / Math.pow(r2, (n + 1) / 2); u += k * dx; w += k * dy;
  }
  return [u, w];
}
/** Σ q/|r − r_i| (nC/cm); times k·1e-7 gives volts. */
function coulPot(src, x, y) { let p = 0; for (const s of src) if (s.q) p += s.q / Math.hypot(x - s.x, y - s.y); return p; }
/** Arrow of a given pixel length from data point (x, y) along (ux, uy) (equal-aspect stages). */
function arrowPx(s, x, y, ux, uy, len, st) {
  const L = Math.hypot(ux, uy); if (!(L > 0) || !(len > 0.5) || !isFinite(len)) return;
  s.arrow(x, y, x + ((ux / L) * len) / s.sx, y + ((uy / L) * len) / s.sy, st);
}
/** Length in px for a field arrow: logarithmic in |E|/ref, so 10× stronger is a fixed number of px longer. */
const logLen = (E, ref, base = 34, perDecade = 22, min = 6, max = 90) => Math.max(min, Math.min(max, base + perDecade * Math.log10(E / ref)));
/** Direction-field arrows on a pixel grid, length growing with log|F| between the 5th and 95th percentile. */
function quiver(s, v, F, st = {}) {
  const sp = st.spacing ?? 30, pts = [];
  for (let px = sp / 2; px < s.W; px += sp) for (let py = sp / 2; py < s.H; py += sp) {
    const [x, y] = s.inv(px, py), f = F(x, y), m = Math.hypot(f[0], f[1]);
    if (isFinite(m) && m > 0) pts.push([x, y, f[0] / m, f[1] / m, Math.log10(m)]);
  }
  if (!pts.length) return;
  const ls = pts.map((p) => p[4]).sort((a, b) => a - b), lo = ls[Math.floor(ls.length * 0.05)], hi = ls[Math.floor(ls.length * 0.95)];
  for (const [x, y, ux, uy, g] of pts) {
    const t = Math.max(0, Math.min(1, (g - lo) / (hi - lo || 1))), len = sp * (0.3 + 0.5 * t);
    const x0 = x - ((ux * len) / 2) / s.sx, y0 = y - ((uy * len) / 2) / s.sy;
    s.arrow(x0, y0, x0 + (ux * len) / s.sx, y0 + (uy * len) / s.sy, { color: st.color || 'accent', alpha: (st.alpha ?? 0.75) * (0.35 + 0.65 * t), width: 1.4, head: 6 });
  }
}
/** Filled arrowhead at data point q pointing from p to q. */
function headAt(s, v, p, q, color, alpha = 1, size = 7.5) {
  const X = s.X(q[0]), Y = s.Y(q[1]), dx = X - s.X(p[0]), dy = Y - s.Y(p[1]), L = Math.hypot(dx, dy); if (!L) return;
  const ux = dx / L, uy = dy / L, c = s.ctx; c.save(); c.fillStyle = v.color(color, alpha); c.beginPath();
  c.moveTo(X + ux * size * 0.55, Y + uy * size * 0.55); c.lineTo(X - ux * size * 0.45 - uy * size * 0.42, Y - uy * size * 0.45 + ux * size * 0.42);
  c.lineTo(X - ux * size * 0.45 + uy * size * 0.42, Y - uy * size * 0.45 - ux * size * 0.42); c.closePath(); c.fill(); c.restore();
}
const showStage = (S, on) => { S.el.hidden = !on; S.el.style.display = on ? '' : 'none'; };
const sgnCol = (q) => (q > 0 ? 'red' : q < 0 ? 'blue' : 'muted');
/** Signed charge in nC as text: '+4 nC'. */
const nC = (q) => (q > 0 ? '+' : q < 0 ? '−' : '') + String(+Math.abs(q).toFixed(2)) + ' nC';

export default {
  collection: 'em',
  chapter: 1,
  title: 'Charges, forces and Gauss’s law',
  summary: String.raw`Electric charge comes in two signs, in whole multiples of $e$, and is never created or destroyed on balance. Coulomb’s inverse-square law plus superposition is the whole of electrostatics: packaging the force as a field, and summing it over continuous distributions, gives the fields of lines, rings, disks, planes and dipoles. Counting field lines through closed surfaces gives Gauss’s law, which turns symmetric problems into one-line calculations and makes the field inside a charged shell vanish. That vanishing is also a precision test of the exponent 2, now known to one part in $10^{16}$; in differential form Gauss’s law says that the divergence of the field is the charge density — a delta distribution for a point charge.`,
  items: [
    // ───────────────────────────────────────────────────────────── 1.1
    {
      num: '1.1',
      kind: 'Phenomenon',
      name: 'Electric charge: two signs, quantized',
      statement: String.raw`Matter carries **electric charge**, which comes in two kinds, called positive and negative. Charges of the same sign repel and charges of opposite sign attract; a body holding equal amounts of both is **neutral**. Charge is **quantized**: every charge that has ever been isolated is a whole multiple of the **elementary charge**
$$e = 1.602\,176\,634\times10^{-19}\ \text{C}$$
(exact in the SI since 2019), carried by the proton ($+e$) and the electron ($-e$). Rubbing, touching and grounding only move electrons from one body to another, so the charge of any body is $q = Ne$ with $N$ an integer.`,
      idea: String.raw`Ordinary matter is built from protons and electrons whose charges are equal and opposite to better than one part in $10^{21}$, so a body is neutral unless electrons have been added or removed. Rubbing two materials moves a few billion electrons from one to the other (glass rubbed on silk ends up positive, amber rubbed on fur negative); touching lets electrons flow until two identical conductors share the total equally; grounding lets them flow to or from the Earth. Millikan (1909–1913) made the graininess visible: he timed tiny charged oil drops falling under gravity and rising in an electric field, used Stokes’s drag law to turn the speeds into charges, and found every charge to be a whole multiple of one value. (His $1.592\times10^{-19}$ C was 0.6 % low because of a wrong viscosity of air.) Quarks carry $\pm e/3$ and $\pm 2e/3$ but are never found alone.`,
      caption: String.raw`**Pith balls**: charge the balls with rubbed rods, touch them together, ground one. Each ball hangs where its weight, the thread tension and the Coulomb force balance; the counts stay whole numbers — when the total is odd, touching leaves one ball with one electron more. Opposite charges pull the balls together until they touch and share. **Oil drops**: each drop is timed falling with the field off and rising with it on; the histogram of the inferred charges piles up at multiples of one value, which the readout fits. Raise the timing error to smear the comb, or switch on charge “in any amount” to see what a continuous charge would look like.`,
      scope: String.raw`Millikan’s analysis uses Stokes’s law, which needs a small correction (Cunningham’s) for drops comparable to the mean free path of air molecules; the simulation leaves it out.`,
      credit: 'Du Fay, 1733 (two kinds); Millikan, 1909–1913 (quantization)',
      deps: [],
      refs: ['Purcell ch. 1', 'Feynman II ch. 1'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Oil_drop_experiment' },
      tags: ['charge', 'quantization'],
      viz(v) {
        const M = v.M, C = M.CONST, e = C.e, g = C.g0;
        const mode = v.select('', [{ value: 'balls', label: 'pith balls: rub, touch, ground' }, { value: 'drops', label: 'oil drops (Millikan)' }], 'balls');
        const sB = v.stage({ x: [-13, 13], y: [-15.6, 1.0], equal: true, height: 330, axes: false, full: true });
        const sA = v.stage({ x: [-1.3, 1.3], y: [-1.55, 1.95], equal: true, height: 340, axes: false, weight: 0.75, title: 'the last drop, between the plates' });
        const sH = v.stage({ x: [0, 13.5], y: [0, 10], height: 340, axes: 'box', weight: 1.35, title: 'number of drops against measured charge (10⁻¹⁹ C)' });
        // ---------- pith balls (SI inside, cm for drawing)
        const Lth = 0.1, piv = 0.025, rb = 0.004, mb = 1.5e-5, QMAX = 9e10;
        let nA = 49932084990, nB = 31207553119, note = 'Both balls were touched with glass rods rubbed on silk, so both are positive and they repel.', seed = 3, sol;
        const solve = () => {
          const qA = nA * e, qB = nB * e; let tA = 0, tB = 0, F = [0, 0], contact = false, pA, pB;
          for (let it = 0; it < 700; it++) {
            pA = [-piv + Lth * Math.sin(tA), -Lth * Math.cos(tA)]; pB = [piv + Lth * Math.sin(tB), -Lth * Math.cos(tB)];
            const dx = pA[0] - pB[0], dy = pA[1] - pB[1], r = Math.hypot(dx, dy);
            if (r < 2 * rb) { contact = true; break; }
            const f = (C.ke * qA * qB) / (r * r * r); F = [f * dx, f * dy];
            tA += 0.2 * (Math.atan2(F[0], mb * g - F[1]) - tA); tB += 0.2 * (Math.atan2(-F[0], mb * g + F[1]) - tB);
          }
          return { pA, pB, F, contact, tA, tB };
        };
        const share = () => { const T = nA + nB, a = Math.floor(T / 2); nA = a; nB = T - a; return T % 2 !== 0; };
        const settle = () => {
          sol = solve();
          if (sol.contact) {
            const odd = share();
            note += ` They swung together, touched and shared the total ${groupInt(nA + nB)} e` + (odd ? ' — an odd number, so one ball keeps one electron more than the other.' : '.');
            sol = solve();
          }
        };
        const transfer = () => Math.round(v.rng(seed++).uniform(1.4e10, 3.2e10));
        const words = (n) => groupInt(Math.abs(n)).slice(1);
        const b1 = v.button('glass rod (rubbed on silk) touches A', () => {
          const n = Math.min(transfer(), QMAX - nA); if (n <= 0) { note = 'A is as charged as the rod can make it.'; return; }
          nA += n; note = `A gave ${words(n)} electrons to the positive rod.`; settle();
        });
        const b2 = v.button('amber rod (rubbed on fur) touches B', () => {
          const n = Math.min(transfer(), QMAX + nB); if (n <= 0) { note = 'B is as charged as the rod can make it.'; return; }
          nB -= n; note = `B took ${words(n)} electrons from the negative rod.`; settle();
        });
        const b3 = v.button('touch A and B together', () => {
          const T = nA + nB, odd = share();
          note = `Touching shares the total ${groupInt(T)} e between two identical balls` + (odd ? ': it is odd, so the split is uneven by exactly one electron.' : ' equally.'); settle();
        });
        const b4 = v.button('ground B', () => { note = nB ? `${words(nB)} electrons flowed ${nB > 0 ? 'from' : 'to'} the Earth; B is neutral.` : 'B was already neutral.'; nB = 0; settle(); });
        const b5 = v.button('discharge both', () => { nA = 0; nB = 0; note = 'Both balls neutral: they hang straight down.'; settle(); });
        settle();
        // ---------- oil drops (Millikan’s apparatus: clock oil, plates 16 mm apart at 5085 V)
        const sigma = v.slider('timing error', 0.001, 0.1, 0.01, { log: true, fmt: (x) => `${+(x * 100).toPrecision(2)} %` });
        const cont = v.toggle('hypothetical: charge comes in any amount', false);
        let nDrops = 60;
        const b6 = v.button('measure 30 more drops', () => { nDrops = Math.min(900, nDrops + 30); });
        const b7 = v.button('start over', () => { nDrops = 12; });
        const RHO = 919.9 - 1.2, ETA = 1.824e-5, GAP = 0.016, VOLT = 5085, EF = VOLT / GAP, DIST = 0.005;
        const W = [10, 13, 14, 14, 12, 10, 8, 6, 5, 4], WS = W.reduce((a, b) => a + b, 0);
        const dropAt = (i, sg, cn) => {
          const r = v.rng(4001 + 17 * i);
          let a, n, tries = 0;
          do {
            a = r.uniform(0.4e-6, 1.35e-6);
            let u = r() * WS, k = 0; while (u > W[k]) { u -= W[k]; k++; }
            n = k + 1 + (cn ? r.uniform(-0.5, 0.5) : 0);
          } while (n * e * EF < 1.08 * (4 / 3) * Math.PI * a ** 3 * RHO * g && ++tries < 50);
          const vf = (2 * a * a * RHO * g) / (9 * ETA), vr = (n * e * EF - (4 / 3) * Math.PI * a ** 3 * RHO * g) / (6 * Math.PI * ETA * a);
          const tf = (DIST / vf) * (1 + sg * r.normal()), tr = (DIST / vr) * (1 + sg * r.normal());
          const vf2 = DIST / tf, vr2 = DIST / tr, a2 = Math.sqrt((9 * ETA * vf2) / (2 * RHO * g));
          return { q: (6 * Math.PI * ETA * a2 * (vf2 + vr2)) / EF, n, a, tf, tr };
        };
        let dKey = '', drops = [], fit = null;
        const data = () => {
          const k = [nDrops, sigma.value, cont.value].join('|');
          if (k !== dKey) {
            dKey = k; drops = []; for (let i = 0; i < nDrops; i++) drops.push(dropAt(i, sigma.value, cont.value));
            const qs = drops.map((d) => d.q * 1e19); let best = -Infinity, eb = 1.6;
            for (let j = 0; j <= 2000; j++) { const ee = 1.2 + j / 2000; let sc = 0; for (const q of qs) sc += Math.cos((TAU * q) / ee); if (sc > best) { best = sc; eb = ee; } }
            let sn = 0, snq = 0; for (const q of qs) { const m = Math.max(1, Math.round(q / eb)); sn += m * m; snq += m * q; }
            const ef = snq / sn; let ss = 0; for (const q of qs) { const m = Math.max(1, Math.round(q / ef)); ss += (q - m * ef) ** 2; }
            fit = { e: ef, se: Math.sqrt(ss / Math.max(1, qs.length - 1) / sn), comb: best / qs.length };
          }
          return drops;
        };
        v.animate((t) => {
          const balls = mode.value === 'balls';
          showStage(sB, balls); showStage(sA, !balls); showStage(sH, !balls);
          for (const b of [b1, b2, b3, b4, b5]) b.hidden = !balls;
          for (const c of [sigma.el, cont.el]) c.hidden = balls;
          b6.hidden = b7.hidden = balls;
          {
            const s = sB, cm = (p) => [p[0] * 100, p[1] * 100];
            s.rect(-7, 0, 7, 0.6, { fill: 'muted', fillAlpha: 0.25, color: 'muted', width: 1 });
            const fs = 4.5 / (mb * g); // cm of arrow per newton: the weight is a 4.5 cm arrow
            const items = [[sol.pA, nA, 'A', -piv, sol.F, 'right'], [sol.pB, nB, 'B', piv, [-sol.F[0], -sol.F[1]], 'left']];
            for (const [p, n, lab, px, F, al] of items) {
              const [X, Y] = cm(p), col = sgnCol(n);
              s.line(px * 100, 0, X, Y, { color: 'muted', width: 1.2 });
              s.circle(X, Y, rb * 100, { fill: col, fillAlpha: n ? 0.6 : 0.25, color: col, width: 1.6 });
              s.text(lab, X, Y, { align: 'center', size: 12, weight: 700, halo: false });
              const r0 = rb * 100, fl = Math.hypot(F[0], F[1]) * fs;
              s.arrow(X, Y - r0, X, Y - r0 - 4.5, { color: 'faint', width: 2, head: 8 });
              if (fl > 0.1) { const ux = F[0] / Math.hypot(...F), uy = F[1] / Math.hypot(...F); s.arrow(X + ux * r0, Y + uy * r0, X + ux * (r0 + fl), Y + uy * (r0 + fl), { color: 'orange', width: 2.6, head: 9 }); }
              const dx = al === 'right' ? -1.1 : 1.1;
              s.text(`${groupInt(n)} e`, X + dx * 0.6, Y + 2.1, { align: al, size: 12.5, color: n ? col : 'muted', weight: 600 });
              s.text(`${n ? (n > 0 ? '+' : '−') + v.fix(Math.abs(n * e) * 1e9, 3) : '0'} nC`, X + dx * 0.6, Y + 1.0, { align: al, size: 11.5, color: 'muted' });
            }
            s.text('weight', sol.pA[0] * 100 - 0.35, sol.pA[1] * 100 - 3.2, { align: 'right', size: 11, color: 'muted' });
            if (Math.hypot(...sol.F) * fs > 0.25) s.text('Coulomb force', sol.pB[0] * 100 + 0.9, sol.pB[1] * 100 - 1.2, { size: 11, color: 'orange' });
            s.corner('threads 10 cm, pith balls 0.015 g, hung 5 cm apart', 'tr', { size: 11 });
          }
          {
            const D = data(), d = D[D.length - 1], s = sA;
            // apparatus: plates, atomizer, timing marks
            const yM = 0.3125; // timing marks 5 mm apart (1 unit = 8 mm)
            const T = 9, u = t % T, on = u >= 4.5;
            const frac = u < 4 ? u / 4 : u < 4.5 ? 1 : u < 8.5 ? 1 - (u - 4.5) / 4 : 0;
            const y = yM - 2 * yM * frac + (u < 4 || u >= 8.5 ? 0 : 0);
            s.rect(-1.15, 1, -0.06, 1.12, { fill: 'muted', fillAlpha: 0.5, color: 'muted', width: 1 });
            s.rect(0.06, 1, 1.15, 1.12, { fill: 'muted', fillAlpha: 0.5, color: 'muted', width: 1 });
            s.rect(-1.15, -1.12, 1.15, -1, { fill: 'muted', fillAlpha: 0.5, color: 'muted', width: 1 });
            s.text(on ? '+ 5085 V' : '0 V', 1.15, 1.25, { align: 'right', size: 11.5, color: on ? 'red' : 'muted' });
            s.text(on ? '−' : '', 1.15, -1.25, { align: 'right', size: 12, color: 'blue' });
            s.poly([[-0.12, 1.85], [0.12, 1.85], [0.04, 1.5], [-0.04, 1.5]], { fill: 'muted', fillAlpha: 0.3, color: 'muted', width: 1 });
            s.text('atomizer', 0.18, 1.72, { size: 11, color: 'muted' });
            for (const yy of [yM, -yM]) s.line(-0.7, yy, 0.7, yy, { color: 'faint', width: 1, dash: [4, 3] });
            s.measure(-0.85, -yM, -0.85, yM, '5 mm', { color: 'muted', math: false, size: 11, offset: -22 });
            if (on) for (let k = -3; k <= 3; k++) s.arrow(k * 0.3, -0.92, k * 0.3, 0.92, { color: 'red', alpha: 0.18, width: 1.2, head: 6 });
            // forces on the drop (px, relative to its weight)
            const mg = (4 / 3) * Math.PI * d.a ** 3 * RHO * g, qE = d.n * e * EF, x0 = 0.18;
            const moving = u < 4 || (u >= 4.5 && u < 8.5);
            arrowPx(s, x0, y, 0, -1, 26, { color: 'faint', width: 2, head: 7 });
            if (on) arrowPx(s, x0, y, 0, 1, (26 * qE) / mg, { color: 'red', width: 2, head: 7 });
            if (moving) arrowPx(s, x0, y, 0, on ? -1 : 1, on ? (26 * (qE - mg)) / mg : 26, { color: 'purple', width: 2, head: 7 });
            s.dot(x0, y, { r: 6, color: 'gold' });
            const clock = u < 4 ? (u / 4) * d.tf : u < 4.5 ? d.tf : u < 8.5 ? ((u - 4.5) / 4) * d.tr : d.tr;
            s.corner(on ? `field on — rising: ${v.fix(clock, 1)} s` : `field off — falling: ${v.fix(clock, 1)} s`, 'bl', { color: on ? 'red' : 'ink', size: 12 });
            s.corner('weight · drag · electric force', 'tl', { size: 10.5 });
            // histogram
            const h = sH, qs = D.map((x) => x.q * 1e19), H = M.histogram(qs, { bins: 108, range: [0, 13.5] });
            const top = Math.max(4, ...H.counts) * 1.28; h.setView([0, 13.5], [0, top]);
            for (let k = 1; k * fit.e < 13.4; k++) {
              h.vline(k * fit.e, { color: 'green', dash: [4, 4], width: 1, alpha: fit.comb > 0.5 ? 0.8 : 0.35 });
              h.text(k === 1 ? 'e' : `${k}e`, k * fit.e, top * 0.965, { align: 'center', size: 11, color: 'green', baseline: 'top' });
            }
            h.hist(H, { color: 'accent', fillAlpha: 0.55, gap: 0 });
            h.dot(d.q * 1e19, top * 0.04, { r: 4.5, color: 'gold' });
          }
        }, { period: 9, still: 2.2 });
        v.readout(() => {
          if (mode.value === 'balls') {
            const ang = (t) => v.fix((Math.abs(t) * 180) / Math.PI, 1), Fm = Math.hypot(...sol.F);
            return `$q_A$ = ${groupInt(nA)} e, $q_B$ = ${groupInt(nB)} e · total ${groupInt(nA + nB)} e · Coulomb force ${M.si(Fm, 'N')}${Fm ? (nA * nB > 0 ? ' (repulsive)' : ' (attractive)') : ''} · thread angles ${ang(sol.tA)}°, ${ang(sol.tB)}° · ${note}`;
          }
          const D = data(), d = D[D.length - 1];
          const head = cont.value
            ? `comb strength ${v.fix(fit.comb, 2)} (1 = every drop on a multiple): **no common unit** — the fitted “e” = ${v.fix(fit.e, 3)}×10⁻¹⁹ C means nothing`
            : `fitted elementary charge **e = (${v.fix(fit.e, 4)} ± ${v.fix(fit.se, 4)})×10⁻¹⁹ C** from ${D.length} drops (comb strength ${v.fix(fit.comb, 2)}); today’s value ${v.fix(C.e * 1e19, 9)}×10⁻¹⁹ C, exact by definition`;
          return `${head} · last drop: radius ${M.si(d.a, 'm')}, falls 5 mm in ${v.fix(d.tf, 1)} s, rises in ${v.fix(d.tr, 1)} s → q = ${v.fix(d.q * 1e19, 3)}×10⁻¹⁹ C = ${v.fix(d.q / C.e, 2)} e`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 1.2
    {
      num: '1.2',
      kind: 'Law',
      name: 'Conservation of charge',
      statement: String.raw`The total electric charge of an isolated system never changes. The law is **local**: for any fixed region $V$ with boundary $\partial V$, the charge inside changes only by the charge carried across the boundary,
$$\frac{dQ_V}{dt} = -\oint_{\partial V}\mathbf J\cdot d\mathbf a ,\qquad\text{equivalently}\qquad \frac{\partial\rho}{\partial t} + \nabla\cdot\mathbf J = 0,$$
where $\rho$ is the charge density and $\mathbf J$ the current density. Charged particles can be created or destroyed, but only in combinations of zero net charge — an electron with a positron, a proton with an electron and an antineutrino in neutron decay.`,
      idea: String.raw`Charge is carried by particles whose charges are fixed multiples of $e$ (em-1.1), and every reaction ever observed conserves their sum: pair creation $\gamma\to e^-e^+$, annihilation, beta decay $n\to p\,e^-\bar\nu$. So inside any region the tally can change in only one way — by particles crossing the boundary — and in the continuum limit that bookkeeping is the continuity equation. Locality is stronger than global conservation: a charge may not vanish here and reappear simultaneously on the Moon, because the boundary between would have to record it crossing. Maxwell’s displacement current (em-7) is exactly what makes the field equations respect this. Experimentally, the electron’s lifetime against a charge-violating decay exceeds $6.6\times10^{28}$ years.`,
      caption: String.raw`Charged carriers wander; drag any of them, or drag the dashed region (centre and corner handles). Photons occasionally create $e^-e^+$ pairs and opposite charges that meet annihilate (gold flashes); neutral particles (n) decay into $p + e^-$. The right panel tracks the change of the charge inside the region (blue) against a running tally of charge carried in across its boundary (green, dashed): they coincide. Switch on the hypothetical decay $n\to p$ with no electron and the two curves part.`,
      scope: String.raw`Conservation of charge has no known exceptions; the hypothetical decay here is fictitious, chosen to show what a violation would look like.`,
      deps: ['em-1.1'],
      refs: ['Purcell ch. 1', 'Griffiths §2.1'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Charge_conservation' },
      tags: ['charge', 'conservation'],
      viz(v) {
        const M = v.M, W = 10, H = 7;
        const s = v.stage({ x: [0, W], y: [0, H], equal: true, height: 320, axes: false, weight: 1.25 });
        const sp = v.stage({ x: [0, 30], y: [-5, 5], height: 320, axes: 'box', weight: 1, xlabel: 'time (s)', ylabel: 'charge (units of e)', title: 'inside the dashed region' });
        const cheat = v.toggle('hypothetical decay n → p without an electron', false);
        const rate = v.slider('pair creation (per s)', 0, 2, 0.6, { step: 0.05 });
        const hc = s.handle(4.2, 3.4, { color: 'green', r: 6 }), hk = s.handle(6.8, 5.4, { color: 'green', r: 5 });
        let last = [hc.x, hc.y];
        hc.onDrag = () => { hk.x = M.clamp(hk.x + hc.x - last[0], 0, W); hk.y = M.clamp(hk.y + hc.y - last[1], 0, H); last = [hc.x, hc.y]; };
        const box = () => { const dx = Math.max(0.4, Math.abs(hk.x - hc.x)), dy = Math.max(0.4, Math.abs(hk.y - hc.y)); return [hc.x - dx, hc.y - dy, hc.x + dx, hc.y + dy]; };
        const inside = (p) => { const [a, b, c, d] = box(); return p.x > a && p.x < c && p.y > b && p.y < d; };
        let P, T, Q0, inflow, hist, ev, flashes, rng, held = null, simCheat = null, T0 = 0;
        const make = (x, y, q, age = 0, ang = null) => { const a = ang ?? rng.uniform(0, TAU), sp = q ? 0.75 : 0.4; const p = { x, y, q, age, vx: sp * Math.cos(a), vy: sp * Math.sin(a) }; p.in = inside(p); return p; };
        const reset = () => {
          rng = v.rng(11); P = []; T = 0; inflow = 0; flashes = []; ev = { pair: 0, ann: 0, dec: 0, fake: 0 }; simCheat = cheat.value;
          for (let i = 0; i < 26; i++) P.push(make(rng.uniform(0.3, W - 0.3), rng.uniform(0.3, H - 0.3), i < 13 ? 1 : i < 25 ? -1 : 1, 5));
          for (let i = 0; i < 10; i++) P.push(make(rng.uniform(0.3, W - 0.3), rng.uniform(0.3, H - 0.3), 0, 5));
          Q0 = P.reduce((a, p) => a + (p.in ? p.q : 0), 0); hist = [[0, 0, 0]];
          for (let k = 0; k < 20 * 60; k++) step(1 / 60); // warm start: the run has been going for 20 s
        };
        const Qin = () => P.reduce((a, p) => a + (inside(p) ? p.q : 0), 0);
        const tally = () => { for (const p of P) { const now = inside(p); if (now !== p.in) { inflow += p.q * (now ? 1 : -1); p.in = now; } } };
        const step = (dt) => {
          const turn = 1.5 * Math.sqrt(dt);
          for (const p of P) {
            p.age += dt; if (p === held) continue;
            const th = turn * rng.normal(), c = Math.cos(th), sn = Math.sin(th), vx = p.vx * c - p.vy * sn;
            p.vy = p.vx * sn + p.vy * c; p.vx = vx; p.x += p.vx * dt; p.y += p.vy * dt;
            if ((p.x < 0.15 && p.vx < 0) || (p.x > W - 0.15 && p.vx > 0)) p.vx *= -1;
            if ((p.y < 0.15 && p.vy < 0) || (p.y > H - 0.15 && p.vy > 0)) p.vy *= -1;
          }
          tally();
          // annihilation of a ± pair that meets (both on the same side of the boundary)
          for (let i = 0; i < P.length; i++) for (let j = i + 1; j < P.length; j++) {
            const a = P[i], b = P[j];
            if (a.q * b.q !== -1 || a.age < 1 || b.age < 1 || a === held || b === held || a.in !== b.in) continue;
            if (Math.hypot(a.x - b.x, a.y - b.y) < 0.22 && rng() < 0.5) {
              flashes.push({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2, t: T, k: 'ann' }); ev.ann++;
              P.splice(j, 1); P.splice(i, 1); i--; break;
            }
          }
          if (P.length < 70 && rng() < rate.value * dt) {
            const x = rng.uniform(0.5, W - 0.5), y = rng.uniform(0.5, H - 0.5);
            const a = rng.uniform(0, TAU); P.push(make(x, y, 1, 0, a), make(x, y, -1, 0, a + Math.PI)); flashes.push({ x, y, t: T, k: 'pair' }); ev.pair++;
          }
          for (let i = 0; i < P.length; i++) {
            const p = P[i];
            if (p.q === 0 && p !== held && rng() < 0.07 * dt) {
              const a = rng.uniform(0, TAU); P.splice(i, 1, make(p.x, p.y, 1, 0, a)); if (!cheat.value) P.push(make(p.x, p.y, -1, 0, a + Math.PI)); else ev.fake++;
              flashes.push({ x: p.x, y: p.y, t: T, k: 'dec' }); ev.dec++;
            }
          }
          if (P.filter((p) => p.q === 0).length < 10 && rng() < 0.5 * dt) P.push(make(rng.uniform(0.3, W - 0.3), rng.uniform(0.3, H - 0.3), 0, 5));
          T += dt;
          if (T - hist[hist.length - 1][0] >= 0.1) hist.push([T, Qin() - Q0, inflow]);
        };
        reset();
        s.onDrag((x, y, ph) => {
          if (ph === 'start') { let best = 0.5; held = null; for (const p of P) { const d = Math.hypot(p.x - x, p.y - y); if (d < best) { best = d; held = p; } } }
          else if (ph === 'move' && held) { held.x = M.clamp(x, 0.12, W - 0.12); held.y = M.clamp(y, 0.12, H - 0.12); }
          else if (ph === 'end') held = null;
        });
        v.animate((t) => {
          if (t < T - T0 - 1e-6 || simCheat !== cheat.value) { reset(); T0 = T - t; }
          let guard = 0; while (T + 1 / 60 <= t + T0 + 1e-9 && guard++ < 5000) step(1 / 60);
          tally();
          const [a, b, c, d] = box();
          s.rect(0, 0, W, H, { color: 'muted', width: 1.2 });
          s.rect(a, b, c, d, { color: 'green', width: 2, dash: [7, 5], fill: 'green', fillAlpha: 0.07 });
          for (const f of flashes) {
            const age = T - f.t; if (age > 0.9) continue;
            s.circle(f.x, f.y, 0.12 + age * 0.45, { color: f.k === 'dec' ? 'purple' : 'gold', width: 2.2, alpha: 1 - age / 0.9 });
          }
          flashes = flashes.filter((f) => T - f.t < 1);
          const c2 = s.ctx;
          for (const p of P) {
            const X = s.X(p.x), Y = s.Y(p.y), col = p.q > 0 ? 'red' : p.q < 0 ? 'blue' : 'muted';
            c2.beginPath(); c2.arc(X, Y, p === held ? 9 : 7, 0, TAU);
            c2.fillStyle = v.color(col, p.q ? 0.85 : 0.25); c2.fill();
            c2.lineWidth = 1.4; c2.strokeStyle = v.color(p.q ? 'panel' : 'muted'); c2.stroke();
            s.textPx(p.q > 0 ? '+' : p.q < 0 ? '−' : 'n', X, Y + 0.5, { align: 'center', size: p.q ? 12 : 10, weight: 700, color: p.q ? 'panel' : 'muted', halo: false });
          }
          // the history plot
          const t1 = Math.max(24, T + 1), t0 = t1 - 24;
          let lo = -3, hi = 3; for (const h of hist) { lo = Math.min(lo, h[1], h[2]); hi = Math.max(hi, h[1], h[2]); }
          sp.setView([t0, t1], [lo - 1.5, hi + 1.5]);
          sp.hline(0, { color: 'faint', width: 1 });
          const stepPath = (k) => { const pts = []; let prev = null; for (const h of hist) { if (h[0] < t0 - 0.2) { prev = h; continue; } if (prev) pts.push([h[0], prev[k]]); pts.push([h[0], h[k]]); prev = h; } return pts; };
          sp.path(stepPath(1), { color: 'blue', width: 3, alpha: 0.75 });
          sp.path(stepPath(2), { color: cheat.value ? 'red' : 'green', width: 2, dash: [6, 4] });
          sp.dot(T, Qin() - Q0, { r: 4, color: 'blue' });
        }, { period: 1e7, still: 16 });
        v.legend([['blue', 'change of charge inside, $Q(t)-Q(0)$'], ['green', 'net charge carried in across the boundary', { dash: true }], ['gold', 'pair created / annihilated', { dot: true }], ['purple', 'neutron decay', { dot: true }]]);
        v.readout(() => {
          const q = Qin(), dq = q - Q0, ok = dq === inflow;
          return `charge inside now $Q = ${q}e$ (it was $${Q0}e$) · change $\\Delta Q = ${dq > 0 ? '+' : ''}${dq}e$ · net charge carried in across the boundary $${inflow > 0 ? '+' : ''}${inflow}e$ · ${ev.pair} pairs created, ${ev.ann} annihilations, ${ev.dec} neutron decays` +
            (ok ? ' · **balance holds**' : ` · **unbalanced by ${dq - inflow}e**: ${ev.fake} decays made charge from nothing`);
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 1.3
    {
      num: '1.3',
      kind: 'Law',
      name: 'Coulomb’s law',
      statement: String.raw`Two point charges $q_1$ and $q_2$ at rest, a distance $r$ apart in vacuum, exert on each other forces that are equal in size, opposite in direction and directed along the line joining them:
$$\mathbf F_{12} = \frac{1}{4\pi\varepsilon_0}\,\frac{q_1q_2}{r^2}\,\hat{\mathbf r}_{12} = -\mathbf F_{21},$$
where $\hat{\mathbf r}_{12}$ points from $q_2$ to $q_1$ and $\varepsilon_0 = 8.854\times10^{-12}$ F/m, so $k = 1/4\pi\varepsilon_0 = 8.988\times10^{9}$ N m²/C². Like charges repel ($q_1q_2>0$) and unlike charges attract.`,
      idea: String.raw`This is an experimental law. Coulomb (1785) hung a needle carrying a small charged ball on a fine wire, brought a second charged ball near it and read the force off the angle through which he had to twist the wire to hold a given separation; halving the distance quadrupled the twist. The modern evidence is far sharper and indirect: the inverse square is what makes Gauss’s law hold and the field inside a charged shell vanish (em-1.14, em-1.17), and null experiments of that kind pin the exponent to $2$ within about $10^{-16}$ (em-1.18). Equal and opposite forces along the joining line are Newton’s third law for static charges.`,
      caption: String.raw`Drag the two charges; the orange arrows are the forces on each (arrow length grows with the logarithm of the force). Every drag records a measurement on the log–log plot, and the readout fits a line through them: slope $-2$. Coulomb’s three torsion-balance readings of 1785 sit on the same plot (squares, scaled to the line — only their slope matters). Move the exponent slider to see what a different law would look like: the slope follows it.`,
      scope: String.raw`Charges at rest (or slow), in vacuum, small compared with their separation. Moving charges also feel magnetic forces; inside matter the force is reduced by polarization. Tested from $10^{-18}$ m (scattering) to planetary distances (limits on a photon mass).`,
      credit: 'Coulomb, 1785 (anticipated by Priestley, 1767, and Cavendish, 1773)',
      deps: ['em-1.1'],
      refs: ['Griffiths §2.1', 'Purcell ch. 1'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Coulomb%27s_law' },
      tags: ['force', 'inverse square'],
      viz(v) {
        const M = v.M, C = M.CONST;
        const s = v.stage({ x: [-7, 7], y: [-4, 4], equal: true, height: 330, axes: false, weight: 1.3 });
        const sp = v.stage({ x: [0.8, 30], y: [1e-7, 1e-1], xlog: true, ylog: true, height: 330, axes: 'box', weight: 1, xlabel: 'distance r (cm)', ylabel: 'force |F| (N)' });
        const q1 = v.slider('$q_1$', -10, 10, 6, { step: 0.5, fmt: nC });
        const q2 = v.slider('$q_2$', -10, 10, 4, { step: 0.5, fmt: nC });
        const nx = v.slider('exponent $n$ in $F\\propto 1/r^{\\,n}$', 1.5, 2.5, 2, { step: 0.01 });
        const old = v.toggle('Coulomb’s 1785 readings', true);
        const A = s.handle(-2.6, -0.6, { color: 'red', r: 9, label: '$q_1$', labelPos: 'nw' }), B = s.handle(2.4, 0.9, { color: 'red', r: 9, label: '$q_2$', labelPos: 'ne' });
        const force = (r) => (C.ke * q1.value * q2.value * 1e-18) / (r * 0.01) ** 2 / Math.pow(r, nx.value - 2); // r in cm; equals Coulomb at 1 cm
        let pts = [], key = '', lastR = null, rngN = v.rng(5);
        const sweep = () => { pts = []; for (let i = 0; i < 9; i++) { const r = 1.5 * Math.pow(12 / 1.5, i / 8); pts.push([r, Math.abs(force(r)) * (1 + 0.012 * rngN.normal())]); } };
        v.button('clear measurements', () => { pts = []; });
        // Coulomb 1785: separation (degrees of arc) and total torsion (degrees) for three trials
        const OLD = [[36, 36], [18, 144], [8.5, 575.5]];
        const oldFit = M.linreg(OLD.map((p) => Math.log10(p[0])), OLD.map((p) => Math.log10(p[1])));
        v.render(() => {
          const k = [q1.value, q2.value, nx.value].join('|');
          if (k !== key) { key = k; sweep(); lastR = null; }
          A.color = sgnCol(q1.value); B.color = sgnCol(q2.value);
          const dx = A.x - B.x, dy = A.y - B.y, r = Math.max(0.3, Math.hypot(dx, dy)), F = force(r);
          if (lastR == null || Math.abs(Math.log(r / lastR)) > 0.04) { if (lastR != null && F) pts.push([r, Math.abs(F) * (1 + 0.012 * rngN.normal())]); lastR = r; }
          if (pts.length > 60) pts.shift();
          s.line(A.x, A.y, B.x, B.y, { color: 'faint', width: 1, dash: [4, 4] });
          s.measure(A.x, A.y, B.x, B.y, `r = ${v.fix(r, 2)} cm`, { color: 'muted', math: false, size: 11.5, offset: -16 });
          if (F) {
            const len = logLen(Math.abs(F), 1e-5, 40, 24, 10, 110), ux = (dx / r) * Math.sign(F), uy = (dy / r) * Math.sign(F);
            arrowPx(s, A.x, A.y, ux, uy, len, { color: 'orange', width: 3, head: 11 });
            arrowPx(s, B.x, B.y, -ux, -uy, len, { color: 'orange', width: 3, head: 11 });
            const tx = A.x + (ux * (len + 18)) / s.sx, ty = A.y + (uy * (len + 18)) / s.sy;
            s.tex(String.raw`\mathbf F_{12}`, tx, ty, { color: 'orange', size: 14, align: 'center' });
            s.tex(String.raw`\mathbf F_{21}`, B.x - (ux * (len + 18)) / s.sx, B.y - (uy * (len + 18)) / s.sy, { color: 'orange', size: 14, align: 'center' });
          }
          s.corner(F > 0 ? 'like charges: repulsion' : F < 0 ? 'unlike charges: attraction' : 'a neutral body feels no force', 'tl', { color: 'muted' });
          // log–log plot
          const F1 = Math.max(1e-12, Math.abs(force(1)));
          sp.setView([0.8, 30], [F1 * Math.pow(10, -4.4), F1 * 3]);
          if (F1 > 1e-12) sp.fn((x) => Math.abs(force(x)), { color: 'accent', width: 2, alpha: 0.6 });
          if (old.value && F1 > 1e-12) {
            const kr = 0.25, kF = Math.abs(force(36 * kr)) / 36;
            sp.dots(OLD.map(([a, b]) => [a * kr, b * kF]), { r: 0 });
            for (const [a, b] of OLD) { const X = sp.X(a * kr), Y = sp.Y(b * kF); sp.ctx.save(); sp.ctx.strokeStyle = v.color('purple'); sp.ctx.lineWidth = 2; sp.ctx.strokeRect(X - 5, Y - 5, 10, 10); sp.ctx.restore(); }
          }
          sp.dots(pts, { r: 3.6, color: 'gold' });
          if (F) sp.dot(r, Math.abs(F), { r: 6, color: 'orange' });
        });
        v.legend([['accent', '$|F| \\propto 1/r^{\\,n}$'], ['gold', 'your measurements (±1 % noise)', { dot: true }], ['purple', 'Coulomb 1785 (scaled)', { dot: true }]]);
        v.readout(() => {
          const r = Math.max(0.3, Math.hypot(A.x - B.x, A.y - B.y)), F = force(r);
          let fit = '';
          if (pts.length >= 3) { const L = M.linreg(pts.map((p) => Math.log10(p[0])), pts.map((p) => Math.log10(p[1]))); fit = ` · fitted log–log slope of your ${pts.length} measurements: **${v.fix(L.slope, 3)} ± ${v.fix(L.seSlope, 3)}**`; }
          return `$|F| = k|q_1q_2|/r^{${v.fix(nx.value, 2)}}$ = ${M.si(Math.abs(F), 'N')} at $r = ${v.fix(r, 2)}$ cm · $\\mathbf F_{12} + \\mathbf F_{21} = 0$, both along the joining line${fit}` + (old.value ? ` · Coulomb’s three readings: slope ${v.fix(oldFit.slope, 2)}` : '');
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 1.4
    {
      num: '1.4',
      kind: 'Principle',
      name: 'Superposition principle',
      statement: String.raw`The force that a collection of charges $q_1,\dots,q_n$ exerts on a test charge $Q$ is the vector sum of the forces each would exert alone:
$$\mathbf F = \sum_{i=1}^{n}\frac{1}{4\pi\varepsilon_0}\frac{q_iQ}{r_i^2}\,\hat{\mathbf r}_i ,$$
where $\mathbf r_i$ runs from $q_i$ to $Q$. The presence of other charges does not change the interaction between any two of them. Together with Coulomb’s law this determines every electrostatic force.`,
      idea: String.raw`Superposition is an experimental fact, not a theorem: nothing forces the interaction of two charges to ignore a third. It says that the field equations are **linear** — the field of a sum of sources is the sum of their fields — and that is what makes electrostatics solvable: any distribution can be cut into point charges (em-1.7), Green’s functions and images work, and fields of complicated sources are integrals of simple ones. In vacuum it holds to extraordinary precision; quantum electrodynamics predicts a tiny nonlinearity (light-by-light scattering) that matters only near fields of $10^{18}$ V/m.`,
      caption: String.raw`Drag the sources and the gold test charge $Q = +1$ nC; **click** a source to flip its sign, click empty space to add one (up to six). Field lines and equipotentials (red $V>0$, blue $V<0$) are drawn for the whole set. At $Q$ the forces from each source are laid tip to tail; the right panel enlarges that polygon: its closing side (green) is the force measured with all sources present (orange) — they coincide. Turn up the fictitious nonlinear coupling and they part.`,
      scope: String.raw`Holds for electrostatic fields in vacuum at all accessible strengths; it fails inside nonlinear media and, by QED vacuum polarization, near the Schwinger field $1.3\times10^{18}$ V/m.`,
      deps: ['em-1.3'],
      refs: ['Griffiths §2.1', 'Feynman II ch. 4'],
      tags: ['superposition', 'force'],
      viz(v) {
        const M = v.M, C = M.CONST, kE = C.ke * 1e-5, kV = C.ke * 1e-7, Qt = 1;
        const s = v.stage({ x: [-6.5, 6.5], y: [-4, 4], equal: true, height: 380, axes: false, weight: 1.7 });
        const sp = v.stage({ x: [-1, 1], y: [-1, 1], equal: true, height: 380, axes: false, weight: 1, title: 'forces on $Q$, tip to tail' });
        const beta = v.slider('fictitious nonlinear coupling', 0, 1, 0, { step: 0.01 });
        const init = [[-2.7, 1.3, 4], [2.5, 1.7, -3], [0.7, -2.3, 2], [9, 9, 0], [9, 9, 0], [9, 9, 0]];
        const Fk = v.fields(s, { law: '3d', sources: init.map(([x, y, q]) => ({ type: 'charge', x, y, q, label: '' })), lineDensity: 3.2, lineAlpha: 0.5, lineWidth: 1.15 });
        const H = Fk.handles;
        const test = s.handle(-0.3, -0.7, { color: 'gold', r: 7, label: '$Q$', labelPos: 'se' });
        const live = () => Fk.live().filter((x) => x.q !== 0);
        s.onClick((x, y) => {
          const X = s.X(x), Y = s.Y(y);
          if (Math.hypot(s.X(test.x) - X, s.Y(test.y) - Y) < 14) return;
          for (let i = 0; i < H.length; i++) if (Fk.sources[i].q && Math.hypot(s.X(H[i].x) - X, s.Y(H[i].y) - Y) < 14) { Fk.setStrength(i, -Fk.sources[i].q); return; }
          const j = Fk.sources.findIndex((q) => q.q === 0); if (j < 0) return;
          H[j].set(x, y); Fk.setStrength(j, 2);
        });
        v.button('remove last source', () => { for (let i = H.length - 1; i > 0; i--) if (Fk.sources[i].q) { Fk.setStrength(i, 0); H[i].set(9, 9); return; } });
        const sat = (E) => { const m = Math.hypot(E[0], E[1]); const f = 1 / (1 + (beta.value * m) / 3e4); return [E[0] * f, E[1] * f]; };
        let forces = [], total = [0, 0], meas = [0, 0];
        v.render(() => {
          H.forEach((h, i) => { h.visible = Fk.sources[i].q !== 0; h.label = `$q_${i + 1}$`; h.r = 7 + Math.abs(Fk.sources[i].q); });
          const src = live();
          const Vf = (x, y) => kV * coulPot(src, x, y);
          const lv = [150, 300, 600, 1200, 2400, 4800];
          s.contour(Vf, lv, { color: v.color('red', 0.55), width: 1 });
          s.contour(Vf, lv.map((x) => -x), { color: v.color('blue', 0.55), width: 1 });
          s.contour(Vf, 0, { color: v.color('muted', 0.6), width: 1, dash: [4, 4] });
          Fk.draw();
          // forces on the test charge: each source alone, then all together
          forces = []; total = [0, 0];
          Fk.live().forEach((q, i) => { if (!q.q) return; const E = sat(coul([q], test.x, test.y).map((c) => c * kE)); const f = [E[0] * Qt * 1e-9, E[1] * Qt * 1e-9]; forces.push({ i, f, q: q.q }); total[0] += f[0]; total[1] += f[1]; });
          const Eall = sat(coul(src, test.x, test.y).map((c) => c * kE)); meas = [Eall[0] * Qt * 1e-9, Eall[1] * Qt * 1e-9];
          const big = Math.max(1e-12, ...forces.map((f) => Math.hypot(...f.f)), Math.hypot(...total));
          const pxPerN = 80 / big; let x = test.x, y = test.y;
          for (const f of forces) { const L = Math.hypot(...f.f) * pxPerN; arrowPx(s, x, y, f.f[0], f.f[1], L, { color: sgnCol(f.q), width: 2.2, head: 8 }); x += (f.f[0] * pxPerN) / s.sx; y += (f.f[1] * pxPerN) / s.sy; }
          arrowPx(s, test.x, test.y, meas[0], meas[1], Math.hypot(...meas) * pxPerN, { color: 'orange', width: 3.4, head: 11, alpha: 0.85 });
          arrowPx(s, test.x, test.y, total[0], total[1], Math.hypot(...total) * pxPerN, { color: 'green', width: 2, head: 9, dash: [5, 3] });
          // polygon panel (µN)
          const u = 1e6, P = [[0, 0]]; for (const f of forces) { const p = P[P.length - 1]; P.push([p[0] + f.f[0] * u, p[1] + f.f[1] * u]); }
          const xs = P.map((p) => p[0]).concat([meas[0] * u]), ys = P.map((p) => p[1]).concat([meas[1] * u]);
          const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys), span = Math.max(x1 - x0, y1 - y0, 1e-6) * 0.62;
          sp.setView([(x0 + x1) / 2 - span, (x0 + x1) / 2 + span], [(y0 + y1) / 2 - span, (y0 + y1) / 2 + span]);
          const step = Math.pow(10, Math.floor(Math.log10(span))), gstep = span / step > 5 ? step * 2 : step;
          for (let gx = Math.ceil((x0 - span * 2) / gstep) * gstep; gx < x1 + span * 2; gx += gstep) sp.vline(gx, { color: 'grid', width: 1 });
          for (let gy = Math.ceil((y0 - span * 2) / gstep) * gstep; gy < y1 + span * 2; gy += gstep) sp.hline(gy, { color: 'grid', width: 1 });
          sp.arrow(0, 0, meas[0] * u, meas[1] * u, { color: 'orange', width: 5, head: 14, alpha: 0.6 });
          forces.forEach((f, k) => {
            const a = P[k], b = P[k + 1]; sp.arrow(a[0], a[1], b[0], b[1], { color: sgnCol(f.q), width: 2.6, head: 11 });
            sp.tex(`\\mathbf F_{${f.i + 1}}`, (a[0] + b[0]) / 2, (a[1] + b[1]) / 2, { color: sgnCol(f.q), size: 14, dx: 12 * Math.sign(b[1] - a[1] || 1), dy: -12 * Math.sign(b[0] - a[0] || 1) });
          });
          sp.arrow(0, 0, total[0] * u, total[1] * u, { color: 'green', width: 2.2, head: 11, dash: [6, 4] });
          sp.dot(0, 0, { r: 4.5, color: 'gold' });
          sp.corner(`grid: ${M.si(gstep * 1e-6, 'N')}`, 'bl', { size: 11 });
        });
        v.legend([['red', 'force from a $+$ source'], ['blue', 'force from a $-$ source'], ['green', 'sum $\\sum_i \\mathbf F_i$', { dash: true }], ['orange', 'force measured with all sources present']]);
        v.readout(() => {
          const d = Math.hypot(total[0] - meas[0], total[1] - meas[1]), m = Math.hypot(...meas);
          return `${forces.length} sources · $\\left|\\sum_i\\mathbf F_i\\right|$ = ${M.si(Math.hypot(...total), 'N')} · measured $|\\mathbf F|$ = ${M.si(m, 'N')} · mismatch $|\\sum\\mathbf F_i - \\mathbf F|/|\\mathbf F| = ${m ? v.fix(d / m, 4) : '0'}$` + (beta.value ? ' — **superposition fails** for a nonlinear law' : ' — superposition holds');
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 1.5
    {
      num: '1.5',
      kind: 'Definition',
      name: 'Electric field',
      statement: String.raw`The **electric field** of a set of charges at a point $P$ is the force per unit charge that they would exert on a test charge $q$ placed at $P$, in the limit of a vanishingly small test charge:
$$\mathbf E(P) = \lim_{q\to0}\frac{\mathbf F(P)}{q}\qquad(\text{unit N/C} = \text{V/m}).$$
By Coulomb’s law and superposition, the field of point charges $q_i$ at $\mathbf r_i$ is
$$\mathbf E(\mathbf r) = \frac{1}{4\pi\varepsilon_0}\sum_i q_i\,\frac{\mathbf r-\mathbf r_i}{|\mathbf r-\mathbf r_i|^3},$$
a vector field defined everywhere except at the charges, and a charge $q$ placed at $\mathbf r$ feels $\mathbf F = q\mathbf E(\mathbf r)$.`,
      idea: String.raw`Because each Coulomb force is proportional to the test charge (em-1.3) and forces add (em-1.4), the ratio $\mathbf F/q$ depends only on the sources and the point — a property of space around them. The limit matters: a real test charge pushes on the sources, and if they can move (charges on a conductor, ions in a solution) it rearranges them and measures a distorted field. The distortion is proportional to $q$, so it disappears as $q\to 0$. The field is more than bookkeeping: it carries energy and momentum, and once charges move it propagates at the speed of light (em-10).`,
      caption: String.raw`The arrows show the field of the two sources before the test charge arrives. Drag the gold test charge and change its size: the sources sit on springs, so a large test charge pulls them out of place (hollow circles mark where they were) and $\mathbf F/q$ (gold) misses the true field (green, dashed). The right panel plots the relative error against $q$: a line of slope 1, so shrinking $q$ makes the measurement exact. Pin the sources and the error vanishes for every $q$.`,
      deps: ['em-1.3', 'em-1.4'],
      refs: ['Griffiths §2.1'],
      tags: ['field', 'definition'],
      viz(v) {
        const M = v.M, C = M.CONST, kE = C.ke * 1e-5;
        const s = v.stage({ x: [-6, 6], y: [-3.6, 3.6], equal: true, height: 350, axes: false, weight: 1.5 });
        const sp = v.stage({ x: [1e-3, 15], y: [1e-6, 1], xlog: true, ylog: true, height: 350, axes: 'box', weight: 1, title: 'relative error $|\\mathbf F/q-\\mathbf E|/|\\mathbf E|$ against $q$ (nC)' });
        const qt = v.slider('test charge $q$', 0.001, 15, 10, { log: true, fmt: (x) => M.si(x * 1e-9, 'C') });
        const free = v.toggle('sources free to move (on springs)', true);
        const KS = 0.25; // spring constant, N/m
        const anchors = [{ x: -2.2, y: 0.7, q: 6 }, { x: 2.3, y: -0.9, q: -4 }];
        const test = s.handle(-0.6, -1.2, { color: 'gold', r: 7, label: '$q$', labelPos: 'se' });
        /** Equilibrium source positions with a test charge q (nC) at (tx, ty) (q = 0: none). */
        const equil = (q, tx, ty) => {
          const p = anchors.map((a) => ({ ...a }));
          if (!free.value) return p;
          for (let it = 0; it < 200; it++) {
            for (let i = 0; i < p.length; i++) {
              const others = p.filter((_, j) => j !== i).concat(q ? [{ x: tx, y: ty, q }] : []);
              const E = coul(others, p[i].x, p[i].y).map((c) => c * kE), f = [E[0] * p[i].q * 1e-9, E[1] * p[i].q * 1e-9];
              let nx = anchors[i].x + (f[0] / KS) * 100, ny = anchors[i].y + (f[1] / KS) * 100;
              const d = Math.hypot(nx - anchors[i].x, ny - anchors[i].y); if (d > 2.5) { nx = anchors[i].x + ((nx - anchors[i].x) * 2.5) / d; ny = anchors[i].y + ((ny - anchors[i].y) * 2.5) / d; }
              p[i].x += 0.5 * (nx - p[i].x); p[i].y += 0.5 * (ny - p[i].y);
            }
          }
          return p;
        };
        const err = (q, tx, ty, E0) => { const p = equil(q, tx, ty), E = coul(p, tx, ty).map((c) => c * kE); return { rel: Math.hypot(E[0] - E0[0], E[1] - E0[1]) / Math.hypot(...E0), p, E }; };
        let st = null;
        v.render(() => {
          const p0 = equil(0), E0 = coul(p0, test.x, test.y).map((c) => c * kE), R = err(qt.value, test.x, test.y, E0);
          st = { E0, R, p0 };
          quiver(s, v, (x, y) => coul(p0, x, y), { spacing: 32, color: 'accent', alpha: 0.6 });
          for (let i = 0; i < 2; i++) {
            const a = anchors[i], b = R.p[i], c = p0[i];
            if (free.value) {
              // spring: zigzag from the anchor to the bead
              const n = 8, sx0 = a.x - 1.7, pts = [[sx0, a.y]];
              const ax = b.x - sx0, ay = b.y - a.y, AL = Math.hypot(ax, ay), ux = ax / AL, uy = ay / AL;
              for (let k = 1; k < 2 * n; k++) { const f = k / (2 * n), w = (k % 2 ? 0.17 : -0.17); pts.push([sx0 + ax * f - uy * w, a.y + ay * f + ux * w]); }
              pts.push([b.x, b.y]); s.path(pts, { color: 'muted', width: 1.3 });
              s.line(sx0, a.y - 0.25, sx0, a.y + 0.25, { color: 'ink', width: 3 });
              if (Math.hypot(b.x - c.x, b.y - c.y) > 0.02) s.circle(c.x, c.y, 0.28, { color: sgnCol(c.q), width: 1.6, dash: [3, 3] });
            } else s.text('pinned', b.x, b.y - 0.55, { align: 'center', size: 11, color: 'muted' });
            s.circle(b.x, b.y, 0.28, { fill: sgnCol(b.q), fillAlpha: 0.8, color: sgnCol(b.q), width: 1.4 });
            s.text(nC(b.q), b.x, b.y + 0.55, { align: 'center', size: 11.5, color: sgnCol(b.q), weight: 600 });
          }
          const m0 = Math.hypot(...E0), m1 = Math.hypot(...R.E), ref = m0;
          arrowPx(s, test.x, test.y, E0[0], E0[1], logLen(m0, ref, 70, 30, 8, 130), { color: 'green', width: 2.4, head: 10, dash: [6, 4] });
          arrowPx(s, test.x, test.y, R.E[0], R.E[1], logLen(m1, ref, 70, 30, 8, 130), { color: 'gold', width: 3, head: 11 });
          // error against q
          const curve = [];
          for (let k = 0; k <= 48; k++) { const q = 1e-3 * Math.pow(1.5e4, k / 48); curve.push([q, err(q, test.x, test.y, E0).rel]); }
          const ymin = 1e-6; sp.setView([1e-3, 15], [ymin, 1]);
          sp.path(curve.map(([q, e]) => [q, Math.max(e, ymin * 1.01)]), { color: free.value ? 'accent' : 'green', width: 2.4 });
          if (free.value) sp.fn((q) => curve[24][1] * (q / curve[24][0]), { color: 'muted', dash: [4, 4], width: 1 });
          sp.dot(qt.value, Math.max(R.rel, ymin * 1.01), { r: 6, color: 'gold' });
          sp.corner(free.value ? 'dashed: slope 1' : 'pinned sources: F/q = E exactly', 'tl', { size: 11.5, color: free.value ? 'muted' : 'green' });
        });
        v.legend([['accent', 'field of the sources (direction; longer = stronger)'], ['green', 'true field $\\mathbf E$ at the test point', { dash: true }], ['gold', 'measured $\\mathbf F/q$']]);
        v.readout(() => {
          const { E0, R, p0 } = st, mv = Math.max(...R.p.map((b, i) => Math.hypot(b.x - p0[i].x, b.y - p0[i].y)));
          return `true field $|\\mathbf E|$ = ${M.si(Math.hypot(...E0), 'N/C')} · measured $|\\mathbf F/q|$ = ${M.si(Math.hypot(...R.E), 'N/C')} · relative error ${M.si(R.rel * 100, '%')}` + (free.value ? ` · the test charge dragged the sources by up to ${M.si(mv * 0.01, 'm')}` : ' · sources pinned');
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 1.6
    {
      num: '1.6',
      kind: 'Definition',
      name: 'Field lines',
      statement: String.raw`A **field line** of $\mathbf E$ is a curve tangent to $\mathbf E$ at each of its points: a solution of $d\mathbf r/ds = \mathbf E/|\mathbf E|$. Exactly one field line passes through each point where $\mathbf E\ne 0$, so field lines never cross. For an electrostatic field they begin on positive charges and end on negative charges or run off to infinity. If the number of lines leaving or entering a charge is drawn proportional to the charge, then the number of lines crossing a small surface is proportional to the flux of $\mathbf E$ through it, so the density of lines (lines per unit area across them) is proportional to $|\mathbf E|$.`,
      idea: String.raw`Tangency defines the lines; the counting rule is what makes them quantitative. Near a charge the field is that of the charge alone, radially symmetric, so lines spaced evenly around it carry equal shares $q/N$ of its flux. Between two neighbouring lines no flux crosses (the field is parallel to them), and in a charge-free region the flux in a tube of lines is conserved (Gauss’s law, em-1.14) — so every line keeps its share all the way along, and counting lines measures flux everywhere. In a planar drawing this is exact for **line charges**, where the picture is a cross-section of the 3D field; for point charges the true rule is lines per unit *area*, and a single slice through them only shows the pattern qualitatively.`,
      caption: String.raw`Drag the charges, change their sizes with the sliders, and drag the two gold handles of the probe segment. Lines crossing it light up; the readout compares their number with the flux through the segment times the lines drawn per unit charge. With line charges they agree to within the one-line graininess, wherever you put the probe; switch to point charges and the agreement is lost — a slice of a 3D pattern cannot show $|\mathbf E|$ by crowding. The readout also checks where every line starts and ends.`,
      deps: ['em-1.5'],
      refs: ['Griffiths §2.2', 'Purcell ch. 1'],
      tags: ['field lines', 'field'],
      viz(v) {
        const M = v.M, D = 10;
        const s = v.stage({ x: [-6.2, 6.2], y: [-3.7, 3.7], equal: true, height: 400, axes: false, full: true });
        const mode = v.select('', [{ value: '2d', label: 'line charges (exact in the plane)' }, { value: '3d', label: 'point charges (a slice of 3D)' }], '2d');
        const qs = [v.slider('$q_1$', -3, 3, 2, { step: 0.5 }), v.slider('$q_2$', -3, 3, -1, { step: 0.5 }), v.slider('$q_3$', -3, 3, 1, { step: 0.5 })];
        const shade = v.toggle('shade field strength $|\\mathbf E|$', true);
        const F = v.fields(s, { sources: [{ x: -2.5, y: 0.4, q: 2 }, { x: 2.2, y: -0.9, q: -1 }, { x: 0.2, y: 2.2, q: 1 }], lineDensity: D, heat: 'magnitude', heatStrength: 0.3, heatColor: 'orange' });
        const P1 = s.handle(-0.5, 1.7, { color: 'gold', r: 6 }), P2 = s.handle(0.4, -2.4, { color: 'gold', r: 6 });
        let info = null;
        v.render(() => {
          F.o.law = mode.value;
          qs.forEach((c, i) => { F.setStrength(i, c.value); F.handles[i].visible = c.value !== 0; F.handles[i].label = c.value ? `${c.value > 0 ? '+' : '−'}${Math.abs(c.value)}` : ''; });
          F.draw({ lines: false, heat: shade.value ? 'magnitude' : false });
          const lines = F.fieldLines(), src = F.live().filter((q) => q.q !== 0);
          const ax = P1.x, ay = P1.y, ex = P2.x - ax, ey = P2.y - ay;
          const atSrc = (p) => src.find((q) => Math.abs(q.x - p[0]) < 1e-9 && Math.abs(q.y - p[1]) < 1e-9);
          let net = 0, tot = 0, pm = 0, pe = 0, em = 0;
          for (const L of lines) {
            const pts = L.pts; let hit = false;
            for (let k = 1; k < pts.length; k++) {
              const p = pts[k - 1], q = pts[k], dx = q[0] - p[0], dy = q[1] - p[1], den = ex * dy - ey * dx;
              if (Math.abs(den) < 1e-14) continue;
              const t = ((p[0] - ax) * dy - (p[1] - ay) * dx) / den, u = ((p[0] - ax) * ey - (p[1] - ay) * ex) / den;
              if (t >= 0 && t <= 1 && u >= 0 && u < 1) { net += Math.sign((L.reverse ? -1 : 1) * (dy * ex - dx * ey)); tot++; hit = true; }
            }
            const a = atSrc(pts[0]), b = atSrc(pts[pts.length - 1]);
            if (!L.reverse) { if (b) pm++; else pe++; } else if (b) pm++; else em++;
            void a;
            s.path(pts, { color: hit ? 'gold' : 'ink', width: hit ? 2.2 : 1.3, alpha: hit ? 1 : 0.7 });
            const m = Math.floor(pts.length / 2);
            if (pts.length > 12) { const [p, q] = L.reverse ? [pts[m + 2], pts[m]] : [pts[m - 2], pts[m]]; headAt(s, v, p, q, hit ? 'gold' : 'ink', hit ? 1 : 0.75); }
          }
          // the probe segment and its normal
          s.line(P1.x, P1.y, P2.x, P2.y, { color: 'gold', width: 4, alpha: 0.6 });
          const L = Math.hypot(ex, ey) || 1, mx = ax + ex / 2, my = ay + ey / 2;
          arrowPx(s, mx, my, -ey / L, ex / L, 22, { color: 'gold', width: 2, head: 7 });
          s.tex(String.raw`\hat{\mathbf n}`, mx + ((-ey / L) * 34) / s.sx, my + ((ex / L) * 34) / s.sy, { color: 'gold', size: 14, align: 'center' });
          const Ff = F.F(), flux = quad((t) => { const f = Ff(ax + t * ex, ay + t * ey); return f[1] * ex - f[0] * ey; }, 0, 1, 1e-10, 20, 16);
          info = { tot, net, pm, pe, em, flux };
        });
        v.legend([['ink', 'field lines ($10$ per unit charge)'], ['gold', 'lines crossing the probe segment'], ['orange', '$|\\mathbf E|$ (log shading)', { area: true }]]);
        v.readout(() => {
          const { tot, net, flux, pm, pe, em } = info, ends = `lines: ${pm} run from a $+$ charge to a $-$ charge, ${pe} leave the window from a $+$ charge, ${em} come in from outside to a $-$ charge`;
          if (mode.value === '2d') return `**${tot}** lines cross the probe (net ${net} along $\\hat{\\mathbf n}$) · flux through it × lines per unit flux $= ${v.fix(D * flux, 2)}$ — the count is the flux, to within one line · ${ends}`;
          return `${tot} lines cross the probe, while the flux rule would predict ${v.fix(D * flux, 2)}: in a slice through point charges the lines spread like $1/r$ but $|\\mathbf E|$ falls like $1/r^2$, so crowding only hints at strength · ${ends}`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 1.7
    {
      num: '1.7',
      kind: 'Definition',
      name: 'Continuous charge distributions',
      statement: String.raw`When charge is spread so finely that its graininess does not matter, it is described by a **density**: a line density $\lambda$ (C/m) along a curve, a surface density $\sigma$ (C/m²) or a volume density $\rho$ (C/m³), so that a small piece carries $dq = \lambda\,dl$, $\sigma\,da$ or $\rho\,d\tau$. Its field is the limit of the superposition of point charges — the integral
$$\mathbf E(\mathbf r) = \frac{1}{4\pi\varepsilon_0}\int \frac{\mathbf r-\mathbf r'}{|\mathbf r-\mathbf r'|^3}\,dq(\mathbf r'),$$
which converges for every point $\mathbf r$ off a line or surface charge, and everywhere for a bounded volume density.`,
      idea: String.raw`Chop the distribution into $N$ small pieces, replace each by a point charge $dq$ and add their Coulomb fields (em-1.5): that is a Riemann sum for the integral, and for a probe off the charge the integrand is smooth, so the sums converge to it (pma-10.1). How fast depends on where each piece’s charge is put: at the piece’s end the error falls like $1/N$, at its midpoint like $1/N^2$ — the classical left-endpoint and midpoint rules. A probe close to the rod needs pieces smaller than its distance before the sum settles down.`,
      caption: String.raw`The rod (total charge 12 nC) is cut into $N$ pieces, each replaced by a point charge (red dots). At the probe $P$ the thin arrows are the separate contributions, the gold arrow their sum and the broad green arrow the integral. Drag $P$, raise $N$, switch the rod to a semicircle: the right panel plots the relative error for every $N$ at once — straight lines of slope $-2$ (midpoints) or $-1$ (left ends). Bring $P$ close to the rod and the error stays large until the pieces are shorter than its distance.`,
      deps: ['em-1.5', 'pma-10.1'],
      refs: ['Griffiths §2.1'],
      tags: ['field', 'integration'],
      viz(v) {
        const M = v.M, C = M.CONST, kE = C.ke * 1e-5, Q = 12;
        const s = v.stage({ x: [-5.2, 5.2], y: [-1.8, 4.2], equal: true, height: 330, axes: false, weight: 1.3 });
        const sp = v.stage({ x: [1, 1024], y: [1e-7, 3], xlog: true, ylog: true, height: 330, axes: 'box', weight: 1, xlabel: 'pieces N', title: 'relative error of the sum at $P$' });
        const shape = v.select('rod', [{ value: 'line', label: 'straight' }, { value: 'arc', label: 'semicircle' }], 'line');
        const place = v.select('charge of each piece at', [{ value: 'mid', label: 'its midpoint' }, { value: 'end', label: 'its left end' }], 'mid');
        const Ns = v.slider('pieces $N$', 1, 200, 6, { int: true, log: true });
        const P = s.handle(0.9, 0.8, { color: 'gold', r: 7, label: '$P$', labelPos: 'ne' });
        const pos = (t) => (shape.value === 'line' ? [-4 + 8 * t, 0] : [3.3 * Math.cos(Math.PI * (1 - t)), -0.4 + 3.3 * Math.sin(Math.PI * (1 - t))]);
        const exact = (x, y) => {
          const r = quad2((t) => { const [px, py] = pos(t), dx = x - px, dy = y - py, r3 = Math.pow(dx * dx + dy * dy, 1.5); return [dx / r3, dy / r3]; }, 0, 1, 1e-11, 24, 32);
          return [r[0] * Q * kE, r[1] * Q * kE];
        };
        const sum = (x, y, N, parts) => {
          let u = 0, w = 0;
          for (let j = 0; j < N; j++) {
            const [px, py] = pos(place.value === 'mid' ? (j + 0.5) / N : j / N), dx = x - px, dy = y - py, r3 = Math.pow(dx * dx + dy * dy, 1.5), k = (Q / N) * kE;
            u += (k * dx) / r3; w += (k * dy) / r3; if (parts) parts.push([(k * dx) / r3, (k * dy) / r3, px, py]);
          }
          return [u, w];
        };
        const NS = []; for (let k = 0; k <= 70; k++) { const n = Math.round(Math.pow(1024, k / 70)); if (!NS.length || n !== NS[NS.length - 1]) NS.push(n); }
        let st = null;
        v.render(() => {
          s.setView([-5.2, 5.2], shape.value === 'line' ? [-2.6, 3.4] : [-1.8, 4.2]);
          const N = Ns.value, E = exact(P.x, P.y), parts = [], EN = sum(P.x, P.y, N, parts), mE = Math.hypot(...E);
          s.curve(pos, 0, 1, { color: 'red', width: 8, alpha: 0.22, n: 200 });
          for (let j = 0; j <= N && N <= 120; j++) { const p = pos(j / N), q = pos(Math.min(1, j / N + 1e-4)), tx = q[0] - p[0], ty = q[1] - p[1], tl = Math.hypot(tx, ty) || 1; s.line(p[0] - (ty / tl) * 0.18, p[1] + (tx / tl) * 0.18, p[0] + (ty / tl) * 0.18, p[1] - (tx / tl) * 0.18, { color: 'red', width: 1, alpha: 0.6 }); }
          const r = Math.max(2.2, Math.min(7, 14 / Math.sqrt(N)));
          for (const [, , px, py] of parts) s.dot(px, py, { r, color: 'red' });
          const scale = 95 / mE;
          if (N <= 40) for (const [u, w] of parts) arrowPx(s, P.x, P.y, u, w, Math.min(170, Math.hypot(u, w) * scale), { color: 'red', width: 1, alpha: 0.45, head: 6 });
          arrowPx(s, P.x, P.y, E[0], E[1], 95, { color: 'green', width: 5, alpha: 0.55, head: 13 });
          arrowPx(s, P.x, P.y, EN[0], EN[1], Math.min(240, Math.hypot(...EN) * scale), { color: 'gold', width: 2.6, head: 10 });
          // error for every N
          const errs = NS.map((n) => { const e = sum(P.x, P.y, n); return [n, Math.max(1e-16, Math.hypot(e[0] - E[0], e[1] - E[1]) / mE)]; });
          const lo = Math.max(1e-9, Math.min(...errs.map((e) => e[1]))) / 3; sp.setView([1, 1024], [lo, 5]);
          const a = errs.find((e) => e[0] >= 16) || errs[0];
          sp.fn((n) => a[1] * Math.pow(n / a[0], -2), { color: 'muted', dash: [4, 4], width: 1 });
          sp.fn((n) => a[1] * Math.pow(n / a[0], -1), { color: 'muted', dash: [2, 4], width: 1 });
          sp.text('slope −2', 150, a[1] * Math.pow(150 / a[0], -2), { size: 11, color: 'muted', align: 'right', dx: -8, dy: 2 });
          sp.text('slope −1', 150, a[1] * Math.pow(150 / a[0], -1), { size: 11, color: 'muted', align: 'left', dy: -12 });
          sp.path(errs, { color: 'accent', width: 2.4 });
          const eN = Math.hypot(EN[0] - E[0], EN[1] - E[1]) / mE;
          sp.dot(N, Math.max(eN, lo * 1.01), { r: 6, color: 'gold' });
          const fitPts = errs.filter((e) => e[0] >= 24 && e[0] <= 400 && e[1] > 1e-14);
          const L = fitPts.length > 3 ? M.linreg(fitPts.map((e) => Math.log10(e[0])), fitPts.map((e) => Math.log10(e[1]))) : null;
          st = { E, EN, eN, slope: L ? L.slope : NaN };
        });
        v.legend([['red', 'contribution of each piece'], ['gold', 'sum of the $N$ point charges'], ['green', 'the integral $\\int k\\,\\lambda\\,dl\\,(\\mathbf r-\\mathbf r\')/|\\mathbf r-\\mathbf r\'|^3$']]);
        v.readout(() => `sum of ${Ns.value} point charges: ${M.si(Math.hypot(...st.EN), 'N/C')} · integral: ${M.si(Math.hypot(...st.E), 'N/C')} · relative error ${v.sci(st.eN, 2).includes('times') ? '$' + v.sci(st.eN, 2) + '$' : v.fix(st.eN, 4)} · fitted slope of the error curve (24 ≤ N ≤ 400): **${v.fix(st.slope, 2)}**`);
      },
    },
    // ───────────────────────────────────────────────────────────── 1.8
    {
      num: '1.8',
      kind: 'Model',
      name: 'Field of a uniformly charged line',
      statement: String.raw`A straight segment of length $L$ carrying uniform line charge $\lambda$ produces, at a point a distance $s$ from its line whose foot lies between distances $x_1$ and $x_2$ along it from the two ends (signed), the field components
$$E_\perp = \frac{\lambda}{4\pi\varepsilon_0 s}\left(\frac{x_2}{\sqrt{x_2^2+s^2}}+\frac{x_1}{\sqrt{x_1^2+s^2}}\right),\qquad E_\parallel = \frac{\lambda}{4\pi\varepsilon_0}\left(\frac{1}{\sqrt{x_2^2+s^2}}-\frac{1}{\sqrt{x_1^2+s^2}}\right).$$
For an **infinite line** this becomes radial with magnitude
$$E = \frac{\lambda}{2\pi\varepsilon_0\,s}.$$`,
      idea: String.raw`Integrate Coulomb’s law along the segment (em-1.7): with $x$ the coordinate along the line, each element contributes $\lambda\,dx/4\pi\varepsilon_0(x^2+s^2)$, and the substitution $x = s\tan\theta$ makes both components elementary. When both ends recede ($x_1,x_2\to\infty$) the bracket in $E_\perp$ tends to 2 and $E_\parallel$ to 0. The $1/s$ law — slower than $1/s^2$ because there is ever more charge within a given angle as you move away — holds where the segment *looks* infinite: for $s$ and the distance to the nearer end both small compared with the distance to that end. Far away the segment is a point charge $\lambda L$.`,
      caption: String.raw`The map shades how far the field of the finite rod is from the infinite-line value $\lambda/2\pi\varepsilon_0 s$ (green: within 1 %, orange: off by more than 10 %). Drag $P$ and change the length. The right panel plots the numerically integrated $|\mathbf E|$ along the perpendicular through $P$: it follows the dashed $1/s$ line close in and bends over to the point-charge law $1/r^2$ beyond about half the rod’s length.`,
      scope: String.raw`Uniform line charge on a thin straight rod in vacuum; the infinite-line formula is accurate to 1 % when the probe is closer to the rod than about a tenth of its distance to the nearer end.`,
      deps: ['em-1.7'],
      refs: ['Griffiths §2.1', 'Purcell ch. 1'],
      tags: ['line charge', 'field'],
      viz(v) {
        const M = v.M, C = M.CONST, lam = 50e-9, K = C.ke * lam * 100; // N/C per (1/cm)
        const s = v.stage({ x: [-12, 12], y: [-6.5, 6.5], equal: true, height: 330, axes: false, weight: 1.5 });
        const sp = v.stage({ x: [0.1, 100], y: [10, 1e7], xlog: true, ylog: true, height: 330, axes: 'box', weight: 1, xlabel: 'distance s (cm)', title: '$|\\mathbf E|$ (N/C) on the perpendicular through $P$' });
        const Lr = v.slider('rod length $L$', 1, 200, 16, { log: true, fmt: (x) => `${x.toPrecision(3)} cm` });
        const P = s.handle(1.5, 1.8, { color: 'gold', r: 7, label: '$P$' });
        const closed = (x, y, L) => { const a = -L / 2 - x, b = L / 2 - x, sy = Math.max(1e-9, Math.abs(y)), r1 = Math.hypot(a, sy), r2 = Math.hypot(b, sy); return [K * (1 / r2 - 1 / r1), (K * (b / r2 - a / r1)) / sy]; };
        const numeric = (x, y, L) => { const sy = Math.max(1e-9, Math.abs(y)), r = quad2((xp) => { const dx = x - xp, d3 = Math.pow(dx * dx + sy * sy, 1.5); return [dx / d3, sy / d3]; }, -L / 2, L / 2, 1e-12, 24, 32); return [K * r[0], K * r[1]]; };
        const dev = (x, y, L) => { const E = closed(x, y, L); return Math.abs(Math.hypot(E[0], E[1]) / ((2 * K) / Math.abs(y)) - 1); };
        let st = null;
        v.render(() => {
          const L = Lr.value, Pc = v.rgb('panel'), G = v.rgb('green'), O = v.rgb('orange');
          s.raster((x, y) => {
            if (Math.abs(y) < 1e-6) return null;
            const t = Math.max(0, Math.min(1, (Math.log10(dev(x, y, L) + 1e-12) + 3) / 3));
            const [A, k] = t < 0.34 ? [G, 0.42 * (1 - t / 0.34)] : [O, 0.36 * Math.pow((t - 0.34) / 0.66, 1.3)];
            return [Pc[0] + (A[0] - Pc[0]) * k, Pc[1] + (A[1] - Pc[1]) * k, Pc[2] + (A[2] - Pc[2]) * k];
          }, { res: 3, key: `${L}|${Pc.join(',')}` });
          const lg = (x, y) => Math.log10(dev(x, y, L) + 1e-12);
          s.contour(lg, [-2], { color: v.color('green', 0.9), width: 1.4 });
          s.contour(lg, [-1], { color: v.color('orange', 0.9), width: 1.4 });
          const x0 = Math.max(-L / 2, -12.5), x1 = Math.min(L / 2, 12.5);
          s.line(x0, 0, x1, 0, { color: 'red', width: 6, alpha: 0.75 });
          for (let x = Math.ceil(x0); x <= x1; x += 1) s.text('+', x, 0, { align: 'center', size: 11, color: 'panel', weight: 700, halo: false });
          if (L / 2 > 12) { s.text('rod continues →', 11.8, -0.55, { align: 'right', size: 11, color: 'red' }); s.text('← rod continues', -11.8, -0.55, { align: 'left', size: 11, color: 'red' }); }
          s.line(P.x, 0, P.x, P.y, { color: 'gold', width: 1.2, dash: [4, 3] });
          const E = numeric(P.x, P.y, L), Ec = closed(P.x, P.y, L), m = Math.hypot(...E);
          arrowPx(s, P.x, P.y, E[0], E[1] * Math.sign(P.y || 1), 70, { color: 'gold', width: 3, head: 10 });
          const lab = (lv, col, txt) => { let a = 0.01, b = 6.4; if (dev(0, b, L) < lv) return; for (let it = 0; it < 50; it++) { const m = (a + b) / 2; if (dev(0, m, L) < lv) a = m; else b = m; } s.text(txt, 0, a, { align: 'center', size: 11.5, color: col, weight: 600, dy: -8 }); };
          lab(0.01, 'green', '1 %'); lab(0.1, 'orange', '10 %');
          // the perpendicular profile
          const prof = []; for (let k = 0; k <= 70; k++) { const d = 0.1 * Math.pow(1000, k / 70), e = numeric(P.x, d, L); prof.push([d, Math.hypot(...e)]); }
          sp.fn((d) => (2 * K) / d, { color: 'green', dash: [6, 4], width: 1.6 });
          sp.fn((d) => (K * L) / (d * d + P.x * P.x), { color: 'orange', dash: [3, 4], width: 1.6, domain: [Math.max(0.1, L / 3), 100] });
          sp.path(prof, { color: 'accent', width: 2.6 });
          sp.dot(Math.max(0.1, Math.abs(P.y)), m, { r: 6, color: 'gold' });
          st = { E, Ec, m, s: Math.abs(P.y) };
        });
        v.legend([['accent', 'numerical integral'], ['green', '$\\lambda/2\\pi\\varepsilon_0 s$ (infinite line)', { dash: true }], ['orange', '$\\lambda L/4\\pi\\varepsilon_0 r^2$ (point charge)', { dash: true }]]);
        v.readout(() => {
          const inf = (2 * K) / st.s, d = Math.hypot(st.E[0] - st.Ec[0], st.E[1] - st.Ec[1]) / st.m;
          return `$\\lambda = 50$ nC/m · at $P$ ($s = ${v.fix(st.s, 2)}$ cm): numerical integral ${M.si(st.m, 'N/C')} (the closed form agrees ${d < 1e-10 ? 'to better than $10^{-10}$' : 'to ' + v.fix(d, 6)}) · infinite line $\\lambda/2\\pi\\varepsilon_0 s$ = ${M.si(inf, 'N/C')} · ratio ${v.fix(st.m / inf, 4)}`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 1.9
    {
      num: '1.9',
      kind: 'Model',
      name: 'Fields of a charged ring and disk',
      statement: String.raw`On the axis of a ring of radius $R$ carrying total charge $Q$ uniformly, at height $z$ above its centre, the field points along the axis with
$$E_z = \frac{1}{4\pi\varepsilon_0}\,\frac{Qz}{(z^2+R^2)^{3/2}} ,$$
which vanishes at the centre and is largest at $z = \pm R/\sqrt2$. On the axis of a uniformly charged disk of radius $R$ and surface density $\sigma$,
$$E_z = \frac{\sigma}{2\varepsilon_0}\left(1-\frac{z}{\sqrt{z^2+R^2}}\right)\quad(z>0),$$
which tends to $\sigma/2\varepsilon_0$ just above the disk and to the point-charge field $Q/4\pi\varepsilon_0z^2$, $Q = \sigma\pi R^2$, far away. Both are odd in $z$; the disk’s field jumps by $\sigma/\varepsilon_0$ across it.`,
      idea: String.raw`By symmetry every ring element has a partner opposite, and the components of their fields perpendicular to the axis cancel; the axial components are all equal, $dq\,z/4\pi\varepsilon_0(z^2+R^2)^{3/2}$, so they simply add (em-1.7). At the centre each element’s pull is purely sideways and cancels completely. A disk is a stack of rings of radius $r$ and charge $\sigma\,2\pi r\,dr$; integrating the ring formula over $r$ gives the disk’s field. Close to the disk every ring within a wide cone contributes, and the result no longer depends on $z$ — the seed of the uniform field of an infinite plane (em-1.10).`,
      caption: String.raw`Drag $P$ along the axis in the right panel (or rotate the 3D view). For the ring the thin red arrows are the fields of eight of its elements (enlarged): their sideways parts cancel in pairs and the green resultant points along the axis. The curve is the numerical sum; the readout locates its maximum and compares it with $R/\sqrt2$. For the disk the curve is a numerical integral over rings: flat at $\sigma/2\varepsilon_0$ near the disk and merging into the point-charge curve far away.`,
      scope: String.raw`Exact on the axis for thin, uniformly charged rings and disks in vacuum; off the axis the fields involve elliptic integrals.`,
      deps: ['em-1.7'],
      refs: ['Griffiths §2.1'],
      tags: ['ring', 'disk', 'field'],
      viz(v) {
        const M = v.M, C = M.CONST, Q = 10e-9, k = C.ke;
        const shape = v.select('', [{ value: 'ring', label: 'ring' }, { value: 'disk', label: 'disk' }], 'ring');
        const s3 = v.stage3d({ range: 3.5, height: 340, yaw: -0.55, pitch: 0.32, axes: false, weight: 0.9 });
        const sp = v.stage({ x: [-8, 8], y: [-1, 1], height: 340, axes: 'box', weight: 1.15, xlabel: 'height z on the axis (cm)', title: '$E_z$ on the axis (kN/C)' });
        const Rs = v.slider('radius $R$', 1, 3, 2, { step: 0.05, fmt: (x) => `${x.toFixed(2)} cm` });
        const zh = sp.handle(3.2, 0, { color: 'gold', r: 7, label: '$P$', constrain: 'x' });
        const NR = 720;
        /** Ring of radius R (cm), charge q (C): vector sum of NR element fields at (0, 0, z) cm → [Ex, Ey, Ez] N/C. */
        const ringE = (z, R, q = Q) => { let ex = 0, ey = 0, ez = 0; for (let j = 0; j < NR; j++) { const ph = (TAU * j) / NR, dx = -R * Math.cos(ph) * 0.01, dy = -R * Math.sin(ph) * 0.01, dz = z * 0.01, d3 = Math.pow(dx * dx + dy * dy + dz * dz, 1.5), c = (k * q) / NR / d3; ex += c * dx; ey += c * dy; ez += c * dz; } return [ex, ey, ez]; };
        const ringAxis = (z, r, q) => (k * q * z * 0.01) / Math.pow((z * z + r * r) * 1e-4, 1.5);
        const diskE = (z, R) => { const sig = Q / (Math.PI * R * R * 1e-4); return quad((r) => ringAxis(z, r, sig * TAU * r * 1e-4), 0, R, 1e-6, 20, 16); };
        const formula = (z, R) => (shape.value === 'ring' ? ringAxis(z, R, Q) : (Q / (Math.PI * R * R * 1e-4) / (2 * C.eps0)) * (Math.sign(z) - z / Math.hypot(z, R)));
        let st = null, key = '', curve = [];
        v.render(() => {
          const R = Rs.value, ring = shape.value === 'ring';
          if (key !== `${R}|${ring}`) { key = `${R}|${ring}`; curve = []; for (let i = 0; i <= 320; i++) { const z = -8 + (16 * i) / 320; if (Math.abs(z) < 1e-9) { curve.push(null); continue; } curve.push([z, (ring ? ringE(z, R)[2] : diskE(z, R)) / 1e3]); } }
          const vals = curve.filter(Boolean).map((p) => Math.abs(p[1])), ymax = Math.max(...vals) * 1.32;
          sp.setView([-8, 8], [-ymax, ymax]);
          const z = Math.abs(zh.x) < 0.02 ? 0.02 : zh.x, Ez = (ring ? ringE(z, R)[2] : diskE(z, R)) / 1e3; zh.y = Ez;
          sp.hline(0, { color: 'faint', width: 1 });
          const Qpt = (zz) => (k * Q * Math.sign(zz)) / (zz * zz * 1e-4) / 1e3;
          sp.clip(() => sp.fn(Qpt, { color: 'orange', dash: [3, 4], width: 1.5, domain: [-8, 8], n: 400 }));
          if (!ring) { const E0 = Q / (Math.PI * R * R * 1e-4) / (2 * C.eps0) / 1e3; sp.hline(E0, { color: 'green', dash: [6, 4], width: 1.4 }); sp.hline(-E0, { color: 'green', dash: [6, 4], width: 1.4 }); sp.text('σ/2ε₀', 7.8, E0, { align: 'right', size: 11.5, color: 'green', dy: -10 }); }
          for (const dom of [[-8, -1e-6], [1e-6, 8]]) sp.fn((zz) => formula(zz, R) / 1e3, { color: 'muted', width: 5, alpha: 0.25, domain: dom, n: 200 });
          sp.path(curve, { color: 'accent', width: 2.4 });
          let zpk = NaN;
          if (ring) {
            let a = 0.05, b = 3 * R; for (let it = 0; it < 60; it++) { const m1 = a + (b - a) * 0.382, m2 = a + (b - a) * 0.618; if (ringE(m1, R)[2] > ringE(m2, R)[2]) b = m2; else a = m1; }
            zpk = (a + b) / 2; const Ep = ringE(zpk, R)[2] / 1e3;
            sp.line(zpk, 0, zpk, Ep, { color: 'green', dash: [4, 3], width: 1.2 }); sp.dot(zpk, Ep, { r: 5, color: 'green', label: '$R/\\sqrt2$', labelPos: 'ne' });
          }
          // 3D picture (shifted along the axis so that P stays in view)
          const off = -Math.sign(z) * Math.min(1.2, Math.abs(z) * 0.5), sh = (p) => [p[0], p[1], p[2] + off];
          const S3 = { curve: (g, a, b, o) => s3.curve((t) => sh(g(t)), a, b, o), poly: (pts, o) => s3.poly(pts.map(sh), o), dot: (p, o) => s3.dot(sh(p), o), arrow: (p, q, o) => s3.arrow(sh(p), sh(q), o), text: (t, p, o) => s3.text(t, sh(p), o), line: (p, q, o) => s3.line(sh(p), sh(q), o) };
          for (const [e, lab] of [[[1, 0, 0], 'x'], [[0, 1, 0], 'y'], [[0, 0, 1], 'z']]) { S3.line(e.map((c) => -3.1 * c), e.map((c) => 3.1 * c), { color: 'faint', width: 1 }); S3.text(lab, e.map((c) => 3.35 * c), { color: 'muted', math: true }); }
          
          if (ring) {
            S3.curve((t) => [R * Math.cos(t), R * Math.sin(t), 0], 0, TAU, { color: 'red', width: 3.5, n: 120 });
          } else {
            const poly = []; for (let i = 0; i < 72; i++) poly.push([R * Math.cos((TAU * i) / 72), R * Math.sin((TAU * i) / 72), 0]);
            S3.poly(poly, { fill: 'red', fillAlpha: 0.22, color: 'red', width: 1.5 });
            for (const f of [0.25, 0.5, 0.75]) S3.curve((t) => [f * R * Math.cos(t), f * R * Math.sin(t), 0], 0, TAU, { color: 'red', width: 1, alpha: 0.5, n: 60 });
          }
          // element fields at P, drawn to a common scale (each piece magnified by the number of pieces shown)
          const P3 = [0, 0, z], els = ring ? [1] : [0.35, 0.7, 1], nE = 8, parts = [];
          for (const f of els) for (let j = 0; j < nE; j++) {
            const ph = (TAU * j) / nE + (f === 1 ? 0 : 0.4 * f), ex = f * R * Math.cos(ph), ey = f * R * Math.sin(ph), w = ring ? 1 : f;
            const d = [-ex, -ey, z], dl = Math.hypot(...d), m = w / (dl * dl * dl);
            parts.push([ex, ey, d[0] * m, d[1] * m, d[2] * m]);
          }
          const sz = parts.reduce((a, p) => a + p[4], 0), sc = 1.3 / Math.abs(sz || 1), mag = ring ? 5 : 9;
          for (const [ex, ey, ux, uy, uz] of parts) {
            S3.dot([ex, ey, 0], { r: 3, color: 'red', ring: false });
            S3.arrow(P3, [ux * sc * mag, uy * sc * mag, z + uz * sc * mag], { color: 'red', alpha: 0.55, width: 1.5, head: 8 });
          }
          S3.arrow(P3, [0, 0, z + Math.sign(sz) * 1.3], { color: 'green', width: 4, head: 12 });
          S3.dot(P3, { r: 5, color: 'gold' }); S3.text('P', [-0.45, 0.2, z - 0.15], { color: 'gold', math: true });
          st = { Ez, z, R, zpk };
        });
        v.legend([['accent', 'numerical sum / integral'], ['muted', 'closed-form formula', { area: true }], ['orange', 'point charge $Q/4\\pi\\varepsilon_0 z^2$', { dash: true }]]);
        v.readout(() => {
          const { Ez, z, R, zpk } = st, f = formula(z, R) / 1e3;
          if (shape.value === 'ring') {
            const tr = Math.hypot(...ringE(z, R).slice(0, 2));
            return `$Q = 10$ nC · at $z = ${v.fix(z, 2)}$ cm: sum of ${NR} element fields $E_z$ = ${M.si(Ez * 1e3, 'N/C')} (sideways parts cancel to ${M.si(tr, 'N/C')}) · formula ${M.si(f * 1e3, 'N/C')} · maximum found at $z = ${v.fix(zpk, 4)}$ cm, $R/\\sqrt2 = ${v.fix(R / Math.SQRT2, 4)}$ cm`;
          }
          const E0 = Q / (Math.PI * R * R * 1e-4) / (2 * C.eps0);
          return `$Q = 10$ nC, $\\sigma$ = ${M.si(Q / (Math.PI * R * R * 1e-4), 'C/m²')} · at $z = ${v.fix(z, 2)}$ cm: integral over rings ${M.si(Ez * 1e3, 'N/C')}, formula ${M.si(f * 1e3, 'N/C')} · $\\sigma/2\\varepsilon_0$ = ${M.si(E0, 'N/C')} (ratio ${v.fix((Ez * 1e3) / E0, 3)}) · $E_z\\cdot 4\\pi\\varepsilon_0 z^2/Q = ${v.fix((Ez * 1e3 * z * z * 1e-4) / (k * Q), 3)}$ (→ 1 far away)`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 1.10
    {
      num: '1.10',
      kind: 'Model',
      name: 'Infinite charged plane: a uniform field',
      statement: String.raw`An infinite plane carrying uniform surface charge $\sigma$ produces on each side a **uniform** field perpendicular to the plane, pointing away from it if $\sigma>0$, of magnitude
$$E = \frac{\sigma}{2\varepsilon_0},$$
independent of the distance from the plane. Two parallel planes with charges $+\sigma$ and $-\sigma$ produce the field $\sigma/\varepsilon_0$, pointing from the positive to the negative plane, between them, and **no field** outside.`,
      idea: String.raw`It is the $R\to\infty$ limit of the disk (em-1.9): $\sigma/2\varepsilon_0\,(1 - z/\sqrt{z^2+R^2}) \to \sigma/2\varepsilon_0$ for every $z$. Distance does not matter because moving away from the plane weakens each element’s field like $1/r^2$, but the area of plane seen within a given cone of directions grows like $r^2$ — the two exactly compensate. Superposition (em-1.4) then gives the pair: between the planes the two fields of size $\sigma/2\varepsilon_0$ point the same way and add, outside they point oppositely and cancel. This is the ideal parallel-plate capacitor; a finite plate is close to it when the plate is large compared with its distance from the probe.`,
      caption: String.raw`Side view of a charged disk ($\sigma$ = 50 nC/m²); the arrows are its field (length ∝ $\sqrt{|\mathbf E|}$), computed by integrating over the disk in polar coordinates centred under each point. Grow the radius: the arrows straighten and equalize, and the axial profile on the right flattens onto $\pm\sigma/2\varepsilon_0$. Drag $P$: the readout compares the field there with the field at twice the height. With two sheets the field fills the gap and vanishes outside — but only once the disks are large.`,
      scope: String.raw`An idealization: a real plate of radius $R$ is uniform to within 1 % only at distances below about $R/100$ from its centre region and away from its edges.`,
      deps: ['em-1.9'],
      refs: ['Griffiths §2.2', 'Purcell ch. 1'],
      tags: ['plane', 'uniform field'],
      viz(v) {
        const M = v.M, C = M.CONST, sig = 50e-9, kS = C.ke * sig, E2 = sig / (2 * C.eps0);
        const s = v.stage({ x: [-10, 10], y: [-6, 6], equal: true, height: 330, axes: false, weight: 1.45 });
        const sp = v.stage({ x: [-6, 6], y: [-4, 4], height: 330, axes: 'box', weight: 1, xlabel: 'height z on the axis (cm)', title: '$E_z$ on the axis (kN/C)' });
        const mode = v.select('', [{ value: 'one', label: 'one sheet $+\\sigma$' }, { value: 'two', label: 'two sheets $\\pm\\sigma$' }], 'one');
        const Rs = v.slider('disk radius $R$', 1, 1000, 6, { log: true, fmt: (x) => M.si(x * 0.01, 'm') });
        const P = s.handle(2.5, 2.2, { color: 'gold', r: 7, label: '$P$' });
        const H = 1.5;
        /** Field (in units of kσ) at (x, z) cm of a disk of radius R cm in the plane z = 0. */
        const disk = (x, z, R) => {
          const Z = Math.abs(z); if (Z < 1e-7) return [NaN, NaN];
          const fz = (t) => Z / Math.sqrt(t * t + Z * Z), fr = (t) => Math.asinh(t / Z) - t / Math.sqrt(t * t + Z * Z);
          const r = quad2((ph) => {
            const ux = Math.cos(ph), b = x * ux, disc = b * b - (x * x - R * R); if (disc <= 0) return [0, 0];
            const sq = Math.sqrt(disc), t2 = -b + sq; if (t2 <= 0) return [0, 0];
            const t1 = Math.max(0, -b - sq); return [-(fr(t2) - fr(t1)) * ux, fz(t1) - fz(t2)];
          }, 0, TAU, 1e-9, 16, 24);
          return [r[0], Math.sign(z) * r[1]];
        };
        const field = (x, z, R) => {
          if (mode.value === 'one') return disk(x, z, R).map((c) => c * kS);
          const a = disk(x, z + H, R), b = disk(x, z - H, R); return [(a[0] - b[0]) * kS, (a[1] - b[1]) * kS];
        };
        let key = '', grid = [], prof = [], st = null;
        v.render(() => {
          const R = Rs.value, two = mode.value === 'two';
          if (key !== `${R}|${two}`) {
            key = `${R}|${two}`; grid = [];
            for (let x = -9.25; x <= 9.3; x += 1.25) for (let z = -5.5; z <= 5.6; z += 1) grid.push([x, z, field(x, z, R)]);
            prof = []; for (let i = 0; i <= 240; i++) { const z = -6 + (12 * i) / 240; const near = two ? Math.min(Math.abs(z - H), Math.abs(z + H)) : Math.abs(z); prof.push(near < 1e-6 ? null : [z, field(0, z, R)[1] / 1e3]); }
          }
          const ref = E2;
          // sheets
          const sheets = two ? [[-H, 'red', '+'], [H, 'blue', '−']] : [[0, 'red', '+']];
          for (const [zz, col, sg] of sheets) {
            const x0 = Math.max(-R, -10.5), x1 = Math.min(R, 10.5);
            s.line(x0, zz, x1, zz, { color: col, width: 5, alpha: 0.75 });
            for (let x = Math.ceil(x0 / 1.25) * 1.25; x <= x1; x += 1.25) s.text(sg, x, zz, { align: 'center', size: 11, weight: 700, color: 'panel', halo: false });
          }
          if (R > 10) s.corner(`disk edge at ${M.si(R * 0.01, 'm')}, far off-screen`, 'tr', { size: 11 });
          for (const [x, z, E] of grid) { const m = Math.hypot(...E); if (!isFinite(m) || m < ref * 0.003) continue; const L = Math.min(34, 24 * Math.sqrt(m / ref)); arrowPx(s, x - (E[0] / m) * (L / 2) / s.sx, z - (E[1] / m) * (L / 2) / s.sy, E[0], E[1], L, { color: 'accent', width: 1.6, head: Math.min(7, L * 0.45), alpha: 0.85 }); }
          const EP = field(P.x, P.y, Rs.value), EP2 = field(P.x, 2 * P.y, Rs.value);
          arrowPx(s, P.x, P.y, EP[0], EP[1], Math.min(80, 58 * Math.sqrt(Math.hypot(...EP) / ref)), { color: 'gold', width: 3, head: 10 });
          s.dot(P.x, 2 * P.y, { r: 3.5, color: 'gold', alpha: 0.6 });
          // profile
          const ymax = (two ? 2.4 : 1.4) * ref / 1e3; sp.setView([-6, 6], [-ymax, ymax]);
          sp.hline(0, { color: 'faint', width: 1 });
          if (two) { sp.path([[-6, 0], [-H, 0], null, [-H, (2 * ref) / 1e3], [H, (2 * ref) / 1e3], null, [H, 0], [6, 0]], { color: 'green', dash: [6, 4], width: 1.6 }); }
          else { sp.hline(ref / 1e3, { color: 'green', dash: [6, 4], width: 1.4 }); sp.hline(-ref / 1e3, { color: 'green', dash: [6, 4], width: 1.4 }); }
          for (const [zz, col] of sheets) sp.vline(zz, { color: col, width: 2, alpha: 0.5 });
          sp.path(prof, { color: 'accent', width: 2.6 });
          st = { EP, EP2 };
        });
        v.legend([['accent', 'computed field of the disk(s)'], ['green', 'infinite sheets: $\\pm\\sigma/2\\varepsilon_0$, or $\\sigma/\\varepsilon_0$ in the gap', { dash: true }], ['gold', 'probe $P$ (faint dot: twice as high)', { dot: true }]]);
        v.readout(() => {
          const { EP, EP2 } = st, m = Math.hypot(...EP), m2 = Math.hypot(...EP2);
          return `$\\sigma/2\\varepsilon_0$ = ${M.si(E2, 'N/C')} · at $P$: ${M.si(m, 'N/C')} = ${v.fix(m / E2, 3)} $\\sigma/2\\varepsilon_0$, tilted ${v.fix((Math.atan2(Math.abs(EP[0]), Math.abs(EP[1])) * 180) / Math.PI, 1)}° from the normal · at twice the height: ${v.fix(m2 / E2, 3)} $\\sigma/2\\varepsilon_0$`;
        });
      },
    },
  ],
};
