import http.server
import socketserver
import os
import sys
import argparse

# Meta tag to ensure UTF-8 encoding
META_CHARSET = '<meta charset="UTF-8">'
# Doctype to ensure standards mode
DOCTYPE = '<!DOCTYPE html>'
# Path to public directory for static files
PUBLIC_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'public')


FE_SCRIPT_NAME = 'frontend.js'

# Read frontend.js content
def get_js_script():
    # Path to frontend.js (same directory as this script)
    SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
    EDITOR_JS_PATH = os.path.join(SCRIPT_DIR, FE_SCRIPT_NAME)

    try:
        with open(EDITOR_JS_PATH, 'r', encoding='utf-8') as f:
            EDITOR_SCRIPT_CONTENT = f.read()
        EDITOR_SCRIPT = f'<script>{EDITOR_SCRIPT_CONTENT}</script>'
    except FileNotFoundError:
        print(f"Error: 'frontend.js' not found in {SCRIPT_DIR}")
        sys.exit(1)
    except UnicodeDecodeError:
        print(f"Error: 'frontend.js' is not valid UTF-8 encoded")
        sys.exit(1)
    return EDITOR_SCRIPT

class CustomHandler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        # Handle static files from /public/
        if self.path.startswith('/public/'):
            file_path = os.path.join(PUBLIC_DIR, self.path.lstrip('/public/'))
            if not os.path.exists(file_path):
                self.send_error(404, 'File not found')
                return
            try:
                with open(file_path, 'rb') as f:
                    content = f.read()
                # Set content type based on file extension
                if self.path.endswith('.js'):
                    content_type = 'application/javascript'
                else:
                    content_type = 'application/octet-stream'
                self.send_response(200)
                self.send_header('Content-type', content_type)
                self.end_headers()
                self.wfile.write(content)
                return
            except Exception as e:
                self.send_error(500, f'Error serving file: {e}')
                return

        # Handle .html files specifically
        if self.path.endswith('.html'):
            try:
                file_path = os.path.join(self.directory, self.path.lstrip('/'))
                if not os.path.exists(file_path):
                    self.send_error(404, 'File not found')
                    return
                with open(file_path, 'rb') as f:
                    content = f.read().decode('utf-8')
                modified_content = content
                if not content.lower().strip().startswith('<!doctype'):
                    modified_content = f'{DOCTYPE}\n{content}'
                if '<meta charset' not in modified_content.lower():
                    if '<head>' in modified_content:
                        modified_content = modified_content.replace(
                            '<head>', f'<head>{META_CHARSET}', 1
                        )
                    else:
                        modified_content = modified_content.replace(
                            DOCTYPE, f'{DOCTYPE}\n{META_CHARSET}', 1
                        ) if DOCTYPE in modified_content else f'{META_CHARSET}\n{modified_content}'
                js_script = get_js_script()
                if '</body>' in modified_content:
                    modified_content = modified_content.replace(
                        '</body>', f'{js_script}</body>', 1
                    )
                else:
                    modified_content = f'{modified_content}\n{js_script}'
                self.send_response(200)
                self.send_header('Content-type', 'text/html; charset=utf-8')
                self.end_headers()
                self.wfile.write(modified_content.encode('utf-8'))
                return
            except UnicodeDecodeError:
                self.send_error(500, 'Error: File is not valid UTF-8 encoded')
                return
            except Exception as e:
                self.send_error(500, f'Error processing file: {e}')
                return

        # Delegate other requests to default handler
        super().do_GET()

    def do_PUT(self):
        try:
            file_path = os.path.join(self.directory, self.path.lstrip('/'))
            os.makedirs(os.path.dirname(file_path), exist_ok=True)
            content_length = int(self.headers['Content-Length'])
            content = self.rfile.read(content_length).decode('utf-8')
            if not content.lower().strip().startswith('<!doctype'):
                content = f'{DOCTYPE}\n{content}'
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(content)
            self.send_response(200)
            self.send_header('Content-type', 'text/plain')
            self.end_headers()
            self.wfile.write(b'File saved successfully')
        except Exception as e:
            self.send_error(500, f'Error saving file: {e}')

    def do_POST(self):
        try:
            file_path = os.path.join(self.directory, self.path.lstrip('/'))
            os.makedirs(os.path.dirname(file_path), exist_ok=True)
            content_length = int(self.headers['Content-Length'])
            content = self.rfile.read(content_length).decode('utf-8')
            if not content.lower().strip().startswith('<!doctype'):
                content = f'{DOCTYPE}\n{content}'
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(content)
            self.send_response(201)
            self.send_header('Content-type', 'text/plain')
            self.end_headers()
            self.wfile.write(b'File created successfully')
        except Exception as e:
            self.send_error(500, f'Error creating file: {e}')

def main():
    parser = argparse.ArgumentParser(description='Simple HTTP server with script injection for HTML files')
    parser.add_argument('--dir', default=os.getcwd(), help='Directory to serve (default: current directory)')
    parser.add_argument('--port', type=int, default=8000, help='Port to serve on (default: 8000)')
    parser.add_argument('--fe-script-name', type=str, default='frontend.js', help='Frontend script name, to be embedded into html files')
    args = parser.parse_args()
    global FE_SCRIPT_NAME
    FE_SCRIPT_NAME = args.fe_script_name
    serve_dir = os.path.abspath(args.dir)
    if not os.path.isdir(serve_dir):
        print(f"Error: Directory '{serve_dir}' does not exist.")
        sys.exit(1)
    os.chdir(serve_dir)
    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer(("", args.port), CustomHandler) as httpd:
        httpd.socket.setsockopt(socketserver.socket.SOL_SOCKET, socketserver.socket.SO_REUSEADDR, 1)
        print(f"Serving directory '{serve_dir}' at http://localhost:{args.port}")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nShutting down server...")
            httpd.server_close()
            print("Server stopped.")

if __name__ == '__main__':
    main()
