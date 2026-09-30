const overlay=document.createElement('section');
overlay.id='resume-overlay';overlay.hidden=true;overlay.setAttribute('role','dialog');overlay.setAttribute('aria-labelledby','resume-title');
overlay.innerHTML='<div><h2 id="resume-title">Ride paused</h2><p>Your vehicle is waiting where you left it.</p><button id="resume-ride" type="button">Resume ride</button><button id="resume-exit" type="button">Exit vehicle</button></div>';
document.body.append(overlay);
function current(){return window.autoState?.().active?{state:window.autoState(),pause:'pause-auto',exit:'exit-auto'}:window.flightState?.().active?{state:window.flightState(),pause:'pause-flight',exit:'exit-flight'}:null;}
function sync(){const ride=current();const show=!!ride?.state.paused&&!document.hidden&&!document.body.classList.contains("mobile-tools-open");if(overlay.hidden===!show)return;overlay.hidden=!show;if(show)overlay.querySelector('#resume-ride').focus({preventScroll:true});}
overlay.querySelector('#resume-ride').onclick=()=>{const ride=current();if(ride?.state.paused)document.getElementById(ride.pause)?.click();sync();document.querySelector('#map canvas')?.focus({preventScroll:true});};
overlay.querySelector('#resume-exit').onclick=()=>{const ride=current();if(ride)document.getElementById(ride.exit)?.click();sync();};
window.addEventListener('focus',sync);document.addEventListener('visibilitychange',sync);setInterval(sync,100);

