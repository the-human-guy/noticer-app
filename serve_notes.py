import http.server
import socketserver
import os
import sys
import argparse

# Meta tag to ensure UTF-8 encoding
META_CHARSET = '<meta charset="UTF-8">'

# Path to frontend.js (same directory as this script)
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
EDITOR_JS_PATH = os.path.join(SCRIPT_DIR, 'frontend.js')

# Read frontend.js content
def get_js_script():
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
        # Handle .html files specifically
        if self.path.endswith('.html'):
            try:
                # Construct the full path to the file
                file_path = os.path.join(self.directory, self.path.lstrip('/'))
                if not os.path.exists(file_path):
                    self.send_error(404, 'File not found')
                    return
                
                # Read the original HTML file
                with open(file_path, 'rb') as f:
                    content = f.read().decode('utf-8')
                
                # Inject the meta charset tag if not present
                modified_content = content
                if '<meta charset' not in content.lower():
                    if '<head>' in content:
                        modified_content = content.replace(
                            '<head>', f'<head>{META_CHARSET}', 1
                        )
                    else:
                        modified_content = f'{META_CHARSET}\n{content}'
                
                # Inject the frontend.js content before </body>
                if '</body>' in modified_content:
                    modified_content = modified_content.replace(
                        '</body>', f'{get_js_script()}</body>', 1
                    )
                    print(f'{get_js_script()}')
                else:
                    modified_content = f'{modified_content}\n{get_js_script()}'
                
                # Send the modified content with explicit UTF-8 encoding
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
        
        # Delegate all other requests (e.g., images, directory listing) to the default handler
        super().do_GET()

    def do_PUT(self):
        # Handle saving existing files
        try:
            file_path = os.path.join(self.directory, self.path.lstrip('/'))
            # Ensure the directory exists
            os.makedirs(os.path.dirname(file_path), exist_ok=True)
            # Read the request body
            content_length = int(self.headers['Content-Length'])
            content = self.rfile.read(content_length).decode('utf-8')
            # Write the content to the file
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(content)
            self.send_response(200)
            self.send_header('Content-type', 'text/plain')
            self.end_headers()
            self.wfile.write(b'File saved successfully')
        except Exception as e:
            self.send_error(500, f'Error saving file: {e}')

    def do_POST(self):
        # Handle creating new files (same as PUT, overwrites if exists)
        try:
            file_path = os.path.join(self.directory, self.path.lstrip('/'))
            # Ensure the directory exists
            os.makedirs(os.path.dirname(file_path), exist_ok=True)
            # Read the request body
            content_length = int(self.headers['Content-Length'])
            content = self.rfile.read(content_length).decode('utf-8')
            # Write the content to the file
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(content)
            self.send_response(201)
            self.send_header('Content-type', 'text/plain')
            self.end_headers()
            self.wfile.write(b'File created successfully')
        except Exception as e:
            self.send_error(500, f'Error creating file: {e}')

def main():
    # Parse command-line arguments
    parser = argparse.ArgumentParser(description='Simple HTTP server with script injection for HTML files')
    parser.add_argument(
        '--dir',
        default=os.getcwd(),
        help='Directory to serve (default: current directory)'
    )
    parser.add_argument(
        '--port',
        type=int,
        default=8000,
        help='Port to serve on (default: 8000)'
    )
    args = parser.parse_args()

    # Resolve the directory path
    serve_dir = os.path.abspath(args.dir)
    if not os.path.isdir(serve_dir):
        print(f"Error: Directory '{serve_dir}' does not exist.")
        sys.exit(1)

    # Change to the specified directory to ensure relative paths work
    os.chdir(serve_dir)

    # Set up the server with SO_REUSEADDR
    with socketserver.TCPServer(("", args.port), CustomHandler) as httpd:
        # Enable SO_REUSEADDR to allow immediate port reuse
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
