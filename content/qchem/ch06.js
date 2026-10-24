import * as UI from './ch06.ui.shared.js';
const identities=[
 {
  "num": "6.1",
  "kind": "Model",
  "name": "VSEPR model of molecular shape",
  "deps": [
   "qchem-5.8"
  ]
 },
 {
  "num": "6.2",
  "kind": "Model",
  "name": "Hybrid orbitals",
  "deps": [
   "qchem-2.5",
   "qchem-6.1"
  ]
 },
 {
  "num": "6.3",
  "kind": "Model",
  "name": "Walsh diagrams: why water is bent",
  "deps": [
   "qchem-5.8",
   "qchem-6.2"
  ]
 },
 {
  "num": "6.4",
  "kind": "Model",
  "name": "Hückel molecular orbital theory",
  "deps": [
   "qchem-4.2",
   "qchem-5.5",
   "ladr-7.29"
  ]
 },
 {
  "num": "6.5",
  "kind": "Model",
  "name": "Ethylene, allyl and butadiene in Hückel theory",
  "deps": [
   "qchem-6.4"
  ]
 },
 {
  "num": "6.6",
  "kind": "Phenomenon",
  "name": "Aromatic stabilization of benzene",
  "deps": [
   "qchem-6.4"
  ]
 },
 {
  "num": "6.7",
  "kind": "Theorem",
  "name": "Hückel’s 4n + 2 rule",
  "deps": [
   "qchem-6.6"
  ]
 },
 {
  "num": "6.8",
  "kind": "Definition",
  "name": "Coulson charges and π bond orders",
  "deps": [
   "qchem-6.4"
  ]
 },
 {
  "num": "6.9",
  "kind": "Theorem",
  "name": "Coulson–Rushbrooke pairing theorem",
  "deps": [
   "qchem-6.4"
  ]
 },
 {
  "num": "6.10",
  "kind": "Concept",
  "name": "Frontier orbitals: HOMO and LUMO",
  "deps": [
   "qchem-6.4"
  ]
 },
 {
  "num": "6.11",
  "kind": "Principle",
  "name": "Woodward–Hoffmann rules",
  "deps": [
   "qchem-6.10",
   "qchem-6.5"
  ]
 },
 {
  "num": "6.12",
  "kind": "Model",
  "name": "Crystal-field splitting",
  "deps": [
   "qchem-2.3",
   "qchem-3.8"
  ]
 },
 {
  "num": "6.13",
  "kind": "Phenomenon",
  "name": "High-spin and low-spin complexes",
  "deps": [
   "qchem-6.12",
   "qchem-3.8"
  ]
 },
 {
  "num": "6.14",
  "kind": "Theorem",
  "name": "Jahn–Teller theorem",
  "deps": [
   "qchem-6.12",
   "qchem-4.7"
  ]
 },
 {
  "num": "6.15",
  "kind": "Phenomenon",
  "name": "Peierls distortion and bond alternation in polyenes",
  "deps": [
   "qchem-6.5",
   "qchem-1.5"
  ]
 },
 {
  "num": "6.16",
  "kind": "Paper",
  "name": "The Nature of the Chemical Bond",
  "deps": [
   "qchem-5.6",
   "qchem-2.3",
   "qchem-5.14"
  ],
  "paper": {
   "authors": "Linus Pauling",
   "year": 1931,
   "title": "The Nature of the Chemical Bond. Application of Results Obtained from the Quantum Mechanics and from a Theory of Paramagnetic Susceptibility to the Structure of Molecules",
   "venue": "Journal of the American Chemical Society 53 (4): 1367–1400",
   "doi": "10.1021/ja01355a027"
  },
  "introduces": [
   "qchem-6.2"
  ]
 },
 {
  "num": "6.17",
  "kind": "Paper",
  "name": "Quantentheoretische Beiträge zum Benzolproblem",
  "deps": [
   "qchem-4.2",
   "qchem-5.3"
  ],
  "paper": {
   "authors": "Erich Hückel",
   "year": 1931,
   "title": "Quantentheoretische Beiträge zum Benzolproblem. I. Die Elektronenkonfiguration des Benzols und verwandter Verbindungen",
   "venue": "Zeitschrift für Physik 70 (3–4): 204–286",
   "doi": "10.1007/BF01339530"
  },
  "introduces": [
   "qchem-6.4",
   "qchem-6.6",
   "qchem-6.7"
  ]
 },
 {
  "num": "6.18",
  "kind": "Paper",
  "name": "Stereochemistry of Electrocyclic Reactions",
  "deps": [
   "qchem-6.10",
   "qchem-6.5",
   "qchem-6.17"
  ],
  "paper": {
   "authors": "R. B. Woodward and Roald Hoffmann",
   "year": 1965,
   "title": "Stereochemistry of Electrocyclic Reactions",
   "venue": "Journal of the American Chemical Society 87 (2): 395–397",
   "doi": "10.1021/ja01080a054"
  },
  "introduces": [
   "qchem-6.11"
  ]
 }
];
const huckelNotes='https://ocw.mit.edu/courses/5-61-physical-chemistry-fall-2017/0d3d7427e4180c2e1b59bb0c09827092_MIT5_61F17_lec26.pdf';
const electroNotes='https://ocw.mit.edu/courses/5-13-organic-chemistry-ii-fall-2003/49cdb778f30678b8d5519e9ade744f15_lec16_handout.pdf';
const lessons=[
{
 statement:String.raw`VSEPR groups bonding regions and lone pairs into electron domains around a centre. A multiple bond counts as one domain for this geometrical model. Equal domains suggest linear, triangular, tetrahedral, trigonal-bipyramidal and octahedral arrangements for two through six domains. The arrangement of attached atoms omits the lone-pair directions.

A declared numerical analogue places unit directions $u_i$ on a sphere and minimizes
$$E=\sum_{i<j}\frac{(s_i+s_j)/2}{\|u_i-u_j\|}.$$
Here $s_i=1$ for a bond domain and a chosen larger size for a lone-pair domain.`,
 idea:String.raw`The diatomic orbital-filling model in 5.8 does not by itself give polyatomic geometry. VSEPR adds a qualitative domain description. In the displayed analogue, project the energy gradient onto each sphere tangent plane, take a descending step and normalize the directions again. Search all assignments of lone pairs to the canonical vertices and several deterministic additional starts. Larger lone-pair weights can compress attached-atom angles, but the resulting value belongs to this chosen repulsion model.`,
 scope:String.raw`Qualitative molecular-shape reasoning and an explicit classical domain analogue, not an electronic Hamiltonian or a universal account of transition-metal geometry. The search reports its force residual and stopping condition; it does not certify a global minimum. With fewer than two attached atoms there is no bond angle to report.`,
 caption:String.raw`Change the number and size of domains, then inspect actual accepted optimization steps. Distinguish the full domain arrangement from the attached-atom angles and compare the final energy with its force residual.`,
 refs:['NPTEL, Principles of Inorganic Chemistry, module 1 lecture 2 §§1.3–1.4; independent domain optimization'],links:{source:'https://archive.nptel.ac.in/content/storage2/courses/104101006/modules/module1/lec2/1.3.html'},tags:['molecular shape','domain repulsion'],viz:UI.domains,
},
{
 statement:String.raw`Let s and three p functions form an orthonormal angular basis. Two hybrids with the same s fraction $f$ and unit p directions $n_1,n_2$ have coefficients
$$h_i=\sqrt f\,s+\sqrt{1-f}\,p_{n_i}.$$
They are orthogonal precisely when
$$\cos\theta=-\frac f{1-f}.$$
Here $0\le f\le1/2$.
The familiar equivalent sp, sp² and sp³ families use $f=1/2,1/3,1/4$ and angles 180°,120° and $\arccos(-1/3)$.`,
 idea:String.raw`Orthonormality of the underlying basis makes the overlap $f+(1-f)n_1\cdot n_2$. Setting it to zero gives the angle relation. For a complete orthonormal basis of the subspace containing one s and N−1 p functions, equal s fractions obey Nf=1: summing the squared s coefficients must give one. This gives the usual sp, sp² and sp³ bases for N=2,3,4. An incomplete orthogonal set can have a different common s fraction, so pair orthogonality alone does not impose f=1/N. The angular functions shown have unit mean-square normalization on the sphere.`,
 scope:String.raw`A choice of orbital basis used to describe localized bonds. Mixing different-energy atomic s and p functions need not produce a stationary atomic eigenfunction; the degeneracy argument of 2.5 alone does not justify that claim. No bond-energy minimum follows from this angular construction.`,
 caption:String.raw`Vary the s fraction of two orthogonal hybrids. Use the three exact family presets, inspect their overlap and follow the angle relation. The signed polar radius depicts an angular slice of each function.`,
 refs:['Pauling (1931), selected printed pp.1376–1379; self-contained overlap derivation'],links:{source:'https://boscoh.com/pdf/pauling.pdf'},tags:['hybrid orbitals','orthogonality'],viz:UI.hybrids,
},
{
 statement:String.raw`A Walsh diagram follows molecular-orbital energies as a molecular angle changes. Filling those levels can give different preferred shapes for different electron counts. The workshop uses a declared orthonormal six-function AH₂ basis: central s,px,py,pz and two H functions. On-site energies are −20,−10,−10,−10,−13,−13 in chosen units. Central s–H couplings are −4; p–H couplings are −5 times the corresponding bond-direction component.
$$E_{\rm e}(\theta)=\sum_k n_k\varepsilon_k(\theta).$$
$$U(\theta)=E_{\rm e}(\theta)+\frac g{2\sin(\theta/2)}.$$
The fixed-radius model compares four and eight electrons.`,
 idea:String.raw`Put the two H directions at $(\pm\sin(\theta/2),0,\cos(\theta/2))$. Changing the angle redistributes the px and pz couplings without changing their total squared magnitude. Diagonalize the resulting real symmetric matrix and occupy its lowest levels. Four electrons emphasize a different set of branches from eight; an added H–H repulsion also shifts the minimum. The numerical search scans the declared interval and refines an interior candidate.`,
 scope:String.raw`A modern finite-basis mechanism model with chosen constants and fixed central–H lengths. It is neither an ab initio BeH₂/H₂O calculation nor a prediction of water’s 104.5° angle. The original Walsh (1953) body remains unread after its access stop; no historical numerical curves are reproduced.`,
 caption:String.raw`Bend the declared AH₂ model and switch the electron count. Compare orbital branches, the occupied total and the bounded numerical minimum while changing H–H repulsion.`,
 refs:['Self-contained six-function AH₂ calculation; Walsh (1953) historical metadata only, original body not read'],tags:['Walsh diagram','orbital filling'],viz:UI.walsh,
},
{
 statement:String.raw`In the elementary Hückel approximation, use one orthonormal pz function per conjugated site, a common diagonal energy α and nearest-neighbour matrix elements β<0. For the drawn graph with adjacency matrix A,
$$H=\alpha I+\beta A.$$
An adjacency eigenpair $Ac=xc$ gives an orbital energy α+βx. Each spatial orbital can hold at most two electrons. The widget takes α=0 and β=−t, with t>0 setting the energy unit.`,
 idea:String.raw`The variational matrix problem of 4.2 simplifies to an ordinary eigenproblem because this approximation sets the overlap matrix to I. Graph eigenvectors from LADR7.29 become coefficient patterns on the pz functions. Unlike the nonorthogonal two-function problem of 5.5, this model omits overlap-induced asymmetry around α. Diagonalizing the actual matrix preserves its trace and provides an eigen-equation residual.`,
 scope:String.raw`A finite noninteracting π-electron approximation with uniform sites and only the selected edges. It omits σ bonding, overlap, electron repulsion and changes of parameters with geometry. An individual eigenvector in a degenerate subspace depends on basis convention; its spectral projector is invariant.`,
 caption:String.raw`Switch six-site skeletons and inspect an orbital’s signed coefficients beside the actual Hamiltonian matrix. Compare graph topology, level energies and the numerical eigen residual.`,
 refs:['MIT 5.61, Robert Field, Fall 2017 Lecture 26, selected PDF 1–10; independent matrix calculation'],links:{source:huckelNotes},tags:['Hückel theory','graph spectra'],viz:UI.huckel,
},
{
 statement:String.raw`For an open uniform N-site Hückel chain, the normalized coefficients and energies are
$$c_{jk}=\sqrt{\frac2{N+1}}\sin\frac{jk\pi}{N+1},$$
$$\varepsilon_k=\alpha-2t\cos\frac{k\pi}{N+1},$$
for j,k=1,…,N and t=−β>0. At neutral filling, ethylene has $E_\pi-2\alpha=-2t$, allyl has $E_\pi-3\alpha=-2\sqrt2t$, and butadiene has $E_\pi-4\alpha=-2\sqrt5t$. Two isolated ethylenes have the reference energy −4t relative to 4α.`,
 idea:String.raw`The missing sites at j=0 and j=N+1 impose zero boundary coefficients. The sine addition identity solves the nearest-neighbour recurrence; the discrete sine normalization gives an orthonormal basis. Fill in ascending physical energy, remembering that negative β reverses the order of adjacency eigenvalues. Neutral allyl leaves one electron in its exact zero-energy mode. Butadiene’s model gain against two ethylenes is $(2\sqrt5-4)t$.`,
 scope:String.raw`Uniform orthonormal π-site model. Ionized choices change occupancy without relaxing the geometry or parameters. An odd electron count does not fix a unique interacting many-electron spin. An orbital index outside the selected chain is explicitly unavailable.`,
 caption:String.raw`Compare two-, three- and four-site chains, choose a valid orbital and change the π charge. See exact normal modes, energies and electron occupations, including allyl’s singly occupied zero mode.`,
 refs:['MIT 5.61Fall 2017 Lecture 26, selected chain treatment; independent discrete-sine derivation'],links:{source:huckelNotes},tags:['conjugated chains','normal modes'],viz:UI.chains,
},
{
 statement:String.raw`Uniform six-site benzene has occupied Hückel energy $6\alpha-8t$, versus $6\alpha-6t$ for three isolated ethylenes. Thus its delocalization gain against that reference is 2t. For alternating hoppings $t(1+\delta),t(1-\delta)$ at fixed mean t, put $r=\sqrt{1+3\delta^2}$. Then
$$E_\pi-6\alpha=-4t(1+r).$$
Against three isolated strong dimers the reference is $-6t(1+\delta)$, and its excess over the ring energy is
$$D=\frac{12t(1-\delta)^2}{4r+2+6\delta}.$$
It decreases from 2t to zero as δ goes from zero to one.`,
 idea:String.raw`A two-site cell reduces the alternating ring to three two-by-two blocks. Their energies are ±2t and the doubly occurring ±tr. Filling the three negative levels gives the total. Rationalizing the small differences produces stable formulas for both D and the lowering relative to the uniform ring, $12t\delta^2/(r+1)$. The latter is positive even while D decreases, because its reference is different.`,
 scope:String.raw`π energy only, with fixed average hopping and no elastic or σ-bond cost. This model does not imply that real benzene distorts. Delocalization energy depends on the explicitly chosen reference; it is not an absolute experimental observable.`,
 caption:String.raw`Alternate the ring’s hopping strengths. Follow the ring energy, the changing strong-dimer reference and their difference separately; compare them with the lowering from the uniform ring.`,
 refs:['MIT 5.61Fall 2017 Lecture 26, PDF 7–9; independent alternating-ring derivation'],links:{source:huckelNotes},tags:['benzene','energy reference'],viz:UI.benzene,
},
{
 statement:String.raw`An ideal uniform planar cyclic Hückel system has levels
$$\varepsilon_k=\alpha-2t\cos\frac{2\pi k}{N},$$
with k=0,…,N−1. The lowest level is single, followed by twofold spatial levels until a possible upper single level. With spin capacity two per spatial orbital and a total strictly below full basis capacity, electron counts 2,6,10,… fill complete low-energy shells. Counts 4,8,… below full capacity instead partly occupy a degenerate shell. A completely filled basis is a separate, trivially filled case; it is not the aromatic closed-shell criterion.`,
 idea:String.raw`Cyclic translation diagonalizes in Fourier modes. The k and N−k waves share an energy, giving the paired rungs in the Frost construction. Counting two electrons in the lowest rung and four in each subsequent pair gives 4m+2. The displayed real sine/cosine basis spans the same subspaces and uses equal occupations for a partially filled degenerate pair.`,
 scope:String.raw`The spectral closed-shell result assumes uniform cyclic conjugation and the declared noninteracting approximation. It does not prove a real molecule is planar, aromatic, antiaromatic or in a particular spin state. The charged-ring presets explicitly give both site count and electron count.`,
 caption:String.raw`Choose a valid cyclic shell and compare its Frost construction with actual orbital occupations. Distinguish a closed-shell gap from a partially occupied exact degeneracy.`,
 refs:['MIT 5.61Fall 2017 Lecture 26, selected benzene and cyclic-shell argument; independent Fourier derivation'],links:{source:huckelNotes},tags:['aromaticity','cyclic shells'],viz:UI.frost,
},
{
 statement:String.raw`For real orthonormal site orbitals and spatial-orbital occupations nk between zero and two, define the Coulson π-density matrix
$$P_{ij}=\sum_k n_k c_{ik}c_{jk}.$$
The π population at site i is Pii, its π charge relative to one electron is 1−Pii, and Pij is the π bond order in the chosen site-phase convention. Consequently
$$\tr P=N_e.$$
$$\sum_i(1-P_{ii})=N-N_e.$$
The noninteracting orbital energy is $\tr(PH)$.`,
 idea:String.raw`Each occupied orbital contributes its normalized coefficient outer product. Taking the trace counts its electrons; taking the trace against H gives its occupied eigenvalue. Changing a site energy redistributes populations, while the total remains fixed. Degenerate-sector density is basis independent when equal occupations are assigned to the whole sector.`,
 scope:String.raw`π bookkeeping in the elementary Hückel basis, not full molecular formal charge, a unique experimental atomic charge or a calibrated bond-length relation. Flipping a site function’s phase also changes the associated hopping and bond-order signs.`,
 caption:String.raw`Change graph, π charge and one site energy. Inspect the full density matrix beside site populations and check both electron-count and total-charge identities.`,
 refs:['MIT 5.61Fall 2017 Lecture 26, PDF 9–10 bond-order discussion; independent density-matrix identities'],links:{source:huckelNotes},tags:['Coulson bond order','π density'],viz:UI.coulson,
},
{
 statement:String.raw`For an alternant Hückel system, partition sites into two sets with hopping only between the sets and equal on-site energy α. Let Γ be +1 on one set and −1 on the other. Then
$$\Gamma(H-\alpha I)\Gamma=-(H-\alpha I).$$
If c has energy α+ε, Γc has energy α−ε. The spectrum is paired around α, with possible unpaired zero modes when the two sublattice sizes differ.`,
 idea:String.raw`After ordering the sites, the shifted matrix has off-diagonal blocks B and its transpose. Multiplication by Γ changes their sign, so applying Γ to an eigen-equation produces the partner. For a neutral closed shell, the paired eigenvectors have identical squared site coefficients; completeness then gives unit population per site. Zero modes require a stated half-filled equal-occupation ensemble for that population conclusion.`,
 scope:String.raw`Exact bipartite topology and zero on-site offsets are hypotheses, not consequences of a small computed pairing residual. Odd cycles or site-energy bias can break the argument. The original Coulson–Rushbrooke (1940) body was not read; the displayed proof is the explicit matrix argument.`,
 caption:String.raw`Change a bipartite graph to an odd-cycle graph or add site bias. Compare the actual spectrum with its reflected partner and inspect both the input hypotheses and the anticommutator residual.`,
 refs:['Self-contained bipartite matrix proof; Coulson–Rushbrooke (1940) bibliographic metadata only'],links:{model:huckelNotes},tags:['alternant hydrocarbons','spectral pairing'],viz:UI.pairing,
},
{
 statement:String.raw`Frontier-orbital reasoning emphasizes occupied donor and empty acceptor sectors. For a possibly degenerate LUMO sector, the invariant site weight is
$$w_i=\sum_{k\in L}|c_{ik}|^2.$$
In a declared restricted model, couple one doubly occupied donor at energy −Δ to a LUMO sector at zero through site i. If the site coupling is g, the bright combination has coupling $g\sqrt{w_i}$ and the exact two-electron lowering is
$$D=\frac{2g^2w_i}{\sqrt{(\Delta/2)^2+g^2w_i}+\Delta/2}.$$
For weak coupling this approaches $2g^2w_i/\Delta$.`,
 idea:String.raw`A unitary change within a degenerate LUMO sector changes individual coefficients but preserves their squared sum. Only one linear combination couples to the chosen donor; the orthogonal combinations are dark in this restricted model. Diagonalizing that two-state bright block and rationalizing its lower eigenvalue gives D without subtracting nearly equal energies.`,
 scope:String.raw`Closed-shell acceptor presets, positive donor separation and a chosen single donor interaction. Other occupied/empty orbitals, electron repulsion, sterics and solvent are omitted. The result is neither a reaction barrier nor a complete prediction of reactive-site selectivity.`,
 caption:String.raw`Choose an acceptor and valid coupling site. Compare the LUMO projector weights, exact donor lowering and weak-coupling estimate, including the benzene degeneracy.`,
 refs:['Self-contained spectral-projector and two-state derivation; modern Hückel setup from MIT 5.61Fall 2017Lecture 26'],links:{source:huckelNotes},tags:['frontier orbitals','spectral projector'],viz:UI.frontier,
},
{
 statement:String.raw`For ideal concerted electrocyclic reactions, the elementary Woodward–Hoffmann selection table favours conrotation for thermal 4m π-electron systems and disrotation for thermal 4m+2 systems; the elementary photochemical assignment reverses. Conrotation means both ends rotate in the same sense in one declared coordinate convention.

The workshop uses an initial open-chain density P and a weak closing hopping h. Its frozen-orbital expectation change is
$$\Delta E=2hP_{1N}.$$
Terminal p-vector rotations a,b give $h=t_c\sin a\sin b$.`,
 idea:String.raw`The open-chain HOMO has opposite endpoint signs for four electrons and matching signs for six. Reversing one terminal rotation reverses the facing-lobe product. A single HOMO-to-LUMO promotion reverses the elementary frontier-phase preference; the widget also evaluates the full initial density rather than only one orbital. The thermal/photo selection table is supported separately by the read MIT 2003 handout.`,
 scope:String.raw`Ideal symmetry reasoning and an explicitly frozen initial-orbital calculation. The plotted expectation is not an adiabatic reaction profile or activation barrier. A one-electron promotion is not a complete photochemical mechanism, spin selection or yield calculation. No cis/trans product is assigned without specifying initial substituent geometry.`,
 caption:String.raw`Switch four and six π electrons, change the initial occupation and compare conrotatory with disrotatory motion. Inspect terminal phase geometry and the actual initial-density expectation.`,
 refs:['Timothy F. Jamison, MIT 5.13 Organic Chemistry II, October 17, 2003 Lecture 16, complete one-page handout; independent phase/expectation calculation'],links:{source:electroNotes},tags:['orbital symmetry','electrocyclic reactions'],viz:UI.selection,
},
{
 statement:String.raw`In the point-charge crystal-field approximation, negative ligands repel the metal d-electron density. Subtracting the mean of the five d levels defines a barycentre reference. Octahedral symmetry gives a lower t2g triplet and upper eg doublet:
$$\varepsilon(t_{2g})=-\tfrac25\Delta_o,$$
$$\varepsilon(e_g)=\tfrac35\Delta_o.$$
Tetrahedral symmetry reverses the ordering. At the same point-ligand charge and radius, with the same radial moment in this approximation, $\Delta_t=4\Delta_o/9$.`,
 idea:String.raw`Project the ligand Coulomb expansion onto five normalized real d angular functions. For the two declared ligand geometries, degree2 terms cancel and the first splitting term has degree4, proportional to $R^{-5}\sum_LP_4(n\cdot u_L)$. Exact sphere monomial moments evaluate its matrix; remove the mean diagonal times the identity and diagonalize. The octahedral triplet/doublet structure and the tetrahedral 4/9 ratio follow from those actual angular projections.`,
 scope:String.raw`Electrostatic point ligands, fixed radial moment and the leading splitting term. Energy is normalized to the octahedral splitting at the reference radius. Covalency, ligand molecular orbitals and measured spectra are absent. Trace subtraction chooses an energy zero; it does not assert that total electrostatic energy is physically unchanged.`,
 caption:String.raw`Switch octahedral and tetrahedral point ligands and vary their common radius. Follow the computed d-level pattern, its zero trace and R⁻⁵ splitting.`,
 refs:['Drennan/Taylor, MIT 5.111Fall 2008 Lecture Summary 28, complete handout and PDF 5 figure; independent exact angular projection'],links:{source:'https://ocw.mit.edu/courses/5-111-principles-of-chemical-science-fall-2008/c1c824f9d56c6b89055adfa31d7a2c82_lecnotes28.pdf'},tags:['crystal field','angular projection'],viz:UI.crystal,
},
{
 statement:String.raw`For six d electrons in an octahedral field, consider a chosen occupation model
$$E=\sum_i n_i\varepsilon_i+P N_{\rm pair},$$
with ni=0,1,2 and pairing cost P≥0. The high-spin candidate t2g⁴eg² has energy $-2\Delta/5+P$; the low-spin candidate t2g⁶ has energy $-12\Delta/5+3P$. They cross at Δ=P. At that equality this bare model also admits intermediate-spin occupations, so it does not choose a unique magnetic moment.`,
 idea:String.raw`Enumerate all capacity-valid five-orbital occupations with total electron count six. Compare the field cost of occupying an upper eg level with the cost of adding a paired slot below. Smaller splitting favours fewer pairs; larger splitting favours occupying the lower triplet completely. For a chosen representative with parallel unpaired spins, the spin-only moment is $\sqrt{u(u+2)}\,\mu_B$, where u is the number of unpaired electrons.`,
 scope:String.raw`A simplified occupation energy and an added Hund preference for parallel unpaired spins, not a full electron-interaction Hamiltonian. An arbitrary spin product need not have definite total spin. The displayed moment is a spin-only representative, not a measured moment including orbital and thermal effects.`,
 caption:String.raw`Vary octahedral splitting and pairing cost. Inspect the ground occupations and their possible unpaired counts, especially the nonunique crossing, against the two candidate energy curves.`,
 refs:['MIT 5.111Fall 2008 Lecture Summary 28, field-versus-pairing discussion; independent full occupation enumeration'],links:{source:'https://ocw.mit.edu/courses/5-111-principles-of-chemical-science-fall-2008/c1c824f9d56c6b89055adfa31d7a2c82_lecnotes28.pdf'},tags:['spin crossover','pairing energy'],viz:UI.spin,
},
{
 statement:String.raw`The Jahn–Teller theorem concerns a nonlinear molecule in a spatially degenerate electronic ground state: coupling to a suitable nuclear distortion can lower the energy and remove the degeneracy. Degeneracy due only to Kramers spin pairing is excluded.

An explicit linear E⊗e model has two electronic states and two distortion coordinates. With r²=x²+y²,
$$V_\pm(r)=\tfrac12Kr^2\pm gr,$$
where K>0 and g≥0. For g>0 its lower surface has a circle of minima at r=g/K and lowering $g^2/(2K)$.`,
 idea:String.raw`In a real electronic basis the linear coupling can be $g(x\sigma_z+y\sigma_x)$. Its two eigenvalues are ±gr. The negative linear term beats a positive quadratic elastic cost near the degenerate origin, and differentiating the lower branch gives the minimum. The continuous circle comes from the isotropic truncation; higher-order molecular terms can select particular directions.`,
 scope:String.raw`A local two-state vibronic illustration, not a fit to a particular metal complex or a proof that every partly filled d shell is Jahn–Teller active. Many-electron ground-state symmetry and an allowed coupling matter. K is an elastic coefficient, not the symbol for an angular frequency. At g=0 the minimum is the origin.`,
 caption:String.raw`Change coupling and elasticity, then move around the lower potential surface. Compare a selected distortion with the computed radial branches, minimum radius and energy lowering.`,
 refs:['MIT 5.73 Introductory Quantum Mechanics I Fall 2005, problem set 7 solutions, selected scientific text and PDF 3–4; independent E⊗e diagonalization'],links:{source:'https://ocw.mit.edu/courses/5-73-introductory-quantum-mechanics-i-fall-2005/2842546132cb04e435063e18ade2d2fb_s7.pdf'},tags:['Jahn–Teller','vibronic coupling'],viz:UI.jt,
},
{
 statement:String.raw`A half-filled one-dimensional π chain can lower its electronic energy by alternating nearest-neighbour hoppings $t(1+\delta),t(1-\delta)$. For an infinite periodic chain, put a=t(1+δ), b=t(1−δ) and
$$F(k)=a^2+b^2+2ab\cos k.$$
The two bands are
$$E_\pm(k)=\pm\sqrt{F(k)},$$
and their gap is $4t|\delta|$. A finite open chain has a size-dependent gap even at δ=0. Its termination also matters: weak terminal bonds can introduce edge states absent from the strongly terminated examples here.`,
 idea:String.raw`A two-site periodic cell yields a two-by-two Bloch matrix with alternating intracell/intercell hopping. At the zone boundary their difference sets the bulk gap. For the actual finite widget, diagonalize the selected open or periodic matrix and add a declared elastic cost KNδ². Periodic 4m neutral rings have a uniform Fermi degeneracy and a linear small-distortion electronic gain; finite periodic 4m+2 rings instead start quadratically. The infinite-chain instability cannot be inferred from every finite size at every stiffness.`,
 scope:String.raw`Noninteracting hopping model with declared boundary and elastic conventions. Strongly terminated open chains have one more strong than weak bond, so their mean over N−1 bonds is not exactly t. Finite, surface and thermodynamic-limit claims are distinct. No measured bond lengths, calibrated optical gap or β-carotene colour is predicted.`,
 caption:String.raw`Alternate hopping, change finite size and switch boundaries. Compare the actual finite gap with 4tδ while reading electronic energy and the separate elastic cost.`,
 refs:['Self-contained alternating-chain Bloch and finite-matrix derivation; Hückel setup from MIT 5.61Fall 2017Lecture 26'],links:{model:huckelNotes},tags:['Peierls distortion','finite-size gap'],viz:UI.peierls,
},
{
 statement:String.raw`The selected pages of Pauling’s 1931 paper construct directional orbitals from atomic angular functions. In the angular normalization used here, a pure p function has maximum √3, while a normalized optimal s/p combination along a direction n has maximum 2:
$$h_n=\tfrac12s+\tfrac{\sqrt3}{2}p_n.$$
Four such functions are orthogonal when their directions have pairwise dot product −1/3, the tetrahedral arrangement. This is a directional-amplitude construction, not an energy functional.`,
 idea:String.raw`For a unit direction u, the basis evaluation vector is $(1,\sqrt3u)$ and has norm2. Cauchy–Schwarz therefore bounds a normalized coefficient vector’s angular amplitude by2, attained by half that evaluation vector. The source’s tetrahedral coefficient quartet has Gram matrix I. A separate square-planar quartet in s,px,py,dx²−y² is also orthonormal; its canonical axis amplitude evaluates to $1/2+\sqrt{3/2}+\sqrt{15}/4\approx2.692991$. Orthogonal rotation of two rows preserves the quartet’s Gram matrix and total angular density, but changes each directional amplitude.`,
 scope:String.raw`Selected original scan pages were read: printed 1367–1369,1376–1379,1387–1389. The scan omits printed1374, so no whole-paper reading is claimed. The printed square-planar value 2.694 differs from evaluating its stated expression; the widget computes the expression. Selected radial assumptions and angular strengths do not calculate real bond energies or prove every complex has this geometry.`,
 caption:String.raw`Switch the canonical tetrahedral and square-planar angular quartets, then rotate two hybrids orthogonally. Inspect the Gram matrix and directional amplitudes while the total angular density stays invariant.`,
 refs:['Pauling (1931), selected original scan passages as scoped; independent Gram and Cauchy–Schwarz calculations'],links:{source:'https://boscoh.com/pdf/pauling.pdf'},tags:['Pauling (1931)','directional orbitals'],viz:UI.pauling,
},
{
 statement:String.raw`Hückel’s 1931 paper is associated with the quantum treatment of benzene and related π systems. The bibliography below identifies the historical work. The interactive calculation is a modern declared model: close an even open Hückel chain by changing a final edge from zero to unit hopping, keep one electron per site and solve the resulting matrix.
$$E_\pi=\sum_k n_k\varepsilon_k.$$
The reference of N/2 isolated unit-hopping dimers has energy −Nt relative to Nα.`,
 idea:String.raw`The open endpoint is the exact chain problem; the fully closed endpoint has cyclic Fourier levels. Intermediate closing-edge weights require the actual finite eigenproblem. Follow the occupied energy and density, handling numerically unresolved frontier clusters with an explicit equal-occupation convention. Comparing the two endpoints separates ring closure from the independently defined dimer reference.`,
 scope:String.raw`The original 1931 body was not read after an access failure; no original tables, determinant pages or historical numerical data are claimed. The workshop is derived locally and uses the separately read modern MIT teaching notes. A neutral 4m model’s degeneracy does not prove a real molecule remains planar or chooses a particular spin.`,
 caption:String.raw`Close neutral four-, six-, eight- and ten-site skeletons. Compare the actual occupied energy, finite frontier status, open-chain shift and isolated-dimer reference.`,
 refs:['Hückel (1931) historical bibliography; original body not read','MIT 5.61Fall 2017Lecture 26, selected PDF 1–10; independent finite graph experiment'],links:{model:huckelNotes},tags:['Hückel (1931)','ring closure'],viz:UI.huckelPaper,
},
{
 statement:String.raw`Woodward and Hoffmann’s 1965 paper introduced orbital-symmetry reasoning for electrocyclic stereochemistry. In the ideal selection table, thermal closure of a 4m π system favours conrotation and of a 4m+2 system favours disrotation; the elementary photochemical assignment reverses. The historical citation is distinct from the modern initial-orbital workshop shown here.`,
 idea:String.raw`The exact open-chain coefficients of 6.5 determine the terminal phases. Choose a ground occupation or a single HOMO-to-LUMO promotion, then rotate each end independently. The facing-lobe factor and the full density-matrix closing-edge expectation test the declared phase convention. Equal or opposite rotations recover the elementary table, while an unrotated end gives no coupling in this particular geometrical model. The independently read MIT 2003 handout supplies the teaching selection table.`,
 scope:String.raw`The original 1965 body was not read after the observed access restriction; no original reaction dataset or figure is reproduced. This frozen-orbital expectation is not a complete orbital-correlation diagram, activation barrier or photochemical yield. An actual cis/trans product requires a specified starting substituent geometry, which this workshop does not assert.`,
 caption:String.raw`Choose four or six electrons and rotate the two ends independently. Compare the initial frontier amplitudes, facing phases and complete-density expectation, then recover the conrotatory and disrotatory limits.`,
 refs:['Woodward–Hoffmann (1965) historical bibliography; original body not read','Jamison, MIT 5.13 Organic Chemistry II, October 17, 2003 Lecture 16, complete handout; independent phase calculation'],links:{model:electroNotes},tags:['Woodward–Hoffmann (1965)','orbital symmetry'],viz:UI.symmetryPaper,
},
];
export default {collection:'qchem',chapter:6,title:'Bonding in polyatomic molecules',summary:String.raw`Polyatomic bonding uses several models with different purposes: domain geometry, localized angular orbitals and finite π-electron Hamiltonians. Orbital filling and symmetry connect these constructions to cyclic shells, reaction selection and metal d-level splitting. Each visualization computes its declared quantities while keeping empirical geometry, interacting-electron claims and historical source access separate.`,items:identities.map((identity,i)=>({...identity,...lessons[i]}))};
