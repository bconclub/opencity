import {readFile} from 'node:fs/promises';
import {Script} from 'node:vm';

// package.json is ESM, so `node --check` alone misses imports accidentally
// added to scripts that the browser loads in classic/defer mode.
const html=await readFile(new URL('./index.html',import.meta.url),'utf8');
let checked=0;
for(const [,attributes] of html.matchAll(/<script\b([^>]*)>/gi)){
 const src=attributes.match(/\bsrc\s*=\s*["']([^"']+)["']/i)?.[1];
 if(!src||/^(?:https?:)?\/\//.test(src)||/\btype\s*=\s*["']module["']/i.test(attributes))continue;
 const url=new URL(src,import.meta.url);url.search='';url.hash='';
 new Script(await readFile(url,'utf8'),{filename:src});checked++;
}
if(!checked)throw Error('No local classic browser entry scripts were checked');
console.log(`Browser entry syntax: ${checked} classic scripts passed`);
