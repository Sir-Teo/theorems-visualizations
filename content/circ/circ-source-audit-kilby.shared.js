// Chosen lumped three-section low-pass ladder and memoryless inverting tanh amplifier.
// This is not the patent's distributed RC geometry.
export function kilbyOscillator(R,C,A,per=400,cycles=16){
 const tau=R*C,f0=Math.sqrt(6)/(2*Math.PI*tau),T0=1/f0,dt=2*Math.PI/Math.sqrt(6)/per,N=cycles*per;
 const F=(x,y,z)=>{const vo=-Math.tanh(A*z);return[vo-2*x+y,x-2*y+z,y-z,vo];};
 let x=.001,y=0,z=0;const out=[],node=[];
 for(let n=0;n<=N;n++){const k1=F(x,y,z);if(n%4===0){out.push([n/per,k1[3]]);node.push([n/per,z]);}if(n===N)break;const k2=F(x+dt*k1[0]/2,y+dt*k1[1]/2,z+dt*k1[2]/2),k3=F(x+dt*k2[0]/2,y+dt*k2[1]/2,z+dt*k2[2]/2),k4=F(x+dt*k3[0],y+dt*k3[1],z+dt*k3[2]);x+=dt/6*(k1[0]+2*k2[0]+2*k3[0]+k4[0]);y+=dt/6*(k1[1]+2*k2[1]+2*k3[1]+k4[1]);z+=dt/6*(k1[2]+2*k2[2]+2*k3[2]+k4[2]);}
 const crosses=[];for(let j=1;j<out.length;j++)if(out[j-1][1]<0&&out[j][1]>=0&&out[j][0]>8)crosses.push(out[j-1][0]+(out[j][0]-out[j-1][0])*(-out[j-1][1]/(out[j][1]-out[j-1][1])));
 const period=crosses.length>=2?(crosses.at(-1)-crosses[0])/(crosses.length-1):null,amplitude=Math.max(...out.filter(p=>p[0]>12).map(p=>Math.abs(p[1])));
 return{f0,T0,out,node,period,amplitude,end:[x,y,z],regime:A<29?'stable':A===29?'marginal':'unstable'};
}
