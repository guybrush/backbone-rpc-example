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
