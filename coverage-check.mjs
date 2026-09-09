const base='https://maps-docs-team.web.app/samples/3d-coverage-map/dist/';
const html=await(await fetch(base)).text();
for(const match of html.matchAll(/<script[^>]+src=["']([^"']+)/g)){
 const url=new URL(match[1],base);
 console.log('Script:',url.origin+url.pathname);
 if(url.origin===new URL(base).origin){
  const js=await(await fetch(url)).text();
  for(const value of js.matchAll(/.{0,120}(?:geojson|\.json|\.kml|\.kmz|coverage|Coverage).{0,160}/g))console.log(value[0].replace(/AIza[\w-]+/g,'REDACTED'));
 }
}
