// Circuits — Chapter 4: Nonlinear elements and the digital abstraction (part c: the landmark papers 4.14–4.18)
//
// The pictures recreate each paper's central idea with textbook models and illustrative parameters. They are not reproductions of the
// papers' measured data, which are not reproduced here; each caption says what is modelled and what is the paper's own claim.
import { clamp, vT, shock, bisectDec, mos, eng, engTex } from './ch04.shared.js';
import { mooreLogCost, mooreMinimum, mooreVisibleRange, mooreScenarioLog2 } from './circ-source-audit-moore.shared.js';
import { pointContact } from './circ-source-audit-pointcontact.shared.js';
import { junctionGain, junctionProfile } from './circ-source-audit-junction.shared.js';
import { kilbyOscillator } from './circ-source-audit-kilby.shared.js';
import { clockPower, clockCurrentPaths } from './circ-source-audit-cmos-power.shared.js';

const TAU = 2 * Math.PI;

export default {
  collection: 'circ',
  chapter: 4,
  items: [
    // ───────────────────────────────────────────────────────────────────────────────────── 4.14
    {
      num: '4.14',
      kind: 'Paper',
      name: 'The Transistor, A Semi-Conductor Triode',
      paper: { authors: 'J. Bardeen and W. H. Brattain', year: 1948, title: 'The Transistor, A Semi-Conductor Triode', venue: 'Physical Review 74 (2): 230–231', doi: '10.1103/PhysRev.74.230' },
      introduces: ['tech-11.16', 'mat-9.9'],
      credit: 'J. Bardeen and W. H. Brattain, letter dated June25,1948; published July15,1948, Physical Review74:230–231',
      verify: false,
      statement: String.raw`The letter describes an n-type germanium block with emitter and collector point contacts, separated by about $0.005$–$0.025$ cm ($50$–$250\,\mu$m), and a large-area base contact. A small forward emitter bias and reverse collector bias permit emitter-current modulation to control collector current. The authors report voltage and power amplification and define the small-signal current gain $\alpha=(\partial I_C/\partial I_E)_{V_C}$. It may exceed one because injection alters base-to-collector current as well as delivering holes to the collector.`,
      idea: String.raw`The original paper already proposes hole injection and a surface-conductivity explanation; it also describes positive feedback from collector current to effective emitter bias, which can cause instability. Current gain above one must not be read as a probability that more than all injected holes arrive. The picture below is a qualitative illustration and its spacing dependence is chosen, not fitted to the paper's measured characteristics.`,
      caption: String.raw`The block and hole dots are qualitative, not a charge-conserving transport simulation. The chosen collector-current magnitude is $i_C=4\,\mu\mathrm S\,|v_C|+\alpha(d)i_E$, with $\alpha(d)=3e^{-d/(40\,\mu\mathrm m)}$. Curves, load line and input signal are illustrations, not original data. The shaded low-voltage band is outside the model's declared active domain $|v_C|\ge2$ V. If the load line has no intersection in that domain, no operating-point dot or active gain is claimed. When both signal endpoints remain valid, the orange band shows their loaded collector currents.`,
      scope: String.raw`Linear active-domain illustration with $30$ V collector supply, output resistance $250$ kΩ and a chosen input resistance $r_{in}=200+26/\max(I_E[\mathrm{mA}],0.05)$ Ω. The spacing law and low-current regularization are assumptions; the slider includes spacings outside the paper's reported range. Exact loaded gains include $R_L\parallel250$ kΩ. No saturation, reverse current, instability or measured frequency response is modelled.`,
      deps: ['mat-9.5'],
      refs: ['Bardeen–Brattain, Physical Review74 (1948), pp230–231, Figs1–2 and current-gain definition'],
      tags: ['transistor', 'point contact', 'germanium'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Point-contact_transistor', doi: 'https://doi.org/10.1103/PhysRev.74.230' },
      viz(v) {
        const sb = v.stage({ x: [0, 10], y: [0, 6], equal: true, axes: false, height: 330, weight: 0.95, title: 'the germanium block' });
        const sc = v.stage({ x: [0, 32], y: [0, 9], axes: 'box', gutter: true, height: 330, weight: 1.15, xlabel: 'collector voltage $|v_C|$ (V)', ylabel: '$i_C$ (mA)', title: 'collector characteristics' });
        const d = v.slider('contact spacing $d$', 5, 100, 25, { step: 1, fmt: (x) => `${v.fix(x, 0)} µm` });
        const Ie = v.slider('emitter current $I_E$', 0, 4, 1.5, { step: 0.05, fmt: (x) => `${v.fix(x, 2)} mA` });
        const dIe = v.slider('signal swing $\\pm\\delta I_E$', 0.01, 1, 0.2, { log: true, sig: 2, fmt: (x) => `${v.fix(x, 2)} mA` });
        const RL = v.slider('load $R_L$', 1e3, 30e3, 10e3, { log: true, sig: 2, fmt: (x) => `${eng(x, 2)}Ω` });
        let info = null;
        const Vcc = 30, ic0 = (vc) => 0.02 * (vc / 5);
        v.render(() => {
          const ie = Ie.value, R = RL.value, q = pointContact(d.value, ie, R), al = q.alpha;
          const ymax = 1.2 * Math.max(30 / R * 1e3, .12 + 4 * al);
          sc.setView([0, 32], [0, ymax]);
          sc.vband(0, 2, { color: 'red', alpha: .1 });
          // block
          sb.rect(0.6, 0.6, 9.4, 2.6, { color: 'ink', width: 2, fill: 'accent', fillAlpha: 0.07, radius: 6 });
          sb.text('n-type germanium', 6.7, 1.0, { size: 11.5, color: 'muted', align: 'center' });
          sb.text('base', 5, 0.25, { size: 12, color: 'muted' });
          sb.line(5, 0.6, 5, 0.1, { color: 'ink', width: 2.5 });
          const gap = 0.6 + (d.value / 100) * 2.4, ex = 5 - gap / 2 - 0.25, cx = 5 + gap / 2 + 0.25;
          sb.path([[ex - 0.35, 5.5], [ex, 2.6], [ex + 0.35, 5.5]], { color: 'green', width: 2.5 });
          sb.path([[cx - 0.35, 5.5], [cx, 2.6], [cx + 0.35, 5.5]], { color: 'red', width: 2.5 });
          sb.text('emitter', ex, 5.85, { size: 12, color: 'green' }); sb.text('collector', cx, 5.85, { size: 12, color: 'red' });
          sb.text('+', ex, 4.3, { size: 14, color: 'green', dx: 14 }); sb.text('−', cx, 4.3, { size: 14, color: 'red', dx: 14 });
          const rng = v.rng(3), nd = Math.round(ie * 10);
          for (let k = 0; k < nd; k++) {
            const u = rng(), w = rng(), reach = rng() < al / 3;
            const x = ex + (cx - ex) * (reach ? u : u * 0.4) + (w - 0.5) * 0.3, y = 2.45 - (reach ? 0.15 + 0.9 * Math.sin(Math.PI * u) : 0.1 + 0.9 * w * (0.4 + 0.6 * (1 - u)));
            sb.dot(x, y, { r: 3, color: 'gold' });
          }
          // characteristics
          for (let e = 0; e <= 4; e++) sc.fn((vc) => ic0(vc) + al * e, { domain: [0, 30], color: 'accent', width: 1.3, alpha: 0.55 });
          sc.fn((vc) => ic0(vc) + al * ie, { domain: [0, 30], color: 'accent', width: 3 });
          sc.line(0, Vcc / R * 1e3, Vcc, 0, { color: 'ink', width: 2 });
          const lo = ie - dIe.value, hi = ie + dIe.value;
          const qlo = pointContact(d.value, Math.max(lo, 0), R), qhi = pointContact(d.value, hi, R), swingValid = lo >= 0 && qlo.valid && qhi.valid;
          if (swingValid) sc.hband(qlo.ic * 1e3, qhi.ic * 1e3, { color: 'orange', alpha: .2 });
          if (q.valid) sc.dot(q.vc, q.ic * 1e3, { color: 'gold', r: 7, label: 'Q', labelPos: q.vc > 15 ? 'nw' : 'ne' });
          info = { ...q, swingValid, ie };

        });
        v.legend([['accent', '$i_C(v_C)$ for $I_E = 0\\dots4$ mA'], ['ink', 'load line'], ['orange', 'valid loaded signal range'], ['gold', 'holes']]);
        v.readout(() => info && (`Chosen model: $\\alpha=${v.fix(info.alpha, 2)}$, $r_{in}=${v.fix(info.rin, 0)}\\,\\Omega$. ` + (info.valid
          ? `Active-domain operating point $|v_C|=${v.fix(info.vc, 2)}$ V, $i_C=${v.fix(info.ic * 1e3, 3)}$ mA. ${info.ie > 0 ? `Loaded voltage-gain magnitude ${v.fix(info.voltageGain, 2)}, power gain ${v.fix(info.powerGain, 2)}.` : 'Zero emitter drive; the chosen leakage offset remains, and no biased amplifier gain is reported.'} ${info.swingValid ? 'Both selected signal endpoints stay in the active domain.' : 'Selected signal swing leaves the active model; no loaded swing band is drawn.'}`
          : 'No load-line intersection in the declared active domain (collector magnitude at least 2 V). Reduce emitter drive or load resistance; an active-region gain is not available here.')));
      },
    },
    // ───────────────────────────────────────────────────────────────────────────────────── 4.15
    {
      num: '4.15',
      kind: 'Paper',
      name: 'The Theory of p-n Junctions and p-n Junction Transistors',
      paper: { authors: 'W. Shockley', year: 1949, title: 'The Theory of p-n Junctions in Semiconductors and p-n Junction Transistors', venue: 'Bell System Technical Journal 28 (3): 435–489', doi: '10.1002/j.1538-7305.1949.tb03645.x' },
      introduces: ['circ-4.1', 'circ-4.11', 'mat-9.8', 'cm-4.8'],
      verify: false, // Bibliography checked; reconstruction and remaining quantitative claims await source comparison.
      credit: 'W. Shockley, Bell Telephone Laboratories, 1949 (BSTJ 28, July 1949)',
      statement: String.raw`Shockley's paper derives minority-carrier injection and diffusion in a junction: for low injection and negligible series drop, the excess edge density is $p_{n0}(e^{qV/kT}-1)$, its DC tail decays over $L_p$, and electron plus hole currents give the ideal exponential diode law. Its simple p–n–p transistor treatment, neglecting the unwanted electron current, obtains $\alpha=\operatorname{sech}(2w/L_p)$, where $2w$ is the full base width. Here $W=2w$, and a declared illustrative injection factor $\gamma$ extends that result to $\alpha=\gamma\operatorname{sech}(W/L)$; current conservation then gives $\beta=\alpha/(1-\alpha)$.`,
      idea: String.raw`The diffusion equation with recombination produces the exponential carrier tail and the diode current. For a finite base, the excess profile satisfying fixed emitter injection and negligible collector-edge excess is a hyperbolic sine; the ratio of collector to emitter diffusion flux is a hyperbolic secant. The original §6 uses holes in a p–n–p structure; the plot uses the analogous electron profile in an n–p–n structure. The paper also explains why suppressing unwanted emitter injection improves transistor operation; the display's one-parameter injection-quality law is a separate chosen extension.`,
      caption: String.raw`Junction mode: the left logarithmic plot shows TOTAL minority-carrier density divided by equilibrium density, $1+(e^{V/V_T}-1)e^{-|x|/L}$, not the excess alone. The right plot shows normalized forward current; its zero-bias value is zero and has no point on a logarithmic axis. Transistor mode: a unit emitter-edge excess diffuses across a base of full width $W$, from green emitter E to red collector C, with zero excess at C. The gain uses the chosen injection-quality parameter $D$, not a measured doping ratio; the dashed small-width approximation is $1/[(W/L)^2/2+(W/L)/D]$.`,
      scope: String.raw`One-dimensional low-level injection, uniform quasi-neutral material, negligible depletion-layer recombination and series drop. Source equations: §4.2, Eqs4.1–4.11; §4.3, Eqs4.13–4.22; §5–6 and Eq6.4. The extension $\gamma=1/[1+(W/L)/D]$ is illustrative, not the paper's exact emitter-injection law. The normalized transistor profile is independent of injection magnitude and forward-bias control is hidden in that mode.`,
      deps: ['mat-9.5', 'cm-4.7'],
      refs: ['Shockley (1949), §§4.1–4.3, pp456–461; §§5–6, pp469–474, Eq6.4'],
      tags: ['p-n junction', 'transistor', 'diffusion'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Shockley_diode_equation', doi: 'https://doi.org/10.1002/j.1538-7305.1949.tb03645.x' },
      viz(v) {
        const mode = v.select('device', [{ value: 'j', label: 'p–n junction' }, { value: 't', label: 'junction transistor' }], 'j', { onChange: () => v.invalidate() });
        const s1 = v.stage({ x: [-3, 3], y: [1, 1e9], ylog: true, axes: 'box', gutter: true, height: 330, weight: 1.1, xlabel: 'position $x/L$ (junction at 0)', ylabel: 'excess carriers, relative to equilibrium', title: 'minority carriers near the junction' });
        const s2 = v.stage({ x: [0, 0.75], y: [1e-12, 1e-1], ylog: true, axes: 'box', gutter: true, height: 330, weight: 0.9, xlabel: '$V$ (V)', ylabel: '$I/I_{0}$   (normalised current)', title: 'current against voltage' });
        const V = v.slider('forward bias $V$', 0, 0.7, 0.45, { step: 0.005, fmt: (x) => `${v.fix(x * 1000, 0)} mV` });
        const W = v.slider('base width $W/L$', 0.02, 3, 0.1, { log: true, sig: 2, fmt: (x) => v.fix(x, 2) });
        const Dr = v.slider('injection quality $D$', 1, 1000, 100, { log: true, sig: 2, fmt: (x) => v.fix(x, 0) });
        let info = null;
        v.render(() => {
          const t = mode.value === 't', vb = V.value, ex = Math.exp(vb / vT(300)) - 1;
          W.el.hidden = !t; Dr.el.hidden = !t; V.el.hidden = t;
          const beta = (w, D) => junctionGain(w, D).beta;
          if (!t) {
            s1.setTitle('minority carriers near the junction');
            s1.setScale({ ylog: true, y: [1, Math.max(ex * 3, 10)] });
            s1.setLabels('position $x/L$ (junction at 0)', 'total minority density / equilibrium');
            s1.fn((x) => 1 + ex * Math.exp(-x), { domain: [0, 3], color: 'accent', width: 2.6 });
            s1.fn((x) => 1 + ex * Math.exp(x), { domain: [-3, 0], color: 'red', width: 2.6 });
            s1.vline(0, { color: 'ink', width: 1.5 });
            s1.tex('\\text{p side: electrons}', -1.6, Math.sqrt(ex + 1) * 0.1 + 2, { color: 'red', size: 13 });
            s1.tex('\\text{n side: holes}', 1.6, Math.sqrt(ex + 1) * 0.1 + 2, { color: 'accent', size: 13 });
            s2.fn((x) => Math.expm1(x / vT(300)), { domain: [0, 0.75], color: 'accent', width: 2.4 });
            if (vb > 0) s2.dot(vb, ex, { color: 'gold', r: 6.5 });
            s2.setTitle('current against voltage'); s2.setLabels('$V$ (V)', '$I/I_0$');
            s2.setScale({ xlog: false, ylog: true, x: [0, 0.75], y: [1e-3, 1e13] });
            info = { j: true, vb, ex };
          } else {
            const w = W.value, D = Dr.value;
            s1.setTitle('unit excess across the base (E to C)');
            s1.setScale({ ylog: false, y: [0, 1.1] });
            s1.setLabels('position in the base, $x/L$', 'electron excess / its value at the emitter edge');
            s1.setView([-0.4, Math.max(w, 1) + 0.4], [0, 1.1]);
            s1.fn((x) => junctionProfile(x, w), { domain: [0, w], color: 'accent', width: 2.8, fill: true, base: 0 });
            s1.rect(-0.4, 0, 0, 1.1, { fill: 'green', fillAlpha: 0.12, stroke: false });
            s1.rect(w, 0, Math.max(w, 1) + 0.4, 1.1, { fill: 'red', fillAlpha: 0.12, stroke: false });
            s1.tex('E', -0.2, 1.0, { color: 'green', size: 12.5, align: 'center' });
            s1.tex('C', w + 0.2, 1.0, { color: 'red', size: 12.5, align: 'center' });
            s1.line(0, 1, w, 0, { color: 'faint', dash: true });
            const q = junctionGain(w, D), aT = q.transport, g = q.gamma, al = q.alpha;
            s2.setScale({ xlog: true, ylog: true, x: [0.02, 3], y: [1e-3, 1e4] });
            s2.setLabels('base width $W/L$', 'current gain $\\beta$');
            s2.setTitle('current gain against base width');
            s2.fn((x) => beta(x, D), { domain: [0.02, 3], color: 'accent', width: 2.4 });
            s2.fn((x) => 1 / (x * x / 2 + x / D), { domain: [0.02, 1], color: 'muted', width: 1.4, dash: true });
            s2.dot(w, beta(w, D), { color: 'gold', r: 6.5 });
            info = { j: false, w, D, aT, g, al, beta: beta(w, D) };
          }
        });
        v.readout(() => info && (info.j
          ? `Excess carrier density at the junction edge: $e^{V/V_T}-1 = ${v.sci(info.ex, 3)}$ times equilibrium, falling by a factor $e$ per diffusion length $L$. The current is $I/I_0 = ${v.sci(info.ex, 3)}$. ${info.vb === 0 ? 'Zero current is omitted on the log axis.' : 'The large-forward-current asymptote rises by a decade per approximately 59.5 mV at 300 K.'}`
          : `$W/L = ${v.fix(info.w, 2)}$: transport factor $\\operatorname{sech}(W/L) = ${v.fix(info.aT, 4)}$, injection efficiency $\\gamma = ${v.fix(info.g, 4)}$, $\\alpha = ${v.fix(info.al, 4)}$, so $\\beta = \\alpha/(1-\\alpha) = ${v.fix(info.beta, 1)}$.`));
      },
    },
    // ───────────────────────────────────────────────────────────────────────────────────── 4.16
    {
      num: '4.16',
      kind: 'Paper',
      name: 'Miniaturized Electronic Circuits',
      paper: { authors: 'Jack S. Kilby', year: 1959, title: 'Miniaturized Electronic Circuits', venue: 'US Patent 3,138,743 (filed 6 February 1959, granted 23 June 1964)', url: 'https://patents.google.com/patent/US3138743A/en' },
      introduces: ['tech-11.17'],
      credit: 'J. S. Kilby, US 3,138,743: filed February 6, 1959; granted June 23, 1964',
      verify: false,
      statement: String.raw`The patent describes integrating active and passive circuit regions in a shaped single-crystal semiconductor body. Resistance can come from a defined semiconductor path; capacitance can use a p–n junction or a deposited dielectric and conductive plate. Its examples include a multivibrator and a phase-shift oscillator. Interconnections can use bonded gold wires; the text also expressly proposes deposited conductive material over an insulating layer. A single semiconductor body does not mean that every contact and dielectric is made of semiconductor.`,
      idea: String.raw`The central fabrication proposal combines compatible processing, junction isolation and physical or electrical shaping, instead of assembling separately fabricated components. The original patent's Figs6–8 distinguish component placement from circuit connectivity. The illustration below compares construction concepts and explores a chosen lumped oscillator; it does not reproduce Kilby's component values, distributed RC network or physical layout.`,
      caption: String.raw`A chosen three-section, equal-$RC$ low-pass ladder feeds a memoryless inverting amplifier $v_o=-(1\,\mathrm V)\tanh[A v_3/(1\,\mathrm V)]$. Its linear characteristic polynomial is $s^3+5s^2+6s+(1+A)$ in units of $1/(RC)$; the zero state loses linear stability at $A=29$, with small-signal frequency $\sqrt6/(2\pi RC)$. The finite trace spans 16 predicted periods and need not be settled near threshold. The lower drawing contrasts discrete parts with semiconductor regions. Resistor strokes and capacitor patches use logarithmically compressed sizes; neither geometry nor joint savings reproduce the patent.`,
      scope: String.raw`Original patent technical content checked against its full text: components in cols4–5, fabrication/interconnections in col6, oscillator in col7 and Fig8. The tanh amplifier, equal lumped elements, chosen initial disturbance and finite time window are this display's model. The discrete drawing has 15 terminal connections; no one-wire-per-net or exact bonded-wire reduction claim is made.`,
      deps: ['tech-11.16', 'circ-4.11'],
      refs: ['Kilby, US 3,138,743, cols4–7, Figs1–8 and claims1–25'],
      tags: ['integrated circuit', 'oscillator', 'history'],
      links: { patent: 'https://patents.google.com/patent/US3138743A/en', wikipedia: 'https://en.wikipedia.org/wiki/Jack_Kilby' },
      viz(v) {
        const sw = v.stage({ x: [0, 16], y: [-1.3, 1.3], axes: 'box', gutter: true, height: 270, full: true, xlabel: 'time (periods of the predicted oscillation)', ylabel: 'voltage (V)', title: 'the oscillator output' });
        const sl = v.stage({ x: [0, 10], y: [0, 4], equal: true, axes: false, height: 270, full: true, title: 'how the same circuit is built' });
        const R = v.slider('$R$', 1e3, 1e5, 1e4, { log: true, sig: 2, fmt: (x) => `${eng(x, 2)}Ω` });
        const C = v.slider('$C$', 1e-10, 1e-8, 1e-9, { log: true, sig: 2, fmt: (x) => `${eng(x, 2)}F` });
        const A = v.slider('amplifier gain $A$', 5, 80, 45, { step: 0.5, fmt: (x) => v.fix(x, 1) });
        const how = v.select('construction', [{ value: 'd', label: 'discrete parts' }, { value: 's', label: 'one slab' }], 's');
        let info = null;
        v.render(() => {
          const r = R.value, c = C.value, a = A.value, sim = kilbyOscillator(r, c, a);
          sw.path(sim.out, { color: 'accent', width: 2.4 });
          sw.path(sim.node, { color: 'orange', width: 1.4, alpha: 0.8 });
          sw.hline(0, { color: 'faint' });
          // construction schematic
          const slab = how.value === 's';
          if (slab) {
            sl.rect(0.4, 0.4, 9.6, 3.6, { color: 'ink', width: 2.2, fill: 'accent', fillAlpha: 0.07, radius: 10 });
            sl.text('one slab of semiconductor', 5, 3.85, { size: 12, color: 'muted' });
            const lenR = 0.5 + 1.1 * (Math.log10(r) - 3) / 2, area = 0.3 + 0.55 * (Math.log10(c) + 10) / 2;
            for (let k = 0; k < 3; k++) {
              const x0 = 1 + k * 2.8;
              sl.path([[x0, 3.1], [x0 + lenR * 0.5, 3.1], [x0 + lenR * 0.5, 2.8], [x0 + lenR, 2.8]], { color: 'orange', width: 5, alpha: 0.7 });
              sl.rect(x0, 0.8, x0 + area, 0.8 + area, { color: 'purple', fill: 'purple', fillAlpha: 0.3, width: 1.5 });
              sl.line(x0 + lenR, 2.8, x0 + 2.2, 2.8, { color: 'gold', width: 1.6 }); sl.dot(x0 + 2.2, 2.8, { r: 3, color: 'gold' });
              sl.line(x0 + area / 2, 0.8 + area, x0 + lenR * 0.6, 2.8, { color: 'gold', width: 1.2, alpha: 0.7 });
            }
            sl.rect(8.6, 1.2, 9.3, 2.0, { color: 'green', fill: 'green', fillAlpha: 0.3, width: 1.5 });
            sl.text('transistor', 8.95, 0.9, { size: 11, color: 'green' });
            sl.text('resistor strokes: log R', 3, 3.4, { size: 11, color: 'orange' });
            sl.text('capacitor patches: log C', 3.4, 0.55, { size: 11, color: 'purple' });
          } else {
            for (let k = 0; k < 3; k++) {
              const x0 = 0.8 + k * 2.6;
              sl.rect(x0, 2.7, x0 + 1.5, 3.2, { color: 'orange', fill: 'orange', fillAlpha: 0.25, radius: 4, width: 1.6 });
              sl.line(x0 - 0.35, 2.95, x0, 2.95, { color: 'ink' }); sl.line(x0 + 1.5, 2.95, x0 + 1.85, 2.95, { color: 'ink' });
              sl.dot(x0 - 0.35, 2.95, { r: 4, color: 'gold' }); sl.dot(x0 + 1.85, 2.95, { r: 4, color: 'gold' });
              sl.line(x0 + 0.5, 1.9, x0 + 0.5, 1.4, { color: 'ink' }); sl.line(x0 + 1.0, 1.9, x0 + 1.0, 1.4, { color: 'ink' });
              sl.line(x0 + 0.2, 1.9, x0 + 1.3, 1.9, { color: 'purple', width: 3 }); sl.line(x0 + 0.2, 1.65, x0 + 1.3, 1.65, { color: 'purple', width: 3 });
              sl.dot(x0 + 0.5, 1.4, { r: 4, color: 'gold' }); sl.dot(x0 + 1.0, 1.4, { r: 4, color: 'gold' });
              sl.path([[x0 + 1.85, 2.95], [x0 + 2.2, 2.95], [x0 + 2.2, 2.0], [x0 + 0.5, 2.0], [x0 + 0.5, 1.9]], { color: 'muted', width: 1.2 });
            }
            sl.rect(8.5, 1.5, 9.4, 2.6, { color: 'green', fill: 'green', fillAlpha: 0.25, radius: 4, width: 1.6 });
            for (const y of [1.7, 2.05, 2.4]) { sl.line(8.1, y, 8.5, y, { color: 'ink' }); sl.dot(8.1, y, { r: 4, color: 'gold' }); }
            sl.text('each gold dot is a soldered joint', 4.6, 0.5, { size: 12, color: 'muted' });
          }
          info = { ...sim, slab, a };
        });
        v.legend([['accent', 'amplifier output'], ['orange', 'ladder node $v_3$']]);
        v.readout(() => info && `Chosen ladder's linear-threshold frequency $f_0=\\sqrt6/(2\\pi RC)=${engTex(info.f0, 3, 'Hz')}$; finite-window zero-crossing frequency: ${info.period ? `$${engTex(info.f0 / info.period, 3, 'Hz')}$ (also measurable in a decaying transient)` : 'insufficient crossings'}. Peak output over 12–16 predicted periods $=${v.fix(info.amplitude, 3)}$ V. ${info.regime === 'marginal' ? 'At A=29 the linearization is marginal; nonlinear and finite-time behavior must be distinguished.' : info.regime === 'stable' ? 'A<29: the zero state is linearly stable.' : 'A>29: the zero state is linearly unstable; the finite trace does not establish a settled amplitude.'} ${info.slab ? 'Semiconductor-region sketch; interconnect counts are not inferred.' : 'Discrete sketch: 15 soldered terminal connections.'}`);
      },
    },
    // ───────────────────────────────────────────────────────────────────────────────────── 4.17
    {
      num: '4.17',
      kind: 'Paper',
      name: 'Nanowatt Logic Using Field-Effect MOS Triodes',
      paper: { authors: 'F. M. Wanlass and C. T. Sah', year: 1963, title: 'Nanowatt Logic Using Field-Effect Metal-Oxide Semiconductor Triodes', venue: '1963 IEEE International Solid-State Circuits Conference, Digest of Technical Papers: 32–33', doi: '10.1109/ISSCC.1963.1157450' },
      introduces: ['circ-4.8'],
      verify: true, // Full original paper remains unavailable; modern model corrections do not close that source review.
      credit: 'F. M. Wanlass and C.-T. Sah, 1963 (ISSCC, February 1963); Wanlass filed the CMOS patent US 3,356,858 on 18 June 1963',
      statement: String.raw`The 1963 conference abstract reports complementary n- and p-type silicon MOS devices fabricated by planar diffusion. Their complementary switching principle is illustrated here by ideal RC-switch circuits. At a held logic rail, a complementary inverter has no conducting DC path apart from leakage. The familiar energy $CV_{DD}^2$ per complete full-swing charge–discharge cycle assumes enough settling time; at high clock rate the output swing shrinks, and that full-swing approximation cannot be extrapolated indefinitely.`,
      idea: String.raw`An ideal complementary pull-up charges the output capacitor and the pull-down discharges it. A resistor-load inverter instead draws DC current while its pull-down is on and reaches a low level above ground. The chosen periodic RC model below accounts for those finite swings and time constants. Its power is calculated by integrating supply current over a complete cycle, not by assuming that the two circuits have identical dynamic power at every frequency.`,
      caption: String.raw`The input toggles every clock interval $1/f$, so a complete cycle lasts $2/f$ and there are $f/2$ rising transitions per second. Left: exact average supply power of the declared periodic ideal-switch models. The dashed line is the low-frequency full-swing CMOS dynamic term $CV_{DD}^2f/2$, drawn only while its swing is at least 95% of the rail. Gold marks that 95% settling reference, not an intersection of the two power curves. Right: steady periodic supply current at the selected frequency over four clock intervals. Resistor-load current changes continuously with capacitor voltage; it does not jump instantly to its DC low-state value when the switch closes.`,
      scope: String.raw`Chosen ideal switches with on-resistance $1$ kΩ, no gate capacitance or simultaneous-conduction current, constant added CMOS leakage and a resistor load. Capacitance and frequency controls include incomplete settling; the readout reports that loss of output swing. No measured nanowatt figures or original 1963 device fit are reproduced. Modern analysis is supported by MIT 6.012 Lecture14; comparison with the complete 1963 paper remains pending.`,
      deps: ['circ-4.7', 'cm-4.10'],
      refs: ['IEEE1963 ISSCC abstract/metadata, DOI 10.1109/ISSCC.1963.1157450', 'Wanlass US3,356,858, Fig5, cols4–5', 'del Alamo, MIT 6.012 Lecture14 (2005), slides21–24'],
      tags: ['cmos', 'power', 'history'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/CMOS', doi: 'https://doi.org/10.1109/ISSCC.1963.1157450' },
      viz(v) {
        const sp = v.stage({ x: [1e3, 1e10], y: [1e-12, 1e-2], xlog: true, ylog: true, axes: 'box', gutter: true, height: 340, weight: 1.15, xlabel: 'clock frequency $f$ (Hz)', ylabel: 'power per gate (W)', title: 'power against frequency' });
        const si = v.stage({ x: [0, 4], y: [0, 1.1], axes: 'box', gutter: true, height: 340, weight: 0.85, xlabel: 'time (clock intervals $1/f$)', ylabel: 'supply current / $V_{DD}/R_{\\mathrm{on}}$', title: 'periodic supply current at the selected clock' });
        const Vdd = v.slider('supply $V_{DD}$', 1, 5, 3.3, { step: 0.1, fmt: (x) => `${v.fix(x, 1)} V` });
        const Cl = v.slider('load $C$', 1e-15, 1e-12, 1e-14, { log: true, sig: 2, fmt: (x) => `${eng(x, 2)}F` });
        const Ilk = v.slider('leakage', 1e-12, 1e-6, 1e-10, { log: true, sig: 2, fmt: (x) => `${eng(x, 2)}A` });
        const Rl = v.slider('load $R$', 2e3, 1e6, 2e4, { log: true, sig: 2, fmt: (x) => `${eng(x, 2)}Ω` });
        const fs = v.slider('clock $f$', 1e3, 1e10, 1e7, { log: true, sig: 2, fmt: (x) => `${eng(x, 2)}Hz` });
        let info = null;
        v.render(() => {
          const V = Vdd.value, C = Cl.value, lk = Ilk.value, R = Rl.value, f = fs.value, q = clockCurrentPaths(V, C, lk, R, f);
          sp.fn(x => clockPower(V, C, lk, R, x).pc, { domain: [1e3, 1e10], color: 'accent', width: 2.6 });
          sp.fn(x => clockPower(V, C, lk, R, x).pr, { domain: [1e3, 1e10], color: 'red', width: 2.6 });
          const end = Math.min(1e10, q.f95);
          if (end >= 1e3) sp.fn(x => .5 * C * V * V * x, { domain: [1e3, end], color: 'muted', width: 1.2, dash: true, alpha: .7 });
          if (q.f95 >= 1e3 && q.f95 <= 1e10) { sp.vline(q.f95, { color: 'gold', dash: true }); sp.dot(q.f95, clockPower(V, C, lk, R, q.f95).pc, { color: 'gold', r: 5 }); }
          sp.vline(f, { color: 'orange', width: 1.5 });
          sp.dot(f, q.pc, { color: 'accent', r: 6 }); sp.dot(f, q.pr, { color: 'red', r: 6 });
          si.path(q.rs, { color: 'red', width: 2 }); si.path(q.cm, { color: 'accent', width: 2.2 });
          info = { ...q, V, ratio: q.pr / q.pc };

        });
        v.legend([['accent', 'complementary pair'], ['red', 'resistor-load inverter'], ['muted', 'full-swing CMOS dynamic approximation', { dash: true }], ['gold', '95% CMOS swing reference']]);
        v.readout(() => info && `At $f=${engTex(fs.value, 2, 'Hz')}$: complementary model $${engTex(info.pc, 3, 'W')}$, resistor-load model $${engTex(info.pr, 3, 'W')}$; ratio $P_R/P_C=${v.fix(info.ratio, 2)}$. CMOS swing ${v.fix(100 * info.cSwing / info.V, 1)}% of $V_{DD}$; resistor-load output range $[${v.fix(info.rLow, 3)},${v.fix(info.rHigh, 3)}]$ V. ${info.cSwing / info.V < .95 ? 'Incomplete settling: the full-swing dynamic-power formula does not apply.' : 'CMOS swing exceeds the chosen 95% settling reference.'}`);
      },
    },
    // ───────────────────────────────────────────────────────────────────────────────────── 4.18
    {
      num: '4.18',
      kind: 'Paper',
      name: 'Cramming More Components onto Integrated Circuits',
      paper: { authors: 'Gordon E. Moore', year: 1965, title: 'Cramming More Components onto Integrated Circuits', venue: 'Electronics 38 (8): 114–117 (reprinted in Proceedings of the IEEE 86 (1): 82–85, 1998)', doi: '10.1109/JPROC.1998.658762' },
      introduces: ['tech-11.18'],
      credit: 'G. E. Moore, Fairchild Semiconductor, Electronics 38(8), April19,1965, pp114–117',
      verify: false,
      statement: String.raw`Moore's 1965 article links integration to manufacturing cost: adding components initially spreads fixed costs, while declining yield eventually increases cost per component. It reports a contemporary minimum near 50 components per circuit and a roughly annual doubling of complexity at minimum component cost, then forecasts about 65,000 components by 1975. This concerns components per integrated function at an economic optimum, not exclusively transistors or a physical law guaranteeing indefinite growth.`,
      idea: String.raw`The article combines a moving cost minimum with a historical exponential trend and an explicitly uncertain extrapolation. Its technology discussion includes semiconductor devices, thin films and hybrid approaches, and its components include passive elements. The left plot below is a chosen economic illustration, not the paper's cost equation. The right plot keeps the original forecast separate from a user-controlled doubling scenario; it does not infer an industry growth rate from a selected list of processors.`,
      caption: String.raw`Left: chosen continuous-count cost curves $(a/n+1)e^{n/N_0}$, normalized to the 1965 model minimum, where the yield scale $N_0=64\,2^{(y-1965)/T_d}$ is illustrative. Gold minima move as this yield scale changes; the minima themselves need not double every $T_d$. Only the visible cost range is drawn. Right: a scenario $\log_2 n=6+(y-1965)/T_d$, normalized to 64 in 1965. The blue point is the article's stated contemporary optimum of about 50, and the orange point its forecast of about 65,000 in 1975. These are not exact digitizations of the original figures. At $T_d=1$ the scenario predicts 65,536, consistent with the forecast's rounding.`,
      scope: String.raw`Original 1965 economic trend and ten-year forecast, with separate illustrative continuous cost and exponential scenario models. No later-chip dataset or 1975 revision is reconstructed. The yield scale and complexity scenario share a control parameter, not a derived equivalence between their optima.`,
      deps: ['tech-11.17'],
      refs: ['Moore (1965), original article, Costs and curves (PDF p2), complexity graph (p3)'],
      tags: ['moore\'s law', 'scaling', 'history'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Moore%27s_law', doi: 'https://doi.org/10.1109/JPROC.1998.658762' },
      viz(v) {
        const s1 = v.stage({ x: [1, 1e6], y: [0.05, 100], xlog: true, ylog: true, axes: 'box', gutter: true, height: 340, weight: 1, xlabel: 'components per integrated circuit', ylabel: 'relative cost per component', title: 'cost per component' });
        const s2 = v.stage({ x: [1958, 1976], y: [-2, 28], axes: 'box', gutter: true, height: 340, weight: 1.1, xlabel: 'year', ylabel: '$\\log_2$(components per chip)', title: 'complexity against year' });
        const Td = v.slider('doubling time $T_d$', 0.5, 3, 1, { step: 0.05, fmt: (x) => `${v.fix(x, 2)} yr` });
        const ratio = v.slider('fixed / marginal cost $a/b$', 10, 1000, 100, { log: true, sig: 2, fmt: (x) => v.fix(x, 0) });
        let info = null;
        v.render(() => {
          const td = Td.value, ab = ratio.value;
          const cost = (n, yr) => mooreLogCost(n, yr, td, ab), opt = yr => mooreMinimum(yr, td, ab);
          const norm = cost(opt(1965), 1965);
          const minValue = Math.min(...[1962, 1965, 1970].map(yr => Math.exp(cost(opt(yr), yr) - norm)));
          s1.setView([1, 1e6], [Math.min(.05, .7 * minValue), 100]);
          const cols = { 1962: 'muted', 1965: 'accent', 1970: 'purple' };
          const mins = [];
          for (const yr of [1962, 1965, 1970]) {
            s1.fn((n) => Math.exp(cost(n, yr) - norm), { domain: mooreVisibleRange(yr, td, ab, norm), color: cols[yr], width: yr === 1965 ? 2.8 : 2, n: 400 });
            const nm = opt(yr); mins.push([nm, Math.exp(cost(nm, yr) - norm)]);
            s1.dot(nm, Math.exp(cost(nm, yr) - norm), { color: 'gold', r: 5 });
            s1.tex(String(yr), nm, Math.exp(cost(nm, yr) - norm), { color: cols[yr], size: 12.5, dy: 16 });
          }
          s1.path(mins, { color: 'gold', width: 1.2, dash: true });
          // Original text reference values are distinct from the normalized scenario.
          const low = Math.min(-2, mooreScenarioLog2(1959, td) - 1), high = Math.max(18, mooreScenarioLog2(1975, td) + 1);
          s2.setView([1958, 1976], [low, high]);
          s2.line(1959, mooreScenarioLog2(1959, td), 1975, mooreScenarioLog2(1975, td), { color: 'muted', width: 1.6, dash: true });
          s2.vline(1975, { color: 'faint', dash: true });
          s2.dot(1965, Math.log2(50), { color: 'accent', r: 6 });
          s2.text('about 50 (1965 text)', 1965, Math.log2(50), { size: 11.5, color: 'accent', dx: -10, dy: 14, align: 'right', plate: true });
          s2.dot(1975, Math.log2(65000), { color: 'orange', r: 6, hollow: true });
          s2.text('about 65 000 (forecast)', 1975, Math.log2(65000), { size: 11.5, color: 'orange', dx: -10, dy: 0, align: 'right', plate: true });
          info = { td, pred1975: 2 ** mooreScenarioLog2(1975, td), opt: [1962, 1965, 1970].map(opt) };

        });
        v.legend([['gold', 'chosen cost-model minima'], ['muted', 'controlled complexity scenario', { dash: true }], ['accent', '1965 text: about 50'], ['orange', '1965 forecast for 1975']]);
        v.readout(() => info && `Scenario with $T_d = ${v.fix(info.td, 2)}$ yr: ${info.pred1975 >= 1e6 ? v.sci(info.pred1975, 2) : Math.round(info.pred1975).toLocaleString('en-US')} components in 1975 (the article forecasts about 65,000). Chosen cost-model minima: ${info.opt.map((x) => v.fix(x, 2)).join(', ')} components for 1962, 1965, 1970; the article states about 50 at its contemporary minimum.`);
      },
    },
  ],
};
