import * as U from './ch07.ui.shared.js';
export default {collection:'prob',chapter:7,items:[
{
num:'7.4.1',kind:'Theorem',name:'Hitting times T_a have stationary independent increments',
statement:String.raw`For Brownian motion started at zero, put $T_a=\inf\{t\ge0:B_t=a\}$ for a≥0, with T₀=0. This level-indexed family has stationary independent increments: for $0=a_0<a_1<\cdots<a_n$, the differences T_{a_i}−T_{a_{i−1}} are independent, and each has the law of T_{a_i−a_{i−1}}. Also $T_a\overset d=a^2T_1$ for a>0.`,
idea:String.raw`Recurrence makes each fixed positive-level hit finite. At T_a, strong Markov gives a fresh Brownian motion from a; translation identifies its next passage to b with a passage from zero to b−a. Iterated conditioning proves independence for successive level gaps. Brownian scaling gives the square scaling in the level.`,
caption:String.raw`Choose a range of positive levels and read off their first polygonal passages. Increasing levels cannot be reached earlier, and levels not reached in the finite window stay unreported.`,
deps:['prob-7.3.9','prob-7.2.9','prob-7.1.1a'],refs:U.reference('Theorem 7.4.1 and scaling equation (7.4.1)','371–372'),links:{source:U.SOURCE},tags:['brownian motion','hitting times'],scope:U.finiteScope+String.raw` Stationary independent increments are finite-dimensional assertions. The raw first-equality family should not silently be identified pathwise with its right-continuous subordinator modification at every random level. No such regularity assertion is made by the sampled graph.`,viz:U.passageProcess
},
{
num:'7.4.2',kind:'Theorem',name:'Reflection principle for Brownian motion',
statement:String.raw`Let B₀=0, a>0 and T_a=inf{t≥0:B_t=a}. For t>0,
$$\begin{aligned}&P(T_a\le t)=2P(B_t\ge a)\\&\qquad=2[1-\Phi(a/\sqrt t)].\end{aligned}$$
Equivalently, the maximum of B on [0,t] has the law of |B_t|. The hitting-time density for u>0 is
$$\frac{a}{\sqrt{2\pi u^3}}e^{-a^2/(2u)}.$$`,
idea:String.raw`On hitting a, strong Markov supplies a fresh symmetric Brownian continuation. Reflecting that continuation about a preserves its law and pairs endpoints below a with endpoints above a. Half the paths that have hit by t end above a; paths ending above a must have hit by continuity. The endpoint has no atom at a, and differentiating the resulting CDF gives the density.`,
caption:String.raw`Reflect one polygon after its first detected hit. The second panel compares the exact-law hit probability with half that probability as the horizon changes.`,
deps:['prob-7.3.9','prob-7.1.1a'],see:['stoch-13.7'],refs:U.reference('Example 7.4.2 and equation (7.4.6)','372–374'),links:{source:U.SOURCE},tags:['brownian motion','hitting times'],scope:U.finiteScope+String.raw` The frozen atlas kind is Theorem; Durrett labels the source passage Example 7.4.2. The probability curves use a numerical normal CDF, while the drawn reflection uses polygonal crossing times.`,viz:U.reflection
},
{
num:'7.4.3',kind:'Theorem',name:'Lévy’s arcsine law for the last zero',
statement:String.raw`For Brownian motion started at zero, let $L=\sup\{t\le1:B_t=0\}$. Its CDF on [0,1] is
$$P(L\le s)=\frac2\pi\arcsin\sqrt{s}.$$
Its density on (0,1) is $1/(\pi\sqrt{s(1-s)})$; there are no atoms at the endpoints.`,
idea:String.raw`Condition on B_s. Except on the null event B_s=0, L≤s means no zero is hit in the remaining time 1−s. The Markov property turns this into a Gaussian integral of the no-hit probability, and the reflection principle supplies that probability. Integrating over the Gaussian starting value and substituting in the hitting-time density gives the arcsine CDF.`,
caption:String.raw`Refine the path grid, move the cutoff and compare the sampled last-zero CDF with the exact arcsine curve. The selected path marks its last interpolated zero.`,
deps:['prob-7.4.2','prob-7.2.1'],see:['stoch-13.9'],refs:U.reference('Example 7.4.3, equation (7.4.7)','374'),links:{source:U.SOURCE},tags:['brownian motion','arcsine law'],scope:U.finiteScope+String.raw` The frozen atlas kind is Theorem; the source labels this Example 7.4.3. This is the last-zero law; the separate arcsine law for occupation time is not being substituted for it.`,viz:U.arcsine
}
]};
