import {readFile} from 'node:fs/promises';
import {join} from 'node:path';
import {sha,insist} from './federation.mjs';
import {studyDigest} from './learning.mjs';
import {studyPath} from './render.mjs';
export async function archiveOutputs(root,studies) {
  let manifest;try{manifest=JSON.parse(await readFile(join(root,'program/editions/manifest.json'),'utf8'));}catch(e){if(e.code!=='ENOENT')throw e;manifest={schemaVersion:1,editions:[]};}
  insist(manifest.schemaVersion===1&&Array.isArray(manifest.editions),'Invalid study archive');
  const outputs=new Map(),keys=new Set();
  for(const entry of manifest.editions){
    insist(/^program\/editions\/s-[a-z][a-z0-9-]*\/(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)\.json$/.test(entry.path),'Unsafe archive path');
    const bytes=await readFile(join(root,entry.path));insist(sha(bytes)===entry.sha256,'Changed retained study bundle');const b=JSON.parse(bytes),key=b.study.id+'@'+b.study.revision;
    insist(!keys.has(key)&&b.contentDigest===studyDigest(b.study),'Duplicate or changed retained study');keys.add(key);
    insist(sha(JSON.stringify(b.runtime))===b.runtimeDigest,'Changed retained study runtime');
    if(b.sourceSnapshots)for(const value of Object.values(b.sourceSnapshots))insist(sha(value.text)===value.sha256,'Changed retained source snapshot');
    const current=studies.find(s=>s.id===b.study.id&&s.revision===b.study.revision);if(current)insist(studyDigest(current)===b.contentDigest,'Changed study needs a new revision');
    for(const language of b.study.languages){insist(typeof b.pages[language]==='string','Missing retained language page');outputs.set(studyPath(b.study,language)+'index.html',b.pages[language]);}
    outputs.set(`assets/program/${b.runtimeDigest}/style.css`,b.runtime.css);outputs.set(`assets/program/${b.runtimeDigest}/ui.mjs`,b.runtime.ui);
    outputs.set(`studies/${b.study.id}/versions/${b.study.revision}/evidence.json`,JSON.stringify({study:b.study,sourceReceipts:b.sources,sourceSnapshots:b.sourceSnapshots,codeHashes:b.codeHashes,evidence:b.evidence},null,2)+'\n');
  }
  for(const s of studies)if(s.status==='accepted-local')insist(keys.has(s.id+'@'+s.revision),'Accepted study must have a retained edition');
  return {outputs,manifest};
}
