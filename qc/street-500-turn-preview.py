"""CPU visual evidence only; does not execute either preceding audit."""
import json,math,sys
from pathlib import Path
sys.path.insert(0,'D:/CodexTools/python-libs')
from shapely.geometry import shape,LineString,Polygon,box
from shapely.ops import unary_union,transform
from PIL import Image,ImageDraw,ImageFont
root=Path(__file__).resolve().parents[1]
origin=(77.59136,12.97984615);circ=2*math.pi*6371008.8*math.cos(math.radians(origin[1]))
my=lambda lat:math.asinh(math.tan(math.radians(lat)))/(2*math.pi)
def local(lon,lat,z=None):return((lon-origin[0])*circ/360,(my(lat)-my(origin[1]))*circ)
candidate=json.loads((root/'qc/street-500-turn-candidate.geojson').read_text())['features'][0]
before=json.loads((root/'qc/street-500-loop-preview.geojson').read_text())['features'][2]
after_path=transform(local,shape(candidate['geometry']));before_path=transform(local,shape(before['geometry']))
ground=unary_union([transform(local,shape(f['geometry'])) for f in json.loads((root/'experiments/osm2world/coverage-500-classified/asset/vidhana-footprint.geojson').read_text())['features']])
minx,miny,maxx,maxy=before_path.union(after_path).bounds;cx,cy=(minx+maxx)/2,(miny+maxy)/2
extent=max(maxx-minx,maxy-miny)+24;scale=570/extent
image=Image.new('RGB',(1260,950),'#eef3f5');draw=ImageDraw.Draw(image)
font=ImageFont.truetype('C:/Windows/Fonts/arial.ttf',19);small=ImageFont.truetype('C:/Windows/Fonts/arial.ttf',15)
draw.text((25,20),'Existing roads, better turning geometry',font=font,fill='#133246')
draw.text((25,53),'CPU plan view. Existing source cycle; legal junction envelopes still need verification. No ground added.',font=small,fill='#375466')
visible=ground.intersection(box(cx-extent/2,cy-extent/2,cx+extent/2,cy+extent/2))
polygons=list(visible.geoms) if hasattr(visible,'geoms') else[visible]
for panel,path in enumerate((before_path,after_path)):
    def pixel(p):return(panel*630+315+(p[0]-cx)*scale,415-(p[1]-cy)*scale)
    draw.rectangle((panel*630+20,105,panel*630+610,725),fill='#d7dfcf',outline='#a9b7b9')
    for p in polygons:
        if p.geom_type!='Polygon':continue
        draw.polygon([pixel(v) for v in p.exterior.coords],fill='#657982')
        for r in p.interiors:draw.polygon([pixel(v) for v in r.coords],fill='#d7dfcf')
    color='#f34e57' if panel==0 else '#27eaa9'
    draw.line([pixel(p) for p in path.coords],fill=color,width=3)
    if panel:
        for fraction in (.03,.25,.5,.72):
            d=path.length*fraction;p=path.interpolate(d);q=path.interpolate((d+.02)%path.length);dx,dy=q.x-p.x,q.y-p.y;l=math.hypot(dx,dy);dx/=l;dy/=l
            corners=[(p.x+f*dx-s*dy,p.y+f*dy+s*dx) for f,s in [(2.3,1.05),(2.3,-1.05),(-2.3,-1.05),(-2.3,1.05)]]
            draw.polygon([pixel(v) for v in corners],fill='#ecfff6',outline='#007858',width=2)
    draw.text((panel*630+25,750),'CURRENT QUADRATIC TURNS' if not panel else 'GEOMETRY-CONSTRAINED CANDIDATE',font=font,fill='#133246')
    draw.text((panel*630+25,785),'203 m loop. 33 / 407 cab poses leave ground.' if not panel else '164.36 m loop. 0 / 1,644 cab poses leave asphalt.',font=small,fill='#375466')
    draw.text((panel*630+25,815),'Sharp turns cut beyond the available road surface.' if not panel else 'Minimum measured radius: 5.08 m. Forward progress only.',font=small,fill='#375466')
draw.text((25,875),'Cab envelope: 4.6 x 1.9 m plus 0.1 m side margin. Candidate remains an offline feasibility result.',font=font,fill='#133246')
draw.text((25,909),'Still required: source-linked junction envelopes, curb heights, steering transitions, signals and multi-car tests.',font=small,fill='#375466')
image.save(root/'qc/street-500-turn-feasibility.png')
