// Syllabus — Pharmacology (curated course; see collection.js for references)
//
// Sources consulted (research pass, Oct 2026):
//   - Rowland & Tozer, Clinical Pharmacokinetics and Pharmacodynamics (4th ed., 2011) — TOC not reachable online
//     (Google Books page has none), so refs are bare 'Rowland–Tozer'.
//   - Goodman & Gilman (13th ed.) — ch. 2 pharmacokinetics, ch. 3 pharmacodynamics, ch. 4 toxicity,
//     ch. 6 drug metabolism, ch. 7 pharmacogenetics (chapter-level refs).
//   - MIT HST.151 Principles of Pharmacology calendar (receptors/dose–response, PK I–III, drug metabolism,
//     pharmacogenetics, drug development) https://ocw.mit.edu/courses/hst-151-principles-of-pharmacology-spring-2005/pages/calendar/
//   - Wikipedia: Pharmacokinetics https://en.wikipedia.org/wiki/Pharmacokinetics (→ LADME, plateau principle,
//     Bateman function, curve stripping, trapezoidal AUC, NCA); Pharmacodynamics
//     https://en.wikipedia.org/wiki/Pharmacodynamics (→ receptor reserve, del Castillo–Katz, Cheng–Prusoff,
//     Schild regression, type A/B adverse reactions, allosteric modulation)
// Deliberate omissions: drug-class pharmacology (autonomic, antimicrobial, oncology lectures) — the atlas
//   keeps quantitative principles; mechanisms of individual drug classes would be examples, not items.
// Landmark papers (kind 'Paper', appended Oct 2026): every citation checked against its Crossref DOI record,
//   PubMed/PMC, the BHL OpenURL resolver or archive.org catalogue metadata (books and pre-DOI papers get a `url`).
export default {
  collection: 'pharm',
  chapters: [
    {
      n: 1,
      title: 'Drug disposition: the basic quantities',
      summary: String.raw`What the body does to a drug is summarized by a few numbers. The area under the concentration–time curve measures exposure; volume of distribution relates amount in the body to plasma concentration; clearance relates elimination rate to concentration; bioavailability says how much of an oral dose arrives. Protein binding, pH partitioning and membrane permeability decide where a drug can go.`,
      items: [
        { num: '1.1', kind: 'Concept', name: 'ADME: absorption, distribution, metabolism, excretion', deps: ['pma-5.3'], refs: ['Goodman–Gilman ch. 2', 'Rowland–Tozer'],
          pic: 'Follow a dose from gut to blood to tissues to liver and kidney in an animated body; amount bars for each stage update as time advances.' },
        { num: '1.2', kind: 'Concept', name: 'Concentration–time profile and AUC', deps: ['pharm-1.1', 'pma-6.1'], refs: ['Rowland–Tozer'],
          pic: 'Plot sampled plasma concentrations and estimate the area under the curve with the trapezoidal rule; add samples and see the estimate converge, with the extrapolated tail shaded.' },
        { num: '1.3', kind: 'Definition', name: 'Volume of distribution', deps: ['pharm-1.2'], refs: ['Rowland–Tozer'],
          pic: 'Dissolve a dose in a body that binds drug in tissues; the apparent volume, amount over plasma concentration, can far exceed total body water, shown against a 42-litre reference.' },
        { num: '1.4', kind: 'Definition', name: 'Clearance', deps: ['pharm-1.2', 'physio-7.3'], refs: ['Rowland–Tozer'],
          pic: 'An eliminating organ removes drug from blood flowing through it; clearance is the volume of plasma cleared per unit time, drawn as a shaded fraction of the blood stream.' },
        { num: '1.5', kind: 'Theorem', name: 'Dose = clearance × AUC', deps: ['pharm-1.4', 'pma-6.21'], refs: ['Rowland–Tozer'],
          pic: 'Integrate elimination rate CL·C over time for any input pattern you draw; the total eliminated always equals the dose, so AUC = Dose/CL whatever the curve’s shape.' },
        { num: '1.6', kind: 'Definition', name: 'Bioavailability', deps: ['pharm-1.5'], refs: ['Rowland–Tozer'],
          pic: 'Compare AUC after oral and intravenous doses; the ratio gives F, and separate bars show losses to incomplete absorption and to first-pass metabolism.' },
        { num: '1.7', kind: 'Concept', name: 'Plasma protein binding and the unbound fraction', deps: ['pharm-1.3', 'mathbio-5.2'], refs: ['Rowland–Tozer'],
          pic: 'Drug molecules bind albumin according to a binding isotherm; only the free fraction crosses membranes and acts, and displacing it changes free concentration transiently but not at steady state.' },
        { num: '1.8', kind: 'Model', name: 'pH partition and ion trapping', deps: ['physio-8.2', 'physio-1.3'], refs: ['Goodman–Gilman ch. 2'],
          pic: 'A weak acid crosses a membrane only in its neutral form; set the pH on each side and the total concentrations equilibrate in the ratio predicted by Henderson–Hasselbalch, trapping drug on the ionizing side.' },
        { num: '1.9', kind: 'Concept', name: 'Membrane permeability, lipophilicity and the blood–brain barrier', deps: ['physio-1.3'], refs: ['Goodman–Gilman ch. 2'],
          pic: 'Plot brain uptake against the octanol–water partition coefficient for many drugs; uptake rises with lipophilicity, and efflux-transporter substrates fall well below the trend.' },
      ],
    },
    {
      n: 2,
      title: 'One-compartment kinetics',
      summary: String.raw`Treating the body as a single well-mixed compartment with first-order elimination explains half-lives, the approach to a plateau under constant infusion, loading doses and the rise and fall after an oral dose. The key lesson is that half-life depends on both clearance and volume, and that the time to reach steady state depends on half-life alone.`,
      items: [
        { num: '2.1', kind: 'Model', name: 'One-compartment model after an intravenous bolus', deps: ['pharm-1.3', 'pharm-1.4', 'kin-1.5'], refs: ['Rowland–Tozer'],
          pic: 'Inject a bolus into a single tank with an outflow proportional to concentration; concentration falls exponentially, a straight line on a semilog plot.' },
        { num: '2.2', kind: 'Theorem', name: 'Half-life: t½ = 0.693·V/CL', deps: ['pharm-2.1'], refs: ['Rowland–Tozer'],
          pic: 'Change clearance and volume independently; doubling the volume doubles the half-life even with clearance unchanged, read from the slope of the semilog line.' },
        { num: '2.3', kind: 'Method', name: 'Estimating the elimination rate from a semilog plot', deps: ['pharm-2.1', 'ladr-6.61', 'stat-1.10'], refs: ['Rowland–Tozer'],
          pic: 'Fit a line to noisy log-concentration samples; the slope gives k with a confidence interval, and dropping late samples shows how much precision they carry.' },
        { num: '2.4', kind: 'Model', name: 'Constant-rate infusion and the plateau principle', deps: ['pharm-2.2', 'ode-1.4'], refs: ['Rowland–Tozer'],
          pic: 'Start an infusion and watch concentration rise toward the plateau R/CL; stop it and the decline mirrors the rise.' },
        { num: '2.5', kind: 'Theorem', name: 'Time to plateau depends only on half-life', deps: ['pharm-2.4'], refs: ['Rowland–Tozer'],
          pic: 'Vary the infusion rate tenfold; the plateau height changes but the curves reach 50%, 90% and 97% of it after one, about 3.3 and 5 half-lives every time.' },
        { num: '2.6', kind: 'Concept', name: 'Loading dose', deps: ['pharm-2.4', 'pharm-1.3'], refs: ['Rowland–Tozer'],
          pic: 'Give a bolus of target concentration times volume at the start of an infusion; the concentration jumps to the plateau immediately instead of after five half-lives.' },
        { num: '2.7', kind: 'Model', name: 'First-order absorption: the Bateman function', deps: ['pharm-2.1', 'ode-1.4'], refs: ['Rowland–Tozer'],
          pic: 'An oral dose empties from a gut compartment into the plasma; the concentration curve is a difference of two exponentials whose shape changes as absorption and elimination rates are dragged.' },
        { num: '2.8', kind: 'Concept', name: 'Peak concentration and time to peak', deps: ['pharm-2.7', 'pharm-1.6', 'pma-5.8'], refs: ['Rowland–Tozer'],
          pic: 'Speed up absorption: the peak arrives earlier and higher while the AUC stays fixed, since it depends only on F·Dose/CL.' },
        { num: '2.9', kind: 'Phenomenon', name: 'Flip-flop kinetics', deps: ['pharm-2.7'], refs: ['Rowland–Tozer'],
          pic: 'Make absorption slower than elimination, as with a depot injection; the terminal slope now reflects absorption, and naive analysis misreads it as elimination half-life.' },
        { num: '2.10', kind: 'Method', name: 'Urinary excretion data and the sigma-minus method', deps: ['pharm-2.1', 'pma-6.21'], refs: ['Rowland–Tozer'],
          pic: 'Collect urine in intervals and plot the amount remaining to be excreted on a log scale; the slope recovers k without any blood samples.' },
      ],
    },
    {
      n: 3,
      title: 'Multi-compartment and physiological models',
      summary: String.raw`Many drugs first distribute into tissues and only then are eliminated, giving biexponential curves that a two-compartment model captures. Redistribution explains why some anaesthetics wear off quickly; context-sensitive half-time replaces half-life for infusions. Organ clearance depends on blood flow and extraction, which explains first-pass loss, and physiologically based models assemble organs into a whole-body circuit.`,
      items: [
        { num: '3.1', kind: 'Model', name: 'Two-compartment model: biexponential decline', deps: ['pharm-2.1', 'ladr-7.29', 'ode-3.3'], refs: ['Rowland–Tozer'],
          pic: 'Central and peripheral compartments exchange drug; the plasma curve after a bolus is the sum of two exponentials whose rates are the eigenvalues of the rate matrix.' },
        { num: '3.2', kind: 'Method', name: 'Method of residuals (curve stripping)', deps: ['pharm-3.1'], refs: ['Rowland–Tozer'],
          pic: 'Fit the terminal phase on a semilog plot, subtract it from early points and fit the residuals; both exponentials are recovered and compared with a nonlinear fit.' },
        { num: '3.3', kind: 'Concept', name: 'Distribution and elimination phases', deps: ['pharm-3.1'], refs: ['Rowland–Tozer'],
          pic: 'Track amounts in both compartments after a bolus; the fast α phase is drug moving into tissue and the slow β phase is elimination from the equilibrated body.' },
        { num: '3.4', kind: 'Phenomenon', name: 'Thiopental redistribution: waking before elimination', deps: ['pharm-3.3', 'ode-1.4'], refs: ['Goodman–Gilman ch. 2'],
          pic: 'A lipophilic anaesthetic floods the brain, then redistributes to muscle and fat; brain concentration falls below the waking threshold within minutes while most drug remains in the body.' },
        { num: '3.5', kind: 'Concept', name: 'Context-sensitive half-time', deps: ['pharm-3.1', 'pharm-2.4'], refs: ['Rowland–Tozer'],
          pic: 'Stop infusions of increasing duration and measure the time for plasma concentration to halve; for drugs with large peripheral compartments it grows with infusion length.' },
        { num: '3.6', kind: 'Model', name: 'Well-stirred liver model and hepatic extraction', deps: ['pharm-1.4', 'pharm-1.7', 'pma-5.5'], refs: ['Rowland–Tozer'],
          pic: 'Hepatic clearance is Q·f_u·CL_int/(Q + f_u·CL_int); drag blood flow and intrinsic clearance to see clearance limited by flow for high-extraction drugs and by enzymes for low-extraction ones.' },
        { num: '3.7', kind: 'Concept', name: 'First-pass effect', deps: ['pharm-3.6', 'pharm-1.6'], refs: ['Rowland–Tozer'],
          pic: 'An oral dose passes the liver before reaching the circulation; bioavailability equals 1 − E, so a high-extraction drug loses most of the dose, shown by flow bars.' },
        { num: '3.8', kind: 'Theorem', name: 'Clearances add', deps: ['pharm-1.4', 'pharm-1.5', 'pma-6.12'], refs: ['Rowland–Tozer'],
          pic: 'Renal, hepatic and other elimination pathways act in parallel; total clearance is their sum, and switching off one pathway raises AUC by the predicted factor.' },
        { num: '3.9', kind: 'Model', name: 'Physiologically based pharmacokinetic (PBPK) models', deps: ['pharm-3.1', 'physio-4.1', 'ladr-7.62', 'ladr-3.84'], refs: ['Rowland–Tozer'],
          pic: 'Organs connected by blood flows each have their own volume and partition coefficient; concentration–time curves in brain, liver, fat and muscle are integrated simultaneously.' },
        { num: '3.10', kind: 'Method', name: 'Noncompartmental analysis and mean residence time', deps: ['pharm-1.2', 'pharm-1.5', 'prob-1.6.9a'], refs: ['Rowland–Tozer'],
          pic: 'Compute AUC and the first-moment curve AUMC from samples; their ratio gives the mean residence time without assuming any compartment structure.' },
        { num: '3.11', kind: 'Phenomenon', name: 'Enterohepatic recirculation', deps: ['pharm-2.7', 'pma-3.26'], refs: ['Goodman–Gilman ch. 2'],
          pic: 'Drug excreted in bile is reabsorbed from the gut after each meal; the plasma curve shows secondary peaks and a prolonged terminal phase.' },
        { num: '3.12', kind: 'Paper', name: 'Context-Sensitive Half-Time in Multicompartment Models',
          paper: { authors: 'Michael A. Hughes, Peter S. A. Glass and James R. Jacobs', year: 1992, title: 'Context-sensitive half-time in multicompartment pharmacokinetic models for intravenous anesthetic drugs',
                   venue: 'Anesthesiology 76 (3): 334–341', doi: '10.1097/00000542-199203000-00003' },
          introduces: ['pharm-3.5'], deps: ['pharm-3.1', 'pharm-2.4'], refs: [],
          pic: 'Recreate the paper’s figure: simulate infusions of fentanyl, alfentanil, sufentanil, propofol, midazolam and thiopental, each with the multicompartment model the paper used, stop them after any duration, and plot the time for the plasma level to halve against infusion length — the curves cross, so the drug with the shortest elimination half-life is not always the one that wears off fastest.' },
      ],
    },
    {
      n: 4,
      title: 'Dosing regimens',
      summary: String.raw`Repeated doses superimpose, so concentrations accumulate toward a steady state that oscillates between a peak and a trough. Accumulation, the average steady-state level and the fluctuation within an interval all follow from the single-dose curve. Dosing is then tuned to keep concentrations inside the therapeutic window, adjusted for kidney function, scaled across species and made robust to missed doses.`,
      items: [
        { num: '4.1', kind: 'Model', name: 'Repeated dosing by superposition', deps: ['pharm-2.1', 'ode-3.1'], refs: ['Rowland–Tozer'],
          pic: 'Add single-dose curves shifted by the dosing interval; their sum climbs in a sawtooth toward a repeating steady-state pattern.' },
        { num: '4.2', kind: 'Theorem', name: 'Accumulation factor 1/(1 − e^{−kτ})', deps: ['pharm-4.1', 'pma-3.26'], refs: ['Rowland–Tozer'],
          pic: 'The steady-state peak is a geometric series of residual doses; the summed series and the closed form agree, and shortening the interval relative to half-life increases accumulation.' },
        { num: '4.3', kind: 'Theorem', name: 'Average steady-state concentration = F·Dose/(CL·τ)', deps: ['pharm-4.2', 'pharm-1.5', 'pma-7.16'], refs: ['Rowland–Tozer'],
          pic: 'Average concentration over a steady-state interval is computed numerically for different absorption rates; it is the same in every case, depending only on dosing rate and clearance.' },
        { num: '4.4', kind: 'Concept', name: 'Peak–trough fluctuation and the dosing interval', deps: ['pharm-4.2'], refs: ['Rowland–Tozer'],
          pic: 'Keep the daily dose fixed and split it into one, two or four doses; fluctuation between peak and trough shrinks as the interval shortens relative to half-life.' },
        { num: '4.5', kind: 'Concept', name: 'Therapeutic window and target concentration', deps: ['pharm-4.4'], refs: ['Rowland–Tozer', 'Goodman–Gilman ch. 3'],
          pic: 'Shade the band between minimum effective and minimum toxic concentrations; adjust dose and interval until the steady-state sawtooth stays inside it.' },
        { num: '4.6', kind: 'Method', name: 'Dose adjustment in renal impairment', deps: ['physio-7.5', 'pharm-4.3'], refs: ['Rowland–Tozer'],
          pic: 'Enter creatinine clearance; the renally cleared fraction of the drug scales down and the regimen is adjusted by lowering the dose or lengthening the interval, with both options plotted.' },
        { num: '4.7', kind: 'Phenomenon', name: 'Missed doses and adherence', deps: ['pharm-4.1', 'prob-1.6.1', 'prob-2.4.1'], refs: ['Rowland–Tozer'],
          pic: 'Skip doses at random according to an adherence slider; for short-half-life drugs concentrations drop below the window quickly, while long-half-life drugs are forgiving.' },
        { num: '4.8', kind: 'Concept', name: 'Zero-order and sustained-release delivery', deps: ['pharm-2.4', 'pharm-2.7'], refs: ['Rowland–Tozer'],
          pic: 'Compare an immediate-release tablet, a slow first-order release and a zero-order patch at the same daily dose; fluctuation falls as release slows.' },
        { num: '4.9', kind: 'Method', name: 'Intermittent infusion and aminoglycoside dosing', deps: ['pharm-4.1', 'pharm-2.4'], refs: ['Rowland–Tozer'],
          pic: 'Short infusions repeated each day give high peaks and low troughs; extended-interval dosing raises the peak/MIC ratio while allowing troughs to fall to near zero.' },
        { num: '4.10', kind: 'Concept', name: 'Allometric dose scaling across species', deps: ['ecol-1.5'], refs: ['Rowland–Tozer'],
          pic: 'Plot clearance of a drug in mouse, rat, dog and human against body mass on log–log axes; a slope near 0.75 lets a human dose be extrapolated from animal data.' },
      ],
    },
    {
      "n": 5,
      "title": "Nonlinear kinetics, metabolism and interactions",
      "summary": "Concentration-dependent elimination breaks the constant-clearance picture. Saturation, enzyme turnover and binding each introduce a different mechanism; genotype classification introduces a different kind of uncertainty. Explicit balances show which changes affect free concentration, total concentration or metabolite formation. All numerical experiments use chosen educational parameters.",
      "items": [
        {
          "num": "5.1",
          "kind": "Model",
          "name": "Michaelis–Menten elimination",
          "deps": [
            "mathbio-5.4",
            "pharm-2.1"
          ],
          "refs": [
            "MATHBIO 5.4: actual integrated depletion law and QSSA hypotheses",
            "Authored constant-volume compartment reduction"
          ],
          "see": [
            "kin-6.2",
            "pharm-5.2"
          ],
          "pic": "Move the time marker and change the initial concentration, capacity and Michaelis scale. Compare the saturating elimination-rate curve with the computed decline. Switch to log concentration to see the slope become more negative as saturation eases."
        },
        {
          "num": "5.2",
          "kind": "Phenomenon",
          "name": "Phenytoin: disproportionate rise at steady state",
          "deps": [
            "pharm-5.1"
          ],
          "refs": [
            "Official DailyMed phenytoin label, §12.3 Metabolism",
            "Independent steady balance and sensitivity derivation"
          ],
          "see": [
            "pharm-5.5"
          ],
          "pic": "Change input as a fraction of elimination capacity. Near capacity, compare a small input change with the much larger steady concentration change. At or above capacity the readout reports no finite steady state. The plotted branch ends at q=0.95; its endpoint is a plotting limit."
        },
        {
          "num": "5.3",
          "kind": "Phenomenon",
          "name": "Zero-order elimination of ethanol",
          "deps": [
            "pharm-5.1"
          ],
          "refs": [
            "Wall, Luczak & Hiller-Sturmhöfel, Biology, Genetics, and Environment, printed p.60, Alcohol Metabolism",
            "Authored asymptotic comparison of the5.1 model"
          ],
          "see": [
            "pharm-5.8"
          ],
          "pic": "Compare the actual positive saturable decline with a high-concentration straight-line approximation and a low-concentration exponential. The straight segment is drawn only while its own concentration is at least 5 K, a declared illustration threshold; the exact curve continues smoothly below it."
        },
        {
          "num": "5.4",
          "kind": "Concept",
          "name": "Enzyme inhibition and induction",
          "deps": [
            "pharm-5.1",
            "mathbio-5.7",
            "ode-1.4"
          ],
          "refs": [
            "MATHBIO 5.7: competitive low-substrate limit",
            "FDA/ICH M12 (2024), inhibition/induction mechanisms",
            "Authored first-order enzyme step"
          ],
          "see": [
            "pharm-5.5",
            "pharm-5.7"
          ],
          "pic": "Change fixed inhibitor and inducer ratios and move through the enzyme response. Compare the immediate inhibition factor, the growing enzyme abundance and their combined pathway factor. A zero inducer removes the gradual change; a zero inhibitor removes the immediate reduction."
        },
        {
          "num": "5.5",
          "kind": "Method",
          "name": "Predicting interaction size from the inhibitor’s Ki",
          "deps": [
            "pharm-5.4",
            "pharm-1.5",
            "pharm-1.4"
          ],
          "refs": [
            "FDA/ICH M12 (2024), Appendix D §7.5.1, printed pp.50–51: scope comparison",
            "Independent parallel-clearance and well-stirred balances"
          ],
          "see": [
            "pharm-3.6"
          ],
          "pic": "Switch between the parallel total-clearance approximation and the well-stirred organ comparison. Change free inhibitor/Ki, the affected fraction or intrinsic clearance. The selected ratio is computed from the corresponding model, including its unaffected route."
        },
        {
          "num": "5.6",
          "kind": "Concept",
          "name": "Pharmacogenetics: CYP2D6 metabolizer phenotypes",
          "deps": [
            "pharm-5.4",
            "popgen-1.5"
          ],
          "refs": [
            "CPIC 2026 ondansetron/tropisetron update, PDF p.2, Table 1 and genetic-test text",
            "CPIC opioid guideline (2021), PDF p.3, inhibitor phenoconversion paragraph"
          ],
          "see": [
            "pharm-5.8"
          ],
          "pic": "Choose an explicitly identified configuration or an unresolved/uncertain example, then compare baseline and inhibitor-adjusted classifications. In the separate two-haplotype pool, vary a chosen frequency and each haplotype's functional score; inspect the three exact expected genotype proportions."
        },
        {
          "num": "5.7",
          "kind": "Model",
          "name": "Autoinduction (carbamazepine)",
          "deps": [
            "pharm-5.4",
            "pharm-2.1",
            "ode-1.4"
          ],
          "refs": [
            "Official DailyMed carbamazepine extended-release label, Clinical Pharmacology",
            "Authored concentration/enzyme turnover balance"
          ],
          "see": [
            "pharm-5.2"
          ],
          "pic": "Change constant input, basal removal, induction strength and enzyme turnover. Watch the computed concentration and enzyme traces. Compare the achieved maximum with the final value and the derived equilibrium; weak or fast induction may have no visible overshoot."
        },
        {
          "num": "5.8",
          "kind": "Model",
          "name": "Parent–metabolite kinetics and prodrugs",
          "deps": [
            "pharm-2.7",
            "pharm-2.1"
          ],
          "refs": [
            "PHARM 2.7: actual two-stage integrating-factor derivation",
            "Independent formation-fraction and eliminated-equivalent balance"
          ],
          "see": [
            "pharm-5.6"
          ],
          "pic": "Vary both rates, the formation fraction and the initial amount. Move the time marker to inspect parent, metabolite and eliminated equivalents in the accounting panel. Apply the equal-rate button to check the actual limiting formula."
        },
        {
          "num": "5.9",
          "kind": "Concept",
          "name": "Saturable protein binding",
          "deps": [
            "pharm-1.7",
            "mathbio-5.2",
            "pharm-1.4"
          ],
          "refs": [
            "MATHBIO 5.2: actual free-ligand binding and conservation",
            "PHARM 1.7: low- versus high-extraction distinction",
            "Independent monotone inverse and steady balance"
          ],
          "see": [
            "pharm-5.10"
          ],
          "pic": "Choose total concentration to see the separately computed free and bound amounts. Switch to the constant-input steady comparison: change binding capacity while observing that the chosen model's free steady concentration is fixed by input/unbound clearance."
        },
        {
          "num": "5.10",
          "kind": "Model",
          "name": "Target-mediated drug disposition",
          "deps": [
            "pharm-5.1",
            "mathbio-5.2",
            "pharm-2.1"
          ],
          "refs": [
            "Mager & Jusko (2001), actually read PubMed abstract only; original body unread",
            "Authored mass-action/turnover and ligand balance"
          ],
          "see": [
            "pharm-5.9"
          ],
          "verify": true,
          "pic": "Compare binding with internalization, binding without internalization and binding switched off. Change initial ligand, target abundance and association. Inspect free, bound and total drug alongside target turnover and the independently integrated elimination balance."
        }
      ]
    },
    {
      "n": 6,
      "title": "Pharmacodynamics: receptors and dose–response",
      "summary": "Binding, activation and transduction answer different questions. Follow equilibrium receptor inventories into potency, constitutive activity, reserve and antagonism, then compare time-dependent binding, availability feedback and mixture reference models. Every concentration is illustrative; historical paper lessons preserve their bibliographic identities while marking unread original bodies explicitly.",
      "items": [
        {
          "num": "6.1",
          "kind": "Model",
          "name": "Receptor occupancy theory (Clark)",
          "deps": [
            "mathbio-5.2"
          ],
          "refs": [
            "IUPHAR PEP: actual pharmacodynamics affinity body",
            "Buchwald 2019: selected main-concepts discussion",
            "Own closed component balances"
          ],
          "links": {
            "education": "https://pharmacologyeducation.org/pharmacodynamics/",
            "modern": "https://www.frontiersin.org/journals/pharmacology/articles/10.3389/fphar.2019.00605/full"
          },
          "pic": "Choose maintained free ligand or a closed total supply. Move ligand and receptor inventories, compare occupancy curves, and inspect the separate free/bound component stacks."
        },
        {
          "num": "6.2",
          "kind": "Model",
          "name": "Emax model and the Hill equation for drug effect",
          "deps": [
            "pharm-6.1",
            "sysbio-1.3"
          ],
          "refs": [
            "IUPHAR PEP: actual dose–response, potency and efficacy text",
            "Own Hill response and derivative"
          ],
          "links": {
            "education": "https://pharmacologyeducation.org/pharmacodynamics/"
          },
          "pic": "Change response scale, steepness and limiting effect, then select a free concentration. Compare the response and its derivative with an n=1 curve at the same scale and maximum."
        },
        {
          "num": "6.3",
          "kind": "Concept",
          "name": "Potency versus efficacy",
          "deps": [
            "pharm-6.2"
          ],
          "refs": [
            "IUPHAR PEP: actual potency and efficacy explanation",
            "Own exact absolute-effect inversion"
          ],
          "links": {
            "education": "https://pharmacologyeducation.org/pharmacodynamics/"
          },
          "pic": "Compare two agents with independently chosen response scales and maxima. Move the common absolute target and examine each exact target concentration alongside the inverse-curve segments."
        },
        {
          "num": "6.4",
          "kind": "Concept",
          "name": "Log dose–response curves",
          "deps": [
            "pharm-6.2"
          ],
          "refs": [
            "IUPHAR PEP: actual dose–response explanation",
            "Own log-odds and interval derivation"
          ],
          "links": {
            "education": "https://pharmacologyeducation.org/pharmacodynamics/"
          },
          "pic": "Compare the same law on linear and logarithmic concentration axes with the same upper endpoint 10K. Move K and n; the band and open endpoints show the actual 10–90% interval."
        },
        {
          "num": "6.5",
          "kind": "Concept",
          "name": "Full, partial and inverse agonists",
          "deps": [
            "pharm-6.2"
          ],
          "refs": [
            "IUPHAR PEP: actual receptors, partial/inverse/neutral paragraphs",
            "Buchwald 2019: selected constitutive-activity discussion",
            "Own four-state ensemble"
          ],
          "links": {
            "education": "https://pharmacologyeducation.org/receptors/",
            "modern": "https://www.frontiersin.org/journals/pharmacology/articles/10.3389/fphar.2019.00605/full"
          },
          "pic": "Select full, partial, neutral, inverse or a custom bound activity. Vary constitutive activity and free ligand; compare occupancy with active fraction and the four normalized state bars."
        },
        {
          "num": "6.6",
          "kind": "Model",
          "name": "Operational model of agonism and receptor reserve",
          "deps": [
            "pharm-6.5",
            "sysbio-6.8"
          ],
          "refs": [
            "Buchwald 2019: selected operational-model comparison",
            "IUPHAR PEP: actual spare-receptor paragraph",
            "Own transduction algebra"
          ],
          "links": {
            "modern": "https://www.frontiersin.org/journals/pharmacology/articles/10.3389/fphar.2019.00605/full",
            "education": "https://pharmacologyeducation.org/receptors/"
          },
          "pic": "Move receptor inventory and transduction scale. Compare binding, absolute response and response divided by its own maximum; the second panel tracks the maximum and EC50/Kd as inventory changes."
        },
        {
          "num": "6.7",
          "kind": "Model",
          "name": "Del Castillo–Katz two-state receptor model",
          "deps": [
            "pharm-6.5"
          ],
          "refs": [
            "Buchwald 2019: selected minimal two-state versus operational discussion",
            "Own three-state partition and composite half-scale"
          ],
          "links": {
            "modern": "https://www.frontiersin.org/journals/pharmacology/articles/10.3389/fphar.2019.00605/full"
          },
          "pic": "Change microscopic binding and the opening equilibrium ratio. Follow the three equilibrium state probabilities, then compare total occupancy with open fraction over free agonist concentration."
        },
        {
          "num": "6.8",
          "kind": "Model",
          "name": "Competitive antagonism and the Schild equation",
          "deps": [
            "pharm-6.1",
            "mathbio-5.7"
          ],
          "refs": [
            "Buchwald 2019: selected competition and affinity concepts",
            "Own competitive partition and Schild derivation"
          ],
          "links": {
            "modern": "https://www.frontiersin.org/journals/pharmacology/articles/10.3389/fphar.2019.00605/full"
          },
          "pic": "Increase free antagonist and compare the right-shifted binding curve with its no-antagonist reference. Inspect the ideal Schild line, molar intercept and current antagonist point."
        },
        {
          "num": "6.9",
          "kind": "Theorem",
          "name": "Cheng–Prusoff equation: IC50 to Ki",
          "deps": [
            "pharm-6.8"
          ],
          "refs": [
            "CSPT: actual Cheng–Prusoff definition and stated hypotheses",
            "Own free-tracer derivation and conserved closed-species solution"
          ],
          "links": {
            "education": "https://pharmacologycanada.org/Cheng-Prusoff-equation"
          },
          "pic": "Choose maintained free ligands or closed total ligands. Change tracer, inhibitor and receptor inventories, compare normalized displacement, and inspect every free/bound component pool."
        },
        {
          "num": "6.10",
          "kind": "Concept",
          "name": "Non-competitive antagonism depresses E_max",
          "deps": [
            "pharm-6.8"
          ],
          "refs": [
            "IUPHAR PEP: actual receptor reserve discussion",
            "Buchwald 2019: selected operational-model comparison",
            "Own retained-inventory algebra"
          ],
          "links": {
            "education": "https://pharmacologyeducation.org/receptors/",
            "modern": "https://www.frontiersin.org/journals/pharmacology/articles/10.3389/fphar.2019.00605/full"
          },
          "pic": "Move the surviving receptor fraction while comparing original and reduced-inventory curves. Examine the limiting response and half-scale across the entire removal range, including complete removal."
        },
        {
          "num": "6.11",
          "kind": "Model",
          "name": "Allosteric modulators",
          "deps": [
            "pharm-6.1",
            "mathbio-5.9"
          ],
          "refs": [
            "Jakubík et al. 2019: actual selected Introduction, Methods model and Figure 1 caption",
            "Own reciprocal-convention partition and efficacy/transduction example"
          ],
          "links": {
            "article": "https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0214255"
          },
          "pic": "Vary modulator, binding cooperativity and joint-state efficacy independently. Compare agonist occupancy with functional response and the four state probabilities, including the no-modulator reference."
        },
        {
          "num": "6.12",
          "kind": "Concept",
          "name": "Binding kinetics: on-rate, off-rate and residence time",
          "deps": [
            "pharm-6.1"
          ],
          "refs": [
            "IUPHAR PEP: actual equilibrium affinity explanation as a contrast",
            "Own kinetic mass action and exact piecewise solution"
          ],
          "links": {
            "education": "https://pharmacologyeducation.org/pharmacodynamics/"
          },
          "pic": "Change a shared Kd, faster koff, pulse length and observation interval. Compare the actual maintained input and exact occupancy trajectories for rate pairs differing tenfold."
        },
        {
          "num": "6.13",
          "kind": "Concept",
          "name": "Tolerance, tachyphylaxis and desensitization",
          "deps": [
            "pharm-6.2"
          ],
          "refs": [
            "IUPHAR PEP: complete actual desensitisation and tachyphylaxis body",
            "Own two-state availability propagation"
          ],
          "links": {
            "education": "https://pharmacologyeducation.org/desensitisation-and-tachyphylaxis/"
          },
          "pic": "Switch between repeated pulses and continuous exposure. Change desensitization and recovery rates; compare the actual maintained input with availability, response and each pulse-onset response."
        },
        {
          "num": "6.14",
          "kind": "Method",
          "name": "Drug combinations: isobolograms and Loewe additivity",
          "deps": [
            "pharm-6.2"
          ],
          "refs": [
            "Kavčič et al. 2021: selected actual Loewe/Bliss, self-combination and no-double-bound text plus Figure 1 caption",
            "Own exact inverse curves, reference root and departure isobole"
          ],
          "links": {
            "article": "https://journals.plos.org/ploscompbiol/article?id=10.1371/journal.pcbi.1008529"
          },
          "pic": "Choose both single-agent curves, mixture and target. Inspect the normalized isobole and a response profile obtained by scaling the selected mixture; compare the actual-effect equivalent-dose sum."
        },
        {
          "num": "6.15",
          "kind": "Paper",
          "name": "The Reaction between Acetyl Choline and Muscle Cells",
          "paper": {
            "authors": "A. J. Clark",
            "year": 1926,
            "title": "The reaction between acetyl choline and muscle cells",
            "venue": "Journal of Physiology 61 (4): 530–546",
            "doi": "10.1113/jphysiol.1926.sp002314"
          },
          "introduces": [
            "pharm-6.1"
          ],
          "deps": [
            "mathbio-5.2"
          ],
          "refs": [
            "Clark 1926: bibliographic record only; original body stopped/unread",
            "Buchwald 2019: distinct actual selected occupancy/operational discussion",
            "Own modern model comparison"
          ],
          "links": {
            "modern": "https://www.frontiersin.org/journals/pharmacology/articles/10.3389/fphar.2019.00605/full"
          },
          "verify": true,
          "pic": "Compare a modern proportional-occupancy curve with operational transduction at the same maximum. Change binding and transduction parameters, then inspect their absolute and normalized response panels."
        },
        {
          "num": "6.16",
          "kind": "Paper",
          "name": "Some Quantitative Uses of Drug Antagonists",
          "paper": {
            "authors": "O. Arunlakshana and H. O. Schild",
            "year": 1959,
            "title": "Some quantitative uses of drug antagonists",
            "venue": "British Journal of Pharmacology and Chemotherapy 14 (1): 48–58",
            "doi": "10.1111/j.1476-5381.1959.tb00928.x"
          },
          "introduces": [
            "pharm-6.8"
          ],
          "deps": [
            "pharm-6.1"
          ],
          "refs": [
            "Arunlakshana and Schild 1959: frozen bibliography; original body stopped/unread",
            "Own competitive equilibrium dose-ratio and two-agonist comparison"
          ],
          "links": {},
          "verify": true,
          "pic": "Compare two agonists before and after a chosen antagonist. Switch between shared and different antagonist constants; inspect the resulting synthetic Schild relations and their molar pA2 intercepts."
        }
      ]
    },
    {
      n: 7,
      title: 'Linking kinetics to effect; safety',
      summary: String.raw`Effects often lag concentrations, so plotting effect against concentration traces hysteresis loops that effect-compartment and indirect-response models untangle. Across a population, quantal dose–response curves give median effective and toxic doses and the therapeutic index; “the dose makes the poison”. Antibiotics and cancer drugs bring their own kinetic–dynamic indices, with resistance emerging where concentrations are inadequate.`,
      items: [
        { num: '7.1', kind: 'Model', name: 'Effect compartment and hysteresis loops', deps: ['pharm-6.2', 'pharm-3.1'], refs: ['Rowland–Tozer'],
          pic: 'Plot effect against plasma concentration after a dose; the points trace a counter-clockwise loop, which collapses onto one curve when concentration in a lagging effect compartment is used instead.' },
        { num: '7.2', kind: 'Concept', name: 'Counter-clockwise versus clockwise hysteresis', deps: ['pharm-7.1'], refs: ['Rowland–Tozer'],
          pic: 'Switch between a distribution delay (counter-clockwise loop) and acute tolerance (clockwise loop); the direction of the loop diagnoses the mechanism.' },
        { num: '7.3', kind: 'Model', name: 'Indirect response models', deps: ['pharm-7.1'], refs: ['Rowland–Tozer'],
          pic: 'A drug inhibits production of a mediator with its own turnover, such as warfarin and clotting factors; the response peaks days after the concentration does.' },
        { num: '7.4', kind: 'Concept', name: 'Quantal dose–response: ED50, TD50 and LD50', deps: ['pharm-6.4'], refs: ['Goodman–Gilman ch. 3'],
          pic: 'Individual threshold doses vary lognormally across a population; the cumulative fraction responding is a sigmoid on a log axis whose midpoint is the ED50.' },
        { num: '7.5', kind: 'Concept', name: 'Therapeutic index and margin of safety', deps: ['pharm-7.4'], refs: ['Goodman–Gilman ch. 3'],
          pic: 'Draw the efficacy and toxicity quantal curves together; the ratio TD50/ED50 is read out, and widening the variability shows overlap even when the ratio is large.' },
        { num: '7.6', kind: 'Principle', name: 'The dose makes the poison (Paracelsus)', deps: ['pharm-7.4'], refs: ['Goodman–Gilman ch. 4'],
          pic: 'Water, caffeine, paracetamol and digoxin are placed on a log-dose axis with their therapeutic and toxic ranges; every substance becomes toxic at some dose.' },
        { num: '7.7', kind: 'Concept', name: 'Type A and type B adverse reactions', deps: ['pharm-7.4'], refs: ['Goodman–Gilman ch. 4'],
          pic: 'Dose-dependent (type A) toxicity rises along a dose–response curve, while idiosyncratic (type B) reactions occur in a rare susceptible subgroup regardless of dose, simulated across a population.' },
        { num: '7.8', kind: 'Model', name: 'Log-kill hypothesis and tumour regrowth', deps: ['mathbio-1.8'], refs: ['Goodman–Gilman ch. 3'],
          pic: 'Each chemotherapy cycle kills a fixed fraction of tumour cells while survivors regrow between cycles; whether the tumour shrinks depends on kill fraction versus regrowth.' },
        { num: '7.9', kind: 'Model', name: 'Antibiotic PK/PD indices: time above MIC and AUC/MIC', deps: ['pharm-7.1'], refs: ['Rowland–Tozer'],
          pic: 'Overlay a concentration–time course on the MIC line; time above MIC, peak/MIC and AUC/MIC are computed and related to simulated bacterial killing for different regimens.' },
        { num: '7.10', kind: 'Phenomenon', name: 'Mutant selection window', deps: ['pharm-7.9', 'popgen-4.14'], refs: ['Rowland–Tozer'],
          pic: 'Between the MIC of susceptible bacteria and that of resistant mutants, resistant cells are enriched; regimens spending long in this band select resistance in the simulation.' },
        { num: '7.11', kind: 'Method', name: 'Therapeutic drug monitoring', deps: ['pharm-4.5'], refs: ['Rowland–Tozer'],
          pic: 'Measure one trough concentration and adjust the dose proportionally; repeated adjustments bring a patient with unusual clearance into the window within a few intervals.' },
        { num: '7.12', kind: 'Paper', name: 'On the Antibacterial Action of Cultures of a Penicillium',
          paper: { authors: 'Alexander Fleming', year: 1929, title: 'On the antibacterial action of cultures of a penicillium, with special reference to their use in the isolation of B. influenzæ',
                   venue: 'British Journal of Experimental Pathology 10 (3): 226–236', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC2048009/' },
          introduces: ['tech-10.13'], deps: ['tech-10.12'], refs: [],
          pic: 'Fleming’s plates: a mould colony on a staphylococcus plate dissolves the colonies around it; then his gutter test, with mould broth in a trench and different bacteria streaked across it, shows staphylococci, streptococci and pneumococci held back near the trench while B. influenzae and the coli–typhoid group grow right up to it — dilute the broth and measure the zones of inhibition.' },
      ],
    },
    {
      n: 8,
      title: 'Variability and drug development',
      summary: String.raw`Patients differ, and population pharmacokinetics measures how much and why, feeding Bayesian dose individualization. Drug development uses kinetic and dynamic reasoning at every step: choosing a safe first-in-human dose, escalating doses in phase I, and showing that a generic product delivers the same exposure as the original.`,
      items: [
        { num: '8.1', kind: 'Concept', name: 'Population pharmacokinetics: mixed-effects variability', deps: ['pharm-2.1', 'stat-10.15'], refs: ['Rowland–Tozer'],
          pic: 'Simulate many patients whose clearances depend on weight and kidney function plus random variation; the spaghetti plot of concentration curves narrows once covariates are accounted for.' },
        { num: '8.2', kind: 'Method', name: 'Bayesian dose individualization', deps: ['pharm-8.1', 'stat-10.1'], refs: ['Rowland–Tozer'],
          pic: 'Combine a population prior on clearance with one or two measured concentrations; the posterior narrows and the recommended dose is recomputed.' },
        { num: '8.3', kind: 'Concept', name: 'Bioequivalence and the 80–125% rule', deps: ['pharm-2.8'], refs: ['Rowland–Tozer'],
          pic: 'Simulate a crossover study of test and reference formulations; the 90% confidence interval for the AUC and Cmax ratios must fall within 0.80–1.25, and smaller studies fail more often.' },
        { num: '8.4', kind: 'Method', name: '3+3 dose escalation in phase I trials', deps: ['pharm-7.5'], refs: ['Goodman–Gilman ch. 1'],
          pic: 'Treat cohorts of three at rising doses with a hidden true toxicity curve; the design’s chosen maximum tolerated dose is histogrammed over many simulated trials.' },
        { num: '8.5', kind: 'Concept', name: 'First-in-human starting dose', deps: ['pharm-4.10', 'pharm-7.5'], refs: ['Goodman–Gilman ch. 1'],
          pic: 'Convert the no-adverse-effect dose in animals to a human-equivalent dose by body-surface scaling and divide by a safety factor; the chain of conversions is drawn step by step.' },
      ],
    },
  ],
};
