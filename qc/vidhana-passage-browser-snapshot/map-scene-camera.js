// MapLibre supplies a combined world-to-clip matrix. Keeping a Three camera at
// zero renders geometry correctly but makes PBR reflect toward the scene origin.
// Recover the perspective eye, then factor its translation out of projection.
// projection * matrixWorldInverse remains exactly the original clip transform.
const scratchByCamera=new WeakMap();
export function setMapSceneCamera(T,camera,combined){
 let scratch=scratchByCamera.get(camera);
 if(!scratch){scratch={inverse:new T.Matrix4(),eye:new T.Vector4()};scratchByCamera.set(camera,scratch);}
 const {inverse,eye}=scratch;inverse.copy(combined).invert();eye.set(0,0,1,0).applyMatrix4(inverse);
 const valid=Math.abs(eye.w)>1e-12&&Number.isFinite(eye.x)&&Number.isFinite(eye.y)&&Number.isFinite(eye.z)&&Number.isFinite(eye.w);
 if(valid)camera.position.set(eye.x/eye.w,eye.y/eye.w,eye.z/eye.w);else camera.position.set(0,0,0);
 // This camera is exclusively driven by the supplied clip matrix.
 camera.matrixAutoUpdate=false;camera.matrixWorldAutoUpdate=false;
 camera.matrix.makeTranslation(camera.position.x,camera.position.y,camera.position.z);
 camera.matrixWorld.copy(camera.matrix);camera.matrixWorldInverse.makeTranslation(-camera.position.x,-camera.position.y,-camera.position.z);
 camera.projectionMatrix.copy(combined).multiply(camera.matrixWorld);
 camera.projectionMatrixInverse.copy(camera.projectionMatrix).invert();
 return valid;
}
