// Syllabus — Political Science & Social Choice (curated course; see collection.js for references)
//
// Sources consulted (research pass, Oct 2026):
//   Reference TOCs
//   - Taylor & Pacelli (T&P), Mathematics and Politics, 2e (2008): 1 Social Choice, 2 Yes–No Voting,
//     3 Political Power, 4 Conflict, 5 Fairness (apportionment), 6 Escalation, 7–12 “More …” of each.
//     Order from catalogue records and the TAMUSA Honors 1300 syllabus (Fall 2025), which lists sections
//     (1.3 voting methods, 1.7 Arrow, 1.8 approval; 3.2–3.5 Shapley–Shubik, EEC, Banzhaf; 3.6 president;
//     5: Hamilton, Alabama paradox, Jefferson, Webster, Hill–Huntington, Balinski–Young).
//     https://apps.tamusa.edu/course-information/syllabi/Fall2025/Honor-1300-Syllabus-Fall2025.pdf
//   - Shepsle, Analyzing Politics, 2e (2010) — TOC not retrieved; cited by topic, not chapter.
//   - Saari, Chaotic Elections! (AMS 2001) — ch. 1 “A Mess of an Election” verified; otherwise cited by book.
//   Courses
//   - Endriss, Computational Social Choice (Amsterdam 2024): voting rules, May, Sen, Arrow,
//     Muller–Satterthwaite, Gibbard–Satterthwaite, apportionment, judgment aggregation (List–Pettit).
//     https://staff.fnwi.uva.nl/u.endriss/teaching/comsoc/2024/
//   - Penn Econ 211 Social Choice Theory: https://www.econ.upenn.edu/sites/default/files/filevault/Econ211Spring2017.pdf
//   - Toronto CSC200 lecture on Arrow, Gibbard–Satterthwaite, May: https://www.teach.cs.toronto.edu/~csc200y/fall/Lectures/L40.pdf
//   - Easley & Kleinberg ch. 23 Voting (median voter, jury theorem, insincere voting):
//     https://www.cs.cornell.edu/home/kleinber/networks-book/
//   Lists
//   - https://en.wikipedia.org/wiki/List_of_paradoxes (voting, no-show, Alabama/new-states/population)
//
// Gaps filled after the comparison: Moulin’s no-show theorem, Sen’s liberal paradox, Muller–Satterthwaite,
// doctrinal paradox and List–Pettit, Plott and McKelvey, setter and veto-player models, Meltzer–Richard,
// swing voter’s curse, Cox’s M+1 rule, effective number of parties, Penrose law, new-members paradox,
// ensemble redistricting, dollar auction and the Richardson arms race.
// Hand-offs: Nash equilibrium, repeated games, bargaining and the Shapley value are in `game` (cited);
// Condorcet’s jury theorem lives here and `soc` builds the wisdom of crowds on it.
export default {
  collection: 'polsci',
  chapters: [
    // ───────────────────────────────────────────────────────────── 1
    {
      n: 1,
      title: 'Voting methods',
      summary: String.raw`A voting method turns a profile of individual rankings into a winner. Plurality, runoffs, instant runoff, the Borda count, Condorcet methods and approval voting each use different information from the ballots, and on the same electorate they can all choose different winners. The chapter builds the shared vocabulary — profiles, pairwise majorities, scoring rules — used throughout the collection.`,
      items: [
        { num: '1.1', kind: 'Definition', name: 'Preference profiles and social choice functions', deps: ['micro-4.3'], refs: ['T&P ch. 1'],
          pic: 'Build an electorate by dragging voter blocs onto the six possible rankings of three candidates; the profile table and the pairwise-majority matrix update as you go.' },
        { num: '1.2', kind: 'Method', name: 'Plurality voting', deps: ['polsci-1.1'], refs: ['T&P ch. 1'],
          pic: 'Count first places in the electorate you built; the winner is highlighted, and a bar shows how small a share of first preferences can suffice with many candidates.' },
        { num: '1.3', kind: 'Method', name: 'Two-round runoff', deps: ['polsci-1.2'], refs: ['T&P ch. 1'],
          pic: 'The top two by plurality advance; ballots of eliminated candidates transfer to their preferred finalist in an animated second count.' },
        { num: '1.4', kind: 'Method', name: 'Instant-runoff voting (Hare)', deps: ['polsci-1.3'], refs: ['T&P ch. 1'],
          pic: 'Repeatedly eliminate the candidate with fewest first preferences and transfer ballots, shown as a Sankey diagram of rounds.' },
        { num: '1.5', kind: 'Method', name: 'The Borda count', deps: ['polsci-1.1'], refs: ['T&P ch. 1', 'Saari'],
          pic: 'Points 2-1-0 for each ranking are tallied per candidate; drag a bloc between rankings and watch each candidate’s score move by exactly the predicted amount.' },
        { num: '1.6', kind: 'Definition', name: 'Condorcet winners and Condorcet methods', deps: ['polsci-1.1'], refs: ['T&P ch. 1'],
          pic: 'The pairwise-majority tournament drawn as arrows between candidates; a Condorcet winner beats every rival, and Copeland and minimax scores are computed when none exists.' },
        { num: '1.7', kind: 'Method', name: 'Sequential pairwise voting with an agenda', deps: ['polsci-1.6'], refs: ['T&P ch. 1'],
          pic: 'Choose the order in which candidates meet in head-to-head votes; the winner of the bracket is computed for every agenda.' },
        { num: '1.8', kind: 'Method', name: 'Approval voting', deps: ['polsci-1.1'], refs: ['T&P ch. 1'],
          pic: 'Each bloc approves its top one or top two candidates (a toggle per bloc); approval totals and the winner change with where voters draw the line.' },
        { num: '1.9', kind: 'Method', name: 'Score voting and majority judgment', deps: ['polsci-1.8'], refs: ['T&P ch. 7'],
          pic: 'Voters grade candidates on a scale; the highest mean (score voting) and the highest median grade (majority judgment) can pick different winners on the same ballots.' },
        { num: '1.10', kind: 'Definition', name: 'Positional scoring rules', deps: ['polsci-1.5'], refs: ['Saari'],
          pic: 'A slider moves the second-place weight from 0 (plurality) through ½ (Borda) to 1 (anti-plurality); the winner path across the slider shows several changes of winner.' },
        { num: '1.11', kind: 'Method', name: 'Kemeny’s rule', deps: ['polsci-1.6'], refs: ['T&P ch. 7'],
          pic: 'Every possible social ranking is scored by its total disagreement with the ballots; the Kemeny ranking minimizes it, shown as a bar chart over the six rankings.' },
        { num: '1.12', kind: 'Phenomenon', name: 'One electorate, many winners', deps: ['polsci-1.2', 'polsci-1.4', 'polsci-1.5', 'polsci-1.6', 'polsci-1.8'], refs: ['Saari ch. 1'],
          pic: 'A five-candidate electorate you can edit is fed to five methods at once; find a profile where all five winners differ, as in Saari’s mess of an election.' },
      ],
    },
    // ───────────────────────────────────────────────────────────── 2
    {
      n: 2,
      title: 'Voting paradoxes and fairness criteria',
      summary: String.raw`Majority rule over three or more options can cycle, so there may be no candidate a majority prefers to every other. Each voting method fails some reasonable criterion: plurality can elect a candidate everyone else beats, instant runoff can punish a candidate for gaining support, and showing up to vote can hurt your favourite. Agenda control, compound issues and aggregation of judgments produce further paradoxes.`,
      items: [
        { num: '2.1', kind: 'Paradox', name: 'Condorcet’s paradox (cyclic majorities)', deps: ['polsci-1.6'], refs: ['T&P ch. 1', 'Shepsle: group decisions'],
          pic: 'Three voters with rankings ABC, BCA, CAB: the majority arrows form a cycle, and dragging any bloc shows how much the profile must change to break it.' },
        { num: '2.2', kind: 'Theorem', name: 'How likely is a Condorcet cycle?', deps: ['polsci-2.1'], refs: ['T&P ch. 7'],
          pic: 'Sample random electorates under the impartial-culture model; the frequency of cycles climbs toward about 9% for three candidates and much higher for more, with single-peaked electorates never cycling.' },
        { num: '2.3', kind: 'Paradox', name: 'Plurality can elect a Condorcet loser (the spoiler effect)', deps: ['polsci-1.2', 'polsci-1.6'], refs: ['T&P ch. 1'],
          pic: 'Two similar candidates split a majority; the plurality winner loses every head-to-head contest, and dropping one similar candidate reverses the result.' },
        { num: '2.4', kind: 'Theorem', name: 'Borda: no Condorcet losers, but Condorcet winners can lose', deps: ['polsci-1.5', 'polsci-1.6'], refs: ['Saari'],
          pic: 'Search random profiles: the Borda winner is never beaten by all others, yet a counter tallies profiles where the Condorcet winner loses under Borda.' },
        { num: '2.5', kind: 'Paradox', name: 'Non-monotonicity of instant runoff', deps: ['polsci-1.4'], refs: ['T&P ch. 7'],
          pic: 'Move some voters to rank the IRV winner higher; the elimination order changes and the winner loses — the Burlington 2009 pattern reproduced on an editable profile.' },
        { num: '2.6', kind: 'Paradox', name: 'The no-show paradox', deps: ['polsci-1.4'], refs: ['T&P ch. 7'],
          pic: 'Add a group of voters who sincerely prefer X to Y: under IRV the outcome switches from X to Y, so they would have done better by staying home.' },
        { num: '2.7', kind: 'Theorem', name: 'Moulin: Condorcet methods must violate participation', deps: ['polsci-2.6', 'polsci-1.6'], refs: ['T&P ch. 7'],
          pic: 'Pick any Condorcet-consistent method from a menu; the page searches four-candidate profiles and displays a concrete no-show counterexample for it.' },
        { num: '2.8', kind: 'Paradox', name: 'Agenda manipulation under a cycle', deps: ['polsci-1.7', 'polsci-2.1'], refs: ['Shepsle: agenda power'],
          pic: 'With a majority cycle, the chair can make any candidate win by choosing the order of votes; the three agendas and their winners are animated side by side.' },
        { num: '2.9', kind: 'Paradox', name: 'The chair’s paradox', deps: ['polsci-1.2'], refs: ['T&P ch. 3'],
          pic: 'Three voters with a cycle, the chair breaking ties: under sophisticated voting the chair ends up with her last choice, computed by eliminating dominated strategies.' },
        { num: '2.10', kind: 'Theorem', name: 'Saari: Borda is the only consistent positional rule', deps: ['polsci-1.10'], refs: ['Saari'],
          pic: 'For each positional weight, compare the ranking of all candidates with rankings after dropping one; only the Borda weight never produces a contradiction, plotted across the slider.' },
        { num: '2.11', kind: 'Paradox', name: 'The Ostrogorski and Anscombe paradoxes', deps: ['polsci-2.1'], refs: ['T&P ch. 7'],
          pic: 'Voters decide several issues through a party vote; a 5×3 table shows the winning party opposed by a majority on every single issue.' },
        { num: '2.12', kind: 'Paradox', name: 'The doctrinal paradox (discursive dilemma)', deps: ['polsci-2.1'], refs: ['T&P ch. 7'],
          pic: 'Three judges vote on two premises and a conclusion; premise-by-premise majority and conclusion majority give opposite verdicts, toggled on a judgment table.' },
        { num: '2.13', kind: 'Event', name: 'Real elections that went wrong', deps: ['polsci-2.3', 'polsci-2.5'], refs: ['Saari ch. 1'],
          pic: 'Reconstructed ballots from Florida 2000 (spoiler), Burlington 2009 (IRV non-monotonicity and a Condorcet winner eliminated) and Alaska 2022, run through each method.' },
      ],
    },
    // ───────────────────────────────────────────────────────────── 3
    {
      n: 3,
      title: 'Axiomatic social choice',
      summary: String.raw`Instead of judging methods one at a time, social choice theory asks which combinations of properties are possible at all. May’s theorem singles out majority rule for two alternatives. With three or more, Arrow’s theorem shows that Pareto efficiency, independence of irrelevant alternatives and an unrestricted domain force a dictator, and Gibbard and Satterthwaite show every reasonable method can be manipulated. Sen’s and List–Pettit’s results extend the impossibilities to rights and to judgments.`,
      items: [
        { num: '3.1', kind: 'Theorem', name: 'May’s theorem', deps: ['polsci-1.2'], refs: ['T&P ch. 1'],
          pic: 'With two alternatives, test candidate rules against anonymity, neutrality and positive responsiveness; only simple majority passes all three, and the failing axiom is flagged for every other rule.' },
        { num: '3.2', kind: 'Definition', name: 'Arrow’s conditions', deps: ['polsci-1.1'], refs: ['T&P ch. 1'],
          pic: 'A checklist panel (unrestricted domain, Pareto, IIA, non-dictatorship) applied live to the method you select, with a counterexample profile shown for each failure.' },
        { num: '3.3', kind: 'Theorem', name: 'Arrow’s impossibility theorem', deps: ['polsci-3.2', 'polsci-2.1'], refs: ['T&P ch. 7', 'Shepsle: group decisions'],
          pic: 'Step through the decisive-coalition proof on three voters: each step shrinks the decisive set until a single dictator is left, with the profiles that force each step displayed.' },
        { num: '3.4', kind: 'Lemma', name: 'Field expansion and contraction of decisive coalitions', deps: ['polsci-3.3'], refs: ['T&P ch. 7'],
          pic: 'A coalition decisive on one pair is shown to be decisive on every pair by an animated chain of profiles, then split in half to show a smaller decisive set.' },
        { num: '3.5', kind: 'Theorem', name: 'Sen’s liberal paradox', deps: ['polsci-3.2'], refs: ['T&P ch. 7'],
          pic: 'Two people and a book (Lady Chatterley): granting each a personal veto plus Pareto creates a cycle, drawn as arrows labelled by which principle produces them.' },
        { num: '3.6', kind: 'Theorem', name: 'Gibbard–Satterthwaite theorem', deps: ['polsci-3.3'], refs: ['T&P ch. 7'],
          pic: 'Choose a non-dictatorial method with three or more outcomes; the page searches profiles and shows a voter who gains by misreporting their ranking.' },
        { num: '3.7', kind: 'Phenomenon', name: 'Strategic voting under plurality, Borda and IRV', deps: ['polsci-3.6'], refs: ['T&P ch. 7'],
          pic: 'Simulated electorates with polls: voters abandon hopeless favourites under plurality, bury rivals under Borda, and push over under IRV; the share of manipulable profiles per method is counted.' },
        { num: '3.8', kind: 'Theorem', name: 'Muller–Satterthwaite theorem', deps: ['polsci-3.6'], refs: ['T&P ch. 7'],
          pic: 'Strong monotonicity plus unanimity on three outcomes: the search shows every rule satisfying both on all profiles is a dictatorship.' },
        { num: '3.9', kind: 'Theorem', name: 'Approval voting is strategy-proof for dichotomous voters', deps: ['polsci-1.8', 'polsci-3.6'], refs: ['T&P ch. 1'],
          pic: 'Voters who split candidates into liked and disliked can never gain by deviating from sincere approval; add a third preference level and the manipulation search finds cases.' },
        { num: '3.10', kind: 'Theorem', name: 'Young’s characterization of the Borda count', deps: ['polsci-2.10'], refs: ['Saari'],
          pic: 'Combine two electorates: consistency, neutrality, anonymity and faithfulness are checked for scoring rules, and only Borda satisfies the cancellation property shown on paired ballots.' },
        { num: '3.11', kind: 'Theorem', name: 'Kemeny as maximum likelihood (Young–Condorcet)', deps: ['polsci-1.11'], refs: ['T&P ch. 7'],
          pic: 'Voters see a true ranking through noise with accuracy p; the most likely truth given the ballots is computed and coincides with the Kemeny ranking for every simulated sample.' },
        { num: '3.12', kind: 'Theorem', name: 'List–Pettit impossibility for judgment aggregation', deps: ['polsci-2.12', 'polsci-3.3'], refs: ['T&P ch. 7'],
          pic: 'Try aggregation rules on interconnected propositions; anonymity, systematicity and consistency cannot all hold, and each rule’s failing judgment set is displayed.' },
        { num: '3.13', kind: 'Paper', name: 'A Difficulty in the Concept of Social Welfare',
          paper: { authors: 'Kenneth J. Arrow', year: 1950, title: 'A Difficulty in the Concept of Social Welfare', venue: 'Journal of Political Economy 58 (4): 328–346', doi: '10.1086/256963' },
          introduces: ['polsci-3.2', 'polsci-3.3'], deps: ['polsci-2.1', 'micro-4.3', 'polsci-5.10'], refs: [],
          pic: 'Try to design a rule that turns three voters’ rankings of three options into a social ranking: edit the rule’s output profile by profile, and a checker reports which of Arrow’s conditions (unrestricted domain, Pareto, independence of irrelevant alternatives, transitivity, non-dictatorship) it breaks; every rule that satisfies the first four turns out to copy a single voter.' },
        { num: '3.14', kind: 'Paper', name: 'Conditions for Simple Majority Decision',
          paper: { authors: 'Kenneth O. May', year: 1952, title: 'A Set of Independent Necessary and Sufficient Conditions for Simple Majority Decision', venue: 'Econometrica 20 (4): 680–684', doi: '10.2307/1907651' },
          introduces: ['polsci-3.1'], deps: ['polsci-1.1'], refs: [],
          pic: 'Two alternatives and n voters: propose any aggregation rule as a table from vote patterns to outcomes and test it against May’s four conditions (decisive, anonymous, neutral, positively responsive); every rule that passes all four is simple majority, and dropping each condition in turn reveals a different rule that satisfies the other three, which is what makes them independent.' },
      ],
    },
    // ───────────────────────────────────────────────────────────── 4
    {
      n: 4,
      title: 'Spatial models and the median voter',
      summary: String.raw`When voters and policies lie along one left–right line and preferences are single-peaked, majority rule is well behaved: the median voter’s ideal point beats every alternative, and competing parties are drawn toward it. In two or more dimensions this stability almost always disappears — any outcome can be reached by a suitable agenda — so outcomes are shaped by institutions: who sets the agenda, who can veto, which committee has jurisdiction.`,
      items: [
        { num: '4.1', kind: 'Definition', name: 'Single-peaked preferences', deps: ['polsci-1.1'], refs: ['Shepsle: spatial model'],
          pic: 'Voters’ utility curves over a policy line; drag their peaks, and a checker reports whether every voter’s preferences have one peak along the chosen ordering.' },
        { num: '4.2', kind: 'Theorem', name: 'Black’s median voter theorem', deps: ['polsci-4.1', 'polsci-2.1'], refs: ['Shepsle: spatial model'],
          pic: 'Pit any policy against the median ideal point: the median wins every pairwise vote, with the vote split counted; break single-peakedness for one voter and a cycle can return.' },
        { num: '4.3', kind: 'Model', name: 'Hotelling–Downs party competition', deps: ['polsci-4.2', 'micro-10.17', 'geog-9.3'], refs: ['Shepsle: spatial model'],
          pic: 'Two parties take turns moving to win votes from a distribution you draw; they converge on the median, and a third party or abstention-from-alienation makes them diverge.' },
        { num: '4.4', kind: 'Phenomenon', name: 'Why parties do not fully converge', deps: ['polsci-4.3'], refs: ['Shepsle: spatial model'],
          pic: 'Add primaries, policy-motivated candidates and turnout that falls with distance; equilibrium positions separate, compared with roll-call estimates of real party positions.' },
        {"num":"4.5","kind":"Theorem","name":"Plott’s symmetry condition","deps":["polsci-4.2","vcalc-1.2"],"refs":["Plott (1967), AER57:787–806, pp.788–791, unrestricted local conditions and one-maximum qualification; Euclidean specialization derived here"],"tags":["spatial voting","majority-rule equilibrium"],"pic":"Drag ideals and the gold status quo q; inputs snap to an eighth-unit grid inside the stated square. Choose 3,5 or7 voters, or load a symmetric, broken-pair or coincident-majority preset. The left panel contains every ideal; the right panel zooms around q and a certified winning proposal when one exists. Orange is a sampled winset, whose visible pixels do not determine the equilibrium verdict. The exact finite direction test does."},
        {"num":"4.6","kind":"Theorem","name":"McKelvey’s chaos theorem","deps":["polsci-4.5","polsci-2.8","algo-8.5"],"refs":["McKelvey1976, JET12:472–482, Theorem2 pp.475–478; agenda qualifications p.481"],"pic":"Drag three ideals, start S and target T on the declared eighth-unit grid. Search the bounded17×17 or33×33 policy graph plus S,T. Draw only actual strict-majority steps; a failed finite search does not prove continuum impossibility. Compare generic, symmetric and coincident-majority presets and the exact full-plane equilibrium verdict."},
        {"num":"4.7","kind":"Concept","name":"The uncovered set and the yolk","deps":["polsci-4.6","vcalc-1.3"],"refs":["Miller1980, AJPS24:68–96, definitions2–3 pp.72–74 (tournament setting)","McKelvey, SSWP494, revisedMay1985, §8 pp.31–36, Theorem5; triangle specialization proved here"],"pic":"Three eighth-grid ideals determine an exact triangle incircle yolk, or a zero-radius median in the collinear case. A separate9×9 or17×17 directed policy graph retains tied votes. Drag A,B on actual policies to inspect covering and missing-win witnesses; compare on-grid with off-grid symmetry. The continuous4r reference does not certify finite-grid uncovered points."},
        { num: '4.8', kind: 'Model', name: 'The agenda-setter model (Romer–Rosenthal)', deps: ['polsci-4.2'], refs: ['Shepsle: agenda power'],
          pic: 'A setter makes a take-it-or-leave-it offer against a status quo; drag the status quo and see the setter extract outcomes far from the median when the reversion point is extreme.' },
        { num: '4.9', kind: 'Concept', name: 'Veto players and policy stability (Tsebelis)', deps: ['polsci-4.8'], refs: ['Shepsle: institutions'],
          pic: 'Add veto players in a policy plane: the winset of the status quo is the intersection of their preferred-to sets and shrinks with every veto player added.' },
        { num: '4.10', kind: 'Model', name: 'Structure-induced equilibrium (Shepsle–Weingast)', deps: ['polsci-4.6'], refs: ['Shepsle: institutions'],
          pic: 'Split a two-dimensional policy into separate committee jurisdictions voted on one dimension at a time; the chaotic process now stops at the issue-by-issue median.' },
        { num: '4.11', kind: 'Model', name: 'Meltzer–Richard: the median voter and redistribution', deps: ['polsci-4.2'], refs: ['Shepsle: spatial model'],
          pic: 'An income distribution with a draggable skew: the median voter’s preferred tax rate rises as the median falls further below the mean, with labour-supply losses limiting it.' },
        {"num":"4.12","kind":"Paper","name":"On the Rationale of Group Decision-making","paper":{"authors":"Duncan Black","year":1948,"title":"On the Rationale of Group Decision-making","venue":"Journal of Political Economy 56 (1): 23–34","doi":"10.1086/256633"},"introduces":["polsci-4.1","polsci-4.2"],"deps":["polsci-2.1"],"refs":["Black1948, JPE56:23–34, pp.23–28 ordinal curves/median proof; pp.31–34 matrices/Figure8"],"pic":"Three members strictly rank A–D along that fixed axis. Select a member and swap adjacent positions in her ranking; these operations can reach all24 strict rankings. Curves show only ordinal heights4,3,2,1, with connecting lines as guides. The matrix gives votes for the row minus votes for the column. Load the single-peaked example or Black's Figure8 rankings on A–C with an authored, unanimously last D. The latter has the same A→B→C→A cycle as the source."},
        {"num":"4.13","kind":"Paper","name":"An Economic Theory of Political Action in a Democracy","paper":{"authors":"Anthony Downs","year":1957,"title":"An Economic Theory of Political Action in a Democracy","venue":"Journal of Political Economy 65 (2): 135–150","doi":"10.1086/257897"},"introduces":["polsci-4.3"],"deps":["polsci-4.12","micro-10.17"],"refs":["Downs (1957), JPE65:135–150, pp.137 and142–144; finite comparison authored"],"tags":["paper","party competition","median voter"],"pic":"Choose an authored electorate, a maximum voting distance and a movement rule. Set A and B on the integer grid; moving a party past the other also moves the other control to retain A≤B in the displayed profile. The first panel shows all voter counts split among A, B and abstention. The middle panel shows all 66 ordered profiles. The last panel gives every allowed one-party proposal and its actual vote total."},
      ],
    },
    // ───────────────────────────────────────────────────────────── 5
    {
      n: 5,
      title: 'Turnout, information and juries',
      summary: String.raw`A single vote almost never decides a large election, so purely instrumental voters should stay home — the paradox of voting. Yet voting also aggregates information: For independent voters with the same fixed better-than-chance competence, Condorcet’s jury theorem sends majority accuracy toward one as odd jury size grows. Shared influence can obstruct that limit, and strategic voters may condition on being pivotal.`,
      items: [
        {"num":"5.1","kind":"Paradox","name":"The paradox of voting (Downs)","deps":["behav-1.3"],"refs":["Downs (1957), JPE65:135–150, pp.146–147; authored exact binomial illustration"],"tags":["turnout","pivotal voter"],"pic":"Choose the benefit, cost, other voters' support probability and an offered electorate. Both complete curves include every even m from 2 through 5000. The vertical coordinate is log10 of the expected gain, so tiny positive values remain visible even when the probability itself underflows. Compare each curve with log10 cost and inspect the selected points."},
        { num: '5.2', kind: 'Model', name: 'The calculus of voting (Riker–Ordeshook)', deps: ['polsci-5.1'], refs: ['Shepsle: voting and turnout'],
          pic: 'Add the civic-duty term D to p·B − c; sliders show turnout predictions driven almost entirely by D, with close elections raising turnout only slightly.' },
        { num: '5.3', kind: 'Theorem', name: 'The probability of a decisive vote', deps: ['polsci-5.1', 'pma-8.22', 'pma-8.20'], refs: ['Shepsle: voting and turnout'],
          pic: 'Exact binomial probability of an exact tie as n grows: about √(2/πn) for a 50–50 electorate but exponentially small once the expected split moves away from even.' },
        { num: '5.4', kind: 'Theorem', name: 'Condorcet’s jury theorem', deps: ['prob-2.1.1a', 'prob-2.2.3'], refs: ['Easley and Kleinberg (2010), §23.7, pp.756–758; finite monotonicity and variance derivation'],
          pic: 'All odd jury sizes 1–301, competence 0–1, stable finite binomial accuracy and error, an actual weak-law variance lower bound, and all outcomes in the chosen jury.' },
        { num: '5.5', kind: 'Model', name: 'Correlated voters and a shared leader', deps: ['polsci-5.4', 'prob-4.1.1a'], refs: ['Authored common-leader construction; independent comparison: Easley and Kleinberg (2010), §23.7'],
          pic: 'Finite conditional-binomial mixture and all three infinite-jury regimes; exact critical mode, open/closed limit markers and the derived pairwise correlationρ².' },
        {"num":"5.6","kind":"Theorem","name":"Unanimous juries convict innocents (Feddersen–Pesendorfer)","deps":["polsci-5.3","polsci-3.7","pma-8.6"],"refs":["Feddersen–Pesendorfer1998, APSR92:23–35, model/Proposition2, Tables1–2 p.31, AppendixB pp.33–34","Petersen2026, doi:10.1017/S0003055426101762, corrected limit proof"],"pic":"Recompute the model behind the published twelve-person jury tables with both strategic mixing branches, or extend their p=0.8,q=0.9 parameters to unanimity juries of size2–101. Select a rule/size to inspect actual error probabilities, pivotal posteriors and remaining best-response gain; compare informative voting and corrected unanimity limits."},
        {"num":"5.7","kind":"Model","name":"Rational ignorance","deps":["polsci-5.1"],"refs":["Downs (1957), JPE65:135–150, pp.145–147; authored exponential/linear example"],"tags":["information","turnout"],"pic":"Change switch-decisiveness, benefit, unit cost and baseline accuracy. The complete left value curve extends beyond its actual optimum, including large optimal effort. The right curve shows optimal effort across all offered probabilities; the readout gives the resulting accuracy. Baseline accuracy remains when paid effort is zero."},
        { num: '5.8', kind: 'Concept', name: 'The miracle of aggregation', deps: ['polsci-5.4', 'prob-2.2.6'], refs: ['Page–Shapiro1988 author manuscript pp.10–13/16–19; authored independent Bernoulli proof and model'],
          pic: 'Choose the informed share and uninformed accuracy by dragging, with odd count and informed accuracy controls. Colors give finite mean correctness; the complete vote distribution and majority probabilities use one rounded informed count. The proof separates fixed positive fraction, finite success, marginal bias and dependence.' },
        { num: '5.9', kind: 'Theorem', name: 'The swing voter’s curse', deps: ['polsci-5.6'], refs: ['Feddersen–Pesendorfer1996, pp.411–413/419; Fey–Kim2002, author August2000 correction pp.3–10'],
          pic: 'Exact conditional margin distributions and one uninformed voter’s gains from voting instead of abstaining. Odd noisy informed count, signal accuracy and fixed partisan margin are controlled; the balanced case has proved best replies, and unbalanced margins are deviation audits without equilibrium claims.' },
        { num: '5.10', kind: 'Paper', name: 'Essai sur l’application de l’analyse à la probabilité…',
          paper: { authors: 'Marquis de Condorcet', year: 1785, title: 'Essai sur l’application de l’analyse à la probabilité des décisions rendues à la pluralité des voix', venue: 'Paris: Imprimerie Royale', url: 'https://doi.org/10.3931/e-rara-3791' },
          introduces: ['polsci-5.4', 'polsci-2.1', 'polsci-1.6'], deps: ['polsci-1.5'], refs: ['Original1785 Discours préliminaire pp.xxi–xxiv andlvi–lxv; ETHRar5135 scan'],
          pic: 'Modern iid jury probability with all three source-stated competence regimes, alongside the original sixty-voter cycle and pairwise-winner examples. Custom six-ranking counts are editable and replay exactly; all pairwise margins, strict cycles, winners and ties are tallied, without simulation claims.' },
      ],
    },
    // ───────────────────────────────────────────────────────────── 6
    {
      n: 6,
      title: 'Electoral systems and party systems',
      summary: String.raw`How votes become seats shapes how many parties there are. Single-member plurality districts reward the two largest parties and punish third parties, while proportional formulas translate vote shares into seat shares more faithfully. Political scientists measure the outcomes with the effective number of parties and disproportionality indices; Duverger’s law is a strong tendency with well-known exceptions rather than a law.`,
      items: [
  {
    "num": "6.1",
    "kind": "Definition",
    "name": "Single-member districts and proportional representation",
    "deps": [
      "polsci-1.2"
    ],
    "refs": [
      "Electoral Commission, How votes are counted: first-past-the-post and list PR; Senedd April2024 Memorandum printed37 §§126–127"
    ],
    "pic": "Edit fictional district vote rows. Compare the actual district winners and seat hemicycle with nationwide D’Hondt at the same house size. A concentrated-support preset changes geography; zero-ballot districts remain vacant."
  },
  {
    "num": "6.2",
    "kind": "Method",
    "name": "D’Hondt and Sainte-Laguë seat allocation",
    "deps": [
      "polsci-6.1"
    ],
    "refs": [
      "Senedd Cymru, Senedd Cymru (Members and Elections) Bill Memorandum April2024, printed37 §§126–127"
    ],
    "pic": "Select a rule and house size, then step through the exact award sequence. The quotient table shows the divisors used for that award and the current seat bars. Edit party totals or use an all-zero profile."
  },
  {
    "num": "6.3",
    "kind": "Method",
    "name": "Single transferable vote",
    "deps": [
      "polsci-1.4",
      "polsci-6.2"
    ],
    "refs": [
      "Scottish Local Government Elections Order2011 SSI2011/399 rules47–49,51,53; AEC, Exhaustion of preferences under the Senate’s new electoral system,2016 printed4/11 (weighted versus unweighted Gregory)"
    ],
    "pic": "Edit grouped ballot counts and rankings indexed0–4 for A–E. Step through exact rational transfers; two panels distinguish continuing and retained weights. Exhaustion and conservation remain visible in the live readout."
  },
  {
    "num": "6.4",
    "kind": "Phenomenon",
    "name": "Duverger’s law",
    "deps": [
      "polsci-6.1",
      "polsci-3.7"
    ],
    "refs": [
      "Cox1999, Electoral Rules and Electoral Coordination, Annual Review of Political Science2:145–161, actual publisher abstract; Cox1997 concluding chapter publisher summary"
    ],
    "pic": "Separate a fixed-ballot mechanical comparison from an explicitly imposed switching experiment. The switching percent and chosen destination change actual district votes; both plurality and national D’Hondt seats are recomputed. No historical country markers or invented observations are shown."
  },
  {
    "num": "6.5",
    "kind": "Theorem",
    "name": "Cox’s M + 1 rule",
    "deps": [
      "polsci-6.4"
    ],
    "refs": [
      "Cox1997, Making Votes Count, Some concluding comments on strategic voting, publisher summary; Cox1999, Electoral Rules and Electoral Coordination, actual abstract"
    ],
    "pic": "Vary SNTV magnitude and a voter’s current action while keeping the other voters fixed. The actual five possible winning committees, utilities and deviation gains are computed. A tied-rival preset exposes the role of tie priority; the M+1 value is a conditional reference, not a forced simulation outcome.",
    "verify": true
  },
  {
    "num": "6.6",
    "kind": "Definition",
    "name": "Effective number of parties (Laakso–Taagepera)",
    "deps": [
      "polsci-6.1"
    ],
    "refs": [
      "Armingeon etal, Comparative Political Data Set1960–2017 codebook update2019, printed9, effpar_ele/effpar_leg"
    ],
    "pic": "Party-share bars and squared-share contributions respond to edited integer counts. Equal-party and zero-total presets expose normalization and the undefined boundary; the readout gives the coincidence probability and its reciprocal."
  },
  {
    "num": "6.7",
    "kind": "Phenomenon",
    "name": "The cube law of seats and votes",
    "deps": [
      "polsci-6.1"
    ],
    "refs": [
      "Nuffield College, David Butler Archive, Cube rule, actual institutional history and two-party caveat; self-contained odds-family algebra and finite threshold count"
    ],
    "pic": "Compare a continuously adjustable authored odds-power family with the actual seat staircase of eight declared threshold districts. The same horizontal parameter selects both examples; neither curve is claimed fitted to an observed election."
  },
  {
    "num": "6.8",
    "kind": "Definition",
    "name": "Gallagher’s disproportionality index",
    "deps": [
      "polsci-6.2"
    ],
    "refs": [
      "Armingeon etal, Comparative Political Data Set1960–2017 codebook update2019, printed10, dis_gall"
    ],
    "pic": "Allocate seats by either divisor rule to fictional party totals. Separate vote and seat fraction panels and the live percentage-point gaps show exactly what enters the index; house size and ties can change it discretely."
  },
  {
    "num": "6.9",
    "kind": "Method",
    "name": "Mixed-member proportional systems",
    "deps": [
      "polsci-6.2"
    ],
    "refs": [
      "Electoral Commission, How votes are counted, additional member overview; self-contained authored overhang accounting with6.2"
    ],
    "pic": "Change separate fictional party-list totals and district A/B wins. Base entitlement bars are compared with stacked final seats: dark district seats plus pale list seats. The readout reports every top-up, overhang and the resulting house size."
  },
  {
    "num": "6.10",
    "kind": "Paper",
    "name": "Les partis politiques",
    "deps": [
      "polsci-6.1",
      "polsci-1.2"
    ],
    "refs": [
      "Cox1999 actual abstract (modern context); Duverger1951 bibliographic record, original body unavailable"
    ],
    "pic": "Inspect two explicitly separated mechanisms with fictional districts and a chosen switching percentage. No published election series or script that guarantees two survivors is presented. The original citation and access uncertainty remain visible.",
    "paper": {
      "authors": "Maurice Duverger",
      "year": 1951,
      "title": "Les partis politiques",
      "venue": "Paris: Armand Colin (English trans. Political Parties, London: Methuen, 1954)",
      "url": "https://archive.org/details/politicalparties0000duve"
    },
    "introduces": [
      "polsci-6.4"
    ],
    "verify": true
  }
],
    },
    // ───────────────────────────────────────────────────────────── 7
    {
      n: 7,
      title: 'Weighted voting and power',
      summary: String.raw`In councils where members cast different numbers of votes, voting weight is a poor guide to influence. Power indices measure how often a member is pivotal or critical in forming winning coalitions: Shapley–Shubik counts orderings, Banzhaf counts swings. They reveal members with weight but no power, and justify Penrose’s square-root rule for fair weights in two-tier systems.`,
      items: [
        { num: '7.1', kind: 'Definition', name: 'Yes–no voting systems and weighted voting', deps: ['polsci-1.1'], refs: ["Chalkiadakis & Wooldridge, Weighted Voting Games, Handbook of Computational Social Choice ch.16, 2016; selected definitions, PDF pages 395–400 read", "Own exact coalition enumeration and inclusion-minimality checks"],
          pic: "Edit four weights and the quota, then inspect all sixteen coalitions. Winning cells meet the exact threshold; a separate outline marks minimal winning coalitions. Select a coalition to unpack its members, total weight and the effect of removing each member. The rule, its numerical representation and its boundary cases remain separate." },
        { num: '7.2', kind: 'Theorem', name: 'Trade robustness characterizes weighted systems', deps: ['polsci-7.1'], refs: ["Kirsch, A Mathematical View on Voting and Power, selected trade definition/Theorem 16, PDF pages 8–9 read", "Chalkiadakis & Wooldridge ch.16.5; selected PDF pages 408–410 read", "Own balanced-multiset certificate search and finite convex-separation argument; Taylor–Zwicker 1992 original body unread"],
          pic: "Follow the same member tokens from winning coalitions to losing coalitions and compare their conserved appearance totals. Inspect the contradiction, or a checked weight certificate when one is found. Try a bicameral rule or edit the generators of an authored monotone system. A bounded search that finds no certificate is explicitly inconclusive." },
        { num: '7.3', kind: 'Definition', name: 'Shapley–Shubik power index', deps: ['polsci-7.1', 'game-8.7'], refs: ["Chalkiadakis & Wooldridge ch.16.2.3, definitions 16.5/equations 16.1–16.2; actual PDF pages 399–400 read", "Own complete permutation enumeration and predecessor-set counting proof"],
          pic: "Inspect the actual member order, running weight and first crossing of the quota. Reveal a prefix or play through the finite ordering list. The companion distribution counts pivots in all twenty-four orders with exact fractions. Editing weights or the quota changes the rule and recomputes the distribution; choosing another order changes the example being inspected." },
        { num: '7.4', kind: 'Definition', name: 'Banzhaf power index', deps: ['polsci-7.1'], refs: ["Kirsch, selected absolute/normalized Banzhaf definitions and odd-majority proof, actual PDF pages 13–15 read", "Chalkiadakis & Wooldridge ch.16.2.3, selected absolute Banzhaf definition, PDF page 400 read", "Own exact subset enumeration and critical-member pairing"],
          pic: "Choose supporters and remove each member in turn to see who is actually critical. Pair each critical membership with its losing counterpart, then inspect all swing counts. Compare absolute decisiveness, normalized Banzhaf shares and Shapley–Shubik shares on the same authored rule, with the units and denominators kept visible." },
        { num: '7.5', kind: 'Phenomenon', name: 'Weight is not power: the 1958 EEC Council', deps: ['polsci-7.3', 'polsci-7.4'], refs: ["Council of the European Union, The European Council and the Council of the EU through time, 2016; actual complete PDF page 53 read/viewed", "Mayer, Luxembourg in the Early Days of the EEC: Null Player or Not?, Games 9:29, 2018; complete main text and actual Table 1 viewed", "Own exact 64-coalition calculations; source rounded indices not used as a numerical oracle"],
          pic: "Compare six voting weights with the exact power indices and inspect Luxembourg’s actual swing pairs. Switch between the pure weighted rule and the historical four-country minimum. The Germany–France–Italy coalition provides a direct test of the distinction. Moving the quota explores a counterfactual rule; it does not rewrite the historical threshold." },
        { num: '7.6', kind: 'Theorem', name: 'Penrose’s square-root law', deps: ['polsci-7.4', 'polsci-5.3'], refs: ["Kirsch, selected odd-majority and two-tier derivation/Corollary 41; actual PDF pages 13–15 and 21 read/viewed, selected surrounding text read", "Written polsci 5.3 decisive-vote lesson, complete body read", "Own exact finite product, binomial probabilities and discrete upper-council comparison"],
          pic: "Follow a citizen’s two-stage route to a decisive final vote. Change five authored electorate sizes, the weight scheme and the quota. Compare actual delegate powers with the finite target proportions, then inspect each citizen’s exact product probability. The square-root guide is an approximation; neither the weights nor the finite outcomes are silently identified with that target." },
        { num: '7.7', kind: 'Phenomenon', name: 'The power of the U.S. president', deps: ['polsci-7.3'], refs: ["Kirsch, selected US federal-system formalization, actual web text/PDF pages 5–6 read", "Chalkiadakis & Wooldridge, selected Shapley predecessor-set formula, actual PDF page 399 read/viewed", "Own exact chamber-count multiplicities and rank-conditioned calculation; independently checked against literal small systems"],
          pic: "Inspect the signature and veto-override routes using selected support counts and thresholds. Compare a member’s formal share with a whole chamber’s aggregate share, keeping the units visible. Switch between full membership and smaller authored chambers, then change the declared routes to see which pivotal configurations appear or disappear." },
        { num: '7.8', kind: 'Phenomenon', name: 'Voter power in the Electoral College', deps: ['polsci-7.4', 'polsci-7.6'], refs: ["National Archives, Distribution of Electoral Votes; actual main table/rule exceptions read 2026-10-27, 2024/2028 allocation based on 2020 Census", "Gelman, Katz & Bafumi, Standard Voting Power Indexes Don’t Work: An Empirical Analysis, November 16 2003 author manuscript; selected methods/results and actual Figure 1 read/viewed", "Own exact generating-polynomial subset counts and authored two-tier scenarios; no empirical voter data"],
          pic: "Inspect a jurisdiction’s electoral allocation and exact bloc decisiveness. Equal-weight jurisdictions are grouped together without moving their values; the inspector retains every jurisdiction’s identity. Change the hypothetical electorate scale and local voting assumption to see the citizen factor and final probability change. The source allocation and authored citizen scenarios remain explicitly distinct." },
        { num: '7.9', kind: 'Model', name: 'Minimal winning coalitions and Gamson’s law', deps: ['polsci-7.1'], refs: ["Mayer 2018, selected simple-game/minimal-winning definition, actual PDF page 4 read", "Chaisty & Power, Gamson going global? Cabinet proportionality in comparative perspective, EPSR 16(4), 2024, 630–646; selected main/methods and actual Figure 1 read/viewed", "Own finite seat-coalition enumeration and explicit integer cabinet-allocation illustration"],
          pic: "Identify inclusion-minimal winning coalitions, then inspect an authored cabinet allocation against the proportionality diagonal. Change the coalition, cabinet size and positions reserved for its largest party. Compare the resulting residuals with the separately labeled source association summary, whose sample sizes and observational scope remain visible." },
        { num: '7.10', kind: 'Paradox', name: 'The paradox of new members', deps: ['polsci-7.4'], refs: ["Chalkiadakis & Wooldridge, ch.16.4.1, source new-member example 16.12; actual PDF pages 407–408 read", "Own exact before/after enumeration, context partition and gained/lost witnesses"],
          pic: "Add an entrant while holding the old weights and quota fixed, then compare the same old members before and after entry. Select a member to inspect actual gained and lost swing contexts. Change the entrant’s weight, including zero, and switch the index unit to see why duplicated counts and changing power shares are different statements." },
        { num: '7.11', kind: 'Paper', name: 'A Method for Evaluating the Distribution of Power',
          paper: { authors: 'L. S. Shapley and Martin Shubik', year: 1954, title: 'A Method for Evaluating the Distribution of Power in a Committee System', venue: 'American Political Science Review 48 (3): 787–792', doi: '10.2307/1951053' },
          introduces: ['polsci-7.3', 'polsci-7.7'], deps: ['game-8.11', 'polsci-7.1'], refs: ["Shapley & Shubik 1954, publisher extract and bibliographic metadata only; original article body/figures unavailable and unverified", "Chalkiadakis & Wooldridge 2016, selected formal Shapley account, actual PDF pages 399–400 read/viewed", "Kirsch, selected fifteen-seat 9-plus-all-veto-holders rule, actual text read", "Own exact predecessor-coalition enumeration and reproducible ordering illustration"],
          pic: "Inspect an authored veto council’s actual member order, cumulative total and arriving veto holders. The first point at which both requirements hold is the pivot. Play visits reproducible example orders while the exact all-order role shares and pivotal-position distribution remain separately computed. The historical paper identity and the limits of original-source verification stay explicit." },
      ],
    },
    // ───────────────────────────────────────────────────────────── 8
    {
      n: 8,
      title: 'Apportionment',
      summary: String.raw`Allocating a fixed number of seats among states in proportion to population cannot be done exactly, so a rounding method must be chosen. Hamilton’s largest-remainder method stays within quota but suffers the Alabama, population and new-states paradoxes; divisor methods (Jefferson, Webster, Huntington–Hill) avoid them but can violate quota. Balinski and Young proved no method can avoid both kinds of failure.`,
      items: [
        { num: '8.1', kind: 'Definition', name: 'The apportionment problem and the quota', deps: [], refs: ['T&P ch. 5'],
          pic: 'Enter state populations and house size; each state’s exact quota is shown as a bar with its floor and ceiling, and you try to round by hand to the right total.' },
        { num: '8.2', kind: 'Method', name: 'Hamilton’s method (largest remainders)', deps: ['polsci-8.1'], refs: ['T&P ch. 5'],
          pic: 'Give each state its floor, then hand out remaining seats by largest fractional part, animated with remainders sorted.' },
        { num: '8.3', kind: 'Paradox', name: 'The Alabama paradox', deps: ['polsci-8.2'], refs: ['T&P ch. 5'],
          pic: 'Raise the house size from 299 to 300 with 1880 census data: Alabama loses a seat; a sweep over house sizes flags every such loss.' },
        { num: '8.4', kind: 'Paradox', name: 'The population paradox', deps: ['polsci-8.2'], refs: ['T&P ch. 5'],
          pic: 'Grow two states’ populations at different rates: the faster-growing state loses a seat to the slower one under Hamilton’s method.' },
        { num: '8.5', kind: 'Paradox', name: 'The new states paradox', deps: ['polsci-8.2'], refs: ['T&P ch. 5'],
          pic: 'Add a new state together with its fair share of seats (as with Oklahoma in 1907): seats shift between existing states that did not change at all.' },
        { num: '8.6', kind: 'Method', name: 'Divisor methods: Jefferson, Adams, Webster', deps: ['polsci-8.1', 'polsci-6.2'], refs: ['T&P ch. 5'],
          pic: 'Drag a common divisor and round each state’s quotient down, up or to nearest; the total seats change in steps, and the divisor giving the right house size is found.' },
        { num: '8.7', kind: 'Method', name: 'Huntington–Hill (equal proportions)', deps: ['polsci-8.6'], refs: ['T&P ch. 5'],
          pic: 'Rounding at the geometric mean √(n(n+1)) instead of n + ½; the priority list used for the U.S. House since 1941 is computed from current census data.' },
        { num: '8.8', kind: 'Paradox', name: 'Divisor methods can violate quota', deps: ['polsci-8.6'], refs: ['T&P ch. 5'],
          pic: 'Jefferson’s method on the 1820 census gives New York more than the ceiling of its quota; a search tool finds quota violations for other divisor methods too.' },
        { num: '8.9', kind: 'Theorem', name: 'Balinski–Young impossibility theorem', deps: ['polsci-8.4', 'polsci-8.8'], refs: ['T&P ch. 5', 'T&P ch. 11'],
          pic: 'Pick any method from the menu: the page finds either a population-paradox instance or a quota violation, illustrating that no method avoids both.' },
        { num: '8.10', kind: 'Theorem', name: 'Webster’s method is unbiased', deps: ['polsci-8.6'], refs: ['T&P ch. 11'],
          pic: 'Average the seats-per-quota of large and small states over thousands of random populations: Jefferson favours large states, Adams small ones, and Webster neither.' },
      ],
    },
    // ───────────────────────────────────────────────────────────── 9
    {
      n: 9,
      title: 'Districting and gerrymandering',
      summary: String.raw`Drawing district lines can change who wins without changing a single vote: pack the opponent’s voters into a few districts and crack the rest. Measures such as the efficiency gap, partisan symmetry and the mean–median difference quantify the bias in a plan, and compactness scores capture odd shapes. Modern analysis compares a plan with thousands of randomly generated legal plans, which also shows that geography alone can create bias.`,
      items: [
        { num: '9.1', kind: 'Concept', name: 'Packing and cracking', deps: ['polsci-6.1'], refs: ['T&P ch. 5'],
          pic: 'A grid of voters in two colours with 60–40 split; paint districts by hand and see the seat outcome range from a sweep for one side to a majority for the other.' },
        { num: '9.2', kind: 'Concept', name: 'One person, one vote and malapportionment', deps: ['polsci-8.1'], refs: ['T&P ch. 5'],
          pic: 'District populations of a pre-1964 map against equal-population districts; the voting weight of a citizen in the smallest district relative to the largest is shown.' },
        { num: '9.3', kind: 'Definition', name: 'The efficiency gap', deps: ['polsci-9.1'], refs: ['T&P ch. 5'],
          pic: 'For your painted plan, wasted votes (all losing votes plus winning votes above 50%) are tallied per party; the efficiency gap is their difference over total votes.' },
        { num: '9.4', kind: 'Theorem', name: 'Efficiency gap = seat margin − 2 × vote margin', deps: ['polsci-9.3'], refs: ['T&P ch. 5'],
          pic: 'With equal turnout, the computed gap always equals the identity’s right-hand side as you repaint districts, and the line of zero gap (two seats per vote point) is drawn on a seats–votes plot.' },
        { num: '9.5', kind: 'Concept', name: 'Partisan symmetry and the seats–votes curve', deps: ['polsci-6.7'], refs: ['T&P ch. 5'],
          pic: 'Shift every district uniformly to trace a plan’s seats–votes curve; a symmetric plan gives each party the same seats at the same vote share, and the bias at 50% is read off.' },
        { num: '9.6', kind: 'Definition', name: 'The mean–median difference', deps: ['polsci-9.5'], refs: ['T&P ch. 5'],
          pic: 'District vote shares as a dot plot with mean and median marked; packing one party drags the median away from the mean in a measurable direction.' },
        { num: '9.7', kind: 'Definition', name: 'Compactness: Polsby–Popper and Reock scores', deps: ['polsci-9.1'], refs: ['T&P ch. 5'],
          pic: 'Draw a district outline; 4πA/P² and the area ratio to the bounding circle are computed, and a coastline toggle shows how resolution changes the perimeter.' },
        { num: '9.8', kind: 'Method', name: 'Ensemble redistricting and outlier analysis', deps: ['polsci-9.3', 'stoch-4.1'], refs: ['T&P ch. 5'],
          pic: 'A Markov chain recombines neighbouring districts to sample thousands of legal plans; the histogram of their seat outcomes shows where the enacted plan falls.' },
        { num: '9.9', kind: 'Phenomenon', name: 'Unintentional gerrymandering by geography', deps: ['polsci-9.8'], refs: ['T&P ch. 5'],
          pic: 'Concentrate one party’s voters in cities: even neutral random plans give it fewer seats than votes, with the ensemble distribution shifted accordingly.' },
      ],
    },
    // ───────────────────────────────────────────────────────────── 10
    {
      n: 10,
      title: 'Conflict, escalation and bargaining',
      summary: String.raw`Politics is also strategic conflict. Simple games capture arms races and crises; the dollar auction shows how rational steps add up to ruinous escalation; and bargaining models explain why the proposer in a legislature captures much of the surplus and why war, though costly, can occur when information is private or commitments are not credible.`,
      items: [
        { num: '10.1', kind: 'Model', name: 'Chicken and the Cuban missile crisis', deps: ['game-1.3'], refs: ['T&P ch. 4'],
          pic: 'A 2×2 payoff matrix for the crisis you can edit; the best-response arrows locate the two pure equilibria and the risk of the mixed one as payoffs change.' },
        { num: '10.2', kind: 'Model', name: 'The arms race as a prisoner’s dilemma', deps: ['game-1.4', 'game-5.5'], refs: ['T&P ch. 4'],
          pic: 'Two states choose to arm or disarm; dominant strategies lead both to arm, and repeated play with tit-for-tat shows when restraint can be sustained.' },
        { num: '10.3', kind: 'Model', name: 'Richardson’s arms-race model', deps: ['ode-6.3'], refs: ['T&P ch. 10'],
          pic: 'Two coupled linear ODEs for arms stocks with reaction, fatigue and grievance sliders; the phase portrait shows a stable balance or a runaway race depending on the eigenvalues.' },
        { num: '10.4', kind: 'Paradox', name: 'The dollar auction', deps: [], refs: ['T&P ch. 6'],
          pic: 'Bid against a simulated opponent for a dollar where both top bidders pay; each raise is locally rational, and the totals paid climb far past the prize.' },
        { num: '10.5', kind: 'Model', name: 'Legislative bargaining (Baron–Ferejohn)', deps: ['polsci-7.9', 'game-7.2'], refs: ['Shepsle: institutions'],
          pic: 'A randomly chosen proposer offers a split to a minimal majority; equilibrium shares are computed for different discount factors and amendment rules, with the proposer’s premium highlighted.' },
        { num: '10.6', kind: 'Model', name: 'The bargaining model of war (Fearon)', deps: ['polsci-10.1'], refs: ['T&P ch. 10'],
          pic: 'A line of possible settlements with war costs carving out a bargaining range both sides prefer to fighting; add private information or a shifting power balance and war becomes possible in equilibrium.' },
        { num: '10.7', kind: 'Concept', name: 'Logrolling and vote trading', deps: ['polsci-2.1'], refs: ['Shepsle: institutions'],
          pic: 'Three legislators and two bills, each favoured intensely by one: a vote trade passes both, and a payoff table shows when the trade makes the majority better or worse off.' },
      ],
    },
  ],
};
