import * as V from './ch06.viz.js';
export default {
 collection:'ctrl',chapter:6,title:'Routh–Hurwitz and the root locus',
 summary:'Exact stability counts and pole trajectories connect polynomial coefficients with closed-loop behavior. Singular Routh rows, multiple roots, compensator transients and coefficient uncertainty expose the assumptions behind the geometric rules.',
 items:[
  {
    "num": "6.1",
    "kind": "Definition",
    "name": "Closed-loop characteristic polynomial",
    "deps": [
      "ctrl-1.4"
    ],
    "statement": String.raw`For a real strictly proper loop $L(s)=K N(s)/D(s)$ with unity negative feedback, the closed-loop characteristic polynomial is
$$P_K(s)=D(s)+K N(s).$$
The degree stays equal to $\deg D$ because $\deg N<\deg D$. Its roots determine the stability of the chosen feedback realization. A cancellation in one input–output transfer can hide a mode; it does not remove that mode from the realization.`,
    "idea": "The feedback equations give $Y=L(R-Y)$, hence $Y/R=KN/(D+KN)$ from zero initial conditions. In a strictly proper state realization, the determinant lemma gives the same characteristic polynomial: closing the loop changes $A$ to $A-KBC$. Working with $D+KN$ retains common factors and the modes present when $K=0$, even if the selected transfer numerator vanishes. Strict properness also avoids an algebraic feedthrough singularity.",
    "caption": "Edit the denominator coefficients, choose a constant or linear numerator, and vary feedback gain. The coefficient table forms D + K N term by term, while the root plot shows the resulting characteristic roots.",
    "scope": "Real polynomial coefficients in a fixed normalized time unit. The displayed realization retains every denominator state, including modes hidden by input–output cancellation. Root positions are approximations of rounded coefficients; exact Routh counts use the original rational coefficient algebra.",
    "refs": [
      "Jonathan How, MIT16.30 Topic2 (2010), selected printed2–5/2–6 feedback equations; own coefficient/state derivation"
    ],
    "tags": [
      "stability",
      "root locus"
    ]
  ,
    viz:V.lesson1
  },
  {
    "num": "6.2",
    "kind": "Theorem",
    "name": "Routh–Hurwitz stability criterion",
    "deps": [
      "ctrl-6.1",
      "rca-10.43"
    ],
    "statement": String.raw`Let $P(s)$ be a real polynomial with positive leading coefficient and no roots on the imaginary axis. Form its Routh array. After the singular cases are treated as in 6.4, the number of sign changes down the first column equals the number of roots in $\Re s>0$, counted with multiplicity. Thus $P$ is Hurwitz exactly when every first-column entry is positive.`,
    "idea": String.raw`Start with coefficients of alternating powers in the first two rows. If consecutive rows are $U=(u_0,u_1,\ldots)$ and $V=(v_0,v_1,\ldots)$, their successor has entries
$$W_j=u_{j+1}-\frac{u_0}{v_0}v_{j+1}.$$
These are signed Euclidean remainders of the even and odd parts. On the imaginary axis the argument principle gives
$$N_+=\frac n2-\frac{\Delta\arg P(i\omega)}{2\pi},$$
where $\omega$ runs from minus to plus infinity. The associated Cauchy-index reduction, eliminating the highest power at each row, gives $\Delta\arg P=(n-2V)\pi$, with $V$ the first-column sign changes. Hence $N_+=V$. Positive rescaling of a row preserves the sign count; replacing a zero by an arbitrary numerical tolerance does not justify it.`,
    "caption": "Edit a cubic or quartic and reveal its Routh construction. Compare the exact first-column sign changes with the independently approximated roots; the array remains the stability decision when a plotted crossing is too small to resolve.",
    "scope": "Strict Hurwitz stability excludes imaginary-axis roots. The readout reports right, left and axis counts separately, including origin multiplicity. Whole-zero rows and zero pivots are treated algebraically, not by a floating-point zero threshold.",
    "refs": [
      "Complete chapter-local derivation under the stated unity negative-feedback convention"
    ],
    "tags": [
      "stability",
      "root locus"
    ]
  ,
    viz:V.lesson2
  },
  {
    "num": "6.3",
    "kind": "Proposition",
    "name": "All coefficients positive: necessary, not sufficient",
    "deps": [
      "ctrl-6.2"
    ],
    "statement": "If a real Hurwitz polynomial has positive leading coefficient, all its coefficients are strictly positive. The converse fails from degree three onward. For example,\n$$P_c(s)=s^3+s^2+s+c$$\nhas all coefficients positive when $c>0$, but is Hurwitz only for $0<c<1$. For $c>1$ it has two right-half-plane roots.",
    "idea": String.raw`A negative real root contributes a factor $s+a$ with $a>0$. A conjugate pair $-a\pm ib$ contributes $s^2+2as+a^2+b^2$, also with strictly positive coefficients. Multiplying these factors proves necessity. In the displayed cubic, the first column is $1,1,1-c,c$. For $c>1$ the signs are $+,+,-,+$, giving two sign changes despite every polynomial coefficient being positive. At $c=1$, $(s+1)(s^2+1)$ lies on the stability boundary.`,
    "caption": "Keep every coefficient positive while increasing the constant term. The coefficient bars stay positive, but the exact Routh margin changes sign and the conjugate roots enter the right half-plane.",
    "scope": "The constant-term control includes zero to expose the boundary of the positivity hypothesis. All coefficient bars use the same normalized polynomial variable; they are not powers or energy measurements.",
    "refs": [
      "Complete chapter-local derivation under the stated unity negative-feedback convention"
    ],
    "tags": [
      "stability",
      "root locus"
    ]
  ,
    viz:V.lesson3
  },
  {
    "num": "6.4",
    "kind": "Method",
    "name": "Routh special cases and imaginary-axis crossings",
    "deps": [
      "ctrl-6.2"
    ],
    "statement": String.raw`Two singular Routh events require different operations. A zero first entry in a nonzero row is replaced by a formal $\varepsilon>0$, and signs are read as $\varepsilon\downarrow0$. If an entire row vanishes, form the auxiliary polynomial from the preceding row and replace the zero row by its derivative. A whole-zero row signals roots symmetric about the origin; those roots need not all be imaginary.`,
    "idea": String.raw`The formal infinitesimal keeps the limiting signs without choosing an arbitrary small constant. A zero remainder in the even/odd Euclidean construction identifies a common symmetric factor; its auxiliary derivative restarts the sign count. The family
$$P_\delta=(s+2)(s^2+1)+\delta$$
has a vanishing row at $\delta=0$ and an imaginary pair at $\pm i$. Positive $\delta$ sends that pair right; small negative $\delta$ sends it left. In contrast, $s^4-1$ has symmetric real roots $\pm1$ as well as $\pm i$. Origin factors are extracted with their exact multiplicity. Applying the right-half-plane count to both $P(s)$ and $P(-s)$ separates right, left and axis roots.`,
    "caption": "Compare an imaginary-pair crossing, a zero pivot, symmetric real/imaginary roots and an origin root. The replacement row is highlighted. Signed tiny offsets can change the exact count even when the root picture still rounds to the boundary.",
    "scope": "The crossing offset is restricted so the displayed negative-offset family has positive constant term. Formal epsilon labels are asymptotic expressions, not chosen finite perturbations. The local root plot and the exact classification have separate resolution status. Cell flags ±tiny and ±huge retain finite signs beyond the numeric display range.",
    "refs": [
      "Complete chapter-local derivation under the stated unity negative-feedback convention"
    ],
    "tags": [
      "stability",
      "root locus"
    ]
  ,
    viz:V.lesson4
  },
  {
    "num": "6.5",
    "kind": "Method",
    "name": "Stability range of a gain",
    "deps": [
      "ctrl-6.4"
    ],
    "statement": String.raw`For $a,b>0$, unity negative feedback around $K/[s(s+a)(s+b)]$ gives
$$\begin{aligned}P_K={}&s^3+(a+b)s^2\\&+ab\,s+K.\end{aligned}$$
For nonnegative gain the exact stable range is
$$0<K<ab(a+b).$$
At the upper endpoint the roots are $-(a+b)$ and $\pm i\sqrt{ab}$; at zero gain one root is at the origin.`,
    "idea": "The first-column entries are $1$, $a+b$, $[ab(a+b)-K]/(a+b)$ and $K$. Their strict positivity gives both endpoints. At $K=ab(a+b)$ the factorization is\n$$P_K=(s+a+b)(s^2+ab).$$\nA finite step trace can look bounded near a boundary and does not prove asymptotic stability. Conversely, at $K=0$ the selected zero-state output transfer is zero although the retained realization still has an origin mode. The polynomial inequalities decide stability independently of those output appearances.",
    "caption": "Move the two open-loop rates and the feedback gain. The open interval on the number line, live Routh margin and actual finite-time step response use the same polynomial.",
    "scope": "The time response starts from zero state under a unit reference. Its finite window does not certify settling. The characteristic count retains every chosen realization mode. Algebraic interval endpoints are open; a rounded displayed endpoint does not replace the exact sign calculation.",
    "refs": [
      "Complete chapter-local derivation under the stated unity negative-feedback convention"
    ],
    "tags": [
      "stability",
      "root locus"
    ]
  ,
    viz:V.lesson5
  },
  {
    "num": "6.6",
    "kind": "Definition",
    "name": "Root locus",
    "deps": [
      "ctrl-6.1"
    ],
    "statement": String.raw`For coprime real $N,D$ with $n=\deg D>m=\deg N$, the positive-gain root locus is the collection of roots of $D+KN$ as $K\ge0$ varies. At $K=0$ the roots are the open-loop poles. As $K\to\infty$, $m$ branches tend to finite zeros of $N$ and the remaining $n-m$ go to infinity.`,
    "idea": "For small gain, continuity of the roots keeps them near the zeros of $D$. For a bounded limiting root at large gain, divide $D+KN=0$ by $K$ to obtain $N=0$ in the limit. The fixed leading degree leaves $n-m$ roots escaping to infinity. For a real polynomial the root multiset is conjugate symmetric. Branch colors match nearby samples for readability; at collisions they are a drawing convention, not an intrinsic pole identity.",
    "caption": "Sweep a finite positive gain through three distinct loop families. Trails retain all sampled characteristic roots, with open-loop poles and finite zeros marked separately. The companion plot shows how the largest real part determines the current stability.",
    "scope": "The plotted sweep ends at a declared finite gain. Infinity is an asymptotic statement, never a fabricated finite endpoint. Root locations and branch matching are numerical; exact Routh counts decide each selected state.",
    "refs": [
      "Jonathan How, MIT16.30 Topic2 (2010), selected printed2–5 through2–11; own finite-gain models"
    ],
    "tags": [
      "stability",
      "root locus"
    ]
  ,
    viz:V.lesson6
  },
  {
    "num": "6.7",
    "kind": "Theorem",
    "name": "Angle and magnitude conditions",
    "deps": [
      "ctrl-6.6"
    ],
    "statement": String.raw`At a test point $s_0$ that is neither an open-loop pole nor zero, a positive real gain makes it a closed-loop root exactly when
$$\arg\frac{N(s_0)}{D(s_0)}=\pi\pmod{2\pi}.$$
The required gain is
$$K=\left|\frac{D(s_0)}{N(s_0)}\right|.$$
The angle condition is necessary as well as the magnitude condition.`,
    "idea": "Rearrange $D(s_0)+KN(s_0)=0$ to $K=-D(s_0)/N(s_0)$. This quotient must be positive real, which gives both tests. Factoring $N$ and $D$ expresses phase as angles from zeros minus angles from poles. A point near the locus has a small angular error but is not thereby certified to lie on it. The illustration tests real and imaginary parts of the exact rational quotient for the saved binary64 point; it reports the wrapped angle only as a numerical geometric measurement.",
    "caption": "Drag the test point. Vectors from the poles and zeros explain the phase sum, while the phase wheel compares it with the negative real direction. Read the required magnitude gain and whether the exact positive-real quotient condition holds.",
    "scope": "Positive-gain locus only. At a pole or zero the finite-gain formula is undefined; endpoints are reported separately. An angular tolerance is not substituted for exact membership. The same dragged point is included in the actual saved-state link. A finite gain outside the numeric range retains its finite status and logarithmic magnitude.",
    "refs": [
      "Jonathan How, MIT16.30 Topic2 (2010), selected printed2–7/2–11 and2–21/2–22; own exact quotient test"
    ],
    "tags": [
      "stability",
      "root locus"
    ]
  ,
    viz:V.lesson7
  },
  {
    "num": "6.8",
    "kind": "Method",
    "name": "Root-locus sketching rules",
    "deps": [
      "ctrl-6.7"
    ],
    "statement": String.raw`The positive-gain locus lies on real-axis segments with an odd number of real poles and zeros to their right, counted with multiplicity. With $r=n-m$, its infinity asymptotes have angles
$$\theta_j=\frac{(2j+1)\pi}{r}$$
and centroid
$$\sigma_a=\frac{\sum p_i-\sum z_j}{r}.$$
Real break points satisfy $(D/N)'=0$, then must pass the real-axis and positive-gain tests.`,
    "idea": String.raw`Conjugate pole/zero pairs contribute cancelling angles on the real line; each real singularity to the right contributes an odd multiple of $\pi$. At large $s$, compare the leading two powers of $D+KN$ after translating by the centroid to obtain the asymptote directions. Differentiating $K=-D/N$ yields the stationary-gain candidates. At a simple complex pole $p$, a local factorization gives departure angle $\pi+\sum\arg(p-z_j)-\sum_{q\ne p}\arg(p-q)$ modulo $2\pi$. Rules predict geometry; the computed finite-gain locus checks their actual applicability.`,
    "caption": "Overlay real-axis segments, infinity asymptotes, the valid real breakaway and complex-pole departure directions on the sampled locus. Controls that do not apply to the chosen family are hidden.",
    "scope": "The shown families have simple open-loop poles and a positive leading loop gain. The breakaway overlay applies to the three-real-pole family; departure arrows apply to the complex-pair family. Asymptotes describe large gain, not exact finite-gain trajectories.",
    "refs": [
      "Jonathan How, MIT16.30 Topic2 (2010), selected printed2–7 through2–11; own breakaway/departure derivations"
    ],
    "tags": [
      "stability",
      "root locus"
    ]
  ,
    viz:V.lesson8
  },
  {
    "num": "6.9",
    "kind": "Theorem",
    "name": "Roots move continuously with the gain",
    "deps": [
      "ctrl-6.6",
      "rca-10.43"
    ],
    "statement": String.raw`The roots of $P_K=D+KN$ vary continuously as a multiset with finite real gain when its degree is fixed. If a disk boundary contains no root of $P_{K_0}$ and
$$|\delta K\,N(s)|<|P_{K_0}(s)|$$
on that boundary, the perturbed polynomial has the same number of roots inside, counted with multiplicity. A disk enclosing a multiple root preserves that count, not a unique differentiable pole label.`,
    "idea": String.raw`Apply Rouché’s theorem to $P_{K_0}$ and $P_{K_0}+\delta K N$. Choose disjoint small disks around the finitely many distinct roots; each boundary has a positive minimum modulus. Small coefficient changes preserve each disk's root count, proving multiset continuity. At a simple root implicit differentiation gives $ds/dK=-N/P'_K$; the denominator vanishes at a multiple root. The simple-root example at $K_0=0$ uses $D=s(s+1)(s+3)$, with boundary minimum $r(1-r)(3-r)$ for $0<r<1$. The double-root example uses $D=s^2(s+2)$ and minimum $r^2(2-r)$ for $0<r<2$. Both minima occur at $s=-r$.`,
    "caption": "Resize a disk around a simple or double root and change the signed gain perturbation. Compare the boundary modulus with the actual perturbation. A strict inequality certifies one or two enclosed roots, even through a split of the double root.",
    "scope": "The complex-plane panel is a local view of the chosen disk; other roots can lie outside that window. The inequality is sufficient, so losing it means the count is uncertified rather than necessarily changed. Boundary equality does not satisfy Rouché’s strict hypothesis.",
    "refs": [
      "Complete chapter-local derivation under the stated unity negative-feedback convention"
    ],
    "tags": [
      "stability",
      "root locus"
    ]
  ,
    viz:V.lesson9
  },
  {
    "num": "6.10",
    "kind": "Method",
    "name": "Lead compensation on the root locus",
    "deps": [
      "ctrl-6.8",
      "ctrl-4.4"
    ],
    "statement": String.raw`A lead compensator has
$$C(s)=K\frac{s+z}{s+p}$$
with $0<z<p$.
It contributes positive phase at positive frequency and changes the root locus. For $P(s)=1/[s(s+2)]$ the characteristic polynomial is
$$\begin{aligned}P_K={}&s^3+(p+2)s^2\\&+(2p+K)s+Kz.\end{aligned}$$
Pole-region guides help choose parameters, but the full transfer, including its zero and third pole, determines the actual step.`,
    "idea": String.raw`The phase contribution is $\arctan(\omega/z)-\arctan(\omega/p)>0$. Multiply the plant and compensator denominators, then add $K(s+z)$, to derive the cubic. Its Routh margin is $(p+2)(2p+K)-Kz>0$, so this stated family is stable for every positive $K$ when $p>z$. A region based on damping and decay of an ideal second-order pair remains a design heuristic here. The view therefore computes the actual third-order zero-state response and compares it with proportional feedback; it does not infer overshoot or settling solely from the dominant-looking pair.`,
    "caption": "Place the lead pole and zero and move the gain. Compare the changed locus with the proportional reference and the shaded design guide, then inspect the full finite-time step response that the same transfer actually produces.",
    "scope": "Normalized time with a fixed one-second base unit. The shaded region is a pole-placement guide; no exact second-order transient specification is claimed for this third-order transfer with a zero. Finite-window measured peaks are not universal overshoot bounds.",
    "refs": [
      "Jonathan How, MIT16.30 Topic2 (2010), selected printed2–20 through2–25 controller geometry/caveats; own plant, polynomial and full-state response"
    ],
    "tags": [
      "stability",
      "root locus"
    ]
  ,
    viz:V.lesson10
  },
  {
    "num": "6.11",
    "kind": "Method",
    "name": "Lag compensation for steady-state accuracy",
    "deps": [
      "ctrl-6.8",
      "ctrl-4.6"
    ],
    "statement": String.raw`For a lag compensator
$$C(s)=K\frac{s+z}{s+p}$$
with $0<p\le z$,
its DC gain is $Kz/p$, while its high-frequency gain tends to $K$. With $P=1/[(s+1)(s+2)]$ and a stable closed loop, the unit-step steady error is
$$e_\infty=\frac1{1+Kz/(2p)}.$$
Moving the pair close to the origin can limit movement of the faster poles, but can introduce a long slow tail.`,
    "idea": String.raw`The final-value theorem applied to $E=1/[s(1+PC)]$ gives the stated error only after stability is checked. The characteristic cubic is
$$\begin{aligned}P_K={}&s^3+(3+p)s^2\\&+(2+3p+K)s\\&+(2p+Kz).\end{aligned}$$
For $z=\beta p$ and fixed $\beta$, let $p\to0$. The polynomial approaches $s[s^2+3s+2+K]$: the original faster pair is retained in the limit, but an extra root approaches zero. Its residue and the steady error matter to the long response. A large DC gain alone does not establish stability or a short settling time.`,
    "caption": "Raise the low-frequency gain with a lag pole–zero pair. Compare the exact stable-loop error with the proportional reference, and use the full transient and pole positions to see the slow mode that a steady-error formula omits.",
    "scope": "The ratio includes one to show exact pole–zero cancellation; greater ratios give lag. Steady error is withheld for unstable states. The forty-unit response window is finite, and the analytic asymptote is identified separately from the observed last sample.",
    "refs": [
      "Jonathan How, MIT16.30 Topic2 (2010), selected printed2–17/2–20 tracking and lag discussion; own plant and exact error/state equations"
    ],
    "tags": [
      "stability",
      "root locus"
    ]
  ,
    viz:V.lesson11
  },
  {
    "num": "6.12",
    "kind": "Phenomenon",
    "name": "Conditionally stable systems",
    "deps": [
      "ctrl-6.8"
    ],
    "statement": String.raw`Stability need not improve monotonically with feedback gain. Consider
$$\begin{aligned}D&=s^4+s^3+3s^2+s+1,\\N&=10s^3+s^2+s.\end{aligned}$$
For $K\ge0$, $D+KN$ is stable at small and sufficiently large gains but unstable in between. Its decisive Hurwitz determinant is
$$\Delta_3=1+12K-60K^2+10K^3.$$
The two positive zeros are approximately $0.273416$ and $5.789754$.`,
    "idea": String.raw`All coefficients of $D+KN$ are positive for nonnegative gain. Its second Hurwitz determinant is $2+30K+10K^2>0$. The remaining nontrivial strict stability condition is $\Delta_3>0$. Its cubic has one negative and two positive simple zeros, so the sign is positive before the first positive crossing, negative between the two, and positive after the second. Exact Routh counts confirm two unstable roots in the middle interval. Reducing a gain from the high stable region can therefore destabilize the loop; all coefficient positivity persists throughout.`,
    "caption": "Sweep through both crossings. Compare the complete root locus, the determinant sign and the rightmost-root detail, which reveals crossings hidden by the fast far-left root. The exact selected-gain classification remains separate from the rounded numerical crossing labels.",
    "scope": "This is a newly authored strictly proper fourth-order loop, not a measured controller. The displayed sweep is finite. Both stability boundaries are open, and the real-part root plot is approximate; the exact determinant/Routh calculation decides a saved state.",
    "refs": [
      "Complete chapter-local derivation under the stated unity negative-feedback convention"
    ],
    "tags": [
      "stability",
      "root locus"
    ]
  ,
    viz:V.lesson12
  },
  {
    "num": "6.13",
    "kind": "Theorem",
    "name": "Kharitonov’s theorem",
    "deps": [
      "ctrl-6.2"
    ],
    "statement": String.raw`For a fixed-degree monic real interval family
$$P(s)=s^n+\sum_{j=0}^{n-1}a_js^j,$$
with independent closed coefficient intervals, every member is Hurwitz if and only if four Kharitonov polynomials are Hurwitz. Starting at the constant coefficient, choose lower/upper endpoints by the repeating patterns
$$\begin{aligned}K_1&:(--++),\\K_2&:(++--),\\K_3&:(+--+),\\K_4&:(-++-).\end{aligned}$$
Here minus and plus select endpoints, not signs of their values.`,
    "idea": String.raw`At $s=i\omega$, even coefficients determine the real part and odd coefficients the imaginary part. Their independent ranges form a rectangle whose four corner paths are the Kharitonov polynomials, in an order that can be permuted. The classical general criterion reduces the whole family to these four strict stability tests; finite random sampling is not that reduction.

The quartic illustration admits a complete direct proof. Positive endpoints are necessary. For $a_4s^4+a_3s^3+a_2s^2+a_1s+a_0$, with all coefficients positive, the Routh conditions reduce to
$$a_2>a_4r+\frac{a_0}{r},\qquad r=\frac{a_1}{a_3}.$$
This inequality implies the second determinant condition too. The ratio spans $[a_1^-/a_3^+,a_1^+/a_3^-]$. The worst $a_2$ is its lower endpoint and the worst $a_0,a_4$ are their upper endpoints. The remaining right side is convex in positive $r$, so its maximum is at a ratio endpoint. Those extremal combinations occur among the four special polynomials. Thus their strict tests certify every quartic in the displayed box.`,
    "caption": "Widen the independent coefficient intervals of a quartic. Compare the four special spectra with deterministic sampled members, then inspect the convex worst-case inequality that certifies the entire box.",
    "scope": "The leading coefficient is fixed at one; real coefficient intervals are independent and closed. This is continuous-time Hurwitz stability, not a discrete-time or correlated-uncertainty criterion. Sampled roots are illustrative approximations; four exact corner tests and the quartic argument provide the certificate.",
    "refs": [
      "Abdon E. Choque-Rivero (2017), The Kharitonov theorem and robust stabilization via orthogonal polynomials, selected Definition5/6 and Theorem1, printed55–57; own complete quartic Routh/convexity proof"
    ],
    "tags": [
      "stability",
      "root locus"
    ]
  ,
    viz:V.lesson13
  }
 ]
};
