import * as U from './ch05.ui.shared.js';
const cpic='https://files.cpicpgx.org/data/guideline/publication/ondansetron/2026/41979467.pdf';
export default {collection:'pharm',chapter:5,items:[
 {num:'5.6',kind:'Concept',name:'Pharmacogenetics: CYP2D6 metabolizer phenotypes',
 statement:String.raw`For a resolved CYP2D6 haplotype configuration, sum the assigned functions of the identified gene copies to obtain an activity score, AS. The 2026 CPIC table classifies AS=0 as poor, 0<AS<1.25 intermediate, 1.25≤AS≤2.25 normal, and AS>2.25 ultrarapid. Uncertain-function alleles can be indeterminate. Copy count alone does not determine the score. Genotype-predicted and inhibitor-adjusted phenotypes are distinct.`,
 idea:String.raw`The dated table supplies selected scores: *1 has 1, *5 has 0, *10 has 0.25, and its *1/*41 and *41/*41 examples imply *41 has 0.25. An unresolved three-copy *1/*4 report can mean scores 1 or 2 depending on which allele is duplicated; duplicating a no-function allele does not create function. A separate 2021 CPIC convention sets known scores to0 under a strong inhibitor and halves them under a moderate inhibitor before classification. That convention is not a mechanistic drug-clearance equation. POPGEN 1.5 can compute $p^2,2p(1-p),(1-p)^2$ for a chosen two-haplotype mating pool, but cannot resolve unknown structural variants.`,
 caption:String.raw`Choose an explicitly identified configuration or an unresolved/uncertain example, then compare baseline and inhibitor-adjusted classifications. In the separate two-haplotype pool, vary a chosen frequency and each haplotype's functional score; inspect the three exact expected genotype proportions.`,
 scope:String.raw`Selected 2026 CPIC examples and score boundaries; 2021 inhibitor-adjustment convention. Assay omissions, hybrid alleles and unknown copy phase can invalidate a definite assignment. The pool is an idealized random-mating diploid model with chosen haplotype functions, not measured population frequencies. A duplicated gene can be part of one inherited haplotype. No individual exposure curve or dose is predicted.`,
 deps:['pharm-5.4','popgen-1.5'],see:['pharm-5.8'],refs:['CPIC 2026 ondansetron/tropisetron update, PDF p.2, Table 1 and genetic-test text','CPIC opioid guideline (2021), PDF p.3, inhibitor phenoconversion paragraph'],links:{classification:cpic,phenoconversion:'https://files.cpicpgx.org/data/guideline/publication/opioids/2020/33387367.pdf'},tags:['pharmacogenetics','uncertainty'],viz:U.cypWidget},
 {num:'5.7',kind:'Model',name:'Autoinduction (carbamazepine)',
 statement:String.raw`Carbamazepine induces its own metabolism. One explicitly chosen constant-input feedback model couples concentration C to enzyme abundance E:
$$\dot C=R-k_0EC,$$
$$\dot E=k_d\left[1+\frac{aC}{H+C}-E\right],$$
with $C(0)=0$, $E(0)=1$, $R\ge0$, positive $k_0,k_d,H$ and $a\ge0$. It has one nonnegative equilibrium. A concentration overshoot can occur, but is not guaranteed.`,
 idea:String.raw`Apply 5.4 to an inducer that is also the removed substrate. At equilibrium, $E_*=1+aC_*/(H+C_*)$. Substitution yields
$$k_0(1+a)C_*^2+(k_0H-R)C_*$$
$$\qquad{}-RH=0.$$
The removal function $k_0C[1+aC/(H+C)]$ is strictly increasing from zero to infinity, proving uniqueness. Slow enzyme turnover can let concentration rise before capacity catches up. Integrate this actual coupled system and compare a half-step calculation; do not prescribe a rise-then-fall shape. Adding eliminated amount $D'=k_0EC$ checks $C+D=Rt$ in the chosen unit-volume compartment.`,
 caption:String.raw`Change constant input, basal removal, induction strength and enzyme turnover. Watch the computed concentration and enzyme traces. Compare the achieved maximum with the final value and the derived equilibrium; weak or fast induction may have no visible overshoot.`,
 scope:String.raw`All rates, concentrations and time units are chosen and uncalibrated; a fixed unit volume makes eliminated amount numerically comparable with C. The official label describes autoinduction over 3–5 weeks under a fixed regimen, but that observation does not calibrate the widget's time axis. This is continuous input, not an oral regimen simulation. Finite-time refinement is a numerical check, not a proof of equilibrium convergence.`,
 deps:['pharm-5.4','pharm-2.1','ode-1.4'],see:['pharm-5.2'],refs:['Official DailyMed carbamazepine extended-release label, Clinical Pharmacology','Authored concentration/enzyme turnover balance'],links:{label:'https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=7c1dd8ce-c490-40b4-b17a-da331df24cba'},tags:['feedback','induction'],viz:U.autoWidget},
 {num:'5.8',kind:'Model',name:'Parent–metabolite kinetics and prodrugs',
 statement:String.raw`Let A be parent amount and M metabolite amount in parent-molecule equivalents. With positive rates and a fixed formation fraction $0\le f\le1$,
$$\dot A=-k_pA,$$
$$A(0)=D,$$
$$\dot M=fk_pA-k_mM,$$
$$M(0)=0.$$
For unequal rates,
$$M=\frac{fk_pD}{k_p-k_m}$$
$$\qquad{}\times(e^{-k_mt}-e^{-k_pt}).$$
At exactly equal rates, $M=fk_pDt e^{-k_pt}$.`,
 idea:String.raw`PHARM 2.7 supplies the two-stage integrating-factor argument, with metabolite formation replacing absorption input. Integrate $[M e^{k_mt}]'=fk_pD e^{(k_m-k_p)t}$; when the rates coincide the integrand is constant. A stable evaluation uses expm1, preserving the exact equal-rate limit without an arbitrary near-equality switch. Track total eliminated equivalents with $U'=(1-f)k_pA+k_mM$: then $A+M+U=D$. If parent removal is slower than metabolite removal, the late metabolite tail can reflect continuing formation. Inhibiting formation of an active metabolite can have a different effect from slowing removal of an active parent.`,
 caption:String.raw`Vary both rates, the formation fraction and the initial amount. Move the time marker to inspect parent, metabolite and eliminated equivalents in the accounting panel. Apply the equal-rate button to check the actual limiting formula.`,
 scope:String.raw`Linear first-order amounts, one formation route, no return conversion and initially absent metabolite. Parent-molecule equivalents conserve molecular accounting, not equal masses in mg for molecules of different molecular weight. Concentrations would require specified volumes. No codeine/morphine clinical concentration curve is reproduced.`,
 deps:['pharm-2.7','pharm-2.1'],see:['pharm-5.6'],refs:['PHARM 2.7: actual two-stage integrating-factor derivation','Independent formation-fraction and eliminated-equivalent balance'],tags:['metabolite','mass balance'],viz:U.metaboliteWidget},
 {num:'5.9',kind:'Concept',name:'Saturable protein binding',
 statement:String.raw`For one class of independent binding sites at instantaneous equilibrium,
$$B=B_{\max}\frac{C_u}{K_d+C_u},$$
$$C_t=C_u+B.$$
The isotherm uses FREE concentration $C_u$, not total concentration $C_t$. Since
$$\frac{dC_t}{dC_u}=1+\frac{B_{\max}K_d}{(K_d+C_u)^2}>0,$$
each nonnegative total concentration determines a unique free concentration. Its free fraction increases toward 1 as binding saturates.`,
 idea:String.raw`MATHBIO 5.2 supplies the free-ligand binding law; PHARM 1.7 connects it to plasma binding. Combine bound and free concentrations to get a quadratic in $C_u$, and rationalize its positive root when direct subtraction would cancel. At zero total concentration, the fraction is undefined but its limiting value is $K_d/(K_d+B_{\max})$. For a separate low-extraction model with fixed unbound clearance, the balance is
$$V\frac{dC_t}{dC_u}\dot C_u=R-CL_u C_u.$$
Thus $C_{u,*}=R/CL_u$, while the corresponding total changes with binding. Binding saturation alone does not imply saturation of unbound elimination.`,
 caption:String.raw`Choose total concentration to see the separately computed free and bound amounts. Switch to the constant-input steady comparison: change binding capacity while observing that the chosen model's free steady concentration is fixed by input/unbound clearance.`,
 scope:String.raw`Chosen compatible concentration units; positive Kd, nonnegative site capacity, one rapid binding class, fixed volume. The steady-input conclusion requires constant unbound clearance and the stated low-extraction approximation; it need not hold for flow-limited removal. Underflow of a free or bound output is identified rather than interpreted as exact absence.`,
 deps:['pharm-1.7','mathbio-5.2','pharm-1.4'],see:['pharm-5.10'],refs:['MATHBIO 5.2: actual free-ligand binding and conservation','PHARM 1.7: low- versus high-extraction distinction','Independent monotone inverse and steady balance'],tags:['binding','free concentration'],viz:U.bindingWidget},
 {num:'5.10',kind:'Model',name:'Target-mediated drug disposition',verify:true,
 statement:String.raw`An authored mass-action model couples free ligand L, free target R and complex C. Write $J=k_{on}LR$ for association:
$$\dot L=-k_eL-J+k_{off}C,$$
$$\dot R=k_s-k_dR-J+k_{off}C,$$
$$\dot C=k_{on}LR-(k_{off}+k_i)C.$$
The complex can remove ligand by internalization. Binding alone changes distribution; without an elimination route for bound ligand, it is not itself a clearance flux.`,
 idea:String.raw`MATHBIO 5.2 supplies the free ligand–target association/dissociation terms. Add independently declared free-ligand elimination, target synthesis/turnover and complex internalization. Initialize L at a nonnegative bolus, $R=k_s/k_d$ and C=0. Each boundary derivative points into the nonnegative orthant. With eliminated ligand $D'=k_eL+k_iC$,
$$L+C+D=L(0).$$
Target total instead obeys $(R+C)'=k_s-k_dR-k_iC$ and is generally not constant. Compute all states and compare with a binding-off reference and half-step integration. A Michaelis reduction needs additional fast-binding/target assumptions; a complex QSS scale involves $(k_{off}+k_i)/k_{on}$, not automatically the equilibrium dissociation constant.`,
 caption:String.raw`Compare binding with internalization, binding without internalization and binding switched off. Change initial ligand, target abundance and association. Inspect free, bound and total drug alongside target turnover and the independently integrated elimination balance.`,
 scope:String.raw`All parameters are chosen in normalized concentration/time units in one fixed unit volume. No named biologic curve, universal dose-dependent clearance or universal terminal slope is asserted. Mager–Jusko (2001) is attributed only through its actually read abstract; the original full body became inaccessible after an official 403 and remains unread. These equations are independently specified, not a reproduction of that paper. The original-body uncertainty remains flagged.`,
 deps:['pharm-5.1','mathbio-5.2','pharm-2.1'],see:['pharm-5.9'],refs:['Mager & Jusko (2001), actually read PubMed abstract only; original body unread','Authored mass-action/turnover and ligand balance'],links:{abstract:'https://pubmed.ncbi.nlm.nih.gov/11999290/'},tags:['target binding','nonlinear kinetics'],viz:U.targetWidget},
]};
