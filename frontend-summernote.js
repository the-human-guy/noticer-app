const $log = console.log.bind(console);
const body = document.body;
const originalBodyInnerHTML = body.innerHTML;
const originalPre = body.querySelector('pre');

body.innerHTML += `
    <!-- SUMMERNOTE DEPS START -->
    <!-- include libraries(jQuery, bootstrap) -->
    <link href="https://stackpath.bootstrapcdn.com/bootstrap/3.4.1/css/bootstrap.min.css" rel="stylesheet" />

    <!-- include summernote css/js -->
    <link href="https://cdn.jsdelivr.net/npm/summernote@0.9.0/dist/summernote.min.css" rel="stylesheet" />
    <!-- SUMMERNOTE DEPS END -->
`;

[
    'https://code.jquery.com/jquery-3.5.1.min.js',
    'https://stackpath.bootstrapcdn.com/bootstrap/3.4.1/js/bootstrap.min.js',
    // 'https://cdn.jsdelivr.net/npm/summernote@0.9.0/dist/summernote.min.js',
    // 'https://cdn.jsdelivr.net/npm/summernote@0.9.0/dist/summernote.js',
    '/public/summernote.js',
].forEach(sSrc => {
    var script = document.createElement('script');
    script.src = sSrc;
    script.async = false;
    document.body.appendChild(script);
});

function initSummernote() {
    // Init Summernote
    $(document).ready(function () {
        // Prepend Summernote div and buttons
        body.innerHTML += `
            <div>
                <button onclick="onFileSave()">Save</button>
                <button onclick="onServerSave()">Save with Server</button>
                <button onclick="onCreateNewNote()">Create New Note</button>
            </div>
            <div id="summernote"></div>
        `;

        // works like fucking shit. simply use shift+enter always.
        // it's also impossible to make enter work like shift+enter.

        // $("#summernote").on("summernote.enter", function (we, e) {
        //     $(this).summernote("insertText", `\n`);
        //     e.preventDefault();
        // });

        // $("#summernote").on("summernote.enter", function (we, e) {
        //     window.x = $(this)
        //     window.z = we
        //     window.c = e
        //     // $(this).summernote("insertText", `\n`);
        //     e.preventDefault();
        // });

        var context

        $("#summernote").summernote({
            // callbacks: {
            //     onKeydown: function(e) {
            //         if (e.keyCode === 13 && !e.shiftKey) { // Shift+Enter
            //             e.preventDefault();
            //             // $(this).trigger($.Event("keydown", { keyCode: 13, shiftKey: true }));
            //             $('.note-editable')[0].dispatchEvent(new KeyboardEvent('keydown', { key: 13, keyCode: 13, shiftKey: true, repeat: true, isComposing: true }));
            //         }
            //     }
            // }
        });

        $.extend($.summernote.plugins, {
            'brenter': function (context) {
                $log('kekus')
                this.events = {
                    'summernote.enter': function (we, e) {
                        $log('kekus pizdec')
                        // insert 2 br tags (if only one br tag is inserted the cursor won't go to the next line)
                        document.execCommand('insertHTML', false, '<br><br>');
                        e.preventDefault();
                    }
                };
            }
        })

        $("#summernote").summernote("code", originalPre.outerHTML);
        
        body.querySelector('pre').style.display = 'none';

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
            const text = $('#summernote').summernote('code');
            const content = `<body>\n${text}\n</body>`;
            const filePath = window.location.pathname;
            try {
                const response = await fetch(filePath, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'text/html' },
                    body: content
                });
                if (response.ok) {
                    alert('File saved successfully on server');
                } else {
                    alert('Error saving file: ' + response.statusText);
                }
            } catch (e) {
                alert('Error saving file: ' + e);
            }
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

setTimeout(initSummernote, 1000);
