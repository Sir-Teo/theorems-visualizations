import * as V from './ch06.ui.shared.js';
export default {collection:'comb',chapter:6,items:[
  {
    num:'6.9',kind:'Theorem',name:'Partitions in a box and Gaussian coefficients',
    statement:String.raw`For integers $a,b\ge0$, let $L(a,b)$ be the partitions with at most $a$ parts and largest part at most $b$, including the empty partition. Then
$$\sum_{\lambda\in L(a,b)}q^{|\lambda|}=\binom{a+b}{a}_q.$$
The polynomial has degree $ab$, nonnegative integer coefficients and value $\binom{a+b}{a}$ at $q=1$. Rotating the complement of a diagram in its rectangle exchanges weight $r$ with weight $ab-r$.`,
    idea:String.raw`Separate the diagrams according to whether the top row has length $b$. If it does not, the diagram lies in an $a\times(b-1)$ box; if it does, removing that row leaves an $(a-1)\times b$ diagram and lowers the weight by $b$. Hence $P(a,b)=P(a,b-1)+q^bP(a-1,b)$, with $P(0,b)=P(a,0)=1$, exactly the Gaussian recurrence. The southeast boundary also gives a bijection with words containing $a$ north and $b$ east steps.`,
    caption:String.raw`Resize the box, including zero sides, and browse all of its diagrams. The orange boundary is the corresponding monotone path. Its area picks out the correct Gaussian coefficient, while the readout gives the rotated complement.`,
    deps:['comb-2.9','comb-6.2'],refs:['Stanley EC1 draft, Proposition 1.7.3, pp.65–67','Stanley, Topics in Algebraic Combinatorics, Propositions 6.2–6.3 and Theorem 6.6, pp.80–84'],links:{source:'https://math.mit.edu/~rstan/algcomb/algcomb.pdf'},tags:['partitions','q-analogues'],viz:V.box,
  },
  {
    num:'6.10',kind:'Theorem',name:'Unimodality of Gaussian coefficients',
    statement:String.raw`Write $\binom{a+b}{a}_q=\sum_{r=0}^{ab}c_rq^r$ for integers $a,b\ge0$. Its coefficients satisfy $c_r=c_{ab-r}$ and
$$c_0\le c_1\le\cdots\le c_{\lfloor ab/2\rfloor}.$$
They therefore form a symmetric unimodal sequence. Equal adjacent coefficients and a plateau of maximum coefficients are permitted; neither strict increase nor a unique peak is asserted.`,
    idea:String.raw`Regard the $ab$ cells as a Boolean lattice and let the group permute cells within rows and then permute the rows. Its subset orbits correspond to diagrams in the box by sorting row sizes. The Boolean up/down operators satisfy $DU-UD=(ab-2r)I$ on rank $r$ and $D=U^*$, so $\|Uv\|^2=\|Dv\|^2+(ab-2r)\|v\|^2$ proves injectivity below the midpoint. Since $U$ commutes with the group, it restricts injectively to invariant subspaces, whose dimensions are the orbit counts $c_r$; complement symmetry completes the conclusion.`,
    caption:String.raw`Choose consecutive levels below the midpoint. A computed matching gives every lower diagram its own upper diagram obtained by adding one cell. The coefficient plot can have a plateau; the finite matching illustrates the universal invariant-subspace proof.`,
    deps:['comb-6.9'],refs:['Stanley, Topics in Algebraic Combinatorics, Lemma 4.6 and Theorem 4.7, pp.51–53; Theorem 5.8, pp.63–66; Theorem 6.9 and Corollary 6.10, pp.85–87'],links:{source:'https://math.mit.edu/~rstan/algcomb/algcomb.pdf'},tags:['partitions','unimodality'],viz:V.unimodal,
  },
  {
    num:'6.11',kind:'Theorem',name:'MacMahon’s plane partition generating function',
    statement:String.raw`A plane partition is a finitely supported array of nonnegative integers $\pi_{ij}$, weakly decreasing along both rows and columns. Its volume is $|\pi|=\sum_{i,j}\pi_{ij}$. If $\operatorname{pp}(n)$ counts volume-$n$ arrays, including one empty array, define $P(q)=\sum_{n\ge0}\operatorname{pp}(n)q^n$. Then
$$P(q)=\prod_{k\ge1}(1-q^k)^{-k}.$$
For support in an $a\times b$ rectangle, with no height bound, the product is $\prod_{i=1}^a\prod_{j=1}^b(1-q^{i+j-1})^{-1}$. These are formal identities, also convergent for $|q|<1$.`,
    idea:String.raw`Stanley’s modified row-insertion correspondence sends a nonnegative $a\times b$ matrix $A$ to two column-strict plane partitions of the same shape, recording the row and column indices of each insertion. Merge corresponding columns along their common diagonal and conjugate each resulting row: this reversible construction gives a plane partition with volume $\sum_{i,j}(i+j-1)A_{ij}$ and the required support. Each matrix entry is now an independent geometric-series choice, proving the rectangular product. Letting both side lengths grow coefficientwise leaves exactly $k$ positions with $i+j-1=k$, giving exponent $-k$; the ordinary-partition product alone does not establish this new bijection.`,
    caption:String.raw`Browse every monotone height array of a small volume. Its unit cubes are drawn in a fixed isometric projection, and the exhaustive count is compared with the product coefficient. The empty stack is included; no analogous formula for solid partitions is implied.`,
    deps:['comb-6.1','comb-6.2','comb-4.1'],see:['comb-3.11','comb-7.3'],refs:['Stanley, Topics in Algebraic Combinatorics, Appendix 2 to ch.8, pp.147–155, especially Theorem 8.18 and Corollary 8.19','Pak §9.1.1, p.49'],links:{source:'https://math.mit.edu/~rstan/algcomb/algcomb.pdf'},tags:['plane partitions','generating functions'],viz:V.macmahon,
  },
]};
