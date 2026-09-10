import socket,json
with socket.create_connection(('127.0.0.1',9876),timeout=20) as s:
 s.sendall(json.dumps({'type':'get_scene_info','params':{}}).encode())
 s.settimeout(20);data=b''
 while True:
  data+=s.recv(65536)
  try:
   result=json.loads(data);print(json.dumps(result)[:2500]);break
  except json.JSONDecodeError:pass
