# backbone.js on the server!

this is an approach to use backbone.js on the server with node.js.

## why?

the benefit of using backbone.js on the server is that we can use the same
interface (backbone.js-collections) to our data (backbone.js-models) on the 
server-side which we are already using on the client-side. this is very handy 
when we want to provide a RPC-interface.

## how?

        dirty        server-side             expressjs
        couchdb     backbone-collection         dnode      browser
           ^                  ^                   ^           ^
        ___|___  _____________|_____________  ____|_____   ___|___
                   
    1a) backend ------> server-memory ------> REST-API ---> client
    
    1b) backend ------> server-memory ------> RPC-API ----> client
    
    2a) backend ----------------------------> REST-API ---> client    
    
    2b) backend ----------------------------> RPC-API ----> client
    



-----


we use backbone.js-collections as backend-interface by overwriting all the 
functions which we want to use to operate on the models. this collection will 
be used to provide a REST-interface and it will be passed directly to the 
client through DNode (websockets) to provide a RPC-interface.

we dont use the collection as we would on the client-side. on the client-side 
each model has a CID (client-id) which is used for models which dont have a 
"true" id yet. on the server-side there is basically no CID, we set the id 
directly.

it is essential to understand, that the collection on the server-side does 
NOT represent any form of "buffer" where models live in a state where they
have to be saved first to finally get into the backend. the models in this 
server-side collection ARE the models which are already saved in the backend. 
this also means we dont use Backbone.sync on the server-side at all. on the 
client-side we use Backbone.sync ONLY for REST - Backbone.sync is not designed
for PUSH (bidirectional communication).

also note (VERY IMPORTANT): YOU (the owner of the server) define the 
models, not the client (any untrusted person) - otherwise the client  
could pass malicious code inside a model to your server!