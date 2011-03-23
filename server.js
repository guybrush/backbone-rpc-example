// console.log = function(obj) {}

var resources  = require('./resources')
  , dnode      = require('dnode')
  , stylus     = require('stylus')
  , browserify = require('browserify')
  , _          = require('underscore')._
  , bb         = require('backbone')
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
  , filter  : require('jsmin').jsmin 
  }))
app.set('views',__dirname+'/views')
app.get('/', function(req, res){res.render('layout.jade')})

//------------------------------------------------------------------------------
//                                     STORES
//------------------------------------------------------------------------------

function MemoryStore() {
  this.data = {}
}
MemoryStore.prototype.create = function(model) {
  if (!model.id) 
    model.id = model.attributes.id = Date.now() // sloppy..
  console.log(['---- saving',model])
  this.data[model.id] = model
  return model
}
MemoryStore.prototype.set = function(model) {
  console.log(['---- setting',model])
  this.data[model.id] = model
  return model
}
MemoryStore.prototype.get = function(model) {
  console.log(['---- getting',model])
  if (model && model.id)
    return this.data[model.id]
  else
    return _.values(this.data)
}
MemoryStore.prototype.destroy = function(model) {
  console.log(['---- destroying',model])
  delete this.data[model.id]
  return model
}

var store = new MemoryStore

bb.sync = function(method, model, options) {
  //console.log(['SERVERSIDE BB.SYNC',method,model,options])
  switch(method) {
    case "read":   resp = store.get(model);     break
    case "create": resp = store.create(model);  break
    case "update": resp = store.set(model);     break
    case "delete": resp = store.destroy(model); break
  }
  if (resp) {
    // options.success(resp) // WTF?! --> error: has no method 'success'
    options(resp)
  } 
  else {
    options.error("Record not found")
  }
}

serverSideCollection = new resources.collections.Items

//------------------------------------------------------------------------------
//                                      REST API
//------------------------------------------------------------------------------

app.get('/items', function(req, res) {
  console.log('---- GET /items')
  serverSideCollection.fetch({success:function(data){
    res.writeHead(200)
    res.end(JSON.stringify(data))
  }, error:function(err){
    res.writeHead(204)
    res.end(err)
  }})
})
app.get('/items/:id', function(req, res) {
  console.log('---- GET /items/:id')
  var model = serverSideCollection.get(req.params.id)
  if (model) {
    res.writeHead(200)
    res.end(JSON.stringify(model))
  } else {
    res.writeHead(404)
    res.end('Record not found')
  }
})
app.post('/items', function(req, res) {
  console.log('---- POST /items')
  serverSideCollection.create(req.body,{success:function(data){
    res.writeHead(200)
    res.end(JSON.stringify(data))  
  },error:function(err){
    res.writeHead(404)
    res.end(err)}
  })
})
app.put('/items/:id', function(req, res) {
  console.log('---- PUT /items/:id')
  req.body.id = req.params.id
  serverSideCollection.get(req.params.id).set(req.body).save({success:function(data){
    res.writeHead(200)
    res.end(JSON.stringify(data))
  },error:function(err){
    res.writeHead(404)
    res.end(err)}
  })
})
app.del('/items/:id', function(req, res) {
  console.log('---- DEL /items/:id')
  res.end(JSON.stringify(serverSideCollection.get(req.params.id).destroy({success:function(data){
    res.writeHead(200)
    res.end(JSON.stringify(data))  
  },error:function(err){
    res.writeHead(404)
    res.end(err)
  }})))
})

//------------------------------------------------------------------------------
//                                      RPC API
//------------------------------------------------------------------------------

var clients = {}

function RPC(client, con) {
  con.on('ready', function() {
    clients[con.id] = client    
    serverSideCollection.bind('change', function(data){
      var changed = serverSideCollection.get(data.id).changedAttributes(data.attributes)
      changed.id = data.id
      client.change(changed)
    })
    serverSideCollection.bind('remove', function(data){
      client.remove(data.attributes.id)
    })
    serverSideCollection.bind('add', function(data){
      client.add(data.attributes)
    })
  })
  con.on('end', function() {
    delete clients[con.id]
  })
  this.change = function(data) {
    serverSideCollection.get(data.id).set(data)
  }
}

app.listen(process.env.PORT || 8001)

dnode(RPC).listen(app)



/*******************************************************************************

fires sync:

    bb.Model.fetch() -> read
    bb.Model.save() -> create || update
    bb.Model.destroy() -> delete
    bb.Model.create() -> bb.Model.save() -> create || update
    bb.Collection.fetch() -> read
    
*******************************************************************************/
