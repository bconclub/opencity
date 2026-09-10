import {toLocal,toLngLat,spawnRoad,roadPosition} from './auto-roads.js';

// Illustrative street surfaces follow mapped road centre lines. Widths and kerbs
// are road-class estimates, not surveyed pavement or traffic-lane information.
export function addStreetDetail(map,graph,data){
 const centre=roadPosition(graph,spawnRoad(graph)),radius=250;
 const width=e=>({service:2.5,minor:3.5,tertiary:5,secondary:6,primary:7,trunk:8}[e.kind]||3.5);
 const distance=(p,a,b)=>{const dx=b[0]-a[0],dy=b[1]-a[1],t=Math.max(0,Math.min(1,((p[0]-a[0])*dx+(p[1]-a[1])*dy)/(dx*dx+dy*dy)));return Math.hypot(p[0]-a[0]-t*dx,p[1]-a[1]-t*dy);};
 const nearby=graph.edges.filter(e=>distance(centre,graph.nodes[e.a].p,graph.nodes[e.b].p)<radius+30);
 const rings=data.features.filter(f=>f.properties._layer==='building'&&f.geometry.type==='Polygon').map(f=>f.geometry.coordinates[0].map(toLocal)).filter(r=>r.some(p=>Math.hypot(p[0]-centre[0],p[1]-centre[1])<radius+40));
 const inside=(p,r)=>{let yes=false;for(let i=0,j=r.length-1;i<r.length;j=i++){const a=r[i],b=r[j];if((a[1]>p[1])!==(b[1]>p[1])&&p[0]<(b[0]-a[0])*(p[1]-a[1])/(b[1]-a[1])+a[0])yes=!yes;}return yes;};
 const features=[];
 const polygon=(corners,kind,shade)=>{features.push({type:'Feature',properties:{kind,shade},geometry:{type:'Polygon',coordinates:[[...corners,corners[0]].map(toLngLat)]}});};
 for(const edge of nearby){
  const a=graph.nodes[edge.a].p,b=graph.nodes[edge.b].p,dx=(b[0]-a[0])/edge.length,dy=(b[1]-a[1])/edge.length,w=width(edge);
  const point=(s,o)=>[a[0]+dx*s-dy*o,a[1]+dy*s+dx*o];
  const clear=p=>!nearby.some(other=>other!==edge&&distance(p,graph.nodes[other.a].p,graph.nodes[other.b].p)<width(other)+.6)&&!rings.some(r=>inside(p,r));
  for(let s=1;s<edge.length-1;s+=3){
   if(Math.hypot(...point(s,0).map((n,i)=>n-centre[i]))>radius)continue;
   const end=Math.min(s+2.98,edge.length-1);
   for(const side of [-1,1]){
    const corners=[point(s,side*(w+.05)),point(end,side*(w+.05)),point(end,side*(w+1.7)),point(s,side*(w+1.7))];
    if(corners.every(clear)&&clear(point((s+end)/2,side*(w+.85)))){
     polygon(corners,'walk',Math.floor(s/3)%2?'#afa997':'#b7b19f');
     polygon([point(s,side*w),point(end,side*w),point(end,side*(w+.24)),point(s,side*(w+.24))],'kerb',Math.floor(s/3)%2?'#d2d0c5':'#666b68');
    }
   }
   // Dashed road-edge guides only; no invented intersection crossings or lane arrows.
   if(Math.floor(s/3)%2===0&&s>12&&end<edge.length-12){
    for(const side of [-1,1]){const p=point(s,side*(w-.45));if(clear(p))polygon([p,point(end,side*(w-.45)),point(end,side*(w-.57)),point(s,side*(w-.57))],'paint','#d8d3b8');}
   }
  }
 }
 // Repeatable fine asphalt grain, generated locally with no downloaded textures.
 const size=128,pixels=new Uint8Array(size*size*4);let seed=8137;
 for(let i=0;i<size*size;i++){seed=(Math.imul(seed,1664525)+1013904223)>>>0;const value=63+(seed>>>27);pixels.set([value,value+3,value+2,255],i*4);}
 if(!map.hasImage('street-asphalt'))map.addImage('street-asphalt',{width:size,height:size,data:pixels},{pixelRatio:2});
 map.setPaintProperty('auto-road-surface','fill-pattern','street-asphalt');
 map.addSource('street-detail',{type:'geojson',data:{type:'FeatureCollection',features}});
 const ids=[];
 for(const [kind,height]of [['walk',.12],['kerb',.19]]){
  const id='street-'+kind;ids.push(id);map.addLayer({id,type:'fill-extrusion',source:'street-detail',filter:['==',['get','kind'],kind],layout:{visibility:'none'},paint:{'fill-extrusion-color':['get','shade'],'fill-extrusion-height':height,'fill-extrusion-base':.01,'fill-extrusion-opacity':1}},'district-detail');
 }
 ids.push('street-paint');map.addLayer({id:'street-paint',type:'fill',source:'street-detail',filter:['==',['get','kind'],'paint'],layout:{visibility:'none'},paint:{'fill-color':['get','shade'],'fill-opacity':.72}},'district-detail');
 return{setVisible(visible){for(const id of ids)map.setLayoutProperty(id,'visibility',visible?'visible':'none');},features:features.length,centre:toLngLat(centre),radius};
}
