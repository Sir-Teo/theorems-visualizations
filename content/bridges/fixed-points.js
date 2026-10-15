// Bridge: one idea followed across collections and fields (see MASTER_PLAN.md §8).
export default {
  slug: 'fixed-points',
  title: 'Fixed points: where a map leaves something alone',
  blurb: String.raw`Many existence proofs come down to one move: write the thing you want as a point that some map sends to itself, then show such a point must exist. That move proves differential equations have solutions, markets and games have equilibria, Google can rank the web, programs can print themselves, and light settles into a rendered image.`,
  steps: [
    { id: 'top-3.17', note: String.raw`The simplest case: a continuous map of an interval to itself must cross the diagonal somewhere, by the intermediate value theorem.` },
    { id: 'pma-9.23', note: String.raw`Banach's contraction principle: if a map shrinks every distance by a fixed factor, iterating it from anywhere converges to its unique fixed point, and you can say how fast.` },
    { id: 'ode-2.4', note: String.raw`Picard–Lindelöf: a solution of $x' = f(t,x)$ is a fixed point of the integral map $x \mapsto x_0 + \int f(s, x(s))\,ds$, which is a contraction on a short enough interval.` },
    { id: 'num-2.4', note: String.raw`Newton's method is fixed-point iteration for a cleverly chosen map whose fixed point is a root and whose derivative vanishes there, so the error squares at each step.` },
    { id: 'top-13.11', note: String.raw`Brouwer: every continuous map of a ball to itself has a fixed point. Unlike Banach's theorem it gives no algorithm and no uniqueness, only existence.` },
    { id: 'top-9.9', note: String.raw`Sperner's lemma, a counting fact about coloured triangulations, gives a combinatorial proof of Brouwer and a way to hunt for approximate fixed points.` },
    { id: 'game-2.3', note: String.raw`Nash: every finite game has an equilibrium in mixed strategies, a fixed point of the map that moves each player towards better replies.` },
    { id: 'micro-9.7', note: String.raw`An exchange economy has prices that clear every market at once: the same topology, now applied to excess demand on the price simplex.` },
    { id: 'stoch-4.6', note: String.raw`Perron–Frobenius: a positive matrix has a positive eigenvector, a fixed direction, which gives the long-run distribution of a Markov chain.` },
    { id: 'stoch-4.15', note: String.raw`PageRank is that eigenvector for a random surfer on the web graph, found by iterating the map until it stops changing.` },
    { id: 'stoch-3.10', note: String.raw`The extinction probability of a branching process is the smallest fixed point of its offspring generating function.` },
    { id: 'logic-7.5', note: String.raw`In logic the diagonal lemma builds, for any property, a sentence that asserts it has that property. Gödel's sentence is such a fixed point.` },
    { id: 'toc-11.2', note: String.raw`Kleene's recursion theorem: every computable transformation of programs fixes the behaviour of some program, which is why quines exist.` },
    { id: 'pl-2.9', note: String.raw`In the λ-calculus fixed-point combinators such as $Y$ produce recursion out of nothing.` },
    { id: 'cg-11.3', note: String.raw`The rendering equation describes light as a fixed point: outgoing light equals emitted light plus reflected incoming light. Path tracing iterates the contraction.` },
  ],
};
