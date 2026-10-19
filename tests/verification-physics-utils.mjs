import * as M from '../assets/js/viz/math.js';
// Record production visualization callbacks for independent numerical checks.
// Browser tests separately use actual controls and the real rendering engine.
export function record(item, {time=0}={}) {
 const noop=()=>{},controls=[],renders=[],readouts=[],stages=[],buttons=[];
 const v={M,get t(){return time},color:()=>'',mix:()=>'',rgb:()=>[0,0,0],ramp:()=>[0,0,0],fix:(x,n)=>x.toFixed(n),fmt:(x,n)=>Number(x.toPrecision(n)).toString(),sci:(x,n)=>x.toExponential(n),rng:M.rng,legend:noop,onCleanup:noop,invalidate:noop,diverge:x=>x,
 quantum:()=>({phaseColor:()=>'',state:a=>a,amplitudes:(s,a)=>s.calls.push(['amplitudes',a]),bloch:(s,a)=>s.calls.push(['bloch',a])}),table:(s,opts)=>({draw:o=>s.calls.push(['table',o]),hit:()=>null}),animate:(f,o={})=>renders.push(()=>f(time)),
 sim:(init,step,{dt=1/240}={})=>{let state=init(),t=0;return{get state(){return state},reset(){state=init();t=0},advance(T){if(T<t){state=init();t=0}while(t+dt<=T+1e-12){step(state,dt,t);t+=dt}return state}}},
 button:(label,fn)=>buttons.push({label,fn}),readout:f=>readouts.push(f),render:f=>renders.push(f),
 slider:(label,min,max,value,opts={})=>{const c={label,value,min,max,opts,el:{},set(x){this.value=x;opts.onChange?.(x)}};controls.push(c);return c},
 select:(label,options,value,opts={})=>{const c={label,value,options,opts,el:{},set(x){this.value=x;opts.onChange?.(x)}};controls.push(c);return c},
 toggle:(label,value,opts={})=>{const c={label,value,opts,set(x){this.value=x;opts.onChange?.(x)}};controls.push(c);return c},
 stage:opts=>{const calls=[],handles=[],ctx=new Proxy({},{get:()=>noop});const s=new Proxy({calls,handles,sceneHandles:[],ctx,sx:30,sy:30,width:900,height:400,el:{style:{}},opts,
 handle:(x,y,st={})=>{const h={x,y,...st,set(a,b){this.x=a;this.y=b}};handles.push(h);return h},onClick:f=>{s.click=f},X:x=>x,Y:y=>y,clip:f=>f()}, {get:(s,k)=>k in s?s[k]:(...args)=>calls.push([k,...args])});stages.push(s);return s;}};
 v.scene3=s=>new Proxy({P:p=>[p[0],p[1]],handle:(p,opts={})=>{const h={p,...opts,set(q){this.p=q}};(s.sceneHandles??=[]).push(h);return h}},{get:(o,k)=>k in o?o[k]:(...a)=>s.calls.push(['scene:'+k,...a])});
 v.stage3d=v.stage; item.viz(v);const draw=(t=time)=>{time=t;stages.forEach(s=>s.calls.length=0);renders.forEach(f=>f())};draw();
 return{controls,stages,buttons,draw,text:()=>readouts.map(f=>f()).join('\n')};
}
export const near=(a,b,t=1e-9)=>{if(!(Math.abs(a-b)<=t*Math.max(1,Math.abs(b))))throw new Error(`${a} ≉ ${b}`)};
