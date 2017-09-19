// getting info from the real dom: oncreate-lifecycle method
// http://jsbin.com/hugiciyoco/edit?js,console,output
import m from 'mithril'
import Stream from "mithril/stream"

m.stream = Stream

let OnCreateInline = {
    oninit(vnode){
        vnode.state.position = m.stream( { 
            clientX : 0, 
            clientY : 0 
        })
    },
    
    view : vnode =>
        m( 'div#go', {
            oncreate: ((vnode) =>
                       () => // needs wrapping, otherwise dom undefined!
                       vnode.dom.onmousemove = e => {
                           console.log("$$$"+JSON.stringify(vnode, null,2))
                           vnode.state.position( e )
                           
                           m.redraw()
                       })(vnode)
            , style: {width: "300px", height: "300px", "background-color": "red"}
        }, 
           
           'Mouse is currently at: ',
           
           vnode.state.position().clientX,
           
           ' ',
           
           vnode.state.position().clientY
         )
}

let OnCreateWithComponentLifeCycle = {
    oninit(vnode){
        vnode.state.position = m.stream( { 
            clientX : 0, 
            clientY : 0 
        })
    },
    oncreate: (vnode) =>
               vnode.dom.onmousemove = e => {
                   console.log("$$$"+JSON.stringify(vnode, null,2))
                   vnode.state.position( e )
                   
                   m.redraw()
               }
    ,
    view : vnode =>
        m( 'div#go', {
            style: {width: "300px", height: "300px", "background-color": "red"}
        }, 
           
           'Mouse is currently at: ',
           
           vnode.state.position().clientX,
           
           ' ',
           
           vnode.state.position().clientY
         )
}

m.mount( document.body, OnCreateWithComponentLifeCycle)
