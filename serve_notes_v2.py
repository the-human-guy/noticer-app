import http.server
import socketserver
import os
import sys
import argparse
import urllib.parse  # Added for parsing URL-encoded FormData
import cgi  # Added for parsing multipart FormData
import uuid  # Added for generating unique image filenames
import mimetypes  # Added for guessing image extensions

# Meta tag to ensure UTF-8 encoding
META_CHARSET = '<meta charset="UTF-8">'
# Doctype to ensure standards mode
DOCTYPE = '<!DOCTYPE html>'
# Path to public directory for static files
PUBLIC_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'public')

FE_SCRIPT_NAME = 'frontend.js'
UI_HTML_NAME = 'ui.html'

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

# Read ui.html content
def get_ui_html():
    # Path to ui.html (same directory as this script)
    SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
    EDITOR_JS_PATH = os.path.join(SCRIPT_DIR, UI_HTML_NAME)

    try:
        with open(EDITOR_JS_PATH, 'r', encoding='utf-8') as f:
            UI_HTML_CONTENT = f.read()
        UI_HTML = UI_HTML_CONTENT
    except FileNotFoundError:
        print(f"Error: 'UI HTML' not found in {SCRIPT_DIR}")
        sys.exit(1)
    except UnicodeDecodeError:
        print(f"Error: 'UI HTML' is not valid UTF-8 encoded")
        sys.exit(1)
    return UI_HTML

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
                
                js_script = get_js_script()
                result_html = get_ui_html()
                result_html = result_html.replace(
                    'frontend_script_placeholder', js_script, 1
                )
                result_html = result_html.replace(
                    'note_content_placeholder', content, 1
                )
                
                self.send_response(200)
                self.send_header('Content-type', 'text/html; charset=utf-8')
                self.end_headers()
                self.wfile.write(result_html.encode('utf-8'))
                return
            except UnicodeDecodeError:
                self.send_error(500, 'Error: File is not valid UTF-8 encoded')
                return
            except Exception as e:
                self.send_error(500, f'Error processing file: {e}')
                return

        # Delegate other requests to default handler
        super().do_GET()

    # Helper method to parse FormData
    def parse_form_data(self, content_length):
        content_type = self.headers.get('Content-Type', '').lower()
        
        # Handle application/x-www-form-urlencoded (e.g., body=encoded_content)
        if 'application/x-www-form-urlencoded' in content_type:
            raw_data = self.rfile.read(content_length).decode('utf-8')
            parsed_data = urllib.parse.parse_qs(raw_data, keep_blank_values=True)
            # Assuming the content is in a field named 'body'
            content = parsed_data.get('body', [''])[0]
            return urllib.parse.unquote(content)  # Decode URL-encoded content

        # Handle multipart/form-data
        elif 'multipart/form-data' in content_type:
            # Use cgi.FieldStorage to parse multipart/form-data
            form = cgi.FieldStorage(
                fp=self.rfile,
                headers=self.headers,
                environ={'REQUEST_METHOD': 'POST'},
                keep_blank_values=True
            )
            result = {}
            for key in form.keys():
                if form[key].filename:  # File field (e.g., 'file')
                    result[key] = {
                        'filename': form[key].filename,
                        'data': form[key].file.read()
                    }
                else:  # Text field (e.g., 'filePath' or 'body')
                    result[key] = form[key].value
            return result

        return None  # Not a FormData content type

    def do_PUT(self):
        try:
            file_path = os.path.join(self.directory, self.path.lstrip('/'))
            os.makedirs(os.path.dirname(file_path), exist_ok=True)
            content_length = int(self.headers['Content-Length'])
            
            # Check if the request is FormData and parse accordingly
            content = self.parse_form_data(content_length)
            
            # If not FormData, assume raw HTML
            if content is None:
                content = self.rfile.read(content_length).decode('utf-8')
            
            # if not content.lower().strip().startswith('<!doctype'):
            #     content = f'{DOCTYPE}\n{content}'
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(content)
            self.send_response(200)
            self.send_header('Content-type', 'text/plain')
            self.end_headers()
            self.wfile.write(b'File saved successfully')
        except Exception as e:
            self.send_error(500, f'Error saving file: {e}')

    def do_POST(self):
        # Handle image upload endpoint
        if self.path == '/upload-image':
            try:
                content_length = int(self.headers['Content-Length'])
                form_data = self.parse_form_data(content_length)
                
                if not form_data or 'filePath' not in form_data or 'file' not in form_data:
                    self.send_error(400, 'Missing filePath or file in FormData')
                    return

                # Extract filePath and file data
                file_path = form_data['filePath']
                image_data = form_data['file']['data']
                original_filename = form_data['file']['filename']

                # Determine the directory of the note
                note_dir = os.path.dirname(file_path.lstrip('/'))
                # Create the media directory at the same level
                media_dir = os.path.join(self.directory, note_dir, 'media')
                os.makedirs(media_dir, exist_ok=True)

                # Guess the file extension from the original filename or content
                extension = os.path.splitext(original_filename)[1].lower()
                if not extension:
                    # If no extension, try to guess from the content
                    mime_type, _ = mimetypes.guess_type(original_filename)
                    if mime_type:
                        extension = mimetypes.guess_extension(mime_type) or ''
                
                # Generate a unique filename for the image
                unique_filename = f"{uuid.uuid4()}{extension}"
                image_path = os.path.join(media_dir, unique_filename)

                # Save the image
                with open(image_path, 'wb') as f:
                    f.write(image_data)

                # Construct the relative path to the image for the response
                relative_image_path = os.path.join(note_dir, 'media', unique_filename)
                if not relative_image_path.startswith('/'):
                    relative_image_path = '/' + relative_image_path

                # Return JSON response
                response = f'{{"link": "{relative_image_path}"}}'
                self.send_response(200)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                self.wfile.write(response.encode('utf-8'))
                return

            except Exception as e:
                self.send_error(500, f'Error uploading image: {e}')
                return

        # Original POST handler for HTML content
        try:
            file_path = os.path.join(self.directory, self.path.lstrip('/'))
            os.makedirs(os.path.dirname(file_path), exist_ok=True)
            content_length = int(self.headers['Content-Length'])
            
            # Check if the request is FormData and parse accordingly
            content = self.parse_form_data(content_length)
            
            # If not FormData, assume raw HTML
            if content is None:
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