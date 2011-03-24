(function(exports){
    
  var jade = require('jade')
    , bb = require('backbone')
    , _ = require('underscore')._
    , resources = require('./resources')
    , items = new resources.collections.Items
    , Item, App 
    , rpcEnabled = false
           
  Item = bb.View.extend(
    { initialize: function() {
        var self = this
        _.bindAll(self, 'render')
        self.model.bind('change', self.render)
        self.model.view = self
        self.render()
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
          .html(jade.render(self.template,{locals:self.model.attributes}))
          .draggable( 
            { drag: function(event, ui) {
                // we DONT drag the dom-element, we just set the attributes
                // it will be rendered upon change-event
                if (!rpcEnabled) {
                  self.model.set({x:ui.position.left,y:ui.position.top})
                } else {
                  self.model.trigger('rpc:change',
                    {id:self.model.id,x:ui.position.left,y:ui.position.top})
                }
              }
            , stack: '.items' 
            , opacity: 0.5
            , helper: 'clone'
            })
        return self
      }
    })
  
  App = bb.View.extend(
    { initialize: function() { 
        _.bindAll(this, 'drawItem', 'drawnItems')
        var self = this
        self.items = items
        self.items.bind('add',self.drawItem)
        self.items.bind('remove',self.undrawItem)
        self.items.bind('refresh',function(data){
          data.each(function(model){
            // if there are new items, draw them! otherwise update old items
            if (self.drawnItems[model.id]) {
              self.drawnItems[model.id].model.set(model.attributes)
            } else {
              self.drawItem(model)
            }
          })
        })
        self.items.fetch({success:function(data){}}) 
        $('body').append(self.render().el)
      }
    , template:
      [ 'h1 backbone-rpc-example            '
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
        $(this.el).find('#rpcDisable').hide()
        $('body').append($(this.el))
        return this
      }    
    , createItem: function() {
        if (!rpcEnabled)
          this.items.create(null,{success:function(data){}})
        else
          this.items.trigger('rpc:add')
      }
    , drawnItems: {}
    , drawItem: function(model) {
        //console.log('DRAW ITEM')
        var item = new Item({model:model})
        this.drawnItems[model.id] = item
        //this.items.get(model.id).view = new Item({model:model})
        $('body').append(item.el)
      }
    , undrawItem: function(model) {
        $(model.view.el).remove()
      }
    , deleteItems: function() {
        this.items.each(function(item){item.destroy()})
      }
    , ajaxSave: function() {
        this.items.each(function(item){item.save()})
      }
    , ajaxFetch: function() {
        this.items.fetch({success:function(data){}})
      }
    , rpc: function() {return DNode(function(){})} 
    , rpcEnable: function() {
        rpcEnabled = true
        var self = this
        $(self.el).find('#rpcDisable').show()
        $(self.el).find('#rpcEnable').hide()
        DNode(function(){
          this.change = function(data) {
            self.items.get(data.id).set(data)
          }
          this.remove = function(data) {
            self.undrawItem(self.items.get(data))
          }
          this.add = function(data) {
            console.log([data,self.items,self.items.get(data.id)])
            if (!self.items.get(data.id)) self.items.add(data)
            console.log(self.items)
          }
        }).connect(function(remote){
          self.items.bind('rpc:change',function(data){
            var changed = self.items.get(data.id).changedAttributes(data)
            changed.id = data.id
            remote.change(changed)
          })
          self.items.bind('rpc:add',function(data){
            remote.add()
          })
          self.items.bind('rpc:remove',function(data){})
        })
      }
    , rpcDisable: function() {
        rpcEnabled = false
        $(this.el).find('#rpcDisable').hide()
        $(this.el).find('#rpcEnable').show()
      }
    })
  
  new App
  
})(this)

