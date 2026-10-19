// Atlas illustration, not a parameter fit to Grant & Grant's field study.
// Symmetric positive ecological equilibrium N1=N2=K/(1+alpha).
export function displacementGradient(z,a,k){return .25*z*(2/(a*a*(1+Math.exp(2*z*z/(a*a))))-1/(k*k));}
export function displacementLimit(a,k){return a<k?a*Math.sqrt(2*Math.log(2*k*k/(a*a)-1)):0;}
export function runDisplacement(a,k,{T=40,dt=.02}={}){let z=.15;const out={t:[0],z1:[-z],z2:[z],allo1:[-z],allo2:[z]};const n=Math.round(T/dt);for(let i=1;i<=n;i++){const f=x=>displacementGradient(x,a,k),q1=f(z),q2=f(z+dt*q1/2),q3=f(z+dt*q2/2),q4=f(z+dt*q3);z+=dt*(q1+2*q2+2*q3+q4)/6;if(i%25===0||i===n){const t=i*dt,y=.15*Math.exp(-.25*t/(k*k));out.t.push(t);out.z1.push(-z);out.z2.push(z);out.allo1.push(-y);out.allo2.push(y);}}return out;}
