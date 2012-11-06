# porcelain

A tiny helper library for using plate templates in Node point JS.

```javascript

// myproject/index.js
var porcelain = require('porcelain')
  , loader

// automatically configures plate
// to load templates from `myproject/templates/`
// and returns a nice loader function.
loader = porcelain()

// or you can specify your own directory,
// relative to the current file (`myproject/mytemplates`)
loader = porcelain('mytemplates')

// or multiple directories...
loader = porcelain('mytemplates', 'yourtemplates')

// or absolute directories.
loader = porcelain('/var/www/templates/lolwat.html')

// the loader can be used like a typical node.js callback function:
loader('my_template.html', function(err, template) {
    ...
})


// or to create readable streams suitable for piping
// to responses!

http.createServer(function(request, response) {
  var output = loader.createReadStream('my_template.html')
  output.pipe(response)
  output.code = 200
  output.context.variable = 3
})

// and they can be paused, if you need to do some extra work.

http.createServer(function(request, response) {
  var stream = loader.createReadStream('my_template.html')

  stream.pause()
  request.db.get('some query', got_data)
  return stream.pipe(response)

  function got_data(err, data) {
    stream.context.result = data
    stream.code = err ? 404 : 200
    stream.resume()
  }
})

```

## Installation

`npm install porcelain`

## API

### require('porcelain') -> porcelain

### porcelain([template_dir, ...]) -> loadTemplate(name, ready)

Set `plate` to attempt to load templates from each of the provided `template_dir`
arguments. If the paths are relative (they do not begin with a `/`), they will be 
considered relative to the file of the caller.

### loadTemplate(name, function(err, template)) -> undefined

Attempts to load a template given a name.

If successful, the callback will be called with `null` as the first argument
and the `plate.Template` object as the second argument.

### loadTemplate.createReadStream(name) -> stream

Return a readable stream suitable for piping to, e.g., a `ServerResponse`
object.

### stream.pause()

Pause the stream. Headers and status code on the stream will not
be passed to any piped writable stream until `stream.resume()` is called.

### stream.resume()

Resume the stream. Calls `response.writeHead(stream.code, stream.headers)`
on any `ServerResponse` the stream is piped to.

### stream.context

The context with which to render the loaded template with.

Defaults to `{}`.

### stream.code

The HTTP status code to be set when piping to a `ServerResponse`
object.

Defaults to `200`.

### stream.headers

The headers (as a an object literal) to be set when piping to a
`ServerResponse` object.

Defaults to `{'content-type': 'text/html'}`.

## License

MIT
