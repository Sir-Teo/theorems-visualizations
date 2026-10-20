// Low-level shape/text passes for the isolated persistent map scene.
import { sceneProgram, sceneColor } from './map-scene-gl.js';
import { SceneTextAtlas } from './map-scene-text.js';

const quad = `vec2 corner(){return vec2(gl_VertexID&1,gl_VertexID>>1);}`;
const rectVertex = `#version 300 es
precision highp float;
uniform vec2 resolution;
uniform vec4 box;
uniform float dpr;
out vec2 local;
${quad}
void main(){local=corner()*(box.zw+2./dpr)-1./dpr;vec2 p=box.xy+local;gl_Position=vec4(p/resolution*vec2(2.,-2.)+vec2(-1.,1.),0.,1.);}`;
const rectFragment = `#version 300 es
precision highp float;
in vec2 local;
uniform vec4 box,color;
uniform float radius,dpr;
out vec4 pixel;
void main(){float r=min(radius,min(box.z,box.w)*.5);vec2 q=abs(local-box.zw*.5)-box.zw*.5+r;float sd=min(max(q.x,q.y),0.)+length(max(q,0.))-r;float a=color.a*clamp(.5-sd*dpr,0.,1.);pixel=vec4(color.rgb*a,a);}`;
const textVertex = `#version 300 es
precision highp float;
uniform vec2 resolution;
uniform vec4 box,region;
out vec2 uv;
${quad}
void main(){vec2 q=corner();vec2 p=box.xy+q*box.zw;uv=region.xy+q*region.zw;gl_Position=vec4(p/resolution*vec2(2.,-2.)+vec2(-1.,1.),0.,1.);}`;
const textFragment = `#version 300 es
precision highp float;
in vec2 uv;
uniform sampler2D words;
uniform vec4 color;
out vec4 pixel;
void main(){pixel=texture(words,uv);}`;
const nodeVertex = `#version 300 es
precision highp float;
precision highp usampler2D;
uniform sampler2D nodes;
uniform usampler2D flags;
uniform vec2 resolution;
uniform vec3 transform;
uniform float dpr;
uniform bool farView,highlight,focusActive;
uniform int layer;
out vec2 local;
flat out float radius;
flat out uint bits;
flat out int collection;
${quad}
void main(){
 int id=gl_InstanceID;vec4 n=texelFetch(nodes,ivec2(id%1024,id/1024),0);bits=texelFetch(flags,ivec2(id%256,id/256),0).r;collection=int(n.w+.5);
 bool ghost=(bits&64u)!=0u,hit=(bits&8u)!=0u,connected=(bits&6u)!=0u,selected=(bits&16u)!=0u;
 radius=farView?(highlight&&hit?3.4:ghost?1.:max(1.2,min(3.,n.z*transform.x*2.2))):max(ghost?1.4:1.6,n.z*max(.55,min(1.5,transform.x)));
 float outer=radius+6.;local=(corner()*2.-1.)*(outer+1./dpr);vec2 center=n.xy*transform.x+transform.yz;
 if((bits&1u)==0u || (layer==2&&!connected&&!selected) || center.x < -(farView?4.:20.) || center.x>resolution.x+(farView?4.:20.) || center.y<-(farView?4.:20.) || center.y>resolution.y+(farView?4.:20.)){gl_Position=vec4(2.,2.,2.,1.);return;}
 gl_Position=vec4((center+local)/resolution*vec2(2.,-2.)+vec2(-1.,1.),0.,1.);
}`;
const nodeFragment = `#version 300 es
precision highp float;
precision highp int;
in vec2 local;
flat in float radius;
flat in uint bits;
flat in int collection;
uniform vec4 palette[128];
uniform vec4 ink,panel,accent;
uniform float dpr;
uniform bool farView,highlight,focusActive;
uniform int layer;
out vec4 pixel;
float fill(float r){return clamp((r-length(local))*dpr+.5,0.,1.);}
float ring(float r,float w){return max(0.,fill(r+w*.5)-fill(max(0.,r-w*.5)));}
vec4 over(vec4 base,vec4 color,float opacity,float coverage){float a=color.a*opacity*coverage;return vec4(color.rgb*a,a)+base*(1.-a);}
void main(){
 bool ghost=(bits&64u)!=0u,definition=(bits&128u)!=0u,hit=(bits&8u)!=0u,selected=(bits&16u)!=0u,focused=(bits&32u)!=0u,connected=(bits&6u)!=0u;
 vec4 p=vec4(0.);float alpha=(layer==1 || (focusActive&&!connected))?.14:1.;if(highlight&&!hit&&!focusActive)alpha=.1;
 if(farView){float a=highlight&&!hit?.06:ghost&&!highlight?.35:.95;vec2 coverage=clamp((vec2(radius)-abs(local))*dpr+.5,0.,1.);p=over(p,palette[collection],a,coverage.x*coverage.y);if(highlight&&hit){vec2 q=abs(local),outer=clamp((vec2(radius+2.1)-q)*dpr+.5,0.,1.),inner=clamp((vec2(radius+.9)-q)*dpr+.5,0.,1.);p=over(p,ink,.55,max(0.,outer.x*outer.y-inner.x*inner.y));}}
 else {
  if(layer!=2 || connected){if(ghost){float a=layer==2?(.45-.14*.45)/(1.-.14*.45):alpha*.45;p=over(p,palette[collection],a,ring(radius,1.));}
   else if(definition){p=over(p,panel,alpha,fill(radius));p=over(p,palette[collection],alpha,ring(radius,1.4));}
   else p=over(p,palette[collection],alpha,fill(radius));}
  if(highlight&&hit&&layer!=2)p=over(p,accent,.9,ring(radius+2.5,1.6));
  if(layer!=1&&(focused||selected))p=over(p,ink,1.,ring(radius+4.,2.));
 }
 pixel=p;
}`;

export class ScenePainter {
  constructor(gl, budget, atlasOptions) {
    this.gl = gl; this.budget = budget; this.vao = gl.createVertexArray();
    try { this.rectProgram = sceneProgram(gl, rectVertex, rectFragment); this.textProgram = sceneProgram(gl, textVertex, textFragment); this.nodeProgram = sceneProgram(gl, nodeVertex, nodeFragment); this.atlas = new SceneTextAtlas(gl, budget, atlasOptions); this.locations = new Map(); }
    catch(error) { gl.deleteVertexArray(this.vao); for(const program of [this.rectProgram,this.textProgram,this.nodeProgram]) if(program)gl.deleteProgram(program); throw error; }
  }
  location(program, key) { const id = `${program === this.rectProgram ? 'r' : program === this.textProgram ? 't' : 'n'}:${key}`; if (!this.locations.has(id)) this.locations.set(id, this.gl.getUniformLocation(program, key)); return this.locations.get(id); }
  view(width, height, dpr, moving = false) { this.width = width; this.height = height; this.dpr = dpr; this.moving = moving; }
  common(program) { const gl = this.gl; gl.bindVertexArray(this.vao); gl.useProgram(program); gl.uniform2f(this.location(program, 'resolution'), this.width, this.height); gl.uniform1f(this.location(program, 'dpr'), this.dpr); }
  rect(x, y, width, height, radius, style) {
    if (!(width > 0 && height > 0)) return;
    const gl = this.gl, p = this.rectProgram; this.common(p); gl.uniform4f(this.location(p, 'box'), x, y, width, height); gl.uniform1f(this.location(p, 'radius'), radius); gl.uniform4fv(this.location(p, 'color'), sceneColor(style)); gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }
  measure(text, style) { return this.atlas.metrics(text, style); }
  text(text, x, y, style, color, clip = null) {
    if (!text) return;
    const gl = this.gl, p = this.textProgram, phase = v => ((v * this.dpr) % 1 + 1) % 1;
    // Titles change font size continuously during zoom. Reuse a native word at
    // one size while moving, then rasterize its exact size/phase when settled.
    // Fixed-size node labels retain their original native font throughout.
    let scale=1,rasterStyle=style;const match=style.font.match(/([\d.]+)px/);if(this.moving&&match&&+match[1]>=13){scale=+match[1]/32;rasterStyle={...style,font:style.font.replace(/([\d.]+)px/,'32px')};}
    const word = this.atlas.get(text, { ...rasterStyle, color, phaseX: this.moving ? 0 : phase(x), phaseY: this.moving ? 0 : phase(y) }, this.dpr, () => {});
    this.common(p); gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, this.atlas.texture); gl.uniform1i(this.location(p, 'words'), 0);
    gl.uniform4f(this.location(p, 'box'), x + word.left*scale, y + word.top*scale, word.width*scale, word.height*scale); gl.uniform4f(this.location(p, 'region'), word.x, word.y, word.u, word.v); gl.uniform4fv(this.location(p, 'color'), sceneColor(color));
    if (clip) { const left = Math.max(0, Math.ceil(clip[0] * this.dpr)), right = Math.min(Math.round(this.width * this.dpr), Math.floor((clip[0] + clip[2]) * this.dpr)), top = Math.max(0, Math.ceil(clip[1] * this.dpr)), bottom = Math.min(Math.round(this.height * this.dpr), Math.floor((clip[1] + clip[3]) * this.dpr)); if (right <= left || bottom <= top) return; gl.enable(gl.SCISSOR_TEST); gl.scissor(left, Math.round(this.height * this.dpr) - bottom, right - left, bottom - top); }
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4); if (clip) gl.disable(gl.SCISSOR_TEST);
  }
  nodes({ texture, flags, count, k, tx, ty, far, layer, highlight, focus, palette, ink, panel, accent }) {
    const gl = this.gl, p = this.nodeProgram; this.common(p);
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, texture); gl.uniform1i(this.location(p, 'nodes'), 0); gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, flags); gl.uniform1i(this.location(p, 'flags'), 1);
    gl.uniform3f(this.location(p, 'transform'), k, tx, ty); gl.uniform1i(this.location(p, 'farView'), far); gl.uniform1i(this.location(p, 'highlight'), highlight); gl.uniform1i(this.location(p, 'focusActive'), focus); gl.uniform1i(this.location(p, 'layer'), layer);
    gl.uniform4fv(this.location(p, 'palette[0]'), palette); gl.uniform4fv(this.location(p, 'ink'), sceneColor(ink)); gl.uniform4fv(this.location(p, 'panel'), sceneColor(panel)); gl.uniform4fv(this.location(p, 'accent'), sceneColor(accent));
    gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, count); gl.activeTexture(gl.TEXTURE0);
  }
  destroy() { this.atlas.destroy(); this.gl.deleteVertexArray(this.vao); for (const program of [this.rectProgram, this.textProgram, this.nodeProgram]) this.gl.deleteProgram(program); }
}
