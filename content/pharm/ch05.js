import * as U from './ch05.ui.shared.js';
const label='https://dailymed.nlm.nih.gov/dailymed/lookup.cfm?setid=601f7353-225d-4a5d-9810-3869c2c21874&version=16';
const m12='https://www.fda.gov/media/161199/download';
export default {
 collection:'pharm',chapter:5,title:'Nonlinear kinetics, metabolism and interactions',
 summary:String.raw`Concentration-dependent elimination breaks the constant-clearance picture. Saturation, enzyme turnover and binding each introduce a different mechanism; genotype classification introduces a different kind of uncertainty. Explicit balances show which changes affect free concentration, total concentration or metabolite formation. All numerical experiments use chosen educational parameters.`,
 items:[
 {num:'5.1',kind:'Model',name:'Michaelis–Menten elimination',
 statement:String.raw`In a well-mixed compartment of fixed volume, suppose elimination has a saturable rate and no further input:
$$\dot C=-\frac{vC}{K+C},\qquad v,K>0.$$
For $C_0>0$, the unique positive solution satisfies
$$C-C_0+K\log(C/C_0)=-vt.$$
The effective concentration-clearance coefficient $v/(K+C)$ decreases as concentration rises. At $C_0=0$, the solution stays zero.`,
 idea:String.raw`PHARM 2.1 supplies the compartment balance; MATHBIO 5.4 supplies the catalytic quasi-steady reduction that can motivate the saturable removal law. Divide by $C$ and separate variables. The left side is strictly increasing in $C>0$, ranges from negative infinity to positive infinity, and therefore determines one solution at every finite time. For computation set $u=\log(C/C_0)$ and solve $C_0\operatorname{expm1}(u)+Ku+vt=0$. In a semilog view,
$$\frac{d\log C}{dt}=-\frac{v}{K+C},$$
$$\frac{d^2\log C}{dt^2}=-\frac{v^2C}{(K+C)^3}<0.$$
The increasingly negative slope distinguishes this model from constant first-order clearance.`,
 caption:String.raw`Move the time marker and change the initial concentration, capacity and Michaelis scale. Compare the saturating elimination-rate curve with the computed decline. Switch to log concentration to see the slope become more negative as saturation eases.`,
 scope:String.raw`Chosen concentration units and time units; v has concentration/time units and K concentration units. Fixed volume, one saturable removal route, no input, no distribution compartments. The catalytic reduction requires its own timescale assumptions. It is not a universal law for metabolism. A remaining concentration below numeric range retains its log value and is identified explicitly.`,
 deps:['mathbio-5.4','pharm-2.1'],see:['kin-6.2','pharm-5.2'],refs:['MATHBIO 5.4: actual integrated depletion law and QSSA hypotheses','Authored constant-volume compartment reduction'],tags:['saturation','elimination'],viz:U.eliminationWidget},
 {num:'5.2',kind:'Phenomenon',name:'Phenytoin: disproportionate rise at steady state',
 statement:String.raw`Phenytoin metabolism can saturate, making concentration rise disproportionately as input increases. In a chosen constant-input reduction,
$$\dot C=r-\frac{vC}{K+C},$$
a finite steady concentration exists exactly when $0\le r<v$. Writing $q=r/v$ gives
$$C_*=K\frac{q}{1-q}.$$
For $0<q<1$, its input elasticity is $d\log C_*/d\log r=1/(1-q)$.`,
 idea:String.raw`Set input equal to saturable elimination from 5.1 and solve for concentration. The elimination function increases strictly from zero toward v but never reaches v at a finite concentration. This establishes the existence threshold and the attracting sign of the scalar balance below it. Differentiating the solved expression yields the elasticity. A 20% increase doubles the steady level only for the chosen comparison $q=2/3$ to $q=0.8$; it is not a universal label rule. At $r=v$, the concentration still grows, with a diminishing positive derivative, rather than a finite plateau.`,
 caption:String.raw`Change input as a fraction of elimination capacity. Near capacity, compare a small input change with the much larger steady concentration change. At or above capacity the readout reports no finite steady state. The plotted branch ends at q=0.95; its endpoint is a plotting limit.`,
 scope:String.raw`The official label supports the qualitative saturation phenomenon; all K and capacity fractions here are chosen. Constant systemic input approximates an average balance and is not an oral peak/trough calculation or a dose recommendation. The model has no alternative removal route. Phenytoin's label names CYP2C9 and a lesser CYP2C19 contribution; this example is separate from the CYP2D6 classifier.`,
 deps:['pharm-5.1'],see:['pharm-5.5'],refs:['Official DailyMed phenytoin label, §12.3 Metabolism','Independent steady balance and sensitivity derivation'],links:{label},tags:['steady state','saturation'],viz:U.steadyWidget},
 {num:'5.3',kind:'Phenomenon',name:'Zero-order elimination of ethanol',
 statement:String.raw`A saturated removal pathway can approximate concentration-independent elimination over a high-concentration interval. For the chosen law of 5.1,
$$-\dot C=\frac{vC}{K+C}\approx v\quad(C\gg K).$$
The resulting local approximation $C\approx C_0-vt$ cannot be continued through zero. At low concentration, the same law approaches first-order removal, $\dot C\approx-(v/K)C$. Neither limit establishes a universal human alcohol-clearance rate.`,
 idea:String.raw`Divide the exact elimination rate by v: its relative deficit from full capacity is $K/(K+C)$. This quantifies when a nearly straight decline is justified. At $C\le K$ the rate is at most half capacity, so extending a high-concentration straight line becomes misleading. The official NIAAA journal passage describes ADH converting ethanol to acetaldehyde, followed by ALDH conversion to acetate, with variation among enzymes. Those qualitative observations do not calibrate this single chosen compartment.`,
 caption:String.raw`Compare the actual positive saturable decline with a high-concentration straight-line approximation and a low-concentration exponential. The straight segment is drawn only while its own concentration is at least 5 K, a declared illustration threshold; the exact curve continues smoothly below it.`,
 scope:String.raw`All concentrations, times, capacities and scales are normalized choices. This is a saturation-limit experiment, not fitted blood-alcohol data. No drink count, body mass, impairment threshold or safe-clearance time is inferred. The NIAAA source supplies qualitative metabolism only; the original quantitative ethanol papers were not read.`,
 deps:['pharm-5.1'],see:['pharm-5.8'],refs:['Wall, Luczak & Hiller-Sturmhöfel, Biology, Genetics, and Environment, printed p.60, Alcohol Metabolism','Authored asymptotic comparison of the5.1 model'],links:{source:'https://arcr.niaaa.nih.gov/media/466/download'},tags:['saturation','approximation'],viz:U.ethanolWidget},
 {num:'5.4',kind:'Concept',name:'Enzyme inhibition and induction',
 statement:String.raw`For low substrate and a fixed free competitive inhibitor, an enzyme-limited pathway's intrinsic clearance is multiplied by $1/(1+z)$, where $z=I_u/K_i$. A different mechanism changes enzyme abundance. An authored constant-inducer step model is
$$\dot E=k_d(1+a-E),$$
$$E(0)=1,$$
$$a=E_{\max}\frac{u}{1+u},$$
$$u=I_u/EC_{50}.$$
Its exact response is $E(t)=1+a(1-e^{-k_dt})$. Combining these assumptions gives the pathway factor $E(t)/(1+z)$.`,
 idea:String.raw`MATHBIO 5.7 supplies competitive inhibition with free inhibitor: taking its low-substrate limit yields the immediate intrinsic-clearance multiplier. For induction, solve a separate first-order enzyme-turnover balance after the inducer steps to a constant level. Binding inhibition is treated as instantaneous on this turnover timescale; abundance changes gradually. These mechanisms can oppose one another, and their net effect depends on time. The experiment displays pathway capacity, not a computed victim concentration or clinical interaction category.`,
 caption:String.raw`Change fixed inhibitor and inducer ratios and move through the enzyme response. Compare the immediate inhibition factor, the growing enzyme abundance and their combined pathway factor. A zero inducer removes the gradual change; a zero inhibitor removes the immediate reduction.`,
 scope:String.raw`Chosen time and turnover units, low victim-substrate concentration, enzyme-limited intrinsic clearance, fixed free concentrations at the enzyme and reversible competitive inhibition. This is not mechanism-based enzyme inactivation or uncompetitive inhibition. Generic induction here is not a claim that medicines clinically induce CYP2D6.`,
 deps:['pharm-5.1','mathbio-5.7','ode-1.4'],see:['pharm-5.5','pharm-5.7'],refs:['MATHBIO 5.7: competitive low-substrate limit','FDA/ICH M12 (2024), inhibition/induction mechanisms','Authored first-order enzyme step'],links:{guidance:m12},tags:['inhibition','induction'],viz:U.enzymeWidget},
 {num:'5.5',kind:'Method',name:'Predicting interaction size from the inhibitor’s Ki',
 statement:String.raw`Assume equal finite systemic dose between conditions, complete washout and parallel constant-clearance pathways. Let $f_m$ be the affected fraction of baseline TOTAL systemic clearance, with only that pathway inhibited by $1/(1+z)$, $z=I_u/K_i\ge0$. Then
$$\frac{CL'}{CL}=1-f_m+\frac{f_m}{1+z},$$
$$\mathrm{AUCR}=\frac{CL}{CL'}.$$
For $f_m<1$ its inhibition-only limit is $1/(1-f_m)$; for $f_m=1$ the ratio is $1+z$.`,
 idea:String.raw`PHARM 1.5 relates equal finite systemic dose over complete washout to inverse constant clearance. Divide baseline removal into the affected and unaffected fractions, rescale only the former, and invert the resulting total. A small affected fraction still changes exposure; a large fraction permits a larger limit. A separately derived flow-limited comparison uses PHARM 1.4 organ balance:
$$Q(C_{in}-C_{out})=f_u CL_{int}C_{out},$$
$$CL_h=\frac{Q f_u CL_{int}}{Q+f_u CL_{int}}.$$
After inhibition, substitute $CL_{int}/(1+z)$ and recompute total clearance with an unaffected route. The two comparisons have different definitions and assumptions.`,
 caption:String.raw`Switch between the parallel total-clearance approximation and the well-stirred organ comparison. Change free inhibitor/Ki, the affected fraction or intrinsic clearance. The selected ratio is computed from the corresponding model, including its unaffected route.`,
 scope:String.raw`No gut first-pass change, variable bioavailability, transport inhibition, saturating victim kinetics or changing inhibitor concentration in the reduced total-fraction formula. The organ comparison fixes Q=1, free fraction=0.2 and other clearance=0.2 in compatible chosen units. This is not the complete FDA static model: M12's hepatic fraction and gut factors must not be substituted without their stated assumptions.`,
 deps:['pharm-5.4','pharm-1.5','pharm-1.4'],see:['pharm-3.6'],refs:['FDA/ICH M12 (2024), Appendix D §7.5.1, printed pp.50–51: scope comparison','Independent parallel-clearance and well-stirred balances'],links:{guidance:m12},tags:['interaction','clearance'],viz:U.interactionWidget},
 ]
};
