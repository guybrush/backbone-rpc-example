var express = require('express')
  , stylus = require('stylus')
  , dnode = require('dnode')
  , _ = require('underscore')._
  , bb = require('backbone')
  , app = express.createServer()
  , EE = require('events').EventEmitter
  , ee = new EE
  , models = {}
  , collections = {}
  , views = {}
  , storages = {}
  , items = {}

module.exports = app

// BAAAAM memory-storage for free ^^
models.Memory = bb.Model.extend({})
collections.Memory = bb.Collection.extend({model:models.Memory})

models.Couchdb = bb.Model.extend({})

bb.sync = function(method, model, options) {
  var store = new model.storage || model.collection.storage
  switch (method) {
    case "read":   resp = model.id ? store.get(model.id) : store.get(); break;
    case "create": resp = store.create(model); break;
    case "update": resp = store.set(model); break;
    case "delete": resp = store.destroy(model); break;
  }
}

app.use(express.bodyParser())
app.use(express.methodOverride())
//app.use(express.logger())
app.use(express.static(__dirname + '/public'))
app.use(stylus.middleware(
  { src: __dirname + '/views'
  , dest: __dirname + '/public'
  }))
app.set('views', __dirname + '/views')
app.use(app.router)

app.get('/', function(req, res){res.render('layout.jade')})
app.get('/items', function(req, res){
  var result = []
  for (var i in items)
    result.push(items[i])
  res.writeHead(200)
  res.end(JSON.stringify(result))
})
app.get('/items/:id', function(req, res){
  res.writeHead(200)
  var id = req.params.id
  res.end(JSON.stringify(items[id]))
})
app.post('/items', function(req, res){
  console.log(req.body)
  var id = Date.now()
  items[id] = req.body
  items[id].id = id
  res.writeHead(200)
  res.end(JSON.stringify(req.body))
})
app.put('/items/:id', function(req, res){
  console.log(req.body)
  var id = req.params.id
  items[id] = req.body
  items[id].id = id
  res.writeHead(200)
  res.end(JSON.stringify(req.body))
})


dnode(Scene).listen(app)

function Scene(client, con) {
  con.on('ready', function() {
    console.log('client ready')
  })
  con.on('end', function() {
    console.log('client end')
  })
}

function Item(opt) {

}