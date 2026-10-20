// Broad intervals encode a declared reading of Marshall 2006, not dating errors.
export const CAMBRIAN_EVENTS=Object.freeze([
 {label:'Gaskiers / early Ediacaran record',lo:578,hi:582,source:'p. 357: about 580 Ma; ±2 Myr is an authored display interval'},
 {label:'Regular horizontal trace fossils',lo:553,hi:557,source:'p. 357: about 555 Ma; ±2 Myr is an authored display interval'},
 {label:'Cloudina / lightly mineralized forms',lo:542,hi:548,source:'p. 359: last 5 Myr of Ediacaran on the paper’s 542–543 Ma boundary calibration'},
 {label:'First trilobite body fossils',lo:522,hi:526,source:'Fig. 1: approximately 524 Ma read from the plotted scale; ±2 Myr is an authored display interval'},
 {label:'Chengjiang biota',lo:518,hi:522,source:'Fig. 1: approximately 520 Ma read from the plotted scale; ±2 Myr is an authored display interval'},
 {label:'Burgess Shale biota',lo:504,hi:508,source:'Fig. 1: approximately 506 Ma read from the plotted scale; ±2 Myr is an authored display interval'},
].map(Object.freeze));
export const CAMBRIAN_HYPOTHESES=Object.freeze([
 'Oxygen conditions: a possible environmental constraint; a threshold alone does not explain disparity, duration and uniqueness.',
 'Ecology and predation: interactions can create new needs and opportunities; this is not an independently dated trigger window.',
 'Developmental systems: genetic/developmental possibilities interact with ecology; toolkit existence is not a dated gate opening.',
]);
export const cambrianInitial=1e-4;
export function cambrianGate(t,center,width){const u=(t-(center-width/2))/width;return u<=0?0:u>=1?1:u*u*(3-2*u);}
export function cambrianIntegral(t,center,width){const u=(t-(center-width/2))/width;return u<=0?0:u>=1?t-center:width*(u**3-.5*u**4);}
export function cambrianCrossing(p,center,width,rate){
 if(!(p>cambrianInitial&&p<1))throw new RangeError('Target above initial stock and below 1 required');
 const target=cambrianIntegral(-600,center,width)+(Math.log(p/(1-p))-Math.log(cambrianInitial/(1-cambrianInitial)))/rate;
 if(target>=width/2)return center+target;
 let lo=center-width/2,hi=center+width/2;for(let i=0;i<70;i++){const t=(lo+hi)/2;if(cambrianIntegral(t,center,width)<target)lo=t;else hi=t;}return(lo+hi)/2;
}
export function cambrianModel(age=540,width=12,rate=.3,selected=0,flags=[true,false,false]){
 if(!Number.isFinite(age)||age<500||age>580||!Number.isFinite(width)||width<2||width>60||!Number.isFinite(rate)||rate<.05||rate>.6||!Number.isInteger(selected)||selected<0||selected>=CAMBRIAN_EVENTS.length||!Array.isArray(flags)||flags.length!==3||flags.some(x=>typeof x!=='boolean'))throw new RangeError('Declared gate/event/hypothesis domain required');
 const center=-age,start=-600,end=-495,base=cambrianIntegral(start,center,width),logit0=Math.log(cambrianInitial/(1-cambrianInitial)),stock=t=>1/(1+Math.exp(-logit0-rate*(cambrianIntegral(t,center,width)-base))),t10=cambrianCrossing(.1,center,width,rate),t90=cambrianCrossing(.9,center,width,rate);
 const times=[...Array.from({length:421},(_,i)=>start+(end-start)*i/420),center-width/2,center+width/2,t10,t90].filter(t=>t>=start&&t<=end).sort((a,b)=>a-b),grid=[...new Set(times)];
 return{age,width,rate,selected,flags:flags.slice(),events:structuredClone(CAMBRIAN_EVENTS),hypotheses:flags.flatMap((on,i)=>on?[CAMBRIAN_HYPOTHESES[i]]:[]),boundary2006:[542,543],boundary2024:[538.2,539.4],boundary2024Center:538.8,start,end,center,t10,t90,duration:t90-t10,ungatedDuration:Math.log(81)/rate,curve:grid.map(t=>[t,stock(t)]),gate:grid.map(t=>[t,cambrianGate(t,center,width)]),crossings:[[t10,.1],[t90,.9]].filter(([t])=>t>=start&&t<=end)};
}
