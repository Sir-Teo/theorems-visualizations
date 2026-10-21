import{EXTINCTIONS,DEFAULT_LOSSES,extinctionModel}from'./source-audit-extinction.js';
export default {
  num:'3.8',kind:'Phenomenon',name:'Mass extinctions and recoveries',verify:false,
  statement:String.raw`Raup and Sepkoski's 1982 marine-family compilation identified five conspicuous diversity drops. Four extinction episodes were statistically distinct from background in their analysis; the Devonian drop was not, with extinctions spread across several stages. This is a statement about their data and test, not a claim that the Devonian crisis was unimportant.

Barnosky and colleagues' 2011 Table 1 summarizes estimated losses at two different taxonomic levels. The plotted genus percentages and inferred species percentages are distinct quantities. Event durations and fossil sampling also differ; a percentage alone does not specify an extinction rate.`,
  idea:String.raw`Apply the exact logistic solution from ode-1.6 to an authored normalized stock $0<n\le1$, with fixed capacity 1 and $\dot n=rn(1-n)$. Each instantaneous pulse replaces the immediately preceding stock $p$ by $q=(1-f)p$. Thereafter $n(t)=[1+(q^{-1}-1)e^{-rt}]^{-1}$. For the target $a=0.9p$, the first recovery time is
$$\begin{aligned}r\tau&=\max(0,L(a)-L(q)),\\L(x)&=\ln x-\ln(1-x).\end{aligned}$$
Here L is the log-odds function. A loss of at most 10% already meets that target, so its recovery time is zero. Each listed time assumes uninterrupted subsequent growth; a later pulse can intervene.`,
  caption:String.raw`First: the five pairs of genus/species estimates in the original 2011 table, numbered in chronological order. Second: a hypothetical single stock, initially 0.04 at 550 Ma, with five instantaneous kills at that table's rounded end dates. Change each kill fraction and the regrowth rate. Controls affect only the model; the source bars stay fixed. The pulse dates 65/200/251/359/443 Ma reproduce that historical table, not the current geological timescale; see 3.9 for the separate 66 Ma chronology.`,
  scope:String.raw`Table 1 is a historical synthesis, not five raw censuses or a current-best dating compilation. Its loss fractions and durations depend on taxa, sampling and methods. The simulation collapses each extended episode to a single pulse, combines all taxa in one continuous stock, holds capacity fixed and omits environmental change, immigration and ecological structure. It neither fits nor reconstructs the fossil diversity record. Saved controls support up to 15 significant digits, matching native range serialization.

Kirchner and Weil 2000 found a roughly 10 Myr cross-correlation lag between extinction and later origination peaks in a marine genus/family compilation. That lag is not a universal time to regain 90% of a pre-event stock, and it does not calibrate r here. Their supplementary midpoint assignment shifts the peak by roughly 5 Myr. A rebuilding-niche explanation is a proposed interpretation, not something this logistic curve tests.`,
  deps:['bighist-3.7','ode-1.6'],see:['bighist-3.9'],refs:['Raup & Sepkoski1982, Science215:1501–1503, Figs1–2','Barnosky et al.2011, Nature471:51–57, Table1 and data disparities','Kirchner & Weil 2000, Nature404:177–180, Figs1–3 and supplementary§2'],
  credit:'Raup & Sepkoski1982; Barnosky et al.2011; Kirchner & Weil 2000; authored logistic pulse model',tags:['extinction','diversity','recovery'],
  links:{original:'https://doi.org/10.1126/science.215.4539.1501',table:'https://ib.berkeley.edu/labs/barnosky/Barnosky%20et%20al%20Sixth%20Extinction%20Nature.pdf',recovery:'https://seismo.berkeley.edu/~kirchner/reprints/2000_34_delayed_recovery.pdf'},
  viz(v){
    const r=v.slider('regrowth r (per Myr)',.1,2,.5,{step:'any',decimals:6});
    const fs=EXTINCTIONS.map((e,i)=>v.slider(`${i+1} ${e.name} loss fraction`,.05,.995,DEFAULT_LOSSES[i],{step:'any',decimals:6}));
    for(const c of[r,...fs]){const set=c.set;c.set=x=>{const lo=c===r?.1:.05,hi=c===r?2:.995;if(!Number.isFinite(x)||x<lo||x>hi||x!==Number(x.toPrecision(15)))throw new RangeError('Saved rate/loss must round-trip within the declared domain at15 significant digits');return set(x);};}
    const A=v.stage({x:[-.15,5.15],y:[-.04,1.1],axes:'box',gutter:true,height:310,title:'2011 table estimates; source values',xlabel:'event number; names below',ylabel:'fraction lost',xticks:EXTINCTIONS.map((e,i)=>[i+.5,String(i+1)])});
    const B=v.stage({x:[-560,10],y:[-.06,1.08],axes:'box',gutter:true,height:350,full:true,title:'five pulses and logistic growth; model',xlabel:'time (Ma ago, negative)',ylabel:'stock / fixed capacity'});let info;
    v.render(()=>{
      const m=extinctionModel(r.value,fs.map(c=>c.value));info=m;
      EXTINCTIONS.forEach((e,i)=>{A.rect(i+.18,0,i+.46,e.genera/100,{fill:'teal',color:'teal',fillAlpha:.6});A.rect(i+.54,0,i+.82,e.species/100,{fill:'purple',color:'purple',fillAlpha:.6});});
      B.path(m.curve,{color:'accent',width:2.5});
      m.events.forEach((e,i)=>{B.line(-e.age,e.post,-e.age,e.pre,{color:e.color,width:2});B.dot(-e.age,e.post,{r:4,color:e.color,ring:false});B.text(String(i+1),-e.age,1.035,{align:'center',size:11,color:e.color});});
    });
    v.legend([['teal','source genus estimate'],['purple','source species estimate'],['accent','authored logistic stock']]);
    v.readout(()=>{if(!info)return'';return info.events.map((e,i)=>`${i+1} ${e.name}: source ${e.genera}% genera / ${e.species}% species; table end ≈${e.age} Ma, duration ${e.duration}. Model loss ${v.fix(100*e.loss,3)}%; uninterrupted time to 90% of its own pre-event stock ${v.fix(e.recovery,3)} Myr${e.recoveredBeforeNext?'':'; next pulse/present occurs first'}.`).join('\n')+'\nThe source estimates stay fixed. The curve and recovery times are model results, not fossil observations or the published peak-to-peak lag.';});
  },
};
