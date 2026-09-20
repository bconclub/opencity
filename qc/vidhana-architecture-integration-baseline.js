// Building-part geometry and material tags from OSM.
export function buildLandmarks(T,data,xy){
 const group=new T.Group();
 return{group,domes:0,parts:data.features.length};
}
