import * as V from './ch07.viz.js';
export default {
  "collection": "polsci",
  "chapter": 7,
  "title": "Weighted voting and power",
  "summary": "A vote count describes a rule; a power index describes pivotal opportunities under a stated model. Inspect exact coalitions and orderings, change quotas and membership, and follow a citizen through two tiers. The historical and empirical examples keep their actual institutional rules and evidence limits visible.",
  "items": [
    {
      "num": "7.1",
      viz: V.lesson1,
      "kind": "Definition",
      "name": "Yes–no voting systems and weighted voting",
      "deps": [
        "polsci-1.1"
      ],
      "statement": "A finite **yes–no voting system** specifies which coalitions can pass a proposal. Write $v(S)=1$ when the supporters $S$ win and $v(S)=0$ otherwise. Here the empty coalition loses, the full coalition wins, and adding supporters cannot turn a win into a loss. A **weighted** representation assigns nonnegative weights $w_i$ and a quota satisfying $0<q\\le\\sum_iw_i$:\n$$v(S)=1\\quad\\Longleftrightarrow\\quad\\sum_{i\\in S}w_i\\ge q.$$\nEquality meets the quota. A winning coalition is **minimal winning** when removing any one of its members makes it lose. This is minimal by inclusion; it need not have the least total weight or the fewest members.",
      "idea": "Ranked elections begin with preferences among several alternatives; a yes–no system instead asks whether a specified set of supporters can pass one proposal. The winning coalitions, rather than the numerical labels alone, define the rule. Multiplying every weight and the quota by the same positive factor leaves the rule unchanged. Different weight vectors can even represent exactly the same rule. Nonnegative weights prove monotonicity: adding a supporter cannot decrease the sum. The explorer enumerates every coalition of four authored members, so the selected sum and each minimal-winning test can be checked directly.",
      "scope": "The members and weights are authored examples. Support is treated as a binary input, with no abstention, turnout, preference intensity, bargaining or probability model. The definition requires a losing empty coalition and a winning full coalition. If the controls give all members zero weight or put the quota above the total, the display identifies that degenerate rule; normalized power comparisons then have no valid simple-game interpretation. Properness, which prevents complementary coalitions from both winning, is a separate property.",
      "caption": "Edit four weights and the quota, then inspect all sixteen coalitions. Winning cells meet the exact threshold; a separate outline marks minimal winning coalitions. Select a coalition to unpack its members, total weight and the effect of removing each member. The rule, its numerical representation and its boundary cases remain separate.",
      "refs": [
        "Chalkiadakis & Wooldridge, Weighted Voting Games, Handbook of Computational Social Choice ch.16, 2016; selected definitions, PDF pages 395–400 read",
        "Own exact coalition enumeration and inclusion-minimality checks"
      ],
      "links": {
        "source": "https://procaccia.info/wp-content/uploads/2020/03/comsoc.pdf"
      }
    },
    {
      "num": "7.2",
      viz: V.lesson2,
      "kind": "Theorem",
      "name": "Trade robustness characterizes weighted systems",
      "deps": [
        "polsci-7.1"
      ],
      "statement": "For a finite monotone yes–no system with a losing empty coalition and winning full coalition, **weightedness is equivalent to trade robustness**. A trading obstruction consists of equally long lists of winning coalitions $W_1,\\ldots,W_k$ and losing coalitions $L_1,\\ldots,L_k$ in which every member appears equally often:\n$$\\sum_{r=1}^k\\mathbf 1_{i\\in W_r}=\\sum_{r=1}^k\\mathbf 1_{i\\in L_r}.$$\nLists may repeat coalitions, and coalitions may overlap. The rearrangement preserves every member's total appearances but changes every winning coalition into a losing one. Such a certificate proves that no single nonnegative weight vector and quota represents the rule.",
      "idea": "If a weighted representation existed, adding the winning coalition weights would give at least $kq$, while adding the losing coalition weights would give strictly less than $kq$. Balanced appearances make those two totals identical, a contradiction. For the converse, view coalitions as zero–one vectors. If the convex hulls of winning and losing vectors intersect, a rational intersection point gives rational convex combinations; clearing denominators produces a balanced trade. If the hulls are disjoint, strict finite-dimensional separation gives a threshold representation. A negative coordinate cannot affect a monotone threshold rule's outcome and can be dropped, leaving nonnegative weights. The explorer checks concrete certificates rather than treating a short unsuccessful search as this general theorem.",
      "scope": "The Taylor–Zwicker original article body was unavailable; the characterization is supported here by the separately read Kirsch and handbook accounts and the supplied finite argument. The authored search checks trades of lengths two and three and, when needed, integer weights from zero through four. Finding either a balanced trade or a fully checked weight representation is a certificate. Finding neither is inconclusive. The bicameral example requires a majority in each of two three-member chambers; custom rules are upward closures of three nonempty coalition generators.",
      "caption": "Follow the same member tokens from winning coalitions to losing coalitions and compare their conserved appearance totals. Inspect the contradiction, or a checked weight certificate when one is found. Try a bicameral rule or edit the generators of an authored monotone system. A bounded search that finds no certificate is explicitly inconclusive.",
      "refs": [
        "Kirsch, A Mathematical View on Voting and Power, selected trade definition/Theorem 16, PDF pages 8–9 read",
        "Chalkiadakis & Wooldridge ch.16.5; selected PDF pages 408–410 read",
        "Own balanced-multiset certificate search and finite convex-separation argument; Taylor–Zwicker 1992 original body unread"
      ],
      "links": {
        "source": "https://www.fernuni-hagen.de/mi/fakultaet/emeriti/docs/kirsch/voting.pdf"
      }
    },
    {
      "num": "7.3",
      viz: V.lesson3,
      "kind": "Definition",
      "name": "Shapley–Shubik power index",
      "deps": [
        "polsci-7.1",
        "game-8.7"
      ],
      "statement": "In a monotone yes–no system, place all $n$ members in a uniformly chosen ordering. Starting with no supporters, let them join in that order. Exactly one member changes the coalition from losing to winning; this member is **pivotal**. The **Shapley–Shubik index** $\\phi_i$ is the fraction of the $n!$ orderings in which member $i$ is pivotal. Equivalently, define\n$$\\delta_i(S)=v(S\\cup\\{i\\})-v(S),$$\n$$p(S)=\\frac{|S|!(n-|S|-1)!}{n!}.$$\nThen $\\phi_i=\\sum_{S\\subseteq N\\setminus\\{i\\}}p(S)\\delta_i(S)$. The shares are nonnegative and sum to one.",
      "idea": "A fixed predecessor set $S$ occurs before $i$ in exactly $|S|!(n-|S|-1)!$ orderings: arrange its members first, place $i$, then arrange everybody else. This proves the coalition formula without assuming the later cooperative-game chapters. Along any complete ordering, the marginal contributions telescope from $v(\\varnothing)=0$ to $v(N)=1$; monotonicity makes each contribution zero or one, so exactly one pivot exists. A member with no swing has index zero, and interchangeable members receive equal shares. The explorer enumerates all twenty-four orderings of four authored members; the currently inspected order and the exact all-order distribution are different objects.",
      "scope": "Uniform orderings define this a priori index. They are not a claim about the order or likelihood of real legislative bargaining, roll-call votes or agreement. The displayed weights and order are authored. Play visits the finite lexicographic ordering list, and a prefix control reveals only the selected number of positions. Exact index bars always use all orderings, not the visible prefix or an unreported random sample. Degenerate inputs without a winning full coalition are identified separately.",
      "caption": "Inspect the actual member order, running weight and first crossing of the quota. Reveal a prefix or play through the finite ordering list. The companion distribution counts pivots in all twenty-four orders with exact fractions. Editing weights or the quota changes the rule and recomputes the distribution; choosing another order changes the example being inspected.",
      "refs": [
        "Chalkiadakis & Wooldridge ch.16.2.3, definitions 16.5/equations 16.1–16.2; actual PDF pages 399–400 read",
        "Own complete permutation enumeration and predecessor-set counting proof"
      ],
      "links": {
        "source": "https://procaccia.info/wp-content/uploads/2020/03/comsoc.pdf"
      }
    },
    {
      "num": "7.4",
      viz: V.lesson4,
      "kind": "Definition",
      "name": "Banzhaf power index",
      "deps": [
        "polsci-7.1"
      ],
      "statement": "Member $i$ has a **swing** when adding that member to a losing coalition makes it win. In a winning coalition the same member is **critical** if removing it makes the coalition lose. Let $c_i$ count swings among the $2^{n-1}$ coalitions that exclude $i$. The absolute Penrose–Banzhaf probability is\n$$\\beta_i=\\frac{c_i}{2^{n-1}}.$$\nThe **normalized Banzhaf index** is instead\n$$b_i=\\frac{c_i}{\\sum_jc_j}.$$\nThe normalized shares sum to one. Absolute probabilities need not. The distinction matters when the membership or voting rule changes.",
      "idea": "Pair every coalition without $i$ with the coalition obtained by adding $i$. Count the pairs whose outcome changes. This gives the absolute probability when the other members independently support the proposal with probability one half. Normalizing reallocates the total swing count into shares and generally changes its units. Shapley–Shubik gives different weights to predecessor coalitions of different sizes; Banzhaf counts every subset of the other members equally. Neither formula says that numerical weight itself is power. The selected coalition shows the removal tests behind the counts, while the comparison uses the same complete rule for both indices.",
      "scope": "These are exact a priori calculations for an authored finite system. Uniform subsets and uniform orderings are distinct assumptions; neither is inferred from historical voting data. A normalized share is not an individual's probability of casting a decisive vote. The empty coalition must lose and the full coalition win for the displayed normalized simple-game interpretation. If no swing exists under a degenerate control setting, the normalized index is undefined and is shown as such.",
      "caption": "Choose supporters and remove each member in turn to see who is actually critical. Pair each critical membership with its losing counterpart, then inspect all swing counts. Compare absolute decisiveness, normalized Banzhaf shares and Shapley–Shubik shares on the same authored rule, with the units and denominators kept visible.",
      "refs": [
        "Kirsch, selected absolute/normalized Banzhaf definitions and odd-majority proof, actual PDF pages 13–15 read",
        "Chalkiadakis & Wooldridge ch.16.2.3, selected absolute Banzhaf definition, PDF page 400 read",
        "Own exact subset enumeration and critical-member pairing"
      ],
      "links": {
        "source": "https://www.fernuni-hagen.de/mi/fakultaet/emeriti/docs/kirsch/voting.pdf"
      }
    },
    {
      "num": "7.5",
      viz: V.lesson5,
      "kind": "Phenomenon",
      "name": "Weight is not power: the 1958 EEC Council",
      "deps": [
        "polsci-7.3",
        "polsci-7.4"
      ],
      "statement": "In the early EEC Council, Germany, France and Italy had four votes each, Belgium and the Netherlands two each, and Luxembourg one: seventeen in total. For the pure weighted rule with quota twelve, Luxembourg is never critical. Every coalition of the other five members has an even weight; adding one cannot take a weight below twelve to twelve. Both its Shapley–Shubik and Banzhaf power are therefore zero **under that rule**. The historical system also used a different rule in other cases: at least twelve votes and at least four countries. Under that additional country minimum, Luxembourg can be critical.",
      "idea": "Germany, France and Italy together supply twelve votes but only three countries. With a four-country minimum they lose; adding Luxembourg makes them win. That single witness disproves an unqualified claim that Luxembourg had zero formal power under every EEC procedure. The explorer enumerates all sixty-four coalitions and recomputes both indices from the stated rule. It also permits counterfactual quotas while keeping the weights fixed. This reveals a broader lesson: voting power belongs to a complete decision rule, not to the weight vector alone. The independently computed historical double-rule values for Luxembourg are a Shapley–Shubik share of $1/60$ and an absolute Banzhaf probability of $1/32$.",
      "scope": "The distinct Council institutional history of 2016 and Mayer's 2018 analysis support the historical weights and the two rule variants. The original Treaty Article 148 body was unavailable and is not claimed verified. The pure quota rule concerned specified Commission-proposal decisions; the additional country minimum applied in other cases. Transition veto rights, consensus practice, Benelux cooperation, agenda control and communication can matter beyond this formal yes–no model. Zero power here does not mean zero actual political influence. Counterfactual quota settings are labeled as such.",
      "caption": "Compare six voting weights with the exact power indices and inspect Luxembourg’s actual swing pairs. Switch between the pure weighted rule and the historical four-country minimum. The Germany–France–Italy coalition provides a direct test of the distinction. Moving the quota explores a counterfactual rule; it does not rewrite the historical threshold.",
      "refs": [
        "Council of the European Union, The European Council and the Council of the EU through time, 2016; actual complete PDF page 53 read/viewed",
        "Mayer, Luxembourg in the Early Days of the EEC: Null Player or Not?, Games 9:29, 2018; complete main text and actual Table 1 viewed",
        "Own exact 64-coalition calculations; source rounded indices not used as a numerical oracle"
      ],
      "links": {
        "source": "https://www.consilium.europa.eu/media/33261/qc0418220enn.pdf"
      }
    },
    {
      "num": "7.6",
      viz: V.lesson6,
      "kind": "Theorem",
      "name": "Penrose’s square-root law",
      "deps": [
        "polsci-7.4",
        "polsci-5.3"
      ],
      "statement": "Consider independent jurisdictions with odd electorates $N_i$. Citizens independently cast fair binary votes; each delegate follows its jurisdiction's simple majority. A selected citizen is locally decisive precisely when the other $N_i-1$ citizens tie:\n$$p_i=2^{-(N_i-1)}\\binom{N_i-1}{(N_i-1)/2}.$$\nIf the delegate has absolute Banzhaf probability $\\beta_i$ in the upper council, the citizen's probability of changing the final result is exactly $p_i\\beta_i$. For large $N_i$, $p_i\\sim\\sqrt{2/(\\pi N_i)}$. Thus equal citizen power requires delegate **power** proportional to $\\sqrt{N_i}$ asymptotically. Assigning weights proportional to that square root does not automatically produce those powers in a finite council.",
      "idea": "Two events must occur: the citizen changes the local majority, and the resulting delegate vote changes the upper decision. Independence across jurisdictions and balanced odd local majorities make the other delegates independent fair voters, so the two probabilities multiply. For finite electorates, equal citizen decisiveness would require upper powers proportional to $1/p_i$, rather than replacing this exact quantity by its asymptotic square root. Upper-council powers are themselves determined by the quota and all weights, and may take only particular discrete values. The explorer uses five authored odd square populations so equal, population and square-root weights can all be compared as exact integers. It displays achieved powers and target proportions separately.",
      "scope": "The result concerns the declared independent fair-vote model, not a universal account of democratic fairness or actual election behavior. The finite product is exact; the asymptotic expression is explicitly approximate. All jurisdictions have odd populations, avoiding a local tie-breaking convention. The populations are authored and are not country data. A finite square-root weight assignment can fail to equalize citizen power; the explorer exposes that discrepancy. Correlated opinions, unequal lean, strategic representation or a different upper rule require different calculations.",
      "caption": "Follow a citizen’s two-stage route to a decisive final vote. Change five authored electorate sizes, the weight scheme and the quota. Compare actual delegate powers with the finite target proportions, then inspect each citizen’s exact product probability. The square-root guide is an approximation; neither the weights nor the finite outcomes are silently identified with that target.",
      "refs": [
        "Kirsch, selected odd-majority and two-tier derivation/Corollary 41; actual PDF pages 13–15 and 21 read/viewed, selected surrounding text read",
        "Written polsci 5.3 decisive-vote lesson, complete body read",
        "Own exact finite product, binomial probabilities and discrete upper-council comparison"
      ],
      "links": {
        "source": "https://www.fernuni-hagen.de/mi/fakultaet/emeriti/docs/kirsch/voting.pdf"
      }
    },
    {
      "num": "7.7",
      viz: V.lesson7,
      "kind": "Phenomenon",
      "name": "The power of the U.S. president",
      "deps": [
        "polsci-7.3"
      ],
      "statement": "A president's formal voting power can be analyzed only after specifying the entire bill-passage rule. In the full-membership illustration, a signed bill needs at least 218 House supporters and Senate approval; the Senate needs 51 supporters, or 50 plus the vice president's tie-breaking vote. Alternatively, 290 House supporters and 67 senators can override a veto. This is a monotone yes–no rule on 435 representatives, 100 senators, a president and a vice president. Its Shapley–Shubik calculation treats all 537 individuals as separately ordered players. In this stated model the president's computed share is approximately 16.3%.",
      "idea": "Represent each possible predecessor coalition by four counts: representatives, senators, president and vice president. If it contains $h$ of the available House members and $s$ of the available senators, its multiplicity includes $\\binom{H'}h\\binom{S'}s$. Count only configurations in which adding the inspected player changes failure to passage. Conditional on a predecessor-set size $k$, every such subset has probability $1/(n\\binom{n-1}k)$ in the uniform-order model. Summing those exact contributions yields each type's individual share; multiplying by its membership gives the corresponding body's aggregate share. The explorer also offers smaller authored chambers, where the same logic can be checked by literal coalition enumeration.",
      "scope": "This is an authored full-participation bill model supported by Kirsch's separately read formal example, not a reconstruction or verification of the 1954 paper's calculation. Fixed membership, sincere yes–no positions and the two declared routes omit abstentions, vacancies, filibusters, parties, agenda setting, pocket vetoes and strategic bargaining. Two-thirds thresholds here use the fixed full membership. Switching off a route or changing chamber size creates a counterfactual model. Per-member and whole-body shares have different units and are explicitly labeled; they are not empirical measures of political influence.",
      "caption": "Inspect the signature and veto-override routes using selected support counts and thresholds. Compare a member’s formal share with a whole chamber’s aggregate share, keeping the units visible. Switch between full membership and smaller authored chambers, then change the declared routes to see which pivotal configurations appear or disappear.",
      "refs": [
        "Kirsch, selected US federal-system formalization, actual web text/PDF pages 5–6 read",
        "Chalkiadakis & Wooldridge, selected Shapley predecessor-set formula, actual PDF page 399 read/viewed",
        "Own exact chamber-count multiplicities and rank-conditioned calculation; independently checked against literal small systems"
      ],
      "links": {
        "source": "https://www.fernuni-hagen.de/mi/fakultaet/emeriti/docs/kirsch/voting.pdf"
      }
    },
    {
      "num": "7.8",
      viz: V.lesson8,
      "kind": "Phenomenon",
      "name": "Voter power in the Electoral College",
      "deps": [
        "polsci-7.4",
        "polsci-7.6"
      ],
      "statement": "Electoral vote weight and the probability of a decisive citizen vote answer different questions. The displayed allocation uses the National Archives’ 2024/2028 table: 51 jurisdictions, 538 electoral votes and a threshold of 270. First treat each jurisdiction as one independent fair-voting bloc and calculate its absolute Banzhaf probability from all coalitions of the other 50 blocs. A citizen-level calculation then needs a separate model of voting within that jurisdiction. The explorer supplies explicitly **hypothetical** odd electorates, not observed US populations, to show how that additional assumption changes the result.",
      "idea": "For a bloc with weight $w_i$, count the other-bloc weight sums between $q-w_i$ and $q-1$. Exactly those sums make its support decisive for the yes–no threshold. A generating polynomial $\\prod_{j\\ne i}(1+z^{w_j})$ counts those subsets exactly. In the authored local electorate of size $N_i$, fair independent citizens give a central-binomial local tie probability. A different model draws a separate uniform common lean within each jurisdiction; averaging the tie probability gives exactly $1/N_i$. In both constructions the other jurisdictions remain independent and balanced, so upper decisiveness multiplies the local factor. The same allocation can therefore support different citizen-power patterns. No model-free conclusion that large or small states always benefit follows.",
      "scope": "The electoral allocations are source-backed; the electorate sizes are authored, and no actual turnout, eligible population, vote outcomes or election forecast is used. The 51-bloc model treats Maine and Nebraska as unified blocs even though the actual source describes their district-based splits. It also abstracts from a 269–269 contingent-election procedure. Non 270 quotas are counterfactual. Gelman, Katz and Bafumi's separately read 2003 manuscript critiques applying iid square-root scaling to historical elections; its empirical plots and forecasts are not reproduced, and its sample does not establish a current-election prediction.",
      "caption": "Inspect a jurisdiction’s electoral allocation and exact bloc decisiveness. Equal-weight jurisdictions are grouped together without moving their values; the inspector retains every jurisdiction’s identity. Change the hypothetical electorate scale and local voting assumption to see the citizen factor and final probability change. The source allocation and authored citizen scenarios remain explicitly distinct.",
      "refs": [
        "National Archives, Distribution of Electoral Votes; actual main table/rule exceptions read 2026-10-27, 2024/2028 allocation based on 2020 Census",
        "Gelman, Katz & Bafumi, Standard Voting Power Indexes Don’t Work: An Empirical Analysis, November 16 2003 author manuscript; selected methods/results and actual Figure 1 read/viewed",
        "Own exact generating-polynomial subset counts and authored two-tier scenarios; no empirical voter data"
      ],
      "links": {
        "source": "https://www.archives.gov/electoral-college/allocation"
      }
    },
    {
      "num": "7.9",
      viz: V.lesson9,
      "kind": "Model",
      "name": "Minimal winning coalitions and Gamson’s law",
      "deps": [
        "polsci-7.1"
      ],
      "statement": "A coalition is **minimal winning** if it wins but every member is essential to its victory. It need not be the winning coalition with the fewest seats or members, and formal minimality alone does not predict which government will form. **Gamson's law** is a separate empirical regularity: parties in a coalition tend to receive cabinet portfolio shares related to their shares of that coalition's legislative seats. It is a context-dependent proposition about allocation, not an exact identity or a consequence of the definition of a minimal winning coalition.",
      "idea": "For the authored parties, enumerate all winning coalitions and test each member's removal. For a selected coalition, compare a party's fraction of coalition seats with its fraction of cabinet positions. The diagonal represents exact proportionality, while signed residuals reveal over- or underrepresentation. A declared rounding-and-reservation rule produces the illustrative integer cabinet; its points are not historical observations. The separate source comparator reports Chaisty and Power's 2024 correlations for 1551 country-years in 97 countries during 1966–2019. The parliamentary, semi-presidential and presidential subsamples have different associations and sample sizes. Correlation is not the same as exact proportionality or the absence of a formateur advantage.",
      "scope": "The party seats, candidate coalition and cabinet allocations are authored. The largest coalition party is the proposer only under the declared illustrative rule; it is not a general empirical claim. A losing selected coalition is identified rather than presented as a predicted government. The source study uses competitive cross-party governments with complete cabinet-party data; its three reported correlations are observational summaries, not randomized effects of constitutional formats. No source microdata points, cabinet observations or regression estimates are invented or digitized. The selected source methods/Figure 1 are read; the full regressions and supplement are not claimed verified.",
      "caption": "Identify inclusion-minimal winning coalitions, then inspect an authored cabinet allocation against the proportionality diagonal. Change the coalition, cabinet size and positions reserved for its largest party. Compare the resulting residuals with the separately labeled source association summary, whose sample sizes and observational scope remain visible.",
      "refs": [
        "Mayer 2018, selected simple-game/minimal-winning definition, actual PDF page 4 read",
        "Chaisty & Power, Gamson going global? Cabinet proportionality in comparative perspective, EPSR 16(4), 2024, 630–646; selected main/methods and actual Figure 1 read/viewed",
        "Own finite seat-coalition enumeration and explicit integer cabinet-allocation illustration"
      ],
      "links": {
        "source": "https://doi.org/10.1017/S1755773924000067"
      }
    },
    {
      "num": "7.10",
      viz: V.lesson10,
      "kind": "Paradox",
      "name": "The paradox of new members",
      "deps": [
        "polsci-7.4"
      ],
      "statement": "Adding a new member can increase an existing member's normalized voting power even when the old weights and quota stay fixed. Before entry, the member may have few or no swing opportunities. New coalitions containing the entrant can create additional contexts in which that old member is critical. This is the **paradox of new members**: more players share the final normalized index, yet an old player's share can rise. It is a possibility, not a claim that entry benefits every existing member.",
      "idea": "Partition the expanded system's predecessor coalitions according to whether the entrant is absent or present. Without the entrant, the old swing tests are unchanged. With the entrant, some former swings disappear and new swings can appear. Hence the new count for an old member equals twice its old count plus gained contexts minus lost contexts. A zero-weight entrant duplicates every old context without changing absolute probabilities, normalized shares or Shapley–Shubik shares. The explorer lists concrete gained and lost witnesses and compares before/after indices using the same old weights and quota. For example, the source's three-member $(2,2,1)$ council with quota 4 gives its last member no power; adding another weight 1 member makes that member critical in some coalitions.",
      "scope": "These are exact finite comparisons under specified a priori indices. A raw swing count, absolute probability and normalized share have different denominators and need not move alike. The same-quota entry comparison is distinct from changing the quota, splitting an identity, annexing another member or changing political preferences. The displayed source-shaped and authored examples do not predict an actual institution's response to enlargement. When the full coalition cannot win, the display identifies the degenerate case rather than assigning a normalized simple-game interpretation.",
      "caption": "Add an entrant while holding the old weights and quota fixed, then compare the same old members before and after entry. Select a member to inspect actual gained and lost swing contexts. Change the entrant’s weight, including zero, and switch the index unit to see why duplicated counts and changing power shares are different statements.",
      "refs": [
        "Chalkiadakis & Wooldridge, ch.16.4.1, source new-member example 16.12; actual PDF pages 407–408 read",
        "Own exact before/after enumeration, context partition and gained/lost witnesses"
      ],
      "links": {
        "source": "https://procaccia.info/wp-content/uploads/2020/03/comsoc.pdf"
      }
    },
    {
      "num": "7.11",
      viz: V.lesson11,
      "kind": "Paper",
      "name": "A Method for Evaluating the Distribution of Power",
      "deps": [
        "game-8.11",
        "polsci-7.1"
      ],
      "paper": {
        "authors": "L. S. Shapley and Martin Shubik",
        "year": 1954,
        "title": "A Method for Evaluating the Distribution of Power in a Committee System",
        "venue": "American Political Science Review 48 (3): 787–792",
        "doi": "10.2307/1951053"
      },
      "introduces": [
        "polsci-7.3",
        "polsci-7.7"
      ],
      "statement": "Shapley and Shubik's 1954 paper introduced an a priori method for evaluating power in committee systems. The publisher's extract identifies its simple-game approach and legislative applications. The original article body is not verified here. This lesson explains the formal uniform-order method using separately read later accounts and new finite constructions: a member's share is the probability of being the unique losing-to-winning pivot in a uniformly chosen complete ordering. In a veto council, the threshold may depend on both the total yes count and support from every veto holder.",
      "idea": "Follow a complete ordering while retaining member identities. A running total alone cannot determine passage when veto holders exist: reaching the numerical quota with one veto holder missing still loses. The authored fifteen-seat illustration requires at least 9 supporters and all 5 veto holders. Its exact Shapley–Shubik calculation enumerates predecessor coalitions with the correct ordering weights, rather than sampling a tiny fraction of $15!$ orders. The animation shows reproducible example orders; the exact probability distribution includes all orders. Equal-role members have equal formal shares, but the two role classes can receive very different shares. A pivot-position diagram connects each visible crossing to the underlying all-order count.",
      "scope": "Frozen 1954 bibliographic metadata are retained, while original-body and original-figure verification remain unclaimed. The actual publisher extract and later handbook/Kirsch formal accounts support this explanation. The fifteen-seat rule is an authored all-yes/no abstraction of the later council structure described by Kirsch; it is not presented as a reproduced 1954 example or a complete account of present UN procedure. Abstention, procedural votes, strategic bargaining and real political influence are omitted. Reproducible animation orders are illustrations, not an empirical chronology or a uniform statistical sample.",
      "caption": "Inspect an authored veto council’s actual member order, cumulative total and arriving veto holders. The first point at which both requirements hold is the pivot. Play visits reproducible example orders while the exact all-order role shares and pivotal-position distribution remain separately computed. The historical paper identity and the limits of original-source verification stay explicit.",
      "refs": [
        "Shapley & Shubik 1954, publisher extract and bibliographic metadata only; original article body/figures unavailable and unverified",
        "Chalkiadakis & Wooldridge 2016, selected formal Shapley account, actual PDF pages 399–400 read/viewed",
        "Kirsch, selected fifteen-seat 9-plus-all-veto-holders rule, actual text read",
        "Own exact predecessor-coalition enumeration and reproducible ordering illustration"
      ],
      "links": {
        "source": "https://www.cambridge.org/core/journals/american-political-science-review/article/abs/method-for-evaluating-the-distribution-of-power-in-a-committee-system/5C4948A19BD4138D855EDA0536496BCE"
      }
    }
  ]
};
