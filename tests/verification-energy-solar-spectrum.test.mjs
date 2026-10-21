import test from 'node:test';import assert from 'node:assert/strict';
import {solarSpectrumAudit as spectrum,solarPowerAudit as power,solarFractionAudit as fraction,solarTransmissionAudit as air,SOLAR_INPUTS_AUDIT as A} from '../content/energy/source-audit-solar.shared.js';
const close=(a,b,t=1e-9)=>assert.ok(Math.abs(a-b)<=t*Math.max(Math.abs(b),1e-100),`${a} != ${b}`);
const simpson=(f,a,b,n)=>{const h=(b-a)/n;let s=f(a)+f(b);for(let i=1;i<n;i++)s+=(i%2?4:2)*f(a+i*h);return s*h/3;};
test('Independent wavelength integration closes the Stefan–Boltzmann model and exact nominal constants remain distinct',()=>{
  assert.equal(A.T,5772);assert.equal(A.R,6.957e8);assert.equal(A.AU,149597870700);
  for(const T of[4000,5772,7500]){
    const integral=simpson(u=>{const nm=Math.exp(u);return spectrum(nm,T)*nm;},Math.log(1),Math.log(1e7),16000);
    close(integral,power(T),2e-10);close(power(T)/power(5772),(T/5772)**4);
    const peak=2897771.955/T;assert.ok(spectrum(peak,T)>spectrum(peak*.999,T)&&spectrum(peak,T)>spectrum(peak*1.001,T));
  }
  close(power(5772),1361,2e-4);assert.notEqual(power(5772),1361,'separately rounded nominal constants need not close exactly');
});
test('Analytic Planck-tail fractions match independent wavelength quadrature throughout the display',()=>{
  for(const T of[4000,5772,7500])for(const nm of[100,200,400,700,1000,2500,4000]){
    const e=simpson(u=>{const l=Math.exp(u);return spectrum(l,T)*l;},Math.log(1),Math.log(nm),8000)/power(T);close(fraction(nm,T),e,2e-9);
  }
  const belowMicron=fraction(1000,5772),uv=fraction(400,5772);assert.ok(belowMicron>.7&&belowMicron<.73);assert.ok(uv>.12&&uv<.13);
  for(const T of[4000,7500])for(let nm=100;nm<4000;nm+=25)assert.ok(fraction(nm+25,T)>fraction(nm,T)&&fraction(nm,T)>=0&&fraction(nm,T)<1);
});
test('Chosen attenuation obeys Beer–Lambert multiplication and cannot create transmitted power',()=>{
  for(let nm=200;nm<=2500;nm+=2.5){const a=air(nm,1),b=air(nm,1.5),c=air(nm,5);assert.ok(c>=0&&c<=b&&b<=a&&a<=1);close(air(nm,2),a*a,1e-12);}
});
