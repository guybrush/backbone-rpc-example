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
        console.log('RENDER')
        var self = this
        $(self.el)
          .addClass('item')
          .css(
            { position:'absolute'
            , top:self.model.attributes.y, left:self.model.attributes.x
            , width:self.model.attributes.w, height:self.model.attributes.h
            , background:self.model.attributes.c
            })          
          .html(jade.render(self.template,{locals:{name:self.model.attributes.name}}))
          .draggable( 
            { drag: function(event, ui) {
                // we DONT drag the dom-element, we just set the attributes
                // it will be rendered upon change-event
                self.model.set({x:ui.position.left,y:ui.position.top})
              }
            , stack: '.items' 
            , opacity: 0.7
            , helper: 'clone'
            })
        return self
      }
    , remove: function() {
        this.model.destroy()
        $(this.el).remove()
      }
    })
  
  App = bb.View.extend(
    { initialize: function() { 
        _.bindAll(this, 'drawItem')
        var self = this
        self.items = items // REST-API
        
        // if there are new items, draw them! else update old items
        self.items.bind('add',self.drawItem)
        self.items.bind('refresh',function(data){
          data.each(function(model){
            // self.drawItem(model)
            if (!self.currItems[model.id]) self.drawItem(model)
            else self.currItems[model.id].model.set(model.attributes)
          })
        })
        
        self.items.fetch({success:function(data){}})
        console.log(self.items)      
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
        $(this.el).find('#rpcDisable').hide()
        $('body').append($(this.el))
        return this
      }
    , currItems: {} // itemId:itemView .. local already drawn items
    , createItem: function() {
        this.items.create(null,{success:function(data){}})
      }
    , drawItem: function(model) {
        this.currItems[model.id] = new Item({model:model})
         $('body').append(this.currItems[model.id].el)
        // var item = new Item({model:model})
        // $('body').append(item.el)
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
    , rpc: function() {return DNode(function(){})} 
    , rpcEnable: function() {
        var self = this
        $(self.el).find('#rpcDisable').show()
        $(self.el).find('#rpcEnable').hide()
        
        
        
        DNode(function(){
          this.trigger = function(data) {
            self.items.get(data.id).set(data,{silent:true}).view.render()
          }
        }).connect(function(remote){
          self.items.bind('change',function(data){
            //var attr = self.items.get(data.id).changedAttributes(data)
            //attr.id = data.id
            remote.trigger(data)
          })
          self.items.each(function(model){
            model.unbind('change')
          })
          console.log('RPC ENABLED')
        })

      }
    , rpcDisable: function() {
        $(this.el).find('#rpcDisable').hide()
        $(this.el).find('#rpcEnable').show()
        self.items.each(function(model){
          model.bind('change', model.view.render())
        })
        console.log('RPC DISABLED')
      }
    })
  
  new App
  
})(this)

