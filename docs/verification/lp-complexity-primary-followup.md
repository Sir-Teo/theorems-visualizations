# Polynomial-time LP: primary comparison and retained gap

The complete [Karmarkar 1984 Combinatorica original](https://www.stat.uchicago.edu/~lekheng/courses/302/classics/karmarkar.pdf)
is available, pp. 373–395. Read the relevant full complexity, algorithm,
analysis, reduction and precision passages: §1.6 p. 377, §§2–4 pp. 377–384,
§5 pp. 385–387 and §7.4 pp. 394–395. The canonical projective algorithm,
potential reduction, exact-optimum vertex/separation discussion and
primal–dual/artificial-variable reduction are distinct from the modern
log-barrier path shown in the atlas. The source's L convention is a
determinant/coefficient encoding bound; it is not silently identified with
an arbitrary floating-point stopping tolerance. PDF SHA256:
`23fe46887b005cb3da4e4f9d279ab38d5cd60707c7c643f8eb02039fde5a1ea3`.

Also read [Boyd–Vandenberghe's complete author book](https://web.stanford.edu/~boyd/cvxbook/bv_cvxbook.pdf),
full relevant §§11.2.2–11.2.3, pp. 564–567, and §11.5.3, pp. 590–592,
including Eqs. (11.27)–(11.29). PDF SHA256:
`40d976c83c18cce1900eff8c41bd5ad408c102b813af39d05ff85678ccf8d76e`.

The old explanation incorrectly combined a fixed weight multiplier with
O(1) Newton steps per update and a square-root-of-m bound. The source's
worst-case analysis needs a multiplier 1+1/sqrt(m). A fixed multiplier has
an inner-iteration bound that grows with m. The corrected explanation
states the actual schedule and separates it from the original projective
algorithm. It also states that finite-precision bounds, lower-dimensional
reductions and input-dependent rational reconstruction are needed for
the full theorem; an unqualified 2^(−L) absolute gap does not by itself
certify an exact optimum. The ellipsoid volume statement explicitly has
n≥2, where the displayed standard update applies.

The Karmarkar-specific original-source gap is closed, but **algo-11.23 stays
flagged**. The full Khachiyan 1979 original (Doklady 244(5), 1093–1096;
English translation Soviet Mathematics Doklady20, 191–194) was not recovered.
The official MathNet record/full-text requests returned HTTP403 in the
executor and timed out in the web reader. Internet Archive discovery
found the 1979 volume index, not the needed original body. Metadata and
later historical references do not substitute for that original.
Remaining evidence: its complete finite-precision ellipsoid argument,
rational-input reduction and original historical formulation. The toy
diagram is not treated as a proof of those claims.

Written and syllabus references are synchronized. Numerical algorithms,
controls and handlers are unchanged. Focused static/native light-and-dark
checks and the strict build validate the revised text; the source queue
continues to count this flag, with a narrower, explicit gap.
