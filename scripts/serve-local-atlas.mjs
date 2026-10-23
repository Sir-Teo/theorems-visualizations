// Read-only loopback server for a built atlas; no package installation or remote service.
import http from 'node:http';
import {readFile,realpath,stat} from 'node:fs/promises';
import {resolve,sep,extname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {execFile} from 'node:child_process';
const types={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.json':'application/json; charset=utf-8','.svg':'image/svg+xml','.woff2':'font/woff2','.png':'image/png','.jpg':'image/jpeg','.txt':'text/plain; charset=utf-8'};
export async function createLocalServer(directory) {
  const root=await realpath(directory);
  return http.createServer(async(req,res)=>{
    if(!['GET','HEAD'].includes(req.method)){res.writeHead(405,{'Allow':'GET, HEAD'});return res.end();}
    try {
      let path=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
      if(path.includes('\0')||path.includes('\\'))throw Error('Invalid path');
      if(path.endsWith('/'))path+='index.html';
      const candidate=resolve(root,'.'+path);if(!candidate.startsWith(root+sep))throw Error('Outside bundle');
      const file=await realpath(candidate);if(!file.startsWith(root+sep)||(await stat(file)).isDirectory())throw Error('Outside bundle');
      const bytes=await readFile(file);res.writeHead(200,{'Content-Type':types[extname(file)]||'application/octet-stream','Content-Length':bytes.length,'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(req.method==='HEAD'?undefined:bytes);
    }catch{res.writeHead(404,{'Content-Type':'text/plain; charset=utf-8'});res.end('Not found in this local atlas.');}
  });
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  try{const args=process.argv.slice(2);let root,port=55187,open=false;while(args.length){const a=args.shift();if(a==='--root')root=args.shift();else if(a==='--port')port=Number(args.shift());else if(a==='--open')open=true;else throw Error('Use --root DIRECTORY [--port PORT] [--open]');}if(!root||!Number.isInteger(port)||port<0||port>65535)throw Error('Invalid local server arguments');
    const server=await createLocalServer(root);server.on('error',async e=>{
      if(e.code==='EADDRINUSE'){
        try{const expected=JSON.parse(await readFile(resolve(root,'local-program-build.json'),'utf8'));const response=await fetch(`http://127.0.0.1:${port}/local-program-build.json`,{signal:AbortSignal.timeout(2000)});const actual=await response.json();
          if(response.ok&&actual.mode==='local-only'&&actual.binding===expected.binding){const url=`http://127.0.0.1:${port}/start/`;console.log('This local atlas is already running: '+url);if(open)execFile(process.platform==='darwin'?'open':process.platform==='win32'?'explorer':'xdg-open',[url]);return;}
        }catch{}
      }
      console.error(e.code==='EADDRINUSE'?'This port is already in use by another app or version. Keep it intact and choose another --port.':e.message);process.exitCode=1;
    });server.listen(port,'127.0.0.1',()=>{const url=`http://127.0.0.1:${server.address().port}/start/`;console.log('Local atlas: '+url);if(open)execFile(process.platform==='darwin'?'open':process.platform==='win32'?'explorer':'xdg-open',[url],error=>{if(error)console.log('Open this address in your browser: '+url);});});
  }catch(e){console.error(e.message);process.exitCode=1;}
}
