from http.server import HTTPServer, SimpleHTTPRequestHandler
import ssl

class CORSRequestHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', '*')
        SimpleHTTPRequestHandler.end_headers(self)

    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()

# Create the server
httpd = HTTPServer(('0.0.0.0', 8000), CORSRequestHandler)

# Create SSL context
ssl_context = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
ssl_context.load_cert_chain(certfile='cert.pem', keyfile='key.pem')

# Wrap the socket with SSL
httpd.socket = ssl_context.wrap_socket(httpd.socket, server_side=True)

print("Serving HTTPS on 0.0.0.0:8000...")
httpd.serve_forever()
