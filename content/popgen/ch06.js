// Population genetics — Wave 6. Frozen identities, explicit model conventions.
import * as V from './ch06.viz.js';
export default {
  "collection": "popgen",
  "chapter": 6,
  "title": "Selection and drift together",
  "summary": "A new mutant can be beneficial and still disappear. Explicit branching, diffusion and finite-chain models separate establishment, fixation and waiting time. Nearly neutral and drift-barrier hypotheses motivate carefully scoped effect mixtures, while finite clonal competition, irreversible mutation load and conditional rescue show where independent-sweep approximations fail.",
  "items": [
    {
      "num": "6.1",
      "kind": "Model",
      "name": "Branching-process approximation for a new mutant",
      "deps": [
        "popgen-4.2",
        "mathbio-11.2",
        "stoch-3.9",
        "prob-4.3.8a"
      ],
      "statement": "A rare mutant can be approximated by a **Galton–Watson process** while its copies reproduce independently in an effectively unchanged background. With Poisson offspring mean $m=1+s>0$,\n$$Z_{t+1}\\mid Z_t\\sim\\operatorname{Poisson}(mZ_t),$$\n$$\\mathbb E[Z_t\\mid Z_0=k]=km^t.$$\nThe extinction probabilities from one copy satisfy $q_0=0$, $q_{t+1}=\\exp[m(q_t-1)]$. Their limit is the least fixed point $q$ of that generating function. Eventual survival is $1-q^k$ from $k$ independent founders; it is zero for this offspring law when $s\\le0$.",
      "idea": "Sum the independent offspring of all current copies; a sum of Poisson variables is Poisson. Condition on the first generation to obtain the generating-function recurrence. Starting that recurrence at zero counts extinction by successively later generations and selects its least fixed point. The branching-process prerequisites supply independence and the conditional expectation; the needed rare-lineage argument is given here.\n\nAn increasing mean is compatible with most lineages disappearing. A small minority of rapidly growing surviving lineages can dominate the average. Once the mutant occupies a substantial part of a finite population, its copies compete and the branching approximation no longer describes the full sweep.",
      "caption": "Follow 48 seeded lineages, compare their log counts with the unconditional mean, and compare finite-generation extinction with its eventual value. An observation cap stops a path after a complete sampled generation; censored paths are counted separately.",
      "scope": "Discrete generations, independent Poisson offspring and constant per-copy advantage. This is an early rare-lineage model, not an entire fixed-size population. Infinite-horizon survival is distinct from finite-population fixation. No trajectories are selected for looking successful; a fixed seed reproduces the same sample. The cap is an observation limit, not density regulation.",
      "refs": [
        "Felsenstein, Theoretical Evolutionary Genetics (December 2019), VII.7, pp.314–330, especially Eqs.(VII-63)–(VII-97): https://felsenst.github.io/pgbook/pgbook.pdf"
      ],
      "links": {
        "teaching": "https://felsenst.github.io/pgbook/pgbook.pdf"
      },
      "tags": [
        "selection",
        "genetic drift"
      ],
      "viz": V.branching
    },
    {
      "num": "6.2",
      "kind": "Theorem",
      "name": "Haldane’s fixation probability ≈ 2s",
      "deps": [
        "popgen-6.1"
      ],
      "statement": "For a single rare copy with independent Poisson offspring of mean $1+s$, $s>0$, its establishment probability $\\rho$ is the positive solution\n$$1-\\rho=e^{-(1+s)\\rho}.$$\nAs $s\\downarrow0$,\n$$\\rho=2s+O(s^2).$$\nInterpreting establishment as eventual fixation additionally requires a sufficiently large, otherwise stable population, weak per-generation selection and little subsequent competition from other beneficial lineages. In the diploid convention used below, $4N_es\\gg1$ makes the finite-population boundary correction small.",
      "idea": "Write the fixed-point equation as $-\\log(1-\\rho)=\\rho(1+s)$, divide by the nonzero $\\rho$, and expand: $s=\\rho/2+\\rho^2/3+\\cdots$. Hence the leading term is $2s$. This argument assumes the Poisson offspring variance; a mean advantage alone does not determine survival for every offspring distribution.\n\nThe neutral infinite branching process eventually dies, whereas a neutral allele in a finite population fixes with its initial frequency. Taking a large-population approximation and then setting selection to zero does not reproduce every finite-population limit.",
      "caption": "Move s along the exact survival curve and the line 2s. A second panel reports their ratio, showing why the approximation is useful near zero and progressively inaccurate away from it.",
      "scope": "Establishment under the declared offspring law, without dominance, frequency dependence or changing environment. The approximation is neither a universal probability formula nor an exact equality. At s=0 the relative error is undefined; the displayed ratio has its analytic limiting value one only on the curve. The accessible modern source supports the derivation independently of the uninspected Haldane 1927 body.",
      "refs": [
        "Felsenstein, Theoretical Evolutionary Genetics (December 2019), VII.7, pp.314–330, especially Eqs.(VII-63)–(VII-97): https://felsenst.github.io/pgbook/pgbook.pdf"
      ],
      "links": {
        "teaching": "https://felsenst.github.io/pgbook/pgbook.pdf"
      },
      "tags": [
        "selection",
        "genetic drift"
      ],
      "viz": V.haldane
    },
    {
      "num": "6.3",
      "kind": "Theorem",
      "name": "Kimura’s fixation probability",
      "deps": [
        "popgen-2.11",
        "popgen-4.3"
      ],
      "statement": "Let allele frequency have weak genic selection drift $M(p)=sp(1-p)$ and variance per generation $V(p)=p(1-p)/(2N_e)$. With no mutation or migration and absorbing endpoints, the diffusion fixation probability is\n$$u(p)=\\frac{1-e^{-4N_esp}}{1-e^{-4N_es}}\\quad(s\\ne0),$$\n$$u(p)=p\\quad(s=0).$$\nHere $s$ is the per-copy advantage: multiplicative diploid fitnesses are $(1+s)^2,1+s,1$. It is not a homozygote advantage whose heterozygote effect has already been halved.",
      "idea": "The neutral diffusion prerequisite gives the second-order term. Adding the weak-selection drift yields $Mu'+\\tfrac12Vu''=0$, so $u''+4N_es\\,u'=0$ in the interior. Integrate twice and impose $u(0)=0,u(1)=1$. Its neutral limit follows by expanding the exponentials.\n\nThe orange comparison instead solves a finite Wright–Fisher chain exactly: after selection the sampling frequency is $p(1+s)/(1+sp)$ and the next count is binomial with $2N$ trials. Solve its absorption equations at every integer count. This provides a finite-model comparison without treating a censored simulation as an observed eventual outcome.",
      "caption": "Change positive or negative selection and compare the diffusion curve with exact finite-chain fixation probabilities. The second panel subtracts the neutral probability. A continuous requested starting frequency is kept distinct from integer copy counts.",
      "scope": "Constant variance-effective size and small per-generation changes justify the diffusion. The finite comparison sets census N equal to Nₑ, uses independent gene-copy sampling and multiplicative selection, and has no dominance. General effective size can differ from census size, which still controls a new copy’s starting frequency. Kimura 1962 original-body access stopped at a browser check; this lesson uses the independently read modern derivation.",
      "refs": [
        "Felsenstein, Theoretical Evolutionary Genetics (December 2019), VII.7, pp.314–330, especially Eqs.(VII-63)–(VII-97): https://felsenst.github.io/pgbook/pgbook.pdf"
      ],
      "links": {
        "teaching": "https://felsenst.github.io/pgbook/pgbook.pdf"
      },
      "tags": [
        "selection",
        "genetic drift"
      ],
      "viz": V.kimura
    },
    {
      "num": "6.4",
      "kind": "Concept",
      "name": "Effective neutrality: |Nₑs| ≪ 1",
      "deps": [
        "popgen-6.3"
      ],
      "statement": "Selection becomes a small perturbation to neutral fixation when $|N_es|\\ll1$. In this chapter’s diploid diffusion convention, expansion about $a=4N_es=0$ gives\n$$u(p)=p+\\frac a2p(1-p)+O(a^2).$$\nThus $u(p)\\to p$ smoothly. A band such as $|4N_es|\\le1$ marks a scale of competition between selection and drift; its boundary is not an exact classification or a statistical detection threshold.",
      "idea": "Expand the numerator and denominator of the fixation formula through second order and divide their series. The first-order change depends on both scaled selection and starting frequency. Increasing effective size while holding a nonzero effect fixed increases the influence of selection, but a weakly selected allele can still be lost.\n\nThe factors two or four used in different neutrality rules depend on ploidy, drift normalization and the definition of the selection coefficient. State these conventions before comparing thresholds.",
      "caption": "Vary effective size and a signed selection coefficient. The fixation probability relative to neutral is continuous through one; the shaded convention band narrows as effective size rises. The starting frequency is explicitly 0.2.",
      "scope": "A comparison of model fixation probabilities, not a procedure for proving that an observed locus is neutral. The example holds starting frequency fixed while varying Nₑ, so it does not represent a unique new copy in each population. Its effective-size slider is a continuous diffusion parameter; no fractional individuals are simulated.",
      "refs": [
        "Felsenstein, Theoretical Evolutionary Genetics (December 2019), VII.7, pp.314–330, especially Eqs.(VII-63)–(VII-97): https://felsenst.github.io/pgbook/pgbook.pdf"
      ],
      "links": {
        "teaching": "https://felsenst.github.io/pgbook/pgbook.pdf"
      },
      "tags": [
        "selection",
        "genetic drift"
      ],
      "viz": V.neutrality
    },
    {
      "num": "6.5",
      "kind": "Hypothesis",
      "name": "Nearly neutral theory (Ohta)",
      "deps": [
        "popgen-6.4",
        "popgen-3.10"
      ],
      "statement": "Ohta’s **nearly neutral theory** gives weakly selected mutations a substantial role in molecular evolution. Whether such effects behave almost neutrally depends on their scale relative to effective population size. A fixed distribution containing slightly deleterious mutations can yield a lower relative substitution rate in larger populations, because purifying selection more efficiently excludes those mutations.\n\nFor a reference population with $N=N_e$, let $p_0=1/(2N)$. Define the relative rate in each effect class by\n$$r_j=2Nu_{s_j}(p_0).$$\nA chosen mixture $(w_j,s_j)$ then gives\n$$k/\\mu=\\sum_jw_jr_j.$$",
      "idea": "Multiply the supply $2N\\mu w_j$ in each effect class by its fixation probability and sum. A strictly neutral class contributes exactly its mixture weight to $k/\\mu$. Weakly harmful classes can contribute appreciably at small scaled effects and are suppressed at large negative scaled effects.\n\nThe numerical consequence is conditional on a fixed effect distribution and mutation rate. The broader hypothesis concerns the importance of such mutations in actual molecular evolution. A change of environment, generation time or fitness background can change the effects and the observed relation.",
      "caption": "Use a synthetic four-class neutral/deleterious distribution. Compare its per-generation substitution rate across reference population sizes and inspect each class’s new-mutation weight and contribution to the rate.",
      "scope": "The mixture is illustrative and is not Ohta’s mammalian dataset or an estimated biological DFE. Rates are normalized by mutation rate per generation, without a conversion to years. The actual 1993 primary article was read through its theoretical argument in pp.529–533; its later empirical analyses are not reproduced. The earlier neutral-theory lesson is a hypothesis prerequisite, not evidence that all molecular substitutions are neutral.",
      "refs": [
        "Felsenstein, Theoretical Evolutionary Genetics (December 2019), VII.7, pp.314–330, especially Eqs.(VII-63)–(VII-97): https://felsenst.github.io/pgbook/pgbook.pdf",
        "Ohta (1993), Interaction of selection and drift in molecular evolution, §§1–3 pp.529–533: DOI 10.1266/jjg.68.529"
      ],
      "links": {
        "primary": "https://www.jstage.jst.go.jp/article/jjg/68/6/68_6_529/_article"
      },
      "tags": [
        "selection",
        "genetic drift"
      ],
      "viz": V.nearly
    },
    {
      "num": "6.6",
      "kind": "Hypothesis",
      "name": "Drift-barrier hypothesis",
      "deps": [
        "popgen-6.5"
      ],
      "statement": "The **drift-barrier hypothesis** proposes that adaptive refinements can become limited by their tiny fitness gains relative to drift. It does not require a literal molecular optimum or an absolute ban on further improvement.\n\nFor an explicit diminishing-return example, let cumulative benefit be $B(x)=A(1-e^{-x})$. An available step of size $\\delta$ gives\n$$\\Delta B=Ae^{-x}(1-e^{-\\delta}).$$\nThe illustrative scale $4N_e\\Delta B=1$ is crossed at\n$$x_* = \\log[4N_eA(1-e^{-\\delta})].$$",
      "idea": "Subtract the benefits before and after the available step. Solving the chosen scaled-selection equality gives the crossing. More effective drift, smaller available improvements or weaker diminishing-return benefits move this crossover earlier. Fixation remains possible below it and its probability changes continuously.\n\nLynch’s mutation-rate hypothesis provides the biological motivation. The plotted benefit law and step sizes are an independent teaching construction, not his empirical regression or a mechanistic model of replication fidelity. Mutation bias, available variants, linkage and the costs of a refinement affect a real evolutionary distribution.",
      "caption": "Move effective size, the benefit scale and available step size. Compare the next-step gain with the drift scale along a progress coordinate, and inspect fixation relative to neutral at the selected point.",
      "scope": "A heuristic crossover under a declared fitness function. No phenotype measurements, taxa, observed error rates, optimization algorithm or universal mutation-rate floor are supplied. The source scope is Lynch 2011’s actual abstract and stated hypothesis; neither the stopped Lynch 2012 body nor inaccessible 2013 lecture is treated as read.",
      "refs": [
        "Lynch (2011), The lower bound to the evolution of mutation rates, actual PubMed abstract, DOI10.1093/gbe/evr066: https://pubmed.ncbi.nlm.nih.gov/21821597/",
        "Felsenstein, Theoretical Evolutionary Genetics (December 2019), VII.7, pp.314–330, especially Eqs.(VII-63)–(VII-97): https://felsenst.github.io/pgbook/pgbook.pdf"
      ],
      "links": {
        "primaryAbstract": "https://pubmed.ncbi.nlm.nih.gov/21821597/"
      },
      "tags": [
        "selection",
        "genetic drift"
      ],
      "viz": V.barrier
    },
    {
      "num": "6.7",
      "kind": "Theorem",
      "name": "Fixation time of a beneficial allele ≈ (2/s) ln(2N)",
      "deps": [
        "popgen-6.3"
      ],
      "statement": "The displayed expression is a **leading-log sweep-time rule**, not an exact conditional stochastic mean. In a continuous logistic approximation $\\dot p=sp(1-p)$, passage from $1/(2N)$ to $1-1/(2N)$ takes\n$$T_{\\rm pass}=\\frac{2\\log(2N-1)}s,$$\nwhich has leading form $2\\log(2N)/s$. For the exact deterministic discrete selection recurrence the interpolated passage time instead divides by $\\log(1+s)$. Neither trajectory reaches literal frequency one in finite time.\n\nA finite stochastic population has an actual absorption time, and its mean **conditional on fixation** is a different quantity.",
      "idea": "Integrate $dp/[p(1-p)]=s\\,dt$ between the two endpoints. This supplies the deterministic source of the logarithm. It cannot by itself describe the stochastic early establishment and final loss of the old allele. Conditioning on success favors lineages with unusually rapid early growth; the correction depends on model and parameter regime.\n\nFor the finite chain, let Q be the transient transition matrix, u its fixation probabilities and g the expected absorption time multiplied by the event of fixation. First-step conditioning gives $(I-Q)g=u$. The desired conditional mean is $g_i/u_i$. The unconditioned absorption mean solves $(I-Q)\\tau=\\mathbf1$.",
      "caption": "Compare the exact finite-chain conditional mean from one copy, the leading-log approximation and the exact deterministic endpoint passage. A second panel shows conditional fixation time and unconditional time to either endpoint across all initial counts.",
      "scope": "The chain uses 2N gene copies and the multiplicative selection model of 6.3. The displayed small populations deliberately expose approximation error; agreement is not forced. A large scaled advantage and weak per-generation selection are needed for sweep asymptotics. Desai–Fisher’s distinct birth–death analysis warns about establishment corrections; its coefficients are not substituted into this Wright–Fisher chain.",
      "refs": [
        "Felsenstein, Theoretical Evolutionary Genetics (December 2019), VII.7, pp.314–330, especially Eqs.(VII-63)–(VII-97): https://felsenst.github.io/pgbook/pgbook.pdf",
        "Desai & Fisher (2007), Beneficial Mutation–Selection Balance and the Effect of Linkage on Positive Selection, pp.1759–1761 and1768–1769: https://www.desai-lab.com/publications/PDFs/desaifisher07.pdf"
      ],
      "links": {
        "teaching": "https://felsenst.github.io/pgbook/pgbook.pdf",
        "primary": "https://www.desai-lab.com/publications/PDFs/desaifisher07.pdf"
      },
      "tags": [
        "selection",
        "genetic drift"
      ],
      "viz": V.time
    },
    {
      "num": "6.8",
      "kind": "Theorem",
      "name": "Origin–fixation rate of adaptive substitution",
      "deps": [
        "popgen-6.2",
        "popgen-3.8"
      ],
      "statement": "If new beneficial mutations arise as rare independent origins at rate $2N\\mu$, and each has fixation probability u, the **origin–fixation model** has successful-origin rate\n$$K=2N\\mu\\,u.$$\nFor a unique new copy, weak positive selection and sufficiently large $N_es$, $u\\approx2s$, giving $K\\approx4N\\mu s$. Under independent Poisson thinning, the waiting time W to a successful origin satisfies\n$$\\Pr(W\\le t)=1-e^{-Kt}.$$\nThis is a waiting-to-origin law; completion of fixation includes a subsequent sweep.",
      "idea": "The neutral substitution prerequisite multiplies mutation supply by chance of eventual fixation. Use the same reasoning with a selected fixation probability. Poisson thinning keeps each origin independently with probability u. The no-success probability over an interval is therefore $e^{-Kt}$.\n\nA succession of isolated sweeps requires a small chance of another successful origin during a sweep. The diagnostic $KT_{\\rm sweep}$ exposes a breakdown of this assumption. With linkage and competing origins, fixation events no longer occur independently and a simple supply-times-probability formula does not describe the entire adaptive dynamics.",
      "caption": "Compare the full diffusion origin–fixation rate with 4Nμs over reference sizes. Inspect exponential waiting probability, the mean waiting time and an overlap diagnostic at the selected parameters.",
      "scope": "Reference census and effective size are set equal for the example. A continuous size parameter belongs to the analytical diffusion family; no fractional population is sampled. This assumes weak per-generation effects and independent rare origins at the focal target. No saturation cap is imposed and a large overlap diagnostic is not represented as validation of independent sweeps.",
      "refs": [
        "Felsenstein, Theoretical Evolutionary Genetics (December 2019), VII.7, pp.314–330, especially Eqs.(VII-63)–(VII-97): https://felsenst.github.io/pgbook/pgbook.pdf",
        "Ohta (1993), §3 Eq.(1), supply times fixation probability: DOI 10.1266/jjg.68.529",
        "Desai & Fisher (2007), Beneficial Mutation–Selection Balance and the Effect of Linkage on Positive Selection, pp.1759–1761 and1768–1769: https://www.desai-lab.com/publications/PDFs/desaifisher07.pdf"
      ],
      "links": {
        "primary": "https://www.jstage.jst.go.jp/article/jjg/68/6/68_6_529/_article",
        "linkage": "https://www.desai-lab.com/publications/PDFs/desaifisher07.pdf"
      },
      "tags": [
        "selection",
        "genetic drift"
      ],
      "viz": V.origin
    },
    {
      "num": "6.9",
      "kind": "Concept",
      "name": "Distribution of fitness effects",
      "deps": [
        "popgen-6.4"
      ],
      "statement": "A **distribution of fitness effects** assigns probabilities to the selection effects of new mutations in a specified environment and background. It may contain harmful, beneficial and effectively neutral effects; the category boundaries depend on the strength of drift.\n\nFor a finite mixture with weights $w_j$ and fixation probabilities $u_j$, the distribution among fixed substitutions is\n$$\\widetilde w_j=\\frac{w_ju_j}{\\sum_\\ell w_\\ell u_\\ell}.$$\nThus effects observed among substitutions need not represent effects among new mutations.",
      "idea": "Think of drawing an effect class first, then retaining a mutation with that class’s fixation probability. Conditional probability gives the normalized fixed weights. Beneficial effects can be rare among new mutations while disproportionately represented among fixed substitutions. The normalization matters: an unnormalized contribution to the substitution rate is not itself the fraction of substitutions.\n\nChanging effective size changes the weighting and which effects are close to neutral. It does not change the underlying new-mutation distribution unless the biological model also changes that distribution.",
      "caption": "Compare two normalized bar charts on seven explicit effect classes. Change population size, effect scale, and neutral/beneficial fractions. Read the mean effects and the new-mutation mass inside a stated scaled-neutrality band.",
      "scope": "Chosen seven-point distributions, with residual harmful weight divided among three classes. No taxon, sequencing data, fitted gamma distribution or inference method is claimed. The band |4Nₑs|≤1 is conventional and does not erase the sign of a selected effect. Diffusion fixation weights retain the weak-selection approximation and the environment is held fixed.",
      "refs": [
        "Felsenstein, Theoretical Evolutionary Genetics (December 2019), VII.7, pp.314–330, especially Eqs.(VII-63)–(VII-97): https://felsenst.github.io/pgbook/pgbook.pdf",
        "Ohta (1993), §3 and conceptual classification Fig.2, pp.531–533: DOI 10.1266/jjg.68.529",
        "Desai & Fisher (2007), Beneficial Mutation–Selection Balance and the Effect of Linkage on Positive Selection, pp.1759–1761 and1768–1769: https://www.desai-lab.com/publications/PDFs/desaifisher07.pdf"
      ],
      "links": {
        "primary": "https://www.jstage.jst.go.jp/article/jjg/68/6/68_6_529/_article",
        "linkage": "https://www.desai-lab.com/publications/PDFs/desaifisher07.pdf"
      },
      "tags": [
        "selection",
        "genetic drift"
      ],
      "viz": V.dfe
    },
    {
      "num": "6.10",
      "kind": "Model",
      "name": "Clonal interference",
      "deps": [
        "popgen-6.8"
      ],
      "statement": "In an asexual population, beneficial mutations on mutually exclusive genetic backgrounds compete. Without recombination or a second mutation creating a combined genotype, A-only and B-only lineages cannot both reach fixation. This competition is **clonal interference**.\n\nThe demonstration tracks four genotypes $0,A,B,AB$ with relative fitnesses $1,e^a,e^b,e^{a+b}$. It separates competition between single-mutant clones from the creation of a double mutant. Raising mutation supply can invalidate successive isolated sweeps, but does not imply a universal hard ceiling on adaptation rate.",
      "idea": "Selection reweights current genotype counts, then the population is sampled multinomially back to N individuals. At zero recombination, a planted A-only clone and a later B-only clone remain mutually exclusive. A stronger clone may displace the weaker one, but drift can also lose a planted clone.\n\nThe optional comparison allows standard random-mating recombination before sampling. With selected frequencies $p_0,p_A,p_B,p_{AB}$, set $D=p_0p_{AB}-p_Ap_B$; recombination subtracts rD from the two coupling classes and adds it to the two repulsion classes. This can create AB when D is negative. It explicitly changes the asexual assumption.",
      "caption": "Inspect a stacked composition plot and the actual integer genotype counts. Change the two advantages, delay between planted clones, census, recombination and seed. With recombination off no double mutants arise.",
      "scope": "A finite two-clone experiment. The initial A count is the smaller of 20 and the integer part of N/10; B requests the same count, limited by remaining original-type individuals. These planted copies replace the original type. No recurrent mutation, adaptation-speed estimator or fitted mutation-supply curve is present. Failure to insert B when the original type is already absent is reported. Linear joins connect sampled generations. The distinct primary source’s multiple-mutation theory is motivation, not a claim that this four-type model reproduces that theory.",
      "refs": [
        "Desai & Fisher (2007), Beneficial Mutation–Selection Balance and the Effect of Linkage on Positive Selection, pp.1759–1761 and1768–1769: https://www.desai-lab.com/publications/PDFs/desaifisher07.pdf",
        "Felsenstein (2019), VIII, Fisher–Muller discussion p.397: https://felsenst.github.io/pgbook/pgbook.pdf"
      ],
      "links": {
        "primary": "https://www.desai-lab.com/publications/PDFs/desaifisher07.pdf",
        "teaching": "https://felsenst.github.io/pgbook/pgbook.pdf"
      },
      "tags": [
        "selection",
        "genetic drift"
      ],
      "viz": V.clones
    },
    {
      "num": "6.11",
      "kind": "Phenomenon",
      "name": "Muller’s ratchet",
      "deps": [
        "popgen-6.4",
        "popgen-5.1"
      ],
      "statement": "With forward deleterious mutation but no recombination or back mutation, a finite asexual population can lose its least-loaded surviving class. Once that class is absent, selection cannot recreate it: the minimum load moves upward in a **Muller’s ratchet** click.\n\nFor the particular infinite-population life cycle with multiplicative fitness $(1-s)^k$ followed by Poisson(U) mutation, a Poisson load distribution has mean update\n$$m_{t+1}=(1-s)m_t+U.$$\nWhen $s>0$ its equilibrium mean is $U/s$ and the mutation-free fraction is $e^{-U/s}$.",
      "idea": "Selection exponentially tilts a Poisson distribution, multiplying its mean by 1−s. Adding independent Poisson(U) mutation adds U to that mean. This proves the stated equilibrium for this life cycle. The finite reference size $N e^{-U/s}$ indicates why a small least-loaded class is vulnerable, without deriving a click rate.\n\nIn each finite generation, offspring choose parents with fitness-proportional probabilities and acquire nonnegative mutation increments. Therefore every offspring’s load is at least the old population minimum. This monotonicity is the ratchet mechanism. The population mean can fall under selection even while its minimum cannot decrease.",
      "caption": "Track a seeded population from load zero. Compare minimum and mean loads over time, and inspect the load histogram and least-class size at the selected generation. Zero mutation stops the ratchet; zero selection removes the finite equilibrium reference.",
      "scope": "Haploid, fixed census, no back mutation or recombination, equal deleterious effects and independent Poisson mutation per offspring. Every generation performs fitness-weighted parental sampling. The infinite-population equilibrium is a reference rather than an imposed finite stationary distribution. Loss of the least class need not equal fixation of any particular molecular mutation; no loci or extinction dynamics are tracked.",
      "refs": [
        "Felsenstein (2019), VIII, Muller’s Ratchet and Fisher–Muller discussion p.397: https://felsenst.github.io/pgbook/pgbook.pdf",
        "Felsenstein, Theoretical Evolutionary Genetics (December 2019), VII.7, pp.314–330, especially Eqs.(VII-63)–(VII-97): https://felsenst.github.io/pgbook/pgbook.pdf"
      ],
      "links": {
        "teaching": "https://felsenst.github.io/pgbook/pgbook.pdf"
      },
      "tags": [
        "selection",
        "genetic drift"
      ],
      "viz": V.ratchet
    },
    {
      "num": "6.12",
      "kind": "Phenomenon",
      "name": "Evolutionary rescue",
      "deps": [
        "popgen-6.2",
        "mathbio-11.2"
      ],
      "statement": "**Evolutionary rescue** occurs when adaptation prevents extinction after environmental deterioration. A relative advantage alone is insufficient: an escaping lineage must grow in absolute number.\n\nIn an explicit early-phase model, an initial resident census N₀ declines as $N_0e^{-dt}$ and mutant offspring are Poisson with mean $1+g$. Let $\\rho$ be a single mutant’s eventual branching survival. Independent new origins occur at rate $\\mu N_0e^{-dt}$, giving successful-origin hazard\n$$H(t)=\\frac{\\mu N_0\\rho}{d}(1-e^{-dt}).$$\nWith k independent initial mutant copies, eventual rescue probability in this model is\n$$1-(1-\\rho)^k e^{-H(\\infty)}.$$",
      "idea": "Thin the new-origin clock by establishment probability and integrate its declining intensity. Initial-lineage failure has probability $(1-\\rho)^k$, independently of no successful new origin. Their product gives the no-rescue probability. This independently specified hazard approximation exposes its assumptions instead of treating a relative selection coefficient as an absolute growth rate.\n\nFor the count panel only, let Cₜ be the mean mutant count conditional on survival of at least one initial lineage. Write q=1−ρ and m=1+g. Branching generating functions give\n$$C_t=\\frac{km^t}{1-q^k}(1-q^{k+t}).$$\nThe subtraction follows from $\\mathbb E[Z_tq^{Z_t}]=kq^k(mq)^t$. It accounts for the unusually rapid early growth of successful lineages. The resident-decline law is part of the declared model, independent of the mutant branching calculation.",
      "caption": "Compare conditional resident, mutant and total counts with eventual rescue probability across initial sizes. Separate standing-lineage rescue from new-origin rescue by the selected time. Zero initial copies or zero absolute growth leaves the conditional count curve undefined.",
      "scope": "N₀ counts initial residents; k mutant founders are additional. Independent early lineages, deterministic continuously declining residents, a thinned Poisson mutation clock and no carrying-capacity feedback, migration or clonal interference. The conditional mean is exact for the chosen discrete branching law at integer generations. Its conditioning is standing-lineage survival only, while the probability panel includes new origins. This is not a reproduction of every Orr–Unckless approximation or an empirical conservation/clinical forecast.",
      "refs": [
        "Orr & Unckless (2014), The Population Genetics of Evolutionary Rescue, model and new/standing-rescue calculation pp.1–3, conditioning discussion pp.3–4: https://journals.plos.org/plosgenetics/article?id=10.1371/journal.pgen.1004551",
        "Felsenstein, Theoretical Evolutionary Genetics (December 2019), VII.7, pp.314–330, especially Eqs.(VII-63)–(VII-97): https://felsenst.github.io/pgbook/pgbook.pdf"
      ],
      "links": {
        "primary": "https://journals.plos.org/plosgenetics/article?id=10.1371/journal.pgen.1004551",
        "teaching": "https://felsenst.github.io/pgbook/pgbook.pdf"
      },
      "tags": [
        "selection",
        "genetic drift"
      ],
      "viz": V.rescue
    },
    {
      "num": "6.13",
      "kind": "Paper",
      "name": "A Mathematical Theory of Natural and Artificial Selection, V",
      "deps": [
        "stoch-3.9",
        "popgen-4.2"
      ],
      "paper": {
        "authors": "J. B. S. Haldane",
        "year": 1927,
        "title": "A Mathematical Theory of Natural and Artificial Selection, Part V: Selection and Mutation",
        "venue": "Proceedings of the Cambridge Philosophical Society 23 (7): 838–844",
        "doi": "10.1017/S0305004100015644"
      },
      "introduces": [
        "popgen-6.2"
      ],
      "statement": "Haldane’s 1927 paper is a historical source of the small-advantage survival argument underlying the approximately 2s fixation rule. The modern Poisson reconstruction shown here uses\n$$F(q)=\\exp[(1+s)(q-1)]$$\nand selects the **least** fixed point by iteration $q_0=0$, $q_{t+1}=F(q_t)$. At positive advantage a second fixed point q=1 still exists; choosing that root would wrongly assign certain extinction to a supercritical Poisson lineage. The positive survival root has leading behavior ρ≈2s.",
      "idea": "Condition on the number of offspring of the original copy and multiply independent extinction probabilities for their descendant lines. Averaging over Poisson offspring yields F. Iteration from zero sums extinction by finite generations and converges to its eventual value. The fixed-point graph and the diagonal make the choice of root visible.\n\nThe precise bibliography and introductory publisher extract were checked. The original body and equations were behind an access boundary and were not read. This reconstruction follows the independently read Felsenstein treatment, rather than claiming to reproduce Haldane’s notation, complete argument or historical numerical results.",
      "caption": "Iterate the offspring generating function from zero and compare finite-generation extinction with the eventual fixed point. Change advantage and iteration count to see slow convergence near the critical case.",
      "scope": "Modern independent Poisson-lineage reconstruction; not a facsimile or a numerical transcription of the 1927 article. The original source remains flagged for verification. The earlier stopped Haldane 1957 source is a different work and remains uninspected; no collected-papers copy was used to recover either stopped original.",
      "refs": [
        "Felsenstein, Theoretical Evolutionary Genetics (December 2019), VII.7, pp.314–330, especially Eqs.(VII-63)–(VII-97): https://felsenst.github.io/pgbook/pgbook.pdf"
      ],
      "links": {
        "publisher": "https://www.cambridge.org/core/journals/mathematical-proceedings-of-the-cambridge-philosophical-society/article/abs/mathematical-theory-of-natural-and-artificial-selection-part-v-selection-and-mutation/9B6F4FE68136A70E06133E2E389EFA5B",
        "teaching": "https://felsenst.github.io/pgbook/pgbook.pdf"
      },
      "tags": [
        "selection",
        "genetic drift"
      ],
      "viz": V.paper,
      "verify": true
    }
  ]
};
