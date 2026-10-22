import * as V from './ch06.ui.shared.js';
export default {
  collection:'comb',chapter:6,title:'Integer partitions',
  summary:String.raw`Multiplicities turn partitions into infinite products, while reflecting, splitting and moving cells explains identities between their coefficients. Cancellation leads from Euler’s pentagonal theorem to a fast exact recurrence; Jacobi and Rogers–Ramanujan reveal further product–series correspondences. Boxed diagrams connect partitions to Gaussian coefficients, and monotone height arrays give plane partitions.`,
  items:[
    {
      num:'6.1',kind:'Theorem',name:'Euler’s generating function for partitions',
      statement:String.raw`Let $p(n)$ count integer partitions of $n\ge0$, with $p(0)=1$. As an identity of formal power series,
$$\sum_{n\ge0}p(n)q^n=\prod_{k\ge1}(1-q^k)^{-1}.$$
Restricting the product to $1\le k\le m$ counts partitions with largest part at most $m$. A coefficient of degree $n$ uses only factors with $k\le n$. The same identity holds analytically for complex $|q|<1$.`,
      idea:String.raw`Choose $q^{km_k}$ from the geometric series for part size $k$. The choices are in bijection with the multiplicities $m_k\ge0$ of a partition, and their total exponent is $\sum k m_k$. For each prescribed exponent only finitely many choices matter, so the formal product is well defined by COMB 4.1. Absolute convergence for $|q|<1$ also permits the analytic interpretation.`,
      caption:String.raw`Change the largest allowed part and inspect a coefficient. The bars count the restricted product, the orange dots show unrestricted partition numbers, and the diagram is one actual contributing partition. The selector cycles through its complete finite list.`,
      deps:['comb-1.16','comb-4.1'],refs:['Stanley, EC1 second-edition draft (15 July 2011), §1.8, pp.68–71; Proposition 1.8.2'],links:{source:'https://math.mit.edu/~rstan/ec/ec1.pdf'},tags:['partitions','generating functions'],viz:V.euler,
    },
    {
      num:'6.2',kind:'Theorem',name:'Conjugation of partitions',
      statement:String.raw`For a partition $\lambda$, define $\lambda'_j=\#\{i:\lambda_i\ge j\}$. Then $\lambda'$ is a partition of the same integer and $(\lambda')'=\lambda$. Consequently partitions into exactly $k$ positive parts are equinumerous with partitions whose largest part is $k$, and the analogous statement holds with “at most $k$.” The empty partition has length and largest part zero.`,
      idea:String.raw`A cell at row $i$, column $j$ exists precisely when $j\le\lambda_i$. Exchange its two coordinates: the new row $j$ has exactly $\lambda'_j$ cells. This reflection is its own inverse and exchanges the first row with the first column; hence it preserves weight and swaps largest part with length.`,
      caption:String.raw`Browse a partition and move the reflection slider. At the endpoints the same cells give the original diagram and its conjugate. Intermediate positions show the geometric motion and may overlap.`,
      deps:['comb-1.16'],refs:['Stanley, Topics in Algebraic Combinatorics (1 February 2013), ch.6, pp.79–80'],links:{source:'https://math.mit.edu/~rstan/algcomb/algcomb.pdf'},tags:['partitions','bijections'],viz:V.conjugation,
    },
    {
      num:'6.3',kind:'Theorem',name:'Euler: distinct parts equal odd parts',
      statement:String.raw`For every $n\ge0$, the number of partitions of $n$ into pairwise distinct parts equals the number into odd parts, with arbitrary multiplicities. Equivalently,
$$\prod_{k\ge1}(1+q^k)=\prod_{j\ge1}(1-q^{2j-1})^{-1}.$$
Both empty partitions are included at $n=0$.`,
      idea:String.raw`Use $1+q^k=(1-q^{2k})/(1-q^k)$: cancellation of the even factors leaves exactly the odd-part product. Coefficientwise cancellation is legitimate by local finiteness. For a bijection, write each odd part’s multiplicity in binary and replace a digit in position $j$ by one part $2^j$ times that odd part; distinct powers of two times odd integers have unique factorizations.`,
      caption:String.raw`Choose either class as the starting list. Each diagram is carried to its actual partner by binary splitting or merging, so the displayed correspondence preserves the total weight and has an explicit inverse.`,
      deps:['comb-6.1'],refs:['Stanley EC1 draft, Proposition 1.8.5, pp.72–73','Pak, Partition Bijections, a Survey (2002 preprint), §§3.1–3.2, p.20'],links:{source:'https://www.math.ucla.edu/~pak/papers/psurvey.pdf'},tags:['partitions','bijections'],viz:V.oddDistinct,
    },
    {
      num:'6.4',kind:'Theorem',name:'Glaisher’s bijection',
      statement:String.raw`Fix an integer $d\ge2$. Partitions of $n$ with no part divisible by $d$ are in bijection with partitions of $n$ in which each part occurs fewer than $d$ times. If the multiplicity of a part $u$, with $d\nmid u$, is $m_u=\sum_{j\ge0}a_jd^j$, replace its copies by $a_j$ copies of $d^ju$, where $0\le a_j<d$. This preserves weight; $d$ need not be prime.`,
      idea:String.raw`Every positive integer has a unique expression $d^ju$ with $d\nmid u$, obtained by dividing by $d$ as long as possible. Thus output multiplicities from different input sizes never collide. The inverse splits each $d^ju$ into $d^j$ copies of $u$; uniqueness of base-$d$ digits then recovers the input and proves both directions. The case $d=2$ is Euler’s odd–distinct correspondence.`,
      caption:String.raw`Change the base and browse a partition with no divisible part. Its base-$d$ multiplicity digits determine the second diagram. The readout lists those digits and both diagrams are computed from the same partition.`,
      deps:['comb-6.3'],refs:['Pak, Partition Bijections, a Survey, §3.2.3, p.20; base-d extension of §3.2.1'],links:{source:'https://www.math.ucla.edu/~pak/papers/psurvey.pdf'},tags:['partitions','bijections'],viz:V.glaisher,
    },
    {
      num:'6.5',kind:'Theorem',name:'Euler’s pentagonal number theorem',
      statement:String.raw`Let $g_k=k(3k-1)/2$ for integers $k$. In formal power series,
$$\prod_{j\ge1}(1-q^j)=\sum_{k\in\mathbb Z}(-1)^kq^{g_k}.$$
The coefficient is $1$ at degree zero, $(-1)^r$ at each positive generalized pentagonal degree $r(3r-1)/2$ or $r(3r+1)/2$, and zero otherwise. Analytically the identity holds for $|q|<1$.`,
      idea:String.raw`The product is the signed count of distinct-part partitions, with sign $(-1)^{\ell(\lambda)}$. Franklin compares the smallest row length $s$ with the length $g$ of the consecutive descending run beginning at the largest part: if $s\le g$, remove the smallest row and add one cell to each of the first $s$ rows; otherwise remove one cell from each of the first $g$ rows and append a row of length $g$. These moves are inverse and reverse the sign except when all $r$ rows form the staircases $(2r-1,\ldots,r)$ or $(2r,\ldots,r+1)$, whose weights are the two pentagonal degrees. Together with the empty diagram, those are exactly the uncancelled objects by COMB 3.9.`,
      caption:String.raw`Choose a distinct-part partition. Gold marks the candidate smallest row and slope; the second panel shows the computed partner, or the exceptional fixed point. The signed count over the entire finite list is compared with direct product multiplication.`,
      deps:['comb-6.1','comb-3.9'],refs:['Stanley EC1 draft, Proposition 1.8.7, pp.76–78','Pak §§5.1–5.2, pp.29–31, corrected by Grinberg errata (9 May 2021), p.2'],links:{source:'https://math.mit.edu/~rstan/ec/ec1.pdf',errata:'https://www.math.ucla.edu/~pak/papers/pb-errata1.pdf'},tags:['partitions','involutions'],viz:V.pentagonal,
    },
    {
      num:'6.6',kind:'Theorem',name:'Euler’s recurrence for p(n)',
      statement:String.raw`Set $p(0)=1$ and $p(m)=0$ for negative integers $m$. For $n\ge1$, let $g_k^- = k(3k-1)/2$ and $g_k^+ = k(3k+1)/2$. Then
$$\begin{aligned}p(n)&=\sum_{k\ge1}(-1)^{k-1}p(n-g_k^-)\\&\quad+\sum_{k\ge1}(-1)^{k-1}p(n-g_k^+).\end{aligned}$$
Only terms with nonnegative arguments contribute. Thus the offset pairs $1,2;5,7;12,15;\ldots$ have signs $+,+;-,-;+,+;\ldots$.`,
      idea:String.raw`Multiply Euler’s partition series by the pentagonal product: their product is $1$. The coefficient of $q^n$ is zero for $n>0$, and moving every term except $p(n)$ to the other side gives the recurrence, including its signs and negative-index convention. Since each offset is positive, the values can be computed in increasing order; there are $O(\sqrt n)$ summands for a single $n$, or $O(N^{3/2})$ integer additions through $N$, without claiming constant-time arithmetic for growing integers.`,
      caption:String.raw`Choose a target through 1,000 and select one signed contribution. The exact integer recurrence supplies the counts; the panels show normalized contributions and the logarithm of the resulting growth. No timing or asymptotic estimate replaces the computed values.`,
      deps:['comb-6.1','comb-6.5'],refs:['Stanley EC1 draft, equation (1.91), p.78','Pak §5.1.2, p.30, with Grinberg’s corrected signs and p symbols'],links:{source:'https://math.mit.edu/~rstan/ec/ec1.pdf',errata:'https://www.math.ucla.edu/~pak/papers/pb-errata1.pdf'},tags:['partitions','recurrences'],viz:V.recurrence,
    },
    {
      num:'6.7',kind:'Theorem',name:'Jacobi triple product identity',
      statement:String.raw`With $z$ invertible, the identity in $\mathbb Z[z,z^{-1}][[q]]$ is
$$\begin{aligned}\sum_{k\in\mathbb Z}z^kq^{k^2}&=\prod_{r\ge1}(1-q^{2r})\\&\quad\cdot\prod_{r\ge1}(1+zq^{2r-1})\\&\quad\cdot\prod_{r\ge1}(1+z^{-1}q^{2r-1}).\end{aligned}$$
It also holds for complex $|q|<1$ and $z\ne0$. In an integer-power specialization, replacing $q$ by $t^3$ and $z$ by $-t^{-1}$ gives Euler’s pentagonal identity with its variable replaced by $t^2$.`,
      idea:String.raw`Pak’s shifted-diagonal bijection first proves $\sum_k s^kt^{k(k+1)/2}/\prod_{i\ge1}(1-t^i)=\prod_{i\ge1}(1+st^i)\prod_{j\ge0}(1+s^{-1}t^j)$. Attach a staircase to a Ferrers diagram and split along the diagonal of offset $k$: rows on one side and columns on the other give two distinct-part partitions, one allowing a zero part, whose length difference is $k$; reversing the cut reconstructs the original diagram. Set $t=q^2$ and $s=z/q$, then multiply by $\prod(1-q^{2i})$. This yields the displayed formula coefficientwise, with only finitely many terms at every $q$-degree.`,
      caption:String.raw`Include factor triples one at a time and compare the exact two-variable coefficient arrays. A square marks a nonzero coefficient; inspect its signed integer value with the degree and power controls. A product truncated too early is allowed to disagree.`,
      deps:['comb-6.1','comb-6.2'],refs:['Pak §§6.1.1 and 6.2.1–6.2.2, pp.35–36','Stanley EC1 draft, solution to Exercise 1.91, p.188'],links:{source:'https://www.math.ucla.edu/~pak/papers/psurvey.pdf'},tags:['partitions','q-series'],viz:V.jacobi,
    },
    {
      num:'6.8',kind:'Theorem',name:'Rogers–Ramanujan identities',
      statement:String.raw`Write $(q;q)_k=\prod_{j=1}^k(1-q^j)$, with $(q;q)_0=1$. For $a=0,1$, define
$$F_a(q)=\sum_{k\ge0}\frac{q^{k(k+a)}}{(q;q)_k}.$$
Let $R_0=\{1,4\}$ and $R_1=\{2,3\}$. The two identities are
$$F_a(q)=\prod_{\substack{m\ge1\\m\bmod5\in R_a}}(1-q^m)^{-1}.$$
These are formal identities and analytic identities for $|q|<1$. Coefficientwise, partitions with successive parts differing by at least two correspond in number to parts congruent to $1,4\pmod5$; requiring also that every part be at least two changes the residue classes to $2,3\pmod5$.`,
      idea:String.raw`Subtract the staircase $(2k-1,2k-3,\ldots,1)$ from a gap partition with $k$ parts: a partition with at most $k$ parts remains, giving $q^{k^2}/(q;q)_k$; the staircase $(2k,2k-2,\ldots,2)$ gives the second series. The difficult equality to each product is Schur’s cancellation argument, explained in Pak §7.2: after multiplication by Euler’s product, a sign-reversing involution leaves bilateral sums with exponents $j(5j-1)/2$ and $j(5j-3)/2$. Jacobi’s triple product factors those surviving sums, and cancelling the common Euler factors leaves the indicated residue classes. The staircase interpretation and finite widget are not substitutes for that involution.`,
      caption:String.raw`Switch between the two identities. Counts come independently from a gap recurrence, a residue product and the staircase series. Browse small examples from each class; the two list ranks are independent browsing choices, not a claimed explicit Rogers–Ramanujan bijection.`,
      deps:['comb-6.1','comb-6.2','comb-6.7','comb-3.9'],refs:['Pak §§7.1–7.2, pp.38–42; Schur cancellation proof of the first identity and parallel second identity','Stanley EC1 draft, solution to Exercise 1.88(a),(b), p.187'],links:{source:'https://www.math.ucla.edu/~pak/papers/psurvey.pdf'},tags:['partitions','q-series'],viz:V.rogers,
    },
  ],
};
