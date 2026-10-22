// Syllabus — Logic & Foundations (curated course; see collection.js for references)
//
// Sources consulted (Oct 2026):
//   Enderton, A Mathematical Introduction to Logic, 2nd ed. — full section TOC:
//     https://book.douban.com/subject/2250577/  (sections 1.0–4.4 confirmed; refs use these numbers)
//   Smullyan, Gödel’s Incompleteness Theorems (OUP 1992) — chapter TOC I–XI:
//     https://academic.oup.com/book/40753
//   Kunen, Set Theory: An Introduction to Independence Proofs (1980) — TOC and index checked in
//     https://fa.ewi.tudelft.nl/~hart/onderwijs/set_theory/Jech/Kunen-1980-Set_Theory.pdf
//     (Schröder–Bernstein I 10.2, König I 10.40–41, Burali-Forti I §7, Zorn/Hartogs in Ch. I
//     exercises, König’s lemma II 5.7, Mostowski collapse III 5.15, Skolem paradox Ch. IV)
//   Courses: Cambridge Part II Logic and Set Theory schedule
//     https://www.maths.cam.ac.uk/undergrad/course/schedules.pdf ;
//     MIT 18.510 catalog + 2008 notes https://pi.math.cornell.edu/~kessler/Logic/groupnotes.html ;
//     Berkeley Math 125A https://classes.berkeley.edu/content/2026-fall-math-125a-001-lec-001
//   Lists: https://en.wikipedia.org/wiki/List_of_mathematical_logic_topics ,
//     https://en.wikipedia.org/wiki/List_of_paradoxes
// Gaps filled after comparison: Morley’s categoricity theorem, well-founded relations and
//   ∈-induction, the Mostowski collapse (Cambridge schedule, Kunen III).
// Deliberate omissions: Knaster–Tarski and chain-complete posets (order theory, not in the refs),
//   arithmetical hierarchy/Post’s theorem, Trakhtenbrot, Ax–Grothendieck, determinacy, dependent
//   choice, Stone duality, proof theory (cut elimination) — candidates for a later append.
// Refs without a matching section in the three books (Goodstein, Cantor–Bendixson, Vitali,
//   Banach–Tarski, ultraproducts) point to the chapter holding the machinery they use.
export default {
  collection: 'logic',
  chapters: [
    // ───────────────────────────────────────────────────────────── 1
    {
      n: 1,
      title: 'Infinity and the paradoxes',
      summary: String.raw`Cantor showed that infinite sets come in different sizes, and that comparing them needs nothing more than bijections and injections. The same diagonal trick that separates the countable from the uncountable also produces the paradoxes — Russell’s set, the liar, Berry’s and Richard’s definitions — that forced mathematics to say precisely what a set, a sentence and a definition are. The rest of the course is the answer.`,
      items: [
        { num: '1.1', kind: 'Paradox', name: 'Hilbert’s hotel', deps: ['pma-2.4'], refs: ['Enderton Ch. 0'],
          pic: 'A full hotel with rooms 1, 2, 3, …: choose a reassignment rule (n ↦ n+1, n ↦ 2n, prime powers for busloads) and watch every old and new guest receive a distinct room, with a readout confirming no room is doubly booked.' },
        { num: '1.2', kind: 'Theorem', name: 'Cantor’s theorem: no set maps onto its power set', deps: ['pma-2.14'], refs: ['Kunen Ch. I', 'Enderton Ch. 0'],
          pic: 'Define any map f from a small set X to its subsets by clicking a grid; the diagonal set {x : x ∉ f(x)} is computed and highlighted as the one row that differs from every f(x) in at least one place.' },
        { num: '1.3', kind: 'Theorem', name: 'Schröder–Bernstein theorem', deps: ['pma-2.3'], refs: ['Kunen Ch. I'],
          pic: 'Two injections between sets drawn as arrows split the points into chains (cycles, two-sided chains, and chains starting in A or in B); the bijection is assembled chain by chain and the leftover count stays at zero.' },
        { num: '1.4', kind: 'Theorem', name: 'The continuum: |ℝ| = |P(ℕ)| = |ℝ²|', deps: ['logic-1.3', 'pma-2.14'], refs: ['Kunen Ch. I'],
          pic: 'Interleave the decimal digits of a point of the unit square to get a point of the interval and back; a toggle shows the trouble with expansions ending in 9s and the Schröder–Bernstein repair.' },
        { num: '1.5', kind: 'Theorem', name: 'Transcendental numbers exist (Cantor)', deps: ['pma-2.13', 'pma-2.14'], refs: ['Enderton Ch. 0'],
          pic: 'Integer polynomials are enumerated by height and their real roots dropped onto the number line as a growing countable list; a diagonal construction builds a number that avoids every root listed so far.' },
        { num: '1.6', kind: 'Paradox', name: 'Russell’s paradox', deps: ['logic-1.2'], refs: ['Kunen Ch. I'],
          pic: 'A membership table for a small universe of “sets”: the collection R of rows not containing themselves is computed, and asking whether R is a row makes the answer flip between yes and no on every evaluation.' },
        { num: '1.7', kind: 'Paradox', name: 'The liar paradox', deps: [], refs: ['Smullyan Ch. I'],
          pic: 'Write a small system of sentences that refer to each other’s truth; a solver tries every truth assignment, finds consistent ones for harmless loops and none at all once a sentence says of itself that it is false.' },
        { num: '1.8', kind: 'Paradox', name: 'Berry’s paradox', deps: ['logic-1.7'], refs: ['Smullyan Ch. I'],
          pic: 'Count the numbers definable in at most k words of a toy vocabulary; the first number not so definable is found — and then defined by a phrase of fewer than k words, showing that “definable” cannot be a property within the language.' },
        { num: '1.9', kind: 'Paradox', name: 'Grelling–Nelson paradox (heterological words)', deps: ['logic-1.6'], refs: ['Smullyan Ch. I'],
          pic: 'Adjectives are tested against themselves (“short” is short, “long” is not long) to fill an autological/heterological table, until the entry for “heterological” cannot be filled consistently.' },
        { num: '1.10', kind: 'Paradox', name: 'Richard’s paradox', deps: ['logic-1.2', 'logic-1.8'], refs: ['Smullyan Ch. I'],
          pic: 'List English definitions of reals between 0 and 1 in dictionary order and diagonalize their decimal digits; the new number has a short definition yet is missing from the list — the seed of Gödel’s construction.' },
        { num: '1.11', kind: 'Paper', name: 'Ueber eine Eigenschaft des Inbegriffs … algebraischen Zahlen',
          paper: { authors: 'Georg Cantor', year: 1874, title: 'Ueber eine Eigenschaft des Inbegriffs aller reellen algebraischen Zahlen', venue: 'Journal für die reine und angewandte Mathematik 77: 258–262', doi: '10.1515/crll.1874.77.258' },
          introduces: ['logic-1.5', 'pma-2.43a'], deps: ['pma-2.38', 'pma-1.19'], refs: [],
          pic: 'Cantor’s two steps: the algebraic numbers stream onto a list ordered by his height N = n − 1 + |a₀| + … + |aₙ|, and from any interval the reader picks, nested intervals squeeze down on a real number that the list provably misses — a transcendental number appears digit by digit, and no list of reals can escape the same construction.' },
      ],
    },
    // ───────────────────────────────────────────────────────────── 2
    {
      n: 2,
      title: 'Propositional logic',
      summary: String.raw`Formulas are built from sentence letters with connectives, and every formula can be read in exactly one way, so truth values can be computed by recursion on its structure. Truth tables decide tautology and consequence, normal forms show that a few connectives express every Boolean function, and circuits are the same thing in hardware. Compactness — an infinite set of formulas is satisfiable as soon as each finite part is — is the first theorem with real content.`,
      items: [
        { num: '2.1', kind: 'Definition', name: 'Propositional formulas and unique readability', deps: [], refs: ['Enderton §1.1', 'Enderton §1.3'],
          pic: 'Type a formula and watch its parse tree grow; delete a parenthesis and the parser exhibits two different trees for the same string, which is exactly what unique readability forbids.' },
        { num: '2.2', kind: 'Theorem', name: 'Induction and recursion on formulas', deps: ['logic-2.1'], refs: ['Enderton §1.4'],
          pic: 'A recursively defined quantity (number of symbols, depth, number of parentheses) is computed bottom-up on the parse tree, and an inductive claim such as “left and right parentheses balance” is checked node by node.' },
        { num: '2.3', kind: 'Definition', name: 'Truth assignments and truth tables', deps: ['logic-2.2'], refs: ['Enderton §1.2'],
          pic: 'Toggle the truth values of the sentence letters and see the value propagate up the parse tree; a full truth table fills in row by row alongside.' },
        { num: '2.4', kind: 'Definition', name: 'Tautology, satisfiability and logical consequence', deps: ['logic-2.3'], refs: ['Enderton §1.2'],
          pic: 'Enter premises and a conclusion; the truth table highlights the rows where all premises hold and flags any such row where the conclusion fails as a countermodel.' },
        { num: '2.5', kind: 'Theorem', name: 'Disjunctive and conjunctive normal forms', deps: ['logic-2.4'], refs: ['Enderton §1.5'],
          pic: 'Click cells of a truth table to define any Boolean function; its DNF is read off from the true rows and its CNF from the false rows, and both are re-evaluated to match the table.' },
        { num: '2.6', kind: 'Theorem', name: 'Functional completeness; NAND suffices', deps: ['logic-2.5'], refs: ['Enderton §1.5'],
          pic: 'Wire NAND gates in a circuit editor to realise a target truth table; the circuit’s table is computed live and a gate counter compares your design with the normal-form construction.' },
        { num: '2.7', kind: 'Theorem', name: 'Post’s functional completeness criterion', deps: ['logic-2.6'], refs: ['Enderton §1.5'],
          pic: 'Choose a set of connectives; the five Post classes (monotone, affine, self-dual, 0-preserving, 1-preserving) are tested, and if the set lies in one of them a function it cannot express is exhibited.' },
        { num: '2.8', kind: 'Definition', name: 'Boolean algebras and switching circuits', deps: ['logic-2.3'], refs: ['Enderton §1.6'],
          pic: 'Switches in series and parallel light a lamp; drag the switches and the lamp agrees with the formula, and algebraic simplifications of the formula remove switches without changing the behaviour.' },
        { num: '2.9', kind: 'Theorem', name: 'Tautologies are decidable; the cost of truth tables', deps: ['logic-2.4'], refs: ['Enderton §1.7'], see: ['toc-13.4'],
          pic: 'Generate random formulas with n letters and time the truth-table check: the 2ⁿ rows plotted on log axes show why satisfiability, though decidable, becomes the archetypal hard problem.' },
        { num: '2.10', kind: 'Lemma', name: 'König’s lemma', deps: [], refs: ['Kunen Ch. II'],
          pic: 'Grow an infinite, finitely branching tree level by level and follow at each step a child with infinitely many descendants to build an infinite branch; switch to an infinitely branching tree and the walk can be trapped.' },
        { num: '2.11', kind: 'Theorem', name: 'Compactness theorem for propositional logic', deps: ['logic-2.4', 'logic-2.10'], refs: ['Enderton §1.7'],
          pic: 'An infinite list of clauses is fed in one at a time; the tree of partial assignments consistent with each finite stage is pruned, and König’s lemma picks a branch satisfying them all.' },
        { num: '2.12', kind: 'Proposition', name: 'De Bruijn–Erdős: colouring infinite graphs', deps: ['logic-2.11'], refs: ['Enderton §1.7'],
          pic: 'An infinite planar graph is revealed piece by piece; every finite piece gets a valid 4-colouring, and compactness glues a coherent colouring of the whole graph out of the finite ones.' },
      ],
    },
    // ───────────────────────────────────────────────────────────── 3
    {
      n: 3,
      title: 'First-order languages and structures',
      summary: String.raw`First-order logic adds variables ranging over a domain, quantifiers, and symbols for functions and relations. A structure interprets the symbols, and Tarski’s recursive definition says when a formula is true in it. With truth in hand we can talk about validity, definable sets, isomorphism and elementary equivalence — the vocabulary of everything that follows.`,
      items: [
        { num: '3.1', kind: 'Definition', name: 'First-order languages: terms and formulas', deps: ['logic-2.1'], refs: ['Enderton §2.1'],
          pic: 'Pick a signature (one binary relation, or 0, S, +, ·) and assemble terms and formulas from tiles; the builder refuses ill-formed combinations and shows the parse tree of each well-formed one.' },
        { num: '3.2', kind: 'Definition', name: 'Free and bound variables; sentences', deps: ['logic-3.1'], refs: ['Enderton §2.1'],
          pic: 'Each variable occurrence in a formula is coloured by the quantifier that binds it, with free occurrences left grey; renaming a bound variable changes nothing, renaming a free one changes the meaning.' },
        { num: '3.3', kind: 'Definition', name: 'Structures for a language', deps: ['logic-3.1'], refs: ['Enderton §2.2'],
          pic: 'Draw a directed graph on a few points to define a structure for a language with one binary relation; the same picture can be reinterpreted as an order, an equivalence relation or a function table.' },
        { num: '3.4', kind: 'Definition', name: 'Tarski’s definition of satisfaction', deps: ['logic-3.2', 'logic-3.3'], refs: ['Enderton §2.2'],
          pic: 'Evaluate a sentence such as ∀x∃y E(x,y) on the graph you drew: the evaluator steps through the quantifiers, picking witnesses for ∃ and hunting counterexamples for ∀, and highlights the vertex that decides the outcome.' },
        { num: '3.5', kind: 'Definition', name: 'Logical implication and validity', deps: ['logic-3.4'], refs: ['Enderton §2.2'],
          pic: 'Enter premises and a conclusion; random small structures are generated and tested, and any structure satisfying the premises but not the conclusion is displayed as a countermodel.' },
        { num: '3.6', kind: 'Definition', name: 'Definable sets and relations', deps: ['logic-3.4'], refs: ['Enderton §2.2'],
          pic: 'In the ordered field of reals, type a formula with one free variable and see the subset of the line it defines (∃y y·y = x gives the non-negative reals); in (ℕ, +) the even numbers and the order are definable too.' },
        { num: '3.7', kind: 'Definition', name: 'Isomorphism and elementary equivalence', deps: ['logic-3.4'], refs: ['Enderton §2.2'],
          pic: 'Drag the points of one graph onto another to build a bijection; edges that fail to match are flagged, and two non-isomorphic structures can still be shown to satisfy the same small set of sentences.' },
        { num: '3.8', kind: 'Theorem', name: 'Isomorphic structures satisfy the same sentences', deps: ['logic-3.7'], refs: ['Enderton §2.2'],
          pic: 'Apply an isomorphism to a structure and re-evaluate a list of sentences: every truth value is carried over unchanged, while a mere bijection that breaks one edge changes some answers.' },
        { num: '3.9', kind: 'Proposition', name: 'Automorphisms preserve definable sets', deps: ['logic-3.8'], refs: ['Enderton §2.2'],
          pic: 'Stretch the line with an order-preserving map such as x ↦ x³: any set definable in (ℝ, <) without parameters must be carried onto itself, so only ∅ and ℝ qualify, and the relation y = 2x visibly is not preserved.' },
        { num: '3.10', kind: 'Definition', name: 'Substructures and elementary substructures', deps: ['logic-3.7'], refs: ['Enderton §2.6'],
          pic: 'Compare (ℚ, <) inside (ℝ, <) with (ℕ, <) inside (ℤ, <): sentences with parameters from the small structure are evaluated in both, and the second pair disagrees on “there is something below 0”.' },
        { num: '3.11', kind: 'Theorem', name: 'Tarski–Vaught criterion', deps: ['logic-3.10'], refs: ['Enderton §2.6'],
          pic: 'For a candidate substructure, every existential formula with parameters inside it is tested: whenever the big structure has a witness, the checker looks for one in the substructure and reports the first failure.' },
        { num: '3.12', kind: 'Theorem', name: 'Prenex normal form', deps: ['logic-3.5'], refs: ['Enderton §2.4'],
          pic: 'Pull quantifiers out of a formula one rewriting step at a time, renaming variables to avoid capture; each intermediate formula is checked to have the same truth value on random structures.' },
        { num: '3.13', kind: 'Definition', name: 'Theories, axioms and their models', deps: ['logic-3.5'], refs: ['Enderton §2.6'],
          pic: 'Select axioms (reflexive, transitive, antisymmetric, total, dense, without endpoints) and draw finite relations; the model checker lists which axioms each satisfies and shows, for instance, that no finite structure is dense without endpoints.' },
      ],
    },
    // ───────────────────────────────────────────────────────────── 4
    {
      n: 4,
      title: 'Proofs, soundness and completeness',
      summary: String.raw`A deductive calculus turns logical consequence into a finite, checkable activity: axioms plus modus ponens. Soundness says derivations never lead from truth to falsehood; Gödel’s completeness theorem says every valid consequence has a derivation, proved by Henkin’s idea of building a model out of the syntax itself. Compactness falls out at once, and with it the first limits of what first-order axioms can say.`,
      items: [
        { num: '4.1', kind: 'Definition', name: 'A deductive calculus: axioms and modus ponens', deps: ['logic-3.5'], refs: ['Enderton §2.4'],
          pic: 'A proof checker: build a derivation line by line; each line is justified as a logical axiom, a hypothesis or a modus ponens step, and an unjustified line turns red.' },
        { num: '4.2', kind: 'Theorem', name: 'Deduction theorem', deps: ['logic-4.1'], refs: ['Enderton §2.4'],
          pic: 'Take a derivation of ψ from hypotheses including φ; the transformation into a derivation of φ → ψ without φ is performed line by line, and the new proof is re-checked.' },
        { num: '4.3', kind: 'Theorem', name: 'Generalization theorem', deps: ['logic-4.1'], refs: ['Enderton §2.4'],
          pic: 'From a derivation of φ(x) with x not free in the hypotheses, generate a derivation of ∀x φ(x); introduce a hypothesis mentioning x and the transformation fails at a visible step.' },
        { num: '4.4', kind: 'Theorem', name: 'Soundness theorem', deps: ['logic-4.1', 'logic-3.5'], refs: ['Enderton §2.5'],
          pic: 'Each line of a derivation is tested on random finite structures and stays true whenever the hypotheses are; add a bogus inference rule and the tester immediately finds a structure where it leads from truth to falsehood.' },
        { num: '4.5', kind: 'Lemma', name: 'Henkin’s lemma: complete theories with witnesses', deps: ['logic-4.2', 'logic-4.3'], refs: ['Enderton §2.5'],
          pic: 'Starting from a consistent set of sentences, new constants are added as witnesses for each existential sentence and the sentences are decided one by one; a running list shows the growing complete, witnessed theory.' },
        { num: '4.6', kind: 'Theorem', name: 'Gödel’s completeness theorem', deps: ['logic-4.4', 'logic-4.5'], refs: ['Enderton §2.5'],
          pic: 'The Henkin theory from a consistent set is turned into a term model: the domain is the set of closed terms modulo provable equality, and every sentence of the theory is evaluated in it and found true.' },
        { num: '4.7', kind: 'Theorem', name: 'Compactness theorem', deps: ['logic-4.6'], refs: ['Enderton §2.5'],
          pic: 'Feed in an infinite list of sentences; for each finite stage a model is exhibited, and the completeness argument shows why one model for all of them must exist even when no finite stage reveals it.' },
        { num: '4.8', kind: 'Theorem', name: 'The validities are effectively enumerable', deps: ['logic-4.6'], refs: ['Enderton §2.5'],
          pic: 'A machine lists all derivations in order of length and prints their conclusions; type a valid sentence and watch it eventually appear, type an invalid one and the search runs on forever.' },
        { num: '4.9', kind: 'Proposition', name: 'Finiteness is not first-order expressible', deps: ['logic-4.7'], refs: ['Enderton §2.6'],
          pic: 'Sentences “there are at least n elements” for every n are satisfied stage by stage by ever larger finite structures; propose any sentence meant to mean “finite” and the tool finds an infinite model of it from a large enough finite one.' },
        { num: '4.10', kind: 'Proposition', name: 'Connectedness is not first-order axiomatizable', deps: ['logic-4.7'], refs: ['Enderton §2.6'],
          pic: 'Two constants and the sentences “no path of length n joins them” are finitely satisfied by long path graphs; compactness yields a model where the endpoints are disconnected, so no theory can capture connectedness.' },
        { num: '4.11', kind: 'Theorem', name: 'Second-order logic: categorical but not complete', deps: ['logic-4.7'], refs: ['Enderton §4.1'],
          pic: 'Second-order induction pins down the natural numbers; add a constant above every numeral and every finite subset still has a model while the whole has none, so compactness — and hence any complete proof system — must fail.' },
        { num: '4.12', kind: 'Paper', name: 'Vollständigkeit der Axiome des logischen Funktionenkalküls',
          paper: { authors: 'Kurt Gödel', year: 1930, title: 'Die Vollständigkeit der Axiome des logischen Funktionenkalküls', venue: 'Monatshefte für Mathematik und Physik 37: 349–360', doi: '10.1007/BF01696781' },
          introduces: ['logic-4.6', 'logic-4.7'], deps: ['logic-4.1', 'logic-4.4', 'logic-3.12', 'logic-2.11'], refs: ['Gödel 1930, complete authorized Collected Works I translation, pp.103–123'],
          pic: 'Run an authored bounded degree-one instance construction, inspect checked finite assignments or contradictory cores, and compare all twelve prefixes; the original proof additionally needs degree reduction and an infinitary compatible-system selection, neither of which this finite preview executes.' },
      ],
    },
    // ───────────────────────────────────────────────────────────── 5
    {
      n: 5,
      title: 'Model theory',
      summary: String.raw`Compactness and completeness give first-order theories a startling flexibility: any theory with an infinite model has models of every infinite size, including countable models of set theory and non-standard models of arithmetic. Some theories are nevertheless pinned down in one size, and back-and-forth arguments and quantifier elimination tell us exactly what such theories say. Ultraproducts make the infinitesimals of Leibniz rigorous.`,
      items: [
        { num: '5.1', kind: 'Theorem', name: 'Downward Löwenheim–Skolem theorem', deps: ['logic-4.6', 'logic-3.11'], refs: ['Enderton §2.6'],
          pic: 'Start with a few seed reals inside (ℝ, <, +, ·) and close under witnesses for existential formulas in stages; the growing set stays countable, and the Tarski–Vaught checker certifies it as an elementary substructure.' },
        { num: '5.2', kind: 'Theorem', name: 'Upward Löwenheim–Skolem theorem', deps: ['logic-4.7'], refs: ['Enderton §2.6'],
          pic: 'Add κ new constants required to be pairwise distinct to the theory of a model; every finite batch is satisfied in the original model, so a model of size at least κ exists — shown with a slider for the number of constants.' },
        { num: '5.3', kind: 'Paradox', name: 'Skolem’s paradox', deps: ['logic-5.1', 'logic-1.2'], refs: ['Enderton §2.6', 'Kunen Ch. IV'],
          pic: 'A countable model of set theory contains an object it believes is the uncountable set of reals; the outside view lists its members in a sequence, the inside view searches for a bijection with ω among the model’s own sets and never finds one.' },
        { num: '5.4', kind: 'Definition', name: 'Categoricity in a cardinal', deps: ['logic-5.2'], refs: ['Enderton §2.6'],
          pic: 'For theories such as infinite sets, dense orders, ℚ-vector spaces and algebraically closed fields, a table marks in which sizes all models are isomorphic, with a pair of non-isomorphic models shown where it fails.' },
        { num: '5.5', kind: 'Theorem', name: 'Cantor’s back-and-forth theorem', deps: ['logic-5.4'], refs: ['Enderton §2.6'],
          pic: 'Build an order-isomorphism between ℚ and the dyadic rationals of (0,1): each step extends a finite monotone matching, alternating sides so that both get exhausted, and the matching is drawn as a growing monotone staircase.' },
        { num: '5.6', kind: 'Theorem', name: 'Łoś–Vaught test', deps: ['logic-5.4', 'logic-5.2'], refs: ['Enderton §2.6'],
          pic: 'For a theory you select, the tool checks “no finite models” and “categorical in some infinite size” and then decides whether a given sentence about dense orders is provable, by evaluating it in a single model.' },
        { num: '5.7', kind: 'Definition', name: 'Quantifier elimination', deps: ['logic-3.6'], refs: ['Enderton §3.1'],
          pic: 'A formula with quantifiers and the equivalent quantifier-free formula are evaluated side by side on random parameter values, and the agreement counter climbs while any disagreement would be shown in red.' },
        { num: '5.8', kind: 'Theorem', name: 'Quantifier elimination for the successor function', deps: ['logic-5.7'], refs: ['Enderton §3.1'],
          pic: 'In (ℕ, 0, S) type a formula with one free variable; the elimination procedure rewrites it into equations x = Sⁿ0, and the defined set on a number strip is always finite or cofinite.' },
        { num: '5.9', kind: 'Theorem', name: 'Tarski: real closed fields eliminate quantifiers', deps: ['logic-5.7'], refs: ['Enderton §2.6'],
          pic: 'Eliminate ∃x from a polynomial condition with parameters: the region of parameters where ax² + bx + c = 0 has a root is shaded as b² − 4ac ≥ 0 (with the a = 0 cases), and sampling confirms every point.' },
        { num: '5.10', kind: 'Theorem', name: 'Non-standard models of arithmetic', deps: ['logic-4.7'], refs: ['Enderton §2.6'],
          pic: 'Add a constant c with c > n for each numeral n; the resulting model is drawn as ℕ followed by a dense line of ℤ-shaped blocks, and clicking an element shows its successors, predecessors and that 2c lies in a later block.' },
        { num: '5.11', kind: 'Theorem', name: 'Ultraproducts and Łoś’s theorem', deps: ['logic-3.3', 'rca-4.21'], refs: ['Enderton §2.8'],
          pic: 'Sequences of structures (finite fields of growing characteristic, say) are combined coordinatewise; a sentence holds in the ultraproduct exactly when the set of coordinates where it holds is “large”, shown as a shaded index set.' },
        { num: '5.12', kind: 'Definition', name: 'Hyperreals and infinitesimals', deps: ['logic-5.2', 'logic-5.11'], refs: ['Enderton §2.8'],
          pic: 'A microscope slider zooms into the hyperreal line: around each real sits a halo of infinitesimally close hyperreals, and an infinite hyperreal sits beyond every integer tick.' },
        { num: '5.13', kind: 'Theorem', name: 'Transfer principle and infinitesimal calculus', deps: ['logic-5.12', 'pma-5.1'], refs: ['Enderton §2.8'],
          pic: 'Pick a function and a point; the derivative is computed as the standard part of (f(x+ε) − f(x))/ε for an infinitesimal ε, and compared with the ε–δ derivative from Rudin.' },
        { num: '5.14', kind: 'Theorem', name: 'Morley’s categoricity theorem', deps: ['logic-5.6'], refs: ['Enderton §2.6'],
          pic: 'For countable theories, a grid marks categoricity in ℵ₀ and in uncountable sizes: algebraically closed fields of fixed characteristic are categorical in every uncountable size, dense orders only in ℵ₀, and Morley’s theorem says one uncountable size forces all of them.' },
      ],
    },
    // ───────────────────────────────────────────────────────────── 6
    {
      n: 6,
      title: 'Computability',
      summary: String.raw`What does it mean for a function to be computable? Turing machines and the recursive functions give two very different answers that turn out to coincide, which supports the Church–Turing thesis. A universal machine can simulate all others, and diagonalizing against it shows that the halting problem — and every non-trivial property of programs — is undecidable.`,
      items: [
        { num: '6.1', alias: 'toc-7.1', name: 'Turing machines' },
        { num: '6.2', alias: 'toc-8.2', name: 'Primitive recursive functions' },
        { num: '6.3', alias: 'toc-8.3', name: 'Ackermann’s function is not primitive recursive' },
        { num: '6.4', alias: 'toc-8.4', name: 'Partial recursive (μ-recursive) functions' },
        { num: '6.5', alias: 'toc-8.11', name: 'Church–Turing thesis' },
        { num: '6.6', alias: 'toc-7.9', name: 'Universal machines and Kleene normal form' },
        { num: '6.7', alias: 'toc-9.7', name: 'Undecidability of the halting problem' },
        { num: '6.8', alias: 'toc-7.3', name: 'Recursively enumerable sets' },
        { num: '6.9', alias: 'toc-9.8', name: 'Recursive iff r.e. and co-r.e.' },
        { num: '6.10', alias: 'toc-10.5', name: 'Rice’s theorem' },
        { num: '6.11', alias: 'toc-10.16', name: 'The busy beaver function is not computable' },
        { num: '6.12', alias: 'toc-11.2', name: 'Kleene’s recursion theorem' },
        { num: '6.13', alias: 'toc-10.15', name: 'MRDP theorem: r.e. sets are Diophantine' },
      ],
    },
    // ───────────────────────────────────────────────────────────── 7
    {
      "n": 7,
      "title": "Arithmetic and Gödel’s incompleteness theorems",
      "summary": "Arithmetic can encode syntax and finite computations. Numeralwise representability yields a fixed-point construction, which separates truth from provability and leads to incompleteness and undecidability. The finite executors expose their exact computations and resource limits; none establishes nonprovability by waiting.",
      "items": [
        {
          "num": "7.1",
          "kind": "Definition",
          "name": "Peano arithmetic and Robinson’s Q",
          "deps": [
            "logic-3.13"
          ],
          "refs": [
            "Open Logic Project, Representability in Q, §Robinson’s Q, PDF pp1–3"
          ],
          "pic": "Edit the finite successor map and choose the actual operation tables; every Q instance on that carrier is checked with a counterexample. Switch to the infinite authored model to inspect its operations and induction obstruction."
        },
        {
          "num": "7.2",
          "kind": "Definition",
          "name": "Gödel numbering",
          "deps": [
            "logic-7.1",
            "logic-3.1",
            "nt-1.6"
          ],
          "refs": [
            "Open Logic Project, Incompleteness and Provability, §The Fixed-Point Lemma",
            "Robin Knight2026, §§5.1–5.3"
          ],
          "pic": "Encode an editable token word or decode a positive integer. Bars show the actual prime exponents; the live result separately reports exact decoding and formula well-formedness."
        },
        {
          "num": "7.3",
          "kind": "Definition",
          "name": "Representable relations and functions",
          "deps": [
            "logic-7.1",
            "logic-7.2"
          ],
          "see": [
            "toc-8.4"
          ],
          "refs": [
            "Open Logic Project, Representability in Q, Definitions req.1 and req.28; §§Basic Functions, Representing Relations"
          ],
          "pic": "Edit a term built from0,S,+,* and x. The selected numeral is substituted, and the actual Q4–Q7 normalization equalities can be stepped through. The plot evaluates only displayed numerals."
        },
        {
          "num": "7.4",
          "kind": "Theorem",
          "name": "Recursive relations are representable in Q",
          "deps": [
            "logic-7.3",
            "logic-7.2",
            "nt-2.4"
          ],
          "see": [
            "toc-8.4"
          ],
          "refs": [
            "Open Logic Project, Representability in Q, §§The Beta Function, Composition, Regular Minimization, Computable Functions, Representing Relations, PDF pp4–7,11–16"
          ],
          "pic": "Choose a genuine primitive recurrence and its finite length. The values are computed, a CRT solution b,c is constructed, and every beta remainder is decoded and checked exactly; step through the actual CRT merges."
        },
        {
          "num": "7.5",
          "kind": "Lemma",
          "name": "Diagonal (fixed-point) lemma",
          "deps": [
            "logic-7.2",
            "logic-7.4"
          ],
          "refs": [
            "Open Logic Project, Incompleteness and Provability, §§Self-Reference, The Fixed-Point Lemma, PDF pp1–4"
          ],
          "pic": "Inspect the actual code/substitute/code calculation for an editable property, or switch to general capture-avoiding substitution and deliberately introduce a conflicting bound-variable name."
        },
        {
          "num": "7.6",
          "kind": "Theorem",
          "name": "Tarski’s undefinability of truth",
          "deps": [
            "logic-7.5",
            "logic-4.4"
          ],
          "refs": [
            "Open Logic Project, Incompleteness and Provability, §The Undefinability of Truth, PDF pp14–15"
          ],
          "pic": "Toggle the diagonal equation and the proposed truth schema. The actual four Boolean assignments are filtered by the selected constraints; change the sign to see why the negative fixed point matters."
        },
        {
          "num": "7.7",
          "kind": "Theorem",
          "name": "Gödel’s first incompleteness theorem",
          "deps": [
            "logic-7.5",
            "logic-4.8"
          ],
          "refs": [
            "Open Logic Project, Incompleteness and Provability, §§The First Incompleteness Theorem, Omega-Consistency, PDF pp4–6"
          ],
          "pic": "Compare the obligations from hypothetical proofs of G and not G. Increase the finite checked prefix: a witness beyond that prefix remains possible in the second branch. The theory hypothesis is explicitly assumed, never inferred from the plot."
        },
        {
          "num": "7.8",
          "kind": "Theorem",
          "name": "Rosser’s theorem",
          "deps": [
            "logic-7.7",
            "logic-7.4"
          ],
          "refs": [
            "Open Logic Project, Incompleteness and Provability, §Rosser’s Theorem, PDF pp6–7 (strict-order variant)",
            "Robin Knight2026, Theorem6.4.3, PDF pp21–22 (≤ variant)"
          ],
          "pic": "Edit an explicitly abstract ledger of indexed proofs/refutations. The top panel locates its entries; the lower panel checks the finite Rosser implications through the chosen cut. A ledger containing both conclusions is visibly incompatible with consistency."
        },
        {
          "num": "7.9",
          "kind": "Theorem",
          "name": "Church’s theorem: validity is undecidable",
          "deps": [
            "logic-7.2",
            "logic-4.4",
            "logic-4.6"
          ],
          "see": [
            "logic-7.4",
            "toc-9.7"
          ],
          "refs": [
            "Open Logic Project, Turing Machines: Undecidability, §§Representing Turing Machines, Verifying the Representation, The Decision Problem, PDF pp10–18; left-frame exclusion derived here for the written cell"
          ],
          "pic": "Edit the actual machine rules and binary input, step through its real tape, and inspect the generated finite premise/goal clauses. A repeated complete configuration certifies a particular cycle; exhausting the execution budget stays inconclusive."
        },
        {
          "num": "7.10",
          "kind": "Theorem",
          "name": "Gödel’s second incompleteness theorem",
          "deps": [
            "logic-7.7",
            "logic-7.1"
          ],
          "refs": [
            "Open Logic Project, Incompleteness and Provability, §§Derivability Conditions, Second Incompleteness, PDF pp8–10",
            "Robin Knight2026, §§6.1,6.5–6.6"
          ],
          "pic": "Step through the actual nine-line modal/propositional skeleton of the internal Con→G argument. Remove a derivability license or the diagonal premise and the checker marks the resulting blocked dependencies."
        },
        {
          "num": "7.11",
          "kind": "Theorem",
          "name": "Löb’s theorem",
          "deps": [
            "logic-7.10",
            "logic-7.5"
          ],
          "refs": [
            "Open Logic Project, Incompleteness and Provability, §Löb’s Theorem, PDF pp11–13"
          ],
          "pic": "Edit a closed target sentence and inspect the actual checked dependency graph. Step to any inference or remove a license, including the hypothetical reflection theorem, and see the precise obstruction propagate."
        },
        {
          "num": "7.12",
          "kind": "Theorem",
          "name": "Presburger arithmetic is decidable",
          "deps": [
            "logic-5.7",
            "logic-7.2"
          ],
          "refs": [
            "Christoph Haase2018, A Survival Guide to Presburger Arithmetic, §3.2",
            "TUM Hoang2020, Automatic Theorem Proving of Presburger Arithmetic, §§3.1–3.5; conservative state bound derived here"
          ],
          "pic": "Edit a full additive formula, choose an exact natural assignment, and inspect actual DFA construction sizes, accepted sample values or the real LSBF state trace. Add zero padding or change state budget to test the encoding invariant and explicit resource stops."
        },
        {
          "num": "7.13",
          "kind": "Paper",
          "name": "Über formal unentscheidbare Sätze der Principia Mathematica",
          "paper": {
            "authors": "Kurt Gödel",
            "year": 1931,
            "title": "Über formal unentscheidbare Sätze der Principia Mathematica und verwandter Systeme I",
            "venue": "Monatshefte für Mathematik und Physik 38: 173–198",
            "doi": "10.1007/BF01700692"
          },
          "introduces": [
            "logic-7.2",
            "logic-7.7",
            "logic-7.10"
          ],
          "verify": true,
          "deps": [
            "logic-7.1",
            "logic-1.10",
            "logic-1.7",
            "logic-4.6"
          ],
          "see": [
            "logic-7.10"
          ],
          "refs": [
            "Original1931 publisher metadata/preview (body not accessible)",
            "Open Logic Project, Incompleteness and Provability, §§Comparison with Gödel’s Original Paper, Second Incompleteness"
          ],
          "pic": "Inspect the exact bytes and code of a selected row in an authored modern proof description. Change its license package: decoding still works even when the finite schematic checker rejects the purported derivation."
        }
      ]
    },
    // ───────────────────────────────────────────────────────────── 8
    {
      n: 8,
      title: 'Axiomatic set theory',
      summary: String.raw`Zermelo–Fraenkel set theory avoids the paradoxes by letting sets be formed only by specific operations: pairing, union, power set, and carving subsets out of sets already known. From these axioms and the axiom of infinity one builds the natural numbers, ordered pairs, functions and eventually all of ordinary mathematics. Foundation says every set is built in stages from the empty set.`,
      items: [
        { num: '8.1', kind: 'Postulate', name: 'Extensionality, pairing, union and power set', deps: ['logic-1.6'], refs: ['Kunen Ch. I'],
          pic: 'Sets drawn as nested boxes: apply pairing, union and power set to small sets and see the results, with extensionality merging boxes that have identical contents.' },
        { num: '8.2', kind: 'Postulate', name: 'Separation and replacement schemas', deps: ['logic-8.1', 'logic-3.4'], refs: ['Kunen Ch. I'],
          pic: 'Pick a set and a formula to carve out a subset (separation), or a definable operation to apply elementwise (replacement); the result is computed and shown to stay inside the universe of sets.' },
        { num: '8.3', kind: 'Theorem', name: 'There is no set of all sets', deps: ['logic-8.2', 'logic-1.6'], refs: ['Kunen Ch. I'],
          pic: 'Given any set A you build, separation forms {x ∈ A : x ∉ x}, and the checker proves this new set is not a member of A — so A could never have contained everything.' },
        { num: '8.4', kind: 'Definition', name: 'Ordered pairs, relations and functions as sets', deps: ['logic-8.1'], refs: ['Kunen Ch. I'],
          pic: 'The Kuratowski pair {{a},{a,b}} is drawn as nested boxes; swap a and b and the boxes change unless a = b, and a function appears as a set of pairs with one pair per input.' },
        { num: '8.5', kind: 'Postulate', name: 'Infinity and the von Neumann natural numbers', deps: ['logic-8.1'], refs: ['Kunen Ch. I'],
          pic: 'Build 0 = ∅, 1 = {0}, 2 = {0, 1}, … as nested boxes; each number is literally the set of smaller numbers, and the successor operation adds one more box.' },
        { num: '8.6', kind: 'Definition', name: 'Transitive sets', deps: ['logic-8.1'], refs: ['Kunen Ch. I'],
          pic: 'Draw a membership diagram; the checker tests whether every member’s members are already members, and offers the transitive closure that would make it so.' },
        { num: '8.7', kind: 'Postulate', name: 'Axiom of foundation', deps: ['logic-8.1'], refs: ['Kunen Ch. III'],
          pic: 'Draw membership arrows among a few sets; for each nonempty collection the checker finds an ∈-minimal element, and an attempt to draw x ∈ x or an infinite descending chain is rejected.' },
        { num: '8.8', kind: 'Definition', name: 'Classes versus sets', deps: ['logic-8.3'], refs: ['Kunen Ch. I'],
          pic: 'Formulas define collections; the tool sorts examples (all sets, all ordinals, all singletons, the subsets of ω) into sets and proper classes, with the Russell-style argument shown for each proper class.' },
        { num: '8.9', kind: 'Proposition', name: 'Building ℕ, ℤ, ℚ and ℝ inside set theory', deps: ['logic-8.5', 'logic-8.4', 'pma-1.19'], refs: ['Kunen Ch. I'],
          pic: 'Follow one number through the tower: integers as classes of pairs of naturals, rationals as classes of pairs of integers, reals as Dedekind cuts; a cut for √2 is drawn on the rational line.' },
        { num: '8.10', kind: 'Definition', name: 'Hereditarily finite sets and Ackermann coding', deps: ['logic-8.5', 'logic-8.7'], refs: ['Kunen Ch. III'],
          pic: 'Each natural number codes a hereditarily finite set through its binary digits; toggle bits and the nested-box picture updates, so membership becomes “the k-th bit is 1”.' },
        { num: '8.11', kind: 'Paper', name: 'Untersuchungen über die Grundlagen der Mengenlehre I',
          paper: { authors: 'E. Zermelo', year: 1908, title: 'Untersuchungen über die Grundlagen der Mengenlehre. I', venue: 'Mathematische Annalen 65 (2): 261–281', doi: '10.1007/BF01449999' },
          introduces: ['logic-8.1', 'logic-8.2', 'logic-8.3'], deps: ['logic-1.6', 'logic-11.2'], refs: [],
          pic: 'Zermelo’s seven axioms as switches: the reader builds sets from ∅ by pairing, union, power set and separation, and the universe grows level by level; switch Separation back to unrestricted comprehension and Russell’s {x : x ∉ x} is formed and the contradiction lights up, while with the axioms on Zermelo’s argument shows every set has a subset that is not a member — so there is no set of all sets.' },
      ],
    },
    // ───────────────────────────────────────────────────────────── 9
    {
      n: 9,
      title: 'Ordinals and transfinite recursion',
      summary: String.raw`Ordinals are the shapes of well-orderings, and von Neumann made each ordinal the set of all smaller ones. They let induction and recursion run beyond the natural numbers through limit stages. Ordinal arithmetic is strange but computable (1 + ω = ω < ω + 1), Cantor normal form writes every ordinal below ε₀ as a finite expression, and that is enough to prove theorems — such as Goodstein’s — that Peano arithmetic cannot.`,
      items: [
        { num: '9.1', kind: 'Definition', name: 'Well-orderings', deps: ['logic-8.4'], refs: ['Kunen Ch. I'],
          pic: 'Arrange points on a line with your own order; the checker searches for a subset without a least element and shows one for the integers or the rationals, and none for ω + ω.' },
        { num: '9.2', kind: 'Theorem', name: 'Transfinite induction', deps: ['logic-9.1'], refs: ['Kunen Ch. I'],
          pic: 'A property is propagated along a well-order drawn as tick marks: successor steps and limit steps are coloured separately, and removing the limit clause leaves the first limit point unproved.' },
        { num: '9.3', kind: 'Definition', name: 'Von Neumann ordinals', deps: ['logic-9.1', 'logic-8.6'], refs: ['Kunen Ch. I'],
          pic: 'Ordinals drawn as matchstick pictures — ω, ω + 1, ω·2, ω², ω^ω — with ticks shrinking toward each limit; click any tick and its initial segment, which is the ordinal it names, lights up.' },
        { num: '9.4', kind: 'Theorem', name: 'Every well-ordering is isomorphic to a unique ordinal', deps: ['logic-9.3', 'logic-8.2'], refs: ['Kunen Ch. I'],
          pic: 'Enter a well-ordering such as “evens first, then odds” on ℕ; its elements are matched one by one with ordinals by recursion and the matching ends at ω·2.' },
        { num: '9.5', kind: 'Paradox', name: 'Burali-Forti paradox', deps: ['logic-9.4', 'logic-8.3'], refs: ['Kunen Ch. I'],
          pic: 'Suppose the ordinals formed a set Ω: Ω would itself be an ordinal, hence a member of itself and smaller than itself — the matchstick picture of Ω gets a new tick appended past its own end.' },
        { num: '9.6', kind: 'Theorem', name: 'Transfinite recursion', deps: ['logic-9.2', 'logic-8.2'], refs: ['Kunen Ch. I'],
          pic: 'Define a sequence by recursion along an ordinal (iterated derived sets, say): successor rules and limit rules are applied in turn and the values are displayed along the ordinal’s ticks.' },
        { num: '9.7', kind: 'Definition', name: 'Ordinal arithmetic', deps: ['logic-9.6'], refs: ['Kunen Ch. I'],
          pic: 'Concatenate and multiply tick strips: 1 + ω is visibly the same shape as ω, while ω + 1 has a last point; ω·2 and 2·ω are drawn side by side and compared.' },
        { num: '9.8', kind: 'Theorem', name: 'Cantor normal form', deps: ['logic-9.7'], refs: ['Kunen Ch. I'],
          pic: 'Type an ordinal expression; it is rewritten to the unique form ω^β₁·c₁ + ⋯ + ω^βₖ·cₖ with decreasing exponents, and comparisons between two ordinals are decided term by term.' },
        { num: '9.9', kind: 'Theorem', name: 'Hartogs’ theorem', deps: ['logic-9.4'], refs: ['Kunen Ch. I'],
          pic: 'For a set X, the well-orderings of subsets of X are collected and their order types stacked; the first ordinal not in the stack cannot inject into X, constructed without any appeal to choice.' },
        { num: '9.10', kind: 'Definition', name: 'The first uncountable ordinal ω₁', deps: ['logic-9.9'], refs: ['Kunen Ch. I'],
          pic: 'Pick any sequence of countable ordinals, given by their normal forms; their supremum is computed and is still countable, so no sequence ever climbs to ω₁.' },
        { num: '9.11', kind: 'Definition', name: 'The ordinal ε₀', deps: ['logic-9.8'], refs: ['Kunen Ch. I'],
          pic: 'Towers ω, ω^ω, ω^ω^ω, … are drawn with their limit ε₀ = ω^ε₀; any ordinal below it is shown as a finite tree of Cantor normal forms.' },
        { num: '9.12', kind: 'Theorem', name: 'Goodstein’s theorem', deps: ['logic-9.11', 'logic-7.10'], refs: ['Kunen Ch. I'],
          pic: 'Compute a Goodstein sequence from a starting number: hereditary base-bumping makes the terms explode, while the ordinal obtained by replacing the base with ω strictly decreases on every step, so the sequence must reach 0.' },
        { num: '9.13', kind: 'Definition', name: 'The cumulative hierarchy and rank', deps: ['logic-9.6', 'logic-8.7'], refs: ['Kunen Ch. III'],
          pic: 'Levels V₀ = ∅, V₁, V₂, V₃, V₄ are generated by repeated power sets with their sizes 0, 1, 2, 4, 16, 65536; click any small set to see the level where it first appears.' },
        { num: '9.14', kind: 'Theorem', name: 'Well-founded relations; ∈-induction and ∈-recursion', deps: ['logic-9.6', 'logic-8.7'], refs: ['Kunen Ch. III'],
          pic: 'Draw any finite relation; the checker finds a minimal element in every nonempty subset or exhibits a cycle, and a function defined by recursion along the relation (such as rank) is computed bottom-up.' },
        { num: '9.15', kind: 'Theorem', name: 'Mostowski collapsing theorem', deps: ['logic-9.14', 'logic-8.6'], refs: ['Kunen Ch. III'],
          pic: 'An extensional well-founded relation on arbitrary points is collapsed by recursion, each point becoming the set of the images of its predecessors; the result is a transitive set drawn as nested boxes, isomorphic to the original diagram.' },
      ],
    },
    // ───────────────────────────────────────────────────────────── 10
    {
      n: 10,
      title: 'Cardinals',
      summary: String.raw`With choice, every set has a cardinality measured by an initial ordinal, and the alephs list the infinite sizes in order. Addition and multiplication of infinite cardinals collapse to taking a maximum, but exponentiation is wild: whether 2^ℵ₀ equals ℵ₁ is the continuum hypothesis. Cofinality, König’s theorem and inaccessible cardinals mark out what ZFC can and cannot decide about the sizes of infinity.`,
      items: [
        { num: '10.1', kind: 'Definition', name: 'Cardinals as initial ordinals; the alephs', deps: ['logic-9.10', 'logic-1.3'], refs: ['Kunen Ch. I'],
          pic: 'Along the ordinal line, mark the ordinals not in bijection with any smaller one: ω, ω₁, ω₂, …; the gaps between them are filled with ordinals of the same size, and a slider walks through ω, ω + 1, ω·2, ω² showing they are all countable.' },
        { num: '10.2', kind: 'Theorem', name: 'κ·κ = κ for infinite cardinals', deps: ['logic-10.1'], refs: ['Kunen Ch. I'],
          pic: 'Enumerate ω × ω along square shells by the canonical order (maximum first, then lexicographic); each pair receives a natural number, and the same well-ordering is the engine of the general proof.' },
        { num: '10.3', kind: 'Corollary', name: 'Cardinal sums and products are maxima', deps: ['logic-10.2'], refs: ['Kunen Ch. I'],
          pic: 'Pairs of cardinals from a menu (finite numbers, ℵ₀, 𝔠, ℵ₁) are added and multiplied in a table; outside the finite corner every entry is just the larger of the two.' },
        { num: '10.4', kind: 'Definition', name: 'Cardinal exponentiation', deps: ['logic-10.1', 'logic-1.2'], refs: ['Kunen Ch. I'],
          pic: 'Functions from a set of size λ to a set of size κ are counted for small finite values and laid out as a grid; Cantor’s diagonal shows 2^κ > κ in every column.' },
        { num: '10.5', kind: 'Hypothesis', name: 'The continuum hypothesis', deps: ['logic-10.4', 'logic-1.4'], refs: ['Kunen Ch. I'],
          pic: 'Candidate subsets of the reals (countable sets, intervals, the Cantor set, Borel sets) are sorted by size; every set you can describe concretely lands in “countable” or “continuum”, with nothing found in between.' },
        { num: '10.6', kind: 'Definition', name: 'Cofinality; regular and singular cardinals', deps: ['logic-10.1'], refs: ['Kunen Ch. I'],
          pic: 'Climb to ℵ_ω with the sequence ℵ₀, ℵ₁, ℵ₂, …: only countably many steps are needed, so ℵ_ω is singular, while no countable sequence reaches ℵ₁.' },
        { num: '10.7', kind: 'Theorem', name: 'König’s theorem', deps: ['logic-10.6', 'logic-10.4'], refs: ['Kunen Ch. I'],
          pic: 'A diagonal argument on a table indexed by a cofinal sequence shows that 2^κ cannot be a union of fewer than cf(2^κ) smaller pieces, ruling out 2^ℵ₀ = ℵ_ω.' },
        { num: '10.8', kind: 'Definition', name: 'Inaccessible cardinals', deps: ['logic-10.6'], refs: ['Kunen Ch. I'],
          pic: 'Closure under power sets and under unions of fewer pieces is tested for ω, ℵ₁ and ℵ_ω; each fails one test, and an inaccessible κ would pass both.' },
        { num: '10.9', kind: 'Theorem', name: 'ZFC cannot prove an inaccessible exists', deps: ['logic-10.8', 'logic-9.13', 'logic-7.10'], refs: ['Kunen Ch. IV'],
          pic: 'If κ is inaccessible then V_κ is a model of ZFC; the axioms are checked one by one on the cumulative hierarchy cut off at κ, and the second incompleteness theorem closes the loop.' },
        { num: '10.10', kind: 'Theorem', name: 'Cantor–Bendixson theorem', deps: ['logic-9.6', 'pma-2.43'], refs: ['Kunen Ch. I'],
          pic: 'Strip the isolated points of a closed set again and again (derived sets indexed by ordinals) until a perfect kernel remains; the removed part is countable and the kernel is empty or of size continuum.' },
        { num: '10.11', kind: 'Paper', name: 'Mathematische Probleme',
          paper: { authors: 'D. Hilbert', year: 1900, title: 'Mathematische Probleme', venue: 'Nachrichten von der Gesellschaft der Wissenschaften zu Göttingen, Mathematisch-Physikalische Klasse 1900: 253–297 (English translation: Bulletin of the AMS 8 (1902): 437–479)', url: 'https://eudml.org/doc/58479' },
          introduces: ['ode-7.14'], deps: ['logic-10.5', 'nt-12.12'], refs: [],
          pic: 'The twenty-three problems as a board of tiles coloured by their status today (resolved, partly resolved, open, too vague to settle), each linked to the atlas item that settled or still states it — the continuum hypothesis (1st), consistency of arithmetic (2nd), the Riemann hypothesis (8th), Diophantine decidability (10th), limit cycles (16th); a time slider replays 1900 to today as tiles flip.' },
      ],
    },
    // ───────────────────────────────────────────────────────────── 11
    {
      n: 11,
      title: 'Choice, constructibility and independence',
      summary: String.raw`The axiom of choice is equivalent to Zorn’s lemma and to the well-ordering theorem, and it powers much of analysis and algebra. It also produces non-measurable sets and the Banach–Tarski decomposition of a ball. Gödel’s constructible universe shows that choice and the continuum hypothesis cannot be refuted from ZF, and Cohen’s forcing shows that they cannot be proved either.`,
      items: [
        { num: '11.1', kind: 'Postulate', name: 'Axiom of choice', deps: ['logic-8.2'], refs: ['Kunen Ch. I'],
          pic: 'A family of nonempty sets drawn as bins; for finitely many bins a choice is made by clicking, for infinitely many socks (no rule distinguishes the two in a pair) the axiom is needed to pick one per bin.' },
        { num: '11.2', kind: 'Theorem', name: 'Well-ordering theorem (Zermelo)', deps: ['logic-11.1', 'logic-9.6', 'logic-9.9'], refs: ['Kunen Ch. I'],
          pic: 'Using a choice function, elements are picked one at a time by transfinite recursion — the least so far is the first chosen — and laid on an ordinal ruler until the set is exhausted.' },
        { num: '11.3', kind: 'Theorem', name: 'Zorn’s lemma', deps: ['logic-11.2'], refs: ['Kunen Ch. I'], see: ['rca-4.21'],
          pic: 'In a partial order drawn as a Hasse diagram, chains are extended upward by recursion; when every chain has an upper bound a maximal element is reached, and a poset with an unbounded chain shows the recursion running off the top.' },
        { num: '11.4', kind: 'Theorem', name: 'Choice, Zorn, well-ordering and comparability are equivalent', deps: ['logic-11.3', 'logic-10.1'], refs: ['Kunen Ch. I'],
          pic: 'A cycle of implications is drawn — AC ⇒ well-ordering ⇒ Zorn ⇒ AC, with Hartogs connecting comparability of cardinals — and clicking an arrow shows the key construction behind it.' },
        { num: '11.5', kind: 'Theorem', name: 'Every vector space has a basis', deps: ['logic-11.3'], refs: ['Kunen Ch. I'],
          pic: 'Grow a ℚ-linearly independent set of reals (1, √2, √3, π, …) by adding numbers not yet in the span, with independence tested numerically; Zorn’s lemma completes the Hamel basis no one can write down.' },
        { num: '11.6', kind: 'Paradox', name: 'Vitali’s non-measurable set', deps: ['logic-11.1', 'rca-2.22'], refs: ['Kunen Ch. I'],
          pic: 'Choose one representative from each class of reals modulo ℚ in [0,1]; rational translates of the set tile a region between [0,1] and [−1,2], and the measure readout shows every value for its measure gives 0 or ∞ for the union.' },
        { num: '11.7', kind: 'Paradox', name: 'Banach–Tarski paradox', deps: ['logic-11.1', 'logic-11.6'], refs: ['Kunen Ch. I'],
          pic: 'The free group on two rotations is drawn as its Cayley tree; words starting with each letter form four pieces, and two pieces reassemble into the whole tree after a single rotation — the combinatorial heart of doubling a ball.' },
        { num: '11.8', kind: 'Definition', name: 'Gödel’s constructible universe L', deps: ['logic-9.13', 'logic-3.6'], refs: ['Kunen Ch. VI'],
          pic: 'Levels L₀, L₁, L₂, … add only subsets definable over the previous level; on the finite levels the definable subsets are computed and compared with the full power sets of the cumulative hierarchy.' },
        { num: '11.9', kind: 'Theorem', name: 'Gödel: AC and GCH are consistent with ZF', deps: ['logic-11.8', 'logic-10.5'], refs: ['Kunen Ch. VI'],
          pic: 'Inside L every set appears at a definite stage and in a definite order of definitions, which yields a definable well-ordering; a diagram traces how this ordering witnesses choice and bounds the number of constructible reals by ℵ₁.' },
        { num: '11.10', kind: 'Method', name: 'Forcing', deps: ['logic-5.1', 'logic-9.13'], refs: ['Kunen Ch. VII'],
          pic: 'Finite partial functions from ω to {0,1} are extended step by step to meet a list of dense sets; the generic real built in the limit differs from every real on a given countable list.' },
        { num: '11.11', kind: 'Theorem', name: 'Cohen: the continuum hypothesis is independent', deps: ['logic-11.10', 'logic-11.9'], refs: ['Kunen Ch. VII'],
          pic: 'Add ℵ₂ generic reals at once with finite conditions; the countable chain condition (illustrated by a Δ-system picture) guarantees cardinals are preserved, so the extension has 2^ℵ₀ ≥ ℵ₂.' },
        { num: '11.12', kind: 'Paper', name: 'The Independence of the Continuum Hypothesis',
          paper: { authors: 'Paul J. Cohen', year: 1963, title: 'The Independence of the Continuum Hypothesis', venue: 'Proceedings of the National Academy of Sciences 50 (6): 1143–1148', doi: '10.1073/pnas.50.6.1143' },
          introduces: ['logic-11.10', 'logic-11.11'], deps: ['logic-11.9', 'logic-5.1', 'logic-9.13'], refs: [],
          pic: 'Forcing by hand: conditions are finite partial functions from ℵ₂ × ω to {0, 1}, drawn as a sparse grid of bits; the reader extends conditions, meets dense sets one by one, and watches the generic object fill in ℵ₂ columns, each a new real that differs from every real of the ground model — the picture behind ¬CH in Cohen’s extension.' },
      ],
    },
  ],
};
