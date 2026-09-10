import assert from 'node:assert/strict';
import {advanceRoad} from './auto-roads.js';
// Loop 0-1-2-0, exit 1-3. Previously straight preference revisited loop.
const nodes=[{p:[0,0],edges:[0,2]},{p:[0,10],edges:[0,1,3]},{p:[1,20],edges:[1,2]},{p:[10,10],edges:[3]}];
const edges=[{a:0,b:1,length:10},{a:1,b:2,length:10},{a:2,b:0,length:20},{a:1,b:3,length:10}];
const graph={nodes,edges};const state={edge:0,from:0,to:1,progress:0,ended:false};
let exited=false;for(let i=0;i<100;i++){advanceRoad(graph,state,1,'explore');if(state.edge===3){exited=true;break;}}
assert(exited,'Traffic must leave a repeated loop when exit exists');
console.log('PASS: repeated loop takes exit');
