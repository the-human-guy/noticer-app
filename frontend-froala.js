const $log = console.log.bind(console);
const body = document.body;



function initEditor() {
    // Init Summernote
    $(document).ready(function () {
        window.editor = new FroalaEditor('#editor-anchor', {
            multiline: true,
            /* htmlUntouched: true, */
             codeBeautifierOptions: {
               end_with_newline: true,
           indent_inner_html: true,
               extra_liners: "['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'pre', 'ul', 'ol', 'table', 'dl']",
               brace_style: 'expand',
               indent_char: ' ',
               indent_size: 4,
               wrap_line_length: 0
             },
            enter: FroalaEditor.ENTER_BR,
            saveURL: window.location.pathname,
            saveMethod: 'PUT',
            events: {
                'save.before': function () {
                  // Before save request is made.
                },
          
                'save.after': function () {
                  // After successfully save request.
                },
          
                'save.error': function () {
                  // Do something here.
                }
              },
              saveInterval: 10000, // default
              imageUploadURL: '/upload-image',
              imageUploadParams: {
                filePath: location.pathname,
              },
           })

        function downloadFile(file) {
            const tempEl = document.createElement('a');
            body.appendChild(tempEl);
            const url = window.URL.createObjectURL(file);
            tempEl.href = url;
            tempEl.download = file.name;
            tempEl.click();
            window.URL.revokeObjectURL(url);
        }

        function downloadText(text, fileName = 'new-file.html') {
            return downloadFile(
                new File([new Blob([text])], fileName, { type: 'text/html' }),
            );
        }

        window.onFileSave = function onFileSave() {
            const text = $('#summernote').summernote('code');
            downloadText(`<body>\n${text}\n</body>`, document.title);
        };

        window.onServerSave = async function onServerSave() {
            window.editor.save.save()
            // const text = $('#summernote').summernote('code');
            // const content = `<body>\n${text}\n</body>`;
            // const filePath = window.location.pathname;
            // try {
            //     const response = await fetch(filePath, {
            //         method: 'PUT',
            //         headers: { 'Content-Type': 'text/html' },
            //         body: content
            //     });
            //     if (response.ok) {
            //         alert('File saved successfully on server');
            //     } else {
            //         alert('Error saving file: ' + response.statusText);
            //     }
            // } catch (e) {
            //     alert('Error saving file: ' + e);
            // }
        };

        window.onCreateNewNote = async function onCreateNewNote() {
            const fileName = prompt('Enter file name (e.g., new-note.html):');
            if (!fileName) return;
            const filePath = `/${fileName.endsWith('.html') ? fileName : fileName + '.html'}`;
            const content = `<body><pre>New Note</pre></body>`;
            try {
                const response = await fetch(filePath, {
                    method: 'POST',
                    headers: { 'Content-Type': 'text/html' },
                    body: content
                });
                if (response.ok) {
                    alert('New note created successfully');
                    // Redirect to the new note
                    window.location.href = filePath;
                } else {
                    alert('Error creating note: ' + response.statusText);
                }
            } catch (e) {
                alert('Error creating note: ' + e);
            }
        };
    });
}

setTimeout(initEditor, 1000);
