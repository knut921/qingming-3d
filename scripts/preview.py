"""Preview the built site from any working directory without Node.js."""
from pathlib import Path
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from functools import partial
import webbrowser
root=Path(__file__).resolve().parent.parent/'docs'
server=ThreadingHTTPServer(('127.0.0.1',0),partial(SimpleHTTPRequestHandler,directory=str(root)))
url=f'http://127.0.0.1:{server.server_port}/'
print(f'虹橋互動網站已開啟：{url}',flush=True)
print('關閉此終端機視窗，或按 Control+C，即可停止本機預覽。',flush=True)
webbrowser.open(url)
try:server.serve_forever()
except KeyboardInterrupt:pass
finally:server.server_close()
