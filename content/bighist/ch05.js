import { widget1, widget2, widget3, widget4, widget5, widget6, widget7, widget8 } from './ch05.ui.shared.js';
export default {collection:'bighist',chapter:5,title:'Farming and the first states',summary:String.raw`Farming, population movement and institutional change leave different kinds of evidence. Calendar conventions, actual radiocarbon records and explicit models help separate measured proxies from mechanisms. Regional histories, preservation, estimation and source-access limits remain visible; no single wave speed or population threshold explains the whole transition.`,items:[
{
num: "5.1",
kind: "Event",
name: "The Holocene and the Younger Dryas",
statement: String.raw`The Younger Dryas was a late-glacial cold episode; the formal base of the Holocene is a particular warming marker in Greenland's NGRIP ice core, not a date inferred from the beginning of farming. Walker and colleagues' 2009 definition places it at about **11,700 calendar years before 2000 CE (b2k)**, with a stated maximum layer-counting error of 99 years.

Calendar BP normally uses 1950 CE. The same physical date has an age 50 years smaller in BP than in b2k. Neither number is an uncalibrated radiocarbon age.`,
idea: String.raw`A time coordinate needs a reference epoch. If $y$ is an astronomical year, $a_{2000}=2000-y$ and $a_{1950}=1950-y$, hence $a_{1950}=a_{2000}-50$. Subtracting an epoch does not calibrate a radiocarbon measurement: that requires the separate atmospheric calibration relation from GEOL 2.6. The formal ice-core marker is identified by deuterium excess and accompanying proxies; the widget does not reconstruct an observed Greenland temperature curve.`,
caption: String.raw`Change the age convention and the chosen uncertainty. Compare the same date on the two age scales and inspect the calendar interval; the source Holocene benchmark is reported below, while the editable interval is yours.`,
scope: String.raw`Calendar-age illustration, not ice-core measurements. Source boundary and counting error follow Walker 2009; the separate ICS web summary gives a different error figure, so the cited paper convention is retained. BCE/CE labels have no historical year zero; internal arithmetic uses astronomical years. Ages and errors do not imply an exact archaeological event or simultaneous global warming.`,
deps: ["bighist-4.2", "geol-2.6"],
refs: ["Walker et al.2009, JQS24:3–17, abstract and dating discussion; ICS Holocene GSSP"],
links: {"source": "https://stratigraphy.org/gssps/holocene"},
see: [],
verify: false,
viz: widget1
},
{
num: "5.2",
kind: "Event",
name: "Independent centres of domestication",
statement: String.raw`Agriculture and domestication developed through several regional, taxon-specific pathways. Cultivation, inherited domestication traits and large-scale agricultural landscapes need not begin at the same time. Fuller and colleagues' archaeobotanical synthesis compares independent and convergent trajectories; it does not identify one universal package or a single founder.

The map below selects regional examples. Its associated selection model concerns a chosen non-shattering seed trait, not a date estimate for every domestication.`,
idea: String.raw`Use the actual harvest-selection mechanism from TECH 1.8. If a brittle type contributes only $1-s$ as much seed as a tough type, the tough frequency satisfies
$$p'={p\over p+(1-p)(1-s)}.$$
Consequently its odds are multiplied by $1/(1-s)$ each generation. This explains how a trait can spread under an explicitly chosen harvest advantage; it does not equate an archaeological trait frequency with a known constant historical selection coefficient. Regions, crop histories and management practices differ.`,
caption: String.raw`Select a regional crop example, then vary the chosen harvest advantage and generation. The map is a qualitative orientation guide; the second panel computes the actual selection frequency and retains a near-one rounding notice.`,
scope: String.raw`Selected examples from Fuller 2014 Figure 1, not a comprehensive origin atlas. Display anchors are approximate regional geometry, not excavated-site coordinates; no manufactured regional date table is supplied. Frequency model: deterministic haploid/selfing-line approximation, fixed advantage and no drift, gene flow or changing management. Endpoint frequencies remain absorbing only in this chosen model.`,
deps: ["bighist-5.1", "tech-1.8"],
refs: ["Fuller et al.2014, PNAS111:6147–6152, introduction and Figure1; TECH1.8 harvest selection"],
links: {"source": "https://ubcbiol415.github.io/papers/Fuller2014.pdf"},
see: [],
verify: false,
viz: widget2
},
{
num: "5.3",
kind: "Model",
name: "Farming spreads as a wave of advance",
statement: String.raw`A reaction–diffusion model can illustrate one mechanism of a spreading farming population. For $D,r>0$, the equation
$$u_t=D u_{xx}+r u(1-u)$$
has the explicit travelling profile
$$u(x,t)=[1+e^{k(x-ct)}]^{-2},$$
$$k=\sqrt{r/(6 D)}.$$
$$c=5\sqrt{Dr/6}.$$
This is one exact front. It does **not** establish minimum-speed selection, identify a unique historical mechanism or predict a universal rate for Europe's farming transition.`,
idea: String.raw`Put $s=[1+e^{k(x-ct)}]^{-1}$, so $u=s^2$. The written product and chain rules give
$$u_x=-2 ku(1-s),$$
$$u_{xx}=2 k^2 u(1-s)(2-3 s),$$
$$u_t=-cu_x.$$
Substitution with $k^2=r/(6 D)$ and $ck=5 r/6$ gives the stated PDE term by term. For a separate linear leading-edge ansatz $e^{-\lambda(x-ct)}$ with $\lambda>0$, substitution gives $c\lambda=D\lambda^2+r$, hence $c=D\lambda+r/\lambda\ge 2\sqrt{Dr}$ by a nonnegative square. That necessary dispersion calculation alone does not prove existence or selection of a minimal nonlinear front. Here the displayed speed is the verified $5\sqrt{Dr/6}$.`,
caption: String.raw`Move time to translate the exact profile, compare it with its initial position, and vary the chosen growth and dispersal coefficients. The probe uses a normalized front coordinate; read the actual PDE residual and the distinction between this front and the minimum-speed candidate.`,
scope: String.raw`Authored one-dimensional continuum population fraction on an infinite uniform line, with chosen $D$ in km²/year and $r$ in 1/year. No geographic barriers, cultural conversion, finite-population fluctuations or fit to archaeological dates. Positive coefficient ranges are enforced; zero-coefficient limits are outside this front formula. Finite binary 64 evaluations may round very small tails to zero.`,
deps: ["bighist-5.2", "pma-5.3", "pma-5.5"],
refs: ["Supplied exact-profile verification using the written calculus rules; compare Pinhasi et al.2005 discussion of demographic wave models"],
links: {"source": "https://journals.plos.org/plosbiology/article?id=10.1371/journal.pbio.0030410"},
see: ["mathbio-8.9", "pde-9.8"],
verify: false,
viz: widget3
},
{
num: "5.4",
kind: "Phenomenon",
name: "Neolithic radiocarbon dates trace the front",
statement: String.raw`Early-farming dates and distances show a broad spatiotemporal gradient, with substantial regional scatter. This explorer uses the **later 2005 Pinhasi–Fort–Ammerman dataset**, not the inaccessible 1971 paper's original sample. It retains all 735 non-Arabian sites from their supporting spreadsheet, with original date conventions, uncertainties and supplied great-circle distances.

For the chosen origin and age convention, an age-on-distance fit $a=\alpha+\beta d$ gives a descriptive inverse-gradient speed $-1/\beta$ only when $\beta<0$. A correlation or a slope does not determine whether people, practices or both moved.`,
idea: String.raw`For actual selected pairs $(d_i,a_i)$, minimize $\sum(a_i-\alpha-\beta d_i)^2$. Setting both derivatives to zero gives
$$\beta={\sum(d_i-\bar d)(a_i-\bar a)\over\sum(d_i-\bar d)^2},$$
$$\alpha=\bar a-\beta\bar d.$$
Calendar ages require calibration, as GEOL 2.6 explains; changing 1950/2000 reference epochs is not that operation. The spreadsheet's calibrated values are the authors' vintage 2004 values. Source sampling, chronology, region and distance definitions limit interpretation; fitted speed is a sample-level diagnostic rather than a local front trajectory.`,
caption: String.raw`Switch the original date convention and supplied origin, filter the broad region, and inspect a distance-ranked site. The map and scatter show the actual selected records; the highlighted site's source uncertainty is distinct from uncertainty in the fitted regression.`,
scope: String.raw`Original 2005 TableS 1 rows 40–804, excluding the 30 Arabian records, gives 735. Three original great-circle-distance columns are used. Europe includes the source Iberia category; Near East includes Anatolia. No modern recalibration, shortest-path rerouting, site-quality reappraisal or complete 1971 reproduction. Dates are proxies for earliest recorded occupation, not exact arrival times. Source lab SD and calibrated SD are retained separately; zero or blank SD cells are treated as unavailable, never exact zero uncertainty.`,
deps: ["bighist-5.2", "geol-2.6"],
refs: ["Pinhasi, Fort & Ammerman2005, PLOS Biology3:e410, methods, TableS1 and supporting TextS1"],
links: {"source": "https://journals.plos.org/plosbiology/article?id=10.1371/journal.pbio.0030410"},
see: ["bighist-5.3"],
verify: false,
viz: widget4
},
{
num: "5.5",
kind: "Hypothesis",
name: "Demic versus cultural diffusion",
statement: String.raw`**Demic diffusion** involves movement of people; **cultural diffusion** involves transmission of practices. These mechanisms can coexist. Genetic ancestry is neither a farming-adoption percentage nor a direct language label. Haak and colleagues' 2010 LBK study supports a particular Near Eastern/Anatolian affinity among sampled early farmers; it does not make every European transition identical.

The widget instead computes an explicitly authored replacement/conversion model, keeping farming adoption $f$ and immigrant-related ancestry $a$ separate.`,
idea: String.raw`In each generation, a fraction $c$ of resident non-farmers adopts farming; then a fraction $m$ of residents is replaced at random by incoming farmers carrying the labelled ancestry. Thus
$$f'=m+(1-m)[f+c(1-f)],$$
$$a'=m+(1-m)a.$$
Starting from $f_0=.05,a_0=0$ gives
$$1-f_t=.95[(1-c)(1-m)]^t,$$
$$1-a_t=(1-m)^t.$$
Conversion changes practices without adding the ancestry label; replacement changes both. These exact aggregate recurrences assume random replacement and fixed rates, not measured migration histories.`,
caption: String.raw`Choose mixed, replacement-only or conversion-only transmission. Vary the active rates and generation; compare farming adoption with the separately computed ancestry fraction. Hidden controls do not affect the selected mechanism.`,
scope: String.raw`Finite deterministic teaching community with random-replacement expectation, no inherited fitness difference, births/deaths or geographical structure. Rates and trajectories are authored, not fitted ancient-DNA data. The ancestry label is a bookkeeping category; no modern ethnic identity or genomic inference is calculated. Tiny changes below binary 64 resolution are disclosed.`,
deps: ["bighist-5.3"],
refs: ["Haak et al.2010, PLOS Biology8:e1000536, abstract and study scope; supplied replacement/conversion recurrences"],
links: {"source": "https://journals.plos.org/plosbiology/article?id=10.1371/journal.pbio.1000536"},
see: [],
verify: false,
viz: widget5
},
{
num: "5.6",
kind: "Hypothesis",
name: "Continental axes and the spread of crops (contested)",
statement: String.raw`The continental-axis hypothesis proposes that ecological similarities along latitude can facilitate crop transmission. Its historical causal strength is contested; continental orientation alone cannot establish rates, adaptation costs or outcomes.

The widget tests a much narrower mathematical statement: **chosen anisotropic diffusion** produces unequal spatial scales. For positive coefficients $D_x,D_y$, a Gaussian kernel has relative-density contours
$$ {x^2\over 4 D_xt}+{y^2\over 4 D_yt}=\ell,$$
with axis ratio $\sqrt{D_x/D_y}$ for $t>0$. This conditional model is not empirical confirmation of a continental explanation.`,
idea: String.raw`Substituting $x=\sqrt{4 D_xt\ell}\cos\theta$ and $y=\sqrt{4 D_yt\ell}\sin\theta$ makes the contour equation equal $\ell$. Direct differentiation of $t^{-1}\exp[-x^2/(4 D_xt)-y^2/(4 D_yt)]$ verifies the anisotropic diffusion equation away from $t=0$. The chosen diffusivities encode an assumed directional difference; they do not explain why actual crops and routes would have those coefficients. Isotropy returns a circle. At zero elapsed time the plotted contour collapses and the smooth kernel formula does not apply.`,
caption: String.raw`Vary both directional coefficients and elapsed time. Compare the computed ellipse with an isotropic reference circle; changing which coefficient is larger reverses the preferred axis rather than enforcing a historical east–west advantage.`,
scope: String.raw`Authored infinite-plane constant-coefficient contour model; no actual continental boundary, crop-adaptation experiment or measured spread dataset. The original continental-axis exposition and a modern 2024 test body were not independently read. The historical source uncertainty remains flagged. The plotted contour uses relative density, not an observed distribution of settlements.`,
deps: ["bighist-5.2", "pma-5.3", "pma-5.5"],
refs: ["Supplied anisotropic contour calculation; continental-axis hypothesis as qualified context; historical evidence not independently verified"],
links: {"source": "https://doi.org/10.1017/ehs.2023.34"},
see: [],
verify: true,
viz: widget6
},
{
num: "5.7",
kind: "Phenomenon",
name: "The Neolithic demographic transition",
statement: String.raw`The Neolithic demographic transition is studied with archaeological proxies, not directly observed prehistoric birth registers. Downey and colleagues' 2014 European reanalysis uses a juvenility index
$$J={N_{5\text{–}19}\over N_{5+}},$$
excluding ages 0–4. They retained 101 cemeteries under stated dating, sample-size and context criteria. A larger juvenile fraction can support demographic interpretations under additional assumptions, but preservation, age assignment, mortality and cemetery accumulation also matter.`,
idea: String.raw`Let recovered juvenile and adult counts be $j,a$ and chosen inclusion probabilities $p_j,p_a>0$. Inverse-probability correction gives the illustrative proportion
$$J_{\rm adj}={j/p_j\over j/p_j+a/p_a},$$
$$J_{\rm adj}={jp_a\over jp_a+ap_j}.$$
Equal inclusion leaves the observed proportion unchanged; unequal inclusion can change it greatly. Neither formula alone identifies fertility or a population-growth rate. With $j+a=0$, the proportion is undefined rather than zero. The published median summaries are reference markers, not observations generated by this count editor.`,
caption: String.raw`Edit the two eligible age-class counts and their chosen inclusion probabilities. Compare recovered and implied counts, then compare the observed and corrected proportions with the separately labelled published median summaries.`,
scope: String.raw`Counts and inclusion rates below are authored, not a transcription of a named cemetery. No individuals aged 0–4 enter this denominator. No confidence interval or vital-rate reconstruction is inferred from the toy counts. Published 2014 median Mesolithic .1641 and Neolithic .2683 are sample summaries with the source's preservation and dating limitations, not universal populations.`,
deps: ["bighist-5.2"],
refs: ["Downey et al.2014, PLOS ONE9:e105730, Cemetery Analysis and Results"],
links: {"source": "https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0105730"},
see: [],
verify: false,
viz: widget7
},
{
num: "5.8",
kind: "Hypothesis",
name: "Indo-European expansion: farmers or herders?",
statement: String.raw`Farming dispersals, later steppe migrations and language expansion are different questions. Ancient DNA can identify population relationships among sampled remains, while linguistic descent and material culture require their own evidence. The 2015 Haak study of 69 ancient Europeans found substantial Yamnaya-related ancestry among sampled German Corded Ware people and supported a steppe source for **at least some** European Indo-European languages.

This does not mean an ancestry fraction directly measures language, nor that a single farmer-versus-herder choice settles every branch or region.`,
idea: String.raw`A genetic mixture model is affine: if two explicitly chosen reference profiles are $v,w$, their mixture is $(1-z)v+zw$ for $0\le z\le 1$. Nonnegative coordinates summing to one remain on the simplex. That bookkeeping conclusion is valid without assigning any language. The separate chronology view identifies the particular sampled early-farmer and later Corded Ware contexts discussed in the cited works; it is not a language tree or an estimated universal homeland date.`,
caption: String.raw`Move the authored mixture along a genuine simplex segment, then compare the separate study-context timelines. Reference vectors are fictional; no genetic-to-language calculation is made.`,
scope: String.raw`Mixture reference profiles are authored categories, not sampled genomes, fitted qpAdm coefficients or modern populations. The chronology reflects limited 2010/2015 study contexts, not a complete current reconstruction. Future LING 9.8 is related only, not a proof input.`,
deps: ["bighist-5.2", "bighist-5.5"],
refs: ["Haak et al.2010 PLOS Biology8:e1000536; Haak et al.2015 primary manuscript, abstract and selected results"],
links: {"source": "https://arxiv.org/abs/1502.02783"},
see: ["ling-9.8"],
verify: false,
viz: widget8
}
]};
