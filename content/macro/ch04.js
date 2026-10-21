// Macroeconomics — Chapter 4: Growth II: optimal saving, ideas and history (items 4.1–4.5; 4.6–4.9 are in ch04-b.js)
import { clamp, pc, fx, capitalSavingPath } from './ch04.shared.js';
import {ramseyGrowthAudit,diamondGrowthAudit} from './source-audit-optimal-growth.js';
// 4.1: Acemoglu MIT14.452 (2020), environment/optimal-growth/steady-state/
// transitional sections slides25–54, CRRA slides60–62, read in full.
// 4.2: Acemoglu OLG (2018), complete46-slide authored lecture read;
// Diamond1965 original sections1–10,1126–1135 and reference list read.
// Original Diamond assumes zero depreciation; the displayed variant assumes full depreciation.


export default {
  collection: 'macro',
  chapter: 4,
  title: 'Growth II: optimal saving, ideas and history',
  summary: String.raw`Making saving a choice gives the Ramsey model of optimal growth and the Diamond model of overlapping generations, which can oversave. To explain long-run growth itself, endogenous-growth theory treats ideas as non-rival goods produced by research. Before 1800 the economy behaved in a Malthusian way, with technology raising population rather than living standards, and today’s income gaps reflect institutions as well as capital and ideas.`,
  items: [
    // ------------------------------------------------------------------ 4.1
    {
      num:'4.1',kind:'Model',name:'Ramsey–Cass–Koopmans optimal growth',
      statement:String.raw`A closed one-good economy has production $f(k)=Ak^\alpha$, with $A>0$, $0<\alpha<1$, fixed labour and no technological change. An infinitely lived household chooses positive consumption to maximize
$$\int_0^\infty e^{-\rho t}u_\theta(c(t))\,dt,$$
where $\rho,\theta>0$, $k(0)>0$ and
$$u_\theta(c)=\begin{cases}(c^{1-\theta}-1)/(1-\theta),&\theta\ne1,\\ \ln c,&\theta=1.\end{cases}$$
For depreciation $\delta>0$, an interior optimum satisfies
$$\begin{aligned}\dot k&=Ak^\alpha-\delta k-c,\\\dot c/c&=(\alpha Ak^{\alpha-1}-\delta-\rho)/\theta,\end{aligned}$$
and the transversality condition $\lim_{t\to\infty}e^{-\rho t}c(t)^{-\theta}k(t)=0$. There is one positive steady state, with $f'(k^*)=\delta+\rho$ and $c^*=f(k^*)-\delta k^*$. It is a saddle: for each positive starting capital, one initial consumption lies on the optimal stable arm. The Euler equations alone also admit paths that fail feasibility or transversality. Since $\rho>0$, $k^*$ lies below the golden-rule capital defined by $f'(k_{\rm gold})=\delta$.`,
      idea:String.raw`The current-value Hamiltonian is $u_\theta(c)+\mu[f(k)-\delta k-c]$. Its conditions give $\mu=c^{-\theta}$ and $\dot\mu/\mu=\rho+\delta-f'(k)$, hence the consumption Euler equation. Strict concavity makes the feasible path satisfying transversality optimal. At the steady state the Jacobian is
$$\begin{pmatrix}\rho&-1\\c^*f''(k^*)/\theta&0\end{pmatrix}.$$
Its determinant is negative, so one eigenvalue is negative and one positive. Capital is predetermined; consumption can jump to the unique stable arm. The terminal condition rules out leaving unused wealth indefinitely. The negative determinant makes the two real Jacobian eigenvalues distinct and of opposite signs, so its eigenvectors form a basis. The eigenvector solution ode 3.5 gives local modes $e^{\lambda_-t}v_-$ and $e^{\lambda_+t}v_+$. The decaying mode supplies the stable-direction seed used by the numerical arm calculation. This linear algebra explains local saddle geometry, not the nonlinear optimality or transversality condition.`,
      caption:String.raw`Drag the gold starting point or choose **start on the stable arm**. Left: net-output curve in red, the consumption-stationary line in gold and a numerical approximation to the stable arm in green. The snap button chooses the computed arm at your capital. Right: capital and consumption relative to their steady states for up to 120 model years. Off-arm traces stop at the phase-window boundary or numerical cutoff; their finite traces do not establish their eventual fate.`,
      deps:['macro-3.2','macro-2.11', 'ode-3.5'],refs:['Daron Acemoglu, MIT 14.452 Neoclassical Growth (2020), slides 25–54 and CRRA slides 60–62'],tags:['growth','optimal control','saddle path'],
      credit:'Frank Ramsey, 1928; David Cass and Tjalling Koopmans, 1965',verify: false,
      scope:String.raw`Cobb–Douglas production, positive discount/depreciation/utility curvature, no population or technology growth, no uncertainty, competitive markets or equivalent planner. Utility becomes logarithmic at curvature one. Stable curves are numerical: backward integration from a stable-eigenvector approximation near the exact steady state, with interpolated paths and a local linear tail. Green denotes this computed stable arm, not an exact numerical certificate. Off-arm solutions are censored at the displayed phase window or positivity/integration cutoff. A=1 and depreciation 0.05 in the picture; units are illustrative.`,
      links:{source:'https://economics.mit.edu/sites/default/files/inline-files/Economic%20Growth%20Lectures%205%20-7%202020.pdf',ramsey:'https://doi.org/10.2307/2224098',cass:'https://academic.oup.com/restud/issue/32/3',koopmans:'https://cowles.yale.edu/sites/default/files/2022-08/r1964-67.pdf'},
      viz(v){
        const rhoS=v.slider('impatience $\\rho$',.005,.1,.03,{step:.001}),thS=v.slider('curvature $\\theta$',.5,5,2,{step:.05}),aS=v.slider('capital share $\\alpha$',.2,.5,.33,{step:.01}),onS=v.toggle('start on the stable arm',false);
        const P=v.stage({x:[0,40],y:[0,3],axes:'box',gutter:true,height:360,weight:1.15,minWidth:290,xlabel:'capital per worker k',ylabel:'consumption per worker c',title:'phase diagram'}),T=v.stage({x:[0,120],y:[0,2],axes:'box',gutter:true,height:360,weight:.85,minWidth:250,xlabel:'model years',ylabel:'relative to steady state',title:'time paths from the handle'});
        const h=P.handle(5,1,{color:'gold',r:7});let M=null,key='',st=null,first=true;
        v.button('snap to stable arm',()=>{if(M)h.set(clamp(h.x,.03*2*M.kg,.98*2*M.kg),M.saddle(clamp(h.x,.03*2*M.kg,.98*2*M.kg)));});
        v.render(()=>{
          const k2=`${rhoS.value}|${thS.value}|${aS.value}`;
          if(k2!==key){key=k2;M=ramseyGrowthAudit({rho:rhoS.value,theta:thS.value,alpha:aS.value});if(first){first=false;h.set(.45*M.ks,1.1*M.saddle(.45*M.ks));}}
          const kmax=2*M.kg,cmax=1.15*Math.max(M.f(M.kg)-.05*M.kg,...M.phase.map(p=>p[1])),k0=clamp(h.x,.03*kmax,.98*kmax),arm=M.saddle(k0),c0=onS.value?arm:clamp(h.y,.02*M.cs,.98*cmax),stable=onS.value||Math.abs(c0-arm)<1e-9*M.cs;h.set(k0,c0);
          P.setView([-.06*kmax,1.06*kmax],[-.08*cmax,1.08*cmax]);
          P.fn(k=>M.f(k)-.05*k,{color:'red',width:2.4,domain:[0,kmax],n:300});P.vline(M.ks,{color:'gold',width:2});P.vline(M.kg,{color:'faint',dash:[4,4]});P.path(M.phase,{color:'green',width:2.8});
          P.field((k,c)=>{if(k<=0||k>kmax||c<=0||c>cmax)return[0,0];return M.F(k,c);},{spacing:44,color:'faint'});
          P.dot(M.ks,M.cs,{r:6,color:'gold'});P.text('k*',M.ks,0,{dy:-10,dx:4,align:'left',color:'gold',weight:700,size:12});P.text('golden rule',M.kg,.18*cmax,{dy:0,align:'center',color:'muted',size:11});
          const result=stable?{pts:M.stablePath(k0),status:'computed stable arm'}:M.trajectory(k0,c0,120,.5,{kmax,cmax}),path=result.pts;
          P.path(path.map(p=>[p[1],p[2]]),{color:stable?'green':'purple',width:2.4});
          const ymax=Math.max(1.2,...path.map(p=>Math.max(p[1]/M.ks,p[2]/M.cs)));T.setView([-5,125],[-.06*ymax,1.12*ymax]);T.hline(1,{color:'faint',dash:[4,4]});T.path(path.map(p=>[p[0],p[1]/M.ks]),{color:'orange',width:2.4});T.path(path.map(p=>[p[0],p[2]/M.cs]),{color:'accent',width:2.4});
          const last=path.at(-1);T.dot(last[0],last[1]/M.ks,{color:'orange',r:4});T.dot(last[0],last[2]/M.cs,{color:'accent',r:4});
          st={k0,c0,arm,status:result.status,last,stable};
        });
        v.legend([['red','capital stationary'],['gold','consumption stationary'],['green','computed stable arm'],['purple','off-arm trajectory'],['orange','k/k*'],['accent','c/c*']]);
        v.readout(()=>{if(!st)return'';const position=st.stable?'On the computed stable arm.':st.c0>st.arm?'Initial consumption is above the computed arm.':'Initial consumption is below the computed arm.';return `$k^*=${fx(M.ks,2)}$, $c^*=${fx(M.cs,2)}$; golden rule $k_{\\rm gold}=${fx(M.kg,2)}$. At $k_0=${fx(st.k0,2)}$, numerical stable-arm consumption is ${fx(st.arm,3)}; yours is ${fx(st.c0,3)}. ${position} Trace ends at ${fx(st.last[0],1)} model years (${st.status}).`;});
      },
    },
    // ------------------------------------------------------------------ 4.2
    {
      num:'4.2',kind:'Model',name:'The Diamond overlapping-generations model',
      statement:String.raw`Consider the **full-depreciation, log-utility variant** of a two-period overlapping-generations economy. Young workers earn $w_t$, consume $c_{1,t}$ and save $s_t$; when old they consume the gross return $R_{t+1}s_t$. With utility $\ln c_1+\beta\ln c_2$, $\beta>0$, saving is $s_t=\beta w_t/(1+\beta)$. Competitive Cobb–Douglas production has $f(k)=k^\alpha$, $0<\alpha<1$, and wages $w=(1-\alpha)k^\alpha$. For cohort growth $1+n>0$,
$$k_{t+1}=\frac{\beta(1-\alpha)}{(1+\beta)(1+n)}k_t^\alpha.$$
Every $k_0>0$ converges monotonically to the unique positive fixed point
$$k^*=\left[\frac{\beta(1-\alpha)}{(1+\beta)(1+n)}\right]^{1/(1-\alpha)}.$$
Total steady-state consumption per young worker is $C(k)=k^\alpha-(1+n)k$, maximized at $k_{\rm gold}=[\alpha/(1+n)]^{1/(1-\alpha)}$. Thus $k^*>k_{\rm gold}$ precisely when $\beta(1-\alpha)/(1+\beta)>\alpha$, equivalently $R^*=f'(k^*)<1+n$. This is overaccumulation: a feasible reduction of capital can increase the consumption resources available to all cohorts. Diamond’s 1965 original instead assumes no depreciation and general utility; the displayed specialization follows Acemoglu's authored exposition.`,
      idea:String.raw`The household's first-order condition is $1/(w-s)=\beta/s$, so log utility makes the saving share independent of the return. Market clearing gives $(1+n)k_{t+1}=s_t$. Writing the capital map in logs gives $\ln(k_{t+1}/k^*)=\alpha\ln(k_t/k^*)$, proving convergence for every positive start. Unlike an infinitely lived dynasty, each household plans only its own two periods, so equilibrium can accumulate more than the golden-rule capital.

If $k^*>k_{\rm gold}$, choose $0<\Delta<k^*-k_{\rm gold}$. Lower next period's capital to $k^*-\Delta$ and keep it there. This releases $(1+n)\Delta$ resources initially and $C(k^*-\Delta)-C(k^*)>0$ at each later date. Suitable transfers can divide these gains among young and old so every affected cohort benefits. This is a feasible allocation argument; an arbitrary pension or debt policy need not implement it. Positivity of capital permits the logarithm rules in pma 8.6: dividing the saving map by its positive fixed point and taking logs gives $z_{t+1}=\alpha z_t$ for $z_t=\ln(k_t/k^*)$. Thus $z_t=\alpha^t z_0\to0$ for $0<\alpha<1$, and the continuous inverse exponential gives $k_t\to k^*$. This proves convergence of this full-depreciation log-utility specialization, without asserting it for every overlapping-generations model.`,
      caption:String.raw`Drag starting capital and choose the number of generations. Left: the log-utility saving map, the identity line and its cobweb. Right: total steady-state consumption per young worker, including old-age consumption divided by cohort growth. The competitive fixed point is red above golden-rule capital. Change utility weight, capital share or cohort growth; the readout compares the gross return with 1+n and, when overaccumulation occurs, gives a feasible resource-gain example.`,
      deps:['macro-3.5','macro-2.10', 'pma-8.6'],refs:['Acemoglu, MIT 14.452 Overlapping Generations (2018), slides 9–45, especially Eqs. 19–20 and slides 32–36','Diamond 1965, original pp. 1126–1135: no-depreciation/general-utility model; historical background'],tags:['growth','overlapping generations','dynamic inefficiency'],verify: false,
      credit:'Peter Diamond, 1965; consumption-loan predecessor Paul Samuelson, 1958',
      scope:String.raw`Deterministic two-period households, log utility, competitive Cobb–Douglas production, no bequests and full capital depreciation per period. A period is a generation with no calibrated duration. The utility weight beta may exceed one in this mathematical extension; no empirical lifetime discount factor is claimed. The saving map has an additional zero fixed point, excluded by the positive initial-capital assumption. Resource gains require starting from the competitive steady state and allocating the released resources through appropriate transfers; no specific government policy is simulated.`,
      links:{source:'https://economics.mit.edu/sites/default/files/inline-files/Lecture%208%20-%20Overlapping%20Generations_0.pdf',original:'https://www.aeaweb.org/aer/top20/55.5.1126-1150.pdf'},
      viz(v){
        const aS=v.slider('capital share $\\alpha$',.1,.6,.25,{step:.005}),bS=v.slider('old-age utility weight $\\beta$',.2,3,.9,{step:.01}),nS=v.slider('cohort growth $n$ (per generation)',0,.8,.2,{step:.01}),gS=v.slider('generations shown',2,30,12,{step:1,int:true});
        const P=v.stage({x:[0,.2],y:[0,.2],axes:'box',gutter:true,height:340,weight:1,minWidth:270,xlabel:'capital per young worker kₜ',ylabel:'kₜ₊₁',title:'the saving map and its cobweb'}),C=v.stage({x:[0,.4],y:[0,.4],axes:'box',gutter:true,height:340,weight:1,minWidth:260,xlabel:'capital per young worker k',ylabel:'total consumption per young worker',title:'what a steady state delivers'});
        const h=P.handle(.02,0,{color:'gold',r:7,constrain:x=>[Math.max(.0005,x),0]});let st=null;
        v.render(()=>{
          const m=diamondGrowthAudit(aS.value,bS.value,nS.value),kmax=2*Math.max(m.ks,m.kg),k0=clamp(h.x,.02*kmax,.98*kmax);h.set(k0,0);P.setView([-.08*kmax,1.08*kmax],[-.08*kmax,1.08*kmax]);P.fn(m.map,{color:'accent',width:2.6,domain:[0,kmax],n:300});P.line(0,0,kmax,kmax,{color:'ink',width:1.2,dash:[5,4]});
          let k=k0;const points=[[k0,0]];for(let i=0;i<gS.value;i++){const next=m.map(k);points.push([k,next],[next,next]);k=next;}P.path(points,{color:'gold',width:1.6});P.dot(m.ks,m.ks,{r:6,color:m.ks>m.kg?'red':'green'});P.vline(m.kg,{color:'faint',dash:[3,3]});
          const kz=(1+nS.value)**(-1/(1-aS.value));C.setView([-.05*kz,1.05*kz],[-.08*m.cg,1.25*m.cg]);C.fn(m.consumption,{color:'accent',width:2.6,domain:[0,kz]});C.vline(m.kg,{color:'muted',dash:[4,4]});C.dot(m.kg,m.cg,{r:5,color:'gold'});C.dot(m.ks,m.c,{r:6,color:m.ks>m.kg?'red':'green'});
          st={...m,k,k0};
        });
        v.legend([['accent','saving map / steady consumption'],['gold','cobweb and golden rule'],['green','competitive capital at/below golden rule',{dot:true}],['red','overaccumulation',{dot:true}]]);
        v.readout(()=>{if(!st)return'';const m=st;return `$k^*=${fx(m.ks,4)}$; golden rule $k_{\\rm gold}=${fx(m.kg,4)}$. Gross return $R^*=${fx(m.R,3)}$ versus cohort factor $1+n=${fx(1+nS.value,3)}$: ${m.ks>m.kg?'**overaccumulation**':'no overaccumulation'}. Total steady consumption ${fx(m.c,4)} per young worker (${pc(m.c/m.cg,1)} of the golden-rule maximum). After ${gS.value} generations, $k=${fx(m.k,4)}$.`+(m.cut>0?` A feasible capital reduction to ${fx(m.reduced,4)} releases ${fx(m.initialGain,4)} resources initially and ${fx(m.laterGain,4)} at each later date, before allocating transfers.`:'');});
      },
    },
    // ------------------------------------------------------------------ 4.3
    {
      num: '4.3', kind: 'Model', name: 'The AK model',
      statement: String.raw`Let output depend linearly on the broad capital stock, $Y = AK$ (equivalently, per worker $y = Ak$): the reproducible factor may include physical, human or knowledge capital. Constant aggregate returns can be assumed directly or arise through an accumulation externality. With a constant saving rate $s$, depreciation $\delta$ and population growth $n$,
$$\dot k = sAk - (n+\delta)k, \qquad \frac{\dot k}{k} = \frac{\dot y}{y} = sA - n - \delta .$$
If $sA > n+\delta$ the economy grows forever at the constant rate $\gamma = sA - n - \delta$, there is no transition in this constant-saving model, and countries with identical parameters retain their initial proportional income differences, and **the saving rate permanently changes the long-run growth rate**. With $y = Ak^{\alpha}$ and $\alpha < 1$ the same economy returns to a steady state with zero growth per capita.

Scope: the model asserts constant returns to the reproducible factor; it is a deliberate caricature, ordinary physical capital alone need not satisfy this assumption.`,
      idea: String.raw`In the Solow model the investment curve $s f(k)$ is concave and crosses the straight break-even line $(n+\delta)k$ once, which makes growth die out. If $f$ is linear the saving curve is a straight line that is steeper than the break-even line, so it never crosses: capital per worker grows at the constant rate $sA-n-\delta$. Dividing by $k$ shows the same thing as a horizontal comparison: the "return per unit of capital" $sf(k)/k$ no longer falls with $k$. Growth is then a choice variable (through $s$) and a level difference at the start is never closed. The cost of this tidy answer is the strong assumption that returns to accumulation do not diminish. With the maintained constant parameters, capital obeys $\dot k=\gamma k$, the equation of ode 1.5, so $k(t)=k_0e^{\gamma t}$ and $y(t)=Ak(t)$ for positive $k_0$. Two otherwise identical economies retain their initial ratio because the same exponential factor cancels. Positive sustained growth requires $\gamma>0$; the equation also permits zero or negative growth.`,
      caption: String.raw`**Left:** saving per unit of capital $s f(k)/k$ (green) against the break-even rate $n+\delta$ (red). Slide **$\alpha$** from $0.5$ to $1$: for $\alpha<1$ they cross at the steady state (possibly outside the visible range). At $\alpha=1$ the lines are horizontal: capital grows, stays constant or shrinks according to the sign of $sA-n-\delta$. **Right:** $\ln k(t)$ when the saving rate changes from $s$ to $s'$ in year 50. For $\alpha = 1$ the slope of the line changes for ever; for $\alpha<1$ the level moves but the long-run growth rate stays at zero.`,
      deps: ['macro-3.2', 'ode-1.5'], refs: ['Rebelo (1991), JPE 99(3):500–521; https://doi.org/10.1086/261764', 'Frankel (1962), AER 52(5):996–1022; https://www.scribd.com/document/78724522/Frankel-1962-the-Production-Function-in-Allocation-and-Growth'], tags: ['growth', 'endogenous growth', 'constant returns'],
      credit: 'Marvin Frankel, 1962; Sergio Rebelo, 1991',
      scope: String.raw`Needs constant returns to the reproducible factors (broad capital), exogenous constant saving within each regime; $sA>n+\delta$ is required for positive growth, not for the model to be defined.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/AK_model' },
      viz(v) {
        const aS = v.slider('returns to capital $\\alpha$', 0.5, 1, 1, { step: 0.01 });
        const s1 = v.slider('saving rate $s$', 0.05, 0.4, 0.2, { step: 0.005 });
        const s2 = v.slider("saving rate after year 50, $s'$", 0.05, 0.4, 0.3, { step: 0.005 });
        const nd = v.slider('$n+\\delta$', 0.02, 0.12, 0.06, { step: 0.002 });
        const L = v.stage({ x: [0.5, 30], y: [0, 0.2], xlog: true, axes: 'box', gutter: true, height: 330, weight: 1, minWidth: 270, xlabel: 'capital per worker k (log scale)', ylabel: 'rate per unit of capital', title: 's f(k)/k  against  n + δ' });
        const R = v.stage({ x: [0, 150], y: [0, 6], axes: 'box', gutter: true, height: 330, weight: 1, minWidth: 260, xlabel: 'years', ylabel: 'ln k(t) − ln k(0)', title: 'effect of a permanent saving change' });
        const A = 0.35;
        let st = null;
        v.render(() => {
          const a = aS.value, sa = s1.value, sb = s2.value, d = nd.value;
          const r1 = (k) => (sa * A) * k ** (a - 1), r2 = (k) => (sb * A) * k ** (a - 1);
          L.setView([0.5, 30], [0, Math.max(0.05, r2(0.5) * 1.15, r1(0.5) * 1.15, d * 1.4)]);
          L.fn(r1, { color: 'green', width: 2.6, domain: [0.5, 30], n: 200 });
          L.fn(r2, { color: 'teal', width: 2.4, domain: [0.5, 30], n: 200, dash: [6, 4] });
          L.hline(d, { color: 'red', width: 2.4 });
          L.text('n + δ', 20, d, { dy: -10, color: 'red', weight: 700, size: 12 });
          L.text('s f(k)/k', 1.0, r1(1.0), { dx: 8, dy: -12, align: 'left', color: 'green', weight: 700, size: 12 });
          L.text("s' f(k)/k", 1.0, r2(1.0), { dx: 8, dy: -12, align: 'left', color: 'teal', weight: 700, size: 12 });
          const base = capitalSavingPath(a, A, d, sa, sa), chg = capitalSavingPath(a, A, d, sa, sb);
          const ys = [...base, ...chg].map(p => p[1]);
          R.setView([0, 150], [Math.min(0, ...ys) - .1, Math.max(1, ...ys) + .1]);
          R.vline(50, { color: 'faint', dash: [4, 4] });
          R.path(base, { color: 'green', width: 2.2, dash: [6, 4] });
          R.path(chg, { color: 'teal', width: 2.8 });
          const slope = (arr, t0, t1) => (arr.find((p) => p[0] >= t1)[1] - arr.find((p) => p[0] >= t0)[1]) / (t1 - t0);
          st = { g0: slope(chg, 30, 50), g1: slope(chg, 130, 150), ak: a === 1, gAK: sa * A - d, gAK2: sb * A - d };
        });
        v.legend([['green', 'saving rate s'], ['teal', "after the change to s'"]]);
        v.readout(() => st && (st.ak ? `**AK** ($\\alpha=1$): growth rate of $k$ and $y$ is $sA-n-\\delta = ${pc(st.gAK)}$ before year 50 and $s'A-n-\\delta = ${pc(st.gAK2)}$ afterwards: measured slopes ${pc(st.g0)} and ${pc(st.g1)}.` : `$\\alpha<1$: diminishing returns. Growth rate of $k$ measured before year 50: ${pc(st.g0)}, in years 130–150: ${pc(st.g1)}; it dies out and only the level changes.`) + ` (Productivity $A=0.35$ fixed.)`);
      },
    },
    // ------------------------------------------------------------------ 4.4
    {
      num: '4.4', kind: 'Model', name: 'Romer’s endogenous growth: non-rival ideas',
      statement: String.raw`Output is produced from ideas $A$ and the labour $L_Y$ used to make goods, $Y = A L_Y$, while ideas are produced by researchers, $\dot A = \bar\delta\,L_A A$, with $L_A + L_Y = L$ and a constant research share $s_R = L_A/L$. Ideas are **non-rival**: one more user does not use up the idea, so all of $A$ is available to every researcher and every producer, which is what makes the production function for ideas linear in $A$. Then ideas, and output per worker $y = (1-s_R)A$, grow at the constant rate
$$g = \frac{\dot A}{A} = \bar\delta\,s_R\,L .$$
A larger research share raises the growth rate permanently, while a larger population $L$ raises it too (a *scale effect*). A higher $s_R$ lowers output per worker at once, because fewer people produce goods, but beyond a crossing date income is higher for ever.

Scope: a deliberately simple version of Romer (1990) without monopolistic competition for intermediates; the knife-edge assumption is that output of new ideas per researcher is proportional to the existing stock $A$ (its exponent is exactly 1), so research productivity measured as proportional growth per researcher stays constant.`,
      idea: String.raw`Capital accumulation stalls because its returns diminish; ideas do not stall, because each new idea raises the productivity of every future researcher. If a research worker's output is proportional to $A$, then $\dot A/A$ is proportional to the number of researchers, which is a level that policy or population can raise. That turns the exogenous technology growth of Solow's model into the output of a sector, and the Solow residual of the growth-accounting exercise into something that has a price and an input. The balanced path is the AK model, with the stock of ideas playing the role of the broad capital stock.`,
      caption: String.raw`**Right:** the growth rate $g(s_R) = \bar\delta s_R L$ as a straight line; drag the **gold handle** to move the research share from the baseline $s_R = 0.05$ to a new value, and raise $L$ to see the dashed scale-effect line move up. **Left:** $\ln y(t)$ under the baseline and the new research share: income starts lower (fewer producers) but the steeper path overtakes at the crossing date marked in gold.`,
      deps: ['macro-4.3'], refs: ['Romer ch. 3', 'P. Romer (1990), Endogenous Technological Change; https://www.nber.org/papers/w3210'], tags: ['growth', 'ideas', 'non-rivalry'],
      credit: 'Paul Romer, 1990 (Journal of Political Economy 98(5), S71–S102)',
      scope: String.raw`New ideas per researcher proportional to the stock of ideas (linear in $A$); the coefficient of proportionality is constant. Semi-endogenous variants (4.5) relax this.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Endogenous_growth_theory' },
      viz(v) {
        const LS = v.slider('population (research scale) $L$', 1, 4, 1, { step: 0.05 });
        const dS = v.slider('research productivity $\\bar\\delta$', 0.2, 0.8, 0.4, { step: 0.01 });
        const R = v.stage({ x: [0, 0.2], y: [0, 0.12], axes: 'box', gutter: true, height: 330, weight: 0.95, minWidth: 250, xlabel: 'research share  s_R', ylabel: 'growth rate g', title: 'the growth rate is set by research effort' });
        const Lf = v.stage({ x: [0, 100], y: [0, 4], axes: 'box', gutter: true, height: 330, weight: 1.05, minWidth: 270, xlabel: 'years', ylabel: 'ln y(t) (output per worker, log scale)', title: 'income paths' });
        const s0 = 0.05, h = R.handle(0.12, 0, { color: 'gold', label: 'new s_R', labelPos: 'n', constrain: (x) => [clamp(x, 0.006, 0.19), 0] });
        let st = null;
        v.render(() => {
          const L = LS.value, dl = dS.value, g = (s) => dl * s * L, s1 = clamp(h.x, 0.006, 0.19);
          h.set(s1, 0);
          R.setView([0, 0.2], [0, Math.max(0.1, dl * 0.2 * L * 1.05)]);
          R.fn(g, { color: 'accent', width: 2.6, domain: [0, 0.2] });
          R.fn((s) => dl * s * 2 * L, { color: 'muted', width: 1.6, dash: [5, 4], domain: [0, 0.2] });
          R.text('population × 2', 0.2, dl * 0.2 * 2 * L, { dx: -4, dy: 14, align: 'right', color: 'muted', size: 11 });
          R.vline(s0, { color: 'faint', dash: [4, 4] });
          R.dot(s0, g(s0), { r: 5, color: 'ink' }); R.text('baseline', s0, g(s0), { dx: 8, dy: 14, align: 'left', color: 'ink', size: 11 });
          R.dot(s1, g(s1), { r: 6, color: 'gold' });
          R.hline(g(s1), { color: 'gold', alpha: 0.35, dash: [3, 3] });
          const g0 = g(s0), g1 = g(s1), lv0 = Math.log(1 - s0), lv1 = Math.log(1 - s1), tc = g1 > g0 ? (lv0 - lv1) / (g1 - g0) : Infinity;
          const y0 = (t) => lv0 + g0 * t, y1 = (t) => lv1 + g1 * t;
          Lf.setView([0, 100], [Math.min(-0.2, lv1 - 0.1), Math.max(0.5, y0(100), y1(100)) * 1.05]);
          Lf.path([[0, y0(0)], [100, y0(100)]], { color: 'ink', width: 2.2 });
          Lf.path([[0, y1(0)], [100, y1(100)]], { color: 'accent', width: 2.8 });
          if (isFinite(tc) && tc > 0 && tc < 100) { Lf.vline(tc, { color: 'gold', dash: [4, 4] }); Lf.dot(tc, y0(tc), { r: 6, color: 'gold' }); Lf.text('crossing', tc, y0(tc), { dx: 10, dy: 20, align: 'left', color: 'gold', weight: 700, size: 12 }); }
          Lf.text('baseline s_R = 0.05', 98, y0(98), { dy: 16, color: 'ink', align: 'right', weight: 700, size: 12 });
          Lf.text('new s_R', 98, y1(98), { dy: -10, color: 'accent', align: 'right', weight: 700, size: 12 });
          st = { g0, g1, tc, L, s1, drop: 1 - (1 - s1) / (1 - s0) };
        });
        v.legend([['ink', 'baseline research share'], ['accent', 'new research share'], ['gold', 'crossing date', { dot: true }]]);
        v.readout(() => st && `Growth $g = \\bar\\delta s_R L$: ${pc(st.g0)} at the baseline, ${pc(st.g1)} at $s_R = ${fx(st.s1, 3)}$ (permanent). Income per worker starts ${pc(Math.abs(st.drop))} ${st.drop >= 0 ? 'lower' : 'higher'} and the paths ${isFinite(st.tc) && st.tc > 0 ? 'cross after ' + fx(st.tc, 1) + ' years' : 'never cross'}. Doubling $L$ doubles $g$ (scale effect; see 4.5). Illustrative units.`);
      },
    },
    // ------------------------------------------------------------------ 4.5
    {
      num: '4.5', kind: 'Concept', name: 'Scale effects and the Jones critique',
      statement: String.raw`In Romer's model the growth rate $g = \bar\delta s_R L$ rises in proportion to the population: more researchers means faster growth *for ever*. But the number of researchers in the U.S. and other rich economies has risen many-fold since the 1950s while trend growth in output per person has been flat or lower. Charles Jones (1995) resolved the conflict by weakening the idea production function to
$$\dot A = \bar\delta\,L_A^{\lambda}\,A^{\phi}, \qquad \phi < 1 \;(\text{ideas get harder to find}),$$
the **semi-endogenous** model. Its balanced growth rate is $g_A^* = \dfrac{\lambda\,n}{1-\phi}$, where $n$ is the growth rate of research effort; it depends on the *growth* of the population, not its level or the research share, so permanent policy changes shift levels but not long-run growth. Bloom, Jones, Van Reenen and Webb (2020) report that U.S. effective research effort rose by a factor of about 23 between the 1930s and 2014 while research productivity fell by a factor of about 41.

Scope: a stylised calibration, not an estimate; with $\phi<1$ positive balanced growth requires sustained growth of research effort; if research effort eventually stops growing, the long-run growth rate tends to zero.`,
      idea: String.raw`Differentiate the idea production function: $g_A = \bar\delta L_A^\lambda A^{\phi-1}$. If $\phi=1$ the growth rate follows $L_A$ and explodes with it; if $\phi<1$ the term $A^{\phi-1}$ shrinks as ideas accumulate, so the growth rate settles where $\lambda\dot L_A/L_A = (1-\phi)\,g_A$. The empirical content is the *decomposition* of the data into research input and research output: growth = effort × productivity, so with effort up ×23 and growth roughly constant, productivity per researcher had to fall by about the same factor (the paper reports ×41, because growth itself also slowed a little, by a factor of $23/41\approx 0.56$).`,
      caption: String.raw`**Left (log scale):** the growth rate of ideas implied by the idea production function with research effort rising $23$-fold in 84 years. The red line is Romer ($\phi=1$): growth explodes with the number of researchers. The blue line uses the $\phi$ you choose; lower $\phi$ flattens it, and the dashed line is its balanced-growth rate $\lambda n/(1-\phi)$. **Right:** research productivity $g_A/L_A$ relative to year 0; the gold mark is the empirical fall of Bloom et al. Reduce $\phi$ until the blue growth curve is flat, then read off what productivity decline that needs.`,
      deps: ['macro-4.4'], refs: ['Romer ch. 3', 'Bloom et al. (2020), p. 1110, Fig. 2; https://web.stanford.edu/~chadj/IdeaPF.pdf'], tags: ['growth', 'ideas', 'semi-endogenous growth'],
      credit: 'Charles Jones, 1995 (Journal of Political Economy 103(4), 759–784); Bloom, Jones, Van Reenen & Webb, 2020 (American Economic Review 110(4), 1104–1144)',
      scope: String.raw`Aggregate U.S. data 1930–2014 in Bloom et al.; the simulation here is an illustration with $g(0)=2\%$ chosen for display, not their series.`,
      links: { doi: 'https://doi.org/10.1257/aer.20180338' },
      viz(v) {
        const pS = v.slider('ideas exponent $\\phi$', -2, 1, -0.9, { step: 0.01 });
        const lS = v.slider('researcher exponent $\\lambda$', 0.3, 1, 1, { step: 0.01 });
        const nS = v.slider('growth of research effort $n$', 0, 0.05, Math.log(23) / 84, { step: 0.0005 });
        const G = v.stage({ x: [0, 84], y: [0.004, 1], ylog: true, axes: 'box', gutter: true, height: 330, weight: 1, minWidth: 270, xlabel: 'years since the start', ylabel: 'growth rate of ideas  g_A (log scale)', title: 'what the idea production function predicts' });
        const Q = v.stage({ x: [0, 84], y: [0.01, 10], ylog: true, axes: 'box', gutter: true, height: 330, weight: 1, minWidth: 260, xlabel: 'years since the start', ylabel: 'research productivity (index, start = 1)', title: 'output of ideas per unit of research effort' });
        const g0 = 0.02;
        let st = null;
        v.render(() => {
          const phi = pS.value, lam = lS.value, n = nS.value;
          const run = (ph) => {
            const out = []; let lnA = 0; const dt = 0.1;
            for (let t = 0; t <= 84 + 1e-9; t += dt) {
              const g = g0 * Math.exp(lam * n * t + (ph - 1) * lnA);
              out.push([t, Math.min(g, 50)]); lnA += g * dt;
              if (lnA > 50) break;
            }
            return out;
          };
          const romer = run(1), mine = run(phi);
          const fl = (arr) => arr.filter((p) => p[1] > 0.004 && p[1] < 1);
          G.path(fl(romer), { color: 'red', width: 2.6 });
          G.path(fl(mine), { color: 'accent', width: 2.8 });
          if (phi < 1 && n > 0) { const gs = (lam * n) / (1 - phi); if (gs > 0.004 && gs < 1) { G.hline(gs, { color: 'accent', dash: [5, 4], alpha: 0.7 }); } }
          G.hline(g0, { color: 'faint', dash: [3, 3] });
          G.text('Romer (φ = 1)', 2, 0.55, { color: 'red', weight: 700, align: 'left', size: 12 });
          G.text('your φ', 2, 0.28, { color: 'accent', weight: 700, align: 'left', size: 12 });
          const prod = (arr) => arr.map((p) => [p[0], p[1] / g0 / Math.exp(n * p[0])]);
          Q.path(prod(romer).filter((p) => p[1] > 0.01 && p[1] < 10), { color: 'red', width: 2.2 });
          Q.path(prod(mine).filter((p) => p[1] > 0.01 && p[1] < 10), { color: 'accent', width: 2.8 });
          Q.hline(1, { color: 'faint', dash: [3, 3] });
          Q.dot(84, 1 / 41, { r: 6, color: 'gold' });
          Q.text('empirical ×1/41 (BJVW)', 82, 1 / 41, { dy: -12, align: 'right', color: 'gold', weight: 700, size: 12 });
          const last = mine[mine.length - 1];
          st = { effort: Math.exp(n * 84), gEnd: last[1], gRatio: last[1] / g0, prod: last[1] / g0 / Math.exp(n * last[0]), phi, lam, n };
        });
        v.legend([['red', 'Romer, φ = 1'], ['accent', 'semi-endogenous, your φ'], ['gold', 'Bloom et al. research productivity', { dot: true }]]);
        v.readout(() => st && `Research effort grows ×${fx(st.effort, 1)} (the paper's factor is 23). With your $\\phi=${fx(st.phi, 2)}$: growth at the end is ${pc(st.gEnd)} (×${fx(st.gRatio, 2)} of its start), research productivity ×${fx(st.prod, 3)} (data: ×${fx(1 / 41, 3)}); balanced-growth rate $\\lambda n/(1-\\phi) = ${pc(st.phi < 1 ? (st.lam * st.n) / (1 - st.phi) : NaN)}$. Romer's $\\phi=1$ predicts growth × ${fx(Math.exp(st.lam * st.n * 84), 1)}.`);
      },
    },
  ],
};
