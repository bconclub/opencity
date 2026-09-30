import numpy as np
from pathlib import Path
O=Path('qc/release-0.0.41')
for kind,cy,cz,r in [('cybertruck',1.955,.450,.44),('cybertruck',-1.714,.450,.44),('kitt',1.218,.323,.317),('kitt',-1.418,.323,.326),('yulu',.715,.254,.233),('yulu',-.573,.254,.240),('delivery',.70,.24,.24),('delivery',-.66,.24,.24)]:
 v=np.load(O/f'{kind}-normalized-positions.npy');w=v[(abs(v[:,1]-cy)<r*.7)&(v[:,2]<cz-r*.55)]
 print(kind,cy,'x',np.quantile(w[:,0],[0,.02,.1,.25,.5,.75,.9,.98,1]).tolist(),'yz',w[:,1:].min(0),w[:,1:].max(0))
