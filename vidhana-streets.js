import {loadVidhanaStreetData} from './street-data.js';
export async function installVidhanaStreets(map){
 const data=await loadVidhanaStreetData();map.addSource('vidhana-streets',{type:'geojson',data});
 const ids=[];function add(layer){ids.push(layer.id);map.addLayer({...layer,source:'vidhana-streets'},'district-detail');}
 add({id:'vidhana-road',type:'fill',filter:['==',['get','kind'],'road'],paint:{'fill-color':['match',['get','surface'],'concrete','#aeb0a8','paving_stones','#a8a08e','#525956'],'fill-antialias':false}});
 add({id:'vidhana-footpath',type:'fill',filter:['==',['get','kind'],'footpath'],paint:{'fill-color':['match',['get','surface'],'asphalt','#727971','ground','#b6a17a','paving_stones','#c4bcb0','#c8bfaa'],'fill-antialias':true}});
 add({id:'vidhana-kerb',type:'fill',filter:['==',['get','kind'],'kerb'],paint:{'fill-color':['match',['get','kerbTone'],0,'#1f8f4f','#ffffff'],'fill-opacity':.98,'fill-antialias':true}});
 for(const kind of ['lane','zebra'])add({id:'vidhana-'+kind,type:'fill',filter:['==',['get','kind'],kind],paint:{'fill-color':'#f1edd8','fill-opacity':.92,'fill-antialias':true}});
 add({id:'vidhana-barrier-rails',type:'line',minzoom:17,filter:['==',['get','kind'],'barrier_rail'],paint:{'line-color':'#8a7f50','line-width':2,'line-opacity':.85}});
 add({id:'vidhana-barriers',type:'circle',minzoom:16,filter:['in',['get','kind'],['literal',['barrier_police','barrier_cone','barrier_post']]],paint:{'circle-radius':['interpolate',['linear'],['zoom'],16,['match',['get','kind'],'barrier_police',4,'barrier_cone',3,2],18,['match',['get','kind'],'barrier_police',7,'barrier_cone',5,4]],'circle-color':['match',['get','kind'],'barrier_police','#e8b923','barrier_cone','#2563eb','#8a8274'],'circle-stroke-width':1.5,'circle-stroke-color':'#1f1c16','circle-opacity':.92}});
 add({id:'vidhana-memorials',type:'circle',minzoom:17,filter:['==',['get','kind'],'memorial'],paint:{'circle-radius':4,'circle-color':'#b59152','circle-stroke-width':1,'circle-stroke-color':'#302f25'}});
 add({id:'vidhana-signals',type:'circle',minzoom:19,filter:['==',['get','kind'],'signal'],paint:{'circle-radius':3,'circle-color':'#dcac4c','circle-stroke-width':2,'circle-stroke-color':'#283b31'}});
 // Markers identify mapped monuments without inventing their sculpture geometry.
 map.on('click','vidhana-memorials',e=>{if(!e.features?.[0]||document.body.classList.contains('flight-active'))return;const f=e.features[0],node=document.createElement('div');node.textContent=f.properties.name+' · mapped memorial; detailed model pending';new maplibregl.Popup().setLngLat(e.lngLat).setDOMContent(node).addTo(map);});
 window.raiseVidhanaStreets=()=>{for(const id of ids)if(map.getLayer(id))map.moveLayer(id,'district-detail');};
 window.vidhanaStreetState=()=>({loaded:true,...data.counts,radius:data.radius,source:data.source,estimatedWidths:data.features.filter(f=>f.properties.kind==='road'&&f.properties.widthEstimated).length});
}
