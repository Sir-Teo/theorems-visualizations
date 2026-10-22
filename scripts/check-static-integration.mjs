// Apply the reading package to a disposable accepted-base rehearsal; no active checkout writes.
import { readFile, writeFile, mkdir, lstat, readdir, symlink } from 'node:fs/promises';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { ROOT } from './lib.mjs';
import { rehearseEvidence } from './check-evidence-integration.mjs';
const hash = b => createHash('sha256').update(b).digest('hex');
const allowed = p => /^(assets\/(css\/reading\.css|js\/reading\.js)|static-pages\/accepted\.json|scripts\/(static-ideas|build-static-ideas|check-static-integration)\.mjs|tests\/static-ideas(?:-ui)?\.test\.mjs|docs\/(architecture\/static-reading|integration\/static-reading|verification\/universal-static-ideas(?:-ai-code)?)\.(?:md|json))$/.test(p);
async function inventory(root,prefix='') {
 const files={};for(const e of await readdir(join(root,prefix),{withFileTypes:true})){const p=prefix?prefix+'/'+e.name:e.name;if(e.isDirectory())Object.assign(files,await inventory(root,p));else if(e.isFile())files[p]=hash(await readFile(join(root,p)));else throw new Error('Special snapshot entry '+p);}return files;
}
export async function rehearseStatic({repo,base,canonicalBase,ui=false}) {
 const manifest=JSON.parse(await readFile(join(ROOT,'docs/integration/static-reading.json'),'utf8'));
 if(manifest.schemaVersion!==1 || manifest.mode!=='static-reading-local-candidate' || !Array.isArray(manifest.files) || !manifest.files.length || new Set(manifest.files).size!==manifest.files.length || !manifest.files.every(p=>typeof p==='string'&&allowed(p)))throw new Error('Unknown reading integration contract');
 const evidence=await rehearseEvidence({repo,base}),snapshot=evidence.snapshot,logs=dirname(evidence.report),before=await inventory(snapshot),changes=[];
 for(const path of manifest.files){if(!(await lstat(join(ROOT,path))).isFile())throw new Error('Reading entry must be a regular file');const bytes=await readFile(join(ROOT,path));const existing=await lstat(join(snapshot,path)).catch(e=>{if(e.code==='ENOENT')return null;throw e;});if(existing && (!existing.isFile() || hash(await readFile(join(snapshot,path)))!==hash(bytes)))throw new Error('Destination differs; reconcile '+path);changes.push({path,sha256:hash(bytes)});await mkdir(dirname(join(snapshot,path)),{recursive:true});await writeFile(join(snapshot,path),bytes);}
 const candidate=join(logs,'static-site'),checks=[];
 async function run(args,label){const log=join(logs,'reading-'+label+'.log');try{const result=execFileSync(process.execPath,args,{cwd:snapshot,encoding:'utf8',maxBuffer:12*1024*1024,env:{...process.env,ATLAS_STATIC_CANDIDATE:candidate,ATLAS_STATIC_SCREENSHOTS:join(logs,'reading-screenshots')}});await writeFile(log,result);checks.push({command:'node '+args.join(' '),result:'PASS',log});}catch(e){await writeFile(log,String(e.stdout||'')+String(e.stderr||''));throw new Error('Reading check failed; inspect '+log);}}
 await run(['--test','tests/static-ideas.test.mjs'],'offline');
 await run(['scripts/build-static-ideas.mjs','--out',candidate,...(canonicalBase?['--base-url',canonicalBase]:[])],'build');
 if(ui){if(!canonicalBase)throw new Error('The canonical/sitemap native rehearsal needs an explicit --base-url');await symlink(join(ROOT,'node_modules'),join(snapshot,'node_modules'),'dir');await run(['--test','--test-concurrency=1','tests/static-ideas-ui.test.mjs'],'native');}
 for(const [path,digest]of Object.entries(before))if(hash(await readFile(join(snapshot,path)))!==digest)throw new Error('Preexisting snapshot file changed: '+path);
 const build=JSON.parse(await readFile(join(candidate,'static-build.json'),'utf8'));
 const report={result:'PASS',baseCommit:evidence.baseCommit,evidencePreflight:evidence.report,snapshot,candidate,preexistingFilesPreserved:Object.keys(before).length,changes,build,checks,scope:'Local candidate build/rehearsal; no deployment, new acceptance or active worktree writes.'};
 const path=join(logs,'reading-report.json');await writeFile(path,JSON.stringify(report,null,2)+'\n');return{result:'PASS',report:path,candidate,items:build.items,aliases:build.aliases,canonicalPages:build.canonicalPages};
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 try{const args=process.argv.slice(2),o={};while(args.length){const flag=args.shift();if(flag==='--ui')o.ui=true;else if(flag==='--base-url')o.canonicalBase=args.shift();else if(['--repo','--base'].includes(flag))o[flag.slice(2)]=args.shift();else throw new Error('Unknown argument '+flag);}console.log(JSON.stringify(await rehearseStatic(o),null,2));}catch(e){console.error(e.message);process.exitCode=1;}
}
