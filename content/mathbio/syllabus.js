// Syllabus — Mathematical Biology (curated course; see collection.js for references)
//
// Sources consulted (research pass, Oct 2026):
//   - Murray, Mathematical Biology I & II (3rd ed.) chapter lists via Google Books
//     https://books.google.com/books?vid=ISBN9780387952284  (chapter-level refs verified)
//   - Edelstein-Keshet, Mathematical Models in Biology (SIAM 2005) part/chapter structure
//     https://catalogo.biblio.unc.edu.ar/Record/ffyh.84401/TOC , https://old.maa.org/node/105061
//   - Cambridge Part II "Mathematical Biology" schedule (Faculty of Mathematics schedules PDF)
//     https://www.maths.cam.ac.uk/undergrad/course/schedules.pdf  → added ch. 11 (stochastic systems)
//   - MIT 8.591J Systems Biology calendar https://ocw.mit.edu/courses/8-591j-systems-biology-fall-2014/pages/syllabus/
//   - Wikipedia: Mathematical and theoretical biology; Theoretical ecology; Mathematical modelling of
//     infectious diseases (→ Reed–Frost, major-outbreak probability, network R₀)
// Deliberate omissions: Murray I ch. 4–5 (temperature-dependent sex determination, marital interaction)
//   and Murray II ch. 7–8, 10 (teratologies, vascular networks, dermal wound healing) — idiosyncratic;
//   evolutionary game theory lives in popgen; enzyme-level kinetics beyond Michaelis–Menten in kin.
// Note: ch. 11 items marked refs: [] have no counterpart in the collection's two references; a stochastic
//   text (e.g. Allen, An Introduction to Stochastic Processes with Applications to Biology) should be added.
// Landmark papers (kind 'Paper', appended Oct 2026): every citation checked against its Crossref DOI record,
//   PubMed/PMC, the BHL OpenURL resolver or archive.org catalogue metadata (books and pre-DOI papers get a `url`).
export default {
  collection: 'mathbio',
  chapters: [
    {
      n: 1,
      title: 'Growth of a single population',
      summary: String.raw`A population changes by births, deaths and migration, and writing that balance as a differential equation is the first act of mathematical biology. Exponential growth is the null model; density dependence bends it into the logistic curve, and linearizing about equilibria tells us which ones the population actually settles on. Allee effects, outbreaks with hysteresis, harvesting and time delays show how much behaviour one equation can hold — including collapse of a fishery and oscillations created purely by a lag.`,
      items: [
        { num: '1.1', kind: 'Definition', name: 'Per-capita growth rate and the population balance law', deps: [], refs: ['Murray I ch. 1', 'Edelstein-Keshet ch. 4'],
          pic: 'Births, deaths, immigration and emigration are drawn as four arrows into and out of a box; slide each rate and watch dN/dt and the per-capita rate update, with the population trace integrated below.' },
        { num: '1.2', kind: 'Model', name: 'Exponential (Malthusian) growth', deps: ['mathbio-1.1', 'pma-8.6'], refs: ['Murray I ch. 1'],
          pic: 'A bacterial culture doubles on screen; toggle between linear and log axes and the exponential curve becomes a straight line whose slope is the growth rate you set.' },
        { num: '1.3', kind: 'Concept', name: 'Doubling time and the rule of 70', deps: ['mathbio-1.2', 'pma-5.15'], refs: ['Edelstein-Keshet ch. 4'],
          pic: 'Drag the growth rate and compare the exact doubling time ln 2 / r with 70 divided by the percentage rate; a readout shows the rule’s error stays under a few percent for realistic rates.' },
        { num: '1.4', kind: 'Model', name: 'Logistic growth (Verhulst)', deps: ['mathbio-1.2', 'ode-1.6'], refs: ['Murray I ch. 1', 'Edelstein-Keshet ch. 6'],
          pic: 'Plot the per-capita growth rate falling linearly with N beside the resulting S-shaped trajectory; start several cultures at different sizes and all of them converge on the carrying capacity K.' },
        { num: '1.5', kind: 'Theorem', name: 'Linear stability of equilibria in one dimension', deps: ['mathbio-1.1', 'pma-5.15'], refs: ['Murray I ch. 1', 'Edelstein-Keshet ch. 5'],
          pic: 'Draw any growth function f(N) with the mouse; arrows on the N axis show the flow, equilibria are coloured stable or unstable by the sign of f′, and perturbations decay or grow at the predicted rate.' },
        { num: '1.6', kind: 'Theorem', name: 'Logistic solution: sigmoid approach to carrying capacity', deps: ['mathbio-1.4', 'mathbio-1.5', 'ode-1.4'], refs: ['Murray I ch. 1'],
          pic: 'The closed-form logistic solution is overlaid on a numerically integrated trajectory; the inflection point sits exactly at K/2 wherever you drag the initial size below it.' },
        { num: '1.7', kind: 'Concept', name: 'Nondimensionalization and scaling', deps: ['mathbio-1.4', 'pma-5.5'], refs: ['Murray I ch. 1'],
          pic: 'Generate a dozen logistic curves with random r, K and N₀; press “rescale” and they collapse onto a single dimensionless curve, showing how few parameters truly matter.' },
        { num: '1.8', kind: 'Model', name: 'Gompertz growth', deps: ['mathbio-1.4', 'ode-1.5'], refs: ['Murray I ch. 1'],
          pic: 'Fit logistic and Gompertz curves to the same tumour-volume data; the Gompertz curve rises asymmetrically, with its inflection at K/e rather than K/2, and the residual plot shows which fits better.' },
        { num: '1.9', kind: 'Phenomenon', name: 'Allee effect', deps: ['mathbio-1.4', 'mathbio-1.5'], refs: ['Murray I ch. 1', 'Edelstein-Keshet ch. 6'],
          pic: 'Raise the Allee threshold and an unstable equilibrium appears below K; populations released just above it recover while those just below slide to extinction.' },
        { num: '1.10', kind: 'Model', name: 'Spruce budworm outbreak model', deps: ['mathbio-1.4', 'mathbio-1.5'], refs: ['Murray I ch. 1'],
          pic: 'The logistic growth line and the sigmoidal bird-predation curve are drawn together; slowly raise the forest’s carrying capacity and watch the number of intersections jump from one to three to one.' },
        { num: '1.11', kind: 'Phenomenon', name: 'Saddle-node bifurcation and hysteresis', deps: ['mathbio-1.10', 'ode-8.3'], refs: ['Murray I ch. 1'],
          pic: 'Sweep a parameter up and then down while the population tracks its equilibrium; the trace jumps to the outbreak branch at one value and falls back only at a lower one, tracing a hysteresis loop.' },
        { num: '1.12', kind: 'Model', name: 'Harvesting: constant quota versus constant effort', deps: ['mathbio-1.4', 'ode-1.11'], refs: ['Murray I ch. 1'],
          pic: 'Overlay a horizontal quota line or a sloped effort line on the logistic growth parabola; the intersections are the equilibria and the integrated stock settles at the stable one.' },
        { num: '1.13', kind: 'Theorem', name: 'Maximum sustainable yield at K/2', deps: ['mathbio-1.12', 'pma-5.8'], refs: ['Murray I ch. 1'],
          pic: 'Drag the harvesting effort and plot sustained yield against effort; the yield curve peaks exactly when the equilibrium stock is K/2, and a readout confirms the maximum rK/4.' },
        { num: '1.14', kind: 'Phenomenon', name: 'Fishery collapse under a fixed quota', deps: ['mathbio-1.12', 'mathbio-1.11'], refs: ['Murray I ch. 1'],
          pic: 'Add random year-to-year noise to a stock fished at a quota just below MSY; most runs persist for a while, then one bad year pushes the stock past the unstable equilibrium and it crashes.' },
        { num: '1.15', kind: 'Model', name: 'Hutchinson’s delayed logistic equation', deps: ['mathbio-1.4'], refs: ['Murray I ch. 1'],
          pic: 'Integrate dN/dt = rN(1 − N(t−τ)/K) with a history buffer; lengthen the delay and a smooth approach to K turns into damped and then sustained oscillations.' },
        { num: '1.16', kind: 'Theorem', name: 'Delay-induced oscillations: Hopf at rτ = π/2', deps: ['mathbio-1.15', 'rca-10.43'], refs: ['Murray I ch. 1'],
          pic: 'Roots of the characteristic equation λ = −r e^{−λτ} are tracked in the complex plane as rτ grows; the leading pair crosses the imaginary axis at rτ = π/2, exactly when the simulation starts to cycle.' },
        { num: '1.17', kind: 'Model', name: 'Mackey–Glass equation and dynamical diseases', deps: ['mathbio-1.16'], refs: ['Murray I ch. 1'],
          pic: 'A model of blood-cell production with a maturation delay: increase the delay and the cell count goes from steady, to periodic, to chaotic, mimicking periodic leukaemias.' },
      ],
    },
    {
      n: 2,
      title: 'Discrete-time models and chaos',
      summary: String.raw`Many organisms breed in seasons, so the natural model is a map from one generation to the next. Cobwebs make fixed points and their stability visible, and the innocent-looking logistic map then walks through period doubling into chaos with universal constants. The same tools, extended to two dimensions, explain why the classic host–parasitoid model is violently unstable and what real biology does to calm it.`,
      items: [
        { num: '2.1', kind: 'Model', name: 'Geometric growth in discrete generations', deps: ['mathbio-1.2', 'pma-3.31'], refs: ['Edelstein-Keshet ch. 1'],
          pic: 'Step N_{t+1} = λN_t generation by generation next to the continuous exponential with r = ln λ; shrinking the time step makes the compounded staircase converge onto the smooth curve.' },
        { num: '2.2', kind: 'Model', name: 'Fibonacci’s rabbits and the golden ratio', deps: ['mathbio-2.1', 'ladr-5.50'], refs: ['Edelstein-Keshet ch. 1'],
          pic: 'Pairs of rabbits multiply on a family tree while the ratio of successive totals is plotted converging to φ ≈ 1.618, the dominant root of the characteristic equation.' },
        { num: '2.3', kind: 'Method', name: 'Cobwebbing a one-dimensional map', deps: ['mathbio-2.1'], refs: ['Edelstein-Keshet ch. 2', 'Murray I ch. 2'],
          pic: 'Pick any starting point on the axis and watch the cobweb bounce between the curve and the diagonal; drag the map’s shape and the cobweb spirals in, spirals out, or staircases away.' },
        { num: '2.4', kind: 'Theorem', name: 'Stability of fixed points: |f′(x*)| < 1', deps: ['mathbio-2.3', 'pma-9.23', 'pma-5.10'], refs: ['Edelstein-Keshet ch. 2'],
          pic: 'A tangent line at the fixed point shows f′(x*); as its slope passes −1 the cobweb switches from a converging spiral to a diverging one, with the contraction factor read out at each step.' },
        { num: '2.5', kind: 'Model', name: 'Discrete logistic map', deps: ['mathbio-2.4', 'mathbio-1.4'], refs: ['Murray I ch. 2', 'Edelstein-Keshet ch. 2'],
          pic: 'Slide the growth parameter r from 1 to 4 and watch the time series of x_{t+1} = r x_t(1 − x_t) settle, oscillate between two values, four values, and then wander irregularly.' },
        { num: '2.6', kind: 'Phenomenon', name: 'Period-doubling route to chaos', deps: ['mathbio-2.5', 'ode-11.4'], refs: ['Murray I ch. 2'],
          pic: 'The bifurcation diagram of the logistic map is computed point by point; zoom into any branch to see the cascade of doublings repeat, and click a parameter to see the matching cobweb.' },
        { num: '2.7', kind: 'Phenomenon', name: 'Feigenbaum universality', deps: ['mathbio-2.6', 'ode-11.8'], refs: ['Murray I ch. 2'],
          pic: 'Compute successive period-doubling parameters for the logistic, Ricker and sine maps; the ratios of gaps converge to the same 4.669… in all three columns.' },
        { num: '2.8', kind: 'Phenomenon', name: 'Sensitive dependence and the Lyapunov exponent', deps: ['mathbio-2.5', 'ode-11.7'], refs: ['Murray I ch. 2'],
          pic: 'Launch two trajectories that differ in the tenth decimal place; their separation grows exponentially in the chaotic regime, and the Lyapunov exponent plotted against r turns positive exactly where chaos begins.' },
        { num: '2.9', kind: 'Theorem', name: 'Period three implies chaos (Li–Yorke, Sharkovskii)', deps: ['mathbio-2.5', 'pma-4.23', 'ode-11.10'], refs: ['Murray I ch. 2'],
          pic: 'Zoom to the period-3 window near r ≈ 3.83 and display the third iterate touching the diagonal; Sharkovskii’s ordering is drawn as a ladder with the periods already found highlighted.' },
        { num: '2.10', kind: 'Model', name: 'Ricker model', deps: ['mathbio-2.4'], refs: ['Edelstein-Keshet ch. 3'],
          pic: 'Fish stock–recruitment data are fitted with the overcompensating Ricker curve; raise the intrinsic rate and the projected stock goes from steady to boom-and-bust cycles.' },
        { num: '2.11', kind: 'Model', name: 'Beverton–Holt model', deps: ['mathbio-2.4'], refs: ['Edelstein-Keshet ch. 3'],
          pic: 'Compare Beverton–Holt and Ricker maps side by side: however high you push the growth rate, the compensating Beverton–Holt cobweb converges monotonically while Ricker goes chaotic.' },
        { num: '2.12', kind: 'Theorem', name: 'Stability of planar maps: the Jury conditions', deps: ['mathbio-2.4', 'pma-9.17'], refs: ['Edelstein-Keshet ch. 2'],
          pic: 'Drag the trace and determinant of a 2×2 Jacobian inside the stability triangle; eigenvalues are plotted against the unit circle and iterates spiral in or out as the point crosses each edge.' },
        { num: '2.13', kind: 'Model', name: 'Nicholson–Bailey host–parasitoid model', deps: ['mathbio-2.12'], refs: ['Edelstein-Keshet ch. 3', 'Murray I ch. 3'],
          pic: 'Hosts and parasitoids are iterated generation by generation with random Poisson encounters; the phase-plane trajectory spirals outward from the equilibrium in every run.' },
        { num: '2.14', kind: 'Phenomenon', name: 'Nicholson–Bailey instability and stabilization by aggregation', deps: ['mathbio-2.13'], refs: ['Edelstein-Keshet ch. 3'],
          pic: 'Replace random search with clumped, negative-binomial attacks and lower the clumping parameter k; once k drops below 1 the outward spiral turns inward and the system persists.' },
        { num: '2.15', kind: 'Paper', name: 'Simple Mathematical Models with Very Complicated Dynamics',
          paper: { authors: 'Robert M. May', year: 1976, title: 'Simple mathematical models with very complicated dynamics',
                   venue: 'Nature 261 (5560): 459–467', doi: '10.1038/261459a0' },
          introduces: [], deps: ['mathbio-2.5', 'mathbio-2.9', 'mathbio-2.10'], refs: [],
          pic: 'May’s logistic map x → ax(1 − x): sweep a and watch the fixed point give way to cycles of period 2, 4, 8 … at a = 3, 3.449, 3.544 …, accumulate into chaos at 3.5699 and reappear as a period-3 window at 3.8284 — the thresholds the paper tabulates — then cobweb any a and compare with the Ricker map’s cascade.' },
      ],
    },
    {
      n: 3,
      title: 'Interacting populations',
      summary: String.raw`Two coupled equations already capture predation, competition and mutualism, and the phase plane is where they are understood. The Lotka–Volterra predator–prey system has a conserved quantity and neutral cycles — elegant but structurally fragile — while realistic functional responses produce genuine limit cycles via Hopf bifurcations and the paradox of enrichment. Competition models give Gause’s exclusion principle and, in the chemostat, the R* rule; the community matrix sets up the question of large-system stability.`,
      items: [
        { num: '3.1', kind: 'Method', name: 'Phase-plane analysis: nullclines and direction fields', deps: ['mathbio-1.5'], refs: ['Edelstein-Keshet ch. 5'],
          pic: 'Type any two-species model; the direction field and both nullclines are drawn, and clicking launches an integrated trajectory that crosses each nullcline horizontally or vertically.' },
        { num: '3.2', kind: 'Theorem', name: 'Linearization and the trace–determinant classification', deps: ['mathbio-3.1', 'pma-9.17', 'pma-9.36', 'ode-6.5'], refs: ['Edelstein-Keshet ch. 5'],
          pic: 'Drag a point around the trace–determinant plane and the phase portrait morphs between saddle, node, spiral and centre, with the eigenvalues shown live in the complex plane.' },
        { num: '3.3', kind: 'Model', name: 'Lotka–Volterra predator–prey equations', deps: ['mathbio-3.1', 'ode-6.8'], refs: ['Murray I ch. 3', 'Edelstein-Keshet ch. 6'],
          pic: 'Hares and lynx oscillate out of phase in a time plot while the same run traces a closed loop in the phase plane; predator peaks always lag prey peaks by a quarter cycle.' },
        { num: '3.4', kind: 'Theorem', name: 'Lotka–Volterra conserved quantity and closed orbits', deps: ['mathbio-3.3'], refs: ['Murray I ch. 3'],
          pic: 'Contours of the conserved quantity V = δx − γ ln x + βy − α ln y are drawn. Compare the plotted finite-step energy error for Euler, RK4 and symplectic Euler against the tiny-step RK4 reference; symplectic area preservation does not imply exact energy conservation.' },
        { num: '3.5', kind: 'Theorem', name: 'Cycle averages equal the coexistence equilibrium', deps: ['mathbio-3.4', 'pma-6.21'], refs: ['Murray I ch. 3'],
          pic: 'Pick orbits of very different sizes; running averages of prey and predator over each cycle converge to the same equilibrium values regardless of amplitude.' },
        { num: '3.6', kind: 'Principle', name: 'Volterra’s principle', deps: ['mathbio-3.5'], refs: ['Murray I ch. 3'],
          pic: 'Apply a fishing rate that removes both prey and predators; the average prey population rises and the average predator population falls, as D’Ancona saw in Adriatic catches.' },
        { num: '3.7', kind: 'Phenomenon', name: 'Structural instability of the Lotka–Volterra centre', deps: ['mathbio-3.4', 'mathbio-3.2'], refs: ['Murray I ch. 3'],
          pic: 'Add an arbitrarily small prey self-limitation term with a slider; the family of closed orbits turns into spirals that wind inward, showing the neutral cycles are an artefact.' },
        { num: '3.8', kind: 'Model', name: 'Holling functional responses (types I–III)', deps: ['mathbio-3.3'], refs: ['Murray I ch. 3', 'Edelstein-Keshet ch. 6'],
          pic: 'A predator spends time searching and handling simulated prey; the measured intake rate against prey density traces a straight, a saturating or a sigmoid curve depending on the behaviour chosen.' },
        { num: '3.9', kind: 'Model', name: 'Rosenzweig–MacArthur predator–prey model', deps: ['mathbio-3.8', 'mathbio-1.4'], refs: ['Murray I ch. 3'],
          pic: 'The prey nullcline is a hump and the predator nullcline a vertical line; drag the predator line left or right of the hump and the equilibrium switches between a stable spiral and a limit cycle.' },
        { num: '3.10', kind: 'Concept', name: 'Limit cycles', deps: ['mathbio-3.1', 'ode-7.1'], refs: ['Edelstein-Keshet ch. 8'],
          pic: 'Start trajectories inside and outside a closed orbit; both are attracted to the same cycle, unlike the neutral Lotka–Volterra loops, and a Poincaré section shows the return map’s fixed point.' },
        { num: '3.11', kind: 'Theorem', name: 'Poincaré–Bendixson theorem', deps: ['mathbio-3.10', 'ode-7.2'], refs: ['Edelstein-Keshet ch. 8', 'Murray I ch. 3'],
          pic: 'Draw a trapping annulus around an unstable equilibrium and check that the vector field points inward on its boundary; trajectories started anywhere inside wind onto a cycle that must exist.' },
        { num: '3.12', kind: 'Theorem', name: 'Hopf bifurcation: birth of a limit cycle', deps: ['mathbio-3.2', 'mathbio-3.10', 'ode-8.13'], refs: ['Edelstein-Keshet ch. 8'],
          pic: 'Slide a parameter through the value where a pair of eigenvalues crosses the imaginary axis; a cycle grows from zero amplitude like the square root of the distance past threshold.' },
        { num: '3.13', kind: 'Paradox', name: 'Paradox of enrichment', deps: ['mathbio-3.9', 'mathbio-3.12'], refs: ['Murray I ch. 3'],
          pic: 'Raise the prey’s carrying capacity — richer food — and the stable coexistence point loses stability; the cycles that appear grow until prey and predators come within a hair of extinction.' },
        { num: '3.14', kind: 'Theorem', name: 'Kolmogorov’s theorem for predator–prey systems', deps: ['mathbio-3.9', 'mathbio-3.11'], refs: ['Murray I ch. 3'],
          pic: 'Pick growth and predation functions from menus; the tool checks Kolmogorov’s sign conditions and, when the equilibrium is unstable, shows the limit cycle the theorem guarantees.' },
        { num: '3.15', kind: 'Model', name: 'Lotka–Volterra competition equations', deps: ['mathbio-3.1', 'mathbio-1.4', 'ode-6.9'], refs: ['Murray I ch. 3', 'Edelstein-Keshet ch. 6'],
          pic: 'Two species share a resource; drag the competition coefficients and both straight nullclines tilt, with trajectories integrated from a grid of starting points.' },
        { num: '3.16', kind: 'Theorem', name: 'Four outcomes of two-species competition', deps: ['mathbio-3.15', 'mathbio-3.2'], refs: ['Murray I ch. 3'],
          pic: 'A 2×2 map of coefficient space shows four regions — species 1 wins, species 2 wins, stable coexistence, founder control; click any point to see its phase portrait.' },
        { num: '3.17', kind: 'Principle', name: 'Competitive exclusion principle (Gause)', deps: ['mathbio-3.16'], refs: ['Edelstein-Keshet ch. 6'],
          pic: 'Make the two species’ niches identical with an overlap slider; as overlap approaches 1 the coexistence region shrinks to nothing and the weaker competitor always disappears.' },
        { num: '3.18', kind: 'Model', name: 'Mutualism models', deps: ['mathbio-3.15'], refs: ['Murray I ch. 3'],
          pic: 'Flip the signs of the interaction terms to positive; with weak mutualism the populations settle above their solo capacities, and strong mutualism sends both off to infinity in finite simulated time.' },
        { num: '3.19', kind: 'Model', name: 'The chemostat', deps: ['mathbio-3.1', 'mathbio-1.5'], refs: ['Edelstein-Keshet ch. 4'],
          pic: 'An animated culture vessel with inflow and outflow; set the dilution rate and nutrient feed and the bacterial density settles, or washes out when dilution exceeds the maximal growth rate.' },
        { num: '3.20', kind: 'Theorem', name: 'Competitive exclusion in the chemostat: the R* rule', deps: ['mathbio-3.19', 'mathbio-3.17'], refs: ['Edelstein-Keshet ch. 4'],
          pic: 'Several strains with different Monod curves compete for one nutrient; each strain’s break-even level R* is marked, and the simulation always ends with only the lowest-R* strain present.' },
        { num: '3.21', kind: 'Model', name: 'Generalized Lotka–Volterra systems and the community matrix', deps: ['mathbio-3.15', 'mathbio-3.2'], refs: ['Murray I ch. 3'],
          pic: 'Build an n-species interaction matrix as a heatmap; the community matrix at equilibrium is computed and its eigenvalues are plotted, predicting whether the integrated community returns after a kick.' },
        { num: '3.22', kind: 'Paper', name: 'Analytical Note on Certain Rhythmic Relations',
          paper: { authors: 'Alfred J. Lotka', year: 1920, title: 'Analytical Note on Certain Rhythmic Relations in Organic Systems',
                   venue: 'Proceedings of the National Academy of Sciences 6 (7): 410–415', doi: '10.1073/pnas.6.7.410' },
          introduces: ['mathbio-3.3'], deps: ['mathbio-1.2', 'mathbio-5.1'], refs: [],
          pic: 'Lotka’s plant–herbivore system: plants grow, herbivores eat them and die off, and the two densities circle an equilibrium in the phase plane without damping; drag the starting point to trace a family of closed orbits and read off the period of the undamped rhythm Lotka predicted.' },
        { num: '3.23', kind: 'Paper', name: 'Fluctuations in the Abundance of a Species',
          paper: { authors: 'Vito Volterra', year: 1926, title: 'Fluctuations in the Abundance of a Species considered Mathematically',
                   venue: 'Nature 118 (2972): 558–560', doi: '10.1038/118558a0' },
          introduces: ['mathbio-3.3', 'mathbio-3.4', 'mathbio-3.5', 'mathbio-3.6'], deps: ['mathbio-3.1', 'mathbio-1.4'], refs: [],
          pic: 'Volterra’s three laws for prey and predator: the densities cycle with a period fixed by the parameters, their time averages equal the equilibrium whatever the start, and uniform harvesting of both raises the average prey and lowers the average predator — turn fishing effort down, as when Adriatic fishing paused during the First World War, and see the predators’ share of the catch rise, the puzzle in D’Ancona’s fish-market statistics that prompted the paper.' },
      ],
    },
    {
      n: 4,
      title: 'Structured populations',
      summary: String.raw`Individuals of different ages or stages contribute differently to growth, so a population is really a vector. The Leslie matrix projects it forward, and the Perron–Frobenius theorem guarantees a single dominant growth rate and a stable age distribution that any initial population approaches. The Euler–Lotka equation, reproductive value and elasticities turn this into demography that guides conservation, and the renewal and McKendrick equations carry it to continuous age.`,
      items: [
        { num: '4.1', kind: 'Definition', name: 'Life table: survivorship lₓ and fecundity mₓ', deps: [], refs: ['Edelstein-Keshet ch. 1'],
          pic: 'Follow a simulated cohort of newborns through time; the fraction still alive at each age builds the survivorship curve lₓ while offspring counts build the fecundity schedule mₓ.' },
        { num: '4.2', kind: 'Model', name: 'Leslie matrix model', deps: ['mathbio-4.1', 'mathbio-2.1', 'ladr-3.43'], refs: ['Edelstein-Keshet ch. 1'],
          pic: 'Edit survival and fecundity entries in a Leslie matrix and project an age pyramid forward; each bar is pushed up one class and the newborn bar is refilled by the fecundities.' },
        { num: '4.3', kind: 'Theorem', name: 'Perron–Frobenius theorem for primitive matrices', deps: ['mathbio-4.2', 'rca-18.5', 'stoch-4.6'], refs: ['Edelstein-Keshet ch. 1'],
          pic: 'All eigenvalues of an editable nonnegative matrix are plotted in the complex plane; one real positive eigenvalue always sits strictly outside the others, and ‖Lⁿ‖^{1/n} converges to it.' },
        { num: '4.4', kind: 'Theorem', name: 'Strong ergodic theorem: convergence to the stable age distribution', deps: ['mathbio-4.3', 'ladr-8.46'], refs: ['Edelstein-Keshet ch. 1'],
          pic: 'Start from wildly different age pyramids; the normalized age distributions converge to the same dominant eigenvector, at a speed set by the ratio of the two largest eigenvalues.' },
        { num: '4.5', kind: 'Definition', name: 'Net reproductive number R₀ and generation time', deps: ['mathbio-4.1'], refs: ['Edelstein-Keshet ch. 1'],
          pic: 'The product lₓmₓ is drawn as bars over age; its total is R₀ and its centre of mass the generation time T, both updating as you edit the life table.' },
        { num: '4.6', kind: 'Theorem', name: 'Euler–Lotka equation', deps: ['mathbio-4.2', 'mathbio-4.5'], refs: ['Edelstein-Keshet ch. 1'],
          pic: 'Plot Σ λ^{−x} lₓmₓ as a function of λ; it decreases monotonically and crosses 1 at exactly the dominant eigenvalue of the Leslie matrix built from the same table.' },
        { num: '4.7', kind: 'Theorem', name: 'λ > 1 exactly when R₀ > 1', deps: ['mathbio-4.6', 'pma-4.23'], refs: ['Edelstein-Keshet ch. 1'],
          pic: 'Scale fecundity up and down; λ and R₀ are plotted together and cross 1 at the same moment, although their values otherwise differ.' },
        { num: '4.8', kind: 'Theorem', name: 'Growth rate from R₀ and generation time: r ≈ ln R₀ / T', deps: ['mathbio-4.6'], refs: ['Edelstein-Keshet ch. 1'],
          pic: 'Compare the exact r from Euler–Lotka with the approximation ln R₀ / T for random life tables; the scatter hugs the diagonal and drifts off only for very spread-out reproduction.' },
        { num: '4.9', kind: 'Concept', name: 'Reproductive value', deps: ['mathbio-4.3'], refs: ['Edelstein-Keshet ch. 1'],
          pic: 'Introduce one individual of each age into an empty population and project; the long-run population each produces is proportional to the left eigenvector — Fisher’s reproductive value.' },
        { num: '4.10', kind: 'Concept', name: 'Sensitivity and elasticity of λ', deps: ['mathbio-4.9'], refs: ['Edelstein-Keshet ch. 1'],
          pic: 'A loggerhead-turtle stage matrix with an elasticity heatmap: boosting juvenile survival raises λ far more than boosting egg survival, as the live recomputation confirms.' },
        { num: '4.11', kind: 'Model', name: 'Stage-structured (Lefkovitch) matrix models', deps: ['mathbio-4.2'], refs: ['Edelstein-Keshet ch. 1'],
          pic: 'Draw a life-cycle graph with stages and arrows for growth, stasis and reproduction; it is converted to a matrix whose dominant eigenvalue and stable stage distribution are shown.' },
        { num: '4.12', kind: 'Phenomenon', name: 'Population momentum', deps: ['mathbio-4.4'], refs: ['Edelstein-Keshet ch. 1'],
          pic: 'Drop fertility instantly to replacement level in a young population; total size keeps rising for decades as the bulge of young people moves through the reproductive ages.' },
        { num: '4.13', kind: 'Model', name: 'Lotka’s renewal equation', deps: ['mathbio-4.6', 'fa-9.13', 'stoch-11.3'], refs: ['Murray I ch. 1'],
          pic: 'Births B(t) are computed from past births weighted by the maternity function; transient waves of births damp out and B(t)e^{−rt} converges to a constant, as the renewal theorem predicts.' },
        { num: '4.14', kind: 'Model', name: 'McKendrick–von Foerster equation', deps: ['mathbio-4.13'], refs: ['Murray I ch. 1'],
          pic: 'Age density is transported along characteristics at unit speed while dying; the boundary at age zero is fed by births, and the age profile is animated as a surface over age and time.' },
      ],
    },
    {
      n: 5,
      title: 'Biochemical kinetics',
      summary: "Conservation and elementary reaction rates connect molecular binding to enzyme turnover. Explicit reductions separate rapid relaxation from slow depletion; cooperative and driven reaction networks then generate steep responses and oscillations.",
      items: [
        { num: '5.1', alias: 'pchem-7.4', name: 'Law of mass action' },
        {"num":"5.2","kind":"Model","name":"Ligand binding and the Langmuir isotherm","deps":["kin-1.3"],"see":["mathbio-5.1"],"refs":["Keener & Sneyd, Mathematical Physiology, chapter1 §1.1, binding eqs1.2–1.6"],"links":{"source":"https://www.math.auckland.ac.nz/~sneyd/Physiol_Book/chapter_1.pdf"},"pic":"Switch between a ligand reservoir and a closed sample. The dashed reference treats the chosen concentration as free; the solid curve solves the selected mass balance. The lower panel shows the actual free, bound and total ligand."},
        {"num":"5.3","kind":"Model","name":"Michaelis–Menten mechanism","deps":["kin-1.3","ode-2.4","ode-2.11"],"see":["mathbio-5.1"],"refs":["Eilertsen, Schnell & Walcher 2024, Rigorous estimates for the quasi-steady state approximation… §§1–2"],"links":{"source":"https://arxiv.org/pdf/2305.12602"},"pic":"Resolve complex and free-enzyme exchange over the first four seconds, then compare the full substrate/complex/product history. Every curve comes from the same full mechanism; free enzyme and product are recovered from conserved totals."},
        {"num":"5.4","kind":"Method","name":"Quasi-steady-state approximation","deps":["mathbio-5.3","kin-4.3"],"refs":["Eilertsen, Schnell & Walcher 2024, Rigorous estimates for the quasi-steady state approximation… §§1–2"],"links":{"source":"https://arxiv.org/pdf/2305.12602"},"pic":"Compare free substrate and product in both models, then inspect the actual complex against the moving nullcline. Change enzyme abundance to expose the neglected inventory and initial layer."},
        {"num":"5.5","kind":"Theorem","name":"Validity of the QSSA (Segel–Slemrod condition)","deps":["mathbio-5.4","kin-4.5","ode-2.5"],"refs":["Eilertsen, Schnell & Walcher 2024, Rigorous estimates for the quasi-steady state approximation… §§1–2","Segel & Slemrod 1989, The quasi-steady-state assumption: a case study in perturbation, SIAM Review 31:446–477 (abstract; original full body not supplied here)"],"links":{"source":"https://arxiv.org/pdf/2305.12602","supporting source":"https://doi.org/10.1137/1031091"},"pic":"Reduce enzyme with all other rates fixed. Compare sampled free-substrate error with the explicit conservative upper bound; the second panel resolves the error instead of hiding it under that bound."},
        {"num":"5.6","kind":"Method","name":"Lineweaver–Burk plot and its distortions","deps":["mathbio-5.4","ladr-6.61"],"refs":["Cornish-Bowden & Eisenthal 1974, Statistical considerations in the estimation of enzyme kinetic parameters by the direct linear plot…, Biochem J 139:721–730, p.721 eq1 (indexed primary passage)"],"links":{"source":"https://portlandpress.com/biochemj/article-pdf/139/3/721/616085/bj1390721.pdf"},"pic":"Compare fits to the same positive synthetic rates in both coordinate systems. Change the bounded additive noise and seed; the original-rate residual sum of squares reports what each fit actually optimizes."},
        {"num":"5.7","kind":"Model","name":"Competitive and uncompetitive inhibition","deps":["mathbio-5.4","mathbio-5.2"],"see":["kin-6.5"],"refs":["Strelow et al., Mechanism of Action Assays for Enzymes, Assay Guidance Manual, Competitive and Uncompetitive Inhibition (official indexed scheme descriptions)"],"links":{"source":"https://www.ncbi.nlm.nih.gov/books/NBK92001/"},"pic":"Compare an inhibited rate with its uninhibited reference and inspect the same two laws in reciprocal coordinates. The live apparent parameters follow the selected binding mechanism."},
        {"num":"5.8","kind":"Model","name":"Cooperative binding and the Hill equation","deps":["mathbio-5.2"],"see":["kin-6.7","mathbio-5.9"],"refs":["Hill 1910, equationB and its empirical interpretation, p.vi","Monod, Wyman & Changeux 1965, saturation function eq2, pp.90–92"],"links":{"source":"https://stuff.mit.edu/afs/athena/course/8/8.592/OldFiles/spring11/lectures/lec25/Hill_equation_J%20Physiol-1910.pdf","supporting source":"https://math.nyu.edu/~peskin/modsim_lecture_notes/monod_wyman_changeaux_allosteric.pdf"},"pic":"Change a continuous Hill exponent and the half-occupancy concentration. Compare the response in a chosen horizontal coordinate with its exact log-odds line."},
        {"num":"5.9","kind":"Model","name":"Monod–Wyman–Changeux allosteric model","deps":["mathbio-5.8","prob-2.1.1a"],"refs":["Monod, Wyman & Changeux 1965, On the nature of allosteric transitions: a plausible model, §§2–3, eqs1–2"],"links":{"source":"https://math.nyu.edu/~peskin/modsim_lecture_notes/monod_wyman_changeaux_allosteric.pdf"},"pic":"The state-resolved occupancy distribution and binding curve come from the same partition function. Move the ligand or change the unliganded conformational balance; the stacked bars show all five occupation classes."},
        {"num":"5.10","kind":"Model","name":"Goldbeter–Koshland zero-order ultrasensitivity","deps":["mathbio-5.4","ode-1.7"],"refs":["Goldbeter & Koshland 1981, An amplified sensitivity arising from covalent modification in biological systems, eqs1–10, pp.6840–6841"],"links":{"source":"https://utc.ulb.be/ARTICLES/1981_Goldbeter_PNAS.pdf"},"pic":"Compare the unique equilibrium response with the two opposing fluxes. Adjust both saturation constants and activity ratio; their intersection is computed by bracketing, with a live residual."},
        {"num":"5.11","kind":"Concept","name":"Conservation laws and reduced reaction networks","deps":["kin-1.3","mathbio-5.3","ladr-3.21"],"see":["mathbio-5.1"],"refs":["Maas & Mielke 2020, Modeling of Chemical Reaction Systems with Detailed Balance Using Gradient Structures, §2.1–2.2, eqs2.1–2.8"],"links":{"source":"https://pmc.ncbi.nlm.nih.gov/articles/PMC7683506/"},"pic":"The matrix encodes the actual mechanism. Choose a conservation row to highlight its species and watch that total remain flat while the four individual concentrations change."},
        {"num":"5.12","kind":"Principle","name":"Detailed balance and the Wegscheider condition","deps":["kin-1.3","kin-1.12","ladr-3.21"],"see":["mathbio-5.1"],"refs":["Maas & Mielke 2020, Modeling of Chemical Reaction Systems with Detailed Balance Using Gradient Structures, §2.1–2.2, eqs2.1–2.8"],"links":{"source":"https://pmc.ncbi.nlm.nih.gov/articles/PMC7683506/"},"pic":"Edit the six rates or enforce their cycle compatibility. Node sizes show the computed stationary populations; paired flux bars reveal whether each edge balances separately."},
        {"num":"5.13","kind":"Model","name":"Autocatalysis and the Brusselator","deps":["kin-1.3","mathbio-3.12"],"see":["mathbio-5.1","kin-8.4"],"refs":["Kuznetsov, Elements of Applied Bifurcation Theory2e, Example1.4 pp.19–20 and §3.6 exercise4 pp.105–107"],"links":{"source":"https://www.ma.imperial.ac.uk/~dturaev/kuznetsov.pdf"},"pic":"Change the maintained feed and initial perturbation. The phase trajectory and concentration history share the same integration. Finite-window oscillation amplitudes are compared with the nearby-Hopf asymptote, without declaring a transient to be an exact periodic orbit."},
        {"num":"5.14","kind":"Paper","name":"Aggregation of Haemoglobin and its Dissociation Curves","deps":["mathbio-5.8"],"refs":["Hill 1910, The possible effects of the aggregation of the molecules of haemoglobin on its dissociation curves, J Physiol 40suppl:iv–vii, especially table I and eqB p.vi"],"links":{"source":"https://stuff.mit.edu/afs/athena/course/8/8.592/OldFiles/spring11/lectures/lec25/Hill_equation_J%20Physiol-1910.pdf"},"paper":{"authors":"A. V. Hill","year":1910,"title":"The possible effects of the aggregation of the molecules of haemoglobin on its dissociation curves","venue":"Journal of Physiology 40 (Suppl.): iv–vii (Proceedings, 22 January 1910)","doi":"10.1113/jphysiol.1910.sp001386"},"introduces":["mathbio-5.8"],"pic":"Fit the seven observations actually printed in Hill’s table I. Move the trial exponent and half-saturation tension, compare residuals and Hill coordinates, or use the historical constants. No invented observations are added."},
      ],
    },
    {
      "n": 6,
      "title": "Oscillators, switches and excitability",
      "summary": "Explicit models separate stable cycles, finite oscillatory transients, bistability and excitable excursions. A strict Dulac argument rules out planar cycles, an invariant Sel’kov polygon supplies an existence proof, and the secant bound identifies a local feedback instability. Exact radial phase geometry then exposes resetting singularities, while finite circle-map searches make the limits of numerical entrainment evidence visible.",
      "items": [
        {
          "num": "6.1",
          "kind": "Theorem",
          "name": "Bendixson–Dulac criterion",
          "deps": [
            "mathbio-3.10",
            "pma-10.45",
            "ode-7.4"
          ],
          "refs": [
            "Written Green’s theorem PMA10.45 and limit-cycle definition MATHBIO3.10; direct flux and divergence calculation"
          ],
          "links": {},
          "pic": "Compare an unweighted field with a Dulac-weighted predator–prey field, or use a damped rotation. Change the candidate-circle radius and compare its line-integral flux with a separately derived area formula. Blue and orange tiles show the sign of the weighted divergence."
        },
        {
          "num": "6.2",
          "kind": "Model",
          "name": "Van der Pol oscillator and relaxation oscillations",
          "deps": [
            "mathbio-3.10",
            "mathbio-3.12",
            "ode-7.6",
            "ode-7.8"
          ],
          "refs": [
            "Ermentrout & Terman, university-hosted draft of Foundations of Mathematical Neuroscience, §§4.7,9.1–9.2; page references use the draft’s printed numbering; §4.7 pp.78–79, circuit reduction",
            "Written MATHBIO3.10; direct coordinate and slow-branch calculation"
          ],
          "links": {
            "draft": "https://neurophysics.ucsd.edu/courses/physics_171/Ermentrout_Therman.pdf"
          },
          "pic": "Increase μ and inspect the same trajectory in the Liénard plane and in time. Compare the measured late-window upward-crossing period with its large-μ asymptote. A time marker moves through both panels."
        },
        {
          "num": "6.3",
          "kind": "Model",
          "name": "Sel’kov model of glycolytic oscillations",
          "deps": [
            "mathbio-3.11",
            "mathbio-5.1"
          ],
          "refs": [
            "NIH/NSR JSim model 0341, Selkov: actual equations, nullclines and parameter description",
            "Written Poincaré–Bendixson result MATHBIO3.11; direct equilibrium and invariant-bound proof"
          ],
          "links": {
            "modelArchive": "https://www.imagwiki.nibib.nih.gov/physiome/jsim/models/webmodel/NSR/selkov"
          },
          "pic": "Vary substrate supply with a fixed a=0.1. Compare the orbit with its nullclines, then switch to the explicit invariant outer bound. The time panel makes slow near-boundary transients visible."
        },
        {
          "num": "6.4",
          "kind": "Model",
          "name": "Goodwin oscillator",
          "deps": [
            "mathbio-5.8",
            "mathbio-3.12"
          ],
          "refs": [
            "Arcak & Sontag (2006), Diagonal stability of a class of cyclic systems and its connection with the secant criterion, Introduction Eqs.(1)–(3) and Theorem 1, pp.1531–1532",
            "Written Hill-law interpretation MATHBIO5.8; direct linearization and boundedness calculation"
          ],
          "links": {
            "primary": "https://sontaglab.org/FTPDIR/arcak_sontag_automatica06.pdf"
          },
          "pic": "Change repression steepness and compare the three stage traces. The second panel is a projection of the same three-dimensional trajectory. Late-window ranges report what the finite run resolves without imposing a cycle amplitude."
        },
        {
          "num": "6.5",
          "kind": "Theorem",
          "name": "Secant condition for feedback-loop oscillators",
          "deps": [
            "mathbio-6.4"
          ],
          "refs": [
            "Arcak & Sontag (2006), Diagonal stability of a class of cyclic systems and its connection with the secant criterion, Introduction Eqs.(1)–(3) and Theorem 1, pp.1531–1532",
            "Direct characteristic-polynomial and convexity argument"
          ],
          "links": {
            "primary": "https://sontaglab.org/FTPDIR/arcak_sontag_automatica06.pdf"
          },
          "pic": "Move stage count and loop gain. Inspect the actual equal-loss eigenvalues and an exact dominant linear mode, including neutral oscillations at the threshold. Growing modes are allowed to grow instead of being forced into a saturated cycle."
        },
        {
          "num": "6.6",
          "kind": "Model",
          "name": "Bistable switch from positive feedback",
          "deps": [
            "mathbio-5.8",
            "mathbio-1.11"
          ],
          "refs": [
            "Edelstein-Keshet, MCB2012 lecture 3, positive/negative feedback concepts, especially slides 9–10",
            "Written MATHBIO5.8 and 1.11; direct factorization and pulse model"
          ],
          "links": {
            "lecture": "https://personal.math.ubc.ca/~keshet/MCB2012/SlidesLEK/Lect3.pdf"
          },
          "pic": "Compare baseline production with linear degradation, then change pulse height and duration. The time trace highlights the pulse interval and the unstable threshold. Move the time marker to inspect the finite state."
        },
        {
          "num": "6.7",
          "kind": "Phenomenon",
          "name": "Excitability",
          "deps": [
            "mathbio-6.2"
          ],
          "refs": [
            "Ermentrout & Terman, university-hosted draft of Foundations of Mathematical Neuroscience, §§4.7,9.1–9.2; page references use the draft’s printed numbering; §4.7 pp.78–79, cubic activation and recovery",
            "Direct equilibrium and Jacobian calculation"
          ],
          "links": {
            "draft": "https://neurophysics.ucsd.edu/courses/physics_171/Ermentrout_Therman.pdf"
          },
          "pic": "Compare a fixed small kick with a selected kick, inspect the nullclines and move along the resulting trajectory. Change the recovery rate and read the sampled peak and the finite endpoint distance from rest."
        },
        {
          "num": "6.8",
          "kind": "Model",
          "name": "Oregonator model of the Belousov–Zhabotinsky reaction",
          "deps": [
            "mathbio-6.2",
            "mathbio-5.13",
            "kin-8.7"
          ],
          "refs": [
            "Liu, Pérez-Mercader & Kiss (2022), Synchronization of Belousov–Zhabotinsky oscillators with electrochemical coupling in a spontaneous process, model Eqs.(3)–(10), DOI 10.1063/5.0096689",
            "Independent positive-subflow derivation; adaptive composition checked with SciPy Radau"
          ],
          "links": {
            "primary": "https://par.nsf.gov/servlets/purl/10436523"
          },
          "pic": "Change the fast time scales and stoichiometric factor. Compare the normalized chemical pulses with a raw activator/catalyst projection and read the actual selected concentrations. Each curve’s normalization is stated explicitly."
        },
        {
          "num": "6.9",
          "kind": "Concept",
          "name": "Phase and the phase response curve",
          "deps": [
            "mathbio-3.10"
          ],
          "refs": [
            "Ermentrout & Terman, university-hosted draft of Foundations of Mathematical Neuroscience, §§4.7,9.1–9.2; page references use the draft’s printed numbering; §9.1 pp.172–179, isochrons, resetting and λ–ω models",
            "Direct radial solution and phase-gradient calculation"
          ],
          "links": {
            "draft": "https://neurophysics.ucsd.edu/courses/physics_171/Ermentrout_Therman.pdf"
          },
          "pic": "Choose pulse phase, amplitude and isochron shear. Compare the actual post-pulse trajectory with its asymptotically matching cycle point, and compare the exact finite response with the infinitesimal prediction multiplied by pulse amplitude."
        },
        {
          "num": "6.10",
          "kind": "Phenomenon",
          "name": "Phase singularities and type 0 resetting (Winfree)",
          "deps": [
            "mathbio-6.9"
          ],
          "refs": [
            "Ermentrout & Terman, university-hosted draft of Foundations of Mathematical Neuroscience, §§4.7,9.1–9.2; page references use the draft’s printed numbering; §9.1.1 pp.174–175, weak/strong resetting and the Hopf normal form",
            "Direct translated-circle and radial-recovery derivation"
          ],
          "links": {
            "draft": "https://neurophysics.ucsd.edu/courses/physics_171/Ermentrout_Therman.pdf"
          },
          "pic": "Move pulse amplitude across one and set the old phase near one half. Inspect the translated cycle, the exact landing radius, recovery time and reset map. At the exact singularity the phase and recovery readouts are undefined."
        },
        {
          "num": "6.11",
          "kind": "Phenomenon",
          "name": "Entrainment and Arnold tongues",
          "deps": [
            "mathbio-6.9"
          ],
          "refs": [
            "Ermentrout & Terman, university-hosted draft of Foundations of Mathematical Neuroscience, §§4.7,9.1–9.2; page references use the draft’s printed numbering; §9.2.2 pp.188–190, forced phase maps, rotation number and periodic stability",
            "Direct monotone-lift displacement bound and derivative product"
          ],
          "links": {
            "draft": "https://neurophysics.ucsd.edu/courses/physics_171/Ermentrout_Therman.pdf"
          },
          "pic": "Select 1:1, 1:2 or 2:3 and inspect a finite-grid search for attracting periodic candidates. At the selected parameters, compare the return equation, multiplier and a finite rotation estimate rather than assigning a locking label from a rounded average."
        },
        {
          "num": "6.12",
          "alias": "ode-8.17",
          "name": "Kuramoto model of synchronization"
        }
      ]
    },
    {
      n: 7,
      title: 'Epidemics',
      summary: String.raw`Splitting a population into susceptible, infected and recovered classes gives the Kermack–McKendrick model, whose threshold theorem says an outbreak occurs only if one case causes more than one new case. The final-size relation, the timing of the peak and the overshoot past herd immunity all follow from a single conserved quantity. Births, latency, vectors, seasonality and heterogeneous contact enrich the picture, and the next-generation matrix gives the general recipe for R₀.`,
      items: [
        { num: '7.1', kind: 'Model', name: 'Kermack–McKendrick SIR model', deps: ['mathbio-3.1'], refs: ['Murray I ch. 10', 'Edelstein-Keshet ch. 6'],
          pic: 'Three coloured compartments drain into one another; adjust transmission and recovery rates and watch the infected curve rise and fall while the S–I phase plane shows the trajectory.' },
        { num: '7.2', kind: 'Definition', name: 'Basic reproduction number R₀', deps: ['mathbio-7.1'], refs: ['Murray I ch. 10'],
          pic: 'A transmission tree grows from one index case, each case drawing a Poisson number of secondary cases with mean R₀; the generation sizes grow or die out depending on whether R₀ exceeds 1.' },
        { num: '7.3', kind: 'Theorem', name: 'Epidemic threshold theorem', deps: ['mathbio-7.2'], refs: ['Murray I ch. 10'],
          pic: 'Slide R₀·S₀/N across 1: below it the introduced infection only declines, above it the infected count first rises — the dividing line is drawn on the phase plane as the vertical through S = N/R₀.' },
        { num: '7.4', kind: 'Theorem', name: 'Final-size equation', deps: ['mathbio-7.3'], refs: ['Murray I ch. 10'],
          pic: 'Plot both sides of z = 1 − e^{−R₀z} and find their intersection; the predicted attack rate matches the end point of the integrated SIR epidemic for every R₀ you choose.' },
        { num: '7.5', kind: 'Theorem', name: 'Prevalence peaks when S = N/R₀', deps: ['mathbio-7.3'], refs: ['Murray I ch. 10'],
          pic: 'Mark the moment of peak prevalence on the time series and read off the susceptible fraction there; it is exactly 1/R₀ whatever the initial number infected.' },
        { num: '7.6', kind: 'Phenomenon', name: 'Epidemic overshoot', deps: ['mathbio-7.4', 'mathbio-7.5'], refs: ['Murray I ch. 10'],
          pic: 'Compare the final fraction infected with the threshold 1 − 1/R₀; the epidemic keeps infecting people after the peak, and the shaded gap between the two numbers is the overshoot.' },
        { num: '7.7', kind: 'Model', name: 'SIS model and endemic equilibrium', deps: ['mathbio-7.1'], refs: ['Edelstein-Keshet ch. 6'],
          pic: 'Recovered individuals return to susceptibility; the infected fraction settles at 1 − 1/R₀, and the equation reduces to a logistic equation you can compare side by side.' },
        { num: '7.8', kind: 'Model', name: 'SIR with births: endemic equilibrium and damped waves', deps: ['mathbio-7.1', 'mathbio-3.2'], refs: ['Murray I ch. 10'],
          pic: 'Add births and deaths: successive epidemic waves shrink as the trajectory spirals into an endemic equilibrium, and the inter-epidemic period matches the imaginary part of the linearized eigenvalues.' },
        { num: '7.9', kind: 'Model', name: 'SEIR model and the latent period', deps: ['mathbio-7.1'], refs: ['Murray I ch. 10'],
          pic: 'Insert an exposed class and lengthen the latent period at fixed R₀: the epidemic peaks later and lower, and the early exponential growth rate falls as the readout shows.' },
        { num: '7.10', kind: 'Method', name: 'Next-generation matrix', deps: ['mathbio-7.2', 'mathbio-4.3'], refs: ['Murray I ch. 10'],
          pic: 'Build the next-generation matrix for a two-group or vector–host model by filling in who infects whom; its dominant eigenvalue is R₀, and changing one entry moves the eigenvalue and the simulated outbreak together.' },
        { num: '7.11', kind: 'Model', name: 'Ross–Macdonald malaria model', deps: ['mathbio-7.10'], refs: ['Murray I ch. 10'],
          pic: 'Humans and mosquitoes infect each other; R₀ is the geometric mean of the two transmission legs, and halving mosquito lifespan cuts R₀ far more than halving biting, as Ross argued.' },
        { num: '7.12', kind: 'Phenomenon', name: 'Seasonal forcing and recurrent measles epidemics', deps: ['mathbio-7.8'], refs: ['Murray I ch. 10'],
          pic: 'Modulate the contact rate with the school calendar; as forcing strength rises the simulated incidence switches from annual to biennial epidemics, matching the pattern of pre-vaccine measles in London.' },
        { num: '7.13', kind: 'Concept', name: 'Heterogeneous contact and the ⟨k²⟩/⟨k⟩ effect', deps: ['mathbio-7.2'], refs: ['Murray I ch. 10'],
          pic: 'Spread infection on networks with the same mean degree but increasing variance; the outbreak threshold falls as ⟨k²⟩/⟨k⟩ grows, and highly connected nodes are infected first.' },
        { num: '7.14', kind: 'Theorem', name: 'From growth rate to R: the Euler–Lotka link', deps: ['mathbio-7.9', 'mathbio-4.6'], refs: ['Murray I ch. 10'],
          pic: 'Pick a generation-interval distribution and an observed growth rate r; R = 1/M(−r) is computed from its moment-generating function, and the same r can mean very different R for short or long generation times.' },
        { num: '7.15', kind: 'Paper', name: 'The Prevention of Malaria',
          paper: { authors: 'Ronald Ross', year: 1911, title: 'The Prevention of Malaria',
                   venue: 'London: John Murray (2nd edition)', url: 'https://archive.org/details/b21351508' },
          introduces: ['mathbio-7.11'], deps: ['mathbio-1.2'], refs: [],
          pic: 'Ross’s mosquito theorem: infected people infect the mosquitoes that bite them and infected mosquitoes infect people; set mosquito density, biting rate and human recovery rate, and the coupled equations show malaria dying out below a critical mosquito density, long before every mosquito is gone — the threshold that justified control by reducing mosquito numbers.' },
        { num: '7.16', kind: 'Paper', name: 'A Contribution to the Mathematical Theory of Epidemics',
          paper: { authors: 'W. O. Kermack and A. G. McKendrick', year: 1927, title: 'A contribution to the mathematical theory of epidemics',
                   venue: 'Proceedings of the Royal Society of London, Series A 115 (772): 700–721', doi: '10.1098/rspa.1927.0118' },
          introduces: ['mathbio-7.1', 'mathbio-7.3', 'mathbio-7.4', 'ode-6.17'], deps: ['mathbio-3.1', 'mathbio-7.15'], refs: [],
          pic: 'Kermack and McKendrick’s plague fit: run the SIR equations and watch the epidemic stop with susceptibles left over once their number falls below the threshold, then overlay the paper’s curve dz/dt = 890 sech²(0.2t − 3.4) on the weekly plague deaths in Bombay in 1905–06 and adjust the parameters to see how well it fits.' },
      ],
    },
    {
      n: 8,
      title: 'Diffusion and travelling waves',
      summary: String.raw`Random movement of many individuals becomes diffusion, and diffusion combined with local growth makes reaction–diffusion equations. Their solutions spread as travelling fronts whose speed is fixed by growth and motility alone — the Fisher–KPP speed 2√(rD) — or, with an Allee effect, by the whole nonlinearity. Chemotaxis, critical patch sizes, rabies fronts and fat-tailed dispersal show how space changes population biology, and Reid’s paradox shows where simple diffusion fails.`,
      items: [
        { num: '8.1', kind: 'Model', name: 'Random walk and its diffusion limit', deps: ['stoch-13.2', 'prob-3.4.1'], refs: ['Edelstein-Keshet ch. 9'],
          pic: 'Release a thousand random walkers from one point; their histogram flattens into a Gaussian whose variance grows linearly in time, plotted against the theoretical 2Dt.' },
        { num: '8.2', alias: 'pchem-10.2', name: 'Fick’s law and the diffusion equation' },
        { num: '8.3', kind: 'Theorem', name: 'Fundamental solution: the spreading Gaussian', deps: ['mathbio-8.2', 'fa-7.6', 'pde-3.3'], refs: ['Murray I ch. 11'],
          pic: 'A point release spreads as a Gaussian whose width grows like √t; the numerically solved profile and the exact heat kernel are overlaid at several times.' },
        { num: '8.4', kind: 'Phenomenon', name: 'Diffusion time grows as length squared', deps: ['mathbio-8.3'], refs: ['Edelstein-Keshet ch. 9'],
          pic: 'Measure the time for oxygen or a protein to diffuse across a bacterium, a cell, a millimetre and a metre; on log–log axes the points lie on a slope-2 line, which is why large organisms need circulation.' },
        { num: '8.5', kind: 'Model', name: 'Reaction–diffusion equations', deps: ['mathbio-8.2'], refs: ['Murray I ch. 11', 'Edelstein-Keshet ch. 10'],
          pic: 'Choose a local reaction term from a menu and paint initial conditions on a line or a plane; the PDE is integrated live so growth and spread can be watched together.' },
        { num: '8.6', kind: 'Theorem', name: 'Critical patch size (KISS model)', deps: ['mathbio-8.5', 'mathbio-1.5'], refs: ['Murray I ch. 11'],
          pic: 'Phytoplankton grow inside a patch and are lost by diffusing out; shrink the patch and the population collapses exactly when its length falls below π√(D/r).' },
        { num: '8.7', kind: 'Model', name: 'Skellam’s linear spread of an invader', deps: ['mathbio-8.3', 'mathbio-1.2'], refs: ['Murray I ch. 13'],
          pic: 'Plot the square root of the occupied area of muskrats in central Europe against year; it grows linearly, and the slope matches the speed predicted from growth rate and diffusivity.' },
        { num: '8.8', kind: 'Model', name: 'Fisher–KPP equation', deps: ['mathbio-8.5', 'mathbio-1.4', 'pde-9.8'], refs: ['Murray I ch. 13', 'Edelstein-Keshet ch. 10'],
          pic: 'A step of occupied habitat advances into empty space as a front of fixed shape; mark the half-occupancy point and watch it move at constant speed.' },
        { num: '8.9', kind: 'Theorem', name: 'Minimal wave speed c* = 2√(rD)', deps: ['mathbio-8.8', 'mathbio-3.2', 'pde-12.7'], refs: ['Murray I ch. 13'],
          pic: 'In the travelling-wave phase plane the heteroclinic orbit stays positive only for c ≥ 2√(rD); drag c below that and the orbit spirals into negative densities, while the PDE’s measured speed sits at the minimum.' },
        { num: '8.10', kind: 'Model', name: 'Bistable (Nagumo) equation and front speed', deps: ['mathbio-8.5', 'mathbio-1.9'], refs: ['Murray I ch. 13'],
          pic: 'With an Allee threshold a, the front speed is proportional to (1/2 − a); slide a past one half and the wave reverses, with the invader retreating instead of advancing.' },
        { num: '8.11', kind: 'Concept', name: 'Pulled versus pushed fronts', deps: ['mathbio-8.9', 'mathbio-8.10'], refs: ['Murray I ch. 13'],
          pic: 'Colour individuals by their position in the front: in a pulled front the descendants of the leading edge take over, while in a pushed front the bulk behind contributes, shown by tracking neutral labels.' },
        { num: '8.12', kind: 'Model', name: 'Keller–Segel chemotaxis model', deps: ['mathbio-8.5'], refs: ['Murray I ch. 11', 'Edelstein-Keshet ch. 10'],
          pic: 'Cells secrete an attractant and climb its gradient; a uniform lawn is integrated in two dimensions and, for strong enough chemotactic sensitivity, breaks into aggregation centres.' },
        { num: '8.13', kind: 'Phenomenon', name: 'Chemotactic aggregation instability', deps: ['mathbio-8.12', 'mathbio-3.2'], refs: ['Murray I ch. 11'],
          pic: 'The growth rate of small perturbations is plotted against wavenumber; raise the sensitivity until part of the curve turns positive and the simulation picks out aggregates at the fastest-growing spacing.' },
        { num: '8.14', kind: 'Model', name: 'Travelling waves of rabies', deps: ['mathbio-8.8', 'mathbio-7.1'], refs: ['Murray II ch. 13'],
          pic: 'Rabid foxes diffuse into a susceptible fox population and an epidemic wave sweeps across a map with recurring secondary waves behind it; a vaccinated break of chosen width either stops or fails to stop the front.' },
        { num: '8.15', kind: 'Model', name: 'Integrodifference equations and fat-tailed dispersal', deps: ['mathbio-8.9'], refs: ['Edelstein-Keshet ch. 10'],
          pic: 'Iterate growth followed by dispersal with Gaussian, exponential or fat-tailed kernels; thin tails give constant-speed fronts, while fat tails make the front accelerate generation after generation.' },
        { num: '8.16', kind: 'Paradox', name: 'Reid’s paradox of rapid plant migration', deps: ['mathbio-8.15'], refs: ['Murray I ch. 13'],
          pic: 'Compare the post-glacial northward spread of oaks inferred from pollen with the speed computed from typical acorn dispersal; diffusion falls short by orders of magnitude until rare long jumps are added.' },
        { num: '8.17', kind: 'Model', name: 'Density-dependent diffusion and sharp-edged fronts', deps: ['mathbio-8.5'], refs: ['Murray I ch. 11'],
          pic: 'Let diffusivity grow with density, as when crowded insects disperse; a released population spreads with a sharp edge and finite extent at all times, unlike the infinitely thin tails of linear diffusion.' },
      ],
    },
    {
      n: 9,
      title: 'Pattern formation',
      summary: String.raw`How does a uniform embryo make spots, stripes and segments? Morphogen gradients supply positional information, and Turing’s insight was that diffusion — normally a smoothing process — can destabilize a uniform state when a short-range activator is held in check by a fast-diffusing inhibitor. Dispersion relations predict which wavelengths grow, domain size and geometry decide what pattern survives, and excitable media add spirals and targets; real chemical and biological Turing patterns close the chapter.`,
      items: [
        { num: '9.1', kind: 'Concept', name: 'Morphogen gradients and positional information', deps: ['mathbio-8.2'], refs: ['Edelstein-Keshet ch. 11'],
          pic: 'Cells along a line read a morphogen concentration against two thresholds and adopt one of three fates, drawing a French flag; double the source strength and watch the borders shift.' },
        { num: '9.2', kind: 'Model', name: 'Source–sink gradient with decay length √(D/k)', deps: ['mathbio-9.1', 'mathbio-8.5'], refs: ['Edelstein-Keshet ch. 11'],
          pic: 'A localized source and uniform degradation produce an exponential profile; the fitted decay length tracks √(D/k) as you vary diffusion and degradation independently.' },
        { num: '9.3', kind: 'Theorem', name: 'Turing instability', deps: ['mathbio-8.5', 'mathbio-3.2', 'pde-12.5'], refs: ['Murray II ch. 2', 'Edelstein-Keshet ch. 11'],
          pic: 'Start from a stable uniform state of a two-species reaction and switch on diffusion: with equal diffusivities nothing happens, but raise the inhibitor’s diffusivity and a periodic pattern grows out of tiny noise.' },
        { num: '9.4', kind: 'Theorem', name: 'Turing conditions: short-range activation, long-range inhibition', deps: ['mathbio-9.3'], refs: ['Murray II ch. 2'],
          pic: 'Four inequalities on the Jacobian and the diffusion ratio are listed with live check-marks; tweak the kinetic parameters and the pattern appears exactly when the last condition is satisfied.' },
        { num: '9.5', kind: 'Concept', name: 'Dispersion relation and the band of unstable modes', deps: ['mathbio-9.3'], refs: ['Murray II ch. 2'],
          pic: 'Plot the growth rate Re λ(k²) and shade the band where it is positive; the pattern’s measured wavelength in the simulation matches the fastest-growing mode.' },
        { num: '9.6', kind: 'Model', name: 'Gierer–Meinhardt activator–inhibitor model', deps: ['mathbio-9.4'], refs: ['Murray II ch. 2', 'Edelstein-Keshet ch. 11'],
          pic: 'Integrate the Gierer–Meinhardt equations on a sheet of cells; activator peaks emerge at regular spacing and new peaks insert themselves as the sheet is stretched.' },
        { num: '9.7', kind: 'Model', name: 'Schnakenberg model', deps: ['mathbio-9.4'], refs: ['Murray II ch. 2'],
          pic: 'The simplest substrate-depletion Turing system on a square: vary the diffusion ratio and the steady pattern changes from spots to stripes, computed live with a spectral solver.' },
        { num: '9.8', kind: 'Phenomenon', name: 'Domain size selects the pattern', deps: ['mathbio-9.5'], refs: ['Murray II ch. 3'],
          pic: 'Grow a one-dimensional domain slowly; the number of peaks jumps at lengths where a new mode enters the unstable band, and a domain that is too small shows no pattern at all.' },
        { num: '9.9', kind: 'Phenomenon', name: 'Spotted bodies, striped tails', deps: ['mathbio-9.8'], refs: ['Murray II ch. 3'],
          pic: 'Solve a Turing system on a tapering cone: the wide end develops spots while the narrow tip can only support stripes, the geometry argument behind patterns on cheetah and genet tails.' },
        { num: '9.10', kind: 'Phenomenon', name: 'Stripes, spots and labyrinths in two dimensions', deps: ['mathbio-9.6'], refs: ['Murray II ch. 2'],
          pic: 'Sweep one kinetic parameter across a 2D Gray–Scott or Gierer–Meinhardt simulation and watch the steady state pass through hexagonal spots, labyrinthine stripes and inverted spots.' },
        { num: '9.11', kind: 'Model', name: 'Spiral waves in excitable media', deps: ['mathbio-6.7', 'mathbio-8.5'], refs: ['Murray I ch. 12'],
          pic: 'Break a travelling wave of excitation in a 2D FitzHugh-type medium with the mouse; the free ends curl into a rotating spiral whose tip meanders as parameters change.' },
        { num: '9.12', kind: 'Phenomenon', name: 'Target patterns and spirals in BZ and Dictyostelium', deps: ['mathbio-9.11', 'mathbio-6.8'], refs: ['Murray I ch. 12'],
          pic: 'Pacemaker sites emit concentric target waves that annihilate on collision while broken fronts turn into spirals, the patterns seen in BZ dishes and in aggregating slime-mould amoebae.' },
        { num: '9.13', kind: 'Model', name: 'Clock-and-wavefront model of somitogenesis', deps: ['mathbio-6.4', 'mathbio-9.2'], refs: ['Murray II ch. 3'],
          pic: 'Cells oscillate along an elongating body axis while a receding gradient freezes the clock; each time the wavefront passes, a new somite boundary forms, and slowing the clock makes longer somites.' },
        { num: '9.14', kind: 'Phenomenon', name: 'Turing patterns observed: CIMA reaction and zebrafish stripes', deps: ['mathbio-9.10'], refs: ['Murray II ch. 3'],
          pic: 'Side-by-side panels compare simulated activator–inhibitor patterns with the CIMA chemical spots of 1990 and with laser-ablation regrowth of zebrafish stripes, matching the predicted wavelength.' },
        { num: '9.15', kind: 'Phenomenon', name: 'Pattern formation on growing domains', deps: ['mathbio-9.8'], refs: ['Murray II ch. 4'],
          pic: 'Let the domain grow while the Turing system runs: stripes split and insert in a regular, reproducible sequence, as on alligator jaws and snake skins, instead of the random choice seen on a fixed domain.' },
        { num: '9.16', kind: 'Paper', name: 'The Chemical Basis of Morphogenesis',
          paper: { authors: 'A. M. Turing', year: 1952, title: 'The Chemical Basis of Morphogenesis',
                   venue: 'Philosophical Transactions of the Royal Society of London, Series B 237 (641): 37–72', doi: '10.1098/rstb.1952.0012' },
          introduces: ['mathbio-9.3', 'mathbio-9.5', 'pde-12.5'], deps: ['mathbio-8.5', 'mathbio-3.2'], refs: [],
          pic: 'Turing’s ring of cells: two morphogens react and diffuse around a ring; below a critical ratio of diffusion rates the uniform state is stable, above it a stationary wave with a preferred wavelength grows out of small random disturbances, as in his worked example on a ring of twenty cells — then switch to a two-dimensional sheet and get an irregular dappled pattern like the one he computed.' },
      ],
    },
    {
      n: 10,
      title: 'Spatial models in medicine and ecology',
      summary: String.raw`The machinery of reaction, diffusion and chemotaxis pays off in applications: why gliomas recur after resection, how wounds close, why the visual cortex produces geometric hallucinations, how seashells are painted and how wolves and deer coexist in buffer zones between territories. These are models with clinical or ecological consequences, each a short step from the general theory of the previous two chapters.`,
      items: [
        { num: '10.1', kind: 'Model', name: 'Glioma growth by proliferation and diffusion', deps: ['mathbio-8.5', 'mathbio-1.2'], refs: ['Murray II ch. 11'],
          pic: 'Tumour cells proliferate and diffuse through grey and white matter at different rates on a brain slice; the simulated tumour spreads fastest along white-matter tracts.' },
        { num: '10.2', kind: 'Phenomenon', name: 'The invisible tumour margin', deps: ['mathbio-10.1', 'mathbio-8.9'], refs: ['Murray II ch. 11'],
          pic: 'Set an imaging detection threshold and resect everything above it; the low-density tail left behind regrows, and the predicted survival time depends on the diffusion-to-growth ratio, not on how much was cut.' },
        { num: '10.3', kind: 'Model', name: 'Epidermal wound healing as a travelling wave', deps: ['mathbio-8.8'], refs: ['Murray II ch. 9'],
          pic: 'Cells migrate and divide into a circular wound with mitosis boosted by a chemical they secrete; the wound radius shrinks almost linearly in time, matching measured healing curves.' },
        { num: '10.4', kind: 'Model', name: 'Lateral inhibition and the Mexican-hat kernel', deps: ['mathbio-9.4'], refs: ['Murray II ch. 12'],
          pic: 'Draw a kernel of local excitation and broader inhibition and convolve it with a noisy field; repeated application sharpens the field into regularly spaced peaks with spacing set by the kernel’s Fourier peak.' },
        { num: '10.5', kind: 'Phenomenon', name: 'Geometric visual hallucinations (Ermentrout–Cowan)', deps: ['mathbio-10.4', 'mathbio-9.5'], refs: ['Murray II ch. 12'],
          pic: 'Stripe and hexagon patterns of activity in a model of visual cortex are mapped back through the retino-cortical log-polar map, producing the tunnels, spirals and funnels people report seeing.' },
        { num: '10.6', kind: 'Model', name: 'Seashell pigmentation patterns', deps: ['mathbio-9.6', 'mathbio-6.7'], refs: ['Murray II ch. 12'],
          pic: 'A one-dimensional row of cells at the shell’s growing edge runs an activator–inhibitor model; time stacks down the shell, drawing triangles, oblique lines and branching patterns like real cone shells.' },
        { num: '10.7', kind: 'Model', name: 'Bacterial colony rings and chemotactic patterns', deps: ['mathbio-8.12'], refs: ['Murray II ch. 5'],
          pic: 'E. coli inoculated at the centre of a dish consume nutrient and secrete attractant; the colony develops concentric rings or spots depending on nutrient level, integrated on a polar grid.' },
        { num: '10.8', kind: 'Model', name: 'Mechanochemical model of cell aggregation', deps: ['mathbio-9.3'], refs: ['Murray II ch. 6'],
          pic: 'Cells pull on an elastic extracellular matrix and move up density gradients; above a traction threshold the uniform tissue condenses into regularly spaced aggregates like feather or cartilage primordia.' },
        { num: '10.9', kind: 'Model', name: 'Grey-squirrel invasion as a competition wave', deps: ['mathbio-8.9', 'mathbio-3.15'], refs: ['Murray II ch. 1'],
          pic: 'Grey and red squirrels compete and diffuse across a map of Britain; the grey front advances at a speed set by competition coefficients and the reds are displaced behind it.' },
        { num: '10.10', kind: 'Model', name: 'Wolf territories and buffer zones', deps: ['mathbio-8.12'], refs: ['Murray II ch. 14'],
          pic: 'Wolf packs scent-mark and avoid foreign marks, producing territories with gaps between them; deer move into the buffer zones, and the model shows those refuges protecting the deer population.' },
        { num: '10.11', kind: 'Concept', name: 'Fractal dimension of biological branching', deps: [], refs: ['Murray I ch. 14'],
          pic: 'Overlay boxes of shrinking size on a bronchial tree or a retinal vessel image and count those that touch the structure; the slope of log count against log size gives the fractal dimension.' },
      ],
    },
    {
      n: 11,
      title: 'Stochastic population dynamics',
      summary: String.raw`Real populations are made of individuals, and chance births and deaths matter most exactly when numbers are small — at invasion, near extinction and at the start of an epidemic. A birth–death master equation replaces the ODE; its extinction probability, quasi-stationary state and diffusion approximation tell us when the deterministic picture can be trusted. Gillespie’s algorithm simulates such systems exactly, and the same ideas explain minor outbreaks and the fade-outs of measles in small cities.`,
      items: [
        { num: '11.1', kind: 'Model', name: 'Linear birth–death process and its master equation', deps: ['mathbio-1.2', 'stoch-10.12'], refs: [],
          pic: 'Fifty independent stochastic realizations of a birth–death process fan out around the deterministic exponential; the histogram of population sizes at a chosen time is compared with the master-equation solution.' },
        { num: '11.2', kind: 'Theorem', name: 'Extinction probability of a birth–death process', deps: ['mathbio-11.1', 'stoch-3.10'], refs: [],
          pic: 'Start from N₀ individuals with birth rate above death rate and count how many of a thousand runs go extinct; the fraction matches (d/b)^{N₀} even though the mean grows exponentially.' },
        { num: '11.3', kind: 'Model', name: 'Stochastic logistic growth and the quasi-stationary distribution', deps: ['mathbio-11.1', 'mathbio-1.4'], refs: [],
          pic: 'Run the stochastic logistic model and histogram the population conditioned on survival; it settles into a quasi-stationary bell around K that slowly leaks mass into the extinct state.' },
        { num: '11.4', kind: 'Theorem', name: 'Mean time to extinction grows exponentially with carrying capacity', deps: ['mathbio-11.3'], refs: [],
          pic: 'Measure mean extinction times for carrying capacities from 5 to 50; on a log axis the times climb along a straight line, so modest increases in habitat size buy enormous gains in persistence.' },
        { num: '11.5', kind: 'Method', name: 'Diffusion (Fokker–Planck) approximation of a master equation', deps: ['mathbio-11.1', 'mathbio-8.1', 'stoch-10.4'], refs: ['Edelstein-Keshet ch. 9'],
          pic: 'Compare the exact master-equation distribution with its Fokker–Planck approximation as system size grows; the two curves converge and the deterministic ODE emerges as the moving peak.' },
        { num: '11.6', kind: 'Algorithm', name: 'Gillespie stochastic simulation algorithm', deps: ['mathbio-11.1', 'mathbio-5.1', 'stoch-10.10', 'kin-9.3'], refs: [],
          pic: 'Step through the algorithm one reaction at a time: draw an exponential waiting time, choose which reaction fires in proportion to its propensity, update counts — and compare averaged runs with the mass-action ODE.' },
        { num: '11.7', kind: 'Theorem', name: 'Probability of a major outbreak: 1 − 1/R₀', deps: ['mathbio-7.3', 'mathbio-11.2'], refs: ['Murray I ch. 10'],
          pic: 'Seed a stochastic SIR model with one case many times; a bimodal histogram of final sizes appears, and the fraction of large outbreaks matches 1 − 1/R₀ as R₀ is varied.' },
        { num: '11.8', kind: 'Phenomenon', name: 'Critical community size and measles fade-outs', deps: ['mathbio-7.12', 'mathbio-11.4'], refs: [],
          pic: 'Simulate stochastic measles with births in towns of different sizes; small towns see the virus go extinct between epidemics, and fade-outs vanish above a few hundred thousand people, as Bartlett observed.' },
        { num: '11.9', kind: 'Model', name: 'Reed–Frost chain-binomial epidemic', deps: ['mathbio-11.7'], refs: [],
          pic: 'Infection spreads in discrete generations in a household-sized group, each susceptible escaping each infective independently; the exact distribution of final sizes is computed and compared with simulation.' },
      ],
    },
  ],
};
