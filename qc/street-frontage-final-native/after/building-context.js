import {polygonTouchesCBD} from './cbd-dome.js';
// Render only streamed polygons wholly outside the detailed district.
// Vector-tile features can group hundreds of separate buildings in one MultiPolygon,
// so a feature-level `within` filter cannot reliably prevent duplicate surfaces.
export function createBuildingContext(map,bbox){
 const empty={type:'FeatureCollection',features:[]};
 map.addSource('district-context',{type:'geojson',data:empty});
 const before=map.getStyle().layers.find(l=>l.type==='symbol')?.id;
 map.addLayer({id:'district-context-buildings',type:'fill-extrusion',source:'district-context',layout:{visibility:'none'},paint:{'fill-extrusion-color':['interpolate',['linear'],['coalesce',['get','render_height'],8],0,'#d8d8c7',30,'#b6bead',100,'#829b8c'],'fill-extrusion-height':['max',3,['coalesce',['get','render_height'],8]],'fill-extrusion-base':['coalesce',['get','render_min_height'],0],'fill-extrusion-opacity':1}},before);
 let active=false,timer=0,lastBuilt=0,lastPosition=null,count=0;
 function refresh(){
  timer=0;if(!active)return;
  const bounds=map.getBounds(),west=bounds.getWest()-.003,east=bounds.getEast()+.003,south=bounds.getSouth()-.003,north=bounds.getNorth()+.003;
  const features=[],seen=new Set();
  for(const f of map.querySourceFeatures('openmaptiles',{sourceLayer:'building'})){
   const polygons=f.geometry.type==='Polygon'?[f.geometry.coordinates]:f.geometry.type==='MultiPolygon'?f.geometry.coordinates:[];
   for(const polygon of polygons){
    if(!polygonTouchesCBD(polygon))continue;
    const ring=polygon[0];let w=Infinity,e=-Infinity,s=Infinity,n=-Infinity;
    for(const p of ring){w=Math.min(w,p[0]);e=Math.max(e,p[0]);s=Math.min(s,p[1]);n=Math.max(n,p[1]);}
    if(e<west||w>east||n<south||s>north)continue;
    // Drop every polygon whose bounding box touches the local replacement region.
    if(e>=bbox[0]&&w<=bbox[2]&&n>=bbox[1]&&s<=bbox[3])continue;
    const key=ring.map(p=>p.map(v=>v.toFixed(6)).join(',')).sort().join(';')+'|'+f.properties.render_height+'|'+f.properties.render_min_height;
    if(seen.has(key))continue;seen.add(key);
    features.push({type:'Feature',geometry:{type:'Polygon',coordinates:polygon},properties:f.properties});
   }
  }
  map.getSource('district-context').setData({type:'FeatureCollection',features});count=features.length;lastBuilt=performance.now();lastPosition={lng:map.getCenter().lng,lat:map.getCenter().lat,zoom:map.getZoom()};
 }
 function schedule(force=false){if(!active||timer)return;const c=map.getCenter();if(!force&&lastPosition&&Math.abs(c.lng-lastPosition.lng)<.0015&&Math.abs(c.lat-lastPosition.lat)<.0015&&Math.abs(map.getZoom()-lastPosition.zoom)<.3)return;timer=setTimeout(refresh,Math.max(100,1500-(performance.now()-lastBuilt)));}
 map.on('moveend',()=>schedule());map.on('sourcedata',e=>{if(e.sourceId==='openmaptiles'&&e.isSourceLoaded)schedule(true);});
 return{setVisible(value){active=value;map.setLayoutProperty('district-context-buildings','visibility',value?'visible':'none');if(value)schedule(true);else{clearTimeout(timer);timer=0;}},get count(){return count;}};
}

