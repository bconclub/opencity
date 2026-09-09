import assert from 'node:assert/strict';
import {buildRoadGraph,advanceRoad,reverseRoad,roadPosition,toLngLat} from './auto-roads.js';
const feature=(points,kind='minor',brunnel)=>({geometry:{type:'LineString',coordinates:points.map(toLngLat)},properties:{_layer:'transportation',class:kind,brunnel}});
const graph=buildRoadGraph({features:[feature([[-100,0],[100,0]]),feature([[0,-100],[0,100]]),feature([[-100,30],[100,30]],'minor','bridge'),feature([[-100,50],[100,50]],'path')]});
assert.equal(graph.edges.length,4);assert.equal(graph.connected.size,5);
const west=graph.nodes.findIndex(n=>n.p[0]<-90),center=graph.nodes.findIndex(n=>Math.hypot(...n.p)<1),edge=graph.nodes[west].edges[0];
for(const [choice,axis,sign]of [['left',1,1],['right',1,-1],['straight',0,1]]){const state={edge,from:west,to:center,progress:95,ended:false};advanceRoad(graph,state,15,choice);const position=roadPosition(graph,state);assert(position[axis]*sign>9);const before=[...position];reverseRoad(graph,state);const after=roadPosition(graph,state);assert(Math.hypot(after[0]-before[0],after[1]-before[1])<1e-8);}
const state={edge,from:west,to:center,progress:95,ended:false};advanceRoad(graph,state,500,'straight');assert.equal(state.ended,true);assert(Math.abs(state.progress-graph.edges[state.edge].length)<1e-8);
console.log(JSON.stringify({passed:['intersection splitting','exclude bridges and footpaths','left/right/straight junctions','turnaround preserves position','dead-end stop']}));
