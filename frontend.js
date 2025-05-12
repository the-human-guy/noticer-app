      const $log = console.log.bind(console);
      const body = document.body
      const originalBodyInnerHTML = body.innerHTML
      const originalPre = body.querySelector('pre')

      body.innerHTML += `
            <!-- SUMMERNOTE DEPS START -->
    <!-- include libraries(jQuery, bootstrap) -->
    <link href="https://stackpath.bootstrapcdn.com/bootstrap/3.4.1/css/bootstrap.min.css" rel="stylesheet" />

    <!-- include summernote css/js -->
    <link href="https://cdn.jsdelivr.net/npm/summernote@0.9.0/dist/summernote.min.css" rel="stylesheet" /${'>'}
    <!-- SUMMERNOTE DEPS END -->

      `

      ;[
        'https://code.jquery.com/jquery-3.5.1.min.js',
        'https://stackpath.bootstrapcdn.com/bootstrap/3.4.1/js/bootstrap.min.js',
        'https://cdn.jsdelivr.net/npm/summernote@0.9.0/dist/summernote.min.js',
      ].forEach(sSrc => {
        var script = document.createElement('script');
        script.src = sSrc;
        script.async = false;
        // document.head.appendChild(script);
        document.body.appendChild(script);
      })


      function initSummernote() {
        // init summernote
        $(document).ready(function () {
          $("#summernote").summernote();
        });
        $("#summernote").on("summernote.enter", function (we, e) {
          // $(this).summernote("pasteHTML", `&nbsp\n&nbsp`);
          $(this).summernote("insertText", `\n`);
          e.preventDefault();
        });

        // prepend summernote div
        body.innerHTML += `
        <div><button onclick="onFileSave()">Save</button></div>
      <div id="summernote"></div>`

        $("#summernote").summernote("code", originalPre.outerHTML);
        body.querySelector('pre').style.display = 'none'

        function downloadFile(file) {
          const tempEl = document.createElement('a')
          body.appendChild(tempEl)
          const url = window.URL.createObjectURL(file)
          tempEl.href = url
          tempEl.download = file.name
          tempEl.click()
          window.URL.revokeObjectURL(url)
        }

        function downloadText (text, fileName = 'new-file.html') {
          return downloadFile(
            new File([new Blob([text])], fileName, { type: 'text/html' }),
          )
        }

        window.onFileSave = function onFileSave() {
          const text = $('#summernote').summernote('code')
          // $log(originalBodyInnerHTML)
          // window.x = originalBodyInnerHTML
          // var z = document.createElement('div')
          // z.innerHTML = originalBodyInnerHTML
          // z.querySelector('pre').outerHTML = text
          // downloadText(`<body>\n${z.innerHTML}\n</body>`, document.title)
          downloadText(`<body>\n${text}\n</body>`, document.title)
          // $log(z.innerHTML)
          // document.createElement
          // originalPre.innerHTML = text
          // downloadText(body.innerHTML, document.title)
        }
        // end init summernote
      }
      setTimeout(initSummernote, 1000)
