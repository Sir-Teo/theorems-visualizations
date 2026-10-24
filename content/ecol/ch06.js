// Ecology — Wave6; declared models and scoped source evidence.
import * as V from './ch06.viz.js';
export default {
  "collection": "ecol",
  "chapter": 6,
  "title": "Food webs and community stability",
  "summary": "Food-web structure, local equilibrium stability and variability of ecosystem function answer different questions. Declared competition and trophic modules expose predator-mediated coexistence, cascades, invasion thresholds and context-dependent weak-link effects. Finite random matrices, interval niche generators and exact covariance constructions make the assumptions and limits of complexity–stability claims inspectable.",
  "items": [
    {
      "num": "6.1",
      "kind": "Concept",
      "name": "Food webs and trophic levels",
      "deps": [],
      "refs": [
        "Williams, Anandanadesan & Purves (2010), The Probabilistic Niche Model Reveals the Niche Structure and Role of Body Size in a Complex Food Web, PLoS ONE5:e12092, selected Introduction and Distributions of parameters; PDFpp.3,5 inspected",
        "Stephen Stearns, Open Yale Courses EEB122, Lecture28 Ecological Communities, selected transcript Chapter3 (04:42–23:08), trophic cascades and predator-mediated coexistence",
        "Direct solution of the declared dietary recursion"
      ],
      "viz": V.trophic,
      "statement": "A **food web** records feeding relationships; here an arrow runs from a resource to its consumer. If Dᵢⱼ is the fraction of consumer i’s diet supplied by j, diet-weighted trophic levels satisfy\n$$T_i=1+\\sum_jD_{ij}T_j,$$\nwith basal level 1. These levels need not be integers or equal longest-path lengths.\n\nIn the displayed recycling module, the middle consumer eats the basal resource with fraction 1−ρ and the top consumer with fraction ρ; the top eats the middle. For ρ<1,\n$$T_0=1,\\quad T_1={2\\over1-\\rho},$$\n$$T_2=1+{2\\over1-\\rho}.$$\nAt ρ=1 the consumer cycle has no finite trophic-level solution.",
      "idea": "Substitute the two consumer equations into each other. One circuit adds two units of trophic level while multiplying the returning contribution by ρ. Summing the resulting geometric series gives 2/(1−ρ). At a closed cycle the equations would demand that a level equal itself plus two, which is impossible.\n\nThe basal node still has level 1 at that limit. The failure concerns the closed consumer component, rather than a numerical need to cap every node’s level. Binary links, diet weights, energy fluxes and Jacobian entries are different descriptions of a web.",
      "caption": "Change the recycling fraction and compare the feeding arrows with the computed trophic levels. A fully closed consumer cycle is explicitly undefined; nearly closed cycles retain large finite levels.",
      "scope": "The schematic describes diet-weighted position, not a dynamically feasible ecosystem or an energy-conserving recycling machine. Diet fractions are declared and sum to one for consumers. The basal resource is not required to be connected to a fully closed consumer component. No empirical food-web data are used.",
      "links": {
        "niche": "https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0012092",
        "lecture": "https://oyc.yale.edu/ecology-and-evolutionary-biology/eeb-122/lecture-28"
      },
      "tags": [
        "ecology",
        "networks",
        "stability"
      ]
    },
    {
      "num": "6.2",
      "kind": "Concept",
      "name": "Keystone species (Paine)",
      "deps": [
        "ecol-6.1"
      ],
      "refs": [
        "Stephen Stearns, Open Yale Courses EEB122, Lecture28 Ecological Communities, selected transcript Chapter3 (04:42–23:08), trophic cascades and predator-mediated coexistence",
        "Direct hierarchical-colonization and equilibrium calculation"
      ],
      "viz": V.keystone,
      "statement": "A **keystone species** has a large community effect relative to its abundance. The designation depends on the community and the effect being measured; it is not simply a synonym for the most abundant or most connected species.\n\nPredation can maintain inferior competitors when it disproportionately removes a superior competitor. Our separate space-competition model uses occupied fractions xᵢ and external predator pressure P:\n$$\\dot x_i=x_i\\left[c_i\\left(1-\\sum_{j\\le i}x_j\\right)\\right.$$\n$$\\left.{}-\\sum_{j<i}c_jx_j-m_i-p_iP\\right].$$\nCompetitively superior species displace inferior ones; the latter have higher colonization rates.",
      "idea": "At an equilibrium, solve species in competitive order. A positive species has zero per-capita growth; an absent species can remain absent only when its invasion rate is nonpositive. This produces explicit branches without converting a small simulated count into extinction.\n\nHere c=(1,1.5,9), mᵢ=0.1 and p=(0.75,0.02,0.02). Strong pressure on the superior competitor can release space for the others. The total occupied fraction stays at most one: displacement terms cancel in the total balance, while mortality frees space.",
      "caption": "Vary external predator pressure. Compare the equilibrium coverages with the continuous response of each competitor, including branches where a species cannot invade. The model illustrates a mechanism of predator-mediated coexistence.",
      "scope": "A declared three-competitor construction, motivated by the secondary lecture’s account of Paine’s mechanism. It is not a fitted intertidal model, a predator-biomass index or a reproduction of the original species counts. Competitor labels are functional roles rather than identified historical taxa.",
      "links": {
        "lecture": "https://oyc.yale.edu/ecology-and-evolutionary-biology/eeb-122/lecture-28"
      },
      "tags": [
        "ecology",
        "networks",
        "stability"
      ]
    },
    {
      "num": "6.3",
      "kind": "Phenomenon",
      "name": "Trophic cascades",
      "deps": [
        "ecol-6.1"
      ],
      "refs": [
        "Stephen Stearns, Open Yale Courses EEB122, Lecture28 Ecological Communities, selected transcript Chapter3 (04:42–23:08), trophic cascades and predator-mediated coexistence",
        "Direct equilibrium and invasion calculation"
      ],
      "viz": V.cascade,
      "statement": "A **trophic cascade** is an indirect effect that propagates across more than one feeding link. In a three-level density-mediated example, more top consumers can suppress herbivores and thereby release the basal resource.\n\nWith top density P held externally, consider\n$$\\dot R=R(1-R/K)-aRH,$$\n$$\\dot H=H(eaR-m-cP).$$\nWhere herbivores persist, the equilibrium is\n$$R_*={m+cP\\over ea},$$\n$$H_*={1-R_*/K\\over a}.$$\nIf the candidate R* reaches K, the ecological branch instead has H*=0 and R*=K.",
      "idea": "The herbivore’s zero-growth condition fixes the resource density needed to balance its mortality. Increasing imposed predation raises that requirement. The resource equation then determines a smaller herbivore density. Once the herbivore cannot invade a resource-only system, the extinction branch replaces the negative algebraic candidate.\n\nThis is one concrete mechanism for an indirect positive effect. Cascades can also involve behavior, habitat shifts and other pathways, so the sign pattern of this small model is not a theorem about all food webs.",
      "caption": "Change top-consumer density and resource carrying capacity. The response panel tracks the resource and herbivore branches, including herbivore loss, while the compartment panel shows the selected equilibrium.",
      "scope": "Top density is an imposed input, not an endogenously simulated population. Coefficients a=0.6,e=0.6,m=0.25,c=0.5 are illustrative. The model does not reproduce a wolf, otter or lake experiment, and it omits omnivory, behavior, spatial effects and saturating feeding.",
      "links": {
        "lecture": "https://oyc.yale.edu/ecology-and-evolutionary-biology/eeb-122/lecture-28"
      },
      "tags": [
        "ecology",
        "networks",
        "stability"
      ]
    },
    {
      "num": "6.4",
      "kind": "Model",
      "name": "Exploitation ecosystems and the green-world hypothesis",
      "deps": [
        "ecol-6.3",
        "mathbio-3.9"
      ],
      "refs": [
        "Stephen Stearns, Open Yale Courses EEB122, Lecture28 Ecological Communities, selected transcript Chapter3 (04:42–23:08), trophic cascades and predator-mediated coexistence",
        "Written MATHBIO3.9; direct type-I chain derivation"
      ],
      "viz": V.exploitation,
      "statement": "Exploitation-ecosystem reasoning asks how productivity and the number of trophic levels jointly affect equilibrium densities. A simple declared type-I chain is\n$$\\dot R=R(1-R/K)-aRH,$$\n$$\\dot H=H(eaR-m-cT),$$\n$$\\dot T=T(\\eta cH-d).$$\nIn the two-level coexistence branch, R*=m/(ea) is pinned while H* responds to K. In the three-level branch,\n$$H_*={d\\over\\eta c},$$\n$$R_*=K(1-aH_*),$$\n$$T_*={eaR_*-m\\over c}.$$\nEach branch is used only after its invading consumer has positive growth.",
      "idea": "Set the per-capita growth rates of present consumers to zero, then use the remaining resource balance. Below a consumer’s invasion threshold, retain the lower-level equilibrium rather than accepting a negative density. This gives the continuous sequence of extinction and coexistence branches.\n\nWith one level the resource tracks K. With two, herbivores can hold the resource at their zero-growth requirement. With three, the top consumer pins herbivores and the resource again rises with K. These parity effects help explain green-world hypotheses; they depend on the functional responses and self-regulation assumed.",
      "caption": "Choose the maximum chain length and increase carrying capacity. Compare selected equilibrium densities with all branches across K, and read the two consumer-invasion thresholds.",
      "scope": "K is the chosen productivity proxy. Fixed illustrative coefficients are a=e=0.6,m=0.25,c=0.5,η=0.7,d=0.2. This type-I equilibrium calculation is distinct from the saturating Rosenzweig–MacArthur prerequisite; enrichment in that model can alter stability and produce cycles. No universal empirical biomass staircase is claimed.",
      "links": {
        "lecture": "https://oyc.yale.edu/ecology-and-evolutionary-biology/eeb-122/lecture-28"
      },
      "tags": [
        "ecology",
        "networks",
        "stability"
      ]
    },
    {
      "num": "6.5",
      "kind": "Concept",
      "name": "Community matrix and local stability",
      "deps": [
        "mathbio-3.21"
      ],
      "refs": [
        "Dougoud, Vinckenbosch, Rohr, Bersier & Mazza (2018), The feasibility of equilibria in large ecosystems: A primary but neglected concept in the complexity-stability debate, PLoS Computational Biology14:e1005988, selected Introduction",
        "Written MATHBIO3.21; direct GLV differentiation and two-species calculation"
      ],
      "viz": V.community,
      "statement": "The **community matrix** is the Jacobian at a specified ecological equilibrium. For generalized Lotka–Volterra dynamics\n$$\\dot x_i=x_i\\left(r_i+\\sum_jA_{ij}x_j\\right),$$\nan interior equilibrium x* has\n$$J=\\operatorname{diag}(x_*)A.$$\nAll eigenvalues with negative real parts imply local asymptotic stability; a positive real part implies instability. Eigenvalues on the imaginary axis require further analysis.\n\nAn algebraic equilibrium is **feasible** only when its abundances are positive. A stable matrix by itself does not establish that condition.",
      "idea": "Differentiate the GLV equations. At an interior equilibrium, the per-capita growth terms vanish, leaving the stated Jacobian. The linearized perturbation equation then determines local behavior when no eigenvalue has zero real part.\n\nFor the displayed competition system r=(1,1), symmetric interactions b=a give x*=y*=1/(1+a) and eigenvalues −1 and (a−1)/(a+1). At a=1 there is a continuum x+y=1. The asymmetric choice b=0.5 also exposes infeasible candidates and an inconsistent interior system at a=2. The positive trajectory remains meaningful even when an interior candidate is not.",
      "caption": "Change symmetric or asymmetric competition and inspect the actual positive trajectory, feasible equilibrium marker and local spectrum. Move the time marker without treating an infeasible algebraic candidate as an ecological rest state.",
      "scope": "Local equilibrium stability is distinct from global attraction, persistence, transient amplification and stability of total production. The symmetric neutral case is not declared asymptotically stable from a zero eigenvalue. The fixed initial state and coefficients are teaching choices; no observed community has been fitted.",
      "links": {
        "feasibility": "https://journals.plos.org/ploscompbiol/article?id=10.1371/journal.pcbi.1005988"
      },
      "tags": [
        "ecology",
        "networks",
        "stability"
      ]
    },
    {
      "num": "6.6",
      "kind": "Theorem",
      "name": "May’s stability–complexity criterion",
      "deps": [
        "ecol-6.5"
      ],
      "refs": [
        "Dougoud, Vinckenbosch, Rohr, Bersier & Mazza (2018), The feasibility of equilibria in large ecosystems: A primary but neglected concept in the complexity-stability debate, PLoS Computational Biology14:e1005988, selected Introduction",
        "Written MATHBIO3.21; declared Gaussian-mixture ensemble and direct finite eigenvalues"
      ],
      "viz": V.may,
      "statement": "In May’s random-community setting, self-regulation gives diagonal entries −d, while independent off-diagonal entries are nonzero with probability C and then have mean zero and variance σ². Their unconditional variance is Cσ².\n\nUnder the usual dense random-matrix assumptions, fixed C>0 and suitable moment/edge control, the large-S spectrum has nominal radius\n$$r=\\sigma\\sqrt{SC}$$\nabout −d. With separation from the transition, the asymptotic stability guide is\n$$\\sigma\\sqrt{SC}<d.$$\nThis is not an exact finite-matrix test. For a particular draw, inspect its actual rightmost eigenvalue.",
      "idea": "Independent centered interaction fluctuations spread the spectrum on a scale given by standard deviation times √S; the negative diagonal shifts it left. A bulk disk calculation motivates the criterion, while excluding outliers also needs spectral-edge control. The diagonal must dominate the rightmost edge for local linear stability.\n\nThe Gaussian-mixture ensemble offered here has explicit finite moments and is reproducible by seed. Its finite spectrum can differ substantially from the nominal disk, especially at low richness or sparse connectance. The presumed equilibrium’s feasibility is a separate question, as the scoped modern source emphasizes.",
      "caption": "Vary richness, inclusion probability, interaction standard deviation and self-regulation. Compare the actual matrix and computed eigenvalues with the nominal asymptotic disk; the classification follows the finite spectrum.",
      "scope": "Independent mixed-sign entries are not paired predator–prey interactions. C is an off-diagonal inclusion probability; the realized fraction is also reported. The C=0 and σ=0 controls give the exact diagonal special case. No finite guarantee, global persistence, feasible equilibrium or ecological population probability follows from the disk alone. The original May body was not read.",
      "links": {
        "feasibility": "https://journals.plos.org/ploscompbiol/article?id=10.1371/journal.pcbi.1005988"
      },
      "tags": [
        "ecology",
        "networks",
        "stability"
      ]
    },
    {
      "num": "6.7",
      "kind": "Paradox",
      "name": "Diversity–stability paradox",
      "deps": [
        "ecol-6.6"
      ],
      "refs": [
        "Dougoud, Vinckenbosch, Rohr, Bersier & Mazza (2018), The feasibility of equilibria in large ecosystems: A primary but neglected concept in the complexity-stability debate, PLoS Computational Biology14:e1005988, selected Introduction",
        "Bouvier et al. (2012), Contrasted Effects of Diversity and Immigration on Ecological Insurance in Marine Bacterioplankton Communities, PLoS ONE7:e37620, selected Introduction, Results and Discussion",
        "Direct covariance identity; independent finite-matrix calculation"
      ],
      "viz": V.paradox,
      "statement": "The **diversity–stability paradox** depends partly on what stability means. Increasing richness in an unstructured random community can undermine local equilibrium stability. At the same time, summing incompletely correlated species responses can reduce the relative variability of aggregate production.\n\nFor equal individual means and coefficients of variation v, with common pairwise response correlation ρ,\n$$\\mathrm{CV}_{\\rm total}=v\\sqrt{{1+(S-1)\\rho\\over S}}.$$\nFor independent responses this decreases as S⁻¹ᐟ²; for perfectly synchronous responses it stays v. Neither statement alone determines a real ecosystem’s persistence.",
      "idea": "Local stability concerns the growth of small state perturbations around an equilibrium. Aggregate variability concerns the covariance of an output over changing conditions. They are different mathematical objects and can respond differently to richness.\n\nThe variance of a sum equals the sum of individual variances plus all pairwise covariances. Applying that identity yields the displayed curve. The other panel computes actual finite random-matrix spectra. Their juxtaposition is a comparison of questions, not a claim that the production series was generated by an unstable matrix or measured in a grassland experiment.",
      "caption": "Compare a finite seeded matrix family with a separate exact aggregation calculation. Change interaction strength and response correlation, and inspect how the two meanings of stability respond to richness.",
      "scope": "These are explicit theoretical constructions, not paired empirical observations. Real diversity changes can also change means, interaction strengths, composition and environmental sensitivities. A decreasing aggregate CV does not establish local equilibrium stability, and a positive local eigenvalue does not by itself predict an observed ecosystem CV.",
      "links": {
        "feasibility": "https://journals.plos.org/ploscompbiol/article?id=10.1371/journal.pcbi.1005988",
        "insurance": "https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0037620"
      },
      "tags": [
        "ecology",
        "networks",
        "stability"
      ]
    },
    {
      "num": "6.8",
      "kind": "Phenomenon",
      "name": "Weak interactions stabilize food webs",
      "deps": [
        "ecol-6.6"
      ],
      "refs": [
        "Caskenette & McCann (2017), Biomass Reallocation between Juveniles and Adults Mediates Food Web Stability by Distributing Energy Away from Strong Interactions, PLoS ONE12:e0170725, selected Abstract/Introduction",
        "Dougoud, Vinckenbosch, Rohr, Bersier & Mazza (2018), The feasibility of equilibria in large ecosystems: A primary but neglected concept in the complexity-stability debate, PLoS Computational Biology14:e1005988, selected Introduction",
        "Written MATHBIO3.9; direct saturating-predation linearization"
      ],
      "viz": V.weak,
      "statement": "Weakening selected interactions can stabilize particular food-web modules by reducing destabilizing feedback. The effect depends on topology, signs, functional responses and what is held fixed; many weak links alone are not a universal certificate.\n\nOur module uses saturating predation:\n$$\\dot R=R(1-R/K)-{aRH\\over1+ahR},$$\n$$\\dot H=H\\left({eaR\\over1+ahR}-m\\right).$$\nWith K=5,h=1,e=0.5,m=0.2, all offered attack rates have a positive equilibrium. Its trace changes sign near a=7/15: weaker attack can damp the local feedback while also changing equilibrium densities.",
      "idea": "The consumer’s zero-growth condition gives R*=m/[a(e−mh)], and resource balance gives H*=(1−R*/K)(1+ahR*)/a. Differentiating yields a positive determinant. The trace is negative below the stated attack boundary and positive above it, giving the local stability change.\n\nThe finite trajectory makes the corresponding damping or oscillation visible without replacing the Jacobian argument. The scoped stage-structure paper motivates context-dependent feedback weakening, but its stage model is not reproduced. Holding a mean strength fixed while changing a distribution can change variance, so it is a different experiment.",
      "caption": "Reduce attack and compare the same module’s phase trajectory and population traces. Read its local trace/determinant and finite late-window ranges, with all other coefficients fixed.",
      "scope": "A dimensionless two-species food-web module, not a test of every many-species network. Attack changes both feedback and the equilibrium. Numerical traces have a finite horizon and do not establish cycle uniqueness. The source’s stage-structured mechanism and this declared saturating-predation illustration are distinct models.",
      "links": {
        "weak": "https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0170725",
        "feasibility": "https://journals.plos.org/ploscompbiol/article?id=10.1371/journal.pcbi.1005988"
      },
      "tags": [
        "ecology",
        "networks",
        "stability"
      ]
    },
    {
      "num": "6.9",
      "kind": "Model",
      "name": "Niche model of food-web structure",
      "deps": [
        "ecol-6.1"
      ],
      "refs": [
        "Williams, Anandanadesan & Purves (2010), The Probabilistic Niche Model Reveals the Niche Structure and Role of Body Size in a Complex Food Web, PLoS ONE5:e12092, selected Introduction and Distributions of parameters; PDFpp.3,5 inspected",
        "Direct beta-mean and interval construction"
      ],
      "viz": V.niche,
      "statement": "A **niche model** represents feeding through contiguous intervals on a one-dimensional trait axis. The generator here draws sorted niche positions nᵢ uniformly on [0,1], then\n$$r_i=n_iX_i,$$\n$$X_i\\sim\\operatorname{Beta}(1,\\beta),$$\n$$\\beta={1\\over2C}-1.$$\nThe interval center is uniform between rᵢ/2 and nᵢ. Consumer i eats species whose positions lie in its interval. The beta mean is 2C, but a finite draw’s realized connectance need not equal the input target C.",
      "idea": "A shared trait order plus contiguous diets imposes structure absent from an unconstrained random graph. The center constraint makes feeding broadly hierarchical without requiring every prey position to be strictly below its consumer; self-feeding and cycles can occur.\n\nThe selected 2010 paper discusses classical assumptions and contrasts them with a fitted probabilistic variant whose diets may contain gaps. Its fitted diet centers need not follow the classical uniform assumption, and niche position is not automatically body mass. The present generator illustrates structural assumptions; it does not perform that inverse fit or reproduce its empirical accuracy.",
      "caption": "Generate new webs, compare permitted feeding spans with their actual binary matrix, and read realized connectance, basal nodes and self-feeding links. Species are retained even if isolated; no pruning tunes the result.",
      "scope": "The original 2000 article was available only as a subscription preview and was not recovered elsewhere. The distinct 2010 primary paper supplies the scoped discussion and inspected diagram. This explicit Beta(1,β) generator retains all drawn nodes and intersects intervals with [0,1]; it makes no claim to replicate original code, cleaning conventions or empirical fit.",
      "links": {
        "niche": "https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0012092"
      },
      "tags": [
        "ecology",
        "networks",
        "stability"
      ]
    },
    {
      "num": "6.10",
      "kind": "Concept",
      "name": "Connectance and food-chain length",
      "deps": [
        "ecol-6.1"
      ],
      "refs": [
        "Williams, Anandanadesan & Purves (2010), The Probabilistic Niche Model Reveals the Niche Structure and Role of Body Size in a Complex Food Web, PLoS ONE5:e12092, selected Introduction and Distributions of parameters; PDFpp.3,5 inspected",
        "Direct graph counts, acyclic dynamic programming and dietary recursion"
      ],
      "viz": V.connectance,
      "statement": "**Connectance** needs a stated denominator. Here a directed web with S species and L feeding links uses\n$$C={L\\over S^2},$$\ncounting all potential directed pairs in the denominator even when a particular construction excludes self-feeding.\n\nConnectance does not determine food-chain length. A chain and a star can each have S−1 links, yet their longest basal-to-top paths contain S and 2 species respectively. Diet-weighted trophic levels answer another question and can be fractional.",
      "idea": "Count actual retained links, then compute paths using the acyclic resource order. For each consumer, its longest basal path is one plus the largest prey path; its diet-weighted level is one plus the average prey level under equal diet weights.\n\nThe random-cascade construction guarantees one earlier resource per consumer and adds optional earlier links. Additional shortcuts can lower diet-weighted levels even when longest paths remain long. Consequently neither richness nor a single density statistic specifies every trophic property of a web.",
      "caption": "Compare a chain, a star and a random acyclic cascade at the same richness. Inspect the feeding matrix, longest-chain marker and species-level diet-weighted positions; change optional-link density only in the random construction.",
      "scope": "Paths count species, including their basal and top endpoints. The construction is acyclic and basal-connected, so longest paths are finite; the lesson does not assign finite path lengths to arbitrary cycles. Optional-link probability differs from the measured L/S², and the denominator differs from a fraction restricted to allowable ordered pairs.",
      "links": {
        "niche": "https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0012092"
      },
      "tags": [
        "ecology",
        "networks",
        "stability"
      ]
    },
    {
      "num": "6.11",
      "kind": "Phenomenon",
      "name": "Intraguild predation and omnivory",
      "deps": [
        "ecol-6.1"
      ],
      "refs": [
        "Caskenette & McCann (2017), Biomass Reallocation between Juveniles and Adults Mediates Food Web Stability by Distributing Energy Away from Strong Interactions, PLoS ONE12:e0170725, selected Abstract/Introduction",
        "Stephen Stearns, Open Yale Courses EEB122, Lecture28 Ecological Communities, selected transcript Chapter3 (04:42–23:08), trophic cascades and predator-mediated coexistence",
        "Direct declared three-species model"
      ],
      "viz": V.omnivory,
      "statement": "**Intraguild predation** combines competition and predation: two consumers share a resource, and one also eats the other. **Omnivory** feeds across trophic positions.\n\nThe declared module is\n$$\\dot R=R(1-R/2)-RN-bRP,$$\n$$\\dot N=N(0.8R-0.3-0.7P),$$\n$$\\dot P=P(0.2bR+0.42N-0.3).$$\nWhen b>0, P both consumes N and competes with it for R. At b=0 the module is a chain. The added pathway can change coexistence and dynamics; its effect is not universally stabilizing.",
      "idea": "Follow both roles of the top consumer. Its direct removal of N tends to release R, while its own consumption of R can oppose that indirect effect. The balance depends on efficiencies, mortality, self-regulation and the offered attack coefficient.\n\nThe displayed equations make those assumptions explicit. Positive initial populations remain positive analytically because each derivative is the population times a finite per-capita rate. A finite numerical trace can illustrate changing trajectories, but cannot by itself prove persistence, exclusion or a global attractor.",
      "caption": "Add the top consumer’s basal-resource attack and compare all three population traces with a two-coordinate projection of the same trajectory. Move the selected-time marker and inspect actual finite densities.",
      "scope": "A dimensionless type-I GLV example with chosen coefficients and a fixed positive initial state. It is not fitted to an observed intraguild food web or copied from the stage-structure source. A small endpoint is not a declared extinction, and a closed-looking three-dimensional projection is not a planar periodic-orbit proof.",
      "links": {
        "weak": "https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0170725",
        "lecture": "https://oyc.yale.edu/ecology-and-evolutionary-biology/eeb-122/lecture-28"
      },
      "tags": [
        "ecology",
        "networks",
        "stability"
      ]
    },
    {
      "num": "6.12",
      "kind": "Phenomenon",
      "name": "Biodiversity and ecosystem function: the insurance effect",
      "deps": [
        "ecol-6.7"
      ],
      "refs": [
        "Bouvier et al. (2012), Contrasted Effects of Diversity and Immigration on Ecological Insurance in Marine Bacterioplankton Communities, PLoS ONE7:e37620, selected Introduction, Results and Discussion",
        "Direct covariance identity and positive orthogonal-response construction"
      ],
      "viz": V.insurance,
      "statement": "The **insurance effect** concerns buffering ecosystem function through differing species responses. For equal individual means μ and variances μ²v², with pairwise correlation ρ,\n$$\\operatorname{Var}\\!\\left(\\sum_iY_i\\right)$$\n$$=S\\mu^2v^2[1+(S-1)\\rho].$$\nThus the aggregate coefficient of variation is\n$$v\\sqrt{{1+(S-1)\\rho\\over S}}.$$\nThe covariance identity predicts buffering for incompletely synchronous responses, rather than guaranteeing that every diversity increase improves every ecological outcome.",
      "idea": "Expand the variance of the sum into S variance terms and S(S−1) ordered covariance terms. Dividing its standard deviation by the total mean Sμ gives the formula.\n\nHere each species has a positive synthetic periodic response consisting of a common cosine plus its own orthogonal cosine. Their amplitudes set v and ρ exactly over one period. This supplies an inspectable covariance construction with no sampled experimental data. The scoped bacterioplankton study found lower production CV at higher initial diversity, while abundance-CV results differed; those metrics must not be conflated.",
      "caption": "Change richness, response correlation and individual CV. Compare up to four individual curves with the aggregate of all species, read the independently sampled period-grid CV, and inspect the exact richness response.",
      "scope": "Individual means are fixed at one; the example isolates buffering and does not generate a diversity-induced mean-productivity increase. Correlation is nonnegative and CV≤0.3 keeps every offered response positive. The empirical paper motivates the question without supplying plotted data, fitted parameters or a universal field effect.",
      "links": {
        "insurance": "https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0037620"
      },
      "tags": [
        "ecology",
        "networks",
        "stability"
      ]
    },
    {
      "num": "6.13",
      "kind": "Paper",
      "name": "Food Web Complexity and Species Diversity",
      "paper": {
        "authors": "Robert T. Paine",
        "year": 1966,
        "title": "Food Web Complexity and Species Diversity",
        "venue": "The American Naturalist 100 (910): 65–75",
        "doi": "10.1086/282400"
      },
      "introduces": [
        "ecol-6.2"
      ],
      "deps": [
        "ecol-6.1"
      ],
      "refs": [
        "Stephen Stearns, Open Yale Courses EEB122, Lecture28 Ecological Communities, selected transcript Chapter3 (04:42–23:08), trophic cascades and predator-mediated coexistence",
        "Direct authored space-competition illustration; original bibliography retained"
      ],
      "viz": V.paine,
      "statement": "Paine’s 1966 paper **Food Web Complexity and Species Diversity** is associated with predator-removal evidence for community organization. The causal question is whether suppressing a predator releases a competitively superior prey and thereby changes the survival of other species.\n\nThe accompanying simulation is a separate three-competitor space model. It starts at its predator-present equilibrium, reduces external predation at time 10, and optionally restores it later. It illustrates a mechanism discussed in the scoped secondary lecture; it is not the paper’s original experiment or dataset.",
      "idea": "A removal experiment changes one proposed organizing factor while following community responses. The important mechanistic link is that a predator may prevent one competitor from monopolizing a limiting resource such as space.\n\nOur illustrative model makes competition hierarchical and lets inferior competitors colonize faster. Predator removal favors the superior species; restoration can release surviving positive remnants. The initial state, coefficients, horizon and restoration are authored choices. Exactly absent species would not spontaneously reappear under these equations, so recovery must not be interpreted as automatic recolonization.",
      "caption": "Remove or partly suppress predation and optionally restore it. Follow occupied space through time, inspect the selected-time composition, and distinguish the declared mechanism illustration from a historical quantitative reconstruction.",
      "scope": "The original publisher body returned403 and remains uninspected; the complete frozen bibliography is retained with a verification flag. No alternate copy was recovered. The read secondary lecture supports the qualitative predator-mediated coexistence mechanism. No original15-to-8 count, exact site chronology, field curve or historical calibration is reproduced.",
      "links": {
        "lecture": "https://oyc.yale.edu/ecology-and-evolutionary-biology/eeb-122/lecture-28"
      },
      "tags": [
        "ecology",
        "networks",
        "stability"
      ],
      "verify": true
    },
    {
      "num": "6.14",
      "kind": "Paper",
      "name": "Will a Large Complex System be Stable?",
      "paper": {
        "authors": "Robert M. May",
        "year": 1972,
        "title": "Will a Large Complex System be Stable?",
        "venue": "Nature 238 (5364): 413–414",
        "doi": "10.1038/238413a0"
      },
      "introduces": [
        "ecol-6.6"
      ],
      "deps": [
        "ecol-6.5",
        "mathbio-3.21"
      ],
      "refs": [
        "Dougoud, Vinckenbosch, Rohr, Bersier & Mazza (2018), The feasibility of equilibria in large ecosystems: A primary but neglected concept in the complexity-stability debate, PLoS Computational Biology14:e1005988, selected Introduction",
        "Written MATHBIO3.21; original publisher abstract only; direct finite-ensemble calculation"
      ],
      "viz": V.mayPaper,
      "statement": "May’s 1972 paper **Will a Large Complex System be Stable?** made random-community stability a central ecological question. Its publisher abstract describes the proposed connectance transition; the original body is not claimed as read.\n\nThe modern calculation here draws a finite ensemble with negative diagonal self-regulation and independent centered off-diagonal interactions. It measures how often all computed eigenvalues have negative real parts as σ changes, comparing that result with the large-S guide\n$$\\sigma\\sqrt{SC}=d.$$\nThe observed finite fraction is not forced to jump at that guide.",
      "idea": "For a standardized draw B, the matrix −dI+σB has eigenvalues −d+σλ(B). Diagonalize each draw once, then reuse the exact shift-and-scale relation across strengths. This produces an actual finite ensemble without repeatedly approximating the same eigenproblem.\n\nCounts of stable, unstable and numerically unresolved draws remain separate. A nominal Wilson interval reports binomial sampling uncertainty and is widened to include unresolved classifications. This describes Monte Carlo uncertainty under the declared ensemble, not uncertainty in a fitted natural ecosystem or proof that its equilibrium is feasible.",
      "caption": "Inspect a reproducible finite-ensemble stability curve and its nominal sampling interval. Vary richness, interaction density, self-regulation and trial count, and compare actual draws with the asymptotic guide.",
      "scope": "The original Nature page explicitly offered only a subscription preview. Its abstract and bibliographic record were read; no body, PDF or alternate recovery is claimed. The frozen paper bibliography and introduces link remain exact, with a verification flag. The scoped modern source and written prerequisite support the conditional mathematical context; no independent original-paper acceptance is asserted.",
      "links": {
        "feasibility": "https://journals.plos.org/ploscompbiol/article?id=10.1371/journal.pcbi.1005988"
      },
      "tags": [
        "ecology",
        "networks",
        "stability"
      ],
      "verify": true
    }
  ]
};
