const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export function createBoost(){return {reserve:0,active:false,locked:false};}
// A depleted held button must be released before the next burst. Actual distance
// can still refill the reserve, without flickering boost on/off every frame.
export function useBoost(state,requested,eligible,dt,profile={}){
 state.active=false;
 if(!requested)state.locked=false;
 if(!Number.isFinite(dt)||dt<=0||!requested||!eligible||state.locked)return 0;
 const cost=(profile.boostDrainPerSecond??20)*dt;
 const fraction=clamp(state.reserve/cost,0,1);
 state.reserve=clamp(state.reserve-cost,0,100);
 state.active=fraction>0;
 if(state.reserve===0)state.locked=true;
 return fraction;
}
export function earnBoost(state,distance,profile={},boosted=state.active){
 if(boosted||!Number.isFinite(distance)||distance<=0)return;
 state.reserve=clamp(state.reserve+distance*(profile.boostChargePerMetre??.24),0,100);
}
