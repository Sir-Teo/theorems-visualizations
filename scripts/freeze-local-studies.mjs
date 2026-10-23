import {readFile,writeFile,mkdir,lstat} from 'node:fs/promises';
import {join,dirname} from 'node:path';
import {ROOT} from './lib.mjs';
import {PROGRAM_CODE} from './build-local-program.mjs';
import {sha,insist} from '../program/federation.mjs';
import {studyDigest,validateStudy} from '../program/learning.mjs';
import {renderStudy,css} from '../program/render.mjs';
import {archiveOutputs} from '../program/archive.mjs';
try {
  const args=process.argv.slice(2);insist(args.length===4&&args[0]==='--date'&&args[2]==='--evidence','Use --date YYYY-MM-DD --evidence docs/verification/RECEIPT.md');
  const date=args[1],evidencePath=args[3];insist(/^\d{4}-\d{2}-\d{2}$/.test(date)&&new Date(date).toISOString().slice(0,10)===date,'Use a valid actual date');
  insist(/^docs\/verification\/[a-z0-9-]+\.md$/.test(evidencePath),'Invalid author receipt path');const evidenceBytes=await readFile(join(ROOT,evidencePath),'utf8');insist(evidenceBytes.trim(),'Empty author receipt');
  const data=JSON.parse(await readFile(join(ROOT,'program/studies.json'))),research=JSON.parse(await readFile(join(ROOT,'program/research.json')));
  const codeHashes=Object.fromEntries(await Promise.all(PROGRAM_CODE.map(async path=>[path,sha(await readFile(join(ROOT,path)))])));
  const runtime={css,ui:await readFile(join(ROOT,'program/ui.mjs'),'utf8')},runtimeDigest=sha(JSON.stringify(runtime));
  let manifest;try{manifest=JSON.parse(await readFile(join(ROOT,'program/editions/manifest.json'),'utf8'));}catch(e){if(e.code!=='ENOENT')throw e;manifest={schemaVersion:1,editions:[]};}
  const sourceSnapshots=Object.fromEntries(await Promise.all(['program/research.json','program/federated-catalog.json'].map(async path=>{const text=await readFile(join(ROOT,path),'utf8');return [path,{sha256:sha(text),text}];})));
  for(const s of data.studies){
    validateStudy(s,research.sources.map(x=>x.id));
    const path=`program/editions/${s.id}/${s.revision}.json`,exists=manifest.editions.find(e=>e.path===path);
    if(exists){const bytes=await readFile(join(ROOT,path));insist(sha(bytes)===exists.sha256&&JSON.parse(bytes).contentDigest===studyDigest(s),'Never replace a retained study; increment its revision');continue;}
    insist(!await lstat(join(ROOT,path)).catch(e=>{if(e.code==='ENOENT')return null;throw e;}),'Unregistered archive collision');
    s.status='accepted-local';s.authorVerification={kind:'author-check',scope:'local-only',checkedOn:date,contentDigest:studyDigest(s),evidencePath};validateStudy(s,research.sources.map(x=>x.id));
    const sources=research.sources.filter(x=>s.sourceIds.includes(x.id));
    const pages=Object.fromEntries(s.languages.map(l=>[l,renderStudy(s,l,sources).replaceAll('assets/program/style.css',`assets/program/${runtimeDigest}/style.css`).replaceAll('assets/program/ui.mjs',`assets/program/${runtimeDigest}/ui.mjs`)]));
    const bundle={schemaVersion:1,study:s,contentDigest:studyDigest(s),sources,sourceSnapshots,codeHashes,runtime,runtimeDigest,pages,evidence:{path:evidencePath,sha256:sha(evidenceBytes),text:evidenceBytes}};
    const bytes=JSON.stringify(bundle,null,2)+'\n';await mkdir(dirname(join(ROOT,path)),{recursive:true});await writeFile(join(ROOT,path),bytes,{flag:'wx'});manifest.editions.push({path,sha256:sha(bytes)});
  }
  await writeFile(join(ROOT,'program/studies.json'),JSON.stringify(data,null,2)+'\n');await mkdir(join(ROOT,'program/editions'),{recursive:true});await writeFile(join(ROOT,'program/editions/manifest.json'),JSON.stringify(manifest,null,2)+'\n');
  await archiveOutputs(ROOT,data.studies);console.log(JSON.stringify({retainedStudies:manifest.editions.length,currentStudies:data.studies.length,runtimeDigest}));
}catch(error){console.error(error.message);process.exitCode=1;}
