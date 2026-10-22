import * as U from './ch06.ui.shared.js';
export default {collection:'polsci',chapter:6,title:'Electoral systems and party systems',items:[
{
num:"6.1",
kind:"Definition",
name:"Single-member districts and proportional representation",
statement:"A **single-member plurality district** elects the candidate with most votes in that district; a majority is unnecessary. A list **proportional representation** rule allocates several seats from party vote totals. District plurality and nationwide PR can return different seat vectors even from the same ballots. Proportionality is an aim, not exact equality: integer seats, district magnitude, eligibility and allocation rules matter.",
idea:"Count the largest entry of each district row, using the declared priority on a tie. Summing these winners gives district seats. Alternatively sum the columns and run a specified multi-seat allocation on national totals. Taking a maximum does not commute with summing rows; concentrating support can change district seats while preserving national totals. Neither procedure alone determines how voters would respond to a different rule.",
caption:"Edit fictional district vote rows. Compare the actual district winners and seat hemicycle with nationwide D’Hondt at the same house size. A concentrated-support preset changes geography; zero-ballot districts remain vacant.",
scope:"Authored integer ballots, up to12 districts and2–4 parties. Fixed A-before-B tie priority; no eligibility threshold. Zero ballots do not elect a candidate. The country, districts and results are fictional. An identical-ballot comparison isolates a mechanical effect and holds strategic responses fixed.",
deps:["polsci-1.2"],
refs:["Electoral Commission, How votes are counted: first-past-the-post and list PR; Senedd April2024 Memorandum printed37 §§126–127"],
viz(v){U.districts(v);}
},
{
num:"6.2",
kind:"Method",
name:"D’Hondt and Sainte-Laguë seat allocation",
statement:"For party votes $v_i\\ge0$, highest-averages allocation starts at $s_i=0$ and repeatedly awards one seat to an eligible party maximizing\n$$\\frac{v_i}{d(s_i)}.$$\nD’Hondt uses $d(s)=s+1$; **standard Sainte-Laguë** uses $d(s)=2s+1$. A tie rule and treatment of zero-vote parties complete the algorithm.",
idea:"Before each award compare $v_i d(s_j)$ and $v_j d(s_i)$, so integer cross-products avoid rounded quotient ties. Increment only the winner’s seat count; its next quotient falls while the others remain unchanged. Equivalently merge each party’s decreasing quotient sequence and take the largest $H$ eligible entries, with declared priority at equal values. Induction on the award number proves this equivalence and guarantees exactly $H$ seats when at least one vote is positive. There is no party-independent promise of exact proportionality or of a strict advantage in every individual example.",
caption:"Select a rule and house size, then step through the exact award sequence. The quotient table shows the divisors used for that award and the current seat bars. Edit party totals or use an all-zero profile.",
scope:"Integer counts up to10⁶ per party,1–6 parties,0–100 seats. Zero-vote parties are ineligible; all-zero totals leave seats vacant. Ties favor A, then B, etc. This differs from the lots described in the historical Senedd source; standard Sainte-Laguë here has first divisor1, not1.4. Quotient displays are rounded, decisions are exact BigInt comparisons.",
deps:["polsci-6.1"],
refs:["Senedd Cymru, Senedd Cymru (Members and Elections) Bill Memorandum April2024, printed37 §§126–127"],
viz(v){U.divisors(v);}
},
{
num:"6.3",
kind:"Method",
name:"Single transferable vote",
statement:"**Single transferable vote (STV)** uses ranked ballots to fill several seats. This teaching variant fixes the integer Droop quota\n$$Q=\\left\\lfloor\\frac{V}{H+1}\\right\\rfloor+1$$\nfrom the initial nonblank valid ballot count $V$. Each ballot supports its highest continuing preference. An elected candidate keeps quota weight; an eliminated candidate keeps none. Surplus and elimination transfers follow the exact rules below.",
idea:"Elect the largest continuing tally $t\\ge Q$, with A-first ties, and multiply every weight currently held by that candidate by $(t-Q)/t$ before transfer. Thus precisely $Q$ is retained. If no tally reaches quota, eliminate the smallest tally, with E-first ties, and transfer its full current weights. A weight with no continuing preference exhausts. Remove one candidate per ordinary round, so the process terminates. If continuing candidates are no more numerous than unfilled seats, elect all of them and retain their current weights without another transfer. Stop when seats fill; leftover continuing weight remains explicitly unallocated. At every step,\n$$V=R+E+C.$$\nHere R is retained weight, E exhausted weight, and C continuing weight.\nPartial rankings, not just first choices, therefore affect the result.",
caption:"Edit grouped ballot counts and rankings indexed0–4 for A–E. Step through exact rational transfers; two panels distinguish continuing and retained weights. Exhaustion and conservation remain visible in the live readout.",
scope:"Authored exact-rational weighted inclusive-Gregory variant: at most20 grouped rows,0–10000 ballots per row, five candidates,0–5 seats. Empty rankings are blank and excluded from V. Scottish2011 rule49 instead rounds transfer values down to five decimal places, and has further count/tie details; this is not a statutory Scottish or Australian count reproduction. Zero valid ballots elect nobody. Early stopping, election priority, elimination priority and unused weights are specified above.",
deps:["polsci-1.4", "polsci-6.2"],
refs:["Scottish Local Government Elections Order2011 SSI2011/399 rules47–49,51,53; AEC, Exhaustion of preferences under the Senate’s new electoral system,2016 printed4/11 (weighted versus unweighted Gregory)"],
viz(v){U.transferable(v);}
},
{
num:"6.4",
kind:"Phenomenon",
name:"Duverger’s law",
statement:"**Duverger’s law** names a tendency toward two-party competition under single-member plurality, rather than a universal implication from the seat formula alone. A **mechanical effect** is the conversion of fixed votes into seats. A **psychological effect** concerns responses by voters or entrants to anticipated chances. District-level coordination and the number of national parties are different questions.",
idea:"For fixed ballots the plurality/PR comparison is a deterministic calculation (6.1). To study a behavioral response one must add beliefs, preferences and an update or equilibrium model (3.7); plurality alone does not supply them. Here a specified number of C ballots switches to a declared A or B destination in each fictional district. Recounting computes the consequences but does not prove that the switch is optimal or that further switches converge. C can retain votes or win seats under other geographic profiles. Cox’s review separates within-district coordination from coordination across districts.",
caption:"Separate a fixed-ballot mechanical comparison from an explicitly imposed switching experiment. The switching percent and chosen destination change actual district votes; both plurality and national D’Hondt seats are recomputed. No historical country markers or invented observations are shown.",
scope:"All five districts and response rules are authored. Switching moves floor(C×percent/100) ballots in each district; no ballots disappear. This is not a best-response process, a forecast, or proof of extinction. Cox1999 abstract is the modern source for the qualified coordination interpretation; original Duverger body is unavailable (6.10).",
deps:["polsci-6.1", "polsci-3.7"],
refs:["Cox1999, Electoral Rules and Electoral Coordination, Annual Review of Political Science2:145–161, actual publisher abstract; Cox1997 concluding chapter publisher summary"],
viz(v){U.mechanism(v);}
},
{
num:"6.5",
kind:"Theorem",
name:"Cox’s M + 1 rule",
statement:"Cox’s **$M+1$ rule** is a conditional district-level coordination claim: under the relevant electoral institutions and voter assumptions, Duvergerian equilibria have **at most** $M+1$ viable competitors for district magnitude $M$. It is not an assertion that any allocation algorithm or voter adjustment reaches exactly $M+1$. The publisher summaries emphasize current-election motivation, information about relative chances, and institution-specific qualifications. Full original hypotheses and proof have not been verified here.",
idea:"The interactive calculation establishes a separate, limited finite result. Fix other voters’ counts, an SNTV rule electing the top $M$ candidates with a fixed priority tie rule, and one voter with additive committee utilities $(4,3,2,1,0)$. Enumerate all five possible single votes. For each, recompute the winning committee and sum its utilities. A vote is a best response exactly when its enumerated utility is maximal; a positive displayed gain is a profitable deviation from the selected vote. This follows by exhausting that voter’s finite action set. It neither certifies a joint Nash equilibrium of all voters nor derives Cox’s general bound; equal or nonpivotal support need not disappear.",
caption:"Vary SNTV magnitude and a voter’s current action while keeping the other voters fixed. The actual five possible winning committees, utilities and deviation gains are computed. A tied-rival preset exposes the role of tie priority; the M+1 value is a conditional reference, not a forced simulation outcome.",
scope:"The full original hypotheses/proof remain unverified. Actual Cox1997 publisher concluding summary and Cox1999 abstract support only the qualified interpretation stated, not a complete formal hypothesis list. The authored finite SNTV example has five candidates and M=1–3, single nontransferable votes, complete information, A-first ties, and additive utilities. Its positive-support count is not an equilibrium viability estimator.",
deps:["polsci-6.4"],
refs:["Cox1997, Making Votes Count, Some concluding comments on strategic voting, publisher summary; Cox1999, Electoral Rules and Electoral Coordination, actual abstract"],
verify:true,
links:{"source": "https://www.annualreviews.org/content/journals/10.1146/annurev.polisci.2.1.145"},
viz(v){U.cox(v);}
},
]};
