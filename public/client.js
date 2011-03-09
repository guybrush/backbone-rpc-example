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
        //$('body').append($(self.el))          
        return self
      }
    })
  
  views.App = bb.View.extend(
    { template:
      [ 'h1 backbone-server-example         '
      , 'button#createItem create new item  '
      , 'button#deleteItems delete all items'
      , 'button#ajaxSave save via Ajax      '
      , 'button#ajaxFetch fetch via Ajax    '
      , 'button#dnodeEnable enable Dnode    '
      , 'button#dnodeDisable disable Dnode  '
      , 'div#info                           '
      ].join('\n')
    , events: 
      { 'click #createItem'   : 'createItem'
      , 'click #ajaxSave'     : 'ajaxSave'
      , 'click #ajaxFetch'    : 'ajaxFetch'
      , 'click #dnodeEnable'  : 'dnodeEnable'
      , 'click #dnodeDisable' : 'dnodeDisable'
      }
    , render: function() {
        $(this.el).html(jade.render(this.template))
        $(this.el).find('#dnodeDisable').hide()
        $('body').append($(this.el))
        return this
      }
    , initialize: function() { 
        _.bindAll(this, 'drawItem', 'collections')
        var self = this
        console.log('asdf')
        console.log(self.collections.Items)
        self.items = new resources.collections.Items
        //self.items = self.collections.Items
        self.items.bind('all',function(event,data){
          console.log('views.App.items -> '+event+' triggered')
          //console.log(data)
        })
        self.items.bind('add',self.drawItem)
        self.items.bind('refresh',function(data){
          console.log(['items refresh',data])
          //self.items.each(self.drawItem)
          _.each(data.models, function(model){
            //console.log(model)
          })
          self.items.each(function(model){
            //var view = new views.Item({model:model})
            //console.log(model.view)
            //model.view && model.view.render()
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
        $(this.el).find('#dnodeDisable').show()
        $(this.el).find('#dnodeEnable').hide()
      }
    , dnodeDisable: function() {
        $(this.el).find('#dnodeDisable').hide()
        $(this.el).find('#dnodeEnable').show()
      }
    })
  
  new views.App
  
})(window, DNode)

