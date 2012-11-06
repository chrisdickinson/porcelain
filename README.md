# porcelain

A tiny helper library for using plate templates in Node point JS.

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
