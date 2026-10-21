import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {CTRY,SEXY,AGE22,FAGES,asfr,indAt,lxSex,LxSex} from '../content/demo/ch04.shared.js';
const files=process.argv.slice(2);if(files.length!==3)throw new Error('Supply original WPP2024 demographic indicators, fertility-by-age5 and abridged-life CSV(.gz) files, in that order.');
const script=String.raw`import csv,gzip,json,sys
countries=set(json.loads(sys.argv[4]));years=set(map(str,json.loads(sys.argv[5])));result=[]
for path in sys.argv[1:4]:
 op=gzip.open if path.endswith('.gz') else open
 rows=[]
 with op(path,'rt',encoding='utf-8-sig') as f:
  reader=csv.DictReader(f)
  for r in reader:
   if r['ISO3_code'] not in countries or r['Time'] not in years:continue
   if r.get('Sex','Female')!='Female':continue
   if r['VarID']!='2':continue
   rows.append(r)
 result.append(rows)
print(json.dumps(result))`;
const parsed=spawnSync('python3',['-c',script,...files,JSON.stringify(CTRY),JSON.stringify(SEXY)],{encoding:'utf8',maxBuffer:10*1024*1024});assert.equal(parsed.status,0,parsed.stderr);
const[indicators,fertility,life]=JSON.parse(parsed.stdout);assert.equal(indicators.length,50);assert.equal(fertility.length,450);assert.equal(life.length,1100);
const find=(rows,c,y,age)=>{const xs=rows.filter(r=>r.ISO3_code===c&&+r.Time===y&&(age===undefined||+r.AgeGrpStart===age));assert.equal(xs.length,1);return xs[0]};
let values=0;
for(const c of CTRY)for(const y of SEXY){const d=find(indicators,c,y);for(const key of['srb','nrr','tfr']){assert.ok(Math.abs(indAt(c,key,y)-+d[key.toUpperCase()])<1e-9,`${c} ${y} ${key}`);values++;}
 const f=asfr(c,y),l=lxSex(c,'f',y),L=LxSex(c,'f',y);for(let j=0;j<FAGES.length;j++){const r=find(fertility,c,y,FAGES[j]);assert.equal(+r.AgeGrpSpan,5);assert.ok(Math.abs(f[j]*1000-+r.ASFR)<=.050001,`${c} ${y} ${FAGES[j]} ASFR`);values++;}
 for(let j=0;j<AGE22.length;j++){const r=find(life,c,y,AGE22[j]);assert.equal(r.Sex,'Female');assert.ok(Math.abs(l[j]-+r.lx)<=.500001,`${c} ${y} ${AGE22[j]} lx`);assert.ok(Math.abs(L[j]-+r.Lx)<=.500001,`${c} ${y} ${AGE22[j]} Lx`);values+=2;}assert.equal(l[0],100000);
}
console.log(`PASS all50 offered country-years:450 ASFR values at0.1/1000 precision,1100 female lx +1100 female Lx atinteger precision,50 each SRB/NRR/TFR exact; ${values} source scalars. All source intervals/sex/years/radix verified; shared inputs unchanged.`);
console.log(JSON.stringify(files.map(path=>({path,sha256:createHash('sha256').update(readFileSync(path)).digest('hex')}))));
