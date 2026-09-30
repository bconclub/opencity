(() => {
 const panel=document.createElement('details');panel.id='performance-panel';panel.open=false;panel.title="Performance";panel.innerHTML='<summary>Performance <span id="perf-summary">Measuring…</span></summary><dl></dl><small>Draw counts: custom 3D layers only. Basemap excluded. GPU utilization unavailable. Network: page resource transfers only; hidden cross-origin sizes and uploads excluded.</small>';document.body.append(panel);
 const network=[];let transferred=0,requests=0,unmeasured=0;
 try{new PerformanceObserver(list=>{for(const r of list.getEntries()){requests++;transferred+=r.transferSize||0;network.push({time:r.responseEnd,bytes:r.transferSize||0});if(!r.transferSize&&!r.encodedBodySize)unmeasured++;}}).observe({type:'resource',buffered:true});}catch{}
 const layers=new Map(),frames=[];let renders=0,lastRender=0,attached=false;
 window.recordCityRender=(name,renderer,elapsed)=>{const r=renderer.info.render;layers.set(name,{calls:r.calls,triangles:r.triangles,geometries:renderer.info.memory.geometries,textures:renderer.info.memory.textures,cpu:elapsed,time:performance.now()});};
 const format=v=>Number.isFinite(v)?v.toLocaleString(undefined,{maximumFractionDigits:1}):'Unavailable';
 const timer=setInterval(()=>{
  if(!attached&&typeof map!=='undefined'&&map){attached=true;map.on('render',()=>{const now=performance.now();if(lastRender)frames.push({time:now,dt:now-lastRender});lastRender=now;renders++;});}
  const now=performance.now();while(frames.length&&frames[0].time<now-1000)frames.shift();const active=[...layers.values()].filter(v=>now-v.time<500),sum=key=>active.reduce((n,v)=>n+v[key],0),times=frames.map(f=>f.dt).sort((a,b)=>a-b),fps=frames.length,mean=times.length?times.reduce((a,b)=>a+b,0)/times.length:0;
  const canvas=document.querySelector('#map canvas'),memory=performance.memory;
  while(network.length&&network[0].time<now-5000)network.shift();const rate=network.reduce((sum,r)=>sum+r.bytes,0)/5/1024;
  const rows=[['Download (5 s avg)',format(rate)+' KB/s'],['Measured transfer',format(transferred/1048576)+' MB'],['Resources observed',requests],['Unmeasured sizes',unmeasured],['Map FPS (1 s)',fps],['Frame interval avg',format(mean)+' ms'],['Frame interval p95',format(times[Math.floor(times.length*.95)]||0)+' ms'],['Map frames total',renders],['Custom draw calls',sum('calls')],['Custom triangles',sum('triangles')],['Custom CPU submit',format(sum('cpu'))+' ms'],['Custom geometries',sum('geometries')],['Custom textures',sum('textures')],['Canvas pixels',canvas?canvas.width+' × '+canvas.height:'Loading'],['JS heap',memory?format(memory.usedJSHeapSize/1048576)+' MB':'Unavailable']];
  document.getElementById('perf-summary').textContent=fps+' FPS';panel.querySelector('dl').replaceChildren(...rows.flatMap(([label,value])=>{const dt=document.createElement('dt'),dd=document.createElement('dd');dt.textContent=label;dd.textContent=String(value);return[dt,dd];}));
 },500);
})();


