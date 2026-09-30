import {installPlayerStats} from './player-stats.js';
import {connectPlayerCloud} from './player-cloud.js';
let config={};try{const response=await fetch('./supabase-config.json');if(response.ok)config=await response.json();}catch{}
const stats=installPlayerStats(config);
const cloud=config.url?connectPlayerCloud(stats,config):null;
cloud?.restore().catch(()=>{});
const panel=document.createElement('details');panel.id='player-ride-stats';
const summary=document.createElement('summary');summary.textContent='Your ride stats';
const output=document.createElement('p'),status=document.createElement('p'),connect=document.createElement('button');connect.type='button';connect.textContent='Connect cloud profile';
panel.append(summary,output,status,connect);
(document.querySelector('.multiplayer-content')||document.body).append(panel);
function update(){const s=stats.stats(),rows=Object.values(s.vehicles),minutes=n=>Math.floor(n/60)+'m '+Math.floor(n%60)+'s';output.textContent=`Ride time ${minutes(rows.reduce((n,v)=>n+v.activeSeconds,0))} · Flight time ${minutes(rows.reduce((n,v)=>n+v.flightSeconds,0))} · Favorite: ${s.favoriteVehicle||'Take your first ride'}`;status.textContent=s.error|| (s.signedIn?'Cloud profile connected.':'Saved in this browser.');connect.hidden=s.signedIn||!s.configured;}
connect.onclick=async()=>{connect.disabled=true;status.textContent='Connecting…';try{await cloud.connect();}catch(error){status.textContent=error.message;}finally{connect.disabled=false;update();}};
panel.addEventListener('toggle',update);setInterval(()=>{if(panel.open)update();},1000);window.addEventListener('player-stats-status',update);update();
