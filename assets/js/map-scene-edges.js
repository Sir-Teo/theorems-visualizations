// Persistent point textures + small visibility-index buffers. All composition
// remains in WebGL; this pass never copies a rendered frame through Canvas.
import { sceneProgram } from './map-scene-gl.js';
const vertex=`#version 300 es
precision highp float;
precision highp int;
layout(location=0) in uint firstPoint;
uniform sampler2D points,curves,joins;
uniform int pointWidth,curveWidth;
uniform vec2 resolution,mainResolution;
uniform vec3 transform;
uniform vec2 tileOffset;
uniform float dpr,halfWidth;
uniform bool roundCap,cullEndpoints;
out float across,arc;
flat out float total;
vec4 point(int index){return texelFetch(points,ivec2(index%pointWidth,index/pointWidth),0);}
vec4 curve(int index){return texelFetch(curves,ivec2(index%curveWidth,index/curveWidth),0);}
vec2 normal(vec2 v){float d=length(v);return d>1e-10?vec2(-v.y,v.x)/d:vec2(0.,1.);}
vec2 miter(vec2 a,vec2 b){float den=1.+dot(a,b);if(den<.0001)return b;vec2 m=(a+b)/den;float d=length(m);return d>10.?m*(10./d):m;}
void main(){
 bool atEnd=(gl_VertexID>>1)!=0;int index=int(firstPoint)+(atEnd?1:0);vec4 a=point(index);int id=int(floor(a.w));vec4 ends=curve(id*2);vec2 aa=ends.xy*transform.x+transform.yz,bb=ends.zw*transform.x+transform.yz;
 if(cullEndpoints&&(max(aa.x,bb.x)<-50.||min(aa.x,bb.x)>mainResolution.x+50.||max(aa.y,bb.y)<-50.||min(aa.y,bb.y)>mainResolution.y+50.)){gl_Position=vec4(2.,2.,2.,1.);return;}
 bool start=fract(a.w)>.2&&fract(a.w)<.4,end=fract(a.w)>.4;vec2 offset=texelFetch(joins,ivec2(index%pointWidth,index/pointWidth),0).xy;
 float side=(gl_VertexID&1)==0?-1.:1.,outer=halfWidth+1./dpr,extension=roundCap?outer:1./dpr,extra=(!atEnd&&start)?-extension:(atEnd&&end)?extension:0.;vec2 tangent=vec2(offset.y,-offset.x);
 vec2 p=a.xy*transform.x+transform.yz+offset*outer*side+tangent*extra-tileOffset;
 across=outer*side;arc=a.z*transform.x+extra;total=curve(id*2+1).x*transform.x;
 gl_Position=vec4(p/resolution*vec2(2.,-2.)+vec2(-1.,1.),0.,1.);
}`;
const fragment=`#version 300 es
precision highp float;
in float across,arc;
flat in float total;
uniform float dpr,halfWidth;
uniform bool roundCap,dashed,maskOnly;
uniform vec4 color;
out vec4 pixel;
void main(){
 float coverage;
 if(roundCap){float at=clamp(arc,0.,total),gap=max(max(-arc,arc-total),0.);if(dashed){float cycle=floor(at/6.)*6.,phase=at-cycle;if(phase>3.)gap+=min(phase-3.,cycle+6.<=total?6.-phase:1e10);}float sd=length(vec2(across,gap))-halfWidth;coverage=clamp(.5-sd*dpr,0.,1.);}
 else{float along=min(arc,total-arc);if(dashed){float phase=mod(arc,6.);float d=phase<=3.?min(phase,3.-phase):-min(phase-3.,6.-phase);along=min(along,d);}coverage=clamp(.5+(halfWidth-abs(across))*dpr,0.,1.)*clamp(.5+along*dpr,0.,1.);}
 if(maskOnly)pixel=vec4(coverage,0.,0.,1.);else{float a=coverage*color.a;pixel=vec4(color.rgb*a,a);}
}`;
const compositeVertex=`#version 300 es
precision highp float;
uniform vec4 box;
uniform vec2 resolution;
void main(){vec2 q=vec2(gl_VertexID&1,gl_VertexID>>1);vec2 p=box.xy+q*box.zw;gl_Position=vec4(p/resolution*vec2(2.,-2.)+vec2(-1.,1.),0.,1.);}`;
const compositeFragment=`#version 300 es
precision highp float;
uniform sampler2D coverage;
uniform ivec2 origin;
uniform vec4 color;
out vec4 pixel;
void main(){float a=texelFetch(coverage,ivec2(gl_FragCoord.xy)-origin,0).r*color.a;pixel=vec4(color.rgb*a,a);}`;

export class SceneEdges {
  constructor(gl,budget,{maxMaskPixels=8_000_000}={}){
    this.gl=gl;this.budget=budget;this.maxMaskPixels=maxMaskPixels;this.vao=gl.createVertexArray();this.quadVAO=gl.createVertexArray();this.program=sceneProgram(gl,vertex,fragment);this.composite=sceneProgram(gl,compositeVertex,compositeFragment);this.locations=new Map();this.mask=null;this.maxMaskEdge=Math.min(4096,gl.getParameter(gl.MAX_TEXTURE_SIZE),gl.getParameter(gl.MAX_RENDERBUFFER_SIZE));this.models=new Set();this.buffers=new Set();
  }
  location(program,key){const id=(program===this.program?'e:':'c:')+key;if(!this.locations.has(id))this.locations.set(id,this.gl.getUniformLocation(program,key));return this.locations.get(id);}
  texture(width,height,internal,format,type,data){const gl=this.gl,t=gl.createTexture();gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,t);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.NEAREST);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.NEAREST);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);gl.texImage2D(gl.TEXTURE_2D,0,internal,width,height,0,format,type,data);if(gl.getError()!==gl.NO_ERROR){gl.deleteTexture(t);throw new RangeError('Scene texture allocation failed');}return t;}
  upload(geometry,paths,{evictable=false}={}){
    const gl=this.gl,width=1024,height=Math.max(1,Math.ceil(paths.length*2/width)),metadata=new Float32Array(width*height*4);
    for(let i=0;i<paths.length;i++){const ps=paths[i],a=ps[0],b=ps.at(-1);metadata.set([...a,...b,geometry.ranges[i].length,0,0,0],i*8);}
    const model={...geometry,points:null,joins:null,instances:null,pointsTexture:null,joinTexture:null,curveTexture:null,curveWidth:width};
    const bytes=geometry.points.byteLength+geometry.joins.length*2+metadata.byteLength;
    this.budget.reserve(model,bytes,()=>{gl.deleteTexture(model.pointsTexture);gl.deleteTexture(model.joinTexture);gl.deleteTexture(model.curveTexture);this.models.delete(model);model.released=true;},{evictable});
    try{model.pointsTexture=this.texture(geometry.textureWidth,geometry.textureHeight,gl.RGBA32F,gl.RGBA,gl.FLOAT,geometry.points);model.joinTexture=this.texture(geometry.textureWidth,geometry.textureHeight,gl.RG16F,gl.RG,gl.FLOAT,geometry.joins);model.curveTexture=this.texture(width,height,gl.RGBA32F,gl.RGBA,gl.FLOAT,metadata);this.models.add(model);return model;}
    catch(error){this.budget.release(model);throw error;}
  }
  group(indices,{color,width=1,dash=false,cap='round',bounds=null,cullEndpoints=true}={}){
    const gl=this.gl,result={buffer:null,count:indices.length,color,width,dash,cap,bounds,cullEndpoints};
    this.budget.reserve(result,indices.byteLength,()=>{gl.deleteBuffer(result.buffer);this.buffers.delete(result);});
    try{result.buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,result.buffer);gl.bufferData(gl.ARRAY_BUFFER,indices,gl.STATIC_DRAW);if(gl.getError()!==gl.NO_ERROR)throw new RangeError('Scene index allocation failed');this.buffers.add(result);return result;}catch(error){this.budget.release(result);throw error;}
  }
  releaseGroup(group){this.budget.release(group);}
  bind(model,group,view,tileX=0,tileY=0,tileWidth=view.width*view.dpr,tileHeight=view.height*view.dpr,maskOnly=false){
    const gl=this.gl,p=this.program;gl.bindVertexArray(this.vao);gl.useProgram(p);gl.bindBuffer(gl.ARRAY_BUFFER,group.buffer);gl.enableVertexAttribArray(0);gl.vertexAttribIPointer(0,1,gl.UNSIGNED_INT,4,0);gl.vertexAttribDivisor(0,1);
    gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,model.pointsTexture);gl.uniform1i(this.location(p,'points'),0);gl.activeTexture(gl.TEXTURE1);gl.bindTexture(gl.TEXTURE_2D,model.curveTexture);gl.uniform1i(this.location(p,'curves'),1);gl.activeTexture(gl.TEXTURE2);gl.bindTexture(gl.TEXTURE_2D,model.joinTexture);gl.uniform1i(this.location(p,'joins'),2);
    gl.uniform1i(this.location(p,'pointWidth'),model.textureWidth);gl.uniform1i(this.location(p,'curveWidth'),model.curveWidth);gl.uniform2f(this.location(p,'resolution'),tileWidth/view.dpr,tileHeight/view.dpr);gl.uniform2f(this.location(p,'mainResolution'),view.width,view.height);gl.uniform3f(this.location(p,'transform'),view.k,view.tx,view.ty);gl.uniform2f(this.location(p,'tileOffset'),tileX/view.dpr,tileY/view.dpr);
    gl.uniform1f(this.location(p,'dpr'),view.dpr);gl.uniform1f(this.location(p,'halfWidth'),group.width/2);gl.uniform1i(this.location(p,'roundCap'),group.cap==='round');gl.uniform1i(this.location(p,'cullEndpoints'),group.cullEndpoints);gl.uniform1i(this.location(p,'dashed'),group.dash);gl.uniform1i(this.location(p,'maskOnly'),maskOnly);gl.uniform4fv(this.location(p,'color'),group.color);gl.drawArraysInstanced(gl.TRIANGLE_STRIP,0,4,group.count);gl.activeTexture(gl.TEXTURE0);
  }
  direct(model,groups,view){const gl=this.gl;gl.bindFramebuffer(gl.FRAMEBUFFER,null);gl.viewport(0,0,Math.round(view.width*view.dpr),Math.round(view.height*view.dpr));gl.blendEquation(gl.FUNC_ADD);gl.blendFunc(gl.ONE,gl.ONE_MINUS_SRC_ALPHA);for(const group of groups)this.bind(model,group,view);}
  ensureMask(pixelWidth,pixelHeight){
    const gl=this.gl,maxEdge=this.maxMaskEdge,width=Math.min(maxEdge,pixelWidth,this.maxMaskPixels),height=Math.min(maxEdge,pixelHeight,Math.floor(this.maxMaskPixels/width));
    if(this.mask?.width===width&&this.mask?.height===height)return this.mask;
    if(this.mask)this.budget.release(this.mask);
    const mask={width,height,texture:null,framebuffer:null};this.budget.reserve(mask,width*height,()=>{gl.deleteTexture(mask.texture);gl.deleteFramebuffer(mask.framebuffer);});
    try{mask.texture=this.texture(width,height,gl.R8,gl.RED,gl.UNSIGNED_BYTE,null);mask.framebuffer=gl.createFramebuffer();gl.bindFramebuffer(gl.FRAMEBUFFER,mask.framebuffer);gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.COLOR_ATTACHMENT0,gl.TEXTURE_2D,mask.texture,0);if(gl.checkFramebufferStatus(gl.FRAMEBUFFER)!==gl.FRAMEBUFFER_COMPLETE)throw new Error('Single-channel scene coverage buffer unavailable');this.mask=mask;return mask;}
    catch(error){this.budget.release(mask);throw error;}
  }
  union(model,groups,view){
    const gl=this.gl,pixelWidth=Math.round(view.width*view.dpr),pixelHeight=Math.round(view.height*view.dpr),mask=this.ensureMask(pixelWidth,pixelHeight),p=this.composite;
    for(const group of groups){
      const b=group.bounds,margin=group.width*5+2;const left=b?Math.max(0,Math.floor((b[0]*view.k+view.tx-margin)*view.dpr)):0,right=b?Math.min(pixelWidth,Math.ceil((b[2]*view.k+view.tx+margin)*view.dpr)):pixelWidth,top=b?Math.max(0,Math.floor((b[1]*view.k+view.ty-margin)*view.dpr)):0,bottom=b?Math.min(pixelHeight,Math.ceil((b[3]*view.k+view.ty+margin)*view.dpr)):pixelHeight;
      for(let y=Math.floor(top/mask.height)*mask.height;y<bottom;y+=mask.height)for(let x=Math.floor(left/mask.width)*mask.width;x<right;x+=mask.width){
        const l=Math.max(x,left),r=Math.min(x+mask.width,right),t=Math.max(y,top),d=Math.min(y+mask.height,bottom);if(r<=l||d<=t)continue;
        gl.bindFramebuffer(gl.FRAMEBUFFER,mask.framebuffer);gl.viewport(0,0,mask.width,mask.height);gl.enable(gl.SCISSOR_TEST);gl.scissor(l-x,mask.height-(d-y),r-l,d-t);gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT);gl.blendEquation(gl.MAX);gl.blendFunc(gl.ONE,gl.ONE);this.bind(model,group,view,x,y,mask.width,mask.height,true);
        gl.bindFramebuffer(gl.FRAMEBUFFER,null);gl.viewport(0,0,pixelWidth,pixelHeight);gl.scissor(l,pixelHeight-d,r-l,d-t);gl.blendEquation(gl.FUNC_ADD);gl.blendFunc(gl.ONE,gl.ONE_MINUS_SRC_ALPHA);gl.bindVertexArray(this.quadVAO);gl.useProgram(p);gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,mask.texture);gl.uniform1i(this.location(p,'coverage'),0);gl.uniform2i(this.location(p,'origin'),x,pixelHeight-y-mask.height);gl.uniform2f(this.location(p,'resolution'),view.width,view.height);gl.uniform4f(this.location(p,'box'),l/view.dpr,t/view.dpr,(r-l)/view.dpr,(d-t)/view.dpr);gl.uniform4fv(this.location(p,'color'),group.color);gl.drawArrays(gl.TRIANGLE_STRIP,0,4);
      }
    }
    gl.disable(gl.SCISSOR_TEST);gl.activeTexture(gl.TEXTURE0);return{maskPixels:mask.width*mask.height};
  }
  destroy(){for(const group of this.buffers)this.budget.release(group);for(const model of this.models)this.budget.release(model);if(this.mask)this.budget.release(this.mask);this.gl.deleteVertexArray(this.vao);this.gl.deleteVertexArray(this.quadVAO);this.gl.deleteProgram(this.program);this.gl.deleteProgram(this.composite);}
}
