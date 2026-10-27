import assert from'node:assert/strict';
import*as H from'../content/arch/ch06.shared.js';
const close=(a,b)=>Math.abs(a-b)<=2e-11+3e-11*Math.abs(b);
export function archScience(n,q){
 let comparisons=0,geometryComparisons=0,projectionComparisons=0;
 const ctl=label=>{const p=q.state.parts.find(([k])=>k.startsWith('slider:'+label+':'));assert.ok(p,'slider '+label);return p[1];},select=label=>{const p=q.state.parts.find(([k])=>k.startsWith('select:'+label+':'));assert.ok(p,'select '+label);return p[1][1][p[1][0]];};
 // Lazy cases keep the control schema for each real lesson explicit.
 let name,args;
 if(n===1){name='curvedStiffness';args={rise:ctl('rise / half-span'),thin:ctl('beam thickness / half-span'),load:ctl('load / (E × thickness)')};}
 if(n===2){name='hypar';args={curvature:ctl('saddle coefficient c'),ruling:ctl('straight ruling coordinate'),x:ctl('probe x'),y:ctl('probe y')};}
 if(n===3){name='tensionPatch';args={k1:ctl('principal curvature κ₁'),k2:ctl('principal curvature κ₂'),T1:ctl('tension resultant N₁'),T2:ctl('tension resultant N₂'),pressure:ctl('applied pressure p')};}
 if(n===4){name='minimalGraph';args={a:ctl('Scherk shape parameter a'),trial:ctl('fixed-boundary trial amplitude δ'),x:ctl('curvature probe x'),y:ctl('curvature probe y')};}
 if(n===5){name='hangingModel';args={weight:ctl('design weight per free joint'),bias:ctl('weight gradient across x'),loadChange:ctl('actual / design weight'),selected:ctl('selected free joint')};}
 if(n===6){name='cableNet';args={qX:ctl('x-family force density qₓ'),qY:ctl('y-family force density qᵧ'),rise:ctl('fixed boundary saddle rise'),load:ctl('vertical load at each free joint'),selected:ctl('selected free joint')};}
 if(n===7){name='dynamicRelaxation';args={qX:ctl('x-family force density'),qY:ctl('y-family force density'),damping:ctl('fictitious viscous damping c'),dt:ctl('iteration step Δτ'),steps:ctl('selected iteration')};}
 if(n===8){name='gridshell';args={rise:ctl('target roof rise'),shear:ctl('cell shear angle / degrees'),brace:select('cell diagonal')==='elastic brace'};}
 if(n===9){name='tensegrity';args={radius:ctl('prism radius'),height:ctl('baseline prism height'),prestress:ctl('baseline cross-cable density q'),twist:ctl('held symmetric twist / degrees')};}
 if(n===10){name='pneumatic';args={a:ctl('fixed rim radius a'),N:ctl('constant tension resultant N'),alpha:select('pressure case')==='zero pressure'?0:ctl('pressure / peak pressure'),branch:select('spherical-cap branch')};}
 if(n===11){name='shellThinness';args={ratio:ctl('curvature radius / thickness R/t'),nu:ctl('Poisson ratio ν'),angle:ctl('cap half-opening angle / degrees')};}
 assert.equal(q.modelName,name);const z=H[name](args);
 function cmp(a,b,p){if(b&&typeof b==='object'){assert.deepEqual(Object.keys(a).sort(),Object.keys(b).sort(),p+' keys');for(const k in b)cmp(a[k],b[k],p+'.'+k);}else{comparisons++;if(typeof b==='number'){assert.ok(Number.isFinite(b)&&Number.isFinite(a),p);assert.ok(close(a,b),`${p}: ${a} != ${b}`);}else assert.deepEqual(a,b,p);}}
 cmp(q.model,z,name);assert.equal(q.stages.length,3);assert.equal(q.drawErrors.length,0);assert.doesNotMatch(q.readout,/NaN|Infinity|\[object Object\]/);
 const pointEq=(a,b)=>a.length===b.length&&a.every((x,i)=>close(x,b[i]));
 const wanted=(s,points)=>{const found=s.paths.find(r=>r.points.length===points.length&&r.points.every((p,i)=>pointEq(p,points[i])));assert.ok(found,'actual plotted path '+n+' '+s.kind+' '+points.length);geometryComparisons+=points.length*points[0].length;return found;};
 const transform=(s,p)=>H.sub(p,s.frame.center);
 const mesh=(s,grid)=>{assert.equal(s.meshes.length,1);const expected=grid.flat().map(p=>transform(s,p));assert.equal(s.meshes[0].points.length,expected.length);s.meshes[0].points.forEach((p,i)=>{assert.ok(pointEq(p,expected[i]),'surface vertex '+i);geometryComparisons+=3;});};
 const edges=(s,pairs,P)=>{for(const[a,b]of pairs){const points=[transform(s,P[a]),transform(s,P[b])];assert.ok(s.lines.some(r=>r.points.every((p,i)=>pointEq(p,points[i]))),'3D edge '+a+' '+b);geometryComparisons+=6;}};
 const [A,B,C]=q.stages;
 if(n<=4){const expected=n===1?[z.axialK,z.beamK,z.axialDeflection,z.beamDeflection]:n===2?[z.K,z.H,...z.principal]:n===3?[...z.contributions,z.requiredPressure,z.pressure,z.residual]:[z.selected.H,z.area,z.baseArea,z.area-z.baseArea];assert.equal(C.ledger.rows.length,expected.length);C.ledger.rows.forEach((row,i)=>cmp(row[1],expected[i],'displayed metric '+i));if(n===1)assert.deepEqual(C.ledger.groups,['stiffness','stiffness','displacement','displacement']);if(n===2||n===4)assert.equal(C.ledger.metrics,true,'unlike quantities have no common magnitude bars');}
 if(n===1){wanted(A,z.barNodes.map(p=>transform(A,p)));wanted(B,z.curves);}
 if(n===2){mesh(A,z.grid);z.rulings.forEach(p=>wanted(A,p.map(p=>transform(A,p))));wanted(B,z.section);wanted(B,z.otherSection);}
 if(n===3){mesh(A,z.grid);z.sections.forEach(p=>wanted(B,p));}
 if(n===4){mesh(A,z.grid);for(let j=0;j<4;j++)wanted(A,z.boundary.map(row=>transform(A,row[j])));wanted(B,z.areaCurve);}
 if(n===5){edges(A,z.net.edges,z.net.coordinates);edges(B,z.net.edges,z.inverted);wanted(C,z.residuals.map((r,i)=>[i,r]));}
 if(n===6){edges(A,z.edges,z.coordinates);assert.equal(B.arrows.length,5);B.arrows.forEach((a,i)=>{assert.ok(pointEq(a.points[0],transform(B,z.forcePolygon[i])));assert.ok(pointEq(a.points[1],transform(B,z.forcePolygon[i+1])));geometryComparisons+=6;});wanted(C,z.tensions.map((r,i)=>[i,r]));}
 if(n===7){edges(A,z.net.edges,z.coordinates);edges(A,z.net.edges,z.net.coordinates);wanted(B,z.history.map(r=>[r.iteration,r.residualNorm]));wanted(C,z.history.map(r=>[r.iteration,r.kinetic]));wanted(C,z.history.map(r=>[r.iteration,r.potential]));for(const[field,color]of[['kinetic','orange'],['potential','teal']]){assert.ok(C.dots.some(d=>d.style.color===color&&pointEq(d.points[0],[z.steps,z.frame[field]])),'visible selected '+field+' sample, including iteration0');geometryComparisons+=2;}}
 if(n===8){for(const[a,b]of z.edges)assert.ok(A.lines.some(r=>pointEq(r.points[0],transform(A,a))&&pointEq(r.points[1],transform(A,b))));wanted(B,[...z.cell,z.cell[0]]);wanted(C,z.energyCurve);geometryComparisons+=z.edges.length*6;}
 if(n===9){edges(A,z.edges,z.coordinates);wanted(B,z.memberForces.map((f,i)=>[i,f]));wanted(C,z.energyCurve);}
 if(n===10){if(z.selected){mesh(A,z.selected.grid);wanted(C,z.selected.localEnergy);}else assert.equal(A.meshes.length,0);wanted(B,z.pressureCurve);}
 if(n===11){wanted(A,z.section);wanted(B,z.scaling);wanted(C,z.correlationCurve);}
 // Check the camera projection against actual instrumented canvas coordinates,
 // independent of Stage3D.project, with the same uniform world scale on x/y/z.
 for(const s of q.stages.filter(s=>s.kind==='stage3d')){assert.ok(s.frame&&s.range>0);const[yaw,pitch,zoom]=s.camera,sc=Math.min(s.W,s.H)/(2*s.range)*zoom;for(const geom of[...s.paths,...s.lines,...s.arrows,...s.dots])for(let i=0;i<geom.points.length;i++){const[x,y,z]=geom.points[i],xr=x*Math.cos(yaw)-y*Math.sin(yaw),yr=x*Math.sin(yaw)+y*Math.cos(yaw),expected=[s.W/2+xr*sc,s.H/2-(z*Math.cos(pitch)+yr*Math.sin(pitch))*sc];expected.forEach((v,j)=>{assert.ok(close(v,geom.pixels[i][j]),'3D camera projection');projectionComparisons++;});}}
 return{modelComparisons:comparisons,geometryComparisons,projectionComparisons};
}
