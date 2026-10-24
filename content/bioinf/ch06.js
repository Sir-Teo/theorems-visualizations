// Own derivations and synthetic alignments; source access boundaries remain explicit.
import * as V from './ch06.viz.js';
const source='https://www.mcb111.org/w06/durbin_book.pdf';
export default {collection:'bioinf',chapter:6,title:'Probabilistic phylogenetics',
 summary:String.raw`A probabilistic tree assigns probabilities to observed sequence columns by summing over unobserved ancestral states. Pruning makes this sum practical, and reversibility explains why a sequence likelihood can leave the root unidentified. Rate mixtures, column bootstraps and a finite Bayesian sampler expose different kinds of uncertainty. A binary long-branch experiment distinguishes likelihood from parsimony, while neutral genealogies explain why even correctly inferred gene trees can disagree with a species history.`,
 items:[
 {num:'6.1',kind:'Concept',name:'Likelihood of a tree',deps:['bioinf-5.7'],
 statement:String.raw`Fix a rooted tree, edge lengths, root frequencies $\pi$ and transition matrices $P_e$. Given one observed tip column x, its likelihood is
$$L(x)=\sum_{a}\pi_{a_r}\prod_{u\to w}P_{uw}(a_u,a_w),$$
where a ranges over all assignments of ancestral states, with the tip states fixed to x. Independent sites multiply these likelihoods; their log likelihoods add. In the stationary JC model used here, an edge of length d has
$$P_{ij}(d)=\tfrac14+\left(\mathbf1_{i=j}-\tfrac14\right)e^{-4d/3}.$$
Lengths count expected substitutions per site, as in lesson 5.7.`,
 idea:String.raw`Condition on every hidden ancestral state. The Markov tree factorization gives one root probability times one transition probability per edge. These hidden assignments are disjoint possibilities, so the law of total probability adds their joint probabilities.

An assignment’s joint probability divided by L is its conditional probability given the observed column and the specified tree model. Selecting the best assignment would replace a sum by a maximum and answer a different question. A four-tip rooted binary tree has three hidden nodes and 64 DNA assignments.`,
 caption:String.raw`Change the observed bases, common branch length and split. Inspect one ancestral assignment on the tree and its share of the likelihood among all 64 assignments. At zero length, discordant tips have exactly zero likelihood.`,
 scope:String.raw`Four authored taxa, stationary JC evolution, independent sites and no gaps, ambiguity or observed biological data. Positions show topology, not branch length. The root divides the declared unrooted internal path into two edges; in this first view both halves and each pendant edge are assigned the common length through the displayed rooted construction. Likelihood is a probability of data conditional on parameters, not a probability that a tree is true. Zero likelihood has no conditional ancestral distribution.`,
 refs:['Durbin et al. (1998), §8.3, printed pp. 199–201; own JC enumeration'],links:{source},viz:V.likelihoodSum},
 {num:'6.2',kind:'Algorithm',name:'Felsenstein’s pruning algorithm',deps:['bioinf-6.1','bioinf-5.11'],
 statement:String.raw`For a node u and state i, let $F_u(i)$ be the likelihood of the observed tips below u conditional on that state. At a tip with base x, $F_u(i)=\mathbf1_{i=x}$. At an internal node,
$$F_u(i)=\prod_{w\text{ child of }u}m_w(i),$$
$$m_w(i)=\sum_jP_{uw}(i,j)F_w(j).$$
Finally $L=\sum_i\pi_iF_r(i)$. A postorder traversal computes child vectors before their parent. With S sites, K states and n tips, a binary tree needs $O(SnK^2)$ arithmetic operations rather than enumerating $K^{n-1}$ ancestral assignments per site.`,
 idea:String.raw`Once the parent state is fixed, child subtrees are conditionally independent. Sum a child’s hidden state against the edge transition, then multiply the resulting messages from different children. Distributivity reorganizes exactly the same total-probability sum as 6.1; each subtree calculation is reused for all ancestral assignments above it.

Sankoff’s algorithm in 5.11 has the same tree dependency but a different algebra: minimum and addition replace sum and multiplication. Here messages are computed in log space, with negative infinity retaining exact impossibility. The selected vector is divided by its largest component solely for display; its log scale is reported separately.`,
 caption:String.raw`Step through the actual postorder on balanced or comb-shaped trees. The active node and incoming edge identify the displayed four-component conditional vector; increase taxon count and compare the actual transition-term count with the exponential assignment count.`,
 scope:String.raw`JC evolution on 2–16 tips with declared synthetic observations. A conditional subtree vector is not an ancestral posterior, because observations elsewhere in the tree have not been conditioned on. The operation count includes all four-by-four transition terms on every edge, including zeros. Log computations retain a finite log likelihood even when its ordinary probability underflows. Tree positions are schematic.`,
 refs:['Durbin et al. (1998), §8.3, printed pp. 200–201, pruning algorithm and equation 8.10; own log-domain implementation'],links:{source},viz:V.pruning},
 {num:'6.3',kind:'Theorem',name:'Reversibility and the pulley principle',deps:['bioinf-6.2','stoch-4.12'],
 statement:String.raw`Suppose a homogeneous continuous-time substitution process has positive stationary frequencies $\pi$ and is reversible:
$$\pi_iP_{ij}(t)=\pi_jP_{ji}(t).$$
Use $\pi$ at the root. Moving the root along a fixed unrooted tree, preserving each total edge length, leaves the likelihood of its tip data unchanged. Thus this sequence model identifies an unrooted tree, not its root. The result requires stationarity at the root and reversibility; it does not apply to every stationary chain.`,
 idea:String.raw`Move a root across an edge. The factor involving its two endpoint states changes from $\pi_iP_{ij}(t)$ to $\pi_jP_{ji}(t)$, which is equal by detailed balance, while other factors remain unchanged. For a root inside an edge, sum its state and use the semigroup identity to combine the two subedge times. Repeated moves establish the result for any root position.

The equal-input model has off-diagonal generator entries $Q_{ij}=\pi_j/c$, with $c=1-\sum\pi_i^2$, so its stationary mean substitution rate is one. The comparison process moves clockwise and counterclockwise around A,G,C,T at unequal rates. It has uniform stationary frequencies but violates detailed balance when its imbalance is positive.`,
 caption:String.raw`Slide the root along a fixed internal edge and compare the likelihood curve for reversible equal-input evolution with a stationary directed cycle. Change the composition or cycle imbalance; zero imbalance restores reversibility.`,
 scope:String.raw`The same outward generator is used after every rerooting. Reversing the generator along reversed edges would define a different experiment. A nonreversible model need not change the likelihood for every possible observed pattern, but invariance is no longer guaranteed. Tree geometry is schematic; the two internal times sum to the declared fixed length. Dated tips, clocks and outgroups add assumptions beyond this sequence likelihood.`,
 refs:['Durbin et al. (1998), §8.3, printed pp. 202–204, detailed balance and root movement; stoch 4.12; own mean-rate normalization'],links:{source},viz:V.pulley},
 {num:'6.4',kind:'Concept',name:'Rate heterogeneity across sites',deps:['bioinf-6.1'],
 statement:String.raw`Let a site rate R have a Gamma distribution with shape $\alpha>0$ and rate $\alpha$, so $\mathbb ER=1$. The same R multiplies every edge at that site:
$$L(x)=\int L(x\mid r)\,g_\alpha(r)\,dr.$$
For a pair separated by total JC path length d,
$$a_d=\left(1+\frac{4d}{3\alpha}\right)^{-\alpha},$$
$$P(\text{match})=\tfrac14+\tfrac34a_d.$$
Fitting a homogeneous JC path to this population mismatch gives
$$d_{\rm JC}=\frac{3\alpha}{4}\log\left(1+\frac{4d}{3\alpha}\right),$$
with $d_{\rm JC}<d$
for d>0 and finite $\alpha$. This is a population pair-distance comparison, not a sign theorem about all fitted tree parameters.`,
 idea:String.raw`A small Gamma shape puts much probability near zero while leaving a long right tail. The Laplace transform is $\mathbb E e^{-sR}=(1+s/\alpha)^{-\alpha}$; substitute $s=4d/3$ into the conditional JC match probability. Inverting the homogeneous mismatch formula yields the displayed distance. The strict inequality follows from $\log(1+x)<x$ for x>0.

Mix the whole site likelihood, after applying the shared rate to every branch. Averaging each branch matrix separately instead gives independent branch rates within a site. The two half-path comparison makes their difference visible without a tree-optimization confound.`,
 caption:String.raw`Draw actual Gamma site rates and matching outcomes, change their shape and path length, and compare shared-rate, constant-rate and separately mixed half-path predictions. Finite rate-bin averages avoid pretending that the density at zero is bounded.`,
 scope:String.raw`Independent synthetic sites with one common rate per site, Gamma mean one, shape 0.1–8 and total pair length 0–4 expected substitutions/site. The displayed rate range ends at 4; its omitted probability and actual sample fraction are reported without renormalizing the visible bins. A finite alignment’s inferred distance can fluctuate in either direction. No gamma-category tree fit or empirical alignment is claimed.`,
 refs:['Durbin et al. (1998), §8.5, printed pp. 214–217, especially equations 8.24–8.25; own pair Laplace-transform derivation'],links:{source},viz:V.rates},
 {num:'6.5',kind:'Method',name:'Bootstrap support for clades',deps:['bioinf-5.5','stat-9.2'],
 statement:String.raw`For an alignment of N columns, a nonparametric column bootstrap draws N indices independently and uniformly with replacement and rebuilds a tree from the resampled columns. With B replicates, the support assigned here to clade C is
$$\widehat s_C=\frac1B\sum_{b=1}^BI_b(C),$$
where $I_b(C)=1$ if replicate b has a unique fitted tree containing C, and zero otherwise.
Tied quartet splits are recorded as unresolved and retain their place in B. Neighbour-joining produces an unrooted split; a declared outgroup D is used here to interpret AB|CD, AC|BD and AD|BC as clades AB, AC and BC respectively.`,
 idea:String.raw`The empirical distribution of whole columns preserves the observed within-column relationships between taxa. Rebuilding a tree after every resample asks how stable that inference procedure is under this empirical resampling distribution. Increasing B reduces conditional Monte Carlo noise; it does not add observed sites or remove model bias.

This quartet uses raw mismatch fractions. At four taxa, minimizing NJ’s Q is equivalent to minimizing the within-split distance sum. Integer mismatch counts preserve exact ties before division by N. Choosing a canonical refinement of every tie could manufacture 100% support from constant data; explicitly unresolved ties avoid that artifact.`,
 caption:String.raw`Inspect original or resampled columns, including duplicated source indices, and step through actual bootstrap replicates. The selected unique clade is marked on a tree rooted with D as outgroup; tied replicates show an unresolved tree.`,
 scope:String.raw`Independent synthetic JC columns, raw mismatch NJ distances, one fixed outgroup assumption, and no saturation correction. Support is conditional algorithm stability; it is neither a posterior probability nor a universal frequentist coverage statement for a tree. Column dependence, alignment uncertainty and model misspecification need separate treatment. All N columns enter each calculation, although only the first 12 are drawn.`,
 refs:['Durbin et al. (1998), printed p. 179 and §8.5 pp. 212–214; actual stat 9.2 column-bootstrap specialization; own quartet NJ tie accounting'],links:{source},viz:V.bootstraps},
 {num:'6.6',kind:'Method',name:'Bayesian phylogenetics by MCMC',deps:['bioinf-6.1','stoch-7.2'],
 statement:String.raw`A Bayesian tree posterior is proportional to likelihood times prior. The finite teaching target here has three unrooted topologies T and 21 internal lengths $d\in\{0,0.1,\ldots,2\}$, with known pendant lengths and
$$p(T,d\mid X)\propto L(X\mid T,d)e^{-\lambda d}.$$
For a symmetric proposal, accept a proposed state y from x with probability
$$r(x,y)=p(y\mid X)/p(x\mid X),$$
$$a(x,y)=\min\{1,r(x,y)\}.$$
A rejected proposal leaves x in the chain again. The exact 63-state posterior can be enumerated and compared with sampled frequencies.`,
 idea:String.raw`Choose either of the two other topologies with probability 1/4 each, or one of the two neighbouring length indices with probability 1/4 each. An off-grid move proposes the current state. Each off-diagonal proposal has the same reverse probability. Hence posterior mass times accepted transition probability equals the smaller of the two directed proposed masses, proving detailed balance.

Every state communicates through topology and grid moves, all targets are positive for these pendant lengths, and boundary self-loops make the finite chain aperiodic. Its long-run frequencies therefore approach the declared target. Keeping only accepted moves would instead sample a biased jump chain. Burn-in and a finite trace alone do not prove adequate exploration.`,
 caption:String.raw`Compare an actual Metropolis chain prefix with the exactly enumerated finite-grid posterior. Change the discrete prior, chain seed and retained window; repeated states remain in both the trace and the frequency denominator.`,
 scope:String.raw`Known pendant lengths 0.08, 0.25, 0.08, 0.25; synthetic JC alignment; discrete internal-length prior and uniform topology prior. This is not a full continuous posterior over five unknown edges or substitution parameters. Data and chain seeds are separate. Burn-in is a fraction of the full run; a prefix ending before its cutoff has no retained fraction. No independent-sample confidence interval is imposed on a correlated chain. The planned stoch 7.2 dependency is supplemented by the finite detailed-balance argument given here.`,
 refs:['Durbin et al. (1998), §8.4, printed pp. 206–208; finite-target proof and proposal constructed here'],links:{source},viz:V.mcmc},
 {num:'6.7',kind:'Phenomenon',name:'Likelihood is consistent in the Felsenstein zone',deps:['bioinf-6.2','bioinf-5.13'],
 statement:String.raw`Return to the binary CFN quartet of 5.13: the generating split is AB|CD, with pendant flip probabilities $(p,q,p,q)$ and internal flip probability r. At $(p,q,r)=(0.4,0.01,0.01)$, expected parsimony scores favour the wrong long-branch split AC|BD. Correctly specified likelihood instead has a population maximum at the generating distribution because
$$\begin{aligned}\Delta={}&\mathbb E_P\log P(X)\\&-\mathbb E_P\log Q(X),\end{aligned}$$
$$\Delta=D_{\rm KL}(P\Vert Q)\ge0.$$
With identifiable topology, independent sites and a global maximum over the declared compact model family, likelihood topology selection is consistent. Finite samples need not select the generating split or improve monotonically.`,
 idea:String.raw`Parsimony discounts no-change and multiple-change probabilities; frequent independent changes on A and C can therefore make their shared state look like ancestry. Likelihood weights each pattern under an explicit substitution law. The law of large numbers makes empirical pattern frequencies approach their population values; the KL comparison then separates an identifiable generating topology from alternatives.

Here all pendant probabilities are known, and each candidate profiles only its internal edge. Write its retention as $z=1-2r\in[0,1]$. Every pattern probability is affine in z, so the sum of log pattern probabilities is concave. Endpoint derivative tests and monotone bisection give a global one-dimensional maximum for each topology. This supplies an actual profile likelihood, without claiming a global five-edge fit.`,
 caption:String.raw`Accumulate the same actual binary alignment prefixes for parsimony and likelihood. Compare the sample score gaps with their population limits; change long and short branches to enter or leave the region where parsimony favours AC|BD.`,
 scope:String.raw`The exact authored binary example from 5.13, not original 1978 data or DNA observations. Known pendant probabilities, fitted internal flip probability 0–0.5, fair binary root and independent sites. Positive internal length and nonsaturated pendants identify the generating split; r=0 is a star without a unique resolved generating topology, although finite fits may still overresolve it. Degenerate zero-probability models retain impossible-pattern status. Counts do not establish a general optimization guarantee for richer phylogenetic models.`,
 refs:['Durbin et al. (1998), §8.6, printed pp. 224–227; actual bioinf 5.13 construction; own affine-profile and KL argument'],links:{source},viz:V.felsensteinZone},
 {num:'6.8',kind:'Concept',name:'Gene trees versus species trees',deps:['bioinf-6.1','popgen-10.2'],
 statement:String.raw`Sample one neutral gene copy from each of three species with species history ((A,B),C). Let the internal ancestral-population interval have length $\tau\ge0$ in units of $2N_e$ diploid generations, with constant effective size in these units. Under the three-lineage coalescent,
$$\Pr(AB\text{ first})=1-\tfrac23e^{-\tau},$$
$$\Pr(AC\text{ first})=\tfrac13e^{-\tau},$$
$$\Pr(BC\text{ first})=\tfrac13e^{-\tau}.$$
Thus a gene genealogy can disagree with the species tree through incomplete lineage sorting, even when both its sequence model and inference are correct. At $\tau=0$ the species history is an unresolved star.`,
 idea:String.raw`A pair of lineages in one ancestral population coalesces at rate 1 in $2N_e$ time units. AB fails to coalesce during the internal interval with probability $e^{-\tau}$. Conditional on failure, three lineages enter the common ancestor; three exchangeable pair hazards make each first pair equally likely. Add the early AB event to one third of the failure probability.

The simulator uses an exponential waiting time for AB in its population. After failure, the first ancestral event has rate 3 and a uniform first pair; the final two lineages wait at rate 1. If AB coalesces early, its remaining lineage and C can meet only after the deeper population boundary. The planned coalescent dependency is supplied locally at this three-lineage level.`,
 caption:String.raw`Shorten the internal species-population interval, draw independent locus genealogies and select an actual locus. Compare its correctly ordered coalescence events and the observed topology fractions with the exact probabilities.`,
 scope:String.raw`Kingman’s neutral large-population approximation, one gene copy per species, constant matched effective-size units, independent loci, no migration and no recombination within a locus. Species A/B join at time 1, and C joins at $1+\tau$, before-sampling units of $2N_e$ generations. Horizontal positions and joining slopes are schematic; vertical event times are simulated. No empirical species tree or population size is fitted, and discordance alone does not establish gene flow.`,
 refs:['Felsenstein, Theoretical Evolutionary Genetics (December 2019), X.4, selected printed pp. 464,466–467; own three-lineage species-interval derivation'],links:{source:'https://felsenst.github.io/pgbook/pgbook.pdf'},viz:V.genealogies},
 {num:'6.9',kind:'Paper',name:'Evolutionary Trees from DNA Sequences',deps:['bioinf-6.1','bioinf-5.7'],
 paper:{authors:'Joseph Felsenstein',year:1981,title:'Evolutionary trees from DNA sequences: A maximum likelihood approach',venue:'Journal of Molecular Evolution 17 (6): 368–376',doi:'10.1007/BF01734359'},introduces:['bioinf-6.2','bioinf-6.3'],verify:true,
 statement:String.raw`Felsenstein’s author bibliography records this 1981 maximum-likelihood paper. The selected modern Durbin exposition attributes the pruning calculation to Felsenstein (1981) and derives reversible root invariance. This lesson illustrates those ideas on a newly generated four-taxon JC alignment:
$$\ell(T,d)=\sum_x n_x\log L_T(x;d).$$
For each of three unrooted splits, four pendant lengths are treated as known and only the internal length $d\in[0,2]$ is fitted. The author-linked original PDF returned HTTP 503; its original body and numerical examples remain unverified.`,
 idea:String.raw`Pruning integrates ancestral states for each observed column. Collecting identical columns gives pattern counts $n_x$, which multiply log pattern likelihoods. Moving a stationary reversible root along the same edge does not change any column likelihood, and therefore does not change the alignment likelihood.

Set $z=e^{-4d/3}$. With the four pendant lengths fixed, each pattern probability has the form $(1-z)P_0(x)+zP_1(x)$, where $P_0$ and $P_1$ are the probabilities at fully mixed and zero-length internal transitions. Its log is concave in z. A global one-edge optimum for each topology follows from derivative signs and bisection on the declared interval, independently of a displayed curve’s sampling resolution.`,
 caption:String.raw`Inspect a selected synthetic column, slide the root, vary the candidate internal length and compare all three likelihood profiles and their actual one-edge maxima. The observation seed and column count alone determine the alignment; hypothesis controls do not regenerate it.`,
 scope:String.raw`A modern teaching construction using selected Durbin body passages and an author-verified bibliography. It does not reproduce the unread 1981 alignment, taxa, figure, table, implementation or fitted result. The four known pendant lengths 0.08, 0.25, 0.08, 0.25 are chosen here. A one-edge profile on [0,2] is not joint optimization of all branch lengths, a root estimator or a posterior over trees. The original-body uncertainty flag remains visible.`,
 refs:['Felsenstein author CV, 1981 bibliography and DOI; original body inaccessible HTTP 503','Durbin et al. (1998), §8.3, printed pp. 199–204; own synthetic JC one-edge profiles'],links:{author:'https://felsenst.github.io/felsenstein.cv.html',source},viz:V.paper}
 ]};
