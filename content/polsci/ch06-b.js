import * as U from './ch06.ui.shared.js';
export default {collection:'polsci',chapter:6,title:'Electoral systems and party systems',items:[
{
num:"6.6",
kind:"Definition",
name:"Effective number of parties (Laakso–Taagepera)",
statement:"For nonnegative party shares summing to one, the **effective number of parties** is\n$$N_{\\rm eff}=\\frac{1}{\\sum_i p_i^2}.$$\nUse vote shares for the effective electoral count and seat shares for the effective legislative count. The same convention must be kept across comparisons. With unnormalized weights $w_i$, use $(\\sum_iw_i)^2/\\sum_iw_i^2$; an all-zero vector has no defined index.",
idea:"Two independent labels sampled with probabilities $p_i$ coincide with probability $\\sum_i p_i^2$. Thus the index is the reciprocal concentration, not the number of labels with positive mass. For $k$ equal parties, it equals $k$; merging two parties increases concentration by $2p_ip_j$, weakly reducing the effective count. Also $\\sum p_i^2\\le1$ and expanding $\\sum_i(p_i-1/k)^2\\ge0$ gives $\\sum p_i^2\\ge1/k$, so $1\\le N_{\\rm eff}\\le k$. The formula weights large parties more heavily without discarding small parties.",
caption:"Party-share bars and squared-share contributions respond to edited integer counts. Equal-party and zero-total presets expose normalization and the undefined boundary; the readout gives the coincidence probability and its reciprocal.",
scope:"All party categories in the input are included and renormalized; unlike some dataset conventions no others category is omitted. Fictional integer counts, not observed election data. The index is descriptive; independent label sampling explains its algebra and does not assume voters themselves are independent.",
deps:["polsci-6.1"],
refs:["Armingeon etal, Comparative Political Data Set1960–2017 codebook update2019, printed9, effpar_ele/effpar_leg"],
viz(v){U.effective(v);}
},
{
num:"6.7",
kind:"Phenomenon",
name:"The cube law of seats and votes",
statement:"The **cube law** is a seats–votes heuristic often written as an approximate relation between two-party odds. The displayed authored family makes that relation exact by definition:\n$$\\frac{S}{1-S}=\\left(\\frac{p}{1-p}\\right)^k,$$\n$$S_k(p)=\\frac{p^k}{p^k+(1-p)^k}.$$\nChoosing $k=3$ gives cube odds; it does not make an empirical universal law. At $p=0,1$ use the continuous endpoints.",
idea:"Dividing numerator and denominator by $(1-p)^k$ yields the odds identity. At $p=1/2$, symmetry gives $S=1/2$ and differentiation gives slope $k$. The case $k=1$ is proportional; larger $k$ steepens the midpoint response. Actual finite districts instead produce a step function: with declared swing thresholds $t_j$, the fraction won is the number with parameter $p\\ge t_j$ divided by the number of districts. There is no algebraic reason for that staircase to equal the smooth cube curve. Geography, turnout, third parties and the district distribution can all invalidate a proposed fit.",
caption:"Compare a continuously adjustable authored odds-power family with the actual seat staircase of eight declared threshold districts. The same horizontal parameter selects both examples; neither curve is claimed fitted to an observed election.",
scope:"The smooth family interprets p as a national two-party vote fraction. The separate threshold example uses p as a uniform swing parameter and does not reconstruct national vote totals from district ballots. Exponents and thresholds are chosen illustrations. No normal-swing simulation is claimed to imply exponent3, and no historical dataset or fitted coefficient is supplied. Positive values below binary64 range are disclosed.",
deps:["polsci-6.1"],
refs:["Nuffield College, David Butler Archive, Cube rule, actual institutional history and two-party caveat; self-contained odds-family algebra and finite threshold count"],
viz(v){U.cube(v);}
},
{
num:"6.8",
kind:"Definition",
name:"Gallagher’s disproportionality index",
statement:"For vote and seat fractions $v_i,s_i$ over the same party inventory, **Gallagher’s least-squares disproportionality index** in percentage points is\n$$G=100\\sqrt{\\frac12\\sum_i(v_i-s_i)^2}.$$\nBoth vectors must be normalized separately to total one. With percentage shares as inputs, omit the outer100. This is not the root mean square divided by the number of parties.",
idea:"Compute each party’s seat–vote gap, square it, sum, halve, and take the root. Swapping vote and seat vectors does not change the index; exact equality yields zero. Nonnegative shares summing to one imply $\\sum(v_i-s_i)^2\\le2$, hence $0\\le G\\le100$. The index records the magnitude of mismatch, not which party benefits or whether an allocation satisfies other fairness properties. Zero total votes or no allocated seats prevents normalization and makes the index undefined.",
caption:"Allocate seats by either divisor rule to fictional party totals. Separate vote and seat fraction panels and the live percentage-point gaps show exactly what enters the index; house size and ties can change it discretely.",
scope:"Fictional counts, common party inventory, no ignored others category, no real-election rankings. The formula is supported by the primary CPDS methods codebook. The original Gallagher1991 body was not obtained and is not claimed read. Zero bars accompany explicitly undefined zero-total indices.",
deps:["polsci-6.2"],
refs:["Armingeon etal, Comparative Political Data Set1960–2017 codebook update2019, printed10, dis_gall"],
viz(v){U.disproportion(v);}
},
{
num:"6.9",
kind:"Method",
name:"Mixed-member proportional systems",
statement:"**Mixed-member proportional** designs combine district representatives with list seats intended to compensate for district disproportionality. Their threshold, entitlement, overhang and leveling rules vary. This authored fixed-base variant computes national D’Hondt entitlements $e_i$ for a base house $H$, retains district wins $d_i$, and sets\n$$\\ell_i=\\max(0,e_i-d_i),$$\n$$h_i=\\max(0,d_i-e_i).$$\nThere is no leveling compensation for other parties.",
idea:"If positive party votes fill the base allocation, $\\sum e_i=H$. Each party’s final seats are $d_i+\\ell_i=\\max(d_i,e_i)=e_i+h_i$. Therefore final house size is $H+\\sum h_i$. If no party has positive votes, base entitlements remain vacant; district wins are still retained and the formula becomes final seats equal district seats. Retention can leave the final result disproportionate: describing a top-up intention does not guarantee exact proportionality when overhang is uncompensated.",
caption:"Change separate fictional party-list totals and district A/B wins. Base entitlement bars are compared with stacked final seats: dark district seats plus pale list seats. The readout reports every top-up, overhang and the resulting house size.",
scope:"This is a declared teaching design, not a claim about any current country’s law. Base12–30, district A/B wins0–6 each, no C district seats, no threshold, no leveling and separate ballots. Fixed priority divisor ties and all-zero eligibility follow6.2. District seats never exceed the base in this control domain.",
deps:["polsci-6.2"],
refs:["Electoral Commission, How votes are counted, additional member overview; self-contained authored overhang accounting with6.2"],
viz(v){U.mixed(v);}
},
{
num:"6.10",
kind:"Paper",
name:"Les partis politiques",
statement:"Maurice Duverger’s **Les partis politiques** (1951; English translation1954) is the historical reference associated with the mechanical and psychological account of plurality and party systems. The original book body is unavailable in this audit. The following finite comparison is an authored modern illustration, not a reconstruction of the original evidence, prose or proof.",
idea:"Hold district ballots fixed to compare the mechanical seat rules, using the exact plurality definition1.2 and allocation6.1. Then introduce a separate declared switch of some C ballots to A or B and recount. The initial ballots, moved ballots and resulting seats are observable model quantities. The two comparisons answer different questions: changing the conversion rule at fixed votes versus changing votes under a fixed conversion rule. Neither calculation establishes what real voters believe, whether switching is optimal, nor a necessary reduction to two parties. The original bibliographic relationship to6.4 is retained without claiming its body has been verified.",
caption:"Inspect two explicitly separated mechanisms with fictional districts and a chosen switching percentage. No published election series or script that guarantees two survivors is presented. The original citation and access uncertainty remain visible.",
scope:"Original Archive catalogue/preview only; no original body read, no alternate recovery. The original body remains unverified. Modern Cox publisher summaries are contextual support for the qualified coordination interpretation. All numerical rows and responses are authored, with exact integer ballot conservation.",
deps:["polsci-6.1", "polsci-1.2"],
refs:["Cox1999 actual abstract (modern context); Duverger1951 bibliographic record, original body unavailable"],
verify:true,
paper:{"authors": "Maurice Duverger", "year": 1951, "title": "Les partis politiques", "venue": "Paris: Armand Colin (English trans. Political Parties, London: Methuen, 1954)", "url": "https://archive.org/details/politicalparties0000duve"},
introduces:["polsci-6.4"],
viz(v){U.mechanism(v,true);}
},
]};
