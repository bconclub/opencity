import assert from 'node:assert/strict';
import {decodePad,createGamepadControls} from './gamepad-controls.js';
const pad={id:'test',index:0,connected:true,mapping:'standard',axes:[.03,0],buttons:Array.from({length:17},()=>({value:0}))};pad.buttons[6].value=.015;pad.buttons[7].value=.025;
assert.equal(decodePad(pad).throttle,0);assert.equal(decodePad(pad).vertical,0);
globalThis.document={hidden:false,createElement:()=>({style:{},setAttribute(){},textContent:''})};Object.defineProperty(globalThis,'navigator',{value:{getGamepads:()=>[pad]},configurable:true});const parent={append(){}};const controls=createGamepadControls(parent,'auto');controls.poll();assert(controls.state().armed);pad.buttons[7].value=.6;assert.equal(controls.poll().throttle,.6);navigator.getGamepads=()=>[];assert(controls.poll().disconnected);assert.equal(controls.poll().throttle,0);console.log('PASS: noisy resting triggers arm, analog input works, disconnect clears input.');
