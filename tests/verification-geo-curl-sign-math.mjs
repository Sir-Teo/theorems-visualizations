// Explicit independent constant-axis curl identity; no production numerical imports.
import assert from'node:assert/strict';
let cases=0;const near=(a,b)=>{assert.ok(Math.abs(a-b)<1e-9);cases++;};
// k × (u,v,w)=(-v,u,0), hence curl=(−u_z,−v_z,u_x+v_y).
for(let j=-50;j<=50;j++)for(let l=-20;l<=20;l++){let x=j/7,y=l/9,z=(j+l)/11,C=1.3;
 // Divergence-free polynomial field (x²−2xz, yz, −2xz+z²/2).
 let ux=2*x-2*z,vy=z,wz=-2*x+z,uz=-2*x,vz=y;near(ux+vy+wz,0);let curl=[-C*uz,-C*vz,C*(ux+vy)],axial=[-C*uz,-C*vz,-C*wz];curl.forEach((q,i)=>near(q,axial[i]));
 // u=(0,xz,0) is a nonzero sign witness, also divergence-free.
 const h=1e-4,Fx=zz=>-C*x*zz;const measured=(Fx(z+h)-Fx(z-h))/(2*h);near(measured,-C*x);if(x!==0)assert.ok(Math.abs(measured-C*x)>1e-4);
}console.log(`PASS ${cases} curl identity checks: curl(C k×u)=C(k div u−∂z u); incompressible sign is negative`);
