export function waterTension(T){if(T<248.15||T>647.096)throw new RangeError('IAPWS surface-tension source domain');const t=1-T/647.096;return .2358*t**1.256*(1-.625*t);}
export function frameModel(g,lengthCm,xCm,rubber=false){const dx=xCm-3,F0=2*g*lengthCm*.01,F=rubber?F0*dx/4:F0,W=rubber?F0*.01*dx*dx/8:F0*.01*dx;return{F0,F,W,area:2*lengthCm*.01*dx*.01};}
export const sphereVolume=r=>4*Math.PI/3*r**3;
export const spherePressure=(gamma,rCm,faces=2)=>2*faces*gamma/(rCm*.01);
export function exchangeSpheres(st,dt,gamma,faces=2){if(st.done)return st;const dp=spherePressure(gamma,st.a,faces)-spherePressure(gamma,st.b,faces),lo=sphereVolume(.6),hi=st.Vt-lo;let va=sphereVolume(st.a)-.3*dp*dt;if(va<=lo){va=lo;st.done=true;}else if(va>=hi){va=hi;st.done=true;}st.a=Math.cbrt(va*3/(4*Math.PI));st.b=Math.cbrt((st.Vt-va)*3/(4*Math.PI));return st;}
export function capillaryModel(gamma,rho,theta,rMm,correction=false){const raw=Math.cos(theta*Math.PI/180),c=Math.abs(raw)<1e-12?0:raw,lc=Math.sqrt(gamma/(rho*9.80665))*1000,leading=2*gamma*c/(rho*9.80665*rMm*.001)*1000,h=leading-(correction&&theta===0?rMm/3:0);return{h,leading,lc,narrow:rMm/lc<.3,ratio:rMm/lc};}
