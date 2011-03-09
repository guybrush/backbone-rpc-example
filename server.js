var resources  = require('./resources')
  , dnode      = require('dnode')
  , stylus     = require('stylus')
  , browserify = require('browserify')
  , _          = require('underscore')._
  , bb         = require('backbone')
  , cradle     = require('cradle')
  , express    = require('express')
  , app        = express.createServer()

module.exports = app

app.use(express.bodyParser())
app.use(express.methodOverride())
app.use(express.static(__dirname+'/public'))
app.use(stylus.middleware(
  { src  : __dirname+'/views'
  , dest : __dirname+'/public' }))
app.use(browserify(
  { mount   : '/browserify.js'
  , base    : __dirname
  , require : ['jade','backbone'] 
  , filter  : require('jsmin').jsmin }))
app.set('views',__dirname+'/views')
app.get('/', function(req, res){res.render('layout.jade')})

//------------------------------------------------------------------------------
//                                     STORES
//------------------------------------------------------------------------------

function MemoryStore() {
  this.data = {}
}
MemoryStore.prototype.create = function(model) {
  if (!model.id) model.id = Date.now()
  this.data[model.id] = model
  return model
}
MemoryStore.prototype.set = function(model) {
  this.data[model.id] = model
  return model
}
MemoryStore.prototype.get = function(model) {
  if (model && model.id)
    return this.data[model.id]
  else
    return _.values(this.data)
}
MemoryStore.prototype.destroy = function(model) {
  delete this.data[model.id]
  return model
}

var store = new MemoryStore

bb.sync = function(method, model, options) {
  switch(method) {
    case "read":   resp = store.get(model);     break
    case "create": resp = store.create(model);  break
    case "update": resp = store.set(model);     break
    case "delete": resp = store.destroy(model); break
  }
  if (resp) {
    options.success(resp)
  } 
  else {
    options.error("Record not found")
  }
}

// stores.Memory = resources.collections.Items.extend(
//   { initialize: function() {
//       this.models = {}
//     }
//   , create: function(model) {
//       var id = Date.now()
//       model.id = id
//       this.models[id] = model
//       return model
//     }
//   , get: function(id) {
//       return models[id]
//     }
//   , destroy: function(id) {
//       if (this.models[id]) 
//         delete this.models[id]
//     }
//   })
// 
// stores.Couchdb = resources.collections.Items.extend(
//   { initialize: function() {}
//   , create: function() {}
//   , models: function() {}
//   , get: function() {}
//   , destroy: function() {}
//   })
// 
// stores.Redis = resources.collections.Items.extend(
//   { initialize: function() {}
//   , create: function() {}
//   , models: function() {}
//   , get: function() {}
//   , destroy: function() {}
//   })
// 
// store = new stores.Memory

//------------------------------------------------------------------------------
//                                      REST API
//------------------------------------------------------------------------------

app.get('/items', function(req, res) {
  res.writeHead(200)
  res.end(JSON.stringify(store.models))
})
app.get('/items/:id', function(req, res) {
  res.writeHead(200)
  res.end(JSON.stringify(store.get(req.params.id)))
})
app.post('/items', function(req, res) {
  res.writeHead(200)
  res.end(JSON.stringify(store.create(req.body)))
})
app.put('/items/:id', function(req, res) {
  res.writeHead(200)
  res.end(JSON.stringify(store.get(req.params.id).set(req.body)))
})
app.del('/items/:id', function(req, res) {
  res.writeHead(200)
  res.end(JSON.stringify(store.destroy(req.params.id)))
})

// app.get('/items', function(req, res){
//   var result = []
//   for (var i in items)
//     result.push(items[i])
//   res.writeHead(200)
//   res.end(JSON.stringify(result))
// })
// app.get('/items/:id', function(req, res){  // bb.collection -> get
//   res.writeHead(200)
//   var id = req.params.id
//   res.end(JSON.stringify(items[id]))
// })
// app.post('/items', function(req, res){     // bb.collection -> create
//   console.log(req.body)
//   var id = Date.now()
//   items[id] = req.body
//   items[id].id = id
//   res.writeHead(200)
//   res.end(JSON.stringify(req.body))
// })
// app.put('/items/:id', function(req, res){   // bb.collection -> add
//   console.log(req.body)
//   var id = req.params.id
//   items[id] = req.body
//   items[id].id = id
//   res.writeHead(200)
//   res.end(JSON.stringify(req.body))
// })
// app.del('/items/:id', function() {})

//------------------------------------------------------------------------------
//                                      RPC API (server-side backbone)
//------------------------------------------------------------------------------

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


/*******************************************************************************

fires sync:

    bb.Model.fetch() -> read
    bb.Model.save() -> create || update
    bb.Model.destroy() -> delete
    bb.Model.create() -> bb.Model.save() -> create || update
    bb.Collection.fetch() -> read

*******************************************************************************/