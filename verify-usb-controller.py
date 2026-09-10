import ctypes,json
class Pad(ctypes.Structure):
 _fields_=[('buttons',ctypes.c_ushort),('lt',ctypes.c_ubyte),('rt',ctypes.c_ubyte),('lx',ctypes.c_short),('ly',ctypes.c_short),('rx',ctypes.c_short),('ry',ctypes.c_short)]
class State(ctypes.Structure):_fields_=[('packet',ctypes.c_ulong),('pad',Pad)]
x=ctypes.WinDLL('xinput1_4.dll');result=[]
for i in range(4):
 s=State();code=x.XInputGetState(i,ctypes.byref(s));result.append({'slot':i,'connected':code==0,'code':code,'buttons':s.pad.buttons,'leftStick':[s.pad.lx,s.pad.ly],'triggers':[s.pad.lt,s.pad.rt]})
print(json.dumps(result))
