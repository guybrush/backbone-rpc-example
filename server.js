var express = require('express')
  , stylus = require('stylus')
  , dnode = require('dnode')
  , _ = require('underscore')._
  , bb = require('backbone')
  , cradle = require('cradle')
  , app = express.createServer()
  // , EE = require('events').EventEmitter
  // , ee = new EE
  , models = {}
  , collections = {}
  , stores = {}
  , items

module.exports = app

app.use(express.bodyParser())
app.use(express.methodOverride())
app.use(express.static(__dirname+'/public'))
app.use(stylus.middleware({src:__dirname+'/views',dest:__dirname+'/public'}))
app.use(require('browserify')({mount:'/browserify.js',require :['jade','backbone']}))
app.set('views',__dirname+'/views')

//------------------------------------------------------------------------------
//         BACKBONE MODELS & COLLECTIONS (we use them client- AND server-side)
//------------------------------------------------------------------------------

models.Item = bb.Model.extend(
  { initialize: function() {
      _.bind(this)
      var rndA = Math.floor(Math.random()*10)
        , rndB = Math.floor(Math.random()*10)
        , colors = ['#dd0','#d0d','#0dd','#d00','#0d0','#00d']
      if (!this.get('x')) this.set({x:(rndA*50)})
      if (!this.get('y')) this.set({y:(rndB*50)})
      if (!this.get('w')) this.set({w:(rndA*5)+20})
      if (!this.get('h')) this.set({h:(rndA*5)+20})
      if (!this.get('c')) this.set({c:colors[rndA%colors.length]})
      if (!this.get('name')) this.set({name:Date.now()%1000})
      this.bind('change',function(data){
        console.log(['item changed!',data])
      })
    }
  })
 
collections.Items = bb.Collection.extend(
  { model:models.Item
  , url:'/items'  // this is used by the server-side bb.sync (REST)
  })

app.get('/', function(req, res){
  // here we pass the collections and models to the client
  res.render('layout.jade',{models:models,collections:collections})
})

//------------------------------------------------------------------------------
//                                     STORES
//------------------------------------------------------------------------------
// we use the collections as backend-interface by overwriting all the functions
// which we want to use to operate on the models. this collection will be used
// to provide the REST-API and it will be passed directly to the client through 
// DNode (websockets).
// important: we dont use the collection as we would on the client-side. on the
// client-side each model has a CID (client-id) which is used for models which
// dont have a "true" id yet. here on the server-side there is basically no CID,
// we set the id directly.
// it is essential to understand, that the collection on the server-side does 
// NOT represent any form of "buffer" where models live in a state where they
// have to be saved to finally get into the backend. the models in this 
// server-side collection ARE the models which are already saved in the backend. 
// this also means we dont use Backbone.sync on the server-side at all. on the 
// client-side we use Backbone.sync ONLY for REST - for websockets Backbone.sync 
// does not make sense imho, since Backbone.sync is not designed for PUSH 
// (bidirectional communication).

// /!\ also note (VERY IMPORTANT): YOU (the owner of the server) define the 
// /!\ models, not the client - otherwise the client (any untrusted person) 
// /!\ could pass malicious code inside a model to your server!

stores.Memory = collections.Items.extend(
  { initialize: function() {}
  , create: function(model) {}
  , models: function() {}
  , get: function(id) {}
  , destroy: function() {}
  })

stores.Couchdb = collections.Items.extend(
  { initialize: function() {}
  , create: function() {}
  , models: function() {}
  , get: function() {}
  , destroy: function() {}
  })

stores.Redis = collections.Items.extend(
  { initialize: function() {}
  , create: function() {}
  , models: function() {}
  , get: function() {}
  , destroy: function() {}
  })

items = new stores.Memory

//------------------------------------------------------------------------------
//                                      REST API
//------------------------------------------------------------------------------
          
app.get('/items', function(req, res) {
  res.writeHead(200)
  res.end(JSON.stringify(items.models))
})
app.get('/items/:id', function(req, res) {
  res.writeHead(200)
  res.end(JSON.stringify(items.get(req.params.id)))
})
app.post('/items', function(req, res) {
  res.writeHead(200)
  res.end(JSON.stringify(items.create(req.body)))
})
app.put('/items/:id', function(req, res) {
  res.writeHead(200)
  res.end(JSON.stringify(items.get(req.params.id).set(req.body)))
})
app.del('/items/:id', function(req, res) {
  res.writeHead(200)
  res.end(JSON.stringify(items.destroy(req.params.id)))
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