/** Read-only verification of the archived legacy XLS cells; no source/workbook edits. */
import assert from 'node:assert/strict';import fs from 'node:fs';import {createHash}from'node:crypto';import{execFileSync}from'node:child_process';import{RETINA_TEMPORAL}from'../content/psych/source-audit-retina-data.js';
const files=process.argv.slice(2);if(files.length!==0&&files.length!==3)throw new Error('Pass cones-stats.xls rods-stats.xls 4meridians.xls, or use the documented /tmp defaults');
const paths=files.length?files:['/tmp/atlas-psych-curcio-cones-stats.xls','/tmp/atlas-psych-curcio-rods-stats.xls','/tmp/atlas-psych-curcio-4meridians.xls'],hashes=['ea73977705d9fd34d1f96424268cb6abedda640681809850f9a974d74be23c10','ce1d0fba1c5016596b5d997e62b9178a9e286419c44e7b4bd511be4485aefe60','4ff7045935f6917877d28dff89c717f4bdc9eb6df8803d20f5aa6c6e9e2986ec'];
paths.forEach((p,i)=>assert.equal(createHash('sha256').update(fs.readFileSync(p)).digest('hex'),hashes[i],p));
const python=process.env.ATLAS_SOURCE_PYTHON||'/Users/teodev/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python3';
const code=String.raw`import sys,json,math
if sys.argv[1]:sys.path.insert(0,sys.argv[1])
import xlrd
out=[]
for path,name in zip(sys.argv[2:4],['COMPCONE.WK1','COMPROD.WK1']):
 w=xlrd.open_workbook(path);assert w.sheet_names()==[name];s=w.sheet_by_name(name)
 assert 'Units used: spherical degrees' in s.cell_value(7,0)
 assert s.cell_value(11,1)=='Visual deg' and s.cell_value(11,3)=='Norm. mm'
 assert s.cell_value(11,7)=='Temporal HM' and s.cell_value(12,6)=='N' and s.cell_value(12,7)=='Mean'
 rows=[]
 for i in range(14,42):
  values=[s.cell_value(i,j) for j in [1,3,6,7]];assert all(isinstance(v,(int,float)) and math.isfinite(v) for v in values)
  assert abs(values[3]-s.cell_value(i,4)/values[2])<1e-8
  rows.append(values)
 out.append(rows)
w=xlrd.open_workbook(sys.argv[4]);assert 'Purpose: to summarize in one file the data used for Figures 6 & 9' in w.sheet_by_name('ReadMe').cell_value(3,0)
for k,name in enumerate(['Cones per sq mm','Rods per sq mm']):
 s=w.sheet_by_name(name);assert s.row_values(0)==['mm','deg','superior','inferior','temporal','nasal']
 for i,row in enumerate(out[k]):
  assert s.cell_value(i+1,1)==row[0] and abs(s.cell_value(i+1,4)-row[3])<1e-8
print(json.dumps(out,separators=(',',':')))
`;
const rows=JSON.parse(execFileSync(python,['-c',code,process.env.ATLAS_XLRD_PATH||'/tmp/atlas-psych-xls-runtime',...paths],{encoding:'utf8'}));assert.equal(RETINA_TEMPORAL.length,28);
RETINA_TEMPORAL.forEach((p,i)=>{assert.deepEqual([p.degrees,p.mm,p.coneN,p.cones],rows[0][i]);assert.deepEqual([p.degrees,p.mm,p.rodN,p.rods],rows[1][i]);});
console.log('PASS exact original XLS SHA256, sheet/header/unit identity, all28 B/D/G/H temporal means/N/location cells, mean=sum/N and independent4meridians summary comparison; no rows from the later derived-spacing blocks imported');
