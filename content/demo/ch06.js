import * as V from './ch06.viz.js';
export default {
  collection: 'demo',
  chapter: 6,
  title: "Stable and stationary populations",
  summary: "Follow birth cohorts through survival and reproduction. Compare stable and stationary age profiles, exact conditional identities, changing-rate histories and explicit two-sex closures. Source period inputs, reported historical tables and authored examples retain their separate meanings.",
  items: [
    {
      "num": "6.1",
      "kind": "Model",
      "name": "The stable population model",
      "deps": [
        "demo-5.6"
      ],
      "statement": "A stable population has an unchanging age distribution while its size changes geometrically or exponentially. For a fixed finite census law $n(t+1)=Ln(t)$, a simple positive leading eigenvalue $\\lambda$, a strict spectral gap and positive initial reproductive value give\n$$\\begin{aligned}\\frac{n(t)}{\\sum_i n_i(t)}&\\longrightarrow\\frac{u}{\\sum_i u_i},\\\\Lu&=\\lambda u.\\end{aligned}$$\nHere $n$ counts females. Constant rates alone do not remove periodicity, sterile initial states or an empty denominator.",
      "idea": "The annual teaching law moves each surviving cohort forward one year. An explicit 100+ group retains survivors with annual survival $s_+$. Let $l_i$ be survivorship at integer age $i$, and let\n$$K_j=\\int_{j-1}^{j}l(a)m(a)\\,da.$$\nA birth pulse obeys $B_t=\\sum_jK_jB_{t-j}$. Its positive characteristic root satisfies $1=\\sum_jK_j\\lambda^{-j}$. When the supported delays have greatest common divisor 1, equality in the triangle inequality excludes another reproductive root of modulus $\\lambda$. The root is simple because the positive characteristic sum decreases strictly. If also $s_+<\\lambda$, the survivor tail cannot dominate.\nThe same-law stable vector has entries proportional to $l_i\\lambda^{-i}$ below 100 and $l_{100}\\lambda^{-100}/(1-s_+/\\lambda)$ in the open bucket. Normalize the spectral projection from DEMO 5.6; the initial scalar cancels when its reproductive value is positive.",
      "caption": "Choose a retained period schedule and an authored starting population. The selected census advances its actual age shares; an overlay shows the analytic target of that same annual law. A size history and the maternity contributions reveal why shape and scale behave differently.",
      "scope": "A chosen annual birth-pulse discretization, driven by retained WPP 2024 female inputs. Nonempty presets start with 100 authored females; they are not observed census counts. Continuous-age interpolation uses constant hazards between life-table knots and an explicit exponential 100+ tail with mean $L_{100}/l_{100}$. The annual law uses integrated maternity coefficients and a geometric survivor bucket. Its root and target are distinguished from the continuous-age model in 6.2. Older-only and empty starts expose the initial-value hypothesis.",
      "refs": [
        "UN World Population Prospects 2024: retained female fertility and life-table schedules; estimates 1950–2023",
        "Rodríguez, Stable Populations (2017), pp 1,4–5; own fixed-law spectral/renewal derivation"
      ],
      "tags": [
        "stable population",
        "cohort projection",
        "reproductive value"
      ],
      "links": {
        "source": "https://grodri.github.io/demography/StablePopulations.pdf"
      },
      viz(v) { V.lesson1(v); }
    },
    {
      "num": "6.2",
      "kind": "Theorem",
      "name": "Lotka’s intrinsic growth rate from a life table",
      "deps": [
        "demo-6.1",
        "demo-4.3",
        "mathbio-4.6"
      ],
      "statement": "Let $l(a)$ be maternal survivorship and $m(a)$ live daughters per woman-year. If $K(a)=l(a)m(a)\\ge0$ is integrable, nonzero and supported within a positive, bounded reproductive-age interval, there is exactly one real intrinsic growth rate $r$ satisfying\n$$F(r)=\\int_0^\\infty e^{-ra}K(a)\\,da=1.$$\nThis is a rate per year. It is distinct from an annual multiplication factor $e^r$. A zero maternity kernel has no finite root.",
      "idea": "An exponential birth stream $B(t)=B_0e^{rt}$ inserted into the renewal equation cancels its common factor and gives $F(r)=1$. Continuity follows on the bounded support. Differentiation gives\n$$F'(r)=-\\int_0^\\infty a e^{-ra}K(a)\\,da<0.$$\nBecause reproduction occurs at positive ages, $F(r)$ tends to 0 as $r\\to\\infty$ and to infinity as $r\\to-\\infty$. The intermediate-value argument supplies existence and strict decrease gives uniqueness. At $r=0$, $F(0)$ is the model net reproduction rate. Survival weights the prospective mother's exposure; it does not add a second survival requirement for her newborn daughter.",
      "caption": "Move a trial growth rate along the actual Lotka curve for a selected period schedule. A logarithmic vertical scale keeps the crossing at one visible. The contribution chart separates maternal-age bands at the trial and intrinsic rates; zero fertility has an explicit zero-kernel view.",
      "scope": "Female period inputs from WPP 2024, with piecewise constant maternity and the declared constant-hazard interpolation. The reconstructed NRR, the official grouped person-year calculation and the published UN indicator need not coincide. The widget recomputes its own continuous model. Stable age normalization additionally requires an integrable discounted survival tail; finding a maternity root alone is not that condition.",
      "refs": [
        "UN World Population Prospects 2024: retained female fertility and life-table schedules; estimates 1950–2023",
        "Rodríguez (2017), actual pp 1–3; written DEMO 4.3 and MATHBIO 4.6; own monotonicity proof"
      ],
      "tags": [
        "Euler Lotka",
        "intrinsic growth",
        "maternal survival"
      ],
      "links": {
        "source": "https://grodri.github.io/demography/StablePopulations.pdf"
      },
      viz(v) { V.lesson2(v); }
    },
    {
      "num": "6.3",
      "kind": "Theorem",
      "name": "r ≈ ln(NRR) / T for human populations",
      "deps": [
        "demo-6.2",
        "mathbio-4.8"
      ],
      "statement": "Write $R_0=\\int K(a)\\,da>0$ and normalize the net maternity kernel to a probability law $w(a)=K(a)/R_0$. Its mean age $T$ is a net-maternity-weighted generation time. Near replacement,\n$$r\\approx r_1=\\frac{\\log R_0}{T}.$$\nFor this definition of $T$, the exact continuous root satisfies $r\\ge r_1$. Approximation error depends on timing and dispersion as well as reproduction level.",
      "idea": "The characteristic equation becomes $0=\\log R_0+\\log E_w[e^{-rA}]$. Expanding the cumulant generating function as in MATHBIO 4.8 gives\n$$0=\\log R_0-rT+\\tfrac12r^2\\sigma^2+\\cdots.$$\nDropping quadratic and higher terms gives $r_1$; one further substitution gives $r_2=r_1+\\sigma^2r_1^2/(2T)$. Neither truncation has a universal accuracy guarantee.\nFor the exact inequality, use $e^x\\ge1+x$: $E[e^{-r(A-T)}]\\ge1$. Thus $1=R_0E[e^{-rA}]\\ge R_0e^{-rT}$ and $rT\\ge\\log R_0$. With a nondegenerate age distribution and $r\\ne0$, the inequality is strict. This argument applies on either side of replacement.",
      "caption": "Compare all 50 retained country-year schedules against the equality line, then inspect the selected schedule's maternity timing and actual first- and second-order errors. A common fertility multiplier changes the calculation for every displayed point.",
      "scope": "The 50 points are ten countries at 1950,1970,1990,2010 and 2023, reconstructed from retained WPP 2024 female schedules. They are model calculations, not observed national growth rates or causal estimates. T is defined from the unweighted net maternity kernel, rather than silently substituted by the mean age of mothers in a growing population. Zero fertility leaves the root and approximation undefined.",
      "refs": [
        "UN World Population Prospects 2024: retained female fertility and life-table schedules; estimates 1950–2023",
        "Written MATHBIO 4.8; own exponential-tangent bound and cumulant calculation"
      ],
      "tags": [
        "generation time",
        "net reproduction",
        "approximation"
      ],
      "links": {
        "source": "https://grodri.github.io/demography/StablePopulations.pdf"
      },
      viz(v) { V.lesson3(v); }
    },
    {
      "num": "6.4",
      "kind": "Theorem",
      "name": "The stable age distribution c(a) = b e^{−ra} l(a)",
      "deps": [
        "demo-6.2"
      ],
      "statement": "In an exact stable solution with a common exponential birth history, surviving females of age $a$ have density $n(a,t)=B_0e^{r(t-a)}l(a)$. If\n$$I(r)=\\int_0^\\infty e^{-ra}l(a)\\,da<\\infty,$$\nthen the normalized age density and female crude birth rate are\n$$\\begin{aligned}c(a)&=b e^{-ra}l(a),\\\\b&=1/I(r).\\end{aligned}$$\nThe units of c are per year of age; b counts girl births per female-year.",
      "idea": "Each cohort born at $t-a$ has size $B(t-a)$ and retains fraction $l(a)$. Integrating its density over all ages gives $N(t)=B_0e^{rt}I(r)$. Dividing by this total cancels the time-dependent factor. Also $B(t)/N(t)=1/I(r)$.\nIf $l'=-\\mu l$ and the tail vanishes, then $c'=-(r+\\mu)c$. Integrating yields $b-d=r$, where $d=\\int\\mu(a)c(a)\\,da$ is the female crude death rate. In the widget, a chosen growth rate is made compatible with reproduction by explicitly rescaling maternity; it is not a second root of the unchanged fertility schedule.",
      "caption": "Build an age profile from survival, a chosen exponential tilt and a normalizer. Select an age to see the complete multiplication. The final accounting chart connects female births, deaths and growth, including the 100+ tail.",
      "scope": "Retained female period survival with a declared piecewise-hazard interpolation and exponential 100+ tail. The chosen growth rate requires r plus the tail hazard to be positive for a finite population. Maternity is rescaled to make its Lotka integral equal one at the selected rate. These are stable-equivalent profiles, not observed age pyramids. A finite initial population need not already have this shape.",
      "refs": [
        "UN World Population Prospects 2024: retained female fertility and life-table schedules; estimates 1950–2023",
        "Rodríguez (2017), actual p 4; own normalization and rate-balance derivation"
      ],
      "tags": [
        "stable age density",
        "survival",
        "normalization"
      ],
      "links": {
        "source": "https://grodri.github.io/demography/StablePopulations.pdf"
      },
      viz(v) { V.lesson4(v); }
    },
    {
      "num": "6.5",
      "kind": "Theorem",
      "name": "Fertility, not mortality, shapes the age pyramid (Coale)",
      "deps": [
        "demo-6.4"
      ],
      "statement": "For finite, normalizable stable solutions with fixed survival, a proportional fertility increase raises intrinsic growth and shifts the age distribution toward younger ages. Coale's broader comparison between fertility and mortality depends on the age pattern and range of mortality changes; mortality effects are not universally small.\nA precise counterpoint is that adding a constant hazard $\\delta$ at every age changes $r$ to $r-\\delta$ while leaving the complete stable age density unchanged.",
      "idea": "Multiplying maternity by k increases the Lotka integral at fixed r, so its unique root must rise. For two roots $r_2>r_1$, the density ratio is $(b_2/b_1)e^{-(r_2-r_1)a}$, a decreasing function of age. It crosses one at most once, so the higher-growth density places more cumulative mass at younger ages.\nFor the uniform-hazard identity, $l_\\delta(a)=e^{-\\delta a}l(a)$. At $r_\\delta=r-\\delta$, both the maternity integral and the unnormalized age profile return their original values because $e^{-r_\\delta a}l_\\delta(a)=e^{-ra}l(a)$. Hence b and the age density are unchanged while d increases by delta. Early- and late-age hazard changes generally have different effects.",
      "caption": "Change fertility, early-life mortality and later-life mortality separately. Compare their actual stable profiles and mean ages on common scales. A separate uniform-hazard example shows how identical age shares can accompany different growth and death rates.",
      "scope": "The frozen title names a historically influential comparison. Coale's actual reprint explicitly says mortality need not have only a minor effect (p 170) and discusses the historical age pattern of improvements. The widget uses distinct, modern retained period inputs and authored counterfactual multipliers. It does not digitize Coale's Swedish curves or extrapolate his historical quantitative comparisons to every setting.",
      "refs": [
        "UN World Population Prospects 2024: retained female fertility and life-table schedules; estimates 1950–2023",
        "Coale (1957), actual reprint in Smith & Keyfitz (2013), pp 168–172, especially p 170; own proportional-fertility and uniform-hazard proofs"
      ],
      "tags": [
        "fertility",
        "mortality age pattern",
        "Coale"
      ],
      "links": {
        "source": "https://www.demogr.mpg.de/books/drm/011/978-3-642-35858-6_Book_Online.pdf"
      },
      viz(v) { V.lesson5(v); }
    },
    {
      "num": "6.6",
      "kind": "Theorem",
      "name": "Stationary-population identities: b = d = 1/e₀",
      "deps": [
        "demo-6.4",
        "demo-2.4"
      ],
      "statement": "For a closed stationary female population, $r=0$, $c(a)=l(a)/e_0$ and\n$$\\begin{aligned}e_0&=\\int_0^\\infty l(a)\\,da,\\\\b=d&=1/e_0.\\end{aligned}$$\nThe mean age of living females is $\\int a l(a)\\,da/e_0$. It differs from life expectancy at birth, and from the mean age at death, which equals $e_0$ in this stationary model.",
      "idea": "Set r to zero in 6.4's normalizer. Each newborn contributes $e_0$ expected female person-years, so a constant stream of B girl births produces N=B$e_0$ living females. Proper survival tends to zero and $\\int\\mu l=1$, giving D=B and b=d=1/$e_0$.\nFor a newborn lifetime T, integration of the survival function gives $E[T]=\\int l$ and $E[T^2]=2\\int a l(a)\\,da$. The age distribution of living females weights each lifetime by its duration; its mean is therefore $E[T^2]/(2E[T])$. Stationary deaths sample the newborn lifetime distribution instead. Equal birth and death flows do not make these two age distributions equal.",
      "caption": "Rescale maternity to replacement and inspect the survival area, balanced birth/death flows and the two different mean ages. A mortality control changes the complete survival law and its oldest-age tail.",
      "scope": "Stationarity is imposed by a declared maternity rescaling; it is not inferred from a rounded NRR. Life expectancy here is the integral under the stated interpolation, with an explicit exponential 100+ tail. Official grouped Lx person-years remain source inputs and need not equal every interpolated interval integral. All rates and ages refer to the same female model.",
      "refs": [
        "UN World Population Prospects 2024: retained female fertility and life-table schedules; estimates 1950–2023",
        "Rodríguez (2017), actual p 4; written DEMO 2.4; own stationary flow and lifetime-moment derivation"
      ],
      "tags": [
        "stationary population",
        "life expectancy",
        "length bias"
      ],
      "links": {
        "source": "https://grodri.github.io/demography/StablePopulations.pdf"
      },
      viz(v) { V.lesson6(v); }
    },
    {
      "num": "6.7",
      "kind": "Theorem",
      "name": "Lotka’s renewal equation and convergence to stability",
      "deps": [
        "demo-6.2",
        "mathbio-4.13"
      ],
      "statement": "With fixed female survivorship and maternity, births satisfy a renewal equation\n$$\\begin{aligned}B(t)&=G(t)+U(t),\\\\U(t)&=\\int_0^tK(a)B(t-a)\\,da,\\\\K&=lm.\\end{aligned}$$\nFor a closed population, G is reproduction from females already present initially. A directly specified nonnegative G also defines a useful forced renewal model. Convergence of growth-corrected births needs appropriate nonlattice, finite-mean and forcing-integrability conditions; nonnegative rates alone are insufficient.",
      "idea": "Multiplying by $e^{-rt}$ makes $w(a)=e^{-ra}K(a)$ a probability density at the Lotka root. Under the renewal theorem's convergence hypotheses, directly Riemann-integrable corrected forcing and finite positive weighted mean give\n$$\\begin{aligned}e^{-rt}B(t)&\\longrightarrow C,\\\\C&=\\frac{\\int_0^\\infty e^{-rs}G(s)\\,ds}{\\int_0^\\infty a e^{-ra}K(a)\\,da}.\\end{aligned}$$\nThe illustration also has a complete explicit proof. Choose an Erlang kernel with integer shape k, scale theta and total R: $$\\begin{aligned}K(a)&=\\frac{R a^{k-1}e^{-a/\\theta}}{\\theta^k(k-1)!},\\\\T&=k\\theta.\\end{aligned}$$ Specify $G(t)=B_0e^{-t/\\theta}$. Repeated convolution gives\n$$\\begin{aligned}B(t)&=B_0e^{-t/\\theta}S(t),\\\\S(t)&=\\sum_{n\\ge0}\\frac{R^n(t/\\theta)^{kn}}{(kn)!}.\\end{aligned}$$\nPut $c=R^{1/k}$ and $r=(c-1)/\\theta$. Root-of-unity filtering rewrites the corrected series as $k^{-1}\\sum_j\\exp(c(\\omega_j-1)t/\\theta)$. Only $\\omega_0=1$ survives; all other real parts are negative. The limit is 1/k.\nThe plotted modes are eigenvalues of the associated k-phase system, equivalently poles of its rational renewal solution: $$\\begin{aligned}(1+\\theta z_j)^k&=R,\\\\z_j&=(c\\omega_j-1)/\\theta.\\end{aligned}$$ They are not all claimed as convergent ordinary Laplace integrals. In a lattice example $B_t=RB_{t-T}$, each residue class keeps its own corrected amplitude, so periodic differences can persist.",
      "caption": "Watch the computed renewal stream, its growth-corrected limit and every eigenvalue of the explicit phase system. The second time plot separates specified forcing from the positive renewal contribution. Shape and mean timing change the damping mechanism.",
      "scope": "An authored Erlang kernel and directly specified exponential forcing, chosen for a complete analytic solution. G is not reconstructed from a human initial age distribution. The plotted phase-system roots come from its characteristic polynomial; the ordinary Erlang Laplace integral has its own convergence region. General demographic renewal convergence additionally needs its stated renewal hypotheses, and age-profile convergence needs suitable tail control. MATHBIO 4.13 develops the renewal framework; the explicit mode proof is supplied here.",
      "refs": [
        "Written MATHBIO 4.13: renewal framework; own complete Erlang convolution/mode proof",
        "Rodríguez (2017), actual pp 1–2,5: renewal identity and growth correction"
      ],
      "tags": [
        "renewal",
        "Erlang kernel",
        "phase modes"
      ],
      "links": {
        "source": "https://grodri.github.io/demography/StablePopulations.pdf"
      },
      viz(v) { V.lesson7(v); }
    },
    {
      "num": "6.8",
      "kind": "Theorem",
      "name": "Variable-r relations (Preston–Coale)",
      "deps": [
        "demo-6.4"
      ],
      "statement": "Let a positive age density n obey the closed-population continuity equation $\\partial_t n+\\partial_a n=-\\mu n$. Define instantaneous age-specific growth by $r(a,t)=\\partial_t\\log n(a,t)$ and period survivorship by $l_t(a)=\\exp[-\\int_0^a\\mu(x,t)\\,dx]$. At the same instant t,\n$$\\begin{aligned}c(a,t)&=b(t)l_t(a)e^{-J(a,t)},\\\\J(a,t)&=\\int_0^a r(x,t)\\,dx.\\end{aligned}$$\nFinite differences between two censuses generally cannot be substituted as an exact point-in-time r.",
      "idea": "Divide continuity by n to obtain $\\partial_a\\log n=-\\mu-r$. Integrate in age at fixed t, using $n(0,t)=B(t)$, then divide by N(t). The survival factor is a synthetic period function at t; under changing mortality it is not automatically the survival history of a real cohort.\nFor censuses separated by delta,\n$$\\begin{aligned}g_\\Delta(a,t)&=\\frac1\\Delta\\log\\frac{n(a,t+\\Delta)}{n(a,t)},\\\\&=\\frac1\\Delta\\int_t^{t+\\Delta}r(a,s)\\,ds.\\end{aligned}$$\nThis is a time average at a fixed age. It equals the instantaneous value in special cases, rather than by definition. The example uses a fully specified positive birth history and fixed exponential survival, so both rates and their reconstruction errors can be calculated independently.",
      "caption": "A chosen cyclical birth history generates the current age density. Compare instantaneous growth with two-census average growth, then inspect the exact reconstruction and the finite-census substitute. The substitute's total mass is reported before any separate normalization.",
      "scope": "An authored smooth birth history $B(t)=\\exp(r_0t+A\\sin(2\\pi t/P))$ with fixed survival exp(−a/40). The complete infinite tail is normalized using the periodic factor, even though the chart displays ages 0–120. No empirical census series is asserted. The exact relation requires positive densities and instantaneous same-time rates. The normalized finite-census comparison and its implied birth rate are distinguished from the raw substitution using the true current birth rate.",
      "refs": [
        "Preston & Coale (1982), Population Index 48(2):217–259, historical attribution",
        "Own continuity-equation proof and fully specified birth-history calculation"
      ],
      "tags": [
        "variable growth",
        "continuity",
        "census averaging"
      ],
      "links": {
        "source": "https://pubmed.ncbi.nlm.nih.gov/12265035/"
      },
      viz(v) { V.lesson8(v); }
    },
    {
      "num": "6.9",
      "kind": "Theorem",
      "name": "Weak ergodicity under changing rates",
      "deps": [
        "demo-5.6"
      ],
      "statement": "Two populations can forget their different initial age distributions under a common changing sequence of rates without approaching a fixed age shape. One sufficient condition is quantitative uniform mixing: fixed-length block products P have entries satisfying $0<m\\le P_{ij}\\le M<\\infty$. Mere pointwise positivity of successive laws is not enough.",
      "idea": "After one positive block, both nonzero population vectors x and y are strictly positive. Put $q_j=x_j/y_j$ and let their minimum and maximum be l and u. Each output ratio is an average of q with weights $P_{ij}y_j/(Py)_i$. Every such row law contains at least $\\epsilon=m/M$ of the common distribution $y_j/\\sum y$.\nRemove that common part. The remaining averages lie in [l,u], so the new ratio range is at most $(1-\\epsilon)(u-l)$. The range's lower endpoint cannot decrease; after the first block it stays positive. Iterating contracts the range to zero. Normalizing x and y divides their ratios by another average in that same interval, proving that their normalized distributions approach.\nThe widget's two nonnegative laws share a primitive lower-bound pattern. Exact graph-walk products certify a positive 10-step lower block and a finite upper block, which bound every changing 10-step product. This is an all-time certificate; the finite plotted trace only illustrates it.",
      "caption": "Start two different age profiles under one periodic or Thue–Morse sequence. Compare their changing shapes, actual total-variation distance and normalized ratio-range contraction against its proved block bound.",
      "scope": "A four-age teaching model with ten-year classes 0–9 through 30–39 and exit at 40, using authored coefficients. It is not calibrated to a national life table. Exact rational calculations certify the uniform block bounds. The bound can be conservative; it is not replaced by a fitted decay line. For identical starts the ratio spread is already zero. DEMO 5.6 supplies a separate counterexample showing why vanishing positive mixing does not suffice.",
      "refs": [
        "Schoen (2001), Toward a General Model for Populations with Changing Rates, §2.1, printed 166: changing-law context",
        "Written DEMO 5.6; own quantitative ratio-range contraction proof"
      ],
      "tags": [
        "weak ergodicity",
        "changing rates",
        "uniform mixing"
      ],
      "links": {
        "source": "https://www.demographic-research.org/volumes/vol4/6/4-6.pdf"
      },
      viz(v) { V.lesson9(v); }
    },
    {
      "num": "6.10",
      "kind": "Concept",
      "name": "The two-sex problem",
      "deps": [
        "demo-6.1"
      ],
      "statement": "A female-only projection closes births using the female age structure; a male-only projection closes them using the male structure. The closures can disagree because reproduction involves both sexes. A two-sex projection must specify an additional birth-production or matching rule. Its form is a modeling choice, not determined by the one-sex life tables.",
      "idea": "In the authored example, let F and G denote unconstrained birth capacities computed from the current female and male age vectors. The chosen homogeneous closure is\n$$B=\\frac{2\\eta FG}{F+G},\\qquad0\\le\\eta\\le\\tfrac12,$$\nwith B=0 when either capacity is zero. It is bounded by min(F,G), scales linearly when both populations scale together, and agrees with the separate closures etaF and etaG when F=G. It is a birth-production law, not a literal count of exclusive couples.\nAllocate fraction q of births to females and 1−q to males, then advance each sex with its own survival steps. The single-sex closures are linear and have their own intrinsic roots. The two-sex update is generally nonlinear: homogeneity does not make it additive. A finite-step growth trace therefore does not certify a universal two-sex intrinsic growth theorem.",
      "caption": "Compare female-only, male-only and the chosen two-sex birth streams from the same initial age vectors. Change the initial sex mix, birth-sex share and capacity utilization. Selected sex-specific age bars and the capacity calculation reveal the source of disagreement.",
      "scope": "Four authored ten-year classes, with exit at 40 and specified sex-specific coefficients. These are finite teaching projections. Female-only and male-only intrinsic rates are identified as belonging to their respective closures; the two-sex trace reports finite-step growth. A missing sex makes the chosen two-sex birth stream zero, and an eventually empty population has undefined growth ratios. No unique empirical mating law is inferred.",
      "refs": [
        "Sharpe & Lotka (1911), actual reprint p 98: procreation may depend on both sex distributions",
        "Own specified two-sex capacity closure and cohort accounting"
      ],
      "tags": [
        "two sex",
        "birth production",
        "nonlinear projection"
      ],
      "links": {
        "source": "https://www.demogr.mpg.de/books/drm/011/978-3-642-35858-6_Book_Online.pdf"
      },
      viz(v) { V.lesson10(v); }
    },
    {
      "num": "6.11",
      "kind": "Paper",
      "name": "A Problem in Age-Distribution",
      "paper": {
        "authors": "F. R. Sharpe and Alfred J. Lotka",
        "year": 1911,
        "title": "A Problem in Age-Distribution",
        "venue": "Philosophical Magazine, Series 6, 21 (124): 435–438",
        "doi": "10.1080/14786440408637050"
      },
      "introduces": [
        "demo-6.1",
        "demo-6.4"
      ],
      "deps": [
        "demo-2.3",
        "demo-4.1"
      ],
      "statement": "Sharpe and Lotka's 1911 paper connects the age distribution to past births and survival, then studies the return toward a fixed age distribution after a small displacement. Its cohort identity is\n$$n(a,t)=B(t-a)l(a).$$\nWith an asymptotically exponential birth stream and suitable normalization, it leads to $c(a)=be^{-ra}l(a)$. The original text explicitly treats the birth-sex ratio and age-specific procreation as independent of age composition for its small-displacement analysis.",
      "idea": "The cohort now aged a began with B(t−a)births per unit time and retained fraction l(a). If births have a dominant exponential component, factoring it from both n and its age integral leaves the stable density. The fully specified finite-law argument in 6.1 gives a modern sufficient spectral condition and makes its initial reproductive-value hypothesis explicit.\nThe paper's notation distinguishes a multiplicative root from its logarithm. This chapter uses r for the continuous annual rate throughout. The accompanying historical table preserves the female calculated and observed entries exactly as printed in the actually read reprint, including its unequal-width and open-ended age groups. Rounded table entries are not silently normalized.",
      "caption": "Select an age to trace a cohort from its birth level through survival. Compare the actual paper's 11 female age-group entries, calculated and observed, on one categorical scale. A separate same-law projection lets you change the authored starting profile while tracing distance from its same-law target.",
      "scope": "The actual source read is the 1911 article as reproduced in Smith & Keyfitz 2013, printed pp 98–100, PDF 116–118. The historical table concerns England and Wales 1871–1880. Its raw relative-frequency entries are not reconstructed life tables or modern observations. The cohort illustration uses a selected retained WPP 2024 survival schedule and chosen growth rate; the modern projection is separately authored.",
      "refs": [
        "Sharpe & Lotka (1911), actual reprint in Smith & Keyfitz, Mathematical Demography: Selected Papers (2013), pp 98–100",
        "Own conditional finite-law projection"
      ],
      "tags": [
        "Sharpe Lotka",
        "cohort identity",
        "historical comparison"
      ],
      "links": {
        "source": "https://www.demogr.mpg.de/books/drm/011/978-3-642-35858-6_Book_Online.pdf"
      },
      viz(v) { V.lesson11(v); }
    },
    {
      "num": "6.12",
      "kind": "Paper",
      "name": "How the Age Distribution of a Human Population Is Determined",
      "paper": {
        "authors": "Ansley J. Coale",
        "year": 1957,
        "title": "How the Age Distribution of a Human Population Is Determined",
        "venue": "Cold Spring Harbor Symposia on Quantitative Biology 22: 83–89",
        "doi": "10.1101/SQB.1957.022.01.010"
      },
      "introduces": [
        "demo-6.5"
      ],
      "deps": [
        "demo-6.11",
        "demo-6.4"
      ],
      "statement": "Coale's 1957 analysis explains age composition through past births, survival and reproduction. Within its historical comparisons, fertility differences strongly affected stable age structure, while mortality's effects depended on the ages at which survival improved. The article explicitly rejects any logical necessity that mortality effects must always be minor.",
      "idea": "The stable identity contains two linked factors: survivorship and the exponential tilt set by reproduction. A mortality improvement can directly preserve older people while also increasing parents and births. The opposing effects need not cancel in a universal direction. The uniform-hazard calculation in 6.5 provides an exact invariant-profile case; improvements concentrated at later ages can instead change the older share substantially.\nThe article compares historical Swedish survival regimes with reported life expectancies 45.4 and 71.6 years, and discusses fertility and mortality swaps. The widget carries out its own four swaps using distinct retained WPP 2024 period inputs: first/first, first/second, second/first and second/second. Every resulting curve is a newly calculated stable equivalent, not an observed population age distribution.",
      "caption": "Swap fertility and mortality years independently for a selected country and compare all four stable-equivalent profiles and their intrinsic growth. A separate historical source panel retains Coale's two reported Swedish life expectancies without inventing source age curves.",
      "scope": "Actual Coale 1957 reprint pp 168–172, PDF 184–188, including the explicit p 170 qualification and the historically conditional conclusion. The original Swedish figures were inspected but not digitized. Modern curves use two selected WPP 2024 period schedules, with maternity and birth-sex share from the fertility year and female survival from the mortality year. The method changes a model's rates; it does not identify a universal causal ranking from two observed populations.",
      "refs": [
        "Coale (1957), actual reprint in Smith & Keyfitz (2013), pp 168–172; reported Swedish examples and stated limitations",
        "UN World Population Prospects 2024: retained female fertility and life-table schedules; estimates 1950–2023"
      ],
      "tags": [
        "Coale",
        "rate swaps",
        "age structure"
      ],
      "links": {
        "source": "https://www.demogr.mpg.de/books/drm/011/978-3-642-35858-6_Book_Online.pdf"
      },
      viz(v) { V.lesson12(v); }
    }
  ]
};
