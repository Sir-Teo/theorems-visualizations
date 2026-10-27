// Syllabus — Networks & Collective Behavior (curated course; see collection.js for references)
//
// Sources consulted (research pass, Oct 2026):
//   Reference TOCs
//   - Easley & Kleinberg (E&K), Networks, Crowds, and Markets — full section-level TOC from the authors’ site:
//     https://www.cs.cornell.edu/home/kleinber/networks-book/  (refs use its § numbers).
//   - Schelling, Micromotives and Macrobehavior — ch. 1 Micromotives and Macrobehavior, 2 The Inescapable
//     Mathematics of Musical Chairs, 3 Thermostats, Lemons, and Other Families of Models, 4 Sorting and
//     Mixing: Race and Sex, 5 Sorting and Mixing: Age and Income, 6 Choosing Our Children’s Genes,
//     7 Hockey Helmets, Daylight Saving, and Other Binary Choices (Open Library record
//     https://www.openlibrary.org/works/OL2259853W ).
//   - Newman, Networks, 2e (2018) — TOC only partly retrieved (chs 1–4); refs to later chapters are
//     chapter-level from the book’s known structure (measures, random graphs, configuration model,
//     network formation, community structure, percolation, epidemics).
//   Courses
//   - MIT 14.15J/6.207 Networks (Spring 2018) lecture list: graphs and metrics, Markov chains and
//     centralities, Erdős–Rényi and giant components, network games, traffic and congestion, network
//     effects, diffusion, social learning, network formation.
//     https://ocw.mit.edu/courses/14-15j-networks-spring-2018/pages/lecture-notes/
//   - Cornell INFO 2040 / E&K course structure (same TOC).
//   Lists and encyclopedias
//   - Ostrom’s eight design principles: https://wiki.p2pfoundation.net/Eight_Design_Principles_for_Common_Pool_Resource_Systems
//     and Cox, Arnold & Villamayor Tomás (2010) review: https://www.ecologyandsociety.org/vol15/iss4/art38/
//   - https://en.wikipedia.org/wiki/List_of_paradoxes (friendship, Braess)
//
// Gaps filled after the comparison: triadic closure and the local-bridge theorem, structural holes,
// structural balance, DeGroot learning, Kleinberg navigability, power-law fitting and the scale-free
// debate, MusicLab, complex contagion, information cascades, El Farol, opinion dynamics, the diversity
// prediction theorem, Braess and the price of anarchy, crowd and traffic dynamics.
// Hand-offs: PageRank and random walks on graphs are in `stoch`; SIR and Kuramoto ODEs in `ode`; logistic
// growth and harvesting in `mathbio`/`ode`; the tragedy of the commons as a market failure in `micro`;
// Condorcet’s jury theorem in `polsci`; Braess, the price of anarchy, ESS and the spatial prisoner’s
// dilemma in `game`; the coalescent in `popgen`; Zipf’s law for cities in `geog`. These are cited and
// given their network/collective/empirical framing here.
// NOTE: Dunbar’s number, Ostrom, the Bass model and crowd dynamics are not covered by the collection.js
// references; those items have refs: [] until a reference is added.
export default {
  collection: 'soc',
  chapters: [
    // ───────────────────────────────────────────────────────────── 1
    {
      n: 1,
      title: 'Micromotives and macrobehavior',
      summary: String.raw`Collective outcomes often bear little resemblance to what any individual wants. Schelling’s segregation model is the classic demonstration: mild preferences for similar neighbours produce stark segregation. Tipping points and critical mass appear whenever people’s choices depend on how many others are already choosing the same thing, and Granovetter’s threshold model shows how fragile such cascades can be.`,
      items: [
        { num: '1.1', kind: 'Concept', name: 'Emergence: aggregate patterns from individual rules', deps: [], refs: ['Schelling ch. 1'],
          pic: 'An auditorium fills seat by seat under simple seating rules you choose; the final pattern (back rows full, front empty) emerges though nobody wanted it.' },
        { num: '1.2', kind: 'Model', name: 'Schelling’s segregation model', deps: ['soc-1.1'], refs: ['Schelling ch. 4', 'E&K §4.5'],
          pic: 'Two kinds of agents on a grid move when fewer than a fraction T of their neighbours are like them; set T and watch the board sort itself, with a segregation index plotted over time.' },
        { num: '1.3', kind: 'Phenomenon', name: 'Mild preferences, strong segregation', deps: ['soc-1.2'], refs: ['Schelling ch. 4'],
          pic: 'Sweep the tolerance threshold from 0 to 0.8 across many runs: average like-neighbour share jumps to about 75% even at T = 1/3, and collapses into disorder when T is too demanding.' },
        { num: '1.4', kind: 'Definition', name: 'Measuring segregation: dissimilarity and exposure', deps: ['soc-1.2'], refs: ['Schelling ch. 4'],
          pic: 'A city map divided into tracts; the dissimilarity index (share who would have to move to even out) and exposure index update as you repaint tracts.' },
        { num: '1.5', kind: 'Model', name: 'Bounded-neighbourhood tipping', deps: ['soc-1.2'], refs: ['Schelling ch. 4'],
          pic: 'Tolerance schedules for two groups in one neighbourhood plotted together; the dynamics drift to all-one-group or a mixed equilibrium depending on where you start.' },
        { num: '1.6', kind: 'Concept', name: 'Critical mass and tipping points', deps: ['soc-1.5'], refs: ['Schelling ch. 3'],
          pic: 'Plot the share who will act as a function of the share already acting; equilibria are crossings of the 45° line, and an S-shaped curve has an unstable middle crossing — the tipping point.' },
        { num: '1.7', kind: 'Model', name: 'Schelling’s binary-choice diagrams', deps: ['soc-1.6', 'micro-12.10', 'game-1.5'], refs: ['Schelling ch. 7'],
          pic: 'Payoff lines for choosing left or right as functions of how many others choose right (hockey helmets, daylight saving); their crossings and slopes decide which collective outcomes are stable.' },
        { num: '1.8', kind: 'Model', name: 'Granovetter’s threshold model of collective behaviour', deps: ['soc-1.6'], refs: ['E&K §19.6'],
          pic: 'A crowd of 100 people with riot thresholds 0, 1, 2, …, 99: one instigator triggers everyone; draw the threshold histogram and iterate the cascade map to its fixed point.' },
        { num: '1.9', kind: 'Phenomenon', name: 'Fragile cascades: one changed threshold stops the riot', deps: ['soc-1.8'], refs: ['E&K §19.6'],
          pic: 'Change the person with threshold 1 to threshold 2: the riot stops after one person, though the two crowds look almost identical in their average radicalism.' },
        { num: '1.10', kind: 'Paper', name: 'Dynamic Models of Segregation',
          paper: { authors: 'Thomas C. Schelling', year: 1971, title: 'Dynamic Models of Segregation', venue: 'Journal of Mathematical Sociology 1 (2): 143–186', doi: '10.1080/0022250X.1971.9989794' },
          introduces: ['soc-1.2', 'soc-1.3', 'soc-1.5'], deps: ['soc-1.1'], refs: [],
          pic: 'Schelling’s checkerboard as live agents: two kinds of counters scattered on a grid with blank squares, each content if at least a set fraction of its neighbours (say a third) are its own kind; discontented counters move in turn to the nearest square that satisfies them, and the reader sets the tolerance, the mix and the vacancy rate and watches mild preferences produce sharply segregated neighbourhoods, with his one-dimensional version and a segregation index alongside.' },
        { num: '1.11', kind: 'Paper', name: 'Threshold Models of Collective Behavior',
          paper: { authors: 'Mark Granovetter', year: 1978, title: 'Threshold Models of Collective Behavior', venue: 'American Journal of Sociology 83 (6): 1420–1443', doi: '10.1086/226707' },
          introduces: ['soc-1.8', 'soc-1.9'], deps: ['soc-1.6', 'soc-1.10'], refs: [],
          pic: 'Granovetter’s riot: 100 people with thresholds 0, 1, 2, …, 99 join one after another until all are rioting; change the one person with threshold 1 to threshold 2 and only the instigator riots; then draw any distribution of thresholds and find the outcome where its cumulative curve first crosses the 45° line.' },
      ],
    },
    // ───────────────────────────────────────────────────────────── 2
    {
      n: 2,
      title: 'Social networks and ties',
      summary: String.raw`Treating people as nodes and relationships as edges turns social structure into graph theory. Friends of friends tend to become friends (triadic closure), which forces the bridges between groups to be weak ties — the reason acquaintances, not close friends, bring new information such as jobs. Similar people cluster, by choice and by influence, and signed networks tend toward balance.`,
      items: [
        { num: '2.1', kind: 'Definition', name: 'Social networks as graphs', deps: [], refs: ['E&K §2.1', 'Newman ch. 4'],
          pic: 'Load a small real network (a karate club) and drag its nodes; paths, connected components and degrees are highlighted as you click.' },
        { num: '2.2', kind: 'Definition', name: 'Distance and breadth-first search', deps: ['soc-2.1', 'algo-8.5'], refs: ['E&K §2.3'],
          pic: 'Pick a person and run BFS: rings of distance 1, 2, 3 expand outward, and the distance distribution of the whole network is plotted.' },
        { num: '2.3', kind: 'Definition', name: 'Degree and degree distribution', deps: ['soc-2.1'], refs: ['Newman ch. 10'],
          pic: 'Histogram of degrees for several real networks on linear and log axes; toggle to see which look Poisson and which have long tails.' },
        { num: '2.4', kind: 'Paradox', name: 'The friendship paradox', deps: ['soc-2.3', 'prob-1.6.9a'], refs: ['Newman ch. 12'],
          pic: 'Compare each person’s degree with the average degree of their friends: most points lie below the diagonal, and the gap equals variance over mean of the degree distribution.' },
        { num: '2.5', kind: 'Concept', name: 'Triadic closure and the clustering coefficient', deps: ['soc-2.1'], refs: ['E&K §3.1'],
          pic: 'Add edges one at a time and watch open triangles close; the clustering coefficient of a real network is compared with a random graph of the same density.' },
        { num: '2.6', kind: 'Theorem', name: 'Strong triadic closure makes local bridges weak', deps: ['soc-2.5'], refs: ['E&K §3.2'],
          pic: 'Label edges strong or weak; if a node with two strong ties always closes the triangle, the page proves on your graph that every local bridge must be weak.' },
        { num: '2.7', kind: 'Phenomenon', name: 'The strength of weak ties (Granovetter)', deps: ['soc-2.6'], refs: ['E&K §3.2', 'E&K §3.3'],
          pic: 'Simulate job information spreading through strong and weak ties; most new information arrives via weak ties, matching Granovetter’s survey and the large-scale phone-network study.' },
        { num: '2.8', kind: 'Concept', name: 'Structural holes and betweenness', deps: ['soc-2.7'], refs: ['E&K §3.5', 'E&K §3.6'],
          pic: 'Nodes coloured by betweenness centrality; the broker spanning two clusters lights up, and removing her disconnects the groups.' },
        { num: '2.9', kind: 'Concept', name: 'Homophily', deps: ['soc-2.1', 'prob-1.6.1'], refs: ['E&K §4.1'],
          pic: 'A school friendship network coloured by grade or race; the observed share of cross-group ties is compared with what random mixing would produce.' },
        { num: '2.10', kind: 'Concept', name: 'Selection versus social influence', deps: ['soc-2.9'], refs: ['E&K §4.2'],
          pic: 'Two simulated worlds — people choose similar friends, or friends make people similar — produce identical snapshots; only the time series tells them apart, and the page shows why observational contagion claims are contested.' },
        { num: '2.11', kind: 'Definition', name: 'Assortative mixing by degree', deps: ['soc-2.3', 'prob-1.6.3'], refs: ['Newman ch. 7'],
          pic: 'Scatter each edge’s endpoint degrees; social networks tilt positive (hubs link to hubs) while technological ones tilt negative, with the assortativity coefficient computed.' },
        { num: '2.12', kind: 'Theorem', name: 'Structural balance theorem (Cartwright–Harary)', deps: ['soc-2.1'], refs: ['E&K §5.1', 'E&K §5.2'],
          pic: 'Sign the edges of a complete graph as friend or enemy; if every triangle has an even number of enemies the page splits the nodes into two hostile camps, otherwise it flags the unbalanced triangles.' },
        { num: '2.13', kind: 'Hypothesis', name: 'Dunbar’s number (contested)', deps: ['soc-2.3'], refs: [],
          pic: 'Primate group size against neocortex ratio with the regression extrapolated to about 150 for humans, and the 2021 reanalysis whose 95% interval spans from a handful to over 500.' },
        { num: '2.14', kind: 'Concept', name: 'Affiliation networks and focal closure', deps: ['soc-2.5', 'soc-2.9', 'prob-2.1.13'], refs: ['E&K §4.3', 'E&K §4.4'],
          pic: 'People and the clubs they join as a two-mode graph; the chance that two people become friends rises with the number of foci they share, plotted from simulated link formation.' },
        { num: '2.15', kind: 'Theorem', name: 'Weak structural balance: many hostile camps', deps: ['soc-2.12'], refs: ['E&K §5.4'],
          pic: 'Forbid only the all-enemy-but-one triangle; the page partitions your signed complete graph into any number of mutually hostile cliques, or shows the offending triangle.' },
        { num: '2.16', kind: 'Paper', name: 'The Strength of Weak Ties',
          paper: { authors: 'Mark S. Granovetter', year: 1973, title: 'The Strength of Weak Ties', venue: 'American Journal of Sociology 78 (6): 1360–1380', doi: '10.1086/225469' },
          introduces: ['soc-2.6', 'soc-2.7'], deps: ['soc-2.5'], refs: [],
          pic: 'Draw a network and mark ties strong or weak: the forbidden triad (two strong ties without the closing third) is flagged, and once it is banned every bridge turns out weak; then the job-search data from his Newton study, where of those who found work through a contact 16.7% saw that contact often, 55.6% occasionally and 27.8% rarely, so new information came mostly through weak ties.' },
      ],
    },
    // ───────────────────────────────────────────────────────────── 3
    {
      n: 3,
      title: 'Centrality, influence and power',
      summary: String.raw`Who matters in a network depends on what “matters” means: having many ties, being close to everyone, sitting on many shortest paths, or being connected to other important people. Eigenvector-type centralities also describe how opinions settle when people repeatedly average their neighbours’ views. In exchange networks, power comes from position — from having alternatives your partners lack.`,
      items: [
        { num: '3.1', kind: 'Definition', name: 'Degree, closeness and betweenness centrality', deps: ['soc-2.2'], refs: ['Freeman (1978/79), pp.220–226','NetworkX 3.7 example graph source'],
          pic: 'One network with three node-size encodings you toggle; the top-ranked node changes from the hub to the broker as you switch measures.' },
        { num: '3.2', kind: 'Definition', name: 'Eigenvector and Katz centrality', deps: ['soc-3.1', 'ladr-5.5', 'ladr-7.29', 'pma-3.26', 'stoch-4.6'], refs: ['Newman ch. 7'],
          pic: 'Iterate “your score is the sum of your neighbours’ scores” from uniform starting values; the scores converge to the leading eigenvector, and the Katz damping slider interpolates toward degree.' },
        { num: '3.3', kind: 'Algorithm', name: 'Hubs and authorities (HITS)', deps: ['soc-3.2', 'stoch-4.15', 'ladr-7.29'], refs: ['E&K §14.2'],
          pic: 'A small directed web graph: alternate hub and authority updates converge, and the top authorities are compared with PageRank on the same graph.' },
        { num: '3.4', kind: 'Model', name: 'DeGroot learning: consensus by repeated averaging', deps: ['soc-3.2', 'stoch-4.1', 'stoch-4.7'], refs: [],
          pic: 'Each person repeatedly averages their friends’ opinions; the opinions converge to a consensus weighted by each person’s eigenvector centrality, read off live.' },
        { num: '3.5', kind: 'Theorem', name: 'Wise crowds need no prominent groups (Golub–Jackson)', deps: ['soc-3.4', 'prob-2.2.1', 'prob-2.2.2'], refs: [],
          pic: 'Noisy private signals averaged through DeGroot updating: a star network converges to the hub’s error, while balanced networks approach the truth as they grow.' },
        { num: '3.6', kind: 'Concept', name: 'Community structure and modularity', deps: ['soc-2.5'], refs: ['Newman ch. 14'],
          pic: 'Run a modularity-maximizing split on the karate-club network and compare it with the real factional split after the club broke up.' },
        { num: '3.7', kind: 'Model', name: 'Power from position in exchange networks', deps: ['soc-3.1', 'game-7.1'], refs: ['Kleinberg & Tardos (2008), pp.295–297'],
          pic: 'Compare exact specified outcomes on six unit-edge exchange graphs, perturb one trading pair, and inspect every payoff, outside option, stability deficit and matched surplus imbalance; the triangle impossibility follows a matching proof.' },
      ],
    },
    // ───────────────────────────────────────────────────────────── 4
    {
      n: 4,
      title: 'Random graphs, small worlds and power laws',
      summary: String.raw`Random graphs are the baseline: a giant component appears suddenly once the average degree passes one, and distances grow only logarithmically. Real social networks are both clustered and small, which the Watts–Strogatz model reproduces, and Milgram’s letters showed people can find short paths without a map. Many networks have heavy-tailed degree distributions, which preferential attachment explains — though how often real networks are truly scale-free is disputed.`,
      items: [
        { num: '4.1', kind: 'Model', name: 'Erdős–Rényi random graph', deps: ['soc-2.3','prob-3.6.1'], refs: ['Gilbert (1959), §1, p.1141','Erdős & Rényi (1960), introduction pp.17–19'],
          pic: 'One complete seeded G(n,p) sample supplies the graph and all degree bins, compared with its exact Binomial marginal and a Poisson law with explicit overflow; sampled transitivity is separate from conditional neighbour closure.' },
        { num: '4.2', kind: 'Theorem', name: 'The giant component appears at mean degree one', deps: ['soc-4.1','stoch-3.10'], refs: ['Erdős & Rényi (1960), introduction; §9, Theorem 9b','Frieze & Karoński, author text 9 September 2024, Theorems 2.9, 2.14, 2.21'],
          pic: 'Complete seeded G(n,M) component staircases and exact selected prefixes beside the asymptotic giant fraction and fixed-point roots; finite realised degree and the critical probability scale are stated separately.' },
        { num: '4.3', kind: 'Event', name: 'Milgram’s small-world experiment', deps: ['soc-2.2'], refs: ['E&K §20.1'],
          pic: 'Letters forwarded hop by hop from Nebraska toward a Boston stockbroker: completed chains have a median of about six steps, and the page shows how many chains were lost on the way.' },
        { num:'4.4',kind:'Phenomenon',name:'Six degrees in online networks',deps:['soc-2.2','soc-4.3'],refs:['Backstrom et al., arXiv:1111.4570v3','Ugander et al., arXiv:1111.4503v1','Facebook, Friends Day, 4 February 2016'],
          pic:'Switch published means between friendship links and intermediaries; an authored integer path shows the endpoint-count difference without inventing a distance distribution.' },
        { num:'4.5',kind:'Model',name:'Watts–Strogatz small-world model',deps:['soc-2.2','soc-2.5'],refs:['Watts & Strogatz (1998), pp.440–442, Figs.1–2'],
          pic:'The complete selected ring realization supplies every vertex, edge, BFS distance and local coefficient; a clearly authored ring-retained comparison separates nesting from rewiring, and disconnected global distance is explicit.' },
        { num:'4.6',kind:'Theorem',name:'Kleinberg’s navigability theorem',deps:['soc-2.2','prob-1.1.1','prob-1.6.1','prob-2.2.13'],refs:['Kleinberg, author version, pp.4–12, Theorems2–3','Easley & Kleinberg, draft10 June2010, §§20.3–20.4 and20.7'],
          pic:'A fixed seeded16×16 bounded square exposes the full greedy trace, complete endpoint-weight sums and all-pairs directed BFS comparison; the actual phase/union/tail proof is separate from finite diagnostics.' },
        { num:'4.7',kind:'Definition',name:'Power-law (heavy-tailed) distributions',deps:['soc-2.3','prob-2.4.1','prob-2.4.5'],refs:['Clauset, Shalizi & Newman (2009), §2'],
          pic:'Complete empirical survival and every running mean in finite seeded Pareto streams; the finite-mean/infinite-variance distinction remains explicit.' },
        { num: '4.8', kind: 'Method', name: 'Fitting power laws honestly (Clauset–Shalizi–Newman)', deps: ['soc-4.7', 'stat-3.5'], refs: ['Newman ch. 10'],
          pic: 'Fit a straight line to a log–log histogram and by maximum likelihood on the same lognormal sample: the line fit “finds” a power law that the likelihood-ratio test rejects.' },
        { num: '4.9', kind: 'Model', name: 'Preferential attachment and nonlinear kernels', deps: ['soc-4.7'], refs: ['Barabási & Albert (1999), p. 511', 'Krapivsky, Redner & Leyvraz, arXiv:cond-mat/0005139v2 (2000), Eqs. 1–8 and 13–17'],
          pic: 'Grow seeded trees with degree-to-a-power endpoint weights; compare their exact finite survival functions and early-vertex degrees with the limiting linear law, without treating finite hubs as tail-law proofs.' },
        { num: '4.10', kind: 'Theorem', name: 'Preferential attachment gives degree exponent 3', deps: ['soc-4.9'], refs: ['Dorogovtsev, Mendes & Samukhin, arXiv:cond-mat/0004434v1 (2000), Eqs. 1–13', 'Clauset, Shalizi & Newman (2009 author version), §3.1'],
          pic: 'Compare full finite degree frequencies with the stationary recurrence, distinguish the seed-dependent finite affine shift from its limit, and include a separate pure-uniform geometric endpoint with an honestly labeled approximate tail diagnostic.' },
        { num:'4.11',kind:'Hypothesis',name:'Are real networks scale-free? (debated)',deps:['soc-4.7'],refs:['Broido & Clauset (2019), published Results/Figs.2,4','Voitalov et al., arXiv:1811.02071v2'],
          pic:'Select one published evidence category to inspect its requirements and logical implications; overlapping corpus percentages are not presented as a partition or a new fit.' },
        { num: '4.12', kind: 'Phenomenon', name: 'Unpredictable success in cultural markets (MusicLab)', deps: ['soc-4.9'], refs: ['Salganik, Dodds & Watts (2006), Figs. 1–3 and supporting design'],
          pic: 'Compare every choice share in eight authored feedback worlds with paired no-feedback simulations, while keeping the original two-experiment findings and their limits separate.' },
        { num: '4.13', kind: 'Model', name: 'Gibrat’s proportional growth and city-size laws', deps: ['soc-4.7'], refs: ['Gabaix (1999), §§II.1, III.1/Proposition1 and III.4'],
          pic: 'Compare all final synthetic log sizes and paired complete histories, separating a discrete floor from continuous reflected-growth and Zipf-limit claims.' },
        { num: '4.14', kind: 'Model', name: 'The configuration model', deps: ['soc-2.3', 'soc-2.4'], refs: ['Newman, Strogatz & Watts (2001), §II.A/Eqs. 8–9; Feld (1991), pp.1468–1472'],
          pic: 'Retain every matched stub incidence, including loops and repeats; compare exact vertex and edge-end distributions and actual finite component sizes.' },
        { num: '4.15', kind: 'Model', name: 'The long tail', deps: ['soc-4.7'], refs: ['Brynjolfsson, Hu & Smith (2003), §4.2, Eq. 13 and Tables 2–4'],
          pic: 'Inspect every weight and cumulative share of a finite authored rank catalogue, including empty/full shelves; keep the original published book-sales estimate separate.' },
        { num: '4.16', kind: 'Concept', name: 'The bow-tie structure of the Web', deps: ['soc-2.2'], refs: ['Broder et al. (2000), §§1.1, 2.2–3, Figure 9 and region table'],
          pic: 'Compute every finite strongly connected component and directed reachability class; compare actual grouped shares with the original published crawl table.' },
        { num: '4.17', kind: 'Paper', name: 'An Experimental Study of the Small World Problem',
          paper: { authors: 'Jeffrey Travers and Stanley Milgram', year: 1969, title: 'An Experimental Study of the Small World Problem', venue: 'Sociometry 32 (4): 425–443', doi: '10.2307/2786545' },
          introduces: ['soc-4.3'], deps: ['soc-2.2'], refs: [],
          pic: 'The folders sent from Nebraska and Boston toward a Boston stockbroker: of 296 starters, 64 chains reached him, through about 5.2 intermediaries on average; replay the completed chains as a histogram of lengths, set a dropout rate per step to see how attrition biases the observed chains toward short ones, and route letters through a simulated network by geography and occupation.' },
        { num: '4.18', kind: 'Paper', name: 'Collective Dynamics of ‘Small-World’ Networks',
          paper: { authors: 'Duncan J. Watts and Steven H. Strogatz', year: 1998, title: 'Collective dynamics of ‘small-world’ networks', venue: 'Nature 393 (6684): 440–442', doi: '10.1038/30918' },
          introduces: ['soc-4.5'], deps: ['soc-2.5', 'soc-4.1', 'soc-4.17'], refs: [],
          pic: 'Their Figure 2: a ring of 1,000 nodes, each linked to its 10 nearest neighbours, rewired with probability p; the normalized path length L(p)/L(0) collapses at tiny p while the clustering C(p)/C(0) stays high until p is large, on a logarithmic p axis; rewire a smaller ring live and compare with their Table 1 (film actors, the western US power grid, the worm C. elegans).' },
        { num: '4.19', kind: 'Paper', name: 'Emergence of Scaling in Random Networks',
          paper: { authors: 'Albert-László Barabási and Réka Albert', year: 1999, title: 'Emergence of Scaling in Random Networks', venue: 'Science 286 (5439): 509–512', doi: '10.1126/science.286.5439.509' },
          introduces: ['soc-4.9', 'soc-4.10'], deps: ['soc-4.7', 'soc-4.1'], refs: [],
          pic: 'Grow a network one node at a time, each newcomer attaching m links to existing nodes in proportion to their degree: the degree distribution on log–log axes settles to a power law with exponent near 3, as in their Figure 2; switch off growth or preferential attachment (their two control models) and watch the power law vanish, beside their degree distributions for film actors, the Web and the power grid.' },
      ],
    },
    // ───────────────────────────────────────────────────────────── 5
    {
  "n": 5,
  "title": "Diffusion, cascades and contagion",
  "summary": "Threshold reinforcement, private information and random transmission produce different kinds of cascades. Explicit finite networks and event histories are compared with the precise branching, moment and mean-field limits they illustrate. Adoption timing, congestion, reinforcement and one-parent genealogies share feedback mechanisms while retaining different assumptions and uncertainties.",
  "items": [
    {
      "num": "5.1",
      "kind": "Model",
      "name": "Diffusion as a network coordination game",
      "deps": [
        "soc-1.8",
        "game-1.5"
      ],
      "refs": [
        "Easley–Kleinberg §19.2, pp.566–572; supplied finite closure"
      ],
      "pic": "Change the threshold, seed count and network. Select a round to inspect actual adopters and the computed adoption staircase.",
      "see": []
    },
    {
      "num": "5.2",
      "kind": "Theorem",
      "name": "Dense clusters block cascades",
      "deps": [
        "soc-5.1"
      ],
      "refs": [
        "Easley–Kleinberg §19.3, pp.573–577, both directions"
      ],
      "pic": "Inspect the actual final non-adopter set and every internal neighbour fraction. Vary q or seeds to make the certificate appear or disappear.",
      "see": []
    },
    {
      "num": "5.3",
      "kind": "Concept",
      "name": "Simple versus complex contagion (Centola)",
      "deps": [
        "soc-5.2",
        "soc-4.5"
      ],
      "refs": [
        "Easley–Kleinberg §19.4, pp.578–582; own finite count-threshold comparison"
      ],
      "pic": "Change the pseudorandom seed and selected rewiring probability. Compare final adoption counts and inspect the chosen graph, rather than treating a crossing of curves as a universal prediction.",
      "see": []
    },
    {
      "num": "5.4",
      "kind": "Model",
      "name": "Information cascades",
      "deps": [
        "prob-1.1.1",
        "prob-2.1.1"
      ],
      "refs": [
        "Easley–Kleinberg §§16.3–16.6, pp.490–502; supplied action-likelihood computation"
      ],
      "pic": "Change signal reliability, truth and the pseudorandom seed. Compare public evidence, private signals and actions; the companion finite-state calculation reports wrong-cascade probability.",
      "see": [
        "stat-10.1"
      ]
    },
    {
      "num": "5.5",
      "kind": "Phenomenon",
      "name": "Herding in the urn experiment",
      "deps": [
        "soc-5.4"
      ],
      "refs": [
        "Easley–Kleinberg §§16.2/16.4, pp.485–489/494–496; no original lab table used"
      ],
      "pic": "Inspect the two urn compositions and an agent’s private draw. Reveal the true urn and compare the selected agent’s action and posterior with the public posterior.",
      "see": []
    },
    {
      "num": "5.6",
      "kind": "Model",
      "name": "The Bass diffusion model",
      "deps": [
        "soc-1.6",
        "ode-1.6",
        "ode-1.3"
      ],
      "refs": [
        "Niu, A Piecewise-Diffusion Model (2005 author manuscript), PDF3–4 Eqs.1–4; own general initial-value solution"
      ],
      "pic": "Edit innovation, imitation and initial adoption. Compare the computed cumulative fraction, instantaneous flow and the separate innovation/imitation contributions.",
      "see": []
    },
    {
      "num": "5.7",
      "kind": "Concept",
      "name": "S-curves and adopter categories (Rogers)",
      "deps": [
        "soc-5.6"
      ],
      "refs": [
        "OpenStax Principles of Marketing §10.5, adopter categories; supplied finite empirical CDF"
      ],
      "pic": "Change heterogeneity and seed. Inspect actual timing marks, the empirical cumulative staircase and the resulting five finite rank groups.",
      "see": []
    },
    {
      "num": "5.8",
      "kind": "Model",
      "name": "Branching processes and the epidemic threshold",
      "deps": [
        "stoch-3.9",
        "stoch-3.10"
      ],
      "refs": [
        "Easley–Kleinberg §§21.2/21.8A; own Binomial(2,p) calculation"
      ],
      "pic": "Change p, generation horizon and seed. Inspect the sampled offspring tree, exact finite-generation survival curve and infinite-process extinction probability.",
      "see": []
    },
    {
      "num": "5.9",
      "kind": "Model",
      "name": "SIR epidemics on networks",
      "deps": [
        "soc-5.8",
        "stoch-1.1"
      ],
      "refs": [
        "Easley–Kleinberg §21.3, pp.651–655, one-step infectious period"
      ],
      "pic": "Select ring, rewired, random or hub contacts. Move through rounds of the actual seeded epidemic and inspect S/I/R totals and the current network states.",
      "see": [
        "ode-6.17"
      ]
    },
    {
      "num": "5.10",
      "kind": "Phenomenon",
      "name": "Hubs, superspreaders and the vanishing threshold",
      "deps": [
        "soc-5.9",
        "soc-2.3"
      ],
      "refs": [
        "Newman, cond-mat/0205009v1 (2002), §III Eq.23; own finite moment sums"
      ],
      "pic": "Vary the degree exponent, cutoff and transmissibility. Compare the finite degree law and threshold as the cutoff changes; read the exact chosen moments.",
      "see": [
        "soc-4.10"
      ]
    },
    {
      "num": "5.11",
      "kind": "Phenomenon",
      "name": "Random failure versus targeted attack",
      "deps": [
        "soc-2.2",
        "soc-4.2"
      ],
      "refs": [
        "Newman (2002) §V.B, selective intervention context; supplied exact finite deletion/BFS experiment"
      ],
      "pic": "Compare one seeded random removal order with the declared static-degree order. Inspect survivors and both complete largest-component curves, including the empty graph.",
      "see": [
        "soc-4.9"
      ]
    },
    {
      "num": "5.12",
      "kind": "Model",
      "name": "Influence maximization (independent cascades)",
      "deps": [
        "soc-5.8",
        "soc-2.2"
      ],
      "refs": [
        "Kempe–Kleinberg–Tardos (2003), §2 Theorems2.1/2.2 and live-edge proof"
      ],
      "pic": "Vary edge probability and seed budget. Compare exact greedy, exhaustive optimum and highest-outdegree selection, and inspect the actual selected seed sets.",
      "see": []
    },
    {
      "num": "5.13",
      "kind": "Phenomenon",
      "name": "Network effects and tipping in markets",
      "deps": [
        "soc-1.6"
      ],
      "refs": [
        "Easley–Kleinberg §§17.2–17.4, pp.514–526; own fixed-point derivative"
      ],
      "pic": "Change price and the initial expected share. Compare the response curve with the diagonal and follow the finite binary64 expectation-update orbit; near the unstable root, roundoff can be amplified.",
      "see": [
        "micro-12.12"
      ]
    },
    {
      "num": "5.14",
      "kind": "Model",
      "name": "The El Farol bar problem",
      "deps": [
        "soc-5.13"
      ],
      "refs": [
        "Arthur (1994), actual author-hosted printed pp.407–408; E&K §17.7; authored predictor system"
      ],
      "pic": "Change capacity, memory and pseudorandom seed. Inspect the computed attendance history and each agent’s latest forecast against the capacity line.",
      "see": []
    },
    {
      "num": "5.15",
      "kind": "Model",
      "name": "SIS epidemics and endemic infection",
      "deps": [
        "soc-5.9",
        "stoch-1.1"
      ],
      "refs": [
        "Easley–Kleinberg §21.4, reinfection mechanism; own finite absorption proof and stated mean-field extension"
      ],
      "pic": "Vary transmission and recovery, move through the finite sample, and compare its prevalence with the separately labelled mean-field update.",
      "see": []
    },
    {
      "num": "5.16",
      "kind": "Phenomenon",
      "name": "Concurrency and the timing of contacts",
      "deps": [
        "soc-5.9"
      ],
      "refs": [
        "Easley–Kleinberg §21.6, timing and concurrency; supplied explicit event schedule"
      ],
      "pic": "Switch the two schedules and change infectious duration or initial infection time. Inspect the contact-time chart and the actual time-respecting transmissions.",
      "see": []
    },
    {
      "num": "5.17",
      "kind": "Phenomenon",
      "name": "Lock-in under increasing returns (Arthur)",
      "deps": [
        "soc-5.13",
        "prob-4.3.4a"
      ],
      "refs": [
        "Written Durrett Pólya input, §4.3.2; E&K §17.5 historical-dependence context"
      ],
      "pic": "Change initial counts and seed. Compare finite reinforced paths, the initial expected share and the separate limiting variance.",
      "see": [
        "stoch-12.10"
      ]
    },
    {
      "num": "5.18",
      "kind": "Theorem",
      "name": "Genealogies coalesce: a recent common ancestor",
      "deps": [
        "prob-5.1.4",
        "stoch-1.1"
      ],
      "refs": [
        "Easley–Kleinberg §§21.7/21.8B, pp.669–685; own exact finite occupancy recursion"
      ],
      "pic": "Change population size, sample size, horizon and seed. Inspect merging sample lineages and compare the exact occupancy-chain expectation with the separately labelled approximation.",
      "see": [
        "soc-5.8",
        "popgen-10.2"
      ]
    }
  ]
},
    // ───────────────────────────────────────────────────────────── 6
    {
      n: 6,
      title: 'Conformity, opinion dynamics and synchrony',
      summary: String.raw`People conform to visible majorities, and simple models of opinion change reproduce consensus, persistent disagreement or polarization depending on whom people are willing to listen to. Whether online networks create echo chambers is an empirical question with mixed answers. Collective rhythm — clapping audiences, flashing fireflies — is another kind of coordination, explained by coupled oscillators.`,
      items: [
        {
          "num": "6.1",
          "kind": "Phenomenon",
          "name": "Asch’s conformity experiment",
          "deps": [],
          "refs": [
            "Asch, Opinions and Social Pressure, Scientific American 193(5), 1955, 31–35; complete author-article transcription read",
            "Own exact line geometry and explicitly scripted six-speaker illustration"
          ],
          "pic": "Choose a line on an original comparison board after viewing a scripted majority, a majority with one truthful dissenter, or no group. Reveal measurements to inspect the physical match. Your answer remains a local illustration; the separate source summary keeps the historical critical-trial response rate and sample distinct."
        },
        {
          "num": "6.2",
          "kind": "Model",
          "name": "The voter model",
          "deps": [
            "soc-2.1",
            "stoch-12.1"
          ],
          "refs": [
            "Sood & Redner, Voter Model on Heterogeneous Graphs, Physical Review Letters 94, 178701, 2005; selected rule and bipartite exit-probability discussion read",
            "Own finite-graph martingale and absorption argument; exact transition enumeration"
          ],
          "pic": "Run a 16-node cycle, toroidal lattice or star and inspect the actual copying direction. Compare ordinary and degree-weighted shares along one reproducible path. The companion one-step ledger enumerates the current transition law; its weighted expected drift is exactly zero even when the realized weighted share moves. Start with only the star hub to see why degree matters."
        },
        {
          "num": "6.3",
          "kind": "Model",
          "name": "Bounded-confidence opinion dynamics",
          "deps": [
            "soc-3.4"
          ],
          "refs": [
            "Hegselmann & Krause, Opinion Dynamics and Bounded Confidence: Models, Analysis and Simulation, JASSS 5(3):2, 2002; selected original text and PDF pages 5/10 personally read",
            "Own exact finite synchronous updates, hull check and adjacent-gap argument"
          ],
          "pic": "Follow each original agent through synchronous averaging. Select an agent to see its current confidence window, actual neighbors and next average. Change the radius through equality and near-boundary cases, compare the population mean, and inspect adjacent gaps. The finite trajectory can show agreement, continuing motion or an exactly fixed separated state."
        },
        {
          "num": "6.4",
          "kind": "Model",
          "name": "Axelrod’s culture model",
          "deps": [
            "soc-6.3"
          ],
          "refs": [
            "Axelrod, The Dissemination of Culture, Journal of Conflict Resolution 41(2), 1997, 203–226; selected methods and original PDF pages 7/9 personally read",
            "Own trait-strip grid, finite event stream and complete active-edge/region diagnostics"
          ],
          "pic": "Read each site as a strip of categorical features. Inspect the last active-neighbor pair and the copied feature, then compare active edges, distinct culture vectors and spatial regions through all attempted events. The count axis fits the displayed history. Vary features and traits to explore the mechanism, including the exactly frozen one-feature and one-trait limits."
        },
        {
          "num": "6.5",
          "kind": "Phenomenon",
          "name": "Echo chambers and polarization (mixed evidence)",
          "deps": [
            "soc-6.3",
            "soc-2.10"
          ],
          "refs": [
            "Cinelli et al., The echo chamber effect on social media, PNAS 118(9):e2023301118, 2021; complete main text and original Figure 4 personally read",
            "Terren & Borge, Echo Chambers on Social Media: A Systematic Review of the Literature, Review of Communication Research 9, 2021; landing abstract only",
            "Own directed bounded-confidence plus post-update unfollow comparison"
          ],
          "pic": "Compare learning on fixed edges with the selected unfollow rule from identical initial conditions. Node positions keep the same identities; color shows current opinion, while edge removal records selection. Use the source discussion to distinguish proxy interaction networks, simulated diffusion and survey reports: they measure different things and support different causal conclusions."
        },
        {
          "num": "6.6",
          "kind": "Phenomenon",
          "name": "Pluralistic ignorance",
          "deps": [
            "soc-1.8"
          ],
          "refs": [
            "Prentice & Miller, Pluralistic Ignorance and Alcohol Use on Campus, JPSP 64(2), 1993, 243–256; complete PubMed abstract only",
            "Easley & Kleinberg §19.6, selected knowledge/threshold discussion actually read",
            "Own finite irreversible public-count disclosure model; distinct from the source common-knowledge model"
          ],
          "pic": "Switch between the private and public views of the same 12 people, then compare both without changing their identities. Vary the initial disclosed count and fixed thresholds. Follow actual disclosure rounds and inspect who is eligible next; private opposition remains 12 throughout, even when public dissent stalls."
        },
        {
          "num": "6.7",
          "kind": "Phenomenon",
          "name": "Synchronized clapping and fireflies",
          "deps": [
            "ode-8.17"
          ],
          "refs": [
            "Néda et al., Physics of the rhythmic applause, Physical Review E 61, 2000, 6987–6992; complete main text and original PDF page 4/Figures 2–4 personally read",
            "Own finite Kuramoto equations, free-motion/mean-phase checks and independently checked numerical trajectories"
          ],
          "pic": "Play the original 16-oscillator field, or pause at a selected time. Compare the phase lights with vectors on the unit circle and the actual coherence trace. Change coupling and natural-frequency spread, including uncoupled and identical-frequency limits. The numerical mean-phase diagnostic checks the pairwise cancellation law; the curves are simulations, not audience recordings."
        },
        {
          "num": "6.8",
          "kind": "Paper",
          "name": "Studies of Independence and Conformity",
          "paper": {
            "authors": "Solomon E. Asch",
            "year": 1956,
            "title": "Studies of Independence and Conformity: I. A Minority of One against a Unanimous Majority",
            "venue": "Psychological Monographs: General and Applied 70 (9): 1–70",
            "doi": "10.1037/h0093718"
          },
          "introduces": [
            "soc-6.1"
          ],
          "deps": [],
          "refs": [
            "Historical work: Asch 1956, DOI 10.1037/h0093718; original monograph body/figures unread",
            "Distinct actual reading: Asch 1955, Opinions and Social Pressure; complete author-article transcription",
            "Own protocol-count and denominator diagrams; no invented chronology or response counts"
          ],
          "pic": "Inspect the 18-total/12-critical protocol counts without inventing a historical trial sequence. Switch among the separately reported conditions, retaining percentages, bounds and qualitative relative statements in their correct forms. A denominator diagram distinguishes repeated critical responses from people who never yielded. The source summary uses the read 1955 article; the 1956 monograph body is not claimed verified."
        }
      ],
    },
    // ───────────────────────────────────────────────────────────── 7
    {
      n: 7,
      title: 'Collective intelligence',
      summary: String.raw`Averages of many independent guesses can be remarkably accurate, as Galton found with a fairground ox, because individual errors cancel. The diversity prediction theorem makes this exact. The effect depends on independence: once people see each other’s guesses, errors correlate and the crowd’s advantage shrinks. Prediction markets are another way to aggregate scattered information.`,
      items: [
        { num: '7.1', kind: 'Phenomenon', name: 'Galton’s ox: vox populi', deps: ['polsci-5.4'], refs: ['E&K §22.3'],
          pic: 'Guess the weight of an ox, then see your guess among 800 simulated fairgoers; the median lands within 1% of the true weight while most individuals are far off.' },
        { num: '7.2', kind: 'Theorem', name: 'The diversity prediction theorem', deps: ['soc-7.1'], refs: ['E&K §22.3'],
          pic: 'For any set of guesses, the squared error of the average equals the average squared error minus the variance of the guesses — three bars that always add up as you drag guesses.' },
        { num: '7.3', kind: 'Phenomenon', name: 'Social influence undermines crowd wisdom', deps: ['soc-7.2', 'soc-5.4'], refs: ['E&K §16.7'],
          pic: 'Let simulated guessers see the running average before answering; diversity collapses and the crowd error grows, as in the Lorenz et al. 2011 experiment.' },
        { num: '7.4', kind: 'Model', name: 'Prediction markets aggregate beliefs', deps: ['soc-7.1'], refs: ['E&K §22.2', 'E&K §22.4'],
          pic: 'Traders with private signals buy and sell a contract paying $1 if an event happens; the price settles near the aggregated probability, compared with poll averages.' },
        { num: '7.5', kind: 'Theorem', name: 'Markets reward accuracy: wealth dynamics', deps: ['soc-7.4'], refs: ['E&K §22.10'],
          pic: 'Bettors with different beliefs repeatedly bet on a horse race; wealth flows to the most accurate, and the market’s implied probability converges toward theirs.' },
        { num: '7.6', kind: 'Hypothesis', name: '“Diversity trumps ability” (Hong–Page, contested)', deps: ['soc-7.2'], refs: [],
          pic: 'Agents with different heuristics search a rugged landscape; random diverse teams beat teams of the individually best, and a toggle applies the critics’ changes that remove the result.' },
      ],
    },
    // ───────────────────────────────────────────────────────────── 8
    {
      n: 8,
      title: 'Cooperation and the commons',
      summary: String.raw`When everyone would gain from cooperating but each gains more by free riding, collective action is hard; open-access resources tend to be overused. Yet many communities have managed commons for centuries, and Ostrom identified the institutional features they share. Repetition, reputation, punishment and network structure all help cooperation survive, while selfish routing shows the opposite problem: adding capacity can make everyone worse off.`,
      items: [
        { num: '8.1', kind: 'Concept', name: 'The collective action problem (Olson)', deps: ['micro-12.10'], refs: ['Schelling ch. 7'],
          pic: 'Groups of different sizes choose whether to contribute to a shared project; the private benefit of contributing falls with group size, and contributions in the simulation fall with it.' },
        { num: '8.2', kind: 'Model', name: 'The multi-person prisoner’s dilemma', deps: ['soc-8.1', 'game-1.4'], refs: ['Schelling ch. 7'],
          pic: 'Schelling-style payoff lines for cooperators and defectors as functions of how many cooperate: defecting always pays more, yet everyone cooperating beats everyone defecting.' },
        { num: '8.3', kind: 'Model', name: 'Tragedy of the commons as a harvesting game', deps: ['micro-12.11', 'mathbio-1.12', 'soc-8.2'], refs: ['E&K §24.2'],
          pic: 'Herders add cows to a regrowing pasture; each herder’s best response overgrazes, and the stock crashes in the simulation, compared with the sustainable-yield optimum.' },
        { num: '8.4', kind: 'Principle', name: 'Ostrom’s design principles for the commons', deps: ['soc-8.3'], refs: [],
          pic: 'Switch on boundaries, local rules, participation, monitoring, graduated sanctions, conflict resolution, recognition and nesting in an agent model of a fishery and see which combinations prevent collapse.' },
        { num: '8.5', kind: 'Phenomenon', name: 'Communication and sanctions in common-pool experiments', deps: ['soc-8.4'], refs: [],
          pic: 'Lab common-pool appropriation over rounds: baseline overuse, then cheap talk, then sanctioning; group efficiency rises in each phase, as in Ostrom, Walker and Gardner (1992).' },
        { num: '8.6', kind: 'Model', name: 'Evolution of cooperation: Axelrod’s tournaments', deps: ['soc-8.2', 'game-5.3'], refs: [],
          pic: 'Run a round-robin of repeated prisoner’s-dilemma strategies you choose (tit-for-tat, always defect, grudger…); tit-for-tat wins without ever beating any single opponent.' },
        { num: '8.7', kind: 'Model', name: 'Evolution of social norms: stag-hunt dynamics', deps: ['soc-8.6', 'game-6.4', 'game-1.5'], refs: ['E&K §7.4'],
          pic: 'Replicator dynamics in a stag-hunt population: the basin of the cooperative norm shrinks as its risk grows, and random mutations let the population tip between norms, mostly toward the risk-dominant one.' },
        { num: '8.8', kind: 'Theorem', name: 'Cooperation on networks: the b/c > k rule', deps: ['soc-8.6', 'game-5.9'], refs: [],
          pic: 'Cooperators and defectors on graphs of average degree k imitate successful neighbours; across simulated runs cooperation is favoured roughly when benefit/cost exceeds k (Ohtsuki et al. 2006).' },
        { num: '8.9', kind: 'Phenomenon', name: 'Braess’s paradox in real road networks', deps: ['game-6.11'], refs: ['E&K §8.2'],
          pic: 'Before-and-after traffic for road closures in Seoul, Stuttgart and New York, beside an equilibrium model of the same network in which removing the link lowers everyone’s travel time.' },
        { num: '8.10', kind: 'Principle', name: 'Congestion pricing restores the social optimum', deps: ['game-6.12', 'micro-12.3'], refs: ['E&K §8.3'],
          pic: 'Charge each road a toll equal to the delay a driver imposes on others; the equilibrium flow moves to the optimum and the price of anarchy readout drops to one.' },
        { num: '8.11', kind: 'Phenomenon', name: 'Reputation systems sustain trust among strangers', deps: ['soc-8.6'], refs: ['E&K §22.9'],
          pic: 'Buyers and sellers of hidden-quality goods with and without public feedback scores; with reputation, honest sellers survive and prices track quality, without it the market unravels.' },
        { num: '8.12', kind: 'Paper', name: 'The Evolution of Cooperation',
          paper: { authors: 'Robert Axelrod and William D. Hamilton', year: 1981, title: 'The Evolution of Cooperation', venue: 'Science 211 (4489): 1390–1396', doi: '10.1126/science.7466396' },
          introduces: ['soc-8.6'], deps: ['game-5.5', 'game-5.8', 'soc-8.2'], refs: [],
          pic: 'An ecological tournament of iterated prisoner’s-dilemma strategies: each generation the strategies grow in proportion to their scores against the current mix, and TIT FOR TAT rises while exploiters thrive briefly and then starve; set the probability w of a further round to find the threshold above which TIT FOR TAT cannot be invaded, and seed a small cluster of cooperators among defectors to see it take over.' },
        { num: '8.13', kind: 'Paper', name: 'Governing the Commons',
          paper: { authors: 'Elinor Ostrom', year: 1990, title: 'Governing the Commons: The Evolution of Institutions for Collective Action', venue: 'Cambridge: Cambridge University Press', doi: '10.1017/CBO9780511807763' },
          introduces: ['soc-8.4'], deps: ['soc-8.3', 'soc-8.1'], refs: [],
          pic: 'A common-pool resource game in which the reader switches Ostrom’s design principles on and off (clear boundaries, rules fitted to local conditions, users making the rules, monitoring, graduated sanctions, cheap conflict resolution, recognized rights to organize, nested enterprises) and watches the stock and rule-keeping over time, beside a table of her long-lived cases (Törbel’s alpine meadows, the huertas of Valencia, the Philippine zanjeras) and the failures she studied.' },
      ],
    },
    // ───────────────────────────────────────────────────────────── 9
    {
      n: 9,
      title: 'Crowds in motion',
      summary: String.raw`Physical crowds, traffic and flocks are collective behaviour too, and simple local rules again reproduce striking global patterns: traffic jams that appear out of nowhere, lanes that self-organize among pedestrians, flocks that align without a leader. These models are used to design safer exits and better roads, and they show the same lesson as Schelling’s: the pattern is not in any individual’s intentions.`,
      items: [
        { num: '9.1', kind: 'Model', name: 'Phantom traffic jams (Nagel–Schreckenberg)', deps: ['soc-1.1'], refs: [],
          pic: 'Cars on a ring road accelerate, brake to avoid collisions and sometimes dawdle at random; jams nucleate and travel backward through the traffic, shown on a space–time plot.' },
        { num: '9.2', kind: 'Model', name: 'Social-force model of pedestrians: lane formation', deps: ['soc-1.1'], refs: [],
          pic: 'Two streams of walkers in a corridor repelled by those ahead of them; lanes form spontaneously, and a density slider shows when they break down.' },
        { num: '9.3', kind: 'Phenomenon', name: 'Faster is slower at a bottleneck', deps: ['soc-9.2'], refs: [],
          pic: 'Raise the walkers’ desired speed through a narrow exit: clogging arches form and the evacuation time rises; placing a column in front of the door reduces it.' },
        { num: '9.4', kind: 'Model', name: 'Flocking without a leader (Vicsek model)', deps: ['soc-1.1'], refs: [],
          pic: 'Self-propelled particles align with neighbours plus noise; lower the noise or raise the density and an ordered flock appears, with the alignment order parameter plotted.' },
      ],
    },
  ],
};
