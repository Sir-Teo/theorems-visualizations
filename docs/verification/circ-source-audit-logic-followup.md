# Circuit CMOS, Boolean logic and latch review

Ready for root integration: **circ-4.8, circ-4.9, circ-4.13** in ch04-b.js. Flags retained true. Existing dependency arrays and prior edits preserved. New scoped helper/tests only; no existing shared helper or central ledger changed.

## Primary sources and precise anchors

- [Wanlass US 3,356,858 original patent PDF](https://patentimages.storage.googleapis.com/a9/a5/6e/8688ff036edb08/US3356858.pdf), ten PDF pages: original text read, Fig.5 visually inspected on PDF p3, inverter explanation in cols.4–5/PDF pp7–8. It documents complementary devices, common input, low standby draw and June18,1963 filing (grant December5,1967). The original uses bipolar rails; the atlas shifts the voltage origin. Cache `/tmp/atlas-circ-wanlass-patent.pdf`, SHA256 `7bb541acb63f652341b2e63910d071973fd28e39fc5f301555812c8f731941ee`.
- [del Alamo, MIT 6.012 Lecture14, October27,2005](https://ocw.mit.edu/courses/6-012-microelectronic-devices-and-circuits-fall-2005/6bec6dd1b07b02a1a84098b78f068cc3_lec14.pdf): all25 pages read. Slides3–5 specify topology and rail states,7–13 derive switching bias and finite-gain noise-margin behavior,21–24 distinguish charging energy from static logic-state power. Cache `/tmp/atlas-circ-mit-cmos.pdf`, SHA256 `7387af0bee7fa8fe385e831e8d98a1a034a96141857a93ee2b71b25d5d60e857`.
- [Terman, MIT 6.004 Spring2017, L04 annotated slides](https://ocw.mit.edu/courses/6-004-computation-structures-spring-2017/pages/c4/c4s1/): complete relevant sections2–7 read, from truth-table sum-of-products through two-input building blocks to Universal Building Blocks. This is the constructive general proof, independent of the five displayed examples. Cache `/tmp/atlas-circ-mit-nand.html`, SHA256 `b0fee854cd93cc4c4d4d33aaf5256cbd4492b748af608e71cdbcee3c61c588ff`. Historical Sheffer/Peirce priority assertions were removed rather than inferred from secondary bibliographies. A separately inspected Cambridge chapter excerpt has a misleading displayed NAND identity; the atlas's independently truth-table-checked identities and the MIT construction are used instead.
- [Perrott, MIT 6.976 Lecture13,2003](https://ocw.mit.edu/courses/6-976-high-speed-communication-circuits-and-systems-spring-2003/0d4bee628af184eb33a86cb7cafbb697_lec13.pdf): relevant slides50–51 fully read/inspected. They identify positive feedback and cross-coupled inverters as a static latch, distinct from dynamic charge storage. Cache `/tmp/atlas-circ-mit-latches.pdf` (60pages), SHA256 `4dc7ca093ee24957c1f0e7198623fe00fca03698a25d1e7bb60418753006e83a`. This source is not represented as deriving the atlas's tanh model or as Eccles–Jordan's original invention paper.

## Corrections

**4.8:** Replaced “large current only during a transition” with the actual DC bias distinction: a held intermediate input continues conducting. Rail outputs alone do not establish half-supply noise margins. Added explicit omitted capacitive charging and assumed leakage floor. The output root is now bracketed on physical rails; analytic implicit gain replaces a derivative sampled outside the input domain near rails. The chosen empirical transistor extension is declared.

**4.9:** Stated positive finite input arity, finite acyclic circuits and fan-out; handled constants and the zero-input exception. Corrected the reference to 4.8 as though its inverter were a NAND. Fault rows can be masked; no universal assertion that any faulty gate necessarily corrupts every realization remains. The XOR output label previously lay beyond the stage extent; all networks now have enough horizontal room.

**4.13:** Replaced the false exact-three claim for arbitrary decreasing curves with the explicit tanh/RC model and changed the entry kind to Model. The midpoint single-inverter gain is g; loop gain is g². An arbitrary decreasing curve can have slope magnitude2 outside the invariant output interval while its iterated map is a contraction on that interval, giving a counterexample to the former premise.

For the tanh model, dimensionless equilibrium variables obey a=−tanh(gb),b=−tanh(ga). Since tanh is odd/increasing, the sum of the right sides has opposite sign to a+b; equilibrium therefore forces a+b=0. Roots reduce to z=tanh(gz). Concavity gives the complete count; the implementation solves the monotone atanh(z)/z equation, including near-critical roots that a finite sign grid can miss. The Jacobian eigenvalues are −1±sqrt(f'(v1)f'(v2)). At g=1, for L=(a²+b²)/2, dL/dt=−a²−b²−a tanh(b)−b tanh(a)<0 off zero: for ab≥0 this is immediate, while for ab<0 use |tanh(u)|<|u| and 2|ab|≤a²+b². The zero eigenvalue is thus not labeled unstable.

Corrected the reversed above/below-diagonal buttons and added an exact diagonal start button (mouse input cannot reliably place an exact mathematical equality). Time traces include t=8 exactly, and the readout reports finite endpoint and ODE residual, rather than claiming every finite endpoint stores a bit. Near-critical convergence can be very slow; simulations are illustrations, not proofs of the root count or asymptotic stability.

## Validation

`node --test tests/verification-circ-source-audit-logic.test.mjs`: **8 groups pass**:303 CMOS bias/supply KCL/rail/symmetry checks; independent finite-difference gain and sustained DC current; independent bitwise fixtures for every displayed NAND/fault row; constructive NAND synthesis for all1-,2-,3-input truth tables including constants; tanh roots/Jacobian near criticality; critical Lyapunov decrease; independent fine-step midpoint integration against production RK4 and exact last-time sampling; counterexample to the former general-gain premise.

`node tests/verification-circ-source-audit-logic.mjs`: **6 native groups pass**, each reviewed entry in both themes. Fifteen actual CMOS supply/input states; five actual NAND networks ×four input combinations ×two fault states; real keyboard-controlled subcritical/critical/supercritical latch gains, both start buttons, exact diagonal start and real off-diagonal drag. Checks cover current/voltage/gain readings, fault counts, unclipped output text, every equilibrium dot and final-time trajectory endpoints. No page exceptions or TeX errors. Earlier native test attempts exposed only test-driver constraints (non-grid logarithmic fill and pixel-exact diagonal placement), corrected using real keyboard input and the explicit diagonal control.

Personally inspected source images `/tmp/atlas-circ-wanlass-patent-inverter.png`, `/tmp/atlas-circ-latch-source.png`, and final native images:

- `/tmp/atlas-circ-logic-CMOS-held-midpoint-DC-light.png`
- `/tmp/atlas-circ-logic-NAND-XOR-visible-output-and-fault-dark.png`
- `/tmp/atlas-circ-logic-latch-critical-stable-midpoint-light.png`
- `/tmp/atlas-circ-logic-latch-diagonal-saddle-finite-trace-dark.png`

No Wave5 advancement claimed.
