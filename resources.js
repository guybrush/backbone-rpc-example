var bb = require('backbone')
  , _ = require('underscore')._
  , resources = module.exports = module.exports.resources = {}

resources.models = {}
resources.collections = {}
  
resources.models.Item = bb.Model.extend(
  { initialize: function() {
      _.bind(this)
      var rndA = Math.floor(Math.random()*10)
        , rndB = Math.floor(Math.random()*10)
        , colors = ['#dd0','#d0d','#0dd','#d00','#0d0','#00d']
      if (!this.get('x')) this.set({x:(rndA*40)})
      if (!this.get('y')) this.set({y:(rndB*40)+140})
      if (!this.get('w')) this.set({w:(rndA*5)+20})
      if (!this.get('h')) this.set({h:(rndA*5)+20})
      if (!this.get('c')) this.set({c:colors[rndA%colors.length]})
      if (!this.get('name')) this.set({name:Date.now()%1000})
    }
  })
 
resources.collections.Items = bb.Collection.extend(
  { model:resources.models.Item
  , url:'/items'  // this is used by the client-side bb.sync only (REST)
  })