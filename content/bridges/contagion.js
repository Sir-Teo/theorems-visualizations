// Bridge: one idea followed across collections and fields (see MASTER_PLAN.md §8).
export default {
  slug: 'contagion',
  title: 'How things spread: epidemics, rumours and riots',
  blurb: String.raw`A disease, a rumour, a fad and a bank run all spread from person to person, and the same mathematics decides whether they fizzle or explode: a threshold number of new cases per case, shaped by who is connected to whom.`,
  steps: [
    { id: 'soc-5.8', note: String.raw`Start with a branching process: each case causes a random number of new ones. For a nondegenerate Galton–Watson process, extinction is certain when the offspring mean is at most one; when it exceeds one, survival has positive probability.` },
    { id: 'mathbio-7.2', note: String.raw`That mean is the basic reproduction number $R_0$: new infections caused by one case in a fully susceptible population.` },
    { id: 'mathbio-7.3', note: String.raw`Kermack and McKendrick's threshold theorem: in the deterministic SIR model, infections initially grow when the susceptible fraction $s_0$ satisfies $R_0s_0 > 1$, and herd immunity begins at a fraction $1 - 1/R_0$ immune.` },
    { id: 'mathbio-7.6', note: String.raw`Epidemics overshoot: infections keep coming after the herd-immunity point, so far more than $1 - 1/R_0$ end up infected.` },
    { id: 'stoch-10.11', note: String.raw`With chance in the model, even an outbreak with $R_0 > 1$ can die out early; the probability of a major epidemic is the branching-process survival probability.` },
    { id: 'mathbio-7.12', note: String.raw`Seasonal forcing of contact rates turns the damped waves of an endemic disease into the regular recurrent outbreaks seen in measles.` },
    { id: 'soc-4.2', note: String.raw`On a random network a giant connected component appears suddenly at mean degree one: the same threshold, now as a phase transition in connectivity.` },
    { id: 'soc-5.9', note: String.raw`In network epidemic models, heterogeneous degrees can lower the invasion threshold; the result depends on the model, degree correlations and network size.` },
    { id: 'soc-1.8', note: String.raw`Behaviour spreads differently. In Granovetter's model each person joins a riot once enough others have, and the outcome hinges on the whole distribution of thresholds.` },
    { id: 'soc-1.9', note: String.raw`Change one person's threshold and a riot of hundreds can collapse to a handful: cascades are fragile.` },
    { id: 'soc-5.3', note: String.raw`Complex contagions need several exposures, so they spread through clustered, redundant ties rather than long-range shortcuts, the opposite of disease.` },
    { id: 'soc-5.4', note: String.raw`Information cascades: rational people who follow others' choices instead of their private signals can lock a whole crowd into the wrong answer.` },
  ],
};
