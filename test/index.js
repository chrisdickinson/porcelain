var assert = require('assert')
  , http = require('http')
  , plate = require('plate')

var porcelain = require('../index')
  , out = function(x) { return process.stdout.write(x) }

var tests = [
    test_default_dir
  , test_custom_dir
  , test_multiple_dir
  , test_stream
  , test_stream_http
]

run()

function run() {
  if(!tests.length)
    return process.stdout.write('\n')

  var test = tests.shift()
    , now = Date.now()

  setup()

  out(test.name+' - ')
  test(function() {
    out(''+(Date.now() - now)+'ms\n')
    run()
  })
}

function setup() {
  // reset the plugin registry.
  plate.Template.Meta._classes.plugin.registry = {}
  plate.Template.Meta._cache.plugin = null
}

// integration tests.

function test_default_dir(ready) {
  var loader = porcelain()

  loader('test_default_dir.html', function(err, data) {
    assert.ok(!err)
    assert.equal(data.raw, 'hello world\n')
    ready()
  })
}

function test_custom_dir(ready) {
  var loader = porcelain('custom_templates')

  loader('test_custom_dir.html', function(err, data) {
    assert.ok(!err)
    assert.equal(data.raw, 'hello busey\n')
    ready()
  })
}

function test_multiple_dir(ready) {
  var loader = porcelain('custom_templates', 'templates')

  loader('both.html', got_both)

  function got_both(err, template) {
    assert.ok(!err)
    assert.equal(template.raw, 'custom_templates\n')

    loader('test_default_dir.html', got_default)
  }

  function got_default(err, template) {
    assert.ok(!err)
    assert.equal(template.raw, 'hello world\n')

    loader('test_custom_dir.html', got_custom)
  }

  function got_custom(err, template) {
    assert.ok(!err)
    assert.equal(template.raw, 'hello busey\n')

    ready()
  }
}

function test_stream(ready) {
  var loader = porcelain()
    , didData = false
    , didEnd = false
    , didClose = false

  var stream = loader.createReadStream('test_stream.html')

  stream.context.object = 'world'

  stream
    .on('data', function(data) {
      assert.ok(!didEnd)
      assert.ok(!didClose)
      didData = true

      assert.ok(stream.readable)
      assert.ok(!stream.closed)

      assert.equal(data, 'hello world\n') 
    })
    .on('end', function() {
      assert.ok(!didClose)
      assert.ok(didData)
      assert.ok(!stream.readable)
      assert.ok(!stream.closed)
      didEnd = true
    })
    .on('close', function() {
      assert.ok(didData)
      assert.ok(didEnd)
      didClose = true
      assert.ok(!stream.readable)
      assert.ok(stream.closed)

      didData && didEnd && didClose && ready()
    })  
}

function test_stream_http(ready) {
  var server = http.createServer(on_request_response)
    , loader = porcelain()
    , request

  server.listen(9995, server_online)

  function on_request_response(req, resp) {
    var stream = loader.createReadStream('test_stream.html')
      , data = []

    stream.pause() 
    stream.pipe(resp)

    req.on('data', data.push.bind(data))
    req.on('end', function() {
      stream.context.object = data.join('')
      stream.resume()
    })
  }

  function server_online() {
    request = http.request({port:9995, method:'POST'}, get_response)

    var expect = 'things and stuff '+(Math.random() * 0xFF & 0xFF)
    request.end(expect)

    function get_response(res) {
      var data = []

      res.on('data', data.push.bind(data))
      res.on('end', function() {
        server.close()

        assert.equal('hello '+expect+'\n', data.join(''))
        ready()
      })
    }
  }
}
