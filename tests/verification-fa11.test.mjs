import{test}from'node:test';import assert from'node:assert/strict';import{functionalDefect,minTrigQuadratic}from'../content/fa/ch11-source.shared.js';
const near=(a,b,e=1e-10)=>assert.ok(Math.abs(a-b)<e,`${a} vs ${b}`);
test('continuous Herglotz density minimum agrees with independent dense search, including off-grid dips',()=>{
 for(const a of[-.9,-.31,0,.27,.83])for(const b of[-.6,0,.15,.4]){let sample=Infinity;for(let j=0;j<100000;j++){const t=2*Math.PI*j/100000;sample=Math.min(sample,1+2*a*Math.cos(t)+2*b*Math.cos(2*t));}const exact=minTrigQuadratic(a,b);assert.ok(exact<=sample+1e-12);near(exact,sample,1e-8);}
 const b=.3,a=Math.sqrt(4*b*(1-2*b+1e-8));assert.ok(minTrigQuadratic(a,b)<0);let old=Infinity;for(let j=0;j<360;j++){const t=2*Math.PI*j/360;old=Math.min(old,1+2*a*Math.cos(t)+2*b*Math.cos(2*t));}assert.ok(old>0,'the old grid incorrectly certified this negative density');
});
test('all three subprobability vertices, including zero, are multiplicative; mixtures have actual defects',()=>{
 for(const[p,q]of[[0,0],[1,0],[0,1]])assert.equal(functionalDefect(p,q),0);
 for(const[p,q]of[[.3,.2],[.5,.5],[.001,0]])assert.ok(functionalDefect(p,q)>0);
 for(const[p,q]of[[.3,.2],[.5,.5]]){const x=[2,-1],y=[3,4],F=z=>p*z[0]+q*z[1];assert.notEqual(F([x[0]*y[0],x[1]*y[1]]),F(x)*F(y));}
});
test('the actual two-sided character readout rejects a point merely near the unit circle',async()=>{
 const item=(await import('../content/fa/ch11-a2.js')).default.items.find(x=>x.num==='11.13'),M=await import('../assets/js/viz/math.js');let read;const hs=[],rs=[];
 const v={M,stage:()=>new Proxy({handle(x,y){const h={x,y};hs.push(h);return h;}},{get:(o,k)=>k in o?o[k]:()=>{}}),select:()=>({value:'Z'}),legend(){},render:f=>rs.push(f),readout:f=>read=f,fix:(x,n)=>x.toFixed(n)};item.viz(v);hs[0].x=1.005;hs[0].y=0;rs.forEach(f=>f());assert.match(read(),/not bounded/);
});
test('the actual ideal picture distinguishes nearly coincident zeros and handles the former extra cosine zero',async()=>{
 const item=(await import('../content/fa/ch11.js')).default.items.find(x=>x.num==='11.2'),M=await import('../assets/js/viz/math.js');for(const[a,b]of[[.4,.401],[Math.PI/4,.2]]){let read;const hs=[],rs=[];const v={M,stage:()=>new Proxy({handle(x,y){const h={x,y,set(x,y){this.x=x;this.y=y;}};hs.push(h);return h;}},{get:(o,k)=>k in o?o[k]:()=>{}}),button(){},legend(){},render:f=>rs.push(f),readout:f=>read=f,fix:(x,n)=>x.toFixed(n),sci:x=>x.toExponential(2)};item.viz(v);hs[0].x=a;hs[1].x=b;rs.forEach(f=>f());assert.match(read(),/ideal is all/);assert.doesNotMatch(read(),/Common zero/);}
});

test('Wiener inverse coefficients multiply to1 with the independently computed geometric residual on either side of the circle',async()=>{
 const{wienerCoefficients}=await import('../content/fa/ch11-source.shared.js');for(const a of[-2,-.6,0,.7,1.4]){const N=20,cs=wienerCoefficients(a,N);let max=0;for(let j=0;j<400;j++){const t=2*Math.PI*j/400,fr=1-a*Math.cos(t),fi=-a*Math.sin(t);let gr=0,gi=0;for(const[n,c]of cs){gr+=c*Math.cos(n*t);gi+=c*Math.sin(n*t);}max=Math.max(max,Math.hypot(fr*gr-fi*gi-1,fr*gi+fi*gr));}near(max,Math.abs(a)<1?Math.abs(a)**(N+1):Math.abs(a)**(-N));}assert.equal(wienerCoefficients(1,20),null);assert.equal(wienerCoefficients(-1,20),null);
});

test('the actual maximal-ideal picture preserves an inverse when a character value is small but nonzero',async()=>{
 const item=(await import('../content/fa/ch11.js')).default.items.find(x=>x.num==='11.5'),M=await import('../assets/js/viz/math.js');const hs=[],rs=[];let read;const v={M,Cx:M.Cx,stage:()=>new Proxy({handle(x,y){const h={x,y,set(x,y){this.x=x;this.y=y;}};hs.push(h);return h;}},{get:(o,k)=>k in o?o[k]:()=>{}}),button(){},legend(){},render:f=>rs.push(f),readout:f=>read=f,fix:(x,n)=>x.toFixed(n)};item.viz(v);hs[3].x=hs[0].x+1e-4;hs[3].y=hs[0].y;rs.forEach(f=>f());assert.match(read(),/is invertible/);assert.doesNotMatch(read(),/has no inverse/);
});
