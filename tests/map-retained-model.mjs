import test from 'node:test';
import assert from 'node:assert/strict';
import {retainedMissingRegions} from '../assets/js/map-scene-retained.js';
test('uncovered rectangles partition exactly the integer viewport outside the retained picture',()=>{
 const width=79,height=61;
 for(const box of [[-20,-10,150,100],[10,20,30,25],[100,20,50,40],[-50,-80,5,5],[.5,-.5,33.25,42.5],[20.5,10.5,2,2]]){
  const rects=retainedMissingRegions(width,height,box),left=Math.max(0,Math.min(width,Math.round(box[0]))),right=Math.max(left,Math.min(width,Math.round(box[0]+box[2]))),top=Math.max(0,Math.min(height,Math.round(box[1]))),bottom=Math.max(top,Math.min(height,Math.round(box[1]+box[3])));
  for(let y=0;y<height;y++)for(let x=0;x<width;x++){const count=rects.filter(r=>x>=r.x&&x<r.x+r.width&&y>=r.y&&y<r.y+r.height).length;assert.equal(count,x>=left&&x<right&&y>=top&&y<bottom?0:1,`${box} at ${x},${y}`);}
  assert.ok(rects.length<=4);assert.equal(rects.reduce((n,r)=>n+r.width*r.height,0),width*height-(right-left)*(bottom-top));
 }
});
