(function(exports, bb, jade, dnode){
    
  module = {}
  module.exports = window
  
  var models = exports.models = {}
    , collections = exports.collections = {}
    , views = exports.views = {}
  
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
    , url:'/items'
    })

//----------------------------------------------------------
  
  views.Item = bb.View.extend(
    { initialize: function() {
        //console.log('views.Item -> init')
        var self=this
        _.bindAll(this, 'render')
        this.model.bind('change', this.render)
        this.model.view = this
        this.render()
        $(this.el).bind('drag',function(){
          var pos = $(this).position()
          self.model.set({x:pos.left,y:pos.top})
        })
      }
    , template: '#{name}'
    , render: function() {
        console.log('itemrender '+this.model.attributes.name)
        var self = this
        $(self.el)
          .addClass('item')
          .css(
            { position:'absolute'
            , top:self.model.attributes.y, left:self.model.attributes.x
            , width:self.model.attributes.w, height:self.model.attributes.h
            , background:self.model.attributes.c
            })
          .draggable()          
          .html(jade.render(self.template,{locals:{name:self.model.attributes.name}}))
        $('body').append($(self.el))          
        return self
      }
    })
  
  views.App = bb.View.extend(
    { template:
      [ 'h1 dnode test                    '
      , 'button#createItem create new item'
      , 'button#ajaxSave save via Ajax    '
      , 'button#ajaxFetch fetch via Ajax  '
      , 'button#dnodeEnable enable Dnode  '
      , 'button#dnodeDisable disable Dnode'
      , 'div#info                         '
      ].join('\n')
    , events: 
      { 'click #createItem'   : 'createItem'
      , 'click #ajaxSave'     : 'ajaxSave'
      , 'click #ajaxFetch'    : 'ajaxFetch'
      , 'click #dnodeEnable'  : 'dnodeEnable'
      , 'click #dnodeDisable' : 'dnodeDisable'
      }
    , render: function() {
        console.log('views.App -> render')
        $(this.el).html(jade.render(this.template))
        $(this.el).find('#dnodeDisable').hide()
        $('body').append($(this.el))
        return this
      }
    , initialize: function() { 
        console.log('views.App -> init')
        _.bindAll(this, 'drawItem')
        var self = this
        self.items = new collections.Items
        self.items.bind('all',function(event,data){
          //console.log('views.App.items -> '+event+' triggered')
          //console.log(data)
        })
        self.items.bind('add',self.drawItem)
        self.items.bind('refresh',function(data){
          console.log(['items refresh',data])
          //self.items.each(self.drawItem)
          self.items.each(function(model){
            //var view = new views.Item({model:model})
            console.log(model.view)
            model.view && model.view.render()
          })
        })
        self.items.fetch({success:function(data){
          data.each(self.drawItem)
        }})
        
        $('body').append(self.render().el)
      }
    , createItem: function() {
        this.items.create(null,{success:function(data){
          console.log(['views.App -> createItem : success',data])
        }})
      }
    , drawItem: function(model) {
        var view = new views.Item({model:model})
        $('body').append(view.el)
      }
    , ajaxSave: function() {
        this.items.each(function(item){item.save()})
      }
    , ajaxFetch: function() {
        this.items.fetch({success:function(data){
          console.log(['fetch success',data])
        }})
      }
    , dnodeEnable: function() {
        this.el.find('#dnodeDisable').show()
        this.el.find('#dnodeEnable').hide()
      }
    , dnodeDisable: function() {
        this.el.find('#dnodeDisable').hide()
        this.el.find('#dnodeEnable').show()
      }
    })
  
  var items = new collections.Items
  
  //items.add(new models.Item)
  //var item = items.getByCid('c0')
  //console.log('item url von collection:  '+item.url())
  //console.log(items)
  //item.save()
  
  exports.app = new views.App
  
})(window, Backbone, jade, DNode)

