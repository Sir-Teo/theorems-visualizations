// UN Manual X (1983), printed p.24 Table3: marital rates per woman-year, ages20–49.
// These differ from Coale's adjusted Hutterite standard below.
export const CT_AGES = Object.freeze([20, 25, 30, 35, 40, 45]);
export const CT_N = Object.freeze([.460, .431, .395, .322, .167, .024]);
export const CT_V = Object.freeze([0, -.279, -.667, -1.042, -1.414, -1.671]);
// Coale (1967), printed p.209 Table1; p.205 explains the substituted15–19 value.
export const PRINCETON_AGES = Object.freeze([15, 20, 25, 30, 35, 40, 45]);
export const PRINCETON_H = Object.freeze([.300, .550, .502, .447, .406, .222, .061]);
const total = xs => xs.reduce((a, b) => a + b, 0);

// Authored departure from the exact model. It is not an observation or a control estimate.
export function maritalSchedule(M, m, departure = 0) {
  if (!(M > 0) || ![M, m, departure].every(Number.isFinite)) throw new RangeError('Finite parameters and positive M are required.');
  return CT_N.map((n, i) => M * n * Math.exp(m * CT_V[i] + departure * (CT_V[i] / 1.414) ** 2));
}

// Manual X E.6 recommends unweighted log least squares at20–44 only.
export function fitMaritalSchedule(rates) {
  if (rates.length !== 6 || rates.some(r => !(r > 0 && Number.isFinite(r)))) throw new RangeError('Six positive marital rates are required.');
  const logs = rates.map((r, i) => Math.log(r / CT_N[i])), x = CT_V.slice(0, 5), y = logs.slice(0, 5);
  const mx = total(x) / 5, my = total(y) / 5;
  const m = total(x.map((v, i) => (v - mx) * (y[i] - my))) / total(x.map(v => (v - mx) ** 2));
  const intercept = my - m * mx, M = Math.exp(intercept), fitted = CT_N.map((n, i) => M * n * Math.exp(m * CT_V[i]));
  const residuals = logs.map((l, i) => l - intercept - m * CT_V[i]);
  return { M, m, intercept, logs, fitted, residuals, rmse: Math.sqrt(total(residuals.slice(0, 5).map(x => x * x)) / 5),
    observed20to49: 5 * total(rates), fitted20to49: 5 * total(fitted), baseline20to49: 5 * M * total(CT_N) };
}

// Authored proportions currently married at age-group midpoints: A is a logistic midpoint,
// not a mean age at first marriage; ceiling is not the proportion ever married.
export function currentMarriageShares(midpoint, ceiling) {
  if (!Number.isFinite(midpoint) || !(ceiling > 0 && ceiling <= 1)) throw new RangeError('Finite midpoint and ceiling in(0,1] are required.');
  return PRINCETON_AGES.map(a => ceiling / (1 + Math.exp(-(a + 2.5 - midpoint) / 2.2)));
}

// All rates, exposures and birth allocations refer to the same seven15–49 groups and year.
// Exposure units cancel from the dimensionless indices (here thousands of woman-years).
export function princetonIndices(fertility, exposure, marriage, nonmaritalShare) {
  if ([fertility, exposure, marriage].some(xs => xs.length !== 7) || fertility.some(x => !(x >= 0 && Number.isFinite(x))) || exposure.some(x => !(x >= 0 && Number.isFinite(x))) || marriage.some(x => !(x > 0 && x < 1)) || !(nonmaritalShare >= 0 && nonmaritalShare <= 1)) throw new RangeError('Matched nonnegative rates/exposures, interior marriage shares and a birth share in[0,1] are required.');
  const births = total(fertility.map((f, i) => f * exposure[i])), H = total(PRINCETON_H.map((h, i) => h * exposure[i]));
  if (!(H > 0)) throw new RangeError('Positive standard exposure is required.');
  const Hm = total(PRINCETON_H.map((h, i) => h * exposure[i] * marriage[i])), Hu = total(PRINCETON_H.map((h, i) => h * exposure[i] * (1 - marriage[i])));
  const If = births / H, Ig = (1 - nonmaritalShare) * births / Hm, Ih = nonmaritalShare * births / Hu, Im = Hm / H;
  return { births, H, Hm, Hu, If, Ig, Ih, Im, maritalComponent: Ig * Im, nonmaritalComponent: Ih * (1 - Im),
    reconstructed: Ig * Im + Ih * (1 - Im), partialTFR: 5 * total(fertility) };
}
