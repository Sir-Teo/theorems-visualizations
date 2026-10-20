import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {FCTRY,asfr,women} from '../content/demo/ch04.shared.js';
const file=process.argv[2];if(!file)throw new Error('Supply original WPP2024_Fertility_by_Age5.csv(.gz).');
const script=String.raw`import csv,gzip,json,sys
countries=set(json.loads(sys.argv[2]));rows=[]
op=gzip.open if sys.argv[1].endswith('.gz') else open
with op(sys.argv[1],'rt',encoding='utf-8-sig') as f:
 for r in csv.DictReader(f):
  if r['ISO3_code'] in countries and r['VarID']=='2' and 1950<=int(r['Time'])<=2023 and 15<=int(r['AgeGrpStart'])<=45:
   rows.append({k:r[k]for k in ['ISO3_code','Time','AgeGrpStart','AgeGrpSpan','ASFR','Births']})
print(json.dumps(rows))`;
const p=spawnSync('python3',['-c',script,file,JSON.stringify(FCTRY)],{encoding:'utf8',maxBuffer:5e6});assert.equal(p.status,0,p.stderr);const rows=JSON.parse(p.stdout);assert.equal(rows.length,5180);const map=new Map(rows.map(r=>[`${r.ISO3_code}/${r.Time}/${r.AgeGrpStart}`,r]));assert.equal(map.size,5180);
let worstF=0,worstW=0,worstBirth=0;for(const c of FCTRY)for(let y=1950;y<=2023;y++){const f=asfr(c,y),w=women(c,y);for(let j=1;j<=7;j++){const r=map.get(`${c}/${y}/${10+5*j}`);assert.equal(+r.AgeGrpSpan,5);assert.ok(+r.ASFR>0);const ef=Math.abs(f[j]*1000-+r.ASFR),ew=Math.abs(w[j]-(+r.Births)*1000/(+r.ASFR));assert.ok(ef<=.050001,`${c}/${y}/${j} ASFR ${ef}`);assert.ok(ew<=.500001,`${c}/${y}/${j} recovered exposure ${ew}`);worstF=Math.max(worstF,ef);worstW=Math.max(worstW,ew);worstBirth=Math.max(worstBirth,Math.abs(f[j]*w[j]-+r.Births));}}
console.log(`PASS all740 country-years,5180 matched15–49 intervals: original annual ASFR rounded to0.1/1000; recovered exposure rounded to1000woman-years; 10360source scalars. Max ASFR discrepancy ${worstF}; exposure ${worstW}; reconstructed births ${worstBirth} thousand per group. Shared inputs unchanged.`);console.log(JSON.stringify({file,sha256:createHash('sha256').update(readFileSync(file)).digest('hex')}));
