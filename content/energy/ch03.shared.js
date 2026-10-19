// Energy Systems — Chapter 3: Fuels and nuclear energy — helpers and data shared by ch03.js
//
// DATA SOURCES (checked October 2026)
//   BEA, NUC: Atomic Mass Evaluation AME2020 (Huang, Wang, Kondev, Audi, Naimi, Chin. Phys. C 45, 030002 (2021); Wang et al., ibid. 030003),
//     file mass_1.mas20.txt from the IAEA Nuclear Data Section mirror (www-nds.iaea.org/amdc/ame2020/). BEA lists, for every mass number A
//     from 1 to 295 that has measured masses, the most tightly bound measured isobar: [A, Z, binding energy per nucleon in keV].
//     NUC lists chosen nuclides as [A, Z, atomic mass excess in keV, total binding energy in keV] (experimental values, no "#" extrapolations).
//   Delayed neutrons: DOE-HDBK-1019/1-93 NP-02Table3; printed fractions/half-lives in source-audit-kinetics.shared.js (sum0.00649).
//   Chain-reaction inputs: inspected DOE-HDBK-1019/2-93 p7 teaching example and NIST NCNR moderator table;
//     all measured versus chosen parameters are separated in source-audit-chain.shared.js.
//   D–T reactivity: Bosch & Hale, Nucl. Fusion 32, 611 (1992): the S-factor fit for T(d,n)4He with the coefficients quoted in the WarpX source,
//     integrated here over a Maxwellian (the paper's own reactivity fit is not used). Check: 1.14e-22 m^3/s at 10 keV.
export * from './ch02.shared.js';
import { clamp, lerp } from './ch02.shared.js';

export const BEA = [[1,1,0],[2,1,1112],[3,1,2827],[4,2,7074],[5,2,5512],[6,3,5332],[7,3,5606],[8,4,7062],[9,4,6463],[10,4,6498],[11,5,6928],[12,6,7680],[13,6,7470],[14,6,7520],[15,7,7699],[16,8,7976],[17,8,7751],[18,8,7767],[19,9,7779],[20,10,8032],[21,10,7972],[22,10,8080],[23,11,8111],[24,12,8261],[25,12,8224],[26,12,8334],[27,13,8332],[28,14,8448],[29,14,8449],[30,14,8521],[31,15,8481],[32,16,8493],[33,15,8514],[34,16,8583],[35,16,8538],[36,16,8575],[37,17,8570],[38,18,8614],[39,18,8563],[40,18,8595],[41,19,8576],[42,20,8617],[43,20,8601],[44,20,8658],[45,20,8631],[46,20,8669],[47,21,8665],[48,22,8723],[49,22,8711],[50,22,8756],[51,23,8742],[52,24,8776],[53,24,8760],[54,24,8778],[55,25,8765],[56,26,8790],[57,26,8770],[58,26,8792],[59,27,8768],[60,28,8781],[61,28,8765],[62,28,8795],[63,28,8763],[64,28,8777],[65,29,8757],[66,30,8760],[67,29,8737],[68,30,8756],[69,31,8725],[70,30,8730],[71,31,8718],[72,32,8732],[73,32,8705],[74,32,8725],[75,33,8701],[76,34,8711],[77,33,8696],[78,34,8718],[79,34,8696],[80,34,8711],[81,35,8696],[82,36,8711],[83,36,8696],[84,36,8717],[85,36,8699],[86,36,8712],[87,37,8711],[88,38,8733],[89,39,8714],[90,40,8710],[91,40,8693],[92,40,8693],[93,40,8672],[94,40,8667],[95,42,8649],[96,42,8654],[97,42,8635],[98,42,8635],[99,43,8614],[100,44,8619],[101,44,8601],[102,44,8607],[103,44,8584],[104,44,8587],[105,45,8573],[106,46,8580],[107,46,8561],[108,46,8567],[109,47,8548],[110,48,8551],[111,48,8537],[112,48,8545],[113,48,8527],[114,48,8532],[115,49,8517],[116,50,8523],[117,50,8510],[118,50,8517],[119,50,8499],[120,50,8504],[121,50,8485],[122,50,8488],[123,51,8472],[124,52,8473],[125,51,8458],[126,52,8463],[127,52,8446],[128,52,8449],[129,53,8436],[130,54,8438],[131,54,8424],[132,54,8428],[133,54,8413],[134,54,8414],[135,55,8401],[136,56,8403],[137,56,8392],[138,56,8393],[139,57,8378],[140,58,8376],[141,58,8355],[142,58,8347],[143,60,8330],[144,60,8327],[145,60,8309],[146,60,8304],[147,61,8284],[148,62,8280],[149,62,8263],[150,62,8262],[151,62,8244],[152,62,8244],[153,63,8229],[154,62,8227],[155,63,8217],[156,64,8215],[157,64,8204],[158,64,8202],[159,65,8189],[160,66,8184],[161,65,8174],[162,66,8173],[163,66,8162],[164,66,8159],[165,67,8147],[166,68,8142],[167,68,8132],[168,68,8130],[169,68,8117],[170,68,8112],[171,69,8102],[172,70,8097],[173,70,8087],[174,70,8084],[175,70,8071],[176,70,8064],[177,71,8053],[178,72,8049],[179,72,8039],[180,72,8035],[181,73,8023],[182,74,8018],[183,74,8008],[184,74,8005],[185,74,7993],[186,74,7989],[187,75,7978],[188,76,7974],[189,76,7963],[190,76,7962],[191,76,7951],[192,76,7949],[193,77,7938],[194,78,7936],[195,78,7927],[196,78,7927],[197,78,7916],[198,78,7914],[199,79,7907],[200,80,7906],[201,80,7898],[202,80,7897],[203,80,7887],[204,80,7886],[205,81,7878],[206,82,7875],[207,82,7870],[208,82,7867],[209,82,7849],[210,82,7836],[211,83,7820],[212,84,7810],[213,84,7794],[214,84,7785],[215,84,7768],[216,84,7759],[217,85,7745],[218,86,7739],[219,86,7724],[220,86,7717],[221,87,7703],[222,88,7697],[223,88,7685],[224,88,7680],[225,88,7668],[226,88,7662],[227,89,7651],[228,90,7645],[229,90,7635],[230,90,7631],[231,90,7620],[232,90,7615],[233,91,7605],[234,92,7601],[235,92,7591],[236,92,7586],[237,92,7576],[238,92,7570],[239,93,7561],[240,94,7556],[241,94,7546],[242,94,7541],[243,94,7531],[244,94,7525],[245,96,7516],[246,96,7511],[247,96,7502],[248,96,7497],[249,97,7486],[250,98,7480],[251,98,7471],[252,98,7465],[253,98,7455],[254,98,7449],[255,99,7438],[256,100,7432],[257,100,7422],[258,101,7410],[259,102,7400],[260,106,7343],[261,104,7371],[262,106,7341],[264,108,7298],[265,108,7296],[266,108,7298],[269,110,7250],[270,110,7254]];
export const NUC = {n:[1,0,8071.31806,0.0],H1:[1,1,7288.971064,0.0],H2:[2,1,13135.722895,2224.566],H3:[3,1,14949.8109,8481.796],He3:[3,2,14931.21888,7718.041],He4:[4,2,2424.91587,28295.662],C12:[12,6,0.0,92161.735],O16:[16,8,-4737.00217,127619.315],Fe56:[56,26,-60607.163,492259.953],Ni62:[62,28,-66746.44,545262.441],Kr92:[92,36,-68769.329,783166.1],Sr94:[94,38,-78845.721,807820.434],Xe139:[139,54,-75644.586,1155311.066],Xe140:[140,54,-72986.461,1160724.25],Ba141:[141,56,-79732.492,1173976.913],Ba144:[144,56,-71767.13,1190225.506],U235:[235,92,40918.782,1783865.049],U238:[238,92,47307.732,1801690.036],Sr90:[90,38,-85950.945,782640.387],Zr96:[96,40,-85438.86,828991.517],Te134:[134,52,-82533.752,1123408.323],Mo100:[100,42,-86193.029,860466.26],Te137:[137,52,-69303.762,1134392.291]};

export const MEV_U = 931.49410242;      // MeV per atomic mass unit (CODATA 2018)
export const LV = 2.442;                // MJ/kg, latent heat of water at 25 °C (44.0 kJ/mol; NIST WebBook Antoine fit gives 44 kJ/mol at 298 K)
export const MH2O_PER_H = 18.015 / 2.016; // kg water per kg hydrogen burnt
/** Binding energy per nucleon (MeV) of the most bound isobar of mass number A (linear interpolation outside the table gives 0). */
export function beaOf(A) { const r = BEA[Math.round(A) - 1]; return r ? r[2] / 1000 : 0; }
/** Total binding energy (MeV) of the most bound measured isobar with A nucleons. */
export const bOf = (A) => A * beaOf(A);

// ───────────────────────────────────────────────── six-group delayed neutron model
export {DN_BETA,DN_LAM,BETA,kinMatrix,kinEq,kinAdvance,inhour} from './source-audit-kinetics.shared.js';

// ───────────────────────────────────────────────── D–T fusion
const AFS = 1 / 137.035999, MDC2 = 2.01410178 * MEV_U * 1e3, MTC2 = 3.01604928 * MEV_U * 1e3; // keV
const MRC2 = MDC2 * MTC2 / (MDC2 + MTC2);
const BG = Math.PI * AFS * Math.sqrt(2 * MRC2);   // Gamow constant, keV^1/2
const SA = [6.927e4, 7.454e8, 2.050e6, 5.2002e4], SB = [6.38e1, -9.95e-1, 6.981e-5, 1.728e-4];
const Sfac = (E) => (SA[0] + E * (SA[1] + E * (SA[2] + E * SA[3]))) / (1 + E * (SB[0] + E * (SB[1] + E * (SB[2] + E * SB[3]))));
/** D–T cross section in m² at centre-of-mass energy E (keV), valid above 0.5 keV. */
export const sigmaDT = (E) => 1e-31 * Sfac(E) / E * Math.exp(-BG / Math.sqrt(E));
const SVT = [], SVN = 90;
function svRaw(T) {
  const N = 700, Em = Math.min(2000, Math.max(40 * T, 100)), h = (Em - 0.5) / N; let s = 0;
  for (let i = 0; i <= N; i++) { const E = 0.5 + i * h; s += (i === 0 || i === N ? 0.5 : 1) * sigmaDT(E) * E * Math.exp(-E / T) * h; }
  return 299792458 * Math.sqrt(8 / (Math.PI * MRC2)) * T ** -1.5 * s;
}
/** Maxwell-averaged D–T reactivity <σv> in m³/s at ion temperature T (keV, 1–200). Tabulated once, then log–log interpolated. */
export function sigmavDT(T) {
  if (!SVT.length) for (let i = 0; i <= SVN; i++) { const t = Math.exp(lerp(Math.log(1), Math.log(200), i / SVN)); SVT.push([Math.log(t), Math.log(svRaw(t))]); }
  const u = clamp((Math.log(T) - SVT[0][0]) / (SVT[SVN][0] - SVT[0][0]) * SVN, 0, SVN - 1e-9), i = Math.floor(u);
  return Math.exp(lerp(SVT[i][1], SVT[i + 1][1], u - i));
}
export const E_ALPHA = 3518, E_FUS = 17589;     // keV: alpha share and total energy of D + T → 4He + n (the alpha gets 1/5)
export const CB = 5.35e-37 * 6.2415e15;          // bremsstrahlung: P_B = CB · n² · √T  with n in m⁻³, T in keV → keV m⁻³ s⁻¹
/** Triple product n·T·τ_E (keV s m⁻³) needed for fusion gain Q (Infinity = ignition) at temperature T keV; Infinity if unreachable. */
export function tripleNeeded(T, Q = Infinity) {
  const d = sigmavDT(T) / 4 * (E_ALPHA + (isFinite(Q) ? E_FUS / Q : 0)) - CB * Math.sqrt(T);
  return d > 0 ? 3 * T * T / d : Infinity;
}
/** Fusion gain Q of a plasma with density n (m⁻³), temperature T (keV) and energy confinement time tau (s); Infinity when self-heated. */
export function gainQ(n, T, tau) {
  const pf = n * n / 4 * sigmavDT(T) * E_FUS, pa = pf * E_ALPHA / E_FUS, loss = 3 * n * T / tau + CB * n * n * Math.sqrt(T);
  return loss - pa <= 0 ? Infinity : pf / (loss - pa);
}
