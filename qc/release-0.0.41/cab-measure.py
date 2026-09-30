import numpy as np,json
from pathlib import Path
p=Path(__file__).parent;a=np.load(p/'cab-vertices-game.npy');r=json.loads((p/'cab-wheel-audit.json').read_text());w={}
for tag,x,y in [('FL',-.802,1.374),('FR',.802,1.374),('RL',-.802,-1.261),('RR',.802,-1.261)]:
 b=a[(np.abs(a[:,1]-y)<.39)&(np.abs(a[:,0]-x)<.19)&(a[:,2]<.75)]
 lower=b[b[:,2]<.15]
 bounds=[lower.min(0).tolist(),lower.max(0).tolist()]
 w[tag]={'center':[x,y,.358],'radius':.38,'width':.234,'precisionMeters':.015,'method':'orthographic original-source hub center and tyre silhouette metrology, 230.769 pixels/metre; lower tyre vertex bounds cross-check','lowerTyreBounds':bounds}
r.update({'correctYaw':-np.pi/2,'orientationConfidence':'high','orientationEvidence':'original-side shows nose, windshield and steering wheel toward +Y; original-front shows thin headlights and front seats. Current +PI/2 maps rear to +Y.','wheels':w,'wheelbase':2.635,'track':1.604,'bodyIntrusion':'Source body skirt and arch trim enter wheel cylinder. Whole-connected-island split previously captured body shards. Pure radial triangle partition is not semantic and cannot guarantee no moving fender/body fragments. Tight cylinder leaves stationary tyre fragments; broad cylinder captures trim. Review spin and steering on all four wheels before acceptance.','recommendedApproach':'Manually classify original faces into four semantic wheel groups in Blender, retaining UVs, normals, material and every triangle. Split original triangle buffers into fixed and wheel draws, no wheel rebuilding or texture edits. Preserve original files.','status':'Measurements and render evidence complete. Automatic wheel partition NOT approved based on source geometry.','renders':['cab-original-side.png','cab-original-front.png','cab-original-rear.png']})
(p/'cab-wheel-audit.json').write_text(json.dumps(r,indent=2));print(json.dumps(w),flush=True)
