import {mapScenePrototype} from './map-scene-prototype.mjs';
export function mapRetainedPrototype(source){return mapScenePrototype(source).replace("import { WebGLMapScene } from './map-webgl-scene.js';","import { RetainedMapScene as WebGLMapScene } from './map-scene-retained.js';");}
