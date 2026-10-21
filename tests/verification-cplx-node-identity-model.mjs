// Test-only adapter runs the actual item model; it neither rewrites its source nor simulates canvas input.
import{pathToFileURL}from'node:url';import path from'node:path';
export async function colourModel(root=process.cwd()){
 const chapter=(await import(pathToFileURL(path.join(root,'content/cplx/ch01-b.js')))).default,item=chapter.items.find(x=>x.num==='1.9'),graphs=[],selectors=new Map;let steps,readout;
 const v={select(label,options,value,o){const c={value,options,set(value){c.value=value;o?.onChange?.(value)}};selectors.set(label,c);return c},stage(){return{}},graph(stage,spec){const g={set({nodes=[],edges=[]}){g.nodes=nodes.map(n=>typeof n==='object'?{...n}:{id:n});g.edges=edges.map(e=>Array.isArray(e)?{from:e[0],to:e[1]}:{...e});return g}};g.set(spec);graphs.push(g);return g},steps(o){let rows=o.frames();steps={get frames(){return rows},get frame(){return rows.at(-1)},reset(){rows=o.frames();return steps}};return steps},table(){return{}},render(){},legend(){},readout(f){readout=f}};
 item.viz(v);return{graphs,get frames(){return steps.frames},get frame(){return steps.frame},readout:()=>readout(),setGraphs(a,b){graphs[0].set(a);graphs[1].set(b);steps.reset();return steps.frames},preset(value){selectors.get('pair').set(value);return steps.frames}};
}
