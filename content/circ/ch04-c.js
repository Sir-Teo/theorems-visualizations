// Circuits — Chapter 4: Nonlinear elements and the digital abstraction (part c: the landmark papers 4.14–4.18)
//
// The pictures recreate each paper's central idea with textbook models and illustrative parameters. They are not reproductions of the
// papers' measured data, which are not reproduced here; each caption says what is modelled and what is the paper's own claim.
import { clamp, vT, shock, bisectDec, mos, eng, engTex } from './ch04.shared.js';

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
      credit: 'J. Bardeen and W. H. Brattain, Bell Telephone Laboratories (letter dated 15 July 1948; the device was first demonstrated in December 1947)',
      verify: true,
      statement: String.raw`The letter announces a three-electrode device made from a block of germanium: two metal point contacts, the *emitter* and the *collector*, touch the surface very close together, and a large-area *base* contact is made to the block. The emitter is biased in the forward direction, the collector in the reverse direction. The collector current is controlled by the emitter current: part of the current entering through the emitter reaches the collector, and the device can amplify, giving both voltage and power gain in a circuit with a load resistor in the collector lead.`,
      idea: String.raw`Before the transistor, amplification meant a vacuum tube: a heated filament, a grid and a plate in a glass envelope. Bell Labs had been looking for a solid-state replacement since the 1930s, and field-effect schemes (voltage on a plate near a semiconductor) did not work as predicted because surface states trapped the induced charge. Bardeen and Brattain, working in Shockley's group, found that a second reverse-biased point contact placed within about a hundredth of a millimetre of a forward-biased one collects the carriers the first injects. The paper calls the device a semiconductor *triode* and describes it by its electrical behaviour; the physical picture (injection of minority carriers, "holes", into n-type germanium) was refined in their longer 1949 paper and in Shockley's junction theory (4.15).`,
      caption: String.raw`**A model, not the paper's data.** Left: a germanium block with emitter and collector points; the gold dots are holes injected by the emitter, fewer of which reach the collector as the contacts are moved apart (the spacing slider). Right: collector characteristics $i_C=i_{C0}+\alpha\,i_E$ for several emitter currents, with a collector supply and load resistor: the thick line is the load line, and the band shows the swing in collector current when the emitter current is varied by the signal. Close spacing gives $\alpha>1$ (a point-contact peculiarity); the readout gives the model's voltage and power gain, whose values depend entirely on the assumed spacing, load and input resistance.`,
      scope: String.raw`Illustrative point-contact model: $\alpha(d)=3e^{-d/40\,\mu\mathrm{m}}$, input resistance $26\,\Omega\,/\,I_E[\mathrm{mA}]$ plus $200\,\Omega$ spreading resistance. The paper's own quantitative results are not reproduced here.`,
      deps: ['mat-9.5'],
      refs: [],
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
          const al = 3 * Math.exp(-d.value / 40), ie = Ie.value, R = RL.value;
          // block
          sb.rect(0.6, 0.6, 9.4, 2.6, { color: 'ink', width: 2, fill: 'accent', fillAlpha: 0.07, radius: 6 });
          sb.text('n-type germanium', 7.6, 1.0, { size: 12, color: 'muted' });
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
          const vq = bisectDec((x) => (Vcc - x) / R * 1e3 - (ic0(x) + al * ie), 0, Vcc);
          const iq = (Vcc - vq) / R * 1e3;
          const lo = Math.max(ie - dIe.value, 0), hi = ie + dIe.value;
          sc.hband(al * lo + ic0(vq), al * hi + ic0(vq), { color: 'orange', alpha: 0.2 });
          sc.dot(vq, iq, { color: 'gold', r: 7, label: 'Q', labelPos: 'ne' });
          const rin = 26 / Math.max(ie, 0.05) + 200, vgain = (al * R) / rin, pgain = al * al * R / rin;
          info = { al, vq, iq, vgain, pgain, rin };
        });
        v.legend([['accent', '$i_C(v_C)$ for $I_E = 0\\dots4$ mA'], ['ink', 'load line'], ['orange', 'collector-current swing'], ['gold', 'holes']]);
        v.readout(() => info && `Model: $\\alpha = ${v.fix(info.al, 2)}$; operating point $v_C = ${v.fix(info.vq, 1)}$ V, $i_C = ${v.fix(info.iq, 2)}$ mA; input resistance $\\approx ${v.fix(info.rin, 0)}\\,\\Omega$; small-signal voltage gain $\\alpha R_L/r_{in} = ${v.fix(info.vgain, 0)}$ and power gain $\\alpha^2R_L/r_{in} = ${v.fix(info.pgain, 0)}$. The letter reports amplification of both voltage and power; its numbers are not used here.`);
      },
    },
    // ───────────────────────────────────────────────────────────────────────────────────── 4.15
    {
      num: '4.15',
      kind: 'Paper',
      name: 'The Theory of p-n Junctions and p-n Junction Transistors',
      paper: { authors: 'W. Shockley', year: 1949, title: 'The Theory of p-n Junctions in Semiconductors and p-n Junction Transistors', venue: 'Bell System Technical Journal 28 (3): 435–489', doi: '10.1002/j.1538-7305.1949.tb03645.x' },
      introduces: ['circ-4.1', 'circ-4.11', 'mat-9.8', 'cm-4.8'],
      credit: 'W. Shockley, Bell Telephone Laboratories, 1949 (BSTJ 28, July 1949)',
      statement: String.raw`The paper treats a junction of p- and n-type semiconductor by the diffusion of minority carriers. (a) Biased at voltage $V$ in the forward direction, the junction injects holes into the n side and electrons into the p side, whose excess concentration at the edge of the depletion layer is $p_{n0}(e^{qV/kT}-1)$ and which decays with the diffusion length, $e^{-x/L_p}$; the current is $I=I_0(e^{qV/kT}-1)$ (the diode equation, 4.1). (b) Two junctions back to back, with a base thinner than the diffusion length $L$, form a *junction transistor*: the fraction of injected carriers that cross the base is $\operatorname{sech}(W/L)$, and the current gain is $\beta=\alpha/(1-\alpha)$ with $\alpha=\gamma\operatorname{sech}(W/L)$, where $\gamma$ (the injection efficiency) is close to $1$ when the emitter is much more heavily doped than the base. A thin, lightly doped base and a heavily doped emitter therefore give $\beta\gg1$.`,
      idea: String.raw`The point-contact transistor (4.14) worked but was erratic and not well understood. Shockley predicted that carrier injection across a junction obeys simple diffusion physics (cm-4.7) and showed that the same junction-based theory predicted a three-layer amplifier which the earlier device was not. The paper derives the exponential law from continuity of the minority-carrier flow, shows the current is a sum of two diffusion currents (so doping decides which carrier dominates), and works out the transistor: the collector current follows the *emitter* current, only slightly reduced by recombination in the base. Practical junction transistors were made soon afterwards.`,
      caption: String.raw`**Junction** (left selector): bias the junction and watch the minority-carrier excess on both sides (logarithmic axis); the right plot is the current, which follows $I_0(e^{V/V_T}-1)$ (current axis logarithmic, a straight line). **Transistor**: the injected electrons cross a base of width $W$ that ends at the collector, where they are swept away (the concentration is zero there); thin the base and more arrive. The right plot gives the gain $\beta$ against $W/L$ (log scale) for the chosen emitter-to-base doping ratio, together with the approximation $\beta\approx 1/(W^2/2L^2+W/(LD))$.`,
      scope: String.raw`Low-level injection, one-dimensional, abrupt junction, no recombination in the depletion layer; the transistor formulas are a simplified version of the paper's treatment ($\gamma = 1/(1+(W/L)/D)$ with $D$ the emitter-to-base doping ratio, in my notation).`,
      deps: ['mat-9.5', 'cm-4.7'],
      refs: [],
      tags: ['p-n junction', 'transistor', 'diffusion'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Shockley_diode_equation', doi: 'https://doi.org/10.1002/j.1538-7305.1949.tb03645.x' },
      viz(v) {
        const mode = v.select('device', [{ value: 'j', label: 'p–n junction' }, { value: 't', label: 'junction transistor' }], 'j', { onChange: () => v.invalidate() });
        const s1 = v.stage({ x: [-3, 3], y: [1, 1e9], ylog: true, axes: 'box', gutter: true, height: 330, weight: 1.1, xlabel: 'position $x/L$ (junction at 0)', ylabel: 'excess carriers, relative to equilibrium', title: 'minority carriers near the junction' });
        const s2 = v.stage({ x: [0, 0.75], y: [1e-12, 1e-1], ylog: true, axes: 'box', gutter: true, height: 330, weight: 0.9, xlabel: '$V$ (V)', ylabel: '$I/I_{0}$   (normalised current)', title: 'current against voltage' });
        const V = v.slider('forward bias $V$', 0, 0.7, 0.45, { step: 0.005, fmt: (x) => `${v.fix(x * 1000, 0)} mV` });
        const W = v.slider('base width $W/L$', 0.02, 3, 0.1, { log: true, sig: 2, fmt: (x) => v.fix(x, 2) });
        const Dr = v.slider('emitter / base doping', 1, 1000, 100, { log: true, sig: 2, fmt: (x) => v.fix(x, 0) });
        let info = null;
        v.render(() => {
          const t = mode.value === 't', vb = V.value, ex = Math.exp(vb / vT(300)) - 1;
          W.el.hidden = !t; Dr.el.hidden = !t;
          const beta = (w, D) => { const g = 1 / (1 + w / D), a = g / Math.cosh(w); return a / (1 - a); };
          if (!t) {
            s1.setScale({ ylog: true, y: [1, Math.max(ex * 3, 10)] });
            s1.setLabels('position $x/L$ (junction at 0)', 'excess carriers $/\\,$ equilibrium');
            s1.fn((x) => 1 + ex * Math.exp(-x), { domain: [0, 3], color: 'accent', width: 2.6 });
            s1.fn((x) => 1 + ex * Math.exp(x), { domain: [-3, 0], color: 'red', width: 2.6 });
            s1.vline(0, { color: 'ink', width: 1.5 });
            s1.tex('\\text{p side: electrons}', -1.6, Math.sqrt(ex + 1) * 0.1 + 2, { color: 'red', size: 13 });
            s1.tex('\\text{n side: holes}', 1.6, Math.sqrt(ex + 1) * 0.1 + 2, { color: 'accent', size: 13 });
            s2.fn((x) => Math.max(Math.exp(x / vT(300)) - 1, 1e-14), { domain: [0, 0.75], color: 'accent', width: 2.4 });
            s2.dot(vb, Math.max(ex, 1e-14), { color: 'gold', r: 6.5 });
            s2.setTitle('current against voltage'); s2.setLabels('$V$ (V)', '$I/I_0$');
            s2.setScale({ xlog: false, ylog: true, x: [0, 0.75], y: [1e-3, 1e13] });
            info = { j: true, vb, ex };
          } else {
            const w = W.value, D = Dr.value, ib = Math.exp(vb / vT(300)) - 1;
            s1.setScale({ ylog: false, y: [0, 1.1] });
            s1.setLabels('position in the base, $x/L$', 'electron excess / its value at the emitter edge');
            s1.setView([-0.4, Math.max(w, 1) + 0.4], [0, 1.1]);
            s1.fn((x) => Math.sinh(Math.max(w - x, 0) / 1) / Math.sinh(w), { domain: [0, w], color: 'accent', width: 2.8, fill: true, base: 0 });
            s1.rect(-0.4, 0, 0, 1.1, { fill: 'green', fillAlpha: 0.12, stroke: false });
            s1.rect(w, 0, Math.max(w, 1) + 0.4, 1.1, { fill: 'red', fillAlpha: 0.12, stroke: false });
            s1.tex('\\text{emitter}', -0.2, 1.0, { color: 'green', size: 12.5 });
            s1.tex('\\text{collector}', w + 0.2, 1.0, { color: 'red', size: 12.5, align: 'left' });
            s1.line(0, 1, w, 0, { color: 'faint', dash: true });
            const aT = 1 / Math.cosh(w), g = 1 / (1 + w / D), al = g * aT;
            s2.setScale({ xlog: true, ylog: true, x: [0.02, 3], y: [1, 1e4] });
            s2.setLabels('base width $W/L$', 'current gain $\\beta$');
            s2.setTitle('current gain against base width');
            s2.fn((x) => beta(x, D), { domain: [0.02, 3], color: 'accent', width: 2.4 });
            s2.fn((x) => 1 / (x * x / 2 + x / D), { domain: [0.02, 1], color: 'muted', width: 1.4, dash: true });
            s2.dot(w, beta(w, D), { color: 'gold', r: 6.5 });
            info = { j: false, w, D, aT, g, al, beta: beta(w, D) };
          }
        });
        v.readout(() => info && (info.j
          ? `Excess carrier density at the junction edge: $e^{V/V_T}-1 = ${v.sci(info.ex, 3)}$ times equilibrium, falling by a factor $e$ per diffusion length $L$. The current is $I/I_0 = ${v.sci(info.ex, 3)}$: ten times more for every 60 mV.`
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
      credit: 'J. S. Kilby, Texas Instruments: demonstration September 1958; patent filed 6 February 1959, granted 23 June 1964',
      verify: true,
      statement: String.raw`The patent describes an electronic circuit in which every component, resistors, capacitors and active devices alike, is made from the same body of semiconductor material (germanium or silicon), so that the whole circuit is a single piece instead of discrete parts wired together; the parts are formed in the slab by the processes of doping and etching that also make transistors, and connections between them are made on or between regions of the slab. The point is a change in how circuits are *made*: the components of a circuit are fabricated together, not first made separately and then joined by hand. Resistance is provided by the bulk resistivity of a length of semiconductor, capacitance by the capacitance of a reverse-biased junction.`,
      idea: String.raw`By 1958 a circuit of hundreds of transistors, resistors and capacitors was a tangle of thousands of soldered joints, each a chance of failure (the "tyranny of numbers"). Kilby, newly hired at Texas Instruments, saw that resistors and capacitors can be made of the same semiconductor as the transistor, and so a whole circuit can be cut from one slab. The first demonstrations were small circuits (an oscillator and an amplifier) on germanium, still with gold wires connecting the parts. Fairchild's planar process and Robert Noyce's monolithic design (1959) later replaced the wires with deposited metal strips; the integrated circuit is credited to both men, and the 2000 Nobel Prize in Physics recognised Kilby.`,
      caption: String.raw`**An illustrative model.** The oscillator is a three-section $RC$ phase-shift oscillator, an amplifier of gain $-A$ with a ladder of three equal resistors and capacitors from output to input. The blue wave is the simulated output (with the amplifier clipping at the supply): it grows only if $A$ exceeds the threshold $29$, at the frequency $\sqrt6/(2\pi RC)$. The lower panel contrasts the construction: *discrete* parts, each soldered by two leads, against the *one slab* where the same ladder is made in place, with resistor length $\propto R$ and capacitor area $\propto C$ (a schematic, not Kilby's layout).`,
      scope: String.raw`Idealised ladder ($R$ and $C$ equal, loading of the ladder included), amplifier with tanh saturation. The patent's claims and drawings are summarised from memory and the counts of joints are a model (one lead per terminal, one bonded wire per net), so treat them as illustrative.`,
      deps: ['tech-11.16', 'circ-4.11'],
      refs: [],
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
          const r = R.value, c = C.value, a = A.value, tau = r * c, f0 = Math.sqrt(6) / (TAU * tau), T0 = 1 / f0, Vs = 1;
          const dt = T0 / 400, N = 16 * 400;
          let v1 = 0.001, v2 = 0, v3 = 0;
          const out = [], o3 = [];
          const F = (x1, x2, x3) => { const vo = -Vs * Math.tanh((a * x3) / Vs); return [((vo - x1) - (x1 - x2)) / tau, ((x1 - x2) - (x2 - x3)) / tau, (x2 - x3) / tau, vo]; };
          for (let n = 0; n <= N; n++) {
            const k1 = F(v1, v2, v3), k2 = F(v1 + dt * k1[0] / 2, v2 + dt * k1[1] / 2, v3 + dt * k1[2] / 2), k3 = F(v1 + dt * k2[0] / 2, v2 + dt * k2[1] / 2, v3 + dt * k2[2] / 2), k4 = F(v1 + dt * k3[0], v2 + dt * k3[1], v3 + dt * k3[2]);
            if (n % 4 === 0) { out.push([n / 400, k1[3]]); o3.push([n / 400, v3]); }
            v1 += (dt / 6) * (k1[0] + 2 * k2[0] + 2 * k3[0] + k4[0]); v2 += (dt / 6) * (k1[1] + 2 * k2[1] + 2 * k3[1] + k4[1]); v3 += (dt / 6) * (k1[2] + 2 * k2[2] + 2 * k3[2] + k4[2]);
          }
          sw.path(out, { color: 'accent', width: 2.4 });
          sw.path(o3, { color: 'orange', width: 1.4, alpha: 0.8 });
          sw.hline(0, { color: 'faint' });
          // measured frequency from rising zero crossings of the output in the second half
          const cr = [];
          for (let i = 1; i < out.length; i++) if (out[i - 1][1] < 0 && out[i][1] >= 0 && out[i][0] > 8) cr.push(out[i - 1][0] + (out[i][0] - out[i - 1][0]) * (-out[i - 1][1] / (out[i][1] - out[i - 1][1])));
          const per = cr.length >= 2 ? (cr[cr.length - 1] - cr[0]) / (cr.length - 1) : null;
          const amp = Math.max(...out.filter((p) => p[0] > 12).map((p) => Math.abs(p[1])));
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
            sl.text('resistors: length ∝ R', 3, 3.4, { size: 11, color: 'orange' });
            sl.text('capacitors: area ∝ C', 3.4, 0.55, { size: 11, color: 'purple' });
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
          info = { f0, per, amp, thr: 29, grows: a > 29, joints: slab ? 5 : 15 };
        });
        v.legend([['accent', 'amplifier output'], ['orange', 'ladder node $v_3$']]);
        v.readout(() => info && `Predicted $f_0 = \\sqrt6/(2\\pi RC) = ${engTex(info.f0, 3, 'Hz')}$; measured from zero crossings: ${info.per ? `$${engTex(info.f0 * (1 / info.per), 3, 'Hz')}$` : 'no sustained oscillation'}. Output amplitude after 12 periods $= ${v.fix(info.amp, 3)}$ V ${info.grows ? '(gain above the threshold 29: oscillation grows until the amplifier saturates)' : '(gain below 29: any oscillation dies away)'}. Model count: ${info.joints} ${info.joints === 15 ? 'hand-soldered leads' : 'bonded wires (one per net), none between separately made components'}.`);
      },
    },
    // ───────────────────────────────────────────────────────────────────────────────────── 4.17
    {
      num: '4.17',
      kind: 'Paper',
      name: 'Nanowatt Logic Using Field-Effect MOS Triodes',
      paper: { authors: 'F. M. Wanlass and C. T. Sah', year: 1963, title: 'Nanowatt Logic Using Field-Effect Metal-Oxide Semiconductor Triodes', venue: '1963 IEEE International Solid-State Circuits Conference, Digest of Technical Papers: 32–33', doi: '10.1109/ISSCC.1963.1157450' },
      introduces: ['circ-4.8'],
      credit: 'F. M. Wanlass and C.-T. Sah, 1963 (ISSCC, February 1963); Wanlass filed the CMOS patent US 3,356,858 on 18 June 1963',
      statement: String.raw`The paper shows that logic built from complementary pairs of n-channel and p-channel metal-oxide-semiconductor field-effect transistors dissipates almost no power while a circuit is idle: in the complementary inverter exactly one transistor of the pair is conducting in either logic state, so the only supply current is the leakage of the off transistor (nanowatts per gate), and power is dissipated chiefly while switching. Compared with a resistor-load inverter, whose output-low state draws a steady current $V_{DD}/(R+R_{\mathrm{on}})$, the complementary circuit has a static power many orders of magnitude lower, with output levels equal to the supply rails.`,
      idea: String.raw`Earlier MOS and bipolar logic gates (resistor- or depletion-load) drew current whenever the output was low, so power scaled with the number of gates. The complementary pair (4.8, 4.7) removes the static path from supply to ground. What remains is the dynamic energy $CV_{DD}^2$ dissipated per charge–discharge cycle of the load capacitance $C$, the quantity that, multiplied by the clock frequency and the number of switching gates, sets the power of every modern chip. The paper gave the idea its first public presentation; the patent (filed in June 1963) followed. In the decades after, CMOS replaced nearly all other logic families because power, not speed, limits density.`,
      caption: String.raw`**A model with illustrative numbers.** Power of one gate against clock frequency (log–log): the resistor-load inverter (red) dissipates a constant static power whenever its output is low, the complementary inverter (blue) only its leakage plus the dynamic power $\tfrac12 \cdot CV_{DD}^2f$ (activity factor $\tfrac12$), which rises in proportion to the frequency. Below the crossover frequency (gold) the complementary gate is much cheaper. The right plot shows the supply current during switching: spikes for the complementary pair, a flat current as long as the output of the resistor-load gate is low, as seen after the second transition (the complementary pair draws supply current only when its output rises).`,
      scope: String.raw`Quasi-static model with output resistance $R_{\mathrm{on}}=1$ kΩ of the on transistor, load resistor $R$, assumed leakage current; the paper's measured nanowatt figures are not reproduced.`,
      deps: ['circ-4.7', 'cm-4.10'],
      refs: [],
      tags: ['cmos', 'power', 'history'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/CMOS', doi: 'https://doi.org/10.1109/ISSCC.1963.1157450' },
      viz(v) {
        const sp = v.stage({ x: [1e3, 1e10], y: [1e-12, 1e-2], xlog: true, ylog: true, axes: 'box', gutter: true, height: 340, weight: 1.15, xlabel: 'clock frequency $f$ (Hz)', ylabel: 'power per gate (W)', title: 'power against frequency' });
        const si = v.stage({ x: [0, 16], y: [0, 1.1], axes: 'box', gutter: true, height: 340, weight: 0.85, xlabel: 'time ($\\tau = R_{\\mathrm{on}}C$): output rises at 0, falls at 8', ylabel: 'supply current / $V_{DD}/R_{\\mathrm{on}}$', title: 'supply current around two transitions' });
        const Vdd = v.slider('supply $V_{DD}$', 1, 5, 3.3, { step: 0.1, fmt: (x) => `${v.fix(x, 1)} V` });
        const Cl = v.slider('load $C$', 1e-15, 1e-12, 1e-14, { log: true, sig: 2, fmt: (x) => `${eng(x, 2)}F` });
        const Ilk = v.slider('leakage', 1e-12, 1e-6, 1e-10, { log: true, sig: 2, fmt: (x) => `${eng(x, 2)}A` });
        const Rl = v.slider('load $R$', 2e3, 1e6, 2e4, { log: true, sig: 2, fmt: (x) => `${eng(x, 2)}Ω` });
        const fs = v.slider('clock $f$', 1e3, 1e10, 1e7, { log: true, sig: 2, fmt: (x) => `${eng(x, 2)}Hz` });
        let info = null;
        v.render(() => {
          const V = Vdd.value, C = Cl.value, lk = Ilk.value, R = Rl.value, f = fs.value, Ron = 1e3;
          const Pc = (x) => V * lk + 0.5 * C * V * V * x;
          const Pr = (x) => 0.5 * (V * V) / (R + Ron) + 0.5 * C * V * V * x;
          sp.fn(Pc, { domain: [1e3, 1e10], color: 'accent', width: 2.6 });
          sp.fn(Pr, { domain: [1e3, 1e10], color: 'red', width: 2.6 });
          sp.fn((x) => 0.5 * C * V * V * x, { domain: [1e3, 1e10], color: 'muted', width: 1.2, dash: true, alpha: 0.7 });
          const fx = (V * V / (R + Ron) - 2 * V * lk) / (C * V * V);
          if (fx > 1e3 && fx < 1e10) { sp.vline(fx, { color: 'gold', dash: true }); sp.dot(fx, Pr(fx), { color: 'gold', r: 5 }); }
          sp.vline(f, { color: 'orange', width: 1.5 });
          sp.dot(f, Pc(f), { color: 'accent', r: 6 }); sp.dot(f, Pr(f), { color: 'red', r: 6 });
          // supply current around one pair of transitions, time in units of tau = Ron*C: the output rises at t = 0 and falls at t = 8 tau
          const tau = Ron * C, ipk = V / Ron, iRes = V / (R + Ron) / ipk, np = 400, cm = [], rs = [];
          for (let k = 0; k <= np; k++) {
            const t = (16 * k) / np;
            cm.push([t, (t < 8 ? Math.exp(-t) : 0) + lk / ipk]);
            rs.push([t, t < 8 ? (V / R / ipk) * Math.exp(-t * tau / (R * C)) : iRes]);
          }
          si.path(rs, { color: 'red', width: 2 });
          si.path(cm, { color: 'accent', width: 2.2 });
          info = { Pc: Pc(f), Pr: Pr(f), fx, ratio: Pr(f) / Pc(f), Ps: V * lk, dyn: 0.5 * C * V * V * f };
        });
        v.legend([['accent', 'complementary pair'], ['red', 'resistor-load inverter'], ['muted', 'dynamic power alone', { dash: true }], ['gold', 'crossover']]);
        v.readout(() => info && `At $f = ${engTex(fs.value, 2, 'Hz')}$: complementary gate $${engTex(info.Pc, 3, 'W')}$ (static $${engTex(info.Ps, 2, 'W')}$ + dynamic $${engTex(info.dyn, 2, 'W')}$), resistor-load gate $${engTex(info.Pr, 3, 'W')}$: ratio $${v.fix(info.ratio, 1)}$. ${info.fx > 1e3 && info.fx < 1e10 ? `Above $${engTex(info.fx, 2, 'Hz')}$ the two are dominated by the same dynamic term.` : ''}`);
      },
    },
    // ───────────────────────────────────────────────────────────────────────────────────── 4.18
    {
      num: '4.18',
      kind: 'Paper',
      name: 'Cramming More Components onto Integrated Circuits',
      paper: { authors: 'Gordon E. Moore', year: 1965, title: 'Cramming More Components onto Integrated Circuits', venue: 'Electronics 38 (8): 114–117 (reprinted in Proceedings of the IEEE 86 (1): 82–85, 1998)', doi: '10.1109/JPROC.1998.658762' },
      introduces: ['tech-11.18'],
      credit: 'G. E. Moore, Fairchild Semiconductor, Electronics, 19 April 1965; revised forecast (doubling every two years), 1975',
      verify: true,
      statement: String.raw`The article argues that integrated electronics will make electronics cheaper, and supports it with two graphs. (a) For a given year there is a number of components per integrated circuit at which the manufacturing cost *per component* is minimal: fewer components waste the fixed cost of the package, more components lower the yield. (b) That optimum number has been growing, and had doubled about every year since the planar process of 1959; extrapolating, Moore projected as many as 65,000 components on a single chip by 1975. In 1975 he revised the rate to a doubling about every two years, which is the form in which "Moore's law" is usually quoted.`,
      idea: String.raw`Moore, then head of research at Fairchild, was asked to forecast ten years of semiconductor electronics. His observation was economic as much as technical: cost per component is a U-shaped function of complexity, the minimum moves right as process control (yield) improves, and the cost at the minimum falls. Plotting the complexity at minimum cost against year on a logarithmic axis gave a straight line, with only a handful of points. The statement is an empirical trend, not a law of nature; it became a self-fulfilling roadmap for the industry. The unit is *components* (transistors, resistors, diodes, capacitors), not transistors alone.`,
      caption: String.raw`**A reconstruction.** Left: relative cost per component against components per chip, from a simple model (cost $=(a/n+b)\,e^{n/N_0}$ per component: a fixed cost spread over $n$ components, plus a yield penalty, with $N_0$ growing by a factor 2 per $T_d$ years), for 1962, 1965 and 1970; the minima (gold) move right and down. The figures are the model's, not the paper's. Right: $\log_2$ of components per chip against year. The two gold points are Moore's anchors (about one component in 1959, about 64 = $2^6$ in 1965, implied by the paper's growth to 65,000 in 1975); the dashed line is his projection; the blue points are later microprocessors (transistor counts from Wikipedia's table). Slide the doubling time and compare.`,
      scope: String.raw`Empirical trend in the industry's densest commercial chips, not a physical law; the cost curves are a toy model and the later chip counts are secondary-source figures.`,
      deps: ['tech-11.17'],
      refs: [],
      tags: ['moore\'s law', 'scaling', 'history'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Moore%27s_law', doi: 'https://doi.org/10.1109/JPROC.1998.658762' },
      viz(v) {
        const chips = [[1971, 2250, '4004'], [1978, 29000, '8086'], [1985, 275000, '80386'], [1993, 3.1e6, 'Pentium'], [2000, 42e6, 'Pentium 4'], [2023, 19e9, 'A17']];
        const s1 = v.stage({ x: [1, 1e6], y: [0.05, 100], xlog: true, ylog: true, axes: 'box', gutter: true, height: 340, weight: 1, xlabel: 'components per integrated circuit', ylabel: 'relative cost per component', title: 'cost per component' });
        const s2 = v.stage({ x: [1957, 2034], y: [-2, 38], axes: 'box', gutter: true, height: 340, weight: 1.1, xlabel: 'year', ylabel: '$\\log_2$(components per chip)', title: 'complexity against year' });
        const Td = v.slider('doubling time $T_d$', 0.5, 3, 1, { step: 0.05, fmt: (x) => `${v.fix(x, 2)} yr` });
        const ratio = v.slider('fixed / marginal cost $a/b$', 10, 1000, 100, { log: true, sig: 2, fmt: (x) => v.fix(x, 0) });
        let info = null;
        v.render(() => {
          const td = Td.value, ab = ratio.value;
          const N0 = (yr) => 64 * Math.pow(2, (yr - 1965) / td);
          const cost = (n, yr) => (ab / n + 1) * Math.exp(n / N0(yr));
          const opt = (yr) => { const N = N0(yr), a = ab; return (-a / N + Math.sqrt((a / N) ** 2 + (4 * a) / N)) / (2 / N); };
          const norm = cost(opt(1965), 1965);
          const cols = { 1962: 'muted', 1965: 'accent', 1970: 'purple' };
          const mins = [];
          for (const yr of [1962, 1965, 1970]) {
            s1.fn((n) => cost(n, yr) / norm, { domain: [1, 1e6], color: cols[yr], width: yr === 1965 ? 2.8 : 2, n: 400 });
            const nm = opt(yr); mins.push([nm, cost(nm, yr) / norm]);
            s1.dot(nm, cost(nm, yr) / norm, { color: 'gold', r: 5 });
            s1.tex(String(yr), nm, cost(nm, yr) / norm, { color: cols[yr], size: 12.5, dy: 16 });
          }
          s1.path(mins, { color: 'gold', width: 1.2, dash: true });
          // second plot
          const y0 = 1965, l0 = 6, slope = 1 / td;
          s2.line(1957, l0 + slope * (1957 - y0), 2034, l0 + slope * (2034 - y0), { color: 'muted', width: 1.6, dash: true });
          s2.vline(1975, { color: 'faint', dash: true });
          s2.dot(1959, 0, { color: 'gold', r: 6 }); s2.dot(1965, 6, { color: 'gold', r: 6 });
          s2.dot(1975, 16, { color: 'orange', r: 6, hollow: true });
          s2.text('65 000 in 1975 (Moore)', 1975, 16, { size: 11.5, color: 'orange', dx: -10, dy: 0, align: 'right', plate: true });
          chips.forEach(([yr, n, name]) => { s2.dot(yr, Math.log2(n), { color: 'accent', r: 5 }); s2.text(name, yr, Math.log2(n), { size: 11, color: 'muted', dx: 6, dy: 13, align: 'left' }); });
          const ys = chips.map((c) => c[0]), ls = chips.map((c) => Math.log2(c[1])), fit = v.M.linreg(ys, ls);
          s2.line(1971, fit.predict(1971), 2023, fit.predict(2023), { color: 'accent', width: 1.6 });
          info = { td, pred1975: Math.pow(2, l0 + slope * 10), fitTd: 1 / fit.slope, opt: [1962, 1965, 1970].map(opt) };
        });
        v.legend([['gold', 'Moore\'s anchor points / cost minima'], ['muted', 'projection', { dash: true }], ['accent', 'later chips and their fit']]);
        v.readout(() => info && `Projection with $T_d = ${v.fix(info.td, 2)}$ yr: ${info.pred1975 >= 1e6 ? v.sci(info.pred1975, 2) : Math.round(info.pred1975).toLocaleString('en-US')} components in 1975 (the paper: about 65,000 for $T_d=1$). A straight-line fit through the six later chips gives a doubling time of $${v.fix(info.fitTd, 2)}$ years, close to the two years of the 1975 revision. Model cost minima (components): ${info.opt.map((x) => Math.round(x).toLocaleString('en-US')).join(', ')} for 1962, 1965, 1970.`);
      },
    },
  ],
};
