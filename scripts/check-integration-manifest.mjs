// Read-only verification of a named integration snapshot. It never applies a patch.
import {readFile,realpath} from 'node:fs/promises';
import {resolve,sep} from 'node:path';
import {execFileSync} from 'node:child_process';
import {ROOT} from './lib.mjs';
import {sha,insist} from '../program/federation.mjs';
try {
  insist(process.argv.length===4&&process.argv[2]==='--manifest','Use --manifest docs/integration/NAME.json');
  const path=process.argv[3];insist(/^docs\/integration\/[a-z0-9-]+\.json$/.test(path),'Invalid manifest path');
  const manifest=JSON.parse(await readFile(resolve(ROOT,path),'utf8')),root=await realpath(ROOT);
  insist(manifest.schemaVersion===1&&/^[a-f0-9]{40}$/.test(manifest.predecessor)&&Array.isArray(manifest.files),'Invalid integration manifest');
  const seen=new Set();
  for(const entry of manifest.files){
    insist(typeof entry.path==='string'&&!/[\\\x00-\x1f]/.test(entry.path)&&!entry.path.startsWith('/')&&entry.path.split('/').every(p=>p&&!['.','..','.git'].includes(p))&&!seen.has(entry.path),'Unsafe or duplicate delta path');seen.add(entry.path);
    const file=await realpath(resolve(ROOT,entry.path));insist(file.startsWith(root+sep)&&sha(await readFile(file))===entry.afterSha256,'Delivered bytes differ: '+entry.path);
    const exists=execFileSync('git',['ls-tree','--name-only',manifest.predecessor,'--',entry.path],{cwd:ROOT,encoding:'utf8'}).trim();
    if(entry.operation==='add')insist(!exists&&entry.beforeSha256===null,'Invalid addition preimage');
    else{insist(entry.operation==='replace'&&exists===entry.path,'Invalid replacement');insist(sha(execFileSync('git',['show',manifest.predecessor+':'+entry.path],{cwd:ROOT,maxBuffer:64*1024*1024}))===entry.beforeSha256,'Predecessor differs: '+entry.path);}
  }
  insist(seen.size>0,'Empty delta');console.log(JSON.stringify({result:'PASS',predecessor:manifest.predecessor,files:seen.size,scope:'Exact source delta only; no destination writes, merge or public deployment.'},null,2));
}catch(error){console.error(error.message);process.exitCode=1;}
