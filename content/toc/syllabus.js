// Syllabus — Theory of Computation (curated course; see collection.js for references)
//
// Sources consulted (Oct 2026):
//   Sipser, Introduction to the Theory of Computation — contents (2nd ed. front matter; the 3rd ed.
//     inserts §2.4 Deterministic CFLs and keeps the other section numbers):
//     https://www.cs.virginia.edu/~robins/Sipser_2006_Second_Edition_Problems.pdf
//   MIT 18.404J (Sipser), Fall 2020 — syllabus and lecture calendar:
//     https://ocw.mit.edu/courses/18-404j-theory-of-computation-fall-2020/pages/calendar/
//   Cambridge Part IB Computation Theory (register machines, recursive functions, λ-calculus):
//     https://www.cl.cam.ac.uk/teaching/2324/CompTheory/
//   Oxford Models of Computation synopsis:
//     https://www.cs.ox.ac.uk/teaching/courses/2024-2025/modelsofcomputation/
//   Wikipedia, List of computability and complexity topics:
//     https://en.wikipedia.org/wiki/List_of_computability_and_complexity_topics
// Scope split: Sipser ch. 9–10 (hierarchy theorems, relativization, circuits, BPP, alternation,
// interactive proofs, NC, cryptography) live in `cplx` and `crypto`, which cite this collection.
// Primitive/μ-recursive functions, cellular automata, tag systems and Fractran are not in Sipser;
// they are referred to Sipser §3.2 (“Equivalence with other models”). Deliberately omitted:
// star height, Petri nets, Knuth–Bendix completion, L-systems (low centrality for a first course).
// Overlaps with parallel collections: the pigeonhole principle is `comb-1.2`, string-matching
// automata/KMP are `algo` ch. 13, Presburger arithmetic, Gödel’s incompleteness and Church’s
// theorem are `logic` ch. 7 (those items were removed here; their numbers are left as gaps).
// `logic` ch. 6 cross-links (see:) to the computability items kept here.
// Landmark papers (kind 'Paper', Oct 2026): each citation was checked against its Crossref record (api.crossref.org/works/<doi>)
// or, without a DOI, against the cited record (NASA NTRS, Google Patents, Euler Archive, Smithsonian Libraries).
export default {
  collection: 'toc',
  chapters: [
    // ───────────────────────────────────────────────────────────── 1
    {
      n: 1,
      title: 'Strings, languages and counting',
      summary: String.raw`The theory studies computation through languages: sets of finite strings over a finite alphabet, with every decision problem encoded as one. A single counting argument already sets the scene — there are only countably many strings, hence countably many programs, but uncountably many languages, so most problems cannot be solved by any machine at all. The chapter also fixes the working tools used everywhere later: shortlex enumeration, induction on strings, the pigeonhole principle and Boolean formulas.`,
      items: [
        { num: '1.1', kind: 'Definition', name: 'Alphabets, strings and languages', deps: ['comb-1.1'], refs: ['Sipser §0.2'],
          pic: 'Type a string over a chosen alphabet to see its length, reversal, prefixes and suffixes; a language is drawn as a highlighted subset of the list of all strings.' },
        { num: '1.2', kind: 'Definition', name: 'Regular operations on languages', deps: ['toc-1.1', 'comb-1.1'], refs: ['Sipser §1.1'],
          pic: 'Edit two small finite languages A and B; their union, concatenation AB and the first layers of A* are generated live, each string coloured by the pieces it was glued from.' },
        { num: '1.3', kind: 'Definition', name: 'Shortlex order on Σ*', deps: ['toc-1.1'], refs: ['Sipser §0.2'],
          pic: 'A counter walks through Σ* in shortlex order for an alphabet of adjustable size; type any string and the readout gives its exact position in the list.' },
        { num: '1.4', kind: 'Theorem', name: 'Σ* is countable', deps: ['toc-1.3', 'pma-2.13', 'pma-2.12'], refs: ['Sipser §4.2'],
          pic: 'Strings are stacked length by length in a widening triangle and a single path visits them all; pick a string and the step at which the path reaches it is shown.' },
        { num: '1.5', kind: 'Theorem', name: 'There are uncountably many languages', deps: ['toc-1.4', 'pma-2.14', 'logic-1.2'], refs: ['Sipser §4.2'],
          pic: 'Rows list languages as 0/1 characteristic sequences against the shortlex strings; the reader proposes rows, and the flipped diagonal builds a language that differs from each row at a highlighted cell.' },
        { num: '1.6', kind: 'Concept', name: 'Encodings: problems as languages', deps: ['toc-1.1'], refs: ['Sipser §3.3'],
          pic: 'Draw a small graph and watch it serialized into a string ⟨G⟩ in two encodings (adjacency list and matrix); the two lengths are plotted against graph size and differ only polynomially.' },
        { num: '1.7', kind: 'Method', name: 'Induction on strings', deps: ['toc-1.1', 'alg-2.1'], refs: ['Sipser §0.4'],
          pic: 'A claim about all strings, such as (xy)ᴿ = yᴿxᴿ, is checked on a growing tree of strings; the inductive step is shown as a template that reuses the verified shorter case.' },
        { num: '1.9', kind: 'Definition', name: 'Boolean formulas and satisfiability', deps: ['logic-2.3', 'logic-2.5'], refs: ['Sipser §0.2', 'Sipser §7.4'],
          pic: 'Type a propositional formula; its parse tree and truth table are built, satisfying rows are highlighted, and conversion to conjunctive normal form is shown clause by clause.' },
        { num: '1.10', kind: 'Concept', name: 'Decision problems versus search problems', deps: ['toc-1.6'], refs: ['Sipser §7.4'],
          pic: 'With only a yes/no oracle for “does N have a factor at most k?”, the reader runs binary search on k and recovers an actual factor, counting the oracle calls against the bit length of N.' },
      ],
    },
    // ───────────────────────────────────────────────────────────── 2
    {
      n: 2,
      title: 'Finite automata',
      summary: String.raw`A finite automaton reads its input once, left to right, remembering only which of finitely many states it is in. The languages such machines accept, the regular languages, are closed under complement, union and intersection, and every natural question about a given automaton — is its language empty, infinite, equal to another — is answered by searching its state graph. The model is everywhere in practice, from text search to protocol controllers.`,
      items: [
        { num: '2.1', kind: 'Definition', name: 'Deterministic finite automaton', deps: ['toc-1.1'], refs: ['Sipser §1.1'],
          pic: 'Build a DFA by dragging states and labelling arrows, type an input and watch a token hop from state to state, ending green in an accept state or red otherwise.' },
        { num: '2.2', kind: 'Definition', name: 'Extended transition function and acceptance', deps: ['toc-2.1', 'toc-1.7'], refs: ['Sipser §1.1'],
          pic: 'The run on the typed string is unrolled into a time-by-state grid; the state reached after each prefix is read off its column and the final column decides acceptance.' },
        { num: '2.3', kind: 'Definition', name: 'Regular language', deps: ['toc-2.2'], refs: ['Sipser §1.1'],
          pic: 'Pick or build a DFA and see the first few hundred strings of Σ* sorted into accepted and rejected columns, with the number accepted at each length plotted.' },
        { num: '2.4', kind: 'Method', name: 'States as finite memory: remainders mod k', deps: ['toc-2.1', 'alg-2.9'], refs: ['Sipser §1.1'],
          pic: 'Design a DFA for binary numbers divisible by k: states are remainders, and typing a number shows the state tracking its value mod k bit by bit; change k and the machine is rebuilt.' },
        { num: '2.5', kind: 'Theorem', name: 'Closure under complement', deps: ['toc-2.3'], refs: ['Sipser §1.1'],
          pic: 'Swap accepting and rejecting states with one click and every verdict in the test panel flips; on an incomplete automaton the swap fails until the missing dead state is added.' },
        { num: '2.6', kind: 'Theorem', name: 'Product construction: union and intersection', deps: ['toc-2.3', 'alg-1.4a'], refs: ['Sipser §1.1'],
          pic: 'Two DFAs are combined into the grid of state pairs; a typed string moves both component tokens and the product token in lockstep, and a toggle switches the accepting pairs between union and intersection.' },
        { num: '2.7', kind: 'Algorithm', name: 'Emptiness and finiteness tests for DFAs', deps: ['toc-2.3', 'algo-8.4'], refs: ['Sipser §4.1'],
          pic: 'Breadth-first search floods the state graph from the start state; the language is empty if no accept state is reached and infinite if a reachable cycle can still lead to acceptance, both highlighted.' },
        { num: '2.8', kind: 'Theorem', name: 'Equivalence of DFAs is decidable', deps: ['toc-2.6', 'toc-2.5', 'toc-2.7'], refs: ['Sipser §4.1'],
          pic: 'Two DFAs are joined into their symmetric-difference product; the search either certifies equivalence or returns the shortest string on which they disagree, which the reader can run on both.' },
        { num: '2.9', kind: 'Model', name: 'Mealy and Moore machines', deps: ['toc-2.1'], refs: ['Sipser §1.1'],
          pic: 'A serial binary adder as a Mealy machine: type two numbers and watch the carry state and the emitted sum bits; the Moore version of the same adder emits each bit one step later.' },
        { num: '2.11', kind: 'Concept', name: 'Synchronizing (reset) words', deps: ['toc-2.2', 'alg-1.15'], refs: ['Sipser §1.1'],
          pic: 'Place a token on every state and apply letters by clicking; tokens merge as they collide, and a search over subsets finds the shortest word that sends every state to one.' },
        { num: '2.12', kind: 'Hypothesis', name: 'Černý conjecture', deps: ['toc-2.11'], refs: ['Sipser §1.1'],
          pic: 'For random automata and the extremal Černý family, the shortest reset length is plotted against the number of states n; every point lies under the curve (n−1)², the Černý family exactly on it.' },
      ],
    },
    // ───────────────────────────────────────────────────────────── 3
    {
      n: 3,
      title: 'Nondeterminism and regular expressions',
      summary: String.raw`A nondeterministic automaton may branch, guess and take empty moves, accepting when any branch succeeds. The subset construction shows that this adds convenience but no power, at a possible exponential cost in states. Regular expressions describe exactly the same languages (Kleene’s theorem), and the conversions between expressions, NFAs and DFAs are the engine of every regex library — along with its notorious performance traps.`,
      items: [
        { num: '3.1', kind: 'Definition', name: 'Nondeterministic finite automaton', deps: ['toc-2.1'], refs: ['Sipser §1.2'],
          pic: 'Run an NFA on typed input and watch the active states as a cloud of tokens that split on choices and vanish on missing arrows; the input is accepted if any token ends in an accept state.' },
        { num: '3.2', kind: 'Definition', name: 'ε-transitions and ε-closure', deps: ['toc-3.1'], refs: ['Sipser §1.2'],
          pic: 'Click a state to highlight its ε-closure, then step through the input with closures recomputed after each symbol.' },
        { num: '3.3', kind: 'Theorem', name: 'Subset construction: NFAs equal DFAs', deps: ['toc-3.2', 'toc-2.3', 'comb-1.1'], refs: ['Sipser §1.2'],
          pic: 'The reader’s NFA is determinized on the fly — only reachable subsets are created, each DFA state labelled by its set — and both machines run on the same input and agree.' },
        { num: '3.4', kind: 'Theorem', name: 'Exponential blow-up of determinization', deps: ['toc-3.3', 'comb-1.2'], refs: ['Sipser §1.2'],
          pic: 'For “the k-th symbol from the end is 1”, the (k+1)-state NFA is set against the minimal DFA, whose 2ᵏ states are plotted as k grows and drawn for small k.' },
        { num: '3.5', kind: 'Theorem', name: 'Closure under union, concatenation and star', deps: ['toc-3.2', 'toc-1.2'], refs: ['Sipser §1.2'],
          pic: 'Glue NFAs together with ε-arrows: choose union, concatenation or star and see the new start state and edges appear, then test strings assembled from pieces.' },
        { num: '3.6', kind: 'Definition', name: 'Regular expressions', deps: ['toc-1.2', 'alg-2.5'], refs: ['Sipser §1.3'],
          pic: 'Type a regular expression; its syntax tree is drawn and every matching string up to a chosen length is enumerated.' },
        { num: '3.7', kind: 'Algorithm', name: 'Thompson’s construction: regex to NFA', deps: ['toc-3.5', 'toc-3.6', 'alg-2.5'], refs: ['Sipser §1.3'],
          pic: 'The syntax tree is walked bottom-up and each operator snaps its fragment NFAs together; the readout confirms the machine has at most twice as many states as the expression has symbols.' },
        { num: '3.8', kind: 'Algorithm', name: 'State elimination: NFA to regex', deps: ['toc-3.1', 'toc-3.6', 'alg-2.1'], refs: ['Sipser §1.3'],
          pic: 'States of a generalized NFA are ripped out one at a time while edge labels grow into expressions; reordering the eliminations gives different but equivalent final expressions.' },
        { num: '3.9', kind: 'Theorem', name: 'Kleene’s theorem', deps: ['toc-3.7', 'toc-3.8', 'toc-3.3'], refs: ['Sipser §1.3'],
          pic: 'A triangle of converters regex → NFA → DFA → regex: enter any one of the three and the tool checks that the other two accept exactly the same strings up to a chosen length.' },
        { num: '3.10', kind: 'Theorem', name: 'Arden’s lemma', deps: ['toc-3.6', 'alg-2.1'], refs: ['Sipser §1.3'],
          pic: 'Solve X = AX ∪ B by iteration: the approximations ∅, B, AB ∪ B, … grow toward A*B layer by layer; put ε into A and a second, larger solution appears.' },
        { num: '3.11', kind: 'Method', name: 'Brzozowski derivatives of regular expressions', deps: ['toc-3.6'], refs: ['Sipser §1.3'],
          pic: 'Type an expression and a string: each symbol replaces the expression by its derivative, simplified live, and the string matches exactly when the final expression accepts the empty string.' },
        { num: '3.12', kind: 'Algorithm', name: 'Backtracking versus NFA simulation in regex matching', deps: ['toc-3.7'], refs: ['Sipser §1.3'],
          pic: 'Match (a|aa)*b against aaa…a: a backtracking matcher’s step count explodes exponentially while state-set simulation grows linearly, both plotted against input length.' },
        { num: '3.13', kind: 'Theorem', name: 'Closure under reversal and homomorphism', deps: ['toc-3.9'], refs: ['Sipser §1.3'],
          pic: 'Reverse every arrow of an NFA and swap start and accept states, or apply a letter-substitution map; test strings are checked on both sides of each construction.' },
        { num: '3.14', kind: 'Concept', name: 'Lexical analysis with automata', deps: ['toc-3.9', 'toc-3.12'], refs: ['Sipser §1.3'],
          pic: 'Token patterns for a toy language compile into one combined DFA that scans typed source code and colours its tokens, with the longest-match rule visible at each boundary.' },
        { num: '3.15', kind: 'Paper', name: 'Representation of Events in Nerve Nets and Finite Automata',
          paper: { authors: 'S. C. Kleene', year: 1956, title: 'Representation of Events in Nerve Nets and Finite Automata',
                   venue: 'in C. E. Shannon and J. McCarthy (eds.), Automata Studies, Annals of Mathematics Studies 34, Princeton University Press: 3–42', doi: '10.1515/9781400882618-002' },
          introduces: ['toc-1.2', 'toc-3.6', 'toc-3.9'], deps: ['toc-2.1'], refs: [],
          pic: 'Wire a small net of threshold neurons, feed it input sequences, and read off the event it recognizes as a regular expression built from union, concatenation and Kleene’s star; any expression typed in is turned back into an automaton.' },
        { num: '3.16', kind: 'Paper', name: 'Finite Automata and Their Decision Problems',
          paper: { authors: 'M. O. Rabin and D. Scott', year: 1959, title: 'Finite Automata and Their Decision Problems',
                   venue: 'IBM Journal of Research and Development 3 (2): 114–125', doi: '10.1147/rd.32.0114' },
          introduces: ['toc-3.1', 'toc-3.3', 'toc-2.7', 'toc-4.11'], deps: ['toc-2.1', 'toc-3.9'], refs: [],
          pic: 'Build a nondeterministic automaton, type a word and watch the set of live states advance; then grow Rabin and Scott’s subset construction state by state and compare state counts on the “n-th symbol from the end is 1” family.' },
      ],
    },
    // ───────────────────────────────────────────────────────────── 4
    {
      n: 4,
      title: 'Limits and structure of regular languages',
      summary: String.raw`A DFA with p states reading a long string must revisit a state, so a middle piece can be repeated — the pumping lemma, which proves many languages nonregular through an adversarial game. The Myhill–Nerode theorem goes further and characterizes regularity exactly: finitely many classes of prefixes that no suffix can tell apart. Those classes are the states of the unique minimal DFA, which partition refinement computes. Two-way heads and infinite inputs show how robust the class is.`,
      items: [
        { num: '4.1', kind: 'Theorem', name: 'Pumping lemma for regular languages', deps: ['toc-2.3', 'comb-1.2'], refs: ['Sipser §1.4'],
          pic: 'Feed a long accepted string to a p-state DFA: the first repeated state is marked, the split xyz drawn, and pumping y up or down keeps the token landing in an accept state.' },
        { num: '4.2', kind: 'Method', name: 'The pumping game', deps: ['toc-4.1'], refs: ['Sipser §1.4'],
          pic: 'Play against the computer for a language such as 0ⁿ1ⁿ: it picks p, you pick a string, it picks a split, you choose how often to pump; it plays optimally and the scoreboard shows who must win.' },
        { num: '4.3', kind: 'Theorem', name: 'Classic nonregular languages', deps: ['toc-4.2'], refs: ['Sipser §1.4'],
          pic: 'For 0ⁿ1ⁿ, palindromes, squares and unary primes the winning pumping strategy is animated; for primes the pumped lengths march along a number line until a composite is hit.' },
        { num: '4.4', kind: 'Definition', name: 'Myhill–Nerode equivalence', deps: ['toc-2.3', 'alg-1.20a'], refs: ['Sipser §1.4'],
          pic: 'Type two prefixes x and y; the tool searches for a suffix z that separates them (xz in, yz out) and displays it, or reports none up to the search bound.' },
        { num: '4.5', kind: 'Theorem', name: 'Myhill–Nerode theorem', deps: ['toc-4.4', 'toc-2.2', 'alg-1.25'], refs: ['Sipser §1.4'],
          pic: 'Prefixes are sorted into classes as they are typed; for a regular language the number of classes stops growing and the classes become DFA states, while for 0ⁿ1ⁿ a new class opens for every n.' },
        { num: '4.6', kind: 'Theorem', name: 'Uniqueness of the minimal DFA', deps: ['toc-4.5', 'alg-1.15'], refs: ['Sipser §1.4'],
          pic: 'Two very differently drawn DFAs for the same language are minimized, and the isomorphism between the results is shown by matching colours on their states.' },
        { num: '4.7', kind: 'Algorithm', name: 'DFA minimization by partition refinement', deps: ['toc-4.6', 'alg-1.25'], refs: ['Sipser §1.4'],
          pic: 'States start in two blocks, accepting and rejecting, and blocks are split round by round by a distinguishing letter (v.steps); merged states shrink the machine to its minimum.' },
        { num: '4.8', kind: 'Algorithm', name: 'Brzozowski’s double-reversal minimization', deps: ['toc-4.6', 'toc-3.13', 'toc-3.3'], refs: ['Sipser §1.4'],
          pic: 'Reverse, determinize, reverse, determinize: the intermediate automaton balloons and then collapses to exactly the machine partition refinement produced.' },
        { num: '4.9', kind: 'Theorem', name: 'A nonregular language that can be pumped', deps: ['toc-4.1', 'toc-4.5', 'toc-2.6'], refs: ['Sipser §1.4'],
          pic: 'For a language built to satisfy the pumping condition, every pumping attack fails on the scoreboard, yet the Myhill–Nerode table keeps adding classes, proving it nonregular.' },
        { num: '4.10', kind: 'Theorem', name: 'Unary regular languages are ultimately periodic', deps: ['toc-2.3', 'comb-1.2'], refs: ['Sipser §1.4'],
          pic: 'A unary DFA is drawn as a lasso — a tail leading into a cycle — and the accepted lengths on a number line repeat with the cycle’s period after the tail.' },
        { num: '4.11', kind: 'Theorem', name: 'Two-way automata recognize only regular languages', deps: ['toc-4.5', 'toc-2.1', 'comb-1.1'], refs: ['Sipser §1.4'],
          pic: 'A head moves back and forth over the input; the sequence of states with which it crosses each cell boundary is recorded and shown to come from a finite set, the key to a one-way simulation.' },
        { num: '4.12', kind: 'Definition', name: 'Büchi automata and ω-regular languages', deps: ['toc-3.1'], refs: ['Sipser §1.2'],
          pic: 'An automaton reads an infinite periodic word uvvv… typed by the reader; the run is drawn as a lasso and accepted exactly when an accepting state recurs on the loop.' },
        { num: '4.13', kind: 'Method', name: 'Model checking with automata', deps: ['toc-4.12', 'toc-2.7', 'toc-2.6'], refs: ['Sipser §1.2'],
          pic: 'A traffic-light controller is composed with an automaton for “both lights green”; the reader introduces a bug and the emptiness search returns the violating run as a lasso.' },
      ],
    },
    // ───────────────────────────────────────────────────────────── 5
    {
      "n": 5,
      "title": "Context-free grammars",
      "summary": "A grammar builds a word by replacing variables, and a parse tree records its structure independently of rewrite order. Ambiguity can be removed from some grammars and is unavoidable for some languages. Normal forms support exact membership algorithms, while predictive and shift-reduce parsers trade generality for deterministic decisions.",
      "items": [
        {
          "num": "5.1",
          "kind": "Definition",
          "name": "Context-free grammar",
          "deps": [
            "toc-1.1"
          ],
          "refs": [
            "Sipser, MIT18.404 Fall2020 Lecture4, pp2–3; Erickson, Models of Computation note5 (2018), pp1–2"
          ],
          "pic": "Edit actual rules with spaces between symbols and semicolons between rules; eps denotes ε. Inspect the complete bounded language and step through a real derivation of a selected word. Invalid syntax and an empty bounded language are reported explicitly."
        },
        {
          "num": "5.2",
          "kind": "Definition",
          "name": "Derivations and parse trees",
          "deps": [
            "toc-5.1"
          ],
          "refs": [
            "Sipser, MIT18.404 Fall2020 Lecture4, pp2–5; Erickson note5, pp3–4"
          ],
          "pic": "Choose a binary parse tree for S→SS|a. Switch between leftmost and rightmost expansion and step through the actual frontier. Changing rewrite order keeps the chosen tree; changing the gallery index can change it."
        },
        {
          "num": "5.3",
          "kind": "Concept",
          "name": "Balanced brackets: the Dyck language",
          "deps": [
            "toc-5.1",
            "comb-5.3"
          ],
          "refs": [
            "Erickson note5, balanced-parentheses examples; COMB5.3 actual reflection count"
          ],
          "pic": "Type a parenthesis word and inspect every prefix height and the actual stack-matched pairs. Break the nonnegative-prefix condition or leave unmatched opens. The empty word remains a valid case."
        },
        {
          "num": "5.4",
          "kind": "Definition",
          "name": "Ambiguity",
          "deps": [
            "toc-5.2"
          ],
          "refs": [
            "Sipser, MIT18.404 Fall2020 Lecture4, pp4–5; Cornell CS4120 Spring2026, Context-Free Grammars, parse trees and ambiguity"
          ],
          "pic": "Type a small numeric expression, enumerate every actual binary parse and select its abstract syntax tree. Compare their evaluated values. Parentheses constrain the family; a single parse is a legitimate outcome."
        },
        {
          "num": "5.5",
          "kind": "Method",
          "name": "Precedence and associativity by grammar layering",
          "deps": [
            "toc-5.4"
          ],
          "refs": [
            "Cornell CS4120 Spring2026, Context-Free Grammars, enforcing precedence and associativity; Top-down parsing, AST folds"
          ],
          "pic": "Parse an editable expression under the layered grammar. Switch the sum level's associativity and watch the actual AST and value change; 8−3−2 is 3 on the left and 7 on the right. Multiplication keeps higher precedence."
        },
        {
          "num": "5.6",
          "kind": "Theorem",
          "name": "Inherently ambiguous languages",
          "deps": [
            "toc-5.4"
          ],
          "refs": [
            "Mulmuley/Yuan Li, UChicago Lecture10 (2015), pp1–2: marked-tree pumping argument; arbitrary-arity extension and inherent-ambiguity application proved here"
          ],
          "pic": "Inspect overlap of the two equality languages and an actual component parse. At a diagonal word both components contribute a parse in the natural union grammar. The finite picture illustrates that witness; the marked-tree argument establishes the universal claim."
        },
        {
          "num": "5.7",
          "kind": "Theorem",
          "name": "Regular languages are context-free",
          "deps": [
            "toc-5.1",
            "toc-2.1",
            "toc-2.3"
          ],
          "refs": [
            "Sipser, MIT18.404 Fall2020 Lecture4, p10, regular/CFL comparison; explicit DFA construction proved here"
          ],
          "pic": "Edit every transition of a two-state DFA and its accepting states. Step through a typed token word while the corresponding right-linear sentential form follows the same run. Remove all accepting states to obtain an empty language."
        },
        {
          "num": "5.8",
          "kind": "Theorem",
          "name": "Closure under union, concatenation and star",
          "deps": [
            "toc-5.1"
          ],
          "refs": [
            "Mulmuley/Yuan Li, UChicago Lecture10 (2015), pp2–3: union, concatenation and star constructions"
          ],
          "pic": "Edit both component grammars, choose a closure construction and compare exact bounded language counts. Star uses only the left grammar. The actual renamed productions and resulting words are reported."
        },
        {
          "num": "5.9",
          "kind": "Theorem",
          "name": "Chomsky normal form",
          "deps": [
            "toc-5.2"
          ],
          "refs": [
            "Erickson, Models of Computation note5 (2018), pp15–18, Chomsky normal form; Longley, Edinburgh IADS Lecture22 (2024), slides11–14; fresh-start ε handling included explicitly"
          ],
          "pic": "Edit a grammar and step through the actual conversion. A six-rule window shows each intermediate grammar and a plot counts its distinct productions. Inspect nullable rules, unit cycles and ε at the fresh start."
        },
        {
          "num": "5.10",
          "kind": "Algorithm",
          "name": "CYK parsing",
          "deps": [
            "toc-5.9"
          ],
          "refs": [
            "John Longley, University of Edinburgh IADS Lecture22, 6February2024, slides6–10 and15; empty input handled separately"
          ],
          "pic": "Type a word and grammar, then watch the real triangular chart fill. Cells show variable counts; the readout lists the full current set and one selected variable's actual witness tree. A computed empty cell shows 0, while an uncomputed cell stays blank."
        },
        {
          "num": "5.11",
          "kind": "Theorem",
          "name": "Greibach normal form",
          "deps": [
            "toc-5.9"
          ],
          "refs": [
            "Woodcock, UMBC CMSC451, Greibach Normal Form lecture, 19March1998: substitution, immediate left recursion and ordered conversion; ε and unproductive cases supplied explicitly"
          ],
          "pic": "Convert an editable grammar and step through an actual leftmost derivation of a typed word. The plot counts terminal tokens after each rewrite. Try left recursion, an empty word, or a word with no parse."
        },
        {
          "num": "5.12",
          "kind": "Concept",
          "name": "Backus–Naur form and programming-language syntax",
          "deps": [
            "toc-5.5"
          ],
          "see": [
            "toc-5.15"
          ],
          "refs": [
            "Cornell CS4120 Spring2026, Context-Free Grammars: syntax, derivations and ASTs; Bottom-up parsing: shift/reduce tables and stacks"
          ],
          "pic": "Type a tiny assignment and trace the generated parser's actual actions and consumed tokens. The accepted concrete tree retains identifier and numeric lexemes. Break the expression syntax to locate its first offending token."
        },
        {
          "num": "5.13",
          "kind": "Concept",
          "name": "The dangling-else ambiguity",
          "deps": [
            "toc-5.4"
          ],
          "refs": [
            "Cornell CS4120 Spring2026, Context-Free Grammars: dangling else and matched/unmatched grammar"
          ],
          "pic": "Type a nested conditional, select one of all its actual ambiguous ASTs, then switch to the matched/unmatched grammar. The selected tree and a parenthesized branch description show the actual attachment."
        },
        {
          "num": "5.14",
          "kind": "Algorithm",
          "name": "Predictive LL(1) parsing",
          "deps": [
            "toc-5.12",
            "toc-5.2"
          ],
          "refs": [
            "Cornell CS4120 Spring2026, Top-down parsing: NULLABLE, FIRST, FOLLOW, predictive table and conflicts"
          ],
          "pic": "Edit the grammar and word, inspect a selected variable's nullable/FIRST/FOLLOW facts and actual predictive-table row, then step through the stack. Insert common prefixes or left recursion to expose all conflicting cells."
        },
        {
          "num": "5.15",
          "kind": "Algorithm",
          "name": "Shift-reduce (LR) parsing",
          "deps": [
            "toc-5.12",
            "toc-5.2",
            "toc-5.14"
          ],
          "refs": [
            "Cornell CS4120 Spring2026, Bottom-up parsing: viable prefixes and state stacks; LR(1) parser construction: closure, goto and lookahead-specific reductions"
          ],
          "pic": "Edit a grammar and token word, then trace actual shifts and reductions. The state-stack plot follows the selected action. The accepted tree comes from those reductions. Try an unlayered expression grammar to encounter a real conflict."
        },
        {
          "num": "5.16",
          "kind": "Paper",
          "name": "On the Translation of Languages from Left to Right",
          "paper": {
            "authors": "Donald E. Knuth",
            "year": 1965,
            "title": "On the Translation of Languages from Left to Right",
            "venue": "Information and Control 8 (6): 607–639",
            "doi": "10.1016/S0019-9958(65)90426-2"
          },
          "introduces": [
            "toc-5.15"
          ],
          "deps": [
            "toc-5.1",
            "toc-5.2",
            "toc-5.15"
          ],
          "see": [
            "toc-6.10"
          ],
          "refs": [
            "Knuth (1965), bibliographic metadata only; original publisher body inaccessible (403), source review retained",
            "Cornell CS4120 Spring2026, LR(1) parser construction: actual modern closure/goto/lookahead body"
          ],
          "verify": true,
          "pic": "Edit a grammar, select an actual canonical state and inspect its dotted items, inherited lookaheads, outgoing edges and action cells. Compare a layered grammar with an ambiguous one. Full selected item strings remain in the readout when canvas labels are abbreviated."
        }
      ]
    },
    // ───────────────────────────────────────────────────────────── 6
    {
      "n": 6,
      "title": "Pushdown automata and the limits of context-free languages",
      "summary": "A stack turns finite-state control into exactly the power of a context-free grammar. Parse-tree repetition proves limitations that finite simulations cannot establish. Determinism changes the closure laws, while letter counts and decorated brackets reveal two different ways to represent every context-free language.",
      "items": [
        {
          "num": "6.1",
          "kind": "Definition",
          "name": "Pushdown automaton",
          "deps": [
            "toc-3.1"
          ],
          "refs": [
            "Claus–Olderog, Foundations of Theoretical Computer Science (winter2010/11), PDF pp52–56, PDA definition and acceptance conversion; top-of-stack induction supplied here"
          ],
          "pic": "Edit the input word and switch between equal counts, balanced brackets and even palindromes. Step through an actual accepting witness when one is found, or the final explored branch otherwise. The stack, consumed position and selected transition come from the same run."
        },
        {
          "num": "6.2",
          "kind": "Theorem",
          "name": "From grammar to pushdown automaton",
          "deps": [
            "toc-6.1",
            "toc-5.2"
          ],
          "refs": [
            "Claus–Olderog, PDF pp56–59, Theorem3.6 and two induction invariants; MIT18.404 Fall2020 Lecture4, CFG/PDA construction"
          ],
          "pic": "Edit the grammar and terminal word. The actual grammar productions become stack transitions, and the player follows one searched run. Compare its consumed prefix and pending stack with the leftmost-derivation invariant."
        },
        {
          "num": "6.3",
          "kind": "Theorem",
          "name": "From pushdown automaton to grammar",
          "deps": [
            "toc-6.1",
            "toc-5.1"
          ],
          "refs": [
            "Claus–Olderog, PDF pp59–62, Theorem3.7, triple variables and stack-summary induction"
          ],
          "pic": "Select a small PDA and a word. Browse the actual generated productions and the state endpoints associated with the selected transition. Compare exact grammar membership with the PDA’s searched witness."
        },
        {
          "num": "6.4",
          "kind": "Theorem",
          "name": "PDAs recognize exactly the context-free languages",
          "deps": [
            "toc-6.2",
            "toc-6.3"
          ],
          "refs": [
            "Claus–Olderog, PDF pp56–62, the two constructive inclusions"
          ],
          "pic": "Edit a grammar, choose a length bound and inspect every word in the exact bounded languages of the original and round-trip grammars. Select a word to inspect the intervening PDA’s actual search."
        },
        {
          "num": "6.5",
          "kind": "Theorem",
          "name": "Pumping lemma for context-free languages",
          "deps": [
            "toc-5.9",
            "toc-5.2",
            "comb-1.2"
          ],
          "refs": [
            "Watrous, Theory of Computation Lecture10 (2020), PDF pp1–5, CNF pumping proof; selected-tree extraction implemented directly"
          ],
          "pic": "Edit a grammar and accepted word, select an actual repeated-variable pair, and change the pump power. The highlighted nested tree nodes determine all five pieces. The resulting word is checked by the actual grammar recognizer."
        },
        {
          "num": "6.6",
          "kind": "Theorem",
          "name": "aⁿbⁿcⁿ and ww are not context-free",
          "deps": [
            "toc-6.5",
            "toc-6.9"
          ],
          "refs": [
            "Watrous Lecture10, PDF pp5–6, three-count counterexample; regular-intersection copying argument supplied here"
          ],
          "pic": "Choose the three-count witness or the copy language’s regular intersection, set a proposed pumping bound, and select any legal decomposition. Pump up or down and inspect the actual pieces and symbol counts."
        },
        {
          "num": "6.7",
          "kind": "Theorem",
          "name": "Ogden’s lemma",
          "deps": [
            "toc-6.5",
            "toc-5.9",
            "comb-1.2"
          ],
          "refs": [
            "Jean Gallier, CIS262 notes (5March2020), PDF pp175–178, Proposition7.12 and marked-branch argument; standard weaker CNF form and separating example proved here"
          ],
          "pic": "Compare the ordinary first-symbol split with every legal marked split of a bᵖcᵖdᵖ. The colored marks force the pumped pieces away from a harmless choice. Change the pump power and inspect actual language membership."
        },
        {
          "num": "6.8",
          "kind": "Theorem",
          "name": "No closure under intersection or complement",
          "deps": [
            "toc-6.6",
            "toc-5.8"
          ],
          "refs": [
            "Watrous, Theory of Computation Lecture10 (2020), PDF pp9–10, CFL intersection/complement counterexamples"
          ],
          "pic": "Change the three block counts and compare membership in both actual grammars and their intersection. The selected c-count gives a slice through the count grid; the diagonal marks simultaneous equality."
        },
        {
          "num": "6.9",
          "kind": "Theorem",
          "name": "Context-free ∩ regular is context-free",
          "deps": [
            "toc-6.4",
            "toc-2.6"
          ],
          "refs": [
            "Claus–Olderog, PDF pp62–63 and68–69, CFL/DCFL intersection with regular languages; explicit epsilon-aware product supplied here"
          ],
          "pic": "Edit the input and the small DFA’s transition table and final-state list. Step through the product’s actual run, watching the DFA coordinate stay fixed during stack-only moves."
        },
        {
          "num": "6.10",
          "kind": "Definition",
          "name": "Deterministic pushdown automata",
          "deps": [
            "toc-6.1"
          ],
          "refs": [
            "Claus–Olderog, PDF p66, DPDA definition; Taskin–Nipkow, DPDA_Complement_HU outline (24September2026), PDF pp1–2, exact determinism conditions"
          ],
          "pic": "Edit actual transition rules, final states and the input alphabet. Inspect every conflicting state/top pair, then follow the unique run when the machine is deterministic. Presets include a partial machine, a final visit followed by ε, and an infinite growing-stack ε-run."
        },
        {
          "num": "6.11",
          "kind": "Theorem",
          "name": "Deterministic CFLs are closed under complement",
          "deps": [
            "toc-6.10"
          ],
          "refs": [
            "Taskin–Nipkow, Deterministic Context-Free Languages are Closed Under Complementation (Hopcroft and Ullman), AFP outline dated24September2026, PDF pp1–12; finite epsilon-summary algorithm and work/checkpoint construction supplied here"
          ],
          "pic": "Edit a deterministic machine and compare its raw run, normalized run, correct complement and naive final-state flip. Inspect the actual ε-summary table and step through the selected constructed machine."
        },
        {
          "num": "6.12",
          "kind": "Theorem",
          "name": "Palindromes need nondeterminism",
          "deps": [
            "toc-6.10",
            "toc-6.9",
            "toc-6.5",
            "toc-5.1"
          ],
          "refs": [
            "Claus–Olderog, PDF pp68–70, Min closure and nonempty palindrome separation; full doubled-boundary pumping case analysis supplied here"
          ],
          "pic": "Inspect the prefix-minimal palindrome witness and every legal pumping split. Compare the two inner and outer block counts, and find the actual shorter palindrome prefix when pumping preserves symmetry but breaks minimality."
        },
        {
          "num": "6.13",
          "kind": "Theorem",
          "name": "Parikh’s theorem",
          "deps": [
            "toc-5.2",
            "toc-3.9",
            "comb-1.2"
          ],
          "refs": [
            "Esparza–Ganty–Kiefer–Luttenberger, Parikh’s theorem: A simple and direct construction, arXiv1006.3825v3, main proof through conclusion opening; regular-image semilinear closure supplied here. Two stronger sentences on PDF p3 are not adopted."
          ],
          "pic": "Edit a grammar and construct its actual bounded-variable automaton. Compare the complete count-vector sets through the chosen length, inspect a lattice point and follow a corresponding regular-language path. The default aⁿbⁿ grammar produces the regular representative (ab)*."
        },
        {
          "num": "6.14",
          "kind": "Theorem",
          "name": "Chomsky–Schützenberger theorem",
          "deps": [
            "toc-5.9",
            "toc-5.3",
            "toc-6.9"
          ],
          "refs": [
            "Roos–Nipkow, AFP Chomsky_Schuetzenberger outline dated6February2026, overview PDF pp1–4, actual P1–P5 definitions pp7–11, finite-alphabet regularity and final theorem statements; own reconstruction induction"
          ],
          "pic": "Edit a grammar and word to encode an actual CNF parse tree, or enter bracket tokens directly. Step through stack matching and inspect the independent regular-filter checks and erased output. Change a child-production type to preserve balanced nesting while breaking the grammar filter."
        }
      ]
    },
    {
      n: 7,
      title: 'Turing machines',
      summary: String.raw`A Turing machine has a finite control and an unbounded tape that it can read, write and move along — a minimal model that nevertheless captures every algorithm anyone has found. We separate machines that always halt (deciders) from those that may run forever (recognizers), and check that extra tapes, nondeterminism or printing output change efficiency but not power. The universal machine, which runs any machine from its description, is the theoretical ancestor of the stored-program computer.`,
      items: [
        { num: '7.1', kind: 'Definition', name: 'Turing machine', deps: ['toc-1.1'], refs: ['Sipser §3.1'],
          pic: 'Watch a machine for 0ⁿ1ⁿ zigzag across the typed input, crossing off symbols, while the state diagram highlights each transition as the head moves.' },
        { num: '7.2', kind: 'Definition', name: 'Configurations and computation histories', deps: ['toc-7.1'], refs: ['Sipser §3.1'],
          pic: 'The run is shown as a stack of configuration strings, one per step, with the state written just left of the head — the space-time picture reused in many later proofs.' },
        { num: '7.3', kind: 'Definition', name: 'Recognizable and decidable languages', deps: ['toc-7.1'], refs: ['Sipser §3.1'],
          pic: 'Run a recognizer and a decider on several inputs: accept, reject and “still running” are tallied, and a timeout slider shows that looping can never be confirmed in finite time.' },
        { num: '7.4', kind: 'Method', name: 'Programming Turing machines', deps: ['toc-7.1'], refs: ['Sipser §3.1'],
          pic: 'Pick a task — increment a binary number, copy a string, multiply in unary — and watch the machine run, with a step counter showing its running time on the reader’s input.' },
        { num: '7.5', kind: 'Theorem', name: 'Multitape machines equal single-tape machines', deps: ['toc-7.2'], refs: ['Sipser §3.2'],
          pic: 'A three-tape machine and its single-tape simulation run side by side: tracks are separated by # with dotted head marks, and the two step counters show the quadratic slowdown.' },
        { num: '7.6', kind: 'Theorem', name: 'Nondeterministic machines equal deterministic ones', deps: ['toc-7.5'], refs: ['Sipser §3.2'],
          pic: 'The computation tree of a nondeterministic machine is explored breadth-first by a deterministic simulator whose address tape counts through branches; the tree size grows exponentially with depth.' },
        { num: '7.7', kind: 'Theorem', name: 'Recognizable equals enumerable', deps: ['toc-7.3', 'toc-1.3'], refs: ['Sipser §3.2'],
          pic: 'Dovetailing: a recognizer runs on s₁ for one step, on s₁, s₂ for two steps, and so on in a growing triangle; strings are printed as their runs accept, in an unpredictable order.' },
        { num: '7.8', kind: 'Theorem', name: 'Two stacks or a queue suffice for full power', deps: ['toc-7.1', 'toc-6.1'], refs: ['Sipser §3.2'],
          pic: 'The tape is cut at the head into two stacks; each head move pops one and pushes the other, animated in sync with the Turing machine it simulates.' },
        { num: '7.9', kind: 'Theorem', name: 'Universal Turing machine', deps: ['toc-7.2', 'toc-1.6'], refs: ['Sipser §4.2'],
          pic: 'Encode a small machine as a string, place it with an input on the universal machine’s tape, and watch the universal machine look up each transition and update the simulated tape.' },
        { num: '7.10', kind: 'Model', name: 'Random-access machines', deps: ['toc-7.5'], refs: ['Sipser §3.2'],
          pic: 'A register program with load, add and jump-if-zero runs next to its Turing-machine simulation; the ratio of step counts stays bounded by a polynomial as inputs grow.' },
        { num: '7.11', kind: 'Definition', name: 'Linear bounded automata and context-sensitive languages', deps: ['toc-7.1'], refs: ['Sipser §5.1'],
          pic: 'A machine is confined between end-markers drawn as walls around its input, yet it recognizes aⁿbⁿcⁿ, which no pushdown automaton can.' },
        { num: '7.12', kind: 'Concept', name: 'The Chomsky hierarchy', deps: ['toc-7.11', 'toc-6.4', 'toc-3.9', 'toc-7.3'], refs: ['Sipser §3.3'],
          pic: 'Nested regions for regular, context-free, context-sensitive and recognizable languages; the reader drags example languages into the smallest region they think holds them and the tool shows the separating witness.' },
        { num: '7.13', kind: 'Paper', name: 'On Computable Numbers',
          paper: { authors: 'A. M. Turing', year: 1936, title: 'On Computable Numbers, with an Application to the Entscheidungsproblem',
                   venue: 'Proceedings of the London Mathematical Society s2-42 (1): 230–265', doi: '10.1112/plms/s2-42.1.230' },
          introduces: ['toc-7.1', 'toc-7.9', 'toc-8.13', 'toc-9.7'], deps: ['logic-7.7', 'toc-1.5'], refs: [],
          pic: 'Step Turing’s first example table (m-configurations b, c, e, f printing 0 and 1 on alternate squares) along a tape, edit it into new machines, and see each machine’s description number enter the diagonal table whose flipped diagonal no machine can compute.' },
        { num: '7.14', kind: 'Paper', name: 'First Draft of a Report on the EDVAC',
          paper: { authors: 'John von Neumann', year: 1945, title: 'First Draft of a Report on the EDVAC',
                   venue: 'Moore School of Electrical Engineering, University of Pennsylvania (reprinted in IEEE Annals of the History of Computing 15 (4): 27–75, 1993)', doi: '10.1109/85.238389' },
          introduces: ['tech-11.15'], deps: ['toc-7.9', 'tech-11.14'], refs: [],
          pic: 'A toy machine in the report’s spirit keeps program and data in one memory of numbered words; the reader steps the fetch–decode–execute cycle, watching the control unit read an instruction, the arithmetic unit act, and a loop rewrite its own address field.' },
      ],
    },
    // ───────────────────────────────────────────────────────────── 8
    {
      n: 8,
      title: 'Models of computation and the Church–Turing thesis',
      summary: String.raw`Independently invented models — counter machines, recursive functions, the λ-calculus, cellular automata, tag systems — all compute exactly the Turing-computable functions. That convergence is the evidence for the Church–Turing thesis, the claim that “effectively computable” means “computable by a Turing machine”. Some universal systems are startlingly small, which is why universality keeps appearing in unexpected places; the extended thesis about efficiency is where quantum computing pushes back.`,
      items: [
        { num: '8.1', kind: 'Model', name: 'Counter machines and two-counter universality', deps: ['toc-7.8'], refs: ['Sipser §3.2'],
          pic: 'A two-counter machine stores two registers a, b as the single number 2ᵃ3ᵇ in one counter; each simulated increment is watched as a multiplication and each test as a divisibility check.' },
        { num: '8.2', kind: 'Definition', name: 'Primitive recursive functions', deps: [], refs: ['Sipser §3.2'],
          pic: 'Snap together zero, successor and projection blocks with composition and primitive recursion to build addition, multiplication and exponentiation, then evaluate them and see the recursion unfold.' },
        { num: '8.3', kind: 'Theorem', name: 'Ackermann’s function is not primitive recursive', deps: ['toc-8.2'], refs: ['Sipser §3.2'],
          pic: 'Compute A(m, n) with a call counter: the table of values explodes along each row, and A(n, n) overtakes every function in a family of primitive recursive bounds the reader can extend.' },
        { num: '8.4', kind: 'Definition', name: 'μ-recursive (partial recursive) functions', deps: ['toc-8.2'], refs: ['Sipser §3.2'],
          pic: 'The minimization operator searches n = 0, 1, 2, … for a zero of a function; for some inputs the search never ends, shown as a counter that keeps spinning.' },
        { num: '8.5', kind: 'Theorem', name: 'μ-recursive equals Turing computable', deps: ['toc-8.4', 'toc-7.9'], refs: ['Sipser §3.2'],
          pic: 'A recursive definition is compiled into a Turing machine and a Turing machine into a μ-recursive function via step-counting; both run on the same inputs and agree.' },
        { num: '8.6', kind: 'Model', name: 'λ-definable functions', deps: [], refs: ['Sipser §3.3'],
          pic: 'Type a λ-term for addition or multiplication of Church numerals and watch β-reduction rewrite it, step by step, into the numeral of the answer.' },
        { num: '8.7', kind: 'Model', name: 'Cellular automata and Rule 110', deps: ['toc-7.1'], refs: ['Sipser §3.2'],
          pic: 'Pick an elementary rule number and a seed row and watch the space-time diagram grow; Rule 110 shows the gliders whose collisions are used to build a universal system.' },
        { num: '8.8', kind: 'Model', name: 'The Game of Life is universal', deps: ['toc-8.7'], refs: ['Sipser §3.2'],
          pic: 'A glider gun fires across an editable grid; the reader places eaters and blocks to build a logic gate and watches glider streams carry the signals.' },
        { num: '8.9', kind: 'Model', name: 'Post tag systems', deps: ['toc-7.8'], refs: ['Sipser §3.2'],
          pic: 'A 2-tag system processes a word as a queue — read the first symbol, delete two, append its production — and the reader edits the rules to see words halt, cycle or grow.' },
        { num: '8.10', kind: 'Model', name: 'Fractran', deps: ['toc-8.1'], refs: ['Sipser §3.2'],
          pic: 'Run Conway’s prime-generating program: the current integer is multiplied by the first fraction that gives an integer, and every power of 2 that appears has a prime exponent, listed live.' },
        { num: '8.11', kind: 'Hypothesis', name: 'Church–Turing thesis', deps: ['toc-8.5', 'toc-8.6', 'toc-8.7', 'toc-7.6', 'toc-8.1'], refs: ['Sipser §3.3'],
          pic: 'One function, multiplication, computed in five models — Turing machine, counter machine, recursive definition, λ-term, cellular automaton — on the reader’s input, with translations between them run live.' },
        { num: '8.12', kind: 'Hypothesis', name: 'Extended Church–Turing thesis', deps: ['toc-8.11', 'toc-7.10'], refs: ['Sipser §3.3'],
          pic: 'Simulation overheads between models are plotted — multitape to single tape, RAM to Turing machine — all polynomial, while classically simulating a quantum circuit costs time exponential in its qubits.' },
        { num: '8.13', kind: 'Definition', name: 'Computable real numbers (Turing, 1936)', deps: ['toc-7.9', 'toc-1.5'], refs: ['Sipser §3.3'],
          pic: 'Pick √2, π or e and a machine prints its binary digits one by one, each digit certified by an interval; since machines are countable, a counter shows that almost every real has no such machine.' },
        { num: '8.14', kind: 'Paper', name: 'An Unsolvable Problem of Elementary Number Theory',
          paper: { authors: 'Alonzo Church', year: 1936, title: 'An Unsolvable Problem of Elementary Number Theory',
                   venue: 'American Journal of Mathematics 58 (2): 345–363', doi: '10.2307/2371045' },
          introduces: ['toc-8.6', 'toc-8.11', 'pl-3.7'], deps: ['pl-2.4', 'toc-8.4', 'logic-7.7'], refs: [],
          pic: 'β-reduce λ-terms on Church numerals step by step, then pose Church’s question “does this term have a normal form?” and watch his diagonal term defeat any proposed decision procedure the reader plugs in.' },
      ],
    },
    // ───────────────────────────────────────────────────────────── 9
    {
      n: 9,
      title: 'Decidability and the halting problem',
      summary: String.raw`Many questions about automata and grammars are decidable by running or searching the machines involved. But no Turing machine decides whether Turing machines accept their inputs: feeding a would-be decider its own description yields a contradiction — Cantor’s diagonal argument in the form of a program. Since a language is decidable exactly when it and its complement are both recognizable, the complement of the acceptance problem is not even recognizable.`,
      items: [
        { num: '9.1', kind: 'Theorem', name: 'Decidable problems about finite automata', deps: ['toc-3.9', 'toc-2.8', 'toc-7.3'], refs: ['Sipser §4.1'],
          pic: 'A decider receives the encoding ⟨B, w⟩ as one string, parses the automaton, simulates it on w and halts with a verdict; the reader edits either part of the encoding.' },
        { num: '9.2', kind: 'Theorem', name: 'Acceptance and emptiness for grammars are decidable', deps: ['toc-5.10', 'toc-7.3'], refs: ['Sipser §4.1'],
          pic: 'Generating variables are marked in rounds until nothing changes, deciding emptiness, and CYK decides membership — both run on the reader’s grammar.' },
        { num: '9.3', kind: 'Theorem', name: 'Every context-free language is decidable', deps: ['toc-9.2'], refs: ['Sipser §4.1'],
          pic: 'A decider built from a grammar answers every typed string without looping, contrasted with the naive “try all derivations” search, which runs forever on non-members.' },
        { num: '9.4', kind: 'Theorem', name: 'The acceptance problem is recognizable', deps: ['toc-7.9'], refs: ['Sipser §4.2'],
          pic: 'The universal machine runs ⟨M, w⟩ and accepts when M does; on a looping machine the recognizer’s step counter climbs without end.' },
        { num: '9.5', kind: 'Theorem', name: 'Some languages are not recognizable', deps: ['toc-1.5', 'toc-7.9'], refs: ['Sipser §4.2'],
          pic: 'Machines are listed by their encodings, a countable list, against the uncountable family of languages; the diagonal language built from the list escapes every machine the reader adds.' },
        { num: '9.6', kind: 'Theorem', name: 'The acceptance problem is undecidable', deps: ['toc-9.4', 'pma-2.14'], refs: ['Sipser §4.2'],
          pic: 'In the machine-versus-encoding table of accept/reject entries, the hypothetical decider is applied along the diagonal and flipped; the row of the flipped machine itself contains the contradictory cell.' },
        { num: '9.7', kind: 'Theorem', name: 'The halting problem is undecidable', deps: ['toc-9.6'], refs: ['Sipser §5.1'],
          pic: 'Feed a reader-edited “halting checker” the source of a program that does the opposite of whatever the checker predicts about it; both possible answers are traced to a contradiction.' },
        { num: '9.8', kind: 'Theorem', name: 'Decidable iff recognizable and co-recognizable', deps: ['toc-7.3'], refs: ['Sipser §4.2'],
          pic: 'Recognizers for L and for its complement run in alternation; exactly one eventually accepts, so the combined machine halts on every input in the grid.' },
        { num: '9.9', kind: 'Theorem', name: 'The complement of the acceptance problem is not recognizable', deps: ['toc-9.8', 'toc-9.6', 'toc-9.4'], refs: ['Sipser §4.2'],
          pic: 'If both A_TM and its complement were recognizable, the alternating machine of the previous item would decide A_TM; the tool assembles it and points to the contradiction.' },
        { num: '9.10', kind: 'Concept', name: 'The landscape of decidability', deps: ['toc-9.9', 'toc-7.12'], refs: ['Sipser §4.2'],
          pic: 'A diagram of decidable, recognizable and co-recognizable problems with draggable example problems; each placement is checked against the known proofs.' },
      ],
    },
    // ───────────────────────────────────────────────────────────── 10
    {
      n: 10,
      title: 'Reducibility',
      summary: String.raw`Once one problem is known to be undecidable, others follow by reduction: if a solver for B would yield a solver for A, then B is at least as hard as A. Reductions through computation histories reach deep into language theory — emptiness for linear-bounded automata, universality of grammars, Post’s correspondence problem — and Rice’s theorem rules out every nontrivial question about what a program computes. Mapping reductions refine the picture, separating problems that are recognizable, co-recognizable or neither.`,
      items: [
        { num: '10.1', kind: 'Concept', name: 'Reductions between problems', deps: ['toc-9.6'], refs: ['Sipser §5.1'],
          pic: 'A reduction is drawn as a pipeline — instance of A, transformer, solver for B, answer; the reader plugs in a faulty B-solver and the A-answers fail exactly where B’s do.' },
        { num: '10.2', kind: 'Theorem', name: 'Emptiness for Turing machines is undecidable', deps: ['toc-10.1'], refs: ['Sipser §5.1'],
          pic: 'From ⟨M, w⟩ the reduction writes a machine M₁ that rejects every input except w, on which it runs M; inspect M₁’s code and see L(M₁) is empty exactly when M does not accept w.' },
        { num: '10.3', kind: 'Theorem', name: 'Regularity of a machine’s language is undecidable', deps: ['toc-10.1'], refs: ['Sipser §5.1'],
          pic: 'The constructed machine accepts strings 0ⁿ1ⁿ outright and everything else only if M accepts w, so its language flips between nonregular and Σ*; both cases are run.' },
        { num: '10.4', kind: 'Theorem', name: 'Equivalence of Turing machines is undecidable', deps: ['toc-10.2'], refs: ['Sipser §5.1'],
          pic: 'Comparing a machine with one that rejects everything is the emptiness problem in disguise; the reduction is drawn as a single wire into the hypothetical equivalence checker.' },
        { num: '10.5', kind: 'Theorem', name: 'Rice’s theorem', deps: ['toc-10.2'], refs: ['Sipser §5.1'],
          pic: 'Pick a property of languages from a menu — contains 101, finite, regular, everything — and the generic reduction from the acceptance problem is assembled; the trivial properties are shown to escape it.' },
        { num: '10.6', kind: 'Theorem', name: 'Acceptance for linear bounded automata is decidable', deps: ['toc-7.11', 'comb-1.2'], refs: ['Sipser §5.1'],
          pic: 'An LBA has at most q·n·gⁿ configurations on an input of length n; a counter runs to that bound, after which the simulation can safely declare a loop.' },
        { num: '10.7', kind: 'Theorem', name: 'Emptiness for linear bounded automata is undecidable', deps: ['toc-10.6', 'toc-7.2', 'toc-10.2'], refs: ['Sipser §5.1'],
          pic: 'Accepting computation histories of M on w are strings an LBA can check locally; the reader scrubs through a history and the LBA flags the first illegal step.' },
        { num: '10.8', kind: 'Theorem', name: 'Universality of context-free grammars is undecidable', deps: ['toc-7.2', 'toc-6.4', 'toc-10.2'], refs: ['Sipser §5.1'],
          pic: 'A PDA nondeterministically hunts for a defect in a candidate history written with every other configuration reversed; it accepts everything except valid accepting histories.' },
        { num: '10.9', kind: 'Theorem', name: 'Post’s correspondence problem is undecidable', deps: ['toc-7.2', 'toc-9.6'], refs: ['Sipser §5.2'],
          pic: 'Drag dominoes into a row trying to make top and bottom strings agree; a search tree shows how long the shortest match can be, and the reduction lays out dominoes that spell a machine’s run.' },
        { num: '10.10', kind: 'Theorem', name: 'Ambiguity of grammars is undecidable', deps: ['toc-10.9', 'toc-5.4'], refs: ['Sipser §5.2'],
          pic: 'From a correspondence instance two grammars are built whose union is ambiguous exactly when a match exists; drag in a match and see the two parse trees appear.' },
        { num: '10.11', kind: 'Definition', name: 'Mapping reducibility', deps: ['toc-10.1'], refs: ['Sipser §5.3'],
          pic: 'A computable function is drawn as arrows from Σ* to Σ*; yes-instances of A land inside B and no-instances outside, checked on sample inputs.' },
        { num: '10.12', kind: 'Theorem', name: 'Mapping reductions transfer decidability and recognizability', deps: ['toc-10.11', 'toc-9.9'], refs: ['Sipser §5.3'],
          pic: 'Compose a reduction with a decider (or recognizer) for B and get one for A; reverse the logic and the non-recognizability of A_TM’s complement spreads along the arrows.' },
        { num: '10.13', kind: 'Theorem', name: 'Equivalence is neither recognizable nor co-recognizable', deps: ['toc-10.12', 'toc-10.4'], refs: ['Sipser §5.3'],
          pic: 'Two reductions from the complement of A_TM, one to EQ_TM and one to its complement, are animated; each shows a recognizer would contradict the previous chapter.' },
        { num: '10.14', kind: 'Theorem', name: 'Wang tiling is undecidable', deps: ['toc-7.2', 'toc-10.12'], refs: ['Sipser §5.2'],
          pic: 'Place Wang tiles with coloured edges on a grid while an auto-tiler backtracks; a tile set encoding a machine forces each row to spell its next configuration.' },
        { num: '10.15', kind: 'Theorem', name: 'Hilbert’s tenth problem (Matiyasevich)', deps: ['toc-10.12', 'toc-7.7'], refs: ['Sipser §3.3'],
          pic: 'Search integer points of a typed polynomial equation in a growing box: solutions light up when found, but no bound on the search can be computed in general, so searching only recognizes.' },
        { num: '10.16', kind: 'Theorem', name: 'The busy beaver function is uncomputable', deps: ['toc-9.7'], refs: ['Sipser §5.1'],
          pic: 'All 2- and 3-state machines are run from a blank tape; the halting champions and their step counts are listed, and the known values outrun any computable function the reader types.' },
        { num: '10.17', kind: 'Theorem', name: 'Word problems for semigroups and groups are undecidable', deps: ['toc-10.12', 'toc-7.2'], refs: ['Sipser §5.2'],
          pic: 'Edit a string-rewriting system and two words; breadth-first search over rewrites finds a derivation when one exists, and the encoding of a machine as rewrite rules shows why no search bound can exist in general.' },
      ],
    },
    // ───────────────────────────────────────────────────────────── 11
    {
      n: 11,
      title: 'Self-reference, logic and information',
      summary: String.raw`A program can obtain its own description — the recursion theorem — which yields quines, one-line undecidability proofs and the fact that minimal programs cannot be recognized. Encoding computations as numbers shows that truth in arithmetic with addition and multiplication is undecidable, the computational core of Gödel’s theorems (developed in full in the logic collection). Oracles organize undecidable problems into levels, and Kolmogorov complexity measures the information in a single string by the length of its shortest description.`,
      items: [
        { num: '11.1', kind: 'Algorithm', name: 'Self-reproducing programs (quines)', deps: ['toc-7.9'], refs: ['Sipser §6.1'],
          pic: 'A two-part quine — part A prints part B, part B prints A and then itself — is executed and its output compared with its source; editing either half breaks or preserves self-reproduction.' },
        { num: '11.2', kind: 'Theorem', name: 'Kleene’s recursion theorem', deps: ['toc-11.1'], refs: ['Sipser §6.1'],
          pic: 'For a reader-chosen transformation of programs, the construction builds a program that obtains its own text and applies the transformation to it; the self-copying step is highlighted.' },
        { num: '11.3', kind: 'Theorem', name: 'Undecidability by self-reference', deps: ['toc-11.2', 'toc-9.6'], refs: ['Sipser §6.1'],
          pic: 'A machine fetches its own description, asks the alleged decider about itself and does the opposite; the trace shows the contradiction in two lines.' },
        { num: '11.4', kind: 'Theorem', name: 'Minimal machines cannot be recognized', deps: ['toc-11.2', 'toc-7.7'], refs: ['Sipser §6.1'],
          pic: 'A machine enumerates the supposed list of minimal machines until it finds one longer than itself and then simulates it — so it is a shorter equivalent, contradicting minimality.' },
        { num: '11.6', kind: 'Theorem', name: 'Truth in arithmetic is undecidable', deps: ['toc-9.6', 'toc-7.2'], refs: ['Sipser §6.2'],
          pic: 'A computation history is encoded as a single number, and a formula with + and × says “this number codes an accepting run”; the encoding is demonstrated on a short run.' },
        { num: '11.9', kind: 'Definition', name: 'Oracle machines and Turing reducibility', deps: ['toc-10.11'], refs: ['Sipser §6.3'],
          pic: 'A machine with an oracle box asks questions mid-computation; emptiness is decided with an acceptance oracle and every query is logged.' },
        { num: '11.10', kind: 'Concept', name: 'The arithmetical hierarchy', deps: ['toc-11.9', 'toc-9.10'], refs: ['Sipser §6.3'],
          pic: 'Problems are placed by quantifier alternation in a pyramid — halting at level Σ₁, totality at Π₂, finiteness at Σ₂ — and dragging a quantifier prefix shows which level it lands on.' },
        { num: '11.11', kind: 'Definition', name: 'Kolmogorov complexity', deps: ['toc-7.9', 'toc-1.3'], refs: ['Sipser §6.4'],
          pic: 'For a typed string, several descriptions (literal, run-length, a repeat loop, a short program) are compared, and the shortest found gives an upper bound on K(x).' },
        { num: '11.12', kind: 'Theorem', name: 'Invariance theorem', deps: ['toc-11.11'], refs: ['Sipser §6.4'],
          pic: 'Description lengths in two languages are compared on many strings; their difference stays inside a band whose width is the size of an interpreter.' },
        { num: '11.13', kind: 'Theorem', name: 'Incompressible strings exist', deps: ['toc-11.11', 'comb-1.2'], refs: ['Sipser §6.4'],
          pic: 'There are 2ⁿ strings of length n but fewer than 2ⁿ shorter descriptions; the bar chart shows that most strings compress by at most a few bits.' },
        { num: '11.14', alias: 'logic-1.8', name: 'Berry paradox' },
        { num: '11.15', kind: 'Theorem', name: 'Kolmogorov complexity is uncomputable', deps: ['toc-11.14', 'toc-9.7'], refs: ['Sipser §6.4'],
          pic: 'A hypothetical K-computer is wrapped in a short search program that prints the first string of complexity above N; for large N the program is shorter than N, contradicting itself.' },
        { num: '11.16', kind: 'Theorem', name: 'Chaitin’s incompleteness theorem', deps: ['toc-11.15', 'logic-7.7'], refs: ['Sipser §6.4'],
          pic: 'A proof enumerator for a sound theory searches for proofs that K(x) > L; once L exceeds the theory’s own description length the search never succeeds.' },
        { num: '11.17', kind: 'Concept', name: 'Chaitin’s halting probability Ω', deps: ['toc-11.15', 'toc-9.7'], refs: ['Sipser §6.4'],
          pic: 'All programs of a prefix-free toy language run in parallel; each one that halts adds 2^(−length) to a lower bound on Ω that creeps upward, and the readout shows how its first n bits would settle halting for every program of length n.' },
      ],
    },
    // ───────────────────────────────────────────────────────────── 12
    {
      n: 12,
      title: 'Time complexity: P and NP',
      summary: String.raw`Decidability is not enough; we measure how running time grows with input length and call a problem tractable when it has a polynomial-time algorithm. The class P is robust across reasonable deterministic models and contains path finding, gcd computation and context-free membership. Nondeterministic polynomial time defines NP, the problems whose yes-instances have short, quickly checkable certificates. Whether P equals NP is the central open question of the field.`,
      items: [
        { num: '12.1', kind: 'Definition', name: 'Asymptotic notation', deps: [], refs: ['Sipser §7.1'],
          pic: 'Plot n², 100·n·log n and 2ⁿ/1000 with a zoom slider; the crossover points move but the eventual order never changes, and a readout checks the constants in a chosen big-O claim.' },
        { num: '12.2', kind: 'Definition', name: 'Running time of a Turing machine', deps: ['toc-7.3', 'toc-12.1'], refs: ['Sipser §7.1'],
          pic: 'Two machines for 0ⁿ1ⁿ are timed on inputs of growing length; their worst-case step counts are plotted against n with fitted n² and n log n curves.' },
        { num: '12.3', kind: 'Theorem', name: 'Single-tape simulation costs at most a square', deps: ['toc-7.5', 'toc-12.2'], refs: ['Sipser §7.1'],
          pic: 'The simulation of a multitape machine is timed on growing inputs; the ratio of single-tape steps to t(n)² stays bounded on a log–log plot.' },
        { num: '12.4', kind: 'Theorem', name: 'Nondeterminism costs at most an exponential', deps: ['toc-7.6', 'toc-12.2'], refs: ['Sipser §7.1'],
          pic: 'A nondeterministic machine’s computation tree of depth t(n) is explored by brute force; the number of simulated steps is plotted and fits 2^{O(t(n))}.' },
        { num: '12.5', kind: 'Definition', name: 'The class P', deps: ['toc-12.3'], refs: ['Sipser §7.2'],
          pic: 'A gallery of problems with their best algorithms timed on the reader’s inputs; polynomial ones stay straight on log–log axes, exponential ones curve upward.' },
        { num: '12.6', kind: 'Theorem', name: 'Directed reachability is in P', deps: ['toc-12.5', 'algo-8.5'], refs: ['Sipser §7.2'],
          pic: 'Breadth-first marking spreads from s through a directed graph the reader draws; the step count is plotted against the number of nodes and stays under a quadratic.' },
        { num: '12.7', kind: 'Theorem', name: 'Relative primality is in P (Euclid’s algorithm)', deps: ['toc-12.5', 'algo-1.7'], refs: ['Sipser §7.2'],
          pic: 'Euclid’s algorithm runs on two typed numbers; its step count is plotted against bit length and stays linear, while trial division’s count doubles with every added bit.' },
        { num: '12.8', kind: 'Theorem', name: 'Every context-free language is in P', deps: ['toc-5.10', 'toc-12.5'], refs: ['Sipser §7.2'],
          pic: 'CYK is timed on strings of growing length for a fixed grammar; the cell updates fit a cubic curve, compared with the exponential count of derivations.' },
        { num: '12.9', kind: 'Concept', name: 'Pseudo-polynomial time and number encodings', deps: ['toc-12.5', 'toc-1.6'], refs: ['Sipser §7.2'],
          pic: 'Subset-sum by dynamic programming fills a table whose width is the target value; adding one decimal digit to the target multiplies the width by ten.' },
        { num: '12.10', kind: 'Definition', name: 'Verifiers and certificates', deps: ['toc-12.5'], refs: ['Sipser §7.3'],
          pic: 'Drag in a Hamiltonian path as a certificate and the verifier checks it in linear time; finding one without a certificate requires the brute-force search shown alongside.' },
        { num: '12.11', kind: 'Definition', name: 'The class NP', deps: ['toc-12.10', 'toc-12.4'], refs: ['Sipser §7.3'],
          pic: 'The guess-then-check view and the verifier view are shown side by side on the same clique instance, with the successful guess highlighted as a branch of the computation tree.' },
        { num: '12.12', kind: 'Theorem', name: 'CLIQUE, SUBSET-SUM and HAMPATH are in NP', deps: ['toc-12.11'], refs: ['Sipser §7.3'],
          pic: 'For each problem the reader proposes a certificate and the verifier checks it with a visible step counter that stays polynomial in the instance size.' },
        { num: '12.13', kind: 'Definition', name: 'coNP', deps: ['toc-12.11'], refs: ['Sipser §7.3'],
          pic: 'A satisfying assignment certifies satisfiability at a glance, but certifying that a formula is unsatisfiable seems to need the whole truth table, which the reader can page through.' },
        { num: '12.14', kind: 'Hypothesis', name: 'P ≠ NP', deps: ['toc-12.11', 'toc-12.5'], refs: ['Sipser §7.3'],
          pic: 'Two possible worlds are drawn, P = NP and P ≠ NP, with P, NP, coNP and the NP-complete problems placed in each; pick a problem to see where it sits and what would follow.' },
      ],
    },
    // ───────────────────────────────────────────────────────────── 13
    {
      n: 13,
      title: 'NP-completeness',
      summary: String.raw`Polynomial-time reductions compare problems by difficulty, and an NP-complete problem is one that every NP problem reduces to. The Cook–Levin theorem shows satisfiability is such a problem by writing an entire nondeterministic computation as a Boolean formula. From there, gadget reductions spread hardness to cliques, vertex covers, Hamiltonian paths, colourings and subset sums; a polynomial algorithm for any one of them would make P equal NP.`,
      items: [
        { num: '13.1', kind: 'Definition', name: 'Polynomial-time reducibility', deps: ['toc-10.11', 'toc-12.5'], refs: ['Sipser §7.4'],
          pic: 'A reduction from graph 3-colouring to SAT runs on a graph the reader draws; the formula’s size is plotted against the graph’s and stays polynomial.' },
        { num: '13.2', kind: 'Definition', name: 'NP-hardness and NP-completeness', deps: ['toc-13.1', 'toc-12.11'], refs: ['Sipser §7.4'],
          pic: 'A graph of problems joined by reduction arrows; marking any node “in P” propagates along the arrows and turns every NP-complete node green.' },
        { num: '13.3', kind: 'Theorem', name: 'One NP-complete problem in P puts all of NP in P', deps: ['toc-13.2'], refs: ['Sipser §7.4'],
          pic: 'Compose a reduction with a polynomial solver and watch the running times add up as a polynomial of a polynomial, plotted against instance size.' },
        { num: '13.4', kind: 'Theorem', name: 'Cook–Levin theorem', deps: ['toc-13.2', 'toc-7.2', 'toc-1.9', 'toc-12.11'], refs: ['Sipser §7.4'],
          pic: 'The tableau of a nondeterministic run is filled row by row; click a 2×3 window to see the clauses enforcing it, and introduce an illegal move to watch exactly those clauses go false.' },
        { num: '13.5', kind: 'Theorem', name: '3SAT is NP-complete', deps: ['toc-13.4'], refs: ['Sipser §7.4'],
          pic: 'Long clauses are split into chains of three-literal clauses with fresh variables; toggling an assignment shows satisfiability preserved in both directions.' },
        { num: '13.6', kind: 'Theorem', name: 'CLIQUE is NP-complete', deps: ['toc-13.5'], refs: ['Sipser §7.4'],
          pic: 'A 3CNF formula becomes a graph with a triple of literal nodes per clause; an assignment the reader picks lights up a k-clique, and contradictory literals have no edge.' },
        { num: '13.7', kind: 'Theorem', name: 'VERTEX-COVER is NP-complete', deps: ['toc-13.5'], refs: ['Sipser §7.5'],
          pic: 'Variable edges and clause triangles are wired together; a satisfying assignment becomes a cover of exactly the target size, checked edge by edge.' },
        { num: '13.8', kind: 'Theorem', name: 'Independent sets, cliques and covers are interreducible', deps: ['toc-13.6', 'toc-13.7'], refs: ['Sipser §7.5'],
          pic: 'Toggle between a graph and its complement: a clique in one is an independent set in the other, and the complement of an independent set is a vertex cover.' },
        { num: '13.9', kind: 'Theorem', name: 'HAMPATH is NP-complete', deps: ['toc-13.5'], refs: ['Sipser §7.5'],
          pic: 'Each variable becomes a row of nodes crossed left-to-right for true or right-to-left for false, and clause nodes are visited by detours; the path for the reader’s assignment is animated.' },
        { num: '13.10', kind: 'Theorem', name: 'Undirected Hamiltonian path and cycle are NP-complete', deps: ['toc-13.9'], refs: ['Sipser §7.5'],
          pic: 'Each directed node is split into in, middle and out nodes; the reader checks that every undirected Hamiltonian path must traverse the triples in order.' },
        { num: '13.11', kind: 'Theorem', name: 'SUBSET-SUM is NP-complete', deps: ['toc-13.5'], refs: ['Sipser §7.5'],
          pic: 'Numbers are built as digit rows with one column per variable and per clause; choosing rows for an assignment sums column by column to the target with no carries possible.' },
        { num: '13.12', kind: 'Theorem', name: '3-COLOUR is NP-complete', deps: ['toc-13.5'], refs: ['Sipser §7.5'],
          pic: 'The palette triangle, variable pairs and clause gadgets are assembled; colouring a gadget forces its output, and an unsatisfied clause makes its gadget impossible to colour.' },
        { num: '13.13', kind: 'Theorem', name: '2SAT is in P', deps: ['toc-12.6', 'toc-1.9', 'algo-8.17'], refs: ['Sipser §7.5'],
          pic: 'The implication graph of a 2CNF formula is drawn and its strongly connected components found; a variable and its negation in one component is highlighted as proof of unsatisfiability.' },
        { num: '13.14', kind: 'Theorem', name: 'Search reduces to decision for SAT', deps: ['toc-13.4', 'toc-1.10'], refs: ['Sipser §7.4'],
          pic: 'A satisfiability oracle is queried while variables are fixed one at a time; a satisfying assignment emerges after n queries, logged in a table.' },
        { num: '13.15', kind: 'Paper', name: 'The Complexity of Theorem-Proving Procedures',
          paper: { authors: 'Stephen A. Cook', year: 1971, title: 'The Complexity of Theorem-Proving Procedures',
                   venue: 'Proceedings of the Third Annual ACM Symposium on Theory of Computing (STOC ’71): 151–158', doi: '10.1145/800157.805047' },
          introduces: ['toc-13.2', 'toc-13.4', 'toc-13.5'], deps: ['toc-12.11', 'toc-1.9', 'toc-7.2'], refs: [],
          pic: 'Pick a tiny nondeterministic machine and input: the tableau of its run is translated live into Cook’s clauses, toggling a cell shows which clause breaks, and a satisfying assignment found by a solver is read back as an accepting computation.' },
      ],
    },
    // ───────────────────────────────────────────────────────────── 14
    {
      n: 14,
      title: 'Space complexity',
      summary: String.raw`Space can be reused, which makes it a gentler resource than time: Savitch’s theorem shows nondeterminism costs at most a square, so nondeterministic and deterministic polynomial space coincide. Quantified Boolean formulas and two-player games are complete for PSPACE. Below polynomial time, logarithmic space captures what a machine can do with a few pointers into its input; directed reachability is complete for the nondeterministic version, and that class is, surprisingly, closed under complement.`,
      items: [
        { num: '14.1', kind: 'Definition', name: 'Space complexity', deps: ['toc-12.2'], refs: ['Sipser §8.1'],
          pic: 'A machine deciding SAT reuses the same tape cells for every assignment; meters for time and space show time growing exponentially while space stays linear.' },
        { num: '14.2', kind: 'Definition', name: 'Configuration graph', deps: ['toc-7.2', 'toc-14.1'], refs: ['Sipser §8.1'],
          pic: 'All configurations of a small space-bounded machine on an input are drawn as nodes joined by step edges; acceptance becomes reachability and the node count matches the formula q·n·s·gˢ.' },
        { num: '14.3', kind: 'Theorem', name: 'Savitch’s theorem', deps: ['toc-14.2'], refs: ['Sipser §8.1'],
          pic: 'The recursive midpoint search “can c₁ reach c₂ in t steps?” is animated as a recursion tree; the stack depth, log t frames of size s, is read out against the length of the path found.' },
        { num: '14.4', kind: 'Theorem', name: 'PSPACE = NPSPACE', deps: ['toc-14.3'], refs: ['Sipser §8.2'],
          pic: 'A nondeterministic polynomial-space machine is simulated through Savitch’s recursion; space used is plotted against the original bound and fits its square.' },
        { num: '14.5', kind: 'Theorem', name: 'P ⊆ NP ⊆ PSPACE ⊆ EXPTIME', deps: ['toc-14.4', 'toc-14.2', 'toc-12.11'], refs: ['Sipser §8.2'],
          pic: 'Nested boxes of classes; clicking an inclusion shows the simulation behind it, such as counting configurations to bound the running time of a space-bounded machine.' },
        { num: '14.6', kind: 'Definition', name: 'Quantified Boolean formulas', deps: ['toc-1.9'], refs: ['Sipser §8.3'],
          pic: 'Type a fully quantified formula; its evaluation tree branches on ∀ and ∃ nodes, propagating AND and OR upward from the truth-value leaves.' },
        { num: '14.7', kind: 'Theorem', name: 'TQBF is PSPACE-complete', deps: ['toc-14.6', 'toc-14.3'], refs: ['Sipser §8.3'],
          pic: 'The reduction formula for “c₁ reaches c₂ in t steps” uses one ∀ to share a single copy between both halves; its size is plotted against t and grows polynomially instead of doubling.' },
        { num: '14.8', kind: 'Concept', name: 'Formula games', deps: ['toc-14.6'], refs: ['Sipser §8.3'],
          pic: 'Play the formula game against the computer: players alternately set variables, and evaluating the game tree shows which player has a winning strategy.' },
        { num: '14.9', kind: 'Theorem', name: 'Generalized geography is PSPACE-complete', deps: ['toc-14.8', 'toc-14.7'], refs: ['Sipser §8.3'],
          pic: 'Play geography on an editable directed graph; the solver labels positions win or lose by backward search, and the gadget built from a formula game is displayed.' },
        { num: '14.10', kind: 'Definition', name: 'L and NL', deps: ['toc-14.1'], refs: ['Sipser §8.4'],
          pic: 'A read-only input tape and a tiny work tape holding two binary counters decide 0ⁿ1ⁿ; the counters’ bits are displayed and the work tape never exceeds log₂ n cells.' },
        { num: '14.11', kind: 'Definition', name: 'Log-space reductions', deps: ['toc-14.10', 'toc-13.1'], refs: ['Sipser §8.5'],
          pic: 'A log-space transducer writes its output one symbol at a time while its work tape stays tiny; composing two transducers recomputes symbols on demand rather than storing them.' },
        { num: '14.12', kind: 'Theorem', name: 'Directed reachability is NL-complete', deps: ['toc-14.11', 'toc-14.2'], refs: ['Sipser §8.5'],
          pic: 'Any NL machine’s configuration graph on the reader’s input is produced edge by edge by a log-space transducer, and the accept configuration is reachable exactly when the machine accepts.' },
        { num: '14.13', kind: 'Theorem', name: 'NL ⊆ P', deps: ['toc-14.12', 'toc-12.6'], refs: ['Sipser §8.5'],
          pic: 'The polynomially many configurations of a log-space machine are laid out and searched by breadth-first marking; the node count and running time are read out.' },
        { num: '14.14', kind: 'Theorem', name: 'Immerman–Szelepcsényi theorem: NL = coNL', deps: ['toc-14.12'], refs: ['Sipser §8.6'],
          pic: 'Inductive counting certifies, round by round, how many nodes are reachable within i steps; the guesses are verified as they are made and end in a certificate that the target is unreachable.' },
      ],
    },
  ],
};
