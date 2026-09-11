// REVIEW ONLY. Compose with the existing world; do not replace its buildings.
import {createStairCollision} from './vidhana-architecture-stair-collision.js';
export function withVidhanaStairCollision(baseWorld,architecture,{getVehicleFootprint}={}){
 if(typeof baseWorld?.collide!=='function'||typeof baseWorld?.onRoad!=='function')throw Error('Driving world required');
 // The landing overlaps a mapped service route. Blocking it needs a separate
 // elevation/route decision and can strand actors already on that route.
 const stairs=createStairCollision(architecture,{includeLanding:false,getVehicleFootprint});
 return {...baseWorld,collide(x,y,heading){return baseWorld.collide(x,y,heading)||stairs.collide(x,y,heading);}};
}
