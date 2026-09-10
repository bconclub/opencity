// Small, generated daylight reflection field. No network asset or per-frame work.
// Metallic GLBs need indirect specular light; hemisphere lights alone are diffuse.
export function installVehicleEnvironment(T,renderer,scene){
 const width=128,height=64,pixels=new Uint8Array(width*height*4);
 for(let y=0;y<height;y++)for(let x=0;x<width;x++){
  const v=y/(height-1),sky=Math.max(0,Math.cos(v*Math.PI)),ground=Math.max(0,-Math.cos(v*Math.PI));
  const horizon=Math.exp(-Math.pow((v-.5)/.14,2)),softbox=Math.exp(-Math.pow((x/width-.32)/.12,2))*Math.exp(-Math.pow((v-.3)/.15,2));
  const color=[.56+.17*sky-.30*ground+.18*horizon+.18*softbox,.64+.17*sky-.35*ground+.12*horizon+.16*softbox,.71+.18*sky-.44*ground+.08*horizon+.13*softbox];
  const i=(y*width+x)*4;for(let c=0;c<3;c++)pixels[i+c]=Math.round(Math.min(1,color[c])*255);pixels[i+3]=255;
 }
 const texture=new T.DataTexture(pixels,width,height,T.RGBAFormat);texture.mapping=T.EquirectangularReflectionMapping;texture.colorSpace=T.SRGBColorSpace;texture.needsUpdate=true;
 const generator=new T.PMREMGenerator(renderer),target=generator.fromEquirectangular(texture);generator.dispose();texture.dispose();
 scene.environment=target.texture;scene.environmentIntensity=1.2;scene.environmentRotation.x=Math.PI/2;
 return()=>{if(scene.environment===target.texture)scene.environment=null;target.dispose();};
}
