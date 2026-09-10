export function createBoostMeter(hud,label='Boost'){
 if(!document.getElementById('boost-meter-style')){
  const style=document.createElement('style');style.id='boost-meter-style';
  style.textContent='.ride-boost-meter{display:flex;flex-direction:column;justify-content:center;gap:4px;min-width:64px;max-width:76px;flex-shrink:0;font:10px system-ui;color:#deeee7;letter-spacing:.02em}.ride-boost-meter meter{display:block;width:100%;height:5px;appearance:none;border:0;background:#49675f;border-radius:4px;overflow:hidden}.ride-boost-meter meter::-webkit-meter-bar{background:#49675f;border:0}.ride-boost-meter meter::-webkit-meter-optimum-value{background:#8adbc5}.ride-boost-meter meter::-moz-meter-bar{background:#8adbc5}.ride-boost-meter[data-active=true] meter::-webkit-meter-optimum-value{background:#f7d36a}.ride-boost-meter>span{font-size:10px!important;white-space:nowrap}';document.head.append(style);
 }
 const wrap=document.createElement('span');wrap.className='ride-boost-meter';
 const text=document.createElement('span'),meter=document.createElement('meter');meter.min=0;meter.max=100;meter.value=0;meter.setAttribute('aria-label',label+' reserve');wrap.append(text,meter);hud.querySelector('.instruments').append(wrap);
 let previous='';return (state,automatic=false)=>{const reserve=Math.floor(state?.reserve||0),active=!!state?.active,next=`${reserve}:${active}:${label}:${automatic}`;if(next===previous)return;previous=next;meter.value=reserve;text.textContent=automatic?'AUTO · Boost':label+' '+reserve+'%';wrap.dataset.active=String(active);wrap.title=automatic?'Automatic boosted cruise. Manual reserve preserved.':state?.locked?'Release boost to use earned charge':'Ride to charge. Hold Shift or boost to use.';};
}
