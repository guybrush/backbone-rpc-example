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
  if (!model.id) model.id = Date.now() // sloppy..
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

//------------------------------------------------------------------------------
//                                      REST API
//------------------------------------------------------------------------------

app.get('/items', function(req, res) {
  res.writeHead(200)
  res.end(JSON.stringify(store.get()))
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
  req.body.id = req.params.id
  res.writeHead(200)
  res.end(JSON.stringify(store.set(req.body)))
})
app.del('/items/:id', function(req, res) {
  res.writeHead(200)
  res.end(JSON.stringify(store.destroy({id:req.params.id})))
})

//------------------------------------------------------------------------------
//                                      RPC API (server-side backbone)
//------------------------------------------------------------------------------

dnode(resources.collections.Items).listen(app)






/*******************************************************************************

fires sync:

    bb.Model.fetch() -> read
    bb.Model.save() -> create || update
    bb.Model.destroy() -> delete
    bb.Model.create() -> bb.Model.save() -> create || update
    bb.Collection.fetch() -> read

//----------------------------
    
this is for later:

stores.Memory = resources.collections.Items.extend(
  { initialize: function() {
      this.models = {}
    }
  , create: function(model) {
      var id = Date.now()
      model.id = id
      this.models[id] = model
      return model
    }
  , get: function(id) {
      return models[id]
    }
  , destroy: function(id) {
      if (this.models[id]) 
        delete this.models[id]
    }
  })

stores.Couchdb = resources.collections.Items.extend(
  { initialize: function() {}
  , create: function() {}
  , models: function() {}
  , get: function() {}
  , destroy: function() {}
  })

stores.Redis = resources.collections.Items.extend(
  { initialize: function() {}
  , create: function() {}
  , models: function() {}
  , get: function() {}
  , destroy: function() {}
  })

store = new stores.Memory

//---------------------------------

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
    
*******************************************************************************/
