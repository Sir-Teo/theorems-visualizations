// Exact periodic envelope for an ideal sinusoidal source, fixed diode drops, and a resistive RC load.
export function rectifierEnvelope(type,Vp,R,C,f,per=400,cycles=3){
 const D=type==='half'?.7:1.4,P=type==='half'?2*Math.PI:Math.PI,omega=2*Math.PI*f,a=omega*R*C;
 const off=Math.PI-Math.asin(D/(Vp*Math.sqrt(1+a*a)))-Math.atan(a),vOff=Vp*Math.sin(off)-D;
 const rect=theta=>Math.max(0,Vp*(type==='half'?Math.sin(theta):Math.abs(Math.sin(theta)))-D);
 const at=theta=>{const lag=theta-off-P*Math.floor((theta-off)/P);return Math.max(rect(theta),vOff*Math.exp(-lag/a));};
 let lo=Math.asin(D/Vp),hi=Math.PI/2;
 for(let j=0;j<70;j++){const x=(lo+hi)/2;if(Vp*Math.sin(x)-D-vOff*Math.exp(-(x+P-off)/a)<0)lo=x;else hi=x;}
 const on=(lo+hi)/2,vmin=vOff*Math.exp(-(on+P-off)/a),vmax=Vp-D;
 const out=[],vin=[];for(let j=0;j<cycles*per;j++){const theta=2*Math.PI*j/per;out.push(at(theta));vin.push(Vp*Math.sin(theta));}
 return{out,vin,dt:1/(f*per),at,off,on,vmin,vmax,ripple:vmax-vmin,fr:type==='half'?f:2*f};
}
