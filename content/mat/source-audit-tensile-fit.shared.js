// Incompressible-area convention of the educational bar, retaining its linear
// axial elastic strain. It is a model, not finite-strain elastic constitutive theory.
export function powerLawPeak(K,n,E=Infinity) {
 if(!(K>0&&n>0&&E>0))return null;
 let lo=0,hi=n;for(let j=0;j<90;j++){const p=(lo+hi)/2;if(p/n+K*p**n/E<1)lo=p;else hi=p;}
 const plastic=(lo+hi)/2,stress=K*plastic**n,total=plastic+stress/E;
 return{plastic,stress,total,nominal:stress*Math.exp(-total)};
}
export const tangentStressRatio=(p,K,n,E)=>n/(p+n*K*p**n/E);
export function fitLogPower(data,lo,hi){
 const pts=data.filter(p=>p.ep>=lo&&p.ep<=hi&&p.ep>0&&p.s>0);if(!(hi>lo)||pts.length<3)return{count:pts.length,fit:null};
 const x=pts.map(p=>Math.log(p.ep)),y=pts.map(p=>Math.log(p.s)),mx=x.reduce((s,x)=>s+x,0)/x.length,my=y.reduce((s,y)=>s+y,0)/y.length;
 let xx=0,xy=0,yy=0;for(let i=0;i<x.length;i++){xx+=(x[i]-mx)**2;xy+=(x[i]-mx)*(y[i]-my);yy+=(y[i]-my)**2;}
 if(xx<1e-16)return{count:pts.length,fit:null};const n=xy/xx,K=Math.exp(my-n*mx),res=y.reduce((s,q,i)=>s+(q-(my+n*(x[i]-mx)))**2,0);
 return{count:pts.length,fit:{n,K,r2:yy>1e-16?1-res/yy:null,se:Math.sqrt(res/(x.length-2)/xx)}};
}
