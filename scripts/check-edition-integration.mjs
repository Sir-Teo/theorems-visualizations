// Compose explicit additions in a disposable accepted-base archive. No active checkout writes.
import {readFile,writeFile,mkdir,lstat,readdir,symlink} from 'node:fs/promises';
import {join,dirname,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {execFileSync} from 'node:child_process';
import {ROOT} from './lib.mjs';
import {rehearseStatic} from './check-static-integration.mjs';
import {sha} from './exploration-editions.mjs';
const allowed=p=>/^(?:assets\/css\/exploration-delivery\.css|scripts\/(?:exploration-editions|freeze-exploration-editions|build-exploration-editions|check-edition-integration)\.mjs|tests\/exploration-editions(?:-ui)?\.test\.mjs|editions\/(?:manifest\.json|releases\.json|runtimes\/[a-f0-9]{64}\.json|bundles\/x-[a-z][a-z0-9-]*-[0-9]{4}\/[0-9]+\.[0-9]+\.[0-9]+\.json)|docs\/(?:architecture\/exploration-editions\.md|integration\/exploration-editions\.(?:md|json)|verification\/universal-exploration-editions(?:-ai-code)?\.md))$/.test(p);
async function inventory(root,prefix=''){const files={};for(const e of await readdir(join(root,prefix),{withFileTypes:true})){const p=prefix?prefix+'/'+e.name:e.name;if(e.isDirectory())Object.assign(files,await inventory(root,p));else if(e.isFile())files[p]=sha(await readFile(join(root,p)));else throw new Error('Nonregular snapshot entry '+p);}return files;}
export async function rehearseEditions({repo,base,canonicalBase,ui=false}) {
 if(!canonicalBase)throw new Error('An explicit --base-url is required for the empty-release rehearsal');
 const manifest=JSON.parse(await readFile(join(ROOT,'docs/integration/exploration-editions.json'),'utf8'));
 if(manifest.schemaVersion!==1||manifest.mode!=='exploration-editions-additive'||!Array.isArray(manifest.files)||!manifest.files.length||new Set(manifest.files).size!==manifest.files.length||!manifest.files.every(p=>typeof p==='string'&&allowed(p)))throw new Error('Unknown edition integration manifest');
 const prior=await rehearseStatic({repo,base,canonicalBase}),priorReport=JSON.parse(await readFile(prior.report,'utf8')),snapshot=priorReport.snapshot,logs=dirname(prior.report),before=await inventory(snapshot),changes=[];
 for(const path of manifest.files){if(!(await lstat(join(ROOT,path))).isFile())throw new Error('Edition entry must be regular');const bytes=await readFile(join(ROOT,path)),existing=await lstat(join(snapshot,path)).catch(e=>{if(e.code==='ENOENT')return null;throw e;});if(existing&&(!existing.isFile()||sha(await readFile(join(snapshot,path)))!==sha(bytes)))throw new Error('Destination differs; reconcile '+path);await mkdir(dirname(join(snapshot,path)),{recursive:true});await writeFile(join(snapshot,path),bytes);changes.push({path,sha256:sha(bytes)});}
 const preview=join(logs,'edition-preview'),release=join(logs,'edition-empty-release'),checks=[];
 async function run(args,label){const log=join(logs,'edition-'+label+'.log');try{const stdout=execFileSync(process.execPath,args,{cwd:snapshot,encoding:'utf8',maxBuffer:16*1024*1024,env:{...process.env,ATLAS_EDITION_CANDIDATE:preview,ATLAS_EDITION_SCREENSHOTS:join(logs,'edition-screenshots')}});await writeFile(log,stdout);checks.push({command:'node '+args.join(' '),result:'PASS',log});}catch(e){await writeFile(log,String(e.stdout||'')+String(e.stderr||''));throw new Error('Edition check failed; inspect '+log);}}
 await run(['scripts/freeze-exploration-editions.mjs','--check'],'freeze');
 await run(['--test','tests/exploration-editions.test.mjs'],'offline');
 await run(['scripts/build-exploration-editions.mjs','--out',preview],'preview');
 await run(['scripts/build-exploration-editions.mjs','--mode','release','--base-url',canonicalBase,'--out',release],'empty-release');
 const releaseBuild=JSON.parse(await readFile(join(release,'edition-build.json'),'utf8')),catalog=JSON.parse(await readFile(join(release,'explore/catalog.json'),'utf8'));
 if(releaseBuild.currentExplorations!==0||releaseBuild.retainedEditions!==0||catalog.explorations.length!==0||releaseBuild.runtimes!==0||releaseBuild.canonicalExplorationPages!==0)throw new Error('Empty real ledger leaked new-format content');
 if(await lstat(join(release,'assets/editions')).catch(()=>null))throw new Error('Empty release leaked a retained runtime');
 const xml=await readFile(join(release,'sitemap.xml'),'utf8');if(xml.includes('/explore/'))throw new Error('Empty release leaked exploration URLs');
 if(ui){await symlink(join(ROOT,'node_modules'),join(snapshot,'node_modules'),'dir');await run(['--test','--test-concurrency=1','tests/exploration-editions-ui.test.mjs'],'native');}
 for(const [path,digest]of Object.entries(before))if(sha(await readFile(join(snapshot,path)))!==digest)throw new Error('Preexisting snapshot changed: '+path);
 const previewBuild=JSON.parse(await readFile(join(preview,'edition-build.json'),'utf8'));
 const report={result:'PASS',baseCommit:priorReport.baseCommit,predecessorReport:prior.report,snapshot,preview,release,preexistingFilesPreserved:Object.keys(before).length,changes,previewBuild,releaseBuild,checks,scope:'Local candidate rehearsal; no release decisions, deployment, new acceptance or active worktree writes.'};
 const path=join(logs,'edition-report.json');await writeFile(path,JSON.stringify(report,null,2)+'\n');return{result:'PASS',report:path,preview,release,currentExplorations:previewBuild.currentExplorations};
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 try{const args=process.argv.slice(2),o={};while(args.length){const flag=args.shift();if(flag==='--ui')o.ui=true;else if(flag==='--base-url')o.canonicalBase=args.shift();else if(['--repo','--base'].includes(flag))o[flag.slice(2)]=args.shift();else throw new Error('Unknown argument '+flag);}console.log(JSON.stringify(await rehearseEditions(o),null,2));}catch(e){console.error(e.message);process.exitCode=1;}
}
