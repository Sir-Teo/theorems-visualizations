// Bridge: one idea followed across collections and fields (see MASTER_PLAN.md §8).
export default {
  slug: 'contagion',
  title: 'How things spread: families, networks and crowds',
  blurb: String.raw`Spreading depends on reproduction, connectivity and the rule for joining in. Branching processes reveal when a lineage can survive; random graphs reveal when a large connected region appears; collective behavior shows why a crowd’s threshold cannot be reduced to one average.`,
  steps: [
    { id: 'mathbio-1.2', note: String.raw`With a constant per-capita growth rate, a deterministic population grows or shrinks exponentially. This is the baseline before limited resources, chance and interactions are added.` },
    { id: 'stoch-3.9', note: String.raw`A Galton–Watson process replaces smooth growth with independent random offspring. Its expected population is $\mu^n$, so mean offspring $\mu=1$ separates growing and shrinking expectations.` },
    { id: 'stoch-3.10', note: String.raw`Expectation alone does not determine survival: even with $\mu>1$, a lineage can die out. Under the stated nondegeneracy assumptions, the extinction probability is the smallest fixed point of the offspring generating function, and equals one for $\mu\le1$.` },
    { id: 'soc-4.2', note: String.raw`Exploring a sparse Erdős–Rényi graph locally resembles branching. In the large-network limit, a giant connected component appears above mean degree one; this is a connectivity threshold, not a universal threshold for disease or behavior on every network.` },
    { id: 'soc-2.7', note: String.raw`Social ties change what connectivity makes possible. Weak ties can bridge groups whose strong ties are redundant, providing access to information outside a person’s immediate circle.` },
    { id: 'soc-1.8', note: String.raw`Behaviour spreads differently. In Granovetter's model each person joins a riot once enough others have, and the outcome hinges on the whole distribution of thresholds.` },
    { id: 'soc-1.9', note: String.raw`Change one person's threshold and a riot of hundreds can collapse to a handful: cascades are fragile.` },
  ],
};
