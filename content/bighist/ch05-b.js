import { widget9, widget10, widget11, widget12 } from './ch05.ui.shared.js';
export default {collection:'bighist',chapter:5,items:[
{
num: "5.9",
kind: "Event",
name: "Cities, writing and the first states",
statement: String.raw`Early cities, writing and states did not emerge at one universal population threshold. The Metropolitan Museum's Uruk account describes monumental buildings and administrative pictographs around 3200 BCE; that is historical evidence about a particular region and period.

The widget supplies a separate resource-accounting question: under chosen harvest, losses and subsistence requirements, how much surplus could support non-food-producing work? A feasible budget is neither a sufficient cause nor a historical date for urban institutions.`,
idea: String.raw`With $H$ households, chosen harvest $y$ per household and loss fraction $\lambda$, net resources are $Hy(1-\lambda)$. Each household needs one resource unit, so
$$\delta=y(1-\lambda)-1,$$
$$S=H\max\{\delta,0\}.$$
Allocating a fraction $q$ of surplus to specialists leaves $(1-q)S$ in reserve; each model specialist consumes one unit. Gross harvest equals losses plus supplied subsistence plus both surplus uses. This balance explains a constraint, not the historical necessity of taxation, writing or centralized government. TECH 3.6 supplies the separately written administrative-writing context.`,
caption: String.raw`Change household count, chosen productivity, storage loss and surplus allocation. Trace the actual resource flows and shortfall; no population slider automatically creates a city, writing system or state.`,
scope: String.raw`Authored resource units per household-year; none are calibrated Uruk yields, ancient tax rates or actual populations. Specialists are consumption-equivalent units, not reconstructed professions. Subsistence has priority in this chosen rule; shortages are explicit. Very small positive shortfalls can coexist with an unchanged rounded total and are reported separately.`,
deps: ["bighist-5.7", "tech-3.6"],
refs: ["Metropolitan Museum, Uruk: The First City2003; supplied household resource balance"],
links: {"source": "https://www.metmuseum.org/essays/uruk-the-first-city"},
see: [],
verify: false,
viz: widget9
},
{
num: "5.10",
kind: "Phenomenon",
name: "Settlement scaling with population",
statement: String.raw`Settlement scaling is an estimated relation between archaeological proxies, not a universal causal law. Ortman and colleagues'2014 Basin of Mexico analysis reports sublinear fitted area–population relations for four cultural periods. The explorer uses their **published fit summaries**, not fabricated individual observations.

For a selected fitted curve $A=aN^\beta$, area is in hectares and $N$ is estimated population. An exponent below one means density grows along that fitted relation; it does not prove every large settlement is denser than every small one.`,
idea: String.raw`Taking logarithms gives $\log A=\log a+\beta\log N$, so the elasticity is $d\log A/d\log N=\beta$. Density is $N/A=N^{1-\beta}/a$: doubling population multiplies area by $2^\beta$ and density by $2^{1-\beta}$. The source's population estimates combine survey methods and uncertain boundaries. Its reported exponent confidence interval is not a joint confidence band for arbitrary $a,\beta$ pairs or an interval for an individual site's area.`,
caption: String.raw`Choose period and fitting method. Compare the actual published fitted power law with a proportional reference, or inspect the reported exponent intervals. Population probes above a period's reported maximum are explicitly marked extrapolation.`,
scope: String.raw`Actual Table 1 OLS/MLE summaries and counts were read from the official original-resolution table image. Raw site records were not retrieved and no observed scatter is invented. Curves evaluate the published model; constant-density comparison is authored and matched at 1000 people. The source excludes particular settlement types and areas below 1 ha. No universal exponent or deterministic area-to-population inversion is asserted.`,
deps: ["bighist-5.9", "pma-5.5"],
refs: ["Ortman et al.2014, PLOS ONE9:e87902, methods§§3.1–3.2 and Table1"],
links: {"source": "https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0087902"},
see: [],
verify: false,
viz: widget10
},
{
num: "5.11",
kind: "Phenomenon",
name: "The sizes of empires over time",
statement: String.raw`Empire size histories are dated estimates of territorial control, with uncertain boundaries, incomplete coverage and choices about continuity. Taagepera's 1978 study gives explicit area estimates and ranges for early states. This explorer shows selected Egyptian and Hittite entries from its Tables 1 and 4, in **million square kilometres**, with their reported uncertainty.

The selected series is not a complete global history or evidence that all empires follow one smooth growth law.`,
idea: String.raw`A point is an estimate at its stated date. To make an editable numerical summary, the widget explicitly joins neighbouring selected points linearly. On a segment of duration $\Delta t$ and endpoint areas $A_0,A_1$, its area-time integral is
$$\int A(t)\,dt=\Delta t\,{A_0+A_1\over 2}.$$
This is exact for the declared interpolation, not proof of the unobserved historical path. Reported area ranges are retained; they are not automatically statistical confidence intervals. Area-time is only a territorial-duration summary, not a measure of cultural value or historical causality.`,
caption: String.raw`Select one published series, choose a date fraction and switch the area scale. Points remain the source estimates; the selected value and accumulated area-time are explicitly interpolated between them.`,
scope: String.raw`Selected pre-read 1978 table entries only; no latest boundary reconstruction or complete largest-empire envelope. Historical identity and control are coding choices. One Mm² equals 10⁶ km²; the paper's erroneous printed square-mile conversion is not copied. Source definitions and numeric text were read, but original table pixels were not verified; this text-only numerical provenance retains a source flag. Zero codes indicate no counted independent entity in that source, not zero land; gaps are not silently recoded as zero.`,
deps: ["bighist-5.9"],
refs: ["Taagepera1978, Social Science Research7:180–196, definitions and Tables1/4; supplied linear interpolation"],
links: {"source": "https://escholarship.org/uc/item/6wf6m5qg"},
see: [],
verify: true,
viz: widget11
},
{
num: "5.12",
kind: "Paper",
name: "Measuring the Rate of Spread of Early Farming in Europe",
paper: {"authors": "A. J. Ammerman and L. L. Cavalli-Sforza", "year": 1971, "title": "Measuring the Rate of Spread of Early Farming in Europe", "venue": "Man (n.s.) 6 (4): 674–688", "doi": "10.2307/2799190"},
introduces: ["bighist-5.4"],
statement: String.raw`Ammerman and Cavalli-Sforza's 1971 paper is associated with measuring early farming's European spread using dated sites and distance. Its original body and original data were not available for verification here; the citation identifies the historical work, not an independently checked original analysis.

The live analysis below is explicitly **a modern supplied regression using the separately read Pinhasi–Fort–Ammerman 2005 supporting data**. It illustrates the methodological role of date convention, origin, regression direction and selection; it does not verify the unread 1971 paper's precise analysis or every conclusion.`,
idea: String.raw`For a fixed sample let $S_{da}=\sum(d_i-\bar d)(a_i-\bar a)$, with analogous $S_{dd},S_{aa}$. The age-on-distance slope is $S_{da}/S_{dd}$, whereas the distance-on-age slope is $S_{da}/S_{aa}$. When both are negative, their speed summaries obey
$$v_{\rm direct}=\rho^2 v_{\rm inverse}.$$
They coincide only for a perfectly linear cloud with $|\rho|=1$. Centering avoids unnecessary cancellation, and residuals retain actual sample scatter. Removing farthest records is a declared sensitivity test, not a justified archaeological exclusion rule. GEOL 2.6 explains why changing calibration convention is different from changing the calendar epoch.`,
caption: String.raw`Choose the supplied origin, date convention, regression direction and number of farthest records omitted. Read the actual retained sample count, both speed summaries and the plotted residuals. The original-source flag remains visible.`,
scope: String.raw`Original 1971 full text and data were unavailable for independent verification. The original-source uncertainty remains visible beside the historical citation. The 2005 data, vintage calibration and three supplied great-circle-distance columns have independent provenance. No 1971 original scatter, historical confidence interval or model-parameter fit is fabricated.`,
deps: ["geol-2.6", "bighist-5.2"],
refs: ["Original1971 bibliography only; Pinhasi et al.2005 TableS1/TextS1 actually read; supplied centered OLS derivation"],
links: {"source": "https://journals.plos.org/plosbiology/article?id=10.1371/journal.pbio.0030410"},
see: [],
verify: true,
viz: widget12
}
]};
