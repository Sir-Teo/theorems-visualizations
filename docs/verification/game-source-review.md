# Game theory source verification — 2026-10-18

Closed **15 of the 19 initially flagged game cards** after reviewing complete relevant primary texts and associated fields. Four flags remain with specific source-access blockers below. Independent mathematical checks do not substitute for inaccessible originals.

## 2.8 Professional mixed strategies

[Palacios-Huerta (2003), *Professionals Play Minimax*](https://www.alvaroriascos.com/teoriajuegos/lecturas/professionals%20play%20minimax.pdf),
*Review of Economic Studies* 70, 395–415. Complete PDF obtained and extracted.
Pages 398–399 give the indifference model; pp. 399–402 give sample construction and
coding; the **unnumbered matrix and frequency table on p. 402** are the source of
the restored defaults:

| Kicker row / keeper column | L: non-natural | R: natural |
| --- | ---: | ---: |
| L: non-natural | 58.30% | 94.97% |
| R: natural | 92.91% | 69.92% |

The old off-diagonals were swapped. L/R are defined relative to the kicker's
strong foot; **centre is grouped with natural**, rather than ignored. The paper's
observed non-natural frequencies are kicker 39.98%, keeper 42.31%; the Nash
predictions are 38.54% and 41.99%. The corrected matrix independently reproduces
those predictions and gives a goal probability of approximately 79.573%.

The initial sample covers 1,417 penalties collected September 1995–June 2000.
The source distinguishes actual no-goal outcomes (including misses) from saves;
the card now does too. Added controls restore the exact source data and move to
the current equilibrium. Each side's dashed guide now uses its own success rate.
Non-rejection of statistical tests is explicitly not presented as proof of exact
equilibrium play. Individual and aggregate equal-success tests, serial-independence
tests and their limitations are discussed on pp. 403–413.

[Walker and Wooders, *Minimax Play at Wimbledon*, complete author manuscript](https://www.johnwooders.com/papers/Wimbledon.pdf),
revised September 10, 1999, §§4–5, provides the contrast: equal win rates receive
support while serves switch too frequently for serial independence. The manuscript
is **not falsely labeled the final 2001 PDF**; [the published article metadata](https://doi.org/10.1257/aer.91.5.1521)
confirms *AER* 91(5), 1521–1538 (2001). Palacios-Huerta's final paper also discusses
this tennis result and its limitations, pp. 398 and 410–411.

Validation: `node tests/verification-game.mjs` passes **2 tests**. An independent
support-enumeration solver agrees with the closed-form mixtures; both players'
deviation gains vanish, and the published rounded frequencies are reproduced.
Native browser tests pass in **both themes**, exercising matrix edits, restore and
equilibrium controls, with pinned local KaTeX 0.16.11. The light screenshot was
inspected for axis/action coding and the separate success-rate guides.

## 3.10 Blackwell approachability

[Blackwell (1956), *An Analog of the Minimax Theorem for Vector Payoffs*](https://msp.org/pjm/1956/6-1/pjm-v6-n1-p01-p.pdf),
*Pacific Journal of Mathematics* 6(1), 1–8. Complete original PDF obtained and read:
p. 2 defines the **uniform tail-probability** guarantee; Theorem 1 on pp. 3–5 uses
conditional expectations and proves almost-sure convergence; Theorem 3 and
Corollary 2 on pp. 6–7 give the closed-convex-set criterion.

Corrected the card's deterministic `D/sqrt(T)` claim for realized random paths:
expected squared distance has the `O(1/T)` bound. Its simulation uses **expected
payoffs of a mixed row action**, for which the displayed deterministic projection
recursion is appropriate. The theorem uses a supremum for a possibly unbounded
target and explicitly requires a nonempty closed convex set.

The numerical checker evaluates only **180 directions**. A failed direction
disproves approachability, but passing samples does not test every direction. The
readout and plot label now state exactly that, instead of claiming a theorem from
the finite sample. A random/cyclic adversary is no longer said to stall outside
every target that some adversary could exclude. The distance/bound comparison
reports what the displayed trajectory actually satisfies at the selected round.

Validation: `VERIFY_IDS=game-3.10 node tests/verification-macro-followup-browser.mjs`
passes in **both themes**, exercising shape, adversary, radius and actual pointer
drag to an excluded target; formula, runtime and blank-canvas checks pass with
KaTeX 0.16.11. `node scripts/check.mjs game-3.10 --static --fail-on-warnings`
reports **one item, zero errors, zero warnings**. Targeted JSON evidence:
`/tmp/atlas-macro-followup-browser-targeted.json`.

## Remaining chapter 3 and chapter 4 review

| Item | Disposition and primary evidence |
| --- | --- |
| 3.4 | Closed. [Gale–Kuhn–Tucker (1951), *Linear Programming and the Theory of Games*, pp. 317–329](https://www.ma.imperial.ac.uk/~ajacquie/IC_Num_Methods/IC_Num_Methods_Docs/Literature/Gale.pdf), complete 13-page chapter read using OCR. Theorem 2 and scalar corollary pp. 322–324 establish duality; §5 p. 326 gives the positive-payoff normalization used in the card; Theorems 6–7 pp. 327–328 qualify the converse reduction. Removed the unsupported October-1947 meeting anecdote. Independent support enumeration verifies the LP solver on rectangular/degenerate examples. |
| 3.6 | **Flag retained for Shapiro1958 rate only.** New [UTA teaching copy of the complete Robinson1951 original](https://ranger.uta.edu/~weems/NOTES6319/PAPERSONE/robinson.pdf), pp296–301, read, including scanned middle proof pages. Theorem p297, eligibility definition and Lemmas2–4 pp298–301 verify simultaneous/alternating variants and convergence; proof description corrected to eligible-interval/submatrix induction. Shapiro1958 DOI10.1002/cpa.3160110408 still yields publisher metadata/challenge HTML rather than its seven-page rate proof. See [bounded follow-up](economics-social-acquisition-followup.md). |
| 3.9 | Closed. [Gross–Wagner, RAND RM-408, *A Continuous Colonel Blotto Game*, 17 June 1950](https://www.rand.org/content/dam/rand/pubs/research_memoranda/2006/RM408.pdf), complete 14 scanned PDF pages read by OCR. Report p. 1 states the weighted sign payoff and continuous budgets; Case II pp. 5–7 treats three fields/equal budgets; pp. 8–11 discuss nonunique continuous optimal distributions. The card is now explicitly a **discrete teaching variant**, without unsupported Borel priority/support claims. Every N=3…12 was exhaustively checked against every pure reply and LP optimum. For N≥4, sort an allocation a≤b≤c; c≥2, so (a+1,b+1,c−2) defeats two fields. Equal budgets preclude losing all three; hence pure security is exactly −1/2. |
| 3.11 | Closed. [Original von Neumann (1928), pp. 295–320, Göttingen scan](https://gdz.sub.uni-goettingen.de/download/pdf/PPN235181684_0100/LOG_0013.pdf), all relevant §I–III and §IV–V source text read following complete OCR. §I pp. 298–302 reduces extensive rules to complete plans/expected payoffs. §II pp. 302–306 has Matching Pennies, Rock–Paper–Scissors and mixed security levels. §III pp. 307–311 proves minimax through successive elimination and a closed-interval/semicontinuity argument. **Corrected the false statement that multiplayer games were left to later work:** §IV pp. 311–316 analyses three-player coalitions and §V pp. 316–320 general coalition values. Removed unsupported priority claims and the vague secondary-source proof description. |
| 4.1 | Closed. [Kuhn (1950), *Extensive Games*, PNAS 36, 570–576](https://europepmc.org/articles/PMC1063244?pdf=render), complete original read. §1 pp. 571–573 gives the finite tree, player/information partitions, chance and payoffs; §2 pp. 573–575 gives complete plans, strategic-form reduction and leaf probability products. The card restricts to singleton information sets and no chance. |
| 4.2 | Closed. Kuhn (1950), Theorem 1 pp. 575–576 explicitly uses the induction device for finite perfect-information games. Modern algorithm spelled out and independently checked by exhaustive unilateral deviations in every subgame over 32 deterministic trees. Historical credit now distinguishes Kuhn's finite-tree proof from Zermelo's original non-repetition argument. |
| 4.3 | Closed. [Zermelo (1913), complete primary-text translation, appendix pp. 10–14 of Schwalbe–Walker](https://ageconsearch.umn.edu/record/263784/files/canterbury-nz-092.pdf) read in full. Original pp. 501–504 defines forcing win/nonloss and finite positions, allowing infinite play as a draw. Card explicitly states the **modern finite-tree formulation**. Removed incorrect “Kálmán” attribution and the unverified claim about a corrected historical proof. Corrected the explanation's reversed losing-position condition. The translation is primary text; surrounding historical discussion is not presented as an original Kalmár paper. |
| 4.4 | Closed. [Selten, *The Chain Store Paradox*, July 1974 working paper no. 18](https://noah.nrw/ubbihs/download/pdf/5133960), §7 pp. 34–37 read completely: definitions of subgames and perfect equilibrium, and the noncredible entry threat. This is **the author's 1974 working paper, not mislabeled the final 1978 publication or 1965 original**. Repaired missing pure SPE at fight-payoff 1 and entrant-payoff 0; exhaustive pure deviations verify all three tie-case profiles. |
| 4.5 | Closed. Kuhn (1950), Theorem 1 pp. 575–576 plus the card's complete induction proof. The equivalence to pure SPE is the modern subgame formulation; Selten's original-author definition above and exhaustive subgame deviation tests check it. |
| 4.6 | Closed. [McKelvey–Palfrey, *An Experimental Study of the Centipede Game*, Caltech working paper 732](https://authors.library.caltech.edu/records/n6131-v8q36/files/sswp732.pdf?download=1), complete relevant introduction, §2 design/figures and §3 outcome tables read. Working-paper pp. 4–5 Figures 1–2 give .40/.10 initial piles and doubling, exactly the card's 10× monetary scaling; pp. 6–8 support passes in laboratory play. The card displays a **level-k model, not experimental data**. Corrected the assertion that a deeply reasoning player alone must stop at node 1: the outcome depends on both levels. Rosenthal's founding credit is bibliographic; the source supporting the actual displayed model is McKelvey–Palfrey. |
| 4.7 | Closed. [Fehr–Schmidt (1999), *A Theory of Fairness, Competition, and Cooperation*](https://web.stanford.edu/~niederle/Fehr.Schmidt.1999.QJE.pdf), full primary paper obtained; complete relevant §§II–III.A pp. 820–828 read. Eq. (2) p. 822 gives two-person utility; Proposition 1 p. 826 gives acceptance threshold α/(1+2α); p. 825 footnote 8 gives the smallest-unit second pure SPE. Card now states β=0 for its envy-only specialization and labels the accept-at-zero tie rule. Removed an erroneous +0.5 continuity correction for **continuous normal thresholds**; at the population mean acceptance is now exactly 1/2. The Guth1982 original itself was inaccessible (ScienceDirect403, Levine503); no numerical historical experimental results from it are asserted here. |
| 4.8 | **Flag retained.** Selten1974 §§1,7–8 pp. 1–5,34–39 fully verifies complete-information payoffs and unravelling. The reputation recursion is independently validated for entrants' and weak incumbent's one-shot deviations, on/off path, including exact threshold beliefs. However [Kreps–Wilson1982](https://www.dklevine.com/archive/krepwilson.pdf) returns HTTP503 and the publisher supplies only access-limited text; a complete original for the claimed Kreps–Wilson/Milgrom–Roberts historical reputation resolution has not been read. |
| 4.9 | Closed. Kuhn1950 §§1–3 pp. 571–576: information partition, complete plans, mixed/behaviour strategies, product leaf probabilities and perfect recall. Its rank-partition convention is more restrictive than later absent-minded models; that later example is separately sourced below. |
| 4.10 | Closed. Kuhn1950 Theorem 2 pp. 575–576 states equivalence; [Aumann1964, *Mixed and Behavior Strategies in Infinite Extensive Games*](https://www.ma.huji.ac.il/raumann/pdf/Mixed%20and%20Behavior.pdf), complete relevant definitions/§8 proof pp. 503–520 of collected-works reprint read. §8 gives conditional probabilities and proves equivalence **against every opponent strategy**. Corrected the false assertion that mixed-plan coordinates are independent; factorization uses the chain rule. Also read [Piccione–Rubinstein1997, *On the Interpretation of Decision Problems with Imperfect Recall*](https://arielrubinstein.org/papers/53.pdf), §§1–4 pp. 3–11, including the 0/4/1 driver and independent randomization on each visit. Planning payoff 4p−3p² maximizes at p=2/3, value4/3, versus pure/mixed value1. Tests include correlated plans, zero-probability information sets, tiny reach probabilities, chance and all pure opponent plans. |
| 4.11 | **Flag retained.** [Gale1979, *The Game of Hex and the Brouwer Fixed-Point Theorem*, pp. 818–827](https://cms.dm.uba.ar/academico/materias/2docuat2012/calculo_avanzado/brouwerhex.pdf/download) obtained and complete relevant §2 pp. 818–822 read, verifying board rules, Hein1942/Nash1948 attribution and no-draw theorem. [Gale1974 Chomp original](https://www.tandfonline.com/doi/pdf/10.1080/00029890.1974.11993683) returns403; correct [JSTOR2319446](https://www.jstor.org/stable/2319446) PDF also403. Chomp original-source attribution and its presentation remain open; generic search snippets were rejected. |
| 4.12 | Closed. [Bouton1901, *Nim, A Game with a Complete Mathematical Theory*, pp. 35–39](https://paradise.caltech.edu/ist4/lectures/Bouton1901.pdf), complete original read: Theorems I–II pp. 36–37 and §5 arbitrary heaps p. 38. [Sprague1935, *Über mathematische Kampfspiele*, pp. 438–444](https://www.jstage.jst.go.jp/article/tmj1911/41/0/41_0_438/_pdf), complete original read: Satz I pp. 439–440 defines mex rank; Satz II p. 441 reduces disjoint sums to Nim; Satz III pp. 441–442 proves XOR. [Grundy1939, *Mathematics and Games*, pp. 6–8](https://oeis.org/A002188/a002188.pdf), complete two-image scan obtained/rotated for OCR and read; equations (2)–(3) give rank characterization and addition. Normal-play finite impartial hypotheses match. |
| 4.13 | **Flag retained.** [Hales–Jewett original AMS PDF](https://www.ams.org/journals/tran/1963-106-02/S0002-9947-1963-0143712-1/S0002-9947-1963-0143712-1.pdf) and alternate AMS path return403; JSTOR1993764 PDF returns HTML; [NASA original-report record](https://ntrs.nasa.gov/citations/19620001495) API is explicitly **METADATA_ONLY, downloads=[]**, and its anticipated PDF path404. Thus neither that full primary proof nor Patashnik1980 Qubic original has been read. Fixed readout so an arbitrary unbalanced two-colouring is not asserted to be a legal drawn alternating-turn game. |

The inaccessible Kuhn1953 publisher endpoint also returned an empty response. It
is not used as if read: Kuhn1950's actual original statements and Aumann1964's
complete primary proof support the closed definitions/theorem instead.

## Validation and prerequisites

`node tests/verification-game.mjs`: **9/9 pass**: independent bimatrix support
enumeration, exhaustive pure deviations/subgames, correlated Kuhn plans,
Blotto replies for N=3…12, one-shot reputation incentives and known normal-CDF
values. `node scripts/check.mjs game/3 game/4 --static --fail-on-warnings`:
**23 items, zero errors/warnings**. Native browser evidence is in
`/tmp/atlas-game-browser.json` and its focused rerun: one worker, both themes,
pinned local KaTeX0.16.11, actual sliders/toggles/buttons. The main run passed 30/34 groups; all four harness-only failures (disabled previous-step button and multiline KaTeX regex) passed after repair. The focused rerun also rechecked the changed normal-threshold card: 6/6 groups passed. Thus all 34 distinct card/theme groups have passing native evidence.
Screenshots are under `/tmp/atlas-game-shots/`; the dark entry-game tie case was
visually inspected, showing all three pure SPE highlighted and listed.

Added only used cross-field prerequisites, with syllabus metadata synchronized:
Blotto→LP duality (`algo-11.19`, the LP actually computed); information sets→
independence (`prob-2.1.1a`, product probabilities); Kuhn→conditioning
(`stat-2.1`, the source's conditional construction). Existing projection/minimax
links remain. A direct module census after this batch gives game **14 written
cards with cross-field prerequisites, 14 edges, 12 distinct targets**; full
syllabus **33 cards,34 edges,28 targets**. These counts include all written files,
not just the reviewed chapters, and do not establish the master gate by themselves.

The follow-up cross-field audit also records `game-3.11 → pma-4.16`: the original minimax proof takes attained extrema of continuous functions over compact probability sets (1928 §III), before its final interval/semicontinuity argument. This is an actual proof prerequisite, not an analogy.
