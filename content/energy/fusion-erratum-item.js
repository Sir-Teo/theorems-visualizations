import {fusionReactivityAudit,fusionThresholdAudit,fusionBalanceAudit,fusionMinimumAudit} from './source-audit-fusion.shared.js';
const f1=(v,x)=>v.fix(x,1),f2=(v,x)=>v.fix(x,2);
export default {
      num: '3.10', kind: 'Model', name: 'Fusion and the Lawson criterion',
      statement: String.raw`For a pure, equimolar deuterium–tritium plasma, let $n$ be the total ion density in m⁻³, with $n_D=n_T=n/2$ and electron density $n$. Let $T$ be the numerical temperature in keV, equal for ions and electrons, and let $c_E=1.602176634\times10^{-16}$ J/keV. The thermal energy density is $3nc_ET$. Define $\tau_{\rm tr}$ using **transport loss alone**, with bremsstrahlung radiation counted separately. Fuel gain is $Q_f=P_{\rm fus}/P_{\rm abs}$, where $P_{\rm abs}$ is external heating actually absorbed by the fuel. All alpha energy is assumed absorbed. The steady power balance gives
$$\begin{aligned}D_Q(T)&=\frac{c_E}{4}\langle\sigma v\rangle\\&\quad\times(E_\alpha+E_{\rm fus}/Q_f)\\&\quad-C_B\sqrt T,\end{aligned}$$
$$\begin{aligned}nT\tau_{\rm tr}&\ge\frac{3c_ET^2}{D_Q(T)},\\D_Q(T)&>0.\end{aligned}$$
Here $E_\alpha=3500$ keV, $E_{\rm fus}=17600$ keV and $C_B=5.34\times10^{-37}$ W m³ keV⁻¹ᐟ² are the chosen rounded source inputs. The inequality describes gain at least $Q_f$; its $Q_f\to\infty$ limit is the ideal ignition condition. If $D_Q\le0$, no finite triple product reaches that gain at that temperature in this model.`,
      idea: String.raw`The reaction rate per volume is $n_Dn_T\langle\sigma v\rangle=n^2\langle\sigma v\rangle/4$. Alpha heating plus absorbed external power must replace transport loss $3nc_ET/\tau_{\rm tr}$ and bremsstrahlung $C_Bn^2\sqrt T$. Divide this balance by $n^2$ to derive the contour. The conversion $c_E$ makes all powers watts while the plotted triple product uses keV s m⁻³. Both density and confinement time matter, but temperature also changes the reaction rate: a triple product alone does not specify gain.

Lawson's original 1957 paper considered ideal retained-product and pulsed escaping-product systems while neglecting conduction. The transport-loss, alpha-heated steady balance shown here is a modern extension. The Bosch–Hale thermal reactivity fit averages over Maxwellian velocities; it is an empirical nuclear-data parametrization. Fuel gain, externally applied scientific gain and electrical gain require different energy boundaries.`,
      caption: String.raw`The curves show triple products for **fuel gain** $Q_f=1,5,20$ and the ideal ignition limit. Change density, temperature and transport confinement time: the gold point is the selected state, and the power bars recompute its alpha heating, transport loss, bremsstrahlung and required absorbed external heating. The plot expands to contain the state; contours are shown within its current window. Meeting the ignition inequality is a power-balance result, without a simulated ignition transient.`,
      deps: ['energy-3.5'],
      refs: ['J. D. Lawson, Proc. Phys. Soc. B70, 6–10 (1957), complete original paper', 'H.-S. Bosch & G. M. Hale, Nucl. Fusion32, 611–631 (1992), original Eqs. 12–14 and Table VII; erratum33, 1919 (1993), corrected Table VIII and separate Eq. 16 limit', 'S. E. Wurzel & S. C. Hsu, Physics of Plasmas29, 062103 (2022), author manuscript Sec. III, Eqs. 7, 11, 16 and22'],
      tags: ['fusion', 'Lawson criterion', 'plasma'],
      scope: String.raw`Uniform, steady, Maxwellian D–T with $T_i=T_e$, equal D/T ion fractions, quasineutrality, no impurities or helium-ash dilution, and all alpha power deposited. The transport time is thermal energy divided by transport-loss power; radiation is not included in that time, avoiding double counting. No synchrotron, profiles, burnup, particle balance, stability, heating coupling or plant conversion losses are modeled. The original Bosch–Hale Eqs. 12–14 and Table VII D–T thermal-reactivity fit retains its stated 0.2–100 keV range (plot 1–100, controls 2–80). It is an empirical parametrization of the authors' evaluated nuclear data, not an exact nuclear law or a current nuclear-data library.

The actual 1993 erratum corrects Table VIII's 1.3/1.8 keV rows, which had mixed in values for 1.25/1.75 keV, and explicitly leaves the fit parameters unchanged. Its 0.5–100 keV validity correction applies to the separate Eq. 16 D–D branching-ratio polynomial, which is not used here. Both original source versions were checked; no low-energy cross-section fit is extrapolated.

Lawson's complete 1957 paper treats different, conduction-free scenarios; the displayed modern steady balance follows the explicit Wurzel–Hsu extension. The bars are calculated for the selected state. Fuel breakeven is distinct from scientific and electrical breakeven. Density and transport-time controls save three-significant-digit physical values on logarithmic scales; temperature saves half-keV ticks.`,
      credit: 'J. D. Lawson, 1957; modern steady power-balance extension',
      verify: true,
      links: {original:'https://doi.org/10.1088/0370-1301/70/1/303',reactivity:'https://doi.org/10.1088/0029-5515/32/4/I07',erratum:'https://iopscience.iop.org/article/10.1088/0029-5515/33/12/513/pdf',balance:'https://arxiv.org/abs/2105.10954v4'},
      viz(v) {
        const s=v.stage({x:[.8,125],y:[1e19,1e23],xlog:true,ylog:true,axes:'box',gutter:{r:24},height:360,xlabel:'temperature T (keV)',ylabel:'n T τtr (keV s m⁻³)',full:true});
        const sp=v.stage({x:[0,4],y:[-.18,1.2],axes:false,height:320,full:true,title:'selected-state power balance'});
        const n=v.slider('total ion density $n$ (m⁻³)',1e19,3e21,1e20,{log:true,fmt:x=>x.toExponential(2)});
        const T=v.slider('temperature $T$ (keV)',2,80,15,{step:.5});
        const tau=v.slider('transport time $\\tau_{\\rm tr}$ (s)',.01,20,1,{log:true,fmt:x=>Number(x.toPrecision(3)).toString()});
        for(const[c,lo,hi]of[[n,1e19,3e21],[tau,.01,20]]){const set=c.set;c.input.step='any';c.set=x=>{if(typeof x!=='number'||!Number.isFinite(x)||x<lo||x>hi||x!==Number(x.toPrecision(3)))throw new RangeError('Saved logarithmic control requires a bounded three-significant-digit physical value');return set(x);};c.set(c.value);c.input.addEventListener('input',()=>c.set(c.value));}
        {const set=T.set;T.set=x=>{if(typeof x!=='number'||!Number.isFinite(x)||x<2||x>80||x!==Math.round(x*2)/2)throw new RangeError('Saved temperature must be a supported half-keV tick');return set(x);};}
        const Qs=[1,5,20,Infinity],cols=['red','orange','purple','green'],Ts=Array.from({length:241},(_,i)=>100**(i/240)),minimum=fusionMinimumAudit();
        let state;
        v.render(()=>{
          state=fusionBalanceAudit({n:n.value,T:T.value,tau:tau.value});
          const ymin=Math.min(1e19,state.triple/4),ymax=Math.max(1e23,state.triple*4);s.setView([.8,125],[ymin,ymax]);
          Qs.forEach((Q,i)=>{const pts=Ts.map(t=>[t,fusionThresholdAudit(t,Q)]).filter(p=>Number.isFinite(p[1])&&p[1]>=ymin&&p[1]<=ymax);s.path(pts,{color:cols[i],width:i===3?3:2});});
          s.dot(T.value,state.triple,{r:7,color:'gold'});
          const powers=[['alpha',state.alpha,'green'],['transport',state.transport,'red'],['brems',state.brems,'purple'],['external',state.external,'gold']],scale=Math.max(...powers.map(p=>p[1]));
          sp.text('power density (MW/m³)',.08,1.12,{size:12,weight:700,color:'ink',align:'left'});
          powers.forEach(([name,power,color],i)=>{const x=i+.5,y=power/scale;sp.rect(i+.17,0,i+.83,y,{color,fill:color,fillAlpha:.55});sp.text(v.fmt(power/1e6,3),x,y+.055,{size:11.5,color:'ink',weight:700,align:'center'});sp.text(name,x,-.09,{size:11,color,align:'center'});});
        });
        v.legend([['red','$Q_f=1$'],['orange','$Q_f=5$'],['purple','$Q_f=20$'],['green','ideal ignition'],['gold','selected state',{dot:true}]]);
        v.readout(()=>{
          const need=Number.isFinite(state.need)?`Ideal ignition threshold here: $${v.sci(state.need,3)}$ keV s m$^{-3}$.`:'No finite ignition threshold at this temperature: alpha heating cannot exceed bremsstrahlung.';
          const gain=state.net>0?`Fuel gain $Q_f=${f2(v,state.Q)}$.`:'The ideal ignition inequality is met: alpha heating covers the modeled losses; no external heating is required in this balance.';
          return `$T=${f1(v,T.value)}$ keV; $\\langle\\sigma v\\rangle=${v.sci(fusionReactivityAudit(T.value),3)}$ m³/s. Selected triple product: $${v.sci(state.triple,3)}$ keV s m$^{-3}$. ${need}\n${gain} Fusion power density: ${v.fmt(state.fusion/1e6,3)} MW/m³.\nMinimum ideal ignition triple product in this model: $${v.sci(minimum.triple,3)}$ keV s m$^{-3}$ at ${f1(v,minimum.T)} keV. Fuel gain uses absorbed heating; coupling losses and electrical conversion are outside this balance.`;
        });
      },
    };
