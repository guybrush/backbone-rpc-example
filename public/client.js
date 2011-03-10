(function(exports, dnode){
    
  var jade = require('jade')
    , bb = require('backbone')
    , _ = require('underscore')._
    , resources = require('./resources')
    , views = {}
  
  views.Item = bb.View.extend(
    { initialize: function() {
        var self = this
        _.bindAll(self, 'render')
        self.model.bind('change', self.render)
        self.model.view = self
        self.render()
        $(self.el).bind('drag',function(){
          var pos = $(this).position()
          self.model.set({x:pos.left,y:pos.top})
        })
      }
    , template: '#{name}'
    , render: function() {
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
        return self
      }
    , remove: function() {
        this.model.destroy()
        $(this.el).remove()
      }
    })
  
  views.App = bb.View.extend(
    { initialize: function() { 
        _.bindAll(this, 'drawItem')
        var self = this
        self.items = new resources.collections.Items
        
        // if there are new items, draw them! else update old items
        self.items.bind('add',self.drawItem)
        self.items.bind('refresh',function(data){
          data.each(function(model){
            if (!self.currItems[model.id]) self.drawItem(model)
            else self.currItems[model.id].model.set(model.attributes)
          })
        })
        
        self.items.fetch({success:function(data){}})
        
        $('body').append(self.render().el)
      }
    , template:
      [ 'h1 backbone-server-example         '
      , 'button#createItem create new item  '
      , 'button#deleteItems delete all items'
      , 'button#ajaxSave save via Ajax      '
      , 'button#ajaxFetch fetch via Ajax    '
      , 'button#rpcEnable enable RPC        '
      , 'button#rpcDisable disable RPC      '
      , 'div#info                           '
      ].join('\n')
    , events: 
      { 'click #createItem'  : 'createItem'
      , 'click #deleteItems' : 'deleteItems'
      , 'click #ajaxSave'    : 'ajaxSave'
      , 'click #ajaxFetch'   : 'ajaxFetch'
      , 'click #rpcEnable'   : 'rpcEnable'
      , 'click #rpcDisable'  : 'rpcDisable'
      }
    , render: function() {
        $(this.el).html(jade.render(this.template))
        $(this.el).find('#dnodeDisable').hide()
        $('body').append($(this.el))
        return this
      }
    , currItems: {} // itemId:itemView .. local already drawn items
    , createItem: function() {
        this.items.create(null,{success:function(data){}})
      }
    , drawItem: function(model) {
        this.currItems[model.id] = new views.Item({model:model})
        $('body').append(this.currItems[model.id].el)
      }
    , deleteItems: function() {
        this.items.each(function(item){item.view.remove()})
      }
    , ajaxSave: function() {
        this.items.each(function(item){item.save()})
      }
    , ajaxFetch: function() {
        this.items.fetch({success:function(data){}})
      }
    , dnodeEnable: function() {
        $(this.el).find('#rpcDisable').show()
        $(this.el).find('#rpcEnable').hide()
        // #TODO
      }
    , dnodeDisable: function() {
        $(this.el).find('#rpcDisable').hide()
        $(this.el).find('#rpcEnable').show()
        // #TODO
      }
    })
  
  new views.App
  
})(window, DNode)

