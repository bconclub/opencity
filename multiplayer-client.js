import {paintHex,selectedVehicleColor,wireVehicleColor} from './vehicle-colors.js';
// Shared-room transport. Link possession grants guest access; no account is required.
const make=(tag,cls,text)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(text)e.textContent=text;return e;};
const cleanName=value=>String(value||'').replace(/[\u0000-\u001f\u007f]/g,'').trim().slice(0,24);
let name='';try{name=cleanName(localStorage.getItem('opencity-player-name')||sessionStorage.getItem('opencity-player-name'));if(name)localStorage.setItem('opencity-player-name',name);}catch{}
// Solo browse: ?solo=1 skips meetup UI; boot also auto-falls back if meetup connect fails within 5s (see connect()).
const soloMode=new URL(location.href).searchParams.get('solo')==='1'||new URL(location.href).searchParams.has('solo');
let room=new URL(location.href).searchParams.get('room')||'',id=null,players=[],socket=null,retryTimer=null,attempt=0,wanted=false,suspended=false,status='Solo',endpoint='',generation=0,lastMessage=0;
const validRoom=value=>/^[a-f0-9]{32}$/.test(value);
const panel=make('details','multiplayer-panel');panel.id='multiplayer-panel';
const summary=make('summary'),badge=make('span','multiplayer-badge'),statusText=make('span','multiplayer-status','Solo');summary.append(badge,statusText);panel.append(summary);
const content=make('div','multiplayer-content'),hint=make('p','multiplayer-hint','Meet friends in the same CBD. Up to 8 players.');
const actions=make('div','multiplayer-actions'),host=make('button','','Create room'),copy=make('button','','Copy invite'),reconnect=make('button','','Reconnect'),leave=make('button','','Leave'),rename=make('button','','Change name');
for(const b of [host,copy,reconnect,leave,rename]){b.type='button';actions.append(b);}
const roster=make('ul','multiplayer-roster');roster.setAttribute('aria-label','Players in this room');
const notice=make('p','multiplayer-notice');notice.setAttribute('role','status');
const invite=make('input','multiplayer-invite');invite.readOnly=true;invite.setAttribute('aria-label','Invite link');invite.hidden=true;
const joinForm=make('form','multiplayer-join'),joinCode=make('input'),joinButton=make('button','','Join room');joinCode.placeholder='Paste invite link or room code';joinCode.setAttribute('aria-label','Invite link or room code');joinCode.required=true;joinButton.type='submit';joinForm.append(joinCode,joinButton);
content.append(hint,actions,joinForm,invite,roster,notice);panel.append(content);document.body.append(panel);
const roomToggle=make('button','desktop-room-toggle','Room');roomToggle.type='button';roomToggle.setAttribute('aria-controls','multiplayer-panel');roomToggle.setAttribute('aria-expanded','false');roomToggle.onclick=()=>{panel.open=!panel.open;roomToggle.setAttribute('aria-expanded',String(panel.open));};document.body.append(roomToggle);
function enterWhenReady(){render();dispatch();if(soloMode||!room)return;if(name)connect();else promptName();}
if(window.cityBootReady)enterWhenReady();else window.addEventListener('city-ready',enterWhenReady,{once:true});
