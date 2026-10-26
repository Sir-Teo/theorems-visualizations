import test,{after} from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import * as H from '../content/psych/ch06.shared.js';import chapter from '../content/psych/ch06.js';import syllabus from '../content/psych/syllabus.js';
const fixture=JSON.parse(fs.readFileSync(new URL('./fixtures/wave6-psych-reference.json',import.meta.url))),stats={cases:0,comparisons:0,angleValues:0,approximateCoordinates:0,worstAngleUlps:0,worstApproximateAbsolute:0,worstLogAbsolute:0};
const numerical=/\.(?:tangent|orientation|offset|meanAbsoluteJitter|mouthAngle|mouthWidth|vx|vy|x|y)$|\.(?:fins|surroundCenters|currentPosition)(?:\.|$)|^closure\.vertices(?:\.|$)|^gaborSample$/;
function ulp(x){x=Math.abs(x);return !x||x<2**-1022?Number.MIN_VALUE:2**(Math.floor(Math.log2(x))-52);}
function compare(a,b,path){
 if(b&&typeof b==='object'&&!Array.isArray(b)&&'exact'in b){assert.equal(a.exact.n.toString(),b.exact.n,path+' exact numerator');assert.equal(a.exact.d.toString(),b.exact.d,path+' exact denominator');stats.comparisons+=2;}
 if(b&&typeof b==='object'){
  assert.equal(Array.isArray(a),Array.isArray(b),path+' object shape');assert.deepEqual(Object.keys(a),Object.keys(b),path+' complete keys');
  for(const k of Object.keys(b)){if(k==='exact')continue;
   if(k==='logMagnitude'){if(b[k]===null)assert.equal(a[k],-Infinity,path+' exact zero log');else{const e=Math.abs(a[k]-b[k]);stats.worstLogAbsolute=Math.max(stats.worstLogAbsolute,e);assert.ok(e<=8e-12,path+' logarithm error '+e);}stats.comparisons++;}
   else if(['radians','degrees','arcminutes'].includes(k)){assert.equal(a[k]===0,b[k]===0,path+' angle range');assert.equal(Math.sign(a[k]),Math.sign(b[k]),path+' angle sign');if(b[k]!==0){const e=Math.abs(a[k]-b[k])/ulp(b[k]);stats.worstAngleUlps=Math.max(stats.worstAngleUlps,e);assert.ok(e<=4,path+' numerical angle '+e+' ULPs');}else assert.ok(Object.is(a[k],b[k]),path+' signed zero');stats.angleValues++;stats.comparisons++;}
   else compare(a[k],b[k],path+'.'+k);
  }return;
 }
 if(typeof b==='number'&&numerical.test(path)){const e=Math.abs(a-b),budget=path==='gaborSample'?4e-13:2e-14*Math.max(1,Math.abs(b));assert.ok(Number.isFinite(a)&&e<=budget,path+' numerical coordinate error '+e);stats.worstApproximateAbsolute=Math.max(stats.worstApproximateAbsolute,e);stats.approximateCoordinates++;}
 else assert.ok(Object.is(a,b),path+' exact primitive '+a+' expected '+b);stats.comparisons++;
}
for(const name of [...new Set(fixture.rows.map(r=>r.name))])test('PSYCH6 independent complete '+name+' outputs',()=>{for(const row of fixture.rows.filter(r=>r.name===name)){compare(H[name](row.parameters),row.expected,name);stats.cases++;}});
test('PSYCH6 rejects invalid domains before constructing a stimulus',()=>{
 for(const[name,p]of[['stereoGeometry',{pointDepth:0}],['stereoGeometry',{halfEyeSeparation:NaN}],['pinhole',{focalLength:0}],['sizeDistance',{retinalRatio:0}],['cueCombination',{correlation:1}],['cueCombination',{visualSD:0}],['cueCombination',{rule:'invented'}],['stereogram',{size:35.5}],['stereogram',{seed:-1}],['stereogram',{shape:'invented'}],['figureGround',{width:2}],['proximity',{verticalGap:Infinity}],['similarity',{contrast:-Number.MIN_VALUE}],['similarity',{pattern:'invented'}],['continuation',{clutter:1.5}],['gaborSample',{sigma:0}],['closure',{radius:.6}],['commonFate',{coherence:1+Number.EPSILON}],['commonFate',{phase:9}],['necker',{front:'invented'}],['mullerLyer',{context:1}],['ponzo',{convergence:1}],['ebbinghaus',{ringDistance:1}],['amesRoom',{cameraY:1}],['moonIllusion',{context:'yes'}],['monocularScene',{nearDepth:1}],['monocularScene',{sizeRule:'invented'}]])assert.throws(()=>H[name](p),name+' rejects invalid parameters');
});
test('PSYCH6 zero stereogram disparity is exactly identical while shifted sources are uniquely owned',()=>{
 for(const shape of['square','circle','triangle'])for(const seed of[0,37,999]){const z=H.stereogram({shape,seed,disparity:0});assert.deepEqual(z.left,z.right);assert.equal(z.freshIndices.length,0);assert.deepEqual(z.sourceIndices,Array.from({length:36*36},(_,i)=>i));for(const disparity of[-5,5]){const d=H.stereogram({shape,seed,disparity}),sources=d.sourceIndices.filter(i=>i!==null);assert.equal(new Set(sources).size,sources.length);assert.ok(d.freshIndices.length>0);}}
});
test('PSYCH6 image-height equality explicitly changes physical size and preserves camera parallax',()=>{
 const equal=H.monocularScene({nearDepth:2,farDepth:12,sizeRule:'equal image height',cameraX:.7});assert.equal(H.Q.sign(H.Q.sub(equal.objects[0].imageHeight.exact,equal.objects[1].imageHeight.exact)),0);assert.equal(equal.objects[1].worldHeight.value,12);assert.notEqual(equal.objects[0].cameraDerivative.value,equal.objects[1].cameraDerivative.value);
 const actual=H.monocularScene({nearDepth:2,farDepth:12,sizeRule:'equal world height'});assert.equal(actual.objects[0].worldHeight.value,actual.objects[1].worldHeight.value);assert.equal(actual.imageHeightRatio.value,6);
});
test('PSYCH6 seventeen complete teaching drafts preserve frozen identities and source flags',()=>{
 const frozen=JSON.parse(fs.readFileSync(new URL('../docs/wave-6-plan.json',import.meta.url))).chapters.find(c=>c.collection==='psych').items,outline=syllabus.chapters.find(c=>c.n===6).items;assert.equal(chapter.items.length,17);for(const[i,item]of chapter.items.entries()){for(const key of['num','kind','name','deps','paper','introduces','verify','see'])assert.deepEqual(item[key],frozen[i][key],item.num+' frozen '+key);for(const key of['num','kind','name','deps','refs'])assert.deepEqual(item[key],outline[i][key]);assert.equal(item.caption,outline[i].pic);for(const key of['statement','idea','scope','caption'])assert.ok(item[key].length>120,item.num+' complete '+key);assert.equal(typeof item.viz,'function');}
});
test('PSYCH6 changes only seventeen researched syllabus references and picture captions',()=>{
 const old=JSON.parse(fs.readFileSync(new URL('./fixtures/wave6-psych-syllabus-before.json',import.meta.url))),omit=c=>c.n!==6?c:{...c,items:c.items.map(({refs,pic,...rest})=>rest)};assert.deepEqual({...syllabus,chapters:syllabus.chapters.map(omit)},{...old,chapters:old.chapters.map(omit)});
});
after(()=>{assert.equal(stats.cases,571);assert.equal(fixture.families,19);console.log('PSYCH6 independent reference statistics '+JSON.stringify(stats));});
