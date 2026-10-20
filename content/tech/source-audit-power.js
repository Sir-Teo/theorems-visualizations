// Smeaton 1759, actual printed Tables I–III (pp.115,129,144) and footnote p.148.
// The printed power/effect columns are preserved, including their internal rounding discrepancies.
export const SMEATON_UNDER = [
 [4358,1411,3.24],[3970,1266,3.2],[3329,1044,3.14],[2890,901.4,3.12],[2439,735.7,3.02],[1970,561.8,2.85],[1524,442.5,2.9],[1173,328,2.8],[733,213.7,2.9],[404.7,117,2.82],
 [4800,1505,3.075],[4009,1223,3.01],[2993,975,3.25],[2659,774,2.92],[1872,549,2.94],[1280,390,3.05],[712,212,2.98],[3748,1210,3.23],[2887,878,3.05],[1734,541,3.01],[1064,317,2.99],[3338,1006,3.02],[2257,686,3.04],[1231,385,3.13],[2588,783,3.03],[1544,450,2.92],[1811,534,2.95],
];
// Whole-descent power, wheel-diameter power, effect, printed 10:r whole ratio, printed 10:r wheel ratio.
export const SMEATON_OVER = [
 [810,720,556,6.9,7.7],[1530,1360,1060,6.9,7.8],[1530,1360,1167,7.6,8.4],[1710,1524,1245,7.3,8.2],[2070,1840,1500,7.3,8.2],[2090,1764,1476,7.1,8.4],[2755,2320,1868,6.8,8.1],[2700,2160,1755,6.5,8.1],[2900,2320,1914,6.6,8.2],[3400,2720,2221,6.5,8.2],[1870,1360,1230,6.6,9],[3520,2560,2153,6.1,8.4],[4840,3520,2846,5.9,8.1],[2275,1560,1466,6.5,9.4],[4200,2880,2467,5.9,8.6],[5728,3924,2981,5.2,7.6],
];
// Family, angle of weather at tip, greatest angle, printed product, printed cloth area in square inches.
export const SMEATON_SAILS = [
 ['plane',35,35,318,404],['plane',12,12,441,404],['plane',15,15,464,404],['plane',18,18,462,404],
 ['Maclaurin',9,26.5,462,404],['Maclaurin',12,29.5,518,404],['Maclaurin',15,32.5,527,404],
 ['Dutch',0,15,442,404],['Dutch',3,18,553,404],['Dutch',5,20,585,404],['Dutch',7.5,22.5,639,404],['Dutch',10,25,634,404],['Dutch',12,27,580,404],
 ['enlarged',7.5,22.5,799,505],['enlarged',10,25,820,505],['enlarged',12,27,799,505],['enlarged',15,30,762,505],['ellipse',12,22,1059,854],['ellipse',12,22,1165,1146],
];
export const SMEATON_ANGLES = [18,19,18,16,12.5,7];
const need=ok=>{if(!ok)throw new RangeError('Outside the declared illustration domain');};
const valid=(x,a,b)=>typeof x==='number'&&Number.isFinite(x)&&x>=a&&x<=b;
const mean=a=>a.reduce((s,x)=>s+x,0)/a.length;
export function smeatonWater(basis='whole',underRow=1,overRow=1){
 need(['whole','wheel'].includes(basis)&&Number.isInteger(underRow)&&valid(underRow,1,27)&&Number.isInteger(overRow)&&valid(overRow,1,16));
 const under=SMEATON_UNDER.map(([power,effect,printed],i)=>({row:i+1,power,effect,printed,ratio:effect/power,residual:10*effect/power-printed})),over=SMEATON_OVER.map(([whole,wheel,effect,pw,pd],i)=>{const power=basis==='whole'?whole:wheel,printed=basis==='whole'?pw:pd;return{row:i+1,whole,wheel,power,effect,printed,ratio:effect/power,residual:10*effect/power-printed};}),residuals=[...under,...over].map(x=>x.residual),M=Math.max(.02,...residuals.map(Math.abs));
 return{basis,underRow,overRow,under,over,selectedUnder:under[underRow-1],selectedOver:over[overRow-1],meanUnder:mean(under.map(x=>x.ratio)),meanOver:mean(over.map(x=>x.ratio)),residualY:[-1.25*M,1.25*M]};
}
export function smeatonWind(row=1,basis='product',convention='plane'){
 need(Number.isInteger(row)&&valid(row,1,19)&&['product','area'].includes(basis)&&['plane','axis'].includes(convention));
 const points=SMEATON_SAILS.map((s,i)=>[i+1,basis==='area'?s[3]/s[4]:s[3]]),angles=SMEATON_ANGLES.map((x,i)=>[(i+1)/6,convention==='plane'?x:90-x]);
 return{row,basis,convention,points,angles,source:SMEATON_SAILS[row-1],selected:points[row-1],y:[-.12*Math.max(...points.map(p=>p[1])),1.18*Math.max(...points.map(p=>p[1]))]};
}
// Authored hydraulic loss comparisons. These constants and bucket rules are not a fitted historical wheel.
export function wheelPower(kind,u,H,Q){
 need(['under','breast','over'].includes(kind)&&valid(u,0,15)&&valid(H,1,10)&&valid(Q,.05,1));
 const rho=1000,g=9.81,v=Math.sqrt(2*g*H),fill=Math.min(1,1/Math.max(1e-6,1.5*u));
 if(kind==='under')return rho*Q*.75*Math.max(0,v-u)*u;
 if(u===0)return 0;
 const R=(kind==='over'?.45:.4)*H,theta=(125+55*(1-fill))*Math.PI/180,flow=Q*Math.min(1,1.5*u)*(1-Math.min(.5,u*u/(g*R))),entry=kind==='over'?0:Math.PI/3,fall=R*Math.max(0,Math.cos(entry)-Math.cos(theta)),vIn=Math.sqrt(2*g*Math.max(0,H-R*(1+Math.cos(entry)))),impulse=kind==='over'?0:.6*rho*Q*.75*Math.max(0,vIn-u)*u;
 return Math.max(0,rho*g*flow*fall+impulse-.5*rho*flow*u*u);
}
export function waterWheels(H=4,Q=.2,u=1,time=1,kind='under'){
 need(valid(time,0,5));
 const kinds=['under','breast','over'],curves=kinds.map(k=>Array.from({length:601},(_,i)=>{const x=i/40;return[x,wheelPower(k,x,H,Q)/(1000*9.81*Q*H)];})),power=kinds.map(k=>wheelPower(k,u,H,Q)),peaks=curves.map(c=>c.reduce((a,b)=>b[1]>a[1]?b:a)),radius=(kind==='breast'?.4:.45)*H,phase=(kind==='over'?1:-1)*u*time/radius;
 need(kinds.includes(kind));return{H,Q,u,time,kind,curves,power,peaks,radius,phase,jet:Math.sqrt(2*9.81*H),available:1000*9.81*Q*H};
}
