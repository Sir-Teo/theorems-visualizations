/** Analytic model diagnostics: no finite state scan is used to certify recurrence. */
export function lyapunovDrift(kind,b,x){
 if(kind==='x')return 2*b/(x+1);
 if(kind==='sq')return 1+4*b*x/(x+1);
 const u=1/(x+1);
 // Power series avoids cancellation between equal leading terms at b=1/4.
 let sum=0,pow=u*u;
 for(let k=1;k<=32;k++){const term=pow*(2*b/(2*k-1)-1/(2*k));sum+=term;pow*=u*u;if(k>2&&Math.abs(term)<1e-30*Math.max(Math.abs(sum),1e-300))break;}
 return sum;
}
export function lyapunovCertificate(kind,b){
 if(kind==='log')return b<=.25?{holds:true,reason:'The logarithmic drift is nonpositive for every integer x≥1 when b≤1/4; the power-series coefficients give the sign.'}:{holds:false,reason:'The logarithmic drift has leading term (2b−1/2)/(x+1)^2>0 at infinity, so no finite exceptional set works for this function.'};
 if(kind==='x')return b===0?{holds:true,reason:'The linear drift is zero for all x≥1.'}:{holds:false,reason:'The linear drift 2b/(x+1) is positive at every x≥1.'};
 return{holds:false,reason:'The quadratic drift 1+4bx/(x+1) is positive at every x≥1.'};
}
export function birthDeathP(family,b,x){if(x===0)return 1;return .5+(family==='inv'?b/(x+1):family==='sqrt'?b/Math.sqrt(x+1):b);}
const logAdd=(a,b)=>a===-Infinity?b:b===-Infinity?a:Math.max(a,b)+Math.log1p(Math.exp(-Math.abs(a-b)));
/** log s(M), M=1..N; positive terms are accumulated without overflow/underflow. */
export function logBirthDeathScale(family,b,N){const logs=new Float64Array(N+1);let logTerm=0,logSum=-Infinity;for(let m=0;m<N;m++){if(m){const p=birthDeathP(family,b,m);if(!(p>0&&p<1))throw new Error('non-irreducible birth/death probability');logTerm+=Math.log1p(-p)-Math.log(p);}logSum=logAdd(logSum,logTerm);logs[m+1]=logSum;}return logs;}
export function birthDeathClassification(family,b){
 if(family==='inv')return{recurrent:b<=.25,reason:'The scale summand is asymptotic to a positive constant times m^(−4b); the series diverges exactly when b≤1/4.'};
 if(family==='sqrt')return b<=0?{recurrent:true,reason:'For b≤0 every scale summand is at least 1, so the scale sum diverges.'}:{recurrent:false,reason:'For b>0 the logarithm of the scale summand is −8b√m+O(1); the summands are summable.'};
 return{recurrent:b<=0,reason:'The scale summands form a geometric sequence with ratio (1/2−b)/(1/2+b), which is at least 1 exactly when b≤0.'};
}
export const zeroSuccessUpper95=N=>-Math.expm1(Math.log(.05)/N);
