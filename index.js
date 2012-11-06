module.exports = templated

var Stream = require('stream')
  , Path = require('path')

var plate = require('plate')
  , Loader = require('plate/lib/plugins/loaders/filesystem').Loader

var PARENT_DIR = module.parent ? Path.dirname(module.parent.filename) : ''

function templated() {
  var dirs = arguments.length ? [].slice.call(arguments) : ['templates']
    , loader

  for(var i = 0, len = dirs.length; i < len; ++i) {
    dirs[i] = Path.resolve(
      dirs[i].charAt(0) === '/' ? dirs[i] : Path.join(PARENT_DIR, dirs[i])
    )
  }

  loader = new Loader(dirs).getPlugin()

  plate.Template.Meta.registerPlugin('loader', loader)

  get_template.createReadStream = createReadStream

  return get_template

  function get_template(template_name, ready) {
    var result = loader(template_name)

    if(result && result.constructor !== plate.Template) {
      result.once('done', got_template)
      return
    }

    return got_template(template)

    function got_template(template) {
      return template ? ready(null, template) : ready(make_error(template_name))
    }
  }

  function make_error(template_name) {
    return new Error(
      'Could not find '+template_name+'. Tried:\n\t'+
      dirs.map(function(d) { return Path.join(d, template_name) }).join('\n\t')+'\n'
    )
  }

  function createReadStream(template_name) {
    var stream = new Stream
      , wrote_head = false
      , pipe = stream.pipe

    stream.readable = true
    stream.code = 200
    stream.headers = {'content-type':'text/html'}
    stream.context = {}

    stream.resume = function() {
      this.emit('drain')
      this._paused = false
    }

    stream.pause = function() {
      this._paused = true
    }

    stream.paused = function() {
      return this._paused
    }

    stream.pipe = function(response) {
      pipe.call(stream, response)

      if(!response.writeHead)
        return

      if(stream.paused()) {
        return stream.once('drain', write_head)
      }

      write_head()

      function write_head() {
        if(wrote_head)
          return

        wrote_head = true
        response.writeHead(stream.code, stream.headers)
      }
    }


    get_template(template_name, function(err, template) {
      if(err) return stream.emit('error', err)

      template.render(stream.context, function(err, html) {

        if(err) return stream.emit('error', err)

        if(stream.paused()) {
          return stream.once('drain', close)
        }

        return close()

        function close() {

          // the readable stream polka:
          stream.emit('data', html)
          stream.readable = false

          stream.emit('end')
          stream.closed = true
          stream.emit('close')
        }
      }) 
    })

    return stream
  }
}
