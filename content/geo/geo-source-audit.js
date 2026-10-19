// Constant-A Ekman solution and explicitly simplified cyclone model.
const mul=([a,b],[c,d])=>[a*c-b*d,a*d+b*c];
const div=([a,b],[c,d])=>{const q=c*c+d*d;return[(a*c+b*d)/q,(b*c-a*d)/q];};
const sh=q=>[Math.sinh(q)*Math.cos(q),Math.cosh(q)*Math.sin(q)];
const ch=q=>[Math.cosh(q)*Math.cos(q),Math.sinh(q)*Math.sin(q)];
export function finiteEkman(A,f,H,N=240){
 const d=Math.sqrt(2*A/f),den=mul([A/d,A/d],ch(H/d));
 const at=z=>div(sh((z+H)/d),den),shear=z=>div(ch((z+H)/d),ch(H/d));
 const sech=div([1,0],ch(H/d)),T=div([1-sech[0],-sech[1]],[0,f]);
 const z=Array.from({length:N+1},(_,j)=>-H+H*j/N),w=z.map(at),surf=at(0);
 return{z,re:w.map(x=>x[0]),im:w.map(x=>x[1]),surf,T,d,D:Math.PI*d,at,shear};
}
export const CYCLONE_RHO=1.15;
export function simplePI(celsius){
 const Ts=celsius+273.15,Ta=Ts-1,To=203,Lv=2.5e6,eps=287.05/461.5,p=101000;
 const es=T=>611*Math.exp(Lv/461.5*(1/273.15-1/T)),q=e=>eps*e/(p-(1-eps)*e);
 const dk=1005*(Ts-Ta)+Lv*(q(es(Ts))-q(.8*es(Ta))),eta=(Ts-To)/Ts,eff=(Ts-To)/To;
 return{V:Math.sqrt(eff*dk),dk,eta,eff,Ts,Ta,To};
}
export function cycloneCalibration(V,R,B,f){
 let lo=1,hi=1+1/B;
 for(let j=0;j<72;j++){const x=(lo+hi)/2,r=R*x**(-1/B);if(x-1>f*r/(B*(V+f*r)))hi=x;else lo=x;}
 const x=(lo+hi)/2,rmax=R*x**(-1/B),dp=CYCLONE_RHO*(V*V+f*rmax*V)*Math.exp(x)/(B*x);
 return{V,R,B,f,dp,rmax,pc:101000-dp};
}
export function cycloneAt(r,M){
 if(r<=0)return{p:M.pc,V:0,cyclo:0,geo:0,g:0};
 const x=(M.R/r)**M.B,t=Number.isFinite(x)?x*Math.exp(-x):0,g=M.B*M.dp/CYCLONE_RHO*t;
 const half=M.f*r/2,V=g/(Math.sqrt(g+half*half)+half);
 return{p:M.pc+M.dp*(Number.isFinite(x)?Math.exp(-x):0),V,cyclo:Math.sqrt(g),geo:g/(M.f*r),g};
}
