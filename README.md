## run

`python ./serve_notes.py`

OR 

`python ./serve_notes.py --dir ~/path_to_notes --port 8000`

OR V2

`python ./serve_notes_v2.py --dir ~/tmp --fe-script-name frontend-froala.js`

## done
- stop messing up proper ul>li lists (or use plaintext lists instead) -- fixed with `htmlUntouched: true`
- don't escape anything except mandatory (&, >, <) -- fixed with `entities: '&amp;&lt;&gt;'`


## todo
- don't turn `<b>` into `<strong>`