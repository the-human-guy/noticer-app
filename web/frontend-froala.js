// Supported Froala version is 4.5.2

const $log = console.log.bind(console);
const body = document.body;

function initEditor() {
  const imgsToBeRemovedFromServer = [];

  // Init Summernote
  $(document).ready(function () {
    window.editor = new FroalaEditor("#editor-anchor", {
      // htmlAllowedTags: ['a', 'abbr', 'address', 'area', 'article', 'aside', 'audio', 'b', 'base', 'bdi', 'bdo', 'blockquote', 'br', 'button', 'canvas', 'caption', 'cite', 'code', 'col', 'colgroup', 'datalist', 'dd', 'del', 'details', 'dfn', 'dialog', 'div', 'dl', 'dt', 'em', 'embed', 'fieldset', 'figcaption', 'figure', 'footer', 'form', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'header', 'hgroup', 'hr', 'i', 'iframe', 'img', 'input', 'ins', 'kbd', 'keygen', 'label', 'legend', 'li', 'link', 'main', 'map', 'mark', 'menu', 'menuitem', 'meter', 'nav', 'noscript', 'object', 'ol', 'optgroup', 'option', 'output', 'p', 'param', 'pre', 'progress', 'queue', 'rp', 'rt', 'ruby', 's', 'samp', 'script', 'style', 'section', 'select', 'small', 'source', 'span', 'strike', 'strong', 'sub', 'summary', 'sup', 'table', 'tbody', 'td', 'textarea', 'tfoot', 'th', 'thead', 'time', 'title', 'tr', 'track', 'u', 'ul', 'var', 'video', 'wbr'],
      htmlRemoveTags: [], // default is ['script', 'style']
      pastePlain: true, // Avoids formatting during paste
      multiline: true,
      htmlUntouched: true, // prevents froala from collapsing ul>li lists
      entities: "&amp;&lt;&gt;", // Only escape &, <, >
      codeBeautifierOptions: {
        end_with_newline: true, // last line of file is newline
        indent_inner_html: true, // indent nested tags
        brace_style: "expand", // don't collapse style and script tags
        indent_char: " ",
        indent_size: 4,
      },
      enter: FroalaEditor.ENTER_BR,
      saveURL: window.location.pathname,
      saveMethod: "PUT",
      events: {
        "save.before": function () {
          // Before save request is made.
        },

        "save.after": function () {
          imgsToBeRemovedFromServer.forEach((imgUrl) => {
            fetch(imgUrl, { method: "DELETE" });
          });
          imgsToBeRemovedFromServer.length = 0;
        },

        "save.error": function () {
          // Do something here.
        },

        "image.removed": function ($img) {
          imgsToBeRemovedFromServer.push(new URL($img[0].src).pathname);
        },
      },
      // autosave
      // saveInterval: 10000, // default
      saveInterval: 0, // turn autosave off
      imageUploadURL: "/upload-image",
      imageUploadParams: {
        filePath: location.pathname,
      },
    });

    function downloadFile(file) {
      const tempEl = document.createElement("a");
      body.appendChild(tempEl);
      const url = window.URL.createObjectURL(file);
      tempEl.href = url;
      tempEl.download = file.name;
      tempEl.click();
      window.URL.revokeObjectURL(url);
    }

    function downloadText(text, fileName = "new-file.html") {
      return downloadFile(new File([new Blob([text])], fileName, { type: "text/html" }));
    }

    window.onFileSave = function onFileSave() {
      const text = $("#summernote").summernote("code");
      downloadText(`<body>\n${text}\n</body>`, document.title);
    };

    window.onServerSave = async function onServerSave() {
      window.editor.save.save();
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
      const fileName = prompt("Enter file name (e.g., new-note.html):");
      if (!fileName) return;
      const filePath = `/${fileName.endsWith(".html") ? fileName : fileName + ".html"}`;
      const content = `<body><pre>New Note</pre></body>`;
      try {
        const response = await fetch(filePath, {
          method: "POST",
          headers: { "Content-Type": "text/html" },
          body: content,
        });
        if (response.ok) {
          alert("New note created successfully");
          // Redirect to the new note
          window.location.href = filePath;
        } else {
          alert("Error creating note: " + response.statusText);
        }
      } catch (e) {
        alert("Error creating note: " + e);
      }
    };
  });
}

setTimeout(initEditor, 1000);
