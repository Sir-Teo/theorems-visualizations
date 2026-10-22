import * as V from './ch06.ui.shared.js';
const SOURCE='https://pages.uoregon.edu/dlevin/MARKOV/markovmixing.pdf';
export default {collection:'stoch',chapter:6,items:[
 {num:'6.8',kind:'Definition',name:'Spectral gap and relaxation time',
 statement:String.raw`For a finite irreducible reversible chain with ordered eigenvalues $1=\lambda_1>\lambda_2\ge\cdots\ge\lambda_N$, the ordinary spectral gap is $\gamma=1-\lambda_2$. Set
$$\lambda_* = \max_{j\ge2}|\lambda_j|,\qquad \gamma_*=1-\lambda_*.$$
The **relaxation time** is $t_{\rm rel}=1/\gamma_*$, taken as infinite when $\gamma_*=0$. For aperiodic chains $\gamma_*>0$. A chain with $P(x,x)\ge1/2$ is lazy, has nonnegative spectrum, and satisfies $\gamma=\gamma_*$. In general these two gaps differ.`,
 idea:String.raw`Expand a centered function in the weighted eigenbasis. Each coefficient is multiplied by $\lambda_j^t$, so its variance decreases by at most $\lambda_*^{2t}$. A negative eigenvalue near −1 decays slowly while changing sign, which is why the modulus matters. Laziness writes $P=(I+Q)/2$ for another Markov kernel and moves the whole spectrum into $[0,1]$.`,
 caption:'Vary the probability of switching between two states. Near zero the chain hardly moves; near one it nearly alternates. Compare the two gaps and watch the signed eigenmode and its absolute envelope.',
 scope:'At switching probability 0 the chain is reducible; at 1 it is periodic. Both endpoint failures are identified explicitly. Raw positive probabilities are not rounded to zero before classifying them.',
 deps:['stoch-6.7'],refs:['LPW 2nd ed. §12.2, p. 163'],links:{source:SOURCE},tags:['spectral gap','relaxation'],viz:V.gaps},
 {num:'6.9',kind:'Theorem',name:'Relaxation time controls the mixing time',
 statement:String.raw`For a finite irreducible aperiodic reversible chain, let $\pi_{\min}=\min_x\pi(x)$ and use the **absolute** gap in $t_{\rm rel}$. For $0<\varepsilon<1/2$,
$$L_\varepsilon=(t_{\rm rel}-1)\log\frac1{2\varepsilon},$$
$$U_\varepsilon=\left\lceil t_{\rm rel}\log\frac1{\varepsilon\pi_{\min}}\right\rceil,$$
$$L_\varepsilon\le t_{\rm mix}(\varepsilon)\le U_\varepsilon.$$
The ceiling is retained because mixing time is integer valued. More precise spectral estimates may improve this upper bound.`,
 idea:String.raw`An eigenfunction attaining the largest nonconstant modulus yields $2d(t)\ge\lambda_*^t$, which implies the lower bound using $-\log(1-\gamma_*)\le\gamma_*/(1-\gamma_*)$; when $\lambda_*=0$ the stated lower bound is zero. Cauchy–Schwarz in the spectral expansion bounds the relative kernel error by $\lambda_*^t/\pi_{\min}$. Bounding this by $e^{-t/t_{\rm rel}}/\pi_{\min}$ gives the sufficient integer time above.`,
 caption:'Choose a finite chain and tolerance. Directly maximize TV over every starting state and locate its first threshold crossing. Compare that actual time with the spectral lower bound and the rounded upper bound.',
 scope:'The displayed choices are irreducible, reversible and lazy. The entire finite transition matrix is evolved, not one assumed worst starting point. “Not reached” would mean the finite computation horizon was exhausted.',
 deps:['stoch-6.8','stoch-5.3'],refs:['LPW 2nd ed. §12.2, Theorems 12.4–12.5, pp. 163–165'],links:{source:SOURCE},tags:['mixing time','spectral bounds'],viz:V.bounds},
 {num:'6.10',kind:'Theorem',name:'Eigenvalues of walks on the cycle and the hypercube',
 statement:String.raw`The nearest-neighbor walk on the cycle $\mathbb Z/n\mathbb Z$ has Fourier eigenfunctions $x\mapsto e^{2\pi ikx/n}$ and eigenvalues $\cos(2\pi k/n)$. The walk on $\{0,1\}^d$ that flips one uniformly chosen coordinate has Walsh eigenfunctions
$$f_A(x)=(-1)^{\sum_{j\in A}x_j}$$
with eigenvalue $1-2|A|/d$, of multiplicity $\binom d{|A|}$. Adding holding probability $h$ changes every eigenvalue $\lambda$ to $h+(1-h)\lambda$. In particular the half-lazy cube has eigenvalues $1-|A|/d$.`,
 idea:String.raw`A cycle step multiplies a Fourier character by $e^{2\pi ik/n}$ or its inverse; their average is the cosine. For a Walsh character, flipping a coordinate in $A$ changes its sign and flipping outside $A$ preserves it. Averaging these two cases gives the cube eigenvalue. There are $\binom d k$ subsets of weight $k$, so all $2^d$ dimensions are accounted for.`,
 caption:'Switch between cycle Fourier modes and cube Walsh characters, and turn laziness on or off. Compare a selected real eigenfunction with its one-step average and the predicted eigenvalue multiple.',
 scope:'The cycle display uses the real cosine part of a Fourier character. The cube display uses all 16 states of a four-dimensional cube. Non-lazy even cycles and cubes retain an eigenvalue −1 and are periodic.',
 deps:['stoch-6.7','algo-4.10'],refs:['LPW 2nd ed. §§12.3–12.4, Example 12.16, pp. 166–172'],links:{source:SOURCE},tags:['Fourier basis','Walsh basis'],viz:V.walkModes},
 {num:'6.11',kind:'Definition',name:'Dirichlet form and the variational spectral gap',
 statement:String.raw`For a finite irreducible reversible kernel with stationary law $\pi$, define $Q(x,y)=\pi(x)P(x,y)$ and
$$\begin{gathered}\mathcal E(f)=\\\frac12\sum_{x,y}Q(x,y)[f(x)-f(y)]^2.\end{gathered}$$
Then $\mathcal E(f)=\langle f,(I-P)f\rangle_\pi$, and the **ordinary** gap satisfies
$$\gamma=\min_{\operatorname{Var}_\pi(f)>0}\frac{\mathcal E(f)}{\operatorname{Var}_\pi(f)}.$$
Every nonconstant test function gives an upper bound on $\gamma$; a constant has zero variance and an undefined quotient.`,
 idea:String.raw`Expand the squared differences, using stationarity to combine the two diagonal terms. Subtracting the mean changes neither energy nor variance. In the weighted eigenbasis the quotient is a weighted average of $1-\lambda_j$ for $j\ge2$, whose minimum is $1-\lambda_2$ and is attained by a corresponding eigenfunction. This variational identity is about the ordinary gap, not the absolute one.`,
 caption:'Edit the four function values and compare its energy-to-variance ratio with the spectral gap. Switch to a gap eigenfunction to see equality. If all values coincide, the quotient is shown as undefined.',
 scope:'Values are evaluated with the nonuniform stationary weights. The example does not assert that arbitrary gradient steps converge to the minimizing eigenspace.',
 deps:['stoch-6.8'],refs:['LPW 2nd ed. §13.2.1, Lemmas 13.6–13.7, pp. 181–182'],links:{source:SOURCE},tags:['Dirichlet energy','Rayleigh quotient'],viz:V.dirichlet},
 {num:'6.12',kind:'Theorem',name:'Cheeger’s inequality for Markov chains',
 statement:String.raw`For a finite irreducible reversible chain, put $Q(x,y)=\pi(x)P(x,y)$ and
$$\Phi=\min_{0<\pi(S)\le1/2}\frac{Q(S,S^c)}{\pi(S)}.$$
Its ordinary gap obeys
$$\frac{\Phi^2}{2}\le\gamma\le2\Phi.$$
Laziness is not needed for this ordinary-gap inequality. Mixing-time conclusions require the absolute gap or an additional laziness assumption.`,
 idea:String.raw`The indicator of a minimizing set has energy $Q(S,S^c)$ and variance $\pi(S)(1-\pi(S))$, giving the upper bound. For the lower bound, truncate a gap eigenfunction on its positive or negative side whose support has mass at most one half. Summing boundary flows of its level sets gives $\Phi\|g\|_\pi^2\le\frac12\sum_{x,y}Q(x,y)|g(x)^2-g(y)^2|$. Cauchy–Schwarz bounds the right side by $\sqrt{2\mathcal E(g)\|g\|_\pi^2}$; the eigenfunction relation gives $\mathcal E(g)\le\gamma\|g\|_\pi^2$. Combining these proves $\Phi^2\le2\gamma$.`,
 caption:'Adjust the connection between two three-state rooms. Every eligible subset is searched, the minimizing cut is drawn, and the exact finite spectrum is compared with both Cheeger bounds.',
 scope:'The finite six-state weighted graph has uniform stationarity and a half holding probability. The search is exhaustive over subsets; eigenvalues are numerical, so displayed residuals remain numerical evidence.',
 deps:['stoch-6.11','stoch-5.10'],refs:['LPW 2nd ed. §13.2.2, Theorem 13.10, pp. 183–186'],links:{source:SOURCE},tags:['conductance','Cheeger inequality'],viz:V.cheeger},
 {num:'6.13',kind:'Theorem',name:'Comparison of chains and canonical paths',
 statement:String.raw`Let $P$ and $\widetilde P$ be finite irreducible reversible chains with the **same** stationary law $\pi$. Route each ordered transition $(x,y)$ of $\widetilde P$ along a simple path $\Gamma_{xy}$ using positive-probability directed edges of $P$. Define
For a directed edge $e=(u,v)$, put
$$L(e)=\sum_{\Gamma_{xy}\ni e}\pi(x)\widetilde P(x,y)|\Gamma_{xy}|.$$
With $Q(e)=\pi(u)P(u,v)$, define $\rho=\max_e L(e)/Q(e)$ over non-loop edges with positive capacity.
Then $\widetilde{\mathcal E}(f)\le\rho\mathcal E(f)$ and $\gamma(P)\ge\gamma(\widetilde P)/\rho$. For the independent refresh chain $\widetilde P(x,y)=\pi(y)$, this gives $\gamma(P)\ge1/\rho$.`,
 idea:String.raw`Write $f(x)-f(y)$ as a telescoping sum along the path. Cauchy–Schwarz bounds its square by path length times the sum of edge differences squared. Exchange the transition sum with the edge sum and use the maximum ratio to compare energies. Divide by their common stationary variance and minimize. Different stationary laws need additional measure-comparison factors; a route repeating an edge must count every occurrence.`,
 caption:'Route every ordered pair through a lazy path or cycle. Inspect one selected route and the load on directed edges. The largest load-to-capacity ratio gives the displayed lower bound on the ordinary gap.',
 scope:'The comparison chain independently refreshes to the uniform law, with gap one. Breadth-first search supplies deterministic simple shortest paths. Edge drawings combine directions visually; the maximization itself uses directed capacities.',
 deps:['stoch-6.11'],refs:['LPW 2nd ed. §§13.3–13.4, Theorem 13.20 and Corollary 13.21, pp. 188–191'],links:{source:SOURCE},tags:['canonical paths','comparison'],viz:V.paths},
 {num:'6.14',kind:'Concept',name:'Expander graphs and rapid mixing',
 statement:String.raw`A family of connected regular graphs with a fixed degree, growing vertex count $N$, and conductance uniformly bounded below by $\phi>0$ is an **expander family**. For their half-lazy random walks, Cheeger gives $\gamma_* =\gamma\ge\phi^2/2$ and hence
$$\begin{gathered}t_{\rm mix}(\varepsilon)\\\le\left\lceil\frac{2}{\phi^2}\log\frac{N}{\varepsilon}\right\rceil.\end{gathered}$$
For fixed tolerance this is $O(\log N)$. A good-looking finite random graph does not prove a uniform family bound. Non-lazy walks on bipartite graphs are periodic.`,
 idea:String.raw`Regularity makes the stationary law uniform. A uniform conductance bound prevents large nearly isolated pieces, and Cheeger converts it into a size-independent ordinary gap. Laziness converts that to an absolute-gap bound, after which the only size dependence in the mixing estimate is $\log(1/\pi_{\min})=\log N$. A cycle instead has a gap of order $N^{-2}$.`,
 caption:'Generate a finite bipartite 3-regular multigraph and compare its half-lazy walk with a cycle of the same size. The graph, spectrum and worst-start TV are computed from its actual edges. Disconnected samples are reported.',
 scope:'Three perfect matchings generate the multigraph; parallel edges count with their multiplicity, so this is not a uniform sample of simple 3-regular graphs. Every displayed sample is finite. No sampled spectral gap certifies an expander family.',
 deps:['stoch-6.12','stoch-6.9'],refs:['LPW 2nd ed. §13.6, Proposition 13.35, pp. 196–198'],links:{source:SOURCE},tags:['expanders','rapid mixing'],viz:V.expanders},
 {num:'6.15',kind:'Paper',name:'Trailing the dovetail shuffle to its lair',
 paper:{authors:'Dave Bayer and Persi Diaconis',year:1992,title:'Trailing the Dovetail Shuffle to its Lair',venue:'The Annals of Applied Probability 2 (2): 294–313',doi:'10.1214/aoap/1177005705'},introduces:['stoch-6.4'],
 statement:String.raw`Bayer and Diaconis analyze ideal riffle shuffling through $a$-shuffles, rising sequences and Eulerian numbers. Composition multiplies the shuffle parameters, and a permutation with $r$ rising sequences has probability $a^{-n}\binom{a+n-r}{n}$. Their exact finite formula yields the familiar 52-card distances near 0.924, 0.614, 0.334 and 0.167 after five, six, seven and eight riffles. Their asymptotic analysis locates the riffle transition near $\tfrac32\log_2 n$ shuffles, with a bounded-width window. This is a logarithmic number of whole-deck riffles, not $n\log n$ single-card moves.`,
 idea:String.raw`Stable sorting independent packet labels realizes the inverse shuffle and makes composition transparent. Counting labelings compatible with a permutation produces its likelihood, and Eulerian counts aggregate that likelihood by rising-sequence class. The paper then uses the asymptotic distribution of those class counts to derive the transition profile. Its algebraic and card-trick sections go beyond the probability calculation shown here; the display does not reproduce every result or every experiment in the paper.`,
 caption:'Generate labels for an inverse shuffle, invert the resulting permutation to obtain a forward shuffle, and count its rising sequences. Compare the complete computed class law with uniformity; the readout also distinguishes the paper’s rounded 52-card table from a fresh numerical evaluation.',
 scope:'The plotted class probabilities are exhaustive formula values, not frequencies from the one displayed deck. The paper’s rounded values 1.000 for early shuffles are not assertions of exactly unit distance. Seven riffles do not reach the conventional TV tolerance 1/4.',
 deps:['stoch-1.9','stoch-5.1'],refs:['Bayer and Diaconis (1992), actual pp. 294–313; Lemma 1, Theorems 3–4, Tables 1 and 3'],links:{source:'https://www.stat.berkeley.edu/users/aldous/157/Papers/bayer_diaconis.pdf',doi:'https://doi.org/10.1214/aoap/1177005705'},tags:['riffle shuffle','primary paper'],viz:V.paper},
]};
