import assert from 'node:assert/strict';
import * as H from '../content/art/ch06.shared.js';

const names=['centreSurround','mach','contrast','albers','assimilation','constancy','vonKries','retinex','dress','hueChanges','brightness','checker','equiluminance','chevreul'];
const fmt=x=>x===null?'undefined':Number(x.toPrecision(5)).toString().replace(/-/g,'−');
export function artScience(id,q,pixels){
 let comparisons=0,pixelComparisons=0;
 const close=(a,b,label)=>{comparisons++;assert.ok(Number.isFinite(a)&&Number.isFinite(b)&&Math.abs(a-b)<=3e-10*(1+Math.abs(b)),`${label}: ${a} expected ${b}`);};
 const compare=(a,b,label)=>{if(b&&typeof b==='object'){assert.deepEqual(Object.keys(a).sort(),Object.keys(b).sort(),label+' complete keys');for(const k of Object.keys(b))compare(a[k],b[k],label+'.'+k);}else if(typeof b==='number')close(a,b,label);else{comparisons++;assert.deepEqual(a,b,label);}};
 const slider=label=>{const part=q.state.parts.find(([k])=>k.startsWith('slider:'+label+':'));assert.ok(part,'slider '+label);return part[1];};
 const select=label=>{const p=q.state.parts.find(([k])=>k.startsWith('select:'+label+':'));assert.ok(p,'select '+label);return p[1][1][p[1][0]];};
 const toggle=label=>q.state.parts.find(([k])=>k.startsWith('toggle:'+label+':'))[1];
 const clock=q.state.parts.find(([k])=>k.startsWith('clock:'))?.[1]??0;
 let args;
 if(id===1)args={sigma:slider('centre σ (samples)'),ratio:slider('surround / centre width'),strength:slider('surround strength'),position:slider('sample position'),stimulus:select('input pattern')};
 if(id===2)args={width:slider('ramp width (samples)'),sigma:slider('blur σ (samples)'),strength:slider('model detail gain'),profile:select('input profile')};
 if(id===3)args={target:slider('target gray (sRGB byte)'),left:slider('left gray ground'),right:slider('right gray ground'),grounds:select('grounds'),hue:slider('chromatic ground hue'),bridge:slider('comparison bridge')};
 if(id===4)args={exercise:select('Albers-style exercise')==='One colour, two contexts'?'one':'two',hue:slider('ground hue'),separation:slider('authored target separation'),grounds:select('ground family')==='chromatic'?'chromatic':'neutral',bridge:slider('comparison bridge')};
 if(id===5)args={width:slider('line width (grid samples)'),sigma:slider('model pooling σ'),phase:slider('sample within one 24-step period')};
 if(id===6)args={warmth:slider('authored illuminant warmth'),degree:slider('inverse-gain degree')};
 if(id===7)args={red:slider('sRGB red'),green:slider('sRGB green'),blue:slider('sRGB blue'),from:select('source white'),to:select('destination white'),degree:slider('adaptation degree')};
 if(id===8)args={warmth:slider('global illumination warmth'),gradient:slider('spatial illumination gradient'),selected:slider('selected Mondrian patch')-1,context:select('other reflectances')};
 if(id===9)args={assumption:select('assumed illuminant'),degree:slider('discounting degree')};
 if(id===10)args={hue:slider('RGB hue direction'),gain:slider('linear intensity scale'),whiteMix:slider('equal-Y neutral mixture')};
 if(id===11)args={hue:slider('RGB hue direction'),purity:slider('linear neutral-to-colour mixture'),Y:slider('common relative luminance Y'),match:slider('your gray choice: linear Y')};
 if(id===12)args={shadow:toggle('show authored shadow'),bridge:slider('comparison bridge'),probe:slider('transect position (%)')};
 if(id===13)args={red:slider('red channel byte'),green:slider('green channel byte'),cycles:slider('cycles across each field'),phase:slider('initial phase (cycles)')+clock*slider('motion rate (cycles / second)'),speed:slider('motion rate (cycles / second)')};
 if(id===14)args={hue:slider('surround hue direction'),strength:slider('authored affine-rule strength'),density:slider('woven ground strands'),bridge:slider('comparison bridge')};
 const family=names[id-1],entry=Object.values(q.models[family]??{}).find(row=>Object.keys(args).every(k=>Object.is(row.parameters[k],args[k])));assert.ok(entry,'actual render requested the current '+family+' parameters');
 const z=H[family](args);compare(entry.result,z,family+' actual render');
 const path=(stage,color,points)=>{const candidate=q.stages[stage].paths.find(row=>row.style.color===color&&row.points.length===points.length&&row.points.every((p,i)=>p.every((x,j)=>Math.abs(x-points[i][j])<3e-10*(1+Math.abs(points[i][j])))));assert.ok(candidate,`${id} stage${stage} actual ${color} path, ${points.length} points`);compare(candidate.points,points,'painted path');};
 if(id===1){path(1,'purple',z.kernel.map((x,i)=>[i-z.radius,x]));path(2,'purple',z.response.map((x,i)=>[i,x]));}
 if(id===2){path(1,'blue',z.enhanced.map((x,i)=>[i,x]));path(2,'orange',z.detail.map((x,i)=>[i,x]));}
 if(id===5)for(let j=0;j<2;j++)path(1,j?'orange':'blue',Array.from({length:24},(_,i)=>[i,H.linearXYZ(z.pooled[j].map(c=>c[i]))[1]]));
 if(id===6){path(3,'orange',z.rawError.map((x,i)=>[i+1,x]));path(3,'blue',z.correctedError.map((x,i)=>[i+1,x]));for(const s of q.stages.slice(0,3))close(s.sx,s.sy,'still-life geometry retains aspect ratio');}
 if(id===7){const expected=[...z.basis,...z.gains,...z.scaled].map(fmt),glyphs=q.stages[0].glyphs.filter(g=>!g.stroke).map(g=>g.text);for(const text of expected){const i=glyphs.indexOf(text);assert.ok(i>=0,'actual basis pipeline text '+text);glyphs.splice(i,1);comparisons++;}}
 if(id===8){path(2,'orange',z.sample.map((x,i)=>[i,x]));path(2,'blue',z.estimate.map((x,i)=>[i,x]));}
 if(id===12){path(2,'muted',z.transect.map(r=>[r.t,r.reflectance]));path(2,'blue',z.transect.map(r=>[r.t,r.Y]));}
 if(id===14)for(let j=0;j<2;j++)path(2,j?'orange':'blue',z.predicted[j].map((x,i)=>[i,x]));
 // Additional coordinate/trace assertions. All earlier checks remain byte-exact.
 // Knee-label regression assertions: actual changes, native glyph ink and spacing.
 if(id===2){const marked=args.profile==='ramp'?z.knees:z.input.flatMap((x,i)=>i&&x!==z.input[i-1]?[i]:[]);for(const stage of[0,2]){const lines=q.stages[stage].lines.filter(row=>row.style.color==='gold');assert.equal(lines.length,marked.length,'actual marked profile changes');for(let i=0;i<marked.length;i++)for(const point of lines[i].points)close(point[0],marked[i],'actual marked sample index');}const labels=q.stages[0].glyphs.filter(g=>!g.stroke&&/^\d+(?:\.\d+)?$/.test(g.text)).sort((a,b)=>a.l-b.l);assert.deepEqual(labels.map(g=>g.text),marked.map(fmt),'actual profile-index labels');for(let i=1;i<labels.length;i++)assert.ok(labels[i-1].r+3<=labels[i].l,'adjacent profile labels retain at least3px of clear ink');}
 // End knee-label regression assertions.
 const dots=(stage,color,points)=>{const actual=q.stages[stage].dots.filter(p=>p.style.color===color);assert.equal(actual.length,points.length,'actual '+color+' dot count');for(let i=0;i<points.length;i++)compare(actual[i].points[0],points[i],'actual coordinate marker');return actual;};
 if(id===3)dots(2,'blue',z.differences.map((x,i)=>[i,x]));
 if(id===4){const blue=dots(2,'blue',[z.targets[0].lab.slice(1)]),orange=dots(2,'orange',[z.targets[1].lab.slice(1)]);assert.equal(blue[0].style.r,3.5);assert.equal(orange[0].style.r,7);assert.equal(orange[0].style.hollow,true);assert.equal(q.stages[2].dots[0].style.color,'orange','hollow marker painted before the smaller filled marker');}
 if(id===7)dots(2,'blue',H.xy(z.originalXYZ)?[H.xy(z.originalXYZ),H.xy(z.xyz)]:[]);
 if(id===8)path(2,'muted',z.maxima.map((x,i)=>[i,x]));
 if(id===9){dots(2,'muted',z.rawCoordinates.map(q=>q.slice(1)));dots(2,'blue',z.coordinates.map(q=>q.slice(1)));}
 if(id===10){path(1,'orange',z.purity.map(q=>q.xy));dots(1,'blue',[H.xy(z.baseXYZ)]);dots(1,'gold',[z.xy]);const rows=select('coordinate trace')==='intensity'?z.intensity:z.purity,segments=[];let segment=[];for(const row of rows){const h=row.polar.h;if(h===null||segment.length&&Math.abs(h-segment.at(-1)[1])>180){if(segment.length)segments.push(segment);segment=[];}if(h!==null)segment.push([row.t,h]);}if(segment.length)segments.push(segment);assert.equal(q.stages[2].paths.filter(p=>p.style.color==='purple').length,segments.filter(p=>p.length>1).length);for(const points of segments.filter(p=>p.length>1))path(2,'purple',points);}
 if(id===11){const points=Array.from({length:21},(_,i)=>H.lab(H.brightness({...args,purity:i/20}).xyz).slice(1));path(2,'blue',points);dots(2,'gold',[H.lab(z.xyz).slice(1)]);}
 // End additional coordinate/trace assertions.
 const bars=(stage,values)=>{for(const[i,value]of values.entries()){const r=q.stages[stage].rects.find(r=>Math.abs(r.points[0][0]-(i-.24))<1e-12);assert.ok(r,'actual bar '+i);close(r.points[1][1],value,'actual bar height');}};
 if(id===11)bars(1,[z.xyz[1],z.equalXYZ[1],z.matchXYZ[1]]);
 if(id===13)bars(2,z.Ys);
 for(const p of pixels){let expected=null;
  if(id===1){const s=q.stages[0],x=s.W*(args.position/128);if(Math.abs(p.px+.5-x)<2)continue;expected=H.grayY(z.input[H.clamp(Math.round(p.x),0,128)]);}
  if(id===2)expected=H.grayY(z.input[H.clamp(Math.round(p.x),0,160)]);
  if([3,4,14].includes(id)){
   const [tag,index]=p.tag.split('-');const i=Number(index);
   if(tag==='target')expected=(z.targets??[z.target,z.target])[i].rgb;
   if(tag==='ground'){
    expected=p.stage===1?[145,145,145]:(z.backgrounds??z.surrounds)[i].rgb;
    if(id===14){const left=.3+4.7*i,t=(p.x-left)/4.7*args.density;if(t-Math.floor(t)<.35)expected=expected.map(x=>Math.round(.72*x));}
   }
   if(tag==='preview')expected=z.previews[i].rgb;
  }
  if(id===5){if(p.tag.startsWith('stripe')){const j=Number(p.tag.at(-1)),index=H.mod(Math.floor((p.y-1.3)/5.95*96),24);expected=index<args.width?z.lines[j]:z.red;}else{const i=Number(p.tag.at(-1));expected=i?z.previews[i-1].rgb:z.red;}}
  if(id===6){const E=p.stage?z.E:[1,1,1],g=p.stage===2?z.gains:[1,1,1];if(p.tag==='scene')expected=H.sceneSample(p.x,p.y).map((x,i)=>Math.round(255*H.encode(H.clamp(x*E[i]*g[i]))));else{const i=Number(p.tag.split('-')[1]);expected=H.preview(H.linearXYZ(H.REFLECTANCES[i].map((x,j)=>x*E[j]*g[j]))).rgb;}}
  if(id===7)expected=p.tag==='preview-0'?z.rgb:z.preview.rgb;
  if(id===8){const i=Number(p.tag.split('-')[1]);expected=H.preview(H.linearXYZ(p.stage===0?z.raw[i]:z.normalized[i])).rgb;}
  if(id===9){const i=Math.floor((p.y-1.5)/.34)%2;expected=p.stage===0?H.DRESS[i]:z.previews[i].rgb;}
  if(id===10)expected=[H.preview(z.baseXYZ).rgb,H.preview(H.linearXYZ(z.pure)).rgb,z.preview.rgb][Number(p.tag.at(-1))];
  if(id===11)expected=[z.preview.rgb,z.equal.rgb,z.personal.rgb][Number(p.tag.at(-1))];
  if(id===12)expected=p.tag==='A'||p.tag==='isolated-0'?z.A.rgb:z.B.rgb;
  if(id===13){if(p.x<.32||p.x>9.68)continue;const i=H.mod((p.x-.3)/9.4*args.cycles-z.phase,1)<.5?0:1;expected=(p.tag==='colour'?z.colours.map(q=>q.rgb):p.tag==='proxy'?z.proxy:z.reference)[i];}
  assert.ok(expected,'pixel expectation '+id+' '+p.tag);assert.deepEqual(p.rgba,[...expected,255],`${id} stage${p.stage} actual RGBA ${p.tag} at (${p.x},${p.y})`);pixelComparisons+=4;
 }
 return{modelComparisons:comparisons,pixelComparisons};
}
