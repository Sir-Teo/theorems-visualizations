// Replay the historical edition package at its exact commit, then apply only this named delta.
import {readFile,writeFile,mkdir,mkdtemp,lstat,readdir,symlink} from 'node:fs/promises';
import {join,dirname,resolve} from 'node:path';
import {tmpdir} from 'node:os';
import {fileURLToPath} from 'node:url';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {ROOT} from './lib.mjs';
const sha=x=>createHash('sha256').update(x).digest('hex');
const predecessor='7fd688a48bb026582fae1d24d86536b29ee4038d';
const addition=p=>/^(?:assets\/(?:css\/notebooks\.css|js\/notebook-(?:model|view)\.js)|scripts\/(?:notebook-pages|check-notebook-integration)\.mjs|tests\/notebooks(?:-ui)?\.test\.mjs|docs\/(?:architecture\/exploration-notebooks\.md|integration\/exploration-notebooks\.(?:json|md)|verification\/universal-notebooks(?:-ai-code)?\.md))$/.test(p);
async function inventory(root,prefix=''){
  const files={};for(const e of await readdir(join(root,prefix),{withFileTypes:true})){
    if(e.name==='node_modules'&&!prefix)continue;
    const p=prefix?prefix+'/'+e.name:e.name;
    if(e.isDirectory())Object.assign(files,await inventory(root,p));else if(e.isFile())files[p]=sha(await readFile(join(root,p)));else throw new Error('Nonregular snapshot path: '+p);
  }return files;
}
export async function rehearseNotebooks({repo,base,canonicalBase,ui=false}){
  if(!repo||!base||!canonicalBase)throw new Error('Explicit --repo, --base and --base-url are required.');
  const manifest=JSON.parse(await readFile(join(ROOT,'docs/integration/exploration-notebooks.json'),'utf8'));
  if(manifest.schemaVersion!==1||manifest.mode!=='exploration-notebooks-delta'||manifest.predecessorCommit!==predecessor||manifest.replacements?.length!==1||manifest.replacements[0].path!=='scripts/exploration-editions.mjs'||!/^[a-f0-9]{64}$/.test(manifest.replacements[0].baseSha256||'')||!Array.isArray(manifest.additions)||!manifest.additions.length||new Set(manifest.additions).size!==manifest.additions.length||!manifest.additions.every(p=>typeof p==='string'&&addition(p)))throw new Error('Unknown notebook integration manifest.');
  const source=await mkdtemp(join(tmpdir(),'atlas-notebook-predecessor-')),archive=join(source,'source.tar'),historical=join(source,'source');await mkdir(historical);
  execFileSync('git',['archive','--format=tar','--output',archive,predecessor],{cwd:ROOT});execFileSync('tar',['-xf',archive,'-C',historical]);
  // This subprocess resolves all predecessor imports and source inventories from its pinned archive.
  const result=execFileSync(process.execPath,['scripts/check-edition-integration.mjs','--repo',resolve(repo),'--base',base,'--base-url',canonicalBase],{cwd:historical,encoding:'utf8',maxBuffer:16*1024*1024});
  await writeFile(join(source,'predecessor.log'),result);
  const prior=JSON.parse(result),priorReport=JSON.parse(await readFile(prior.report,'utf8')),snapshot=priorReport.snapshot,logs=dirname(prior.report),before=await inventory(snapshot),changes=[];
  for(const entry of manifest.replacements){
    if(sha(await readFile(join(snapshot,entry.path)))!==entry.baseSha256)throw new Error('Notebook preimage differs: '+entry.path);
    const bytes=await readFile(join(ROOT,entry.path));changes.push({path:entry.path,action:'replace-pinned-predecessor',sha256:sha(bytes)});await writeFile(join(snapshot,entry.path),bytes);
  }
  for(const path of manifest.additions){
    if(!(await lstat(join(ROOT,path))).isFile())throw new Error('Notebook addition must be regular: '+path);
    if(await lstat(join(snapshot,path)).catch(e=>{if(e.code==='ENOENT')return null;throw e;}))throw new Error('Notebook addition already exists: '+path);
    const bytes=await readFile(join(ROOT,path));await mkdir(dirname(join(snapshot,path)),{recursive:true});await writeFile(join(snapshot,path),bytes);changes.push({path,action:'add',sha256:sha(bytes)});
  }
  const preview=join(logs,'notebook-preview'),release=join(logs,'notebook-empty-release'),checks=[];
  async function run(args,label){
    const log=join(logs,'notebook-'+label+'.log');try{
      const text=execFileSync(process.execPath,args,{cwd:snapshot,encoding:'utf8',maxBuffer:16*1024*1024,env:{...process.env,ATLAS_NOTEBOOK_CANDIDATE:preview,ATLAS_EDITION_CANDIDATE:preview,ATLAS_NOTEBOOK_SCREENSHOTS:join(logs,'notebook-screenshots'),ATLAS_EDITION_SCREENSHOTS:join(logs,'notebook-edition-screenshots')}});
      await writeFile(log,text);checks.push({command:'node '+args.join(' '),result:'PASS',log});
    }catch(e){await writeFile(log,String(e.stdout||'')+String(e.stderr||''));throw new Error('Notebook check failed; inspect '+log);}
  }
  await run(['scripts/freeze-exploration-editions.mjs','--check'],'freeze');
  await run(['--test','tests/notebooks.test.mjs','tests/exploration-editions.test.mjs'],'offline');
  await run(['scripts/build-exploration-editions.mjs','--out',preview],'preview');
  await run(['scripts/build-exploration-editions.mjs','--mode','release','--base-url',canonicalBase,'--out',release],'empty-release');
  const previewBuild=JSON.parse(await readFile(join(preview,'edition-build.json'),'utf8')),releaseBuild=JSON.parse(await readFile(join(release,'edition-build.json'),'utf8'));
  if(releaseBuild.currentExplorations||releaseBuild.retainedEditions||releaseBuild.runtimes||releaseBuild.canonicalExplorationPages)throw new Error('Empty release leaked an edition.');
  if(await lstat(join(release,'explore/notebooks')).catch(()=>null))throw new Error('Empty release leaked a notebook page.');
  if((await readFile(join(release,'sitemap.xml'),'utf8')).includes('/explore/'))throw new Error('Empty release leaked canonical exploration routes.');
  if(ui){await symlink(join(ROOT,'node_modules'),join(snapshot,'node_modules'),'dir');await run(['--test','--test-concurrency=1','tests/notebooks-ui.test.mjs','tests/exploration-editions-ui.test.mjs'],'native');}
  const replaced=manifest.replacements.map(x=>x.path);
  for(const [path,digest]of Object.entries(before))if(!replaced.includes(path)&&sha(await readFile(join(snapshot,path)))!==digest)throw new Error('Unrelated snapshot changed: '+path);
  const report={result:'PASS',baseCommit:priorReport.baseCommit,predecessorCommit:predecessor,predecessorReport:prior.report,pinnedPredecessorSource:historical,snapshot,preview,release,preexistingFilesPreserved:Object.keys(before).length-replaced.length,intentionalReplacements:replaced,changes,previewBuild,releaseBuild,checks,scope:'Local note-recovery candidate, no deployment, distribution decisions, human observations or writes to active Wave checkouts.'};
  const path=join(logs,'notebook-report.json');await writeFile(path,JSON.stringify(report,null,2)+'\n');return{result:'PASS',report:path,preview,release};
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  try{const args=process.argv.slice(2),o={};while(args.length){const flag=args.shift();if(flag==='--ui')o.ui=true;else if(flag==='--base-url')o.canonicalBase=args.shift();else if(['--repo','--base'].includes(flag))o[flag.slice(2)]=args.shift();else throw new Error('Unknown argument '+flag);}console.log(JSON.stringify(await rehearseNotebooks(o),null,2));}catch(e){console.error(e.message);process.exitCode=1;}
}
